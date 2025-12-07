const io = require('socket.io-client');

const SOCKET_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';

console.log('🔌 Connecting to server:', SOCKET_URL);

const socket = io(SOCKET_URL, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10,
  transports: ['websocket', 'polling'],
  timeout: 20000
});

socket.on('connect', () => {
  console.log('✅ Connected to server');
  console.log('✅ Socket ID:', socket.id);
  console.log('✅ Listening for timer_broadcast events...\n');
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error.message);
});

let broadcastCount = 0;
let lastAttendedSeconds = {};

socket.on('timer_broadcast', (data) => {
  broadcastCount++;
  
  const studentKey = data.enrollmentNo || data.studentId;
  const prevSeconds = lastAttendedSeconds[studentKey] || 0;
  const isIncreasing = data.attendedSeconds > prevSeconds;
  lastAttendedSeconds[studentKey] = data.attendedSeconds;
  
  console.log(`\n📡 Broadcast #${broadcastCount} - ${new Date().toLocaleTimeString()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 Student:', data.name);
  console.log('🆔 Enrollment:', data.enrollmentNo);
  console.log('📚 Subject:', data.lectureSubject);
  console.log('🏫 Room:', data.lectureRoom);
  console.log('⏰ Time:', `${data.lectureStartTime} - ${data.lectureEndTime}`);
  console.log('');
  console.log('⏱️  TIMER DATA:');
  console.log(`   Total Lecture: ${data.totalLectureSeconds}s (${Math.floor(data.totalLectureSeconds / 60)}m)`);
  console.log(`   Elapsed: ${data.elapsedLectureSeconds}s (${Math.floor(data.elapsedLectureSeconds / 60)}m)`);
  console.log(`   Remaining: ${data.remainingLectureSeconds}s (${Math.floor(data.remainingLectureSeconds / 60)}m)`);
  console.log(`   Attended: ${data.attendedSeconds}s (${Math.floor(data.attendedSeconds / 60)}m) ${isIncreasing ? '📈 INCREASING' : '⚠️  NOT INCREASING'}`);
  console.log(`   Wasted: ${data.timeWastedSeconds}s (${Math.floor(data.timeWastedSeconds / 60)}m)`);
  console.log('');
  console.log('📊 STATUS:');
  console.log(`   Is Running: ${data.isRunning ? '✅ YES' : '❌ NO'}`);
  console.log(`   Is Paused: ${data.isPaused ? '⏸️  YES' : '▶️  NO'}`);
  console.log(`   Status: ${data.status}`);
  
  if (data.attendedSeconds === 0 && data.isRunning) {
    console.log('\n⚠️⚠️⚠️  WARNING: attendedSeconds is 0 but isRunning is true!');
    console.log('   This indicates the calculateAttendedTime function is returning 0');
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

// Keep script running
console.log('📊 Monitoring timer broadcasts...');
console.log('Press Ctrl+C to stop\n');

// Show summary every 30 seconds
setInterval(() => {
  console.log(`\n📊 SUMMARY: Received ${broadcastCount} broadcasts in last 30 seconds`);
  console.log('Students tracked:', Object.keys(lastAttendedSeconds).length);
  Object.entries(lastAttendedSeconds).forEach(([student, seconds]) => {
    console.log(`   ${student}: ${seconds}s (${Math.floor(seconds / 60)}m)`);
  });
  broadcastCount = 0;
}, 30000);
