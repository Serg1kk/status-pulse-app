from sqlmodel import Session

from app import crud
from app.models import IncidentCreate
from tests.utils.service import create_random_service
from tests.utils.utils import random_lower_string


def create_random_incident(db: Session):
    service = create_random_service(db)
    incident_in = IncidentCreate(
        service_id=service.id,
        title=f"Incident {random_lower_string()}",
        description=f"Description for incident {random_lower_string()}",
    )
    return crud.create_incident(session=db, incident_in=incident_in)
