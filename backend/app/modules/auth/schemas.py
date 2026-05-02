from pydantic import BaseModel, ConfigDict, EmailStr, field_validator
from typing import Optional
from enum import Enum
import re


FULL_NAME_PATTERN = re.compile(
    r"^(?=.{2,100}$)[^\W\d_]+(?:[ .'-][^\W\d_]+)*$",
    re.UNICODE,
)
USERNAME_PATTERN = re.compile(
    r"^(?=.{3,30}$)(?=.*[A-Za-z])[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$"
)
PHONE_E164_PATTERN = re.compile(r"^\+[1-9]\d{9,14}$")
STRONG_PASSWORD_PATTERN = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$")
SPECIALTY_ALLOWED_CHARS = {" ", "-", "'", ".", "/", "&", "(", ")"}


def normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def validate_phone_number(value: str) -> str:
    cleaned = re.sub(r"[^\d+]", "", value)
    if cleaned.count("+") > 1 or ("+" in cleaned and not cleaned.startswith("+")):
        raise ValueError("Phone format is invalid")
    if not PHONE_E164_PATTERN.fullmatch(cleaned):
        raise ValueError("Phone must be in international format, e.g. +15550123456")
    return cleaned


def validate_specialty(value: str) -> str:
    cleaned = normalize_whitespace(value)
    if len(cleaned) < 3:
        raise ValueError("Specialty must be at least 3 characters")
    if len(cleaned) > 100:
        raise ValueError("Specialty must be at most 100 characters")
    if sum(1 for ch in cleaned if ch.isalpha()) < 3:
        raise ValueError("Specialty must contain letters, not only numbers")
    if any(not (ch.isalpha() or ch in SPECIALTY_ALLOWED_CHARS) for ch in cleaned):
        raise ValueError("Specialty contains invalid characters")
    return cleaned


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    DOCTOR = "DOCTOR"
    PATIENT = "PATIENT"


def validate_privileged_password(password: str) -> str:
    if not STRONG_PASSWORD_PATTERN.fullmatch(password):
        raise ValueError(
            "Password must be at least 8 characters and include uppercase, lowercase, and a digit"
        )
    return password


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
    def username_validate(cls, v: str) -> str:
        cleaned = v.strip()
        if not USERNAME_PATTERN.fullmatch(cleaned):
            raise ValueError(
                "Username must be 3-30 characters, include a letter, and start/end with a letter or number"
            )
        return cleaned

    @field_validator("full_name")
    @classmethod
    def full_name_validate(cls, v: str) -> str:
        cleaned = normalize_whitespace(v)
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
        if not cleaned:
            return None
        return validate_phone_number(cleaned)


class AdminDoctorCreateSchema(RegisterSchema):
    department_id: Optional[int] = None
    specialty: Optional[str] = None
    license_number: Optional[str] = None
    license_status: Optional[str] = "PENDING"
    rating: Optional[float] = 0
    years_of_experience: Optional[int] = None
    consultation_duration_minutes: int = 30

    @field_validator("specialty", "license_number")
    @classmethod
    def strip_optional_strings(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = v.strip()
        return cleaned or None

    @field_validator("specialty")
    @classmethod
    def validate_specialty_value(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return validate_specialty(v)

    @field_validator("years_of_experience")
    @classmethod
    def validate_experience(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not 0 <= v <= 50:
            raise ValueError("Years of experience must be between 0 and 50")
        return v

    @field_validator("consultation_duration_minutes")
    @classmethod
    def validate_duration(cls, v: int) -> int:
        if not 10 <= v <= 120:
            raise ValueError("Consultation duration must be between 10 and 120 minutes")
        return v

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and not 0 <= v <= 5:
            raise ValueError("Rating must be between 0 and 5")
        return v

    @field_validator("license_status")
    @classmethod
    def validate_license_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return "PENDING"
        cleaned = v.strip().upper()
        if cleaned not in {"PENDING", "VERIFIED", "REJECTED", "EXPIRED"}:
            raise ValueError("License status is invalid")
        return cleaned


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
    is_verified: bool


class UserUpdateSchema(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def phone_validate(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = v.strip()
        if not cleaned:
            return None
        return validate_phone_number(cleaned)


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
        cleaned = normalize_whitespace(v)
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
                "Username must be 3-30 characters, include a letter, and start/end with a letter or number"
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
        return validate_phone_number(cleaned)


class VerifyCodeSchema(BaseModel):
    email: EmailStr
    code: str

    @field_validator("code")
    @classmethod
    def code_validate(cls, v: str) -> str:
        cleaned = v.strip()
        if not re.match(r"^\d{6}$", cleaned):
            raise ValueError("Code must be 6 digits")
        return cleaned


class ForgotPasswordSchema(BaseModel):
    email: EmailStr


class ResetPasswordSchema(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class ChangePasswordSchema(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v
