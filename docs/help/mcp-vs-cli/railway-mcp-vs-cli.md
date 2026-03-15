# Railway MCP vs CLI — анализ и выбор

**Дата:** 2026-03-16
**Контекст:** Подключение Railway к проекту StatusPulse для деплоя бэкенда

---

## Как технически работает Railway MCP

```
Claude Code → MCP Protocol → @railway/mcp-server (npx) → railway CLI → Railway API
```

Railway MCP сервер (`@railway/mcp-server`) - это **обёртка над официальным Railway CLI**. Он буквально вызывает `railway` команды под капотом, парсит результат и возвращает в MCP-формате.

Именно поэтому CLI обязателен - без установленного и авторизованного `railway` CLI MCP сервер не работает (мы это проверили: `railway: command not found`).

### Цепочка зависимостей

1. **Railway CLI** (`npm i -g @railway/cli`) — обязателен, авторизация через `railway login`
2. **MCP сервер** (`npx @railway/mcp-server`) — обёртка над CLI, запускается через npx каждый раз
3. **Claude Code** — вызывает MCP tools через протокол

## Сравнение: MCP vs CLI напрямую

| | **MCP сервер** | **CLI напрямую (Bash)** |
|---|---|---|
| **Structured output** | JSON, типизированный | Текст, нужен парсинг |
| **Tool discovery** | Claude видит все доступные tools автоматически | Нужно знать/помнить команды |
| **Безопасность** | Деструктивные ops исключены намеренно | Полный доступ, можно удалить всё |
| **Гибкость** | Только то, что автор MCP разрешил | Любая команда CLI |
| **Зависимости** | npx + CLI | Только CLI |
| **Скорость** | Медленнее (npx bootstrap каждый раз) | Быстрее |
| **Дебаг** | Сложнее (слой абстракции) | Прозрачно |
| **Авторизация** | Через CLI | Через CLI (то же самое) |

## Доступные MCP tools (Railway)

При подключении Railway MCP, Claude Code получает эти инструменты:

- `check-railway-status` — проверка CLI и авторизации
- `list-projects` — список проектов
- `list-services` — список сервисов в проекте
- `list-deployments` — список деплоев
- `list-variables` — переменные окружения
- `set-variables` — установка переменных
- `create-project-and-link` — создание проекта
- `create-environment` — создание окружения
- `link-service` / `link-environment` — привязка
- `deploy` — деплой
- `deploy-template` — деплой из шаблона
- `generate-domain` — генерация домена
- `get-logs` — просмотр логов

**Намеренно исключены:** delete project, delete service, redeploy, restart — деструктивные операции.

## Сравнение с Vercel MCP

| | **Vercel MCP** | **Railway MCP** |
|---|---|---|
| **Архитектура** | Свой HTTP API endpoint (`mcp.vercel.com`) | Обёртка над CLI |
| **Авторизация** | OAuth через браузер (своя) | Через Railway CLI |
| **Уникальные фичи** | Docs search, toolbar threads, build logs | Нет уникальных — всё есть в CLI |
| **Добавленная ценность** | Высокая | Низкая |
| **Зависимость от CLI** | Нет | Да |

## Вывод

### Vercel MCP — оставить
Это полноценный API endpoint с уникальными возможностями: поиск по документации, доступ к toolbar threads, build logs. Не обёртка над CLI.

### Railway MCP — можно заменить на скилл/CLI
Обёртка над CLI без добавленной ценности. Альтернативы:
1. **Скилл с Railway CLI** — полный контроль, прозрачность, своя логика
2. **CLI напрямую** — быстрее, проще, больше возможностей
3. **Оставить MCP** — удобен для простых операций (structured output), но ограничен

### Решение для StatusPulse

Пока оставляем оба MCP. Если Railway MCP будет ограничивать при деплое - переключимся на CLI напрямую.

---

## Проверка подключения (2026-03-16)

### Vercel MCP — авторизован
- **Аккаунт:** serg1kk's projects (`team_WeuiEKKTLUT4NtrR0CdrsAgE`)
- **Проекты:** 9 штук (prodfeatai, ai-marketing, b2b-content, prodsignal, kknews2avatar, line-assist-landing, figma-mcp-guide, news-to-script, ai-product-manager)

### Railway MCP
- **CLI:** установлен (`npm i -g @railway/cli`)
- **Авторизация:** `railway login` через браузер — пройдена
- **Статус:** подключен, работает

---

## Практический пример: MCP fallback → CLI (2026-03-16)

Реальный кейс из этой сессии, демонстрирующий ограничения MCP и автоматический fallback на CLI.

### Задача
Создать тестовый проект на Railway, проверить подключение, затем удалить.

### Шаг 1: Создание через MCP — успех

```
Tool: mcp__railway__create-project-and-link
  projectName: "statuspulse-test"
  workspacePath: "/Users/serg1kk/.../status-pulse-app"

Result: ✅ Created project statuspulse-test on Sergey's Projects
  URL: https://railway.com/project/9c9a9e32-cc43-4fd5-bbaa-36ff4149f7fc
  Environment: production
  Linked to current directory
```

MCP справился — `create-project-and-link` есть в списке доступных tools.

### Шаг 2: Удаление через MCP — невозможно

В списке MCP tools **нет** `delete-project`, `delete-service` или аналогов. Деструктивные операции намеренно исключены автором MCP сервера.

Claude Code автоматически переключился на CLI:

```bash
railway delete --project 9c9a9e32-cc43-4fd5-bbaa-36ff4149f7fc -y

> Select the project to delete statuspulse-test (Sergey's Projects)
# Удалён
```

### Вывод (Пример 1)

Это наглядная демонстрация того, почему **MCP + CLI > только MCP**:
- MCP удобен для безопасных операций (create, list, deploy, logs)
- Когда MCP ограничивает — CLI покрывает 100% функционала
- Claude Code умеет автоматически выбирать правильный инструмент

---

## Практический пример 2: Баг с параметрами MCP (2026-03-16)

Кейс: MCP tool принимает массив, но формат передачи несовместим с Claude Code.

### Задача

Установить 13 переменных окружения для backend-сервиса на Railway.

### Попытка 1: MCP `set-variables` — объект

```
Tool: mcp__railway__set-variables
  variables: {"PROJECT_NAME": "StatusPulse", "SECRET_KEY": "...", ...}

Error: Expected array, received string
```

MCP ожидает массив, получил JSON-объект как строку.

### Попытка 2: MCP `set-variables` — массив строк

```
Tool: mcp__railway__set-variables
  variables: ["PROJECT_NAME=StatusPulse", "SECRET_KEY=...", ...]

Error: Expected array, received string
```

Тот же результат. Claude Code передаёт параметры как строки, а MCP tool ожидает нативный массив. Несовместимость на уровне сериализации параметров.

### Решение: CLI напрямую — успех

```bash
railway variables set \
  'PROJECT_NAME=StatusPulse' \
  'ENVIRONMENT=production' \
  'SECRET_KEY=...' \
  'POSTGRES_SERVER=${{Postgres.PGHOST}}' \
  'POSTGRES_PORT=${{Postgres.PGPORT}}' \
  ...
```

Все 13 переменных установлены одной командой. CLI также корректно обработал Railway reference-переменные (`${{Postgres.PGHOST}}` → `postgres.railway.internal`).

### Ещё один кейс: `deploy-template` — индекс шаблона

```
Tool: mcp__railway__deploy-template
  templateIndex: 1

Error: Expected number, received string
```

MCP tool ожидает число, но Claude Code передаёт строку `"1"`. Опять несовместимость типов.

Решение: `railway add -d postgres` через CLI.

### Вывод (Пример 2)

**Типичные ограничения Railway MCP:**
1. **Деструктивные операции** — намеренно исключены (delete, restart)
2. **Типизация параметров** — массивы и числа не всегда корректно передаются через MCP protocol
3. **Batch-операции** — установка нескольких переменных за раз проблематична

**Паттерн работы:** MCP для чтения (list, check status, get logs) → CLI для записи (set vars, deploy, delete)
