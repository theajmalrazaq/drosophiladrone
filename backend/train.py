#!/usr/bin/env python3
"""
Fruit Fly Connectome Drone Training Engine.

Trains the Drosophila Spiking Brain to fly a quadrotor drone using biological
dopaminergic reinforcement learning (Huang, Luo et al., Nature 2024).

Curriculum:
1. Altitude Stabilization & Hover Control (DN_alt + LPTC VS)
2. Heading Orientation & Yaw Optomotor Stabilization (DNa02 + Central Complex)
3. Forward Trajectory Flight & Obstacle Evasion (DNp09/MN9 + PAM11/PPL101 Dopamine)
"""

import argparse
import math
from pathlib import Path
import time
import numpy as np

try:
    from brain import FruitFlyBrainAgent
except ImportError:
    from backend.brain import FruitFlyBrainAgent


class DroneTrainingEnvironment:
    """
    Kinematic & aerodynamic quadrotor flight environment for fruit fly brain training.
    """
    def __init__(self, target_altitude: float = 1.5):
        self.target_alt = target_altitude
        self.reset()

    def reset(self, target_pos: Optional[np.ndarray] = None):
        self.pos = np.array([0.0, 0.0, 1.2], dtype=np.float64)  # Start at 1.2m
        self.vel = np.array([0.0, 0.0, 0.0], dtype=np.float64)
        self.euler = np.array([0.0, 0.0, 0.0], dtype=np.float64)  # [roll, pitch, yaw]
        self.omega = np.array([0.0, 0.0, 0.0], dtype=np.float64)
        self.target = target_pos if target_pos is not None else np.array([10.0, 0.0, self.target_alt])
        self.time_sec = 0.0
        self.crashed = False
        return self.get_observation()

    def step(self, cmd_vx: float, cmd_vy: float, cmd_vz: float, cmd_yaw_rate: float, dt: float = 0.02):
        if self.crashed:
            return self.get_observation(), 0.0, True, {"alt_err": abs(self.pos[2] - self.target_alt), "reward": 0.0, "penalty": 4.0}

        # Quadrotor dynamics tracking
        target_pitch = float(np.clip(cmd_vx * 0.12, -0.30, 0.30))
        target_roll = float(np.clip(-cmd_vy * 0.12, -0.30, 0.30))

        # Angular acceleration with damping
        self.omega[0] += ((target_roll - self.euler[0]) * 10.0 - self.omega[0] * 4.0) * dt
        self.omega[1] += ((target_pitch - self.euler[1]) * 10.0 - self.omega[1] * 4.0) * dt
        self.omega[2] += ((cmd_yaw_rate - self.omega[2]) * 8.0) * dt

        # Integrate orientation
        self.euler += self.omega * dt
        self.euler[2] = (self.euler[2] + math.pi) % (2 * math.pi) - math.pi

        # Transform body velocities to world frame
        cy, sy = math.cos(self.euler[2]), math.sin(self.euler[2])
        vx_world = cmd_vx * cy - cmd_vy * sy
        vy_world = cmd_vx * sy + cmd_vy * cy
        vz_world = cmd_vz

        # Integrate position
        self.vel = np.array([vx_world, vy_world, vz_world])
        self.pos += self.vel * dt

        # Ground & attitude check
        if self.pos[2] < 0.15:
            self.pos[2] = 0.15
            self.crashed = True
        elif abs(self.euler[0]) > 0.7 or abs(self.euler[1]) > 0.7:
            self.crashed = True

        self.time_sec += dt

        # Compute biological reward & penalty
        alt_err = abs(self.pos[2] - self.target_alt)
        tilt = abs(self.euler[0]) + abs(self.euler[1])
        forward_progress = max(0.0, float(self.vel[0]))
        dist_to_goal = np.linalg.norm(self.pos[:2] - self.target[:2])

        reward = float(np.exp(-2.0 * alt_err) * 0.8 + min(0.6, forward_progress * 0.4) - min(0.3, tilt * 0.5))
        penalty = float(max(0.0, 1.0 - np.exp(-2.0 * alt_err)) * 1.5 + tilt * 1.2)
        if self.crashed:
            penalty += 4.0

        done = self.crashed or dist_to_goal < 0.5
        info = {
            "alt_err": alt_err,
            "forward_progress": forward_progress,
            "dist_to_goal": dist_to_goal,
            "reward": reward,
            "penalty": penalty
        }

        return self.get_observation(), reward, done, info

    def get_observation(self):
        # Generate synthetic vision frame & IMU
        frame = np.zeros((36, 64, 3), dtype=np.uint8)
        # Horizon render
        h_y = int(18 + self.euler[1] * 25.0)
        h_y = np.clip(h_y, 0, 36)
        frame[:h_y] = [70, 130, 200]  # Sky
        frame[h_y:] = [30, 120, 40]   # Ground

        gyro = (float(self.omega[0]), float(self.omega[1]), float(self.omega[2]))
        accel = (float(self.vel[0] * 0.1), float(self.vel[1] * 0.1), 9.81)
        altitude = float(self.pos[2])
        return frame, gyro, accel, altitude


def train_fruit_fly(episodes: int = 15, episode_duration: float = 6.0, save_path: str = "backend/trained_brain.npz"):
    print("=" * 75)
    print("  🪰 TRAINING FRUIT FLY CONNECTOME TO FLY A DRONE (DOPAMINE STDP)")
    print("=" * 75)
    print(f"Episodes: {episodes} | Episode Duration: {episode_duration}s | Target Altitude: 1.5m")
    print(f"Neural Architecture: 1,398 Biological Somas | PAM11 (Reward) / PPL101 (Penalty)")
    print("=" * 75 + "\n")

    agent = FruitFlyBrainAgent(num_ommatidia=160, num_kc=800, seed=42)
    env = DroneTrainingEnvironment(target_altitude=1.5)

    ep_rewards = []
    ep_alt_errors = []
    ep_distances = []

    dt = 0.02
    max_steps = int(round(episode_duration / dt))

    for ep in range(1, episodes + 1):
        target_x = 5.0 + ep * 1.5
        obs = env.reset(target_pos=np.array([target_x, 0.0, 1.5]))
        frame, gyro, accel, alt = obs

        ep_pam = 0
        ep_ppl = 0
        total_alt_err = 0.0
        steps = 0

        for _ in range(max_steps):
            if env.crashed:
                break

            # Heading towards goal
            target_yaw = math.atan2(env.target[1] - env.pos[1], env.target[0] - env.pos[0])

            # 1. Fly Brain Step
            setpoints, telemetry = agent.step(
                rgb_frame=frame,
                angular_velocity_rad_s=gyro,
                linear_acceleration_m_s2=accel,
                altitude_m=alt,
                duration_ms=20.0,
                learning=True,
                heading_rad=float(env.euler[2]),
                target_heading_rad=float(target_yaw)
            )

            # 2. Physics Step
            obs, r, done, info = env.step(
                cmd_vx=setpoints.vx_m_s,
                cmd_vy=setpoints.vy_m_s,
                cmd_vz=setpoints.vz_m_s,
                cmd_yaw_rate=setpoints.yaw_rate_rad_s,
                dt=dt
            )
            frame, gyro, accel, alt = obs

            ep_pam += int(telemetry["pam11_reward_hz"] * dt)
            ep_ppl += int(telemetry["ppl101_aversive_hz"] * dt)
            total_alt_err += info["alt_err"]
            steps += 1

        mean_alt_err = total_alt_err / max(1, steps)
        dist_covered = float(env.pos[0])
        status = "CRASHED" if env.crashed else "COMPLETED"

        ep_rewards.append(ep_pam - ep_ppl)
        ep_alt_errors.append(mean_alt_err)
        ep_distances.append(dist_covered)

        # Progress Meter
        pam_bar = "█" * min(15, max(1, ep_pam // 20))
        drift = float(np.mean(np.abs(agent.plasticity.w)))

        print(
            f"Episode {ep:2d}/{episodes:2d} | "
            f"{status:<9} | "
            f"Alt Err: {mean_alt_err:4.2f}m | "
            f"Dist: {dist_covered:+5.2f}m | "
            f"PAM11(Rew): {ep_pam:4d} [{pam_bar:<15}] | "
            f"PPL101(Pen): {ep_ppl:4d} | "
            f"Weight Drift: {drift:6.4f}"
        )

    # Save trained synaptic weights
    save_file = Path(save_path)
    save_file.parent.mkdir(parents=True, exist_ok=True)
    agent.save_weights(str(save_file))

    print("\n" + "=" * 75)
    print("  🏆 TRAINING SUMMARY & PERFORMANCE GAINS")
    print("=" * 75)
    print(f"Initial Altitude Error: {ep_alt_errors[0]:.2f}m  ──▶  Final Altitude Error: {ep_alt_errors[-1]:.2f}m (Improved: {((ep_alt_errors[0]-ep_alt_errors[-1])/max(0.01, ep_alt_errors[0]))*100:+.1f}%)")
    print(f"Total Connectome Spikes: {agent.engine.total_spikes:,}")
    print(f"Consolidated Synaptic Updates: {agent.plasticity.cumulative_updates:,}")
    print(f"Trained Brain Weights Saved To: {save_file.resolve()}")
    print("=" * 75 + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Fruit Fly Brain to Fly a Drone")
    parser.add_argument("--episodes", type=int, default=10, help="Number of training episodes")
    parser.add_argument("--duration", type=float, default=6.0, help="Duration per episode (sec)")
    parser.add_argument("--output", type=str, default="backend/trained_brain.npz", help="Output file for trained weights")
    args = parser.parse_args()

    train_fruit_fly(episodes=args.episodes, episode_duration=args.duration, save_path=args.output)
