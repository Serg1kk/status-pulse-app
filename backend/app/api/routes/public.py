import uuid

from fastapi import APIRouter

from app import crud
from app.api.deps import SessionDep
from app.models import (
    HealthCheckPublic,
    IncidentPublic,
    IncidentsPublic,
    ServicesPublic,
)

router = APIRouter(prefix="/status", tags=["public"])


@router.get("/services", response_model=ServicesPublic)
def public_services(session: SessionDep):
    services, count = crud.get_services(session=session)
    return ServicesPublic(data=services, count=count)


@router.get(
    "/services/{service_id}/checks", response_model=list[HealthCheckPublic]
)
def public_health_checks(
    session: SessionDep, service_id: uuid.UUID, limit: int = 100
):
    return crud.get_health_checks(
        session=session, service_id=service_id, limit=limit
    )


@router.get("/incidents", response_model=IncidentsPublic)
def public_incidents(
    session: SessionDep,
    active_only: bool = True,
    skip: int = 0,
    limit: int = 100,
):
    incidents, count = crud.get_incidents(
        session=session, skip=skip, limit=limit, active_only=active_only
    )
    # Populate updates for each incident
    # NOTE: Pydantic models are frozen — use model_copy(update=...) to set updates
    result = []
    for incident in incidents:
        updates = crud.get_incident_updates(session=session, incident_id=incident.id)
        incident_data = IncidentPublic.model_validate(incident).model_copy(
            update={"updates": updates}
        )
        result.append(incident_data)
    return IncidentsPublic(data=result, count=count)
