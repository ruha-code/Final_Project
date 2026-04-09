from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional
 
from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.core.exceptions import NotFoundException, ConflictException
from app.modules.audit.router import Actions, log
from app.modules.auth.models import User
from app.modules.patients.models import Patient, HealthVital
from app.modules.patients.schemas import (
    PatientProfileCreate,
    PatientProfileUpdate,
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
 
 
# ── POST /patients/profile ────────────────────────────────────────────────────
@router.post("/profile", response_model=PatientDetailResponse, status_code=201, summary="Set up patient profile")
async def setup_patient_profile(
    dto: PatientProfileCreate,
    current_user: User = Depends(patient_only),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Patient).where(Patient.user_id == current_user.id))
    if result.scalar_one_or_none():
        raise ConflictException("Patient profile already exists for this account")
 
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
        select(Patient).options(selectinload(Patient.user)).where(Patient.id == patient.id)
    )
    patient = result.scalar_one()
    await log(db, current_user.id, Actions.SETUP_PATIENT_PROFILE, entity_type="Patient", entity_id=patient.id)
    return _build_detail(patient)
 
 
# ── GET /patients/me ──────────────────────────────────────────────────────────
@router.get("/me", response_model=PatientDetailResponse, summary="Get my patient profile")
async def get_my_patient_profile(
    current_user: User = Depends(patient_only),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Patient).options(selectinload(Patient.user)).where(Patient.user_id == current_user.id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise NotFoundException("Patient profile not found. Please set it up first.")
    return _build_detail(patient)
 
 
# ── PUT /patients/me ──────────────────────────────────────────────────────────
@router.put("/me", response_model=PatientDetailResponse, summary="Update my patient profile")
async def update_my_patient_profile(
    dto: PatientProfileUpdate,
    current_user: User = Depends(patient_only),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Patient).options(selectinload(Patient.user)).where(Patient.user_id == current_user.id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise NotFoundException("Patient profile not found. Please set it up first.")
 
    for field, value in dto.model_dump(exclude_none=True).items():
        setattr(patient, field, value)
 
    await db.commit()
    await db.refresh(patient)
    await log(db, current_user.id, Actions.UPDATE_PATIENT_PROFILE, entity_type="Patient", entity_id=patient.id)
    return _build_detail(patient)
 
 
# ── GET /patients (Admin) ─────────────────────────────────────────────────────
@router.get("", response_model=list[PatientDetailResponse], summary="List all patients (Admin only)")
async def list_patients(
    status: Optional[str] = Query(default=None),
    patient_type: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    current_user: User = Depends(RoleChecker(["ADMIN", "DOCTOR"])),
    db: AsyncSession = Depends(get_db),
):
    query = select(Patient).options(selectinload(Patient.user))
 
    if status:
        query = query.where(Patient.patient_status == status)
    if patient_type:
        query = query.where(Patient.patient_type == patient_type)
 
    result = await db.execute(query)
    patients = result.scalars().all()
 
    if search:
        search_lower = search.lower()
        patients = [p for p in patients if search_lower in p.user.full_name.lower()]
 
    return [_build_detail(p) for p in patients]
 
 
# ── GET /patients/{id} ────────────────────────────────────────────────────────
@router.get("/{patient_id}", response_model=PatientDetailResponse, summary="Get patient by ID (Admin/Doctor)")
async def get_patient_by_id(
    patient_id: int,
    current_user: User = Depends(RoleChecker(["ADMIN", "DOCTOR"])),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Patient).options(selectinload(Patient.user)).where(Patient.id == patient_id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise NotFoundException("Patient not found")
    return _build_detail(patient)
 
 
# ── POST /patients/{id}/vitals ────────────────────────────────────────────────
@router.post("/{patient_id}/vitals", response_model=HealthVitalResponse, status_code=201, summary="Record health vitals")
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
 
 
# ── GET /patients/{id}/vitals ─────────────────────────────────────────────────
@router.get("/{patient_id}/vitals", response_model=list[HealthVitalResponse], summary="Get patient vitals history")
async def get_vitals(
    patient_id: int,
    current_user: User = Depends(RoleChecker(["ADMIN", "DOCTOR", "PATIENT"])),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(HealthVital)
        .where(HealthVital.patient_id == patient_id)
        .order_by(HealthVital.recorded_at.desc())
    )
    return result.scalars().all()