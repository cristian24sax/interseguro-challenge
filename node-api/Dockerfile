# syntax=docker/dockerfile:1.6

# Production image for Cloud Run / Kubernetes:
# - Multi-stage build (production deps only)
# - Alpine-based Node 20 LTS
# - Non-root user
# - Runtime config via env: PORT

ARG NODE_VERSION=20.18.1

# --- dependencies ------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS deps

WORKDIR /app

RUN apk add --no-cache ca-certificates \
  && update-ca-certificates

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --ignore-scripts

# --- runtime -----------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS runner

WORKDIR /app

RUN apk add --no-cache ca-certificates \
  && update-ca-certificates \
  && addgroup -g 10001 -S app \
  && adduser -S -u 10001 -G app app

ENV NODE_ENV=production \
    PORT=3000

COPY --from=deps --chown=app:app /app/node_modules ./node_modules
COPY --chown=app:app package.json package-lock.json ./
COPY --chown=app:app src ./src
COPY --chown=app:app public ./public

USER app

EXPOSE 3000

STOPSIGNAL SIGTERM

CMD ["node", "src/server.js"]

LABEL org.opencontainers.image.title="interseguro-node-api" \
      org.opencontainers.image.description="Express statistics API for QR matrices" \
      org.opencontainers.image.source="https://github.com/interseguro/interseguro-challenge"
