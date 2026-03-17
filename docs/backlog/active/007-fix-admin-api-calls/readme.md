# 007 — Fix Admin API Calls (Bug)

## Problem

Admin pages (Dashboard, Services, Incidents) show empty data despite the database having records. The public status page works correctly.

## Root Cause (Investigation Needed)

Admin pages use raw `axios` calls that were recently refactored to use a shared `api` instance (`frontend/src/lib/api.ts`) with auth interceptor. The interceptor attaches `Bearer <token>` from localStorage. However data still doesn't appear in admin.

Possible issues to investigate:
1. **VITE_API_URL value** — check `frontend/.env` has correct value. If empty string, baseURL is empty and calls go to Vite proxy. If proxy works for public pages but not admin, might be a trailing slash or path issue.
2. **Auth token** — verify the token from localStorage is valid and being sent
3. **API response format** — admin pages expect `{ data: [...], count: N }` — verify backend returns this format for authenticated endpoints
4. **OpenAPI client conflict** — main.tsx sets `OpenAPI.BASE` and `OpenAPI.TOKEN` but admin pages now use raw axios. Check if there's a conflict or if some components still use the OpenAPI generated client

## Steps to Debug

1. Open browser DevTools → Network tab
2. Navigate to /dashboard, /services, /incidents
3. Check the actual HTTP requests:
   - What URL is being called?
   - Is Authorization header present?
   - What's the response status and body?
4. Compare with working public page requests

## Current State

- `frontend/src/lib/api.ts` — shared axios instance with baseURL + auth interceptor (NEW)
- All admin pages updated to use `import api from "@/lib/api"` instead of raw `axios`
- Public page (`routes/index.tsx`) also uses `api` — works correctly
- Backend API returns data correctly (verified via curl with auth token)
- Local dev server uses Vite proxy for `/api` → `localhost:8000`

## What Should Work After Fix

- `/dashboard` — 4 stat cards with real numbers, Recent Activity with incidents, Services Overview
- `/services` — table with 5 services (API Gateway, Auth Service, Web App, Database, CDN)
- `/incidents` — table with incidents (investigating, identified, resolved)
- All admin CRUD operations (add/edit/delete services and incidents)

## Dependencies
- 003-frontend-customization (done, archived)
