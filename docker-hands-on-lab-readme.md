# Docker Hands-On Lab: Containers, Networking, Storage & Compose

A practical, command-driven Docker learning log covering the labs
completed so far. The examples use Docker Desktop on macOS and
Linux-based containers.

> **Scope:** This document records the commands, configuration,
> observations, and concepts covered in the hands-on sessions. Some
> commands were executed and verified; others were explored as reference
> commands or proposed exercises. Those distinctions are called out so
> this README does not claim an unverified result.

## Table of contents

1.  [Environment and lab
    conventions](#1-environment-and-lab-conventions)
2.  [Running an Nginx container](#2-running-an-nginx-container)
3.  [Container logs and resource
    usage](#3-container-logs-and-resource-usage)
4.  [Inspecting container metadata](#4-inspecting-container-metadata)
5.  [Processes inside a container](#5-processes-inside-a-container)
6.  [PID 1, signals, and graceful
    shutdown](#6-pid-1-signals-and-graceful-shutdown)
7.  [Docker networking](#7-docker-networking)
8.  [Named volumes and data
    persistence](#8-named-volumes-and-data-persistence)
9.  [Bind mounts](#9-bind-mounts)
10. [MySQL with persistent storage](#10-mysql-with-persistent-storage)
11. [Node.js + MySQL with Docker
    Compose](#11-nodejs--mysql-with-docker-compose)
12. [Command reference](#12-command-reference)
13. [Important lessons and production
    considerations](#13-important-lessons-and-production-considerations)
14. [Cleanup](#14-cleanup)

------------------------------------------------------------------------

## 1. Environment and lab conventions

The practical environment used in the sessions:

-   Host: macOS with Docker Desktop.
-   Container operating system: Linux.
-   Example application containers: Nginx, Alpine, Node.js, and MySQL.
-   Docker Desktop runs containers inside its Linux environment/VM. A
    container's Linux kernel information is therefore not the macOS host
    kernel.

Check the Docker installation:

``` bash
docker --version
docker version
docker info
```

List containers and images:

``` bash
docker ps
docker ps -a
docker images
```

The examples use these lab names:

  Resource                    Name
  --------------------------- -----------------------------
  Nginx container             `nginx-lab`
  User-defined bridge         `app-network`
  Network test container      `network-client`
  Named volume                `app-data`
  Bind-mount container        `bind-mount-lab`
  MySQL volume                `mysql-lab-data`
  MySQL container             `mysql-lab`
  Compose project directory   `~/docker-labs/compose-lab`

Commands are written for a shell such as `zsh` or `bash`. Run host
commands on the Mac terminal unless a section explicitly says to run
them inside a container.

## 2. Running an Nginx container

Start an Nginx container in detached mode and publish container port 80
on host port 8080:

``` bash
docker run --name nginx-lab -p 8080:80 -d nginx:latest
```

Test it from the host:

``` bash
curl localhost:8080
```

What the flags mean:

-   `docker run`: creates and starts a container.
-   `--name nginx-lab`: assigns a human-readable container name.
-   `-p 8080:80`: maps host port `8080` to container port `80`.
-   `-d`: runs the container in the background.
-   `nginx:latest`: image used to create the container.

Useful lifecycle commands:

``` bash
docker ps
docker ps -a
docker stop nginx-lab
docker start nginx-lab
docker restart nginx-lab
docker rm nginx-lab
```

`docker rm` requires a stopped container unless `-f` is used. Do not
remove the lab container until you have finished exercises that depend
on it.

## 3. Container logs and resource usage

Read the container's logs:

``` bash
docker logs nginx-lab
```

Follow logs as they are produced:

``` bash
docker logs -f nginx-lab
```

Stop following the output with `Ctrl+C`. This exits the log stream; it
does not stop the container.

Inspect resource usage:

``` bash
docker stats
docker stats --no-stream
docker stats nginx-lab
docker stats --no-stream nginx-lab
```

A formatted view:

``` bash
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.PIDs}}"
```

An optional continuously refreshed view on systems where `watch` is
installed:

``` bash
watch -n 2 'docker stats --no-stream'
```

Metrics:

-   **CPU %:** CPU consumption at the time of sampling.
-   **MEM USAGE / LIMIT:** memory currently used and the applicable
    memory limit.
-   **MEM %:** memory usage as a percentage of the limit.
-   **NET I/O:** network bytes received and transmitted.
-   **BLOCK I/O:** bytes read from and written to block devices.
-   **PIDS:** process/thread count reported for the container.

A container's displayed memory limit is not necessarily memory reserved
exclusively for it. Resource limits can be configured when starting a
container:

``` bash
docker run -d \
  --name nginx-limited \
  --memory=256m \
  --cpus=0.5 \
  -p 8081:80 \
  nginx:latest
```

This creates a separate example container with a 256 MiB memory limit
and a CPU quota equivalent to half a CPU. It is a reference exercise; do
not create it if you do not need the extra container.

## 4. Inspecting container metadata

`docker inspect` returns detailed JSON configuration and runtime state:

``` bash
docker inspect nginx-lab
```

Use Go templates to retrieve individual fields:

``` bash
docker inspect -f '{{.Id}}' nginx-lab
docker inspect -f '{{.State.Status}}' nginx-lab
docker inspect -f '{{.RestartCount}}' nginx-lab
docker inspect -f '{{.Config.Hostname}}' nginx-lab
docker inspect -f '{{.Config.Image}}' nginx-lab
docker inspect -f '{{.HostConfig.RestartPolicy.Name}}' nginx-lab
docker inspect -f '{{.State.StartedAt}}' nginx-lab
docker inspect -f '{{json .NetworkSettings.Networks}}' nginx-lab
```

Example: retrieve the IP address from the container's attached networks:

``` bash
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' nginx-lab
```

Example: print network details using `range` and `printf`:

``` bash
docker inspect -f '{{range $name, $config := .NetworkSettings.Networks}}{{printf "Network: %s\nNetwork ID: %s\nIP Address: %s\nGateway: %s\n\n" $name $config.NetworkID $config.IPAddress $config.Gateway}}{{end}}' nginx-lab
```

Go-template reminders:

-   `{{ ... }}` marks a template expression.
-   `.State.Status` accesses a nested field. Field names are
    case-sensitive.
-   `range` iterates over a map or collection.
-   `end` closes a `range` or conditional block.
-   `printf` formats text. `%s` is a formatting placeholder inside
    `printf`; it is not independently interpreted by the template.

The restart count is Docker's recorded automatic restart count, not a
complete history of every manual stop/start operation. For events
occurring while listening:

``` bash
docker events
```

`docker events` is a live event stream, not a permanent historical audit
log.

## 5. Processes inside a container

Open a shell inside the Nginx container:

``` bash
docker exec -it nginx-lab /bin/bash
```

Inside the container, commands such as these may be unavailable in a
minimal image:

``` bash
netstat
ps
lsof
ss
htop
```

This is normal. A container image often contains only the tools required
to run its main application.

Inspect basic OS and kernel information:

``` bash
uname -a
cat /etc/os-release
```

In the observed Docker Desktop environment, the container reported
Debian 13 (trixie) userspace and an `aarch64` LinuxKit kernel. The
kernel is provided by Docker Desktop's Linux environment, not by the
Debian container image itself.

Exit the container shell:

``` bash
exit
```

Inspect container processes from the Docker host:

``` bash
docker top nginx-lab
docker top nginx-lab -eo pid,ppid,user,args
```

`docker top` queries process information through the Docker host/engine;
it does not require `ps` to be installed inside the container.

Inspect process information through `/proc`:

``` bash
docker exec nginx-lab cat /proc/1/status
docker exec nginx-lab cat /proc/1/cmdline
docker exec nginx-lab readlink /proc/1/exe
docker exec nginx-lab sh -c 'ls /proc | grep -E "^[0-9]+$"'
```

For a Debian-based disposable/debug container, utilities can be
installed with:

``` bash
apt-get update
apt-get install -y procps iproute2 lsof
```

After installing those packages, the corresponding commands include:

``` bash
ps aux
ps -ef
top
ss -tulpn
lsof -i
```

Installing debugging utilities interactively changes only that
container's writable layer. For repeatable debugging, create a
purpose-built debug image or add the tools in a Dockerfile rather than
relying on manual installation in a production container.

## 6. PID 1, signals, and graceful shutdown

The main process in a container's PID namespace normally runs as PID 1.
Docker monitors the container's main process. If that process exits, the
container stops.

For Nginx, the main process is typically the master process, which
manages worker processes.

Docker stop behavior:

``` bash
docker stop nginx-lab
docker start nginx-lab
```

`docker stop` sends the configured stop signal (normally `SIGTERM`) and,
if the process does not exit within the grace period, sends `SIGKILL`.

`SIGTERM` can be handled by the application. `SIGKILL` cannot be caught
or ignored.

Send a signal directly:

``` bash
docker kill --signal=SIGTERM nginx-lab
```

By default, `docker kill` sends `SIGKILL`:

``` bash
docker kill nginx-lab
```

Configure a stop timeout when creating a container:

``` bash
docker run -d --name signal-lab --stop-timeout 15 nginx:latest
```

Override the timeout for a particular stop operation:

``` bash
docker stop --time 15 signal-lab
```

Docker's default stop timeout can differ by environment and
configuration; set it explicitly when the application needs a
predictable shutdown window.

Run a container with a small init process:

``` bash
docker run --init -d nginx:latest
```

The init process helps forward signals and reap orphaned child
processes. Applications should still implement their own graceful
shutdown behavior where needed: stop accepting new work, finish or
safely cancel in-flight work, close database connections, and exit
before the timeout.

## 7. Docker networking

### 7.1 List and inspect networks

``` bash
docker network ls
docker network inspect bridge
```

Docker network drivers introduced in the lab:

  -----------------------------------------------------------------------
  Driver                              Typical purpose
  ----------------------------------- -----------------------------------
  `bridge`                            Networking for containers on one
                                      Docker host

  `host`                              Shares the host network namespace
                                      where supported

  `none`                              Disables normal container
                                      networking

  `overlay`                           Multi-host container networking,
                                      commonly with Swarm

  `macvlan`                           Gives containers a presence on a
                                      physical network using MAC
                                      addresses
  -----------------------------------------------------------------------

### 7.2 Create a user-defined bridge

``` bash
docker network create --driver bridge app-network
```

Inspect it:

``` bash
docker network inspect app-network
```

Attach the existing Nginx container to it:

``` bash
docker network connect app-network nginx-lab
```

Inspect the container's network attachments:

``` bash
docker inspect -f '{{json .NetworkSettings.Networks}}' nginx-lab
```

A container can be connected to more than one network. This is useful
when an application must communicate with separate groups of services.

Disconnect a container:

``` bash
docker network disconnect app-network nginx-lab
```

Reconnect it:

``` bash
docker network connect app-network nginx-lab
```

### 7.3 Test service-name DNS on a user-defined bridge

Start a disposable Alpine shell on the same network:

``` bash
docker run --rm -it --name network-client --network app-network alpine:latest sh
```

Inside Alpine:

``` sh
ping -c 3 nginx-lab
wget -qO- http://nginx-lab
exit
```

The key concept is that user-defined bridge networks provide Docker's
embedded DNS-based name resolution. Containers on the same user-defined
bridge can generally reach one another by container name or network
alias.

A separate one-shot HTTP test:

``` bash
docker run --rm --network app-network alpine:latest wget -qO- http://nginx-lab
```

Disconnect and reconnect exercise:

``` bash
docker network disconnect app-network nginx-lab
docker network inspect app-network
docker network connect app-network nginx-lab
docker run --rm --network app-network alpine:latest wget -qO- http://nginx-lab
```

### 7.4 Default bridge vs user-defined bridge

-   The default `bridge` network does not provide the same automatic
    container-name DNS behavior as a user-defined bridge.
-   A user-defined bridge provides automatic DNS resolution and better
    isolation between application groups.
-   Containers on different bridge networks are isolated by default.
    They can still communicate if deliberately connected to a shared
    network, or through other explicitly configured paths.

### 7.5 `EXPOSE` vs publishing ports

`EXPOSE` in a Dockerfile documents the port an application listens on.
It does **not** publish that port to the host.

Publish a port with `-p`:

``` bash
docker run -d --name nginx-published -p 8081:80 nginx:latest
```

Publish exposed ports dynamically with `-P`:

``` bash
docker run -d --name nginx-random-port -P nginx:latest
docker port nginx-random-port
```

The distinction:

-   `EXPOSE 80`: image metadata/documentation.
-   `-p 8080:80`: publishes container port 80 on host port 8080.
-   `-P`: publishes exposed ports on dynamically assigned host ports.

## 8. Named volumes and data persistence

A container's writable layer is tied to that container. If the container
is removed, data stored only in that layer is removed with it.

A named volume is managed by Docker and exists independently of the
container.

### 8.1 Create and inspect a volume

``` bash
docker volume create app-data
docker volume inspect app-data
docker volume ls
```

### 8.2 Write data into the volume

Start a temporary Alpine container with the named volume mounted at
`/data`:

``` bash
docker run -it --name volume-lab \
  --mount source=app-data,target=/data \
  alpine:latest sh
```

Inside the container:

``` sh
echo "Docker volume persistence test" > /data/test.txt
cat /data/test.txt
exit
```

### 8.3 Remove the container and reuse the volume

``` bash
docker rm volume-lab
```

Create another container using the same volume:

``` bash
docker run --rm \
  --mount source=app-data,target=/data \
  alpine:latest cat /data/test.txt
```

Expected output:

``` text
Docker volume persistence test
```

The file remains because the named volume was not removed.

### 8.4 Named volume vs container writable layer

  ------------------------------------------------------------------------
  Storage location       Survives container removal? Managed by
  --------------------- ---------------------------- ---------------------
  Container writable                              No Docker/container
  layer                                              lifecycle

  Named volume                Yes, unless explicitly Docker
                                             removed 

  Bind-mounted host       Yes, unless host files are Host filesystem/user
  directory                                  removed 
  ------------------------------------------------------------------------

A named volume is not a backup. It can still be deleted, corrupted, or
lost with its underlying storage. Production databases need independent
backups and tested restore procedures.

## 9. Bind mounts

A bind mount maps a specific host path into a container. It is
especially useful for local development, source-code sharing, and
configuration files.

### 9.1 Create a host directory and HTML file

Run on the Mac host:

``` bash
mkdir -p ~/docker-labs/site

cat > ~/docker-labs/site/index.html <<'EOF'
<h1>Hello from a Docker bind mount!</h1>
<p>This file lives on my Mac.</p>
EOF
```

### 9.2 Mount the directory read-only into Nginx

``` bash
docker run -d \
  --name bind-mount-lab \
  -p 8082:80 \
  --mount type=bind,source="$HOME/docker-labs/site",target=/usr/share/nginx/html,readonly \
  nginx:latest
```

Test:

``` bash
curl http://localhost:8082
```

### 9.3 Modify the host file

``` bash
echo '<h1>Updated directly from my Mac!</h1>' > ~/docker-labs/site/index.html
```

Request the page again:

``` bash
curl http://localhost:8082
```

The updated content should be served without rebuilding the image or
restarting the container. The host directory is mounted into the
container, so both paths refer to the same underlying files.

### 9.4 Read-only vs read-write bind mounts

The `readonly` option prevents the container from writing through that
mount. The host can still edit its own file.

A read-write example (separate container):

``` bash
docker run -d \
  --name bind-mount-writable \
  -p 8083:80 \
  --mount type=bind,source="$HOME/docker-labs/site",target=/usr/share/nginx/html \
  nginx:latest
```

Without `readonly`, the mount is read-write by default, subject to
filesystem permissions.

### 9.5 Named volume vs bind mount

  -----------------------------------------------------------------------
  Feature                 Named volume            Bind mount
  ----------------------- ----------------------- -----------------------
  Path selection          Docker-managed          Explicit host path

  Host-side access        Possible, but location  Direct access to
                          is Docker-managed       selected path

  Common use              Database and persistent Source code, configs,
                          application data        development files

  Lifecycle               Independent of          Independent of
                          container               container; host path
                                                  remains

  Portability             Usually easier to       Depends on host
                          declare in Compose      directory layout
  -----------------------------------------------------------------------

On Docker Desktop for Mac, bind mounts are mediated by Docker Desktop
between macOS and its Linux environment. Use a real absolute host path
(as in `$HOME/...`) and be aware that file-sharing settings and
filesystem performance can affect behavior.

## 10. MySQL with persistent storage

This lab demonstrates that a database survives container replacement
when its data directory is stored in a named volume.

> **Local lab credentials only:** The password below is deliberately
> simple for this exercise. Do not use it in production or commit real
> credentials to Git.

### 10.1 Create a named volume

``` bash
docker volume create mysql-lab-data
```

### 10.2 Start MySQL 8.0

``` bash
docker run -d \
  --name mysql-lab \
  -e MYSQL_ROOT_PASSWORD='LabRoot123!' \
  -e MYSQL_DATABASE=docker_lab \
  -p 3307:3306 \
  --mount source=mysql-lab-data,target=/var/lib/mysql \
  mysql:8.0
```

The mapping `3307:3306` makes MySQL reachable from the Mac on port 3307.
The Node.js-to-MySQL Compose example later does not need to publish the
database port because the services communicate over their internal
network.

### 10.3 Wait for MySQL readiness

``` bash
docker logs -f mysql-lab
```

Wait for the MySQL log message indicating that it is ready for
connections, then press `Ctrl+C` to stop following logs. This does not
stop MySQL.

### 10.4 Create a table and insert data

``` bash
docker exec -it mysql-lab mysql -uroot -p
```

Enter the local lab password:

``` text
LabRoot123!
```

Run SQL inside the MySQL client:

``` sql
USE docker_lab;

CREATE TABLE employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    role VARCHAR(100)
);

INSERT INTO employees (name, role)
VALUES
('Mohit', 'Backend Engineer'),
('Alex', 'DevOps Engineer'),
('Sam', 'Platform Engineer');

SELECT * FROM employees;
```

Exit the MySQL client:

``` sql
exit;
```

### 10.5 Verify the volume mount

``` bash
docker inspect mysql-lab \
  --format '{{json .Mounts}}'
```

Check for:

-   `Type`: `volume`
-   `Name`: `mysql-lab-data`
-   `Destination`: `/var/lib/mysql`

### 10.6 Remove the container, not the volume

``` bash
docker rm -f mysql-lab
```

Do **not** run `docker volume rm mysql-lab-data` before the persistence
test.

### 10.7 Recreate MySQL using the same volume

``` bash
docker run -d \
  --name mysql-lab \
  -e MYSQL_ROOT_PASSWORD='LabRoot123!' \
  -p 3307:3306 \
  --mount source=mysql-lab-data,target=/var/lib/mysql \
  mysql:8.0
```

The `MYSQL_DATABASE` initialization variable is omitted on purpose: the
existing database is already stored in the volume. The official MySQL
image's initialization variables apply when initializing a new, empty
data directory; they do not recreate or reset an existing database.

Wait for MySQL to become ready, then reconnect:

``` bash
docker logs -f mysql-lab
docker exec -it mysql-lab mysql -uroot -p
```

Run:

``` sql
USE docker_lab;
SELECT * FROM employees;
```

The three inserted records should still exist. This verifies that the
data was persisted outside the deleted container.

## 11. Node.js + MySQL with Docker Compose

Docker Compose lets us define and operate a multi-container application
from one YAML file.

The lab stack:

``` text
Host machine
    |
    | http://localhost:3000
    v
Node.js API container
    |
    | db:3306 (internal Compose network)
    v
MySQL container
    |
    v
Named volume: mysql-data
```

### 11.1 Create the project structure

``` bash
mkdir -p ~/docker-labs/compose-lab
cd ~/docker-labs/compose-lab

mkdir api
```

Expected structure:

``` text
compose-lab/
├── compose.yaml
└── api/
    ├── Dockerfile
    ├── package.json
    └── server.js
```

### 11.2 Create `api/package.json`

``` json
{
  "name": "docker-compose-lab",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.21.2",
    "mysql2": "^3.14.0"
  }
}
```

### 11.3 Create `api/server.js`

``` javascript
const express = require("express");
const mysql = require("mysql2/promise");

const app = express();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "db",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "docker_lab",
  waitForConnections: true,
  connectionLimit: 10
});

app.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS db_time");

    res.json({
      message: "Node.js connected to MySQL!",
      databaseTime: rows[0].db_time
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database unavailable" });
  }
});

app.listen(3000, "0.0.0.0", () => {
  console.log("API listening on port 3000");
});
```

The API listens on `0.0.0.0` so it is reachable through the container's
network interface. Binding only to `localhost` inside the container
would prevent normal access from outside that container.

### 11.4 Create `api/Dockerfile`

``` dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

What the instructions do:

-   `FROM`: selects the base image.
-   `WORKDIR`: sets the working directory inside the image.
-   `COPY package*.json ./`: copies dependency manifests first.
-   `RUN npm install`: installs dependencies while building the image.
-   `COPY . .`: copies the application source.
-   `EXPOSE 3000`: documents the application's listening port; it does
    not publish the port.
-   `CMD`: provides the default command to start the application.

### 11.5 Create root-level `compose.yaml`

``` yaml
services:
  api:
    build:
      context: ./api
    container_name: compose-api
    ports:
      - "3000:3000"
    environment:
      DB_HOST: db
      DB_USER: root
      DB_PASSWORD: ComposeLab123!
      DB_NAME: docker_lab
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: mysql:8.0
    container_name: compose-mysql
    environment:
      MYSQL_ROOT_PASSWORD: ComposeLab123!
      MYSQL_DATABASE: docker_lab
    volumes:
      - mysql-data:/var/lib/mysql
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin ping -h 127.0.0.1 -uroot -p\"$$MYSQL_ROOT_PASSWORD\" --silent"]
      interval: 5s
      timeout: 5s
      retries: 10
    restart: unless-stopped

volumes:
  mysql-data:
```

Configuration concepts:

-   `services`: declares the application containers.
-   `build`: builds an image from a Dockerfile and build context.
-   `image`: uses an existing image.
-   `ports`: publishes a container port on the host.
-   `environment`: passes environment variables to a container.
-   `depends_on`: expresses service dependencies.
-   `condition: service_healthy`: waits for the dependency's health
    check to report healthy before starting the dependent service.
-   `healthcheck`: defines how Docker checks whether the MySQL service
    is ready.
-   `restart`: sets the container restart policy.
-   `volumes`: declares persistent storage.

The `$$` in the health-check command is intentional. Compose uses `$`
for variable interpolation; `$$` passes a literal `$` into the container
command so the shell inside the container can expand
`MYSQL_ROOT_PASSWORD`.

### 11.6 Start the application

From the directory containing `compose.yaml`:

``` bash
docker compose up -d --build
```

This builds the API image, pulls MySQL if needed, creates the Compose
network and named volume, and starts the services. The API dependency is
gated on the MySQL health check.

Inspect services:

``` bash
docker compose ps
```

Follow logs:

``` bash
docker compose logs -f
```

Follow only the API logs:

``` bash
docker compose logs -f api
```

Follow only the database logs:

``` bash
docker compose logs -f db
```

Test the API from the Mac:

``` bash
curl http://localhost:3000
```

Expected response shape (the timestamp will differ):

``` json
{
  "message": "Node.js connected to MySQL!",
  "databaseTime": "2026-11-12T..."
}
```

### 11.7 Why `db:3306`, not `localhost:3307`?

Compose creates a project network and provides service-name DNS
resolution on that network.

-   `db` is the Compose service name.
-   `3306` is MySQL's container port.
-   `localhost` inside the API container refers to the API container
    itself.
-   A host mapping such as `3307:3306` is only needed if the host or
    another external client needs to connect through that host port.

The API does not need a published MySQL port to communicate with MySQL.

### 11.8 Why health checks matter

Short-form dependency ordering:

``` yaml
depends_on:
  - db
```

This controls startup order but does not wait for MySQL to become ready
to accept connections.

Health-gated dependency:

``` yaml
depends_on:
  db:
    condition: service_healthy
```

This waits for the configured MySQL health check to pass before starting
the API. The application should still implement connection error
handling and recovery because dependencies can become unavailable after
startup too.

### 11.9 Compose lifecycle and volume behavior

Stop services without removing them:

``` bash
docker compose stop
```

Start existing services again:

``` bash
docker compose start
```

Remove containers and the Compose network:

``` bash
docker compose down
```

The named volume is normally preserved by `docker compose down`.

Remove containers, network, and Compose-managed volumes:

``` bash
docker compose down -v
```

**Warning:** `docker compose down -v` removes the Compose-managed named
volume. In this lab that means deleting the persisted MySQL data. Do not
run it against data you need.

Rebuild and start the API service:

``` bash
docker compose up -d --build api
```

This is useful when changing API code or its Dockerfile. It does not
intentionally remove the database named volume.

## 12. Command reference

### Container lifecycle

``` bash
docker run
docker ps
docker ps -a
docker stop <container>
docker start <container>
docker restart <container>
docker rm <container>
docker rm -f <container>
docker exec -it <container> sh
docker exec -it <container> bash
docker top <container>
```

### Logs and inspection

``` bash
docker logs <container>
docker logs -f <container>
docker stats
docker stats --no-stream
docker inspect <container>
docker inspect -f '{{.State.Status}}' <container>
docker events
```

### Networking

``` bash
docker network ls
docker network create --driver bridge <network>
docker network inspect <network>
docker network connect <network> <container>
docker network disconnect <network> <container>
docker run --rm --network <network> <image> <command>
```

### Volumes

``` bash
docker volume ls
docker volume create <volume>
docker volume inspect <volume>
docker volume rm <volume>
docker run --mount source=<volume>,target=/data <image>
```

### Compose

``` bash
docker compose up -d
docker compose up -d --build
docker compose ps
docker compose logs -f
docker compose logs -f <service>
docker compose stop
docker compose start
docker compose down
docker compose down -v
```

## 13. Important lessons and production considerations

1.  **A container is not a virtual machine.** Containers isolate
    processes and share the host's underlying kernel.
2.  **The main process matters.** Docker tracks the container's main
    process; correct signal handling and graceful shutdown matter.
3.  **Container IPs are not stable service identifiers.** Use service
    names and Docker DNS on user-defined networks and Compose networks.
4.  **`EXPOSE` does not publish ports.** Use `-p` or Compose `ports`
    when host access is required.
5.  **Keep internal traffic internal.** Do not publish database ports
    unless an external client genuinely needs them.
6.  **Persist state outside the container.** Use named volumes for
    database files and appropriate bind mounts for host-managed files.
7.  **A volume is not a backup.** Back up important data independently
    and regularly test restore procedures.
8.  **Running is not ready.** Use health checks and make applications
    resilient to dependency failures.
9.  **Avoid committing secrets.** The passwords in this lab are for
    local practice only. Production secrets should be managed through an
    appropriate secrets-management system.
10. **Do not casually prune storage.** Commands that remove volumes can
    irreversibly delete local database data.

## 14. Cleanup

Only run cleanup commands after you no longer need the lab data.

Remove standalone containers:

``` bash
docker rm -f nginx-lab
docker rm -f nginx-limited
docker rm -f signal-lab
docker rm -f network-client
docker rm -f bind-mount-lab
docker rm -f bind-mount-writable
docker rm -f nginx-published
docker rm -f nginx-random-port
docker rm -f volume-lab
docker rm -f mysql-lab
```

Some containers may not exist if their optional exercises were not run;
Docker will report that and continue only if commands are run
individually.

Remove the standalone user-defined network after disconnecting/removing
its containers:

``` bash
docker network rm app-network
```

Remove standalone named volumes **only if you no longer need their
data**:

``` bash
docker volume rm app-data
docker volume rm mysql-lab-data
```

For the Compose project, from the directory containing `compose.yaml`:

``` bash
docker compose down
```

This preserves `mysql-data`. To permanently remove the Compose database
volume too:

``` bash
docker compose down -v
```

Again, this deletes the lab database data.

------------------------------------------------------------------------

## Suggested `.gitignore`

For this lab repository, a minimal `.gitignore` could be:

``` gitignore
node_modules/
.env
.DS_Store
*.log
```

Do not commit real passwords, access keys, database dumps, or production
configuration.

## Lab status and verification notes

-   Nginx container creation, port publishing, HTTP access, and log
    inspection were exercised.
-   Container resource inspection and Go-template inspection were
    explored.
-   Container process visibility, minimal-image tooling, and PID
    1/signal behavior were discussed and demonstrated through commands.
-   A user-defined bridge networking exercise was covered; run its
    commands in your own environment if you have not yet verified each
    networking step.
-   Named-volume persistence was verified by writing a file, deleting
    its container, and reading the file from a new container.
-   Bind-mount live file synchronization was verified by changing a host
    HTML file and requesting it again through Nginx.
-   MySQL named-volume persistence was verified by inserting employee
    records, removing the container, recreating it with the same volume,
    and querying the records.
-   The Node.js + MySQL Compose stack and its configuration were
    prepared as the next practical exercise. Treat it as verified only
    after running `docker compose up -d --build` and successfully
    curling the API.
