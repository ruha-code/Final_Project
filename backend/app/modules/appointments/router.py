from datetime import date, datetime, time, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core import event_bus
from app.core.database import get_db
from app.core.dependencies import RoleChecker, get_current_user
from app.core.exceptions import (
    ConflictException,
    ForbiddenException,
    NotFoundException,
    ValidationException,
)
from app.core.pagination import paginate
from app.modules.appointments.models import (
    Appointment,
    AppointmentStatus,
    AppointmentType,
)
from app.modules.appointments.schemas import (
    AppointmentCreate,
    AppointmentDetailResponse,
    AppointmentResponse,
    CompleteRequest,
)
from app.modules.audit.router import Actions, log
from app.modules.auth.models import User
from app.modules.doctors.models import Doctor, DoctorSchedule
from app.modules.patients.models import Patient

router = APIRouter()


def _load_opts():
    return [
        selectinload(Appointment.patient).selectinload(Patient.user),
        selectinload(Appointment.doctor).selectinload(Doctor.user),
    ]


def _build_detail(apt: Appointment) -> AppointmentDetailResponse:
    return AppointmentDetailResponse(
        id=apt.id,
        patient_id=apt.patient_id,
        doctor_id=apt.doctor_id,
        appointment_time=apt.appointment_time,
        duration_minutes=apt.duration_minutes,
        appointment_type=apt.appointment_type,
        status=apt.status,
        reason=apt.reason,
        notes=apt.notes,
        completed_at=apt.completed_at,
        cancelled_at=apt.cancelled_at,
        created_at=apt.created_at,
        patient_name=apt.patient.user.full_name,
        doctor_name=apt.doctor.user.full_name,
        doctor_specialty=apt.doctor.specialty,
    )


def _normalize_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _strip_timezone(value: time) -> time:
    return value.replace(tzinfo=None)


def _is_within_schedule(
    start_time: time,
    duration_minutes: int,
    schedule: DoctorSchedule,
) -> bool:
    local_start = datetime.combine(date.min, _strip_timezone(start_time))
    local_end = local_start + timedelta(minutes=duration_minutes)
    schedule_start = datetime.combine(date.min, schedule.start_time)
    schedule_end = datetime.combine(date.min, schedule.end_time)
    return schedule_start <= local_start and local_end <= schedule_end


async def _check_doctor_conflict(
    doctor_id: int,
    start: datetime,
    duration: int,
    db: AsyncSession,
) -> bool:
    start = _normalize_utc(start)
    end = start + timedelta(minutes=duration)
    result = await db.execute(
        select(Appointment).where(
            Appointment.doctor_id == doctor_id,
            Appointment.status != AppointmentStatus.CANCELLED,
            Appointment.appointment_time < end,
        )
    )
    for existing in result.scalars().all():
        existing_start = _normalize_utc(existing.appointment_time)
        existing_end = existing_start + timedelta(minutes=existing.duration_minutes)
        if existing_end > start:
            return True
    return False


async def _check_patient_conflict(
    patient_id: int,
    start: datetime,
    duration: int,
    db: AsyncSession,
) -> bool:
    start = _normalize_utc(start)
    end = start + timedelta(minutes=duration)
    result = await db.execute(
        select(Appointment).where(
            Appointment.patient_id == patient_id,
            Appointment.status != AppointmentStatus.CANCELLED,
            Appointment.appointment_time < end,
        )
    )
    for existing in result.scalars().all():
        existing_start = _normalize_utc(existing.appointment_time)
        existing_end = existing_start + timedelta(minutes=existing.duration_minutes)
        if existing_end > start:
            return True
    return False


@router.post(
    "",
    response_model=AppointmentDetailResponse,
    status_code=201,
    summary="Book an appointment",
)
async def book_appointment(
    dto: AppointmentCreate,
    current_user: User = Depends(RoleChecker(["PATIENT"])),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Patient).where(Patient.user_id == current_user.id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise NotFoundException("Set up your patient profile first")

    result = await db.execute(
        select(Doctor).options(selectinload(Doctor.user)).where(Doctor.id == dto.doctor_id)
    )
    doctor = result.scalar_one_or_none()
    if not doctor or not doctor.user or not doctor.user.is_active:
        raise NotFoundException("Doctor not found")
    if not doctor.is_available:
        raise ValidationException("Doctor is currently unavailable for appointments")

    local_appt_time = dto.appointment_time
    appt_time = _normalize_utc(local_appt_time)
    day_of_week = local_appt_time.weekday()
    local_start_time = _strip_timezone(local_appt_time.timetz())

    result = await db.execute(
        select(DoctorSchedule).where(
            DoctorSchedule.doctor_id == doctor.id,
            DoctorSchedule.day_of_week == day_of_week,
            DoctorSchedule.is_available == True,
        )
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        raise ValidationException("Doctor is not available on this day")

    if not _is_within_schedule(
        local_start_time,
        doctor.consultation_duration_minutes,
        schedule,
    ):
        raise ValidationException(
            f"Outside working hours ({schedule.start_time}-{schedule.end_time})"
        )

    if await _check_doctor_conflict(
        doctor.id,
        appt_time,
        doctor.consultation_duration_minutes,
        db,
    ):
        raise ConflictException("Doctor is already booked at this time")

    if await _check_patient_conflict(
        patient.id,
        appt_time,
        doctor.consultation_duration_minutes,
        db,
    ):
        raise ConflictException("You already have an appointment at this time")

    await db.execute(
        select(Doctor).where(Doctor.id == doctor.id).with_for_update()
    )
    await db.execute(
        select(Patient).where(Patient.id == patient.id).with_for_update()
    )

    if await _check_doctor_conflict(
        doctor.id,
        appt_time,
        doctor.consultation_duration_minutes,
        db,
    ):
        raise ConflictException("Doctor is already booked at this time")

    if await _check_patient_conflict(
        patient.id,
        appt_time,
        doctor.consultation_duration_minutes,
        db,
    ):
        raise ConflictException("You already have an appointment at this time")

    appointment = Appointment(
        patient_id=patient.id,
        doctor_id=doctor.id,
        appointment_time=appt_time,
        duration_minutes=doctor.consultation_duration_minutes,
        appointment_type=dto.appointment_type,
        status=AppointmentStatus.SCHEDULED,
        reason=dto.reason,
    )
    db.add(appointment)
    await db.commit()

    result = await db.execute(
        select(Appointment)
        .options(*_load_opts())
        .where(Appointment.id == appointment.id)
    )
    appointment = result.scalar_one()
    await log(
        db,
        current_user.id,
        Actions.BOOK_APPOINTMENT,
        entity_type="Appointment",
        entity_id=appointment.id,
    )
    await event_bus.publish(
        "appointment_created",
        {
            "appointment_id": appointment.id,
            "patient_email": appointment.patient.user.email,
            "patient_name": appointment.patient.user.full_name,
            "doctor_email": appointment.doctor.user.email,
            "doctor_name": appointment.doctor.user.full_name,
            "appointment_time": local_appt_time.strftime("%B %d, %Y at %I:%M %p"),
            "appointment_type": appointment.appointment_type,
            "reason": appointment.reason,
        },
    )
    await event_bus.publish("notifications_refresh", {})
    return _build_detail(appointment)


@router.get(
    "/my",
    response_model=list[AppointmentDetailResponse],
    summary="Get my appointments",
)
async def get_my_appointments(
    status: Optional[str] = Query(default=None),
    from_date: Optional[date] = Query(default=None),
    to_date: Optional[date] = Query(default=None),
    current_user: User = Depends(RoleChecker(["PATIENT", "DOCTOR"])),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role == "PATIENT":
        result = await db.execute(select(Patient).where(Patient.user_id == current_user.id))
        patient = result.scalar_one_or_none()
        if not patient:
            raise NotFoundException("Patient profile not found")
        query = (
            select(Appointment)
            .options(*_load_opts())
            .where(Appointment.patient_id == patient.id)
        )
    else:
        result = await db.execute(select(Doctor).where(Doctor.user_id == current_user.id))
        doctor = result.scalar_one_or_none()
        if not doctor:
            raise NotFoundException("Doctor profile not found")
        query = (
            select(Appointment)
            .options(*_load_opts())
            .where(Appointment.doctor_id == doctor.id)
        )

    if status:
        query = query.where(Appointment.status == status.upper())
    if from_date:
        query = query.where(
            Appointment.appointment_time
            >= datetime.combine(from_date, time.min, tzinfo=timezone.utc)
        )
    if to_date:
        query = query.where(
            Appointment.appointment_time
            <= datetime.combine(to_date, time.max, tzinfo=timezone.utc)
        )

    query = query.order_by(Appointment.appointment_time)
    result = await db.execute(query)
    return [_build_detail(appointment) for appointment in result.scalars().all()]


@router.put(
    "/{appointment_id}/start",
    response_model=AppointmentResponse,
    summary="Start an appointment (Doctor)",
)
async def start_appointment(
    appointment_id: int,
    current_user: User = Depends(RoleChecker(["DOCTOR"])),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise NotFoundException("Appointment not found")

    result = await db.execute(select(Doctor).where(Doctor.user_id == current_user.id))
    doctor = result.scalar_one_or_none()
    if not doctor or appointment.doctor_id != doctor.id:
        raise ForbiddenException("This is not your appointment")

    if appointment.status == AppointmentStatus.CANCELLED:
        raise ValidationException("Cannot start a cancelled appointment")
    if appointment.status == AppointmentStatus.COMPLETED:
        raise ValidationException("Appointment is already completed")
    if appointment.status == AppointmentStatus.ONGOING:
        raise ValidationException("Appointment is already in progress")

    appointment.status = AppointmentStatus.ONGOING
    await db.commit()

    result = await db.execute(
        select(Appointment).options(*_load_opts()).where(Appointment.id == appointment.id)
    )
    appointment = result.scalar_one()
    await log(
        db,
        current_user.id,
        "START_APPOINTMENT",
        entity_type="Appointment",
        entity_id=appointment.id,
    )
    await event_bus.publish("notifications_refresh", {})
    return appointment


@router.put(
    "/{appointment_id}/cancel",
    response_model=AppointmentResponse,
    summary="Cancel an appointment",
)
async def cancel_appointment(
    appointment_id: int,
    current_user: User = Depends(RoleChecker(["PATIENT", "DOCTOR"])),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise NotFoundException("Appointment not found")

    if current_user.role == "PATIENT":
        result = await db.execute(select(Patient).where(Patient.user_id == current_user.id))
        patient = result.scalar_one_or_none()
        if not patient or appointment.patient_id != patient.id:
            raise ForbiddenException("This is not your appointment")
    else:
        result = await db.execute(select(Doctor).where(Doctor.user_id == current_user.id))
        doctor = result.scalar_one_or_none()
        if not doctor or appointment.doctor_id != doctor.id:
            raise ForbiddenException("This is not your appointment")

    if appointment.status in (AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED):
        raise ValidationException(f"Appointment is already {appointment.status}")

    appointment.status = AppointmentStatus.CANCELLED
    appointment.cancelled_at = datetime.now(timezone.utc)
    appointment.cancelled_by = current_user.id
    await db.commit()

    result = await db.execute(
        select(Appointment).options(*_load_opts()).where(Appointment.id == appointment.id)
    )
    appointment = result.scalar_one()
    await log(
        db,
        current_user.id,
        Actions.CANCEL_APPOINTMENT,
        entity_type="Appointment",
        entity_id=appointment.id,
    )
    await event_bus.publish(
        "appointment_cancelled",
        {
            "appointment_id": appointment.id,
            "patient_email": appointment.patient.user.email,
            "patient_name": appointment.patient.user.full_name,
            "doctor_email": appointment.doctor.user.email,
            "doctor_name": appointment.doctor.user.full_name,
            "appointment_time": appointment.appointment_time.strftime("%B %d, %Y at %I:%M %p"),
            "cancelled_by_name": current_user.full_name,
        },
    )
    await event_bus.publish("notifications_refresh", {})
    return appointment


@router.put(
    "/{appointment_id}/complete",
    response_model=AppointmentResponse,
    summary="Complete an appointment (Doctor)",
)
async def complete_appointment(
    appointment_id: int,
    dto: CompleteRequest,
    current_user: User = Depends(RoleChecker(["DOCTOR"])),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise NotFoundException("Appointment not found")

    result = await db.execute(select(Doctor).where(Doctor.user_id == current_user.id))
    doctor = result.scalar_one_or_none()
    if not doctor or appointment.doctor_id != doctor.id:
        raise ForbiddenException("This is not your appointment")

    if appointment.status == AppointmentStatus.CANCELLED:
        raise ValidationException("Cannot complete a cancelled appointment")
    if appointment.status == AppointmentStatus.COMPLETED:
        raise ValidationException("Appointment is already completed")

    appointment.status = AppointmentStatus.COMPLETED
    appointment.completed_at = datetime.now(timezone.utc)
    if dto.notes:
        appointment.notes = dto.notes

    await db.commit()

    result = await db.execute(
        select(Appointment).options(*_load_opts()).where(Appointment.id == appointment.id)
    )
    appointment = result.scalar_one()
    await log(
        db,
        current_user.id,
        Actions.COMPLETE_APPOINTMENT,
        entity_type="Appointment",
        entity_id=appointment.id,
    )
    await event_bus.publish(
        "appointment_completed",
        {
            "appointment_id": appointment.id,
            "patient_email": appointment.patient.user.email,
            "patient_name": appointment.patient.user.full_name,
            "doctor_name": appointment.doctor.user.full_name,
            "appointment_time": appointment.appointment_time.strftime("%B %d, %Y at %I:%M %p"),
            "notes": appointment.notes,
        },
    )
    await event_bus.publish("notifications_refresh", {})
    return appointment


@router.get(
    "/admin/all",
    summary="List all appointments (Admin)",
    dependencies=[Depends(RoleChecker(["ADMIN"]))],
)
async def get_all_appointments(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, le=100),
    all_records: bool = Query(False, alias="all"),
    status: Optional[str] = None,
    doctor_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Appointment).options(*_load_opts())
    if status:
        query = query.where(Appointment.status == status.upper())
    if doctor_id:
        query = query.where(Appointment.doctor_id == doctor_id)
    query = query.order_by(Appointment.appointment_time.desc(), Appointment.id.desc())
    if all_records:
        result = await db.execute(query)
        items = result.scalars().all()
        detailed_items = [_build_detail(appointment) for appointment in items]
        total = len(detailed_items)
        return {
            "items": detailed_items,
            "total": total,
            "page": 1,
            "page_size": total or 1,
            "pages": 1,
            "has_next": False,
        }
    result = await paginate(query, page, page_size, db)
    result.items = [_build_detail(appointment) for appointment in result.items]
    return result


@router.put(
    "/{appointment_id}/admin-cancel",
    summary="Admin cancel appointment",
)
async def admin_cancel_appointment(
    appointment_id: int,
    reason: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ADMIN"])),
):
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if appointment.status == AppointmentStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Already cancelled")
    if appointment.status == AppointmentStatus.COMPLETED:
        raise ValidationException("Completed appointments cannot be cancelled")

    appointment.status = AppointmentStatus.CANCELLED
    appointment.cancelled_at = datetime.now(timezone.utc)
    appointment.cancelled_by = current_user.id
    if reason:
        appointment.notes = reason

    await db.commit()

    result = await db.execute(
        select(Appointment).options(*_load_opts()).where(Appointment.id == appointment.id)
    )
    appointment = result.scalar_one()
    await log(
        db,
        current_user.id,
        Actions.CANCEL_APPOINTMENT,
        entity_type="Appointment",
        entity_id=appointment.id,
    )
    await event_bus.publish(
        "appointment_cancelled",
        {
            "appointment_id": appointment.id,
            "patient_email": appointment.patient.user.email,
            "patient_name": appointment.patient.user.full_name,
            "doctor_email": appointment.doctor.user.email,
            "doctor_name": appointment.doctor.user.full_name,
            "appointment_time": appointment.appointment_time.strftime("%B %d, %Y at %I:%M %p"),
            "cancelled_by_name": "Admin",
        },
    )
    await event_bus.publish("notifications_refresh", {})
    return {"message": "Appointment cancelled by admin"}


@router.delete(
    "/{appointment_id}",
    summary="Delete appointment (Admin)",
    dependencies=[Depends(RoleChecker(["ADMIN"]))],
)
async def delete_appointment(
    appointment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if appointment.status != AppointmentStatus.CANCELLED:
        raise ValidationException("Only cancelled appointments can be deleted")

    await db.delete(appointment)
    await db.commit()
    await log(
        db,
        current_user.id,
        "DELETE_APPOINTMENT",
        entity_type="Appointment",
        entity_id=appointment_id,
    )
    await event_bus.publish("notifications_refresh", {})
    return {"message": "Appointment deleted"}
