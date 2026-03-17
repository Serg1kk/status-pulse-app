# 009 — Scheduled Maintenance

## Goal
Allow admins to schedule maintenance windows so users know about planned downtime in advance. Currently all status changes are reactive — no way to communicate upcoming work.

## Scope
- Maintenance window model (start, end, affected services, description)
- Auto-switch service status at window start/end
- Public status page: upcoming maintenance banner
- Calendar view of scheduled maintenance in admin
- Email notifications about upcoming maintenance (depends on 006)

## Dependencies
- 001-status-pulse-base (done)
- 006-notification-system (optional — for email alerts about upcoming maintenance)

## What exists now
- No maintenance concept in the system
- All status changes are manual or via health checker
- No way to schedule future status changes
