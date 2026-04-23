from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictException
from app.modules.auth.models import User


async def delete_admin_managed_user(
    *,
    db: AsyncSession,
    target_user: User,
    acting_user: User,
) -> None:
    from app.modules.appointments.models import Appointment
    from app.modules.calendar.models import CalendarEvent
    from app.modules.departments.models import Department
    from app.modules.doctors.models import Doctor
    from app.modules.messages.models import Conversation
    from app.modules.notifications.models import NotificationPreference, NotificationRead
    from app.modules.patients.models import Patient, HealthVital

    user_id = target_user.id

    doctor_result = await db.execute(select(Doctor).where(Doctor.user_id == user_id))
    doctor = doctor_result.scalar_one_or_none()
    if doctor:
        doctor_appointments = await db.execute(
            select(Appointment.id).where(Appointment.doctor_id == doctor.id).limit(1)
        )
        if doctor_appointments.scalar_one_or_none() is not None:
            raise ConflictException(
                "Cannot delete user with doctor appointment history. Deactivate the user instead."
            )

        doctor_conversations = await db.execute(
            select(Conversation.id).where(Conversation.doctor_id == doctor.id).limit(1)
        )
        if doctor_conversations.scalar_one_or_none() is not None:
            raise ConflictException(
                "Cannot delete user with doctor chat history. Deactivate the user instead."
            )

        await db.execute(
            update(Department)
            .where(Department.head_doctor_id == doctor.id)
            .values(head_doctor_id=None)
        )
        await db.delete(doctor)

    patient_result = await db.execute(select(Patient).where(Patient.user_id == user_id))
    patient = patient_result.scalar_one_or_none()
    if patient:
        patient_appointments = await db.execute(
            select(Appointment.id).where(Appointment.patient_id == patient.id).limit(1)
        )
        if patient_appointments.scalar_one_or_none() is not None:
            raise ConflictException(
                "Cannot delete user with patient appointment history. Deactivate the user instead."
            )

        vitals_result = await db.execute(
            select(HealthVital.id).where(HealthVital.patient_id == patient.id).limit(1)
        )
        if vitals_result.scalar_one_or_none() is not None:
            raise ConflictException(
                "Cannot delete user with patient vital history. Deactivate the user instead."
            )

        patient_conversations = await db.execute(
            select(Conversation.id).where(Conversation.patient_id == patient.id).limit(1)
        )
        if patient_conversations.scalar_one_or_none() is not None:
            raise ConflictException(
                "Cannot delete user with patient chat history. Deactivate the user instead."
            )

        await db.delete(patient)

    await db.execute(delete(NotificationRead).where(NotificationRead.user_id == user_id))
    await db.execute(
        delete(NotificationPreference).where(NotificationPreference.user_id == user_id)
    )
    await db.execute(
        update(CalendarEvent)
        .where(CalendarEvent.created_by == user_id)
        .values(created_by=acting_user.id)
    )
    await db.execute(
        update(Appointment)
        .where(Appointment.cancelled_by == user_id)
        .values(cancelled_by=None)
    )

    await db.delete(target_user)
