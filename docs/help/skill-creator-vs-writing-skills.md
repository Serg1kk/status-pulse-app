# Skill Creator (Anthropic) vs Writing Skills (Superpowers) - Сравнение

Два скилла для создания скиллов Claude Code. Установлены на уровне юзера.

| | **Skill Creator** (Anthropic) | **Writing Skills** (Superpowers) |
|---|---|---|
| **Маркетплейс** | `anthropic-agent-skills` | `superpowers-marketplace` |
| **Плагин** | `document-skills` | `superpowers` v5.0.2 |
| **Автор** | Anthropic (официальный) | Jesse Vincent (obra) |
| **Философия** | Итеративный eval-loop с метриками | TDD для документации |
| **Фокус** | Качество output + description triggering | Дисциплина + устойчивость к рационализациям |
| **Целевая аудитория** | Широкая (от новичков до экспертов) | Разработчики, знакомые с TDD |

---

## Skill Creator (Anthropic)

### Pipeline

```
1. Capture Intent
   └── Что делает скилл? Когда триггерится? Формат output?

2. Interview & Research
   └── Edge cases, форматы, success criteria, MCP-ресёрч

3. Write SKILL.md (Draft)
   ├── name, description (pushy triggering)
   ├── Progressive disclosure: metadata → body → bundled resources
   └── Структура папки: SKILL.md + scripts/ + references/ + assets/

4. Test Cases
   ├── 2-3 реалистичных промпта
   ├── Сохраняются в evals/evals.json
   └── Параллельный запуск: with-skill + baseline (без скилла)

5. Evaluate
   ├── Quantitative: assertions (grading.json)
   ├── Qualitative: eval-viewer (HTML) для ревью человеком
   ├── Benchmark: pass_rate, timing, tokens (mean +/- stddev)
   └── Analyst pass: non-discriminating assertions, flaky evals, tradeoffs

6. Iterate
   ├── Rewrite на основе feedback.json от пользователя
   ├── Generalize (не overfitting на test cases)
   ├── Новая iteration-N+1/ с новыми baseline runs
   └── Repeat до "happy"

7. Description Optimization (отдельный pipeline)
   ├── 20 eval queries (should-trigger + should-not-trigger)
   ├── HTML reviewer для пользователя
   ├── Автоматический loop: run_loop.py (60/40 train/test split, 3 runs per query)
   └── best_description по test score (не train - защита от overfitting)

8. Package & Present
   └── package_skill.py -> .skill файл
```

### Ключевые артефакты

| Файл | Назначение |
|------|-----------|
| `evals/evals.json` | Тест-кейсы + assertions |
| `*-workspace/iteration-N/` | Результаты каждой итерации |
| `eval_metadata.json` | Метаданные eval (промпт, assertions) |
| `grading.json` | Оценка assertions (text, passed, evidence) |
| `timing.json` | total_tokens, duration_ms |
| `benchmark.json` | Агрегированные метрики |
| `feedback.json` | Отзывы пользователя из viewer |

### Субагенты (agents/)

| Агент | Роль |
|-------|------|
| `grader.md` | Оценка assertions по outputs |
| `comparator.md` | Blind A/B сравнение двух версий |
| `analyzer.md` | Анализ почему одна версия лучше другой |

### Скрипты (scripts/)

| Скрипт | Назначение |
|--------|-----------|
| `aggregate_benchmark.py` | Агрегация результатов в benchmark.json |
| `run_loop.py` | Description optimization loop |
| `run_eval.py` | Запуск eval queries |
| `improve_description.py` | Улучшение description через Claude |
| `package_skill.py` | Упаковка в .skill файл |
| `generate_report.py` | Генерация отчёта |
| `quick_validate.py` | Быстрая валидация скилла |

### Поддерживаемые среды

- Claude Code (полный pipeline)
- Claude.ai (без субагентов, без description optimization)
- Cowork (субагенты есть, browser нет - `--static` для viewer)

### Принципы написания

- Description должен быть "pushy" (скиллы undertrigger по умолчанию)
- Progressive disclosure: metadata (100 слов) → SKILL.md (<500 строк) → references (без лимита)
- Объяснять WHY вместо тяжёлых MUSTs
- Generalize из feedback, не overfitting на test cases
- Bundled scripts для повторяющихся паттернов в test runs

---

## Writing Skills (Superpowers)

### Pipeline

```
1. RED - Write Failing Test (Baseline)
   ├── Создать pressure scenarios (3+ комбинированных давлений)
   ├── Запустить субагента БЕЗ скилла
   ├── Документировать поведение verbatim
   └── Зафиксировать рационализации агента

2. GREEN - Write Minimal Skill
   ├── SKILL.md с YAML frontmatter (name + description)
   ├── Адресовать конкретные провалы из RED
   ├── Запустить те же сценарии СО скиллом
   └── Агент должен comply

3. REFACTOR - Close Loopholes
   ├── Найти новые рационализации
   ├── Добавить explicit counters
   ├── Построить rationalization table
   ├── Создать red flags list
   └── Re-test до bulletproof

4. Quality Checks
   ├── CSO (Claude Search Optimization)
   ├── Token efficiency
   ├── Cross-references
   └── Flowcharts только где non-obvious decisions

5. Deployment
   └── Commit + push (PR если broadly useful)
```

### Типы скиллов и их тестирование

| Тип | Примеры | Как тестировать |
|-----|---------|----------------|
| **Discipline** | TDD, verification | Pressure scenarios (time + sunk cost + exhaustion) |
| **Technique** | condition-based-waiting | Application + variation + missing info scenarios |
| **Pattern** | flatten-with-flags | Recognition + application + counter-examples |
| **Reference** | API docs | Retrieval + application + gap testing |

### CSO (Claude Search Optimization)

Аналог SEO для скиллов - как Claude находит нужный скилл:

1. **Description** - ТОЛЬКО triggering conditions, НИКОГДА workflow summary
   - Начинать с "Use when..."
   - Third person
   - Описывать проблему, не языковые симптомы
2. **Keywords** - error messages, symptoms, synonyms, tool names
3. **Naming** - verb-first, gerunds (`creating-skills`, не `skill-creation`)
4. **Token efficiency** - getting-started <150 слов, frequent <200, остальные <500

### Защита от рационализаций

Главная уникальная фича - bulletproofing скиллов:

- **Rationalization table** - все отговорки из baseline тестов с контр-аргументами
- **Red flags list** - self-check когда агент начинает рационализировать
- **Explicit loophole closing** - не просто правило, а запрет конкретных обходных путей
- **"Spirit vs Letter"** - "Violating the letter IS violating the spirit"

### Вспомогательные файлы

| Файл | Назначение |
|------|-----------|
| `anthropic-best-practices.md` | Официальные best practices Anthropic (45KB) |
| `testing-skills-with-subagents.md` | Методология тестирования с субагентами |
| `persuasion-principles.md` | Психология убеждения (Cialdini, 2021) для bulletproofing |
| `graphviz-conventions.dot` | Стиль для flowcharts |
| `render-graphs.js` | Рендер flowcharts в SVG |

---

## Прямое сравнение pipelines

| Этап | Skill Creator (Anthropic) | Writing Skills (Superpowers) |
|------|---------------------------|------------------------------|
| **Начало** | Interview + research | Pressure test БЕЗ скилла (baseline) |
| **Первый драфт** | Сразу пишем SKILL.md | Сначала смотрим как агент фейлится |
| **Тестирование** | Eval prompts + quantitative assertions | Pressure scenarios + rationalization capture |
| **Baseline** | with-skill vs without-skill (параллельно) | RED phase = baseline, GREEN = with skill |
| **Метрики** | pass_rate, tokens, timing, benchmark.json | Pass/fail по compliance, verbatim рационализации |
| **Ревью** | HTML eval-viewer + feedback.json | Анализ рационализаций, loophole closing |
| **Итерации** | iteration-1/, iteration-2/ с viewer | RED → GREEN → REFACTOR cycle |
| **Описание** | Отдельный optimization loop (run_loop.py) | CSO rules в документации |
| **Инструменты** | Python scripts, HTML viewer, subagents | Субагенты, render-graphs.js |
| **Финал** | .skill файл (package_skill.py) | Git commit + optional PR |

## Где они дополняют друг друга

| Сильная сторона | Skill Creator | Writing Skills |
|-----------------|---------------|----------------|
| Quantitative eval | benchmark.json, pass_rate, timing | - |
| Description optimization | Автоматический A/B loop | Ручные CSO rules |
| HTML review UI | eval-viewer с prev/next, feedback | - |
| Anti-rationalization | - | Rationalization tables, red flags, loophole closing |
| Pressure testing | - | 3+ combined pressures (time + sunk cost + authority) |
| Packaging | .skill файл | - |
| Token budgeting | Progressive disclosure (3 уровня) | Strict word limits по типу скилла |
| Psychology | - | Persuasion principles (Cialdini) для bulletproofing |
| Multi-environment | Claude Code + Claude.ai + Cowork | Claude Code only |

## Потенциальный объединённый pipeline (идея на будущее)

```
1. RED (from Writing Skills)
   Pressure test без скилла → capture baseline + рационализации

2. GREEN (from Writing Skills + Skill Creator)
   Написать SKILL.md по Anthropic structure (progressive disclosure)
   Адресовать конкретные провалы из RED

3. EVAL (from Skill Creator)
   Quantitative assertions + eval-viewer + benchmark

4. REFACTOR (from Writing Skills)
   Rationalization tables + loophole closing + red flags

5. OPTIMIZE (from Skill Creator)
   Description optimization loop (run_loop.py)
   CSO rules из Writing Skills для manual tuning

6. BULLETPROOF (from Writing Skills)
   Final pressure test с combined pressures
   Verify compliance under stress

7. PACKAGE (from Skill Creator)
   package_skill.py → .skill файл
```

---

*Создано: 2026-03-16*
*Версии: document-skills@b0cbd3df1533, superpowers@5.0.2*
