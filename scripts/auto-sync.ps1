param(
    [string]$Remote = "origin",
    [int]$DebounceSeconds = 4,
    [int]$CommitIntervalMinutes = 10,
    [switch]$RunOnce
)

$ErrorActionPreference = "Stop"

function Write-Info {
    param([string]$Message)
    Write-Host "[auto-sync] $Message"
}

function Should-IgnorePath {
    param([string]$Path)

    if ([string]::IsNullOrWhiteSpace($Path)) {
        return $true
    }

    $normalized = $Path.Replace('/', '\\')

    if ($normalized -match "\\.git(\\|$)") { return $true }
    if ($normalized -match "\\node_modules(\\|$)") { return $true }
    if ($normalized -match "\\.venv(\\|$)") { return $true }
    if ($normalized -match "\\dist(\\|$)") { return $true }
    if ($normalized -match "\\build(\\|$)") { return $true }

    $fileName = [System.IO.Path]::GetFileName($normalized)
    if ($fileName -match "^(~\$|\.swp|\.tmp)") { return $true }

    return $false
}

function Invoke-Sync {
    param([string]$Branch, [string]$RemoteName)

    git add -A | Out-Null
    $staged = git diff --cached --name-only

    if (-not $staged) {
        Write-Info "No changes to commit."
        return $false
    }

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $message = "chore(auto-sync): update $timestamp"

    Write-Info "Committing changes..."
    git commit -m $message | Out-Host

    Write-Info "Pushing to $RemoteName/$Branch..."
    git push $RemoteName $Branch | Out-Host

    Write-Info "Sync complete."
    return $true
}

try {
    $inside = (git rev-parse --is-inside-work-tree 2>$null)
    if ($inside.Trim() -ne "true") {
        throw "Current directory is not a git repository."
    }

    $branch = (git rev-parse --abbrev-ref HEAD).Trim()
    if ([string]::IsNullOrWhiteSpace($branch) -or $branch -eq "HEAD") {
        throw "Detached HEAD detected. Checkout a branch before running auto-sync."
    }

    if ($RunOnce) {
        [void](Invoke-Sync -Branch $branch -RemoteName $Remote)
        exit 0
    }

    $root = (Get-Location).Path
    if ($CommitIntervalMinutes -lt 1) {
        throw "CommitIntervalMinutes must be >= 1"
    }

    Write-Info "Watching $root"
    Write-Info "Branch: $branch | Remote: $Remote | Debounce: ${DebounceSeconds}s | Batch interval: ${CommitIntervalMinutes}m"
    Write-Info "Press Ctrl+C to stop."

    $watcher = New-Object System.IO.FileSystemWatcher
    $watcher.Path = $root
    $watcher.IncludeSubdirectories = $true
    $watcher.EnableRaisingEvents = $true

    $script:pendingSync = $false
    $script:lastEventAt = Get-Date

    $eventAction = {
        $path = $Event.SourceEventArgs.FullPath
        if (Should-IgnorePath -Path $path) {
            return
        }

        $script:pendingSync = $true
        $script:lastEventAt = Get-Date
    }

    $handlers = @()
    $handlers += Register-ObjectEvent -InputObject $watcher -EventName Changed -Action $eventAction
    $handlers += Register-ObjectEvent -InputObject $watcher -EventName Created -Action $eventAction
    $handlers += Register-ObjectEvent -InputObject $watcher -EventName Deleted -Action $eventAction
    $handlers += Register-ObjectEvent -InputObject $watcher -EventName Renamed -Action $eventAction

    $script:lastSyncAt = (Get-Date).AddMinutes(-$CommitIntervalMinutes)

    while ($true) {
        Start-Sleep -Seconds 1

        if (-not $script:pendingSync) {
            continue
        }

        $elapsed = (Get-Date) - $script:lastEventAt
        if ($elapsed.TotalSeconds -lt $DebounceSeconds) {
            continue
        }

        $sinceLastSync = (Get-Date) - $script:lastSyncAt
        if ($sinceLastSync.TotalMinutes -lt $CommitIntervalMinutes) {
            continue
        }

        $script:pendingSync = $false

        try {
            $didSync = Invoke-Sync -Branch $branch -RemoteName $Remote
            if ($didSync) {
                $script:lastSyncAt = Get-Date
            }
        } catch {
            Write-Info "Sync failed: $($_.Exception.Message)"
            Write-Info "Watching continues."
            $script:pendingSync = $true
        }
    }
}
catch {
    Write-Error $_.Exception.Message
    exit 1
}
finally {
    if ($handlers) {
        foreach ($h in $handlers) {
            Unregister-Event -SubscriptionId $h.Id -ErrorAction SilentlyContinue
            $h | Remove-Job -Force -ErrorAction SilentlyContinue
        }
    }
}
