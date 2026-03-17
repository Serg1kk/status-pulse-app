# 008 — Uptime & SLA Metrics

## Goal
Calculate and display service uptime metrics and SLA compliance. Currently there's no way to see historical reliability — only the current status.

## Scope
- Calculate uptime per service (30d / 90d / all-time) based on status history
- SLA targets with visual indicators (99.9%, 99.95%, etc.)
- Uptime badges (embeddable SVG/PNG for external dashboards/READMEs)
- Public status page: uptime graphs and percentages per service
- API endpoint: GET /api/v1/services/{id}/uptime

## Dependencies
- 005-service-status-history (required — uptime calculation needs status change log)

## What exists now
- Service model with `current_status` field
- No historical data to calculate uptime from
- No SLA concept in the system
