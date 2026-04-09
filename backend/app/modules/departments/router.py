from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
 
from app.core.database import get_db
from app.core.dependencies import RoleChecker
from app.core.exceptions import NotFoundException, ConflictException
from app.modules.departments.models import Department
from app.modules.doctors.models import Doctor
from app.modules.departments.schemas import DepartmentCreate, DepartmentUpdate, DepartmentResponse
 
router = APIRouter()
 
 
async def _with_staff_count(department: Department, db: AsyncSession) -> DepartmentResponse:
    result = await db.execute(
        select(func.count()).where(Doctor.department_id == department.id)
    )
    count = result.scalar() or 0
    data = DepartmentResponse.model_validate(department)
    data.staff_count = count
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
    result = await db.execute(select(Department).where(Department.name == dto.name))
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
 
    for field, value in dto.model_dump(exclude_none=True).items():
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
    await db.delete(dept)
    await db.commit()