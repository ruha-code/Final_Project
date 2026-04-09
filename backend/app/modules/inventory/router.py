from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
 
from app.core.database import get_db
from app.core.dependencies import RoleChecker
from app.core.exceptions import NotFoundException
from app.modules.inventory.models import InventoryItem, InventoryStatus, InventoryCategory
from app.modules.inventory.schemas import InventoryItemCreate, InventoryItemUpdate, InventoryItemResponse
 
router = APIRouter()
admin_only = RoleChecker(["ADMIN"])
 
 
def _auto_status(item: InventoryItem) -> None:
    """Auto-set status based on stock_percentage."""
    if item.stock_percentage == 0:
        item.status = InventoryStatus.OUT
    elif item.stock_percentage <= 25:
        item.status = InventoryStatus.LOW
    else:
        item.status = InventoryStatus.AVAILABLE
 
 
@router.get("", response_model=list[InventoryItemResponse], summary="List inventory items")
async def list_inventory(
    status: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    query = select(InventoryItem).order_by(InventoryItem.name)
    if status:
        query = query.where(InventoryItem.status == status.upper())
    if category:
        query = query.where(InventoryItem.category == category.upper())
 
    result = await db.execute(query)
    items = result.scalars().all()
 
    if search:
        items = [i for i in items if search.lower() in i.name.lower()]
 
    return items
 
 
@router.get("/{item_id}", response_model=InventoryItemResponse, summary="Get inventory item")
async def get_item(item_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(InventoryItem).where(InventoryItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise NotFoundException("Inventory item not found")
    return item
 
 
@router.post("", response_model=InventoryItemResponse, status_code=201,
             summary="Add inventory item (Admin)",
             dependencies=[Depends(admin_only)])
async def create_item(dto: InventoryItemCreate, db: AsyncSession = Depends(get_db)):
    item = InventoryItem(**dto.model_dump())
    _auto_status(item)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item
 
 
@router.put("/{item_id}", response_model=InventoryItemResponse,
            summary="Update inventory item (Admin)",
            dependencies=[Depends(admin_only)])
async def update_item(item_id: int, dto: InventoryItemUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(InventoryItem).where(InventoryItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise NotFoundException("Inventory item not found")
 
    for field, value in dto.model_dump(exclude_none=True).items():
        setattr(item, field, value)
 
    _auto_status(item)
    await db.commit()
    await db.refresh(item)
    return item
 
 
@router.delete("/{item_id}", status_code=204,
               summary="Delete inventory item (Admin)",
               dependencies=[Depends(admin_only)])
async def delete_item(item_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(InventoryItem).where(InventoryItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise NotFoundException("Inventory item not found")
    await db.delete(item)
    await db.commit()