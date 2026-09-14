"""
Async Web & WebSocket Bridge Server for FruitDrone.

Serves the frontend 3D dashboard on http://localhost:8080 and streams real-time
ROS 2 / Drosophila Connectome telemetry over WebSockets.
"""

import asyncio
import json
import logging
from pathlib import Path
from typing import Any, Dict, Set
from aiohttp import web

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
logger = logging.getLogger("FruitDroneServer")


@web.middleware
async def no_cache_middleware(request, handler):
    response = await handler(request)
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


class BridgeServer:
    """
    HTTP Web Server + WebSocket Streamer for FruitDrone Frontend.
    """
    def __init__(self, host: str = "0.0.0.0", port: int = 8080):
        self.host = host
        self.port = port
        self.connected_clients: Set[Any] = set()
        self.loop = None
        
        self.latest_telemetry: Dict[str, Any] = {
            "status": "FLYING",
            "is_armed": True,
            "is_offboard": True,
            "position": [0.0, 0.0, 1.5],
            "velocity": [0.0, 0.0, 0.0],
            "euler": [0.0, 0.0, 0.0],
            "sim_time_ms": 0.0,
            "total_spikes": 0,
            "mean_firing_rate_hz": 0.0,
            "pam11_reward_hz": 0.0,
            "ppl101_aversive_hz": 0.0,
            "kc_firing_hz": 0.0,
            "lptc_hs_hz": 0.0,
            "lptc_vs_hz": 0.0,
            "cmd_vx": 0.0,
            "cmd_vy": 0.0,
            "cmd_vz": 0.0,
            "cmd_yaw_rate": 0.0,
            "weight_drift": 0.0,
            "learning_enabled": True,
            "active_somas": [],
        }
        
        self.command_callback = None
        self.app = web.Application(middlewares=[no_cache_middleware])
        self.setup_routes()

    def setup_routes(self):
        if FRONTEND_DIR.exists():
            self.app.router.add_static("/static/", path=FRONTEND_DIR, name="static")
            self.app.router.add_get("/", self.handle_index)
        self.app.router.add_get("/ws", self.handle_websocket)
        self.app.router.add_get("/api/telemetry", self.handle_api_telemetry)

    async def handle_index(self, request):
        index_file = FRONTEND_DIR / "index.html"
        if index_file.exists():
            return web.FileResponse(index_file)
        return web.Response(text="<h1>FruitDrone Frontend</h1>", content_type="text/html")

    async def handle_api_telemetry(self, request):
        return web.json_response(self.latest_telemetry)

    async def handle_websocket(self, request):
        ws = web.WebSocketResponse()
        await ws.prepare(request)
        self.connected_clients.add(ws)
        await ws.send_str(json.dumps({"type": "telemetry", "data": self.latest_telemetry}))
        
        try:
            async for msg in ws:
                if msg.type == web.WSMsgType.TEXT:
                    try:
                        payload = json.loads(msg.data)
                        if payload.get("type") == "command" and self.command_callback:
                            self.command_callback(payload.get("command"), payload.get("value"))
                    except Exception as e:
                        logger.error(f"WebSocket parse error: {e}")
        finally:
            self.connected_clients.discard(ws)
        return ws

    def broadcast_telemetry(self, data: Dict[str, Any]):
        """Thread-safe broadcast to all connected WebSocket clients."""
        self.latest_telemetry.update(data)
        if not self.connected_clients or not self.loop:
            return
        msg = json.dumps({"type": "telemetry", "data": self.latest_telemetry})
        for ws in list(self.connected_clients):
            if not ws.closed:
                try:
                    asyncio.run_coroutine_threadsafe(ws.send_str(msg), self.loop)
                except Exception:
                    pass

    async def start(self):
        self.loop = asyncio.get_running_loop()
        runner = web.AppRunner(self.app)
        await runner.setup()
        site = web.TCPSite(runner, self.host, self.port)
        await site.start()
        print(f"\n===========================================================")
        print(f"  🪰 FruitDrone 3D Web Dashboard Live at: http://localhost:{self.port}")
        print(f"===========================================================\n")
