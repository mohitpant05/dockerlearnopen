# Lab 06 — Named Volumes and Data Persistence

## Objectives

- Create and inspect Docker named volumes
- Prove data survives container removal
- Understand the difference between container layer and volume storage

---

## Why Volumes?

A container's writable layer is tied to that container. Remove the container → data gone.

A **named volume** is managed by Docker and exists independently of any container.

---

## Create and Inspect a Volume

```bash
docker volume create app-data
docker volume inspect app-data
docker volume ls
```

---

## Write Data into the Volume

Start a temporary Alpine container with the volume at `/data`:

```bash
docker run -it --name volume-lab \
  --mount source=app-data,target=/data \
  alpine:latest sh
```

Inside:

```bash
echo "Docker volume persistence test" > /data/test.txt
cat /data/test.txt
exit
```

---

## Prove Persistence

Remove the container:

```bash
docker rm volume-lab
```

Create a new container with the same volume:

```bash
docker run --rm \
  --mount source=app-data,target=/data \
  alpine:latest cat /data/test.txt
```

Expected output:

```
Docker volume persistence test
```

The file survived because the **volume** was not removed — only the container was.

---

## Storage Comparison

| Storage Location          | Survives Container Removal? | Managed By              |
| ------------------------- | --------------------------- | ----------------------- |
| Container writable layer  | No                          | Docker/container lifecycle |
| Named volume              | Yes (unless explicitly removed) | Docker               |
| Bind-mounted host dir     | Yes (unless host files removed) | Host filesystem/user |

> **Production lesson:** A named volume is not a backup. It can be deleted, corrupted, or lost with its underlying storage. Production databases need independent backups and tested restore procedures.

---

## Cleanup

Remove the volume **only if you no longer need it**:

```bash
docker volume rm app-data
```
