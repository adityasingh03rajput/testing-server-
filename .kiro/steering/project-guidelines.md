# College Attendance App - Project Guidelines

## General Rules

* This is a React Native mobile app (Android APK) with Expo
* Server backend runs on Azure: https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net
* Always use React Native components, NEVER use HTML elements like div, button, input
* Keep components small and focused - extract to separate files when needed
* Use functional components with hooks, not class components
* Always check for null/undefined before accessing nested properties

## React Native Specific Rules

### Component Usage
* Use `<View>` instead of `<div>`
* Use `<Text>` instead of `<p>`, `<span>`, `<h1>`, etc.
* Use `<TouchableOpacity>` or `<Pressable>` instead of `<button>`
* Use `<TextInput>` instead of `<input>`
* Use `<Image>` instead of `<img>`
* Use `<Modal>` instead of web dialogs
* Use `<ScrollView>` or `<FlatList>` for scrollable content

### Styling
* Always use `StyleSheet.create()` for styles
* NEVER use Tailwind CSS classes or className prop
* Use inline styles only for dynamic values
* Follow the existing theme system (THEMES.dark / THEMES.light)
* Colors: Use theme.background, theme.text, theme.primary, etc.

### Event Handlers
* Use `onPress` instead of `onClick`
* Use `onChangeText` instead of `onChange` for TextInput
* Use `onRequestClose` for Modal components

## React Hooks Rules (CRITICAL)

* ALL hooks must be called at the TOP LEVEL of the component
* NEVER call hooks inside if statements, loops, or nested functions
* NEVER call useState or useEffect conditionally
* If you need conditional logic, put it INSIDE the hook, not around it

**WRONG:**
```javascript
if (selectedRole === 'teacher') {
  const [data, setData] = useState(null); // ❌ WRONG
  useEffect(() => { ... }); // ❌ WRONG
}
```

**CORRECT:**
```javascript
const [data, setData] = useState(null); // ✅ CORRECT - Top level

useEffect(() => {
  if (selectedRole !== 'teacher') return; // ✅ Condition inside hook
  // ... logic
}, [selectedRole]);
```

## State Management

* Use useState for local component state
* Use useEffect for side effects and data fetching
* Always include proper dependency arrays in useEffect
* Reset state appropriately (e.g., activeTab to 'home' after login)
* Use useRef for values that don't trigger re-renders

## Navigation Pattern

* Use conditional rendering with if statements
* Check both role AND activeTab: `if (selectedRole === 'teacher' && activeTab === 'home')`
* Always have a fallback render or error screen
* Include BottomNavigation component for tab switching
* Reset activeTab when changing major states (login, logout)

## Data Flow

* Fetch data from Azure server endpoints
* Use Socket.IO for real-time updates
* Store user data in AsyncStorage
* Always validate server responses
* Handle loading and error states

## Random Ring Feature - Business Logic

### Overview
Random Ring is an attendance verification system that randomly selects students during class to verify their physical presence via biometric authentication.

### How It Works

**1. Student WiFi Connection Tracking:**
- System tracks when students connect to authorized college WiFi (specific BSSID)
- Only students connected to college WiFi during the day are eligible for random ring
- Student timer only runs when connected to authorized BSSID

**2. Teacher Initiates Random Ring:**
- Teacher presses "Random Ring" button (floating bell icon on home screen)
- Teacher selects option:
  - "All Students" - Ring all students currently in class
  - "Select Number" - Ring specific number of students (e.g., 5 random students)
- System randomly selects students from those who connected to WiFi that day

**3. Student Notification & Verification:**
- Selected students receive push notification
- Students must verify biometric (face verification) to mark attendance
- Biometric verification ONLY works when student is connected to authorized BSSID WiFi
- If student not connected to college WiFi, verification fails

**4. Timer Behavior:**
- Student attendance timer only runs when connected to authorized BSSID
- Timer pauses when student disconnects from college WiFi
- Timer resumes when student reconnects to authorized BSSID

**5. Absence Notifications to Parents:**
- **End of Day Check (After College Hours):**
  - If student never connected to WiFi AND not marked present by teacher → Parent gets call: "Your child was absent today"
  - If student connected to WiFi but failed random ring verification → Parent gets call: "Your child was absent in [Lecture Name] lecture"

**6. Attendance States:**
- **Present**: Student connected to WiFi + verified biometric during random ring
- **Absent (Full Day)**: Never connected to WiFi + not manually marked by teacher
- **Absent (Specific Lecture)**: Connected to WiFi but failed to verify during random ring for that lecture

### Technical Requirements

**WiFi BSSID Validation:**
- Store authorized college WiFi BSSID in config
- Check student's current WiFi BSSID before allowing biometric verification
- Track WiFi connection timestamps for each student

**Random Selection Algorithm:**
- Filter students who connected to WiFi that day
- Randomly select N students (based on teacher's choice)
- Send push notifications to selected students
- Set verification timeout (e.g., 5 minutes to respond)

**Biometric Verification:**
- Only allow face verification when connected to authorized BSSID
- Show error message if student tries to verify without college WiFi
- Mark attendance immediately upon successful verification

**Parent Notification System:**
- Schedule end-of-day job to check attendance
- Generate absence reports
- Trigger automated calls to parents with absence details
- Include specific lecture names for partial absences

**Data to Track:**
- Student WiFi connection logs (timestamp, BSSID)
- Random ring events (timestamp, selected students, lecture)
- Verification attempts (timestamp, success/failure, BSSID)
- Attendance status per lecture
- Parent contact information

### Security Considerations
- Prevent WiFi spoofing (validate BSSID matches authorized list)
- Prevent biometric bypass (server-side verification)
- Prevent time manipulation (use server time, not device time)
- Rate limit verification attempts
- Log all verification attempts for audit trail

## Server Integration

* Base URL: https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net
* Use fetch() for API calls
* Use socket.io-client for real-time features
* Always handle network errors gracefully
* Check server time for attendance tracking (prevent manipulation)

## Theme System

* Support both dark and light themes
* Use theme object for all colors
* Dark theme: #0a1628 background, #00f5ff primary
* Light theme: #fef3e2 background, #d97706 primary
* Allow system theme detection with useColorScheme()
* Provide manual theme toggle

## Component Structure

### Teacher Components
* TeacherHeader.js - Header with profile, theme toggle, menu
* TeacherStats.js - Statistics display
* StudentCard.js - Individual student card
* Keep teacher dashboard in App.js with proper activeTab checks

### Student Components
* CircularTimer - Timer display
* LanyardCard - Student ID card
* FaceVerificationScreen - Face verification
* Keep student screens in App.js

### Shared Components
* BottomNavigation - Tab navigation
* Icons.js - Icon components
* Colors.js - Color constants

## File Organization

* Main app logic: App.js
* Components: Separate .js files in root
* Server code: server/ folder
* Admin panel: admin-panel/ folder (Electron app)
* Android build: android/ folder
* Configuration: config.js, .env

## Teacher UI Conversion: HTML to React Native APK

### Overview
Converting NativeBunkTeacherUi (HTML/React web) to React Native components for APK integration.

### 🎯 CRITICAL: Preserve Exact UI/UX

**GOAL: The React Native APK must look and feel IDENTICAL to the HTML teacher UI**

When converting components, you MUST:
- ✅ Match exact spacing, padding, margins (convert Tailwind units precisely)
- ✅ Match exact colors, including hover states (use theme equivalents)
- ✅ Match exact font sizes, weights, and text styles
- ✅ Match exact border radius, shadows, and visual effects
- ✅ Match exact layout structure and component positioning
- ✅ Match exact animations and transitions (use React Native Animated API)
- ✅ Match exact icon sizes and positioning
- ✅ Preserve all interactive states (pressed, focused, disabled)
- ✅ Keep the same visual hierarchy and information density
- ✅ Maintain the same user flow and navigation patterns

**Visual Fidelity Checklist:**
- [ ] Component dimensions match exactly (width, height)
- [ ] Spacing matches exactly (padding, margin, gap)
- [ ] Colors match exactly (background, text, borders, shadows)
- [ ] Typography matches exactly (size, weight, line height, letter spacing)
- [ ] Border radius matches exactly (rounded corners)
- [ ] Shadows/elevation match exactly (use elevation for Android)
- [ ] Icons are same size and style
- [ ] Layout structure is identical (flex direction, alignment, justification)
- [ ] Interactive feedback matches (press states, ripple effects)
- [ ] Animations/transitions feel the same

**How to Ensure Exact Match:**
1. Open HTML UI in browser side-by-side with APK on device
2. Take screenshots of both for pixel-perfect comparison
3. Use browser DevTools to inspect exact CSS values
4. Convert Tailwind classes using the exact multiplier (1 unit = 4px)
5. Test on real device, not just emulator
6. Compare dark mode and light mode separately

### Step-by-Step Conversion Process

#### 1. Component Mapping (HTML → React Native)
```
HTML Element          →  React Native Component
─────────────────────────────────────────────────
<div>                 →  <View>
<button>              →  <TouchableOpacity> or <Pressable>
<input>               →  <TextInput>
<img>                 →  <Image>
<p>, <span>, <h1>     →  <Text>
<select>              →  <Picker> (from @react-native-picker/picker)
Dialog/Modal (Radix)  →  <Modal> (React Native)
<a>                   →  <TouchableOpacity> with <Text>
```

#### 2. Styling Conversion (Tailwind → StyleSheet) - EXACT MATCH REQUIRED

```javascript
// BEFORE (Web - Tailwind)
<div className="flex items-center justify-between px-6 py-4 bg-white">

// AFTER (React Native - StyleSheet)
<View style={styles.header}>

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,  // EXACT: 6 × 4 = 24
    paddingVertical: 16,    // EXACT: 4 × 4 = 16
    backgroundColor: '#ffffff',
  }
});
```

**Tailwind to StyleSheet - EXACT Conversion Table:**

**Layout & Flexbox:**
- `flex` → `display: 'flex'` (default in RN, usually omit)
- `flex-row` → `flexDirection: 'row'`
- `flex-col` → `flexDirection: 'column'`
- `items-start` → `alignItems: 'flex-start'`
- `items-center` → `alignItems: 'center'`
- `items-end` → `alignItems: 'flex-end'`
- `justify-start` → `justifyContent: 'flex-start'`
- `justify-center` → `justifyContent: 'center'`
- `justify-between` → `justifyContent: 'space-between'`
- `justify-around` → `justifyContent: 'space-around'`
- `justify-evenly` → `justifyContent: 'space-evenly'`
- `gap-2` → `gap: 8` (2 × 4 = 8)
- `gap-4` → `gap: 16` (4 × 4 = 16)

**Spacing (CRITICAL - Must be exact):**
- `p-1` → `padding: 4` (1 × 4 = 4)
- `p-2` → `padding: 8` (2 × 4 = 8)
- `p-3` → `padding: 12` (3 × 4 = 12)
- `p-4` → `padding: 16` (4 × 4 = 16)
- `p-6` → `padding: 24` (6 × 4 = 24)
- `px-4` → `paddingHorizontal: 16`
- `py-2` → `paddingVertical: 8`
- `pt-4` → `paddingTop: 16`
- `pb-4` → `paddingBottom: 16`
- `pl-4` → `paddingLeft: 16`
- `pr-4` → `paddingRight: 16`
- `m-4` → `margin: 16`
- `mx-4` → `marginHorizontal: 16`
- `my-2` → `marginVertical: 8`
- `mt-4` → `marginTop: 16`
- `mb-4` → `marginBottom: 16`
- `ml-4` → `marginLeft: 16`
- `mr-4` → `marginRight: 16`

**Sizing:**
- `w-12` → `width: 48` (12 × 4 = 48)
- `w-full` → `width: '100%'`
- `w-screen` → `width: Dimensions.get('window').width`
- `h-12` → `height: 48`
- `h-full` → `height: '100%'`
- `h-screen` → `height: Dimensions.get('window').height`
- `min-w-0` → `minWidth: 0`
- `max-w-sm` → `maxWidth: 384` (24rem = 384px)

**Border Radius:**
- `rounded` → `borderRadius: 4`
- `rounded-md` → `borderRadius: 6`
- `rounded-lg` → `borderRadius: 8`
- `rounded-xl` → `borderRadius: 12`
- `rounded-2xl` → `borderRadius: 16`
- `rounded-full` → `borderRadius: 9999`

**Borders:**
- `border` → `borderWidth: 1`
- `border-2` → `borderWidth: 2`
- `border-gray-300` → `borderColor: '#d1d5db'`
- `border-t` → `borderTopWidth: 1`
- `border-b` → `borderBottomWidth: 1`

**Shadows (Android uses elevation):**
- `shadow-sm` → `elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 2`
- `shadow` → `elevation: 3, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 3`
- `shadow-md` → `elevation: 4, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4`
- `shadow-lg` → `elevation: 8, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 8`
- `shadow-xl` → `elevation: 12, shadowColor: '#000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.1, shadowRadius: 12`

**Colors (Use exact hex values):**
- `bg-white` → `backgroundColor: '#ffffff'`
- `bg-gray-50` → `backgroundColor: '#f9fafb'`
- `bg-gray-100` → `backgroundColor: '#f3f4f6'`
- `bg-gray-900` → `backgroundColor: '#111827'`
- `bg-blue-600` → `backgroundColor: '#2563eb'`
- `bg-blue-500` → `backgroundColor: '#3b82f6'`
- `text-white` → `color: '#ffffff'`
- `text-gray-600` → `color: '#4b5563'`
- `text-gray-900` → `color: '#111827'`

**Typography:**
- `text-xs` → `fontSize: 12`
- `text-sm` → `fontSize: 14`
- `text-base` → `fontSize: 16`
- `text-lg` → `fontSize: 18`
- `text-xl` → `fontSize: 20`
- `text-2xl` → `fontSize: 24`
- `font-normal` → `fontWeight: '400'`
- `font-medium` → `fontWeight: '500'`
- `font-semibold` → `fontWeight: '600'`
- `font-bold` → `fontWeight: '700'`

**Position:**
- `absolute` → `position: 'absolute'`
- `relative` → `position: 'relative'`
- `top-0` → `top: 0`
- `bottom-0` → `bottom: 0`
- `left-0` → `left: 0`
- `right-0` → `right: 0`
- `z-10` → `zIndex: 10`

**Opacity:**
- `opacity-0` → `opacity: 0`
- `opacity-50` → `opacity: 0.5`
- `opacity-100` → `opacity: 1`

**Dark Mode (Use theme object):**
- `dark:bg-gray-900` → `backgroundColor: theme.background`
- `dark:text-white` → `color: theme.text`
- `dark:border-gray-800` → `borderColor: theme.border`

#### 3. Event Handler Conversion
```javascript
// BEFORE (Web)
<button onClick={handleClick}>
<input onChange={handleChange} />
<div onMouseEnter={handleHover}>

// AFTER (React Native)
<TouchableOpacity onPress={handleClick}>
<TextInput onChangeText={handleChange} />
// No hover events in mobile - remove or use onPressIn/onPressOut
```

#### 4. Icon Replacement (Lucide → Emoji/Unicode)
```javascript
// BEFORE (Web - Lucide React)
import { Bell, MoreVertical, User } from "lucide-react";
<Bell className="w-6 h-6" />

// AFTER (React Native - Emoji)
<Text style={styles.icon}>🔔</Text>

// OR use react-native-vector-icons if needed
import Icon from 'react-native-vector-icons/MaterialIcons';
<Icon name="notifications" size={24} color="#000" />
```

**Common Icon Mappings:**
- Bell → 🔔
- MoreVertical → ⋮
- User → 👤
- Calendar → 📅
- Search → 🔍
- ChevronDown → ▼
- ChevronRight → ▶
- X (close) → ✕

#### 5. Web Library Replacements

**Radix UI Dropdown Menu → React Native Modal + TouchableOpacity**
```javascript
// BEFORE (Web - Radix UI)
<DropdownMenu>
  <DropdownMenuTrigger>
    <MoreVertical />
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={handleAction}>Action</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

// AFTER (React Native)
const [menuVisible, setMenuVisible] = useState(false);

<TouchableOpacity onPress={() => setMenuVisible(true)}>
  <Text>⋮</Text>
</TouchableOpacity>

<Modal
  visible={menuVisible}
  transparent={true}
  animationType="fade"
  onRequestClose={() => setMenuVisible(false)}
>
  <TouchableOpacity 
    style={styles.modalOverlay}
    onPress={() => setMenuVisible(false)}
  >
    <View style={styles.menuContainer}>
      <TouchableOpacity onPress={handleAction}>
        <Text>Action</Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
</Modal>
```

**Radix UI Dialog → React Native Modal**
```javascript
// BEFORE (Web)
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogTitle>Title</DialogTitle>
    <DialogDescription>Description</DialogDescription>
  </DialogContent>
</Dialog>

// AFTER (React Native)
<Modal
  visible={isOpen}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setIsOpen(false)}
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.title}>Title</Text>
      <Text style={styles.description}>Description</Text>
    </View>
  </View>
</Modal>
```

#### 6. Image Handling
```javascript
// BEFORE (Web)
<img src="https://..." alt="Profile" className="w-12 h-12 rounded-full" />

// AFTER (React Native)
<Image 
  source={{ uri: 'https://...' }}
  style={styles.profileImage}
  defaultSource={require('./assets/default-avatar.png')} // Fallback
/>

const styles = StyleSheet.create({
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  }
});
```

#### 7. Scrollable Content
```javascript
// BEFORE (Web)
<div className="overflow-y-auto">
  {items.map(item => <div key={item.id}>{item.name}</div>)}
</div>

// AFTER (React Native - Use FlatList for performance)
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <View>
      <Text>{item.name}</Text>
    </View>
  )}
/>

// OR use ScrollView for simple lists
<ScrollView>
  {items.map(item => (
    <View key={item.id}>
      <Text>{item.name}</Text>
    </View>
  ))}
</ScrollView>
```

#### 8. Theme Integration
```javascript
// Use existing theme system from App.js
const theme = isDarkMode ? THEMES.dark : THEMES.light;

// Apply theme colors
<View style={[styles.container, { backgroundColor: theme.background }]}>
  <Text style={[styles.text, { color: theme.text }]}>Hello</Text>
</View>
```

#### 9. Teacher UI Components to Convert

**Priority Order:**
1. ✅ TeacherHeader.js - Already converted (update if needed)
2. ✅ StudentCard.js - Already converted (update if needed)
3. ✅ TeacherStats.js - Already converted (update if needed)
4. ✅ FilterButtons.js - Already converted
5. ✅ RandomRingDialog.js - Already converted
6. ⏳ StudentSearch.tsx → StudentSearch.js
7. ⏳ StudentList.tsx → StudentList.js
8. ⏳ Calendar.tsx → CalendarScreen.js (may already exist)
9. ⏳ Timetable.tsx → TimetableScreen.js (may already exist)
10. ⏳ TimetableSelector.tsx → TimetableSelector.js
11. ⏳ ViewRecords.tsx → ViewRecords.js
12. ⏳ Notification.tsx → NotificationsScreen.js (may already exist)
13. ⏳ Updates.tsx → Updates.js
14. ⏳ HelpAndSupport.tsx → HelpAndSupport.js
15. ⏳ Feedback.tsx → Feedback.js
16. ⏳ TeacherProfileDialog.tsx → TeacherProfileDialog.js
17. ⏳ StudentProfileDialog.tsx → StudentProfileDialog.js

#### 10. Integration into App.js

**Current Pattern:**
```javascript
// Teacher dashboard rendering in App.js
if (selectedRole === 'teacher' && activeTab === 'home') {
  return (
    <View style={styles.container}>
      <TeacherHeader theme={theme} />
      <StudentSearch theme={theme} />
      <ScrollView>
        <StudentList theme={theme} />
      </ScrollView>
      <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </View>
  );
}
```

**Add new screens:**
```javascript
if (selectedRole === 'teacher' && activeTab === 'calendar') {
  return <CalendarScreen theme={theme} />;
}

if (selectedRole === 'teacher' && activeTab === 'timetable') {
  return <TimetableScreen theme={theme} />;
}
```

#### 11. State Management for Teacher UI

**Move these states to App.js top level:**
```javascript
// At top of App.js component (with other hooks)
const [showViewRecords, setShowViewRecords] = useState(false);
const [showNotification, setShowNotification] = useState(false);
const [showUpdates, setShowUpdates] = useState(false);
const [showHelpAndSupport, setShowHelpAndSupport] = useState(false);
const [showFeedback, setShowFeedback] = useState(false);
const [randomRingDialogOpen, setRandomRingDialogOpen] = useState(false);
const [selectedBranch, setSelectedBranch] = useState(null);
const [selectedSemester, setSelectedSemester] = useState(null);
```

#### 12. Conversion Checklist for Each Component

For each component from NativeBunkTeacherUi:

**Code Conversion:**
- [ ] Replace all HTML elements with React Native components
- [ ] Convert all Tailwind classes to StyleSheet.create() with EXACT values
- [ ] Replace Lucide icons with emoji or vector icons (same size)
- [ ] Change onClick to onPress, onChange to onChangeText
- [ ] Replace Radix UI components with React Native Modal/Picker
- [ ] Add theme prop and apply theme colors
- [ ] Preserve all state management and business logic

**Visual Fidelity (CRITICAL):**
- [ ] Open HTML component in browser for reference
- [ ] Measure exact dimensions using browser DevTools
- [ ] Convert ALL spacing values precisely (use 4px multiplier)
- [ ] Match exact colors (copy hex values from DevTools)
- [ ] Match exact font sizes and weights
- [ ] Match exact border radius values
- [ ] Match exact shadow/elevation
- [ ] Match exact icon sizes
- [ ] Preserve exact layout structure

**Testing:**
- [ ] Component renders without errors
- [ ] Take screenshot of HTML version
- [ ] Take screenshot of React Native version
- [ ] Compare screenshots side-by-side
- [ ] Verify spacing matches exactly
- [ ] Verify colors match exactly
- [ ] Verify all functionality works
- [ ] Test both light and dark themes
- [ ] Test all interactive states (press, focus, disabled)
- [ ] Check component integrates into App.js properly
- [ ] Test on real Android device

#### 13. Common Pitfalls to Avoid

- ❌ Don't use `className` - it doesn't exist in React Native
- ❌ Don't use `<div>`, `<button>`, `<input>` - use React Native components
- ❌ Don't use CSS files or Tailwind - use StyleSheet.create()
- ❌ Don't use web-only libraries (Radix UI, Shadcn, etc.)
- ❌ Don't forget to add theme support to converted components
- ❌ Don't call hooks conditionally - always at top level
- ❌ Don't forget BottomNavigation on new screens
- ❌ Don't use absolute positioning excessively - use flexbox

#### 14. Testing Converted Components

After converting each component:
```bash
# Build APK
BUILD_APK.bat

# Install on device
adb install -r android\app\build\outputs\apk\release\app-release.apk

# Check for errors
adb logcat *:E ReactNative:V
```

Test checklist:
- Component renders without crashes
- All buttons/interactions work
- Theme switching works correctly
- Navigation works properly
- Data displays correctly
- No console errors or warnings

## Testing

* Test on real Android device via ADB
* Check logcat for errors: `adb logcat *:E ReactNative:V`
* Test both teacher and student roles
* Test all tabs (home, calendar, timetable, notifications)
* Verify theme switching works
* Test face verification flow

## Build Process

* Build APK: `BUILD_APK.bat` or `cd android && gradlew assembleRelease`
* Install: `adb install -r android\app\build\outputs\apk\release\app-release.apk`
* APK location: android/app/build/outputs/apk/release/app-release.apk
* Build time: ~2-3 minutes

## Common Issues

### Blue Screen After Login
* Cause: Missing activeTab check or hooks violation
* Fix: Ensure `setActiveTab('home')` in handleLogin
* Fix: Check teacher dashboard has `&& activeTab === 'home'`

### Hooks Violation Error
* Cause: Hooks called inside conditional blocks
* Fix: Move all hooks to top level of component

### Server Connection Issues
* Check server is running
* Verify CORS is enabled
* Check network connectivity
* Use test-connection.html to diagnose

## DO NOT

* ❌ Create unnecessary markdown documentation files
* ❌ Use web-only libraries (Radix UI, Tailwind, etc.)
* ❌ Use HTML elements in React Native
* ❌ Call hooks conditionally
* ❌ Forget to add BottomNavigation to new screens
* ❌ Use className prop (doesn't exist in React Native)
* ❌ Mix web and native code

## DO

* ✅ Use React Native components exclusively
* ✅ Use StyleSheet.create() for styling
* ✅ Call all hooks at top level
* ✅ Check both role AND activeTab in conditionals
* ✅ Include proper error handling
* ✅ Test on real device before releasing
* ✅ Keep code minimal and focused
* ✅ Extract reusable logic to separate files
