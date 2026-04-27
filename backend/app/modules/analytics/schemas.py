from pydantic import BaseModel
from typing import List

class DemandPoint(BaseModel):
    h3_index: str
    count: int
    center_lat: float
    center_lon: float



class RegionDetail(BaseModel):
    h3_index: str
    count: int
    neighbors: List[DemandPoint]



class DoctorStats(BaseModel):
    doctor_id: int
    doctor_name: str
    total: int
    completed: int
    cancelled: int
    scheduled: int
    ongoing: int
    pending: int
    completion_rate: float
