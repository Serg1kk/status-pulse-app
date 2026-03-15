# 002: Testing Setup — адаптация тестов и CI/CD

**Дата:** 2026-03-16
**Статус:** planned
**Приоритет:** high (нужно для демки)

---

## Цель

Адаптировать существующие тесты из FastAPI template (Items) под StatusPulse (Services/Incidents) и настроить CI/CD pipeline в GitHub Actions.

## Что есть сейчас

### Backend тесты (pytest)
- `tests/api/routes/test_items.py` — тесты для Items (НЕ РАБОТАЮТ, модель удалена)
- `tests/api/routes/test_login.py` — логин/токены (РАБОТАЮТ)
- `tests/api/routes/test_users.py` — CRUD пользователей (РАБОТАЮТ)
- `tests/api/routes/test_private.py` — приватные routes (РАБОТАЮТ)
- `tests/crud/test_user.py` — CRUD операции (РАБОТАЮТ)
- `tests/utils/item.py` — хелперы для Items (удалить/заменить)
- Требования: PostgreSQL (docker compose up -d db)

### Playwright E2E тесты
- `tests/login.spec.ts` — логин/логаут/protected routes (РАБОТАЮТ)
- `tests/items.spec.ts` — CRUD Items (НЕ РАБОТАЮТ, страница удалена)
- `tests/admin.spec.ts` — админ-панель (ПРОВЕРИТЬ)
- `tests/sign-up.spec.ts` — регистрация (РАБОТАЮТ)
- `tests/user-settings.spec.ts` — настройки юзера (РАБОТАЮТ)
- `tests/reset-password.spec.ts` — сброс пароля (РАБОТАЮТ)
- Требования: полный стек (frontend + backend + DB)

### GitHub Actions (все фейлят)
- `test-backend.yml` — pytest + coverage 90%
- `playwright.yml` — E2E тесты
- `smokeshow.yml` — coverage отчёт (зависит от test-backend)
- `test-docker-compose.yml` — проверка docker compose

## Что нужно сделать

### 1. Backend тесты

**Удалить:**
- `tests/api/routes/test_items.py`
- `tests/utils/item.py`

**Создать:**
- `tests/api/routes/test_services.py` — CRUD сервисов (create, read, update, delete)
- `tests/api/routes/test_incidents.py` — CRUD инцидентов
- `tests/api/routes/test_public.py` — публичные endpoints (/status/services, /status/incidents)
- `tests/utils/service.py` — хелперы (create_random_service)
- `tests/utils/incident.py` — хелперы (create_random_incident)

**Примерный набор тестов для Services:**
```python
# test_services.py
def test_create_service(client, superuser_token_headers)
def test_read_service(client, superuser_token_headers, db)
def test_read_services(client, superuser_token_headers, db)
def test_update_service(client, superuser_token_headers, db)
def test_delete_service(client, superuser_token_headers, db)
def test_create_service_unauthorized(client)
```

**Примерный набор для Public API:**
```python
# test_public.py
def test_get_public_services(client)  # no auth required
def test_get_public_incidents(client)
def test_get_service_health_checks(client, db)
```

### 2. Playwright E2E тесты

**Удалить:**
- `tests/items.spec.ts`

**Создать:**
- `tests/services.spec.ts` — CRUD сервисов в админке
- `tests/status-page.spec.ts` — публичная страница статуса (без логина)

**Адаптировать:**
- `tests/admin.spec.ts` — проверить что навигация работает (Services, Incidents вместо Items)

**Примерный набор для status-page:**
```typescript
test("Status page shows overall status", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByText("StatusPulse")).toBeVisible()
  await expect(page.getByText("System Status")).toBeVisible()
})

test("Status page shows services", async ({ page }) => {
  await page.goto("/")
  // after seed data
  await expect(page.getByText("operational")).toBeVisible()
})
```

### 3. GitHub Actions

**Починить `test-backend.yml`:**
- Уже работает (поднимает DB в Docker, запускает pytest)
- После адаптации тестов — должен проходить
- Возможно снизить coverage threshold с 90% до 70% на первое время

**Починить `playwright.yml`:**
- Нужен полный стек (frontend build + backend + DB)
- Проверить что docker compose работает в Actions

**Отключить лишнее (опционально):**
- `smokeshow.yml` — coverage отчёт (можно оставить)
- `test-docker-compose.yml` — проверка compose (можно оставить)

### 4. Локальный запуск тестов

**Backend:**
```bash
docker compose up -d db          # PostgreSQL
cd backend && uv sync            # зависимости
cd backend && pytest             # тесты
cd backend && pytest -x          # стоп на первой ошибке
```

**Playwright:**
```bash
docker compose watch             # полный стек
cd frontend && bunx playwright test        # headless
cd frontend && bunx playwright test --ui   # с UI (для демки!)
```

## Для демки

- **Playwright `--ui`** — показать как E2E тесты запускаются в реальном браузере
- **GitHub Actions** — показать что при push автоматически запускаются тесты
- **Локальный pytest** — показать как backend тесты работают

## Зависимости

- bun установлен локально (для Playwright)
- Docker для PostgreSQL
- GitHub Actions настроены в репо
