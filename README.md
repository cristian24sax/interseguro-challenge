# Interseguro Technical Challenge Rules

## Project Context

This project is a technical challenge composed of two REST APIs:

1. Go API using Fiber

2. Node.js API using Express.js

The system must:

- Receive a rectangular matrix

- Perform QR factorization in Go

- Send QR result to Node.js API

- Calculate statistics in Node.js

- Return final combined response

Deployment must use Docker and Google Cloud Platform using Cloud Run.

---

# Global Engineering Rules

- Use clean architecture

- Keep controllers thin

- Business logic must be inside services

- Use DTOs for request/response

- Use JSON for all responses

- Use environment variables

- Avoid hardcoded values

- Use production-style structure

- Write maintainable and scalable code

- Add clear comments only when necessary

- Keep functions small and focused

---

# Repository Structure

This project uses a monorepo approach.

Project structure:

```txt

interseguro-challenge

│

├── .cursor

│   └── rules.mdc

│

├── go-api

│

├── node-api

│

├── docker-compose.yml

│

└── [README.md](http://README.md)

```

---

# Go API Rules

## Stack

- Language: Go

- Framework: Fiber

- Go Version: 1.22+

- QR library: Gonum

## Responsibilities

The Go API must:

1. Receive matrix input

2. Validate matrix

3. Perform QR factorization

4. Send matrices to Node.js API

5. Return final response

## Go Folder Structure

```txt

/go-api

│

├── cmd

│

├── internal

│   ├── handlers

│   ├── services

│   ├── clients

│   ├── models

│   ├── validators

│   ├── middleware

│   ├── routes

│   ├── config

│   └── utils

│

├── tests

│

├── Dockerfile

│

└── main.go

```

## Fiber Rules

- Use middleware for logging

- Use middleware for error handling

- Use JWT middleware for protected routes (`internal/middleware/jwt.go`)

- Controllers only orchestrate

- Services contain business logic

## QR Factorization

Use Gonum library for QR factorization.

Preferred package:

```go

gonum.org/v1/gonum/mat

```

Do not implement unstable QR algorithms manually.

## Validation Rules

Validate:

- Matrix is not empty

- Matrix is rectangular

- Matrix contains only numbers

- Null values are invalid

---

# Node.js API Rules

## Stack

- Node.js

- Express.js

- Node 20+

## Responsibilities

The Node API must:

1. Receive QR matrices

2. Calculate statistics

3. Return statistics response

## Node Folder Structure

```txt

/node-api

│

├── public

│   ├── index.html

│   ├── login.html

│   ├── app.js

│   ├── login.js

│   ├── auth.js

│   └── styles.css

│

├── src

│   ├── routes

│   ├── controllers

│   ├── services

│   ├── middleware

│   ├── validators

│   ├── config

│   └── utils

│

├── tests

│

├── Dockerfile

│

└── package.json

```

## Statistics Required

Calculate:

- Maximum value

- Minimum value

- Average

- Total sum

- Detect diagonal matrix

## Validation

Validate all incoming payloads before processing.

## Authentication

- `POST /api/v1/auth/login` — issues JWT (public)
- `GET /api/v1/auth/me` — current user (protected)
- `POST /api/v1/statistics` — protected by `jwtAuth` middleware (`src/middleware/jwt.middleware.js`)

---

# Communication Rules

- APIs communicate using HTTP REST

- Go API is the orchestrator

- Node API processes statistics and authentication (login)

- Use JSON for communication

- Go forwards the client `Authorization` header when calling Node statistics

- Handle timeout errors properly

- Handle downstream API failures gracefully

---

# API Standards

## Success Response

```json

{

  "success": true,

  "message": "Operation completed",

  "data": {}

}

```

## Error Response

```json

{

  "success": false,

  "message": "Invalid matrix"

}

```

Use proper HTTP status codes.

---

# Docker Rules

## Requirements

- Each API must have its own Dockerfile

- Use docker-compose for local development

- Use lightweight images

- Prefer multi-stage builds

- Use .dockerignore

- Avoid running containers as root

---

# Cloud Rules

## Google Cloud Platform

Deploy services using:

- Google Cloud Run

## Cloud Requirements

- Services must be stateless

- Use environment variables

- Never hardcode URLs

- APIs communicate through HTTPS

- Node API URL must come from env variables

---

# Environment Variables

## Go API

```env
PORT=8080
NODE_API_URL=https://node-api-url.run.app
JWT_SECRET=your-shared-secret
HTTP_CLIENT_TIMEOUT_SECS=30
```

## Node API

```env
PORT=3000
JWT_SECRET=your-shared-secret
JWT_EXPIRES_IN=1h
AUTH_USERNAME=demo
AUTH_PASSWORD=interseguro
GO_API_URL=https://your-go-api.onrender.com
```

`JWT_SECRET` must be the **exact same value** in both APIs so tokens issued by Node are accepted by Go and by the statistics middleware.

With `docker compose`, defaults are set in `docker-compose.yml` (`demo` / `interseguro` for local development).

---

# Deploy on Render

Render **does not** read `docker-compose.yml`. Each Web Service has its own **Environment** tab in the dashboard (or use the repo `render.yaml` Blueprint).

## Checklist (manual setup — 2 Web Services)

### 1. Shared secret (critical)

Create one secret and paste the **same** value in **both** services:

```text
JWT_SECRET=<long-random-string>
```

Example: `openssl rand -hex 32`

If Node and Go use different secrets, login works but QR returns `401 Invalid access token`.

Optional: use a Render **Environment Group** linked to both services so `JWT_SECRET` stays in sync.

### 2. Node API service (`interseguro-node-api`)

| Variable | Example | Notes |
|----------|---------|--------|
| `JWT_SECRET` | (same as Go) | Signs login tokens |
| `AUTH_USERNAME` | `demo` | Login user |
| `AUTH_PASSWORD` | `your-password` | Login password |
| `JWT_EXPIRES_IN` | `1h` | Optional |
| `GO_API_URL` | `https://interseguro-go-api.onrender.com` | Public URL of Go service (no trailing slash) |

Root directory / Docker context: `node-api`.

The UI loads `/config.js`, which injects `GO_API_URL` at runtime (no need to rebuild static files when the Go URL changes).

### 3. Go API service (`interseguro-go-api`)

| Variable | Example | Notes |
|----------|---------|--------|
| `JWT_SECRET` | (same as Node) | Validates Bearer tokens |
| `NODE_API_URL` | `https://interseguro-node-api.onrender.com` | Public URL of Node (statistics + login) |
| `HTTP_CLIENT_TIMEOUT_SECS` | `30` | Optional |

Root directory / Docker context: `go-api`.

### 4. Verify

```bash
# Login on Node URL
curl -s -X POST https://YOUR-NODE.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"YOUR_AUTH_PASSWORD"}'

# QR on Go URL (replace TOKEN)
curl -X POST https://YOUR-GO.onrender.com/api/v1/qr-factorization \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"matrix":[[1,2],[3,4]]}'
```

Open `https://YOUR-NODE.onrender.com/login.html` in the browser.

### 5. Blueprint (optional)

Repo file `render.yaml` defines both services, links `NODE_API_URL` / `GO_API_URL`, and an env group with generated `JWT_SECRET`. Deploy via **New → Blueprint** in Render.

---

# JWT Authentication

The project implements Bearer JWT authentication (HS256) across the stack.

## Flow

1. Client obtains a token via `POST /api/v1/auth/login` (Node API).
2. Client sends `Authorization: Bearer <token>` to protected endpoints.
3. **Go API** validates the JWT on `POST /api/v1/qr-factorization` and forwards the same header when calling Node statistics.
4. **Node API** validates the JWT on `POST /api/v1/statistics` via Express middleware.

## Node API — login (public)

### POST /api/v1/auth/login

Request:

```json
{
  "username": "demo",
  "password": "interseguro"
}
```

Success response (`200`):

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "<JWT>",
    "accessToken": "<JWT>",
    "tokenType": "Bearer",
    "expiresIn": "1h",
    "username": "demo"
  }
}
```

Errors: `400` (validation), `401` (invalid credentials).

### GET /api/v1/auth/me (protected)

Requires `Authorization: Bearer <token>`. Returns the authenticated username.

## Node API — JWT middleware (statistics)

File: `node-api/src/middleware/jwt.middleware.js`

- Middleware: `jwtAuth`
- Applied to: `POST /api/v1/statistics`
- Validates Bearer token, expiration, and `sub` claim
- Sets `req.user = { username }` on success

Unauthorized responses (`401`):

| Message | Cause |
|---------|--------|
| `Missing access token` | No `Authorization` header |
| `Access token expired` | JWT past `exp` |
| `Invalid access token` | Bad signature or malformed token |

## Go API — JWT middleware (QR)

File: `go-api/internal/middleware/jwt.go`

- Middleware: `NewJWTAuth` / `JWTAuth`
- Applied to: `POST /api/v1/qr-factorization` (entire `/api/v1` group except public routes)
- Public route: `GET /health` (no JWT required)
- Forwards token to Node statistics client in `Authorization` header

## Frontend

Static UI served from Node (`node-api/public/`):

- `login.html` — login form
- `auth.js` — token storage (`localStorage`), session check, logout
- `index.html` — QR calculator; redirects to login if unauthenticated
- `app.js` — attaches `Authorization: Bearer` to Go API requests

Default local URLs:

- UI + login + auth API: `http://localhost:3000`
- Go QR API: `http://localhost:8080` (configured via `<meta name="go-api-url">` or `?api=` query param)

---

# Recommended Endpoints

## Go API

### GET /health

Public health check (no JWT).

### POST /api/v1/qr-factorization (protected)

Headers:

```http
Authorization: Bearer <JWT>
Content-Type: application/json
```

Request:

```json
{
  "matrix": [
    [1, 2],
    [3, 4]
  ]
}
```

Response:

```json
{
  "success": true,
  "message": "Operation completed",
  "data": {
    "q": [],
    "r": [],
    "statistics": {}
  }
}
```

Errors: `401` (auth), `400` (validation), `502` (downstream Node failure).

---

## Node API

### POST /api/v1/auth/login

See [JWT Authentication](#jwt-authentication) (public).

### POST /api/v1/statistics (protected)

Headers:

```http
Authorization: Bearer <JWT>
Content-Type: application/json
```

Request:

```json
{
  "q": [],
  "r": []
}
```

Statistics in `data` include: `max`, `min`, `average`, `sum`, `elementCount`, `isDiagonal`, and per-matrix stats for `q` and `r`.

---

# Example Requests (local)

```bash
# 1. Login (Node API, port 3000)
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"interseguro"}'

# 2. Export token (jq) or copy from JSON response
export TOKEN="<paste token here>"

# 3. QR factorization (Go API, port 8080)
curl -X POST http://localhost:8080/api/v1/qr-factorization \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"matrix":[[1,2],[3,4]]}'

# 4. Statistics directly (Node API, port 3000)
curl -X POST http://localhost:3000/api/v1/statistics \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"q":[[1,0],[0,1]],"r":[[2,3],[0,4]]}'
```

With Docker Compose:

```bash
docker compose up --build
```

Then open `http://localhost:3000/login.html` and sign in with `demo` / `interseguro`.

---

# Testing Rules

## Go

- Use standard Go testing

- Prefer table-driven tests

## Node

Recommended:

- Jest

- Supertest

---

# Logging Rules

Log:

- Incoming requests

- External API calls

- Validation errors

- Internal server errors

Do not log:

- Secrets

- Tokens

- Environment sensitive data

---

# Security

JWT authentication is implemented:

- Bearer tokens (`Authorization: Bearer <token>`)
- HS256 signing with shared `JWT_SECRET`
- Token expiration validated (`JWT_EXPIRES_IN`, default `1h`)
- Secrets and credentials via environment variables (never committed)
- Passwords hashed with bcrypt before comparison
- Do not log tokens or secrets (see Logging Rules)

---

# README Requirements

The README must include:

- Architecture explanation

- Technologies used

- Local setup

- Docker setup

- Cloud deployment

- Endpoints

- Example requests

- Tradeoffs and decisions

---

# Technical Decisions

The implementation should prioritize:

- Correctness

- Maintainability

- Scalability

- Readability

- Clean architecture

- Production-style code

---

# Important

Never place business logic inside controllers.

Always separate:

- routes

- handlers/controllers

- services

- clients

- validations

Always keep APIs independent and loosely coupled.