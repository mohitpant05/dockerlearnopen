# Lab 08 — MySQL with Persistent Storage

## Objectives

- Run MySQL with a named volume for data persistence
- Insert data, destroy the container, and prove data survives
- Understand MySQL image initialization behavior

> **Lab credentials only:** The password below is for local practice. Never use it in production or commit real credentials to Git.

---

## Create the Volume

```bash
docker volume create mysql-lab-data
```

---

## Start MySQL 8.0

```bash
docker run -d \
  --name mysql-lab \
  -e MYSQL_ROOT_PASSWORD='LabRoot123!' \
  -e MYSQL_DATABASE=docker_lab \
  -p 3307:3306 \
  --mount source=mysql-lab-data,target=/var/lib/mysql \
  mysql:8.0
```

Port `3307:3306` makes MySQL reachable from the Mac on port 3307.

---

## Wait for Readiness

```bash
docker logs -f mysql-lab
```

Wait for the "ready for connections" log message, then `Ctrl+C` to stop following.

---

## Create Data

```bash
docker exec -it mysql-lab mysql -uroot -p
```

Enter password: `LabRoot123!`

```sql
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
exit;
```

---

## Verify the Volume Mount

```bash
docker inspect mysql-lab --format '{{json .Mounts}}'
```

Check for:
- `Type`: `volume`
- `Name`: `mysql-lab-data`
- `Destination`: `/var/lib/mysql`

---

## Destroy and Recreate

Remove the container (**not** the volume):

```bash
docker rm -f mysql-lab
```

Recreate with the same volume:

```bash
docker run -d \
  --name mysql-lab \
  -e MYSQL_ROOT_PASSWORD='LabRoot123!' \
  -p 3307:3306 \
  --mount source=mysql-lab-data,target=/var/lib/mysql \
  mysql:8.0
```

`MYSQL_DATABASE` is omitted on purpose — the database already exists in the volume. The official MySQL image's init variables only apply when initializing a **new, empty** data directory.

Wait for readiness, then reconnect:

```bash
docker logs -f mysql-lab
docker exec -it mysql-lab mysql -uroot -p
```

```sql
USE docker_lab;
SELECT * FROM employees;
```

All three records still exist. Data persisted outside the deleted container.

> **Production lesson:** Keep internal traffic internal. Don't publish database ports unless an external client genuinely needs them. A volume is not a backup — back up independently and test restores.

---

## Cleanup

```bash
docker rm -f mysql-lab
docker volume rm mysql-lab-data   # deletes all lab data permanently
```
