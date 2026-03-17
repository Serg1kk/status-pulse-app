import uuid

from fastapi import APIRouter, HTTPException

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Message,
    ServiceCreate,
    ServicePublic,
    ServicesPublic,
    ServiceUpdate,
)

router = APIRouter(prefix="/services", tags=["services"])


@router.get("/", response_model=ServicesPublic)
def list_services(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
):
    services, count = crud.get_services(session=session, skip=skip, limit=limit)
    return ServicesPublic(data=services, count=count)


@router.post("/", response_model=ServicePublic)
def create_service(
    session: SessionDep, current_user: CurrentUser, service_in: ServiceCreate
):
    return crud.create_service(session=session, service_in=service_in)


@router.get("/{service_id}", response_model=ServicePublic)
def get_service(
    session: SessionDep, current_user: CurrentUser, service_id: uuid.UUID
):
    service = crud.get_service(session=session, service_id=service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service


@router.patch("/{service_id}", response_model=ServicePublic)
def update_service(
    session: SessionDep,
    current_user: CurrentUser,
    service_id: uuid.UUID,
    service_in: ServiceUpdate,
):
    service = crud.get_service(session=session, service_id=service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return crud.update_service(
        session=session, db_service=service, service_in=service_in
    )


@router.delete("/{service_id}")
def delete_service(
    session: SessionDep, current_user: CurrentUser, service_id: uuid.UUID
) -> Message:
    service = crud.get_service(session=session, service_id=service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    crud.delete_service(session=session, service_id=service_id)
    return Message(message="Service deleted successfully")
