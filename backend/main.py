#!/usr/bin/env python3
"""
DrosophilaDrone Main Entry Point.

Runs the Drosophila Connectome Spiking Brain and serves the 3D Web Dashboard.
"""

import sys
import time
from pathlib import Path

# Add backend directory to sys.path
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from ros2_node import FruitFlyPX4ROS2Node, RCLPY_AVAILABLE

try:
    import rclpy
except ImportError:
    pass


def main(args=None):
    if RCLPY_AVAILABLE:
        rclpy.init(args=args)
        node = FruitFlyPX4ROS2Node(enable_web_server=True)
        print("\n===========================================================")
        print("  🪰 DrosophilaDrone Real PX4 SITL + ROS 2 Node Active!")
        print("  🌐 Web Dashboard Live at: http://localhost:8080")
        print("===========================================================\n")
        try:
            rclpy.spin(node)
        except KeyboardInterrupt:
            pass
        finally:
            node.destroy_node()
            rclpy.shutdown()
    else:
        node = FruitFlyPX4ROS2Node(enable_web_server=True)
        print("[DrosophilaDrone] Running Connectome Brain & Web Dashboard on http://localhost:8080...")
        print("[DrosophilaDrone] Press Ctrl+C to stop.")
        try:
            while True:
                node.control_loop_timer_callback()
                time.sleep(0.02)
        except KeyboardInterrupt:
            print("\n[DrosophilaDrone] Server stopped.")


if __name__ == "__main__":
    main()
