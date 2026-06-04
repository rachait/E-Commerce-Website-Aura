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
- Docker Desktop (for MongoDB via Docker Compose)
- MongoDB Atlas account (optional cloud alternative)

### Recommended local setup (Docker + Local Dev)

#### 1. Start MongoDB, Prometheus, and Grafana containers

From the repository root:

```powershell
docker compose -f deploy/docker-compose.yml up -d mongo prometheus grafana
```

This starts:
- **MongoDB**: http://localhost:27017
- **Prometheus**: http://localhost:9090 (metrics)
- **Grafana**: http://localhost:3000 (dashboards, default: admin/admin)

#### 2. Install backend dependencies and activate virtual environment

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ..
```

#### 3. Seed the database with sample products and users

```powershell
$env:PYTHONPATH="backend"
backend\.venv\Scripts\python.exe backend/seed_db.py
```

Output includes test credentials:
- **Admin**: admin@aura.com / admin123
- **User**: user@example.com / password123

#### 4. Start the backend (in one terminal)

```powershell
$env:PYTHONPATH="backend"
backend\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs on http://localhost:8000
API docs: http://localhost:8000/docs

#### 5. Start the frontend (in another terminal)

```powershell
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:3002 (or next available port)

### Access the app

- **Frontend**: http://localhost:3002
- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Metrics (Prometheus)**: http://localhost:8000/metrics
- **Grafana Dashboards**: http://localhost:3000

### Test credentials

```
Admin Dashboard:
  Email: admin@aura.com
  Password: admin123

Test User:
  Email: user@example.com
  Password: password123
```

### Build frontend for production

```powershell
cd frontend
npm run build
```

Output goes to `frontend/dist/`

### Stop all containers

```powershell
docker compose -f deploy/docker-compose.yml down
```

### Cloud MongoDB (Atlas) Alternative

If you don't want to use Docker for MongoDB:

1. Create a MongoDB Atlas cluster at https://www.mongodb.com/cloud/atlas
2. Get your connection string (format: `mongodb+srv://user:password@cluster.mongodb.net/aura_ecommerce`)
3. Set environment variable:
   ```powershell
   $env:MONGO_URL="your-atlas-connection-string"
   ```
4. Start backend (will use MONGO_URL instead of localhost)
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

From `backend/` after creating and activating the virtual environment:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m pytest tests
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
