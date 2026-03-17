# 004 — Incident Descriptions & Updates: Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add description field and update history to incidents with inline admin management and public accordion timeline.

**Architecture:** New IncidentUpdate model linked to Incident via FK. Backend CRUD + 2 new endpoints. Frontend: row-expand in admin table, accordion on public page. Status sync via updates only.

**Tech Stack:** FastAPI + SQLModel + Alembic (BE), React 19 + TanStack Query + shadcn/ui + Tailwind CSS 4 (FE)

**Design Spec:** `docs/backlog/active/004-incident-descriptions/design.md`

---

## File Structure

### Backend — New/Modified Files

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `backend/app/models.py` | Add `description` to Incident, add IncidentUpdate table + schemas |
| Modify | `backend/app/crud.py` | Add IncidentUpdate CRUD, update create_incident for auto-first-update |
| Modify | `backend/app/api/routes/incidents.py` | Add POST/GET updates endpoints |
| Modify | `backend/app/api/routes/public.py` | Include updates in public incidents response |
| Create | `backend/app/alembic/versions/*_add_incident_description_and_updates.py` | Alembic migration |
| Modify | `backend/tests/utils/incident.py` | Update helper with description field |
| Modify | `backend/tests/api/routes/test_incidents.py` | Update existing tests, add update tests |
| Create | `backend/tests/api/routes/test_incident_updates.py` | Tests for new update endpoints |

### Frontend — New/Modified Files

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `frontend/src/types/status.ts` | Add IncidentUpdatePublic type, update IncidentPublic |
| Modify | `frontend/src/components/Incidents/AddIncident.tsx` | Add description textarea |
| Create | `frontend/src/components/Incidents/IncidentExpandRow.tsx` | Expandable panel: description + timeline + add update form |
| Modify | `frontend/src/components/Incidents/columns.tsx` | Replace UpdateIncidentStatus with expand chevron |
| Delete | `frontend/src/components/Incidents/UpdateIncidentStatus.tsx` | Replaced by inline update form |
| Modify | `frontend/src/routes/_layout/incidents.tsx` | Replace DataTable with custom expandable table |
| Modify | `frontend/src/components/StatusPage/IncidentList.tsx` | Add accordion with description + timeline |

---

## Phase 1: Backend — Model & Migration

### Task 1.1: [BE] Add IncidentUpdate model and update Incident model

**Depends on:** none
**Parallel:** no (migration must be first)

**Files:**
- Modify: `backend/app/models.py`

- [ ] **Step 1: Add description field to Incident model**

In `backend/app/models.py`, add `description` field to `Incident` class after `title`:

```python
class Incident(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    service_id: uuid.UUID = Field(foreign_key="service.id", ondelete="CASCADE")
    title: str = Field(max_length=500)
    description: str = Field(max_length=2000, default="")
    status: IncidentStatus = Field(default=IncidentStatus.investigating)
    created_at: datetime = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),
    )
    resolved_at: datetime | None = Field(default=None)
```

- [ ] **Step 2: Add IncidentUpdate table model**

Add after the `Incident` class:

```python
class IncidentUpdate(SQLModel, table=True):
    __tablename__ = "incidentupdate"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    incident_id: uuid.UUID = Field(foreign_key="incident.id", ondelete="CASCADE")
    status: IncidentStatus
    message: str = Field(max_length=2000)
    created_at: datetime = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),
    )
```

- [ ] **Step 3: Update Pydantic schemas**

**IMPORTANT — Naming collision:** The current codebase has `IncidentUpdate(SQLModel)` as the PATCH schema. In Step 2 we added `IncidentUpdate(SQLModel, table=True)` as the DB table. Python would overwrite one with the other. **Rename the PATCH schema FIRST** before adding any new schemas.

Delete the old `IncidentUpdate` schema (non-table class) and replace it with `IncidentPatch`:

```python
class IncidentPatch(SQLModel):
    title: str | None = Field(default=None, max_length=500)
    description: str | None = Field(default=None, max_length=2000)
    status: IncidentStatus | None = Field(default=None)
```

Update `IncidentCreate` — add required `description`:

```python
class IncidentCreate(SQLModel):
    service_id: uuid.UUID
    title: str = Field(max_length=500)
    description: str = Field(max_length=2000)
    status: IncidentStatus = Field(default=IncidentStatus.investigating)
```

Add new schemas for incident updates:

```python
class IncidentUpdateCreate(SQLModel):
    status: IncidentStatus
    message: str = Field(max_length=2000)


class IncidentUpdatePublic(SQLModel):
    id: uuid.UUID
    incident_id: uuid.UUID
    status: IncidentStatus
    message: str
    created_at: datetime


class IncidentUpdatesPublic(SQLModel):
    data: list[IncidentUpdatePublic]
    count: int
```

Update `IncidentPublic` — add `description` and `updates`:

```python
class IncidentPublic(SQLModel):
    id: uuid.UUID
    service_id: uuid.UUID
    title: str
    description: str
    status: IncidentStatus
    created_at: datetime
    resolved_at: datetime | None
    updates: list[IncidentUpdatePublic] = []
```

**Summary of name changes in `models.py`:**
- `IncidentUpdate(SQLModel)` (old PATCH schema) → **renamed to** `IncidentPatch`
- `IncidentUpdate(SQLModel, table=True)` → **new DB table** (keeps name `IncidentUpdate`)
- All imports of the old PATCH schema must change to `IncidentPatch`

- [ ] **Step 4: Run linter**

Run: `cd backend && uv run ruff check app/models.py --fix`

### Task 1.2: [BE] Create Alembic migration

**Depends on:** Task 1.1
**Parallel:** no

**Files:**
- Create: `backend/app/alembic/versions/*_add_incident_description_and_updates.py`

- [ ] **Step 1: Generate migration**

Run: `cd backend && alembic revision --autogenerate -m "add incident description and incidentupdate table"`

- [ ] **Step 2: Review generated migration**

Verify it contains:
- `op.add_column('incident', sa.Column('description', ...))` with `server_default=''`
- `op.create_table('incidentupdate', ...)` with all columns and FK

- [ ] **Step 3: Apply migration**

Run: `cd backend && alembic upgrade head`

Expected: migration applies without errors.

---

## Phase 2: Backend — CRUD & Routes

### Task 2.1: [BE] Update CRUD functions

**Depends on:** Task 1.2
**Parallel:** yes — can run with Task 2.2

**Files:**
- Modify: `backend/app/crud.py`

- [ ] **Step 1: Update imports**

**IMPORTANT:** `IncidentUpdate` in `crud.py` currently refers to the old PATCH schema. After Task 1.1, `IncidentUpdate` now refers to the DB table model. Replace the old import explicitly:

```python
from app.models import (
    HealthCheck,
    Incident,
    IncidentCreate,
    IncidentPatch,      # was IncidentUpdate (PATCH schema) — renamed
    IncidentStatus,
    IncidentUpdate,      # now the DB table model (table=True)
    IncidentUpdateCreate,
    Service,
    ServiceCreate,
    ServiceUpdate,
    User,
    UserCreate,
    UserUpdate,
)
```

- [ ] **Step 2: Update create_incident to auto-create first update**

```python
def create_incident(*, session: Session, incident_in: IncidentCreate) -> Incident:
    db_incident = Incident.model_validate(incident_in)
    session.add(db_incident)
    session.flush()  # get the id without committing

    # Auto-create first update from incident description
    first_update = IncidentUpdate(
        incident_id=db_incident.id,
        status=db_incident.status,
        message=db_incident.description,
        created_at=db_incident.created_at,
    )
    session.add(first_update)
    session.commit()
    session.refresh(db_incident)
    return db_incident
```

- [ ] **Step 3: Update update_incident to use IncidentPatch**

```python
def update_incident(
    *, session: Session, db_incident: Incident, incident_in: IncidentPatch
) -> Incident:
    update_data = incident_in.model_dump(exclude_unset=True)
    if update_data.get("status") == IncidentStatus.resolved:
        db_incident.resolved_at = datetime.now(timezone.utc)
    db_incident.sqlmodel_update(update_data)
    session.add(db_incident)
    session.commit()
    session.refresh(db_incident)
    return db_incident
```

- [ ] **Step 4: Add IncidentUpdate CRUD functions**

```python
def create_incident_update(
    *, session: Session, incident_id: uuid.UUID, update_in: IncidentUpdateCreate
) -> IncidentUpdate:
    db_update = IncidentUpdate(
        incident_id=incident_id,
        status=update_in.status,
        message=update_in.message,
    )
    session.add(db_update)

    # Sync incident status
    incident = session.get(Incident, incident_id)
    if incident:
        incident.status = update_in.status
        if update_in.status == IncidentStatus.resolved:
            incident.resolved_at = datetime.now(timezone.utc)
        elif incident.resolved_at is not None:
            incident.resolved_at = None  # reopen
        session.add(incident)

    session.commit()
    session.refresh(db_update)
    return db_update


def get_incident_updates(
    *, session: Session, incident_id: uuid.UUID
) -> list[IncidentUpdate]:
    return list(
        session.exec(
            select(IncidentUpdate)
            .where(IncidentUpdate.incident_id == incident_id)
            .order_by(IncidentUpdate.created_at.desc())  # type: ignore
        ).all()
    )
```

- [ ] **Step 5: Run linter**

Run: `cd backend && uv run ruff check app/crud.py --fix`

### Task 2.2: [BE] Update incident routes + add update endpoints

**Depends on:** Task 1.2
**Parallel:** yes — can run with Task 2.1

**Files:**
- Modify: `backend/app/api/routes/incidents.py`

- [ ] **Step 1: Update imports**

**IMPORTANT:** Replace `IncidentUpdate` (old PATCH schema) with `IncidentPatch` in the import block. `IncidentUpdate` is no longer imported here — it's only needed in `crud.py` (as the DB table).

```python
import uuid

from fastapi import APIRouter, HTTPException

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Incident,
    IncidentCreate,
    IncidentPatch,         # was IncidentUpdate — renamed
    IncidentPublic,
    IncidentUpdateCreate,
    IncidentUpdatePublic,
    IncidentUpdatesPublic,
    IncidentsPublic,
)
```

- [ ] **Step 2: Update PATCH endpoint to use IncidentPatch**

```python
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
```

- [ ] **Step 3: Add POST update endpoint**

```python
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
```

- [ ] **Step 4: Add GET updates endpoint**

```python
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
```

- [ ] **Step 5: Run linter**

Run: `cd backend && uv run ruff check app/api/routes/incidents.py --fix`

### Task 2.3: [BE] Update public endpoint to include updates

**Depends on:** Task 2.1
**Parallel:** no

**Files:**
- Modify: `backend/app/api/routes/public.py`

- [ ] **Step 1: Update public incidents endpoint**

The `IncidentPublic` schema now has `updates: list[IncidentUpdatePublic] = []`. We need to populate it.

```python
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
```

Update imports at the top to include `IncidentPublic`:

```python
from app.models import HealthCheckPublic, IncidentPublic, IncidentsPublic, ServicesPublic
```

- [ ] **Step 2: Run linter**

Run: `cd backend && uv run ruff check app/api/routes/public.py --fix`

```
Phase 2 dependency graph:
  1.2 [BE] ──┬──→ 2.1 [BE] ──→ 2.3 [BE]
              └──→ 2.2 [BE]
```

---

## Phase 3: Backend — Tests

### Task 3.1: [BE] Update existing incident tests

**Depends on:** Task 2.1, Task 2.2
**Parallel:** yes — can run with Task 3.2

**Files:**
- Modify: `backend/tests/utils/incident.py`
- Modify: `backend/tests/api/routes/test_incidents.py`

- [ ] **Step 1: Update test helper**

```python
# backend/tests/utils/incident.py
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
```

- [ ] **Step 2: Update test_create_incident**

Add `description` to the request body and assert it in response:

```python
def test_create_incident(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    service = create_random_service(db)
    data = {
        "service_id": str(service.id),
        "title": "Database connection timeout",
        "description": "Primary DB experiencing intermittent timeouts",
    }
    response = client.post(
        f"{settings.API_V1_STR}/incidents/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["title"] == data["title"]
    assert content["description"] == data["description"]
    assert content["service_id"] == str(service.id)
    assert content["status"] == "investigating"
    assert "id" in content
```

- [ ] **Step 3: Add test for create incident without description (should fail)**

```python
def test_create_incident_no_description(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    service = create_random_service(db)
    data = {
        "service_id": str(service.id),
        "title": "Missing description incident",
    }
    response = client.post(
        f"{settings.API_V1_STR}/incidents/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 422  # validation error
```

- [ ] **Step 4: Update test_update_incident to use description**

```python
def test_update_incident(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    incident = create_random_incident(db)
    data = {"title": "Updated title", "description": "Updated description"}
    response = client.patch(
        f"{settings.API_V1_STR}/incidents/{incident.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["title"] == "Updated title"
    assert content["description"] == "Updated description"
```

- [ ] **Step 5: Run existing tests**

Run: `cd backend && pytest tests/api/routes/test_incidents.py -v`
Expected: all tests pass.

### Task 3.2: [BE] Add tests for incident update endpoints

**Depends on:** Task 2.1, Task 2.2
**Parallel:** yes — can run with Task 3.1

**Files:**
- Create: `backend/tests/api/routes/test_incident_updates.py`

- [ ] **Step 1: Write test file**

```python
# backend/tests/api/routes/test_incident_updates.py
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
```

- [ ] **Step 2: Run update tests**

Run: `cd backend && pytest tests/api/routes/test_incident_updates.py -v`
Expected: all 7 tests pass.

### Task 3.3: [BE] Run full backend test suite

**Depends on:** Task 3.1, Task 3.2
**Parallel:** no

- [ ] **Step 1: Run all backend tests**

Run: `cd backend && pytest -v`
Expected: all tests pass (existing + new).

- [ ] **Step 2: Run linter on all backend code**

Run: `cd backend && uv run ruff check app/ tests/ --fix`

- [ ] **Step 3: Commit backend changes via DevOps subagent**

Delegate to DevOps subagent (per project convention — all git operations via DevOps):

Commit message:
```
feat(backend): add incident description and update history

- Add description field to Incident model (required)
- Add IncidentUpdate model with status + message
- Auto-create first update on incident creation
- POST/GET /incidents/{id}/updates endpoints
- Status sync: updates auto-sync incident status
- Reopen logic: non-resolved update clears resolved_at
- Public endpoint includes updates per incident
- Full test coverage for new functionality
```

Files to stage: `backend/app/models.py`, `backend/app/crud.py`, `backend/app/api/routes/incidents.py`, `backend/app/api/routes/public.py`, `backend/app/alembic/versions/`, `backend/tests/`

```
Phase 3 dependency graph:
  2.1 [BE] ──┬──→ 3.1 [BE] ──┐
  2.2 [BE] ──┤                ├──→ 3.3 [BE]
              └──→ 3.2 [BE] ──┘
```

---

## Phase 4: Frontend — Types & AddIncident

### Task 4.1: [FE] Update TypeScript types

**Depends on:** none (can start early, uses expected API shape)
**Parallel:** yes — can run with Phase 1-3 BE tasks

**Files:**
- Modify: `frontend/src/types/status.ts`

- [ ] **Step 1: Add IncidentUpdatePublic type and update IncidentPublic**

```typescript
export interface IncidentUpdatePublic {
  id: string
  incident_id: string
  status: IncidentStatus
  message: string
  created_at: string
}

export interface IncidentPublic {
  id: string
  service_id: string
  title: string
  description: string
  status: IncidentStatus
  created_at: string
  resolved_at: string | null
  updates: IncidentUpdatePublic[]
}
```

- [ ] **Step 2: Run linter**

Run: `cd frontend && bun run lint`

### Task 4.2: [FE] Update AddIncident dialog with description field

**Depends on:** Task 4.1
**Parallel:** yes — can run with Task 4.3

**Files:**
- Modify: `frontend/src/components/Incidents/AddIncident.tsx`

- [ ] **Step 1: Update Zod schema**

Add `description` to formSchema:

```typescript
const formSchema = z.object({
  service_id: z.string().uuid({ message: "Select a service" }),
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  status: z.enum(["investigating", "identified", "monitoring", "resolved"]),
})
```

Update defaultValues:

```typescript
defaultValues: {
  service_id: "",
  title: "",
  description: "",
  status: "investigating",
},
```

- [ ] **Step 2: Add Textarea import**

Add at top (need to install shadcn Textarea first):

Run: `cd frontend && bunx shadcn@latest add textarea`

Then import:

```typescript
import { Textarea } from "@/components/ui/textarea"
```

- [ ] **Step 3: Add description FormField after title field**

Insert between the title FormField closing `/>` and the `</div>` closing the grid:

```tsx
<FormField
  control={form.control}
  name="description"
  render={({ field }) => (
    <FormItem>
      <FormLabel>
        Description <span className="text-destructive">*</span>
      </FormLabel>
      <FormControl>
        <Textarea
          placeholder="Describe the incident..."
          className="resize-none"
          rows={3}
          {...field}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

- [ ] **Step 4: Run linter**

Run: `cd frontend && bun run lint`

---

## Phase 5: Frontend — Admin Expandable Table

### Task 5.1: [FE] Create IncidentExpandRow component

**Depends on:** Task 4.1
**Parallel:** yes — can run with Task 4.2

**Files:**
- Create: `frontend/src/components/Incidents/IncidentExpandRow.tsx`

- [ ] **Step 1: Create the expand row component**

This component renders inside the expanded table row. Contains:
1. Description (read-only)
2. Updates timeline (vertical dots + status badge + timestamp + message)
3. Add Update form (text input + status select + button)

```tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import useCustomToast from "@/hooks/useCustomToast"
import api from "@/lib/api"
import type {
  IncidentPublic,
  IncidentStatus,
  IncidentUpdatePublic,
} from "@/types/status"
import { handleError } from "@/utils"

const STATUS_DOT: Record<IncidentStatus, string> = {
  investigating: "bg-red-500",
  identified: "bg-red-500",
  monitoring: "bg-amber-500",
  resolved: "bg-green-500",
}

const STATUS_BADGE: Record<IncidentStatus, string> = {
  investigating: "bg-red-100 text-red-800",
  identified: "bg-red-100 text-red-800",
  monitoring: "bg-amber-100 text-amber-800",
  resolved: "bg-green-100 text-green-800",
}

const STATUSES: IncidentStatus[] = [
  "investigating",
  "identified",
  "monitoring",
  "resolved",
]

function formatTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface IncidentExpandRowProps {
  incident: IncidentPublic
}

export default function IncidentExpandRow({
  incident,
}: IncidentExpandRowProps) {
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<IncidentStatus>(incident.status)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const { data: updatesData } = useQuery<{ data: IncidentUpdatePublic[]; count: number }>({
    queryKey: ["incidentUpdates", incident.id],
    queryFn: async () => {
      const res = await api.get(`/api/v1/incidents/${incident.id}/updates`)
      return res.data
    },
  })

  const mutation = useMutation({
    mutationFn: (data: { status: IncidentStatus; message: string }) =>
      api.post(`/api/v1/incidents/${incident.id}/updates`, data),
    onSuccess: () => {
      showSuccessToast("Update posted")
      setMessage("")
      queryClient.invalidateQueries({ queryKey: ["incidents"] })
      queryClient.invalidateQueries({
        queryKey: ["incidentUpdates", incident.id],
      })
    },
    onError: handleError.bind(showErrorToast),
  })

  const updates = updatesData?.data ?? []

  return (
    <div className="bg-muted/30 px-6 py-5 space-y-4">
      {/* Description */}
      <div>
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
          Description
        </div>
        <p className="text-sm leading-relaxed">{incident.description}</p>
      </div>

      {/* Timeline */}
      {updates.length > 0 && (
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Updates
          </div>
          <div className="space-y-0">
            {updates.map((update, idx) => (
              <div key={update.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`mt-1.5 h-2 w-2 rounded-full ${STATUS_DOT[update.status]}`}
                  />
                  {idx < updates.length - 1 && (
                    <div className="w-px flex-1 bg-border min-h-[20px]" />
                  )}
                </div>
                <div className="pb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${STATUS_BADGE[update.status]}`}
                    >
                      {update.status}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatTimestamp(update.created_at)}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{update.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Update form */}
      <div className="flex gap-2 items-end border-t pt-3">
        <Textarea
          placeholder="Add an update..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 resize-none"
          rows={2}
        />
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as IncidentStatus)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => mutation.mutate({ status, message })}
          disabled={!message.trim() || mutation.isPending}
          size="sm"
        >
          Post Update
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run linter**

Run: `cd frontend && bun run lint`

### Task 5.2: [FE] Replace DataTable with expandable incident list

**Depends on:** Task 5.1
**Parallel:** no

**Files:**
- Modify: `frontend/src/components/Incidents/columns.tsx`
- Modify: `frontend/src/routes/_layout/incidents.tsx`
- Delete: `frontend/src/components/Incidents/UpdateIncidentStatus.tsx`

- [ ] **Step 1: Update columns.tsx — remove UpdateIncidentStatus, add chevron**

Replace the entire file content:

```tsx
import type { ColumnDef } from "@tanstack/react-table"
import { ChevronDown, ChevronRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { IncidentPublic, IncidentStatus } from "@/types/status"

const STATUS_VARIANT: Record<
  IncidentStatus,
  "destructive" | "secondary" | "outline" | "default"
> = {
  investigating: "destructive",
  identified: "destructive",
  monitoring: "secondary",
  resolved: "outline",
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString()
}

export const columns: ColumnDef<IncidentPublic>[] = [
  {
    id: "expand",
    header: "",
    cell: ({ row }) => {
      const isExpanded = row.getIsExpanded()
      return (
        <button
          onClick={row.getToggleExpandedHandler()}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      )
    },
    size: 40,
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.title}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>
    },
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(row.original.created_at)}
      </span>
    ),
  },
]
```

- [ ] **Step 2: Update incidents.tsx — add row expansion support**

Replace the incidents page to use TanStack Table directly with expansion:

```tsx
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Fragment } from "react"
import { Search } from "lucide-react"
import AddIncident from "@/components/Incidents/AddIncident"
import IncidentExpandRow from "@/components/Incidents/IncidentExpandRow"
import { columns } from "@/components/Incidents/columns"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import api from "@/lib/api"
import type { IncidentsPublic } from "@/types/status"

export const Route = createFileRoute("/_layout/incidents")({
  component: Incidents,
  head: () => ({
    meta: [
      {
        title: "Incidents - StatusPulse",
      },
    ],
  }),
})

function Incidents() {
  const { data, isLoading } = useQuery<IncidentsPublic>({
    queryKey: ["incidents"],
    queryFn: async () => {
      const res = await api.get("/api/v1/incidents/")
      return res.data
    },
  })

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowCanExpand: () => true,
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Incidents</h1>
          <p className="text-muted-foreground">Manage and track incidents</p>
        </div>
        <AddIncident />
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : data?.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-12">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No incidents</h3>
          <p className="text-muted-foreground">
            All systems are running smoothly
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <Fragment key={row.id}>
                <TableRow
                  className="cursor-pointer"
                  onClick={row.getToggleExpandedHandler()}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
                {row.getIsExpanded() && (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="p-0">
                      <IncidentExpandRow incident={row.original} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Delete UpdateIncidentStatus.tsx**

Delete file: `frontend/src/components/Incidents/UpdateIncidentStatus.tsx`

- [ ] **Step 4: Run linter**

Run: `cd frontend && bun run lint`

```
Phase 4-5 dependency graph:
  4.1 [FE] ──┬──→ 4.2 [FE]
              └──→ 5.1 [FE] ──→ 5.2 [FE]
```

---

## Phase 6: Frontend — Public Page Accordion

### Task 6.1: [FE] Update IncidentList with accordion

**Depends on:** Task 4.1
**Parallel:** yes — can run with Phase 5

**Files:**
- Modify: `frontend/src/components/StatusPage/IncidentList.tsx`

- [ ] **Step 1: Add shadcn Collapsible component**

Run: `cd frontend && bunx shadcn@latest add collapsible`

- [ ] **Step 2: Rewrite IncidentList with accordion**

```tsx
import { ChevronDown } from "lucide-react"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type {
  IncidentPublic,
  IncidentStatus,
  IncidentUpdatePublic,
} from "@/types/status"

const STATUS_DOT: Record<IncidentStatus, string> = {
  investigating: "bg-red-500",
  identified: "bg-red-500",
  monitoring: "bg-amber-500",
  resolved: "bg-green-500",
}

const STATUS_LABEL: Record<IncidentStatus, string> = {
  investigating: "Investigating",
  identified: "Identified",
  monitoring: "Monitoring",
  resolved: "Resolved",
}

const STATUS_BADGE: Record<IncidentStatus, string> = {
  investigating: "bg-red-100 text-red-800",
  identified: "bg-red-100 text-red-800",
  monitoring: "bg-amber-100 text-amber-800",
  resolved: "bg-green-100 text-green-800",
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface IncidentListProps {
  incidents: IncidentPublic[]
}

export default function IncidentList({ incidents }: IncidentListProps) {
  if (incidents.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No active incidents
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Active Incidents</h2>
      {incidents.map((incident) => (
        <IncidentAccordion key={incident.id} incident={incident} />
      ))}
    </div>
  )
}

function IncidentAccordion({ incident }: { incident: IncidentPublic }) {
  const [isOpen, setIsOpen] = useState(false)
  const updates = incident.updates ?? []

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardContent className="py-4 cursor-pointer">
            <div className="flex items-start gap-3">
              <span
                className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT[incident.status]}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold">{incident.title}</span>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[incident.status]}`}
                  >
                    {STATUS_LABEL[incident.status]}
                  </span>
                </div>
                <p className="font-mono text-xs text-muted-foreground mt-1">
                  Started {timeAgo(incident.created_at)}
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground shrink-0 mt-1 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-6 pb-5 pt-0 border-t">
            {/* Description */}
            {incident.description && (
              <p className="text-sm text-muted-foreground leading-relaxed mt-4 mb-4">
                {incident.description}
              </p>
            )}
            {/* Timeline */}
            {updates.length > 0 && (
              <div className="space-y-0">
                {updates.map((update, idx) => (
                  <div key={update.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`mt-1.5 h-2.5 w-2.5 rounded-full ${STATUS_DOT[update.status]} ring-2 ring-background`}
                      />
                      {idx < updates.length - 1 && (
                        <div className="w-px flex-1 bg-border min-h-[20px]" />
                      )}
                    </div>
                    <div className="pb-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${STATUS_BADGE[update.status]}`}
                        >
                          {update.status}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {formatTimestamp(update.created_at)}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{update.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
```

- [ ] **Step 2: Run linter**

Run: `cd frontend && bun run lint`

---

## Phase 7: Frontend — Build & Commit

### Task 7.1: [FE] Build check and commit

**Depends on:** Task 4.2, Task 5.2, Task 6.1
**Parallel:** no

- [ ] **Step 1: Run TypeScript build check**

Run: `cd frontend && bun run build`
Expected: no type errors, build succeeds.

- [ ] **Step 2: Run linter**

Run: `cd frontend && bun run lint`

- [ ] **Step 3: Commit frontend changes via DevOps subagent**

Delegate to DevOps subagent (per project convention — all git operations via DevOps):

Commit message:
```
feat(frontend): add incident descriptions and update timeline

- Add description textarea to AddIncident dialog (required field)
- Replace DataTable with expandable table (row-expand pattern)
- IncidentExpandRow: description + timeline + inline add-update form
- Public IncidentList: compact accordion with Collapsible
- Remove UpdateIncidentStatus (replaced by update flow)
- Add shadcn Textarea and Collapsible components
```

Files to stage: `frontend/src/`

---

## Summary

| Phase | Tasks | Scope |
|-------|-------|-------|
| 1 | 1.1, 1.2 | BE: Model + Migration |
| 2 | 2.1, 2.2, 2.3 | BE: CRUD + Routes |
| 3 | 3.1, 3.2, 3.3 | BE: Tests |
| 4 | 4.1, 4.2 | FE: Types + AddIncident |
| 5 | 5.1, 5.2 | FE: Admin expandable table |
| 6 | 6.1 | FE: Public accordion |
| 7 | 7.1 | FE: Build + Commit |

**Total tasks:** 12
**Estimated parallel groups:** BE phases (1→2→3), FE phases (4→5→6→7), with FE types (4.1) startable in parallel with BE.

```
Full dependency graph:
  1.1 → 1.2 ──┬──→ 2.1 ──→ 2.3 ──┬──→ 3.1 ──┐
               └──→ 2.2 ──────────┘    3.2 ──┼──→ 3.3
                                              │
  4.1 ──┬──→ 4.2 ──────────────────────────────┼──→ 7.1
        ├──→ 5.1 ──→ 5.2 ─────────────────────┘
        └──→ 6.1 ──────────────────────────────┘
```
