#!/usr/bin/env bash
set -e

# Source ROS 2 and px4_msgs workspaces
source /opt/ros/humble/setup.bash
if [ -f /root/PX4-ROS2-Gazebo-Drone-Simulation-Template/ros/install/setup.bash ]; then
    source /root/PX4-ROS2-Gazebo-Drone-Simulation-Template/ros/install/setup.bash
fi

echo "==========================================================="
echo "  🚀 Starting Micro-XRCE-DDS Agent on UDP 8888..."
echo "==========================================================="
MicroXRCEAgent udp4 -p 8888 > /tmp/micro_xrce_agent.log 2>&1 &
sleep 1

echo "==========================================================="
echo "  🛩️ Starting Real PX4 SITL (Headless Firmware)..."
echo "==========================================================="
cd /root/PX4-Autopilot
HEADLESS=1 ./build/px4_sitl_default/bin/px4 ./build/px4_sitl_default/etc -s etc/init.d-posix/rcS > /tmp/px4_sitl.log 2>&1 &
sleep 3

echo "==========================================================="
echo "  🪰 Launching Drosophila Connectome Flight Controller..."
echo "  🌐 Serving Web Dashboard at http://localhost:8080"
echo "==========================================================="
cd /fruitdrone
python3 backend/main.py
