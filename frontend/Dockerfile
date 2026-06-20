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
