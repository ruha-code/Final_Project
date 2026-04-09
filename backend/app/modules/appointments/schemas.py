from pydantic import BaseModel, field_validator, ConfigDict
from datetime import datetime, timezone
from typing import Optional
from app.modules.appointments.models import AppointmentType
 
 
class AppointmentCreate(BaseModel):
    doctor_id: int
    appointment_time: datetime
    appointment_type: AppointmentType = AppointmentType.CONSULTATION
    reason: Optional[str] = None
 
    @field_validator("appointment_time")
    @classmethod
    def validate_appointment_time(cls, value: datetime):
        if value.tzinfo is None:
            raise ValueError("appointment_time must be timezone-aware")
        if value <= datetime.now(timezone.utc):
            raise ValueError("Appointment time must be in the future")
        return value
 
 
class AppointmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
 
    id: int
    patient_id: int
    doctor_id: int
    appointment_time: datetime
    duration_minutes: int
    appointment_type: str
    status: str
    reason: Optional[str] = None
    notes: Optional[str] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    created_at: datetime
 
 
class AppointmentDetailResponse(AppointmentResponse):
    """Extended response with patient and doctor names."""
    patient_name: str
    doctor_name: str
    doctor_specialty: Optional[str] = None
 
 
class CompleteRequest(BaseModel):
    notes: Optional[str] = None