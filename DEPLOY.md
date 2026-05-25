# VedaAI Deployment Guide

## Overview

This project has two parts that must be deployed **separately**:

| Service  | Platform | Why |
|----------|----------|-----|
| **Frontend** (Next.js 14) | **Vercel** | Optimized for Next.js SSR, edge network |
| **Backend** (Express + MongoDB + Redis + Puppeteer + WebSocket) | **Render / Railway / Fly.io** | Needs persistent server, background workers, file storage |

> ⚠️ **The backend CANNOT run on Vercel** because it uses: long-running workers (BullMQ), WebSockets, file uploads (Multer), Puppeteer (Chromium), and persistent MongoDB/Redis connections. Vercel is serverless and stateless — it will not work.

---

## 1. Frontend → Vercel

### The Problem You Saw

```
Error: No Next.js version detected. Make sure your package.json has "next" in either "dependencies" or "devDependencies".
```

Vercel looks for `package.json` at the **repo root**. Your Next.js app lives inside the `frontend/` folder, so Vercel can't find it.

### The Fix (1 minute)

1. Go to your project on [vercel.com](https://vercel.com)
2. Click **Settings** → **General**
3. Scroll to **Root Directory**
4. Enter: `frontend`
5. Click **Save**
6. Go to **Deployments** and click **Redeploy**

That's it. Vercel will now detect Next.js correctly and build from `frontend/package.json`.

### Environment Variables (Vercel)

Before redeploying, set these in **Vercel Dashboard → Your Project → Settings → Environment Variables**:

| Variable | Example Value | Where it comes from |
|----------|---------------|---------------------|
| `NEXT_PUBLIC_API_URL` | `https://vedaai-api.onrender.com/api` | Your backend URL (see step 2) |
| `NEXT_PUBLIC_WS_URL` | `wss://vedaai-api.onrender.com/ws` | Same as above, but `wss://` for WebSocket |

> `NEXT_PUBLIC_*` variables are **baked into the bundle at build time**. You must set them BEFORE deploying.

### Vercel Preview URLs

Vercel creates unique URLs for every Pull Request (Preview Deployments). Your backend CORS is now configured to accept **comma-separated** origins, so you can set:

```
FRONTEND_URL=https://vedaai.vercel.app,https://vedaai-git-main.vercel.app
```

---

## 2. Backend → Render (Recommended Free Option)

### Prerequisites

You need external databases. Do NOT try to run MongoDB/Redis inside the same container.

1. **MongoDB Atlas** (free tier available)
   - Create cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
   - Whitelist `0.0.0.0/0` (allow from anywhere) for Render
   - Copy the connection string

2. **Redis** (choose one)
   - **Upstash Redis** (free, serverless): [upstash.com](https://upstash.com) — recommended
   - Or **Redis Cloud** (free tier)
   - Copy the Redis URL (usually starts with `rediss://`)

### Deploy on Render

1. Push your code to GitHub (if not already)
2. Go to [dashboard.render.com](https://dashboard.render.com) → **New +** → **Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Name**: `vedaai-api` (or anything)
   - **Runtime**: `Docker`
   - **Root Directory**: `backend`
   - Render will auto-detect `backend/Dockerfile`
5. Click **Create Web Service**
6. While it's creating, go to **Environment** tab and add all variables from `backend/.env.example`:

| Variable | Value |
|----------|-------|
| `PORT` | `4000` (Render auto-sets this, but good to have) |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` (add previews with commas if needed) |
| `MONGODB_URI` | Your Atlas connection string |
| `MONGODB_DB_NAME` | `vedaai` |
| `REDIS_URL` | Your Upstash Redis URL |
| `GROQ_API_KEY` | Your Groq API key |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` |
| `SCHOOL_NAME` | `Your School Name` |

7. Save and wait for deploy. The Dockerfile installs Chromium for Puppeteer automatically.

### Health Check

Once deployed, visit:
```
https://vedaai-api.onrender.com/health
```

You should see: `{"status":"ok","timestamp":"..."}`

---

## 3. Connect Frontend ↔ Backend

After both are deployed:

1. Copy your **Render backend URL** (e.g., `https://vedaai-api.onrender.com`)
2. Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**
3. Update:
   - `NEXT_PUBLIC_API_URL` = `https://vedaai-api.onrender.com/api`
   - `NEXT_PUBLIC_WS_URL` = `wss://vedaai-api.onrender.com/ws`
4. Click **Save**
5. Go to **Deployments** → find the latest → click the **...** menu → **Redeploy**

Your frontend will rebuild with the new API URLs baked in.

---

## Quick Reference: File Changes Made

| File | Purpose |
|------|---------|
| `package.json` (root) | Monorepo scripts for local dev |
| `vercel.json` (root) | Security headers for Vercel deployment |
| `backend/Dockerfile` | Multi-stage Docker build (includes Chromium for Puppeteer) |
| `backend/.dockerignore` | Keeps Docker image small |
| `backend/src/index.ts` | CORS now accepts comma-separated origins |

---

## Troubleshooting

### "No Next.js version detected" still happens?

You forgot to set **Root Directory** to `frontend` in Vercel dashboard. See step 1 above.

### Backend build fails on Render?

- Make sure you selected **Docker** runtime, not Node
- Make sure **Root Directory** is set to `backend`
- Check Render logs for missing env vars

### Puppeteer / PDF generation fails?

The Dockerfile installs Chromium. If it still fails, check Render logs. You may need to set `PUPPETEER_ARGS=--no-sandbox` in environment variables.

### WebSocket not connecting?

- Make sure `NEXT_PUBLIC_WS_URL` uses `wss://` (secure WebSocket) for HTTPS backends
- Render free tier spins down after 15 min of inactivity. The first WS connection after spin-down will be slow (~30s wake-up).

### CORS errors in browser?

- Check that `FRONTEND_URL` in backend env exactly matches your Vercel URL (including `https://`)
- For preview deployments, add the preview URL to `FRONTEND_URL` comma-separated list

---

## Alternative Backend Platforms

Don't want Render? The Dockerfile works anywhere:

- **Railway**: Connect repo, it auto-detects Dockerfile
- **Fly.io**: `fly launch --dockerfile backend/Dockerfile`
- **DigitalOcean App Platform**: Use Docker deployment
- **AWS ECS / GCP Cloud Run**: Push Docker image to registry

---

## Local Development (still works!)

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

No changes needed for local development. The production setup is completely separate.
