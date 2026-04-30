from datetime import datetime, timezone
import re

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
import uuid

from app.core.database import get_db
from app.core.dependencies import RoleChecker, get_current_user, oauth2_scheme
from app.core.exceptions import (
    ConflictException,
    UnauthorizedException,
    RateLimitException,
    ValidationException,
)
from app.core.pagination import paginate
from app.core.security import decode_access_token, hash_password, create_access_token, verify_password
from app.core.cache import (
    blacklist_raw_token,
    blacklist_token,
    is_raw_token_blacklisted,
    is_token_blacklisted,
    check_rate_limit,
    RateLimitKeys,
)
from app.modules.auth.schemas import (
    AdminDoctorCreateSchema,
    RegisterSchema,
    LoginSchema,
    TokenResponse,
    UserResponse,
    UserUpdateSchema,
    AdminUserUpdateSchema,
    VerifyCodeSchema,
    ForgotPasswordSchema,
    ResetPasswordSchema,
    ChangePasswordSchema,
    validate_privileged_password,
)
from app.modules.auth.service import AuthService
from app.modules.auth.models import User, UserRole
from app.modules.auth.admin_user_management import delete_admin_managed_user
from app.modules.audit.router import log, Actions

router = APIRouter(tags=["Auth"])
FULL_NAME_PATTERN = re.compile(
    r"^(?=.{2,100}$)[^\W\d_]+(?:[ .'-][^\W\d_]+)*$",
    re.UNICODE,
)
USERNAME_PATTERN = re.compile(r"^[A-Za-z0-9._-]{3,30}$")


class RefreshRequest(BaseModel):
    refresh_token: str


def _validate_admin_managed_user_payload(
    *, full_name: str, username: str, password: str
) -> tuple[str, str]:
    normalized_name = " ".join(full_name.strip().split())
    normalized_username = username.strip()

    if not FULL_NAME_PATTERN.fullmatch(normalized_name):
        raise ValidationException(
            "Full name must contain letters and may include spaces, apostrophes, periods, or hyphens"
        )

    if not USERNAME_PATTERN.fullmatch(normalized_username):
        raise ValidationException(
            "Username must be 3-30 characters and use only letters, numbers, dots, underscores, or hyphens"
        )

    try:
        validate_privileged_password(password)
    except ValueError as exc:
        raise ValidationException(str(exc)) from exc

    return normalized_name, normalized_username


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(db)


@router.post(
    "/register", status_code=status.HTTP_201_CREATED
)
async def register(
    dto: RegisterSchema,
    request: Request,
    db: AsyncSession = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service),
):
    client_ip = request.client.host if request.client else "unknown"
    allowed, _ = await check_rate_limit(
        RateLimitKeys.register_ip(client_ip),
        max_requests=5,
        window_seconds=3600,
    )
    if not allowed:
        raise RateLimitException("Too many registration attempts. Please try again later.")

    result = await auth_service.register(dto)

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
    client_ip = request.client.host if request.client else "unknown"
    allowed, _ = await check_rate_limit(
        RateLimitKeys.login_ip(client_ip),
        max_requests=10,
        window_seconds=300,
    )
    if not allowed:
        raise RateLimitException("Too many login attempts. Please try again in 5 minutes.")

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


@router.post("/verify", response_model=TokenResponse)
async def verify_email(
    dto: VerifyCodeSchema,
    request: Request,
    db: AsyncSession = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service),
):
    client_ip = request.client.host if request.client else "unknown"
    allowed, _ = await check_rate_limit(
        RateLimitKeys.register_ip(client_ip),
        max_requests=5,
        window_seconds=300,
    )
    if not allowed:
        raise RateLimitException("Too many verification attempts. Please try again later.")

    result = await auth_service.verify_code(dto.email, dto.code)

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


@router.post("/resend-verification")
async def resend_verification(
    dto: ForgotPasswordSchema,
    request: Request,
    db: AsyncSession = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service),
):
    client_ip = request.client.host if request.client else "unknown"
    allowed, _ = await check_rate_limit(
        RateLimitKeys.register_ip(client_ip),
        max_requests=3,
        window_seconds=300,
    )
    if not allowed:
        raise RateLimitException("Too many requests. Please try again later.")

    result = await auth_service.resend_verification_code(dto.email)
    return result


@router.post("/forgot-password")
async def forgot_password(
    dto: ForgotPasswordSchema,
    request: Request,
    db: AsyncSession = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service),
):
    client_ip = request.client.host if request.client else "unknown"
    allowed, _ = await check_rate_limit(
        RateLimitKeys.login_ip(client_ip),
        max_requests=3,
        window_seconds=300,
    )
    if not allowed:
        raise RateLimitException("Too many requests. Please try again later.")

    result = await auth_service.forgot_password(dto.email)
    return result


@router.post("/reset-password")
async def reset_password(
    dto: ResetPasswordSchema,
    request: Request,
    db: AsyncSession = Depends(get_db),
    auth_service: AuthService = Depends(get_auth_service),
):
    result = await auth_service.reset_password(dto.token, dto.new_password)
    await log(
        db=db,
        user_id=None,
        action="PASSWORD_RESET",
        entity_type="User",
        request=request,
    )
    return result


@router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(
    body: RefreshRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    client_ip = request.client.host if request.client else "unknown"
    allowed, _ = await check_rate_limit(
        f"ratelimit:refresh:{client_ip}",
        max_requests=30,
        window_seconds=60,
    )
    if not allowed:
        raise RateLimitException("Too many token refresh attempts. Please try again later.")

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
    dto: AdminDoctorCreateSchema,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RoleChecker(["ADMIN"])),
):
    from app.modules.doctors.models import Doctor
    from app.modules.doctors.models import LicenseStatus
    normalized_name, normalized_username = _validate_admin_managed_user_payload(
        full_name=dto.full_name,
        username=dto.username,
        password=dto.password,
    )
    normalized_email = dto.email.strip().lower()

    result = await db.execute(select(User).where(User.email == normalized_email))
    if result.scalar_one_or_none():
        raise ConflictException("Email already registered")

    result = await db.execute(select(User).where(User.username == normalized_username))
    if result.scalar_one_or_none():
        raise ConflictException("Username already taken")

    user = User(
        full_name=normalized_name,
        username=normalized_username,
        email=normalized_email,
        phone=dto.phone,
        password_hash=hash_password(dto.password),
        role=UserRole.DOCTOR,
        is_active=True,
        is_verified=True,
    )
    db.add(user)

    if dto.license_number:
        result = await db.execute(
            select(Doctor).where(Doctor.license_number == dto.license_number)
        )
        if result.scalar_one_or_none():
            raise ConflictException("License number already exists")

    doctor = Doctor(
        user=user,
        department_id=dto.department_id,
        specialty=dto.specialty,
        license_number=dto.license_number,
        license_status=LicenseStatus(dto.license_status or "PENDING"),
        rating=dto.rating or 0,
        years_of_experience=dto.years_of_experience or 0,
        consultation_duration_minutes=dto.consultation_duration_minutes,
    )
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
    normalized_name, normalized_username = _validate_admin_managed_user_payload(
        full_name=dto.full_name,
        username=dto.username,
        password=dto.password,
    )
    normalized_email = dto.email.strip().lower()

    result = await db.execute(select(User).where(User.email == normalized_email))
    if result.scalar_one_or_none():
        raise ConflictException("Email already registered")

    result = await db.execute(select(User).where(User.username == normalized_username))
    if result.scalar_one_or_none():
        raise ConflictException("Username already taken")

    user = User(
        full_name=normalized_name,
        username=normalized_username,
        email=normalized_email,
        phone=dto.phone,
        password_hash=hash_password(dto.password),
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True,
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
        normalized_search = search.strip()
        if normalized_search:
            query = query.where(
                or_(
                    User.username.ilike(f"%{normalized_search}%"),
                    User.email.ilike(f"%{normalized_search}%"),
                    User.full_name.ilike(f"%{normalized_search}%"),
                )
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
    from app.modules.departments.models import Department
    from app.modules.patients.models import Patient, HealthVital
    from app.modules.appointments.models import Appointment
    from app.modules.messages.models import Conversation

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    normalized_email = dto.email.strip().lower() if dto.email else None

    if normalized_email and normalized_email != user.email:
        existing = await db.execute(select(User).where(User.email == normalized_email))
        if existing.scalar_one_or_none():
            raise ConflictException("Email already in use")
    if dto.username and dto.username != user.username:
        existing = await db.execute(select(User).where(User.username == dto.username))
        if existing.scalar_one_or_none():
            raise ConflictException("Username already in use")

    if dto.role is not None and user.id == current_user.id and dto.role != UserRole.ADMIN:
        raise ValidationException("You cannot remove your own admin role")

    role_changed = dto.role is not None and dto.role != user.role
    existing_doctor = None
    existing_patient = None
    if role_changed:
        doctor_result = await db.execute(select(Doctor).where(Doctor.user_id == user.id))
        existing_doctor = doctor_result.scalar_one_or_none()
        patient_result = await db.execute(select(Patient).where(Patient.user_id == user.id))
        existing_patient = patient_result.scalar_one_or_none()

        
        if dto.role != UserRole.DOCTOR and existing_doctor is not None:
            doctor_appointments = await db.execute(
                select(Appointment.id).where(Appointment.doctor_id == existing_doctor.id).limit(1)
            )
            if doctor_appointments.scalar_one_or_none() is not None:
                raise ConflictException(
                    "Cannot change role while the user has doctor appointment history"
                )
            doctor_conversations = await db.execute(
                select(Conversation.id).where(Conversation.doctor_id == existing_doctor.id).limit(1)
            )
            if doctor_conversations.scalar_one_or_none() is not None:
                raise ConflictException(
                    "Cannot change role while the user has doctor chat history"
                )
            await db.execute(
                update(Department)
                .where(Department.head_doctor_id == existing_doctor.id)
                .values(head_doctor_id=None)
            )
            await db.delete(existing_doctor)
            existing_doctor = None

        
        if dto.role != UserRole.PATIENT and existing_patient is not None:
            patient_appointments = await db.execute(
                select(Appointment.id).where(Appointment.patient_id == existing_patient.id).limit(1)
            )
            if patient_appointments.scalar_one_or_none() is not None:
                raise ConflictException(
                    "Cannot change role while the user has patient appointment history"
                )

            vitals_result = await db.execute(
                select(HealthVital.id).where(HealthVital.patient_id == existing_patient.id).limit(1)
            )
            if vitals_result.scalar_one_or_none() is not None:
                raise ConflictException(
                    "Cannot change role while the user has patient vital history"
                )
            patient_conversations = await db.execute(
                select(Conversation.id).where(Conversation.patient_id == existing_patient.id).limit(1)
            )
            if patient_conversations.scalar_one_or_none() is not None:
                raise ConflictException(
                    "Cannot change role while the user has patient chat history"
                )

            await db.delete(existing_patient)
            existing_patient = None

    if dto.full_name is not None:
        user.full_name = dto.full_name
    if dto.username is not None:
        user.username = dto.username
    if dto.email is not None:
        user.email = normalized_email
    if "phone" in dto.model_fields_set:
        user.phone = dto.phone
    if dto.role is not None:
        user.role = dto.role

        if dto.role == UserRole.DOCTOR:
            if existing_doctor is None:
                doctor_result = await db.execute(
                    select(Doctor).where(Doctor.user_id == user.id)
                )
                existing_doctor = doctor_result.scalar_one_or_none()
            if existing_doctor is None:
                db.add(Doctor(user_id=user.id))
        elif dto.role == UserRole.PATIENT:
            if existing_patient is None:
                patient_result = await db.execute(
                    select(Patient).where(Patient.user_id == user.id)
                )
                existing_patient = patient_result.scalar_one_or_none()
            if existing_patient is None:
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

    restored_verification = not user.is_verified
    user.is_active = True
    if restored_verification:
        user.is_verified = True
        user.verification_code = None
        user.verification_code_expires = None
    await db.commit()
    await db.refresh(user)
    await log(
        db=db,
        user_id=current_user.id,
        action=Actions.ACTIVATE_USER,
        entity_type="User",
        entity_id=user.id,
    )
    if restored_verification:
        return {"message": "User activated and verified"}
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

    await delete_admin_managed_user(
        db=db,
        target_user=user,
        acting_user=current_user,
    )
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


@router.put("/change-password")
async def change_password(
    dto: ChangePasswordSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.password_hash:
        raise HTTPException(status_code=400, detail="Password authentication not enabled for this account")

    if not verify_password(dto.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if dto.current_password == dto.new_password:
        raise HTTPException(status_code=400, detail="New password must be different from current password")

    current_user.password_hash = hash_password(dto.new_password)
    await db.commit()

    await log(
        db=db,
        user_id=current_user.id,
        action="CHANGE_PASSWORD",
        entity_type="User",
        entity_id=current_user.id,
    )

    return {"message": "Password changed successfully"}
