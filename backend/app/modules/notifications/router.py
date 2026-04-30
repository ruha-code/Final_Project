from datetime import date, datetime, time, timedelta, timezone

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from pydantic import ValidationError
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.exceptions import ValidationException
from app.core.security import decode_access_token
from app.core.cache import is_token_blacklisted
from app.modules.appointments.models import Appointment, AppointmentStatus
from app.modules.auth.models import User, UserRole
from app.modules.calendar.models import CalendarEvent
from app.modules.doctors.models import Doctor
from app.modules.messages.models import Conversation, Message
from app.modules.notifications.models import NotificationPreference, NotificationRead
from app.modules.notifications.schemas import (
    NotificationItem,
    NotificationLevel,
    NotificationPreferencesResponse,
    NotificationPreferencesUpdate,
    NotificationsResponse,
    NotificationType,
)
from app.modules.notifications.ws import notification_ws_manager
from app.modules.patients.models import Patient

router = APIRouter()


def _format_dt(value: datetime) -> str:
    return value.astimezone(timezone.utc).strftime("%d %b, %H:%M UTC")


def _available_notification_types_for_role(role: UserRole) -> list[NotificationType]:
    if role == UserRole.ADMIN:
        return [
            NotificationType.APPOINTMENT,
            NotificationType.CALENDAR,
        ]
    if role == UserRole.DOCTOR:
        return [
            NotificationType.MESSAGE,
            NotificationType.APPOINTMENT,
        ]
    return [NotificationType.MESSAGE, NotificationType.APPOINTMENT]


def _allowed_preference_fields_for_role(role: UserRole) -> set[str]:
    fields = {
        "mute_appointment_notifications",
        "appointment_reminder_hours",
    }
    if role in {UserRole.DOCTOR, UserRole.PATIENT}:
        fields.add("mute_message_notifications")
    if role == UserRole.ADMIN:
        fields.add("mute_calendar_notifications")
    return fields


async def _get_or_create_preferences(user_id: int, db: AsyncSession) -> NotificationPreference:
    result = await db.execute(
        select(NotificationPreference).where(NotificationPreference.user_id == user_id)
    )
    preference = result.scalar_one_or_none()
    if preference is not None:
        return preference

    preference = NotificationPreference(user_id=user_id)
    db.add(preference)
    await db.commit()
    await db.refresh(preference)
    return preference


def _notification_muted(
    notification_type: NotificationType,
    preference: NotificationPreference,
) -> bool:
    if notification_type == NotificationType.MESSAGE:
        return preference.mute_message_notifications
    if notification_type == NotificationType.APPOINTMENT:
        return preference.mute_appointment_notifications
    if notification_type == NotificationType.CALENDAR:
        return preference.mute_calendar_notifications
    return False


def _append_notification(
    items: list[dict],
    preference: NotificationPreference,
    *,
    key: str,
    notification_type: NotificationType,
    title: str,
    message: str,
    level: NotificationLevel,
    route: str,
    created_at: datetime,
) -> None:
    if _notification_muted(notification_type, preference):
        return
    items.append(
        {
            "key": key,
            "notification_type": notification_type,
            "title": title,
            "message": message,
            "level": level,
            "route": route,
            "created_at": created_at,
        }
    )


async def _build_notifications_for_user(
    current_user: User,
    db: AsyncSession,
) -> list[dict]:
    now_utc = datetime.now(timezone.utc)
    items: list[dict] = []
    preference = await _get_or_create_preferences(current_user.id, db)
    reminder_window = timedelta(hours=max(1, min(168, preference.appointment_reminder_hours)))

    if current_user.role == UserRole.PATIENT:
        result = await db.execute(select(Patient).where(Patient.user_id == current_user.id))
        patient = result.scalar_one_or_none()

        if patient:
            unread_result = await db.execute(
                select(func.count(Message.id), func.max(Message.id))
                .join(Conversation, Message.conversation_id == Conversation.id)
                .where(
                    Conversation.patient_id == patient.id,
                    Message.sender_id != current_user.id,
                    Message.is_read == False,
                )
            )
            row = unread_result.one()
            unread_count = int(row[0] or 0)
            latest_msg_id = int(row[1] or 0)
            if unread_count > 0:
                _append_notification(
                    items,
                    preference,
                    key=f"messages-unread-{latest_msg_id}",
                    notification_type=NotificationType.MESSAGE,
                    title="Unread messages",
                    message=f"You have {unread_count} unread message(s).",
                    level=NotificationLevel.INFO,
                    route="/messages",
                    created_at=now_utc,
                )

            appointments_result = await db.execute(
                select(Appointment, User.full_name)
                .join(Doctor, Doctor.id == Appointment.doctor_id)
                .join(User, User.id == Doctor.user_id)
                .where(
                    Appointment.patient_id == patient.id,
                    Appointment.status.in_(
                        [AppointmentStatus.SCHEDULED, AppointmentStatus.ONGOING]
                    ),
                    Appointment.appointment_time >= now_utc,
                    Appointment.appointment_time <= now_utc + reminder_window,
                )
                .order_by(Appointment.appointment_time.asc())
                .limit(5)
            )
            for appointment, doctor_name in appointments_result.all():
                _append_notification(
                    items,
                    preference,
                    key=f"appointment-{appointment.id}",
                    notification_type=NotificationType.APPOINTMENT,
                    title="Upcoming appointment",
                    message=f"With Dr. {doctor_name} on {_format_dt(appointment.appointment_time)}.",
                    level=NotificationLevel.WARNING,
                    route="/appointments",
                    created_at=appointment.appointment_time,
                )

    elif current_user.role == UserRole.DOCTOR:
        result = await db.execute(select(Doctor).where(Doctor.user_id == current_user.id))
        doctor = result.scalar_one_or_none()

        if doctor:
            unread_result = await db.execute(
                select(func.count(Message.id), func.max(Message.id))
                .join(Conversation, Message.conversation_id == Conversation.id)
                .where(
                    Conversation.doctor_id == doctor.id,
                    Message.sender_id != current_user.id,
                    Message.is_read == False,
                )
            )
            row = unread_result.one()
            unread_count = int(row[0] or 0)
            latest_msg_id = int(row[1] or 0)
            if unread_count > 0:
                _append_notification(
                    items,
                    preference,
                    key=f"messages-unread-{latest_msg_id}",
                    notification_type=NotificationType.MESSAGE,
                    title="Unread messages",
                    message=f"You have {unread_count} unread patient message(s).",
                    level=NotificationLevel.INFO,
                    route="/messages",
                    created_at=now_utc,
                )

            appointments_result = await db.execute(
                select(Appointment, User.full_name)
                .join(Patient, Patient.id == Appointment.patient_id)
                .join(User, User.id == Patient.user_id)
                .where(
                    Appointment.doctor_id == doctor.id,
                    Appointment.status.in_(
                        [AppointmentStatus.SCHEDULED, AppointmentStatus.ONGOING]
                    ),
                    Appointment.appointment_time >= now_utc,
                    Appointment.appointment_time <= now_utc + reminder_window,
                )
                .order_by(Appointment.appointment_time.asc())
                .limit(5)
            )
            for appointment, patient_name in appointments_result.all():
                _append_notification(
                    items,
                    preference,
                    key=f"appointment-{appointment.id}",
                    notification_type=NotificationType.APPOINTMENT,
                    title="Patient appointment",
                    message=f"{patient_name} at {_format_dt(appointment.appointment_time)}.",
                    level=NotificationLevel.WARNING,
                    route="/appointments",
                    created_at=appointment.appointment_time,
                )

    elif current_user.role == UserRole.ADMIN:
        today = date.today()
        tomorrow = today + timedelta(days=1)
        appointments_today_result = await db.execute(
            select(func.count(Appointment.id)).where(
                Appointment.status.in_(
                    [AppointmentStatus.SCHEDULED, AppointmentStatus.ONGOING]
                ),
                Appointment.appointment_time
                >= datetime.combine(today, time.min, tzinfo=timezone.utc),
                Appointment.appointment_time
                < datetime.combine(tomorrow, time.min, tzinfo=timezone.utc),
            )
        )
        appointments_today = int(appointments_today_result.scalar() or 0)
        if appointments_today > 0:
            _append_notification(
                items,
                preference,
                key=f"appointments-today-{today.isoformat()}-{appointments_today}",
                notification_type=NotificationType.APPOINTMENT,
                title="Today's appointments",
                message=f"{appointments_today} appointment(s) are active today.",
                level=NotificationLevel.WARNING,
                route="/appointments",
                created_at=now_utc,
            )

        event_result = await db.execute(
            select(CalendarEvent)
            .where(
                CalendarEvent.event_date >= today,
                CalendarEvent.event_date <= today + timedelta(days=3),
            )
            .order_by(CalendarEvent.event_date.asc(), CalendarEvent.event_time.asc())
            .limit(1)
        )
        next_event = event_result.scalar_one_or_none()
        if next_event:
            event_dt = datetime.combine(
                next_event.event_date,
                next_event.event_time or time.min,
                tzinfo=timezone.utc,
            )
            _append_notification(
                items,
                preference,
                key=f"calendar-event-{next_event.id}",
                notification_type=NotificationType.CALENDAR,
                title="Upcoming calendar event",
                message=f"{next_event.title} on {next_event.event_date.isoformat()}.",
                level=NotificationLevel.INFO,
                route="/calendar",
                created_at=event_dt,
            )

    return items


@router.get("", response_model=NotificationsResponse, summary="Get user notifications")
async def get_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    items_data = await _build_notifications_for_user(current_user, db)
    keys = [item["key"] for item in items_data]

    read_keys: set[str] = set()
    if keys:
        read_result = await db.execute(
            select(NotificationRead.notification_key).where(
                NotificationRead.user_id == current_user.id,
                NotificationRead.notification_key.in_(keys),
            )
        )
        read_keys = set(read_result.scalars().all())

    items = [
        NotificationItem(
            key=item["key"],
            notification_type=item["notification_type"],
            title=item["title"],
            message=item["message"],
            level=item["level"],
            route=item["route"],
            created_at=item["created_at"],
            is_read=item["key"] in read_keys,
        )
        for item in items_data
    ]
    items.sort(key=lambda item: item.created_at, reverse=True)
    unread_count = sum(1 for item in items if not item.is_read)

    return NotificationsResponse(unread_count=unread_count, items=items)


@router.put("/{notification_key}/read", summary="Mark notification as read")
async def mark_notification_read(
    notification_key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(NotificationRead).where(
            NotificationRead.user_id == current_user.id,
            NotificationRead.notification_key == notification_key,
        )
    )
    existing = result.scalar_one_or_none()
    if existing is None:
        db.add(
            NotificationRead(
                user_id=current_user.id,
                notification_key=notification_key,
                read_at=datetime.now(timezone.utc),
            )
        )
    else:
        existing.read_at = datetime.now(timezone.utc)
    await db.commit()
    await notification_ws_manager.push_refresh([current_user.id])
    return {"message": "Notification marked as read"}


@router.put("/read-all", summary="Mark all current notifications as read")
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    items_data = await _build_notifications_for_user(current_user, db)
    keys = [item["key"] for item in items_data]
    if not keys:
        return {"message": "No notifications to mark as read", "marked": 0}

    existing_result = await db.execute(
        select(NotificationRead.notification_key).where(
            NotificationRead.user_id == current_user.id,
            NotificationRead.notification_key.in_(keys),
        )
    )
    existing_keys = set(existing_result.scalars().all())

    created = 0
    now_utc = datetime.now(timezone.utc)
    for key in keys:
        if key in existing_keys:
            continue
        db.add(
            NotificationRead(
                user_id=current_user.id,
                notification_key=key,
                read_at=now_utc,
            )
        )
        created += 1

    await db.commit()
    await notification_ws_manager.push_refresh([current_user.id])
    return {"message": "Notifications marked as read", "marked": created}


@router.get(
    "/preferences",
    response_model=NotificationPreferencesResponse,
    summary="Get notification preferences",
)
async def get_notification_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    preference = await _get_or_create_preferences(current_user.id, db)
    available_types = _available_notification_types_for_role(current_user.role)
    return NotificationPreferencesResponse(
        mute_message_notifications=preference.mute_message_notifications,
        mute_appointment_notifications=preference.mute_appointment_notifications,
        mute_calendar_notifications=preference.mute_calendar_notifications,
        appointment_reminder_hours=preference.appointment_reminder_hours,
        available_notification_types=available_types,
    )


@router.put(
    "/preferences",
    response_model=NotificationPreferencesResponse,
    summary="Update notification preferences",
)
async def update_notification_preferences(
    dto: NotificationPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    preference = await _get_or_create_preferences(current_user.id, db)
    updates = dto.model_dump(exclude_none=True)
    allowed_fields = _allowed_preference_fields_for_role(current_user.role)

    disallowed_fields = [field for field in updates if field not in allowed_fields]
    if disallowed_fields:
        raise ValidationException(
            "You cannot update these notification settings: "
            + ", ".join(sorted(disallowed_fields))
        )

    if "appointment_reminder_hours" in updates:
        reminder_hours = updates["appointment_reminder_hours"]
        if reminder_hours < 1 or reminder_hours > 168:
            raise ValidationException("appointment_reminder_hours must be between 1 and 168")

    for field, value in updates.items():
        setattr(preference, field, value)

    await db.commit()
    await db.refresh(preference)

    await notification_ws_manager.push_refresh([current_user.id])
    available_types = _available_notification_types_for_role(current_user.role)

    return NotificationPreferencesResponse(
        mute_message_notifications=preference.mute_message_notifications,
        mute_appointment_notifications=preference.mute_appointment_notifications,
        mute_calendar_notifications=preference.mute_calendar_notifications,
        appointment_reminder_hours=preference.appointment_reminder_hours,
        available_notification_types=available_types,
    )


@router.websocket("/ws")
async def notifications_websocket(
    websocket: WebSocket,
    token: str = Query(..., description="JWT access token"),
    db: AsyncSession = Depends(get_db),
):
    payload = decode_access_token(token)
    if not payload or payload.get("type") != "access":
        await websocket.close(code=4001, reason="Invalid token")
        return

    jti = payload.get("jti")
    if jti and await is_token_blacklisted(jti):
        await websocket.close(code=4001, reason="Token revoked")
        return

    user_id = payload.get("user_id")
    if user_id is None:
        await websocket.close(code=4001, reason="Invalid token payload")
        return

    user = await db.get(User, user_id)
    if not user or not user.is_active:
        await websocket.close(code=4001, reason="User not found or inactive")
        return

    await notification_ws_manager.connect(user.id, websocket)
    await notification_ws_manager.send_to_user(user.id, {"event": "connected"})

    try:
        while True:
            message = await websocket.receive_json()
            action = message.get("action")
            if action == "ping":
                await notification_ws_manager.send_to_user(user.id, {"event": "pong"})
            elif action == "refresh":
                await notification_ws_manager.send_to_user(
                    user.id, {"event": "notifications_refresh"}
                )
    except (WebSocketDisconnect, ValidationError):
        await notification_ws_manager.disconnect(user.id, websocket)
    except Exception:
        await notification_ws_manager.disconnect(user.id, websocket)
