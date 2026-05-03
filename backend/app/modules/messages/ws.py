import logging
from fastapi import WebSocket

logger = logging.getLogger("clinic.ws")


class ConnectionManager:
    def __init__(self):
        self._rooms: dict[int, dict[int, list[WebSocket]]] = {}

    async def connect(self, conv_id: int, user_id: int, ws: WebSocket) -> None:
        await ws.accept()
        self._rooms.setdefault(conv_id, {}).setdefault(user_id, []).append(ws)
        logger.info(f"[WS] user={user_id} joined conv={conv_id}")

    def disconnect(self, conv_id: int, user_id: int, ws: WebSocket | None = None) -> None:
        room = self._rooms.get(conv_id, {})
        if ws is None:
            room.pop(user_id, None)
        else:
            sockets = room.get(user_id, [])
            room[user_id] = [item for item in sockets if item is not ws]
            if not room[user_id]:
                room.pop(user_id, None)
        if not room:
            self._rooms.pop(conv_id, None)
        logger.info(f"[WS] user={user_id} left conv={conv_id}")

    def is_online(self, conv_id: int, user_id: int) -> bool:
        """True if the user has an active WebSocket in this conversation."""
        return user_id in self._rooms.get(conv_id, {})

    def online_user_ids(self, conv_id: int) -> list[int]:
        """Return user ids that currently have at least one socket in the room."""
        return list(self._rooms.get(conv_id, {}).keys())

    async def broadcast(
        self,
        conv_id: int,
        payload: dict,
        exclude_user_id: int | None = None,
    ) -> None:
        """Send JSON payload to all connected users in the conversation."""
        for uid, sockets in list(self._rooms.get(conv_id, {}).items()):
            if uid == exclude_user_id:
                continue
            for ws in list(sockets):
                try:
                    await ws.send_json(payload)
                except Exception as exc:
                    logger.warning(f"[WS] Failed to send to user={uid}: {exc}")
                    self.disconnect(conv_id, uid, ws)

    async def send_to(self, conv_id: int, user_id: int, payload: dict) -> None:
        """Send JSON payload to one specific user."""
        for ws in list(self._rooms.get(conv_id, {}).get(user_id, [])):
            try:
                await ws.send_json(payload)
            except Exception as exc:
                logger.warning(f"[WS] Failed to send to user={user_id}: {exc}")
                self.disconnect(conv_id, user_id, ws)


manager = ConnectionManager()
