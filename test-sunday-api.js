// Quick test to check if API returns Sunday
const https = require('https');

https.get('https://google-8j5x.onrender.com/api/timetable/1/CSE', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const json = JSON.parse(data);
        const days = Object.keys(json.timetable.timetable);
        console.log('📅 Days in API response:', days);
        console.log('✅ Has Sunday:', days.includes('sunday'));
        
        if (days.includes('sunday')) {
            const sundayPeriods = json.timetable.timetable.sunday;
            console.log(`📊 Sunday has ${sundayPeriods.length} periods`);
            console.log('First period:', sundayPeriods[0]);
        }
    });
}).on('error', err => console.error('Error:', err));
