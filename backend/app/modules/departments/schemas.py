from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
 
 
class DepartmentCreate(BaseModel):
    name: str
    location: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    head_doctor_id: Optional[int] = None
 
 
class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    head_doctor_id: Optional[int] = None
 
 
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
