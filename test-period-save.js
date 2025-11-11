// Test script to verify period save functionality
const SERVER_URL = 'https://google-8j5x.onrender.com';

const testPeriods = [
    { number: 6, startTime: '09:15', endTime: '10:05', isBreak: false },
    { number: 7, startTime: '10:05', endTime: '10:55', isBreak: false },
    { number: 8, startTime: '10:55', endTime: '11:45', isBreak: false },
    { number: 9, startTime: '11:45', endTime: '12:35', isBreak: false }
];

async function testPeriodUpdate() {
    console.log('🧪 Testing Period Update API...');
    console.log('Server URL:', SERVER_URL);
    console.log('Test periods:', testPeriods);

    try {
        const response = await fetch(`${SERVER_URL}/api/periods/update-all`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ periods: testPeriods })
        });

        console.log('\n📊 Response Status:', response.status);
        console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

        const contentType = response.headers.get('content-type');
        console.log('Content-Type:', contentType);

        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            console.log('\n✅ JSON Response:', data);

            if (data.success) {
                console.log(`\n🎉 SUCCESS! Updated ${data.updatedCount} timetables`);
            } else {
                console.log('\n❌ FAILED:', data.error || data.message);
            }
        } else {
            const text = await response.text();
            console.log('\n❌ Non-JSON Response:');
            console.log(text.substring(0, 500)); // First 500 chars
        }

    } catch (error) {
        console.error('\n💥 Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run test
testPeriodUpdate();
