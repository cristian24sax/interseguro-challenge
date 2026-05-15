# syntax=docker/dockerfile:1.6

# Production image for Cloud Run / Kubernetes:
# - Multi-stage build (small final image)
# - Static binary (CGO_ENABLED=0) for distroless runtime
# - Non-root user
# - Runtime config via env: PORT, NODE_API_URL, HTTP_CLIENT_TIMEOUT_SECS, NODE_API_STATISTICS_PATH

ARG GO_VERSION=1.22.10

# --- dependencies ------------------------------------------------------------
FROM golang:${GO_VERSION}-bookworm AS deps

WORKDIR /src

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download && go mod verify

# --- build -------------------------------------------------------------------
FROM deps AS builder

COPY . .

ARG TARGETOS=linux
ARG TARGETARCH=amd64

RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 \
    GOOS=${TARGETOS} \
    GOARCH=${TARGETARCH} \
    go build \
      -buildvcs=false \
      -trimpath \
      -ldflags="-s -w" \
      -o /out/server \
      .

# --- runtime -----------------------------------------------------------------
FROM gcr.io/distroless/static-debian12:nonroot

WORKDIR /nonexistent

COPY --from=deps /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY --from=builder /out/server /server

USER nonroot:nonroot

EXPOSE 8080

ENV PORT=8080

STOPSIGNAL SIGTERM

ENTRYPOINT ["/server"]

LABEL org.opencontainers.image.title="interseguro-go-api" \
      org.opencontainers.image.description="Fiber QR factorization API (Gonum)" \
      org.opencontainers.image.source="https://github.com/interseguro/interseguro-challenge"
