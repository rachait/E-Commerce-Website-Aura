# AURA E-Commerce Platform

![Release](https://img.shields.io/github/v/release/rachait/E-Commerce-Website-Aura?include_prereleases)
![CI](https://img.shields.io/github/actions/workflow/status/rachait/E-Commerce-Website-Aura/ci.yml?branch=main)
![Tech](https://img.shields.io/badge/stack-React%20%7C%20FastAPI%20%7C%20MongoDB-111827)
![Contributions welcome](https://img.shields.io/badge/contributions-welcome-16a34a)

AURA is a full-stack fashion e-commerce platform built for modern shopping experiences.
It combines a React + Vite storefront with a FastAPI backend, MongoDB persistence, AI-assisted features, and production-ready deployment assets.

## Why AURA

- Modern catalog browsing with filtering, search, cart, checkout, and order history
- Smart backend APIs for auth, products, cart, coupons, returns, analytics, and payments
- Better dev UX with local full-stack startup and Kubernetes/Docker deployment options
- Real-world engineering concerns: health probes, rate limiting, metrics, CI/CD

## Live Architecture

```text
Frontend (React/Vite) -> API Proxy -> FastAPI -> MongoDB
						|
					Payments/AI/Cloudinary
```

## Key Features

- Product catalog with category views, sorting, and size/price filtering
- Cart and checkout experience with coupon support
- Authentication and account management
- Admin-facing order/product management endpoints
- AI chatbot/recommendations endpoints
- Cloudinary media integration and Razorpay payment flow
- Observability endpoints and Prometheus instrumentation

## Tech Stack

- Frontend: React, Vite, React Router, Tailwind CSS, Framer Motion, Three.js
- Backend: FastAPI, Uvicorn, Motor, PyMongo, Pydantic
- Database: MongoDB
- Integrations: Razorpay, Cloudinary
- DevOps: Docker, Docker Compose, Kubernetes, Helm, GitHub Actions, Prometheus

## Repository Structure

- backend/ -> FastAPI app, routes, schemas, utilities, seed scripts
- frontend/ -> React/Vite app and UI components
- deploy/ -> Compose, Kubernetes, Helm, and local deployment guides
- .github/workflows/ -> CI/CD workflows

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- MongoDB running locally

### Install and Run (recommended)

From repo root:

```powershell
npm install
npm run dev
```

This starts:

- Backend on http://localhost:8000
- Frontend on http://localhost:3000

### Manual backend setup (first time)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Manual frontend setup

```powershell
cd frontend
npm install
npm run dev
```

## Seed Demo Data

```powershell
cd backend
$env:FORCE_RESEED_PRODUCTS='true'
python seed_db.py
```

Use FORCE_RESEED_PRODUCTS=true when you want to replace existing product data with the latest seed catalog.

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

## Deployment

### Docker Compose

```powershell
docker compose -f deploy/docker-compose.yml up -d
```

### Helm/Kubernetes

```powershell
helm upgrade --install aura ./deploy/helm/aura --namespace aura --create-namespace
```

See deploy/MINIKUBE_GUIDE.md for local cluster instructions.

## API Health Endpoints

- /health
- /health/live
- /health/ready
- /metrics

## Contributing

Contributions are welcome.

- Read CONTRIBUTING.md for setup and PR process
- Use issue templates to report bugs or suggest features
- Follow the pull request checklist before requesting review

## Community & Support

- Bug reports and feature ideas: GitHub Issues
- Security reports: SECURITY.md
- Code of conduct: CODE_OF_CONDUCT.md

## Roadmap

- Add visual screenshot gallery/GIF demos to README
- Improve search relevance and product recommendations
- Expand test coverage for critical checkout/payment paths
- Add stricter release automation and changelog generation

## License

No license file is currently defined.
