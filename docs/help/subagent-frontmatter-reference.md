# Subagent Frontmatter Reference

Справочник по созданию субагентов в Claude Code. Файл: `.claude/agents/<name>.md`

---

## Формат файла

```markdown
---
name: agent-name
description: Описание когда Claude должен делегировать задачу этому субагенту
model: sonnet
tools: Read, Write, Edit, Bash, Glob, Grep
---

# Системный промпт агента

Здесь markdown-текст с инструкциями для субагента.
Это становится его system prompt.
```

---

## Все поля frontmatter

| Поле | Обязательное | Тип | Описание |
|------|-------------|-----|----------|
| **name** | Да | string | Уникальный ID, lowercase + дефисы (напр. `code-reviewer`) |
| **description** | Да | string | Описание **когда** Claude должен делегировать задачу. Claude читает это чтобы решить, подходит ли агент |
| **model** | Нет | string | Модель: `sonnet`, `opus`, `haiku`, полный ID (`claude-opus-4-6`), или `inherit`. По умолчанию: `inherit` |
| **color** | Нет | string | Цвет агента в UI: `blue`, `red`, `green`, `yellow`, `purple`, `orange` или hex `#3B82F6`. Не задокументирован официально, но поддерживается ([issue #19292](https://github.com/anthropics/claude-code/issues/19292)) |
| **tools** | Нет | comma-separated | Разрешённые инструменты. Если не указано — наследует ВСЕ от родителя (включая MCP) |
| **disallowedTools** | Нет | comma-separated | Запрещённые инструменты (убирает из наследованных) |
| **maxTurns** | Нет | integer | Макс. количество шагов агента |
| **permissionMode** | Нет | string | `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, `plan` |
| **skills** | Нет | list | Скиллы для предзагрузки в контекст агента |
| **mcpServers** | Нет | list | MCP серверы доступные агенту (имена или inline-конфиг) |
| **hooks** | Нет | object | Lifecycle hooks: `PreToolUse`, `PostToolUse`, `Stop` |
| **memory** | Нет | string | Persistent memory: `user`, `project`, `local` |
| **background** | Нет | boolean | Всегда запускать в фоне. По умолчанию: `false` |
| **isolation** | Нет | string | `worktree` — запуск в изолированном git worktree |

---

## Расположение файлов (приоритет)

| Расположение | Область действия | Приоритет |
|-------------|-----------------|-----------|
| `--agents` CLI флаг | Текущая сессия | 1 (высший) |
| `.claude/agents/` | Текущий проект | 2 |
| `~/.claude/agents/` | Все проекты пользователя | 3 |
| Плагин `agents/` | Где плагин подключен | 4 (низший) |

---

## Доступные tools

### Основные
`Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep`, `WebFetch`, `WebSearch`

### Субагенты
`Agent(agent-type)` — разрешает вызывать конкретный тип субагента

### MCP-инструменты
Наследуются автоматически если `tools` не указан. Если указан — MCP НЕ наследуются, нужно добавить через `mcpServers`.

---

## Поле model — детали

| Значение | Описание |
|----------|----------|
| `inherit` | Наследует модель родителя (по умолчанию) |
| `sonnet` | Claude Sonnet 4.6 — быстрый, экономичный |
| `opus` | Claude Opus 4.6 — максимальное качество |
| `haiku` | Claude Haiku 4.5 — самый быстрый |
| `claude-opus-4-6` | Полный model ID (явное указание) |

**Рекомендации:**
- `sonnet` — для большинства задач (быстрее, дешевле)
- `opus` — для сложных архитектурных решений
- `haiku` — для простых поисковых/read-only задач

---

## Примеры

### Минимальный агент (read-only)

```markdown
---
name: researcher
description: Исследует кодовую базу и архитектуру без изменений
tools: Read, Glob, Grep
model: haiku
---

Ты исследователь кода. Анализируй паттерны и архитектуру, но не вноси изменения.
```

### Агент с MCP серверами

```markdown
---
name: deployer
description: Деплоит приложение на Vercel и Railway
tools: Read, Bash, Glob, Grep
mcpServers:
  - vercel
  - railway
---

Используй MCP серверы Vercel и Railway для деплоя.
При ограничениях MCP — fallback на CLI через Bash.
```

### Агент с hooks (валидация)

```markdown
---
name: db-reader
description: Выполняет read-only запросы к базе данных
tools: Bash
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-readonly-query.sh"
---

Выполняй SELECT запросы для анализа данных. Модификация данных запрещена.
```

### Агент с persistent memory

```markdown
---
name: code-reviewer
description: Ревью кода с накоплением знаний о паттернах проекта
tools: Read, Grep, Glob, Bash
memory: project
---

Ты код-ревьюер. Сохраняй в memory обнаруженные паттерны и конвенции проекта.
```

### Агент с изоляцией (worktree)

```markdown
---
name: experimental
description: Экспериментальные изменения в изолированном окружении
tools: Read, Write, Edit, Bash, Glob, Grep
isolation: worktree
---

Работай в изолированном git worktree. Изменения не затронут основную ветку.
```

---

## Добавление агента из X0 Framework

Источник: `https://github.com/Serg1kk/X0-Framework`

### Шаг 1: Скопировать и адаптировать промпт

```bash
# Исходник в X0:
# .x0/agents/prompts/core/<agent>.md

# Целевой файл в проекте:
# .claude/agents/<agent>.md

# ВАЖНО: Добавить правильный frontmatter!
# X0 промпт НЕ содержит frontmatter Claude Code.
# Нужно добавить name, description, model, tools.
```

### Шаг 2: Скопировать манифесты

```bash
# X0: .x0/agents/manifests/core/<agent>.md → docs/manifests/agents/<agent>.md
# X0: .x0/agents/manifests/core/<agent>.yaml → docs/manifests/agents/<agent>.yaml
```

### Шаг 3: Обновить CLAUDE.md

Добавить агента в таблицу "Активные субагенты" в секции `## Subagents`.

### Шаг 4: Записать в status-process.md

```
[YYYY-MM-DD] Agent added — <agent-name> из X0 Framework
```

### Доступные агенты X0 (core)

| Агент | Описание |
|-------|----------|
| developer | Основной разработчик |
| devops | Deployment, инфраструктура, CI/CD |
| qa-engineer | Quality Assurance |
| researcher | Исследование технологий |
| technical-architect | Архитектурные решения |
| implementation-plan-architect | Создание планов |
| implementation-plan-reviewer | Ревью планов |
| feature-documentation-writer | Документация фич |

---

---

## Недокументированные фичи (из community + GitHub issues)

### `color` — цвет агента в UI
Поддерживается, но не в официальной документации ([issue #19292](https://github.com/anthropics/claude-code/issues/19292)).
UI `/agents` предлагает "Choose a color for the subagent". Доступные значения: `blue`, `red`, `green`, `yellow`, `purple`, `orange` или hex (`#3B82F6`).

### `icon` — иконка агента
Запрошен в [issue #21501](https://github.com/anthropics/claude-code/issues/21501), статус: closed (duplicate). Возможно в будущих версиях.

### Default agent для основного чата
Можно установить агента по умолчанию для main conversation:
- В `settings.json`: поле `"agent"`
- Через CLI: флаг `--agent`
- Источник: Boris Cherny (Anthropic), Threads, 2026-02-11

### `cwd` / `additionalDirectories` — scoping директорий
Запрошен в [issue #31940](https://github.com/anthropics/claude-code/issues/31940), статус: open. Пока не поддерживается — субагенты наследуют cwd родителя.

---

**Создано:** 2026-03-16
**Обновлено:** 2026-03-16
**Источник:** Claude Code docs + X0 Framework + Exa search (GitHub issues, community)
