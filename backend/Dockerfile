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
