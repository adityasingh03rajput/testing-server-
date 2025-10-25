# 📦 College Attendance Admin Panel - Installer Guide

## 🎯 Overview

This guide will help you create a standalone Windows installer (.exe) for the College Attendance Admin Panel that can be installed and run on any Windows PC.

## 📋 Prerequisites

Before building the installer, ensure you have:

1. **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
2. **npm** (comes with Node.js)
3. **Windows OS** (for building Windows installer)

## 🚀 Quick Start - Build Installer

### Method 1: Using Batch File (Easiest)

1. **Double-click** `BUILD_ADMIN_INSTALLER.bat`
2. Wait for the build process to complete (5-10 minutes)
3. Find your installer at: `admin-panel\dist\College Attendance Admin Setup 1.0.0.exe`

### Method 2: Manual Build

```bash
# Navigate to admin panel directory
cd admin-panel

# Install dependencies
npm install

# Install Electron Builder
npm install --save-dev electron@^27.0.0 electron-builder@^24.6.4

# Copy electron package configuration
copy package-electron.json package.json

# Build Windows installer
npm run build-win
```

## 📦 What Gets Created

After building, you'll find in `admin-panel/dist/`:

- **College Attendance Admin Setup 1.0.0.exe** (~150MB)
  - Full installer with NSIS
  - Can be shared and installed on any Windows PC
  - Creates desktop shortcut
  - Creates Start Menu entry
  - Includes uninstaller

## 💿 Installing the Admin Panel

### For End Users:

1. **Download/Copy** the installer exe file
2. **Double-click** the installer
3. **Follow** the installation wizard:
   - Choose installation directory (default: `C:\Program Files\College Attendance Admin`)
   - Select shortcuts (Desktop, Start Menu)
   - Click Install
4. **Launch** from Desktop shortcut or Start Menu

### Installation Options:

- ✅ Desktop Shortcut
- ✅ Start Menu Entry
- ✅ Custom Installation Directory
- ✅ Automatic Updates (future)

## 🎮 Using the Installed Admin Panel

### First Launch:

1. **Open** College Attendance Admin from Desktop or Start Menu
2. **Configure Server URL**:
   - Click Settings (⚙️)
   - Enter your server IP: `http://YOUR_SERVER_IP:3000`
   - Click Save
3. **Start Managing**:
   - Add Students
   - Add Teachers
   - Create Timetables
   - View Attendance

### Features Available:

- 👥 Student Management (Add, Edit, Delete, Bulk Import)
- 👨‍🏫 Teacher Management
- 📅 Timetable Creation & Editing
- 📊 Dashboard & Analytics
- 📸 Photo Upload & Face Recognition
- 📥 Import/Export (CSV, Excel, PDF)

## 🔧 Configuration

### Server Connection:

The admin panel needs to connect to your backend server:

1. **Local Network**: `http://192.168.x.x:3000`
2. **Same PC**: `http://localhost:3000`
3. **Remote Server**: `http://your-domain.com:3000`

### Settings Location:

- Settings are saved in: `%APPDATA%\college-attendance-admin\`
- Can be reset by deleting this folder

## 📤 Distribution

### Sharing the Installer:

1. **Copy** `College Attendance Admin Setup 1.0.0.exe`
2. **Share** via:
   - USB Drive
   - Network Share
   - Cloud Storage (Google Drive, Dropbox)
   - Email (if size permits)

### System Requirements:

- **OS**: Windows 7/8/10/11 (64-bit)
- **RAM**: 2GB minimum, 4GB recommended
- **Disk Space**: 500MB
- **Network**: Required for server connection

## 🔄 Updates

### Updating the Admin Panel:

1. **Build** new installer with updated version
2. **Run** new installer (will upgrade existing installation)
3. **Or** uninstall old version first, then install new

### Version Management:

Edit `admin-panel/package-electron.json`:
```json
{
  "version": "1.1.0"  // Change this
}
```

## 🐛 Troubleshooting

### Build Errors:

**Error: "electron-builder not found"**
```bash
npm install --save-dev electron-builder
```

**Error: "Cannot find module"**
```bash
cd admin-panel
npm install
```

**Error: "EPERM: operation not permitted"**
- Run Command Prompt as Administrator
- Disable antivirus temporarily

### Installation Errors:

**"Windows protected your PC"**
- Click "More info"
- Click "Run anyway"
- (App is not code-signed, this is normal)

**"Installation failed"**
- Run installer as Administrator
- Check disk space
- Disable antivirus temporarily

### Runtime Errors:

**"Cannot connect to server"**
- Check server is running
- Verify server URL in Settings
- Check firewall settings

**"App won't start"**
- Reinstall the application
- Check Windows Event Viewer for errors
- Run as Administrator

## 📁 File Structure

```
admin-panel/
├── dist/                          # Build output
│   └── College Attendance Admin Setup 1.0.0.exe
├── main.js                        # Electron main process
├── index.html                     # Admin panel UI
├── renderer.js                    # Admin panel logic
├── styles.css                     # Styling
├── package-electron.json          # Electron config
├── electron-builder.json          # Builder config
├── installer.nsh                  # NSIS script
├── icon.ico                       # App icon
└── LICENSE.txt                    # License
```

## 🎨 Customization

### Change App Icon:

1. Create/Get a `.ico` file (256x256 recommended)
2. Replace `admin-panel/icon.ico`
3. Rebuild installer

### Change App Name:

Edit `admin-panel/package-electron.json`:
```json
{
  "productName": "Your Custom Name"
}
```

### Change Installer Options:

Edit `admin-panel/electron-builder.json`:
- Installation directory
- Shortcuts
- License text
- Installer appearance

## 📞 Support

### Getting Help:

1. Check this guide first
2. Review error messages
3. Check server logs
4. Contact system administrator

### Common Issues:

- **Server Connection**: Verify server IP and port
- **Photo Upload**: Check server uploads folder permissions
- **Slow Performance**: Check network speed
- **Data Not Saving**: Verify MongoDB is running

## ✅ Checklist

Before distributing:

- [ ] Test installer on clean Windows PC
- [ ] Verify all features work
- [ ] Test server connection
- [ ] Check photo upload
- [ ] Test timetable creation
- [ ] Verify data persistence
- [ ] Create user documentation
- [ ] Prepare server setup guide

## 🎉 Success!

You now have a professional Windows installer for your College Attendance Admin Panel that can be:

- ✅ Installed on any Windows PC
- ✅ Shared with administrators
- ✅ Used without technical knowledge
- ✅ Updated easily
- ✅ Uninstalled cleanly

---

**Version**: 1.0.0  
**Last Updated**: October 25, 2025  
**Platform**: Windows 7/8/10/11 (64-bit)
