# Lab 09 — Node.js + MySQL with Docker Compose

## Objectives

- Define a multi-container app with Docker Compose
- Wire a Node.js API to MySQL using service-name DNS
- Use health checks to gate startup order
- Manage the Compose lifecycle

---

## Architecture

```
Host machine
    |
    | http://localhost:3000
    v
Node.js API container (compose-api)
    |
    | db:3306 (internal Compose network)
    v
MySQL container (compose-mysql)
    |
    v
Named volume: mysql-data
```

---

## Project Structure

```
compose/
├── compose.yaml      ← orchestration
└── api/
    ├── Dockerfile    ← builds the API image
    ├── package.json  ← dependencies
    └── server.js     ← Express API
```

All files are in this directory and ready to run.

---

## Quick Start

```bash
cd compose/
docker compose up -d --build
```

Test:

```bash
curl http://localhost:3000
```

Expected response:

```json
{
  "message": "Node.js connected to MySQL!",
  "databaseTime": "2026-11-12T..."
}
```

---

## How It Works

### compose.yaml Walkthrough

| Key                        | Purpose                                              |
| -------------------------- | ---------------------------------------------------- |
| `services`                 | Declares application containers                      |
| `build`                    | Builds image from Dockerfile + context               |
| `image`                    | Uses an existing image (MySQL)                       |
| `ports`                    | Publishes container port on the host                 |
| `environment`              | Passes env vars to the container                     |
| `depends_on`               | Expresses service dependencies                       |
| `condition: service_healthy` | Waits for health check before starting dependent   |
| `healthcheck`              | Defines how Docker checks MySQL readiness            |
| `restart`                  | Container restart policy                             |
| `volumes`                  | Declares persistent storage                          |

The `$$` in the health-check command is intentional — Compose uses `$` for variable interpolation; `$$` passes a literal `$` into the container shell.

### Why `db:3306`, Not `localhost:3307`?

Compose creates a project network with service-name DNS:

- `db` is the Compose service name
- `3306` is MySQL's container port
- `localhost` inside the API container refers to the API container itself
- A host mapping like `3307:3306` is only needed for external clients

The API does **not** need a published MySQL port.

### Why Health Checks Matter

**Without health gating:**

```yaml
depends_on:
  - db
```

Controls startup **order** but doesn't wait for MySQL to accept connections.

**With health gating:**

```yaml
depends_on:
  db:
    condition: service_healthy
```

Waits for the health check to pass before starting the API. The application should still handle connection errors — dependencies can fail after startup too.

---

## Dockerfile Explained

| Instruction         | Purpose                                         |
| ------------------- | ----------------------------------------------- |
| `FROM node:22-alpine` | Base image                                    |
| `WORKDIR /app`      | Working directory inside the image              |
| `COPY package*.json` | Copy dependency manifests first (layer caching)|
| `RUN npm install`   | Install dependencies during build               |
| `COPY . .`          | Copy application source                         |
| `EXPOSE 3000`       | Documents the listening port (doesn't publish)  |
| `CMD ["npm", "start"]` | Default command to start the app             |

---

## Lifecycle Commands

### Inspect

```bash
docker compose ps
docker compose logs -f
docker compose logs -f api
docker compose logs -f db
```

### Stop and Start

```bash
docker compose stop     # stop without removing
docker compose start    # start existing services
```

### Rebuild API After Code Changes

```bash
docker compose up -d --build api
```

Does not remove the database volume.

### Tear Down

Remove containers and network (preserves volume):

```bash
docker compose down
```

Remove containers, network, **and volume** (destroys database data):

```bash
docker compose down -v
```

> **Warning:** `docker compose down -v` permanently deletes the MySQL data volume. Do not run it against data you need.

---

## Cleanup

From this directory:

```bash
docker compose down      # preserves data
docker compose down -v   # deletes everything including data
```
