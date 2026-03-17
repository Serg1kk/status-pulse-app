# 004 — Incident Descriptions & Updates: Design Spec

**Status:** APPROVED
**Date:** 2026-03-17

---

## Summary

Add description field and update history to incidents. Admin manages updates via inline row-expand in the incidents table. Public page shows incident details via compact accordion.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Update model scope | Status + manual notes | Standard for status pages, real value on public page |
| Admin UX | Row expand (panel below table row) | Compact, no navigation away from list |
| Public UX | Compact accordion (click to expand) | Clean, doesn't bloat page with multiple incidents |
| Description | Required on creation | Forces meaningful context from the start |
| Status on update | Required | Every update = explicit status, clear timeline progression |

---

## Data Model

### Incident (updated)

Add field:
- `description: str` — required, max 2000 chars

Existing fields unchanged: id, service_id, title, status, created_at, resolved_at.

### IncidentUpdate (new model)

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | UUID | PK, auto |
| `incident_id` | UUID | FK → Incident, CASCADE delete |
| `status` | IncidentStatus | required (investigating/identified/monitoring/resolved) |
| `message` | str | required, max 2000 chars |
| `created_at` | datetime | auto, UTC |

---

## API Endpoints

### Admin (auth required)

**Updated:**
- `POST /api/v1/incidents/` — add `description` to IncidentCreate (required)
- `PATCH /api/v1/incidents/{id}` — allow updating `description`
- Schema: IncidentPublic now includes `description` field

**New:**
- `POST /api/v1/incidents/{id}/updates` — create update (status + message required)
- `GET /api/v1/incidents/{id}/updates` — list updates for incident (sorted by created_at DESC)

### Public (no auth)

**Updated:**
- `GET /api/v1/status/incidents` — response includes `description` + `updates: list[IncidentUpdatePublic]` per incident

---

## Business Logic

### Status sync
- Creating an update auto-syncs Incident.status to the update's status
- If update.status = resolved → set Incident.resolved_at = now()
- If update.status != resolved on a resolved incident → clear Incident.resolved_at (reopen)

### Auto-first update
- When creating an incident, auto-create first IncidentUpdate with:
  - status = incident's initial status
  - message = incident's description
  - created_at = incident's created_at

### Update ordering
- Timeline sorted by created_at DESC (newest first)

### Migration
- Alembic: add `description` column to Incident (server_default="" for existing rows, then NOT NULL)
- Existing incidents get empty description, no auto-updates created

---

## Frontend — Admin

### Incidents Table (row expand)

Existing table gets expand/collapse behavior:
- Chevron icon on each row (right side)
- Click row → expand panel below with:
  1. **Description** — read-only text block
  2. **Updates timeline** — vertical timeline (colored dot → status badge → timestamp → message)
  3. **Add Update form** — inline: text input + status select + "Post Update" button

### AddIncident Dialog (updated)

Add textarea field:
- `description` — required, placeholder "Describe the incident..."
- Placed between title and status fields

### UpdateIncidentStatus (removed)

Current inline status dropdown on each row is removed. Status changes now happen exclusively through posting updates (enforces timeline history).

---

## Frontend — Public

### IncidentList (accordion)

Each active incident is a card-accordion:

**Collapsed state:**
- Status dot (colored by current status)
- Title (bold)
- Status badge (pill)
- "Started X ago" (relative time)
- Chevron (expand indicator)

**Expanded state (click to toggle):**
- Description text
- Vertical timeline:
  - Colored dot (matches status)
  - Status badge (uppercase, colored background)
  - Timestamp (mono font, absolute date+time)
  - Message text
- CSS transition for smooth expand/collapse

---

## Out of Scope

- Affected services list per incident (future: Stage 6+)
- Severity levels (critical/major/minor)
- Email notifications on updates (Stage 7)
- Incident categories/types
- File attachments
- Rich text / markdown in updates
