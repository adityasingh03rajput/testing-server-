// Test script to verify break period detection logic

function getDefaultPeriods() {
    return [
        { number: 1, startTime: '09:00', endTime: '10:00' },
        { number: 2, startTime: '10:00', endTime: '11:00' },
        { number: 3, startTime: '11:00', endTime: '11:15' }, // Break (15 min)
        { number: 4, startTime: '11:15', endTime: '12:15' },
        { number: 5, startTime: '12:15', endTime: '13:15' },
        { number: 6, startTime: '13:15', endTime: '14:00' }, // Lunch (45 min)
        { number: 7, startTime: '14:00', endTime: '15:00' },
        { number: 8, startTime: '15:00', endTime: '16:00' }
    ];
}

function testBreakDetection() {
    console.log('🧪 Testing Break Period Detection Logic...');
    console.log('='.repeat(60));
    
    const periods = getDefaultPeriods();
    
    periods.forEach(p => {
        // Calculate period duration in minutes
        const [startH, startM] = p.startTime.split(':').map(Number);
        const [endH, endM] = p.endTime.split(':').map(Number);
        const duration = (endH * 60 + endM) - (startH * 60 + startM);
        
        // Auto-detect break periods based on duration and time
        let subject = '';
        let isBreak = false;
        
        if (duration <= 30) {
            // Short periods (≤30 min) are likely breaks
            subject = 'Break';
            isBreak = true;
        } else if (startH >= 13 && startH < 14 && duration <= 60) {
            // Periods between 1-2 PM with ≤60 min duration are likely lunch
            subject = 'Lunch Break';
            isBreak = true;
        }
        
        const status = isBreak ? '🍽️' : '📚';
        const type = isBreak ? `(${subject})` : '(Class)';
        
        console.log(`${status} P${p.number}: ${p.startTime}-${p.endTime} (${duration}min) ${type}`);
    });
    
    console.log('='.repeat(60));
    console.log('✅ Break detection test completed!');
    
    // Summary
    const breakPeriods = periods.filter(p => {
        const [startH, startM] = p.startTime.split(':').map(Number);
        const [endH, endM] = p.endTime.split(':').map(Number);
        const duration = (endH * 60 + endM) - (startH * 60 + startM);
        return duration <= 30 || (startH >= 13 && startH < 14 && duration <= 60);
    });
    
    console.log(`📊 Summary: ${breakPeriods.length} break periods detected out of ${periods.length} total periods`);
    breakPeriods.forEach(p => {
        const [startH, startM] = p.startTime.split(':').map(Number);
        const [endH, endM] = p.endTime.split(':').map(Number);
        const duration = (endH * 60 + endM) - (startH * 60 + startM);
        const breakType = duration <= 30 ? 'Break' : 'Lunch Break';
        console.log(`   - P${p.number} (${p.startTime}-${p.endTime}): ${breakType}`);
    });
}

// Run the test
testBreakDetection();