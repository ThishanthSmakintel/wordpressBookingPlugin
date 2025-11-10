# Build WordPress Plugin ZIP
# Runs npm build and creates production-ready plugin package

$ErrorActionPreference = "Continue"
$pluginName = "wordpressBookingPlugin"

# Extract and auto-increment version
$pluginFile = "booking-plugin.php"
$version = "1.0.0"
if (Test-Path $pluginFile) {
    $content = Get-Content $pluginFile -Raw
    if ($content -match 'Version:\s*([\d\.]+)') {
        $currentVersion = $matches[1]
        $parts = $currentVersion.Split('.')
        $parts[2] = [int]$parts[2] + 1
        $version = $parts -join '.'
        
        # Update version in file
        $content = $content -replace "Version:\s*[\d\.]+", "Version: $version"
        $content = $content -replace "define\('BOOKING_PLUGIN_VERSION',\s*'[\d\.]+'\)", "define('BOOKING_PLUGIN_VERSION', '$version')"
        Set-Content $pluginFile -Value $content -NoNewline
        
        Write-Host "Version bumped: $currentVersion → $version" -ForegroundColor Cyan
    }
}

$zipName = "${pluginName}_v${version}.zip"

Write-Host "=== Building WordPress Plugin v$version ===" -ForegroundColor Green

# Step 1: Run npm build
Write-Host "`n[1/3] Running npm build..." -ForegroundColor Cyan
try {
    npm run build 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Build successful" -ForegroundColor Green
    } else {
        Write-Host "⚠ Build had errors, continuing anyway..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Build failed, continuing anyway..." -ForegroundColor Yellow
}

# Step 2: Copy all necessary files (keep folder structure)
Write-Host "`n[2/3] Preparing files..." -ForegroundColor Cyan
$tempDir = Join-Path $env:TEMP $pluginName
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy all directories except excluded ones
$excludeDirs = @('node_modules', 'tests', 'logs', 'backups', '.git', 'vibe_coding_help')
Get-ChildItem -Directory | Where-Object { $excludeDirs -notcontains $_.Name } | ForEach-Object {
    Copy-Item $_.FullName -Destination $tempDir -Recurse -Force
}

# Copy all root files except excluded patterns
$excludePatterns = @('*.log', '.gitignore', '.editorconfig', '.babelrc', 'package*.json', 'composer.lock', 
                     'phpunit.xml', 'phpcs.xml', '*.config.js', 'tsconfig.json', 'webpack.config.js', 
                     'test-*.php', 'test-*.html', 'fix-*.php', 'fix-*.py', 'build-plugin.ps1')
Get-ChildItem -File | Where-Object {
    $file = $_
    -not ($excludePatterns | Where-Object { $file.Name -like $_ })
} | Copy-Item -Destination $tempDir -Force

# Clean vendor dev dependencies
if (Test-Path "$tempDir\vendor") {
    Remove-Item "$tempDir\vendor\bin" -Recurse -Force -ErrorAction SilentlyContinue
    Get-ChildItem "$tempDir\vendor" -Directory | Where-Object { 
        $_.Name -match 'phpunit|sebastian|squizlabs|wp-coding-standards|yoast|doctrine|myclabs|nikic|phar-io|theseer|dealerdirect'
    } | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "✓ Files prepared" -ForegroundColor Green

# Step 4: Create ZIP
Write-Host "`n[3/3] Creating ZIP archive..." -ForegroundColor Cyan
$zipPath = Join-Path (Get-Location) $zipName
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -CompressionLevel Optimal
Remove-Item $tempDir -Recurse -Force

$zipSize = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
Write-Host "✓ ZIP created: $zipName ($zipSize MB)" -ForegroundColor Green

Write-Host "`n=== Build Complete ===" -ForegroundColor Green
Write-Host "Package: $zipPath" -ForegroundColor White
Write-Host "Version: $version" -ForegroundColor Cyan
Write-Host "`nTo update plugin: Upload ZIP in WordPress Admin > Plugins > Add New > Upload" -ForegroundColor Yellow
