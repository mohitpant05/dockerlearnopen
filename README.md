# Docker Hands-On Lab: From Containers to Compose

A practical, command-driven Docker learning path. Clone, follow the labs in order, and build real muscle memory with containers, networking, storage, and multi-service orchestration.

**Environment:** macOS + Docker Desktop, Linux containers.

---

## Learning Path

| #  | Lab | Topic | Directory |
| -- | --- | ----- | --------- |
| 01 | [Running Containers](basics/01-running-containers.md) | Run Nginx, port publishing, lifecycle commands | `basics/` |
| 02 | [Logs & Stats](basics/02-logs-and-stats.md) | Container logs, resource monitoring, limits | `basics/` |
| 03 | [Inspect & Metadata](basics/03-inspect-and-metadata.md) | `docker inspect`, Go templates, events | `basics/` |
| 04 | [Processes & Signals](basics/04-processes-and-signals.md) | PID 1, `exec`, signal handling, graceful shutdown | `basics/` |
| 05 | [Networking](networking/01-bridges-and-dns.md) | Bridge networks, DNS, EXPOSE vs -p | `networking/` |
| 06 | [Named Volumes](storage/01-named-volumes.md) | Volume persistence, container layer vs volume | `storage/` |
| 07 | [Bind Mounts](storage/02-bind-mounts.md) | Host dir mounts, live reload, read-only | `storage/` |
| 08 | [MySQL Persistence](storage/03-mysql-persistence.md) | Database survival across container replacement | `storage/` |
| 09 | [Compose App](compose/) | Node.js + MySQL multi-container stack | `compose/` |

---

## Quick Start — Compose Lab

The `compose/` directory is a runnable project:

```bash
cd compose/
docker compose up -d --build
curl http://localhost:3000
```

---

## Repo Structure

```
DockerLearnOpen/
├── README.md                          ← you are here
├── basics/
│   ├── 01-running-containers.md
│   ├── 02-logs-and-stats.md
│   ├── 03-inspect-and-metadata.md
│   └── 04-processes-and-signals.md
├── networking/
│   └── 01-bridges-and-dns.md
├── storage/
│   ├── 01-named-volumes.md
│   ├── 02-bind-mounts.md
│   └── 03-mysql-persistence.md
├── compose/
│   ├── README.md                      ← lab walkthrough
│   ├── compose.yaml                   ← runnable
│   ├── api/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── server.js
└── cheatsheet.md                      ← all commands in one place
```

---

## Key Lessons

1. **A container is not a VM.** Containers isolate processes and share the host kernel.
2. **PID 1 matters.** Docker tracks the main process — correct signal handling and graceful shutdown are essential.
3. **Use service names, not IPs.** Container IPs are ephemeral. Use Docker DNS on user-defined and Compose networks.
4. **`EXPOSE` does not publish ports.** Use `-p` or Compose `ports` for host access.
5. **Keep internal traffic internal.** Don't publish database ports unless an external client needs them.
6. **Persist state outside containers.** Named volumes for databases, bind mounts for dev files.
7. **A volume is not a backup.** Back up independently and test restores.
8. **Running is not ready.** Use health checks. Build connection resilience into applications.
9. **Never commit secrets.** Passwords here are for local labs only. Use proper secrets management in production.
10. **Don't casually prune storage.** Volume removal is irreversible.

---

## Full Cleanup

Only run after you no longer need lab data:

```bash
# standalone containers
docker rm -f nginx-lab nginx-limited signal-lab network-client \
  bind-mount-lab bind-mount-writable nginx-published nginx-random-port \
  volume-lab mysql-lab

# network and volumes
docker network rm app-network
docker volume rm app-data mysql-lab-data

# compose (from compose/ directory)
cd compose/
docker compose down -v
```

---

## Cheatsheet

See [cheatsheet.md](cheatsheet.md) for all Docker commands in one place.
