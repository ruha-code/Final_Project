from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
 
from app.modules.auth.models import User
from app.modules.auth.schemas import RegisterSchema, UserRole
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token
from app.core.exceptions import ConflictException, UnauthorizedException
 
 
class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
 
    async def register(self, data: RegisterSchema):
        result = await self.db.execute(select(User).where(User.email == data.email))
        if result.scalar_one_or_none():
            raise ConflictException("Email already registered")
 
        result = await self.db.execute(select(User).where(User.username == data.username))
        if result.scalar_one_or_none():
            raise ConflictException("Username already taken")
 
        user = User(
            full_name=data.full_name,
            username=data.username,
            email=data.email,
            password_hash=hash_password(data.password),
            role=UserRole.PATIENT,
            is_active=True,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
 
        jti = str(uuid.uuid4())
        access_token = create_access_token({"user_id": user.id, "role": user.role, "jti": jti})
        refresh_token = create_refresh_token({"user_id": user.id, "role": user.role})
 
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "role": user.role,
            "user_id": user.id,
        }
 
    async def login(self, email: str, password: str):
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
 
        if not user or not verify_password(password, user.password_hash):
            raise UnauthorizedException("Invalid credentials")
 
        if not user.is_active:
            raise UnauthorizedException("Account is deactivated")
 
        jti = str(uuid.uuid4())
        access_token = create_access_token({"user_id": user.id, "role": user.role, "jti": jti})
        refresh_token = create_refresh_token({"user_id": user.id, "role": user.role})
 
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user_id": user.id,
            "role": user.role,
        }
 
    async def me(self, user: User):
        return user
