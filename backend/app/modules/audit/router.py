from datetime import date, datetime, time, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import desc, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import RoleChecker
from app.core.pagination import paginate
from app.modules.audit.models import AuditLog
from app.modules.audit.schemas import AuditLogResponse
from app.modules.auth.models import User


router = APIRouter()


class Actions:
    REGISTER = "REGISTER"
    LOGIN = "LOGIN"
    SETUP_PATIENT_PROFILE = "SETUP_PATIENT_PROFILE"
    UPDATE_PATIENT_PROFILE = "UPDATE_PATIENT_PROFILE"
    SETUP_DOCTOR_PROFILE = "SETUP_DOCTOR_PROFILE"
    UPDATE_DOCTOR_PROFILE = "UPDATE_DOCTOR_PROFILE"
    SET_DOCTOR_SCHEDULE = "SET_DOCTOR_SCHEDULE"
    BOOK_APPOINTMENT = "BOOK_APPOINTMENT"
    CANCEL_APPOINTMENT = "CANCEL_APPOINTMENT"
    COMPLETE_APPOINTMENT = "COMPLETE_APPOINTMENT"
    DEACTIVATE_USER = "DEACTIVATE_USER"
    ACTIVATE_USER = "ACTIVATE_USER"
    DELETE_USER = "DELETE_USER"
    UPDATE_USER = "UPDATE_USER"
    UPDATE_PATIENT = "UPDATE_PATIENT"
    DELETE_PATIENT = "DELETE_PATIENT"
    UPDATE_DOCTOR = "UPDATE_DOCTOR"
    DELETE_DOCTOR = "DELETE_DOCTOR"
    DELETE_APPOINTMENT = "DELETE_APPOINTMENT"
    INVENTORY_ADD = "INVENTORY_ADD"
    INVENTORY_UPDATE = "INVENTORY_UPDATE"
    INVENTORY_REMOVE = "INVENTORY_REMOVE"
    INVENTORY_LOW = "INVENTORY_LOW"
    VIEW_AUDIT_LOGS = "VIEW_AUDIT_LOGS"
    VIEW_ANALYTICS = "VIEW_ANALYTICS"


ACTION_LABELS = {
    Actions.REGISTER: "Registered",
    Actions.LOGIN: "Logged in",
    "LOGOUT": "Logged out",
    Actions.SETUP_PATIENT_PROFILE: "Created patient profile",
    Actions.UPDATE_PATIENT_PROFILE: "Updated patient profile",
    Actions.SETUP_DOCTOR_PROFILE: "Created doctor profile",
    Actions.UPDATE_DOCTOR_PROFILE: "Updated doctor profile",
    Actions.SET_DOCTOR_SCHEDULE: "Updated doctor schedule",
    Actions.BOOK_APPOINTMENT: "Booked appointment",
    Actions.CANCEL_APPOINTMENT: "Cancelled appointment",
    Actions.COMPLETE_APPOINTMENT: "Completed appointment",
    Actions.DEACTIVATE_USER: "Deactivated user",
    Actions.ACTIVATE_USER: "Activated user",
    Actions.DELETE_USER: "Deleted user",
    Actions.UPDATE_USER: "Updated user",
    Actions.UPDATE_PATIENT: "Updated patient",
    Actions.DELETE_PATIENT: "Deleted patient",
    Actions.UPDATE_DOCTOR: "Updated doctor",
    Actions.DELETE_DOCTOR: "Deleted doctor",
    Actions.DELETE_APPOINTMENT: "Deleted appointment",
    Actions.INVENTORY_ADD: "Added inventory item",
    Actions.INVENTORY_UPDATE: "Updated inventory item",
    Actions.INVENTORY_REMOVE: "Removed inventory item",
    Actions.INVENTORY_LOW: "Inventory low warning",
    Actions.VIEW_AUDIT_LOGS: "Viewed audit logs",
    Actions.VIEW_ANALYTICS: "Viewed analytics",
}

NOISY_VIEW_ACTIONS = {Actions.VIEW_AUDIT_LOGS}
ACTION_CANONICAL_MAP = {
    Actions.DELETE_DOCTOR: Actions.DELETE_USER,
    Actions.DELETE_PATIENT: Actions.DELETE_USER,
}
ACTION_FILTER_GROUPS = {
    Actions.DELETE_USER: {
        Actions.DELETE_USER,
        Actions.DELETE_DOCTOR,
        Actions.DELETE_PATIENT,
    },
}


def _humanize_action(action: str) -> str:
    if action in ACTION_LABELS:
        return ACTION_LABELS[action]
    return action.replace("_", " ").strip().title()


def _canonical_action(action: str) -> str:
    return ACTION_CANONICAL_MAP.get(action, action)


def _expand_action_filter(action: str) -> set[str]:
    return ACTION_FILTER_GROUPS.get(action, {action})


def _format_entity_label(entity_type: Optional[str], entity_id: Optional[int]) -> str:
    if entity_type and entity_id is not None:
        return f"{entity_type} #{entity_id}"
    if entity_type:
        return entity_type
    if entity_id is not None:
        return f"Entity #{entity_id}"
    return "-"


async def log(
    db: AsyncSession,
    user_id: int,
    action: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    extra_data: Optional[dict] = None,
    request: Optional[Request] = None,
) -> None:
    ip = None
    user_agent = None
    if request:
        ip = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")

    entry = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        extra_data=extra_data,
        ip_address=ip,
        user_agent=user_agent,
    )
    db.add(entry)
    await db.commit()


@router.get("/audit-logs")
async def get_audit_logs(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    user_id: Optional[int] = Query(default=None),
    action: Optional[str] = Query(default=None),
    q: Optional[str] = Query(default=None, description="Search by action, actor or IP"),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    timezone_offset_minutes: int = Query(
        default=0,
        ge=-720,
        le=840,
        description="Browser timezone offset in minutes (Date.getTimezoneOffset)",
    ),
    include_view_events: bool = Query(default=False),
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(RoleChecker(["ADMIN"])),
):
    query = select(AuditLog).outerjoin(User, User.id == AuditLog.user_id)

    if user_id:
        query = query.where(AuditLog.user_id == user_id)

    if action:
        query = query.where(AuditLog.action.in_(_expand_action_filter(action)))

    if start_date:
        client_timezone = timezone(timedelta(minutes=-timezone_offset_minutes))
        start_local = datetime.combine(start_date, time.min, tzinfo=client_timezone)
        query = query.where(AuditLog.created_at >= start_local.astimezone(timezone.utc))

    if end_date:
        client_timezone = timezone(timedelta(minutes=-timezone_offset_minutes))
        end_local_exclusive = datetime.combine(
            end_date + timedelta(days=1),
            time.min,
            tzinfo=client_timezone,
        )
        query = query.where(AuditLog.created_at < end_local_exclusive.astimezone(timezone.utc))

    if q:
        search = q.strip()
        if search:
            pattern = f"%{search}%"
            query = query.where(
                or_(
                    AuditLog.action.ilike(pattern),
                    AuditLog.ip_address.ilike(pattern),
                    User.full_name.ilike(pattern),
                    User.username.ilike(pattern),
                    User.email.ilike(pattern),
                )
            )

    if not include_view_events and not action:
        query = query.where(AuditLog.action.notin_(tuple(NOISY_VIEW_ACTIONS)))

    query = query.order_by(desc(AuditLog.created_at))

    result = await paginate(query, page, page_size, db)

    actor_ids = {entry.user_id for entry in result.items if entry.user_id is not None}
    actors_by_id: dict[int, dict[str, str | None]] = {}
    if actor_ids:
        actors_result = await db.execute(
            select(User.id, User.full_name, User.username, User.role).where(User.id.in_(actor_ids))
        )
        for actor_id, full_name, username, role in actors_result.all():
            actors_by_id[actor_id] = {
                "full_name": full_name,
                "username": username,
                "role": role.value if hasattr(role, "value") else str(role),
            }

    result.items = [
        AuditLogResponse(
            id=entry.id,
            user_id=entry.user_id,
            action=entry.action,
            action_key=_canonical_action(entry.action),
            action_label=_humanize_action(_canonical_action(entry.action)),
            entity_type=entry.entity_type,
            entity_id=entry.entity_id,
            target_label=_format_entity_label(entry.entity_type, entry.entity_id),
            actor_name=actors_by_id.get(entry.user_id, {}).get("full_name"),
            actor_username=actors_by_id.get(entry.user_id, {}).get("username"),
            actor_role=actors_by_id.get(entry.user_id, {}).get("role"),
            extra_data=entry.extra_data,
            ip_address=entry.ip_address,
            user_agent=entry.user_agent,
            created_at=entry.created_at,
        )
        for entry in result.items
    ]

    return result
