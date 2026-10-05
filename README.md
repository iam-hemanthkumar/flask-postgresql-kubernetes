# Task Manager Application on Kubernetes

A containerized Flask task management application deployed on Kubernetes using Minikube, with PostgreSQL as the database.

The application uses Kubernetes Deployments for workload management, Services for networking, ConfigMaps for application configuration, and Secrets for database credentials.

## Architecture

```text
Browser
  ↓
Flask Service (NodePort)
  ↓
Flask Deployment (3 replicas)
  ↓
PostgreSQL Service (ClusterIP)
  ↓
PostgreSQL Deployment (1 replica)
```

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
├── app.py
├── requirements.txt
├── Dockerfile
├── flask-config.yaml
├── flask-secret.yaml
├── flask.yaml
├── postgres-config.yaml
├── postgres-secret.yaml
├── postgres.yaml
└── README.md
```

## Kubernetes Resources

| Resource | Name | Description |
|---|---|---|
| Deployment | `flask-deployment` | Runs three Flask application replicas |
| Service | `flask-service` | Exposes the Flask app with NodePort |
| ConfigMap | `flask-config` | Stores Flask database connection settings |
| Secret | `flask-secret` | Stores the Flask database password |
| Deployment | `postgres-deployment` | Runs PostgreSQL |
| Service | `postgres-service` | Provides internal database access |
| ConfigMap | `postgres-config` | Stores PostgreSQL database and user settings |
| Secret | `postgres-secret` | Stores the PostgreSQL password |

## Configuration

The Flask application connects to PostgreSQL using Kubernetes internal DNS.

```text
DB_HOST=postgres-service
DB_PORT=5432
DB_NAME=taskdb
DB_USER=taskuser
```

The PostgreSQL database is configured with:

```text
POSTGRES_DB=taskdb
POSTGRES_USER=taskuser
POSTGRES_PASSWORD=<password>
```

The Flask `DB_PASSWORD` and PostgreSQL `POSTGRES_PASSWORD` must use the same value.

## Prerequisites

- Docker
- Minikube
- kubectl

Start Minikube:

```bash
minikube start
```

## Build the Application Image

Build the Flask application image:

```bash
docker build -t app-image:v2 .
```

Load the image into Minikube:

```bash
minikube image load app-image:v2
```

## Deploy to Kubernetes

Deploy PostgreSQL resources:

```bash
kubectl apply -f postgres-secret.yaml
kubectl apply -f postgres-config.yaml
kubectl apply -f postgres.yaml
```

Deploy Flask resources:

```bash
kubectl apply -f flask-secret.yaml
kubectl apply -f flask-config.yaml
kubectl apply -f flask.yaml
```

Verify the deployment:

```bash
kubectl get pods
```

Expected result:

```text
NAME                                  READY   STATUS    RESTARTS   AGE
flask-deployment-xxxxxxxxxx-xxxxx     1/1     Running   0          1m
flask-deployment-xxxxxxxxxx-xxxxx     1/1     Running   0          1m
flask-deployment-xxxxxxxxxx-xxxxx     1/1     Running   0          1m
postgres-deployment-xxxxxxxxxx-xxxxx  1/1     Running   0          1m
```

## Access the Application

Get the Flask Service URL:

```bash
minikube service flask-service --url
```

Open the returned URL in a web browser.

Example:

```text
http://127.0.0.1:xxxxx
```

Keep the terminal command running while accessing the application.

## Verify Services

List Kubernetes Services:

```bash
kubectl get services
```

Check Flask Service endpoints:

```bash
kubectl get endpoints flask-service
```

The Flask Service should route traffic to the Flask Pods on port `5000`.

## Scaling Flask

The Flask application is deployed with three replicas.

Check the Deployment:

```bash
kubectl get deployment flask-deployment
```

Scale the application manually if required:

```bash
kubectl scale deployment flask-deployment --replicas=5
```

## Cleanup

Delete the deployed application resources:

```bash
kubectl delete -f flask.yaml
kubectl delete -f flask-config.yaml
kubectl delete -f flask-secret.yaml

kubectl delete -f postgres.yaml
kubectl delete -f postgres-config.yaml
kubectl delete -f postgres-secret.yaml
```

Stop Minikube:

```bash
minikube stop
```

## Key Concepts Demonstrated

- Containerizing a Flask application with Docker
- Deploying applications with Kubernetes Deployments
- Running multiple Flask replicas
- Exposing a web application using a NodePort Service
- Running PostgreSQL as an internal ClusterIP Service
- Using ConfigMaps for non-sensitive configuration
- Using Secrets for database credentials
- Connecting services through Kubernetes DNS
- Deploying and testing applications locally with Minikube
