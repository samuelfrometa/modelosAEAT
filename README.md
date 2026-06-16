# modelosAEAT

Full-stack template for building Spanish tax-form (AEAT) management applications.

**Backend:** Django 6 + Django REST Framework — REST API with JWT auth, soft-delete, UUID PKs, and a strict one-file-per-entity structure.  
**Frontend:** Astro 6 — static-first UI served from `localhost:4321`.

---

## Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| API       | Django 6, Django REST Framework 3.17            |
| Auth      | simplejwt — JWT with rotation and blacklisting  |
| DB        | PostgreSQL (prod) / SQLite (dev & tests)        |
| Frontend  | Astro 6                                         |
| Packaging | `uv` (backend) · `pnpm` (frontend)              |
| Testing   | pytest, pytest-django, factory-boy              |
| Lint/fmt  | ruff                                            |

---

## Getting started

### Prerequisites

- Python 3.14+
- Node.js 22.12+
- `uv` — `pip install uv`
- `pnpm` — `npm install -g pnpm`
- PostgreSQL (only needed for non-development environments)

### Backend

```bash
cd backend

# Install dependencies
uv sync

# Configure environment
cp .env.example .env
# Edit .env — set SECRET_KEY, DB credentials, etc.

# Run migrations
uv run python manage.py migrate

# Start dev server (SQLite, no Postgres needed)
uv run python manage.py runserver
```

API available at `http://localhost:8000/v1/`.

### Frontend

```bash
cd frontend

pnpm install
pnpm dev
```

UI available at `http://localhost:4321`.

---

## Environment variables

Copy `backend/.env.example` to `backend/.env` and fill in the values.

| Variable             | Description                                          |
|----------------------|------------------------------------------------------|
| `DJANGO_ENVIRONMENT` | `development`, `testing`, or `production`            |
| `SECRET_KEY`         | Django secret key (generate with the command below)  |
| `DEBUG`              | `True` in development, `False` in production         |
| `DB_NAME`            | PostgreSQL database name                             |
| `DB_USER`            | PostgreSQL user                                      |
| `DB_PASSWORD`        | PostgreSQL password                                  |
| `DB_HOST`            | PostgreSQL host                                      |
| `DB_PORT`            | PostgreSQL port (default `5432`)                     |

Generate a secret key:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

---

## Backend architecture

All domain code lives under `backend/apps/api/`. The structure follows a strict one-file-per-entity convention:

```
apps/api/
├── models/        # one file per entity, all inherit from BaseModel
├── serializers/   # paired Read + Write serializers per entity
├── viewsets/      # one ModelViewSet per entity
├── views/         # standalone APIViews (auth: login, refresh, me, register)
├── admin/
└── tests/
```

**BaseModel** provides: UUID primary key, `created_at`, `updated_at`, soft-delete via `deleted_at`, and an `active` flag. `Model.objects` filters to live records only; `Model.all_objects` is unfiltered.

Auth endpoints live at `/v1/auth/`. Access tokens are valid for 7 days.

---

## Running tests

```bash
cd backend

uv run pytest                                          # all tests
uv run pytest --cov=apps --cov-report=term-missing    # with coverage
```

Tests use an in-memory SQLite database — no `.env` or Postgres needed.

---

## Adding a new resource

Model → serializers (Read + Write) → viewset → admin → register in `urls.py` → migration → factory + tests.

See `backend/README.md` for a full worked example.
