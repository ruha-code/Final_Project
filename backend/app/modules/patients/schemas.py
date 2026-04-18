from pydantic import BaseModel, ConfigDict, field_validator
from datetime import date, datetime
from typing import Optional
import re
from app.modules.patients.models import Gender, PatientType, PatientStatus

PHONE_REGEX = re.compile(r"^\+[1-9]\d{7,14}$")
NAME_ALLOWED_CHARS = set(" -'.")


def _normalize_phone(raw: str) -> str:
    cleaned = re.sub(r"[^\d+]", "", raw.strip())
    if cleaned.startswith("00"):
        cleaned = f"+{cleaned[2:]}"
    return cleaned


def _contains_letters(value: str) -> bool:
    return any(char.isalpha() for char in value)


def _is_valid_name(value: str) -> bool:
    if not value:
        return False
    return all(char.isalpha() or char in NAME_ALLOWED_CHARS for char in value)


def _normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _is_meaningful_notes(value: str) -> bool:
    cleaned = _normalize_text(value)
    if len(cleaned) < 10:
        return False

    words = [token for token in cleaned.split(" ") if token]
    if len(words) < 2:
        return False

    letters_count = sum(1 for char in cleaned if char.isalpha())
    if letters_count < 8:
        return False
    return True


class PatientProfileCreate(BaseModel):
    date_of_birth: date
    gender: Gender
    phone: str
    blood_type: Optional[str] = None
    address: Optional[str] = None
    condition: Optional[str] = None
    notes: Optional[str] = None
    patient_type: PatientType = PatientType.OUTPATIENT
    admission_date: Optional[date] = None
    room_location: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

    @field_validator("date_of_birth")
    @classmethod
    def validate_dob(cls, v: date) -> date:
        today = date.today()
        age_years = (today - v).days / 365.25
        if v >= date.today():
            raise ValueError("Date of birth must be in the past")
        if v.year < 1900 or age_years > 120:
            raise ValueError("Enter a realistic date of birth")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        normalized = _normalize_phone(v)
        if not normalized:
            raise ValueError("Phone number cannot be empty")
        if not PHONE_REGEX.fullmatch(normalized):
            raise ValueError("Use a valid phone number in international format, e.g. +15550101")
        return normalized

    @field_validator("address", "condition")
    @classmethod
    def validate_text_fields(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = v.strip()
        if not cleaned:
            return None
        if not _contains_letters(cleaned):
            raise ValueError("Must include letters, not only numbers")
        return cleaned

    @field_validator("emergency_contact_name")
    @classmethod
    def validate_emergency_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = v.strip()
        if not cleaned:
            return None
        if not _is_valid_name(cleaned) or not _contains_letters(cleaned):
            raise ValueError("Emergency contact name must contain letters only")
        return cleaned

    @field_validator("emergency_contact_phone")
    @classmethod
    def validate_emergency_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        normalized = _normalize_phone(v)
        if not PHONE_REGEX.fullmatch(normalized):
            raise ValueError("Use a valid phone number in international format, e.g. +15550101")
        return normalized


class PatientProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    blood_type: Optional[str] = None
    condition: Optional[str] = None
    notes: Optional[str] = None
    patient_type: Optional[PatientType] = None
    patient_status: Optional[PatientStatus] = None
    admission_date: Optional[date] = None
    room_location: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

    @field_validator("date_of_birth")
    @classmethod
    def validate_dob(cls, v: Optional[date]) -> Optional[date]:
        if v is None:
            return None
        today = date.today()
        age_years = (today - v).days / 365.25
        if v >= today:
            raise ValueError("Date of birth must be in the past")
        if v.year < 1900 or age_years > 120:
            raise ValueError("Enter a realistic date of birth")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        normalized = _normalize_phone(v)
        if not normalized:
            raise ValueError("Phone number cannot be empty")
        if not PHONE_REGEX.fullmatch(normalized):
            raise ValueError("Use a valid phone number in international format, e.g. +15550101")
        return normalized

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Full name cannot be empty")
        if not _is_valid_name(cleaned) or not _contains_letters(cleaned):
            raise ValueError("Full name must contain letters only")

        name_parts = [part for part in cleaned.replace(".", " ").replace("-", " ").split() if part]
        if len(name_parts) < 2:
            raise ValueError("Enter both first and last name")

        return cleaned

    @field_validator("address", "condition")
    @classmethod
    def validate_text_fields(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = v.strip()
        if not cleaned:
            return None
        if not _contains_letters(cleaned):
            raise ValueError("Must include letters, not only numbers")
        return cleaned

    @field_validator("emergency_contact_name")
    @classmethod
    def validate_emergency_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = v.strip()
        if not cleaned:
            return None
        if not _is_valid_name(cleaned) or not _contains_letters(cleaned):
            raise ValueError("Emergency contact name must contain letters only")
        return cleaned

    @field_validator("emergency_contact_phone")
    @classmethod
    def validate_emergency_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        normalized = _normalize_phone(v)
        if not PHONE_REGEX.fullmatch(normalized):
            raise ValueError("Use a valid phone number in international format, e.g. +15550101")
        return normalized


class PatientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_type: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    condition: Optional[str] = None
    notes: Optional[str] = None
    patient_type: str = "OUTPATIENT"
    patient_status: str = "ADMITTED"
    admission_date: Optional[date] = None
    room_location: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class PatientDetailResponse(PatientResponse):
    """Extended response with joined user info."""

    full_name: str
    email: str
    avatar_url: Optional[str] = None


class HealthVitalCreate(BaseModel):
    blood_sugar: Optional[float] = None
    weight: Optional[float] = None
    temperature: Optional[float] = None
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None


class HealthVitalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    blood_sugar: Optional[float] = None
    weight: Optional[float] = None
    temperature: Optional[float] = None
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    recorded_at: datetime


class DoctorNotesUpdate(BaseModel):
    notes: str
    patient_status: Optional[PatientStatus] = None

    @field_validator("notes")
    @classmethod
    def validate_notes(cls, v: str) -> str:
        cleaned = _normalize_text(v)
        if not cleaned:
            raise ValueError("Notes cannot be empty")
        if not _is_meaningful_notes(cleaned):
            raise ValueError("Notes should be meaningful text (at least 2 words, not numeric-only)")
        return cleaned
