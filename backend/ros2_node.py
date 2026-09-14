"""
ROS 2 Native Node for Fruit Fly Connectome Controller on PX4 Autopilot.

Interfaces with headless px4io/px4-sitl-ros2 via micro-XRCE-DDS using ROS 2 uORB topics:
- Subscribes: /camera/image_raw (sensor_msgs/Image), /fmu/out/vehicle_odometry, /fmu/out/sensor_combined
- Publishes: /fmu/in/offboard_control_mode, /fmu/in/trajectory_setpoint, /fmu/in/vehicle_command
"""

import asyncio
from pathlib import Path
import threading
import time
from typing import Any, Dict, Optional, Tuple
import numpy as np

try:
    import rclpy
    from rclpy.node import Node
    from rclpy.qos import QoSProfile, ReliabilityPolicy, HistoryPolicy, DurabilityPolicy
    RCLPY_AVAILABLE = True
except ImportError:
    RCLPY_AVAILABLE = False
    Node = object

try:
    import px4_msgs.msg as px4_msgs
    PX4_MSGS_AVAILABLE = True
except ImportError:
    px4_msgs = None
    PX4_MSGS_AVAILABLE = False

try:
    from sensor_msgs.msg import Image
except ImportError:
    Image = None

try:
    from .brain import FruitFlyBrainAgent
    from .server import BridgeServer
except ImportError:
    from brain import FruitFlyBrainAgent
    from server import BridgeServer


# Google 3D Area Explorer Config: Manhattan, NYC (Chelsea / High Line / Google NYC Campus)
NYC_ORIGIN_LAT = 40.74244
NYC_ORIGIN_LNG = -74.006144

# 1000m Search Radius Real-World Urban Landmarks, Highrises & POIs
NYC_LANDMARKS = [
    {
        "id": 1,
        "name": "Chelsea Market & Food Hall",
        "lat": 40.74244,
        "lng": -74.006144,
        "x": 0.0,
        "y": 0.0,
        "radius": 35.0,
        "height": 38.0,
        "floors": 9,
        "category": "restaurant",
        "desc": "Famous concourse & iconic culinary hall"
    },
    {
        "id": 2,
        "name": "Google New York HQ (111 8th Ave)",
        "lat": 40.7408,
        "lng": -74.0021,
        "x": -182.0,
        "y": 340.0,
        "radius": 65.0,
        "height": 88.0,
        "floors": 16,
        "category": "office",
        "desc": "Google Manhattan engineering campus (2.9M sq ft)"
    },
    {
        "id": 3,
        "name": "The Standard High Line & Le Bain",
        "lat": 40.7409,
        "lng": -74.0079,
        "x": -171.0,
        "y": -148.0,
        "radius": 26.0,
        "height": 70.0,
        "floors": 18,
        "category": "bar",
        "desc": "Iconic cantilevered hotel & rooftop club"
    },
    {
        "id": 4,
        "name": "IAC Building (Frank Gehry)",
        "lat": 40.7455,
        "lng": -74.0070,
        "x": 340.0,
        "y": -72.0,
        "radius": 28.0,
        "height": 45.0,
        "floors": 10,
        "category": "architecture",
        "desc": "Sculptural white glass sailboat architecture"
    },
    {
        "id": 5,
        "name": "Lantern House (Heatherwick Studio)",
        "lat": 40.7448,
        "lng": -74.0055,
        "x": 262.0,
        "y": 54.0,
        "radius": 24.0,
        "height": 75.0,
        "floors": 22,
        "category": "residential",
        "desc": "Bespoke bay-window luxury tower on High Line"
    },
    {
        "id": 6,
        "name": "Little Island & Pier 54 Park",
        "lat": 40.7420,
        "lng": -74.0098,
        "x": -49.0,
        "y": -308.0,
        "radius": 42.0,
        "height": 22.0,
        "floors": 3,
        "category": "park",
        "desc": "Tulip-shaped floating public park over Hudson River"
    },
    {
        "id": 7,
        "name": "Whole Foods Market Chelsea",
        "lat": 40.7442,
        "lng": -73.9965,
        "x": 196.0,
        "y": 812.0,
        "radius": 28.0,
        "height": 42.0,
        "floors": 12,
        "category": "supermarket",
        "desc": "Flagship 7th Avenue organic market & grocer"
    },
    {
        "id": 8,
        "name": "30 Hudson Yards (The Edge)",
        "lat": 40.7500,
        "lng": -74.0030,
        "x": 840.0,
        "y": 265.0,
        "radius": 45.0,
        "height": 387.0,
        "floors": 103,
        "category": "skyscraper",
        "desc": "Supertall skyscraper with triangular skydeck"
    }
]


class FruitFlyPX4ROS2Node(Node if RCLPY_AVAILABLE else object):
    """
    ROS 2 Node executing Fruit Fly Connectome flight control loop for PX4.
    """
    def __init__(self, agent: Optional[FruitFlyBrainAgent] = None, enable_web_server: bool = True):
        self.agent = agent or FruitFlyBrainAgent(num_ommatidia=160, num_kc=800, seed=42)
        # Load trained synaptic weights if available
        trained_weights_path = Path(__file__).resolve().parent / "trained_brain.npz"
        if trained_weights_path.exists():
            self.agent.load_weights(str(trained_weights_path))

        self.enable_web_server = enable_web_server
        self.server: Optional[BridgeServer] = None
        self.loop = None
        
        # Telemetry state
        self.latest_frame: Optional[np.ndarray] = None
        self.position_ned = np.array([0.0, 0.0, -1.5], dtype=np.float32)
        self.velocity_ned = np.zeros(3, dtype=np.float32)
        self.gyro_rad_s = (0.0, 0.0, 0.0)
        self.accel_m_s2 = (0.0, 0.0, 9.81)
        
        self.offboard_setpoint_counter = 0
        self.is_armed = True
        self.is_offboard = True
        self.learning_enabled = True
        self.sugar_intensity = 1.0
        self.target_position = np.array([5.0, 0.0, 1.5], dtype=np.float32)
        self.current_yaw_rad = 0.0
        self.current_roll_rad = 0.0
        self.current_pitch_rad = 0.0
        # Initialize with Real-World Manhattan Chelsea 3D Obstacles & POIs
        self.obstacles = [dict(obs) for obs in NYC_LANDMARKS]
        
        # Start Web Bridge Server in background thread
        if self.enable_web_server:
            self.server = BridgeServer(host="0.0.0.0", port=8080)
            self.server.command_callback = self.handle_web_command
            t = threading.Thread(target=self._run_server_thread, daemon=True)
            t.start()

        if not RCLPY_AVAILABLE:
            print("[DrosophilaDrone ROS 2] Running in standalone dashboard mode (rclpy not detected on host).")
            return
            
        super().__init__("fruitfly_px4_controller")
        
        # QoS Profile for PX4 uORB topics
        self.qos_profile = QoSProfile(
            reliability=ReliabilityPolicy.BEST_EFFORT,
            durability=DurabilityPolicy.TRANSIENT_LOCAL,
            history=HistoryPolicy.KEEP_LAST,
            depth=1
        )
        
        # 1. Publishers
        if hasattr(px4_msgs, "OffboardControlMode"):
            self.offboard_mode_pub = self.create_publisher(
                px4_msgs.OffboardControlMode,
                "/fmu/in/offboard_control_mode",
                self.qos_profile
            )
        if hasattr(px4_msgs, "TrajectorySetpoint"):
            self.trajectory_setpoint_pub = self.create_publisher(
                px4_msgs.TrajectorySetpoint,
                "/fmu/in/trajectory_setpoint",
                self.qos_profile
            )
        if hasattr(px4_msgs, "VehicleCommand"):
            self.vehicle_command_pub = self.create_publisher(
                px4_msgs.VehicleCommand,
                "/fmu/in/vehicle_command",
                self.qos_profile
            )
        
        # 2. Subscribers (support multiple PX4 schema generations)
        if hasattr(px4_msgs, "VehicleLocalPosition"):
            self.local_pos_sub = self.create_subscription(
                px4_msgs.VehicleLocalPosition,
                "/fmu/out/vehicle_local_position",
                self.local_position_callback,
                self.qos_profile
            )
        if hasattr(px4_msgs, "VehicleStatus"):
            self.status_sub = self.create_subscription(
                px4_msgs.VehicleStatus,
                "/fmu/out/vehicle_status",
                self.vehicle_status_callback,
                self.qos_profile
            )
        if hasattr(px4_msgs, "VehicleOdometry"):
            self.odometry_sub = self.create_subscription(
                px4_msgs.VehicleOdometry,
                "/fmu/out/vehicle_odometry",
                self.odometry_callback,
                self.qos_profile
            )
        if hasattr(px4_msgs, "SensorCombined"):
            self.sensor_sub = self.create_subscription(
                px4_msgs.SensorCombined,
                "/fmu/out/sensor_combined",
                self.sensor_combined_callback,
                self.qos_profile
            )
        if Image is not None:
            self.camera_sub = self.create_subscription(
                Image,
                "/camera/image_raw",
                self.camera_callback,
                10
            )
        
        # 50 Hz Brain Control Timer Loop
        self.timer = self.create_timer(0.02, self.control_loop_timer_callback)
        self.get_logger().info("Fruit Fly ROS 2 Connectome Node initialized at 50 Hz!")

    def _run_server_thread(self):
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)
        self.loop.run_until_complete(self.server.start())
        self.loop.run_forever()

    def handle_web_command(self, cmd: str, val: Any = None):
        if cmd == "arm":
            self.arm(True)
        elif cmd == "disarm":
            self.arm(False)
        elif cmd == "offboard":
            self.set_offboard_mode()
        elif cmd == "set_target":
            if isinstance(val, dict):
                self.target_position[0] = float(val.get("x", self.target_position[0]))
                self.target_position[1] = float(val.get("y", self.target_position[1]))
                self.target_position[2] = float(val.get("z", self.target_position[2]))
            elif isinstance(val, (list, tuple)) and len(val) >= 2:
                self.target_position[0] = float(val[0])
                self.target_position[1] = float(val[1])
                if len(val) >= 3:
                    self.target_position[2] = float(val[2])
            print(f"[DrosophilaDrone] Target Waypoint set to: X={self.target_position[0]:.1f}, Y={self.target_position[1]:.1f}, Z={self.target_position[2]:.1f}m")
        elif cmd == "set_altitude":
            self.target_position[2] = max(0.5, min(10.0, float(val)))
            print(f"[DrosophilaDrone] Target Altitude set to: {self.target_position[2]:.1f}m")
        elif cmd == "reset_pos":
            self.reset_position()
        elif cmd == "reset_obstacles":
            self.obstacles = [dict(obs) for obs in NYC_LANDMARKS]
            print(f"[DrosophilaDrone] Reset obstacles to {len(self.obstacles)} Manhattan Chelsea Landmarks & POIs.")
        elif cmd == "clear_obstacles":
            self.obstacles.clear()
            print("[DrosophilaDrone] Cleared all obstacles.")
        elif cmd == "fly_to_landmark":
            landmark_id = int(val) if val is not None else 1
            matching = [lm for lm in NYC_LANDMARKS if lm["id"] == landmark_id]
            if matching:
                lm = matching[0]
                # Target waypoint near the landmark (offset by radius + 15m)
                self.target_position[0] = float(lm["x"] - (lm["radius"] + 15.0))
                self.target_position[1] = float(lm["y"])
                self.target_position[2] = min(60.0, float(lm.get("height", 50.0) * 0.5))
                print(f"[DrosophilaDrone] Flight Mission set to NYC Landmark: {lm['name']} at X={self.target_position[0]:.1f}m, Y={self.target_position[1]:.1f}m, Z={self.target_position[2]:.1f}m")
        elif cmd == "set_sugar_intensity":
            self.sugar_intensity = max(0.1, min(5.0, float(val)))
            print(f"[DrosophilaDrone] Odor plume intensity set to: {self.sugar_intensity:.2f}x")
        elif cmd == "sugar_odor":
            self.agent.i_ext[self.agent.circuit.dan_reward_indices] += 50.0
            n_mbon_half = len(self.agent.circuit.mbon_indices) // 2
            self.agent.i_ext[self.agent.circuit.mbon_indices[:n_mbon_half]] += 30.0
            n_kc_sample = len(self.agent.circuit.kc_indices) // 4
            self.agent.i_ext[self.agent.circuit.kc_indices[:n_kc_sample]] += 25.0
            self.agent.i_ext[self.agent.circuit.dn_pitch_thrust] += 22.0
            print("[Brain] 🍓 Sugar Odor Stimulus Triggered! Reward PAM11 + KC + DNp09 activated.")
        elif cmd == "stimulate_reward":
            self.agent.i_ext[self.agent.circuit.dan_reward_indices] += 30.0
            print("[Brain] Injected manual PAM11 reward stimulus!")
        elif cmd == "stimulate_aversive":
            self.agent.i_ext[self.agent.circuit.dan_aversive_indices] += 30.0
            print("[Brain] Injected manual PPL101 aversive stimulus!")
        elif cmd == "toggle_learning":
            self.learning_enabled = bool(val) if val is not None else not self.learning_enabled
            print(f"[Brain] Plasticity learning: {self.learning_enabled}")

    def local_position_callback(self, msg):
        xy_valid = bool(getattr(msg, "xy_valid", False))
        z_valid = bool(getattr(msg, "z_valid", False))
        # Only override position if external EKF2 explicitly validates the position estimate
        if xy_valid and z_valid:
            self.last_ext_odom_time = time.time()
            self.position_ned[0] = float(msg.x)
            self.position_ned[1] = float(msg.y)
            self.position_ned[2] = float(msg.z)
            self.velocity_ned[0] = float(msg.vx)
            self.velocity_ned[1] = float(msg.vy)
            self.velocity_ned[2] = float(msg.vz)
            if hasattr(msg, "heading") and not math.isnan(float(msg.heading)):
                self.current_yaw_rad = float(msg.heading)
            if hasattr(msg, "ax") and hasattr(msg, "ay") and hasattr(msg, "az"):
                self.accel_m_s2 = (float(msg.ax), float(msg.ay), float(msg.az))

    def vehicle_status_callback(self, msg):
        if hasattr(msg, "arming_state"):
            self.is_armed = bool(msg.arming_state == 2)
        if hasattr(msg, "nav_state"):
            self.is_offboard = bool(msg.nav_state == 14)

    def odometry_callback(self, msg):
        if hasattr(msg, "position") and any(abs(p) > 1e-4 for p in msg.position):
            self.last_ext_odom_time = time.time()
            self.position_ned[0] = float(msg.position[0])
            self.position_ned[1] = float(msg.position[1])
            self.position_ned[2] = float(msg.position[2])
            if hasattr(msg, "velocity"):
                self.velocity_ned[0] = float(msg.velocity[0])
                self.velocity_ned[1] = float(msg.velocity[1])
                self.velocity_ned[2] = float(msg.velocity[2])

    def sensor_combined_callback(self, msg):
        if hasattr(msg, "gyro_rad"):
            self.gyro_rad_s = (float(msg.gyro_rad[0]), float(msg.gyro_rad[1]), float(msg.gyro_rad[2]))
        if hasattr(msg, "accelerometer_m_s2"):
            self.accel_m_s2 = (float(msg.accelerometer_m_s2[0]), float(msg.accelerometer_m_s2[1]), float(msg.accelerometer_m_s2[2]))

    def camera_callback(self, msg: 'Image'):
        try:
            arr = np.frombuffer(msg.data, dtype=np.uint8)
            img = arr.reshape((msg.height, msg.width, -1))
            self.latest_frame = img
        except Exception:
            pass

    def send_vehicle_command(self, command: int, param1: float = 0.0, param2: float = 0.0):
        if not RCLPY_AVAILABLE or px4_msgs is None or not hasattr(px4_msgs, "VehicleCommand"):
            return
        msg = px4_msgs.VehicleCommand()
        msg.timestamp = int(self.get_clock().now().nanoseconds / 1000)
        msg.param1 = param1
        msg.param2 = param2
        msg.command = command
        msg.target_system = 1
        msg.target_component = 1
        msg.source_system = 1
        msg.source_component = 1
        msg.from_external = True
        self.vehicle_command_pub.publish(msg)

    def arm(self, state: bool = True):
        val = 1.0 if state else 0.0
        param2 = 21196.0 if not state else 0.0
        self.send_vehicle_command(400, param1=val, param2=param2)
        self.is_armed = state
        if not state:
            self.velocity_ned = np.zeros(3, dtype=np.float32)
            self.current_roll_rad = 0.0
            self.current_pitch_rad = 0.0
        print(f"[DrosophilaDrone] Drone {'ARMED' if state else 'DISARMED'}")

    def set_offboard_mode(self):
        self.send_vehicle_command(176, param1=1.0, param2=6.0)
        self.is_offboard = True
        print("[DrosophilaDrone] Switched to OFFBOARD flight mode")

    def publish_offboard_control_mode(self):
        if not RCLPY_AVAILABLE or px4_msgs is None or not hasattr(px4_msgs, "OffboardControlMode"):
            return
        msg = px4_msgs.OffboardControlMode()
        msg.timestamp = int(self.get_clock().now().nanoseconds / 1000)
        msg.position = False
        msg.velocity = True
        msg.acceleration = False
        msg.attitude = False
        msg.body_rate = False
        self.offboard_mode_pub.publish(msg)

    def reset_position(self):
        self.position_ned = np.array([0.0, 0.0, -1.5], dtype=np.float32)
        self.velocity_ned = np.zeros(3, dtype=np.float32)
        self.target_position = np.array([5.0, 0.0, 1.5], dtype=np.float32)
        self.current_yaw_rad = 0.0
        self.current_roll_rad = 0.0
        self.current_pitch_rad = 0.0
        print("[DrosophilaDrone] Reset drone position to Origin (0, 0, 1.5m)")

    def control_loop_timer_callback(self):
        """50 Hz Closed-Loop Step."""
        self.publish_offboard_control_mode()
        
        if self.offboard_setpoint_counter == 10:
            self.set_offboard_mode()
            self.arm(True)
            
        drone_pos = (float(self.position_ned[0]), float(self.position_ned[1]), float(-self.position_ned[2]))
        target_pos = (float(self.target_position[0]), float(self.target_position[1]), float(self.target_position[2]))
        
        dx = self.target_position[0] - self.position_ned[0]
        dy = self.target_position[1] - self.position_ned[1]
        dist_to_target = float(np.sqrt(dx * dx + dy * dy))
        target_reached = bool(dist_to_target < 0.6 and abs(-self.position_ned[2] - self.target_position[2]) < 0.4)

        if self.is_armed and self.is_offboard:
            setpoints, telemetry = self.agent.step(
                rgb_frame=self.latest_frame,
                angular_velocity_rad_s=self.gyro_rad_s,
                linear_acceleration_m_s2=self.accel_m_s2,
                altitude_m=float(-self.position_ned[2]),
                duration_ms=20.0,
                learning=self.learning_enabled,
                drone_pos=drone_pos,
                target_pos=target_pos,
                sugar_intensity=getattr(self, "sugar_intensity", 1.0),
                heading_rad=getattr(self, "current_yaw_rad", 0.0),
                obstacles=self.obstacles
            )
            
            # Integrate orientation & quadcopter flight attitude dynamics
            self.current_yaw_rad += setpoints.yaw_rate_rad_s * 0.02
            self.current_yaw_rad = (self.current_yaw_rad + np.pi) % (2 * np.pi) - np.pi

            # Quadcopter physical tilt dynamics (roll/pitch coupled to body acceleration/speed)
            target_pitch = float(np.clip(-setpoints.vx_m_s * 0.052, -0.45, 0.45))
            target_roll = float(np.clip(setpoints.vy_m_s * 0.052, -0.45, 0.45))
            self.current_roll_rad += (target_roll - self.current_roll_rad) * 0.18
            self.current_pitch_rad += (target_pitch - self.current_pitch_rad) * 0.18

            # Body to world frame transformation
            cy, sy = np.cos(self.current_yaw_rad), np.sin(self.current_yaw_rad)
            vx_world = setpoints.vx_m_s * cy - setpoints.vy_m_s * sy
            vy_world = setpoints.vx_m_s * sy + setpoints.vy_m_s * cy
            vz_world = -setpoints.vz_m_s
            cmd_vx = setpoints.vx_m_s
            cmd_vy = setpoints.vy_m_s
            cmd_vz = setpoints.vz_m_s
            cmd_yaw_rate = setpoints.yaw_rate_rad_s
        else:
            # Idle / Disarmed / Manual Standby State
            setpoints = None
            telemetry = {
                "sim_time_ms": self.offboard_setpoint_counter * 20.0,
                "total_spikes": self.agent.circuit.total_neurons * 10,
                "mean_firing_rate_hz": 0.0,
                "pam11_reward_hz": 0.0,
                "ppl101_aversive_hz": 0.0,
                "kc_firing_hz": 0.0,
                "lptc_hs_hz": 0.0,
                "lptc_vs_hz": 0.0,
                "dn_thrust_hz": 0.0,
                "dn_alt_hz": 0.0,
                "dn_yaw_l_hz": 0.0,
                "dn_yaw_r_hz": 0.0,
                "odor_conc": 0.0,
                "weight_drift": 0.0,
                "active_somas": []
            }
            vx_world = 0.0
            vy_world = 0.0
            vz_world = 0.0
            cmd_vx = 0.0
            cmd_vy = 0.0
            cmd_vz = 0.0
            cmd_yaw_rate = 0.0
            self.current_roll_rad = 0.0
            self.current_pitch_rad = 0.0

        if RCLPY_AVAILABLE and px4_msgs is not None and hasattr(px4_msgs, "TrajectorySetpoint"):
            sp_msg = px4_msgs.TrajectorySetpoint()
            sp_msg.timestamp = int(self.get_clock().now().nanoseconds / 1000)
            sp_msg.position = [float("nan"), float("nan"), float("nan")]
            sp_msg.velocity = [
                float(vx_world),
                float(vy_world),
                float(vz_world)
            ]
            sp_msg.yaw = float(self.current_yaw_rad)
            sp_msg.yawspeed = float(cmd_yaw_rate)
            self.trajectory_setpoint_pub.publish(sp_msg)

        # Update position kinematics if not overridden by hardware odometry
        if not hasattr(self, "last_ext_odom_time") or (time.time() - self.last_ext_odom_time > 0.2):
            if self.is_armed and self.is_offboard:
                self.position_ned[0] += vx_world * 0.02
                self.position_ned[1] += vy_world * 0.02
                self.position_ned[2] += vz_world * 0.02
                self.position_ned[2] = min(-0.15, self.position_ned[2])
                self.velocity_ned = np.array([vx_world, vy_world, vz_world], dtype=np.float32)
            else:
                self.velocity_ned = np.zeros(3, dtype=np.float32)
            
        self.offboard_setpoint_counter += 1
        
        if self.server:
            self.server.broadcast_telemetry({
                "status": "WAYPOINT REACHED" if target_reached else ("FLYING" if self.is_armed else "STANDBY"),
                "is_armed": self.is_armed,
                "is_offboard": self.is_offboard,
                "position": [float(self.position_ned[0]), float(self.position_ned[1]), float(-self.position_ned[2])],
                "velocity": [float(self.velocity_ned[0]), float(self.velocity_ned[1]), float(-self.velocity_ned[2])],
                "euler": [float(self.current_roll_rad), float(self.current_pitch_rad), float(self.current_yaw_rad)],
                "target_position": [float(self.target_position[0]), float(self.target_position[1]), float(self.target_position[2])],
                "dist_to_target": float(dist_to_target),
                "target_reached": target_reached,
                "obstacles": self.obstacles,
                "sim_time_ms": telemetry["sim_time_ms"],
                "total_spikes": telemetry["total_spikes"],
                "mean_firing_rate_hz": telemetry["mean_firing_rate_hz"],
                "pam11_reward_hz": telemetry["pam11_reward_hz"],
                "ppl101_aversive_hz": telemetry["ppl101_aversive_hz"],
                "kc_firing_hz": telemetry["kc_firing_hz"],
                "lptc_hs_hz": telemetry["lptc_hs_hz"],
                "lptc_vs_hz": telemetry["lptc_vs_hz"],
                "dn_thrust_hz": telemetry.get("dn_thrust_hz", 0.0),
                "dn_alt_hz": telemetry.get("dn_alt_hz", 0.0),
                "dn_yaw_l_hz": telemetry.get("dn_yaw_l_hz", 0.0),
                "dn_yaw_r_hz": telemetry.get("dn_yaw_r_hz", 0.0),
                "odor_conc": telemetry.get("odor_conc", 1.0),
                "sugar_intensity": getattr(self, "sugar_intensity", 1.0),
                "cmd_vx": cmd_vx,
                "cmd_vy": cmd_vy,
                "cmd_vz": cmd_vz,
                "cmd_yaw_rate": cmd_yaw_rate,
                "weight_drift": telemetry["weight_drift"],
                "learning_enabled": self.learning_enabled,
                "active_somas": telemetry.get("active_somas", []),
            })
