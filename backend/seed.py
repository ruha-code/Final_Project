
import asyncio
from datetime import date, time, datetime, timezone, timedelta
import random

from sqlalchemy import text
from app.core.database import engine, async_session_factory, Base, init_db
from app.core.security import hash_password

# Import all models so create_all registers them
from app.modules.auth.models import User, UserRole
from app.modules.departments.models import Department
from app.modules.doctors.models import Doctor, DoctorSchedule, LicenseStatus
from app.modules.patients.models import (
    Patient,
    HealthVital,
    Gender,
    PatientType,
    PatientStatus,
)
from app.modules.appointments.models import (
    Appointment,
    AppointmentStatus,
    AppointmentType,
)
from app.modules.inventory.models import (
    InventoryItem,
    InventoryCategory,
    InventoryStatus,
)
from app.modules.messages.models import Conversation, Message
from app.modules.calendar.models import CalendarEvent, EventCategory


DEPARTMENTS_DATA = [
    {
        "name": "General Medicine",
        "location": "Main Building - 1st Floor",
        "description": "Primary care and general health consultations.",
        "patient_satisfaction": 88,
        "efficiency": 82,
        "treatment_success": 85,
    },
    {
        "name": "Pediatrics",
        "location": "Main Building - 2nd Floor",
        "description": "Medical care for infants, children, and adolescents.",
        "patient_satisfaction": 92,
        "efficiency": 87,
        "treatment_success": 90,
    },
    {
        "name": "Cardiology",
        "location": "West Wing - 3rd Floor",
        "description": "Diagnosis and treatment of heart conditions.",
        "patient_satisfaction": 90,
        "efficiency": 85,
        "treatment_success": 88,
    },
    {
        "name": "Orthopedics",
        "location": "East Wing - 2nd Floor",
        "description": "Treatment of musculoskeletal system disorders.",
        "patient_satisfaction": 86,
        "efficiency": 80,
        "treatment_success": 84,
    },
    {
        "name": "Dermatology",
        "location": "Main Building - 3rd Floor",
        "description": "Diagnosis and treatment of skin conditions.",
        "patient_satisfaction": 89,
        "efficiency": 84,
        "treatment_success": 87,
    },
    {
        "name": "Neurology",
        "location": "West Wing - 4th Floor",
        "description": "Treatment of nervous system disorders.",
        "patient_satisfaction": 87,
        "efficiency": 81,
        "treatment_success": 83,
    },
    {
        "name": "Radiology",
        "location": "Basement Level",
        "description": "Medical imaging and diagnostic radiology.",
        "patient_satisfaction": 85,
        "efficiency": 90,
        "treatment_success": 88,
    },
    {
        "name": "Maternity",
        "location": "East Wing - 3rd Floor",
        "description": "Prenatal, delivery, and postnatal care.",
        "patient_satisfaction": 94,
        "efficiency": 88,
        "treatment_success": 92,
    },
]

DOCTORS_DATA = [
    {
        "full_name": "Dr. James Wilson",
        "username": "jwilson",
        "email": "jwilson@clinic.com",
        "specialty": "General Practitioner",
        "dept": "General Medicine",
        "experience": 12,
        "rating": 4.7,
        "bio": "Experienced GP with focus on preventive medicine.",
    },
    {
        "full_name": "Dr. Sarah Chen",
        "username": "schen",
        "email": "schen@clinic.com",
        "specialty": "Pediatrician",
        "dept": "Pediatrics",
        "experience": 8,
        "rating": 4.9,
        "bio": "Dedicated to children's health and development.",
    },
    {
        "full_name": "Dr. Michael Torres",
        "username": "mtorres",
        "email": "mtorres@clinic.com",
        "specialty": "Cardiologist",
        "dept": "Cardiology",
        "experience": 15,
        "rating": 4.8,
        "bio": "Specialist in interventional cardiology.",
    },
    {
        "full_name": "Dr. Emily Park",
        "username": "epark",
        "email": "epark@clinic.com",
        "specialty": "Orthopedic Surgeon",
        "dept": "Orthopedics",
        "experience": 11,
        "rating": 4.6,
        "bio": "Expert in joint replacement and sports injuries.",
    },
    {
        "full_name": "Dr. Alex Rivera",
        "username": "arivera",
        "email": "arivera@clinic.com",
        "specialty": "Dermatologist",
        "dept": "Dermatology",
        "experience": 9,
        "rating": 4.7,
        "bio": "Specializes in skin disorders and cosmetic dermatology.",
    },
    {
        "full_name": "Dr. Lisa Nguyen",
        "username": "lnguyen",
        "email": "lnguyen@clinic.com",
        "specialty": "Neurologist",
        "dept": "Neurology",
        "experience": 14,
        "rating": 4.8,
        "bio": "Focused on stroke prevention and epilepsy treatment.",
    },
    {
        "full_name": "Dr. Robert Kim",
        "username": "rkim",
        "email": "rkim@clinic.com",
        "specialty": "Radiologist",
        "dept": "Radiology",
        "experience": 10,
        "rating": 4.5,
        "bio": "Expert in MRI and CT imaging interpretation.",
    },
    {
        "full_name": "Dr. Maria Santos",
        "username": "msantos",
        "email": "msantos@clinic.com",
        "specialty": "Obstetrician",
        "dept": "Maternity",
        "experience": 13,
        "rating": 4.9,
        "bio": "High-risk pregnancy specialist with 13 years experience.",
    },
]

PATIENTS_DATA = [
    {
        "full_name": "Sarah Johnson",
        "username": "sjohnson",
        "email": "sjohnson@email.com",
        "gender": Gender.FEMALE,
        "dob": date(1990, 3, 15),
        "blood": "O+",
        "phone": "+1 555-0101",
        "condition": "Hypertension",
        "type": PatientType.OUTPATIENT,
        "status": PatientStatus.IN_TREATMENT,
    },
    {
        "full_name": "John Doe",
        "username": "jdoe",
        "email": "jdoe@email.com",
        "gender": Gender.MALE,
        "dob": date(1985, 7, 22),
        "blood": "A+",
        "phone": "+1 555-0102",
        "condition": "Diabetes Type 2",
        "type": PatientType.OUTPATIENT,
        "status": PatientStatus.IN_TREATMENT,
    },
    {
        "full_name": "Emma Williams",
        "username": "ewilliams",
        "email": "ewilliams@email.com",
        "gender": Gender.FEMALE,
        "dob": date(1978, 11, 8),
        "blood": "B+",
        "phone": "+1 555-0103",
        "condition": "Arthritis",
        "type": PatientType.INPATIENT,
        "status": PatientStatus.ADMITTED,
        "room": "204A",
    },
    {
        "full_name": "Carlos Mendez",
        "username": "cmendez",
        "email": "cmendez@email.com",
        "gender": Gender.MALE,
        "dob": date(1995, 4, 30),
        "blood": "AB-",
        "phone": "+1 555-0104",
        "condition": "Asthma",
        "type": PatientType.OUTPATIENT,
        "status": PatientStatus.DISCHARGED,
    },
    {
        "full_name": "Olivia Brown",
        "username": "obrown",
        "email": "obrown@email.com",
        "gender": Gender.FEMALE,
        "dob": date(2000, 9, 12),
        "blood": "O-",
        "phone": "+1 555-0105",
        "condition": "Migraine",
        "type": PatientType.OUTPATIENT,
        "status": PatientStatus.IN_TREATMENT,
    },
    {
        "full_name": "David Lee",
        "username": "dlee",
        "email": "dlee@email.com",
        "gender": Gender.MALE,
        "dob": date(1970, 2, 18),
        "blood": "A-",
        "phone": "+1 555-0106",
        "condition": "Heart Disease",
        "type": PatientType.INPATIENT,
        "status": PatientStatus.ADMITTED,
        "room": "301B",
    },
    {
        "full_name": "Sophia Taylor",
        "username": "staylor",
        "email": "staylor@email.com",
        "gender": Gender.FEMALE,
        "dob": date(1988, 6, 25),
        "blood": "B-",
        "phone": "+1 555-0107",
        "condition": "Eczema",
        "type": PatientType.OUTPATIENT,
        "status": PatientStatus.DISCHARGED,
    },
    {
        "full_name": "James Anderson",
        "username": "janderson",
        "email": "janderson@email.com",
        "gender": Gender.MALE,
        "dob": date(1965, 12, 3),
        "blood": "O+",
        "phone": "+1 555-0108",
        "condition": "Back Pain",
        "type": PatientType.OUTPATIENT,
        "status": PatientStatus.IN_TREATMENT,
    },
    {
        "full_name": "Mia Martinez",
        "username": "mmartinez",
        "email": "mmartinez@email.com",
        "gender": Gender.FEMALE,
        "dob": date(1993, 8, 14),
        "blood": "A+",
        "phone": "+1 555-0109",
        "condition": "Pregnancy",
        "type": PatientType.INPATIENT,
        "status": PatientStatus.ADMITTED,
        "room": "401A",
    },
    {
        "full_name": "Ethan Harris",
        "username": "eharris",
        "email": "eharris@email.com",
        "gender": Gender.MALE,
        "dob": date(1982, 5, 27),
        "blood": "AB+",
        "phone": "+1 555-0110",
        "condition": "Epilepsy",
        "type": PatientType.OUTPATIENT,
        "status": PatientStatus.IN_TREATMENT,
    },
]

INVENTORY_DATA = [
    {
        "name": "Surgical Gloves",
        "category": InventoryCategory.CONSUMABLES,
        "quantity": 320,
        "unit": "boxes",
        "stock": 80,
        "status": InventoryStatus.AVAILABLE,
    },
    {
        "name": "Paracetamol 500mg",
        "category": InventoryCategory.MEDICATIONS,
        "quantity": 1500,
        "unit": "pcs",
        "stock": 75,
        "status": InventoryStatus.AVAILABLE,
    },
    {
        "name": "Syringes 5ml",
        "category": InventoryCategory.CONSUMABLES,
        "quantity": 45,
        "unit": "boxes",
        "stock": 22,
        "status": InventoryStatus.LOW,
    },
    {
        "name": "Blood Test Kits",
        "category": InventoryCategory.LABORATORY,
        "quantity": 60,
        "unit": "kits",
        "stock": 30,
        "status": InventoryStatus.LOW,
    },
    {
        "name": "Amoxicillin 250mg",
        "category": InventoryCategory.MEDICATIONS,
        "quantity": 800,
        "unit": "pcs",
        "stock": 60,
        "status": InventoryStatus.AVAILABLE,
    },
    {
        "name": "Face Masks",
        "category": InventoryCategory.CONSUMABLES,
        "quantity": 0,
        "unit": "boxes",
        "stock": 0,
        "status": InventoryStatus.OUT,
    },
    {
        "name": "Ibuprofen 400mg",
        "category": InventoryCategory.MEDICATIONS,
        "quantity": 600,
        "unit": "pcs",
        "stock": 55,
        "status": InventoryStatus.AVAILABLE,
    },
    {
        "name": "Glucose Test Strips",
        "category": InventoryCategory.LABORATORY,
        "quantity": 20,
        "unit": "boxes",
        "stock": 15,
        "status": InventoryStatus.LOW,
    },
    {
        "name": "IV Drip Sets",
        "category": InventoryCategory.CONSUMABLES,
        "quantity": 150,
        "unit": "pcs",
        "stock": 50,
        "status": InventoryStatus.AVAILABLE,
    },
    {
        "name": "Bandages",
        "category": InventoryCategory.CONSUMABLES,
        "quantity": 0,
        "unit": "rolls",
        "stock": 0,
        "status": InventoryStatus.OUT,
    },
    {
        "name": "Metformin 500mg",
        "category": InventoryCategory.MEDICATIONS,
        "quantity": 1200,
        "unit": "pcs",
        "stock": 90,
        "status": InventoryStatus.AVAILABLE,
    },
    {
        "name": "Urine Test Strips",
        "category": InventoryCategory.LABORATORY,
        "quantity": 30,
        "unit": "boxes",
        "stock": 20,
        "status": InventoryStatus.LOW,
    },
]

APPOINTMENT_REASONS = [
    "Routine blood pressure follow-up",
    "Persistent headache and dizziness",
    "Post-treatment evaluation",
    "Medication adjustment review",
    "Chest discomfort checkup",
    "Skin rash consultation",
    "Back pain reassessment",
    "Pregnancy progress check",
    "Migraine management follow-up",
    "Diabetes control monitoring",
]



async def clear_all(session):
    print("Clearing existing data...")
    await session.execute(text(
        "TRUNCATE TABLE notification_reads, notification_preferences, messages, "
        "conversations, calendar_events, health_vitals, appointments, "
        "doctor_schedules, inventory_items, patients, doctors, departments, users "
        "RESTART IDENTITY CASCADE"
    ))
    await session.commit()
    print("Done.\n")


async def seed_departments(session) -> dict[str, Department]:
    print("Seeding departments...")
    dept_map = {}
    for d in DEPARTMENTS_DATA:
        dept = Department(
            name=d["name"],
            location=d["location"],
            description=d["description"],
            patient_satisfaction=d["patient_satisfaction"],
            efficiency=d["efficiency"],
            treatment_success=d["treatment_success"],
        )
        session.add(dept)
        await session.flush()
        dept_map[d["name"]] = dept
    await session.commit()
    print(f"  Created {len(dept_map)} departments.")
    return dept_map


async def seed_admin(session) -> User:
    print("Seeding admin user...")
    admin = User(
        full_name="Admin User",
        username="admin",
        email="admin@clinic.com",
        password_hash=hash_password("Admin123"),
        role=UserRole.ADMIN,
        phone="+1 555-0000",
        is_verified=True,
    )
    session.add(admin)
    await session.flush()
    await session.commit()
    print("  Admin: admin@clinic.com / Admin123")
    return admin


async def seed_doctors(session, dept_map: dict) -> list[Doctor]:
    print("Seeding doctors...")
    doctors = []
    for i, d in enumerate(DOCTORS_DATA):
        user = User(
            full_name=d["full_name"],
            username=d["username"],
            email=d["email"],
            password_hash=hash_password("Doctor123"),
            role=UserRole.DOCTOR,
            phone=f"+1 555-02{i:02d}",
            is_verified=True,
        )
        session.add(user)
        await session.flush()

        dept = dept_map[d["dept"]]
        doctor = Doctor(
            user_id=user.id,
            department_id=dept.id,
            specialty=d["specialty"],
            bio=d["bio"],
            years_of_experience=d["experience"],
            rating=d["rating"],
            is_available=True,
            license_number=f"LIC-{1000 + i}",
            license_status=LicenseStatus.VERIFIED,
        )
        session.add(doctor)
        await session.flush()

        for day in range(5):
            schedule = DoctorSchedule(
                doctor_id=doctor.id,
                day_of_week=day,
                start_time=time(8, 0),
                end_time=time(17, 0),
                is_available=True,
            )
            session.add(schedule)

        doctors.append(doctor)

    await session.commit()
    print(f"  Created {len(doctors)} doctors. Password: doctor123")
    return doctors


async def seed_patients(session) -> list[Patient]:
    print("Seeding patients...")
    patients = []
    for d in PATIENTS_DATA:
        user = User(
            full_name=d["full_name"],
            username=d["username"],
            email=d["email"],
            password_hash=hash_password("patient123"),
            role=UserRole.PATIENT,
            phone=d["phone"],
            is_verified=True,
        )
        session.add(user)
        await session.flush()

        patient = Patient(
            user_id=user.id,
            date_of_birth=d["dob"],
            gender=d["gender"],
            blood_type=d["blood"],
            phone=d["phone"],
            address="123 Main St, New York, USA",
            condition=d["condition"],
            patient_type=d["type"],
            patient_status=d["status"],
            admission_date=date.today()
            if d["status"] == PatientStatus.ADMITTED
            else None,
            room_location=d.get("room"),
        )
        session.add(patient)
        await session.flush()

        for days_ago in [7, 3, 0]:
            vital = HealthVital(
                patient_id=patient.id,
                blood_sugar=round(random.uniform(80, 200), 1),
                weight=round(random.uniform(55, 95), 1),
                temperature=round(random.uniform(36.2, 37.8), 1),
                systolic_bp=random.randint(110, 145),
                diastolic_bp=random.randint(70, 95),
                recorded_at=datetime.now(timezone.utc) - timedelta(days=days_ago),
            )
            session.add(vital)

        patients.append(patient)

    await session.commit()
    print(f"  Created {len(patients)} patients. Password: patient123")
    return patients


async def seed_appointments(session, patients: list, doctors: list):
    print("Seeding appointments...")
    now = datetime.now(timezone.utc).replace(second=0, microsecond=0)
    day_offsets = [-7, 0, 7]  # past, today, future
    appointment_types = list(AppointmentType)
    doctor_slot_index = {doctor.id: 0 for doctor in doctors}
    count = 0
    for patient_index, patient in enumerate(patients):
        doctor = doctors[patient_index % len(doctors)]
        for visit_index, day_offset in enumerate(day_offsets):
            slot_index = doctor_slot_index[doctor.id]
            doctor_slot_index[doctor.id] += 1

            slot_hour = 8 + (slot_index % 9)
            slot_minute = 30 if ((slot_index // 9) % 2) else 0
            extra_day = slot_index // 18
            appointment_day = (now + timedelta(days=day_offset + extra_day)).date()
            apt_time = datetime.combine(
                appointment_day,
                time(slot_hour, slot_minute),
                tzinfo=timezone.utc,
            )

            if day_offset < 0:
                status = (
                    AppointmentStatus.CANCELLED
                    if (slot_index + patient_index) % 4 == 0
                    else AppointmentStatus.COMPLETED
                )
            elif day_offset == 0:
                status = (
                    AppointmentStatus.ONGOING
                    if (slot_index + visit_index) % 5 == 0
                    else AppointmentStatus.SCHEDULED
                )
            else:
                status = AppointmentStatus.SCHEDULED

            reason = APPOINTMENT_REASONS[
                (patient_index + visit_index + slot_index) % len(APPOINTMENT_REASONS)
            ]
            apt = Appointment(
                patient_id=patient.id,
                doctor_id=doctor.id,
                appointment_time=apt_time,
                duration_minutes=30,
                appointment_type=appointment_types[
                    (patient_index + visit_index) % len(appointment_types)
                ],
                status=status,
                reason=reason,
                notes="Visit completed successfully."
                if status == AppointmentStatus.COMPLETED
                else None,
                completed_at=apt_time + timedelta(minutes=30)
                if status == AppointmentStatus.COMPLETED
                else None,
                cancelled_at=now - timedelta(hours=2)
                if status == AppointmentStatus.CANCELLED
                else None,
            )
            session.add(apt)
            count += 1

    await session.commit()
    print(f"  Created {count} appointments.")


async def seed_inventory(session):
    print("Seeding inventory...")
    for item in INVENTORY_DATA:
        inv = InventoryItem(
            name=item["name"],
            category=item["category"],
            quantity=item["quantity"],
            unit=item["unit"],
            stock_percentage=item["stock"],
            status=item["status"],
        )
        session.add(inv)
    await session.commit()
    print(f"  Created {len(INVENTORY_DATA)} inventory items.")


async def seed_messages(session, patients: list, doctors: list, admin: User):
    print("Seeding messages...")
    pairs = [
        (patients[0], doctors[0]),
        (patients[1], doctors[2]),
        (patients[2], doctors[1]),
    ]
    for patient, doctor in pairs:
        conv = Conversation(patient_id=patient.id, doctor_id=doctor.id)
        session.add(conv)
        await session.flush()

        chat = [
            (doctor.user_id, "Hello! How are you feeling today?"),
            (patient.user_id, "I have been having some headaches lately."),
            (doctor.user_id, "I see. How long has this been going on?"),
            (patient.user_id, "About a week now. Should I come in?"),
            (doctor.user_id, "Yes, let's schedule an appointment to check it out."),
        ]
        for sender_id, text in chat:
            msg = Message(
                conversation_id=conv.id, sender_id=sender_id, text=text, is_read=True
            )
            session.add(msg)

    await session.commit()
    print(f"  Created {len(pairs)} conversations.")


async def seed_calendar(session, admin: User):
    print("Seeding calendar events...")
    events = [
        {
            "title": "Staff Meeting",
            "date": date.today(),
            "time": time(9, 0),
            "cat": EventCategory.ADMIN,
        },
        {
            "title": "System Maintenance",
            "date": date.today() + timedelta(days=2),
            "time": time(22, 0),
            "cat": EventCategory.SYSTEM,
        },
        {
            "title": "New Staff Training",
            "date": date.today() + timedelta(days=5),
            "time": time(10, 0),
            "cat": EventCategory.TRAINING,
        },
        {
            "title": "Monthly Review",
            "date": date.today() + timedelta(days=7),
            "time": time(14, 0),
            "cat": EventCategory.ADMIN,
        },
        {
            "title": "EHR System Update",
            "date": date.today() + timedelta(days=10),
            "time": time(8, 0),
            "cat": EventCategory.SYSTEM,
        },
        {
            "title": "Emergency Drill",
            "date": date.today() + timedelta(days=14),
            "time": time(11, 0),
            "cat": EventCategory.TRAINING,
        },
    ]
    for e in events:
        session.add(
            CalendarEvent(
                title=e["title"],
                event_date=e["date"],
                event_time=e["time"],
                category=e["cat"],
                created_by=admin.id,
            )
        )
    await session.commit()
    print(f"  Created {len(events)} calendar events.")


async def main():
    print("=" * 50)
    print("Clinic Management System — Seed Script")
    print("=" * 50)

    print("\nInitializing database tables...")
    await init_db()
    print("Tables ready.\n")

    async with async_session_factory() as session:
        await clear_all(session)

        dept_map = await seed_departments(session)
        admin = await seed_admin(session)
        doctors = await seed_doctors(session, dept_map)
        patients = await seed_patients(session)
        await seed_appointments(session, patients, doctors)
        await seed_inventory(session)
        await seed_messages(session, patients, doctors, admin)
        await seed_calendar(session, admin)

    await engine.dispose()

    print("\n" + "=" * 50)
    print("Seed complete!")
    print("=" * 50)
    print("\nLogin credentials:")
    print("  Admin:   admin@clinic.com   / Admin123")
    print("  Doctor:  jwilson@clinic.com / Doctor123")
    print("  Patient: sjohnson@email.com / patient123")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())
