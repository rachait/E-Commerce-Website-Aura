param(
    [string]$Repo = "rachait/E-Commerce-Website-Aura"
)

$gh = "C:\Program Files\GitHub CLI\gh.exe"

if (-not (Test-Path $gh)) {
    Write-Error "GitHub CLI not found at $gh"
    exit 1
}

Write-Host "Checking GitHub auth..."
& $gh auth status 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "You are not logged in. Run this first:"
    Write-Host "`"$gh`" auth login"
    Write-Host "Choose: GitHub.com -> HTTPS -> Login with browser"
    exit 1
}

function Set-SecretPlain {
    param(
        [string]$Name,
        [string]$Prompt
    )

    $value = Read-Host $Prompt
    if ([string]::IsNullOrWhiteSpace($value)) {
        Write-Host "Skipped $Name (empty input)."
        return
    }

    $value | & $gh secret set $Name -R $Repo
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Set $Name"
    } else {
        Write-Error "Failed to set $Name"
        exit 1
    }
}

function Set-SecretSecure {
    param(
        [string]$Name,
        [string]$Prompt
    )

    $secure = Read-Host $Prompt -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try {
        $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }

    if ([string]::IsNullOrWhiteSpace($plain)) {
        Write-Host "Skipped $Name (empty input)."
        return
    }

    $plain | & $gh secret set $Name -R $Repo
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Set $Name"
    } else {
        Write-Error "Failed to set $Name"
        exit 1
    }
}

Write-Host "Setting KUBE_CONFIG_DATA from local kubeconfig..."
$kubeConfigPath = Join-Path $HOME ".kube\config"
if (-not (Test-Path $kubeConfigPath)) {
    Write-Error "kubeconfig not found at $kubeConfigPath"
    exit 1
}

$kubeServerLine = Get-Content $kubeConfigPath | Where-Object { $_ -match '^\s*server:\s*' } | Select-Object -First 1
if ($kubeServerLine -match 'server:\s*(\S+)') {
    $kubeServer = $Matches[1]
    if ($kubeServer -match '^https?://(127\.0\.0\.1|localhost)(:\d+)?(/|$)') {
        Write-Warning "Detected local Kubernetes API endpoint in kubeconfig: $kubeServer"
        Write-Warning "This works with self-hosted runners on this machine, but will fail on github-hosted ubuntu runners."
    }
}

$kubeRaw = Get-Content $kubeConfigPath -Raw
$kubeB64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($kubeRaw))
$kubeB64 | & $gh secret set KUBE_CONFIG_DATA -R $Repo
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to set KUBE_CONFIG_DATA"
    exit 1
}
Write-Host "Set KUBE_CONFIG_DATA"

Set-SecretPlain -Name "APP_HOST" -Prompt "Enter APP_HOST (example: shop.example.com)"
Set-SecretPlain -Name "MONGO_URL" -Prompt "Enter MONGO_URL"
Set-SecretPlain -Name "DB_NAME" -Prompt "Enter DB_NAME"
Set-SecretPlain -Name "CORS_ORIGINS" -Prompt "Enter CORS_ORIGINS (JSON array)"
Set-SecretSecure -Name "JWT_SECRET" -Prompt "Enter JWT_SECRET"
Set-SecretSecure -Name "EMERGENT_LLM_KEY" -Prompt "Enter EMERGENT_LLM_KEY"
Set-SecretSecure -Name "RAZORPAY_KEY_ID" -Prompt "Enter RAZORPAY_KEY_ID"
Set-SecretSecure -Name "RAZORPAY_KEY_SECRET" -Prompt "Enter RAZORPAY_KEY_SECRET"
Set-SecretSecure -Name "CLOUDINARY_CLOUD_NAME" -Prompt "Enter CLOUDINARY_CLOUD_NAME"
Set-SecretSecure -Name "CLOUDINARY_API_KEY" -Prompt "Enter CLOUDINARY_API_KEY"
Set-SecretSecure -Name "CLOUDINARY_API_SECRET" -Prompt "Enter CLOUDINARY_API_SECRET"
Set-SecretSecure -Name "OPENAI_API_KEY" -Prompt "Enter OPENAI_API_KEY"
Set-SecretPlain -Name "SENDER_EMAIL" -Prompt "Enter SENDER_EMAIL"
Set-SecretSecure -Name "SENDER_PASSWORD" -Prompt "Enter SENDER_PASSWORD"
Set-SecretPlain -Name "SMTP_SERVER" -Prompt "Enter SMTP_SERVER (example: smtp.gmail.com)"
Set-SecretPlain -Name "SMTP_PORT" -Prompt "Enter SMTP_PORT (example: 465)"

$setOptional = Read-Host "Set optional GHCR pull secrets? (y/N)"
if ($setOptional -match '^[Yy]$') {
    Set-SecretPlain -Name "GHCR_PULL_SECRET_NAME" -Prompt "Enter GHCR_PULL_SECRET_NAME (example: ghcr-pull-secret)"
    Set-SecretPlain -Name "GHCR_USERNAME" -Prompt "Enter GHCR_USERNAME"
    Set-SecretSecure -Name "GHCR_TOKEN" -Prompt "Enter GHCR_TOKEN (PAT with read:packages)"
}

Write-Host "All done. Now re-run the Deploy To Kubernetes workflow in GitHub Actions."
