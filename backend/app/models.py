import enum
import uuid
from datetime import datetime, timezone

from pydantic import EmailStr
from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime | None = None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# --- Enums ---

class ServiceStatus(str, enum.Enum):
    operational = "operational"
    degraded = "degraded"
    down = "down"


class IncidentStatus(str, enum.Enum):
    investigating = "investigating"
    identified = "identified"
    monitoring = "monitoring"
    resolved = "resolved"


# --- DB Tables ---

class Service(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=255)
    url: str = Field(max_length=2048)
    category: str = Field(max_length=100, default="General")
    check_interval: int = Field(default=60)
    current_status: ServiceStatus = Field(default=ServiceStatus.operational)
    created_at: datetime = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )


class HealthCheck(SQLModel, table=True):
    __tablename__ = "healthcheck"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    service_id: uuid.UUID = Field(foreign_key="service.id", ondelete="CASCADE")
    status_code: int | None = Field(default=None)
    response_time_ms: int = Field(default=0)
    is_healthy: bool = Field(default=True)
    checked_at: datetime = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )


class Incident(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    service_id: uuid.UUID = Field(foreign_key="service.id", ondelete="CASCADE")
    title: str = Field(max_length=500)
    description: str = Field(max_length=2000, default="")
    status: IncidentStatus = Field(default=IncidentStatus.investigating)
    created_at: datetime = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    resolved_at: datetime | None = Field(default=None)


class IncidentUpdate(SQLModel, table=True):
    __tablename__ = "incidentupdate"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    incident_id: uuid.UUID = Field(foreign_key="incident.id", ondelete="CASCADE")
    status: IncidentStatus
    message: str = Field(max_length=2000)
    created_at: datetime = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )


# --- Pydantic Schemas ---

class ServiceCreate(SQLModel):
    name: str = Field(max_length=255)
    url: str = Field(max_length=2048)
    category: str = Field(max_length=100, default="General")
    check_interval: int = Field(default=60)


class ServiceUpdate(SQLModel):
    name: str | None = Field(default=None, max_length=255)
    url: str | None = Field(default=None, max_length=2048)
    category: str | None = Field(default=None, max_length=100)
    check_interval: int | None = Field(default=None)


class ServicePublic(SQLModel):
    id: uuid.UUID
    name: str
    url: str
    category: str
    check_interval: int
    current_status: ServiceStatus
    created_at: datetime


class ServicesPublic(SQLModel):
    data: list[ServicePublic]
    count: int


class HealthCheckPublic(SQLModel):
    id: uuid.UUID
    service_id: uuid.UUID
    status_code: int | None
    response_time_ms: int
    is_healthy: bool
    checked_at: datetime


class IncidentCreate(SQLModel):
    service_id: uuid.UUID
    title: str = Field(max_length=500)
    description: str = Field(max_length=2000)
    status: IncidentStatus = Field(default=IncidentStatus.investigating)


class IncidentPatch(SQLModel):
    title: str | None = Field(default=None, max_length=500)
    description: str | None = Field(default=None, max_length=2000)
    status: IncidentStatus | None = Field(default=None)


class IncidentUpdateCreate(SQLModel):
    status: IncidentStatus
    message: str = Field(max_length=2000)


class IncidentUpdatePublic(SQLModel):
    id: uuid.UUID
    incident_id: uuid.UUID
    status: IncidentStatus
    message: str
    created_at: datetime


class IncidentUpdatesPublic(SQLModel):
    data: list[IncidentUpdatePublic]
    count: int


class IncidentPublic(SQLModel):
    id: uuid.UUID
    service_id: uuid.UUID
    title: str
    description: str
    status: IncidentStatus
    created_at: datetime
    resolved_at: datetime | None
    updates: list[IncidentUpdatePublic] = []


class IncidentsPublic(SQLModel):
    data: list[IncidentPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)
