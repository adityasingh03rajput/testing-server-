# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### ❌ Unable to Save Student Details

**Symptoms:**
- Click "Add Student" but nothing happens
- No success notification appears
- Student doesn't appear in table

**Solutions:**

#### 1. Check Server is Running
```bash
# Make sure server is running
cd server
node index.js

# You should see:
# ✅ Connected to MongoDB
# OR
# ⚠️  MongoDB not connected, using in-memory storage
# Server running on port 3000
```

#### 2. Check Server Connection in Admin Panel
- Look at bottom left of admin panel
- Should show green dot with "Connected"
- If red "Disconnected", restart server

#### 3. Check Browser Console (Admin Panel)
```
Press Ctrl+Shift+I (or Cmd+Option+I on Mac)
Go to Console tab
Look for errors
```

#### 4. Check Server Console
Look for error messages in the terminal where server is running

#### 5. Test API Directly
```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Should return:
# {"status":"ok","timestamp":"..."}
```

#### 6. Check MongoDB (Optional)
```bash
# If MongoDB is installed, check if it's running
# Windows:
services.msc
# Look for "MongoDB" service

# If MongoDB is NOT running:
# The app will use in-memory storage (data lost on restart)
# This is NORMAL and expected!
```

---

### ❌ Unable to Update Student Details

**Symptoms:**
- Click "Edit" button
- Modal opens with data
- Click "Update Student" but nothing happens

**Solutions:**

#### 1. Check Network Tab
```
Press F12 in admin panel
Go to Network tab
Click "Update Student"
Look for PUT request to /api/students/:id
Check response
```

#### 2. Verify Student ID
- Student must have valid _id field
- Check in console: `console.log(students)`

#### 3. Restart Everything
```bash
# Stop server (Ctrl+C)
# Stop admin panel (Ctrl+C)

# Restart server
cd server
node index.js

# Restart admin panel
cd admin-panel
npm start
```

---

### ❌ Data Disappears After Restart

**Cause:** MongoDB not connected, using in-memory storage

**Solution:**

#### Option 1: Install MongoDB (Recommended)
```bash
# Download from: https://www.mongodb.com/try/download/community
# Install with default settings
# Restart server
```

#### Option 2: Use In-Memory (Temporary)
- Data will be lost on restart
- Good for testing
- Not for production

---

### ❌ Port 3000 Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solutions:**

#### Option 1: Kill Process Using Port 3000
```bash
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -i :3000
kill -9 <PID>
```

#### Option 2: Change Port
```javascript
// Edit server/index.js
// Change line:
server.listen(3000, () => {
// To:
server.listen(3001, () => {

// Then update admin panel Settings:
// Server URL: http://localhost:3001
```

---

### ❌ CORS Error

**Error:** `Access to fetch at 'http://localhost:3000/api/students' from origin 'null' has been blocked by CORS policy`

**Solution:**
Server already has CORS enabled. If you still see this:

```javascript
// Verify in server/index.js:
app.use(cors());

// If issue persists, use:
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));
```

---

### ❌ Validation Error

**Error:** `ValidationError: students validation failed`

**Cause:** Missing required fields

**Solution:**
Ensure all required fields are filled:
- Enrollment Number ✓
- Name ✓
- Email ✓
- Password ✓
- Course ✓
- Semester ✓
- Date of Birth ✓

---

### ❌ Duplicate Key Error

**Error:** `E11000 duplicate key error`

**Cause:** Trying to add student with existing enrollment number or email

**Solution:**
- Use unique enrollment numbers
- Use unique email addresses
- Delete existing record first

---

### ❌ Admin Panel Window is Blank

**Solutions:**

#### 1. Check Console
```
Press Ctrl+Shift+I
Look for JavaScript errors
```

#### 2. Reinstall Dependencies
```bash
cd admin-panel
rm -rf node_modules
npm install
npm start
```

#### 3. Check File Integrity
```bash
# Verify these files exist:
admin-panel/index.html
admin-panel/styles.css
admin-panel/renderer.js
admin-panel/main.js
```

---

### ❌ CSV Import Fails

**Symptoms:**
- Upload CSV but nothing happens
- Error notification appears

**Solutions:**

#### 1. Check CSV Format
```csv
# Correct format (no spaces after commas):
enrollmentNo,name,email,password,course,semester,dob,phone
2021001,John Doe,john@test.com,pass123,CSE,3,2003-01-01,1234567890
```

#### 2. Check for Special Characters
- Remove special characters from names
- Use standard ASCII characters

#### 3. Check Date Format
- Use: YYYY-MM-DD
- Example: 2003-01-01

---

### ❌ Notifications Don't Appear

**Solutions:**

#### 1. Check Z-Index
Notifications should appear in top-right corner

#### 2. Check Console
```
Press F12
Look for JavaScript errors
```

#### 3. Test Manually
```javascript
// In browser console:
showNotification('Test message', 'success');
```

---

### ❌ Keyboard Shortcuts Don't Work

**Solutions:**

#### 1. Check Focus
- Click inside admin panel window
- Don't have other modals open

#### 2. Test Shortcuts
- Ctrl+S (save timetable)
- Ctrl+F (focus search)
- Escape (close modal)

#### 3. Check OS Conflicts
- Some shortcuts may be used by OS
- Try Cmd instead of Ctrl on Mac

---

## 🔍 Debugging Steps

### Step 1: Check Server
```bash
cd server
node index.js

# Should see:
# Server running on port 3000
```

### Step 2: Check Server Health
```bash
# In browser:
http://localhost:3000/api/health

# Should return:
# {"status":"ok","timestamp":"..."}
```

### Step 3: Check Admin Panel Connection
- Bottom left should show "Connected" (green)

### Step 4: Test Add Student
1. Click "Students"
2. Click "➕ Add Student"
3. Fill all fields
4. Click "Add Student"
5. Check server console for logs
6. Check browser console for errors

### Step 5: Check Data
```bash
# In browser console:
fetch('http://localhost:3000/api/students')
  .then(r => r.json())
  .then(d => console.log(d));
```

---

## 📊 Diagnostic Commands

### Check Server Status
```bash
# Windows:
netstat -ano | findstr :3000

# Linux/Mac:
lsof -i :3000
```

### Check MongoDB Status
```bash
# Windows:
sc query MongoDB

# Linux:
systemctl status mongod

# Mac:
brew services list | grep mongodb
```

### Check Node.js Version
```bash
node --version
# Should be v16 or higher
```

### Check npm Version
```bash
npm --version
# Should be v8 or higher
```

---

## 🆘 Still Having Issues?

### Collect Information:

1. **Error Message:**
   - Exact error text
   - Screenshot if possible

2. **Environment:**
   - OS: Windows/Linux/Mac
   - Node.js version: `node --version`
   - MongoDB: Connected/Not Connected

3. **Steps to Reproduce:**
   - What you clicked
   - What you expected
   - What actually happened

4. **Console Logs:**
   - Server console output
   - Browser console errors (F12)

5. **Network Tab:**
   - F12 → Network
   - Show failed requests
   - Show response data

---

## ✅ Quick Fix Checklist

- [ ] Server is running
- [ ] Admin panel is running
- [ ] Server shows "Connected" in admin panel
- [ ] No errors in server console
- [ ] No errors in browser console
- [ ] Port 3000 is not blocked
- [ ] All required fields are filled
- [ ] Using correct data format
- [ ] MongoDB is running (or using in-memory)
- [ ] Latest code is running (restart both)

---

## 🔄 Complete Reset

If nothing works, try a complete reset:

```bash
# 1. Stop everything
# Press Ctrl+C in both terminals

# 2. Clean install
cd server
rm -rf node_modules
npm install

cd ../admin-panel
rm -rf node_modules
npm install

# 3. Restart
cd ../server
node index.js

# In new terminal:
cd admin-panel
npm start

# 4. Test with fresh data
```

---

## 📞 Getting Help

1. Check this troubleshooting guide
2. Review error messages carefully
3. Check server and browser consoles
4. Test with sample data
5. Try complete reset
6. Contact system administrator

---

**Last Updated:** October 17, 2024  
**Version:** 1.0.0
