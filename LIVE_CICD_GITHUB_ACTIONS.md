# Live Deployment with GitHub Actions (AURA)

This guide uses the existing workflow at `.github/workflows/deploy-k8s.yml` to deploy to a live Kubernetes cluster.

## 1. What is already configured

- CI workflow: `.github/workflows/ci.yml`
- CD workflow: `.github/workflows/deploy-k8s.yml`
- Helm chart: `helm/aura`
- Monitoring workflow: `.github/workflows/monitoring.yml`

## 2. Prerequisites

- A Kubernetes cluster reachable from GitHub Actions.
- Ingress controller installed in cluster (nginx ingress recommended).
- A real domain/subdomain pointing to ingress external IP.
- GitHub repository with Actions enabled.

## 3. Required GitHub Actions secrets

Add these in GitHub -> Settings -> Secrets and variables -> Actions.

### Cluster and routing
- `KUBE_CONFIG_DATA`: base64 kubeconfig content
- `APP_HOST`: live domain, for example `shop.example.com`

### Backend app secrets
- `MONGO_URL`
- `DB_NAME`
- `CORS_ORIGINS`
- `JWT_SECRET`
- `EMERGENT_LLM_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `OPENAI_API_KEY`
- `SENDER_EMAIL`
- `SENDER_PASSWORD`
- `SMTP_SERVER`
- `SMTP_PORT`

### Optional (if GHCR images are private)
- `GHCR_PULL_SECRET_NAME` (example: `ghcr-pull-secret`)
- `GHCR_USERNAME`
- `GHCR_TOKEN` (PAT with `read:packages`)

## 4. One-time cluster prep

Install ingress controller:

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
```

Optional TLS (recommended):
- Install cert-manager
- Create ClusterIssuer
- Update ingress annotations and enable TLS in Helm values

## 5. Trigger deployment

Deployment runs automatically on push to `main`.

```bash
git add .
git commit -m "Enable live CI/CD deployment"
git push origin main
```

Or run manually:
- GitHub -> Actions -> Deploy To Kubernetes -> Run workflow

## 6. What deployment workflow does

1. Builds backend/frontend Docker images
2. Pushes images to GHCR
3. Configures kubeconfig from secret
4. Creates/updates namespace `aura`
5. Creates/updates secret `aura-backend-secrets`
6. Optionally creates GHCR image pull secret
7. Runs Helm upgrade/install with image tags from current commit
8. Verifies backend and frontend rollout

## 7. Verify live status

```bash
kubectl get pods -n aura
kubectl get deploy -n aura
kubectl get ingress -n aura
```

Check website:
- `http://<APP_HOST>` or `https://<APP_HOST>` if TLS enabled

## 8. Monitoring after live deployment

Run monitoring workflow once:
- GitHub -> Actions -> Install Monitoring Stack -> Run workflow

Then verify:

```bash
kubectl get pods -n monitoring
```

## 9. Rollback strategy

To rollback release quickly:

```bash
helm history aura -n aura
helm rollback aura <REVISION> -n aura
```

## 10. Notes

- Workflow now forces lowercase GHCR repository owner to avoid invalid image names.
- If package visibility is public, GHCR pull secret is not required.
- For production, rotate secrets periodically and avoid using placeholder values.
