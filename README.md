# Async Email Control Room

A production-minded NestJS project for testing async email sending with:

- dynamic SMTP configuration
- a built-in browser UI
- async job queue processing
- 3 total attempts with exponential backoff
- structured logs
- per-job history and delivery tracking
- unit and e2e tests

The queue and all history stay in memory, so the setup remains simple while still showing a clean real backend flow.

## Features

- `GET /` serves a clean single-page UI for:
  - saving SMTP settings dynamically
  - testing SMTP connectivity
  - queueing a real email
  - watching job status change live
  - inspecting per-job timeline and logs
- `POST /jobs/email` accepts async email jobs
- retries happen automatically with exponential backoff
- final failures are logged clearly and marked as `failed`
- SMTP password is never returned by the API
- each job stores:
  - current status
  - attempts made
  - last error
  - status transition history
  - SMTP snapshot used for that job
  - provider response metadata

## Stack

- Node.js
- NestJS
- TypeScript
- Nodemailer
- Jest
- Supertest

## Retry Strategy

- max attempts: `3 total`
- backoff:
  - failure on attempt 1 -> retry after `1000ms`
  - failure on attempt 2 -> retry after `2000ms`
  - failure on attempt 3 -> mark as `failed`

## Project Structure

```text
src/
  app.module.ts
  main.ts
  health/
    health.controller.ts
    health.module.ts
  jobs/
    dto/
      create-email-job.dto.ts
    models/
      job.model.ts
    email-job.processor.ts
    job-queue.service.ts
    jobs.controller.ts
    jobs.module.ts
    jobs.service.ts
  observability/
    log-entry.model.ts
    logs.controller.ts
    observability.module.ts
    structured-logger.service.ts
  smtp/
    dto/
      upsert-smtp-config.dto.ts
    models/
      smtp-config.model.ts
    smtp-config.service.ts
    smtp.controller.ts
    smtp-mailer.service.ts
    smtp.module.ts
  ui/
    ui.controller.ts
    ui.module.ts
    ui-page.ts
test/
  job-queue.service.spec.ts
  jobs.e2e-spec.ts
```

## Local Run

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
npm install
```

### Start in Development

```bash
npm run start:dev
```

Open:

```text
http://localhost:3000
```

### Build

```bash
npm run build
```

### Run Production Build

```bash
npm run start:prod
```

## UI Workflow

### 1. Open the dashboard

```text
http://localhost:3000
```

### 2. Save SMTP settings

Fields:

- host
- port
- secure
- username
- password
- from email
- from name

### 3. Test SMTP connection

Use the `Test Connection` button from the UI.

### 4. Queue a test email

Required fields:

- recipient email
- subject
- body

Optional debug fields:

- simulated fail attempts
- processing delay

### 5. Track everything live

The dashboard shows:

- summary counters
- job list
- selected job details
- status timeline
- related logs
- global recent logs

## API Endpoints

### `GET /`

Returns the dashboard UI.

### `GET /health`

Simple health endpoint.

### `GET /smtp-config`

Returns current SMTP config without exposing the password.

### `PUT /smtp-config`

Creates or updates SMTP config.

Example:

```json
{
  "host": "smtp.gmail.com",
  "port": 587,
  "secure": false,
  "username": "your-user",
  "password": "your-password",
  "fromEmail": "noreply@example.com",
  "fromName": "Delivery Bot"
}
```

### `POST /smtp-config/test`

Tests the current or submitted SMTP config.

### `POST /jobs/email`

Queues an email job asynchronously.

Response: `202 Accepted`

Example:

```json
{
  "to": "candidate@example.com",
  "subject": "Async email test",
  "body": "Hello from the async email worker",
  "simulate": {
    "failAttempts": 1,
    "processingDelayMs": 100
  }
}
```

Notes:

- SMTP config must exist first
- `simulate` is optional and useful for retry demo/testing

### `GET /jobs`

Returns all jobs, newest first.

### `GET /jobs/summary`

Returns dashboard counters:

- total
- queued
- processing
- retryScheduled
- succeeded
- failed

### `GET /jobs/:jobId`

Returns one job with:

- payload
- attempts made
- status
- last error
- history timeline
- provider result

### `GET /logs`

Returns recent structured logs.

Optional query:

```text
/logs?jobId=<job-id>
```

## Environment Variables

Use `.env.example` as a reference.

| Variable | Default | Purpose |
|---|---:|---|
| `PORT` | `3000` | HTTP port |
| `WORKER_CONCURRENCY` | `1` | Number of in-memory workers |
| `MAX_JOB_ATTEMPTS` | `3` | Total attempts per job |
| `RETRY_BASE_DELAY_MS` | `1000` | Base retry delay |

Notes:

- invalid worker values fall back to safe defaults
- all state is in memory
- app restart clears SMTP config, jobs, and logs

## Example curl Usage

### Save SMTP

```bash
curl -X PUT http://localhost:3000/smtp-config \
  -H "Content-Type: application/json" \
  -d '{
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "username": "your-user",
    "password": "your-password",
    "fromEmail": "noreply@example.com",
    "fromName": "Delivery Bot"
  }'
```

### Test SMTP

```bash
curl -X POST http://localhost:3000/smtp-config/test \
  -H "Content-Type: application/json" \
  -d '{
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "username": "your-user",
    "password": "your-password",
    "fromEmail": "noreply@example.com",
    "fromName": "Delivery Bot"
  }'
```

### Queue Email

```bash
curl -X POST http://localhost:3000/jobs/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "candidate@example.com",
    "subject": "Async Demo",
    "body": "Testing async email sending",
    "simulate": {
      "failAttempts": 2,
      "processingDelayMs": 100
    }
  }'
```

### List Jobs

```bash
curl http://localhost:3000/jobs
```

### Get One Job

```bash
curl http://localhost:3000/jobs/<job-id>
```

### Read Logs

```bash
curl http://localhost:3000/logs
curl "http://localhost:3000/logs?jobId=<job-id>"
```

## Testing

Run unit tests:

```bash
npm test
```

Run e2e tests:

```bash
npm run test:e2e
```

Covered scenarios:

- queue success path
- retry with exponential backoff
- final permanent failure
- SMTP save + async job creation flow
- dashboard UI availability
- payload validation

## Docker

### Build

```bash
docker build -t async-email-control-room .
```

### Run

```bash
docker run -p 3000:3000 async-email-control-room
```

Then open:

```text
http://localhost:3000
```

## Cloud VM Hosting Process

This app can run well on a small Ubuntu VM in AWS EC2, Azure VM, DigitalOcean, Hetzner, or similar.

### 1. Create the VM

- Ubuntu 22.04 LTS or newer
- allow port `22` for SSH
- allow port `80` if using Nginx
- allow port `443` if adding HTTPS later
- allow port `3000` only if exposing the app directly

### 2. Connect

```bash
ssh <user>@<vm-public-ip>
```

### 3. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
npm -v
```

### 4. Copy the project

Option A:

```bash
git clone <your-repository-url>
cd AsyTest
```

Option B:

```bash
scp -r ./AsyTest <user>@<vm-public-ip>:~/
```

### 5. Install and build

```bash
npm install
npm run build
```

### 6. Start the app

Quick run:

```bash
PORT=3000 npm run start:prod
```

Recommended with PM2:

```bash
sudo npm install -g pm2
pm2 start dist/main.js --name async-email-control-room
pm2 save
pm2 startup
```

### 7. Put Nginx in front

Install:

```bash
sudo apt-get update
sudo apt-get install -y nginx
```

Example config:

```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 8. Verify

```bash
curl http://<vm-public-ip>/health
curl http://<vm-public-ip>/
```

Then open the dashboard in the browser and:

- save SMTP config
- test SMTP connection
- send a test email
- watch the job history and logs

## Production-Minded Notes

- SMTP config is dynamic but in-memory only
- password is accepted but never returned in API responses
- every job keeps the SMTP snapshot used at queue time
- job history helps explain retry flow clearly
- logs are structured JSON and easy to ship later
- because storage is in-memory, restarts remove all jobs and logs
- this structure is ready to evolve into Redis/BullMQ/PostgreSQL later

## Assumptions

- `3 attempts` means `3 total tries`
- no dead-letter queue is needed for this task
- default worker concurrency remains simple by design

## Future Improvements

- persist queue and history in Redis or PostgreSQL
- replace in-memory queue with BullMQ
- add authentication for SMTP and dashboard actions
- add Swagger / OpenAPI docs
- add metrics and tracing
- add log streaming with SSE or WebSocket
- add HTTPS with Nginx and Let's Encrypt
