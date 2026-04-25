# AURA E-Commerce Platform

AURA is a premium full-stack e-commerce platform built with a React + Vite frontend, a FastAPI backend, and MongoDB for persistence. The project includes product discovery, cart and checkout flows, order management, AI-assisted shopping features, payment integration, analytics, and Kubernetes-ready deployment.

## Features

- Responsive shopping UI with product browsing, filters, cart, checkout, and order pages
- FastAPI REST backend for authentication, products, cart, orders, coupons, returns, and analytics
- MongoDB-backed data model with startup seeding for admin and coupon data
- Razorpay payment workflow and Cloudinary media support
- AI chatbot and recommendation endpoints
- Security and operations support with health checks, readiness probes, rate limiting, and Prometheus metrics
- Docker, Docker Compose, Helm, and Kubernetes deployment assets
- GitHub Actions CI for backend tests, frontend build validation, and Helm linting

## Tech Stack

- Frontend: React, Vite, React Router, Tailwind CSS, Framer Motion, Three.js
- Backend: FastAPI, Uvicorn, Motor, PyMongo, Pydantic
- Database: MongoDB
- Payments: Razorpay
- Media: Cloudinary
- DevOps: Docker, Docker Compose, Kubernetes, Helm, GitHub Actions, Prometheus

## Project Workflow

1. Designed the application architecture and feature scope.
2. Built the frontend user experience for browsing, filtering, and purchasing products.
3. Implemented backend APIs for authentication, catalog, cart, checkout, orders, coupons, returns, and analytics.
4. Connected MongoDB, Razorpay, Cloudinary, and AI endpoints.
5. Added production safeguards such as health endpoints, security headers, rate limiting, and metrics.
6. Set up CI to test the backend, build the frontend, and lint Helm charts.
7. Prepared containerized and Kubernetes deployment workflows for local and production environments.

## Repository Structure

- `backend/` - FastAPI application, models, routes, schemas, and utilities
- `frontend/` - React/Vite client application
- `deploy/` - Docker, Kubernetes, Helm, and demo scripts
- `.github/workflows/` - CI pipeline

## Local Development

### Prerequisites

- Python 3.12+
- Node.js 20+
- MongoDB running locally

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

### Start Frontend and Backend Together (One Command)

From the repository root:

```powershell
npm install
npm run dev
```

Make sure backend Python dependencies are installed at least once (for the Python environment you are using):

```powershell
cd backend
pip install -r requirements.txt
cd ..
```

This runs both services in parallel:

- Backend: `http://localhost:8000`
- Frontend: `http://localhost:3000`

## Build and Test

### Backend tests

```powershell
PYTHONPATH=backend pytest backend/tests
```

### Frontend build

```powershell
cd frontend
npm run build
```

## Docker

### Backend image

```powershell
docker build -t aura-backend ./backend
```

### Frontend image

```powershell
docker build -t aura-frontend ./frontend
```

### Local stack

```powershell
docker compose -f deploy/docker-compose.yml up -d
```

## Kubernetes Deployment

Use the Helm chart in `deploy/helm/aura`.

```powershell
helm upgrade --install aura ./deploy/helm/aura --namespace aura --create-namespace
```

For Minikube, see `deploy/MINIKUBE_GUIDE.md`.

## CI Pipeline

The GitHub Actions workflow runs on pull requests and pushes to `main`.

- Backend tests with Python 3.12
- Frontend production build with Node.js 20
- Helm chart linting

## Health Endpoints

- `/health` - application health status
- `/health/live` - liveness probe
- `/health/ready` - readiness probe
- `/metrics` - Prometheus metrics endpoint

## License

No license has been specified for this project.
