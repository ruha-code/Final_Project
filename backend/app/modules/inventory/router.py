from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
 
from app.core.database import get_db
from app.core.dependencies import RoleChecker, get_current_user
from app.core.exceptions import NotFoundException
from app.core import event_bus
from app.modules.auth.models import User
from app.modules.audit.router import Actions, log
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


def _is_low_stock(status: InventoryStatus) -> bool:
    return status in {InventoryStatus.LOW, InventoryStatus.OUT}
 
 
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
async def create_item(
    dto: InventoryItemCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = InventoryItem(**dto.model_dump())
    _auto_status(item)
    db.add(item)
    await db.commit()
    await db.refresh(item)

    extra_data = {
        "item_name": item.name,
        "status": item.status.value,
        "quantity": item.quantity,
    }
    await log(
        db=db,
        user_id=current_user.id,
        action=Actions.INVENTORY_ADD,
        entity_type="InventoryItem",
        entity_id=item.id,
        extra_data=extra_data,
        request=request,
    )
    if _is_low_stock(item.status):
        await log(
            db=db,
            user_id=current_user.id,
            action=Actions.INVENTORY_LOW,
            entity_type="InventoryItem",
            entity_id=item.id,
            extra_data=extra_data,
            request=request,
        )

    await event_bus.publish("notifications_refresh", {})
    return item
 
 
@router.put("/{item_id}", response_model=InventoryItemResponse,
            summary="Update inventory item (Admin)",
            dependencies=[Depends(admin_only)])
async def update_item(
    item_id: int,
    dto: InventoryItemUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(InventoryItem).where(InventoryItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise NotFoundException("Inventory item not found")

    previous_status = item.status
 
    for field, value in dto.model_dump(exclude_none=True).items():
        setattr(item, field, value)
 
    _auto_status(item)
    await db.commit()
    await db.refresh(item)

    extra_data = {
        "item_name": item.name,
        "status": item.status.value,
        "quantity": item.quantity,
    }
    await log(
        db=db,
        user_id=current_user.id,
        action=Actions.INVENTORY_UPDATE,
        entity_type="InventoryItem",
        entity_id=item.id,
        extra_data=extra_data,
        request=request,
    )
    if not _is_low_stock(previous_status) and _is_low_stock(item.status):
        await log(
            db=db,
            user_id=current_user.id,
            action=Actions.INVENTORY_LOW,
            entity_type="InventoryItem",
            entity_id=item.id,
            extra_data=extra_data,
            request=request,
        )

    await event_bus.publish("notifications_refresh", {})
    return item
 
 
@router.delete("/{item_id}", status_code=204,
               summary="Delete inventory item (Admin)",
               dependencies=[Depends(admin_only)])
async def delete_item(
    item_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(InventoryItem).where(InventoryItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise NotFoundException("Inventory item not found")
    item_id_value = item.id
    extra_data = {
        "item_name": item.name,
        "status": item.status.value,
        "quantity": item.quantity,
    }
    await db.delete(item)
    await db.commit()
    await log(
        db=db,
        user_id=current_user.id,
        action=Actions.INVENTORY_REMOVE,
        entity_type="InventoryItem",
        entity_id=item_id_value,
        extra_data=extra_data,
        request=request,
    )
    await event_bus.publish("notifications_refresh", {})
