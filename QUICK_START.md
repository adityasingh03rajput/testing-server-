# 🚀 Quick Start Guide

## Setup (One Time)

```bash
# 1. Install dependencies
cd server
npm install

# 2. Seed database
node server/seed-data.js

# 3. Start server
node server/index.js
```

## Open Admin Panel
```
Open: admin-panel/index.html in browser
```

## Test Login

### Students (Password: aditya)
- `0246CS241001` - Aditya Singh
- `0246CS231001` - Sneha Patel
- `0246EC241001` - Ananya Gupta

### Teachers (Password: aditya)
- `TEACH001` - Dr. Rajesh Kumar
- `TEACH005` - Dr. Amit Patel

## Features
- ✅ Dashboard with statistics
- ✅ Student management (click names for attendance)
- ✅ Teacher management
- ✅ Timetable editor (8 periods)
- ✅ Classrooms (51 rooms with BSSID)
- ✅ Bulk import (CSV)

## Useful Commands
```bash
# Reseed database
node server/seed-data.js

# Clear database
node server/clear-data.js

# Test data
node server/test-new-data.js

# Kill server
taskkill /F /IM node.exe
```

That's it! 🎉
