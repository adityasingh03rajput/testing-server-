require('dotenv').config();
const io = require('socket.io-client');

const SOCKET_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';

console.log('🔌 Connecting to server...');
console.log(`📡 URL: ${SOCKET_URL}\n`);

const socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true
});

let broadcastCount = 0;
const startTime = Date.now();

socket.on('connect', () => {
    console.log('✅ Connected to server');
    console.log(`🆔 Socket ID: ${socket.id}\n`);
    console.log('👂 Listening for timer_broadcast events...\n');
    console.log('═══════════════════════════════════════════════════════════');
});

socket.on('timer_broadcast', (data) => {
    broadcastCount++;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    
    console.log(`\n📡 Broadcast #${broadcastCount} (${elapsed}s elapsed)`);
    console.log('─────────────────────────────────────────────────────────');
    
    if (data.studentId) {
        // New format (individual student)
        console.log(`Student: ${data.name} (${data.enrollmentNo})`);
        console.log(`Attended: ${data.attendedSeconds}s (${Math.floor(data.attendedSeconds / 60)}m)`);
        console.log(`Subject: ${data.lectureSubject || 'N/A'}`);
        console.log(`Status: ${data.status}`);
        console.log(`Is Running: ${data.isRunning}`);
    } else if (data.students) {
        // Old format (array of students)
        console.log(`⚠️  OLD FORMAT - Array of ${data.students.length} students`);
        data.students.forEach(s => {
            console.log(`  - ${s.name}: ${s.elapsedSeconds}s`);
        });
    } else {
        console.log('❓ Unknown format:', JSON.stringify(data, null, 2));
    }
});

socket.on('disconnect', () => {
    console.log('\n❌ Disconnected from server');
});

socket.on('connect_error', (error) => {
    console.error('\n❌ Connection error:', error.message);
});

// Run for 30 seconds
setTimeout(() => {
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log(`📊 SUMMARY`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Total broadcasts received: ${broadcastCount}`);
    console.log(`Expected broadcasts (30s): ~30`);
    
    if (broadcastCount === 0) {
        console.log('\n❌ NO BROADCASTS RECEIVED');
        console.log('   Possible causes:');
        console.log('   1. Timer broadcast system not running on server');
        console.log('   2. No students with isRunning=true');
        console.log('   3. Server error preventing broadcasts');
    } else if (broadcastCount < 20) {
        console.log('\n⚠️  FEW BROADCASTS RECEIVED');
        console.log('   Timer broadcast might be slow or intermittent');
    } else {
        console.log('\n✅ BROADCASTS WORKING NORMALLY');
    }
    
    socket.disconnect();
    process.exit(0);
}, 30000);
