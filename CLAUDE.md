# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Full-stack project: Django 6 + DRF REST API (`backend/`) paired with an Astro 6 frontend (`frontend/`). The backend is a template for Spanish tax-form (AEAT) management. All commands below are run from within their respective subdirectory.

## Backend (Django + DRF)

**Package manager:** `uv`

```bash
cd backend

# Install dependencies
uv sync

# Run dev server (uses SQLite by default in development)
uv run python manage.py runserver

# Migrations
uv run python manage.py makemigrations
uv run python manage.py migrate

# Tests (uses in-memory SQLite, no .env needed)
uv run pytest                                          # all tests
uv run pytest apps/api/tests/test_example.py          # single file
uv run pytest --cov=apps --cov-report=term-missing    # with coverage

# Linting / formatting
uv run ruff check .         # lint
uv run ruff check . --fix   # auto-fix
uv run ruff format .        # format
```

**Settings:** Selected via `DJANGO_ENVIRONMENT` env var. `testing.py` uses in-memory SQLite and fast password hashers — no external DB needed to run tests. `development.py` uses file-based SQLite.

**Environment:** Copy `.env.example` to `.env`. Generate `SECRET_KEY` with:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

## Frontend (Astro)

**Package manager:** `pnpm`

```bash
cd frontend

pnpm install
pnpm dev      # dev server at localhost:4321
pnpm build    # production build to ./dist/
pnpm preview  # preview production build
```

## Backend architecture

All domain code lives under `apps/api/`. The structure follows a strict one-file-per-entity convention:

- `models/` — one file per domain entity, all inheriting from `BaseModel`
- `serializers/` — paired Read/Write serializers per entity
- `viewsets/` — one `ModelViewSet` per entity, registered on the DRF router in `urls.py`
- `views/` — standalone `APIView`s (auth endpoints: login, refresh, me, register)
- `admin/`, `tests/` — follow the same one-file-per-entity pattern

**BaseModel** (`apps/api/models/abstracts/base.py`) is the foundation for every model:
- UUID primary key, `created_at`, `updated_at`
- Soft-delete via `deleted_at` (NULL = live) and `active` flag
- `Model.objects` — default manager, filters to live + active records only
- `Model.all_objects` — unfiltered, use for admin and internal operations

To soft-delete: `MyModel.all_objects.filter(pk=pk).update(deleted_at=timezone.now())`

**JWT auth** is handled by `simplejwt`. Tokens include custom claims (`email`, `role`, `full_name`). Token rotation and blacklisting are enabled. Access token lifetime: 7 days.

**API base URL:** `/v1/` — defined in `config/urls.py`. Auth endpoints live at `/v1/auth/`.

## Adding a new resource

The pattern is always: model → serializers (Read + Write) → viewset → admin → register in `urls.py` → migration → factory + tests. Export each new class from its package's `__init__.py`. See `backend/README.md` for a full worked example with `Product`.

For nested resources (e.g. `/clients/{client_pk}/notes/`), register the viewset manually in `urls.py` instead of using the router, and override `get_queryset` / `perform_create` to inject the parent FK.

## Test conventions

Tests use `pytest-django` with `factory-boy` factories. The `api_client` fixture (unauthenticated `APIClient`) comes from `apps/api/tests/conftest.py`. Authenticate inline with `api_client.force_authenticate(user=UserFactory())`. All test functions use `@pytest.mark.django_db`.

## Frontend design skill

The `.agents/skills/frontend-design/` skill is available for UI work. It enforces distinctive, non-generic aesthetics — avoid Inter/Roboto fonts, purple-gradient-on-white schemes, and cookie-cutter layouts.
