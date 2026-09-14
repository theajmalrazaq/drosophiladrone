"""
Async Web & WebSocket Bridge Server for DrosophilaDrone.

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
logger = logging.getLogger("DrosophilaDroneServer")


@web.middleware
async def no_cache_middleware(request, handler):
    response = await handler(request)
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


class BridgeServer:
    """
    HTTP Web Server + WebSocket Streamer for DrosophilaDrone Frontend.
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
            "target": [5.0, 0.0, 1.5],
            "sugar_intensity": 1.0,
            "active_somas": [],
            "dopamine": {
                "pam11_hz": 0.0,
                "ppl101_hz": 0.0,
                "reward_signal": 0.0,
                "mean_kc_rate": 0.0,
                "total_spikes": 0,
                "weight_drift": 0.0
            }
        }
        self.command_callback = None
        self.app = web.Application(middlewares=[no_cache_middleware])
        self._setup_routes()

    def _setup_routes(self):
        self.app.router.add_get("/", self.handle_index)
        self.app.router.add_static("/static/", FRONTEND_DIR, name="static")
        self.app.router.add_get("/ws", self.handle_websocket)
        self.app.router.add_get("/api/telemetry", self.handle_api_telemetry)

    async def handle_index(self, request):
        index_file = FRONTEND_DIR / "index.html"
        if index_file.exists():
            return web.FileResponse(index_file)
        return web.Response(text="<h1>DrosophilaDrone Frontend</h1>", content_type="text/html")

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
        print(f"  🪰 DrosophilaDrone 3D Web Dashboard Live at: http://localhost:{self.port}")
        print(f"===========================================================\n")
