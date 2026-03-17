import uuid

from fastapi import APIRouter, HTTPException

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Incident,
    IncidentCreate,
    IncidentPatch,
    IncidentPublic,
    IncidentsPublic,
    IncidentUpdateCreate,
    IncidentUpdatePublic,
    IncidentUpdatesPublic,
)

router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.get("/", response_model=IncidentsPublic)
def list_incidents(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
):
    incidents, count = crud.get_incidents(session=session, skip=skip, limit=limit)
    return IncidentsPublic(data=incidents, count=count)


@router.post("/", response_model=IncidentPublic)
def create_incident(
    session: SessionDep, current_user: CurrentUser, incident_in: IncidentCreate
):
    service = crud.get_service(session=session, service_id=incident_in.service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return crud.create_incident(session=session, incident_in=incident_in)


@router.patch("/{incident_id}", response_model=IncidentPublic)
def update_incident(
    session: SessionDep,
    current_user: CurrentUser,
    incident_id: uuid.UUID,
    incident_in: IncidentPatch,
):
    incident = session.get(Incident, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return crud.update_incident(
        session=session, db_incident=incident, incident_in=incident_in
    )


@router.post("/{incident_id}/updates", response_model=IncidentUpdatePublic)
def create_incident_update(
    session: SessionDep,
    current_user: CurrentUser,
    incident_id: uuid.UUID,
    update_in: IncidentUpdateCreate,
):
    incident = session.get(Incident, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return crud.create_incident_update(
        session=session, incident_id=incident_id, update_in=update_in
    )


@router.get("/{incident_id}/updates", response_model=IncidentUpdatesPublic)
def list_incident_updates(
    session: SessionDep,
    current_user: CurrentUser,
    incident_id: uuid.UUID,
):
    incident = session.get(Incident, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    updates = crud.get_incident_updates(session=session, incident_id=incident_id)
    return IncidentUpdatesPublic(data=updates, count=len(updates))
