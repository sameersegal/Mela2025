# Build script for Netlify deployment
# Creates a zip file with the necessary files

$outputZip = "mela2025-netlify.zip"

# Load .env file and generate config.js
Write-Host "📝 Generating config.js from .env..." -ForegroundColor Cyan

if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    exit 1
}

# Read .env and extract API_URL
$envContent = Get-Content ".env" -Raw
if ($envContent -match 'API_URL=(.+)') {
    $apiUrl = $matches[1].Trim()
    $configContent = "const API_URL = `"$apiUrl`";`n"
    Set-Content -Path "config.js" -Value $configContent
    Write-Host "✅ Generated config.js" -ForegroundColor Green
} else {
    Write-Host "❌ Error: API_URL not found in .env file!" -ForegroundColor Red
    exit 1
}

# Remove existing zip if it exists
if (Test-Path $outputZip) {
    Remove-Item $outputZip
    Write-Host "Removed existing $outputZip" -ForegroundColor Yellow
}

# Create zip with the required files
Compress-Archive -Path "index.html", "config.js" -DestinationPath $outputZip

Write-Host "`n✅ Build complete!" -ForegroundColor Green
Write-Host "📦 Created: $outputZip" -ForegroundColor Cyan
Write-Host "`nTo deploy to Netlify:" -ForegroundColor White
Write-Host "1. Go to https://app.netlify.com/drop" -ForegroundColor Gray
Write-Host "2. Drag and drop $outputZip" -ForegroundColor Gray
Write-Host "3. Your site will be live in seconds!" -ForegroundColor Gray
