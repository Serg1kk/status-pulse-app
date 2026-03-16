# StatusPulse Design System

Design book для проекта StatusPulse. Единый источник правды по визуальному стилю.
Референс: Dreams Timer (Dribbble) - чистый, профессиональный admin dashboard.

**Стек:** React 19 + Tailwind CSS 4 + shadcn/ui + OKLCH color space

---

## 1. Design Philosophy

**Направление:** Clean & Solid - утилитарная элегантность мониторинговой системы.

Не flashy. Не playful. Это инструмент, которому доверяют в 3 ночи, когда прод упал.
Каждый элемент обоснован функцией. Визуальная тишина - чтобы статусы кричали.

**Принципы:**
- **Contrast-first** - тёмный sidebar vs светлый контент (как в референсе Dreams Timer)
- **Status is king** - цветовые индикаторы статусов - самые яркие элементы на странице
- **Breathing room** - щедрые отступы, воздух между карточками
- **Card-based** - каждый блок информации в своей карточке с мягкой тенью

---

## 2. Typography

### Font Stack

```css
/* Display / Headings */
--font-display: 'Plus Jakarta Sans', system-ui, sans-serif;

/* Body / UI */
--font-body: 'Plus Jakarta Sans', system-ui, sans-serif;

/* Monospace (для статусов, timestamps) */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

**Plus Jakarta Sans** - геометрический гротеск с характером. Чистый как Inter, но с собственным лицом. Отличная читаемость в UI, выразительные заголовки в bold.

### Type Scale

| Token | Size | Weight | Line Height | Использование |
|-------|------|--------|-------------|---------------|
| `display-lg` | 30px / 1.875rem | 700 | 1.2 | Hero заголовки (StatusPulse на главной) |
| `display-sm` | 24px / 1.5rem | 700 | 1.25 | Page titles (Dashboard, Services) |
| `heading` | 18px / 1.125rem | 600 | 1.33 | Card headers, section titles |
| `subheading` | 14px / 0.875rem | 500 | 1.4 | Card subtitles, labels |
| `body` | 14px / 0.875rem | 400 | 1.5 | Основной текст |
| `body-sm` | 13px / 0.8125rem | 400 | 1.5 | Secondary text, descriptions |
| `caption` | 12px / 0.75rem | 500 | 1.33 | Timestamps, badges, meta |
| `stat` | 32px / 2rem | 700 | 1 | Числа в stat-карточках |

### Правила

- **Заголовки:** `tracking-tight` (-0.025em) для сжатости
- **Цифры:** `font-mono` + `tabular-nums` для выравнивания
- **Иерархия через weight**, не через size — разница в 1 step max
- **Никогда** uppercase для nav/buttons (только badges/labels)

---

## 3. Color Palette

Палитра построена на OKLCH для perceptual uniformity. Нейтральная база + яркие семантические акценты.

### 3.1 Core Neutrals

```css
/* Sidebar (Dark) */
--sidebar-bg:         oklch(0.165 0.015 260);    /* #1a1d2e — deep navy */
--sidebar-bg-hover:   oklch(0.205 0.015 260);    /* hover state */
--sidebar-text:       oklch(0.75 0.01 260);      /* muted text */
--sidebar-text-active: oklch(0.95 0 0);          /* active nav item */
--sidebar-border:     oklch(0.25 0.015 260);     /* subtle dividers */

/* Content Area (Light) */
--content-bg:         oklch(0.975 0.005 260);    /* #f5f6fa — warm gray */
--surface:            oklch(1 0 0);              /* #ffffff — cards */
--surface-raised:     oklch(1 0 0);              /* elevated cards */

/* Text */
--text-primary:       oklch(0.175 0.01 260);     /* #1e2030 — headlines */
--text-secondary:     oklch(0.45 0.01 260);      /* descriptions */
--text-tertiary:      oklch(0.6 0.005 260);      /* timestamps, meta */
--text-on-dark:       oklch(0.95 0 0);           /* text on dark bg */

/* Borders */
--border-default:     oklch(0.91 0.005 260);     /* card borders */
--border-subtle:      oklch(0.94 0.003 260);     /* inner dividers */
```

### 3.2 Semantic Status Colors

Самые важные цвета в приложении. Должны быть мгновенно считываемы.

```css
/* Operational / Success */
--status-operational:     oklch(0.72 0.19 155);   /* #22c55e — яркий зелёный */
--status-operational-bg:  oklch(0.95 0.05 155);   /* фон badge/pill */
--status-operational-text: oklch(0.35 0.12 155);  /* текст на светлом фоне */

/* Degraded / Warning */
--status-degraded:        oklch(0.80 0.18 85);    /* #eab308 — amber */
--status-degraded-bg:     oklch(0.96 0.05 85);
--status-degraded-text:   oklch(0.45 0.12 85);

/* Down / Critical */
--status-down:            oklch(0.63 0.26 25);    /* #ef4444 — red */
--status-down-bg:         oklch(0.95 0.04 25);
--status-down-text:       oklch(0.45 0.18 25);

/* Maintenance / Info */
--status-maintenance:     oklch(0.62 0.19 260);   /* #6366f1 — indigo */
--status-maintenance-bg:  oklch(0.95 0.04 260);
--status-maintenance-text: oklch(0.42 0.14 260);

/* Unknown / Neutral */
--status-unknown:         oklch(0.55 0.01 260);   /* gray */
--status-unknown-bg:      oklch(0.95 0.005 260);
--status-unknown-text:    oklch(0.40 0.01 260);
```

### 3.3 Brand Accent

```css
/* Primary Brand — холодный индиго/синий (sidebar active, buttons, links) */
--brand-primary:          oklch(0.55 0.20 260);   /* #4f46e5 — indigo-600 */
--brand-primary-hover:    oklch(0.50 0.22 260);   /* darker on hover */
--brand-primary-light:    oklch(0.93 0.04 260);   /* pill/badge backgrounds */
--brand-primary-text:     oklch(0.98 0 0);        /* text on brand bg */
```

### 3.4 Dark Mode

```css
.dark {
  --content-bg:         oklch(0.145 0.01 260);
  --surface:            oklch(0.195 0.015 260);
  --surface-raised:     oklch(0.22 0.015 260);
  --text-primary:       oklch(0.93 0 0);
  --text-secondary:     oklch(0.65 0.01 260);
  --text-tertiary:      oklch(0.50 0.005 260);
  --border-default:     oklch(0.28 0.015 260);
  --border-subtle:      oklch(0.24 0.01 260);

  /* Sidebar stays dark — minimal change */
  --sidebar-bg:         oklch(0.12 0.015 260);
  --sidebar-border:     oklch(0.20 0.01 260);

  /* Status colors — slightly brighter for dark bg */
  --status-operational:     oklch(0.75 0.20 155);
  --status-degraded:        oklch(0.82 0.18 85);
  --status-down:            oklch(0.68 0.24 25);
  --status-maintenance:     oklch(0.68 0.19 260);
}
```

---

## 4. Spacing & Layout

### Grid

```
Sidebar width:        260px (expanded) / 48px (collapsed icon mode)
Content max-width:    1200px (centered with auto margins)
Content padding:      24px (mobile: 16px)
```

### Spacing Scale

Используем Tailwind 4 spacing: `4px` base unit.

| Token | Value | Использование |
|-------|-------|---------------|
| `gap-1` | 4px | Внутри badge, между icon + text |
| `gap-2` | 8px | Между элементами формы |
| `gap-3` | 12px | Между items в списке |
| `gap-4` | 16px | Padding карточек, gap между cards в grid |
| `gap-5` | 20px | Section padding |
| `gap-6` | 24px | Между секциями |
| `gap-8` | 32px | Между крупными блоками |
| `gap-12` | 48px | Page-level spacing |

### Content Area Background

Фон контентной области — **не чисто белый**, а тёплый серый (`--content-bg`). Карточки на нём белые (`--surface`), что создаёт глубину без тяжёлых теней.

---

## 5. Components

### 5.1 Cards

Основной строительный блок UI (как в Dreams Timer).

```css
.card {
  background: var(--surface);
  border: 1px solid var(--border-default);
  border-radius: 12px;                    /* rounded-xl */
  padding: 20px;                          /* p-5 */
  box-shadow: 0 1px 3px oklch(0 0 0 / 4%);  /* shadow-sm, subtle */
  transition: box-shadow 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 12px oklch(0 0 0 / 8%);  /* lift on hover */
}
```

**Варианты:**
- `stat-card` — число + label, compact (как в Dreams Timer "Working Hours 950h 45m")
- `list-card` — содержит таблицу или список
- `status-card` — индикатор статуса сервиса

### 5.2 Stat Cards (Dashboard)

```
┌─────────────────────────┐
│  ○ Total Services       │   ← subheading, muted color
│  12                     │   ← stat size, font-bold, text-primary
│  ▲ 2 from last week    │   ← caption, green/red indicator
└─────────────────────────┘
```

- Индикатор тренда: зелёный ▲ / красный ▼
- Цветной dot/accent слева или сверху для категоризации

### 5.3 Status Badge / Pill

```css
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 9999px;               /* fully rounded */
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.01em;
}

/* Dot indicator */
.status-pill::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

/* Operational */
.status-pill--operational {
  background: var(--status-operational-bg);
  color: var(--status-operational-text);
}
```

### 5.4 Sidebar Navigation

Стилистика из Dreams Timer — тёмный фон, светлые иконки, active state с accent bg.

```css
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-radius: 8px;
  color: var(--sidebar-text);
  font-size: 14px;
  font-weight: 400;
  transition: all 0.15s ease;
}

.nav-item:hover {
  background: var(--sidebar-bg-hover);
  color: var(--sidebar-text-active);
}

.nav-item--active {
  background: var(--brand-primary);
  color: var(--brand-primary-text);
  font-weight: 500;
}
```

**Иконки:** Lucide, 18px, `stroke-width: 1.75`

### 5.5 Buttons

```css
/* Primary */
.btn-primary {
  background: var(--brand-primary);
  color: var(--brand-primary-text);
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  transition: background 0.15s ease;
}

.btn-primary:hover {
  background: var(--brand-primary-hover);
}

/* Ghost (sidebar, secondary actions) */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  padding: 8px 12px;
  border-radius: 6px;
}

.btn-ghost:hover {
  background: oklch(0 0 0 / 5%);
}
```

### 5.6 Inputs

```css
.input {
  border: 1px solid var(--border-default);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  background: var(--surface);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.input:focus {
  border-color: var(--brand-primary);
  box-shadow: 0 0 0 3px var(--brand-primary-light);
  outline: none;
}
```

### 5.7 Tables

Чистые таблицы без тяжёлых borders (как в Dreams Timer "Top Members").

```css
.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  text-align: left;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-default);
}

.table td {
  padding: 14px 16px;
  font-size: 14px;
  border-bottom: 1px solid var(--border-subtle);
}

.table tr:hover {
  background: oklch(0 0 0 / 2%);
}
```

---

## 6. Shadows & Elevation

Минимальные тени — глубина через border + background contrast.

| Level | Shadow | Использование |
|-------|--------|---------------|
| 0 | none | Flat elements, inline |
| 1 | `0 1px 3px oklch(0 0 0 / 4%)` | Cards at rest |
| 2 | `0 4px 12px oklch(0 0 0 / 8%)` | Cards on hover, dropdowns |
| 3 | `0 8px 24px oklch(0 0 0 / 12%)` | Modals, popovers |

---

## 7. Border Radius

| Token | Value | Использование |
|-------|-------|---------------|
| `rounded-sm` | 4px | Badges внутри таблиц |
| `rounded-md` | 6px | Buttons, inputs |
| `rounded-lg` | 8px | Nav items, small cards |
| `rounded-xl` | 12px | Main cards |
| `rounded-2xl` | 16px | Modal dialogs |
| `rounded-full` | 9999px | Avatars, status pills |

---

## 8. Icons

- **Библиотека:** Lucide React (уже в проекте)
- **Size:** 18px default, 16px в compact/table, 20px в nav
- **Stroke:** 1.75 (чуть тоньше default 2 — элегантнее)
- **Color:** наследует `currentColor`

---

## 9. Motion & Transitions

Сдержанная анимация. Не decorative — functional.

```css
/* Base transition */
--transition-fast: 0.15s ease;
--transition-base: 0.2s ease;
--transition-slow: 0.3s ease-out;

/* Page transitions */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-enter {
  animation: fadeIn 0.2s ease-out;
}

/* Card stagger on dashboard load */
.stat-card {
  animation: fadeIn 0.3s ease-out both;
}
.stat-card:nth-child(1) { animation-delay: 0ms; }
.stat-card:nth-child(2) { animation-delay: 50ms; }
.stat-card:nth-child(3) { animation-delay: 100ms; }
.stat-card:nth-child(4) { animation-delay: 150ms; }
```

**Правила:**
- Hover transitions: `0.15s` — мгновенный фидбек
- Layout shifts: `0.2s` — sidebar collapse/expand
- Page entrance: `0.3s` с stagger — ощущение "проявления"
- **Никогда** bounce, elastic, spring — это не toy app

---

## 10. Page Layouts

### 10.1 Public Status Page (`/`)

```
┌──────────────────────────────────────────────┐
│          StatusPulse                         │
│          System Status                        │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  ✅ All Systems Operational            │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  Services                              │  │
│  │  ├─ API          ● Operational         │  │
│  │  ├─ Website      ● Operational         │  │
│  │  └─ Database     ● Operational         │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  Active Incidents                      │  │
│  │  (none)                                │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  Powered by StatusPulse · Admin Login        │
└──────────────────────────────────────────────┘
```

- Centered layout, `max-w-3xl`
- Фон: `--content-bg`
- Карточки: `--surface` с `shadow-sm`
- Footer: мелкий, с ссылкой на admin

### 10.2 Admin Dashboard (`/_layout/`)

```
┌──────┬───────────────────────────────────────┐
│      │  Dashboard                            │
│ SIDE │                                       │
│ BAR  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐│
│      │  │ Svcs │ │  Up  │ │ Down │ │ Inc. ││
│ dark │  │  12  │ │  10  │ │   2  │ │   1  ││
│  bg  │  └──────┘ └──────┘ └──────┘ └──────┘│
│      │                                       │
│ NAV  │  ┌────────────────────────────────────┤
│      │  │  Recent Activity / Charts          │
│      │  │                                    │
│      │  └────────────────────────────────────┤
└──────┴───────────────────────────────────────┘
```

- Sidebar: тёмный, 260px
- Content: `--content-bg` фон
- Stats: 4 колонки на `md+`
- Карточки белые на сером фоне

### 10.3 Login Page

```
┌──────────────────────────────────────────────┐
│                                              │
│              ◆ StatusPulse                   │
│                                              │
│           ┌──────────────────┐               │
│           │                  │               │
│           │   Log In         │               │
│           │                  │               │
│           │   [Email      ]  │               │
│           │   [Password   ]  │               │
│           │                  │               │
│           │   [  Log In   ]  │               │
│           │                  │               │
│           └──────────────────┘               │
│                                              │
│           ☀️ / 🌙 theme toggle               │
└──────────────────────────────────────────────┘
```

- Центрированная карточка
- Брендинг сверху (лого + название)
- Минимум элементов — только email + password
- Theme toggle внизу

---

## 11. Logo & Branding

### Текстовый логотип

Пока нет кастомного SVG — используем текстовый логотип:

```
◆ StatusPulse
```

- **Symbol:** `◆` (filled diamond) или кастомный SVG pulse-icon
- **Text:** "StatusPulse" — `font-display`, `font-bold`, `tracking-tight`
- **Colors:** brand-primary на light bg, white на dark sidebar

### Favicon

Символ `◆` или стилизованная пульс-линия в brand-primary цвете.

---

## 12. Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| `sm` | 640px | Stack cards vertically |
| `md` | 768px | 2-col stat cards |
| `lg` | 1024px | Sidebar visible, 4-col stats |
| `xl` | 1280px | Max content width |

**Mobile-first:**
- Sidebar collapsed by default on `< lg`
- Stat cards: 1 col → 2 col → 4 col
- Tables → card list on mobile

---

## 13. Mapping to Tailwind / shadcn

### CSS Variables → Tailwind Config

```css
/* index.css — заменить текущие oklch значения */

:root {
  --radius: 0.75rem;                         /* 12px — card radius */
  --background: oklch(0.975 0.005 260);      /* content-bg warm gray */
  --foreground: oklch(0.175 0.01 260);       /* text-primary */
  --card: oklch(1 0 0);                      /* white cards */
  --card-foreground: oklch(0.175 0.01 260);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.175 0.01 260);
  --primary: oklch(0.55 0.20 260);           /* brand indigo */
  --primary-foreground: oklch(0.98 0 0);
  --secondary: oklch(0.965 0.005 260);
  --secondary-foreground: oklch(0.25 0.01 260);
  --muted: oklch(0.955 0.005 260);
  --muted-foreground: oklch(0.45 0.01 260);
  --accent: oklch(0.955 0.005 260);
  --accent-foreground: oklch(0.25 0.01 260);
  --destructive: oklch(0.63 0.26 25);        /* status-down red */
  --border: oklch(0.91 0.005 260);
  --input: oklch(0.91 0.005 260);
  --ring: oklch(0.55 0.20 260);              /* = primary for focus rings */

  /* Charts — match status colors */
  --chart-1: oklch(0.72 0.19 155);           /* green / operational */
  --chart-2: oklch(0.55 0.20 260);           /* indigo / brand */
  --chart-3: oklch(0.63 0.26 25);            /* red / down */
  --chart-4: oklch(0.80 0.18 85);            /* amber / degraded */
  --chart-5: oklch(0.62 0.19 260);           /* purple / maintenance */

  /* Sidebar — dark navy */
  --sidebar: oklch(0.165 0.015 260);
  --sidebar-foreground: oklch(0.75 0.01 260);
  --sidebar-primary: oklch(0.55 0.20 260);
  --sidebar-primary-foreground: oklch(0.98 0 0);
  --sidebar-accent: oklch(0.205 0.015 260);
  --sidebar-accent-foreground: oklch(0.95 0 0);
  --sidebar-border: oklch(0.25 0.015 260);
  --sidebar-ring: oklch(0.55 0.20 260);
}

.dark {
  --background: oklch(0.12 0.01 260);
  --foreground: oklch(0.93 0 0);
  --card: oklch(0.195 0.015 260);
  --card-foreground: oklch(0.93 0 0);
  --popover: oklch(0.195 0.015 260);
  --popover-foreground: oklch(0.93 0 0);
  --primary: oklch(0.65 0.18 260);
  --primary-foreground: oklch(0.98 0 0);
  --secondary: oklch(0.25 0.015 260);
  --secondary-foreground: oklch(0.93 0 0);
  --muted: oklch(0.25 0.015 260);
  --muted-foreground: oklch(0.60 0.01 260);
  --accent: oklch(0.25 0.015 260);
  --accent-foreground: oklch(0.93 0 0);
  --destructive: oklch(0.68 0.24 25);
  --border: oklch(0.28 0.015 260);
  --input: oklch(0.28 0.015 260);
  --ring: oklch(0.65 0.18 260);

  --chart-1: oklch(0.75 0.20 155);
  --chart-2: oklch(0.65 0.18 260);
  --chart-3: oklch(0.68 0.24 25);
  --chart-4: oklch(0.82 0.18 85);
  --chart-5: oklch(0.68 0.19 260);

  --sidebar: oklch(0.12 0.015 260);
  --sidebar-foreground: oklch(0.75 0.01 260);
  --sidebar-primary: oklch(0.65 0.18 260);
  --sidebar-primary-foreground: oklch(0.98 0 0);
  --sidebar-accent: oklch(0.22 0.015 260);
  --sidebar-accent-foreground: oklch(0.95 0 0);
  --sidebar-border: oklch(0.20 0.01 260);
  --sidebar-ring: oklch(0.65 0.18 260);
}
```

### Google Fonts Import

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Tailwind Font Config

```css
/* В index.css или tailwind config */
--font-sans: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
```

---

## 14. Status Colors Quick Reference

Визуальная шпаргалка для разработки:

```
●  Operational   → green   oklch(0.72 0.19 155)   "Всё работает"
●  Degraded      → amber   oklch(0.80 0.18 85)    "Работает с проблемами"
●  Down          → red     oklch(0.63 0.26 25)    "Не работает"
●  Maintenance   → indigo  oklch(0.62 0.19 260)   "Плановые работы"
●  Unknown       → gray    oklch(0.55 0.01 260)   "Нет данных"
```

---

## 15. Do's & Don'ts

### DO:
- Использовать `--content-bg` (тёплый серый) как фон, карточки белые на нём
- Status colors — самые яркие элементы
- Тени минимальные, глубина через border + bg contrast
- Sidebar всегда тёмный (и в light, и в dark mode)
- `Plus Jakarta Sans` для всего текста
- `JetBrains Mono` для чисел, timestamps, статусов

### DON'T:
- Чисто белый фон (`#fff`) для content area — используй `--content-bg`
- Тяжёлые тени (Material Design `elevation-8`)
- Градиенты на карточках
- Разноцветные borders у карточек (только neutral)
- Uppercase nav items
- Более 1 accent цвета на экране одновременно
- FastAPI логотипы, mentions, branding

---

*Версия: 1.0 | Март 2026*
*Референс: Dreams Timer (Dribbble)*
*Стек: React 19 + Tailwind CSS 4 + shadcn/ui + OKLCH*
