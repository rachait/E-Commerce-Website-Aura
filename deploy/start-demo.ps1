Write-Host "[1/5] Starting Minikube..."
minikube start --driver=docker

Write-Host "[2/5] Enabling required addons..."
minikube addons enable ingress
minikube addons enable metrics-server

Write-Host "[3/5] Checking app status..."
kubectl get pods -n aura

Write-Host "[4/5] Checking monitoring status..."
kubectl get pods -n monitoring

Write-Host "[5/5] Start tunnel in a separate terminal before demo:"
Write-Host "    minikube tunnel"
Write-Host "App URL: http://aura.127.0.0.1.nip.io"
