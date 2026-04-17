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
        if not 10 <= v <= 120:
            raise ValueError("Consultation duration must be between 10 and 120 minutes")
        return v

    @field_validator("years_of_experience")
    @classmethod
    def validate_experience(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not 0 <= v <= 50:
            raise ValueError("Years of experience must be between 0 and 50")
        return v

    @field_validator("specialty", "bio", "license_number")
    @classmethod
    def strip_optional_strings(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = v.strip()
        return cleaned or None


class DoctorProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[int] = None
    specialty: Optional[str] = None
    years_of_experience: Optional[int] = None
    consultation_duration_minutes: Optional[int] = None
    bio: Optional[str] = None
    is_available: Optional[bool] = None

    @field_validator("consultation_duration_minutes")
    @classmethod
    def validate_duration(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not 10 <= v <= 120:
            raise ValueError("Consultation duration must be between 10 and 120 minutes")
        return v

    @field_validator("years_of_experience")
    @classmethod
    def validate_experience(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not 0 <= v <= 50:
            raise ValueError("Years of experience must be between 0 and 50")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Phone number cannot be empty")
        return cleaned

    @field_validator("full_name", "specialty", "bio")
    @classmethod
    def strip_optional_strings(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = v.strip()
        return cleaned or None
 
 
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
    available_slots: list[str]
