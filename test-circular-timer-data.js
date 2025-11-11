// Test script to verify CircularTimer data flow
require('dotenv').config();
const fetch = require('node-fetch');

const SOCKET_URL = 'https://google-8j5x.onrender.com';

async function testCircularTimerData() {
    console.log('🧪 Testing CircularTimer Data Flow\n');
    
    // Test 1: Fetch timetable from server
    console.log('📡 Step 1: Fetching timetable from server...');
    const response = await fetch(`${SOCKET_URL}/api/timetable/1/CSE`);
    const data = await response.json();
    
    console.log('✅ Server Response:');
    console.log('  - Success:', data.success);
    console.log('  - Has timetable:', !!data.timetable);
    console.log('  - Days in timetable:', data.timetable?.timetable ? Object.keys(data.timetable.timetable) : 'none');
    console.log('  - Sunday exists:', data.timetable?.timetable?.sunday ? 'YES ✅' : 'NO ❌');
    
    if (data.timetable?.timetable?.sunday) {
        console.log('  - Sunday periods:', data.timetable.timetable.sunday.length);
        console.log('  - Sunday period 7:', data.timetable.timetable.sunday[6]);
    }
    
    // Test 2: Simulate convertTimetableFormat
    console.log('\n📊 Step 2: Simulating convertTimetableFormat...');
    const timetable = data.timetable;
    const schedule = {};
    const dayOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayKeys = Object.keys(timetable.timetable).sort((a, b) => 
        dayOrder.indexOf(a.toLowerCase()) - dayOrder.indexOf(b.toLowerCase())
    );
    
    dayKeys.forEach((dayKey) => {
        const dayName = dayKey.charAt(0).toUpperCase() + dayKey.slice(1);
        if (timetable.timetable[dayKey]) {
            schedule[dayName] = timetable.timetable[dayKey].map(period => ({
                subject: period.subject,
                room: period.room,
                time: timetable.periods && timetable.periods[period.period - 1]
                    ? `${timetable.periods[period.period - 1].startTime}-${timetable.periods[period.period - 1].endTime}`
                    : '',
                isBreak: period.isBreak
            }));
        }
    });
    
    console.log('✅ Converted schedule keys:', Object.keys(schedule));
    console.log('  - Sunday in schedule:', schedule.Sunday ? 'YES ✅' : 'NO ❌');
    
    if (schedule.Sunday) {
        console.log('  - Sunday periods:', schedule.Sunday.length);
        console.log('  - Sunday period 7:', schedule.Sunday[6]);
    }
    
    // Test 3: Check what CircularTimer would receive
    console.log('\n🎯 Step 3: What CircularTimer receives...');
    const currentDay = 'Sunday'; // Simulating Sunday
    console.log('  - currentDay prop:', currentDay);
    console.log('  - timetable.schedule exists:', !!schedule);
    console.log('  - timetable.schedule[currentDay] exists:', !!schedule[currentDay]);
    
    if (schedule[currentDay]) {
        console.log('  - Schedule length:', schedule[currentDay].length);
        console.log('\n📋 Full Sunday Schedule:');
        schedule[currentDay].forEach((slot, i) => {
            console.log(`    Period ${i + 1}: ${slot.subject} (${slot.room}) ${slot.isBreak ? '[BREAK]' : ''}`);
        });
    }
    
    // Test 4: Check current day detection
    console.log('\n📅 Step 4: Current day detection...');
    const now = new Date();
    const dayIndex = now.getDay();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    console.log('  - Today is:', days[dayIndex]);
    console.log('  - Day index:', dayIndex);
}

testCircularTimerData().catch(console.error);
