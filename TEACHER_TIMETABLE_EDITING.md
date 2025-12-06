# 📅 Teacher Timetable Editing Feature

## Overview
Teachers with timetable editing permission can now edit and update timetables directly from the mobile APK.

---

## ✅ Who Can Edit?

Only teachers with **"Timetable Access"** enabled in the admin panel can edit timetables.

### Check Your Access:
1. Login as teacher (e.g., TEACH001)
2. Go to **Timetable** tab
3. Look for **"✏️ EDIT MODE"** badge in the header
4. If you see it, you can edit!

### Teachers with Edit Access (by default):
- **TEACH001** - Dr. Rajesh Kumar (CSE, Data Structures)
- **TEACH002** - Prof. Meera Singh (CSE, Database Management)
- **TEACH003** - Dr. Sunil Patil (CSE, Programming in C)
- **TEACH004** - Prof. Anjali Desai (CSE, Machine Learning)

---

## 🎯 How to Edit Timetable

### Step 1: Navigate to Timetable
1. Login as teacher with edit access
2. Tap **"Timetable"** tab in bottom navigation
3. You'll see **"✏️ EDIT MODE"** badge if you have permission

### Step 2: Select Day
- Swipe or tap day buttons (Mon, Tue, Wed, etc.)
- Select the day you want to edit

### Step 3: Edit a Period
1. **Tap on any period** in the schedule
2. Edit modal will open with options:

#### Option A: Edit Subject & Room
- Enter **Subject Name** (e.g., "Data Structures")
- Enter **Room Number** (e.g., "Room 301")
- Tap **"💾 Save"** button

#### Option B: Mark as Break
- Tap **"☕ Mark as Break"** button
- Period will be marked as break time
- Shows with coffee icon and yellow color

#### Option C: Clear Period
- Tap **"🗑️ Clear Period"** button
- Removes subject and marks as free period

#### Option D: Cancel
- Tap **"Cancel"** to close without changes

### Step 4: Save to Server
1. After making all changes
2. Tap **"💾 Save"** button in the header
3. Wait for confirmation: "Timetable saved successfully!"
4. Changes are now live for all students

---

## 🛠️ Editing Tools

### 1. Edit Subject & Room
**Use when:** Assigning or changing a class
```
Subject: Data Structures
Room: Room 301
```

### 2. Mark as Break
**Use when:** Setting lunch break, tea break, etc.
- Automatically sets subject to "Break"
- Clears room number
- Shows with ☕ icon and yellow background

### 3. Clear Period
**Use when:** Removing a class or making it a free period
- Clears both subject and room
- Shows as "Free Period"

### 4. Refresh
**Use when:** Want to see latest changes from server
- Tap **"🔄 Refresh"** button
- Reloads timetable from server

---

## 📊 Views Available

### 1. Day View (List)
- Shows selected day's schedule
- Period-by-period list
- Current period highlighted with "Now" badge
- Tap any period to edit

### 2. Week Overview (Grid)
- Shows entire week at a glance
- Horizontal scrollable table
- All periods for all days
- Quick visual overview

---

## 🎨 Visual Indicators

### Edit Mode Badge
```
✏️ EDIT MODE
```
- Shows in header when you have edit permission
- Green/cyan color matching theme

### Current Period
```
[Period Card with "Now" badge]
```
- Highlighted with primary color background
- Shows which period is currently running

### Break Periods
```
☕ Break
```
- Yellow/amber background (#fbbf2420)
- Coffee icon
- No room number shown

### Free Periods
```
Free Period
```
- Gray text
- No icon
- No room number

---

## 💡 Tips & Best Practices

### 1. Save Frequently
- Don't make too many changes at once
- Save after editing each day
- Prevents data loss if app closes

### 2. Check Before Saving
- Review all changes in Week Overview
- Ensure no conflicts (same teacher, different rooms)
- Verify break periods are correct

### 3. Coordinate with Admin
- Major changes should be discussed with admin
- Admin can see all changes in admin panel
- Admin can revert if needed

### 4. Use Consistent Naming
- Use full subject names (not abbreviations)
- Use standard room format (e.g., "Room 301", not "R301")
- Helps students find classes easily

### 5. Mark Breaks Properly
- Use "Mark as Break" button (don't type "Break")
- Ensures proper formatting and icons
- Shows correctly in student app

---

## 🔒 Permissions

### How to Get Edit Access:
1. Contact your admin
2. Admin opens **Admin Panel**
3. Admin goes to **Teachers** section
4. Admin finds your name
5. Admin toggles **"Timetable Access"** to **"Enabled"**
6. Logout and login again in mobile app
7. You now have edit access!

### How to Remove Edit Access:
- Admin can disable it anytime
- You'll lose edit button immediately
- Can still view timetable (read-only)

---

## 🐛 Troubleshooting

### Issue 1: No "Edit Mode" Badge
**Cause:** You don't have timetable edit permission

**Solution:**
1. Contact admin to enable "Timetable Access"
2. Logout and login again
3. Check if badge appears

### Issue 2: Changes Not Saving
**Cause:** Network issue or server error

**Solution:**
1. Check internet connection
2. Try again after a few seconds
3. If persists, contact admin

### Issue 3: Can't See Latest Changes
**Cause:** Cache or old data

**Solution:**
1. Tap **"🔄 Refresh"** button
2. Or close and reopen app
3. Changes should appear

### Issue 4: Edit Modal Not Opening
**Cause:** Not in edit mode or permission issue

**Solution:**
1. Check for "✏️ EDIT MODE" badge
2. Logout and login again
3. Contact admin if still not working

---

## 📱 Screenshots Guide

### 1. Timetable Tab with Edit Mode
```
┌─────────────────────────────────┐
│ 📚 Timetable        💾 Save     │
│ Semester 3 • CSE  ✏️ EDIT MODE  │
├─────────────────────────────────┤
│ [Mon] [Tue] [Wed] [Thu] [Fri]   │
├─────────────────────────────────┤
│ Monday's Schedule    🔄 Refresh │
│                                 │
│ 1  09:40-10:40                  │
│    Data Structures              │
│    📍 Room 301                  │
│                                 │
│ 2  10:40-11:40                  │
│    Database Management          │
│    📍 Room 302                  │
│                                 │
│ 3  11:40-12:10                  │
│    ☕ Break                     │
│                                 │
└─────────────────────────────────┘
```

### 2. Edit Modal
```
┌─────────────────────────────────┐
│ Edit Period                     │
│ Monday - Period 1               │
├─────────────────────────────────┤
│ Subject Name                    │
│ [Data Structures            ]   │
│                                 │
│ Room Number                     │
│ [Room 301                   ]   │
├─────────────────────────────────┤
│ [☕ Mark as Break] [🗑️ Clear]   │
├─────────────────────────────────┤
│ [Cancel]          [💾 Save]     │
└─────────────────────────────────┘
```

---

## 🔄 Workflow Example

### Scenario: Change Monday Period 1 from "Programming" to "Data Structures"

1. **Open App**
   - Login as TEACH001
   - Tap "Timetable" tab

2. **Select Day**
   - Tap "Mon" button
   - See Monday's schedule

3. **Edit Period**
   - Tap on Period 1 (currently shows "Programming")
   - Edit modal opens

4. **Make Changes**
   - Change subject to "Data Structures"
   - Change room to "Room 301"
   - Tap "💾 Save"

5. **Save to Server**
   - Tap "💾 Save" button in header
   - Wait for "Timetable saved successfully!"

6. **Verify**
   - Check Week Overview
   - Confirm Monday Period 1 shows "Data Structures"
   - Students will now see updated timetable

---

## 📞 Support

### Need Help?
- Contact your admin
- Check admin panel for conflicts
- Verify your edit permission is enabled

### Report Issues:
- Screenshot the error
- Note what you were trying to do
- Send to admin with details

---

## ✅ Success Checklist

- [ ] Logged in as teacher with edit access
- [ ] See "✏️ EDIT MODE" badge in header
- [ ] Can tap periods to open edit modal
- [ ] Can edit subject and room
- [ ] Can mark periods as break
- [ ] Can clear periods
- [ ] Can save changes to server
- [ ] Changes appear in Week Overview
- [ ] Students see updated timetable

---

**Version:** 1.0.0  
**Last Updated:** December 4, 2025  
**Feature Status:** ✅ Active and Working
