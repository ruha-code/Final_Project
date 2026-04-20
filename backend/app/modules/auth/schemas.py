from pydantic import BaseModel, ConfigDict, EmailStr, field_validator
from typing import Optional
from enum import Enum
import re


FULL_NAME_PATTERN = re.compile(
    r"^(?=.{2,100}$)[^\W\d_]+(?:[ .'-][^\W\d_]+)*$",
    re.UNICODE,
)
USERNAME_PATTERN = re.compile(r"^[A-Za-z0-9._-]{3,30}$")
PHONE_PATTERN = re.compile(r"^\+?[0-9()\-\s]{7,20}$")


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    DOCTOR = "DOCTOR"
    PATIENT = "PATIENT"


class RegisterSchema(BaseModel):
    full_name: str
    username: str
    email: EmailStr
    password: str
    phone: Optional[str] = None

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
    def full_name_validate(cls, v: str) -> str:
        cleaned = " ".join(v.strip().split())
        if not FULL_NAME_PATTERN.fullmatch(cleaned):
            raise ValueError(
                "Full name must contain letters and may include spaces, apostrophes, periods, or hyphens"
            )
        return cleaned

    @field_validator("phone")
    @classmethod
    def phone_normalize(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = v.strip()
        return cleaned or None


class LoginSchema(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
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


class UserUpdateSchema(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class AdminUserUpdateSchema(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None

    @field_validator("full_name")
    @classmethod
    def full_name_validate(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = " ".join(v.strip().split())
        if not FULL_NAME_PATTERN.fullmatch(cleaned):
            raise ValueError(
                "Full name must contain letters and may include spaces, apostrophes, periods, or hyphens"
            )
        return cleaned

    @field_validator("username")
    @classmethod
    def username_validate(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = v.strip()
        if not USERNAME_PATTERN.fullmatch(cleaned):
            raise ValueError(
                "Username must be 3-30 characters and use only letters, numbers, dots, underscores, or hyphens"
            )
        return cleaned

    @field_validator("phone")
    @classmethod
    def phone_validate(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = v.strip()
        if not cleaned:
            return None
        if not PHONE_PATTERN.fullmatch(cleaned):
            raise ValueError("Phone must be 7-20 characters and contain only digits or +-() symbols")
        return cleaned
