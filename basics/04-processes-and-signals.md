# Lab 04 — Processes Inside Containers & Graceful Shutdown

## Objectives

- Explore processes inside a running container
- Understand PID 1, signal handling, and graceful shutdown
- Use `docker top`, `/proc`, and the `--init` flag

> **Prerequisite:** `nginx-lab` container from [Lab 01](01-running-containers.md)

---

## Part 1 — Processes Inside a Container

### Interactive Shell

```bash
docker exec -it nginx-lab /bin/bash
```

Many tools are missing in minimal images:

```bash
netstat   # not found
ps        # not found
lsof      # not found
```

This is normal — container images ship only what the app needs.

### OS and Kernel Info (Inside Container)

```bash
uname -a
cat /etc/os-release
```

On Docker Desktop: Debian userspace + `aarch64` LinuxKit kernel (from Docker Desktop's Linux VM, not the Debian image).

```bash
exit
```

### Inspect Processes from Host

```bash
docker top nginx-lab
docker top nginx-lab -eo pid,ppid,user,args
```

`docker top` queries through the Docker engine — no `ps` needed inside the container.

### Inspect via /proc

```bash
docker exec nginx-lab cat /proc/1/status
docker exec nginx-lab cat /proc/1/cmdline
docker exec nginx-lab readlink /proc/1/exe
docker exec nginx-lab sh -c 'ls /proc | grep -E "^[0-9]+$"'
```

### Installing Debug Tools (Optional)

For Debian-based containers:

```bash
apt-get update
apt-get install -y procps iproute2 lsof
```

Then:

```bash
ps aux
ps -ef
top
ss -tulpn
lsof -i
```

> **Note:** Installing tools changes only that container's writable layer. For repeatable debugging, build a purpose-built debug image via Dockerfile.

---

## Part 2 — PID 1, Signals, and Graceful Shutdown

The main process runs as **PID 1** in the container's PID namespace. If PID 1 exits, the container stops.

For Nginx: PID 1 is the master process, which manages worker processes.

### docker stop

```bash
docker stop nginx-lab
docker start nginx-lab
```

`docker stop` sends `SIGTERM` first. If the process doesn't exit within the grace period, sends `SIGKILL`.

- `SIGTERM` — can be handled by the application
- `SIGKILL` — cannot be caught or ignored

### Sending Signals Directly

```bash
docker kill --signal=SIGTERM nginx-lab
```

Default `docker kill` sends `SIGKILL`:

```bash
docker kill nginx-lab
```

### Configure Stop Timeout

At creation:

```bash
docker run -d --name signal-lab --stop-timeout 15 nginx:latest
```

Per operation:

```bash
docker stop --time 15 signal-lab
```

Set explicitly when the application needs a predictable shutdown window.

### The --init Flag

```bash
docker run --init -d nginx:latest
```

A small init process that:
- Forwards signals to child processes
- Reaps orphaned (zombie) child processes

> **Production lesson:** Applications should still implement graceful shutdown — stop accepting work, finish in-flight requests, close DB connections, exit before timeout.

---

## Cleanup

```bash
docker rm -f signal-lab   # only if created
```
