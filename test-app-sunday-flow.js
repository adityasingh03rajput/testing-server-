// Test to simulate the exact App.js flow for Sunday
require('dotenv').config();
const fetch = require('node-fetch');

const SOCKET_URL = 'https://google-8j5x.onrender.com';

// Simulate convertTimetableFormat
function convertTimetableFormat(timetable) {
    if (!timetable || !timetable.timetable) return null;

    const schedule = {};
    const dayOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayKeys = Object.keys(timetable.timetable).sort((a, b) => 
        dayOrder.indexOf(a.toLowerCase()) - dayOrder.indexOf(b.toLowerCase())
    );

    console.log('📋 Processing days:', dayKeys);

    dayKeys.forEach((dayKey) => {
        const dayName = dayKey.charAt(0).toUpperCase() + dayKey.slice(1);
        console.log(`  🔍 Processing: ${dayKey} → ${dayName}`);
        
        if (timetable.timetable[dayKey]) {
            schedule[dayName] = timetable.timetable[dayKey].map(period => ({
                subject: period.subject,
                room: period.room,
                time: timetable.periods && timetable.periods[period.period - 1]
                    ? `${timetable.periods[period.period - 1].startTime}-${timetable.periods[period.period - 1].endTime}`
                    : '',
                isBreak: period.isBreak
            }));
            console.log(`    ✅ ${dayName}: ${schedule[dayName].length} periods`);
        }
    });

    return { ...timetable, schedule };
}

async function testSundayFlow() {
    console.log('🧪 Testing Sunday Flow in App.js\n');
    
    // Step 1: Fetch timetable
    console.log('📡 Fetching timetable...');
    const response = await fetch(`${SOCKET_URL}/api/timetable/1/CSE?cacheBust=${Date.now()}`);
    const data = await response.json();
    
    console.log('\n📥 Raw server response:');
    const rawDays = data.timetable?.timetable ? Object.keys(data.timetable.timetable) : [];
    console.log('  Days:', rawDays);
    console.log('  Sunday exists:', rawDays.includes('sunday'));
    
    // Step 2: Convert timetable
    console.log('\n🔄 Converting timetable format...');
    const convertedTimetable = convertTimetableFormat(data.timetable);
    
    console.log('\n📤 Converted timetable:');
    const convertedDays = convertedTimetable?.schedule ? Object.keys(convertedTimetable.schedule) : [];
    console.log('  Schedule keys:', convertedDays);
    console.log('  Sunday exists:', convertedDays.includes('Sunday'));
    
    // Step 3: Check what CircularTimer would receive
    const currentDay = 'Sunday';
    console.log('\n🎯 What CircularTimer receives:');
    console.log('  currentDay:', currentDay);
    console.log('  timetable.schedule exists:', !!convertedTimetable?.schedule);
    console.log('  timetable.schedule[currentDay] exists:', !!convertedTimetable?.schedule?.[currentDay]);
    
    if (convertedTimetable?.schedule?.[currentDay]) {
        const schedule = convertedTimetable.schedule[currentDay];
        console.log('  Schedule length:', schedule.length);
        console.log('\n📋 Sunday schedule:');
        schedule.forEach((slot, i) => {
            console.log(`    ${i + 1}. ${slot.subject || '(empty)'} - ${slot.room || 'no room'} ${slot.isBreak ? '[BREAK]' : ''}`);
        });
    } else {
        console.log('  ❌ NO SCHEDULE FOR SUNDAY!');
        console.log('  Available keys:', Object.keys(convertedTimetable?.schedule || {}));
    }
    
    // Step 4: Check if condition would pass
    console.log('\n🔍 Condition check:');
    console.log('  if (timetable?.schedule?.[currentDay]):', !!convertedTimetable?.schedule?.[currentDay]);
    console.log('  Would use DEFAULT_SEGMENTS:', !convertedTimetable?.schedule?.[currentDay]);
}

testSundayFlow().catch(console.error);
