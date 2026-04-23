import logging
from datetime import date, datetime, time, timedelta, timezone
from typing import Optional
import time as time_module

from fastapi import APIRouter, Depends, HTTPException, Query

import h3
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import CacheKeys, cache_get, cache_set, get_redis
from app.core.database import get_db
from app.core.dependencies import RoleChecker, get_current_user
from app.modules.analytics.schemas import DemandPoint, DoctorStats, RegionDetail
from app.modules.appointments.models import Appointment, AppointmentStatus
from app.modules.audit.router import Actions, log
from app.modules.auth.models import User

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

    query = select(
        Appointment.doctor_id,
        func.count().label("total"),
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
    query = _apply_window(query, start_utc, end_utc_exclusive).group_by(Appointment.doctor_id)

    result = await db.execute(query)

    response: list[DoctorStats] = []
    for doctor_id, total, completed, cancelled, scheduled, ongoing in result.all():
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
                total=total,
                completed=completed,
                cancelled=cancelled,
                scheduled=scheduled,
                ongoing=ongoing,
                pending=pending,
                completion_rate=completion_rate,
            )
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
