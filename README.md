# Deploy a Full-Stack Analytics App

A professional analytics dashboard sample application built with:
- `Node.js` + `Express` backend
- `SQLite` for event persistence
- `React` + `Vite` frontend
- `Docker Compose` for local deployment

## Project overview

This repository contains two services:

- `backend/` — Express API service for ingesting analytics events and exposing aggregated metrics.
- `frontend/` — Vite-powered React dashboard that displays event volume, daily activity, and recent events.

The backend stores event records in a SQLite database under `backend/data`, while the frontend fetches metrics and event history over REST.

## Features

- Event ingestion API with structured metadata
- Aggregated event type counts
- Daily activity summaries
- Real-time frontend dashboard with event simulation
- Containerized deployment with Docker Compose

## Prerequisites

- Node.js 20+
- Docker Engine and Docker Compose (for containerized deployment)

## Local development

Install dependencies for both services:

```bash
npm run install-all
```

Start the backend and frontend together:

```bash
npm run dev
```

Open the application in your browser:

```bash
http://localhost:5173
```

## Deploy with Docker Compose

Build and launch both services in containers:

```bash
docker compose up --build
```

After startup, the dashboard is available at:

```bash
http://localhost:5173
```

## API reference

The analytics backend exposes the following endpoints:

- `POST /api/events`
  - Request body: `{ eventType: string, metadata?: object }`
  - Stores an analytics event.
- `GET /api/metrics`
  - Returns aggregated metrics by event type and daily event counts.
- `GET /api/events`
  - Returns the latest recorded events.

## Notes

- Persistent analytics data is stored in `backend/data/analytics.db`.
- The frontend uses `VITE_API_BASE` to locate the backend API.
- Use `docker compose down` to stop containers and remove the default Compose network.
