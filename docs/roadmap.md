# StatusPulse Roadmap

**Обновлено:** 2026-03-17

---

## Stage 1: Base MVP (done)
- [x] Публичная страница статуса
- [x] Админ-панель (сервисы, инциденты)
- [x] Background health checker
- [x] Деплой на Vercel + Railway

→ Backlog: `docs/backlog/archived/001-status-pulse-base/`

## Stage 2: Testing & CI/CD (done)
- [x] Адаптировать backend тесты (Services/Incidents/Public)
- [x] Адаптировать Playwright E2E тесты
- [x] Починить GitHub Actions workflows
- [x] Настроить test → deploy pipeline

→ Backlog: `docs/backlog/archived/002-testing-setup/`

## Stage 3: Frontend Customization (done)
- [x] Адаптация UI под StatusPulse бренд
- [x] Публичная страница статуса (дизайн-система)
- [x] Тёмный сайдбар, OKLCH цвета, Plus Jakarta Sans

→ Backlog: `docs/backlog/archived/003-frontend-customization/`

## Stage 4: Admin Bugfixes (done)
- [x] Починить API-вызовы в админке (401/403 interceptor)
- [x] Shared API client с auth и Vite proxy
- [x] Login page formatting

→ Backlog: `docs/backlog/archived/007-fix-admin-api-calls/`

## Stage 5: Incident Details & History
- [ ] Description поле для инцидентов
- [ ] IncidentUpdate модель (лог изменений статуса с timestamp + message)
- [ ] API endpoints для добавления апдейтов к инцидентам
- [ ] Frontend: детальная страница инцидента с таймлайном
- [ ] Публичная страница: таймлайн апдейтов инцидента

→ Backlog: `docs/backlog/active/004-incident-descriptions/`

## Stage 6: Service Status History
- [ ] ServiceStatusChange модель (old_status → new_status, reason, timestamp)
- [ ] Автоматическая запись при изменении статуса health checker'ом
- [ ] API endpoint: GET /api/v1/services/{id}/status-history
- [ ] Dashboard: Recent Activity включает изменения статусов сервисов
- [ ] Публичная страница: история статусов per service

→ Backlog: `docs/backlog/active/005-service-status-history/`

## Stage 7: Notification System
- [ ] Email-уведомления при смене статуса сервиса (down/degraded)
- [ ] Email-уведомления при создании инцидента
- [ ] Настройки уведомлений per user (on/off, выбор сервисов)
- [ ] Интеграция с существующим SMTP конфигом
- [ ] Опционально: webhook / Telegram уведомления

→ Backlog: `docs/backlog/active/006-notification-system/`

## Stage 8: Uptime & SLA Metrics
- [ ] Расчёт uptime per service (30d / 90d / all-time)
- [ ] SLA targets с визуализацией (99.9%, 99.95%)
- [ ] Uptime badges (embeddable SVG/PNG)
- [ ] Публичная страница: uptime графики и проценты
- [ ] API endpoint: GET /api/v1/services/{id}/uptime

→ Backlog: `docs/backlog/active/008-uptime-sla-metrics/`

## Stage 9: Scheduled Maintenance
- [ ] Maintenance windows модель (start, end, services, description)
- [ ] Автоматическое переключение статуса при начале/окончании окна
- [ ] Публичная страница: upcoming maintenance banner
- [ ] Календарный вид запланированных работ
- [ ] Email-уведомления о предстоящих maintenance

→ Backlog: `docs/backlog/active/009-scheduled-maintenance/`

## Stage 10: Public API & Integrations
- [ ] Публичный API для чтения статусов (без auth)
- [ ] API keys для программного доступа
- [ ] Webhook subscriptions (status change → POST to URL)
- [ ] Slack integration (status updates в канал)
- [ ] Telegram bot для подписки на статусы

→ Backlog: `docs/backlog/active/010-public-api-integrations/`

## Stage 11: Multi-tenancy & Teams
- [ ] Organizations / Teams модель
- [ ] Роли: owner, admin, viewer
- [ ] Invite flow (email invite → join team)
- [ ] Отдельные status pages per organization
- [ ] Custom domain для status page

→ Backlog: `docs/backlog/active/011-multi-tenancy-teams/`
