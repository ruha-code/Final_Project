from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
 
 
class DepartmentCreate(BaseModel):
    name: str
    location: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    head_doctor_id: Optional[int] = None
    patient_satisfaction: float = 0.0
    efficiency: float = 0.0
    treatment_success: float = 0.0
 
 
class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    head_doctor_id: Optional[int] = None
    patient_satisfaction: Optional[float] = None
    efficiency: Optional[float] = None
    treatment_success: Optional[float] = None
 
 
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