# 🪰 FruitDrone: Drosophila Connectome Brain for PX4 Autopilot over ROS 2

**Pure ROS 2 + Headless PX4 SITL + Fruit Fly Brain Controller + Interactive 3D Web Dashboard.**

Inspired by [awesome-fly](https://github.com/cobanov/awesome-fly), [fly-wirehead](https://github.com/mattyhempstead/fly-wirehead), and [px4io/px4-sitl-ros2](https://hub.docker.com/r/px4io/px4-sitl-ros2).

---

## 🧬 Biological Connectome & ROS 2 Architecture

```
                                  ┌────────────────────────┐
                                  │      PX4 Autopilot     │
                                  │   (Headless SITL/ROS2) │
                                  └────┬──────────────▲────┘
           /camera/image_raw           │              │   /fmu/in/trajectory_setpoint
           /fmu/out/vehicle_odometry   │              │   /fmu/in/offboard_control_mode
           /fmu/out/sensor_combined    ▼              │   /fmu/in/vehicle_command
   ┌──────────────────────────────────────────────────┴───────────────────────────────────────────────────┐
   │                                   DROSOPHILA CONNECTOME BRAIN                                       │
   │                                                                                                      │
   │  ┌───────────────────────┐   ┌───────────────────────────┐   ┌───────────────────────────────────┐   │
   │  │  Retina & Optic Lobe  │   │   Central Complex (CX)    │   │  Mushroom Body Plasticity (MB)    │   │
   │  │                       │   │                           │   │                                   │   │
   │  │ • R1–R6 (Achromatic)  │   │ • E-PG Heading Compass    │   │ • Kenyon Cells (~800 KCs)         │   │
   │  │ • R8 (Spectral)       │──▶│ • P-EN Angular Integrator │──▶│ • PAM11 (Reward Dopamine DANs)    │──┐│
   │  │ • T4/T5 Motion Fields │   │ • Fan-shaped Body (FB)    │   │ • PPL101 (Aversive Dopamine DANs) │  ││
   │  │ • LPTCs (HS/VS Yaw/Alt│   │   (2D Vector Navigation)  │   │ • MBONs (Approach/Avoidance)      │  ││
   │  └───────────────────────┘   └───────────────────────────┘   └───────────────────────────────────┘  ││
   │               │                                                                                     ││
   │               ▼                                                                                     ││
   │  ┌───────────────────────────────────────────────────────────────────────────────────────────────┐  ││
   │  │                             Descending Motor Neurons (DNs)                                     │◀─┘│
   │  │  • DNa02_L / DNa02_R  ──▶  Yaw Torque Rate (r = K_yaw * (DNa02_R - DNa02_L))                  │   │
   │  │  • DNp09 / MN9        ──▶  Forward Thrust Speed (Vx = K_pitch * DNp09)                        │   │
   │  │  • DN_alt             ──▶  Climb Rate Setpoint (Vz = K_climb * (DN_alt - baseline))           │   │
   │  └───────────────────────────────────────────────────────────────────────────────────────────────┘   │
   └──────────────────────────────────────────────────┬───────────────────────────────────────────────────┘
                                                      │ WebSocket Telemetry (50 Hz)
                                                      ▼
                                  ┌────────────────────────────────────────┐
                                  │   3D Web Dashboard (Three.js / ROS 2)  │
                                  │   http://localhost:8080                │
                                  └────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Launch Fruit Fly Brain & 3D Web Dashboard
```bash
python scripts/run_fly_ros2.py
```
Open **[http://localhost:8080](http://localhost:8080)** in your browser to interact with:
- **3D Fly Brain Visualization**: Live glowing spikes across Retina, Central Complex, Mushroom Body KCs, PAM11/PPL101 DANs, and Descending Flight Neurons.
- **3D Drone Trajectory & Horizon**: Live position trail and attitude pitch/roll/yaw.
- **Dopamine Learning Meters**: Real-time PAM11 reward vs PPL101 punishment firing rates.
- **Interactive Control Deck**: Arm/Disarm, Offboard Mode, Manual Dopamine Stimulus, and Synaptic Plasticity freezing.

---

### 2. Run with Headless PX4 SITL Container (No Gazebo)
```bash
# Terminal 1: Launch Headless PX4 SITL + micro-XRCE-DDS in Docker
./docker/run_px4_sitl.sh

# Terminal 2: Run Fruit Fly ROS 2 Controller & Dashboard
python scripts/run_fly_ros2.py
```

---

### 3. Episodic Dopamine Plasticity Training
Train synaptic consolidation over multiple flight trials:
```bash
python scripts/train_fly_flight.py --episodes 10 --duration 10.0
```

---

## 📂 Streamlined Architecture

- `fruitdrone/brain/connectome.py`: Biological Drosophila flight connectome topology with neurotransmitter signs.
- `fruitdrone/brain/LIF_engine.py`: Biophysical Leaky Integrate-and-Fire spiking neural simulator.
- `fruitdrone/brain/plasticity.py`: Huang, Luo et al. (Nature 2024) anti-Hebbian dopamine plasticity engine.
- `fruitdrone/brain/real_connectome.py`: Official Janelia MaleCNS v1.0 biological dataset loader.
- `fruitdrone/ros2/fly_ros2_node.py`: Native ROS 2 node subscribing to uORB topics and publishing offboard trajectory setpoints.
- `fruitdrone/ros2/bridge_server.py`: Async WebSocket server streaming telemetry to frontend.
- `frontend/`: Interactive Three.js 3D Web Dashboard.
