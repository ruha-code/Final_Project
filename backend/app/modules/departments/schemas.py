from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime
from typing import Optional
 
 
def _normalize_text(value: str) -> str:
    return " ".join(value.strip().split())


def _normalize_optional_text(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    normalized = _normalize_text(value)
    return normalized or None


class DepartmentCreate(BaseModel):
    name: str
    location: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    head_doctor_id: Optional[int] = None

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = _normalize_text(value)
        if not normalized:
            raise ValueError("Department name is required")
        return normalized

    @field_validator("location", "description", "image_url")
    @classmethod
    def normalize_optional_fields(cls, value: Optional[str]) -> Optional[str]:
        return _normalize_optional_text(value)
 
 
class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    head_doctor_id: Optional[int] = None

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        normalized = _normalize_text(value)
        if not normalized:
            raise ValueError("Department name is required")
        return normalized

    @field_validator("location", "description", "image_url")
    @classmethod
    def normalize_optional_fields(cls, value: Optional[str]) -> Optional[str]:
        return _normalize_optional_text(value)
 
 
class DepartmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
 
    id: int
    name: str
    location: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    head_doctor_id: Optional[int] = None
    patient_satisfaction: float
    efficiency: float
    treatment_success: float
    created_at: datetime
    staff_count: int = 0 
