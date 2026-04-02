# Async Email Control Room API

A production-minded NestJS backend with:

- PostgreSQL or MySQL support from the same entity model
- Redis + BullMQ for reliable async email jobs
- tenant isolation
- signup, login, forgot password, reset password
- admin and user roles
- tenant-scoped user management
- tenant-scoped SMTP configuration
- persistent audit logs, email jobs, and job histories

## Architecture

This version moves the project away from in-memory state and into a multi-tenant backend shape:

- `Tenant`
  - logical isolation boundary
- `User`
  - belongs to a tenant
  - role is `admin` or `user`
- `SMTP Config`
  - one config per tenant
  - password stored encrypted
- `Email Job`
  - belongs to a tenant
  - belongs to the creating user
  - processed through Redis queue
- `Email Job History`
  - stores lifecycle events per job
- `Audit Log`
  - stores structured tenant events

## Roles

### Admin

- can see all jobs in the tenant
- can manage users in the tenant
- can change user roles
- can activate/deactivate users
- can manage tenant SMTP config
- can read tenant audit logs

### User

- can log in
- can view own profile
- can queue email jobs
- can view only their own jobs

## Tech Stack

- NestJS
- TypeORM
- PostgreSQL or MySQL
- Redis
- BullMQ
- Nodemailer
- JWT auth
- bcrypt password hashing

## Environment Setup

Copy `.env.example` to `.env` and adjust values.

### PostgreSQL setup example

```env
DB_PROVIDER=postgres
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=asytest
```

### MySQL setup example

```env
DB_PROVIDER=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=root
DB_NAME=asytest
```

### Redis

```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_DB=0
REDIS_QUEUE_NAME=email-jobs
```

## How the shared schema works on PostgreSQL and MySQL

The entities were designed to stay portable across both engines:

- UUID primary keys are generated in the app layer
- foreign keys use portable string columns
- JSON-like payloads are stored in `text` columns as serialized JSON
- statuses and roles use string columns instead of database-specific enums
- timestamp fields avoid PostgreSQL-only or MySQL-only features

That keeps the table design usable on both databases without branching the domain model.

## Local Run

### 1. Install dependencies

```bash
npm install
```

### 2. Prepare database and Redis

Make sure one database engine and Redis are running.

### 3. Configure environment

```bash
cp .env.example .env
```

Then edit `.env`.

### 4. Run the app

```bash
npm run start:dev
```

### 5. Build for production

```bash
npm run build
npm run start:prod
```

## Main API Endpoints

### Public auth

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

### Authenticated

- `GET /auth/me`
- `GET /rbac/permissions-matrix`

### Admin only

- `GET /users`
- `POST /users`
- `PATCH /users/:userId/role`
- `PATCH /users/:userId/status`
- `PUT /smtp-config`
- `POST /smtp-config/test`
- `GET /logs`

### Tenant user operations

- `GET /smtp-config`
- `POST /jobs/email`
- `GET /jobs`
- `GET /jobs/summary`
- `GET /jobs/:jobId`

## Example Flow

### 1. Signup tenant admin

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "Acme Logistics",
    "fullName": "Alice Admin",
    "email": "alice@acme.com",
    "password": "SuperSecret123"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@acme.com",
    "password": "SuperSecret123"
  }'
```

Take the returned `accessToken`.

### 3. Save SMTP config

```bash
curl -X PUT http://localhost:3000/smtp-config \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "username": "your-user",
    "password": "your-password",
    "fromEmail": "noreply@acme.com",
    "fromName": "Acme Mailer"
  }'
```

### 4. Queue email job

```bash
curl -X POST http://localhost:3000/jobs/email \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "new-user@example.com",
    "subject": "Welcome",
    "body": "Hello from the production queue",
    "simulate": {
      "failAttempts": 1,
      "processingDelayMs": 100
    }
  }'
```

### 5. Check job history

```bash
curl http://localhost:3000/jobs \
  -H "Authorization: Bearer <token>"
```

## Forgot Password Flow

### Request reset

```bash
curl -X POST http://localhost:3000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@acme.com"
  }'
```

In non-production mode the response includes `previewToken` for testing.

### Reset password

```bash
curl -X POST http://localhost:3000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<preview-token>",
    "newPassword": "NewSuperSecret123"
  }'
```

## Redis Queue Behavior

- queue backend: BullMQ
- broker: Redis
- default attempts: `3`
- retry strategy: exponential backoff
- job state is persisted in database
- queue execution is handled by a worker inside the Nest app process

## Production Notes

- set `DB_SYNCHRONIZE=false` in production after schema is stabilized
- replace JWT and encryption secrets with long secure values
- run Redis separately, not in-process
- use managed PostgreSQL or MySQL for durability
- SMTP passwords are encrypted at rest before being stored
- tenant isolation is applied at query level across users, jobs, SMTP config, and logs
- regular users cannot read other users’ jobs

## PM2

An `ecosystem.config.js` is included.

### Build and start

```bash
npm run build
pm2 start ecosystem.config.js
pm2 save
```

## Docker

Build:

```bash
docker build -t asytest-api .
```

Run:

```bash
docker run --env-file .env -p 3000:3000 asytest-api
```

Note:

- database and Redis must be reachable from the container

## Tests

Run unit tests:

```bash
npm test
```

Run e2e-style HTTP tests:

```bash
npm run test:e2e
```

## Current Scope

This refactor gives you the main production backend foundation:

- portable DB model for PostgreSQL/MySQL
- Redis queue integration
- tenant-aware auth and role separation
- job persistence and auditability

If you want, the next iteration can be:

- TypeORM migrations
- refresh tokens
- invitation flow instead of direct admin-created passwords
- Swagger docs
- background location/geofence domain modeling
- WebSocket/SSE live job updates
