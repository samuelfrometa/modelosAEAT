# Docker Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dockerize the Django backend, Astro frontend, and PostgreSQL database into a two-compose-file setup (dev + prod).

**Architecture:** Multi-stage Dockerfiles for backend and frontend (dev/prod targets). `docker-compose.yml` covers dev with hot-reload volumes; `docker-compose.prod.yml` is a standalone prod file with gunicorn and `pnpm build && pnpm preview`. No nginx — services expose their own ports.

**Tech Stack:** Docker Compose v2, Python 3.14 + uv, Node 22 + pnpm, postgres:17, Django 6, Astro 6

## Global Constraints

- All commands run from the **repo root** unless noted otherwise
- `docker compose` (v2 plugin syntax, not `docker-compose`)
- Backend deps go to `/opt/venv` (NOT `/app/.venv`) so dev volume mounts don't shadow them
- `PUBLIC_API_URL` is the only client-side env var added to the frontend — Astro inlines `PUBLIC_*` vars at build time
- `POSTGRES_*` vars and `DB_*` vars must match values (postgres container reads one set, Django reads the other)
- `.env.prod` files are gitignored and never committed

---

### Task 1: Env files and gitignores

**Files:**
- Modify: `backend/.gitignore`
- Modify: `frontend/.gitignore`
- Modify: `backend/.env` (add Docker vars)
- Modify: `backend/.env.example`
- Create: `backend/.env.prod`
- Create: `frontend/.env`
- Create: `frontend/.env.prod`

**Interfaces:**
- Produces: all env vars consumed by Tasks 3–6

- [ ] **Step 1: Add `.env.prod` to backend gitignore**

In `backend/.gitignore`, find the section "Environment — never commit secrets" and add `.env.prod` after `.env.local`:

```
# Environment — never commit secrets
.env
.env.local
.env.*.local
.env.prod
```

- [ ] **Step 2: Add `.env.prod` to frontend gitignore**

In `frontend/.gitignore`, find the env section and add `.env.prod`:

```
# environment variables — never commit secrets
.env
.env.local
.env.*.local
.env.production
.env.prod
```

- [ ] **Step 3: Update `backend/.env` for Docker**

The file already exists with real values. Make these exact changes:
1. Change `DB_HOST=localhost` → `DB_HOST=db`
2. Add three `POSTGRES_*` lines at the end (values must match `DB_*`):

```
DJANGO_ENVIRONMENT=development
SECRET_KEY="(=b(bsccsw8elr5v9^_511_$=a-rdc_^g@&kw2nfs*zx)nb+9m"

DEBUG=True

# Host
HOST_URL=localhost:8000
HOST_PROTOCOL=http

# Database (PostgreSQL)
DB_NAME=myproject_db
DB_USER=myproject_user
DB_PASSWORD=myproject_password
DB_HOST=db
DB_PORT=5432

# PostgreSQL container vars (read by postgres:17 image)
POSTGRES_DB=myproject_db
POSTGRES_USER=myproject_user
POSTGRES_PASSWORD=myproject_password
```

- [ ] **Step 4: Update `backend/.env.example`**

Replace the full contents of `backend/.env.example` with:

```
DJANGO_ENVIRONMENT=development
# Generate: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
SECRET_KEY=

DEBUG=True

# Host
HOST_URL=localhost:8000
HOST_PROTOCOL=http

# Database (PostgreSQL)
DB_NAME=myproject_db
DB_USER=myproject_user
DB_PASSWORD=myproject_password
DB_HOST=db
DB_PORT=5432

# PostgreSQL container vars (read by postgres:17 image — must match DB_* above)
POSTGRES_DB=myproject_db
POSTGRES_USER=myproject_user
POSTGRES_PASSWORD=myproject_password
```

- [ ] **Step 5: Create `backend/.env.prod`**

Create this file (it's gitignored — fill real values before deploying):

```
DJANGO_ENVIRONMENT=production
# Generate: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
SECRET_KEY=

DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:4321

DB_NAME=myproject_prod
DB_USER=myproject_user
DB_PASSWORD=change_me_strong_password
DB_HOST=db
DB_PORT=5432

POSTGRES_DB=myproject_prod
POSTGRES_USER=myproject_user
POSTGRES_PASSWORD=change_me_strong_password
```

- [ ] **Step 6: Create `frontend/.env`**

```
PUBLIC_API_URL=http://localhost:8000
```

- [ ] **Step 7: Create `frontend/.env.prod`**

```
PUBLIC_API_URL=http://localhost:8000
```

(Replace `localhost:8000` with the real server address before deploying.)

- [ ] **Step 8: Verify gitignore works**

```bash
git status --short
```

Expected: `backend/.env.prod` and `frontend/.env.prod` do NOT appear in the output (they are gitignored). `frontend/.env` also should not appear (already in frontend/.gitignore).

- [ ] **Step 9: Commit**

```bash
git add backend/.gitignore frontend/.gitignore backend/.env.example
git commit -m "chore: add Docker env file templates and gitignore rules"
```

---

### Task 2: STATIC_ROOT setting and frontend API URL

**Files:**
- Modify: `backend/config/settings/base.py`
- Modify: `frontend/src/pages/login.astro`
- Modify: `frontend/src/pages/register.astro`

**Interfaces:**
- Produces: `STATIC_ROOT` used by `collectstatic` in the prod backend CMD; `PUBLIC_API_URL` read by both Astro pages

- [ ] **Step 1: Add STATIC_ROOT to base settings**

In `backend/config/settings/base.py`, find the line `STATIC_URL = "static/"` and add `STATIC_ROOT` immediately after:

```python
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
```

- [ ] **Step 2: Update `login.astro` API call**

In `frontend/src/pages/login.astro`, find the `<script>` block. Replace the `fetch` call:

```js
// Before:
const res = await fetch("/v1/auth/login/", {

// After:
const API = import.meta.env.PUBLIC_API_URL;
const res = await fetch(`${API}/v1/auth/login/`, {
```

The full updated `try` block looks like:

```js
try {
  const API = import.meta.env.PUBLIC_API_URL;
  const res = await fetch(`${API}/v1/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
```

- [ ] **Step 3: Update `register.astro` API call**

In `frontend/src/pages/register.astro`, find the `<script>` block. Replace the `fetch` call:

```js
// Before:
const res = await fetch("/v1/auth/register/", {

// After:
const API = import.meta.env.PUBLIC_API_URL;
const res = await fetch(`${API}/v1/auth/register/`, {
```

The full updated `try` block:

```js
try {
  const API = import.meta.env.PUBLIC_API_URL;
  const res = await fetch(`${API}/v1/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
```

- [ ] **Step 4: Verify the changes look right**

```bash
grep -n "PUBLIC_API_URL\|fetch(" frontend/src/pages/login.astro frontend/src/pages/register.astro
```

Expected output shows `PUBLIC_API_URL` on the line before each `fetch(`.

```bash
grep -n "STATIC_ROOT" backend/config/settings/base.py
```

Expected: `STATIC_ROOT = BASE_DIR / "staticfiles"`.

- [ ] **Step 5: Commit**

```bash
git add backend/config/settings/base.py \
        frontend/src/pages/login.astro \
        frontend/src/pages/register.astro
git commit -m "feat(docker): add STATIC_ROOT and PUBLIC_API_URL for containerized deploy"
```

---

### Task 3: Backend Dockerfile

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/.dockerignore`

**Interfaces:**
- Produces: `backend-dev` and `backend-prod` Docker images consumed by Tasks 5 and 6
- Dev image: CMD = `/opt/venv/bin/python manage.py runserver 0.0.0.0:8000`
- Prod image: CMD = `migrate + collectstatic + gunicorn`

- [ ] **Step 1: Create `backend/.dockerignore`**

```
.venv/
__pycache__/
*.pyc
*.pyo
db.sqlite3
.env
.env.*
staticfiles/
.pytest_cache/
.ruff_cache/
.mypy_cache/
```

- [ ] **Step 2: Create `backend/Dockerfile`**

```dockerfile
FROM python:3.14-slim AS base

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

ENV UV_PROJECT_ENVIRONMENT=/opt/venv \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

COPY pyproject.toml uv.lock ./

# ── dev ──────────────────────────────────────────────────────────────────────
FROM base AS dev

RUN uv sync --frozen --no-dev

EXPOSE 8000
CMD ["/opt/venv/bin/python", "manage.py", "runserver", "0.0.0.0:8000"]

# ── prod ─────────────────────────────────────────────────────────────────────
FROM base AS prod

RUN uv sync --frozen --no-dev --group prod

COPY . .

EXPOSE 8000
CMD ["sh", "-c", "/opt/venv/bin/python manage.py migrate --noinput && /opt/venv/bin/python manage.py collectstatic --noinput && /opt/venv/bin/gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2"]
```

- [ ] **Step 3: Build and verify the dev stage**

```bash
docker build --target dev -t backend-test-dev ./backend
```

Expected: build completes with no errors. Last line: `=> exporting to image`.

- [ ] **Step 4: Build and verify the prod stage**

```bash
docker build --target prod -t backend-test-prod ./backend
```

Expected: build completes. The CMD is defined but not executed during build, so missing env vars do not fail here.

- [ ] **Step 5: Clean up test images**

```bash
docker rmi backend-test-dev backend-test-prod
```

- [ ] **Step 6: Commit**

```bash
git add backend/Dockerfile backend/.dockerignore
git commit -m "feat(docker): add multi-stage backend Dockerfile"
```

---

### Task 4: Frontend Dockerfile

**Files:**
- Create: `frontend/Dockerfile`
- Create: `frontend/.dockerignore`

**Interfaces:**
- Produces: `frontend-dev` and `frontend-prod` Docker images consumed by Tasks 5 and 6
- Dev image: CMD = `pnpm dev --host 0.0.0.0`
- Prod image: CMD = `pnpm build && pnpm preview --host 0.0.0.0 --port 4321` (reads `PUBLIC_API_URL` from container env at runtime so Astro bakes it in)

- [ ] **Step 1: Create `frontend/.dockerignore`**

```
node_modules/
dist/
.astro/
.env
.env.*
```

- [ ] **Step 2: Create `frontend/Dockerfile`**

```dockerfile
FROM node:22-slim AS base

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ── dev ──────────────────────────────────────────────────────────────────────
FROM base AS dev

EXPOSE 4321
CMD ["pnpm", "dev", "--host", "0.0.0.0"]

# ── prod ─────────────────────────────────────────────────────────────────────
FROM base AS prod

COPY . .

EXPOSE 4321
CMD ["sh", "-c", "pnpm build && pnpm preview --host 0.0.0.0 --port 4321"]
```

- [ ] **Step 3: Build and verify the dev stage**

```bash
docker build --target dev -t frontend-test-dev ./frontend
```

Expected: build completes. `pnpm install` runs successfully.

- [ ] **Step 4: Build and verify the prod stage**

```bash
docker build --target prod -t frontend-test-prod ./frontend
```

Expected: build completes. `pnpm build` does NOT run during build (it's in CMD), so no env var errors here.

- [ ] **Step 5: Clean up test images**

```bash
docker rmi frontend-test-dev frontend-test-prod
```

- [ ] **Step 6: Commit**

```bash
git add frontend/Dockerfile frontend/.dockerignore
git commit -m "feat(docker): add multi-stage frontend Dockerfile"
```

---

### Task 5: docker-compose.yml (dev)

**Files:**
- Create: `docker-compose.yml`

**Interfaces:**
- Consumes: `backend/Dockerfile` (target: dev), `frontend/Dockerfile` (target: dev), `backend/.env`, `frontend/.env`
- Produces: working dev stack reachable at `localhost:8000` (API) and `localhost:4321` (UI)

- [ ] **Step 1: Create `docker-compose.yml`**

```yaml
services:

  db:
    image: postgres:17
    env_file: backend/.env
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-net
    healthcheck:
      test: ["CMD", "pg_isready"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      target: dev
    volumes:
      - ./backend:/app
    env_file: backend/.env
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
    networks:
      - app-net

  frontend:
    build:
      context: ./frontend
      target: dev
    volumes:
      - ./frontend:/app
      - /app/node_modules
    env_file: frontend/.env
    ports:
      - "4321:4321"
    networks:
      - app-net

volumes:
  postgres_data:

networks:
  app-net:
```

Note on frontend volumes: `./frontend:/app` mounts the source; `/app/node_modules` is an anonymous volume that protects the container's `node_modules` from being shadowed by the host mount.

- [ ] **Step 2: Validate the compose file syntax**

```bash
docker compose config
```

Expected: prints the resolved compose config with no errors.

- [ ] **Step 3: Start the dev stack**

```bash
docker compose up --build
```

Expected: after 10–30 seconds all three containers are running. You should see:
- `db` logs: `database system is ready to accept connections`
- `backend` logs: `Starting development server at http://0.0.0.0:8000/`
- `frontend` logs: `Local   http://localhost:4321/`

- [ ] **Step 4: Run the dev migrations (first-time only)**

In a separate terminal, while the stack is running:

```bash
docker compose exec backend /opt/venv/bin/python manage.py migrate
```

Expected: Django prints the applied migrations. No errors.

- [ ] **Step 5: Smoke-test the running services**

```bash
# Backend health
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/v1/auth/login/ -X POST -H "Content-Type: application/json" -d '{"email":"x","password":"x"}'
```

Expected: `400` (bad credentials) — confirms Django is up and routing correctly.

```bash
# Frontend
curl -s -o /dev/null -w "%{http_code}" http://localhost:4321/
```

Expected: `200`.

- [ ] **Step 6: Stop the stack**

```bash
docker compose down
```

- [ ] **Step 7: Commit**

```bash
git add docker-compose.yml
git commit -m "feat(docker): add dev docker-compose with hot-reload volumes"
```

---

### Task 6: docker-compose.prod.yml (prod)

**Files:**
- Create: `docker-compose.prod.yml`

**Interfaces:**
- Consumes: `backend/Dockerfile` (target: prod), `frontend/Dockerfile` (target: prod), `backend/.env.prod`, `frontend/.env.prod`
- Produces: prod stack reachable at `localhost:8000` (API) and `localhost:4321` (preview)

- [ ] **Step 1: Create `docker-compose.prod.yml`**

```yaml
services:

  db:
    image: postgres:17
    env_file: backend/.env.prod
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-net
    restart: always
    healthcheck:
      test: ["CMD", "pg_isready"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      target: prod
    env_file: backend/.env.prod
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
    networks:
      - app-net
    restart: always

  frontend:
    build:
      context: ./frontend
      target: prod
    env_file: frontend/.env.prod
    ports:
      - "4321:4321"
    networks:
      - app-net
    restart: always

volumes:
  postgres_data:

networks:
  app-net:
```

- [ ] **Step 2: Validate the compose file syntax**

```bash
docker compose -f docker-compose.prod.yml config
```

Expected: prints resolved config with no errors.

- [ ] **Step 3: Fill in `backend/.env.prod` with a real SECRET_KEY**

Generate a key:

```bash
python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Or from within the backend venv:

```bash
cd backend && uv run python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Paste the output into `backend/.env.prod` as `SECRET_KEY=<value>`.

- [ ] **Step 4: Start the prod stack**

```bash
docker compose -f docker-compose.prod.yml up --build
```

Expected: backend logs show `migrate` applying migrations, then `collectstatic` copying files, then gunicorn workers starting. Frontend logs show Astro building then `preview` starting on port 4321.

- [ ] **Step 5: Smoke-test**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/v1/auth/login/ -X POST -H "Content-Type: application/json" -d '{"email":"x","password":"x"}'
```

Expected: `400`.

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:4321/
```

Expected: `200`.

- [ ] **Step 6: Stop the stack**

```bash
docker compose -f docker-compose.prod.yml down
```

- [ ] **Step 7: Commit**

```bash
git add docker-compose.prod.yml
git commit -m "feat(docker): add standalone prod docker-compose"
```
