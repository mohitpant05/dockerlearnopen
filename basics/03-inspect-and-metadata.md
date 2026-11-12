# Lab 03 — Inspecting Container Metadata

## Objectives

- Use `docker inspect` to read container configuration and runtime state
- Extract specific fields with Go templates
- Monitor Docker events

> **Prerequisite:** `nginx-lab` container from [Lab 01](01-running-containers.md)

---

## Full Inspect

```bash
docker inspect nginx-lab
```

Returns detailed JSON — configuration, state, network settings, mounts.

---

## Go Templates for Specific Fields

```bash
docker inspect -f '{{.Id}}' nginx-lab
docker inspect -f '{{.State.Status}}' nginx-lab
docker inspect -f '{{.RestartCount}}' nginx-lab
docker inspect -f '{{.Config.Hostname}}' nginx-lab
docker inspect -f '{{.Config.Image}}' nginx-lab
docker inspect -f '{{.HostConfig.RestartPolicy.Name}}' nginx-lab
docker inspect -f '{{.State.StartedAt}}' nginx-lab
docker inspect -f '{{json .NetworkSettings.Networks}}' nginx-lab
```

### Extract IP Address

```bash
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' nginx-lab
```

### Print Network Details with Formatting

```bash
docker inspect -f '{{range $name, $config := .NetworkSettings.Networks}}{{printf "Network: %s\nNetwork ID: %s\nIP Address: %s\nGateway: %s\n\n" $name $config.NetworkID $config.IPAddress $config.Gateway}}{{end}}' nginx-lab
```

### Go Template Syntax Reference

| Syntax          | Meaning                                          |
| --------------- | ------------------------------------------------ |
| `{{ ... }}`     | Template expression                              |
| `.State.Status` | Nested field access (case-sensitive)             |
| `range`         | Iterate over map or collection                   |
| `end`           | Close a `range` or conditional block             |
| `printf`        | Format text; `%s` is a string placeholder        |

---

## Restart Count

The restart count is Docker's recorded **automatic** restart count — not a history of every manual stop/start.

---

## Docker Events

```bash
docker events
```

Live event stream for containers, images, volumes, networks. Not a permanent audit log — only shows events while you are listening.

---

## Cleanup

No resources to clean up. The `nginx-lab` container is shared with other labs.
