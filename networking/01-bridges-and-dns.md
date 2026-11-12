# Lab 05 — Docker Networking: Bridges, DNS, and Port Publishing

## Objectives

- Understand Docker network drivers
- Create and use a user-defined bridge network
- Test container-name DNS resolution
- Learn the difference between `EXPOSE` and `-p`

> **Prerequisite:** `nginx-lab` container from [Lab 01](../basics/01-running-containers.md)

---

## List and Inspect Networks

```bash
docker network ls
docker network inspect bridge
```

### Network Drivers

| Driver     | Purpose                                                  |
| ---------- | -------------------------------------------------------- |
| `bridge`   | Containers on one Docker host (default)                  |
| `host`     | Shares the host network namespace (where supported)      |
| `none`     | Disables container networking                            |
| `overlay`  | Multi-host networking, commonly with Swarm               |
| `macvlan`  | Gives containers a MAC address on the physical network   |

---

## Create a User-Defined Bridge

```bash
docker network create --driver bridge app-network
docker network inspect app-network
```

Attach the Nginx container:

```bash
docker network connect app-network nginx-lab
```

Verify:

```bash
docker inspect -f '{{json .NetworkSettings.Networks}}' nginx-lab
```

A container can connect to multiple networks — useful when it must talk to separate service groups.

Disconnect:

```bash
docker network disconnect app-network nginx-lab
```

Reconnect:

```bash
docker network connect app-network nginx-lab
```

---

## Test DNS on a User-Defined Bridge

Start a disposable Alpine shell on the same network:

```bash
docker run --rm -it --name network-client --network app-network alpine:latest sh
```

Inside Alpine:

```bash
ping -c 3 nginx-lab
wget -qO- http://nginx-lab
exit
```

> **Key concept:** User-defined bridges provide Docker's embedded DNS. Containers on the same user-defined bridge reach each other by **container name** or network alias.

One-shot HTTP test:

```bash
docker run --rm --network app-network alpine:latest wget -qO- http://nginx-lab
```

### Disconnect/Reconnect Exercise

```bash
docker network disconnect app-network nginx-lab
docker network inspect app-network
docker network connect app-network nginx-lab
docker run --rm --network app-network alpine:latest wget -qO- http://nginx-lab
```

---

## Default Bridge vs User-Defined Bridge

| Feature                  | Default `bridge`       | User-defined bridge         |
| ------------------------ | ---------------------- | --------------------------- |
| Container-name DNS       | No                     | Yes                         |
| Isolation between groups | Shared default network | Separate per network        |
| Recommended for apps     | No                     | Yes                         |

Containers on different bridge networks are isolated by default. They can communicate only if deliberately connected to a shared network.

---

## EXPOSE vs Publishing Ports

`EXPOSE` in a Dockerfile **documents** the port an app listens on. It does **not** publish it to the host.

### Publish with `-p`

```bash
docker run -d --name nginx-published -p 8081:80 nginx:latest
```

### Publish exposed ports dynamically with `-P`

```bash
docker run -d --name nginx-random-port -P nginx:latest
docker port nginx-random-port
```

### Summary

| Syntax       | What It Does                                     |
| ------------ | ------------------------------------------------ |
| `EXPOSE 80`  | Image metadata/documentation only                |
| `-p 8080:80` | Publishes container port 80 on host port 8080    |
| `-P`         | Publishes exposed ports on random host ports     |

> **Production lesson:** Container IPs are not stable service identifiers. Always use service names and Docker DNS on user-defined or Compose networks.

---

## Cleanup

```bash
docker rm -f nginx-published nginx-random-port
docker network disconnect app-network nginx-lab
docker network rm app-network
```
