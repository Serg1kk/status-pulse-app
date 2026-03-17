import uuid
from datetime import datetime, timezone
from typing import Any

from sqlmodel import Session, func, select

from app.core.security import get_password_hash, verify_password
from app.models import (
    HealthCheck,
    Incident,
    IncidentCreate,
    IncidentPatch,
    IncidentStatus,
    IncidentUpdate,
    IncidentUpdateCreate,
    Service,
    ServiceCreate,
    ServiceUpdate,
    User,
    UserCreate,
    UserUpdate,
)


def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user


# Dummy hash to use for timing attack prevention when user is not found
# This is an Argon2 hash of a random password, used to ensure constant-time comparison
DUMMY_HASH = "$argon2id$v=19$m=65536,t=3,p=4$MjQyZWE1MzBjYjJlZTI0Yw$YTU4NGM5ZTZmYjE2NzZlZjY0ZWY3ZGRkY2U2OWFjNjk"


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        # Prevent timing attacks by running password verification even when user doesn't exist
        # This ensures the response time is similar whether or not the email exists
        verify_password(password, DUMMY_HASH)
        return None
    verified, updated_password_hash = verify_password(password, db_user.hashed_password)
    if not verified:
        return None
    if updated_password_hash:
        db_user.hashed_password = updated_password_hash
        session.add(db_user)
        session.commit()
        session.refresh(db_user)
    return db_user


# --- Services ---


def create_service(*, session: Session, service_in: ServiceCreate) -> Service:
    db_service = Service.model_validate(service_in)
    session.add(db_service)
    session.commit()
    session.refresh(db_service)
    return db_service


def get_services(
    *, session: Session, skip: int = 0, limit: int = 100
) -> tuple[list[Service], int]:
    count = session.exec(select(func.count()).select_from(Service)).one()
    services = session.exec(select(Service).offset(skip).limit(limit)).all()
    return list(services), count


def get_service(*, session: Session, service_id: uuid.UUID) -> Service | None:
    return session.get(Service, service_id)


def update_service(
    *, session: Session, db_service: Service, service_in: ServiceUpdate
) -> Service:
    update_data = service_in.model_dump(exclude_unset=True)
    db_service.sqlmodel_update(update_data)
    session.add(db_service)
    session.commit()
    session.refresh(db_service)
    return db_service


def delete_service(*, session: Session, service_id: uuid.UUID) -> None:
    service = session.get(Service, service_id)
    if service:
        session.delete(service)
        session.commit()


# --- Health Checks ---


def create_health_check(
    *,
    session: Session,
    service_id: uuid.UUID,
    status_code: int | None,
    response_time_ms: int,
    is_healthy: bool,
) -> HealthCheck:
    check = HealthCheck(
        service_id=service_id,
        status_code=status_code,
        response_time_ms=response_time_ms,
        is_healthy=is_healthy,
    )
    session.add(check)
    session.commit()
    session.refresh(check)
    return check


def get_health_checks(
    *, session: Session, service_id: uuid.UUID, limit: int = 100
) -> list[HealthCheck]:
    return list(
        session.exec(
            select(HealthCheck)
            .where(HealthCheck.service_id == service_id)
            .order_by(HealthCheck.checked_at.desc())  # type: ignore
            .limit(limit)
        ).all()
    )


# --- Incidents ---


def create_incident(*, session: Session, incident_in: IncidentCreate) -> Incident:
    db_incident = Incident.model_validate(incident_in)
    session.add(db_incident)
    session.flush()  # get the id without committing

    # Auto-create first update from incident description
    first_update = IncidentUpdate(
        incident_id=db_incident.id,
        status=db_incident.status,
        message=db_incident.description,
        created_at=db_incident.created_at,
    )
    session.add(first_update)
    session.commit()
    session.refresh(db_incident)
    return db_incident


def get_incidents(
    *,
    session: Session,
    skip: int = 0,
    limit: int = 100,
    active_only: bool = False,
) -> tuple[list[Incident], int]:
    query = select(Incident)
    count_query = select(func.count()).select_from(Incident)
    if active_only:
        query = query.where(Incident.status != IncidentStatus.resolved)
        count_query = count_query.where(Incident.status != IncidentStatus.resolved)
    count = session.exec(count_query).one()
    incidents = session.exec(
        query.order_by(Incident.created_at.desc()).offset(skip).limit(limit)  # type: ignore
    ).all()
    return list(incidents), count


def update_incident(
    *, session: Session, db_incident: Incident, incident_in: IncidentPatch
) -> Incident:
    update_data = incident_in.model_dump(exclude_unset=True)
    if update_data.get("status") == IncidentStatus.resolved:
        db_incident.resolved_at = datetime.now(timezone.utc)
    db_incident.sqlmodel_update(update_data)
    session.add(db_incident)
    session.commit()
    session.refresh(db_incident)
    return db_incident


def create_incident_update(
    *, session: Session, incident_id: uuid.UUID, update_in: IncidentUpdateCreate
) -> IncidentUpdate:
    db_update = IncidentUpdate(
        incident_id=incident_id,
        status=update_in.status,
        message=update_in.message,
    )
    session.add(db_update)

    # Sync incident status
    incident = session.get(Incident, incident_id)
    if incident:
        incident.status = update_in.status
        if update_in.status == IncidentStatus.resolved:
            incident.resolved_at = datetime.now(timezone.utc)
        elif incident.resolved_at is not None:
            incident.resolved_at = None  # reopen
        session.add(incident)

    session.commit()
    session.refresh(db_update)
    return db_update


def get_incident_updates(
    *, session: Session, incident_id: uuid.UUID
) -> list[IncidentUpdate]:
    return list(
        session.exec(
            select(IncidentUpdate)
            .where(IncidentUpdate.incident_id == incident_id)
            .order_by(IncidentUpdate.created_at.desc())  # type: ignore
        ).all()
    )
