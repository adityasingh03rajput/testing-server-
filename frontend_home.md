# Student Home Screen Layout Documentation

## Overview
The student home screen is the main interface where students can track their attendance, view their current class, and manage their timer. This document details all UI components, their positions, and functionality.

---

## Screen Structure

### 1. Header Section (Top)
**Position:** Top of screen, padding-top: 30px

#### Left Side - Profile Picture
- **Component:** TouchableOpacity with Image/Text
- **Size:** 50x50 pixels, circular (borderRadius: 25)
- **Function:** Opens Lanyard Card modal when tapped
- **Content:** 
  - Student photo (if available from `userData.photoUrl`)
  - Initials fallback (if no photo)
- **Styling:**
  - Border: 2px solid (theme.border)
  - Background: theme.primary (for initials)
  - Overflow: hidden

#### Right Side - Theme Toggle Button
- **Component:** TouchableOpacity with Icon
- **Size:** Icon button with background color #fbbf24 (amber)
- **Icons:**
  - 🔄 RefreshIcon - System theme mode
  - ☀️ SunIcon - Dark theme (shows sun to switch to light)
  - 🌙 MoonIcon - Light theme (shows moon to switch to dark)
- **Function:** Cycles through theme modes (system → light → dark → system)

---

### 2. Title Section
**Position:** Below header, centered

- **Text:** "Countdown Timer"
- **Font Size:** 28px
- **Font Weight:** Bold
- **Color:** theme.primary
- **Margin Bottom:** 15px
- **Alignment:** Center

---

### 3. Student Info Card
**Position:** Below title, full width (max 400px)

#### Container Styling
- Background: theme.cardBackground
- Border Radius: 12px
- Padding: 14px
- Border: 2px solid theme.border
- Margin Bottom: 10px

#### Content Layout
**Top Row:**
- 👋 Emoji + Student Name
- Font Size: 17px
- Color: theme.text
- Margin Bottom: 6px

**Bottom Row (Flex Row):**
- **Left Side:**
  - Enrollment Number (11px, theme.textSecondary)
  - Semester & Branch info (11px, theme.textSecondary)
  - Format: "Sem {semester} • {branch}"

- **Right Side:**
  - Status Badge (Present/Attending/Absent)
  - Background: statusColor with 20% opacity
  - Border: 1px solid statusColor
  - Padding: 5px horizontal, 10px vertical
  - Border Radius: 15px
  - Font Size: 11px, bold

---

### 4. Circular Timer Component
**Position:** Center of screen, below student info

#### Features
- Displays current time/attendance minutes
- Visual circular progress indicator
- Shows timetable schedule
- Interactive - can start/pause timer
- Receives props:
  - `theme` - Current theme colors
  - `initialTime` - Attended minutes * 60
  - `isRunning` - Timer state
  - `onToggleTimer` - Start/pause handler
  - `onReset` - Reset handler
  - `formatTime` - Time formatting function
  - `timetable` - Full timetable data
  - `currentDay` - Current day of week

---

### 5. Current Class Progress Card
**Position:** Below circular timer
**Visibility:** Only shown when `currentClassInfo` exists

#### Container Styling
- Width: 100% (max 400px)
- Background: theme.cardBackground
- Border Radius: 12px
- Padding: 14px
- Border: 2px solid theme.primary
- Margin Top: 10px

#### Content Sections

**A. Class Header**
- 📚 Emoji + "Current Class: {subject}"
- Font Size: 14px, bold
- Color: theme.primary
- Margin Bottom: 8px

**B. Class Details**
- Time: "{startTime} - {endTime} • {room}"
- Font Size: 11px
- Color: theme.textSecondary
- Margin Bottom: 10px

**C. Countdown Timer Display**
- Container:
  - Background: theme.background
  - Border Radius: 12px
  - Padding: 15px
  - Border: 2px solid (green if running, theme.border if not)
  - Margin Bottom: 10px
  - Centered alignment

- Content:
  - Label: "Time Remaining" (11px, theme.textSecondary)
  - Timer: MM:SS format (36px, bold, monospace)
  - Color: Green (#22c55e) if running, theme.text if not
  - Sub-text: "{elapsed} min elapsed • {total} min total" (10px)

**D. Attendance Status**
- Container:
  - Background: theme.background
  - Border Radius: 8px
  - Padding: 10px
  - Margin Bottom: 8px

- Status Messages (12px, bold, centered):
  - ⚠️ "Face verification required to start attendance" (amber #fbbf24) - Not verified
  - ✅ "Attendance tracking: {minutes} min recorded" (green #22c55e) - Running
  - ⏸️ "Attendance paused" (red #ef4444) - Paused

**E. Progress Bar**
- Height: 6px
- Background: theme.border
- Border Radius: 3px
- Fill Color: Green (#22c55e) if running, theme.primary if not
- Width: Percentage based on elapsed/total time

---

### 6. Leave Day Message
**Position:** Same as Current Class Progress Card
**Visibility:** Only shown when NO `currentClassInfo` exists

- Container: Same styling as Current Class Progress Card
- Border: theme.border (not primary)
- Content: 🏖️ "It's a leave" (13px, centered, theme.textSecondary)

---

### 7. Today's Attendance Summary Card
**Position:** Below current class/leave message
**Visibility:** Only shown when `todayAttendance.lectures.length > 0`

#### Container Styling
- Width: 100% (max 400px)
- Background: theme.cardBackground
- Border Radius: 12px
- Padding: 14px
- Border: 2px solid theme.border
- Margin Top: 10px

#### Content Sections

**A. Header**
- 📊 "Today's Attendance"
- Font Size: 14px, bold
- Color: theme.primary
- Margin Bottom: 10px

**B. Overall Stats Box**
- Background: Green/Red with 20% opacity
- Border Radius: 8px
- Padding: 10px
- Border: 1px solid green (#22c55e) or red (#ef4444)
- Margin Bottom: 10px

- Content:
  - Status: "✅ Present" or "❌ Absent" + percentage (13px, bold, centered)
  - Details: "{attended} min attended / {total} min total" (11px, centered)

**C. Lectures Breakdown**
- Section Title: "Lectures:" (12px, bold, theme.text)
- Margin Bottom: 8px

- Each Lecture Card:
  - Background: theme.background
  - Border Radius: 6px
  - Padding: 8px
  - Margin Bottom: 6px
  - Left Border: 3px solid (green if present, red if absent)
  
  - Top Row (Flex):
    - Subject name (12px, bold, theme.text)
    - Status: ✓/✗ + percentage (11px, bold, green/red)
  
  - Bottom Row:
    - "{attended} min / {total} min • {startTime}-{endTime}" (10px, theme.textSecondary)

---

### 8. Overall Attendance Stats Card
**Position:** Below Today's Attendance
**Visibility:** Only shown when total days > 0

#### Container Styling
- Same as Today's Attendance card

#### Content
**Header:**
- 📈 "Overall Attendance"
- Font Size: 14px, bold
- Color: theme.primary
- Margin Bottom: 10px

**Stats Rows (Flex Row):**
1. Days Attended:
   - Label: "Days Attended:" (12px, theme.textSecondary)
   - Value: "{present} / {total}" (12px, bold, theme.text)
   - Margin Bottom: 7px

2. Attendance Percentage:
   - Label: "Attendance:" (12px, theme.textSecondary)
   - Value: "{percentage}%" (12px, bold)
   - Color: Green (#22c55e) if ≥75%, Red (#ef4444) if <75%

---

### 9. Bottom Navigation Bar
**Position:** Fixed at bottom of screen

#### Structure
- Height: 70px
- Background: theme.cardBackground
- Border Top: 1px solid theme.border
- Padding Bottom: 10px
- Elevation/Shadow for depth

#### Student Tabs (3 tabs)
1. **Home** 🏠
   - Icon: HomeIcon
   - Label: "Home"
   - Active by default

2. **Calendar** 📅
   - Icon: CalendarIcon
   - Label: "Calendar"

3. **Timetable** 📚
   - Icon: BookIcon
   - Label: "Timetable"

#### Tab Styling
- Active Tab:
  - Icon color: theme.primary
  - Label color: theme.primary
  - Background: theme.primary with 20% opacity
  - Top indicator: 3px bar (theme.primary)
  - Scale: 1.1x

- Inactive Tab:
  - Icon color: theme.textSecondary
  - Label color: theme.textSecondary
  - No background
  - No indicator

---

### 10. Floating Brand Button
**Position:** Floating on home screen
**Visibility:** Only on home tab

- Custom branded button component
- Receives theme with isDark flag

---

### 11. Modals (Overlays)

#### A. Profile Modal
**Trigger:** Tapping profile picture in header (via Lanyard Card)

**Content:**
- Large profile picture (120x120px)
- Student name (24px, bold)
- Role badge: "🎓 Student"
- Personal Information section:
  - Name
  - Enrollment Number
  - Course
  - Semester
  - Email (if available)
  - Phone (if available)
- Logout button (red #ff4444)

#### B. Face Verification Modal
**Trigger:** 
- When student is NOT attending class (to start attendance)
- When Random Ring is active (for verification during class)
- NOT available when student is already attending (unless Random Ring)

**Content:**
- Full-screen camera interface
- Face detection overlay
- Verification instructions
- Cancel button

#### C. Lanyard Card Modal
**Trigger:** Tapping profile picture

**Content:**
- Digital ID card display
- Student photo
- Basic info
- Option to open full profile

---

## Color Themes

### Dark Theme
- Background: #0a1628 (deep blue)
- Card Background: #0d1f3c (darker blue)
- Text: #ffffff (white)
- Text Secondary: #00d9ff (cyan)
- Primary: #00f5ff (bright cyan)
- Border: #00d9ff (cyan)

### Light Theme
- Background: #fef3e2 (warm cream)
- Card Background: #ffffff (white)
- Text: #2c1810 (rich brown)
- Text Secondary: #8b6f47 (warm brown)
- Primary: #d97706 (amber/orange)
- Border: #f3d5a0 (light golden)

### Status Colors (Both Themes)
- Present: #22c55e (green)
- Attending: #ffaa00 (orange)
- Absent: #ef4444 (red)

---

## Responsive Design

### Container Constraints
- All cards: max-width 400px
- Horizontal padding: 20px
- Vertical spacing: 10px between cards

### ScrollView
- Content padding: 
  - Top: 20px
  - Bottom: 110px (for bottom nav clearance)
  - Horizontal: 20px
- Vertical scroll indicator: hidden
- Content alignment: center

---

## Interactive Elements

### Touchable Components
1. Profile Picture → Opens Lanyard Card
2. Theme Toggle → Cycles theme modes
3. Circular Timer (Play Button) → Start attendance (triggers face verification if not attending)
4. Circular Timer (Long Press) → Face verification (only when NOT attending or during Random Ring)
5. Bottom Nav Tabs → Switch screens
6. Lanyard Card → Opens full profile

### State-Dependent Visibility
- Current Class Card: Shows only during active class
- Leave Message: Shows when no active class
- Today's Attendance: Shows when lectures recorded
- Overall Stats: Shows when attendance history exists
- Face Verification: Shows when starting timer without verification

---

## Data Flow

### Key State Variables
- `studentName` - Student's name
- `userData` - Full user profile data
- `isRunning` - Timer running state
- `verifiedToday` - Daily face verification status
- `currentClassInfo` - Active class details
- `attendedMinutes` - Minutes attended in current class
- `todayAttendance` - Today's lecture attendance records
- `timetable` - Full timetable schedule
- `currentDay` - Current day of week
- `theme` - Current theme colors
- `activeTab` - Current bottom nav tab

### Real-time Updates
- Timer updates every second
- Class progress calculated every second
- Attendance tracked when timer running
- Socket.io updates for live sync
- Server time synchronization for security

---

## Notes

### Security Features
- Face verification required when NOT attending (to start attendance)
- Face verification during Random Ring (when already attending)
- Face verification blocked when attending (unless Random Ring active)
- Server time used (not device time)
- Attendance validated server-side
- Keep-awake during tracking

### User Experience
- Smooth animations (fade, scale, pulse)
- Instant theme switching
- Persistent login state
- Auto-restore verification status
- Background time tracking

### Accessibility
- Clear status indicators
- Color-coded feedback
- Large touch targets
- Readable font sizes
- High contrast themes
