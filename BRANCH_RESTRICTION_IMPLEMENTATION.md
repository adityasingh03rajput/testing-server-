# Branch Restriction Implementation

## Feature: Teachers Can Only See Students from Their Assigned Branches

### Overview
Teachers are now restricted to viewing only students from branches they are assigned to teach in the timetable. This prevents CSE teachers from seeing DS students, and vice versa.

---

## Changes Made

### 1. Updated API Endpoint: `/api/teacher/current-lecture/:teacherId`

**Added `allowedBranches` to response:**
```javascript
{
  success: true,
  currentLecture: { ... },
  hasLecture: true,
  allowedBranches: ["B.Tech Data Science", "B.Tech Computer Science"]
}
```

**Logic:**
- Scans all timetables
- Finds all branches where teacher is assigned
- Returns unique list of allowed branches

---

### 2. New API Endpoint: `/api/teacher/allowed-branches/:teacherId`

**Purpose:** Get all branches a teacher is assigned to teach

**Response:**
```javascript
{
  success: true,
  allowedBranches: ["B.Tech Data Science"],
  branchDetails: [
    { branch: "B.Tech Data Science", semester: "3" },
    { branch: "B.Tech Data Science", semester: "5" }
  ]
}
```

**Logic:**
1. Find all timetables
2. For each timetable, check all days
3. If teacher is assigned to any lecture in that timetable
4. Add branch to allowed list
5. Return unique branches

---

### 3. Updated `SemesterSelector.js`

**Added `allowedBranches` prop:**
```javascript
const SemesterSelector = ({ 
  visible, 
  onClose, 
  onSelect, 
  currentSelection,
  theme,
  allowedBranches = [] // NEW: Restrict branches
}) => {
```

**Branch Filtering:**
```javascript
const allBranches = [
  { value: 'B.Tech Data Science', label: 'Data Science (DS)' },
  { value: 'B.Tech Computer Science', label: 'Computer Science (CS)' },
  // ... more branches
];

// Filter branches based on teacher's allowed branches
const branches = allowedBranches.length > 0
  ? allBranches.filter(b => allowedBranches.includes(b.value))
  : allBranches;
```

**Empty State:**
```javascript
{branches.length === 0 && (
  <View>
    <Text>⚠️ No branches assigned to you in the timetable</Text>
  </View>
)}
```

---

### 4. Updated `App.js`

**Added State:**
```javascript
const [allowedBranches, setAllowedBranches] = useState([]);
```

**Added useEffect to Fetch Allowed Branches:**
```javascript
useEffect(() => {
  if (selectedRole === 'teacher' && loginId) {
    const fetchAllowedBranches = async () => {
      const response = await fetch(`${SOCKET_URL}/api/teacher/allowed-branches/${loginId}`);
      const data = await response.json();
      if (data.success) {
        setAllowedBranches(data.allowedBranches);
      }
    };
    fetchAllowedBranches();
  }
}, [selectedRole, loginId]);
```

**Pass to SemesterSelector:**
```javascript
<SemesterSelector
  visible={showSemesterSelector}
  onClose={() => setShowSemesterSelector(false)}
  onSelect={(selection) => { ... }}
  currentSelection={manualSelection}
  theme={theme}
  allowedBranches={allowedBranches} // NEW
/>
```

---

## How It Works

### Scenario 1: CSE Teacher

**Teacher:** TEACH001 (CSE Department)
**Timetable Assignment:** Only assigned to "B.Tech Computer Science" lectures

1. Teacher logs in
2. System fetches allowed branches → `["B.Tech Computer Science"]`
3. Teacher opens semester selector
4. **Only sees:** Computer Science (CS)
5. **Cannot see:** Data Science, IT, Electronics, etc.
6. Teacher can only view CS students

---

### Scenario 2: Multi-Branch Teacher

**Teacher:** TEACH002 (Math Department)
**Timetable Assignment:** Teaches DS Sem 3 and CS Sem 5

1. Teacher logs in
2. System fetches allowed branches → `["B.Tech Data Science", "B.Tech Computer Science"]`
3. Teacher opens semester selector
4. **Can see:** Data Science (DS), Computer Science (CS)
5. **Cannot see:** IT, Electronics, Mechanical, Civil
6. Teacher can switch between DS and CS students only

---

### Scenario 3: No Timetable Assignment

**Teacher:** TEACH003 (New teacher)
**Timetable Assignment:** Not assigned to any lectures yet

1. Teacher logs in
2. System fetches allowed branches → `[]` (empty)
3. Teacher opens semester selector
4. **Sees message:** "⚠️ No branches assigned to you in the timetable"
5. Cannot view any students
6. Admin must assign teacher to timetable first

---

## Security Flow

```
Teacher Login
    ↓
Fetch Allowed Branches (from timetable)
    ↓
Store in State: allowedBranches
    ↓
Pass to SemesterSelector
    ↓
Filter Branch List
    ↓
Teacher Can Only Select Allowed Branches
    ↓
fetchStudents() Only Fetches from Allowed Branch
```

---

## Benefits

1. **Security:** Teachers cannot access students from other departments
2. **Privacy:** Student data is protected by branch restrictions
3. **Clarity:** Teachers only see relevant students
4. **Automatic:** Based on timetable assignments (no manual configuration)
5. **Flexible:** Multi-branch teachers can access multiple branches

---

## Testing Scenarios

### Test 1: Single Branch Teacher
1. Assign TEACH001 to only DS lectures in timetable
2. Login as TEACH001
3. Open semester selector
4. **Expected:** Only see "Data Science (DS)" option
5. **Expected:** Cannot see CS, IT, etc.

### Test 2: Multi-Branch Teacher
1. Assign TEACH002 to DS Sem 3 and CS Sem 5
2. Login as TEACH002
3. Open semester selector
4. **Expected:** See both "Data Science (DS)" and "Computer Science (CS)"
5. **Expected:** Cannot see IT, Electronics, etc.

### Test 3: No Assignment
1. Create TEACH003 but don't assign to any timetable
2. Login as TEACH003
3. Open semester selector
4. **Expected:** See warning message
5. **Expected:** No branches available

### Test 4: Auto Mode
1. Login as TEACH001 (assigned to DS)
2. During DS lecture time
3. **Expected:** Auto mode shows DS students
4. **Expected:** Cannot manually switch to CS

---

## Database Requirements

### Timetable Must Have Teacher Assignments

**Example Timetable:**
```javascript
{
  semester: "3",
  branch: "B.Tech Data Science",
  timetable: {
    monday: [
      {
        period: 1,
        subject: "Data Structures",
        teacher: "TEACH001",  // ← Teacher assignment
        teacherName: "Prof. Kumar",
        room: "Lab 101",
        isBreak: false
      }
    ]
  }
}
```

**Without teacher assignment:**
- Teacher will have empty `allowedBranches`
- Cannot view any students
- Must update timetable to add teacher assignments

---

## Admin Panel Integration

### Timetable Editor Should:
1. Show teacher dropdown when editing lectures
2. Allow assigning teachers to specific lectures
3. Validate teacher assignments
4. Show which teachers are assigned to which branches

---

## Future Enhancements

1. **Role-Based Override:** Allow HOD/Admin to view all branches
2. **Temporary Access:** Grant temporary access to other branches
3. **Access Logs:** Track which teachers view which students
4. **Notification:** Alert when teacher tries to access restricted branch
5. **Bulk Assignment:** Assign teacher to all lectures of a subject

---

## API Summary

### GET `/api/teacher/current-lecture/:teacherId`
- Returns current lecture + allowed branches
- Used for auto mode

### GET `/api/teacher/allowed-branches/:teacherId`
- Returns all branches teacher is assigned to
- Used for manual selection

---

## Summary

✅ **Implemented:** Branch restriction based on timetable assignments
✅ **Security:** Teachers can only see students from assigned branches
✅ **Automatic:** No manual configuration needed
✅ **Flexible:** Supports multi-branch teachers
✅ **User-Friendly:** Clear messaging when no branches assigned

Teachers are now restricted to their assigned branches! 🔒
