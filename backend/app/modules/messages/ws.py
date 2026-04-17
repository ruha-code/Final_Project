import logging
from fastapi import WebSocket

logger = logging.getLogger("clinic.ws")


class ConnectionManager:
    def __init__(self):
        self._rooms: dict[int, dict[int, WebSocket]] = {}

    async def connect(self, conv_id: int, user_id: int, ws: WebSocket) -> None:
        await ws.accept()
        self._rooms.setdefault(conv_id, {})[user_id] = ws
        logger.info(f"[WS] user={user_id} joined conv={conv_id}")

    def disconnect(self, conv_id: int, user_id: int) -> None:
        room = self._rooms.get(conv_id, {})
        room.pop(user_id, None)
        if not room:
            self._rooms.pop(conv_id, None)
        logger.info(f"[WS] user={user_id} left conv={conv_id}")

    def is_online(self, conv_id: int, user_id: int) -> bool:
        """True if the user has an active WebSocket in this conversation."""
        return user_id in self._rooms.get(conv_id, {})

    async def broadcast(
        self,
        conv_id: int,
        payload: dict,
        exclude_user_id: int | None = None,
    ) -> None:
        """Send JSON payload to all connected users in the conversation."""
        for uid, ws in list(self._rooms.get(conv_id, {}).items()):
            if uid == exclude_user_id:
                continue
            try:
                await ws.send_json(payload)
            except Exception as exc:
                logger.warning(f"[WS] Failed to send to user={uid}: {exc}")
                self.disconnect(conv_id, uid)

    async def send_to(self, conv_id: int, user_id: int, payload: dict) -> None:
        """Send JSON payload to one specific user."""
        ws = self._rooms.get(conv_id, {}).get(user_id)
        if ws:
            try:
                await ws.send_json(payload)
            except Exception as exc:
                logger.warning(f"[WS] Failed to send to user={user_id}: {exc}")
                self.disconnect(conv_id, user_id)


manager = ConnectionManager()
