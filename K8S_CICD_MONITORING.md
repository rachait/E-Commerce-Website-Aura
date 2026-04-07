# Kubernetes + GitHub Actions + Helm + Monitoring Setup

This guide makes the AURA project live using:
- Kubernetes for runtime
- Helm for app packaging/deployment
- GitHub Actions for CI/CD
- Prometheus + Grafana for monitoring

## 1. What was added

- Docker images:
  - backend/Dockerfile
  - frontend/Dockerfile
- Helm chart:
  - helm/aura
- CI pipeline:
  - .github/workflows/ci.yml
- CD pipeline (build + push + deploy):
  - .github/workflows/deploy-k8s.yml
- Monitoring install workflow:
  - .github/workflows/monitoring.yml
- Metrics endpoint in backend:
  - /metrics
- Kubernetes probe endpoints in backend:
  - /health/live
  - /health/ready

## 2. Required GitHub secrets

Add these in: GitHub repo -> Settings -> Secrets and variables -> Actions

Cluster + app routing:
- KUBE_CONFIG_DATA: Base64-encoded kubeconfig
- APP_HOST: Domain for ingress (example: aura.example.com)

Backend secret values:
- MONGO_URL
- DB_NAME
- CORS_ORIGINS
- JWT_SECRET
- EMERGENT_LLM_KEY
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- OPENAI_API_KEY
- SENDER_EMAIL
- SENDER_PASSWORD
- SMTP_SERVER
- SMTP_PORT

## 3. Prepare Kubernetes cluster

Install an ingress controller (example for nginx ingress):

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
```

Ensure your DNS points APP_HOST to your ingress external IP.

## 3.1 Minikube deployment

For local deployment with Minikube, build the images into the Minikube Docker daemon and then install the chart once. The chart now creates MongoDB, the backend secret, and the seed job automatically.

```powershell
minikube start
minikube addons enable ingress
minikube docker-env --shell powershell | Invoke-Expression

docker build -t aura-backend:local ./backend
docker build -t aura-frontend:local ./frontend

helm upgrade --install aura ./helm/aura `
  --namespace aura `
  --create-namespace

minikube tunnel
```

Open the app at `http://aura.127.0.0.1.nip.io`.

If the backend secret is updated later, restart the deployment so the pods pick up the new environment values:

```powershell
kubectl -n aura rollout restart deployment/aura-aura-backend
```

## 4. CI workflow

On each PR and push to main:
- backend tests run
- frontend build runs
- Helm chart lint runs

## 5. CD workflow

On each push to main:
- backend and frontend Docker images are built and pushed to GHCR
- Kubernetes namespace is created/updated
- backend secret is created/updated from GitHub secrets
- Helm upgrade/install deploys the stack

Deployed ingress paths:
- / -> frontend
- /api -> backend
- /metrics -> backend metrics

## 6. Monitoring workflow

Run workflow manually:
- Actions -> Install Monitoring Stack -> Run workflow

It will:
- install/upgrade kube-prometheus-stack in namespace monitoring
- re-deploy app with ServiceMonitor enabled

## 7. Access Grafana and Prometheus

After monitoring install:

```bash
kubectl -n monitoring get svc
kubectl -n monitoring port-forward svc/kube-prometheus-stack-grafana 3001:80
kubectl -n monitoring port-forward svc/kube-prometheus-stack-prometheus 9090:9090
```

Open:
- Grafana: http://localhost:3001
- Prometheus: http://localhost:9090

Get Grafana admin password:

```bash
kubectl -n monitoring get secret kube-prometheus-stack-grafana -o jsonpath="{.data.admin-password}" | base64 --decode
```

## 8. First deployment trigger

Push to main to trigger deploy automatically:

```bash
git add .
git commit -m "Add Kubernetes, Helm, CI/CD, and monitoring"
git push origin main
```

## 9. Notes

- The Helm chart expects backend env vars from Kubernetes secret aura-backend-secrets.
- ServiceMonitor is disabled by default to avoid CRD errors before installing kube-prometheus-stack.
- If your cluster blocks pulling GHCR images, configure imagePullSecrets in the chart.
