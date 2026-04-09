from sqlalchemy import Integer, ForeignKey, DateTime, String, Enum, Date, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime, date, time
import enum

from app.core.database import Base


class EventCategory(str, enum.Enum):
    ADMIN = "ADMIN"
    SYSTEM = "SYSTEM"
    TRAINING = "TRAINING"


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    event_date: Mapped[date] = mapped_column(Date, nullable=False)
    event_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    category: Mapped[EventCategory] = mapped_column(
        Enum(EventCategory), default=EventCategory.ADMIN, nullable=False
    )
    created_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    creator = relationship("User")
