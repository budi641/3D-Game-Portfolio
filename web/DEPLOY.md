# Deploy to Cloudflare Pages

## Prerequisites

1. **Cloudflare account** – [Sign up](https://dash.cloudflare.com/sign-up) if needed
2. **Wrangler CLI** – Installed via `npm install` (in devDependencies)
3. **Cloudflare login** – Run once: `npx wrangler login`

## Quick Deploy

```bash
cd web
npm run deploy
```

This builds the app, optimizes any GLB models over 25 MiB (Cloudflare limit), and deploys to Cloudflare Pages.

## First-Time Setup

### 1. Log in to Cloudflare

```bash
cd web
npx wrangler login
```

A browser window opens to authenticate with Cloudflare.

### 2. Create the project (if needed)

The first deploy creates the project `ameen` on Cloudflare Pages. The site will be live at **https://ameen.pages.dev**.

### 3. Deploy

```bash
npm run deploy
```

## What Gets Deployed

- **Main app** – React 3D portfolio at `/`
- **Sanity Studio** – CMS at `/studio`
- **SPA routing** – `_redirects` sends all routes to `index.html`

## Environment Variables

Sanity `projectId` and `dataset` are set in code. To use env vars later:

1. In Cloudflare dashboard: **Pages** → **ameen** → **Settings** → **Environment variables**
2. Add `VITE_SANITY_PROJECT_ID` and `VITE_SANITY_DATASET` for production
3. Update `web/src/lib/sanity.ts` to use `import.meta.env.VITE_*`

## Git-Based Deploy (Alternative)

1. Push the repo to GitHub/GitLab
2. In Cloudflare: **Pages** → **Create project** → **Connect to Git**
3. Configure:
   - **Build command:** `cd web && npm run build`
   - **Build output directory:** `web/dist`
   - **Root directory:** `web` (if repo root is project root)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `wrangler: command not found` | Run `npx wrangler` instead of `wrangler` |
| Auth error | Run `npx wrangler login` again |
| 404 on refresh | Ensure `public/_redirects` exists with `/* /index.html 200` |
| Build fails | Run `npm run build` in `web` and fix any errors |
| "Files up to 25 MiB" | `npm run deploy` auto-optimizes oversized GLBs. If a model stays too large, run `npm run optimize-models` on `public/Models` and replace, then rebuild. |
