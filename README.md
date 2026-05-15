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

---

# Communication Rules

- APIs communicate using HTTP REST

- Go API is the orchestrator

- Node API only processes statistics

- Use JSON for communication

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

NODE_API_URL=[https://node-api-url.run.app](https://node-api-url.run.app)

```

## Node API

```env

PORT=3000

```

---

# Recommended Endpoints

## Go API

### POST /api/v1/qr-factorization

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

  "data": {

    "q": [],

    "r": [],

    "statistics": {}

  }

}

```

---

## Node API

### POST /api/v1/statistics

Request:

```json

{

  "q": [],

  "r": []

}

```

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

# Optional Security

If JWT is implemented:

- Use Bearer tokens

- Validate expiration

- Store secrets in env variables

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