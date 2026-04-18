from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class NotificationLevel(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


class NotificationType(str, Enum):
    MESSAGE = "MESSAGE"
    APPOINTMENT = "APPOINTMENT"
    INVENTORY = "INVENTORY"
    CALENDAR = "CALENDAR"


class NotificationItem(BaseModel):
    key: str
    notification_type: NotificationType
    title: str
    message: str
    level: NotificationLevel = NotificationLevel.INFO
    route: str
    created_at: datetime
    is_read: bool


class NotificationsResponse(BaseModel):
    unread_count: int
    items: list[NotificationItem]


class NotificationPreferencesResponse(BaseModel):
    mute_message_notifications: bool = False
    mute_appointment_notifications: bool = False
    mute_inventory_notifications: bool = False
    mute_calendar_notifications: bool = False
    appointment_reminder_hours: int = 48


class NotificationPreferencesUpdate(BaseModel):
    mute_message_notifications: bool | None = None
    mute_appointment_notifications: bool | None = None
    mute_inventory_notifications: bool | None = None
    mute_calendar_notifications: bool | None = None
    appointment_reminder_hours: int | None = None
