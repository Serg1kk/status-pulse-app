# 003 — Frontend Customization: Visual Design Spec

**Date:** 2026-03-16
**Author:** Designer agent (brainstorming session)
**Status:** Approved
**Approach:** Big bang — all changes in one pass

---

## Scope

Full visual overhaul: apply design system (`docs/design-system.md`) to all pages, remove FastAPI branding, add new dashboard content blocks, create custom 404 page.

## Decisions Log

| Area | Decision |
|------|----------|
| Login layout | Centered card (not split 2-column) |
| Public status page | Visual redesign (not just token swap) |
| Dashboard | Extended — stat cards + 2 content blocks |
| Sidebar | Restyle only (dark navy, no new elements) |
| 404 page | Custom page in StatusPulse style |
| Favicon/titles | StatusPulse branding |
| Implementation | Big bang — single pass |

---

## Section 1: CSS Foundation

Replace **both** `:root` and `.dark` blocks in `frontend/src/index.css` with the complete OKLCH token sets from `docs/design-system.md` section 13. Copy values exactly - both light and dark mode blocks in their entirety.

Key light mode changes:
- **Background:** `oklch(1 0 0)` → `oklch(0.975 0.005 260)` (warm gray)
- **Primary:** teal `oklch(0.5982 0.10687 182)` → indigo `oklch(0.55 0.20 260)`
- **Sidebar:** light `oklch(0.985 0 0)` → dark navy `oklch(0.165 0.015 260)`
- **Radius:** `0.625rem` → `0.75rem` (12px)
- **All sidebar tokens** updated for dark navy base

Key dark mode changes:
- **Background:** `oklch(0.145 0 0)` → `oklch(0.12 0.01 260)` (navy-tinted dark)
- **Primary:** brighter indigo `oklch(0.65 0.18 260)`
- **Sidebar:** even darker navy `oklch(0.12 0.015 260)`

Add missing token:
- **`--destructive-foreground`** — keep existing value or set `oklch(0.98 0 0)` (white text on destructive bg). Required by shadcn/ui destructive button variants.

Fonts in `frontend/index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

Font CSS variables:
```css
--font-sans: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
```

---

## Section 2: Cleanup

### Delete files
- `frontend/src/routes/signup.tsx`
- `frontend/src/routes/recover-password.tsx`
- `frontend/src/routes/reset-password.tsx`

### Modify files
- **`frontend/src/hooks/useAuth.ts`** — remove `signUpMutation`
- **`frontend/src/routes/login.tsx`** — remove "Sign up" link, remove "Forgot password" link
- **`frontend/index.html`** — title → "StatusPulse", remove FastAPI favicon references

### Logo.tsx rewrite
Replace `frontend/src/components/Common/Logo.tsx`:
- Remove all FastAPI SVG imports (`fastapi-icon.svg`, `fastapi-logo.svg`, etc.)
- Text-based component: diamond symbol `◆` + "StatusPulse"
- Variants: `full` (diamond + text), `icon` (diamond only), `responsive` (full on expanded, icon on collapsed)
- Colors via CSS variables: white on dark sidebar, `--foreground` on light backgrounds
- Font: `font-bold tracking-tight`

### Favicon
- Create SVG favicon: indigo diamond shape
- Path: `frontend/public/favicon.svg`
- Update `index.html` to reference new favicon

---

## Section 3: Login Page

### AuthLayout.tsx rewrite
- Remove split 2-column layout (`grid lg:grid-cols-2`)
- Centered layout: `min-h-screen flex items-center justify-center bg-background`
- Single card: `max-w-sm w-full rounded-xl shadow-sm border p-8`

### Login page content
- **Header in card:** Logo `◆ StatusPulse` centered, subtitle "Log in to admin panel" in muted
- **Form:** Email + Password fields only (no signup/forgot links)
- **Button:** "Log In" full-width, brand indigo
- **Footer:** Theme toggle (sun/moon) below card, small and subtle
- **Meta title:** "Log In - StatusPulse"
- **Animation:** Card fadeIn (opacity 0→1, translateY 4px→0, 0.2s ease-out)

---

## Section 4: Public Status Page

### Header
- Logo: `◆ StatusPulse` centered, `text-3xl font-bold tracking-tight`
- Subtitle: "System Status" in `text-muted-foreground`

### Overall Status Banner
- Pulsating dot with animated ring (CSS `@keyframes pulse`)
- Colored border matching status (green/amber/red)
- Background: status color at 8% opacity
- Border-radius: 12px

### Service List
- Cards grouped by category (existing behavior, keep)
- Category header: uppercase, letter-spacing, muted color
- Service rows: dot + name + uptime mini-bars + status text
- Uptime bars: visualization of recent health checks (existing `UptimeGraph` component)
- Status text colored by status

### Incidents
- Timeline-style layout
- Status dot + bold title
- Monospace timestamp (`font-mono`)
- Description text below

### Footer
- "Powered by StatusPulse · Admin Login"
- Admin Login links to `/login`
- Muted color, small text

### Animation
- Stagger fade-in on cards (50ms delay between each)

---

## Section 5: Dashboard

### Page Header
- "Dashboard" in `display-sm` (24px, bold, tracking-tight)
- "StatusPulse Admin" subtitle in muted

### Stat Cards (4)

> **Note:** Design system (section 5.2) shows stat cards with label + number + trend indicator. This spec extends that with icon pills for visual differentiation. The trend indicator is omitted because the API doesn't currently provide historical comparison data. Update `docs/design-system.md` section 5.2 during implementation to reflect the icon pill pattern.

| Card | Color | Icon |
|------|-------|------|
| Total Services | neutral (gray icon bg) | Server icon |
| Operational | green | Check icon |
| Down | red | X icon |
| Active Incidents | amber | AlertTriangle icon |

Each card:
- Icon in colored pill (28px, rounded-lg, top-right)
- Number in `font-mono text-3xl font-bold`, colored for status cards
- Label in `text-xs font-medium text-muted-foreground`
- Stagger fade-in animation (0ms, 50ms, 100ms, 150ms delay)

### Recent Activity Block (NEW)
- Card with "Recent Activity" header
- Timeline feed: status dot + event description + relative timestamp (mono)
- **Data source:** `GET /api/v1/incidents/` — fetch all incidents, sort by `updated_at` descending, take first 5. Each incident has `status`, `title`, `created_at`, `updated_at`. Display as events: "Incident **{title}** created/updated/resolved".
- **Scope limitation:** Only incident events (no service status change history — that API doesn't exist). If a future API provides service status change log, this block can be extended.
- Show last 5 events

### Services Overview Block (NEW)
- Card with "Services Overview" header
- Compact list: dot + service name + status pill (badge)
- Status pill: colored bg at 10%, colored text, `rounded-full`, `text-xs`
- Data source: existing services API
- Show all services (or top 5 if many)

### Layout
- Stat cards: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3`
- Content blocks: `grid grid-cols-1 lg:grid-cols-2 gap-3` below stats

---

## Section 6: Sidebar

### Visual Restyle
- Background: dark navy (`--sidebar` token) — always dark, both light and dark mode
- Logo: `◆ StatusPulse` in white (`--sidebar-primary-foreground`)
- Nav items: muted text (`--sidebar-foreground`), hover shows lighter bg
- Active nav item: brand indigo bg (`--sidebar-primary`), white text
- Border between sections: `--sidebar-border`

### Nav Items (unchanged)
1. Dashboard (Home icon)
2. Services (Server icon)
3. Incidents (AlertTriangle icon)
4. Admin (Users icon) — superuser only

### Icons
- Lucide React, 18px for nav (current is fine)
- `stroke-width: 1.75`

### User Footer
- User avatar with initials (rounded-full, dark bg)
- Name + role text
- Theme toggle (Appearance component)

---

## Section 7: 404 Page

### File to rewrite
`frontend/src/components/Common/NotFound.tsx` — already used by TanStack Router's `notFoundComponent` in `__root.tsx` (line 16). No new route file needed.

### Layout
- Centered on warm gray background, no sidebar
- Content centered vertically and horizontally

### Content
- Giant "404" in monospace, very low opacity (0.15) — ghosted
- Icon: search-minus in indigo pill (48px container, rounded-xl)
- Heading: "Page not found" — `text-lg font-semibold`
- Body: "The page you're looking for doesn't exist or has been moved." — `text-sm text-muted-foreground`
- Single button: "Go Home" — primary (brand indigo), with arrow-left icon, links to `/`
- fadeIn animation on load

---

## Files Changed Summary

### Delete
- `frontend/src/routes/signup.tsx`
- `frontend/src/routes/recover-password.tsx`
- `frontend/src/routes/reset-password.tsx`
- `frontend/public/assets/images/fastapi-icon.svg`
- `frontend/public/assets/images/fastapi-icon-light.svg`
- `frontend/public/assets/images/fastapi-logo.svg`
- `frontend/public/assets/images/fastapi-logo-light.svg`

### Create
- `frontend/public/favicon.svg` (indigo diamond)

### Major Rewrite
- `frontend/src/index.css` — all CSS tokens (both `:root` and `.dark`)
- `frontend/src/components/Common/Logo.tsx` — text-based logo
- `frontend/src/components/Common/AuthLayout.tsx` — centered layout
- `frontend/src/components/Common/NotFound.tsx` — 404 page redesign
- `frontend/src/routes/login.tsx` — remove links, add branding
- `frontend/src/routes/index.tsx` — public page redesign
- `frontend/src/routes/_layout/index.tsx` — dashboard with new blocks
- `frontend/src/components/StatusPage/OverallStatus.tsx` — pulsating banner

### Modify
- `frontend/index.html` — title, fonts, favicon
- `frontend/src/hooks/useAuth.ts` — remove signUpMutation
- `frontend/src/components/Sidebar/AppSidebar.tsx` — sidebar styling
- `frontend/src/components/StatusPage/ServiceList.tsx` — row styling
- `frontend/src/components/StatusPage/IncidentList.tsx` — timeline style

---

## Out of Scope (inherit tokens only)

These admin pages receive new styling automatically via CSS token changes but require **no specific layout or component changes**:

- `frontend/src/routes/_layout/services.tsx` — services CRUD
- `frontend/src/routes/_layout/incidents.tsx` — incidents CRUD
- `frontend/src/routes/_layout/settings.tsx` — user profile settings
- `frontend/src/routes/_layout/admin.tsx` — user management
- `frontend/src/components/Common/ActionsMenu.tsx` — reusable actions dropdown

These pages use shadcn/ui components which will pick up new tokens automatically. If any hardcoded Tailwind colors are found during implementation (e.g. `text-green-600` instead of semantic tokens), replace them with design system equivalents.

---

## Design System Compliance

All changes follow `docs/design-system.md`:
- OKLCH color space for all tokens
- Plus Jakarta Sans + JetBrains Mono typography
- Dark navy sidebar in both themes
- Warm gray content background
- Card-based layout with subtle shadows
- Status colors as brightest elements
- Motion: functional, max 300ms, stagger fade-in
- No FastAPI branding anywhere
- **Extension:** Stat cards use icon pills (not in current design system) — update design-system.md section 5.2 during implementation

---

*Mockups available in `.superpowers/brainstorm/` directory*
