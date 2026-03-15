# Status Process

Трекинг инфраструктурных изменений проекта: деплой, MCP серверы, скиллы, команды, агенты.

---

## MCP Servers

### Vercel MCP

- **Статус:** добавлен
- **Endpoint:** `https://mcp.vercel.com` (remote, OAuth)
- **Transport:** HTTP
- **Возможности:** поиск по документации Vercel, управление проектами и деплоями, анализ логов
- **Auth:** OAuth через браузер (при первом использовании `/mcp`)

### Railway MCP

- **Статус:** добавлен
- **Package:** `@railway/mcp-server` (npx)
- **Возможности:** управление проектами, сервисами, окружениями, переменными, доменами, логами
- **Auth:** Railway CLI должен быть установлен и авторизован
- **Примечание:** деструктивные операции намеренно исключены

---

## Changelog

| Дата | Действие | Описание |
|------|----------|----------|
| 2026-03-16 | MCP added | Vercel MCP — remote HTTP, OAuth (`https://mcp.vercel.com`) |
| 2026-03-16 | MCP added | Railway MCP — npx `@railway/mcp-server` |
| 2026-03-16 | CLAUDE.md | Добавлена секция Deployment + Tracking Changes |
| 2026-03-16 | status-process.md | Создан файл трекинга инфраструктурных изменений |
