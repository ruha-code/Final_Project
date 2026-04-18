from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date
from typing import Optional
 
from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.core.exceptions import NotFoundException
from app.core import event_bus
from app.modules.auth.models import User
from app.modules.calendar.models import CalendarEvent
from app.modules.calendar.schemas import CalendarEventCreate, CalendarEventUpdate, CalendarEventResponse
 
router = APIRouter()
 
 
@router.get("", response_model=list[CalendarEventResponse], summary="Get calendar events")
async def list_events(
    month: Optional[int] = Query(default=None, ge=1, le=12),
    year: Optional[int] = Query(default=None),
    category: Optional[str] = Query(default=None),
    current_user: User = Depends(RoleChecker(["ADMIN", "DOCTOR"])),
    db: AsyncSession = Depends(get_db),
):
    query = select(CalendarEvent).order_by(CalendarEvent.event_date)
 
    if year:
        query = query.where(CalendarEvent.event_date >= date(year, 1, 1))
        query = query.where(CalendarEvent.event_date <= date(year, 12, 31))
    if month and year:
        import calendar
        last_day = calendar.monthrange(year, month)[1]
        query = query.where(CalendarEvent.event_date >= date(year, month, 1))
        query = query.where(CalendarEvent.event_date <= date(year, month, last_day))
    if category:
        query = query.where(CalendarEvent.category == category.upper())
 
    result = await db.execute(query)
    return result.scalars().all()
 
 
@router.post("", response_model=CalendarEventResponse, status_code=201,
             summary="Create calendar event (Admin)",
             dependencies=[Depends(RoleChecker(["ADMIN"]))])
async def create_event(
    dto: CalendarEventCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = CalendarEvent(**dto.model_dump(), created_by=current_user.id)
    db.add(event)
    await db.commit()
    await db.refresh(event)
    await event_bus.publish("notifications_refresh", {})
    return event
 
 
@router.put("/{event_id}", response_model=CalendarEventResponse,
            summary="Update calendar event (Admin)",
            dependencies=[Depends(RoleChecker(["ADMIN"]))])
async def update_event(event_id: int, dto: CalendarEventUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CalendarEvent).where(CalendarEvent.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise NotFoundException("Event not found")
 
    for field, value in dto.model_dump(exclude_none=True).items():
        setattr(event, field, value)
 
    await db.commit()
    await db.refresh(event)
    await event_bus.publish("notifications_refresh", {})
    return event
 
 
@router.delete("/{event_id}", status_code=204,
               summary="Delete calendar event (Admin)",
               dependencies=[Depends(RoleChecker(["ADMIN"]))])
async def delete_event(event_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CalendarEvent).where(CalendarEvent.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise NotFoundException("Event not found")
    await db.delete(event)
    await db.commit()
    await event_bus.publish("notifications_refresh", {})
