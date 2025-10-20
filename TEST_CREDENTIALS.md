# Test Credentials

Use these credentials to test the application with pre-seeded attendance data.

## Student Logins (with Attendance History)

### CSE Semester 1
- **Enrollment:** `0246CS241001` | **Password:** `aditya` | **Name:** Aditya Singh | **Attendance:** 100%
- **Enrollment:** `0246CS241002` | **Password:** `aditya` | **Name:** Priya Sharma | **Attendance:** 100%
- **Enrollment:** `0246CS241003` | **Password:** `aditya` | **Name:** Rahul Kumar | **Attendance:** 0%

### CSE Semester 3
- **Enrollment:** `0246CS231001` | **Password:** `aditya` | **Name:** Sneha Patel | **Attendance:** 84%
- **Enrollment:** `0246CS231002` | **Password:** `aditya` | **Name:** Vikram Reddy | **Attendance:** 100%

### CSE Semester 5
- **Enrollment:** `0246CS221001` | **Password:** `aditya` | **Name:** Ravi Shankar | **Attendance:** 12%

### ECE Semester 1
- **Enrollment:** `0246EC241001` | **Password:** `aditya` | **Name:** Ananya Gupta | **Attendance:** 100%

### ECE Semester 3
- **Enrollment:** `0246EC231001` | **Password:** `aditya` | **Name:** Divya Iyer | **Attendance:** 0%

## Teacher Logins

- **Employee ID:** `T001` | **Password:** `aditya` | **Name:** Dr. Rajesh Kumar
- **Employee ID:** `T002` | **Password:** `aditya` | **Name:** Prof. Meera Sharma
- **Employee ID:** `T003` | **Password:** `aditya` | **Name:** Dr. Amit Patel

## Attendance Data Range

- **Start Date:** April 18, 2025
- **End Date:** October 20, 2025 (Today)
- **Total Records:** 1,272 attendance records
- **Students with Data:** 8 students

## How to Test Calendar

1. **Login** with any student credentials above
2. Go to **Calendar** tab
3. You should see:
   - Green dots on dates with present status
   - Red dots on dates with absent status
   - Monthly statistics at the top
4. **Tap on any date** to see:
   - Overall attendance percentage for that day
   - List of all classes attended
   - Time spent in each class
   - Room numbers
   - Individual class attendance percentages

## Recommended Test Accounts

### High Attendance (Good Student)
- Login: `0246CS241001` / `aditya` (Aditya Singh - 100%)
- Login: `0246EC241001` / `aditya` (Ananya Gupta - 100%)

### Medium Attendance (Average Student)
- Login: `0246CS231001` / `aditya` (Sneha Patel - 84%)

### Low Attendance (Struggling Student)
- Login: `0246CS221001` / `aditya` (Ravi Shankar - 12%)

### No Attendance (New Student)
- Login: `0246CS241003` / `aditya` (Rahul Kumar - 0%)

## Notes

- All passwords are `aditya` for easy testing
- Attendance data includes detailed lecture-wise breakdown
- Each day has 6 classes with varying durations
- Attendance is calculated based on 75% rule (need 75% to be marked present)
- Sundays are automatically marked as leave days
