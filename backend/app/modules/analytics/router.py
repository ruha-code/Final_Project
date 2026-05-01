import logging
from datetime import date, datetime, time, timedelta, timezone
from typing import Optional
import time as time_module

from fastapi import APIRouter, Depends, HTTPException, Query

import h3
from sqlalchemy import and_, case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import CacheKeys, cache_get, cache_set, get_redis
from app.core.database import get_db
from app.core.dependencies import RoleChecker, get_current_user
from app.modules.analytics.schemas import (
    AnalyticsOverview,
    AnalyticsSummary,
    DemandPoint,
    DepartmentStats,
    DoctorStats,
    RegionDetail,
    TrendPoint,
)
from app.modules.appointments.models import Appointment, AppointmentStatus
from app.modules.audit.router import Actions, log
from app.modules.auth.models import User
from app.modules.departments.models import Department
from app.modules.doctors.models import Doctor

router = APIRouter(dependencies=[Depends(RoleChecker(["ADMIN"]))])

logger = logging.getLogger("clinic.analytics")
ANALYTICS_VIEW_LOG_DEDUP_WINDOW_SECONDS = 20
_analytics_view_log_fallback: dict[int, float] = {}


async def _log_view_analytics_once(db: AsyncSession, user_id: int) -> None:
    redis = await get_redis()
    if redis is None:
        now = time_module.monotonic()
        last_logged = _analytics_view_log_fallback.get(user_id, 0.0)
        if now - last_logged >= ANALYTICS_VIEW_LOG_DEDUP_WINDOW_SECONDS:
            _analytics_view_log_fallback[user_id] = now
            await log(db=db, user_id=user_id, action=Actions.VIEW_ANALYTICS)
        return

    key = f"audit:view_analytics:{user_id}"
    try:
        claimed = await redis.set(key, "1", ex=ANALYTICS_VIEW_LOG_DEDUP_WINDOW_SECONDS, nx=True)
    except Exception:
        claimed = None

    if claimed:
        await log(db=db, user_id=user_id, action=Actions.VIEW_ANALYTICS)
        return

    if claimed is None:
        now = time_module.monotonic()
        last_logged = _analytics_view_log_fallback.get(user_id, 0.0)
        if now - last_logged >= ANALYTICS_VIEW_LOG_DEDUP_WINDOW_SECONDS:
            _analytics_view_log_fallback[user_id] = now
            await log(db=db, user_id=user_id, action=Actions.VIEW_ANALYTICS)


def _resolve_utc_window(
    start_date: Optional[date],
    end_date: Optional[date],
    timezone_offset_minutes: int,
) -> tuple[Optional[datetime], Optional[datetime]]:
    if start_date and end_date and start_date > end_date:
        raise HTTPException(status_code=422, detail="start_date cannot be after end_date")

    if not start_date and not end_date:
        return None, None

    client_timezone = timezone(timedelta(minutes=-timezone_offset_minutes))

    start_utc: Optional[datetime] = None
    if start_date:
        start_local = datetime.combine(start_date, time.min, tzinfo=client_timezone)
        start_utc = start_local.astimezone(timezone.utc)

    end_utc_exclusive: Optional[datetime] = None
    if end_date:
        end_local_exclusive = datetime.combine(
            end_date + timedelta(days=1),
            time.min,
            tzinfo=client_timezone,
        )
        end_utc_exclusive = end_local_exclusive.astimezone(timezone.utc)

    return start_utc, end_utc_exclusive


def _apply_window(query, start_utc: Optional[datetime], end_utc_exclusive: Optional[datetime]):
    if start_utc:
        query = query.where(Appointment.appointment_time >= start_utc)
    if end_utc_exclusive:
        query = query.where(Appointment.appointment_time < end_utc_exclusive)
    return query


def _client_timezone(timezone_offset_minutes: int) -> timezone:
    return timezone(timedelta(minutes=-timezone_offset_minutes))


def _to_client_time(value: datetime, client_timezone: timezone) -> datetime:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(client_timezone)


def _resolve_effective_dates(
    start_date: Optional[date],
    end_date: Optional[date],
    timezone_offset_minutes: int,
    *,
    default_days: int = 30,
) -> tuple[date, date]:
    if start_date and end_date and start_date > end_date:
        raise HTTPException(status_code=422, detail="start_date cannot be after end_date")

    if start_date and end_date:
        return start_date, end_date

    client_now = datetime.now(timezone.utc).astimezone(
        _client_timezone(timezone_offset_minutes)
    )
    default_end = client_now.date()
    default_start = default_end - timedelta(days=default_days - 1)

    if start_date and not end_date:
        return start_date, start_date + timedelta(days=default_days - 1)
    if end_date and not start_date:
        return end_date - timedelta(days=default_days - 1), end_date
    return default_start, default_end


async def _build_doctor_stats(
    db: AsyncSession,
    *,
    start_utc: Optional[datetime],
    end_utc_exclusive: Optional[datetime],
) -> list[DoctorStats]:
    appointment_join_conditions = [Appointment.doctor_id == Doctor.id]
    if start_utc:
        appointment_join_conditions.append(Appointment.appointment_time >= start_utc)
    if end_utc_exclusive:
        appointment_join_conditions.append(Appointment.appointment_time < end_utc_exclusive)

    query = (
        select(
            Doctor.id.label("doctor_id"),
            User.full_name.label("doctor_name"),
            Doctor.department_id.label("department_id"),
            Department.name.label("department_name"),
            Doctor.is_available.label("is_available"),
            func.count(Appointment.id).label("total"),
            func.sum(
                case((Appointment.status == AppointmentStatus.COMPLETED, 1), else_=0)
            ).label("completed"),
            func.sum(
                case((Appointment.status == AppointmentStatus.CANCELLED, 1), else_=0)
            ).label("cancelled"),
            func.sum(
                case((Appointment.status == AppointmentStatus.SCHEDULED, 1), else_=0)
            ).label("scheduled"),
            func.sum(
                case((Appointment.status == AppointmentStatus.ONGOING, 1), else_=0)
            ).label("ongoing"),
        )
        .join(User, User.id == Doctor.user_id)
        .outerjoin(Department, Department.id == Doctor.department_id)
        .outerjoin(Appointment, and_(*appointment_join_conditions))
        .group_by(
            Doctor.id,
            User.full_name,
            Doctor.department_id,
            Department.name,
            Doctor.is_available,
        )
    )

    result = await db.execute(query)

    response: list[DoctorStats] = []
    for (
        doctor_id,
        doctor_name,
        department_id,
        department_name,
        is_available,
        total,
        completed,
        cancelled,
        scheduled,
        ongoing,
    ) in result.all():
        total = int(total or 0)
        completed = int(completed or 0)
        cancelled = int(cancelled or 0)
        scheduled = int(scheduled or 0)
        ongoing = int(ongoing or 0)
        pending = max(total - completed - cancelled, 0)
        completion_rate = (completed / total) if total > 0 else 0

        response.append(
            DoctorStats(
                doctor_id=doctor_id,
                doctor_name=doctor_name,
                department_id=department_id,
                department_name=department_name,
                is_available=bool(is_available),
                total=total,
                completed=completed,
                cancelled=cancelled,
                scheduled=scheduled,
                ongoing=ongoing,
                pending=pending,
                completion_rate=completion_rate,
            )
        )

    response.sort(key=lambda item: (item.doctor_name or "", item.doctor_id))
    return response


def _count_overloaded_doctors(doctor_stats: list[DoctorStats]) -> int:
    active_doctors = [item for item in doctor_stats if item.total > 0]
    if not active_doctors:
        return 0

    average_volume = sum(item.total for item in active_doctors) / len(active_doctors)
    threshold = max(average_volume * 1.35, average_volume + 3)
    return sum(1 for item in active_doctors if item.total > threshold)


def _build_department_stats(doctor_stats: list[DoctorStats]) -> list[DepartmentStats]:
    grouped: dict[str, dict[str, int | float | None]] = {}

    for doctor in doctor_stats:
        department_name = doctor.department_name or "Unassigned"
        if department_name not in grouped:
            grouped[department_name] = {
                "department_id": doctor.department_id,
                "doctor_count": 0,
                "active_doctors": 0,
                "total": 0,
                "completed": 0,
                "cancelled": 0,
                "scheduled": 0,
                "ongoing": 0,
            }

        bucket = grouped[department_name]
        bucket["doctor_count"] = int(bucket["doctor_count"]) + 1
        bucket["active_doctors"] = int(bucket["active_doctors"]) + (1 if doctor.total > 0 else 0)
        bucket["total"] = int(bucket["total"]) + doctor.total
        bucket["completed"] = int(bucket["completed"]) + doctor.completed
        bucket["cancelled"] = int(bucket["cancelled"]) + doctor.cancelled
        bucket["scheduled"] = int(bucket["scheduled"]) + doctor.scheduled
        bucket["ongoing"] = int(bucket["ongoing"]) + doctor.ongoing

    departments: list[DepartmentStats] = []
    for department_name, bucket in grouped.items():
        total = int(bucket["total"])
        completed = int(bucket["completed"])
        cancelled = int(bucket["cancelled"])
        scheduled = int(bucket["scheduled"])
        ongoing = int(bucket["ongoing"])

        departments.append(
            DepartmentStats(
                department_id=bucket["department_id"],
                department_name=department_name,
                doctor_count=int(bucket["doctor_count"]),
                active_doctors=int(bucket["active_doctors"]),
                total=total,
                completed=completed,
                cancelled=cancelled,
                scheduled=scheduled,
                ongoing=ongoing,
                completion_rate=(completed / total) if total > 0 else 0,
                cancellation_rate=(cancelled / total) if total > 0 else 0,
            )
        )

    departments.sort(key=lambda item: (-item.total, item.department_name))
    return departments


async def _build_trend(
    db: AsyncSession,
    *,
    start_date: date,
    end_date: date,
    timezone_offset_minutes: int,
) -> tuple[list[TrendPoint], str, str]:
    start_utc, end_utc_exclusive = _resolve_utc_window(
        start_date,
        end_date,
        timezone_offset_minutes,
    )
    client_timezone = _client_timezone(timezone_offset_minutes)
    range_days = (end_date - start_date).days + 1
    granularity = "day" if range_days <= 62 else "month"

    result = await db.execute(
        _apply_window(
            select(Appointment.appointment_time, Appointment.status).order_by(
                Appointment.appointment_time
            ),
            start_utc,
            end_utc_exclusive,
        )
    )

    bucket_counts: dict[str, dict[str, int | str]] = {}

    def ensure_bucket(key: str, label: str) -> dict[str, int | str]:
        if key not in bucket_counts:
            bucket_counts[key] = {
                "date": key,
                "label": label,
                "total": 0,
                "completed": 0,
                "cancelled": 0,
                "scheduled": 0,
                "ongoing": 0,
            }
        return bucket_counts[key]

    for appointment_time, status in result.all():
        local_time = _to_client_time(appointment_time, client_timezone)
        if granularity == "day":
            bucket_date = local_time.date()
            key = bucket_date.isoformat()
            label = f"{bucket_date.strftime('%b')} {bucket_date.day}"
        else:
            bucket_date = date(local_time.year, local_time.month, 1)
            key = bucket_date.isoformat()
            label = bucket_date.strftime("%b %Y")

        bucket = ensure_bucket(key, label)
        bucket["total"] = int(bucket["total"]) + 1
        if status == AppointmentStatus.COMPLETED:
            bucket["completed"] = int(bucket["completed"]) + 1
        elif status == AppointmentStatus.CANCELLED:
            bucket["cancelled"] = int(bucket["cancelled"]) + 1
        elif status == AppointmentStatus.SCHEDULED:
            bucket["scheduled"] = int(bucket["scheduled"]) + 1
        elif status == AppointmentStatus.ONGOING:
            bucket["ongoing"] = int(bucket["ongoing"]) + 1

    points: list[TrendPoint] = []
    if granularity == "day":
        cursor = start_date
        while cursor <= end_date:
            key = cursor.isoformat()
            label = f"{cursor.strftime('%b')} {cursor.day}"
            bucket = ensure_bucket(key, label)
            points.append(TrendPoint(**bucket))
            cursor += timedelta(days=1)
        trend_label = "Daily trend"
    else:
        cursor = date(start_date.year, start_date.month, 1)
        last_bucket = date(end_date.year, end_date.month, 1)
        while cursor <= last_bucket:
            key = cursor.isoformat()
            label = cursor.strftime("%b %Y")
            bucket = ensure_bucket(key, label)
            points.append(TrendPoint(**bucket))
            if cursor.month == 12:
                cursor = date(cursor.year + 1, 1, 1)
            else:
                cursor = date(cursor.year, cursor.month + 1, 1)
        trend_label = "Monthly trend"

    return points, granularity, trend_label


def _build_summary(doctor_stats: list[DoctorStats]) -> AnalyticsSummary:
    total_appointments = sum(item.total for item in doctor_stats)
    completed = sum(item.completed for item in doctor_stats)
    cancelled = sum(item.cancelled for item in doctor_stats)
    scheduled = sum(item.scheduled for item in doctor_stats)
    ongoing = sum(item.ongoing for item in doctor_stats)
    total_doctors = len(doctor_stats)
    active_doctors = sum(1 for item in doctor_stats if item.total > 0)
    available_doctors = sum(1 for item in doctor_stats if item.is_available)

    return AnalyticsSummary(
        total_appointments=total_appointments,
        completed=completed,
        cancelled=cancelled,
        scheduled=scheduled,
        ongoing=ongoing,
        completion_rate=(completed / total_appointments) if total_appointments > 0 else 0,
        cancellation_rate=(cancelled / total_appointments) if total_appointments > 0 else 0,
        total_doctors=total_doctors,
        active_doctors=active_doctors,
        inactive_doctors=max(total_doctors - active_doctors, 0),
        available_doctors=available_doctors,
        overloaded_doctors=_count_overloaded_doctors(doctor_stats),
    )


@router.get("/demand", response_model=list[DemandPoint])
async def get_demand(
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    timezone_offset_minutes: int = Query(default=0, ge=-720, le=840),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start_utc, end_utc_exclusive = _resolve_utc_window(
        start_date,
        end_date,
        timezone_offset_minutes,
    )
    use_cache = start_utc is None and end_utc_exclusive is None

    if use_cache:
        cached = await cache_get(CacheKeys.ANALYTICS_DEMAND)
        if cached:
            logger.debug("[CACHE HIT] analytics:demand")
            return [DemandPoint(**item) for item in cached]

    query = select(
        Appointment.h3_index,
        func.count().label("count"),
    )
    query = _apply_window(query, start_utc, end_utc_exclusive).group_by(Appointment.h3_index)
    result = await db.execute(query)

    response: list[DemandPoint] = []
    for h3_index, count in result.all():
        if h3_index is None:
            continue

        lat, lon = h3.cell_to_latlng(h3_index)
        response.append(
            DemandPoint(
                h3_index=h3_index,
                count=count,
                center_lat=lat,
                center_lon=lon,
            )
        )

    if use_cache:
        await cache_set(
            CacheKeys.ANALYTICS_DEMAND,
            [point.model_dump() for point in response],
            ttl_seconds=300,
        )
        logger.debug("[CACHE SET] analytics:demand (300s)")

    await _log_view_analytics_once(db=db, user_id=current_user.id)
    return response


@router.get("/region/{h3_index}", response_model=RegionDetail)
async def get_region_detail(
    h3_index: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cache_key = CacheKeys.analytics_region(h3_index)
    cached = await cache_get(cache_key)
    if cached:
        logger.debug(f"[CACHE HIT] {cache_key}")
        return RegionDetail(**cached)

    neighbors = list(h3.k_ring(h3_index, 1))

    result = await db.execute(
        select(
            Appointment.h3_index,
            func.count().label("count"),
        )
        .where(Appointment.h3_index.in_(neighbors))
        .group_by(Appointment.h3_index)
    )

    counts = {row[0]: row[1] for row in result.all()}

    neighbor_points = []
    for cell in neighbors:
        lat, lon = h3.cell_to_latlng(cell)
        neighbor_points.append(
            DemandPoint(
                h3_index=cell,
                count=counts.get(cell, 0),
                center_lat=lat,
                center_lon=lon,
            )
        )

    detail = RegionDetail(
        h3_index=h3_index,
        count=counts.get(h3_index, 0),
        neighbors=neighbor_points,
    )

    await cache_set(cache_key, detail.model_dump(), ttl_seconds=300)
    logger.debug(f"[CACHE SET] {cache_key} (300s)")

    await _log_view_analytics_once(db=db, user_id=current_user.id)
    return detail


@router.get("/doctors", response_model=list[DoctorStats])
async def get_doctors_stats(
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    timezone_offset_minutes: int = Query(default=0, ge=-720, le=840),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start_utc, end_utc_exclusive = _resolve_utc_window(
        start_date,
        end_date,
        timezone_offset_minutes,
    )
    use_cache = start_utc is None and end_utc_exclusive is None

    if use_cache:
        cached = await cache_get(CacheKeys.ANALYTICS_DOCTORS)
        if cached:
            logger.debug("[CACHE HIT] analytics:doctors")
            return [DoctorStats(**item) for item in cached]

    response = await _build_doctor_stats(
        db,
        start_utc=start_utc,
        end_utc_exclusive=end_utc_exclusive,
    )

    if use_cache:
        await cache_set(
            CacheKeys.ANALYTICS_DOCTORS,
            [stats.model_dump() for stats in response],
            ttl_seconds=300,
        )
        logger.debug("[CACHE SET] analytics:doctors (300s)")

    await _log_view_analytics_once(db=db, user_id=current_user.id)
    return response


@router.get("/overview", response_model=AnalyticsOverview)
async def get_analytics_overview(
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    timezone_offset_minutes: int = Query(default=0, ge=-720, le=840),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    effective_start_date, effective_end_date = _resolve_effective_dates(
        start_date,
        end_date,
        timezone_offset_minutes,
    )
    start_utc, end_utc_exclusive = _resolve_utc_window(
        effective_start_date,
        effective_end_date,
        timezone_offset_minutes,
    )

    doctor_stats = await _build_doctor_stats(
        db,
        start_utc=start_utc,
        end_utc_exclusive=end_utc_exclusive,
    )
    trend, trend_granularity, trend_label = await _build_trend(
        db,
        start_date=effective_start_date,
        end_date=effective_end_date,
        timezone_offset_minutes=timezone_offset_minutes,
    )

    await _log_view_analytics_once(db=db, user_id=current_user.id)
    return AnalyticsOverview(
        summary=_build_summary(doctor_stats),
        trend=trend,
        trend_granularity=trend_granularity,
        trend_label=trend_label,
        departments=_build_department_stats(doctor_stats),
    )
