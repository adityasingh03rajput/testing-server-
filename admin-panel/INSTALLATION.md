# Installation Guide - College Admin Panel

## Quick Start (Windows)

1. **Extract the files** to a folder (e.g., `C:\CollegeAdminPanel`)

2. **Install Node.js** (if not already installed):
   - Download from: https://nodejs.org/
   - Install LTS version (v18 or higher)
   - Verify installation: Open CMD and type `node --version`

3. **Install MongoDB** (optional but recommended):
   - Download from: https://www.mongodb.com/try/download/community
   - Install with default settings
   - MongoDB will run as a Windows service

4. **Start the Backend Server**:
   - Navigate to the `server` folder
   - Double-click `server_start.bat`
   - Server will start on http://localhost:3000

5. **Start the Admin Panel**:
   - Navigate to the `admin-panel` folder
   - Double-click `start-admin.bat`
   - First time will install dependencies (takes 2-3 minutes)
   - Admin panel window will open

## Building Standalone Executable

To create a standalone `.exe` file that doesn't require Node.js:

1. Open Command Prompt in `admin-panel` folder

2. Install dependencies:
   ```
   npm install
   ```

3. Build the executable:
   ```
   npm run build-win
   ```

4. Find the installer in `admin-panel/dist/` folder

5. Install on any Windows computer (no Node.js required!)

## System Requirements

### Minimum:
- Windows 10 or higher
- 4GB RAM
- 500MB free disk space
- Internet connection (for initial setup)

### Recommended:
- Windows 10/11
- 8GB RAM
- 1GB free disk space
- MongoDB installed locally

## First Time Setup

1. **Launch Admin Panel**

2. **Configure Server** (if needed):
   - Click "Settings" in sidebar
   - Update "Server URL" if backend is on different machine
   - Default: http://localhost:3000

3. **Add Initial Data**:
   - Add classrooms first
   - Add teachers (assign timetable permissions)
   - Add students (single or bulk)
   - Create timetables

## Network Setup (Multiple Computers)

If you want to run the server on one computer and admin panel on another:

### On Server Computer:

1. Find your IP address:
   ```
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., 192.168.1.100)

2. Update server to allow external connections:
   - Edit `server/index.js`
   - Change `app.listen(3000, 'localhost'` to `app.listen(3000, '0.0.0.0'`

3. Allow port 3000 in Windows Firewall

### On Admin Panel Computer:

1. Open Admin Panel

2. Go to Settings

3. Update Server URL to: `http://192.168.1.100:3000`
   (Replace with actual server IP)

4. Click Save

## Troubleshooting

### "npm is not recognized"
- Node.js not installed or not in PATH
- Reinstall Node.js and restart computer

### "Cannot connect to server"
- Ensure backend server is running
- Check server URL in Settings
- Check firewall settings

### "Port 3000 already in use"
- Another application is using port 3000
- Close other applications or change port in server/index.js

### Admin panel window is blank
- Press `Ctrl+Shift+I` to open DevTools
- Check Console for errors
- Ensure all files are extracted properly

### MongoDB connection failed
- MongoDB service not running
- Start MongoDB service from Windows Services
- Or application will work with in-memory storage

## Updating

To update to a new version:

1. Backup your data (export from MongoDB)
2. Replace all files except `node_modules` folder
3. Run `npm install` again
4. Restart the application

## Uninstallation

1. Close Admin Panel and Server
2. Delete the installation folder
3. (Optional) Uninstall Node.js from Control Panel
4. (Optional) Uninstall MongoDB from Control Panel

## Support

For technical support:
- Check README.md for detailed usage
- Review error messages in console
- Contact your system administrator

## Security Notes

- Change default passwords immediately
- Use strong passwords for all accounts
- Keep MongoDB secured (enable authentication)
- Don't expose server to public internet without proper security
- Regular backups recommended

## Performance Tips

- Close unused applications
- Use SSD for better performance
- Allocate at least 4GB RAM
- Keep MongoDB on same machine as server for best performance

## Backup & Restore

### Backup MongoDB:
```
mongodump --db attendance_app --out C:\backup
```

### Restore MongoDB:
```
mongorestore --db attendance_app C:\backup\attendance_app
```

## Advanced Configuration

### Change Server Port:
Edit `server/index.js`, line with `server.listen(3000`

### Change MongoDB Database:
Edit `server/index.js`, change `MONGO_URI` variable

### Customize UI Theme:
Edit `admin-panel/styles.css`, modify CSS variables in `:root`

---

**Version:** 1.0.0  
**Last Updated:** 2024  
**License:** MIT
