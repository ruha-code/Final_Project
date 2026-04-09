from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime, time
from typing import Optional
 
 
class DoctorProfileCreate(BaseModel):
    department_id: Optional[int] = None
    specialty: Optional[str] = None        # e.g. "Cardiologist"
    license_number: Optional[str] = None
    years_of_experience: Optional[int] = None
    consultation_duration_minutes: int = 30
    bio: Optional[str] = None
 
    @field_validator("consultation_duration_minutes")
    @classmethod
    def validate_duration(cls, v: int) -> int:
        if not 15 <= v <= 120:
            raise ValueError("Consultation duration must be between 15 and 120 minutes")
        return v
 
 
class DoctorProfileUpdate(BaseModel):
    department_id: Optional[int] = None
    specialty: Optional[str] = None
    years_of_experience: Optional[int] = None
    consultation_duration_minutes: Optional[int] = None
    bio: Optional[str] = None
    is_available: Optional[bool] = None
 
 
class DoctorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
 
    id: int
    user_id: int
    department_id: Optional[int] = None
    specialty: Optional[str] = None
    bio: Optional[str] = None
    years_of_experience: int
    consultation_duration_minutes: int
    is_available: bool
    rating: float
    license_number: Optional[str] = None
    license_status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
 
 
class DoctorDetailResponse(DoctorResponse):
    """Extended response with joined user info — used on list/detail pages."""
    full_name: str
    email: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    department_name: Optional[str] = None
 
 
class ScheduleSlotCreate(BaseModel):
    day_of_week: int   # 0=Monday, 6=Sunday
    start_time: time
    end_time: time
    is_available: bool = True
 
    @field_validator("day_of_week")
    @classmethod
    def validate_day(cls, v: int) -> int:
        if not 0 <= v <= 6:
            raise ValueError("day_of_week must be 0 (Monday) to 6 (Sunday)")
        return v
 
    @field_validator("end_time")
    @classmethod
    def validate_times(cls, v: time, info) -> time:
        start = info.data.get("start_time")
        if start and v <= start:
            raise ValueError("end_time must be after start_time")
        return v
 
 
class ScheduleSlotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
 
    id: int
    doctor_id: int
    day_of_week: int
    start_time: time
    end_time: time
    is_available: bool
 
 
class AvailableSlotsResponse(BaseModel):
    doctor_id: int
    date: str
    available_slots: list[datetime]