#!/usr/bin/env bash
set -e

echo "========================================================="
echo "  🚀 DrosophilaDrone Real PX4 SITL + ROS 2 Humble + Connectome"
echo "  • Real PX4 SITL Firmware Execution"
echo "  • Real Micro-XRCE-DDS uORB Bridge (UDP 8888)"
echo "  • Real ROS 2 Humble Topics (/fmu/in/*, /fmu/out/*)"
echo "  • Real Spiking Drosophila Connectome Autopilot (50 Hz)"
echo "  • 3D Web Dashboard on http://localhost:8080"
echo "========================================================="

chmod +x "$(dirname "$0")/entrypoint.sh"
docker compose -f "$(dirname "$0")/docker-compose.yml" up --build
