import { useState, useEffect } from 'react';
import { getServerTime } from './ServerTime';

/**
 * React Hook for accessing server time
 * Updates automatically at specified interval
 * 
 * @param {number} updateInterval - Update interval in milliseconds (default: 1000)
 * @returns {Date} Current server time as Date object
 */
export const useServerTime = (updateInterval = 1000) => {
  const [time, setTime] = useState(() => {
    try {
      return getServerTime().nowDate();
    } catch {
      return new Date();
    }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        setTime(getServerTime().nowDate());
      } catch {
        // Fallback to device time if server time not available
        setTime(new Date());
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  return time;
};

/**
 * Get server time once (not reactive)
 * Use this for one-time operations
 */
export const getServerTimeNow = () => {
  try {
    return getServerTime().nowDate();
  } catch {
    console.warn('⚠️ Server time not available, using device time');
    return new Date();
  }
};

/**
 * Get server timestamp in milliseconds
 */
export const getServerTimestamp = () => {
  try {
    return getServerTime().now();
  } catch {
    console.warn('⚠️ Server time not available, using device time');
    return Date.now();
  }
};

/**
 * Get current day from server time
 */
export const getServerDay = () => {
  try {
    return getServerTime().getCurrentDay();
  } catch {
    const dayIndex = new Date().getDay();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  }
};

/**
 * Get current time in minutes since midnight (server time)
 */
export const getServerTimeInMinutes = () => {
  try {
    return getServerTime().getCurrentTimeInMinutes();
  } catch {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }
};
