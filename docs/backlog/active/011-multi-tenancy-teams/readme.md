# 011 — Multi-tenancy & Teams

## Goal
Support multiple organizations with separate status pages and team-based access control. Currently the app is single-tenant — one set of services, one admin group.

## Scope
- Organization / Team model
- Roles: owner, admin, viewer
- Invite flow (email invite -> join team)
- Separate status pages per organization
- Custom domain support for status pages

## Dependencies
- 001-status-pulse-base (done)
- 006-notification-system (recommended — per-org notification settings)

## What exists now
- Single-tenant: one User model with is_superuser flag
- All services and incidents are global (no org scoping)
- One public status page at root URL
- No invite or team management
