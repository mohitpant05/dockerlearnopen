# Lab 01 — Running Your First Container

## Objectives

- Verify Docker installation
- Run an Nginx container with port publishing
- Manage container lifecycle (start, stop, restart, remove)

---

## Environment and Lab Conventions

- **Host:** macOS with Docker Desktop
- **Container OS:** Linux
- **Example images:** Nginx, Alpine, Node.js, MySQL
- Docker Desktop runs containers inside its Linux environment/VM — a container's kernel info is the LinuxKit kernel, not macOS

Check Docker installation:

```bash
docker --version
docker version
docker info
```

List containers and images:

```bash
docker ps
docker ps -a
docker images
```

### Lab Resource Names

| Resource                  | Name                        |
| ------------------------- | --------------------------- |
| Nginx container           | `nginx-lab`                 |
| User-defined bridge       | `app-network`               |
| Network test container    | `network-client`            |
| Named volume              | `app-data`                  |
| Bind-mount container      | `bind-mount-lab`            |
| MySQL volume              | `mysql-lab-data`            |
| MySQL container           | `mysql-lab`                 |
| Compose project directory | `~/docker-labs/compose-lab` |

Commands are written for `zsh` or `bash`. Run on the Mac terminal unless explicitly stated otherwise.

---

## Run Nginx in Detached Mode

Start an Nginx container and publish container port 80 on host port 8080:

```bash
docker run --name nginx-lab -p 8080:80 -d nginx:latest
```

Test from the host:

```bash
curl localhost:8080
```

### What the Flags Mean

| Flag             | Purpose                              |
| ---------------- | ------------------------------------ |
| `docker run`     | Creates and starts a container       |
| `--name`         | Assigns a human-readable name        |
| `-p 8080:80`     | Maps host port 8080 → container 80   |
| `-d`             | Runs container in background         |
| `nginx:latest`   | Image to create the container from   |

---

## Container Lifecycle Commands

```bash
docker ps              # running containers
docker ps -a           # all containers (including stopped)
docker stop nginx-lab
docker start nginx-lab
docker restart nginx-lab
docker rm nginx-lab    # requires stopped container, or use -f
```

> **Tip:** Don't remove the `nginx-lab` container until you finish labs that depend on it.

---

## Cleanup

```bash
docker stop nginx-lab
docker rm nginx-lab
```
