# Build APK Script - Fixed Version
# Handles file locking issues

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Building Android APK (Fixed)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop Gradle daemons
Write-Host "Step 1: Stopping Gradle daemons..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Set-Location android
& .\gradlew --stop
Set-Location ..
Write-Host ""

# Step 2: Kill processes
Write-Host "Step 2: Killing processes that might lock APK..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Get-Process | Where-Object {$_.Name -eq "adb" -or $_.Name -eq "java"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host ""

# Step 3: Clean old files
Write-Host "Step 3: Cleaning old APK files..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Remove-Item "android\app\build\outputs\apk\release\*.apk" -Force -ErrorAction SilentlyContinue
Remove-Item "app-release-*.apk" -Force -ErrorAction SilentlyContinue
Write-Host ""

# Step 4: Build APK
Write-Host "Step 4: Building Release APK..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "This may take 2-3 minutes..." -ForegroundColor Gray
Write-Host ""
Set-Location android
& .\gradlew assembleRelease --no-daemon
$buildResult = $LASTEXITCODE
Set-Location ..
Write-Host ""

# Step 5: Copy APK
Write-Host "Step 5: Copying APK to root directory..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
$apkPath = "android\app\build\outputs\apk\release\app-release.apk"
if (Test-Path $apkPath) {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $outputApk = "app-release-$timestamp.apk"
    Copy-Item $apkPath $outputApk -Force
    Write-Host "APK copied successfully to: $outputApk" -ForegroundColor Green
    Write-Host ""
    
    # Step 6: Install APK
    Write-Host "Step 6: Installing APK on device..." -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    & adb install -r $outputApk
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "SUCCESS! APK installed on device" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "APK saved as: $outputApk" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Yellow
        Write-Host "APK built but installation failed" -ForegroundColor Yellow
        Write-Host "Please install manually: $outputApk" -ForegroundColor Yellow
        Write-Host "========================================" -ForegroundColor Yellow
    }
} else {
    Write-Host "ERROR: APK file not found!" -ForegroundColor Red
    Write-Host "Build may have failed." -ForegroundColor Red
}

Write-Host ""
Write-Host "Build process completed." -ForegroundColor Cyan
