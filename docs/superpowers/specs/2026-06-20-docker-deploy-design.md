# Docker Deployment Design

**Date:** 2026-06-20
**Status:** Approved

## Overview

Dockerize the full stack (Django backend + Astro frontend + PostgreSQL) using two compose files:
- `docker-compose.yml` — dev setup (hot-reload, runserver, pnpm dev)
- `docker-compose.prod.yml` — prod standalone (gunicorn, pnpm build + preview, restart: always)

No nginx. Each service exposes its own port. The frontend uses `PUBLIC_API_URL` env var for API calls so the browser can reach the backend at its external address.

## Architecture

```
[host browser]
   ├── :4321  →  frontend container  (Astro dev/preview)
   └── :8000  →  backend container   (runserver / gunicorn)
                      ↓
                 db container :5432  (postgres:17)
```

All three services share an internal Docker network `app-net`. The `db` port is not exposed to the host.

## Services

### db
- Image: `postgres:17`
- Persistent volume: `postgres_data:/var/lib/postgresql/data`
- Reads env vars from the backend `.env` file (`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`)
- Healthcheck: `pg_isready` — backend waits for it before starting

### backend
- Build: `./backend/Dockerfile`, multi-stage (`dev` / `prod`)
- Port: `8000`
- Deps installed to `/opt/venv` so dev volume mount on `/app` doesn't shadow them
- Dev: mounts `./backend:/app`, CMD = `runserver 0.0.0.0:8000`
- Prod: code COPYed in, CMD = `gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2`
- Migrations run as part of the prod CMD: `migrate && gunicorn ...`

### frontend
- Build: `./frontend/Dockerfile`, multi-stage (`dev` / `prod`)
- Port: `4321`
- Dev: mounts `./frontend:/app` + anonymous volume for `node_modules`, CMD = `pnpm dev --host 0.0.0.0`
- Prod: code COPYed in, CMD = `pnpm build && pnpm preview --host 0.0.0.0 --port 4321`
- `PUBLIC_API_URL` is available at CMD runtime so Astro bakes it into the static bundle during `pnpm build`

## Environment Variables

### backend/.env (dev, already exists — needs additions)
```
DJANGO_ENVIRONMENT=development
SECRET_KEY=<generated>
DEBUG=True
HOST_URL=localhost:8000
HOST_PROTOCOL=http

DB_NAME=modelosaeat_dev
DB_USER=modelosaeat_user
DB_PASSWORD=modelosaeat_pass
DB_HOST=db
DB_PORT=5432

POSTGRES_DB=modelosaeat_dev
POSTGRES_USER=modelosaeat_user
POSTGRES_PASSWORD=modelosaeat_pass
```

### backend/.env.prod (new, gitignored)
```
DJANGO_ENVIRONMENT=production
SECRET_KEY=<strong-random-key>
DEBUG=False
ALLOWED_HOSTS=<host1>,<host2>
CORS_ALLOWED_ORIGINS=http://<server>:4321

DB_NAME=modelosaeat_prod
DB_USER=modelosaeat_user
DB_PASSWORD=<strong-password>
DB_HOST=db
DB_PORT=5432

POSTGRES_DB=modelosaeat_prod
POSTGRES_USER=modelosaeat_user
POSTGRES_PASSWORD=<strong-password>
```

### frontend/.env (new)
```
PUBLIC_API_URL=http://localhost:8000
```

### frontend/.env.prod (new, gitignored)
```
PUBLIC_API_URL=http://<server>:8000
```

## Compose Files

### docker-compose.yml (dev)
- Each service uses `build: { target: dev }`
- Backend and frontend each get their `.env` via `env_file`
- `db` uses `env_file: backend/.env`
- Backend depends on `db` (healthcheck condition)

### docker-compose.prod.yml (prod, standalone — not an override)
- Each service uses `build: { target: prod }`
- Uses `.env.prod` files
- All services have `restart: always`
- No volume mounts for code

## Frontend API URL Change

`login.astro` and `register.astro` currently use relative paths:
```js
fetch("/v1/auth/login/", ...)
```

Changed to:
```js
const API = import.meta.env.PUBLIC_API_URL;
fetch(`${API}/v1/auth/login/`, ...)
```

`import.meta.env.PUBLIC_API_URL` is the Astro/Vite mechanism for client-side env vars. Astro inlines `PUBLIC_*` vars at build time.

## Gitignore Changes

- `backend/.gitignore`: add `.env.prod`
- `frontend/.gitignore`: add `.env.prod` (already has `.env` and `.env.production`)

## Files Created / Modified

| File | Action |
|---|---|
| `backend/Dockerfile` | Create (multi-stage dev/prod) |
| `frontend/Dockerfile` | Create (multi-stage dev/prod) |
| `docker-compose.yml` | Create (dev) |
| `docker-compose.prod.yml` | Create (prod standalone) |
| `backend/.env` | Modify (add POSTGRES_* and DB_HOST=db) |
| `backend/.env.example` | Modify (add POSTGRES_* and DB_HOST=db) |
| `backend/.env.prod` | Create (template, gitignored) |
| `frontend/.env` | Create |
| `frontend/.env.prod` | Create (template, gitignored) |
| `frontend/src/pages/login.astro` | Modify (PUBLIC_API_URL) |
| `frontend/src/pages/register.astro` | Modify (PUBLIC_API_URL) |
| `backend/.gitignore` | Modify (add .env.prod) |
| `frontend/.gitignore` | Modify (add .env.prod) |

## Usage

```bash
# Dev
docker compose up --build

# Prod
docker compose -f docker-compose.prod.yml up --build -d
```
