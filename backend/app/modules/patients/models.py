from sqlalchemy import Integer, ForeignKey, DateTime, String, Date, Float, Text, Enum, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime, date
import enum

from app.core.database import Base


class Gender(str, enum.Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"


class PatientType(str, enum.Enum):
    INPATIENT = "INPATIENT"
    OUTPATIENT = "OUTPATIENT"


class PatientStatus(str, enum.Enum):
    ADMITTED = "ADMITTED"
    IN_TREATMENT = "IN_TREATMENT"
    DISCHARGED = "DISCHARGED"


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    # Personal info
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[Gender] = mapped_column(Enum(Gender), nullable=False)
    blood_type: Mapped[str | None] = mapped_column(String(5), nullable=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    address: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # Medical info
    condition: Mapped[str | None] = mapped_column(String(200), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Admission info
    patient_type: Mapped[PatientType] = mapped_column(
        Enum(PatientType), default=PatientType.OUTPATIENT, nullable=False
    )
    patient_status: Mapped[PatientStatus] = mapped_column(
        Enum(PatientStatus), default=PatientStatus.ADMITTED, nullable=False
    )
    admission_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    room_location: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Emergency contact
    emergency_contact_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Geolocation (for analytics)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    h3_index: Mapped[str | None] = mapped_column(String(20), index=True, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    user = relationship("User")
    appointments = relationship("Appointment", back_populates="patient")
    health_vitals = relationship("HealthVital", back_populates="patient", cascade="all, delete-orphan")


class HealthVital(Base):
    """Blood sugar, weight, temperature, blood pressure per visit."""
    __tablename__ = "health_vitals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    patient_id: Mapped[int] = mapped_column(Integer, ForeignKey("patients.id"), nullable=False)

    blood_sugar: Mapped[float | None] = mapped_column(Float, nullable=True)   # mg/dL
    weight: Mapped[float | None] = mapped_column(Float, nullable=True)         # kg
    temperature: Mapped[float | None] = mapped_column(Float, nullable=True)    # °C
    systolic_bp: Mapped[int | None] = mapped_column(Integer, nullable=True)    # mmHg
    diastolic_bp: Mapped[int | None] = mapped_column(Integer, nullable=True)   # mmHg

    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", back_populates="health_vitals")
