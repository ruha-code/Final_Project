from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime, date
from typing import Optional
from app.modules.inventory.models import InventoryCategory, InventoryStatus
 
 
class InventoryItemCreate(BaseModel):
    name: str
    category: InventoryCategory
    quantity: int
    unit: str = "pcs"
    stock_percentage: int = 100
    image_url: Optional[str] = None
    expires_at: Optional[date] = None
 
    @field_validator("stock_percentage")
    @classmethod
    def validate_stock(cls, v: int) -> int:
        if not 0 <= v <= 100:
            raise ValueError("stock_percentage must be between 0 and 100")
        return v
 
    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, v: int) -> int:
        if v < 0:
            raise ValueError("quantity cannot be negative")
        return v
 
 
class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[InventoryCategory] = None
    quantity: Optional[int] = None
    unit: Optional[str] = None
    stock_percentage: Optional[int] = None
    status: Optional[InventoryStatus] = None
    image_url: Optional[str] = None
    expires_at: Optional[date] = None
 
 
class InventoryItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
 
    id: int
    name: str
    category: str
    quantity: int
    unit: str
    stock_percentage: int
    status: str
    image_url: Optional[str] = None
    expires_at: Optional[date] = None
    created_at: datetime
    updated_at: datetime