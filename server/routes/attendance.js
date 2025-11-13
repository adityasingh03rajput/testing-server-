const express = require('express');
const router = express.Router();
const attendanceTracker = require('../services/AttendanceTracker');
const { AttendanceSession, AttendanceConfig } = require('../models/AttendanceTracking');

/**
 * Start attendance tracking
 * POST /api/attendance/start
 */
router.post('/start', async (req, res) => {
  try {
    const { studentId, lectureInfo, timetable } = req.body;

    if (!studentId || !lectureInfo) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await attendanceTracker.startTracking(studentId, lectureInfo, timetable);
    
    res.json({
      success: true,
      message: 'Attendance tracking started',
      ...result
    });
  } catch (error) {
    console.error('Error starting attendance:', error);
    res.status(500).json({ error: 'Failed to start attendance tracking' });
  }
});

/**
 * Stop attendance tracking
 * POST /api/attendance/stop
 */
router.post('/stop', async (req, res) => {
  try {
    const { studentId, reason } = req.body;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID required' });
    }

    const result = await attendanceTracker.stopTracking(studentId, reason);
    
    res.json({
      success: true,
      message: 'Attendance tracking stopped',
      ...result
    });
  } catch (error) {
    console.error('Error stopping attendance:', error);
    res.status(500).json({ error: 'Failed to stop attendance tracking' });
  }
});

/**
 * Update attendance (heartbeat)
 * POST /api/attendance/update
 */
router.post('/update', async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID required' });
    }

    const result = await attendanceTracker.updateTracking(studentId);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
});

/**
 * Get attendance report
 * GET /api/attendance/report/:studentId
 */
router.get('/report/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { date } = req.query;

    const reportDate = date ? new Date(date) : new Date();
    const report = await attendanceTracker.getAttendanceReport(studentId, reportDate);
    
    res.json(report);
  } catch (error) {
    console.error('Error getting attendance report:', error);
    res.status(500).json({ error: 'Failed to get attendance report' });
  }
});

/**
 * Get attendance config
 * GET /api/attendance/config/:semester/:branch
 */
router.get('/config/:semester/:branch', async (req, res) => {
  try {
    const { semester, branch } = req.params;
    
    const config = await attendanceTracker.getAttendanceConfig(semester, branch);
    
    res.json(config);
  } catch (error) {
    console.error('Error getting config:', error);
    res.status(500).json({ error: 'Failed to get attendance config' });
  }
});

/**
 * Update attendance config (Admin only)
 * PUT /api/attendance/config
 */
router.put('/config', async (req, res) => {
  try {
    const { semester, branch, defaultLectureThreshold, dailyThreshold, subjectThresholds, gracePeriodSeconds } = req.body;

    let config = await AttendanceConfig.findOne({ semester, branch });
    
    if (!config) {
      config = new AttendanceConfig({ semester, branch });
    }

    if (defaultLectureThreshold !== undefined) config.defaultLectureThreshold = defaultLectureThreshold;
    if (dailyThreshold !== undefined) config.dailyThreshold = dailyThreshold;
    if (gracePeriodSeconds !== undefined) config.gracePeriodSeconds = gracePeriodSeconds;
    if (subjectThresholds) config.subjectThresholds = subjectThresholds;

    config.updatedAt = new Date();
    await config.save();
    
    res.json({
      success: true,
      message: 'Attendance config updated',
      config
    });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ error: 'Failed to update attendance config' });
  }
});

/**
 * Get attendance statistics
 * GET /api/attendance/stats/:studentId
 */
router.get('/stats/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    const query = { studentId };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const sessions = await AttendanceSession.find(query).sort({ date: -1 });
    
    // Calculate overall statistics
    let totalAttended = 0;
    let totalClass = 0;
    let presentDays = 0;
    let totalDays = sessions.length;

    sessions.forEach(session => {
      totalAttended += session.dailySummary.totalSecondsAttended;
      totalClass += session.dailySummary.totalClassSeconds;
      if (session.dailySummary.isPresentForDay) presentDays++;
    });

    const overallPercentage = totalClass > 0 ? (totalAttended / totalClass) * 100 : 0;

    res.json({
      success: true,
      stats: {
        totalDays,
        presentDays,
        absentDays: totalDays - presentDays,
        totalAttended: attendanceTracker.formatTime(totalAttended),
        totalClass: attendanceTracker.formatTime(totalClass),
        overallPercentage: overallPercentage.toFixed(2),
        sessions: sessions.map(s => ({
          date: s.date,
          attended: attendanceTracker.formatTime(s.dailySummary.totalSecondsAttended),
          total: attendanceTracker.formatTime(s.dailySummary.totalClassSeconds),
          percentage: s.dailySummary.attendancePercentage.toFixed(2),
          isPresent: s.dailySummary.isPresentForDay
        }))
      }
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get attendance statistics' });
  }
});

module.exports = router;
