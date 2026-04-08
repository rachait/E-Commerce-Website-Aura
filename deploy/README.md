# Deployment Assets

This folder centralizes deployment-related files for local, Kubernetes, and CI/CD usage.

## Structure

- `docker-compose.yml` - Local Docker Compose stack
- `prometheus.yml` - Prometheus scrape configuration used by Compose
- `kubeconfig-embed.yaml` - Sample embedded kubeconfig artifact
- `SET_GITHUB_SECRETS.ps1` - Helper script for setting GitHub Actions secrets
- `helm/aura` - Kubernetes Helm chart

## Common Commands

From repository root:

```powershell
# Local docker stack
docker compose -f deploy/docker-compose.yml up -d

# Helm deploy (example)
helm upgrade --install aura ./deploy/helm/aura --namespace aura --create-namespace
```
