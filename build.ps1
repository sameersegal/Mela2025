# Optimized Build script for Netlify deployment
# Creates a minified zip file with the necessary files

$outputZip = "mela2025-netlify.zip"
$minifiedHtml = "index.min.html"

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
    # Minified config.js (no newline, no extra whitespace)
    $configContent = "const API_URL=`"$apiUrl`";"
    Set-Content -Path "config.js" -Value $configContent -NoNewline
    Write-Host "✅ Generated minified config.js" -ForegroundColor Green
} else {
    Write-Host "❌ Error: API_URL not found in .env file!" -ForegroundColor Red
    exit 1
}

# Check if Node.js is available for minification
$nodeAvailable = $null -ne (Get-Command node -ErrorAction SilentlyContinue)

if ($nodeAvailable) {
    Write-Host "🔧 Minifying HTML/CSS/JS..." -ForegroundColor Cyan
    
    # Check if html-minifier-terser is installed globally or locally
    $hasMinifier = $false
    
    # Try to run minification
    try {
        # Use inline Node.js script for minification (no dependencies needed)
        # SAFE minification: Only minify CSS, preserve JS intact
        $minifyScript = @'
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Extract and preserve script blocks first
const scripts = [];
let tempHtml = html.replace(/<script>([\s\S]*?)<\/script>/g, (match) => {
    scripts.push(match);
    return `__SCRIPT_PLACEHOLDER_${scripts.length - 1}__`;
});

// Safe minification - only HTML and CSS, not JS
let minified = tempHtml
    // Remove HTML comments (but preserve IE conditionals)
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
    // Minify inline CSS (safe - CSS is more forgiving)
    .replace(/<style>([\s\S]*?)<\/style>/g, (match, css) => {
        const minCss = css
            .replace(/\/\*[\s\S]*?\*\//g, '')  // Remove comments
            .replace(/\s*([{}:;,>+~])\s*/g, '$1')  // Remove spaces around special chars
            .replace(/;\}/g, '}')  // Remove last semicolon
            .replace(/\s+/g, ' ')  // Collapse whitespace
            .trim();
        return '<style>' + minCss + '</style>';
    })
    // Remove extra whitespace between tags (but not inside them)
    .replace(/>\s+</g, '><')
    // Collapse multiple whitespace to single space
    .replace(/\s{2,}/g, ' ')
    // Remove newlines outside of script tags
    .replace(/\n/g, '');

// Restore script blocks unchanged
scripts.forEach((script, i) => {
    minified = minified.replace(`__SCRIPT_PLACEHOLDER_${i}__`, script);
});

fs.writeFileSync('index.min.html', minified);
console.log('Minified: ' + html.length + ' -> ' + minified.length + ' bytes (' + Math.round((1 - minified.length/html.length) * 100) + '% reduction)');
'@
        $minifyScript | Out-File -FilePath "minify-temp.js" -Encoding utf8
        $output = node minify-temp.js 2>&1
        Remove-Item "minify-temp.js" -ErrorAction SilentlyContinue
        
        if (Test-Path $minifiedHtml) {
            Write-Host "✅ $output" -ForegroundColor Green
            $hasMinifier = $true
        }
    } catch {
        Write-Host "⚠️ Minification failed, using original HTML" -ForegroundColor Yellow
    }
    
    if (-not $hasMinifier) {
        Copy-Item "index.html" $minifiedHtml
        Write-Host "⚠️ Using unminified HTML" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️ Node.js not found, skipping minification" -ForegroundColor Yellow
    Copy-Item "index.html" $minifiedHtml
}

# Remove existing zip if it exists
if (Test-Path $outputZip) {
    Remove-Item $outputZip
    Write-Host "Removed existing $outputZip" -ForegroundColor Yellow
}

# Create zip with the required files (use minified HTML as index.html)
# First rename minified to index.html in a temp folder
$tempDir = "build-temp"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir | Out-Null

Copy-Item $minifiedHtml "$tempDir\index.html"
Copy-Item "config.js" "$tempDir\config.js"

# Create zip from temp folder
Compress-Archive -Path "$tempDir\*" -DestinationPath $outputZip

# Cleanup
Remove-Item $tempDir -Recurse -Force
Remove-Item $minifiedHtml -ErrorAction SilentlyContinue

# Show file sizes
$originalSize = (Get-Item "index.html").Length
$zipSize = (Get-Item $outputZip).Length
Write-Host "`n📊 Build Statistics:" -ForegroundColor Cyan
Write-Host "   Original HTML: $([math]::Round($originalSize/1024, 1)) KB" -ForegroundColor Gray
Write-Host "   Final ZIP:     $([math]::Round($zipSize/1024, 1)) KB" -ForegroundColor Gray

Write-Host "`n✅ Optimized build complete!" -ForegroundColor Green
Write-Host "📦 Created: $outputZip" -ForegroundColor Cyan
Write-Host "`nTo deploy to Netlify:" -ForegroundColor White
Write-Host "1. Go to https://app.netlify.com/drop" -ForegroundColor Gray
Write-Host "2. Drag and drop $outputZip" -ForegroundColor Gray
Write-Host "3. Your site will be live in seconds!" -ForegroundColor Gray
