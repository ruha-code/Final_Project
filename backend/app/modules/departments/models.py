from sqlalchemy import Integer, ForeignKey, DateTime, String, Text, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime

from app.core.database import Base


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Head of department (use_alter to break circular FK with doctors table)
    head_doctor_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("doctors.id", use_alter=True, name="fk_dept_head_doctor"),
        nullable=True,
    )

    # Performance metrics (0-100)
    patient_satisfaction: Mapped[float] = mapped_column(Float, default=0.0)
    efficiency: Mapped[float] = mapped_column(Float, default=0.0)
    treatment_success: Mapped[float] = mapped_column(Float, default=0.0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    doctors = relationship("Doctor", back_populates="department", foreign_keys="Doctor.department_id")
    head_doctor = relationship("Doctor", foreign_keys=[head_doctor_id])
