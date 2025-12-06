# React Hooks Violation Fix

## Problem
When logging in as a teacher, the app crashed with error:
```
Error: Rendered more hooks than during the previous render
```

## Root Cause
**Violation of React's Rules of Hooks**: Hooks were being called conditionally inside a render block.

In `App.js` around line 2576, hooks were declared inside an `if` statement:

```javascript
if (activeTab === 'students' && selectedRole === 'teacher') {
    const [currentClassInfo, setCurrentClassInfo] = React.useState(null);  // ❌ WRONG
    const [filteredStudents, setFilteredStudents] = React.useState([]);    // ❌ WRONG
    const [loading, setLoading] = React.useState(true);                    // ❌ WRONG
    
    React.useEffect(() => { ... });  // ❌ WRONG
}
```

**React's Rules of Hooks require:**
- Hooks must be called at the top level of your component
- Hooks cannot be called inside conditions, loops, or nested functions
- The number and order of hooks must be consistent across renders

## Solution
Moved all hooks to the top level and used conditions **inside** the hooks:

```javascript
// ✅ CORRECT - Hooks at top level
const [studentsTabClassInfo, setStudentsTabClassInfo] = React.useState(null);
const [studentsTabFiltered, setStudentsTabFiltered] = React.useState([]);
const [studentsTabLoading, setStudentsTabLoading] = React.useState(true);

React.useEffect(() => {
    // Condition inside the hook
    if (activeTab !== 'students' || selectedRole !== 'teacher') {
        return;
    }
    // ... rest of logic
}, [activeTab, selectedRole, userData?.employeeId]);

// Then use the conditional render
if (activeTab === 'students' && selectedRole === 'teacher') {
    return <View>...</View>
}
```

## Changes Made
1. Moved 3 `useState` hooks to top level (renamed for clarity)
2. Moved 1 `useEffect` hook to top level
3. Added condition check inside the `useEffect`
4. Updated all variable references in the Students tab render

## Result
✅ Teacher login now works without crashes
✅ Hooks are called consistently on every render
✅ No change in functionality, only structural fix
