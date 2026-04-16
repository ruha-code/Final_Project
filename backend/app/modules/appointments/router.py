from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, select
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta, date, time
from typing import Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.core.exceptions import (
    NotFoundException,
    ConflictException,
    ValidationException,
    ForbiddenException,
)
from app.core import event_bus
from app.core.pagination import paginate
from app.modules.audit.router import Actions, log
from app.modules.auth.models import User
from app.modules.patients.models import Patient
from app.modules.doctors.models import Doctor, DoctorSchedule
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


async def _check_doctor_conflict(doctor_id, start, duration, db):
    end = start + timedelta(minutes=duration)
    result = await db.execute(
        select(Appointment).where(
            Appointment.doctor_id == doctor_id,
            Appointment.status != AppointmentStatus.CANCELLED,
            Appointment.appointment_time >= start,
            Appointment.appointment_time < end,
        )
    )
    return result.scalar_one_or_none() is not None


async def _check_patient_conflict(patient_id, start, duration, db):
    end = start + timedelta(minutes=duration)
    result = await db.execute(
        select(Appointment).where(
            Appointment.patient_id == patient_id,
            Appointment.status != AppointmentStatus.CANCELLED,
            Appointment.appointment_time >= start,
            Appointment.appointment_time < end,
        )
    )
    return result.scalar_one_or_none() is not None


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

    result = await db.execute(select(Doctor).where(Doctor.id == dto.doctor_id))
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise NotFoundException("Doctor not found")

    appt_time = dto.appointment_time.replace(tzinfo=None)
    day_of_week = appt_time.weekday()

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

    if not (schedule.start_time <= appt_time.time() < schedule.end_time):
        raise ValidationException(
            f"Outside working hours ({schedule.start_time}–{schedule.end_time})"
        )

    if await _check_doctor_conflict(
        doctor.id, appt_time, doctor.consultation_duration_minutes, db
    ):
        raise ConflictException("Doctor is already booked at this time")

    if await _check_patient_conflict(
        patient.id, appt_time, doctor.consultation_duration_minutes, db
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
    await event_bus.publish("appointment_created", {"appointment_id": appointment.id})
    return _build_detail(appointment)


@router.get(
    "/my", response_model=list[AppointmentDetailResponse], summary="Get my appointments"
)
async def get_my_appointments(
    status: Optional[str] = Query(default=None),
    from_date: Optional[date] = Query(default=None),
    to_date: Optional[date] = Query(default=None),
    current_user: User = Depends(RoleChecker(["PATIENT", "DOCTOR"])),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role == "PATIENT":
        result = await db.execute(
            select(Patient).where(Patient.user_id == current_user.id)
        )
        patient = result.scalar_one_or_none()
        if not patient:
            raise NotFoundException("Patient profile not found")
        query = (
            select(Appointment)
            .options(*_load_opts())
            .where(Appointment.patient_id == patient.id)
        )
    else:
        result = await db.execute(
            select(Doctor).where(Doctor.user_id == current_user.id)
        )
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
            Appointment.appointment_time >= datetime.combine(from_date, time.min)
        )
    if to_date:
        query = query.where(
            Appointment.appointment_time <= datetime.combine(to_date, time.max)
        )

    query = query.order_by(Appointment.appointment_time)
    result = await db.execute(query)
    return [_build_detail(a) for a in result.scalars().all()]


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
    result = await db.execute(
        select(Appointment).where(Appointment.id == appointment_id)
    )
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise NotFoundException("Appointment not found")

    if current_user.role == "PATIENT":
        result = await db.execute(
            select(Patient).where(Patient.user_id == current_user.id)
        )
        patient = result.scalar_one_or_none()
        if not patient or appointment.patient_id != patient.id:
            raise ForbiddenException("This is not your appointment")
    else:
        result = await db.execute(
            select(Doctor).where(Doctor.user_id == current_user.id)
        )
        doctor = result.scalar_one_or_none()
        if not doctor or appointment.doctor_id != doctor.id:
            raise ForbiddenException("This is not your appointment")

    if appointment.status in (AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED):
        raise ValidationException(f"Appointment is already {appointment.status}")

    appointment.status = AppointmentStatus.CANCELLED
    appointment.cancelled_at = datetime.utcnow()
    appointment.cancelled_by = current_user.id
    await db.commit()
    await db.refresh(appointment)
    await log(
        db,
        current_user.id,
        Actions.CANCEL_APPOINTMENT,
        entity_type="Appointment",
        entity_id=appointment.id,
    )
    await event_bus.publish("appointment_cancelled", {"appointment_id": appointment.id})
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
    result = await db.execute(
        select(Appointment).where(Appointment.id == appointment_id)
    )
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
    appointment.completed_at = datetime.utcnow()
    if dto.notes:
        appointment.notes = dto.notes

    await db.commit()
    await db.refresh(appointment)
    await log(
        db,
        current_user.id,
        Actions.COMPLETE_APPOINTMENT,
        entity_type="Appointment",
        entity_id=appointment.id,
    )
    return appointment


@router.get(
    "/admin/all",
    summary="List all appointments (Admin)",
    dependencies=[Depends(RoleChecker(["ADMIN"]))],
)
async def get_all_appointments(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, le=100),
    status: Optional[str] = None,
    doctor_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Appointment).options(*_load_opts())
    if status:
        query = query.where(Appointment.status == status.upper())
    if doctor_id:
        query = query.where(Appointment.doctor_id == doctor_id)
    return await paginate(query, page, page_size, db)


@router.put(
    "/{appointment_id}/admin-cancel",
    summary="Admin cancel appointment",
    dependencies=[Depends(RoleChecker(["ADMIN"]))],
)
async def admin_cancel_appointment(
    appointment_id: int,
    reason: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Appointment).where(Appointment.id == appointment_id)
    )
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if appointment.status == AppointmentStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Already cancelled")

    appointment.status = AppointmentStatus.CANCELLED
    appointment.cancelled_at = datetime.utcnow()
    appointment.cancelled_by = current_user.id
    if reason:
        appointment.notes = reason

    await db.commit()
    await db.refresh(appointment)
    await log(
        db,
        current_user.id,
        Actions.CANCEL_APPOINTMENT,
        entity_type="Appointment",
        entity_id=appointment.id,
    )
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
    result = await db.execute(
        select(Appointment).where(Appointment.id == appointment_id)
    )
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    await db.delete(appointment)
    await db.commit()
    await log(
        db,
        current_user.id,
        "DELETE_APPOINTMENT",
        entity_type="Appointment",
        entity_id=appointment_id,
    )
    return {"message": "Appointment deleted"}
