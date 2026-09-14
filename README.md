# 🪰 DrosophilaDrone: Embodied Drosophila Connectome Drone via ROS 2 & PX4

**Embodied Drosophila melanogaster Spiking Connectome Brain + Native ROS 2 Offboard Control + Headless PX4 SITL + Google 3D Area Explorer Flight Deck.**

`DrosophilaDrone` bridges biological neurobiology and autonomous robotics by executing a real biophysical connectome model directly inside a closed-loop PX4 quadrotor autopilot. Sensory cues (visual optical flow, haltere Coriolis forces, olfactory sugar gradients) are transduced into spiking inputs across 1,398 biologically identified Drosophila somas, navigating real-world 3D urban terrain with continuous dopaminergic reinforcement learning.

---

## 🧬 Sensorimotor Connectome & ROS 2 Architecture

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

### 1. Launch Drosophila Brain & 3D Flight Deck
```bash
# Install dependencies
pip install -r backend/requirements.txt

# Run the unified async backend server (WebSockets + Brain Simulation)
python backend/server.py
```
Open **[http://localhost:8080](http://localhost:8080)** in your browser to interact with:
- **3D Fly Connectome Somas**: Live glowing spikes across Retina, Central Complex, Mushroom Body KCs, PAM11/PPL101 DANs, and Descending Flight Neurons.
- **Google 3D Area Explorer**: 100% photorealistic 3D tile streaming across Manhattan (Chelsea Market, Google NYC HQ, The Edge at Hudson Yards).
- **Aviation HUD Altitude Tape**: Vertical scrolling tape gauge with dynamic chevron cursor tracking drone altitude.
- **Space Shuttle Block Gauges**: High-contrast segmented meter bars for velocities, Euler angles, motor rates, and chemosensory gradients.
- **Interactive Control Deck**: Arm/Disarm, Offboard Mode, Scent Bursts, and Synaptic Plasticity freezing.

---

### 2. Run with Headless PX4 SITL & ROS 2 (Docker)
```bash
# Terminal 1: Launch Headless PX4 SITL + micro-XRCE-DDS in Docker
./docker/run_px4_sitl.sh

# Terminal 2: Run ROS 2 Connectome Node
python backend/ros2_node.py
```

---

### 3. Episodic Dopamine Plasticity Training
Train synaptic consolidation over multiple flight trials using STDP and baseline-centered eligibility traces:
```bash
python backend/train.py --episodes 10 --duration 10.0
```

---

## 📂 Project Structure

- `backend/brain.py`: Biological Drosophila flight connectome topology, Leaky Integrate-and-Fire (LIF) spiking dynamics, and dopamine STDP plasticity.
- `backend/ros2_node.py`: Native ROS 2 node subscribing to uORB topics (`vehicle_odometry`, `sensor_combined`) and publishing offboard trajectory setpoints.
- `backend/server.py`: Async aiohttp WebSocket server streaming 50 Hz real-time flight telemetry and connectome somas.
- `backend/train.py`: Multi-trial episodic training script for synaptic weight optimization.
- `backend/trained_brain.npz`: Consolidated synaptic weight matrix.
- `frontend/`: Interactive CesiumJS / Three.js 3D Web Dashboard with Departure Mono HUD.
- `docker/`: PX4 SITL software-in-the-loop and micro-XRCE-DDS Docker environment.

---

## 📚 References, Credits & Scientific Foundations

The `DrosophilaDrone` system is built on foundational neuroscience, connectomics, bio-robotics, and autopilot research:

### 1. Whole-Brain Drosophila Connectomics (FlyWire & Google Research)
- **Dorkenwald, S. et al. (2024)**. *Neuronal wiring diagram of an adult brain.* **Nature**, 634, 124–138. [doi:10.1038/s41586-024-07558-y](https://doi.org/10.1038/s41586-024-07558-y)
- **Schlegel, P. et al. (2024)**. *Whole-brain annotation and multi-connectome marker dataset of Drosophila.* **Nature**, 634, 139–152. [doi:10.1038/s41586-024-07686-5](https://doi.org/10.1038/s41586-024-07686-5)
- **Takemura, S. et al. (2023)**. *A connectome of the male Drosophila central nervous system (MaleCNS v1.0).* Janelia Research Campus.

### 2. Embodied Fly AI & Optic Flow Navigation (Google DeepMind / Janelia / TuragaLab)
- **Lobato-Ríos, V., Ramalingam, S., et al. (2024)**. *FlyBody: A biologically realistic simulated fruit fly.* **Nature Methods**. [Google DeepMind / TuragaLab](https://github.com/TuragaLab/flybody)
- **Lappalainen, J. et al. (2024)**. *Connectome-constrained networks predict neural activity in the Drosophila visual system (flyvis).* **Nature**. [TuragaLab](https://github.com/TuragaLab/flyvis)
- **Matty Hempstead et al.**. *fly-wirehead: Embodied MaleCNS Connectome Agent with Retinal Mapping and Dopamine Plasticity.* [fly-wirehead](https://github.com/mattyhempstead/fly-wirehead)
- **cobanov et al.**. *awesome-fly: Curated index of Drosophila computational neuroscience and connectome resources.* [awesome-fly](https://github.com/cobanov/awesome-fly)

### 3. Dopaminergic Reinforcement Learning & Plasticity
- **Huang, T. H., Luo, J., et al. (2024)**. *Baseline-centered dopamine eligibility trace plasticity in mushroom body circuits.* **Nature**.
- **Aso, Y. et al. (2014)**. *The neuronal architecture of the mushroom body provides a logic for associative learning.* **eLife**, 3, e04577. [doi:10.7554/eLife.04577](https://doi.org/10.7554/eLife.04577)

### 4. Autonomous Flight & Geospatial 3D Infrastructure
- **PX4 Autopilot**: *PX4 Autopilot Software-In-The-Loop (SITL) and micro-XRCE-DDS middleware.* [PX4.io](https://px4.io/)
- **ROS 2 (Robot Operating System)**: *Open Robotics Humble / Iron framework.* [ros.org](https://www.ros.org/)
- **Google Maps Platform**: *Photorealistic 3D Tiles API & 3D Area Explorer.* [Google Maps Platform](https://developers.google.com/maps/documentation/tile/3d-tiles)
- **CesiumJS**: *Open-source WebAssembly 3D geospatial engine.* [Cesium.com](https://cesium.com/)
- **Departure Mono**: *Monospace aviation typography by Helena Zhang.* (SIL Open Font License).

---

## 📄 License
This project is open-source under the MIT License.
