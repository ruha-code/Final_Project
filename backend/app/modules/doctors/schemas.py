import re
from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime, time
from typing import Optional
 

PHONE_E164_REGEX = re.compile(r"^\+[1-9]\d{9,14}$")
SPECIALTY_ALLOWED_CHARS = {" ", "-", "'", ".", "/", "&", "(", ")"}
NAME_ALLOWED_CHARS = {" ", "-", "'", "."}


def _normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _validate_name(value: str) -> str:
    cleaned = _normalize_whitespace(value)
    if len(cleaned) < 3:
        raise ValueError("Full name must be at least 3 characters")
    if sum(1 for ch in cleaned if ch.isalpha()) < 2:
        raise ValueError("Full name must contain letters")
    if any(not (ch.isalpha() or ch in NAME_ALLOWED_CHARS) for ch in cleaned):
        raise ValueError("Full name can contain only letters, spaces, apostrophes, dots, or hyphens")
    return cleaned


def _validate_specialty(value: str) -> str:
    cleaned = _normalize_whitespace(value)
    if len(cleaned) < 3:
        raise ValueError("Specialty must be at least 3 characters")
    if len(cleaned) > 100:
        raise ValueError("Specialty must be at most 100 characters")
    if sum(1 for ch in cleaned if ch.isalpha()) < 3:
        raise ValueError("Specialty must contain letters, not only numbers")
    if any(not (ch.isalpha() or ch in SPECIALTY_ALLOWED_CHARS) for ch in cleaned):
        raise ValueError("Specialty contains invalid characters")
    return cleaned


def _validate_bio(value: str) -> str:
    cleaned = _normalize_whitespace(value)
    if len(cleaned) < 15:
        raise ValueError("Bio must be at least 15 characters")
    words = [token for token in cleaned.split(" ") if token]
    if len(words) < 3:
        raise ValueError("Bio must contain at least 3 words")
    if sum(1 for ch in cleaned if ch.isalpha()) < 10:
        raise ValueError("Bio must contain descriptive text")
    return cleaned


def _normalize_and_validate_phone(value: str) -> str:
    cleaned = re.sub(r"[^\d+]", "", value)
    if cleaned.count("+") > 1 or ("+" in cleaned and not cleaned.startswith("+")):
        raise ValueError("Phone format is invalid")
    if not PHONE_E164_REGEX.fullmatch(cleaned):
        raise ValueError("Phone must be in international format, e.g. +15550123456")
    return cleaned

 
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

    @field_validator("specialty")
    @classmethod
    def validate_specialty(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return _validate_specialty(v)

    @field_validator("bio")
    @classmethod
    def validate_bio(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return _validate_bio(v)


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
        return _normalize_and_validate_phone(cleaned)

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        if not v.strip():
            raise ValueError("Full name cannot be empty")
        return _validate_name(v)

    @field_validator("specialty")
    @classmethod
    def validate_specialty(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        if not v.strip():
            raise ValueError("Specialty cannot be empty")
        return _validate_specialty(v)

    @field_validator("bio")
    @classmethod
    def validate_bio(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        if not v.strip():
            return None
        return _validate_bio(v)
 
 
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
