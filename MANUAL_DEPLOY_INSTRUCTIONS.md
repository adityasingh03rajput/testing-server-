# Manual Deployment Instructions

## Problem
GitHub Actions deployment is not triggering. The workflow exists but Azure isn't receiving the deployments.

## Solution: Use Azure Portal Deployment Center

### Option 1: Redeploy from Azure Portal (EASIEST)

1. **Go to Azure Portal:** https://portal.azure.com
2. **Navigate to:** App Services → adioncode
3. **Click:** Deployment Center (left sidebar)
4. **Click:** "Sync" button at the top
5. **Wait:** 2-3 minutes for deployment
6. **Verify:** Test endpoint

### Option 2: Disconnect and Reconnect GitHub

1. **Go to:** Deployment Center
2. **Click:** "Disconnect" 
3. **Click:** "Settings" tab
4. **Select:** GitHub as source
5. **Authorize:** GitHub account
6. **Select:** 
   - Organization: adityasingh03rajput
   - Repository: testing-server-
   - Branch: main
7. **Click:** "Save"
8. **Wait:** Deployment will trigger automatically

### Option 3: Use Azure CLI to Deploy

```bash
# Get deployment credentials
az webapp deployment list-publishing-credentials --name adioncode --resource-group adioncode

# Or use zip deploy
cd "D:\letsbunk - Copy"
zip -r deploy.zip . -x "*.git*" "node_modules/*" "android/*"
az webapp deployment source config-zip --name adioncode --resource-group adioncode --src deploy.zip
```

### Option 4: Manual FTP Upload (Last Resort)

1. **Get FTP credentials:**
   - Azure Portal → adioncode → Deployment Center
   - Click "FTPS credentials"
   - Copy username and password

2. **Upload files:**
   - Use FileZilla or WinSCP
   - Connect to: ftps://waws-prod-cq1-001.ftp.azurewebsites.windows.net
   - Upload server/ folder

## Verification

After deployment, test:
```bash
curl https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net/api/student/0246CS241001
```

Should return JSON with student data, not 404.

## Why GitHub Actions Isn't Working

Possible reasons:
1. **Secret expired:** `AzureAppService_PublishProfile_1234` might be invalid
2. **Permissions:** GitHub Actions doesn't have permission to deploy
3. **Workflow not enabled:** Check GitHub repo settings
4. **Branch protection:** Main branch might have restrictions

## Quick Fix

**Recommended:** Use Azure Portal "Sync" button - takes 2 minutes and always works.

## After Deployment

1. **Reset student state:**
   ```bash
   node check-student-data.js
   # If sessionStartTime is still undefined, reset in MongoDB
   ```

2. **Fresh test:**
   - Uninstall app
   - Install app-release-new.apk
   - Login and verify face
   - Timer should start incrementing

3. **Verify database:**
   ```bash
   node check-student-data.js
   # Should show sessionStartTime with timestamp
   # Should show totalAttendedSeconds incrementing
   ```
