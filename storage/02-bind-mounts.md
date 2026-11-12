# Lab 07 — Bind Mounts

## Objectives

- Mount a host directory into a container
- See live file changes without rebuilding or restarting
- Understand read-only vs read-write mounts
- Compare named volumes and bind mounts

---

## Create a Host Directory and HTML File

On the Mac host:

```bash
mkdir -p ~/docker-labs/site

cat > ~/docker-labs/site/index.html <<'EOF'
<h1>Hello from a Docker bind mount!</h1>
<p>This file lives on my Mac.</p>
EOF
```

---

## Mount Read-Only into Nginx

```bash
docker run -d \
  --name bind-mount-lab \
  -p 8082:80 \
  --mount type=bind,source="$HOME/docker-labs/site",target=/usr/share/nginx/html,readonly \
  nginx:latest
```

Test:

```bash
curl http://localhost:8082
```

---

## Live File Updates

Edit the host file:

```bash
echo '<h1>Updated directly from my Mac!</h1>' > ~/docker-labs/site/index.html
```

Request again:

```bash
curl http://localhost:8082
```

Updated content served instantly — no rebuild, no restart. Host directory is mounted into the container; both paths reference the same files.

---

## Read-Only vs Read-Write

The `readonly` option prevents the container from writing through that mount. The host can still edit its own file.

Read-write example (separate container):

```bash
docker run -d \
  --name bind-mount-writable \
  -p 8083:80 \
  --mount type=bind,source="$HOME/docker-labs/site",target=/usr/share/nginx/html \
  nginx:latest
```

Without `readonly`, the mount is read-write by default (subject to filesystem permissions).

---

## Named Volume vs Bind Mount

| Feature           | Named Volume                    | Bind Mount                       |
| ----------------- | ------------------------------- | -------------------------------- |
| Path selection    | Docker-managed                  | Explicit host path               |
| Host-side access  | Possible, but Docker-managed    | Direct access to chosen path     |
| Common use        | Database/persistent app data    | Source code, configs, dev files  |
| Lifecycle         | Independent of container        | Independent; host path remains   |
| Portability       | Easy to declare in Compose      | Depends on host directory layout |

> **Note:** On Docker Desktop for Mac, bind mounts are mediated between macOS and the Linux VM. Use real absolute paths (`$HOME/...`) and be aware that file-sharing settings can affect performance.

---

## Cleanup

```bash
docker rm -f bind-mount-lab bind-mount-writable
```
