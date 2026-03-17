import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from tests.utils.incident import create_random_incident
from tests.utils.service import create_random_service


def test_create_incident(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    service = create_random_service(db)
    data = {
        "service_id": str(service.id),
        "title": "Database connection timeout",
    }
    response = client.post(
        f"{settings.API_V1_STR}/incidents/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["title"] == data["title"]
    assert content["service_id"] == str(service.id)
    assert content["status"] == "investigating"
    assert "id" in content


def test_create_incident_nonexistent_service(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {
        "service_id": str(uuid.uuid4()),
        "title": "Some incident",
    }
    response = client.post(
        f"{settings.API_V1_STR}/incidents/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Service not found"


def test_create_incident_unauthorized(client: TestClient) -> None:
    data = {
        "service_id": str(uuid.uuid4()),
        "title": "Unauthorized incident",
    }
    response = client.post(
        f"{settings.API_V1_STR}/incidents/",
        json=data,
    )
    assert response.status_code == 401


def test_list_incidents(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    create_random_incident(db)
    create_random_incident(db)
    response = client.get(
        f"{settings.API_V1_STR}/incidents/",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) >= 2
    assert "count" in content


def test_update_incident(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    incident = create_random_incident(db)
    data = {"title": "Updated title", "status": "identified"}
    response = client.patch(
        f"{settings.API_V1_STR}/incidents/{incident.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["title"] == "Updated title"
    assert content["status"] == "identified"


def test_resolve_incident(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    incident = create_random_incident(db)
    data = {"status": "resolved"}
    response = client.patch(
        f"{settings.API_V1_STR}/incidents/{incident.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["status"] == "resolved"
    assert content["resolved_at"] is not None


def test_update_incident_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {"title": "Nope"}
    response = client.patch(
        f"{settings.API_V1_STR}/incidents/{uuid.uuid4()}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Incident not found"
