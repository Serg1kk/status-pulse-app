import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from tests.utils.incident import create_random_incident


def test_create_incident_update(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    incident = create_random_incident(db)
    data = {"status": "identified", "message": "Root cause found: connection pool exhaustion"}
    response = client.post(
        f"{settings.API_V1_STR}/incidents/{incident.id}/updates",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["status"] == "identified"
    assert content["message"] == data["message"]
    assert content["incident_id"] == str(incident.id)


def test_create_update_syncs_incident_status(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    incident = create_random_incident(db)
    # Post update with new status
    client.post(
        f"{settings.API_V1_STR}/incidents/{incident.id}/updates",
        headers=superuser_token_headers,
        json={"status": "monitoring", "message": "Monitoring after fix"},
    )
    # Check incident status was synced
    response = client.get(
        f"{settings.API_V1_STR}/incidents/",
        headers=superuser_token_headers,
    )
    incidents = response.json()["data"]
    updated = next(i for i in incidents if i["id"] == str(incident.id))
    assert updated["status"] == "monitoring"


def test_create_update_resolved_sets_resolved_at(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    incident = create_random_incident(db)
    client.post(
        f"{settings.API_V1_STR}/incidents/{incident.id}/updates",
        headers=superuser_token_headers,
        json={"status": "resolved", "message": "Issue resolved"},
    )
    response = client.get(
        f"{settings.API_V1_STR}/incidents/",
        headers=superuser_token_headers,
    )
    incidents = response.json()["data"]
    resolved = next(i for i in incidents if i["id"] == str(incident.id))
    assert resolved["status"] == "resolved"
    assert resolved["resolved_at"] is not None


def test_create_update_reopen_clears_resolved_at(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    incident = create_random_incident(db)
    # Resolve
    client.post(
        f"{settings.API_V1_STR}/incidents/{incident.id}/updates",
        headers=superuser_token_headers,
        json={"status": "resolved", "message": "Fixed"},
    )
    # Reopen
    client.post(
        f"{settings.API_V1_STR}/incidents/{incident.id}/updates",
        headers=superuser_token_headers,
        json={"status": "investigating", "message": "Issue returned"},
    )
    response = client.get(
        f"{settings.API_V1_STR}/incidents/",
        headers=superuser_token_headers,
    )
    incidents = response.json()["data"]
    reopened = next(i for i in incidents if i["id"] == str(incident.id))
    assert reopened["status"] == "investigating"
    assert reopened["resolved_at"] is None


def test_list_incident_updates(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    incident = create_random_incident(db)
    # Add two more updates (first is auto-created)
    client.post(
        f"{settings.API_V1_STR}/incidents/{incident.id}/updates",
        headers=superuser_token_headers,
        json={"status": "identified", "message": "Found the issue"},
    )
    client.post(
        f"{settings.API_V1_STR}/incidents/{incident.id}/updates",
        headers=superuser_token_headers,
        json={"status": "monitoring", "message": "Deploying fix"},
    )
    response = client.get(
        f"{settings.API_V1_STR}/incidents/{incident.id}/updates",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["count"] == 3  # 1 auto + 2 manual
    # Newest first
    assert content["data"][0]["status"] == "monitoring"
    assert content["data"][2]["status"] == "investigating"


def test_create_update_nonexistent_incident(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {"status": "identified", "message": "Some update"}
    response = client.post(
        f"{settings.API_V1_STR}/incidents/{uuid.uuid4()}/updates",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 404


def test_create_update_unauthorized(client: TestClient, db: Session) -> None:
    incident = create_random_incident(db)
    data = {"status": "identified", "message": "Unauthorized update"}
    response = client.post(
        f"{settings.API_V1_STR}/incidents/{incident.id}/updates",
        json=data,
    )
    assert response.status_code == 401
