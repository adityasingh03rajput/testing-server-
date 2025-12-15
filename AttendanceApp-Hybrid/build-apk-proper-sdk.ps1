# PowerShell script to build Android APK with proper SDK configuration
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Building Android APK with Proper SDK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set Android SDK environment variables
Write-Host "Setting up Android SDK environment..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
$env:ANDROID_HOME = "C:\Android\Sdk"
$env:ANDROID_SDK_ROOT = "C:\Android\Sdk"
$env:PATH = "$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\tools;$env:ANDROID_HOME\tools\bin;$env:ANDROID_HOME\build-tools\34.0.0;$env:PATH"

Write-Host "✅ ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Green
Write-Host "✅ ANDROID_SDK_ROOT: $env:ANDROID_SDK_ROOT" -ForegroundColor Green
Write-Host ""

# Verify SDK tools
Write-Host "Verifying Android SDK tools..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

if (Test-Path "$env:ANDROID_HOME\platform-tools\adb.exe") {
    Write-Host "✅ ADB found at: $env:ANDROID_HOME\platform-tools\adb.exe" -ForegroundColor Green
} else {
    Write-Host "❌ ADB not found - check Android SDK installation" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

if (Test-Path "$env:ANDROID_HOME\build-tools\34.0.0") {
    Write-Host "✅ Build tools 34.0.0 found" -ForegroundColor Green
} else {
    Write-Host "❌ Build tools 34.0.0 not found" -ForegroundColor Red
    Write-Host "Please install using Android Studio SDK Manager or:" -ForegroundColor Yellow
    Write-Host "sdkmanager `"build-tools;34.0.0`"" -ForegroundColor Cyan
}
Write-Host ""

# Check Java version
Write-Host "Checking Java version..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
try {
    $javaVersion = java -version 2>&1
    Write-Host $javaVersion -ForegroundColor Green
} catch {
    Write-Host "❌ Java not found - please install Java 17" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 1: Clean previous builds
Write-Host "Step 1: Cleaning previous builds..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Set-Location android
try {
    & .\gradlew clean --no-daemon
    Write-Host "✅ Clean completed" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Clean failed, continuing..." -ForegroundColor Yellow
}
Set-Location ..
Write-Host ""

# Step 2: Stop Gradle daemons
Write-Host "Step 2: Stopping Gradle daemons..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Set-Location android
& .\gradlew --stop
Set-Location ..
Write-Host ""

# Step 3: Kill interfering processes
Write-Host "Step 3: Killing interfering processes..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
try {
    Stop-Process -Name "adb" -Force -ErrorAction SilentlyContinue
    Stop-Process -Name "java" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "✅ Processes cleaned" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Some processes couldn't be stopped" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Remove old APK files
Write-Host "Step 4: Removing old APK files..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
if (Test-Path "android\app\build\outputs\apk\release\*.apk") {
    Remove-Item "android\app\build\outputs\apk\release\*.apk" -Force
    Write-Host "✅ Old release APKs removed" -ForegroundColor Green
}
if (Test-Path "app-release-*.apk") {
    Remove-Item "app-release-*.apk" -Force
    Write-Host "✅ Old root APKs removed" -ForegroundColor Green
}
Write-Host ""

# Step 5: Build the release APK
Write-Host "Step 5: Building Release APK..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "This may take 3-5 minutes depending on your system..." -ForegroundColor Cyan
Write-Host ""

Set-Location android
$buildResult = & .\gradlew assembleRelease --no-daemon --stacktrace
$buildExitCode = $LASTEXITCODE
Set-Location ..
Write-Host ""

# Step 6: Process build result
Write-Host "Step 6: Processing build result..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

if ($buildExitCode -eq 0) {
    Write-Host "✅ Build completed successfully!" -ForegroundColor Green
    
    if (Test-Path "android\app\build\outputs\apk\release\app-release.apk") {
        Copy-Item "android\app\build\outputs\apk\release\app-release.apk" "app-release-latest.apk" -Force
        Write-Host "✅ APK copied to: app-release-latest.apk" -ForegroundColor Green
        
        # Get APK size
        $apkSize = (Get-Item "app-release-latest.apk").Length
        $apkSizeMB = [math]::Round($apkSize / 1MB, 2)
        Write-Host "✅ APK Size: $apkSizeMB MB ($apkSize bytes)" -ForegroundColor Green
        Write-Host ""
        
        # Step 7: Install APK on device
        Write-Host "Step 7: Installing APK on connected device..." -ForegroundColor Yellow
        Write-Host "========================================" -ForegroundColor Yellow
        
        # Check for connected devices
        $devices = & adb devices
        if ($devices -match "device$") {
            Write-Host "✅ Android device detected" -ForegroundColor Green
            $installResult = & adb install -r "app-release-latest.apk"
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "========================================" -ForegroundColor Green
                Write-Host "✅ SUCCESS! APK built and installed" -ForegroundColor Green
                Write-Host "========================================" -ForegroundColor Green
                Write-Host "APK Location: app-release-latest.apk" -ForegroundColor Cyan
                Write-Host "Size: $apkSizeMB MB" -ForegroundColor Cyan
                Write-Host "Target SDK: 34" -ForegroundColor Cyan
                Write-Host "Min SDK: 23" -ForegroundColor Cyan
                Write-Host "========================================" -ForegroundColor Green
            } else {
                Write-Host "❌ Installation failed - please install manually" -ForegroundColor Red
                Write-Host "APK available at: app-release-latest.apk" -ForegroundColor Cyan
            }
        } else {
            Write-Host "⚠️ No Android device connected" -ForegroundColor Yellow
            Write-Host "APK built successfully: app-release-latest.apk" -ForegroundColor Green
            Write-Host "Connect device and run: adb install -r app-release-latest.apk" -ForegroundColor Cyan
        }
    } else {
        Write-Host "❌ APK file not found after successful build" -ForegroundColor Red
        Write-Host "Check: android\app\build\outputs\apk\release\" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Build failed with error code: $buildExitCode" -ForegroundColor Red
    Write-Host "Check the build output above for errors" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Common solutions:" -ForegroundColor Cyan
    Write-Host "- Ensure Android SDK is properly installed" -ForegroundColor White
    Write-Host "- Check Java version compatibility" -ForegroundColor White
    Write-Host "- Run: gradlew clean in android folder" -ForegroundColor White
    Write-Host "- Check for missing dependencies" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build Process Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SDK Path: $env:ANDROID_HOME" -ForegroundColor White
Write-Host "Build Tools: 34.0.0" -ForegroundColor White
Write-Host "Target SDK: 34" -ForegroundColor White
Write-Host "Min SDK: 23" -ForegroundColor White
Write-Host "Java Version: OpenJDK 17" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan

Read-Host "Press Enter to exit"