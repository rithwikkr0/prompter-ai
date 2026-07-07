# Prompter AI — Build & Packaging Automation Script
# PowerShell 5.1+ Compatible

$ErrorActionPreference = "Stop"

try {
    # 1. Read version from package.json
    if (-not (Test-Path "package.json")) {
        Write-Error "package.json not found in current directory."
    }
    
    $pkg = Get-Content "package.json" -Raw | ConvertFrom-Json
    $version = $pkg.version
    Write-Host "Detected version: $version" -ForegroundColor Green

    # 2. Run React build
    Write-Host "Running compilation: npm run build..." -ForegroundColor Cyan
    npm run build

    # 3. Define output path
    $zipPath = "release/Prompter-AI-v$version.zip"
    if (-not (Test-Path "release")) {
        New-Item -ItemType Directory -Path "release" | Out-Null
    }
    if (Test-Path $zipPath) {
        Remove-Item $zipPath -Force
    }

    # 4. Copy required extension files to temporary packaging location
    $tempDir = "release/temp_package"
    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $tempDir | Out-Null

    Write-Host "Staging files..." -ForegroundColor Cyan
    
    # List files to package
    $targets = @("manifest.json", "background.js", "content.js", "popup.html", "icons", "assets")
    
    foreach ($target in $targets) {
        $sourcePath = "extension/$target"
        if (Test-Path $sourcePath) {
            Copy-Item -Path $sourcePath -Destination "$tempDir/$target" -Recurse -Force
        } else {
            Write-Warning "Source file missing: $sourcePath"
        }
    }

    # Remove any source map files from output assets to keep package lightweight
    if (Test-Path "$tempDir/assets") {
        Get-ChildItem "$tempDir/assets" -Filter *.map -Recurse | Remove-Item -Force
    }

    # 5. Compress
    Write-Host "Compressing ZIP file..." -ForegroundColor Cyan
    Compress-Archive -Path "$tempDir/*" -DestinationPath $zipPath -Force

    # 6. Cleanup
    Remove-Item $tempDir -Recurse -Force

    $fileSize = (Get-Item $zipPath).Length / 1KB
    Write-Host "Build complete! Package created successfully: $zipPath ({0:N2} KB)" -f "Green" -args $fileSize

} catch {
    Write-Error "Build and packaging failed: $_"
}
