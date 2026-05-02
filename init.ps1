# MedLinks Clinic Setup Script (PowerShell)
$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "MedLinks Clinic — Setup Script" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Copy .env.example if .env doesn't exist
if (-not (Test-Path .env)) {
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "⚠️  Please edit .env and set your passwords!" -ForegroundColor Red
    Write-Host "Press Enter after editing .env..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

if (-not (Test-Path backend\.env)) {
    Write-Host "Creating backend\.env from backend\.env.example..." -ForegroundColor Yellow
    Copy-Item backend\.env.example backend\.env
}

# Start services
Write-Host ""
Write-Host "Starting services..." -ForegroundColor Green
docker compose up -d

# Wait for database
Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Run seed
Write-Host ""
Write-Host "Running seed script..." -ForegroundColor Green
docker compose exec api python seed.py

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "pgAdmin:  http://localhost:8080" -ForegroundColor White
Write-Host "=========================================" -ForegroundColor Cyan
