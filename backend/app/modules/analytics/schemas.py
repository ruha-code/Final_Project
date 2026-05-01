from pydantic import BaseModel
from typing import List, Optional

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
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    is_available: bool = False
    total: int
    completed: int
    cancelled: int
    scheduled: int
    ongoing: int
    pending: int
    completion_rate: float


class TrendPoint(BaseModel):
    date: str
    label: str
    total: int
    completed: int
    cancelled: int
    scheduled: int
    ongoing: int


class AnalyticsSummary(BaseModel):
    total_appointments: int
    completed: int
    cancelled: int
    scheduled: int
    ongoing: int
    completion_rate: float
    cancellation_rate: float
    total_doctors: int
    active_doctors: int
    inactive_doctors: int
    available_doctors: int
    overloaded_doctors: int


class DepartmentStats(BaseModel):
    department_id: Optional[int] = None
    department_name: str
    doctor_count: int
    active_doctors: int
    total: int
    completed: int
    cancelled: int
    scheduled: int
    ongoing: int
    completion_rate: float
    cancellation_rate: float


class AnalyticsOverview(BaseModel):
    summary: AnalyticsSummary
    trend: List[TrendPoint]
    trend_granularity: str
    trend_label: str
    departments: List[DepartmentStats]
