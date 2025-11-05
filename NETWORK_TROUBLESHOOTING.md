# 🔧 Network Connection Troubleshooting Guide

## Problem: Phone Can't Connect to Server

If your phone app cannot connect to the server running on your PC, follow this step-by-step guide.

---

## 📋 Prerequisites Checklist

Before starting, ensure:
- [ ] Server is running on PC (`node server/index.js`)
- [ ] Phone and PC are on the **same WiFi network**
- [ ] You have **Administrator access** on PC
- [ ] You know how to find **Command Prompt** or **PowerShell**

---

## 🔍 Step 1: Find Your PC's IP Address

### Windows:
1. Press `Win + R`
2. Type `cmd` and press Enter
3. Type: `ipconfig`
4. Look for **IPv4 Address** under your active network adapter

```
Wireless LAN adapter Wi-Fi:
   IPv4 Address. . . . . . . . . . . : 192.168.1.100
```

### What to Look For:
- ✅ **Correct**: `192.168.x.x` or `10.x.x.x`
- ❌ **Wrong**: `127.0.0.1` (this is localhost, won't work)
- ❌ **Wrong**: `169.254.x.x` (no network connection)

**Write down your IP address**: `_________________`

---

## 🧪 Step 2: Test Server Locally

### Test 1: Localhost Test
1. Open browser on your PC
2. Go to: `http://localhost:3000/health`
3. You should see: `{"status":"ok"}`

**Result**: 
- ✅ **Success**: Server is running correctly
- ❌ **Failed**: Server is not running or crashed
  - Solution: Restart server with `node server/index.js`

### Test 2: IP Address Test
1. Open browser on your PC
2. Go to: `http://YOUR_IP:3000/health` (replace YOUR_IP with the IP from Step 1)
3. Example: `http://192.168.1.100:3000/health`

**Result**:
- ✅ **Success**: Server is accessible via IP
- ❌ **Failed**: Firewall is blocking (proceed to Step 3)

---

## 🔥 Step 3: Configure Windows Firewall

This is the **most common issue**. Windows Firewall blocks incoming connections by default.

### Method A: Using PowerShell (Recommended)

1. **Open PowerShell as Administrator**:
   - Press `Win + X`
   - Select "Windows PowerShell (Admin)" or "Terminal (Admin)"

2. **Run these commands**:

```powershell
# Allow Node.js through firewall
New-NetFirewallRule -DisplayName "Node.js Server" -Direction Inbound -Program "C:\Program Files\nodejs\node.exe" -Action Allow

# Allow Port 3000
New-NetFirewallRule -DisplayName "Port 3000 TCP" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

3. **Verify**:
```powershell
Get-NetFirewallRule -DisplayName "Node.js Server"
Get-NetFirewallRule -DisplayName "Port 3000 TCP"
```

### Method B: Using GUI

1. **Open Windows Defender Firewall**:
   - Press `Win + R`
   - Type: `firewall.cpl`
   - Press Enter

2. **Click "Allow an app or feature through Windows Defender Firewall"**

3. **Click "Change settings"** (requires admin)

4. **Click "Allow another app..."**

5. **Browse and select**:
   - Path: `C:\Program Files\nodejs\node.exe`
   - Click "Add"

6. **Check both boxes**:
   - ✅ Private networks
   - ✅ Public networks

7. **Click OK**

### Method C: Quick Batch Script

Create a file named `allow-server.bat` with this content:

```batch
@echo off
echo ========================================
echo  Node.js Server Firewall Configuration
echo ========================================
echo.

echo Adding firewall rules...
netsh advfirewall firewall add rule name="Node.js Server - Port 3000" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="Node.js Server - Program" dir=in action=allow program="C:\Program Files\nodejs\node.exe"

echo.
echo ✅ Firewall rules added successfully!
echo.
echo Your IP Address:
ipconfig | findstr /i "IPv4"
echo.
echo Test your server at: http://[YOUR_IP]:3000/health
echo.
pause
```

**Right-click** → **Run as Administrator**

---

## 📱 Step 4: Test from Phone

### Test 1: Browser Test
1. Open **Chrome** or **Safari** on your phone
2. Make sure phone is on **same WiFi** as PC
3. Go to: `http://YOUR_IP:3000/health`
4. Example: `http://192.168.1.100:3000/health`

**Result**:
- ✅ **Success**: Shows `{"status":"ok"}` → Firewall is configured correctly
- ❌ **Failed**: Connection timeout → See "Common Issues" below

### Test 2: App Test
Only proceed if Browser Test succeeded.

1. Update IP in app code (see Step 5)
2. Rebuild APK
3. Install and test

---

## 🛠️ Step 5: Update IP Address in Code

You need to update the IP address in **5 files**:

### File 1: `App.js` (Lines 22-23)
```javascript
const API_URL = 'http://192.168.1.100:3000/api/config';  // ← Change this
const SOCKET_URL = 'http://192.168.1.100:3000';          // ← Change this
```

### File 2: `admin-panel/renderer.js` (Line 5)
```javascript
let SERVER_URL = 'http://192.168.1.100:3000';  // ← Change this
```

### File 3: `server/index.js` (Line 1105)
```javascript
const photoUrl = `http://192.168.1.100:3000/uploads/${filename}`;  // ← Change this
```

### File 4: `FaceVerificationScreen.js` (Line 71)
```javascript
const response = await fetch(`http://192.168.1.100:3000/api/students`);  // ← Change this
```

### File 5: `OfflineFaceVerification.js` (Line 10)
```javascript
const API_URL = 'http://192.168.1.100:3000';  // ← Change this
```

**Replace `192.168.1.100` with YOUR actual IP address from Step 1**

---

## 🏗️ Step 6: Rebuild and Install APK

### 1. Clean Previous Build (Optional but Recommended)
```bash
cd android
.\gradlew.bat clean
```

### 2. Build Release APK
```bash
.\gradlew.bat assembleRelease
```

### 3. Install on Phone
```bash
cd ..
adb install -r android\app\build\outputs\apk\release\app-release.apk
```

Or manually transfer `app-release.apk` to phone and install.

---

## ❌ Common Issues & Solutions

### Issue 1: "Connection Timeout" or "Network Error"

**Possible Causes**:
1. **Different WiFi Networks**
   - Solution: Ensure both devices on same network
   - Check: Phone WiFi name = PC WiFi name

2. **Router AP Isolation Enabled**
   - Solution: Disable "AP Isolation" or "Client Isolation" in router settings
   - Or: Try a different WiFi network

3. **VPN Active**
   - Solution: Disable VPN on PC or phone
   - VPNs can block local network access

4. **Antivirus Blocking**
   - Solution: Add Node.js to antivirus exceptions
   - Or: Temporarily disable antivirus to test

### Issue 2: "Server Not Running"

**Solutions**:
1. Check if server crashed:
   ```bash
   node server/index.js
   ```

2. Check if port 3000 is already in use:
   ```bash
   netstat -ano | findstr :3000
   ```

3. Kill process using port 3000:
   ```bash
   taskkill /PID [PID_NUMBER] /F
   ```

### Issue 3: "Cannot Find IP Address"

**Solutions**:
1. Make sure you're connected to WiFi (not Ethernet)
2. Look for "Wireless LAN adapter Wi-Fi" section in ipconfig
3. If multiple IPs, try each one

### Issue 4: "Firewall Rules Not Working"

**Solutions**:
1. Verify rules were created:
   ```powershell
   Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*Node*"}
   ```

2. Temporarily disable firewall to test:
   ```powershell
   Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False
   ```
   
   **⚠️ Remember to re-enable after testing!**
   ```powershell
   Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True
   ```

3. Check if Windows Firewall service is running:
   ```powershell
   Get-Service -Name mpssvc
   ```

### Issue 5: "App Installed But Won't Connect"

**Solutions**:
1. Verify IP address is correct in all 5 files
2. Rebuild APK after changing IP
3. Uninstall old app before installing new one
4. Check server is running: `http://YOUR_IP:3000/health` in phone browser

---

## 🔒 Security Considerations

### For Development (Current Setup):
- ✅ Firewall allows connections
- ✅ Only on local network (192.168.x.x)
- ✅ Not accessible from internet

### For Production:
- Use HTTPS instead of HTTP
- Implement proper authentication
- Use environment variables for IP
- Consider using a domain name
- Set up proper firewall rules

---

## 🌐 Network Types Explained

### Home WiFi (Recommended)
- ✅ Usually works without issues
- ✅ Full control over router settings
- ✅ No AP isolation by default

### Public WiFi (Hotels, Cafes)
- ❌ Often has AP isolation enabled
- ❌ Devices can't see each other
- ❌ May block certain ports
- **Solution**: Use mobile hotspot instead

### Mobile Hotspot
- ✅ Works great for testing
- ✅ No AP isolation
- ✅ Full control
- ⚠️ Uses mobile data

### Corporate/School WiFi
- ❌ Usually has strict security
- ❌ May block custom servers
- ❌ May require IT approval
- **Solution**: Use personal hotspot

---

## 📊 Testing Checklist

Use this checklist to verify everything works:

### Server Tests:
- [ ] Server starts without errors
- [ ] `http://localhost:3000/health` works in PC browser
- [ ] `http://YOUR_IP:3000/health` works in PC browser
- [ ] `http://YOUR_IP:3000/health` works in phone browser

### Firewall Tests:
- [ ] Firewall rules created successfully
- [ ] Node.js allowed in firewall settings
- [ ] Port 3000 allowed in firewall settings

### Network Tests:
- [ ] PC and phone on same WiFi network
- [ ] IP address is correct (192.168.x.x format)
- [ ] No VPN active on either device
- [ ] Router AP isolation is disabled

### App Tests:
- [ ] IP address updated in all 5 files
- [ ] APK rebuilt after IP change
- [ ] Old app uninstalled before installing new one
- [ ] App connects and shows login screen
- [ ] Can login successfully
- [ ] Data loads correctly

---

## 🆘 Still Not Working?

If you've tried everything above and it still doesn't work:

### 1. Collect Information:
- PC IP address: `_________________`
- Phone WiFi name: `_________________`
- PC WiFi name: `_________________`
- Server running? (Yes/No): `_________________`
- Firewall rules added? (Yes/No): `_________________`
- Browser test result: `_________________`

### 2. Try Alternative Methods:

**Method A: Use ngrok (Temporary)**
```bash
# Install ngrok
npm install -g ngrok

# Run ngrok
ngrok http 3000

# Use the ngrok URL in your app
# Example: https://abc123.ngrok.io
```

**Method B: Use Local Tunnel**
```bash
# Install localtunnel
npm install -g localtunnel

# Run localtunnel
lt --port 3000

# Use the provided URL
```

**Method C: Use Your PC's Hotspot**
1. Enable mobile hotspot on PC
2. Connect phone to PC's hotspot
3. Use PC's hotspot IP address

---

## 📚 Additional Resources

- [Node.js Firewall Configuration](https://nodejs.org/en/docs/)
- [Windows Firewall Documentation](https://docs.microsoft.com/en-us/windows/security/threat-protection/windows-firewall/)
- [Network Troubleshooting Guide](https://support.microsoft.com/en-us/windows/fix-network-connection-issues-in-windows-4d9c2ebb-7d5e-4b0e-8e5e-5e5e5e5e5e5e)

---

## ✅ Success Indicators

You'll know everything is working when:
1. ✅ Server shows "Server running on port 3000"
2. ✅ Browser test shows `{"status":"ok"}`
3. ✅ Phone browser shows `{"status":"ok"}`
4. ✅ App shows login screen
5. ✅ Can login and see data

---

**Last Updated**: October 30, 2024  
**Version**: 1.0  
**For**: Attendance App Setup
