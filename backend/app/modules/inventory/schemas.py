from datetime import date, datetime
from typing import Literal, Optional

import re
from pydantic import BaseModel, ConfigDict, field_validator, model_validator

from app.modules.inventory.models import InventoryCategory, InventoryStatus
 
 
ALLOWED_UNITS = {
    "pcs",
    "boxes",
    "kits",
    "rolls",
    "vials",
    "bottles",
    "packs",
    "ml",
    "l",
    "g",
    "kg",
}
CATEGORY_UNIT_OPTIONS = {
    InventoryCategory.MEDICATIONS: ("pcs", "boxes", "packs", "vials", "bottles", "ml", "l", "g", "kg"),
    InventoryCategory.CONSUMABLES: ("pcs", "boxes", "packs", "rolls", "kits"),
    InventoryCategory.LABORATORY: ("pcs", "kits", "vials", "bottles", "ml", "l"),
    InventoryCategory.OTHER: tuple(sorted(ALLOWED_UNITS)),
}
NAME_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9\s\-()/.,+#]*$")
MIN_EXPIRY_DATE = date(2000, 1, 1)


def _normalize_name(value: str) -> str:
    cleaned = re.sub(r"\s+", " ", value).strip()
    if len(cleaned) < 2:
        raise ValueError("Name must be at least 2 characters")
    if len(cleaned) > 150:
        raise ValueError("Name must be 150 characters or fewer")
    if not re.search(r"[A-Za-z]", cleaned):
        raise ValueError("Name must include letters and cannot be numbers only")
    if not NAME_PATTERN.fullmatch(cleaned):
        raise ValueError("Name contains unsupported characters")
    return cleaned


def _normalize_unit(value: str) -> str:
    cleaned = value.strip().lower()
    if cleaned not in ALLOWED_UNITS:
        raise ValueError(
            "Unit must be one of: pcs, boxes, kits, rolls, vials, bottles, packs, ml, l, g, kg"
        )
    return cleaned


def _validate_expiry(value: Optional[date]) -> Optional[date]:
    if value is None:
        return None
    max_allowed = date(date.today().year + 30, 12, 31)
    if value < MIN_EXPIRY_DATE:
        raise ValueError("Expiry date is unrealistically old")
    if value > max_allowed:
        raise ValueError("Expiry date is unrealistically far in the future")
    return value


def get_allowed_units_for_category(category: InventoryCategory) -> list[str]:
    return list(CATEGORY_UNIT_OPTIONS.get(category, CATEGORY_UNIT_OPTIONS[InventoryCategory.OTHER]))


def validate_unit_for_category(unit: str, category: InventoryCategory) -> str:
    allowed_units = CATEGORY_UNIT_OPTIONS.get(category, CATEGORY_UNIT_OPTIONS[InventoryCategory.OTHER])
    if unit not in allowed_units:
        allowed_display = ", ".join(allowed_units)
        raise ValueError(
            f"{category.value.title()} items must use one of: {allowed_display}"
        )
    return unit


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
        if v > 1_000_000:
            raise ValueError("quantity is too large")
        return v

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        return _normalize_name(v)

    @field_validator("unit")
    @classmethod
    def validate_unit(cls, v: str) -> str:
        return _normalize_unit(v)

    @field_validator("expires_at")
    @classmethod
    def validate_expiry(cls, v: Optional[date]) -> Optional[date]:
        return _validate_expiry(v)

    @model_validator(mode="after")
    def validate_category_unit_pair(self):
        self.unit = validate_unit_for_category(self.unit, self.category)
        return self
 
 
class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[InventoryCategory] = None
    quantity: Optional[int] = None
    unit: Optional[str] = None
    stock_percentage: Optional[int] = None
    status: Optional[InventoryStatus] = None
    image_url: Optional[str] = None
    expires_at: Optional[date] = None

    @field_validator("stock_percentage")
    @classmethod
    def validate_stock(cls, v: Optional[int]) -> Optional[int]:
        if v is None:
            return None
        if not 0 <= v <= 100:
            raise ValueError("stock_percentage must be between 0 and 100")
        return v

    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, v: Optional[int]) -> Optional[int]:
        if v is None:
            return None
        if v < 0:
            raise ValueError("quantity cannot be negative")
        if v > 1_000_000:
            raise ValueError("quantity is too large")
        return v

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return _normalize_name(v)

    @field_validator("unit")
    @classmethod
    def validate_unit(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return _normalize_unit(v)

    @field_validator("expires_at")
    @classmethod
    def validate_expiry(cls, v: Optional[date]) -> Optional[date]:
        return _validate_expiry(v)

    @model_validator(mode="after")
    def validate_category_unit_pair(self):
        if self.unit is not None and self.category is not None:
            self.unit = validate_unit_for_category(self.unit, self.category)
        return self


class InventoryStockAdjust(BaseModel):
    operation: Literal["INCREASE", "DECREASE"]
    amount: int
    reason: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("amount must be greater than zero")
        if v > 1_000_000:
            raise ValueError("amount is too large")
        return v

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = re.sub(r"\s+", " ", v).strip()
        if not cleaned:
            return None
        return cleaned[:200]
 
 
class InventoryItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
 
    id: int
    name: str
    category: str
    quantity: int
    unit: str
    stock_percentage: int
    status: str
    stock_status: str = "AVAILABLE"
    image_url: Optional[str] = None
    expires_at: Optional[date] = None
    low_stock_threshold: int = 0
    target_quantity: int = 0
    is_expired: bool = False
    is_expiring_soon: bool = False
    days_until_expiry: Optional[int] = None
    created_at: datetime
    updated_at: datetime
