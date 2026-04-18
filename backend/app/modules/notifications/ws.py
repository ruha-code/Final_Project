import asyncio
from collections import defaultdict
from typing import Any

from fastapi import WebSocket


class NotificationWSManager:
    def __init__(self):
        self._connections: dict[int, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections[user_id].add(websocket)

    async def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        async with self._lock:
            sockets = self._connections.get(user_id)
            if not sockets:
                return
            sockets.discard(websocket)
            if not sockets:
                self._connections.pop(user_id, None)

    async def send_to_user(self, user_id: int, payload: dict[str, Any]) -> None:
        async with self._lock:
            sockets = list(self._connections.get(user_id, set()))
        stale: list[WebSocket] = []
        for websocket in sockets:
            try:
                await websocket.send_json(payload)
            except Exception:
                stale.append(websocket)
        if stale:
            async with self._lock:
                current = self._connections.get(user_id, set())
                for websocket in stale:
                    current.discard(websocket)
                if not current:
                    self._connections.pop(user_id, None)

    async def broadcast(self, payload: dict[str, Any]) -> None:
        async with self._lock:
            user_ids = list(self._connections.keys())
        for user_id in user_ids:
            await self.send_to_user(user_id, payload)

    async def push_refresh(self, user_ids: list[int] | None = None) -> None:
        payload = {"event": "notifications_refresh"}
        if user_ids:
            for user_id in set(user_ids):
                await self.send_to_user(user_id, payload)
            return
        await self.broadcast(payload)


notification_ws_manager = NotificationWSManager()

