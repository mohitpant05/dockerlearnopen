# Docker Command Cheatsheet

Quick reference for all commands used in the labs.

---

## Container Lifecycle

```bash
docker run                                 # create + start
docker ps                                  # running containers
docker ps -a                               # all containers
docker stop <container>
docker start <container>
docker restart <container>
docker rm <container>                      # remove (must be stopped)
docker rm -f <container>                   # force remove
docker exec -it <container> sh             # shell into container
docker exec -it <container> bash
docker top <container>                     # processes from host
```

## Logs and Inspection

```bash
docker logs <container>
docker logs -f <container>                 # follow live
docker stats                               # live resource usage
docker stats --no-stream                   # snapshot
docker inspect <container>                 # full JSON metadata
docker inspect -f '{{.State.Status}}' <c>  # Go template query
docker events                              # live event stream
```

## Images

```bash
docker images                              # list local images
docker pull <image>
docker build -t <tag> .
docker rmi <image>
```

## Networking

```bash
docker network ls
docker network create --driver bridge <n>
docker network inspect <network>
docker network connect <network> <c>
docker network disconnect <network> <c>
docker network rm <network>
docker run --rm --network <n> <img> <cmd>  # one-shot on network
```

## Volumes

```bash
docker volume ls
docker volume create <volume>
docker volume inspect <volume>
docker volume rm <volume>
docker run --mount source=<v>,target=/data <img>
```

## Compose

```bash
docker compose up -d                       # start all services
docker compose up -d --build               # build + start
docker compose up -d --build <service>     # rebuild one service
docker compose ps                          # service status
docker compose logs -f                     # follow all logs
docker compose logs -f <service>           # follow one service
docker compose stop                        # stop (keep containers)
docker compose start                       # start stopped services
docker compose down                        # remove containers + network
docker compose down -v                     # also remove volumes
```

## Resource Limits

```bash
docker run --memory=256m --cpus=0.5 <img>
```

## Signals

```bash
docker stop <container>                    # SIGTERM → SIGKILL
docker kill <container>                    # SIGKILL (default)
docker kill --signal=SIGTERM <container>   # specific signal
docker run --init <img>                    # init process for signals
docker run --stop-timeout 15 <img>         # custom grace period
```
