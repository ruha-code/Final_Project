from pydantic import BaseModel, ConfigDict
from datetime import datetime, date, time
from typing import Optional
from app.modules.calendar.models import EventCategory
 
 
class CalendarEventCreate(BaseModel):
    title: str
    event_date: date
    event_time: Optional[time] = None
    category: EventCategory = EventCategory.ADMIN
 
 
class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    event_date: Optional[date] = None
    event_time: Optional[time] = None
    category: Optional[EventCategory] = None
 
 
class CalendarEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
 
    id: int
    title: str
    event_date: date
    event_time: Optional[time] = None
    category: str
    created_by: int
    created_at: datetime