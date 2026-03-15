# StatusPulse - Stage 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Подготовить рабочий status page проект (базу) для live demo 17 марта

**Architecture:** Форк Full Stack FastAPI Template. Убираем Item-модель, добавляем Service/HealthCheck/Incident. Упрощаем auth до env-based admin. Фронт: публичная status page + админка. Фоновый health checker пингует сервисы.

**Tech Stack:** FastAPI + SQLModel + Alembic + PostgreSQL, React + TypeScript + Vite + Tailwind + shadcn/ui, Docker Compose для локальной разработки

---

### Task 1: Клонировать шаблон и настроить проект

**Files:**
- Clone: `full-stack-fastapi-template` → `status-pulse/`
- Modify: `.env`

**Step 1: Клонировать шаблон**

```bash
cd "/Users/serg1kk/Local Documents /ProdfeatAI Brand/partners/hard-soft-skills/17-03 live demo/"
git clone https://github.com/fastapi/full-stack-fastapi-template.git status-pulse-app
cd status-pulse-app
```

**Step 2: Удалить привязку к оригинальному remote**

```bash
git remote remove origin
git remote add origin <your-new-repo-url>
```

**Step 3: Настроить .env**

Изменить в `.env`:
```env
PROJECT_NAME=StatusPulse
FIRST_SUPERUSER=admin@statuspulse.local
FIRST_SUPERUSER_PASSWORD=<secure-password>
SECRET_KEY=<generate-random-key>
```

**Step 4: Проверить что запускается**

```bash
docker compose up -d
# Открыть http://localhost:5173 - должен показать дефолтный фронт
# Открыть http://localhost:8000/docs - Swagger
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: init project from full-stack-fastapi-template"
```

---

### Task 2: Модели данных - заменить Item на Service/HealthCheck/Incident

**Files:**
- Modify: `backend/app/models.py`
- Delete logic related to: Item, ItemCreate, ItemUpdate, ItemPublic, ItemsPublic

**Step 1: Написать модели**

В `backend/app/models.py` убрать Item* модели и добавить:

```python
import enum

class ServiceStatus(str, enum.Enum):
    operational = "operational"
    degraded = "degraded"
    down = "down"

class IncidentStatus(str, enum.Enum):
    investigating = "investigating"
    identified = "identified"
    monitoring = "monitoring"
    resolved = "resolved"


# --- DB Tables ---

class Service(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=255)
    url: str = Field(max_length=2048)
    category: str = Field(max_length=100, default="General")
    check_interval: int = Field(default=60)  # seconds
    current_status: ServiceStatus = Field(default=ServiceStatus.operational)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class HealthCheck(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    service_id: uuid.UUID = Field(foreign_key="service.id", ondelete="CASCADE")
    status_code: int | None = Field(default=None)
    response_time_ms: int = Field(default=0)
    is_healthy: bool = Field(default=True)
    checked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Incident(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    service_id: uuid.UUID = Field(foreign_key="service.id", ondelete="CASCADE")
    title: str = Field(max_length=500)
    status: IncidentStatus = Field(default=IncidentStatus.investigating)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    resolved_at: datetime | None = Field(default=None)


# --- Pydantic Schemas ---

class ServiceCreate(SQLModel):
    name: str = Field(max_length=255)
    url: str = Field(max_length=2048)
    category: str = Field(max_length=100, default="General")
    check_interval: int = Field(default=60)

class ServiceUpdate(SQLModel):
    name: str | None = Field(default=None, max_length=255)
    url: str | None = Field(default=None, max_length=2048)
    category: str | None = Field(default=None, max_length=100)
    check_interval: int | None = Field(default=None)

class ServicePublic(SQLModel):
    id: uuid.UUID
    name: str
    url: str
    category: str
    check_interval: int
    current_status: ServiceStatus
    created_at: datetime

class ServicesPublic(SQLModel):
    data: list[ServicePublic]
    count: int

class HealthCheckPublic(SQLModel):
    id: uuid.UUID
    service_id: uuid.UUID
    status_code: int | None
    response_time_ms: int
    is_healthy: bool
    checked_at: datetime

class IncidentCreate(SQLModel):
    service_id: uuid.UUID
    title: str = Field(max_length=500)
    status: IncidentStatus = Field(default=IncidentStatus.investigating)

class IncidentUpdate(SQLModel):
    title: str | None = Field(default=None, max_length=500)
    status: IncidentStatus | None = Field(default=None)

class IncidentPublic(SQLModel):
    id: uuid.UUID
    service_id: uuid.UUID
    title: str
    status: IncidentStatus
    created_at: datetime
    resolved_at: datetime | None

class IncidentsPublic(SQLModel):
    data: list[IncidentPublic]
    count: int
```

**Step 2: Обновить crud.py**

Убрать Item CRUD, добавить:

```python
# --- Services ---
def create_service(*, session: Session, service_in: ServiceCreate) -> Service:
    db_service = Service.model_validate(service_in)
    session.add(db_service)
    session.commit()
    session.refresh(db_service)
    return db_service

def get_services(*, session: Session, skip: int = 0, limit: int = 100) -> tuple[list[Service], int]:
    count = session.exec(select(func.count()).select_from(Service)).one()
    services = session.exec(select(Service).offset(skip).limit(limit)).all()
    return list(services), count

def get_service(*, session: Session, service_id: uuid.UUID) -> Service | None:
    return session.get(Service, service_id)

def update_service(*, session: Session, db_service: Service, service_in: ServiceUpdate) -> Service:
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
def create_health_check(*, session: Session, service_id: uuid.UUID, status_code: int | None, response_time_ms: int, is_healthy: bool) -> HealthCheck:
    check = HealthCheck(service_id=service_id, status_code=status_code, response_time_ms=response_time_ms, is_healthy=is_healthy)
    session.add(check)
    session.commit()
    session.refresh(check)
    return check

def get_health_checks(*, session: Session, service_id: uuid.UUID, limit: int = 100) -> list[HealthCheck]:
    return list(session.exec(
        select(HealthCheck)
        .where(HealthCheck.service_id == service_id)
        .order_by(HealthCheck.checked_at.desc())
        .limit(limit)
    ).all())

# --- Incidents ---
def create_incident(*, session: Session, incident_in: IncidentCreate) -> Incident:
    db_incident = Incident.model_validate(incident_in)
    session.add(db_incident)
    session.commit()
    session.refresh(db_incident)
    return db_incident

def get_incidents(*, session: Session, skip: int = 0, limit: int = 100, active_only: bool = False) -> tuple[list[Incident], int]:
    query = select(Incident)
    count_query = select(func.count()).select_from(Incident)
    if active_only:
        query = query.where(Incident.status != IncidentStatus.resolved)
        count_query = count_query.where(Incident.status != IncidentStatus.resolved)
    count = session.exec(count_query).one()
    incidents = session.exec(query.order_by(Incident.created_at.desc()).offset(skip).limit(limit)).all()
    return list(incidents), count

def update_incident(*, session: Session, db_incident: Incident, incident_in: IncidentUpdate) -> Incident:
    update_data = incident_in.model_dump(exclude_unset=True)
    if update_data.get("status") == IncidentStatus.resolved:
        db_incident.resolved_at = datetime.now(timezone.utc)
    db_incident.sqlmodel_update(update_data)
    session.add(db_incident)
    session.commit()
    session.refresh(db_incident)
    return db_incident
```

**Step 3: Commit**

```bash
git add backend/app/models.py backend/app/crud.py
git commit -m "feat: replace Item model with Service, HealthCheck, Incident"
```

---

### Task 3: API Routes - сервисы и инциденты

**Files:**
- Delete: `backend/app/api/routes/items.py`
- Create: `backend/app/api/routes/services.py`
- Create: `backend/app/api/routes/incidents.py`
- Create: `backend/app/api/routes/public.py`
- Modify: `backend/app/api/main.py`

**Step 1: Создать routes/services.py (admin, auth required)**

```python
from fastapi import APIRouter, HTTPException
from app.api.deps import CurrentUser, SessionDep
from app.models import ServiceCreate, ServiceUpdate, ServicePublic, ServicesPublic
from app import crud
import uuid

router = APIRouter(prefix="/services", tags=["services"])

@router.get("/", response_model=ServicesPublic)
def list_services(session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100):
    services, count = crud.get_services(session=session, skip=skip, limit=limit)
    return ServicesPublic(data=services, count=count)

@router.post("/", response_model=ServicePublic)
def create_service(session: SessionDep, current_user: CurrentUser, service_in: ServiceCreate):
    return crud.create_service(session=session, service_in=service_in)

@router.get("/{service_id}", response_model=ServicePublic)
def get_service(session: SessionDep, current_user: CurrentUser, service_id: uuid.UUID):
    service = crud.get_service(session=session, service_id=service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service

@router.patch("/{service_id}", response_model=ServicePublic)
def update_service(session: SessionDep, current_user: CurrentUser, service_id: uuid.UUID, service_in: ServiceUpdate):
    service = crud.get_service(session=session, service_id=service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return crud.update_service(session=session, db_service=service, service_in=service_in)

@router.delete("/{service_id}")
def delete_service(session: SessionDep, current_user: CurrentUser, service_id: uuid.UUID):
    service = crud.get_service(session=session, service_id=service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    crud.delete_service(session=session, service_id=service_id)
    return {"ok": True}
```

**Step 2: Создать routes/incidents.py (admin, auth required)**

```python
from fastapi import APIRouter, HTTPException
from app.api.deps import CurrentUser, SessionDep
from app.models import IncidentCreate, IncidentUpdate, IncidentPublic, IncidentsPublic
from app import crud
import uuid

router = APIRouter(prefix="/incidents", tags=["incidents"])

@router.get("/", response_model=IncidentsPublic)
def list_incidents(session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100):
    incidents, count = crud.get_incidents(session=session, skip=skip, limit=limit)
    return IncidentsPublic(data=incidents, count=count)

@router.post("/", response_model=IncidentPublic)
def create_incident(session: SessionDep, current_user: CurrentUser, incident_in: IncidentCreate):
    service = crud.get_service(session=session, service_id=incident_in.service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return crud.create_incident(session=session, incident_in=incident_in)

@router.patch("/{incident_id}", response_model=IncidentPublic)
def update_incident(session: SessionDep, current_user: CurrentUser, incident_id: uuid.UUID, incident_in: IncidentUpdate):
    incident = session.get(Incident, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return crud.update_incident(session=session, db_incident=incident, incident_in=incident_in)
```

**Step 3: Создать routes/public.py (без auth - публичная status page)**

```python
from fastapi import APIRouter
from app.api.deps import SessionDep
from app.models import ServicePublic, ServicesPublic, IncidentPublic, IncidentsPublic, HealthCheckPublic
from app import crud
import uuid

router = APIRouter(prefix="/status", tags=["public"])

@router.get("/services", response_model=ServicesPublic)
def public_services(session: SessionDep):
    services, count = crud.get_services(session=session)
    return ServicesPublic(data=services, count=count)

@router.get("/services/{service_id}/checks", response_model=list[HealthCheckPublic])
def public_health_checks(session: SessionDep, service_id: uuid.UUID, limit: int = 100):
    return crud.get_health_checks(session=session, service_id=service_id, limit=limit)

@router.get("/incidents", response_model=IncidentsPublic)
def public_incidents(session: SessionDep, active_only: bool = True, skip: int = 0, limit: int = 100):
    incidents, count = crud.get_incidents(session=session, skip=skip, limit=limit, active_only=active_only)
    return IncidentsPublic(data=incidents, count=count)
```

**Step 4: Обновить api/main.py**

```python
from app.api.routes import login, users, utils, services, incidents, public

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(services.router)
api_router.include_router(incidents.router)
api_router.include_router(public.router)
```

**Step 5: Commit**

```bash
git add backend/app/api/
git commit -m "feat: add services, incidents, and public status API routes"
```

---

### Task 4: Миграция БД

**Step 1: Создать миграцию**

```bash
cd backend
alembic revision --autogenerate -m "add service healthcheck incident tables"
```

**Step 2: Проверить сгенерированный файл миграции**

Открыть файл в `backend/app/alembic/versions/`, убедиться что создаются таблицы service, healthcheck, incident и удаляется item.

**Step 3: Применить миграцию**

```bash
alembic upgrade head
```

**Step 4: Commit**

```bash
git add backend/app/alembic/
git commit -m "feat: add DB migration for status page models"
```

---

### Task 5: Фоновый health checker

**Files:**
- Create: `backend/app/health_checker.py`
- Modify: `backend/app/main.py`

**Step 1: Создать health_checker.py**

```python
import asyncio
import httpx
from datetime import datetime, timezone
from sqlmodel import Session, select
from app.core.db import engine
from app.models import Service, ServiceStatus, HealthCheck, Incident, IncidentCreate, IncidentStatus

async def check_service(service: Service) -> None:
    """Пингует один сервис, записывает результат, создаёт/резолвит инциденты."""
    is_healthy = False
    status_code = None
    response_time_ms = 0

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            start = datetime.now(timezone.utc)
            response = await client.get(service.url)
            elapsed = (datetime.now(timezone.utc) - start).total_seconds() * 1000
            status_code = response.status_code
            response_time_ms = int(elapsed)
            is_healthy = 200 <= status_code < 400
    except Exception:
        is_healthy = False

    with Session(engine) as session:
        # Записать health check
        check = HealthCheck(
            service_id=service.id,
            status_code=status_code,
            response_time_ms=response_time_ms,
            is_healthy=is_healthy,
        )
        session.add(check)

        # Обновить статус сервиса
        db_service = session.get(Service, service.id)
        if db_service:
            db_service.current_status = ServiceStatus.operational if is_healthy else ServiceStatus.down
            session.add(db_service)

        # Автоинцидент при падении
        if not is_healthy:
            active_incident = session.exec(
                select(Incident)
                .where(Incident.service_id == service.id)
                .where(Incident.status != IncidentStatus.resolved)
            ).first()
            if not active_incident:
                incident = Incident(
                    service_id=service.id,
                    title=f"{service.name} is down",
                    status=IncidentStatus.investigating,
                )
                session.add(incident)

        # Авторезолв при восстановлении
        if is_healthy:
            active_incidents = session.exec(
                select(Incident)
                .where(Incident.service_id == service.id)
                .where(Incident.status != IncidentStatus.resolved)
            ).all()
            for inc in active_incidents:
                inc.status = IncidentStatus.resolved
                inc.resolved_at = datetime.now(timezone.utc)
                session.add(inc)

        session.commit()

async def run_checker():
    """Бесконечный цикл проверки всех сервисов."""
    while True:
        with Session(engine) as session:
            services = list(session.exec(select(Service)).all())
        for service in services:
            await check_service(service)
        await asyncio.sleep(60)  # пауза между циклами
```

**Step 2: Подключить к main.py**

В `backend/app/main.py` добавить запуск фонового таска:

```python
import asyncio
from contextlib import asynccontextmanager
from app.health_checker import run_checker

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Запуск фонового чекера
    task = asyncio.create_task(run_checker())
    yield
    task.cancel()

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan, ...)
```

**Step 3: Добавить httpx в зависимости**

В `backend/pyproject.toml` добавить `httpx` в dependencies.

**Step 4: Commit**

```bash
git add backend/app/health_checker.py backend/app/main.py backend/pyproject.toml
git commit -m "feat: add background health checker with auto-incidents"
```

---

### Task 6: Frontend - публичная Status Page

**Files:**
- Create: `frontend/src/routes/index.tsx` (переписать - публичная страница)
- Create: `frontend/src/components/StatusPage/ServiceList.tsx`
- Create: `frontend/src/components/StatusPage/UptimeGraph.tsx`
- Create: `frontend/src/components/StatusPage/IncidentList.tsx`
- Create: `frontend/src/components/StatusPage/OverallStatus.tsx`

**Step 1: Перегенерировать API client**

```bash
cd frontend
npm run generate-client
```

Это создаст типы и SDK-функции для новых эндпоинтов `/status/*`.

**Step 2: Создать компонент OverallStatus**

Показывает баннер "All Systems Operational" или "Partial Outage" на основе статусов всех сервисов.

**Step 3: Создать компонент ServiceList**

Список сервисов по категориям. Каждый сервис: имя, статус (зелёный/жёлтый/красный кружок), response time последнего чека.

**Step 4: Создать компонент UptimeGraph**

Горизонтальная полоска из 30 или 90 маленьких прямоугольников (каждый = 1 день). Зелёный = 100% uptime, жёлтый = degraded, красный = downtime. По hover - tooltip с датой и процентом.

**Step 5: Создать компонент IncidentList**

Список активных инцидентов: title, статус (badge), время создания, связанный сервис.

**Step 6: Собрать публичную страницу**

`routes/index.tsx` - корневая страница без auth:
- OverallStatus
- ServiceList (с UptimeGraph для каждого сервиса)
- IncidentList

**Step 7: Commit**

```bash
git add frontend/src/
git commit -m "feat: add public status page with service list, uptime graph, incidents"
```

---

### Task 7: Frontend - админка

**Files:**
- Modify: `frontend/src/routes/_layout/` - адаптировать под status page admin
- Create/modify компоненты для CRUD сервисов и инцидентов

**Step 1: Адаптировать sidebar**

Заменить пункты меню Items → Services, добавить Incidents.

**Step 2: Страница Services**

Таблица сервисов (shadcn DataTable уже есть в шаблоне). Кнопки: Add, Edit, Delete. Модальные окна для форм (паттерн уже есть от Items).

**Step 3: Страница Incidents**

Таблица инцидентов. Создание вручную (выбор сервиса, title). Смена статуса через dropdown.

**Step 4: Убрать Items из навигации и роутов**

Удалить `routes/_layout/items.tsx` и компоненты `components/Items/`.

**Step 5: Commit**

```bash
git add frontend/src/
git commit -m "feat: add admin pages for services and incidents management"
```

---

### Task 8: Тестовые данные (seed)

**Files:**
- Modify: `backend/app/initial_data.py`

**Step 1: Добавить seed-сервисы**

После создания суперюзера добавить 3-5 тестовых сервисов:

```python
test_services = [
    {"name": "API Gateway", "url": "https://httpbin.org/status/200", "category": "Backend"},
    {"name": "Auth Service", "url": "https://httpbin.org/status/200", "category": "Backend"},
    {"name": "Web App", "url": "https://example.com", "category": "Frontend"},
    {"name": "Database", "url": "https://httpbin.org/status/200", "category": "Infrastructure"},
    {"name": "CDN", "url": "https://httpbin.org/status/503", "category": "Infrastructure"},  # этот "упадёт"
]
```

Последний сервис намеренно возвращает 503 - чтобы на демо был активный инцидент.

**Step 2: Commit**

```bash
git add backend/app/initial_data.py
git commit -m "feat: add seed data with test services"
```

---

### Task 9: Деплой на Vercel + Railway

**Step 1: Railway - бэкенд + PostgreSQL**

- Создать проект в Railway
- Добавить PostgreSQL сервис
- Добавить Python сервис из репо (папка `backend/`)
- Настроить env переменные (DATABASE_URL, SECRET_KEY, etc.)

**Step 2: Vercel - фронтенд**

- Подключить репо к Vercel
- Root directory: `frontend/`
- Build command: `npm run build`
- Настроить API proxy на Railway URL

**Step 3: Проверить что всё работает**

- Публичная страница открывается
- Логин в админку работает
- Сервисы чекаются
- Инциденты создаются автоматически

**Step 4: Commit конфигов деплоя (если есть)**

```bash
git add .
git commit -m "feat: add deployment configuration for Vercel + Railway"
```

---

### Task 10: Настройка Claude Code инфраструктуры для демо

**Step 1: Создать CLAUDE.md**

В корне `status-pulse-app/` - описание проекта, стека, структуры, команд для запуска.

**Step 2: Создать субагентов**

В `.claude/agents/`:
- `plan-reviewer.md` - ревью implementation plans
- `db-engineer.md` - работа с БД, миграции, SQLModel
- `backend-dev.md` - FastAPI эндпоинты, бизнес-логика
- `frontend-dev.md` - React компоненты, страницы
- `qa-engineer.md` - тестирование через Playwright MCP
- `devops.md` - деплой через Vercel/Railway MCP

**Step 3: Подключить MCP серверы**

В `.claude/settings.json`:
- Playwright MCP (для QA)
- Vercel MCP (для деплоя)
- Railway MCP (для деплоя)

**Step 4: Commit**

```bash
git add CLAUDE.md .claude/
git commit -m "feat: add Claude Code infrastructure - agents, skills, MCP config"
```

---

### Task 11: Git tag - точка отката

**Step 1: Прогнать всё, убедиться что работает**

```bash
docker compose up -d
# Проверить публичную страницу, админку, чекер
```

**Step 2: Создать тег**

```bash
git tag v1.0-base
git push origin v1.0-base
```

Теперь можно тренировать стадию 2 (фичу IncidentUpdate) и откатываться к этому тегу.

---

## Execution Options

Plan complete and saved to `status-pulse/plan-stage1.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
