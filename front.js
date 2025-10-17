// ===================== TIMETABLE SETTINGS =====================

// Global timetable data
let timetableData = {};
let currentTimetable = {
    semester: '',
    branch: '',
    periods: [],
    timetable: {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: []
    }
};

// Initialize default timetable
function initializeDefaultTimetable() {
    // Create 8 default periods from 8:00 to 15:00 (45 min each)
    const defaultPeriods = [];
    for (let i = 0; i < 8; i++) {
        const startHour = 8 + Math.floor((i * 45) / 60);
        const startMinute = (i * 45) % 60;
        const endHour = 8 + Math.floor(((i + 1) * 45) / 60);
        const endMinute = ((i + 1) * 45) % 60;

        const startStr = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;
        const endStr = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;

        defaultPeriods.push({
            number: i + 1,
            startTime: startStr,
            endTime: endStr,
            editable: true
        });
    }

    const semesters = ['1','2','3','4','5','6','7','8'];
    const branches = ['CSE','ECE','ME','CE','EE','IT'];

    semesters.forEach(semester => {
        branches.forEach(branch => {
            const key = `${semester}_${branch}`;
            const periods = JSON.parse(JSON.stringify(defaultPeriods));
            const days = ['monday','tuesday','wednesday','thursday','friday','saturday'];
            const timetable = {};

            days.forEach(day => {
                timetable[day] = [];
                for (let i = 0; i < periods.length; i++) {
                    timetable[day].push({
                        period: i + 1,
                        subject: '',
                        room: '',
                        isBreak: false
                    });
                }
            });

            timetableData[key] = { semester, branch, periods, timetable };
        });
    });

    currentTimetable = timetableData['1_CSE'];
}

// Update period start/end time
function updatePeriodTime(inputElement) {
    const periodNum = parseInt(inputElement.getAttribute('data-period'));
    const timeType = inputElement.getAttribute('data-time-type');
    const newTime = inputElement.value;
    const periodIndex = currentTimetable.periods.findIndex(p => p.number === periodNum);

    if (periodIndex !== -1) {
        if (timeType === 'start') {
            const currentEndTime = currentTimetable.periods[periodIndex].endTime;
            if (newTime >= currentEndTime) {
                alert('Start time must be before end time');
                inputElement.value = currentTimetable.periods[periodIndex].startTime;
                return;
            }
            currentTimetable.periods[periodIndex].startTime = newTime;
        } else {
            const currentStartTime = currentTimetable.periods[periodIndex].startTime;
            if (newTime <= currentStartTime) {
                alert('End time must be after start time');
                inputElement.value = currentTimetable.periods[periodIndex].endTime;
                return;
            }
            currentTimetable.periods[periodIndex].endTime = newTime;
        }
    }
}

// Add new period dynamically
function addNewPeriod() {
    if (currentTimetable.periods.length === 0) {
        currentTimetable.periods.push({
            number: 1,
            startTime: '08:00',
            endTime: '08:45',
            editable: true
        });
    } else {
        const lastPeriod = currentTimetable.periods[currentTimetable.periods.length - 1];
        const [lastEndHour, lastEndMinute] = lastPeriod.endTime.split(':').map(Number);
        const newEndTotal = lastEndHour * 60 + lastEndMinute + 45;
        const newEndHour = Math.floor(newEndTotal / 60);
        const newEndMinute = newEndTotal % 60;
        const newEndTime = `${String(newEndHour).padStart(2, '0')}:${String(newEndMinute).padStart(2, '0')}`;

        const newPeriod = {
            number: currentTimetable.periods.length + 1,
            startTime: lastPeriod.endTime,
            endTime: newEndTime,
            editable: true
        };
        currentTimetable.periods.push(newPeriod);
    }

    const days = ['monday','tuesday','wednesday','thursday','friday','saturday'];
    days.forEach(day => {
        currentTimetable.timetable[day].push({
            period: currentTimetable.periods.length,
            subject: '',
            room: '',
            isBreak: false
        });
    });

    generateTimetable();
}

// Delete a period
function deletePeriod(periodNum) {
    if (currentTimetable.periods.length <= 1) {
        alert('You must have at least one period');
        return;
    }

    if (confirm(`Are you sure you want to delete Period ${periodNum}?`)) {
        const periodIndex = currentTimetable.periods.findIndex(p => p.number === periodNum);
        if (periodIndex !== -1) {
            currentTimetable.periods.splice(periodIndex, 1);
            currentTimetable.periods.forEach((period, i) => period.number = i + 1);

            const days = ['monday','tuesday','wednesday','thursday','friday','saturday'];
            days.forEach(day => {
                currentTimetable.timetable[day].splice(periodIndex, 1);
                currentTimetable.timetable[day].forEach((p, i) => p.period = i + 1);
            });
            generateTimetable();
        }
    }
}

// Apply break to same period across all days
function addBreakToAllDays() {
    const breakPeriod = prompt("Enter period number to set as break for all days:");
    if (breakPeriod && !isNaN(breakPeriod)) {
        const periodNum = parseInt(breakPeriod);
        if (periodNum > 0 && periodNum <= currentTimetable.periods.length) {
            const days = ['monday','tuesday','wednesday','thursday','friday','saturday'];
            days.forEach(day => {
                currentTimetable.timetable[day][periodNum - 1].isBreak = true;
                currentTimetable.timetable[day][periodNum - 1].subject = '';
                currentTimetable.timetable[day][periodNum - 1].room = '';
            });
            generateTimetable();
        } else alert('Invalid period number');
    }
}

// Save timetable to memory
function saveTimetable() {
    const key = `${currentTimetable.semester}_${currentTimetable.branch}`;
    timetableData[key] = currentTimetable;
    console.log('Timetable saved:', timetableData);
    alert('Timetable saved successfully!');
}

// Filter timetable by semester and branch
function filterTimetable() {
    const semester = document.getElementById('timetable-semester').value;
    const branch = document.getElementById('timetable-branch').value;

    if (!semester || !branch) {
        alert('Please select both semester and branch');
        document.getElementById('timetable-semester').value = currentTimetable.semester;
        document.getElementById('timetable-branch').value = currentTimetable.branch;
        return;
    }

    const key = `${semester}_${branch}`;
    if (timetableData[key]) {
        currentTimetable = timetableData[key];
    } else {
        const newPeriods = currentTimetable.periods.map(p => ({...p}));
        const days = ['monday','tuesday','wednesday','thursday','friday','saturday'];
        const newTimetable = {};
        days.forEach(day => {
            newTimetable[day] = currentTimetable.timetable[day].map(p => ({
                period: p.period, subject: '', room: '', isBreak: p.isBreak
            }));
        });
        currentTimetable = { semester, branch, periods: newPeriods, timetable: newTimetable };
        timetableData[key] = currentTimetable;
    }
    generateTimetable();
}
