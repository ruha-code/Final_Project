from sqlalchemy import Integer, DateTime, String, Float, Enum, Date
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from datetime import datetime, date
import enum

from app.core.database import Base


class InventoryCategory(str, enum.Enum):
    MEDICATIONS = "MEDICATIONS"
    CONSUMABLES = "CONSUMABLES"
    LABORATORY = "LABORATORY"
    OTHER = "OTHER"


class InventoryStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    LOW = "LOW"
    OUT = "OUT"


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    category: Mapped[InventoryCategory] = mapped_column(
        Enum(InventoryCategory), nullable=False, default=InventoryCategory.OTHER
    )

    quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    unit: Mapped[str] = mapped_column(String(30), nullable=False, default="pcs")  # boxes, pcs, vials
    stock_percentage: Mapped[int] = mapped_column(Integer, default=100, nullable=False)  # 0-100
    status: Mapped[InventoryStatus] = mapped_column(
        Enum(InventoryStatus), default=InventoryStatus.AVAILABLE, nullable=False
    )

    image_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    expires_at: Mapped[date | None] = mapped_column(Date, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
