# 004 — Incident Descriptions & Updates

## Goal
Add description field and update history to incidents. Currently incidents only have title + status — no way to describe what happened or track status changes over time.

## Scope
- Add `description` text field to Incident model
- Add IncidentUpdate model (status change log with timestamp + message)
- API endpoints for adding updates to incidents
- Frontend: show description and update timeline on incident detail
- Public status page: show incident updates in timeline

## Dependencies
- 001-status-pulse-base (done)
- 003-frontend-customization (done)

## What exists now
- Incident model: id, service_id, title, status, created_at, resolved_at
- CRUD: create, list, update status
- No description field, no update history
