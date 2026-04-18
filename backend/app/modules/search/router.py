from fastapi import APIRouter, Depends, Query
from sqlalchemy import String, cast, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.modules.appointments.models import Appointment
from app.modules.auth.models import User, UserRole
from app.modules.doctors.models import Doctor
from app.modules.patients.models import Patient
from app.modules.search.schemas import SearchEntityType, SearchResponse, SearchResultItem

router = APIRouter()


@router.get("", response_model=SearchResponse, summary="Global search")
async def global_search(
    q: str = Query(..., min_length=1, max_length=100),
    limit: int = Query(default=5, ge=1, le=20),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    term = q.strip()
    if not term:
        return SearchResponse(q=q, results=[])

    like = f"%{term}%"
    results: list[SearchResultItem] = []

    doctor_user = aliased(User)
    patient_user = aliased(User)
    appointment_doctor_user = aliased(User)
    appointment_patient_user = aliased(User)

    if current_user.role in {UserRole.ADMIN, UserRole.PATIENT}:
        doctor_query = (
            select(Doctor, doctor_user)
            .join(doctor_user, doctor_user.id == Doctor.user_id)
            .where(
                or_(
                    doctor_user.full_name.ilike(like),
                    doctor_user.email.ilike(like),
                    Doctor.specialty.ilike(like),
                )
            )
            .order_by(doctor_user.full_name.asc())
            .limit(limit)
        )
        doctor_result = await db.execute(doctor_query)
        for doctor, doctor_identity in doctor_result.all():
            results.append(
                SearchResultItem(
                    entity_type=SearchEntityType.DOCTOR,
                    entity_id=doctor.id,
                    title=doctor_identity.full_name,
                    subtitle=f"{doctor.specialty or 'General physician'} | {doctor_identity.email}",
                    route=f"/doctors/{doctor.id}",
                )
            )

    if current_user.role in {UserRole.ADMIN, UserRole.DOCTOR}:
        if current_user.role == UserRole.DOCTOR:
            doctor_result = await db.execute(
                select(Doctor).where(Doctor.user_id == current_user.id)
            )
            doctor = doctor_result.scalar_one_or_none()
            if doctor:
                patient_query = (
                    select(Patient, patient_user)
                    .join(patient_user, patient_user.id == Patient.user_id)
                    .join(Appointment, Appointment.patient_id == Patient.id)
                    .where(
                        Appointment.doctor_id == doctor.id,
                        or_(
                            patient_user.full_name.ilike(like),
                            patient_user.email.ilike(like),
                            Patient.condition.ilike(like),
                        ),
                    )
                    .distinct()
                    .order_by(patient_user.full_name.asc())
                    .limit(limit)
                )
            else:
                patient_query = None
        else:
            patient_query = (
                select(Patient, patient_user)
                .join(patient_user, patient_user.id == Patient.user_id)
                .where(
                    or_(
                        patient_user.full_name.ilike(like),
                        patient_user.email.ilike(like),
                        Patient.condition.ilike(like),
                    )
                )
                .order_by(patient_user.full_name.asc())
                .limit(limit)
            )

        if patient_query is not None:
            patient_result = await db.execute(patient_query)
            for patient, patient_identity in patient_result.all():
                results.append(
                    SearchResultItem(
                        entity_type=SearchEntityType.PATIENT,
                        entity_id=patient.id,
                        title=patient_identity.full_name,
                        subtitle=f"{patient.condition or 'No condition'} | {patient_identity.email}",
                        route=f"/patients/{patient.id}",
                    )
                )

    if current_user.role == UserRole.ADMIN:
        appointment_query = (
            select(
                Appointment,
                appointment_patient_user.full_name,
                appointment_doctor_user.full_name,
            )
            .join(Patient, Patient.id == Appointment.patient_id)
            .join(appointment_patient_user, appointment_patient_user.id == Patient.user_id)
            .join(Doctor, Doctor.id == Appointment.doctor_id)
            .join(appointment_doctor_user, appointment_doctor_user.id == Doctor.user_id)
            .where(
                or_(
                    appointment_patient_user.full_name.ilike(like),
                    appointment_doctor_user.full_name.ilike(like),
                    Appointment.reason.ilike(like),
                    cast(Appointment.status, String).ilike(like),
                )
            )
            .order_by(Appointment.appointment_time.desc())
            .limit(limit)
        )
    elif current_user.role == UserRole.DOCTOR:
        doctor_result = await db.execute(select(Doctor).where(Doctor.user_id == current_user.id))
        doctor = doctor_result.scalar_one_or_none()
        if doctor:
            appointment_query = (
                select(
                    Appointment,
                    appointment_patient_user.full_name,
                    appointment_doctor_user.full_name,
                )
                .join(Patient, Patient.id == Appointment.patient_id)
                .join(appointment_patient_user, appointment_patient_user.id == Patient.user_id)
                .join(Doctor, Doctor.id == Appointment.doctor_id)
                .join(appointment_doctor_user, appointment_doctor_user.id == Doctor.user_id)
                .where(
                    Appointment.doctor_id == doctor.id,
                    or_(
                        appointment_patient_user.full_name.ilike(like),
                        Appointment.reason.ilike(like),
                        cast(Appointment.status, String).ilike(like),
                    ),
                )
                .order_by(Appointment.appointment_time.desc())
                .limit(limit)
            )
        else:
            appointment_query = None
    else:
        patient_result = await db.execute(select(Patient).where(Patient.user_id == current_user.id))
        patient = patient_result.scalar_one_or_none()
        if patient:
            appointment_query = (
                select(
                    Appointment,
                    appointment_patient_user.full_name,
                    appointment_doctor_user.full_name,
                )
                .join(Patient, Patient.id == Appointment.patient_id)
                .join(appointment_patient_user, appointment_patient_user.id == Patient.user_id)
                .join(Doctor, Doctor.id == Appointment.doctor_id)
                .join(appointment_doctor_user, appointment_doctor_user.id == Doctor.user_id)
                .where(
                    Appointment.patient_id == patient.id,
                    or_(
                        appointment_doctor_user.full_name.ilike(like),
                        Appointment.reason.ilike(like),
                        cast(Appointment.status, String).ilike(like),
                    ),
                )
                .order_by(Appointment.appointment_time.desc())
                .limit(limit)
            )
        else:
            appointment_query = None

    if appointment_query is not None:
        appointment_result = await db.execute(appointment_query)
        for appointment, patient_name, doctor_name in appointment_result.all():
            results.append(
                SearchResultItem(
                    entity_type=SearchEntityType.APPOINTMENT,
                    entity_id=appointment.id,
                    title=f"{patient_name} with {doctor_name}",
                    subtitle=(
                        f"{appointment.status.value} | "
                        f"{appointment.appointment_time.strftime('%Y-%m-%d %H:%M')}"
                    ),
                    route="/appointments",
                )
            )

    deduped: list[SearchResultItem] = []
    seen: set[tuple[SearchEntityType, int]] = set()
    for item in results:
        key = (item.entity_type, item.entity_id)
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)

    return SearchResponse(q=term, results=deduped[: max(limit * 3, 8)])
