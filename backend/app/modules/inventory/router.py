from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import event_bus
from app.core.database import get_db
from app.core.dependencies import RoleChecker, get_current_user
from app.core.exceptions import ConflictException, ForbiddenException, NotFoundException, ValidationException
from app.modules.audit.models import AuditLog
from app.modules.audit.router import Actions, log
from app.modules.audit.schemas import AuditLogResponse
from app.modules.auth.models import User, UserRole
from app.modules.inventory.models import InventoryCategory, InventoryItem, InventoryStatus
from app.modules.inventory.schemas import (
    InventoryItemCreate,
    InventoryItemResponse,
    InventoryItemUpdate,
    InventoryStockAdjust,
    validate_unit_for_category,
)

router = APIRouter()
admin_only = RoleChecker(["ADMIN"])
doctor_or_admin = RoleChecker(["ADMIN", "DOCTOR"])

LOW_STOCK_THRESHOLDS = {
    InventoryCategory.MEDICATIONS: 100,
    InventoryCategory.CONSUMABLES: 50,
    InventoryCategory.LABORATORY: 20,
    InventoryCategory.OTHER: 10,
}


def _threshold_for(category: InventoryCategory) -> int:
    return LOW_STOCK_THRESHOLDS.get(category, LOW_STOCK_THRESHOLDS[InventoryCategory.OTHER])


def _target_quantity_for(category: InventoryCategory) -> int:
    return max(_threshold_for(category) * 4, 1)


def _refresh_stock_fields(item: InventoryItem) -> None:
    """Set stock percentage and status from quantity using category thresholds."""
    threshold = _threshold_for(item.category)
    if item.quantity <= 0:
        item.status = InventoryStatus.OUT
    elif item.quantity <= threshold:
        item.status = InventoryStatus.LOW
    else:
        item.status = InventoryStatus.AVAILABLE

    reference = _target_quantity_for(item.category)
    item.stock_percentage = max(0, min(100, round((item.quantity / reference) * 100)))


def _is_low_stock(status: InventoryStatus) -> bool:
    return status in {InventoryStatus.LOW, InventoryStatus.OUT}


def _is_expired(item: InventoryItem, *, today: Optional[date] = None) -> bool:
    reference_date = today or date.today()
    return item.expires_at is not None and item.expires_at < reference_date


def _is_expiring_soon(item: InventoryItem, *, today: Optional[date] = None) -> bool:
    reference_date = today or date.today()
    return (
        item.expires_at is not None
        and reference_date <= item.expires_at <= reference_date + timedelta(days=30)
    )


def _display_status(item: InventoryItem, *, today: Optional[date] = None) -> str:
    if _is_expired(item, today=today):
        return "EXPIRED"
    return item.status.value


def _matches_status_filter(item: InventoryItem, status_filter: Optional[str]) -> bool:
    if not status_filter:
        return True

    normalized = status_filter.strip().upper()
    if normalized in {"AVAILABLE", "LOW", "OUT", "EXPIRED"}:
        return _display_status(item) == normalized
    if normalized == "EXPIRING_SOON":
        return _is_expiring_soon(item)
    return False


def _to_response(item: InventoryItem) -> InventoryItemResponse:
    today = date.today()
    is_expired = _is_expired(item, today=today)
    is_expiring_soon = _is_expiring_soon(item, today=today)
    display_status = _display_status(item, today=today)
    days_until_expiry = None
    if item.expires_at is not None:
        days_until_expiry = (item.expires_at - today).days
    data = InventoryItemResponse.model_validate(item)
    data.status = display_status
    data.stock_status = item.status.value
    data.low_stock_threshold = _threshold_for(item.category)
    data.target_quantity = _target_quantity_for(item.category)
    data.is_expired = is_expired
    data.is_expiring_soon = is_expiring_soon
    data.days_until_expiry = days_until_expiry
    return data


@router.get(
    "",
    response_model=list[InventoryItemResponse],
    summary="List inventory items",
    dependencies=[Depends(doctor_or_admin)],
)
async def list_inventory(
    status: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    query = select(InventoryItem).order_by(InventoryItem.name)
    if category:
        query = query.where(InventoryItem.category == category.upper())

    result = await db.execute(query)
    items = result.scalars().all()

    if status:
        items = [item for item in items if _matches_status_filter(item, status)]

    if search:
        term = search.lower().strip()
        items = [
            item
            for item in items
            if term in item.name.lower()
            or term in str(item.category.value).lower()
            or term in str(item.unit).lower()
            or term in _display_status(item).lower()
            or (term in {"expiring", "expiring soon"} and _is_expiring_soon(item))
        ]

    return [_to_response(item) for item in items]


@router.get(
    "/activities",
    response_model=list[AuditLogResponse],
    summary="Recent inventory activities",
    dependencies=[Depends(doctor_or_admin)],
)
async def list_inventory_activities(
    limit: int = Query(default=10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AuditLog)
        .where(AuditLog.action.like("INVENTORY_%"))
        .order_by(desc(AuditLog.created_at))
        .limit(limit)
    )
    entries = result.scalars().all()

    return [
        AuditLogResponse(
            id=entry.id,
            user_id=entry.user_id,
            action=entry.action,
            action_key=entry.action,
            action_label=entry.action.replace("_", " ").title(),
            entity_type=entry.entity_type,
            entity_id=entry.entity_id,
            target_label=(
                f"{entry.entity_type} #{entry.entity_id}"
                if entry.entity_type and entry.entity_id is not None
                else entry.entity_type or (f"Entity #{entry.entity_id}" if entry.entity_id is not None else "-")
            ),
            actor_name=entry.actor_name,
            actor_username=entry.actor_username,
            actor_role=entry.actor_role,
            extra_data=entry.extra_data,
            ip_address=entry.ip_address,
            user_agent=entry.user_agent,
            created_at=entry.created_at,
        )
        for entry in entries
    ]


@router.get(
    "/{item_id}",
    response_model=InventoryItemResponse,
    summary="Get inventory item",
    dependencies=[Depends(doctor_or_admin)],
)
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
    try:
        item.unit = validate_unit_for_category(item.unit, item.category)
    except ValueError as exc:
        raise ValidationException(str(exc)) from exc
    _refresh_stock_fields(item)
    db.add(item)
    await db.commit()
    await db.refresh(item)

    extra_data = {
        "item_name": item.name,
        "category": item.category.value,
        "status": item.status.value,
        "quantity": item.quantity,
        "unit": item.unit,
        "target_quantity": _target_quantity_for(item.category),
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

    try:
        item.unit = validate_unit_for_category(item.unit, item.category)
    except ValueError as exc:
        raise ValidationException(str(exc)) from exc
    _refresh_stock_fields(item)
    await db.commit()
    await db.refresh(item)

    extra_data = {
        "item_name": item.name,
        "category": item.category.value,
        "status": item.status.value,
        "quantity": item.quantity,
        "unit": item.unit,
        "target_quantity": _target_quantity_for(item.category),
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
    summary="Adjust inventory quantity (Admin or Doctor use-stock)",
    dependencies=[Depends(doctor_or_admin)],
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
    if _is_expired(item):
        raise ConflictException("Expired items cannot be adjusted. Update the expiry or create a new item.")
    if current_user.role == UserRole.DOCTOR and dto.operation != "DECREASE":
        raise ForbiddenException("Doctors can only use stock")

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
        "category": item.category.value,
        "unit": item.unit,
        "quantity_before": quantity_before,
        "quantity_after": item.quantity,
        "status": item.status.value,
        "target_quantity": _target_quantity_for(item.category),
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
        "category": item.category.value,
        "status": item.status.value,
        "quantity": item.quantity,
        "unit": item.unit,
        "target_quantity": _target_quantity_for(item.category),
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
