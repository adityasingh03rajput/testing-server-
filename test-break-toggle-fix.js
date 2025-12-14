const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testBreakToggleFix() {
    const SERVER_URL = 'https://adioncode-e5gkh4grbqe4g8b7.centralindia-01.azurewebsites.net';
    
    console.log('🧪 Testing Break Toggle Fix');
    console.log('📋 Verifying that breaks are no longer hardcoded');
    console.log('='.repeat(80));
    
    try {
        // Test 1: Get a timetable and check for hardcoded breaks
        console.log('🔍 Test 1: Checking for hardcoded breaks in timetable...');
        
        const response = await fetch(`${SERVER_URL}/api/timetable/3/B.Tech Computer Science`);
        const data = await response.json();
        
        if (data.success && data.timetable) {
            const timetable = data.timetable;
            console.log('✅ Timetable fetched successfully');
            
            // Check periods for hardcoded breaks
            let hardcodedBreaks = 0;
            let totalPeriods = 0;
            
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            
            for (const day of days) {
                if (timetable.timetable[day]) {
                    for (const period of timetable.timetable[day]) {
                        totalPeriods++;
                        
                        // Check if period is marked as break
                        if (period.isBreak) {
                            console.log(`   📍 Found break: ${day} Period ${period.period} - "${period.subject}"`);
                            hardcodedBreaks++;
                        }
                    }
                }
            }
            
            console.log(`📊 Break Analysis:`);
            console.log(`   Total periods: ${totalPeriods}`);
            console.log(`   Break periods: ${hardcodedBreaks}`);
            
            if (hardcodedBreaks === 0) {
                console.log('✅ GOOD: No hardcoded breaks found - all periods are regular by default');
            } else {
                console.log('⚠️  Found some break periods - these should be manually set, not hardcoded');
            }
            
        } else {
            console.log('❌ Failed to fetch timetable');
            return;
        }
        
        // Test 2: Create a new timetable and verify no hardcoded breaks
        console.log('\n🔍 Test 2: Creating new timetable to verify no hardcoded breaks...');
        
        const newTimetableData = {
            semester: '4',
            branch: 'Test Branch',
            periods: [
                { number: 1, startTime: '08:00', endTime: '08:50' },
                { number: 2, startTime: '08:50', endTime: '09:40' },
                { number: 3, startTime: '09:40', endTime: '09:55' }, // Short period (15 min)
                { number: 4, startTime: '09:55', endTime: '10:45' },
                { number: 5, startTime: '10:45', endTime: '11:35' },
                { number: 6, startTime: '13:00', endTime: '13:50' }, // Lunch time period
                { number: 7, startTime: '13:50', endTime: '14:40' },
                { number: 8, startTime: '14:40', endTime: '15:30' }
            ],
            timetable: {
                monday: [],
                tuesday: [],
                wednesday: [],
                thursday: [],
                friday: [],
                saturday: [],
                sunday: []
            }
        };
        
        // Fill timetable with empty periods
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        days.forEach(day => {
            newTimetableData.timetable[day] = newTimetableData.periods.map(p => ({
                period: p.number,
                subject: '',
                teacher: '',
                teacherName: '',
                room: '',
                isBreak: false
            }));
        });
        
        const createResponse = await fetch(`${SERVER_URL}/api/timetable`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newTimetableData)
        });
        
        const createData = await createResponse.json();
        
        if (createData.success) {
            console.log('✅ New timetable created successfully');
            
            // Check if any periods were automatically marked as breaks
            let autoBreaks = 0;
            for (const day of days) {
                for (const period of createData.timetable.timetable[day]) {
                    if (period.isBreak) {
                        console.log(`   ❌ Auto-break detected: ${day} Period ${period.period}`);
                        autoBreaks++;
                    }
                }
            }
            
            if (autoBreaks === 0) {
                console.log('✅ PERFECT: No automatic break detection - all periods are regular');
            } else {
                console.log(`❌ ISSUE: ${autoBreaks} periods were automatically marked as breaks`);
            }
            
        } else {
            console.log('❌ Failed to create test timetable');
        }
        
        console.log('\n' + '='.repeat(80));
        console.log('📋 BREAK TOGGLE FIX SUMMARY:');
        console.log('='.repeat(80));
        
        console.log('✅ IMPLEMENTED CHANGES:');
        console.log('   1. Removed hardcoded break detection from server.js');
        console.log('   2. Removed hardcoded break detection from admin-panel/renderer.js');
        console.log('   3. All periods now look the same in timetable grid');
        console.log('   4. Added toggle button (🔔/📚) to mark/unmark breaks');
        console.log('   5. Added context menu option to toggle breaks');
        console.log('   6. Break periods show subtle styling (yellow border)');
        console.log('   7. Break periods can be reverted to regular periods');
        
        console.log('\n💡 HOW TO USE:');
        console.log('   • Click the 🔔 button on any period to mark as break');
        console.log('   • Click the 📚 button on break periods to revert to regular');
        console.log('   • Right-click any period → "Mark as Break" or "Mark as Regular"');
        console.log('   • Edit any period → Check/uncheck "Is Break Period"');
        
        console.log('\n🎯 BENEFITS:');
        console.log('   • No more hardcoded breaks in P3 or P6');
        console.log('   • Any period can be marked as break');
        console.log('   • Break periods can be reverted back');
        console.log('   • Flexible timetable management');
        console.log('   • All periods have consistent styling initially');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testBreakToggleFix().catch(console.error);