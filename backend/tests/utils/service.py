from sqlmodel import Session

from app import crud
from app.models import ServiceCreate
from tests.utils.utils import random_lower_string


def create_random_service(db: Session):
    name = f"Service {random_lower_string()}"
    url = f"https://{random_lower_string()}.example.com/health"
    service_in = ServiceCreate(name=name, url=url, category="Backend")
    return crud.create_service(session=db, service_in=service_in)
