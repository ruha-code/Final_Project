from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class MessageCreate(BaseModel):
    text: str


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: int
    sender_id: int
    text: str
    is_read: bool
    sent_at: datetime
    sender_name: str = ""


class ConversationCreate(BaseModel):
    doctor_id: int


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    doctor_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    patient_name: str = ""
    doctor_name: str = ""
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    unread_count: int = 0


class UnreadCountResponse(BaseModel):
    total_unread: int
