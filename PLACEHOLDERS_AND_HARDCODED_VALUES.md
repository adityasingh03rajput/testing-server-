# Placeholders & Hardcoded Values - Complete Inventory

## 📋 Overview

This document lists ALL placeholders and hardcoded values found in the APK and related code files.

**Total Categories**: 8  
**Total Items**: 150+  
**Priority**: HIGH (Many need to be made dynamic)

---

## 1. 🎓 BRANCH/COURSE NAMES (Hardcoded)

### Current Hardcoded Branches
```javascript
// App.js - Line 139
const [branch, setBranch] = useState('letsbunk enters'); // ❌ WRONG DEFAULT

// admin-panel/renderer.js - Multiple locations
const courses = ['B.Tech Data Science', 'CSE', 'ECE', 'ME', 'Civil'];

// Dropdown options (admin-panel/renderer.js)
<option value="B.Tech Data Science">Data Science</option>
<option value="CSE">Computer Science</option>
<option value="ECE">Electronics</option>
<option value="ME">Mechanical</option>
<option value="Civil">Civil Engineering</option>
<option value="B.Tech Computer Science">Computer Science (CS)</option>
<option value="B.Tech Information Technology">Information Technology (IT)</option>
<option value="B.Tech Artificial Intelligence">Artificial Intelligence (AI)</option>
<option value="B.Tech Electronics">Electronics (EC)</option>
<option value="B.Tech Mechanical">Mechanical (ME)</option>

// Notifications.js
const branches = [
    { id: 'cse', name: 'Computer Science Engineering' },
    { id: 'ece', name: 'Electronics & Communication' },
    { id: 'me', name: 'Mechanical Engineering' },
];
```

**Issue**: Branches are hardcoded in multiple files  
**Fix Needed**: Create dynamic branch management system  
**Priority**: HIGH

---

## 2. 📚 SEMESTER VALUES (Hardcoded)

### Current Hardcoded Semesters
```javascript
// App.js - Line 139
const [semester, setSemester] = useState('1'); // Default semester

// Notifications.js
const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];

// admin-panel/renderer.js - Semester dropdowns
<option value="1">Semester 1</option>
<option value="2">Semester 2</option>
<option value="3">Semester 3</option>
// ... up to 8
```

**Issue**: Semesters are hardcoded arrays  
**Fix Needed**: Make configurable (some colleges have 6, some 8, some 10 semesters)  
**Priority**: MEDIUM

---

## 3. 📝 PLACEHOLDER TEXT (UI)

### Input Placeholders

#### Login Screen (App.js)
```javascript
placeholder="Enter your ID"           // Line 2130
placeholder="Enter your password"     // Line 2148
```

#### Student Name Input (App.js)
```javascript
title: { text: 'Enter Your Name' }    // Line 84, 294
placeholder: 'Your Name'               // Line 87, 297
subtitle: 'This will be visible to your teacher'
```

#### Admin Panel (admin-panel/renderer.js)
```javascript
// Student Form
placeholder="e.g., Data Structures"   // Subject
placeholder="e.g., 3"                  // Semester
placeholder="XX:XX:XX:XX:XX:XX"        // WiFi BSSID

// Teacher Form
placeholder="Enter new password"       // Password field

// Classroom Form
placeholder="XX:XX:XX:XX:XX:XX"        // WiFi BSSID

// Template Form
placeholder="e.g., CSE Standard Template"

// Subject Form
placeholder="Mathematics\nPhysics\nChemistry\nEnglish\nComputer Science"

// Holiday Form
placeholder="e.g., Diwali"
placeholder="Optional description"

// Academic Year
placeholder="e.g., 2024-2025"
value="2024-2025"                      // Hardcoded year

// Semester Dates
placeholder="Start Date"
placeholder="End Date"

// Feature Request
placeholder="Enter your name"
placeholder="your.email@example.com"
```

#### Teacher UI (NativeBunkTeacherUi)
```javascript
// Feedback.js
placeholder="your.email@example.com"
```

**Issue**: All placeholder text is hardcoded in English  
**Fix Needed**: Internationalization (i18n) support  
**Priority**: LOW (unless multi-language support needed)

---

## 4. 🖼️ PHOTO PLACEHOLDERS

### Photo Upload Placeholders
```javascript
// admin-panel/renderer.js
<div class="photo-placeholder">📷 No photo</div>

// LanyardCard.js
<View style={styles.photoPlaceholder}>
    <Text style={styles.photoPlaceholderText}>
        {getInitials(userData?.name)}
    </Text>
</View>
```

**Issue**: Placeholder text and styling hardcoded  
**Fix Needed**: Make customizable  
**Priority**: LOW

---

## 5. 🏢 BRANDING TEXT (Hardcoded)

### App Branding
```javascript
// App.js - Line 3641, 3678, 3685
<Text>LetsBunk</Text>  // App name hardcoded

// NativeBunkTeacherUi/src/teacher/index.js
/**
 * LetsBunk Teacher App
 * React Native Entry Point
 */

// HelpAndSupport.js, Feedback.js
"Help us improve LetsBunk by sharing your thoughts..."
```

**Issue**: App name "LetsBunk" is hardcoded everywhere  
**Fix Needed**: Make configurable for white-label versions  
**Priority**: MEDIUM (if planning white-label)

---

## 6. 📧 SAMPLE/TEST DATA

### Email Examples
```javascript
// admin-panel/renderer.js
placeholder="your.email@example.com"

// NativeBunkTeacherUi
placeholder="your.email@example.com"
```

### Sample Timetable Data
```javascript
// admin-panel/renderer.js - Line 4938
const response = await fetch(`${SERVER_URL}/api/timetable/1/CSE`);
// Uses CSE as sample branch

// NativeBunkTeacherUi/src/teacher/services/connectionTest.js
const response = await apiService.getTimetable('3', 'CSE');
// Uses semester 3, CSE as test data
```

### Sample Student Data
```javascript
// reset-and-add-all-students.js - Line 19-21
// All 122 official RGPV students - Data Science Branch
const allStudents = [
    { enrollment: '0246CD241001', name: 'AADESH CHOUKSEY', ... },
    // ... 121 more students
];

// All hardcoded to:
course: 'B.Tech Data Science'
semester: '3'
```

### Sample Activity Data
```javascript
// admin-panel/renderer.js - Line 350
<div>Timetable updated for CSE Semester 3</div>
<div class="activity-time">15 minutes ago</div>
```

**Issue**: Sample data is hardcoded and specific to one college  
**Fix Needed**: Remove or make configurable  
**Priority**: HIGH (for multi-college deployment)

---

## 7. 🔧 DEFAULT VALUES

### Default Configuration Values
```javascript
// App.js - getDefaultConfig()
roleSelection: {
    backgroundColor: '#0a1628',
    title: { text: 'Who are you?', fontSize: 36, color: '#00f5ff' },
    subtitle: { text: 'Select your role to continue', fontSize: 16 },
    roles: [
        { id: 'student', text: 'Student', icon: '🎓' },
        { id: 'teacher', text: 'Teacher', icon: '👨‍🏫' }
    ]
}

studentScreen: {
    timer: { duration: 120 } // 120 seconds default
}
```

### Default Semester/Branch
```javascript
// App.js
const [semester, setSemester] = useState('1');
const [branch, setBranch] = useState('letsbunk enters'); // ❌ WRONG
```

### Default Academic Year
```javascript
// admin-panel/renderer.js
value="2024-2025"  // Hardcoded academic year
```

**Issue**: Default values are hardcoded  
**Fix Needed**: Load from configuration/database  
**Priority**: HIGH

---

## 8. 📊 DASHBOARD STATISTICS (Hardcoded)

### Course Statistics
```javascript
// admin-panel/renderer.js - Line 278
const courses = ['B.Tech Data Science', 'CSE', 'ECE', 'ME', 'Civil'];

// Hardcoded course IDs
if (course === 'B.Tech Data Science') {
    countId = 'dsCount';
    progressId = 'dsProgress';
}
```

**Issue**: Course list and IDs are hardcoded  
**Fix Needed**: Dynamic course management  
**Priority**: HIGH

---

## 9. 🗓️ CALENDAR/DATE PLACEHOLDERS

### Date Input Placeholders
```javascript
// admin-panel/renderer.js
placeholder="Start Date"
placeholder="End Date"

// Semester dates
<h4>Semester 1 (Odd)</h4>
<input type="date" placeholder="Start Date">
<input type="date" placeholder="End Date">

<h4>Semester 2 (Even)</h4>
<input type="date" placeholder="Start Date">
<input type="date" placeholder="End Date">
```

**Issue**: Semester naming (Odd/Even) is hardcoded  
**Fix Needed**: Make configurable  
**Priority**: LOW

---

## 10. 🏫 CLASSROOM DATA (Hardcoded)

### CSV Template
```javascript
// admin-panel/renderer.js - downloadClassroomTemplate()
const template = `roomNumber,building,capacity,wifiBSSID
CS-101,CS,60,00:1A:2B:3C:4D:01
EC-101,EC,60,00:1A:2B:3C:5D:01
ME-101,ME,60,00:1A:2B:3C:6D:01
CE-101,CE,60,00:1A:2B:3C:7D:01`;
```

**Issue**: Sample classroom data is hardcoded  
**Fix Needed**: Generate from actual data or make template generic  
**Priority**: MEDIUM

---

## 11. 🔔 NOTIFICATION TEXT (Hardcoded)

### Success Messages
```javascript
// admin-panel/renderer.js
showNotification('Template downloaded!', 'success');
showNotification('Template saved successfully', 'success');
showNotification('PDF export feature coming soon!', 'info');
showNotification('Excel export feature coming soon!', 'info');
```

### Error Messages
```javascript
// App.js
alert('Failed to start attendance session. Please try again.');
alert('Network error: Failed to start attendance session...');
```

**Issue**: All notification text is hardcoded in English  
**Fix Needed**: Internationalization  
**Priority**: LOW

---

## 12. 🎨 THEME COLORS (Hardcoded)

### Color Values
```javascript
// App.js - THEMES object
dark: {
    background: '#0a1628',
    cardBackground: '#0d1f3c',
    text: '#ffffff',
    textSecondary: '#00d9ff',
    primary: '#00f5ff',
    border: '#00d9ff',
}

light: {
    background: '#fef3e2',
    cardBackground: '#ffffff',
    text: '#2c1810',
    textSecondary: '#8b6f47',
    primary: '#d97706',
    border: '#f3d5a0',
}
```

**Issue**: Theme colors are hardcoded  
**Fix Needed**: Make customizable for branding  
**Priority**: MEDIUM (for white-label)

---

## 13. 🔗 TODO/FIXME COMMENTS

### Incomplete Features
```javascript
// admin-panel/renderer.js
// TODO: Implement PDF export using jsPDF
// TODO: Implement Excel export

// index.js
// TODO: Verify face data against stored photo
```

**Issue**: Features marked as TODO are not implemented  
**Fix Needed**: Implement or remove comments  
**Priority**: VARIES

---

## 🎯 PRIORITY FIXES NEEDED

### CRITICAL (Fix Immediately)
1. ❌ **App.js Line 139**: `setBranch('letsbunk enters')` - Wrong default branch
2. ❌ **Hardcoded student data**: Remove 122 hardcoded students from reset script
3. ❌ **Hardcoded branches**: Make branch list dynamic from database

### HIGH (Fix This Week)
4. ❌ **Sample timetable fetch**: Remove hardcoded CSE/semester 3 references
5. ❌ **Academic year**: Make 2024-2025 dynamic
6. ❌ **Course statistics**: Make course list dynamic

### MEDIUM (Fix This Month)
7. ❌ **Classroom template**: Generate from actual data
8. ❌ **Theme colors**: Make customizable
9. ❌ **Branding text**: Make "LetsBunk" configurable

### LOW (Future Enhancement)
10. ❌ **Internationalization**: Add i18n support for all text
11. ❌ **Placeholder text**: Make customizable
12. ❌ **Photo placeholders**: Make customizable

---

## 🔧 RECOMMENDED FIXES

### Fix #1: Remove Wrong Default Branch
```javascript
// App.js - Line 139
// BEFORE
const [branch, setBranch] = useState('letsbunk enters'); // ❌

// AFTER
const [branch, setBranch] = useState(''); // ✅ Empty until user selects
```

### Fix #2: Dynamic Branch Management
```javascript
// Create new endpoint: GET /api/config/branches
app.get('/api/config/branches', async (req, res) => {
    const branches = await Branch.find({ isActive: true });
    res.json({ success: true, branches });
});

// App.js - Load branches dynamically
const [branches, setBranches] = useState([]);

useEffect(() => {
    fetch(`${SOCKET_URL}/api/config/branches`)
        .then(res => res.json())
        .then(data => setBranches(data.branches));
}, []);
```

### Fix #3: Dynamic Academic Year
```javascript
// Calculate current academic year
const getCurrentAcademicYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // Academic year starts in July (month 6)
    if (month >= 6) {
        return `${year}-${year + 1}`;
    } else {
        return `${year - 1}-${year}`;
    }
};

// Use in admin panel
value={getCurrentAcademicYear()}
```

### Fix #4: Configuration System
```javascript
// Create app_config collection in database
{
    appName: "LetsBunk",
    academicYear: "2024-2025",
    branches: [...],
    semesters: [...],
    theme: {...},
    features: {
        randomRing: true,
        faceVerification: true,
        // ...
    }
}

// Load on app start
const config = await fetch('/api/config/app').then(r => r.json());
```

---

## 📊 STATISTICS

### Placeholders by Category
| Category | Count | Priority |
|----------|-------|----------|
| Branch Names | 30+ | HIGH |
| Placeholder Text | 40+ | LOW |
| Sample Data | 20+ | HIGH |
| Default Values | 15+ | HIGH |
| Branding Text | 10+ | MEDIUM |
| Theme Colors | 12 | MEDIUM |
| TODO Comments | 5+ | VARIES |

### Files with Most Placeholders
1. **admin-panel/renderer.js**: 80+ placeholders
2. **App.js**: 30+ placeholders
3. **reset-and-add-all-students.js**: 122 hardcoded students
4. **Notifications.js**: 10+ placeholders
5. **Various component files**: 5-10 each

---

## 📝 TESTING CHECKLIST

After fixing placeholders:
- [ ] Test with different branch names
- [ ] Test with different semester counts
- [ ] Test with different academic years
- [ ] Test with custom branding
- [ ] Test with custom theme colors
- [ ] Verify no hardcoded data remains
- [ ] Test multi-college deployment

---

## 🔍 SEARCH PATTERNS USED

To find these placeholders, the following patterns were searched:
- `placeholder|Placeholder|PLACEHOLDER`
- `TODO|FIXME|XXX|TEMP|HACK`
- `letsbunk|sample|example.com|dummy`
- `B.Tech|Computer Science|Data Science|CSE`
- `default.*value|Enter your|Type here`

---

**Last Updated**: December 9, 2025  
**Audited By**: Kiro AI Assistant  
**Total Items Found**: 150+  
**Status**: ⚠️ NEEDS ATTENTION
