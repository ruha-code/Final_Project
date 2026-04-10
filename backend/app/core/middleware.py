import logging
import time
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.logging import request_id_var

logger = logging.getLogger("clinic.http")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        rid = str(uuid.uuid4())[:8]
        request_id_var.set(rid)
        request.state.request_id = rid

        start = time.perf_counter()
        logger.info(f"→ {request.method} {request.url.path}")

        try:
            response = await call_next(request)
        except Exception:
            logger.exception(f"Unhandled error on {request.method} {request.url.path}")
            raise

        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.info(
            f"← {request.method} {request.url.path} "
            f"status={response.status_code} "
            f"duration={elapsed_ms:.1f}ms"
        )
        response.headers["X-Request-ID"] = rid
        return response
