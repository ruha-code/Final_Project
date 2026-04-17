from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from datetime import date, datetime, timedelta, time, timezone

from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.core.exceptions import NotFoundException, ConflictException
from app.modules.audit.router import Actions, log
from app.modules.auth.models import User, UserRole
from app.modules.doctors.models import Doctor, DoctorSchedule, LicenseStatus
from app.modules.appointments.models import Appointment
from app.modules.doctors.schemas import (
    DoctorProfileCreate,
    DoctorProfileUpdate,
    DoctorDetailResponse,
    ScheduleSlotCreate,
    ScheduleSlotResponse,
    AvailableSlotsResponse,
)

router = APIRouter()
doctor_only = RoleChecker([UserRole.DOCTOR])


def _build_detail(doctor: Doctor) -> DoctorDetailResponse:
    """Merge Doctor + User + Department into one response dict."""
    return DoctorDetailResponse(
        id=doctor.id,
        user_id=doctor.user_id,
        department_id=doctor.department_id,
        department_name=doctor.department.name if doctor.department else None,
        specialty=doctor.specialty,
        bio=doctor.bio,
        years_of_experience=doctor.years_of_experience,
        consultation_duration_minutes=doctor.consultation_duration_minutes,
        is_available=doctor.is_available,
        rating=doctor.rating,
        license_number=doctor.license_number,
        license_status=doctor.license_status,
        created_at=doctor.created_at,
        updated_at=doctor.updated_at,
        full_name=doctor.user.full_name,
        email=doctor.user.email,
        phone=doctor.user.phone,
        avatar_url=doctor.user.avatar_url,
    )


@router.get(
    "", response_model=list[DoctorDetailResponse], summary="List all doctors (public)"
)
async def list_doctors(
    department_id: int | None = Query(default=None, description="Filter by department"),
    is_available: bool | None = Query(
        default=None, description="Filter by availability"
    ),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy.orm import selectinload

    query = select(Doctor).options(
        selectinload(Doctor.user),
        selectinload(Doctor.department),
    )
    if department_id:
        query = query.where(Doctor.department_id == department_id)
    if is_available is not None:
        query = query.where(Doctor.is_available == is_available)

    result = await db.execute(query)
    doctors = result.scalars().all()
    return [_build_detail(d) for d in doctors]


@router.post(
    "/profile",
    response_model=DoctorDetailResponse,
    status_code=201,
    summary="Set up doctor profile",
)
async def setup_doctor_profile(
    dto: DoctorProfileCreate,
    current_user: User = Depends(doctor_only),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy.orm import selectinload

    result = await db.execute(select(Doctor).where(Doctor.user_id == current_user.id))
    if result.scalar_one_or_none():
        raise ConflictException("Doctor profile already exists for this account")

    doctor = Doctor(
        user_id=current_user.id,
        department_id=dto.department_id,
        specialty=dto.specialty,
        license_number=dto.license_number,
        license_status=LicenseStatus.PENDING,
        years_of_experience=dto.years_of_experience or 0,
        consultation_duration_minutes=dto.consultation_duration_minutes,
        bio=dto.bio,
        is_available=True,
        rating=0.0,
    )
    db.add(doctor)
    await db.commit()

    result = await db.execute(
        select(Doctor)
        .options(selectinload(Doctor.user), selectinload(Doctor.department))
        .where(Doctor.id == doctor.id)
    )
    doctor = result.scalar_one()
    await log(
        db,
        current_user.id,
        Actions.SETUP_DOCTOR_PROFILE,
        entity_type="Doctor",
        entity_id=doctor.id,
    )
    return _build_detail(doctor)


@router.get("/me", response_model=DoctorDetailResponse, summary="Get my doctor profile")
async def get_my_doctor_profile(
    current_user: User = Depends(doctor_only),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(Doctor)
        .options(selectinload(Doctor.user), selectinload(Doctor.department))
        .where(Doctor.user_id == current_user.id)
    )
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise NotFoundException("Doctor profile not found. Please set it up first.")
    return _build_detail(doctor)


@router.put(
    "/me", response_model=DoctorDetailResponse, summary="Update my doctor profile"
)
async def update_my_doctor_profile(
    dto: DoctorProfileUpdate,
    current_user: User = Depends(doctor_only),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(Doctor)
        .options(selectinload(Doctor.user), selectinload(Doctor.department))
        .where(Doctor.user_id == current_user.id)
    )
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise NotFoundException("Doctor profile not found.")

    updates = dto.model_dump(exclude_none=True)

    if "full_name" in updates:
        current_user.full_name = updates.pop("full_name")
    if "phone" in updates:
        current_user.phone = updates.pop("phone")

    if "department_id" in updates:
        doctor.department_id = updates.pop("department_id")
    if "specialty" in updates:
        doctor.specialty = updates.pop("specialty")
    if "years_of_experience" in updates:
        doctor.years_of_experience = updates.pop("years_of_experience")
    if "consultation_duration_minutes" in updates:
        doctor.consultation_duration_minutes = updates.pop("consultation_duration_minutes")
    if "bio" in updates:
        doctor.bio = updates.pop("bio")
    if "is_available" in updates:
        doctor.is_available = updates.pop("is_available")

    await db.commit()
    result = await db.execute(
        select(Doctor)
        .options(selectinload(Doctor.user), selectinload(Doctor.department))
        .where(Doctor.user_id == current_user.id)
    )
    doctor = result.scalar_one()
    return _build_detail(doctor)


@router.post(
    "/schedule",
    response_model=list[ScheduleSlotResponse],
    summary="Set weekly availability",
)
async def set_schedule(
    slots: list[ScheduleSlotCreate],
    current_user: User = Depends(doctor_only),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Doctor).where(Doctor.user_id == current_user.id))
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise NotFoundException("Set up your doctor profile first.")

    saved = []
    for slot in slots:
        result = await db.execute(
            select(DoctorSchedule).where(
                DoctorSchedule.doctor_id == doctor.id,
                DoctorSchedule.day_of_week == slot.day_of_week,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            existing.start_time = slot.start_time
            existing.end_time = slot.end_time
            existing.is_available = slot.is_available
            saved.append(existing)
        else:
            new_slot = DoctorSchedule(
                doctor_id=doctor.id,
                day_of_week=slot.day_of_week,
                start_time=slot.start_time,
                end_time=slot.end_time,
                is_available=slot.is_available,
            )
            db.add(new_slot)
            saved.append(new_slot)

    await db.commit()
    for s in saved:
        await db.refresh(s)
    await log(
        db,
        current_user.id,
        Actions.SET_DOCTOR_SCHEDULE,
        entity_type="Doctor",
        entity_id=doctor.id,
    )
    return saved


@router.get(
    "/schedule",
    response_model=list[ScheduleSlotResponse],
    summary="Get my weekly schedule",
)
async def get_my_schedule(
    current_user: User = Depends(doctor_only),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Doctor).where(Doctor.user_id == current_user.id))
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise NotFoundException("Doctor profile not found.")

    result = await db.execute(
        select(DoctorSchedule)
        .where(DoctorSchedule.doctor_id == doctor.id)
        .order_by(DoctorSchedule.day_of_week)
    )
    return result.scalars().all()


@router.get(
    "/{doctor_id}",
    response_model=DoctorDetailResponse,
    summary="Get doctor details",
)
async def get_doctor_by_id(
    doctor_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Doctor)
        .options(selectinload(Doctor.user), selectinload(Doctor.department))
        .where(Doctor.id == doctor_id)
    )
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise NotFoundException("Doctor not found")
    return _build_detail(doctor)


@router.get(
    "/{doctor_id}/available-slots",
    response_model=AvailableSlotsResponse,
    summary="Get available slots for a doctor",
)
async def get_available_slots(
    doctor_id: int,
    date: date = Query(..., description="Date YYYY-MM-DD"),
    timezone_offset_minutes: int = Query(
        default=0,
        ge=-720,
        le=840,
        description="Browser timezone offset in minutes (Date.getTimezoneOffset)",
    ),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Doctor).where(Doctor.id == doctor_id))
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise NotFoundException("Doctor not found")

    day_of_week = date.weekday()
    result = await db.execute(
        select(DoctorSchedule).where(
            DoctorSchedule.doctor_id == doctor_id,
            DoctorSchedule.day_of_week == day_of_week,
            DoctorSchedule.is_available == True,
        )
    )
    schedule = result.scalar_one_or_none()
    if not schedule:
        return AvailableSlotsResponse(
            doctor_id=doctor_id, date=str(date), available_slots=[]
        )

    duration = doctor.consultation_duration_minutes
    slots = []
    current = datetime.combine(date, schedule.start_time)
    end_boundary = datetime.combine(date, schedule.end_time)
    while current + timedelta(minutes=duration) <= end_boundary:
        slots.append(current.strftime("%H:%M"))
        current += timedelta(minutes=duration)

    client_timezone = timezone(timedelta(minutes=-timezone_offset_minutes))
    local_day_start = datetime.combine(date, time.min, tzinfo=client_timezone)
    local_day_end = datetime.combine(date, time.max, tzinfo=client_timezone)

    result = await db.execute(
        select(Appointment).where(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_time >= local_day_start.astimezone(timezone.utc),
            Appointment.appointment_time <= local_day_end.astimezone(timezone.utc),
            Appointment.status != "CANCELLED",
        )
    )
    booked_times = set()
    for appointment in result.scalars().all():
        appointment_local = appointment.appointment_time.astimezone(client_timezone)
        booked_times.add(appointment_local.strftime("%H:%M"))

    now_local = datetime.now(timezone.utc).astimezone(client_timezone)
    available = []

    for slot in slots:
        slot_hour, slot_minute = map(int, slot.split(":"))
        slot_local_datetime = datetime.combine(
            date,
            time(slot_hour, slot_minute),
            tzinfo=client_timezone,
        )
        if slot_local_datetime <= now_local:
            continue
        if slot in booked_times:
            continue
        available.append(slot)

    return AvailableSlotsResponse(
        doctor_id=doctor_id, date=str(date), available_slots=available
    )


# Admin endpoints for doctor management
@router.put(
    "/{doctor_id}", response_model=DoctorDetailResponse, summary="Update doctor (Admin)"
)
async def update_doctor_admin(
    doctor_id: int,
    dto: DoctorProfileUpdate,
    current_user: User = Depends(RoleChecker(["ADMIN"])),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Doctor)
        .options(selectinload(Doctor.user), selectinload(Doctor.department))
        .where(Doctor.id == doctor_id)
    )
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise NotFoundException("Doctor not found")

    for field, value in dto.model_dump(exclude_none=True).items():
        if field == "department_id":
            doctor.department_id = value
        else:
            setattr(doctor, field, value)

    await db.commit()
    await db.refresh(doctor)
    await log(
        db, current_user.id, "UPDATE_DOCTOR", entity_type="Doctor", entity_id=doctor.id
    )
    return _build_detail(doctor)


@router.delete("/{doctor_id}", status_code=204, summary="Delete doctor (Admin)")
async def delete_doctor_admin(
    doctor_id: int,
    current_user: User = Depends(RoleChecker(["ADMIN"])),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Doctor).options(selectinload(Doctor.user)).where(Doctor.id == doctor_id)
    )
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise NotFoundException("Doctor not found")

    user_id = doctor.user_id
    await db.delete(doctor)
    await db.execute(select(User).where(User.id == user_id))
    await db.delete(doctor.user)
    await db.commit()
    await log(
        db, current_user.id, "DELETE_DOCTOR", entity_type="Doctor", entity_id=doctor_id
    )
    return None
