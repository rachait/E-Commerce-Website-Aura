# Minikube Start Guide (AURA)

This guide starts the app on Minikube using the current project layout.

## Prerequisites

- Docker Desktop running
- Minikube installed
- kubectl installed
- Helm installed

## 1) Start Minikube

Run from project root:

```powershell
minikube start --driver=docker
minikube addons enable ingress
minikube addons enable metrics-server
```

## 2) Build images into Minikube Docker

```powershell
minikube docker-env --shell powershell | Invoke-Expression
docker build -t aura-backend:local .\backend
docker build -t aura-frontend:local .\frontend
```

## 3) Deploy with Helm

```powershell
helm upgrade --install aura .\deploy\helm\aura `
  --namespace aura `
  --create-namespace
```

## 4) Start ingress tunnel (keep this terminal open)

```powershell
minikube tunnel
```

## 5) Verify deployment

```powershell
kubectl get pods -n aura
kubectl get svc -n aura
kubectl get ingress -n aura
kubectl get hpa -n aura
```

Open app:
- http://aura.127.0.0.1.nip.io

## 6) Optional monitoring (Prometheus + Grafana)

Install stack:

```powershell
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack --namespace monitoring --create-namespace
```

Enable app ServiceMonitor and PrometheusRule:

```powershell
helm upgrade --install aura .\deploy\helm\aura `
  --namespace aura `
  --create-namespace `
  --reuse-values `
  --set monitoring.serviceMonitor.enabled=true `
  --set monitoring.prometheusRule.enabled=true
```

Port-forward UIs (run in separate terminals):

```powershell
kubectl -n monitoring port-forward svc/kube-prometheus-stack-prometheus 9090:9090
kubectl -n monitoring port-forward svc/kube-prometheus-stack-grafana 3001:80
```

URLs:
- Prometheus: http://127.0.0.1:9090
- Grafana: http://127.0.0.1:3001

Get Grafana admin password:

```powershell
kubectl -n monitoring get secret kube-prometheus-stack-grafana -o jsonpath="{.data.admin-password}" | %{ [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($_)) }
```

## 7) Stop and cleanup

```powershell
helm uninstall aura -n aura
helm uninstall kube-prometheus-stack -n monitoring
kubectl delete namespace aura
kubectl delete namespace monitoring
minikube stop
```

## Fast demo workflow (recommended)

If you want to present tomorrow and restart quickly:

1. Today (shutdown, keep everything):

```powershell
.\deploy\stop-demo.ps1
```

2. Tomorrow (5-minute start):

```powershell
.\deploy\start-demo.ps1
minikube tunnel
```

Then open:
- http://aura.127.0.0.1.nip.io
