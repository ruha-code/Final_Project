from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
 
from app.core.database import get_db
from app.core.dependencies import RoleChecker
from app.core.exceptions import NotFoundException, ConflictException
from app.modules.departments.models import Department
from app.modules.doctors.models import Doctor
from app.modules.appointments.models import Appointment, AppointmentStatus
from app.modules.departments.schemas import DepartmentCreate, DepartmentUpdate, DepartmentResponse
 
router = APIRouter()
 
 
def _same_department_name(name: str):
    return func.lower(func.trim(Department.name)) == name.lower()


async def _compute_department_metrics(department_id: int, db: AsyncSession) -> tuple[float, float, float]:
    result = await db.execute(
        select(
            Appointment.status,
            func.count().label("count"),
        )
        .join(Doctor, Doctor.id == Appointment.doctor_id)
        .where(Doctor.department_id == department_id)
        .group_by(Appointment.status)
    )
    counts = {status: count for status, count in result.all()}

    completed = counts.get(AppointmentStatus.COMPLETED, 0) or 0
    cancelled = counts.get(AppointmentStatus.CANCELLED, 0) or 0
    ongoing = counts.get(AppointmentStatus.ONGOING, 0) or 0
    scheduled = counts.get(AppointmentStatus.SCHEDULED, 0) or 0

    total = completed + cancelled + ongoing + scheduled
    resolved = completed + cancelled

    patient_satisfaction = round((completed / resolved) * 100, 1) if resolved else 0.0
    efficiency = (
        round(((completed + ongoing * 0.7 + scheduled * 0.4) / total) * 100, 1)
        if total
        else 0.0
    )
    treatment_success = round((completed / total) * 100, 1) if total else 0.0

    return patient_satisfaction, efficiency, treatment_success


async def _with_staff_count(department: Department, db: AsyncSession) -> DepartmentResponse:
    result = await db.execute(
        select(func.count()).where(Doctor.department_id == department.id)
    )
    count = result.scalar() or 0
    patient_satisfaction, efficiency, treatment_success = await _compute_department_metrics(
        department.id, db
    )
    data = DepartmentResponse.model_validate(department)
    data.staff_count = count
    data.patient_satisfaction = patient_satisfaction
    data.efficiency = efficiency
    data.treatment_success = treatment_success
    return data
 
 
@router.get("", response_model=list[DepartmentResponse], summary="List all departments (public)")
async def list_departments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Department).order_by(Department.name))
    departments = result.scalars().all()
    return [await _with_staff_count(d, db) for d in departments]
 
 
@router.get("/{department_id}", response_model=DepartmentResponse, summary="Get department by ID")
async def get_department(department_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Department).where(Department.id == department_id))
    dept = result.scalar_one_or_none()
    if not dept:
        raise NotFoundException("Department not found")
    return await _with_staff_count(dept, db)
 
 
@router.post("", response_model=DepartmentResponse, status_code=201,
             summary="Create department (Admin only)",
             dependencies=[Depends(RoleChecker(["ADMIN"]))])
async def create_department(dto: DepartmentCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Department).where(_same_department_name(dto.name)))
    if result.scalar_one_or_none():
        raise ConflictException(f"Department '{dto.name}' already exists")
 
    dept = Department(**dto.model_dump())
    db.add(dept)
    await db.commit()
    await db.refresh(dept)
    return await _with_staff_count(dept, db)
 
 
@router.put("/{department_id}", response_model=DepartmentResponse,
            summary="Update department (Admin only)",
            dependencies=[Depends(RoleChecker(["ADMIN"]))])
async def update_department(department_id: int, dto: DepartmentUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Department).where(Department.id == department_id))
    dept = result.scalar_one_or_none()
    if not dept:
        raise NotFoundException("Department not found")

    if dto.name is not None:
        duplicate = await db.execute(
            select(Department).where(
                _same_department_name(dto.name),
                Department.id != department_id,
            )
        )
        if duplicate.scalar_one_or_none():
            raise ConflictException(f"Department '{dto.name}' already exists")

    for field, value in dto.model_dump(exclude_unset=True).items():
        setattr(dept, field, value)
 
    await db.commit()
    await db.refresh(dept)
    return await _with_staff_count(dept, db)
 
 
@router.delete("/{department_id}", status_code=204,
               summary="Delete department (Admin only)",
               dependencies=[Depends(RoleChecker(["ADMIN"]))])
async def delete_department(department_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Department).where(Department.id == department_id))
    dept = result.scalar_one_or_none()
    if not dept:
        raise NotFoundException("Department not found")

    staff_result = await db.execute(
        select(func.count()).where(Doctor.department_id == department_id)
    )
    assigned_doctors = staff_result.scalar() or 0
    if assigned_doctors:
        raise ConflictException(
            "Cannot delete a department with assigned doctors. Reassign or remove them first."
        )

    await db.delete(dept)
    await db.commit()
