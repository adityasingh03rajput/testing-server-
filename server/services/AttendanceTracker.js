const { AttendanceSession, AttendanceConfig } = require('../models/AttendanceTracking');

class AttendanceTracker {
  constructor() {
    // In-memory tracking for active sessions
    this.activeSessions = new Map(); // studentId -> session data
    this.saveInterval = 30000; // Save to DB every 30 seconds
    this.startAutoSave();
  }

  /**
   * Start tracking attendance after face verification
   * Called when student verifies face and timer starts
   */
  async startTracking(studentId, lectureInfo) {
    const now = new Date();

    // Get or create attendance session for today
    let session = await AttendanceSession.findOne({
      studentId,
      date: { $gte: this.getStartOfDay(now), $lt: this.getEndOfDay(now) }
    });

    if (!session) {
      session = new AttendanceSession({
        studentId,
        date: now,
        semester: lectureInfo.semester,
        branch: lectureInfo.branch,
        sessions: [],
        dailySummary: {
          totalSecondsAttended: 0,
          totalClassSeconds: 0,
          attendancePercentage: 0,
          isPresentForDay: false,
          requiredDailyPercentage: 75
        }
      });
    }

    // Find or create lecture session
    let lectureSession = session.sessions.find(s => 
      s.subject === lectureInfo.subject && 
      s.room === lectureInfo.room &&
      this.isSameTimeSlot(s.scheduledStart, lectureInfo.startTime)
    );

    if (!lectureSession) {
      // Get threshold from config
      const config = await this.getAttendanceConfig(lectureInfo.semester, lectureInfo.branch);
      const threshold = this.getLectureThreshold(config, lectureInfo.subject);

      lectureSession = {
        lectureId: `${lectureInfo.subject}-${lectureInfo.room}-${lectureInfo.startTime}`,
        subject: lectureInfo.subject,
        room: lectureInfo.room,
        teacherName: lectureInfo.teacherName,
        scheduledStart: new Date(lectureInfo.startTime),
        scheduledEnd: new Date(lectureInfo.endTime),
        faceVerifiedAt: now,
        timerStartedAt: now,
        totalSecondsAttended: 0,
        totalLectureSeconds: this.calculateDuration(lectureInfo.startTime, lectureInfo.endTime),
        attendancePercentage: 0,
        isPresent: false,
        requiredPercentage: threshold,
        isActive: true,
        lastSyncedAt: now
      };
      session.sessions.push(lectureSession);
    } else {
      // Resume tracking for existing lecture
      lectureSession.faceVerifiedAt = now;
      lectureSession.timerStartedAt = now;
      lectureSession.isActive = true;
      lectureSession.lastSyncedAt = now;
    }

    await session.save();

    // Store in memory for real-time tracking
    this.activeSessions.set(studentId, {
      sessionId: session._id,
      lectureId: lectureSession.lectureId,
      startTime: now,
      lastUpdate: now
    });

    console.log(`✅ Started tracking for ${studentId} - ${lectureSession.subject}`);
    return { sessionId: session._id, lectureId: lectureSession.lectureId };
  }

  /**
   * Update timer value from client
   * Called periodically (every 30s) to sync timer state
   */
  async updateTimer(studentId, timerSeconds) {
    const activeSession = this.activeSessions.get(studentId);
    if (!activeSession) {
      console.log(`⚠️ No active session for ${studentId}`);
      return { success: false, error: 'No active session' };
    }

    const now = new Date();
    const session = await AttendanceSession.findById(activeSession.sessionId);
    if (!session) {
      console.log(`⚠️ Session not found for ${studentId}`);
      return { success: false, error: 'Session not found' };
    }

    // Find the active lecture
    const lectureSession = session.sessions.find(s => s.lectureId === activeSession.lectureId);
    if (!lectureSession || !lectureSession.isActive) {
      console.log(`⚠️ No active lecture for ${studentId}`);
      return { success: false, error: 'No active lecture' };
    }

    // Update attended time from timer
    lectureSession.totalSecondsAttended = timerSeconds;
    lectureSession.attendancePercentage = (lectureSession.totalSecondsAttended / lectureSession.totalLectureSeconds) * 100;
    lectureSession.isPresent = lectureSession.attendancePercentage >= lectureSession.requiredPercentage;
    lectureSession.lastSyncedAt = now;

    // Update daily summary
    this.updateDailySummary(session);

    session.lastUpdated = now;
    await session.save();

    activeSession.lastUpdate = now;

    console.log(`📊 Updated timer for ${studentId}: ${timerSeconds}s (${lectureSession.attendancePercentage.toFixed(1)}%)`);

    return {
      success: true,
      lecturePercentage: lectureSession.attendancePercentage.toFixed(2),
      isPresent: lectureSession.isPresent,
      dailyPercentage: session.dailySummary.attendancePercentage.toFixed(2),
      isPresentForDay: session.dailySummary.isPresentForDay
    };
  }

  /**
   * Stop tracking when lecture ends
   */
  async stopTracking(studentId, reason = 'lecture_ended') {
    const activeSession = this.activeSessions.get(studentId);
    if (!activeSession) return { success: false, error: 'No active session' };

    const now = new Date();
    const session = await AttendanceSession.findById(activeSession.sessionId);
    if (!session) return { success: false, error: 'Session not found' };

    // Find the active lecture
    const lectureSession = session.sessions.find(s => s.lectureId === activeSession.lectureId);
    if (!lectureSession || !lectureSession.isActive) return { success: false, error: 'No active lecture' };

    // Mark as stopped
    lectureSession.timerStoppedAt = now;
    lectureSession.isActive = false;

    // Final calculation
    lectureSession.attendancePercentage = (lectureSession.totalSecondsAttended / lectureSession.totalLectureSeconds) * 100;
    lectureSession.isPresent = lectureSession.attendancePercentage >= lectureSession.requiredPercentage;

    // Update daily summary
    this.updateDailySummary(session);

    await session.save();
    this.activeSessions.delete(studentId);

    console.log(`🛑 Stopped tracking for ${studentId} - ${lectureSession.isPresent ? 'PRESENT' : 'ABSENT'} (${lectureSession.attendancePercentage.toFixed(1)}%)`);

    return {
      success: true,
      lectureTime: this.formatTime(lectureSession.totalSecondsAttended),
      lecturePercentage: lectureSession.attendancePercentage.toFixed(2),
      isPresent: lectureSession.isPresent,
      dailyTime: this.formatTime(session.dailySummary.totalSecondsAttended),
      dailyPercentage: session.dailySummary.attendancePercentage.toFixed(2),
      isPresentForDay: session.dailySummary.isPresentForDay
    };
  }

  /**
   * Auto-save active sessions to database
   * This is a backup - main updates come from client timer syncs
   */
  startAutoSave() {
    setInterval(async () => {
      const now = new Date();
      
      for (const [studentId, activeSession] of this.activeSessions.entries()) {
        try {
          // Check if session is stale (no update in 5 minutes)
          const timeSinceLastUpdate = (now - activeSession.lastUpdate) / 1000;
          if (timeSinceLastUpdate > 300) {
            console.log(`⚠️ Stale session detected for ${studentId}, stopping tracking`);
            await this.stopTracking(studentId, 'timeout');
          }
        } catch (error) {
          console.error(`Error checking session for ${studentId}:`, error);
        }
      }
    }, this.saveInterval);
  }

  /**
   * Update daily summary
   */
  updateDailySummary(session) {
    let totalAttended = 0;
    let totalClass = 0;

    session.sessions.forEach(lecture => {
      totalAttended += lecture.totalSecondsAttended;
      totalClass += lecture.totalLectureSeconds;
    });

    session.dailySummary.totalSecondsAttended = totalAttended;
    session.dailySummary.totalClassSeconds = totalClass;
    session.dailySummary.attendancePercentage = totalClass > 0 ? (totalAttended / totalClass) * 100 : 0;
    session.dailySummary.isPresentForDay = session.dailySummary.attendancePercentage >= session.dailySummary.requiredDailyPercentage;
  }

  /**
   * Get attendance config
   */
  async getAttendanceConfig(semester, branch) {
    let config = await AttendanceConfig.findOne({ semester, branch });
    
    if (!config) {
      // Create default config
      config = new AttendanceConfig({
        semester,
        branch,
        defaultLectureThreshold: 75,
        dailyThreshold: 75,
        gracePeriodSeconds: 300
      });
      await config.save();
    }
    
    return config;
  }

  /**
   * Get lecture-specific threshold
   */
  getLectureThreshold(config, subject) {
    const subjectConfig = config.subjectThresholds.find(s => s.subject === subject);
    return subjectConfig ? subjectConfig.threshold : config.defaultLectureThreshold;
  }

  /**
   * Format time as days, hours, minutes, seconds
   */
  formatTime(totalSeconds) {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      days,
      hours,
      minutes,
      seconds,
      totalSeconds,
      formatted: `${days}d ${hours}h ${minutes}m ${seconds}s`
    };
  }

  /**
   * Helper functions
   */
  getDateKey(date) {
    return date.toISOString().split('T')[0];
  }

  getStartOfDay(date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  getEndOfDay(date) {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  isSameTimeSlot(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getHours() === d2.getHours() && d1.getMinutes() === d2.getMinutes();
  }

  calculateDuration(startTime, endTime) {
    return Math.floor((new Date(endTime) - new Date(startTime)) / 1000);
  }

  /**
   * Get student attendance report
   */
  async getAttendanceReport(studentId, date) {
    const session = await AttendanceSession.findOne({
      studentId,
      date: { $gte: this.getStartOfDay(date), $lt: this.getEndOfDay(date) }
    });

    if (!session) {
      return { found: false, message: 'No attendance record for this date' };
    }

    return {
      found: true,
      date: session.date,
      lectures: session.sessions.map(lecture => ({
        subject: lecture.subject,
        room: lecture.room,
        teacher: lecture.teacherName,
        scheduledTime: {
          start: lecture.scheduledStart,
          end: lecture.scheduledEnd,
          duration: this.formatTime(lecture.totalLectureSeconds)
        },
        attended: this.formatTime(lecture.totalSecondsAttended),
        percentage: lecture.attendancePercentage.toFixed(2),
        isPresent: lecture.isPresent,
        requiredPercentage: lecture.requiredPercentage,
        segments: lecture.segments.map(seg => ({
          start: seg.startTime,
          end: seg.endTime,
          duration: this.formatTime(seg.durationSeconds)
        }))
      })),
      dailySummary: {
        totalAttended: this.formatTime(session.dailySummary.totalSecondsAttended),
        totalClass: this.formatTime(session.dailySummary.totalClassSeconds),
        percentage: session.dailySummary.attendancePercentage.toFixed(2),
        isPresentForDay: session.dailySummary.isPresentForDay,
        requiredPercentage: session.dailySummary.requiredDailyPercentage
      }
    };
  }
}

// Singleton instance
const attendanceTracker = new AttendanceTracker();

module.exports = attendanceTracker;
