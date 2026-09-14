/**
 * DrosophilaDrone GCS — Google 3D Area Explorer & Drosophila Connectome Controller
 * Font & Typography: Departure Mono
 */

let ws = null;
let brainVis = null;
let droneVis = null;
let currentTarget = { x: 5.0, y: 0.0, z: 1.5 };
let isLearningEnabled = true;

// 18 Real-World Chelsea Manhattan Landmarks & POIs
const NYC_LANDMARKS = [
    { id: 1, name: "Chelsea Market & Food Hall", x: 0.0, y: 0.0, z: 1.5, height: 38, cat: "Restaurant", rating: 4.7 },
    { id: 2, name: "Pastis French Bistro", x: -293.0, y: 62.0, z: 25.0, height: 25, cat: "Restaurant", rating: 4.6 },
    { id: 3, name: "Catch NYC Seafood", x: -282.0, y: -55.0, z: 32.0, height: 32, cat: "Restaurant", rating: 4.5 },
    { id: 4, name: "Buddakan Manhattan", x: -38.0, y: 29.0, z: 28.0, height: 28, cat: "Restaurant", rating: 4.6 },
    { id: 5, name: "The Standard High Line & Le Bain", x: -171.0, y: -148.0, z: 45.0, height: 70, cat: "Bar / Lounge", rating: 4.5 },
    { id: 6, name: "Gansevoort Rooftop Lounge", x: -248.0, y: -38.0, z: 52.0, height: 52, cat: "Bar", rating: 4.3 },
    { id: 7, name: "Brass Monkey Pub", x: -204.0, y: -190.0, z: 24.0, height: 24, cat: "Bar", rating: 4.4 },
    { id: 8, name: "Porchlight Cocktails", x: 928.0, y: 164.0, z: 30.0, height: 30, cat: "Bar", rating: 4.6 },
    { id: 9, name: "Whole Foods Market Chelsea", x: 196.0, y: 812.0, z: 30.0, height: 42, cat: "Supermarket", rating: 4.4 },
    { id: 10, name: "Trader Joe's Chelsea", x: 73.0, y: 753.0, z: 35.0, height: 35, cat: "Supermarket", rating: 4.6 },
    { id: 11, name: "Westside Market NYC", x: -182.0, y: 492.0, z: 28.0, height: 28, cat: "Supermarket", rating: 4.5 },
    { id: 12, name: "Google New York HQ (111 8th Ave)", x: -182.0, y: 340.0, z: 55.0, height: 88, cat: "Tech Campus", rating: 4.8 },
    { id: 13, name: "IAC Building (Frank Gehry)", x: 340.0, y: -72.0, z: 35.0, height: 45, cat: "Architecture", rating: 4.6 },
    { id: 14, name: "Lantern House (Heatherwick)", x: 262.0, y: 54.0, z: 75.0, height: 75, cat: "Residential", rating: 4.6 },
    { id: 15, name: "Little Island & Pier 54 Park", x: -49.0, y: -308.0, z: 25.0, height: 22, cat: "Park", rating: 4.8 },
    { id: 16, name: "The High Line Elevated Park", x: 118.0, y: -114.0, z: 18.0, height: 18, cat: "Park", rating: 4.8 },
    { id: 17, name: "30 Hudson Yards (The Edge)", x: 840.0, y: 265.0, z: 120.0, height: 387, cat: "Skyscraper", rating: 4.9 },
    { id: 18, name: "Chelsea Piers Sports Complex", x: 450.0, y: -280.0, z: 30.0, height: 30, cat: "Park / Pier", rating: 4.7 }
];

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize 3D Viewports
    droneVis = new Drone3DVisualizer("drone3dContainer");
    brainVis = new Brain3DVisualizer("brain3dContainer");

    // 2. Connect Click-to-Fly Raycasting
    droneVis.onTargetSelected = (x, y, z) => {
        currentTarget = { x, y, z };
        updateTargetUI(currentTarget);
        sendCmd("set_target", currentTarget);
    };

    // 3. Populate POIs list
    populatePoiList();

    // 4. Initialize Vertical Altitude Tape (Ladder Gauge)
    initAltitudeTape();

    // 5. Connect WebSocket
    connectWebSocket();
});

// =========================================================================
// WebSocket Communications Link
// =========================================================================
function connectWebSocket() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        const dot = document.getElementById("wsStatusDot");
        const txt = document.getElementById("wsStatusText");
        if (dot) dot.classList.add("active");
        if (txt) txt.textContent = "ROS 2 / WS CONNECTED";
        sendCmd("set_target", currentTarget);
    };

    ws.onclose = () => {
        const dot = document.getElementById("wsStatusDot");
        const txt = document.getElementById("wsStatusText");
        if (dot) dot.classList.remove("active");
        if (txt) txt.textContent = "DISCONNECTED";
        setTimeout(connectWebSocket, 2000);
    };

    ws.onerror = (err) => {
        console.error("WebSocket Error:", err);
    };

    ws.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data);
            if (msg.type === "telemetry") {
                updateTelemetryUI(msg.data);
            }
        } catch (e) {
            console.error("Error parsing message:", e);
        }
    };
}

// =========================================================================
// Telemetry & Avionics UI Decoders
// =========================================================================
function setBar(id, value, min, max) {
    const el = document.getElementById(id);
    if (el) {
        const clamped = Math.max(min, Math.min(max, value));
        const pct = ((clamped - min) / (max - min)) * 100;
        el.style.width = `${pct.toFixed(1)}%`;
    }
}

function updateTelemetryUI(data) {
    if (!data) return;

    // 1. Update 3D Viewports
    if (droneVis) droneVis.updateTelemetry(data);
    if (brainVis && data.active_somas) brainVis.updateSpikes(data.active_somas);

    // 2. Flight & Arming Badges
    const modeBadge = document.getElementById("flightModeBadge");
    const armBadge = document.getElementById("armStateBadge");
    if (modeBadge) {
        modeBadge.textContent = data.is_offboard ? "OFFBOARD" : "MANUAL";
    }
    if (armBadge) {
        armBadge.textContent = data.is_armed ? "ARMED" : "DISARMED";
        armBadge.classList.toggle("arm-badge", data.is_armed);
        armBadge.classList.toggle("disarm-badge", !data.is_armed);
    }

    // 3. Position, Velocity & Sim Time
    if (data.position) {
        const x = data.position[0];
        const y = data.position[1];
        const z = data.position[2];

        setText("telemetryX", `${x >= 0 ? "+" : ""}${x.toFixed(1)}m`);
        setText("telemetryY", `${y >= 0 ? "+" : ""}${y.toFixed(1)}m`);
        setText("dronePosTag", `X: ${x.toFixed(1)} Y: ${y.toFixed(1)} Z: ${z.toFixed(1)}m`);

        setBar("barFillPosX", x, -500, 500);
        setBar("barFillPosY", y, -500, 500);
        setBar("barFillPosZ", z, 0, 150);
        
        // Update vertical scrolling altitude tape
        updateAltitudeTape(z);
    }

    const vx = data.cmd_vx || (data.velocity ? data.velocity[0] : 0);
    const vy = data.cmd_vy || (data.velocity ? data.velocity[1] : 0);
    const vz = data.cmd_vz || (data.velocity ? data.velocity[2] : 0);
    setText("valVx", `${vx >= 0 ? "+" : ""}${vx.toFixed(2)}`);
    setText("valVy", `${vy >= 0 ? "+" : ""}${vy.toFixed(2)}`);
    setText("valVz", `${vz >= 0 ? "+" : ""}${vz.toFixed(2)}`);

    setBar("barFillVelX", vx, -30, 30);
    setBar("barFillVelY", vy, -30, 30);
    setBar("barFillVelZ", vz, -10, 10);

    if (data.sim_time_ms) {
        setText("valSimTime", `${(data.sim_time_ms / 1000).toFixed(1)}s`);
    }

    // 4. Orientation & Analog Needle Gyro Dial
    if (data.euler) {
        const rollDeg = (data.euler[0] * 180) / Math.PI;
        const pitchDeg = (data.euler[1] * 180) / Math.PI;
        const yawDeg = ((((data.euler[2] * 180) / Math.PI) % 360) + 360) % 360;

        setText("telemetryRoll", `R: ${rollDeg >= 0 ? "+" : ""}${rollDeg.toFixed(1)}°`);
        setText("telemetryPitch", `P: ${pitchDeg >= 0 ? "+" : ""}${pitchDeg.toFixed(1)}°`);
        setText("valYawRate", `HDG: ${String(Math.round(yawDeg)).padStart(3, "0")}°`);

        const needle = document.getElementById("dialNeedleHeading");
        if (needle) {
            const needleAngle = -90 + (yawDeg / 360) * 180;
            needle.setAttribute("transform", `rotate(${needleAngle.toFixed(1)}, 60, 60)`);
        }
    }

    const btnOff = document.getElementById("btnGateOffboard");
    if (btnOff) btnOff.classList.toggle("active", Boolean(data.is_offboard));
    const btnLearn = document.getElementById("btnGateLearn");
    if (btnLearn) btnLearn.classList.toggle("active", Boolean(isLearningEnabled));

    // 5. Descending Motor Neurons
    const thrustHz = data.dn_thrust_hz || 0.0;
    const altHz = data.dn_alt_hz || 0.0;
    const yawLHz = data.dn_yaw_l_hz || 0.0;
    const yawRHz = data.dn_yaw_r_hz || 0.0;
    const odorConc = data.odor_conc || 1.0;

    setText("valDnp09", `${thrustHz.toFixed(1)} Hz`);
    setText("valDnAlt", `${altHz.toFixed(1)} Hz`);
    setText("valDna02", `${yawLHz.toFixed(0)} / ${yawRHz.toFixed(0)} Hz`);
    setText("valOdorPlume", `${odorConc.toFixed(2)}x`);

    setBar("barFillDnp09", thrustHz, 0, 100);
    setBar("barFillDnAlt", altHz, 0, 100);
    setBar("barFillDna02", 50 + ((yawRHz - yawLHz) / 40.0) * 50, 0, 100);
    setBar("barFillOdor", odorConc, 0, 5.0);

    // 6. Dopaminergic Plasticity Activity
    const pamHz = data.pam11_reward_hz || 0.0;
    const pplHz = data.ppl101_aversive_hz || 0.0;
    setText("pamHzVal", `${pamHz.toFixed(1)} Hz`);
    setText("pplHzVal", `${pplHz.toFixed(1)} Hz`);

    setBar("pamBar", pamHz, 0, 200.0);
    setBar("pplBar", pplHz, 0, 100.0);

    // 7. Synapses Tab Stats
    setText("synTotalSpikes", data.total_spikes ? data.total_spikes.toLocaleString() : "0");
    setText("synMeanRate", `${(data.mean_firing_rate_hz || 0).toFixed(1)} Hz`);
    setText("synKcRate", `${(data.kc_firing_hz || 0).toFixed(1)} Hz`);
    setText("synWeightDrift", (data.weight_drift || 0).toFixed(4));
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// =========================================================================
// Tab Navigation (Right Panel)
// =========================================================================
function switchTab(tabId) {
    ["mission", "pois", "synapses"].forEach(id => {
        const btn = document.getElementById(`tabNav-${id}`);
        const content = document.getElementById(`tabContent-${id}`);
        if (btn) btn.classList.toggle("active", id === tabId);
        if (content) content.classList.toggle("active", id === tabId);
    });

    if (tabId === "synapses" && brainVis) {
        setTimeout(() => {
            brainVis.onResize();
        }, 50);
    }
}

// =========================================================================
// Target Sliders & Presets
// =========================================================================
function onTargetSliderChange() {
    const sx = parseFloat(document.getElementById("sliderTargetX").value);
    const sy = parseFloat(document.getElementById("sliderTargetY").value);
    const sz = parseFloat(document.getElementById("sliderTargetZ").value);

    setText("valSliderX", `${sx >= 0 ? "+" : ""}${sx.toFixed(1)}m`);
    setText("valSliderY", `${sy >= 0 ? "+" : ""}${sy.toFixed(1)}m`);
    setText("valSliderZ", `${sz.toFixed(1)}m`);

    currentTarget = { x: sx, y: sy, z: sz };
    if (droneVis) droneVis.updateTarget([sx, sy, sz]);
    updateTargetUI(currentTarget);
    sendCmd("set_target", currentTarget);
}

function updateTargetUI(target) {
    setText("targetPosTag", `TARGET: X: ${target.x.toFixed(1)} Y: ${target.y.toFixed(1)} Z: ${target.z.toFixed(1)}m`);
    const slX = document.getElementById("sliderTargetX");
    const slY = document.getElementById("sliderTargetY");
    const slZ = document.getElementById("sliderTargetZ");
    if (slX) slX.value = target.x;
    if (slY) slY.value = target.y;
    if (slZ) slZ.value = target.z;
    setText("valSliderX", `${target.x >= 0 ? "+" : ""}${target.x.toFixed(1)}m`);
    setText("valSliderY", `${target.y >= 0 ? "+" : ""}${target.y.toFixed(1)}m`);
    setText("valSliderZ", `${target.z.toFixed(1)}m`);
}

function setPresetTarget(x, y, z) {
    currentTarget = { x, y, z };
    if (droneVis) droneVis.updateTarget([x, y, z]);
    updateTargetUI(currentTarget);
    sendCmd("set_target", currentTarget);
}

// =========================================================================
// 1000m POIs List
// =========================================================================
function populatePoiList() {
    const container = document.getElementById("poiListContainer");
    if (!container) return;

    container.innerHTML = "";
    NYC_LANDMARKS.forEach(lm => {
        const item = document.createElement("div");
        item.className = "poi-list-item";
        item.onclick = () => setPresetTarget(lm.x, lm.y, lm.z);
        item.innerHTML = `
            <div class="poi-info">
                <span class="poi-name">${lm.name}</span>
                <span class="poi-meta">${lm.cat} • ${lm.height}M • RATE: ${lm.rating}</span>
            </div>
            <span class="badge">FLY</span>
        `;
        container.appendChild(item);
    });
}

// =========================================================================
// Viewport & Camera Tools
// =========================================================================
function onAutoOrbitToggle(checked) {
    if (droneVis) droneVis.setAutoOrbit(checked);
}

function toggleFollowDrone() {
    if (droneVis) {
        const active = droneVis.toggleFollow();
        const btn = document.getElementById("btnFollowDrone");
        if (btn) btn.classList.toggle("active", active);
    }
}

function centerOnHome() {
    if (droneVis) droneVis.centerOnHome();
}

function resetDronePosition() {
    sendCmd("reset_pos");
    currentTarget = { x: 5.0, y: 0.0, z: 1.5 };
    if (droneVis) {
        droneVis.dronePos = [0.0, 0.0, 1.5];
        droneVis.droneVel = [0.0, 0.0, 0.0];
        droneVis.droneEuler = [0.0, 0.0, 0.0];
        droneVis.targetPos = [5.0, 0.0, 1.5];
        droneVis.resetTrail();
        droneVis.centerOnHome();
    }
    updateTargetUI(currentTarget);
}

function change3DEngine(engineType) {
    if (droneVis) droneVis.load3DTilesEngine(engineType);
}

// =========================================================================
// Pilot & Neuromorphic Commands
// =========================================================================
function sendCmd(command, value = null) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: "command",
            command: command,
            value: value
        }));
    }
}

function toggleLearning() {
    isLearningEnabled = !isLearningEnabled;
    sendCmd(isLearningEnabled ? "enable_learning" : "disable_learning");
    const btn = document.getElementById("btnLearning");
    if (btn) {
        btn.textContent = isLearningEnabled ? "FREEZE SYNAPSES" : "RESUME LEARNING";
        btn.classList.toggle("btn-secondary", isLearningEnabled);
        btn.classList.toggle("btn-primary", !isLearningEnabled);
    }
    const badge = document.getElementById("synLearningBadge");
    if (badge) {
        badge.textContent = isLearningEnabled ? "STDP ACTIVE" : "STDP FROZEN";
    }
}

// =========================================================================
// Google 3D API Key Modal
// =========================================================================
function openApiKeyModal() {
    const modal = document.getElementById("apiKeyModal");
    const input = document.getElementById("googleApiKeyInput");
    const saved = localStorage.getItem("google_maps_3d_api_key") || "";
    if (input) input.value = saved;
    if (modal) modal.style.display = "flex";
}

function closeApiKeyModal() {
    const modal = document.getElementById("apiKeyModal");
    if (modal) modal.style.display = "none";
}

function saveGoogleApiKey() {
    const input = document.getElementById("googleApiKeyInput");
    if (input) {
        const key = input.value.trim();
        if (key) {
            localStorage.setItem("google_maps_3d_api_key", key);
        } else {
            localStorage.removeItem("google_maps_3d_api_key");
        }
        if (droneVis) {
            droneVis.load3DTilesEngine("google_3d");
        }
    }
    closeApiKeyModal();
}

// =========================================================================
// Center Viewport Vertical Altitude Tape (Ladder Gauge with Dynamic Cursor)
// =========================================================================
const TAPE_STEP = 5;
const HUD_TAPE_TICK_HEIGHT = 32; // Center HUD step height (matches 32px CSS row)
const TAPE_MAX_ALT = 1000;
const TAPE_MIN_ALT = -50;

function initAltitudeTape() {
    const hudLadder = document.getElementById("hudAltitudeLadder");
    if (!hudLadder) return;

    hudLadder.innerHTML = "";
    for (let alt = TAPE_MAX_ALT; alt >= TAPE_MIN_ALT; alt -= TAPE_STEP) {
        const row = document.createElement("div");
        const isMajor = (alt % 10 === 0);
        row.className = `hud-tape-row ${isMajor ? "major" : ""}`;
        row.setAttribute("data-alt", alt);
        const sign = alt < 0 ? "-" : "";
        const absVal = Math.abs(alt);
        const strVal = `${sign}${absVal < 10 ? "0" + absVal : absVal}`;
        row.innerHTML = `<span class="hud-tape-num">${strVal}</span><span class="hud-tape-tick ${isMajor ? "major" : ""}"></span>`;
        hudLadder.appendChild(row);
    }

    updateAltitudeTape(1.5);
}

function updateAltitudeTape(alt) {
    const hudLadder = document.getElementById("hudAltitudeLadder");
    if (hudLadder) {
        const hudTargetOffset = -((TAPE_MAX_ALT - alt) / TAPE_STEP) * HUD_TAPE_TICK_HEIGHT;
        hudLadder.style.transform = `translateY(${hudTargetOffset.toFixed(2)}px)`;
    }
}
