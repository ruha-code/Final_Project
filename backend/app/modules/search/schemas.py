from enum import Enum

from pydantic import BaseModel


class SearchEntityType(str, Enum):
    DOCTOR = "DOCTOR"
    PATIENT = "PATIENT"
    APPOINTMENT = "APPOINTMENT"


class SearchResultItem(BaseModel):
    entity_type: SearchEntityType
    entity_id: int
    title: str
    subtitle: str
    route: str


class SearchResponse(BaseModel):
    q: str
    results: list[SearchResultItem]

