from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
import secrets
 
from app.modules.auth.models import User
from app.modules.auth.schemas import RegisterSchema, UserRole, validate_privileged_password
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token
from app.core.exceptions import ConflictException, UnauthorizedException, ValidationException
from app.core.email import send_verification_code, send_password_reset
from app.core.config import settings
 
 
class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
 
    async def register(self, data: RegisterSchema):
        normalized_email = data.email.strip().lower()

        result = await self.db.execute(select(User).where(User.email == normalized_email))
        if result.scalar_one_or_none():
            raise ConflictException("Email already registered")

        result = await self.db.execute(select(User).where(User.username == data.username))
        if result.scalar_one_or_none():
            raise ConflictException("Username already taken")

        code = secrets.randbelow(900000) + 100000
        code_str = str(code)
        code_expires = datetime.now(timezone.utc) + timedelta(minutes=10)

        user = User(
            full_name=data.full_name,
            username=data.username,
            email=normalized_email,
            password_hash=hash_password(data.password),
            role=UserRole.PATIENT,
            is_active=False,
            is_verified=False,
            verification_code=code_str,
            verification_code_expires=code_expires,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
 
        await send_verification_code(user.email, user.full_name, code_str)

        return {
            "message": "Verification code sent to your email",
            "email": user.email,
            "user_id": user.id,
        }
 
    async def verify_code(self, email: str, code: str):
        result = await self.db.execute(select(User).where(User.email == email.lower()))
        user = result.scalar_one_or_none()
 
        if not user:
            raise ValidationException("No account found with this email")
 
        if user.is_verified:
            raise ValidationException("Account is already verified")
 
        if not user.verification_code or not user.verification_code_expires:
            raise ValidationException("No verification code found. Please request a new one.")
 
        if datetime.now(timezone.utc) > user.verification_code_expires:
            raise ValidationException("Verification code has expired. Please request a new one.")
 
        if user.verification_code != code:
            raise ValidationException("Invalid verification code")
 
        user.is_verified = True
        user.is_active = True
        user.verification_code = None
        user.verification_code_expires = None
 
        await self.db.commit()
        await self.db.refresh(user)
 
        access_jti = str(uuid.uuid4())
        refresh_jti = str(uuid.uuid4())
        access_token = create_access_token(
            {"user_id": user.id, "role": user.role, "jti": access_jti}
        )
        refresh_token = create_refresh_token(
            {"user_id": user.id, "role": user.role, "jti": refresh_jti}
        )
 
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "role": user.role,
            "user_id": user.id,
        }
 
    async def resend_verification_code(self, email: str):
        result = await self.db.execute(select(User).where(User.email == email.lower()))
        user = result.scalar_one_or_none()
 
        if not user:
            raise ValidationException("No account found with this email")
 
        if user.is_verified:
            raise ValidationException("Account is already verified")
 
        code = secrets.randbelow(900000) + 100000
        code_str = str(code)
        code_expires = datetime.now(timezone.utc) + timedelta(minutes=10)
 
        user.verification_code = code_str
        user.verification_code_expires = code_expires
 
        await self.db.commit()
        await send_verification_code(user.email, user.full_name, code_str)
 
        return {"message": "New verification code sent to your email"}
 
    async def forgot_password(self, email: str):
        result = await self.db.execute(select(User).where(User.email == email.lower()))
        user = result.scalar_one_or_none()

        if not user:
            raise ValidationException("No account found with this email address")

        reset_token = secrets.token_urlsafe(32)
        reset_expires = datetime.now(timezone.utc) + timedelta(minutes=30)

        user.reset_token = reset_token
        user.reset_token_expires = reset_expires

        await self.db.commit()

        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        await send_password_reset(user.email, user.full_name, reset_link)

        return {"message": "Reset link sent to your email"}
 
    async def reset_password(self, token: str, new_password: str):
        result = await self.db.execute(select(User).where(User.reset_token == token))
        user = result.scalar_one_or_none()
 
        if not user:
            raise ValidationException("Invalid or expired reset link")
 
        if not user.reset_token_expires or datetime.now(timezone.utc) > user.reset_token_expires:
            raise ValidationException("Reset link has expired. Please request a new one.")

        if user.role in {UserRole.ADMIN, UserRole.DOCTOR}:
            try:
                validate_privileged_password(new_password)
            except ValueError as exc:
                raise ValidationException(str(exc)) from exc
 
        user.password_hash = hash_password(new_password)
        user.reset_token = None
        user.reset_token_expires = None
 
        await self.db.commit()
 
        return {"message": "Password has been reset successfully"}
 
    async def login(self, email: str, password: str):
        normalized_email = email.strip().lower()
        result = await self.db.execute(select(User).where(User.email == normalized_email))
        user = result.scalar_one_or_none()
 
        if not user or not verify_password(password, user.password_hash):
            raise UnauthorizedException("Invalid credentials")
 
        if not user.is_active:
            raise UnauthorizedException("Account is deactivated")
 
        if not user.is_verified:
            raise UnauthorizedException("Please verify your email before logging in")
 
        access_jti = str(uuid.uuid4())
        refresh_jti = str(uuid.uuid4())
        access_token = create_access_token(
            {"user_id": user.id, "role": user.role, "jti": access_jti}
        )
        refresh_token = create_refresh_token(
            {"user_id": user.id, "role": user.role, "jti": refresh_jti}
        )
 
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user_id": user.id,
            "role": user.role,
        }
 
    async def me(self, user: User):
        return user
