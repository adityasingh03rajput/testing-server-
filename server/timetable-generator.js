// This file contains timetable generation function
// Import this in seed-data.js

function generateTimetables() {
    const standardPeriods = [
        { number: 1, startTime: '09:40', endTime: '10:40' },
        { number: 2, startTime: '10:40', endTime: '11:40' },
        { number: 3, startTime: '11:40', endTime: '12:10' },
        { number: 4, startTime: '12:10', endTime: '13:10' },
        { number: 5, startTime: '13:10', endTime: '14:10' },
        { number: 6, startTime: '14:10', endTime: '14:20' },
        { number: 7, startTime: '14:20', endTime: '15:30' },
        { number: 8, startTime: '15:30', endTime: '16:10' },
    ];

    return [
        // CSE Semester 1
        {
            semester: '1', branch: 'CSE', periods: standardPeriods,
            timetable: {
                monday: [
                    { period: 1, subject: 'Mathematics-I', room: 'CS-101', isBreak: false },
                    { period: 2, subject: 'Physics', room: 'PH-101', isBreak: false },
                    { period: 3, subject: 'Chemistry', room: 'CH-101', isBreak: false },
                    { period: 4, subject: 'Lunch Break', room: '', isBreak: true },
                    { period: 5, subject: 'Programming in C', room: 'CS-102', isBreak: false },
                    { period: 6, subject: 'Break', room: '', isBreak: true },
                    { period: 7, subject: 'English', room: 'EN-101', isBreak: false },
                    { period: 8, subject: 'Lab', room: 'CS-Lab1', isBreak: false },
                ],
                tuesday: [
                    { period: 1, subject: 'Physics', room: 'PH-101', isBreak: false },
                    { period: 2, subject: 'Mathematics-I', room: 'CS-101', isBreak: false },
                    { period: 3, subject: 'Programming in C', room: 'CS-102', isBreak: false },
                    { period: 4, subject: 'Lunch Break', room: '', isBreak: true },
                    { period: 5, subject: 'Chemistry', room: 'CH-101', isBreak: false },
                    { period: 6, subject: 'Break', room: '', isBreak: true },
                    { period: 7, subject: 'Engineering Drawing', room: 'ED-101', isBreak: false },
                    { period: 8, subject: 'Workshop', room: 'WS-101', isBreak: false },
                ],
                wednesday: [
                    { period: 1, subject: 'Chemistry', room: 'CH-101', isBreak: false },
                    { period: 2, subject: 'Programming in C', room: 'CS-102', isBreak: false },
                    { period: 3, subject: 'Mathematics-I', room: 'CS-101', isBreak: false },
                    { period: 4, subject: 'Lunch Break', room: '', isBreak: true },
                    { period: 5, subject: 'Physics', room: 'PH-101', isBreak: false },
                    { period: 6, subject: 'Break', room: '', isBreak: true },
                    { period: 7, subject: 'English', room: 'EN-101', isBreak: false },
                    { period: 8, subject: 'Lab', room: 'CS-Lab2', isBreak: false },
                ],
                thursday: [
                    { period: 1, subject: 'Programming in C', room: 'CS-102', isBreak: false },
                    { period: 2, subject: 'Chemistry', room: 'CH-101', isBreak: false },
                    { period: 3, subject: 'Physics', room: 'PH-101', isBreak: false },
                    { period: 4, subject: 'Lunch Break', room: '', isBreak: true },
                    { period: 5, subject: 'Mathematics-I', room: 'CS-101', isBreak: false },
                    { period: 6, subject: 'Break', room: '', isBreak: true },
                    { period: 7, subject: 'Engineering Drawing', room: 'ED-101', isBreak: false },
                    { period: 8, subject: 'Workshop', room: 'WS-101', isBreak: false },
                ],
                friday: [
                    { period: 1, subject: 'English', room: 'EN-101', isBreak: false },
                    { period: 2, subject: 'Mathematics-I', room: 'CS-101', isBreak: false },
                    { period: 3, subject: 'Programming in C', room: 'CS-102', isBreak: false },
                    { period: 4, subject: 'Lunch Break', room: '', isBreak: true },
                    { period: 5, subject: 'Physics', room: 'PH-101', isBreak: false },
                    { period: 6, subject: 'Break', room: '', isBreak: true },
                    { period: 7, subject: 'Chemistry', room: 'CH-101', isBreak: false },
                    { period: 8, subject: 'Lab', room: 'CS-Lab1', isBreak: false },
                ],
            }
        },
    ];
}

module.exports = { generateTimetables };
