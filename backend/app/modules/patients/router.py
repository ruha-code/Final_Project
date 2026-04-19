from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional
from app.modules.auth.models import User as UserModel

from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.core.exceptions import NotFoundException, ConflictException, ForbiddenException
from app.modules.audit.router import Actions, log
from app.modules.auth.models import User
from app.modules.patients.models import Patient, HealthVital
from app.modules.patients.schemas import (
    PatientProfileCreate,
    PatientProfileUpdate,
    DoctorNotesUpdate,
    PatientDetailResponse,
    HealthVitalCreate,
    HealthVitalResponse,
)

router = APIRouter()
patient_only = RoleChecker(["PATIENT"])


def _build_detail(patient: Patient) -> PatientDetailResponse:
    return PatientDetailResponse(
        id=patient.id,
        user_id=patient.user_id,
        date_of_birth=patient.date_of_birth,
        gender=patient.gender,
        blood_type=patient.blood_type,
        phone=patient.phone,
        address=patient.address,
        condition=patient.condition,
        notes=patient.notes,
        patient_type=patient.patient_type,
        patient_status=patient.patient_status,
        admission_date=patient.admission_date,
        room_location=patient.room_location,
        emergency_contact_name=patient.emergency_contact_name,
        emergency_contact_phone=patient.emergency_contact_phone,
        created_at=patient.created_at,
        updated_at=patient.updated_at,
        full_name=patient.user.full_name,
        email=patient.user.email,
        avatar_url=patient.user.avatar_url,
    )

@router.post(
    "/profile",
    response_model=PatientDetailResponse,
    status_code=201,
    summary="Set up patient profile",
)
async def setup_patient_profile(
    dto: PatientProfileCreate,
    current_user: User = Depends(patient_only),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Patient).where(Patient.user_id == current_user.id))
    patient = result.scalar_one_or_none()
    if patient:
        has_profile_data = any(
            [
                patient.date_of_birth is not None,
                patient.gender is not None,
                bool(patient.phone),
                bool(patient.address),
                bool(patient.condition),
                bool(patient.notes),
                patient.admission_date is not None,
                bool(patient.room_location),
                bool(patient.emergency_contact_name),
                bool(patient.emergency_contact_phone),
            ]
        )
        if has_profile_data:
            raise ConflictException("Patient profile already exists for this account")

        patient.date_of_birth = dto.date_of_birth
        patient.gender = dto.gender
        patient.phone = dto.phone
        patient.blood_type = dto.blood_type
        patient.address = dto.address
        patient.condition = dto.condition
        patient.notes = dto.notes
        patient.patient_type = dto.patient_type
        patient.admission_date = dto.admission_date
        patient.room_location = dto.room_location
        patient.emergency_contact_name = dto.emergency_contact_name
        patient.emergency_contact_phone = dto.emergency_contact_phone
    else:
        patient = Patient(
            user_id=current_user.id,
            date_of_birth=dto.date_of_birth,
            gender=dto.gender,
            phone=dto.phone,
            blood_type=dto.blood_type,
            address=dto.address,
            condition=dto.condition,
            notes=dto.notes,
            patient_type=dto.patient_type,
            admission_date=dto.admission_date,
            room_location=dto.room_location,
            emergency_contact_name=dto.emergency_contact_name,
            emergency_contact_phone=dto.emergency_contact_phone,
        )
        db.add(patient)
    await db.commit()

    result = await db.execute(
        select(Patient)
        .options(selectinload(Patient.user))
        .where(Patient.id == patient.id)
    )
    patient = result.scalar_one()
    await log(
        db,
        current_user.id,
        Actions.SETUP_PATIENT_PROFILE,
        entity_type="Patient",
        entity_id=patient.id,
    )
    return _build_detail(patient)


@router.get(
    "/me", response_model=PatientDetailResponse, summary="Get my patient profile"
)
async def get_my_patient_profile(
    current_user: User = Depends(patient_only),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Patient)
        .options(selectinload(Patient.user))
        .where(Patient.user_id == current_user.id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise NotFoundException("Patient profile not found. Please set it up first.")
    return _build_detail(patient)


@router.get(
    "/me/vitals",
    response_model=list[HealthVitalResponse],
    summary="Get my vitals history (Patient)",
)
async def get_my_vitals(
    limit: int = Query(default=50, ge=1, le=200, description="Max records to return"),
    current_user: User = Depends(patient_only),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Patient).where(Patient.user_id == current_user.id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise NotFoundException("Patient profile not found. Please set it up first.")

    result = await db.execute(
        select(HealthVital)
        .where(HealthVital.patient_id == patient.id)
        .order_by(HealthVital.recorded_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.put(
    "/me", response_model=PatientDetailResponse, summary="Update my patient profile"
)
async def update_my_patient_profile(
    dto: PatientProfileUpdate,
    current_user: User = Depends(patient_only),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Patient)
        .options(selectinload(Patient.user))
        .where(Patient.user_id == current_user.id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise NotFoundException("Patient profile not found. Please set it up first.")

    updates = dto.model_dump(exclude_none=True)

    if "full_name" in updates:
        current_user.full_name = updates.pop("full_name")

    for field, value in updates.items():
        setattr(patient, field, value)

    await db.commit()
    result = await db.execute(
        select(Patient)
        .options(selectinload(Patient.user))
        .where(Patient.user_id == current_user.id)
    )
    patient = result.scalar_one()
    await log(
        db,
        current_user.id,
        Actions.UPDATE_PATIENT_PROFILE,
        entity_type="Patient",
        entity_id=patient.id,
    )
    return _build_detail(patient)


@router.get(
    "",
    response_model=list[PatientDetailResponse],
    summary="List all patients (Admin only)",
)
async def list_patients(
    status: Optional[str] = Query(default=None),
    patient_type: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    current_user: User = Depends(RoleChecker(["ADMIN", "DOCTOR"])),
    db: AsyncSession = Depends(get_db),
):
    query = select(Patient).options(selectinload(Patient.user)).join(Patient.user)

    if status:
        query = query.where(Patient.patient_status == status)
    if patient_type:
        query = query.where(Patient.patient_type == patient_type)
    if search:
        query = query.where(UserModel.full_name.ilike(f"%{search}%"))

    result = await db.execute(query)
    patients = result.scalars().all()

    return [_build_detail(p) for p in patients]

@router.get(
    "/{patient_id}",
    response_model=PatientDetailResponse,
    summary="Get patient by ID (Admin/Doctor)",
)
async def get_patient_by_id(
    patient_id: int,
    current_user: User = Depends(RoleChecker(["ADMIN", "DOCTOR"])),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Patient)
        .options(selectinload(Patient.user))
        .where(Patient.id == patient_id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise NotFoundException("Patient not found")
    return _build_detail(patient)


@router.post(
    "/{patient_id}/vitals",
    response_model=HealthVitalResponse,
    status_code=201,
    summary="Record health vitals",
)
async def add_vitals(
    patient_id: int,
    dto: HealthVitalCreate,
    current_user: User = Depends(RoleChecker(["ADMIN", "DOCTOR"])),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    if not result.scalar_one_or_none():
        raise NotFoundException("Patient not found")

    vital = HealthVital(patient_id=patient_id, **dto.model_dump())
    db.add(vital)
    await db.commit()
    await db.refresh(vital)
    return vital


@router.get(
    "/{patient_id}/vitals",
    response_model=list[HealthVitalResponse],
    summary="Get patient vitals history",
)
async def get_vitals(
    patient_id: int,
    limit: int = Query(default=50, ge=1, le=200, description="Max records to return"),
    current_user: User = Depends(RoleChecker(["ADMIN", "DOCTOR", "PATIENT"])),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role == "PATIENT":
        result = await db.execute(select(Patient).where(Patient.user_id == current_user.id))
        patient = result.scalar_one_or_none()
        if not patient or patient.id != patient_id:
            raise ForbiddenException("You can only view your own vitals")

    result = await db.execute(
        select(HealthVital)
        .where(HealthVital.patient_id == patient_id)
        .order_by(HealthVital.recorded_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.put(
    "/{patient_id}/doctor-notes",
    response_model=PatientDetailResponse,
    summary="Update doctor notes (Doctor)",
)
async def update_doctor_notes(
    patient_id: int,
    dto: DoctorNotesUpdate,
    current_user: User = Depends(RoleChecker(["DOCTOR"])),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Patient)
        .options(selectinload(Patient.user))
        .where(Patient.id == patient_id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise NotFoundException("Patient not found")

    patient.notes = dto.notes
    if dto.patient_status is not None:
        patient.patient_status = dto.patient_status

    await db.commit()
    result = await db.execute(
        select(Patient)
        .options(selectinload(Patient.user))
        .where(Patient.id == patient_id)
    )
    patient = result.scalar_one()
    await log(
        db,
        current_user.id,
        Actions.UPDATE_PATIENT,
        entity_type="Patient",
        entity_id=patient.id,
        extra_data={"updated_fields": ["notes", "patient_status"]},
    )
    return _build_detail(patient)


@router.put(
    "/{patient_id}",
    response_model=PatientDetailResponse,
    summary="Update patient (Admin or Doctor)",
)
async def update_patient(
    patient_id: int,
    dto: PatientProfileUpdate,
    current_user: User = Depends(RoleChecker(["ADMIN", "DOCTOR"])),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Patient)
        .options(selectinload(Patient.user))
        .where(Patient.id == patient_id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise NotFoundException("Patient not found")

    updates = dto.model_dump(exclude_none=True)

    if current_user.role == "DOCTOR":
        disallowed = [field for field in updates if field not in {"notes", "patient_status"}]
        if disallowed:
            raise ForbiddenException(
                "Doctors can only update notes and patient_status via this endpoint"
            )

    if "full_name" in updates:
        patient.user.full_name = updates.pop("full_name")

    for field, value in updates.items():
        setattr(patient, field, value)

    await db.commit()
    # Re-query to reload user relationship after commit (db.refresh won't load relations)
    result = await db.execute(
        select(Patient)
        .options(selectinload(Patient.user))
        .where(Patient.id == patient_id)
    )
    patient = result.scalar_one()
    await log(
        db,
        current_user.id,
        Actions.UPDATE_PATIENT,
        entity_type="Patient",
        entity_id=patient.id,
    )
    return _build_detail(patient)

@router.delete("/{patient_id}", status_code=204, summary="Delete patient (Admin)")
async def delete_patient(
    patient_id: int,
    current_user: User = Depends(RoleChecker(["ADMIN"])),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Patient)
        .options(selectinload(Patient.user))
        .where(Patient.id == patient_id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise NotFoundException("Patient not found")

    from app.modules.messages.models import Conversation

    conv_result = await db.execute(
        select(Conversation).where(Conversation.patient_id == patient_id)
    )
    for conv in conv_result.scalars().all():
        await db.delete(conv)

    user = patient.user
    await db.delete(patient)
    await db.delete(user)
    await db.commit()
    await log(
        db,
        current_user.id,
        "DELETE_PATIENT",
        entity_type="Patient",
        entity_id=patient_id,
    )
    return None
