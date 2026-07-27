# Deploy Survey-Admin on Vercel

**Git repo:** `Oluu-Workspace/Survey-Admin` (separate from backend and agent PWA).

## 1. New or fix Vercel project

1. [vercel.com/new](https://vercel.com/new) → Import **`Survey-Admin`**.
2. **Root Directory:** `.` (repository root).
3. **Framework Preset:** Vite (or leave auto; `vercel.json` sets this).
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`
6. **Node.js:** 20.x (`.nvmrc` in repo).

Do **not** use the backend URL as the Vercel project domain. Admin gets its own `*.vercel.app` or custom domain (e.g. `admin.project360.space`).

## 2. Environment variables

| Name | Value | Environments |
|------|--------|----------------|
| `VITE_API_BASE_URL` | `https://survey-backend.project360.space/api/v1` | Production, Preview |

Redeploy after saving env vars (Vite bakes `VITE_*` at **build** time).

## 3. Deploy

Push to `main` or click **Redeploy** on the latest Production deployment.

Open the URL from **Settings → Domains** (Production).  
`DEPLOYMENT_NOT_FOUND` usually means an old preview link or a failed/missing production deploy.

## 4. Verify

- Site loads `/` and `/login`.
- Browser Network tab: API calls go to `survey-backend.project360.space`.
