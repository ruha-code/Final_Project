from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import event_bus
from app.core.database import get_db
from app.core.dependencies import RoleChecker, get_current_user
from app.core.exceptions import ConflictException, NotFoundException
from app.modules.audit.router import Actions, log
from app.modules.auth.models import User
from app.modules.inventory.models import InventoryCategory, InventoryItem, InventoryStatus
from app.modules.inventory.schemas import (
    InventoryItemCreate,
    InventoryItemResponse,
    InventoryItemUpdate,
    InventoryStockAdjust,
)

router = APIRouter()
admin_only = RoleChecker(["ADMIN"])

LOW_STOCK_THRESHOLDS = {
    InventoryCategory.MEDICATIONS: 100,
    InventoryCategory.CONSUMABLES: 50,
    InventoryCategory.LABORATORY: 20,
    InventoryCategory.OTHER: 10,
}


def _threshold_for(category: InventoryCategory) -> int:
    return LOW_STOCK_THRESHOLDS.get(category, LOW_STOCK_THRESHOLDS[InventoryCategory.OTHER])


def _refresh_stock_fields(item: InventoryItem) -> None:
    """Set stock percentage and status from quantity using category thresholds."""
    threshold = _threshold_for(item.category)
    if item.quantity <= 0:
        item.status = InventoryStatus.OUT
    elif item.quantity <= threshold:
        item.status = InventoryStatus.LOW
    else:
        item.status = InventoryStatus.AVAILABLE

    
    reference = max(threshold * 4, 1)
    item.stock_percentage = max(0, min(100, round((item.quantity / reference) * 100)))


def _is_low_stock(status: InventoryStatus) -> bool:
    return status in {InventoryStatus.LOW, InventoryStatus.OUT}


def _to_response(item: InventoryItem) -> InventoryItemResponse:
    today = date.today()
    is_expired = item.expires_at is not None and item.expires_at < today
    is_expiring_soon = (
        item.expires_at is not None
        and today <= item.expires_at <= today + timedelta(days=30)
    )
    data = InventoryItemResponse.model_validate(item)
    data.low_stock_threshold = _threshold_for(item.category)
    data.is_expired = is_expired
    data.is_expiring_soon = is_expiring_soon
    return data


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
        term = search.lower().strip()
        items = [
            item
            for item in items
            if term in item.name.lower()
            or term in str(item.category.value).lower()
            or term in str(item.unit).lower()
        ]

    return [_to_response(item) for item in items]


@router.get("/{item_id}", response_model=InventoryItemResponse, summary="Get inventory item")
async def get_item(item_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(InventoryItem).where(InventoryItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise NotFoundException("Inventory item not found")
    return _to_response(item)


@router.post(
    "",
    response_model=InventoryItemResponse,
    status_code=201,
    summary="Add inventory item (Admin)",
    dependencies=[Depends(admin_only)],
)
async def create_item(
    dto: InventoryItemCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = InventoryItem(**dto.model_dump())
    _refresh_stock_fields(item)
    db.add(item)
    await db.commit()
    await db.refresh(item)

    extra_data = {
        "item_name": item.name,
        "status": item.status.value,
        "quantity": item.quantity,
        "low_stock_threshold": _threshold_for(item.category),
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
    return _to_response(item)


@router.put(
    "/{item_id}",
    response_model=InventoryItemResponse,
    summary="Update inventory item (Admin)",
    dependencies=[Depends(admin_only)],
)
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
    updates = dto.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(item, field, value)

    _refresh_stock_fields(item)
    await db.commit()
    await db.refresh(item)

    extra_data = {
        "item_name": item.name,
        "status": item.status.value,
        "quantity": item.quantity,
        "low_stock_threshold": _threshold_for(item.category),
        "updated_fields": list(updates.keys()),
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
    return _to_response(item)


@router.post(
    "/{item_id}/adjust",
    response_model=InventoryItemResponse,
    summary="Adjust inventory quantity (Admin)",
    dependencies=[Depends(admin_only)],
)
async def adjust_item_quantity(
    item_id: int,
    dto: InventoryStockAdjust,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(InventoryItem).where(InventoryItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise NotFoundException("Inventory item not found")

    previous_status = item.status
    quantity_before = item.quantity
    if dto.operation == "DECREASE" and dto.amount > item.quantity:
        raise ConflictException("Cannot decrease stock below zero")

    delta = dto.amount if dto.operation == "INCREASE" else -dto.amount
    item.quantity += delta
    _refresh_stock_fields(item)
    await db.commit()
    await db.refresh(item)

    extra_data = {
        "item_name": item.name,
        "operation": dto.operation,
        "amount": dto.amount,
        "reason": dto.reason,
        "quantity_before": quantity_before,
        "quantity_after": item.quantity,
        "status": item.status.value,
        "low_stock_threshold": _threshold_for(item.category),
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
    return _to_response(item)


@router.delete(
    "/{item_id}",
    status_code=204,
    summary="Delete inventory item (Admin)",
    dependencies=[Depends(admin_only)],
)
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
        "low_stock_threshold": _threshold_for(item.category),
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
