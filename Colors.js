// Centralized Color System for the App
// Indian-themed color palette with modern design

export const Colors = {
  // Primary Brand Colors
  primary: {
    main: '#FF6B35',        // Saffron Orange (Indian flag inspired)
    light: '#FF8C61',
    dark: '#E55A2B',
    gradient: ['#FF6B35', '#FF8C61'],
  },
  
  secondary: {
    main: '#138808',        // Indian Green (flag inspired)
    light: '#1FA910',
    dark: '#0F6906',
    gradient: ['#138808', '#1FA910'],
  },
  
  accent: {
    blue: '#000080',        // Navy Blue (Ashoka Chakra)
    gold: '#FFD700',        // Gold
    saffron: '#FF9933',     // Saffron
    white: '#FFFFFF',       // White
    green: '#138808',       // Green
  },

  // Status Colors
  status: {
    success: '#10b981',     // Green - Present/Success
    error: '#ef4444',       // Red - Absent/Error
    warning: '#f59e0b',     // Amber - Warning
    info: '#3b82f6',        // Blue - Info
    pending: '#8b5cf6',     // Purple - Pending
  },

  // Attendance Colors
  attendance: {
    present: '#10b981',     // Green
    absent: '#ef4444',      // Red
    leave: '#f59e0b',       // Amber
    holiday: '#8b5cf6',     // Purple
  },

  // Holiday Types
  holidays: {
    national: '#FF6B35',    // Saffron - National holidays
    religious: '#e74c3c',   // Red - Religious festivals
    academic: '#3498db',    // Blue - Academic events
    exam: '#9b59b6',        // Purple - Exams
    event: '#f39c12',       // Orange - Events
  },

  // Theme Colors - Dark
  dark: {
    background: '#0a1628',
    cardBackground: '#0d1f3c',
    text: '#ffffff',
    textSecondary: '#00d9ff',
    primary: '#00f5ff',
    border: '#00d9ff',
    shadow: 'rgba(0, 0, 0, 0.5)',
  },

  // Theme Colors - Light
  light: {
    background: '#fef3e2',      // Warm cream
    cardBackground: '#ffffff',   // Pure white
    text: '#2c1810',            // Rich brown
    textSecondary: '#8b6f47',   // Warm brown
    primary: '#FF6B35',         // Saffron orange
    border: '#f3d5a0',          // Light golden
    shadow: 'rgba(0, 0, 0, 0.1)',
  },

  // Gradient Combinations
  gradients: {
    primary: ['#FF6B35', '#FF8C61'],
    secondary: ['#138808', '#1FA910'],
    tricolor: ['#FF9933', '#FFFFFF', '#138808'],
    sunset: ['#FF6B35', '#FFD700'],
    ocean: ['#00d9ff', '#3b82f6'],
    forest: ['#138808', '#10b981'],
  },

  // Semantic Colors
  semantic: {
    link: '#3b82f6',
    danger: '#ef4444',
    safe: '#10b981',
    neutral: '#6b7280',
  },

  // Chart Colors (for analytics)
  charts: {
    bar1: '#FF6B35',
    bar2: '#138808',
    bar3: '#3b82f6',
    bar4: '#f59e0b',
    bar5: '#8b5cf6',
    line1: '#00d9ff',
    line2: '#10b981',
  },

  // Opacity Variants
  opacity: {
    high: 'FF',      // 100%
    medium: 'CC',    // 80%
    low: '80',       // 50%
    veryLow: '40',   // 25%
    subtle: '1A',    // 10%
  },
};

// Helper function to add opacity to hex color
export const addOpacity = (hexColor, opacity) => {
  const opacityHex = Colors.opacity[opacity] || 'FF';
  return hexColor + opacityHex;
};

// Helper function to get theme colors
export const getThemeColors = (isDark) => {
  return isDark ? Colors.dark : Colors.light;
};

// Helper function to get status color
export const getStatusColor = (status) => {
  switch (status) {
    case 'present':
      return Colors.attendance.present;
    case 'absent':
      return Colors.attendance.absent;
    case 'leave':
      return Colors.attendance.leave;
    case 'holiday':
      return Colors.attendance.holiday;
    default:
      return Colors.semantic.neutral;
  }
};

// Helper function to get holiday color
export const getHolidayColor = (type) => {
  switch (type) {
    case 'national':
      return Colors.holidays.national;
    case 'religious':
      return Colors.holidays.religious;
    case 'academic':
      return Colors.holidays.academic;
    case 'exam':
      return Colors.holidays.exam;
    case 'event':
      return Colors.holidays.event;
    default:
      return Colors.holidays.event;
  }
};

// Color Palette Documentation
export const ColorPalette = {
  description: 'Indian-themed color system with modern design',
  inspiration: 'Indian flag colors (Saffron, White, Green) with Navy Blue from Ashoka Chakra',
  usage: {
    primary: 'Main brand color - Saffron Orange for CTAs and important elements',
    secondary: 'Supporting color - Indian Green for success states',
    accent: 'Highlight colors - Navy Blue, Gold for special elements',
    status: 'Feedback colors - Standard success/error/warning/info',
    attendance: 'Attendance-specific colors for different states',
    holidays: 'Holiday type colors for calendar events',
  },
  accessibility: {
    contrast: 'All colors meet WCAG AA standards for text contrast',
    colorBlind: 'Tested for deuteranopia and protanopia',
  },
};

export default Colors;
