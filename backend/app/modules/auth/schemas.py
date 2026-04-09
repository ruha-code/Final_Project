from pydantic import BaseModel, ConfigDict, EmailStr, field_validator
from typing import Optional
from enum import Enum
 
 
class UserRole(str, Enum):
    ADMIN = "ADMIN"
    DOCTOR = "DOCTOR"
    PATIENT = "PATIENT"
 
 
class RegisterSchema(BaseModel):
    full_name: str
    username: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.PATIENT  # default: patient self-registration
 
    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v
 
    @field_validator("username")
    @classmethod
    def username_length(cls, v: str) -> str:
        if len(v.strip()) < 3:
            raise ValueError("Username must be at least 3 characters")
        return v.strip()
 
    @field_validator("full_name")
    @classmethod
    def full_name_length(cls, v: str) -> str:
        if len(v.strip()) < 2:
            raise ValueError("Full name must be at least 2 characters")
        return v.strip()
 
 
class LoginSchema(BaseModel):
    email: EmailStr
    password: str
 
 
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
 
 
class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
 
    id: int
    full_name: str
    username: str
    email: str
    role: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool