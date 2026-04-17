from pydantic import BaseModel, ConfigDict, field_validator
from datetime import date, datetime
from typing import Optional
from app.modules.patients.models import Gender, PatientType, PatientStatus


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
        if v >= date.today():
            raise ValueError("Date of birth must be in the past")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Phone number cannot be empty")
        return v


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
