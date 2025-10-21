// User and Authentication Types
export interface User {
  userId: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  branch?: string;
  semester?: string;
  rollNo?: string;
  department?: string;
  section?: string;
  isActive: boolean;
  lastLogin?: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  token?: string;
}

// Attendance Types
export interface AttendanceSession {
  sessionId: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  periodDetails: PeriodInfo;
  startTime: string;
  sessionStartTimestamp: string;
  timeRemaining?: number;
  attendedMinutes: number;
  missedMinutes: number;
  remainingMinutes: number;
  attendancePercentage: number;
  isPresent: boolean;
  roomVerified: boolean;
  lastUpdated?: string;
}

export interface PeriodInfo {
  periodNumber: number;
  subject: string;
  teacher: string;
  room: string;
  roomBssid: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  isValidPeriod: boolean;
  isBreakTime: boolean;
  totalDurationMinutes: number;
}

export interface AttendanceRecord {
  studentId: string;
  name: string;
  department: string;
  room: string;
  branch: string;
  semester: string;
  startTime: Date;
  completedAt?: Date;
  totalDuration: number;
  totalPausedDuration: number;
  status: 'completed' | 'incomplete' | 'rejected' | 'absent';
  bssid: string;
  attendancePercentage: number;
  randomRingStatus: 'none' | 'selected' | 'accepted' | 'rejected' | 'confirmed';
  sessionDate: Date;
}

// Timetable Types
export interface TimetableEntry {
  slotId: string;
  day: string;
  lectureNumber: string;
  startTime: string;
  endTime: string;
  subject: string;
  teacherName: string;
  room: string;
  branch: string;
  semester: string;
  isActive: boolean;
}

export interface PeriodEntry {
  courseName?: string;
  roomNumber?: string;
  teacherName?: string;
  courseCode?: string;
  subject?: string;
  room?: string;
  teacher?: string;
}

export interface TimetablePeriod {
  periodNumber: number;
  startTime: string;
  endTime: string;
  monday?: PeriodEntry;
  tuesday?: PeriodEntry;
  wednesday?: PeriodEntry;
  thursday?: PeriodEntry;
  friday?: PeriodEntry;
  saturday?: PeriodEntry;
}

export interface TimetableTable {
  branch: string;
  semester: string;
  periods: TimetablePeriod[];
  academicYear: string;
  isActive: boolean;
  lastModifiedBy: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// WebSocket Event Types
export interface WebSocketEvent {
  type: string;
  data: any;
  timestamp: string;
}

// UI Component Types
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// Dashboard Types
export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  completedSessions: number;
  averageAttendance: number;
}

// Chart Data Types
export interface ChartDataPoint {
  name: string;
  value: number;
  date?: string;
  percentage?: number;
}