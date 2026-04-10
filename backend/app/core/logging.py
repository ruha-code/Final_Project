import logging
import sys
import uuid
from contextvars import ContextVar
from datetime import datetime, timezone

request_id_var: ContextVar[str] = ContextVar("request_id", default="")


def setup_logging() -> None:
    """Call once at app startup."""
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(LogFormatter())

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(logging.INFO)

    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


class LogFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        rid = request_id_var.get("")
        return (
            f"{datetime.now(timezone.utc).isoformat()} "
            f"[{record.levelname}] "
            f"[req={rid}] "
            f"{record.name}: {record.getMessage()}"
        )
