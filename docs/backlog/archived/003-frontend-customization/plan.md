# 003 — Frontend Customization: Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace FastAPI template branding with StatusPulse design system across all frontend pages.

**Architecture:** Pure frontend changes — CSS tokens, component rewrites, route cleanup. Backend untouched. All new dashboard data comes from existing API endpoints. shadcn/ui components inherit new tokens automatically.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Vite 7, Lucide React, TanStack Router, TanStack Query

**Design Spec:** `docs/backlog/active/003-frontend-customization/visual-design-spec.md`
**Design System:** `docs/design-system.md`

**Status:** ✅ APPROVED

---

## Phase 1: CSS Foundation + HTML Meta (Frontend)

### Task 1.1: Replace CSS Tokens in index.css

**Files:**
- Modify: `frontend/src/index.css`

**Context:** Current tokens use teal primary and light sidebar. Replace with indigo primary, warm gray background, dark navy sidebar. Copy COMPLETE `:root` and `.dark` blocks from `docs/design-system.md` section 13.

- [ ] **Step 1:** Read current `frontend/src/index.css` to understand structure
- [ ] **Step 2:** Replace the entire `:root` block with the one from `docs/design-system.md` section 13 (lines 579-616). Key changes: `--radius: 0.75rem`, `--background: oklch(0.975 0.005 260)`, `--primary: oklch(0.55 0.20 260)`, `--sidebar: oklch(0.165 0.015 260)`, all chart and sidebar tokens
- [ ] **Step 3:** Replace the entire `.dark` block with the one from `docs/design-system.md` section 13 (lines 618-652)
- [ ] **Step 4:** Add missing token `--destructive-foreground: oklch(0.98 0 0)` inside both `:root` and `.dark` blocks (needed by shadcn/ui destructive button variant)
- [ ] **Step 5:** Add font CSS variables inside `:root`:
  ```css
  --font-sans: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  ```
- [ ] **Step 6:** Run `cd frontend && bun run build` — verify no build errors
- [ ] **Step 7:** Commit: `feat(frontend): replace CSS tokens with StatusPulse design system`

**Acceptance Criteria:**
- [ ] `:root` block matches design-system.md section 13 exactly
- [ ] `.dark` block matches design-system.md section 13 exactly
- [ ] `--destructive-foreground` token present in both blocks
- [ ] Font variables defined
- [ ] `bun run build` passes

---

### Task 1.2: Update HTML Meta (title, fonts, favicon)

**Files:**
- Modify: `frontend/index.html`
- Create: `frontend/public/favicon.svg`

- [ ] **Step 1:** Read current `frontend/index.html`
- [ ] **Step 2:** Change `<title>` from "Full Stack FastAPI Project" to "StatusPulse"
- [ ] **Step 3:** Remove the vite.svg favicon line: `<link rel="icon" type="image/svg+xml" href="/vite.svg" />`
- [ ] **Step 4:** Replace favicon reference `<link rel="icon" type="image/x-icon" href="/assets/images/favicon.png" />` with `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`
- [ ] **Step 5:** Add Google Fonts preconnect + import BEFORE `</head>`:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  ```
- [ ] **Step 6:** Create `frontend/public/favicon.svg` — indigo diamond shape:
  ```svg
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect x="4" y="4" width="24" height="24" rx="4" transform="rotate(45 16 16)" fill="#4f46e5"/>
  </svg>
  ```
- [ ] **Step 7:** Run `cd frontend && bun run build` — verify no build errors
- [ ] **Step 8:** Commit: `feat(frontend): update HTML meta, fonts, and favicon for StatusPulse`

**Acceptance Criteria:**
- [ ] Page title is "StatusPulse"
- [ ] Google Fonts (Plus Jakarta Sans + JetBrains Mono) loading
- [ ] Favicon is indigo diamond SVG
- [ ] No references to vite.svg or FastAPI favicon
- [ ] `bun run build` passes

---

## Phase 2: Cleanup — Remove Dead Routes & Code (Frontend)

### Task 2.1: Delete Unused Route Files + FastAPI Assets

**Files:**
- Delete: `frontend/src/routes/signup.tsx`
- Delete: `frontend/src/routes/recover-password.tsx`
- Delete: `frontend/src/routes/reset-password.tsx`
- Delete: `frontend/public/assets/images/fastapi-icon.svg`
- Delete: `frontend/public/assets/images/fastapi-icon-light.svg`
- Delete: `frontend/public/assets/images/fastapi-logo.svg`
- Delete: `frontend/public/assets/images/fastapi-logo-light.svg`

- [ ] **Step 1:** Delete the 3 route files:
  ```bash
  rm frontend/src/routes/signup.tsx
  rm frontend/src/routes/recover-password.tsx
  rm frontend/src/routes/reset-password.tsx
  ```
- [ ] **Step 2:** Delete the 4 FastAPI SVG files + vite.svg:
  ```bash
  rm frontend/public/assets/images/fastapi-icon.svg
  rm frontend/public/assets/images/fastapi-icon-light.svg
  rm frontend/public/assets/images/fastapi-logo.svg
  rm frontend/public/assets/images/fastapi-logo-light.svg
  rm frontend/public/vite.svg
  ```
- [ ] **Step 3:** Run `cd frontend && bun run dev` briefly to trigger TanStack Router route tree regeneration, then stop the dev server
- [ ] **Step 4:** Verify `frontend/src/routeTree.gen.ts` no longer contains references to `signup`, `recover-password`, `reset-password`
- [ ] **Step 5:** Run `cd frontend && bun run build` — verify no build errors
- [ ] **Step 6:** Commit: `chore(frontend): remove signup, password recovery routes and FastAPI assets`

**Acceptance Criteria:**
- [ ] 3 route files deleted
- [ ] 4 FastAPI SVG files deleted
- [ ] `routeTree.gen.ts` regenerated without deleted routes
- [ ] `bun run build` passes

---

### Task 2.2: Remove signUpMutation + Login Page Links

**Files:**
- Modify: `frontend/src/hooks/useAuth.ts`
- Modify: `frontend/src/routes/login.tsx`

- [ ] **Step 1:** Read `frontend/src/hooks/useAuth.ts`
- [ ] **Step 2:** Remove `signUpMutation` and its related imports (e.g. `UsersService.registerUser` or `UsersRegisterData`). Keep `loginMutation`, `logout`, `user` query intact
- [ ] **Step 3:** Read `frontend/src/routes/login.tsx`
- [ ] **Step 4:** Remove "Sign up" link/text (link to `/signup`)
- [ ] **Step 5:** Remove "Forgot password?" link/text (link to `/recover-password`)
- [ ] **Step 6:** Run `cd frontend && bun run build` — verify no build errors
- [ ] **Step 7:** Run `cd frontend && bun run lint` — verify no lint errors
- [ ] **Step 8:** Commit: `chore(frontend): remove signUpMutation and auth page links`

**Acceptance Criteria:**
- [ ] `signUpMutation` removed from `useAuth.ts`
- [ ] No "Sign up" link in login page
- [ ] No "Forgot password" link in login page
- [ ] `bun run build` passes
- [ ] `bun run lint` passes

---

## Phase 3: Core Components Rewrite (Frontend)

### Task 3.1: Rewrite Logo Component

**Files:**
- Rewrite: `frontend/src/components/Common/Logo.tsx`

**Context:** Current Logo.tsx imports FastAPI SVGs. Rewrite as text-based component: diamond `◆` + "StatusPulse". Three variants: `full`, `icon`, `responsive`.

- [ ] **Step 1:** Read current `frontend/src/components/Common/Logo.tsx` to understand props interface and usage
- [ ] **Step 2:** Search codebase for all Logo imports to understand how it's used:
  ```
  Grep: import.*Logo
  ```
- [ ] **Step 3:** Rewrite Logo.tsx:
  - Remove all FastAPI SVG imports
  - Props: `variant?: 'full' | 'icon' | 'responsive'` (default: `full`)
  - `full`: `◆ StatusPulse` — diamond + text
  - `icon`: `◆` — diamond only
  - `responsive`: full on expanded sidebar, icon on collapsed (use `useSidebar()` hook if available, otherwise just `full`)
  - Styling: `font-bold tracking-tight`, white on dark sidebar (`text-sidebar-primary-foreground`), `text-foreground` on light backgrounds
  - Accept className prop for overrides
- [ ] **Step 4:** Run `cd frontend && bun run build` — verify no build errors
- [ ] **Step 5:** Commit: `feat(frontend): rewrite Logo as text-based StatusPulse component`

**Acceptance Criteria:**
- [ ] No FastAPI SVG imports
- [ ] Three variants work: full, icon, responsive
- [ ] Colors adapt to context (dark sidebar vs light background)
- [ ] `bun run build` passes

---

### Task 3.2: Rewrite AuthLayout Component

**Files:**
- Rewrite: `frontend/src/components/Common/AuthLayout.tsx`

**Context:** Current AuthLayout is split 2-column layout. Rewrite as centered card layout.

- [ ] **Step 1:** Read current `frontend/src/components/Common/AuthLayout.tsx` to understand props and children pattern
- [ ] **Step 2:** Rewrite AuthLayout.tsx:
  - Outer: `min-h-screen flex items-center justify-center bg-background`
  - Card: `max-w-sm w-full rounded-xl shadow-sm border p-8`
  - Card should have fadeIn animation (CSS class `animate-fade-in`)
  - Children rendered inside card
  - No sidebar, no split layout
- [ ] **Step 3:** Add `@keyframes fade-in` animation in `index.css` if not already present:
  ```css
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fade-in 0.2s ease-out;
  }
  ```
- [ ] **Step 4:** Run `cd frontend && bun run build` — verify no build errors
- [ ] **Step 5:** Commit: `feat(frontend): rewrite AuthLayout as centered card layout`

**Acceptance Criteria:**
- [ ] Centered card layout (no 2-column split)
- [ ] Card has fadeIn animation
- [ ] Children render inside card
- [ ] `bun run build` passes

---

### Task 3.3: Rewrite NotFound (404) Page

**Files:**
- Rewrite: `frontend/src/components/Common/NotFound.tsx`

**Context:** Already used by TanStack Router's `notFoundComponent` in `__root.tsx`. No new route file needed.

- [ ] **Step 1:** Read current `frontend/src/components/Common/NotFound.tsx`
- [ ] **Step 2:** Verify it's referenced in `frontend/src/routes/__root.tsx` as `notFoundComponent`
- [ ] **Step 3:** Rewrite NotFound.tsx:
  - Centered layout on `bg-background`, no sidebar
  - Giant "404" in `font-mono`, very low opacity (0.15) — background ghost text
  - Search-minus icon (from Lucide: `SearchX`) in indigo pill (48px, `rounded-xl`, `bg-primary/10 text-primary`)
  - Heading: "Page not found" — `text-lg font-semibold`
  - Body: "The page you're looking for doesn't exist or has been moved." — `text-sm text-muted-foreground`
  - Single button: "Go Home" — primary button with `ArrowLeft` icon, links to `/`
  - fadeIn animation on container
- [ ] **Step 4:** Run `cd frontend && bun run build` — verify no build errors
- [ ] **Step 5:** Commit: `feat(frontend): redesign 404 page in StatusPulse style`

**Acceptance Criteria:**
- [ ] Ghost "404" text visible
- [ ] SearchX icon in indigo pill
- [ ] Single "Go Home" button linking to `/`
- [ ] No sidebar shown on 404
- [ ] `bun run build` passes

---

## Phase 4: Login Page (Frontend)

### Task 4.1: Restyle Login Page

**Files:**
- Modify: `frontend/src/routes/login.tsx`

**Depends on:** Task 2.2 (links removed), Task 3.1 (Logo), Task 3.2 (AuthLayout)

- [ ] **Step 1:** Read current `frontend/src/routes/login.tsx`
- [ ] **Step 2:** Read `frontend/src/components/Common/Appearance.tsx` to verify theme toggle component exists and its import path (it exports both `SidebarAppearance` and `Appearance` variants)
- [ ] **Step 3:** Add Logo component at top of card content: `<Logo variant="full" />` centered, with subtitle "Log in to admin panel" in `text-sm text-muted-foreground`
- [ ] **Step 4:** Ensure form has only Email + Password fields (signup/forgot links already removed in Task 2.2)
- [ ] **Step 5:** Make "Log In" button full-width: `w-full`
- [ ] **Step 6:** Add theme toggle (Appearance component) below the card, small and subtle: `<Appearance />` wrapper div with `mt-4 flex justify-center`
- [ ] **Step 7:** Update page meta title to "Log In - StatusPulse" (via TanStack Router head)
- [ ] **Step 8:** Run `cd frontend && bun run build` — verify no build errors
- [ ] **Step 9:** Visually verify login page in browser (light + dark mode)
- [ ] **Step 10:** Commit: `feat(frontend): restyle login page with StatusPulse branding`

**Acceptance Criteria:**
- [ ] Logo `◆ StatusPulse` centered at top of card
- [ ] Subtitle "Log in to admin panel" visible
- [ ] Only email + password fields
- [ ] Full-width "Log In" button
- [ ] Theme toggle below card
- [ ] Login flow works end-to-end
- [ ] `bun run build` passes

---

## Phase 5: Public Status Page (Frontend)

### Task 5.1: Redesign OverallStatus Component

**Files:**
- Rewrite: `frontend/src/components/StatusPage/OverallStatus.tsx`

- [ ] **Step 1:** Read current `frontend/src/components/StatusPage/OverallStatus.tsx`
- [ ] **Step 2:** Rewrite with pulsating dot animation:
  - Pulsating dot: small circle with animated ring via CSS `@keyframes pulse`
  - Colored border matching status (green for operational, amber for degraded, red for down)
  - Background: status color at 8% opacity
  - Border-radius: 12px (`rounded-xl`)
  - Status text: bold, colored by status
- [ ] **Step 3:** Add pulse keyframes to `index.css` (if not already added):
  ```css
  @keyframes pulse-ring {
    0% { transform: scale(1); opacity: 1; }
    100% { transform: scale(2.5); opacity: 0; }
  }
  ```
- [ ] **Step 4:** Replace any hardcoded Tailwind colors (`bg-green-500`, `text-red-600`, etc.) with semantic CSS variable equivalents
- [ ] **Step 5:** Run `cd frontend && bun run build`
- [ ] **Step 6:** Commit: `feat(frontend): redesign OverallStatus with pulsating indicator`

**Acceptance Criteria:**
- [ ] Pulsating dot animation visible
- [ ] Border color changes by status
- [ ] Background uses status color at low opacity
- [ ] No hardcoded Tailwind colors
- [ ] `bun run build` passes

---

### Task 5.2: Restyle ServiceList + IncidentList

**Files:**
- Modify: `frontend/src/components/StatusPage/ServiceList.tsx`
- Modify: `frontend/src/components/StatusPage/IncidentList.tsx`

- [ ] **Step 1:** Read `frontend/src/components/StatusPage/ServiceList.tsx`
- [ ] **Step 2:** Update ServiceList styling:
  - Category header: uppercase, `tracking-wider`, `text-muted-foreground`, `text-xs font-medium`
  - Service rows: dot + name + UptimeGraph + status text (keep existing structure, update colors)
  - Replace hardcoded Tailwind status colors with semantic tokens
  - Status text colored by status
- [ ] **Step 3:** Run `cd frontend && bun run build` — verify ServiceList changes don't break build
- [ ] **Step 4:** Read `frontend/src/components/StatusPage/IncidentList.tsx`
- [ ] **Step 5:** Update IncidentList styling:
  - Timeline-style layout: status dot + bold title
  - Monospace timestamp: `font-mono text-xs text-muted-foreground`
  - Description text below title
  - Replace hardcoded Tailwind colors
- [ ] **Step 6:** Run `cd frontend && bun run build`
- [ ] **Step 7:** Commit: `feat(frontend): restyle ServiceList and IncidentList components`

**Acceptance Criteria:**
- [ ] Category headers styled (uppercase, tracking, muted)
- [ ] Incident timeline has monospace timestamps
- [ ] No hardcoded Tailwind status colors in either component
- [ ] `bun run build` passes

---

### Task 5.3: Redesign Public Status Page Layout

**Files:**
- Rewrite: `frontend/src/routes/index.tsx`

**Depends on:** Task 3.1 (Logo), Task 5.1 (OverallStatus), Task 5.2 (ServiceList, IncidentList)

- [ ] **Step 1:** Read current `frontend/src/routes/index.tsx`
- [ ] **Step 2:** Rewrite page layout:
  - Header: Logo `◆ StatusPulse` centered, `text-3xl font-bold tracking-tight`
  - Subtitle: "System Status" in `text-muted-foreground`
  - Components: OverallStatus, ServiceList, IncidentList (keep existing, already restyled)
  - Add stagger fade-in animation on cards (50ms delay between each)
  - Footer: "Powered by StatusPulse · Admin Login" — Admin Login links to `/login`, muted color, small text
- [ ] **Step 3:** Keep existing API calls and refetch interval (30s) — no changes to data fetching
- [ ] **Step 4:** Run `cd frontend && bun run build`
- [ ] **Step 5:** Visually verify public page in browser
- [ ] **Step 6:** Commit: `feat(frontend): redesign public status page layout`

**Acceptance Criteria:**
- [ ] Logo + subtitle centered at top
- [ ] Stagger fade-in animation on cards
- [ ] Footer with "Powered by StatusPulse" + Admin Login link
- [ ] Data fetching works (services + incidents visible)
- [ ] `bun run build` passes

---

## Phase 6: Dashboard (Frontend)

### Task 6.1: Redesign Stat Cards with Icon Pills

**Files:**
- Modify: `frontend/src/routes/_layout/index.tsx`

- [ ] **Step 1:** Read current `frontend/src/routes/_layout/index.tsx`
- [ ] **Step 2:** Update page header: "Dashboard" in `text-2xl font-bold tracking-tight`, subtitle "StatusPulse Admin" in `text-muted-foreground`
- [ ] **Step 3:** Redesign 4 stat cards with icon pills:
  - Total Services: gray icon bg, `Server` icon (from Lucide)
  - Operational: green icon bg, `Check` icon
  - Down: red icon bg, `X` icon
  - Active Incidents: amber icon bg, `AlertTriangle` icon
  - Each card: icon in colored pill (28px, `rounded-lg`, top-right), number in `font-mono text-3xl font-bold`, label in `text-xs font-medium text-muted-foreground`
- [ ] **Step 4:** Update grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3`
- [ ] **Step 5:** Add stagger fade-in animation (0ms, 50ms, 100ms, 150ms delay)
- [ ] **Step 6:** Replace hardcoded colors (`text-green-600`, `text-red-600`, etc.) with semantic tokens
- [ ] **Step 7:** Run `cd frontend && bun run build`
- [ ] **Step 8:** Commit: `feat(frontend): redesign dashboard stat cards with icon pills`

**Acceptance Criteria:**
- [ ] 4 stat cards with icon pills in correct colors
- [ ] Numbers in monospace font
- [ ] Stagger fade-in animation
- [ ] No hardcoded Tailwind colors
- [ ] `bun run build` passes

---

### Task 6.2: Add Recent Activity Block

**Files:**
- Modify: `frontend/src/routes/_layout/index.tsx`

- [ ] **Step 1:** Add a new card below stat cards: "Recent Activity" header
- [ ] **Step 2:** Data source: use existing `GET /api/v1/incidents/` query (already fetched for stat cards). Sort incidents by `updated_at` descending, take first 5
- [ ] **Step 3:** Render timeline feed:
  - Status dot (colored by incident status)
  - Event description: "Incident **{title}** created/updated/resolved" (derive action from status)
  - Relative timestamp in `font-mono text-xs text-muted-foreground`
- [ ] **Step 4:** Empty state: "No recent activity" in muted text
- [ ] **Step 5:** Run `cd frontend && bun run build`
- [ ] **Step 6:** Commit: `feat(frontend): add Recent Activity block to dashboard`

**Acceptance Criteria:**
- [ ] Shows last 5 incident events
- [ ] Timeline layout with status dots
- [ ] Monospace timestamps
- [ ] Empty state handled
- [ ] `bun run build` passes

---

### Task 6.3: Add Services Overview Block

**Files:**
- Modify: `frontend/src/routes/_layout/index.tsx`

- [ ] **Step 1:** Add second content card: "Services Overview" header
- [ ] **Step 2:** Data source: use existing services query (already fetched for stat cards)
- [ ] **Step 3:** Render compact list:
  - Dot (colored by status) + service name + status pill (badge)
  - Status pill: colored bg at 10%, colored text, `rounded-full`, `text-xs`
  - Show all services (or top 5 if many)
- [ ] **Step 4:** Layout both content blocks: `grid grid-cols-1 lg:grid-cols-2 gap-3` below stat cards
- [ ] **Step 5:** Run `cd frontend && bun run build`
- [ ] **Step 6:** Commit: `feat(frontend): add Services Overview block to dashboard`

**Acceptance Criteria:**
- [ ] Compact service list with status pills
- [ ] Status pills colored correctly per service status
- [ ] Two content blocks side by side on desktop
- [ ] `bun run build` passes

---

## Phase 7: Sidebar Restyle (Frontend)

### Task 7.1: Update Sidebar Styling

**Files:**
- Modify: `frontend/src/components/Sidebar/AppSidebar.tsx`

**Depends on:** Task 1.1 (CSS tokens), Task 3.1 (Logo)

**Context:** CSS tokens already changed in Phase 1 — sidebar tokens now point to dark navy. This task ensures the sidebar components work correctly with new tokens and adds any missing styling.

- [ ] **Step 1:** Read `frontend/src/components/Sidebar/AppSidebar.tsx` and related sidebar components (`Main.tsx`, `User.tsx`)
- [ ] **Step 2:** Verify Logo renders correctly in sidebar (white text on dark bg)
- [ ] **Step 3:** Check nav items: muted text default, brand indigo bg on active, lighter bg on hover — these should come from CSS tokens (`--sidebar-foreground`, `--sidebar-primary`, `--sidebar-accent`)
- [ ] **Step 4:** If any hardcoded colors exist in sidebar components, replace with semantic token classes
- [ ] **Step 5:** Verify user footer: avatar with initials, name + role text
- [ ] **Step 6:** Run `cd frontend && bun run build`
- [ ] **Step 7:** Visually verify sidebar in browser (light + dark mode) — sidebar should be dark navy in BOTH themes
- [ ] **Step 8:** Commit: `feat(frontend): verify and polish sidebar styling`

**Acceptance Criteria:**
- [ ] Dark navy sidebar in both light and dark mode
- [ ] Logo visible (white on dark bg)
- [ ] Active nav item has brand indigo bg
- [ ] No hardcoded colors in sidebar components
- [ ] `bun run build` passes

---

## Phase 8: Polish & Finalize (Frontend)

### Task 8.1: Animation Classes + Hardcoded Color Sweep

**Files:**
- Modify: `frontend/src/index.css` (add animation keyframes if not already added)
- Scan: all frontend components for hardcoded Tailwind colors

- [ ] **Step 1:** Ensure these animation keyframes exist in `index.css`:
  - `fade-in` (opacity 0→1, translateY 4px→0, 0.2s ease-out)
  - `pulse-ring` (scale 1→2.5, opacity 1→0) for status pulsating dot
  - Utility classes: `.animate-fade-in`, stagger delay utilities
- [ ] **Step 2:** Search entire frontend for hardcoded Tailwind status colors:
  ```
  Grep: (text|bg|border)-(green|red|yellow|amber|blue|indigo)-[0-9]
  ```
- [ ] **Step 3:** Replace any found hardcoded colors with semantic design system equivalents
- [ ] **Step 4:** Run `cd frontend && bun run build`
- [ ] **Step 5:** Run `cd frontend && bun run lint`
- [ ] **Step 6:** Commit: `feat(frontend): add animations and replace remaining hardcoded colors`

**Acceptance Criteria:**
- [ ] All animation keyframes present in index.css
- [ ] Zero hardcoded Tailwind status colors in components
- [ ] `bun run build` passes
- [ ] `bun run lint` passes

---

### Task 8.2: Update Design System Documentation

**Files:**
- Modify: `docs/design-system.md`

- [ ] **Step 1:** Update section 5.2 (Stat Cards) to reflect icon pill pattern instead of trend indicator:
  - Replace the trend indicator description with icon pill description
  - Document: icon in colored pill (28px, rounded-lg), positioned top-right of card
  - List the 4 card types with their colors and icons
- [ ] **Step 2:** Verify rest of design-system.md is consistent with implemented changes
- [ ] **Step 3:** Commit: `docs: update design-system.md with stat card icon pill pattern`

**Acceptance Criteria:**
- [ ] Section 5.2 documents icon pill pattern
- [ ] No inconsistencies between docs and implementation

---

### Task 8.3: Final Visual Verification

**Files:** None (manual verification)

- [ ] **Step 1:** Start dev server: `cd frontend && bun run dev`
- [ ] **Step 2:** Check Login page (light + dark): centered card, logo, no extra links
- [ ] **Step 3:** Log in and check Dashboard: 4 stat cards with icons, Recent Activity, Services Overview
- [ ] **Step 4:** Check Sidebar: dark navy in both themes, active nav item indigo
- [ ] **Step 5:** Check Public Status Page (`/`): logo, pulsating status, services, footer
- [ ] **Step 6:** Check 404 page: navigate to `/nonexistent`
- [ ] **Step 7:** Check Admin pages (services, incidents, settings, admin): verify tokens inherited correctly
- [ ] **Step 8:** Run `cd frontend && bun run build` — final production build check
- [ ] **Step 9:** If visual issues found — fix inline and commit: `fix(frontend): fix visual issues found during final verification`. If no issues — skip this step

**Acceptance Criteria:**
- [ ] All pages visually match design spec
- [ ] Light + dark mode both work
- [ ] No FastAPI mentions anywhere
- [ ] Login → Dashboard flow works
- [ ] Public page accessible without auth
- [ ] Production build passes

---

## Summary

| Phase | Tasks | Estimated Effort |
|-------|-------|-----------------|
| 1. CSS Foundation + HTML | 2 tasks | ~1h |
| 2. Cleanup | 2 tasks | ~30min |
| 3. Components | 3 tasks | ~2h |
| 4. Login | 1 task | ~30min |
| 5. Public Status | 3 tasks | ~2h |
| 6. Dashboard | 3 tasks | ~2h |
| 7. Sidebar | 1 task | ~30min |
| 8. Polish | 3 tasks | ~1h |
| **Total** | **18 tasks** | **~9.5h** |

All tasks are **Frontend only**. No backend changes required.
