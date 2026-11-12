# Lab 02 — Container Logs and Resource Usage

## Objectives

- Read and follow container logs
- Monitor CPU, memory, network, and I/O usage
- Run a resource-limited container

> **Prerequisite:** `nginx-lab` container from [Lab 01](01-running-containers.md)

---

## Reading Logs

```bash
docker logs nginx-lab
```

Follow logs in real time:

```bash
docker logs -f nginx-lab
```

Stop following with `Ctrl+C`. This exits the log stream — it does **not** stop the container.

---

## Resource Stats

```bash
docker stats               # live, all containers
docker stats --no-stream   # snapshot
docker stats nginx-lab     # single container
```

Formatted view:

```bash
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.PIDs}}"
```

Optional continuous refresh (requires `watch`):

```bash
watch -n 2 'docker stats --no-stream'
```

### Metrics Explained

| Metric            | What It Shows                                      |
| ----------------- | -------------------------------------------------- |
| **CPU %**         | CPU consumption at sampling time                   |
| **MEM USAGE / LIMIT** | Memory used and applicable limit              |
| **MEM %**         | Memory usage as percentage of limit                |
| **NET I/O**       | Network bytes received / transmitted               |
| **BLOCK I/O**     | Bytes read / written to block devices              |
| **PIDS**          | Process/thread count inside the container          |

A container's displayed memory limit is not necessarily reserved exclusively for it.

---

## Resource-Limited Container (Optional)

```bash
docker run -d \
  --name nginx-limited \
  --memory=256m \
  --cpus=0.5 \
  -p 8081:80 \
  nginx:latest
```

Creates a container with 256 MiB memory limit and half-CPU quota. Reference exercise — skip if not needed.

---

## Cleanup

```bash
docker rm -f nginx-limited   # only if created
```
