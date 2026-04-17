from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
import uuid

from app.core.database import get_db
from app.core.dependencies import RoleChecker, get_current_user, oauth2_scheme
from app.core.exceptions import ConflictException, UnauthorizedException
from app.core.pagination import paginate
from app.core.security import decode_access_token, hash_password, create_access_token
from app.core.cache import (
    blacklist_raw_token,
    blacklist_token,
    is_raw_token_blacklisted,
    is_token_blacklisted,
)
from app.modules.auth.schemas import (
    RegisterSchema,
    LoginSchema,
    TokenResponse,
    UserResponse,
    UserUpdateSchema,
    AdminUserUpdateSchema,
)
from app.modules.auth.service import AuthService
from app.modules.auth.models import User, UserRole
from app.modules.audit.router import log, Actions

router = APIRouter(tags=["Auth"])


class RefreshRequest(BaseModel):
    refresh_token: str


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(db)


@router.post(
    "/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED
)
async def register(
    dto: RegisterSchema,
    request: Request,
    db: AsyncSession = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service),
):
    result = await auth_service.register(dto)

    if result["role"] == UserRole.PATIENT:
        from app.modules.patients.models import Patient

        patient = Patient(user_id=result["user_id"])
        db.add(patient)
        await db.commit()

    await log(
        db=db,
        user_id=result["user_id"],
        action=Actions.REGISTER,
        entity_type="User",
        entity_id=result["user_id"],
        request=request,
    )

    return result


@router.post("/login", response_model=TokenResponse)
async def login(
    dto: LoginSchema,
    request: Request,
    db: AsyncSession = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service),
):
    result = await auth_service.login(dto.email, dto.password)
    await log(
        db=db,
        user_id=result["user_id"],
        action=Actions.LOGIN,
        entity_type="User",
        entity_id=result["user_id"],
        request=request,
    )
    return result


@router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(
    body: RefreshRequest, db: AsyncSession = Depends(get_db)
):
    if await is_raw_token_blacklisted(body.refresh_token):
        raise UnauthorizedException("Refresh token has been revoked")

    payload = decode_access_token(body.refresh_token)

    if not payload or payload.get("type") != "refresh":
        raise UnauthorizedException("Invalid refresh token")

    refresh_jti = payload.get("jti")
    if refresh_jti and await is_token_blacklisted(refresh_jti):
        raise UnauthorizedException("Refresh token has been revoked")

    user = await db.get(User, payload["user_id"])
    if not user or not user.is_active:
        raise UnauthorizedException("User not found or deactivated")

    jti = str(uuid.uuid4())
    new_access_token = create_access_token(
        {"user_id": user.id, "role": user.role, "jti": jti}
    )

    return {
        "access_token": new_access_token,
        "refresh_token": body.refresh_token,
        "token_type": "bearer",
        "user_id": user.id,
        "role": user.role,
    }


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
):
    return await auth_service.me(current_user)


@router.put("/me", response_model=UserResponse)
async def update_me(
    dto: UserUpdateSchema,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if dto.full_name is not None:
        current_user.full_name = dto.full_name
    if dto.phone is not None:
        current_user.phone = dto.phone
    if dto.avatar_url is not None:
        current_user.avatar_url = dto.avatar_url

    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.post("/logout", summary="Logout — revoke current token")
async def logout(
    body: RefreshRequest | None = None,
    token: str = Depends(oauth2_scheme),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    payload = decode_access_token(token)
    jti = payload.get("jti")
    exp = payload.get("exp")

    if jti and exp:
        remaining = int(exp - datetime.now(timezone.utc).timestamp())
        if remaining > 0:
            await blacklist_token(jti, remaining)

    if body and body.refresh_token:
        refresh_payload = decode_access_token(body.refresh_token)
        if (
            refresh_payload
            and refresh_payload.get("type") == "refresh"
            and refresh_payload.get("user_id") == current_user.id
        ):
            refresh_exp = refresh_payload.get("exp")
            if refresh_exp:
                refresh_remaining = int(
                    refresh_exp - datetime.now(timezone.utc).timestamp()
                )
                if refresh_remaining > 0:
                    refresh_jti = refresh_payload.get("jti")
                    if refresh_jti:
                        await blacklist_token(refresh_jti, refresh_remaining)
                    await blacklist_raw_token(body.refresh_token, refresh_remaining)

    await log(
        db=db,
        user_id=current_user.id,
        action="LOGOUT",
        entity_type="User",
        entity_id=current_user.id,
    )

    return {"message": "Logged out successfully"}


@router.post(
    "/admin/users/create-doctor",
    response_model=UserResponse,
    status_code=201,
    summary="Create a doctor account (Admin only)",
)
async def create_doctor_account(
    dto: RegisterSchema,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ADMIN"])),
):
    from app.modules.doctors.models import Doctor

    # Check email unique
    result = await db.execute(select(User).where(User.email == dto.email))
    if result.scalar_one_or_none():
        raise ConflictException("Email already registered")

    # Check username unique
    result = await db.execute(select(User).where(User.username == dto.username))
    if result.scalar_one_or_none():
        raise ConflictException("Username already taken")

    user = User(
        full_name=dto.full_name,
        username=dto.username,
        email=dto.email,
        phone=dto.phone,
        password_hash=hash_password(dto.password),
        role=UserRole.DOCTOR,
        is_active=True,
    )
    db.add(user)

    doctor = Doctor(user=user)
    db.add(doctor)

    await db.commit()
    await db.refresh(user)

    await log(
        db=db,
        user_id=current_user.id,
        action=Actions.REGISTER,
        entity_type="User",
        entity_id=user.id,
        extra_data={"created_role": "DOCTOR", "created_by": current_user.id},
        request=request,
    )

    return UserResponse.model_validate(user)


@router.post(
    "/admin/users/create-admin",
    response_model=UserResponse,
    status_code=201,
    summary="Create an admin account (Admin only)",
)
async def create_admin_account(
    dto: RegisterSchema,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ADMIN"])),
):
    result = await db.execute(select(User).where(User.email == dto.email))
    if result.scalar_one_or_none():
        raise ConflictException("Email already registered")

    result = await db.execute(select(User).where(User.username == dto.username))
    if result.scalar_one_or_none():
        raise ConflictException("Username already taken")

    user = User(
        full_name=dto.full_name,
        username=dto.username,
        email=dto.email,
        phone=dto.phone,
        password_hash=hash_password(dto.password),
        role=UserRole.ADMIN,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    await log(
        db=db,
        user_id=current_user.id,
        action=Actions.REGISTER,
        entity_type="User",
        entity_id=user.id,
        extra_data={"created_role": "ADMIN", "created_by": current_user.id},
        request=request,
    )

    return UserResponse.model_validate(user)


@router.get("/admin/users", dependencies=[Depends(RoleChecker(["ADMIN"]))])
async def get_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, le=100),
    role: UserRole | None = None,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(User).order_by(User.created_at.desc())
    if role:
        query = query.where(User.role == role)
    if search:
        query = query.where(
            or_(User.username.ilike(f"%{search}%"), User.email.ilike(f"%{search}%"))
        )

    paged = await paginate(query, page, page_size, db)

    paged.items = [UserResponse.model_validate(u) for u in paged.items]
    return paged


@router.get(
    "/admin/users/{user_id}",
    response_model=UserResponse,
    dependencies=[Depends(RoleChecker(["ADMIN"]))],
)
async def get_user_by_id(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put(
    "/admin/users/{user_id}",
    response_model=UserResponse,
)
async def update_user(
    user_id: int,
    dto: AdminUserUpdateSchema,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ADMIN"])),
):
    from app.modules.doctors.models import Doctor
    from app.modules.patients.models import Patient

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if dto.email and dto.email != user.email:
        existing = await db.execute(select(User).where(User.email == dto.email))
        if existing.scalar_one_or_none():
            raise ConflictException("Email already in use")

    if dto.full_name is not None:
        user.full_name = dto.full_name
    if dto.email is not None:
        user.email = dto.email
    if dto.phone is not None:
        user.phone = dto.phone
    if dto.role is not None:
        user.role = dto.role

        if dto.role == UserRole.DOCTOR:
            doctor_result = await db.execute(
                select(Doctor).where(Doctor.user_id == user.id)
            )
            if doctor_result.scalar_one_or_none() is None:
                db.add(Doctor(user_id=user.id))
        elif dto.role == UserRole.PATIENT:
            patient_result = await db.execute(
                select(Patient).where(Patient.user_id == user.id)
            )
            if patient_result.scalar_one_or_none() is None:
                db.add(Patient(user_id=user.id))

    await db.commit()
    await db.refresh(user)
    await log(
        db=db,
        user_id=current_user.id,
        action=Actions.UPDATE_USER,
        entity_type="User",
        entity_id=user.id,
        request=request,
    )
    return UserResponse.model_validate(user)


@router.put("/admin/users/{user_id}/deactivate")
async def deactivate_user(
    user_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ADMIN"])),
):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="You cannot deactivate yourself")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    await db.commit()
    await db.refresh(user)
    await log(
        db=db,
        user_id=current_user.id,
        action=Actions.DEACTIVATE_USER,
        entity_type="User",
        entity_id=user.id,
    )
    return {"message": "User deactivated"}


@router.put("/admin/users/{user_id}/activate")
async def activate_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ADMIN"])),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = True
    await db.commit()
    await db.refresh(user)
    await log(
        db=db,
        user_id=current_user.id,
        action=Actions.ACTIVATE_USER,
        entity_type="User",
        entity_id=user.id,
    )
    return {"message": "User activated"}


@router.delete("/admin/users/{user_id}", dependencies=[Depends(RoleChecker(["ADMIN"]))])
async def delete_user(
    user_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="You cannot delete yourself")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(user)
    await db.commit()
    await log(
        db=db,
        user_id=current_user.id,
        action=Actions.DELETE_USER,
        entity_type="User",
        entity_id=user_id,
        request=request,
    )
    return {"message": "User deleted"}
