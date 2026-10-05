# Flask PostgreSQL Kubernetes

A task management web application built with Flask and PostgreSQL, containerized with Docker, and deployed locally on Kubernetes using Minikube.

This project is mainly for practicing how a web application and database communicate inside a Kubernetes cluster using Deployments, Services, ConfigMaps, and Secrets.

## Architecture

```text
Browser
   │
   ▼
flask-service (NodePort)
   │
   ▼
Flask Deployment (3 replicas)
   │
   ▼
postgres-service (ClusterIP)
   │
   ▼
PostgreSQL Deployment (1 replica)
```

### How it works

- Flask runs as the web application.
- PostgreSQL stores the application data.
- The Flask Pods communicate with PostgreSQL through `postgres-service`.
- The Flask application is exposed outside the cluster through a NodePort Service.
- Database configuration is provided through Kubernetes ConfigMaps and Secrets.
- PostgreSQL runs with a single Pod in this practice setup.
- Flask is configured with three replicas to demonstrate scaling.

## Tech Stack

- Python
- Flask
- SQLAlchemy
- PostgreSQL
- Docker
- Kubernetes
- Minikube

## Project Structure

```text
.
├── README.md
├── app
│   ├── Dockerfile
│   ├── app.py
│   ├── requirements.txt
│   ├── static
│   │   ├── script.js
│   │   └── style.css
│   └── templates
│       └── index.html
└── k8s
    ├── flask-secrets.yml
    ├── flask.yml
    ├── postgres-secret.yml
    └── postgres.yml
```

## Kubernetes Resources

| Resource | Name | Purpose |
|---|---|---|
| Flask Deployment | `flask-deployment` | Runs three Flask application replicas |
| Flask Service | `flask-service` | Exposes Flask using NodePort |
| Flask Secret | `flask-secret` | Provides the database password to Flask |
| PostgreSQL Deployment | `postgres-deployment` | Runs the PostgreSQL database |
| PostgreSQL Service | `postgres-service` | Provides internal access to PostgreSQL |
| PostgreSQL Secret | `postgres-secret` | Provides the PostgreSQL password |

The `flask.yml` and `postgres.yml` files contain the main Deployment, Service, and ConfigMap resources. Secret resources are kept in separate files.

## Application Configuration

Flask connects to PostgreSQL through the Kubernetes Service name rather than using the PostgreSQL Pod IP.

```text
DB_HOST=postgres-service
DB_PORT=5432
DB_NAME=taskdb
DB_USER=taskuser
DB_PASSWORD=<password>
```

PostgreSQL is initialized with:

```text
POSTGRES_DB=taskdb
POSTGRES_USER=taskuser
POSTGRES_PASSWORD=<password>
```

The database name, username, and password used by Flask must match the corresponding PostgreSQL configuration.

In particular:

```text
flask-secret.yml
    DB_PASSWORD
        │
        ▼
    Flask application
        │
        │ connects to
        ▼
postgres-service:5432
        │
        ▼
PostgreSQL
    POSTGRES_PASSWORD
```

The password values in the Flask and PostgreSQL Secrets must be the same so that Flask can authenticate with PostgreSQL.

## Prerequisites

Make sure the following are installed:

- Docker
- Minikube
- kubectl

Start Minikube:

```bash
minikube start
```

Check the cluster:

```bash
minikube status
```

## Build the Flask Image

Run the following commands from the project root:

```text
project-root/
├── README.md
├── app/
└── k8s/
```

Build the Docker image:

```bash
docker build -t app-image:v2 ./app
```

The `./app` directory is used as the Docker build context. It contains the Dockerfile, Flask application, requirements, templates, and static files.

Load the image into Minikube:

```bash
minikube image load app-image:v2
```

Verify that Minikube has the image:

```bash
minikube image ls | grep app-image
```

On Windows PowerShell or Command Prompt:

```powershell
minikube image ls | findstr app-image
```

## Deploy to Kubernetes

Apply all Kubernetes manifests:

```bash
kubectl apply -f k8s/
