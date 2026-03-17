import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session

from app import crud
from app.core.config import settings
from tests.utils.service import create_random_service


def test_get_public_services(client: TestClient, db: Session) -> None:
    create_random_service(db)
    response = client.get(f"{settings.API_V1_STR}/status/services")
    assert response.status_code == 200
    content = response.json()
    assert "data" in content
    assert "count" in content
    assert len(content["data"]) >= 1


def test_get_public_incidents(client: TestClient) -> None:
    response = client.get(f"{settings.API_V1_STR}/status/incidents")
    assert response.status_code == 200
    content = response.json()
    assert "data" in content
    assert "count" in content


def test_get_public_incidents_active_only(
    client: TestClient, db: Session
) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/status/incidents?active_only=true"
    )
    assert response.status_code == 200
    content = response.json()
    for incident in content["data"]:
        assert incident["status"] != "resolved"


def test_get_service_health_checks(client: TestClient, db: Session) -> None:
    service = create_random_service(db)
    crud.create_health_check(
        session=db,
        service_id=service.id,
        status_code=200,
        response_time_ms=150,
        is_healthy=True,
    )
    response = client.get(
        f"{settings.API_V1_STR}/status/services/{service.id}/checks"
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content) >= 1
    assert content[0]["status_code"] == 200
    assert content[0]["is_healthy"] is True


def test_get_health_checks_empty(client: TestClient, db: Session) -> None:
    service = create_random_service(db)
    response = client.get(
        f"{settings.API_V1_STR}/status/services/{service.id}/checks"
    )
    assert response.status_code == 200
    content = response.json()
    assert content == []


def test_get_health_checks_nonexistent_service(client: TestClient) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/status/services/{uuid.uuid4()}/checks"
    )
    assert response.status_code == 200
    content = response.json()
    assert content == []
