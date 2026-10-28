# scripts/start-tunnel.ps1
# Starts a permanent Cloudflare Quick Tunnel for Barangay Matatag Smart E-Governance Portal
# No duration expiration, direct HTTP/2 edge connection to http://localhost:4000

$ErrorActionPreference = "Stop"

$root = Resolve-Path "$PSScriptRoot\.."
$storageBinary = Join-Path $root "storage\cloudflared-notime.exe"
$tempBinary = Join-Path $env:TEMP "cloudflared-notime.exe"

$binaryToUse = $null
if (Test-Path $storageBinary) {
    $binaryToUse = $storageBinary
} elseif (Test-Path $tempBinary) {
    $binaryToUse = $tempBinary
} else {
    Write-Host "[!] Patched binary not found in storage or TEMP. Checking standard cloudflared..." -ForegroundColor Yellow
    $standard = Get-Command "cloudflared" -ErrorAction SilentlyContinue
    if ($standard) {
        $binaryToUse = $standard.Source
    } else {
        Write-Error "Could not find cloudflared-notime.exe. Please ensure storage\cloudflared-notime.exe exists."
    }
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  BARANGAY MATATAG SMART E-GOVERNANCE PORTAL TUNNEL" -ForegroundColor Green
Write-Host "  Zero Duration Expiration - Cloudflare HTTP/2 Edge" -ForegroundColor Cyan
Write-Host "  Forwarding: http://localhost:4000 (Express & Gzip Static)" -ForegroundColor White
Write-Host "  Using binary: $binaryToUse" -ForegroundColor DarkGray
Write-Host "==========================================================" -ForegroundColor Cyan

# Clear any system proxy interfering with TLS tunnels
$env:HTTP_PROXY = $null
$env:HTTPS_PROXY = $null
$env:ALL_PROXY = $null
$env:http_proxy = $null
$env:https_proxy = $null
$env:all_proxy = $null

& $binaryToUse tunnel --url http://127.0.0.1:4000 --protocol http2 --no-autoupdate
