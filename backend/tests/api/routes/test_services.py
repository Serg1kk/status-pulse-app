import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from tests.utils.service import create_random_service


def test_create_service(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {"name": "API Gateway", "url": "https://api.example.com/health"}
    response = client.post(
        f"{settings.API_V1_STR}/services/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == data["name"]
    assert content["url"] == data["url"]
    assert content["category"] == "General"
    assert content["current_status"] == "operational"
    assert "id" in content


def test_create_service_with_category(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {
        "name": "Payment API",
        "url": "https://pay.example.com/health",
        "category": "Payments",
        "check_interval": 30,
    }
    response = client.post(
        f"{settings.API_V1_STR}/services/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["category"] == "Payments"
    assert content["check_interval"] == 30


def test_create_service_unauthorized(client: TestClient) -> None:
    data = {"name": "Test", "url": "https://example.com/health"}
    response = client.post(
        f"{settings.API_V1_STR}/services/",
        json=data,
    )
    assert response.status_code == 401


def test_read_service(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    service = create_random_service(db)
    response = client.get(
        f"{settings.API_V1_STR}/services/{service.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == service.name
    assert content["url"] == service.url
    assert content["id"] == str(service.id)


def test_read_service_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/services/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Service not found"


def test_read_services(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    create_random_service(db)
    create_random_service(db)
    response = client.get(
        f"{settings.API_V1_STR}/services/",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) >= 2
    assert "count" in content


def test_update_service(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    service = create_random_service(db)
    data = {"name": "Updated Service", "url": "https://updated.example.com"}
    response = client.patch(
        f"{settings.API_V1_STR}/services/{service.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == "Updated Service"
    assert content["url"] == "https://updated.example.com"
    assert content["id"] == str(service.id)


def test_update_service_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {"name": "Updated"}
    response = client.patch(
        f"{settings.API_V1_STR}/services/{uuid.uuid4()}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Service not found"


def test_delete_service(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    service = create_random_service(db)
    response = client.delete(
        f"{settings.API_V1_STR}/services/{service.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["message"] == "Service deleted successfully"


def test_delete_service_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.delete(
        f"{settings.API_V1_STR}/services/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Service not found"
