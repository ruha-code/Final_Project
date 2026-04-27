import asyncio
import logging
from typing import Any, Callable, Dict, List

from app.core.cache import CacheKeys, cache_delete, cache_delete_prefix

logger = logging.getLogger("clinic.events")

_handlers: Dict[str, List[Callable]] = {}


def register(event: str, handler: Callable) -> None:
    _handlers.setdefault(event, []).append(handler)


async def publish(event: str, payload: dict) -> None:
    for handler in _handlers.get(event, []):
        try:
            if asyncio.iscoroutinefunction(handler):
                await handler(payload)
            else:
                handler(payload)
        except Exception as exc:
            logger.error(f"[EVENT BUS] Handler {handler.__name__} failed for '{event}': {exc}")



async def _on_appointment_created(payload: dict) -> None:
    from app.core.email import send_appointment_confirmation, send_new_appointment_alert

    time_str = payload.get("appointment_time", "")
    atype = payload.get("appointment_type", "")

    await send_appointment_confirmation(
        patient_email=payload["patient_email"],
        patient_name=payload["patient_name"],
        doctor_name=payload["doctor_name"],
        appointment_time=time_str,
        appointment_type=atype,
        reason=payload.get("reason"),
    )
    await send_new_appointment_alert(
        doctor_email=payload["doctor_email"],
        doctor_name=payload["doctor_name"],
        patient_name=payload["patient_name"],
        appointment_time=time_str,
        appointment_type=atype,
        reason=payload.get("reason"),
    )


async def _on_appointment_cancelled(payload: dict) -> None:
    from app.core.email import send_cancellation_notice

    time_str = payload.get("appointment_time", "")
    cancelled_by = payload.get("cancelled_by_name", "a party")

    await send_cancellation_notice(
        email=payload["patient_email"],
        recipient_name=payload["patient_name"],
        other_party_name=payload["doctor_name"],
        appointment_time=time_str,
        cancelled_by=cancelled_by,
    )
    await send_cancellation_notice(
        email=payload["doctor_email"],
        recipient_name=f"Dr. {payload['doctor_name']}",
        other_party_name=payload["patient_name"],
        appointment_time=time_str,
        cancelled_by=cancelled_by,
    )


async def _on_appointment_completed(payload: dict) -> None:
    from app.core.email import send_appointment_completed

    await send_appointment_completed(
        patient_email=payload["patient_email"],
        patient_name=payload["patient_name"],
        doctor_name=payload["doctor_name"],
        appointment_time=payload.get("appointment_time", ""),
        notes=payload.get("notes"),
    )


async def _on_message_sent(payload: dict) -> None:
    from app.core.email import send_new_message_notification

    await send_new_message_notification(
        recipient_email=payload["recipient_email"],
        recipient_name=payload["recipient_name"],
        sender_name=payload["sender_name"],
    )


async def _invalidate_analytics_cache(payload: dict) -> None:
    await cache_delete(CacheKeys.ANALYTICS_DEMAND)
    await cache_delete(CacheKeys.ANALYTICS_DOCTORS)
    await cache_delete_prefix("analytics:region:")
    logger.debug("[CACHE] Analytics cache cleared")


async def _on_notifications_refresh(payload: dict) -> None:
    from app.modules.notifications.ws import notification_ws_manager

    user_ids = payload.get("user_ids")
    if isinstance(user_ids, list):
        filtered_user_ids: list[int] = []
        for user_id in user_ids:
            try:
                filtered_user_ids.append(int(user_id))
            except (TypeError, ValueError):
                continue
        await notification_ws_manager.push_refresh(filtered_user_ids or None)
        return
    await notification_ws_manager.push_refresh()


def setup() -> None:
    _handlers.clear()
    register("appointment_created", _on_appointment_created)
    register("appointment_created", _invalidate_analytics_cache)
    register("appointment_cancelled", _on_appointment_cancelled)
    register("appointment_cancelled", _invalidate_analytics_cache)
    register("appointment_completed", _on_appointment_completed)
    register("appointment_completed", _invalidate_analytics_cache)  
    register("message_sent", _on_message_sent)
    register("notifications_refresh", _on_notifications_refresh)
