
// Configuration
let SERVER_URL = 'http://localhost:3000';

// State
let students = [];
let teachers = [];
let classrooms = [];
let currentTimetable = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    checkServerConnection();
});

function initializeApp() {
    loadSettings();
    loadDashboardData();
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const section = e.currentTarget.dataset.section;
            switchSection(section);
        });
    });

    // Student Management
    document.getElementById('addStudentBtn').addEventListener('click', showAddStudentModal);
    document.getElementById('bulkStudentBtn').addEventListener('click', showBulkStudentModal);

    // Teacher Management
    document.getElementById('addTeacherBtn').addEventListener('click', showAddTeacherModal);
    document.getElementById('bulkTeacherBtn').addEventListener('click', showBulkTeacherModal);

    // Classroom Management
    document.getElementById('addClassroomBtn').addEventListener('click', showAddClassroomModal);
    document.getElementById('bulkClassroomBtn').addEventListener('click', showBulkClassroomModal);

    // Timetable
    document.getElementById('loadTimetableBtn').addEventListener('click', loadTimetable);
    document.getElementById('createTimetableBtn').addEventListener('click', createNewTimetable);

    // Settings
    document.getElementById('saveServerBtn').addEventListener('click', saveServerSettings);


    // Modal close
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target.id === 'modal') closeModal();
    });

    // Filters
    document.getElementById('studentSearch').addEventListener('input', filterStudents);
    document.getElementById('semesterFilter').addEventListener('change', filterStudents);
    document.getElementById('courseFilter').addEventListener('change', filterStudents);
    document.getElementById('teacherSearch').addEventListener('input', filterTeachers);
    document.getElementById('departmentFilter').addEventListener('change', filterTeachers);
}

// Navigation
function switchSection(sectionName) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));

    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    document.getElementById(`${sectionName}-section`).classList.add('active');

    // Load section data
    switch (sectionName) {
        case 'students': loadStudents(); break;
        case 'teachers': loadTeachers(); break;
        case 'classrooms': loadClassrooms(); break;
        case 'dashboard': loadDashboardData(); break;
    }
}

// Server Connection
async function checkServerConnection() {
    try {
        const response = await fetch(`${SERVER_URL}/api/health`);
        if (response.ok) {
            updateServerStatus(true);
        } else {
            updateServerStatus(false);
        }
    } catch (error) {
        updateServerStatus(false);
    }
    setTimeout(checkServerConnection, 5000);
}

function updateServerStatus(connected) {
    const indicator = document.getElementById('serverStatus');
    const text = document.getElementById('serverStatusText');
    if (connected) {
        indicator.classList.add('connected');
        text.textContent = 'Connected';
    } else {
        indicator.classList.remove('connected');
        text.textContent = 'Disconnected';
    }
}


// Dashboard
async function loadDashboardData() {
    try {
        const [studentsRes, teachersRes, attendanceRes] = await Promise.all([
            fetch(`${SERVER_URL}/api/students`),
            fetch(`${SERVER_URL}/api/teachers`),
            fetch(`${SERVER_URL}/api/attendance/records`)
        ]);

        const studentsData = await studentsRes.json();
        const teachersData = await teachersRes.json();
        const attendanceData = await attendanceRes.json();

        const students = studentsData.students || [];
        const teachers = teachersData.teachers || [];
        const records = attendanceData.records || [];

        // Basic stats
        document.getElementById('totalStudents').textContent = students.length;
        document.getElementById('totalTeachers').textContent = teachers.length;
        document.getElementById('totalTimetables').textContent = '12'; // 4 courses × 3 semesters
        document.getElementById('totalAttendance').textContent = records.length;

        // Course distribution
        const courseCounts = students.reduce((acc, s) => {
            acc[s.course] = (acc[s.course] || 0) + 1;
            return acc;
        }, {});

        document.getElementById('cseCount').textContent = courseCounts.CSE || 0;
        document.getElementById('eceCount').textContent = courseCounts.ECE || 0;
        document.getElementById('meCount').textContent = courseCounts.ME || 0;
        document.getElementById('civilCount').textContent = courseCounts.Civil || 0;

        // Semester distribution
        const semesterCounts = students.reduce((acc, s) => {
            acc[`sem${s.semester}`] = (acc[`sem${s.semester}`] || 0) + 1;
            return acc;
        }, {});

        document.getElementById('sem1Count').textContent = semesterCounts.sem1 || 0;
        document.getElementById('sem3Count').textContent = semesterCounts.sem3 || 0;
        document.getElementById('sem5Count').textContent = semesterCounts.sem5 || 0;

        // Attendance stats
        if (records.length > 0) {
            const presentCount = records.filter(r => r.status === 'present').length;
            const attendanceRate = ((presentCount / records.length) * 100).toFixed(1);
            document.getElementById('overallRate').textContent = `${attendanceRate}%`;

            // Today's attendance
            const today = new Date().toDateString();
            const todayRecords = records.filter(r => new Date(r.date).toDateString() === today);
            const todayPresent = todayRecords.filter(r => r.status === 'present').length;
            document.getElementById('presentToday').textContent = todayPresent;

            // Total days
            const uniqueDates = [...new Set(records.map(r => new Date(r.date).toDateString()))];
            document.getElementById('totalDays').textContent = uniqueDates.length;
        }

        // Load recent activity
        loadRecentActivity();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function loadRecentActivity() {
    const activityList = document.getElementById('activityList');
    activityList.innerHTML = `
        <div class="activity-item">
            <div>New student enrolled: John Doe</div>
            <div class="activity-time">2 minutes ago</div>
        </div>
        <div class="activity-item">
            <div>Timetable updated for CSE Semester 3</div>
            <div class="activity-time">15 minutes ago</div>
        </div>
        <div class="activity-item">
            <div>Teacher assigned: Dr. Smith</div>
            <div class="activity-time">1 hour ago</div>
        </div>
    `;
}

// Students Management
async function loadStudents() {
    try {
        const response = await fetch(`${SERVER_URL}/api/students`);
        const data = await response.json();
        students = data.students || [];
        renderStudents(students);
    } catch (error) {
        console.error('Error loading students:', error);
        showNotification('Failed to load students', 'error');
    }
}

function renderStudents(studentsToRender) {
    const tbody = document.getElementById('studentsTableBody');
    tbody.innerHTML = studentsToRender.map(student => {
        // Get photo URL
        let photoUrl = student.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=00d9ff&color=fff&size=128`;

        return `
        <tr>
            <td>${student.enrollmentNo}</td>
            <td>
                <div class="student-info">
                    <img src="${photoUrl}" alt="${student.name}" class="student-photo" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=00d9ff&color=fff&size=128'">
                    <a href="#" class="student-name-link" onclick="showStudentAttendance('${student.enrollmentNo}', '${student.name}'); return false;">
                        ${student.name}
                    </a>
                </div>
            </td>
            <td>${student.email}</td>
            <td>${student.course}</td>
            <td>${student.semester}</td>
            <td>${formatDate(student.dob)}</td>
            <td>
                <button class="action-btn edit" onclick="editStudent('${student._id}')">Edit</button>
                <button class="action-btn delete" onclick="deleteStudent('${student._id}')">Delete</button>
            </td>
        </tr>
    `}).join('');
}


function filterStudents() {
    const search = document.getElementById('studentSearch').value.toLowerCase();
    const semester = document.getElementById('semesterFilter').value;
    const course = document.getElementById('courseFilter').value;

    const filtered = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(search) ||
            student.enrollmentNo.toLowerCase().includes(search);
        const matchesSemester = !semester || student.semester === semester;
        const matchesCourse = !course || student.course === course;
        return matchesSearch && matchesSemester && matchesCourse;
    });

    renderStudents(filtered);
}

function showAddStudentModal() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>Add New Student</h2>
        <form id="studentForm">
            <div class="form-group">
                <label>Enrollment Number *</label>
                <input type="text" name="enrollmentNo" class="form-input" required>
            </div>
            <div class="form-group">
                <label>Full Name *</label>
                <input type="text" name="name" class="form-input" required>
            </div>
            <div class="form-group">
                <label>Email *</label>
                <input type="email" name="email" class="form-input" required>
            </div>
            <div class="form-group">
                <label>Password *</label>
                <input type="password" name="password" class="form-input" required>
            </div>
            <div class="form-group">
                <label>Course *</label>
                <select name="course" class="form-select" required>
                    <option value="">Select Course</option>
                    <option value="CSE">Computer Science</option>
                    <option value="ECE">Electronics</option>
                    <option value="ME">Mechanical</option>
                    <option value="CE">Civil</option>
                </select>
            </div>
            <div class="form-group">
                <label>Semester *</label>
                <select name="semester" class="form-select" required>
                    <option value="">Select Semester</option>
                    ${[1, 2, 3, 4, 5, 6, 7, 8].map(s => `<option value="${s}">${s}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Date of Birth *</label>
                <input type="date" name="dob" class="form-input" required>
            </div>
            <div class="form-group">
                <label>Phone Number</label>
                <input type="tel" name="phone" class="form-input">
            </div>
            <div class="form-group">
                <label>Profile Photo</label>
                <div class="photo-capture">
                    <div class="photo-preview" id="photoPreview">
                        <div class="photo-placeholder">📷 No photo</div>
                    </div>
                    <div class="photo-buttons">
                        <button type="button" class="btn btn-secondary" onclick="openCamera()">📸 Take Photo</button>
                        <button type="button" class="btn btn-secondary" onclick="uploadPhoto()">📁 Upload</button>
                        <button type="button" class="btn btn-danger" onclick="clearPhoto()" style="display:none;" id="clearPhotoBtn">🗑️ Clear</button>
                    </div>
                    <input type="file" id="photoUpload" accept="image/*" style="display:none;" onchange="handlePhotoUpload(event)">
                    <input type="hidden" name="photoData" id="photoData">
                </div>
            </div>
            <button type="submit" class="btn btn-primary">Add Student</button>
        </form>
        
        <!-- Camera Modal -->
        <div id="cameraModal" class="camera-modal" style="display:none;">
            <div class="camera-content">
                <video id="cameraVideo" autoplay playsinline></video>
                <canvas id="cameraCanvas" style="display:none;"></canvas>
                <div class="camera-controls">
                    <button type="button" class="btn btn-primary" onclick="capturePhoto()">📸 Capture</button>
                    <button type="button" class="btn btn-secondary" onclick="closeCamera()">❌ Cancel</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('studentForm').addEventListener('submit', handleAddStudent);
    openModal();
}


// Camera Functions
let cameraStream = null;

function openCamera() {
    const cameraModal = document.getElementById('cameraModal');
    const video = document.getElementById('cameraVideo');

    cameraModal.style.display = 'flex';

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
        .then(stream => {
            cameraStream = stream;
            video.srcObject = stream;
        })
        .catch(err => {
            showNotification('Camera access denied: ' + err.message, 'error');
            closeCamera();
        });
}

function closeCamera() {
    const cameraModal = document.getElementById('cameraModal');
    const video = document.getElementById('cameraVideo');

    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    video.srcObject = null;
    cameraModal.style.display = 'none';
}

function capturePhoto() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const photoData = canvas.toDataURL('image/jpeg', 0.8);
    displayPhoto(photoData);
    closeCamera();
}

function uploadPhoto() {
    document.getElementById('photoUpload').click();
}

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            displayPhoto(e.target.result);
        };
        reader.readAsDataURL(file);
    }
}

function displayPhoto(photoData) {
    const preview = document.getElementById('photoPreview');
    const photoDataInput = document.getElementById('photoData');
    const clearBtn = document.getElementById('clearPhotoBtn');

    preview.innerHTML = `<img src="${photoData}" alt="Profile Photo" class="captured-photo">`;
    photoDataInput.value = photoData;
    clearBtn.style.display = 'inline-block';
}

function clearPhoto() {
    const preview = document.getElementById('photoPreview');
    const photoDataInput = document.getElementById('photoData');
    const clearBtn = document.getElementById('clearPhotoBtn');

    preview.innerHTML = '<div class="photo-placeholder">📷 No photo</div>';
    photoDataInput.value = '';
    clearBtn.style.display = 'none';
}

async function handleAddStudent(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const studentData = Object.fromEntries(formData);

    // Upload photo to server if captured
    if (studentData.photoData) {
        try {
            const photoResponse = await fetch(`${SERVER_URL}/api/upload-photo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    photoData: studentData.photoData,
                    type: 'student',
                    id: studentData.enrollmentNo
                })
            });

            if (photoResponse.ok) {
                const photoResult = await photoResponse.json();
                studentData.photoUrl = `${SERVER_URL}${photoResult.photoUrl}`;
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
        }
        delete studentData.photoData;
    }

    try {
        const response = await fetch(`${SERVER_URL}/api/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
        });

        if (response.ok) {
            showNotification('Student added successfully', 'success');
            closeModal();
            loadStudents();
        } else {
            showNotification('Failed to add student', 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

function showBulkStudentModal() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>Bulk Import Students</h2>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">
            Upload a CSV file with columns: enrollmentNo, name, email, password, course, semester, dob, phone
        </p>
        <div class="form-group">
            <label>CSV File</label>
            <input type="file" id="csvFile" accept=".csv" class="form-input">
        </div>
        <div class="form-group">
            <label>Preview</label>
            <textarea id="csvPreview" class="form-textarea" readonly></textarea>
        </div>
        <button class="btn btn-primary" onclick="processBulkStudents()">Import Students</button>
    `;

    document.getElementById('csvFile').addEventListener('change', handleCSVUpload);
    openModal();
}

function handleCSVUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            document.getElementById('csvPreview').value = event.target.result;
        };
        reader.readAsText(file);
    }
}

async function processBulkStudents() {
    const csvData = document.getElementById('csvPreview').value;
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    const students = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map(v => v.trim());
        const student = {};
        headers.forEach((header, index) => {
            student[header] = values[index];
        });
        students.push(student);
    }

    try {
        const response = await fetch(`${SERVER_URL}/api/students/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ students })
        });

        if (response.ok) {
            showNotification(`${students.length} students imported successfully`, 'success');
            closeModal();
            loadStudents();
        } else {
            showNotification('Failed to import students', 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}


// Teachers Management
async function loadTeachers() {
    try {
        const response = await fetch(`${SERVER_URL}/api/teachers`);
        const data = await response.json();
        teachers = data.teachers || [];
        renderTeachers(teachers);
    } catch (error) {
        console.error('Error loading teachers:', error);
    }
}

function renderTeachers(teachersToRender) {
    const tbody = document.getElementById('teachersTableBody');
    tbody.innerHTML = teachersToRender.map(teacher => {
        // Check localStorage for photo first
        let photoUrl = teacher.photoUrl;
        if (photoUrl && photoUrl.startsWith('teacher_photo_')) {
            photoUrl = localStorage.getItem(photoUrl) || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name)}&background=7c3aed&color=fff&size=128`;
        } else if (!photoUrl) {
            photoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name)}&background=7c3aed&color=fff&size=128`;
        }

        return `
        <tr>
            <td>${teacher.employeeId}</td>
            <td>
                <div class="student-info">
                    <img src="${photoUrl}" alt="${teacher.name}" class="student-photo" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name)}&background=7c3aed&color=fff&size=128'">
                    ${teacher.name}
                </div>
            </td>
            <td>${teacher.email}</td>
            <td>${teacher.department}</td>
            <td>${teacher.subject || 'N/A'}</td>
            <td>${formatDate(teacher.dob)}</td>
            <td>
                <span class="access-toggle ${teacher.canEditTimetable ? 'enabled' : 'disabled'}" 
                      onclick="toggleTimetableAccess('${teacher._id}', ${!teacher.canEditTimetable})">
                    ${teacher.canEditTimetable ? 'Enabled' : 'Disabled'}
                </span>
            </td>
            <td>
                <button class="action-btn edit" onclick="editTeacher('${teacher._id}')">Edit</button>
                <button class="action-btn delete" onclick="deleteTeacher('${teacher._id}')">Delete</button>
            </td>
        </tr>
    `}).join('');
}

function filterTeachers() {
    const search = document.getElementById('teacherSearch').value.toLowerCase();
    const department = document.getElementById('departmentFilter').value;

    const filtered = teachers.filter(teacher => {
        const matchesSearch = teacher.name.toLowerCase().includes(search) ||
            teacher.employeeId.toLowerCase().includes(search);
        const matchesDepartment = !department || teacher.department === department;
        return matchesSearch && matchesDepartment;
    });

    renderTeachers(filtered);
}

function showAddTeacherModal() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>Add New Teacher</h2>
        <form id="teacherForm">
            <div class="form-group">
                <label>Employee ID *</label>
                <input type="text" name="employeeId" class="form-input" required>
            </div>
            <div class="form-group">
                <label>Full Name *</label>
                <input type="text" name="name" class="form-input" required>
            </div>
            <div class="form-group">
                <label>Email *</label>
                <input type="email" name="email" class="form-input" required>
            </div>
            <div class="form-group">
                <label>Password *</label>
                <input type="password" name="password" class="form-input" required>
            </div>
            <div class="form-group">
                <label>Department *</label>
                <select name="department" class="form-select" required>
                    <option value="">Select Department</option>
                    <option value="CSE">Computer Science</option>
                    <option value="ECE">Electronics</option>
                    <option value="ME">Mechanical</option>
                    <option value="CE">Civil</option>
                </select>
            </div>
            <div class="form-group">
                <label>Subject *</label>
                <input type="text" name="subject" class="form-input" placeholder="e.g., Data Structures" required>
            </div>
            <div class="form-group">
                <label>Semester</label>
                <input type="text" name="semester" class="form-input" placeholder="e.g., 3">
            </div>
            <div class="form-group">
                <label>Date of Birth *</label>
                <input type="date" name="dob" class="form-input" required>
            </div>
            <div class="form-group">
                <label>Phone Number</label>
                <input type="tel" name="phone" class="form-input">
            </div>
            <div class="form-group">
                <label>Profile Photo</label>
                <div class="photo-capture">
                    <div class="photo-preview" id="photoPreview">
                        <div class="photo-placeholder">📷 No photo</div>
                    </div>
                    <div class="photo-buttons">
                        <button type="button" class="btn btn-secondary" onclick="openCamera()">📸 Take Photo</button>
                        <button type="button" class="btn btn-secondary" onclick="uploadPhoto()">📁 Upload</button>
                        <button type="button" class="btn btn-danger" onclick="clearPhoto()" style="display:none;" id="clearPhotoBtn">🗑️ Clear</button>
                    </div>
                    <input type="file" id="photoUpload" accept="image/*" style="display:none;" onchange="handlePhotoUpload(event)">
                    <input type="hidden" name="photoData" id="photoData">
                </div>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" name="canEditTimetable"> Can Edit Timetable
                </label>
            </div>
            <button type="submit" class="btn btn-primary">Add Teacher</button>
        </form>
        
        <!-- Camera Modal -->
        <div id="cameraModal" class="camera-modal" style="display:none;">
            <div class="camera-content">
                <video id="cameraVideo" autoplay playsinline></video>
                <canvas id="cameraCanvas" style="display:none;"></canvas>
                <div class="camera-controls">
                    <button type="button" class="btn btn-primary" onclick="capturePhoto()">📸 Capture</button>
                    <button type="button" class="btn btn-secondary" onclick="closeCamera()">❌ Cancel</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('teacherForm').addEventListener('submit', handleAddTeacher);
    openModal();
}


async function handleAddTeacher(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const teacherData = Object.fromEntries(formData);
    teacherData.canEditTimetable = formData.has('canEditTimetable');

    // Upload photo to server if captured
    if (teacherData.photoData) {
        try {
            const photoResponse = await fetch(`${SERVER_URL}/api/upload-photo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    photoData: teacherData.photoData,
                    type: 'teacher',
                    id: teacherData.employeeId
                })
            });

            if (photoResponse.ok) {
                const photoResult = await photoResponse.json();
                teacherData.photoUrl = `${SERVER_URL}${photoResult.photoUrl}`;
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
        }
        delete teacherData.photoData;
    }

    try {
        const response = await fetch(`${SERVER_URL}/api/teachers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(teacherData)
        });

        if (response.ok) {
            showNotification('Teacher added successfully', 'success');
            closeModal();
            loadTeachers();
        } else {
            showNotification('Failed to add teacher', 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

function showBulkTeacherModal() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>Bulk Import Teachers</h2>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">
            Upload a CSV file with columns: employeeId, name, email, password, department, dob, phone, canEditTimetable
        </p>
        <div class="form-group">
            <label>CSV File</label>
            <input type="file" id="csvFile" accept=".csv" class="form-input">
        </div>
        <div class="form-group">
            <label>Preview</label>
            <textarea id="csvPreview" class="form-textarea" readonly></textarea>
        </div>
        <button class="btn btn-primary" onclick="processBulkTeachers()">Import Teachers</button>
    `;

    document.getElementById('csvFile').addEventListener('change', handleCSVUpload);
    openModal();
}

async function processBulkTeachers() {
    const csvData = document.getElementById('csvPreview').value;
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    const teachers = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map(v => v.trim());
        const teacher = {};
        headers.forEach((header, index) => {
            if (header === 'canEditTimetable') {
                teacher[header] = values[index].toLowerCase() === 'true';
            } else {
                teacher[header] = values[index];
            }
        });
        teachers.push(teacher);
    }

    try {
        const response = await fetch(`${SERVER_URL}/api/teachers/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teachers })
        });

        if (response.ok) {
            showNotification(`${teachers.length} teachers imported successfully`, 'success');
            closeModal();
            loadTeachers();
        } else {
            showNotification('Failed to import teachers', 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

async function toggleTimetableAccess(teacherId, canEdit) {
    try {
        const response = await fetch(`${SERVER_URL}/api/teachers/${teacherId}/timetable-access`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ canEditTimetable: canEdit })
        });

        if (response.ok) {
            showNotification('Timetable access updated', 'success');
            loadTeachers();
        } else {
            showNotification('Failed to update access', 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}


// Classrooms Management
async function loadClassrooms() {
    try {
        const response = await fetch(`${SERVER_URL}/api/classrooms`);
        const data = await response.json();
        classrooms = data.classrooms || [];
        renderClassrooms(classrooms);
    } catch (error) {
        console.error('Error loading classrooms:', error);
    }
}

function renderClassrooms(classroomsToRender) {
    const tbody = document.getElementById('classroomsTableBody');
    tbody.innerHTML = classroomsToRender.map((classroom, index) => `
        <tr>
            <td>${classroom.roomNumber}</td>
            <td>${classroom.building}</td>
            <td>${classroom.capacity}</td>
            <td><code class="bssid-code">${classroom.wifiBSSID || 'N/A'}</code></td>
            <td><span class="status-badge ${classroom.isActive ? 'status-active' : 'status-inactive'}">${classroom.isActive ? 'Active' : 'Inactive'}</span></td>
            <td>
                <button class="action-btn edit" onclick="editClassroom('${classroom._id}')">✏️ Edit</button>
                <button class="action-btn delete" onclick="deleteClassroom('${classroom._id}')">🗑️ Delete</button>
            </td>
        </tr>
    `).join('');
}

function showAddClassroomModal() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>Add New Classroom</h2>
        <form id="classroomForm">
            <div class="form-group">
                <label>Room Number *</label>
                <input type="text" name="roomNumber" class="form-input" required>
            </div>
            <div class="form-group">
                <label>Building *</label>
                <input type="text" name="building" class="form-input" required>
            </div>
            <div class="form-group">
                <label>Capacity *</label>
                <input type="number" name="capacity" class="form-input" required>
            </div>
            <div class="form-group">
                <label>WiFi BSSID</label>
                <input type="text" name="wifiBSSID" class="form-input" placeholder="XX:XX:XX:XX:XX:XX">
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" name="isActive" checked> Active
                </label>
            </div>
            <button type="submit" class="btn btn-primary">Add Classroom</button>
        </form>
    `;

    document.getElementById('classroomForm').addEventListener('submit', handleAddClassroom);
    openModal();
}

async function handleAddClassroom(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const classroomData = Object.fromEntries(formData);
    classroomData.isActive = formData.has('isActive');

    try {
        const response = await fetch(`${SERVER_URL}/api/classrooms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(classroomData)
        });

        if (response.ok) {
            showNotification('Classroom added successfully', 'success');
            closeModal();
            loadClassrooms();
        } else {
            showNotification('Failed to add classroom', 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

function showBulkClassroomModal() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>Bulk Import Classrooms</h2>
        <p>Upload a CSV file with columns: roomNumber, building, capacity, wifiBSSID</p>
        <form id="bulkClassroomForm">
            <div class="form-group">
                <label>CSV File *</label>
                <input type="file" name="file" accept=".csv" class="form-input" required>
            </div>
            <div class="button-group">
                <button type="button" class="btn btn-secondary" onclick="downloadClassroomTemplate()">📥 Download Template</button>
                <button type="submit" class="btn btn-primary">📤 Import Classrooms</button>
            </div>
        </form>
        <div class="csv-template">
            <h3>CSV Template Example:</h3>
            <pre>roomNumber,building,capacity,wifiBSSID
CS-101,CS,60,00:1A:2B:3C:4D:01
EC-101,EC,60,00:1A:2B:3C:5D:01
ME-101,ME,60,00:1A:2B:3C:6D:01</pre>
        </div>
    `;

    document.getElementById('bulkClassroomForm').addEventListener('submit', handleBulkClassroomImport);
    openModal();
}

function downloadClassroomTemplate() {
    const template = `roomNumber,building,capacity,wifiBSSID
CS-101,CS,60,00:1A:2B:3C:4D:01
EC-101,EC,60,00:1A:2B:3C:5D:01
ME-101,ME,60,00:1A:2B:3C:6D:01
CE-101,CE,60,00:1A:2B:3C:7D:01`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'classroom_template.csv';
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Template downloaded!', 'success');
}

async function handleBulkClassroomImport(e) {
    e.preventDefault();
    const fileInput = e.target.querySelector('input[type="file"]');
    const file = fileInput.files[0];

    if (!file) {
        showNotification('Please select a CSV file', 'warning');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function (event) {
        try {
            const csv = event.target.result;
            const lines = csv.split('\n').filter(line => line.trim());

            if (lines.length < 2) {
                showNotification('CSV file is empty or invalid', 'error');
                return;
            }

            // Parse CSV
            const headers = lines[0].split(',').map(h => h.trim());
            const classroomsToImport = [];

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                if (values.length >= 3) {
                    const classroom = {
                        roomNumber: values[0],
                        building: values[1],
                        capacity: parseInt(values[2]),
                        wifiBSSID: values[3] || '',
                        isActive: true
                    };
                    classroomsToImport.push(classroom);
                }
            }

            if (classroomsToImport.length === 0) {
                showNotification('No valid classroom data found in CSV', 'error');
                return;
            }

            // Save to database
            let successCount = 0;
            for (const classroom of classroomsToImport) {
                try {
                    const response = await fetch(`${SERVER_URL}/api/classrooms`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(classroom)
                    });
                    if (response.ok) successCount++;
                } catch (err) {
                    console.error('Error saving classroom:', err);
                }
            }

            showNotification(`Successfully imported ${successCount} classrooms!`, 'success');
            closeModal();
            loadClassrooms();

        } catch (error) {
            showNotification('Error parsing CSV file: ' + error.message, 'error');
        }
    };

    reader.onerror = function () {
        showNotification('Error reading file', 'error');
    };

    reader.readAsText(file);
}


// Timetable Management
async function loadTimetable() {
    const semester = document.getElementById('timetableSemester').value;
    const course = document.getElementById('timetableCourse').value;

    if (!semester || !course) {
        showNotification('Please select semester and course', 'warning');
        return;
    }

    try {
        const response = await fetch(`${SERVER_URL}/api/timetable/${semester}/${course}`);
        const data = await response.json();

        if (data.success) {
            currentTimetable = data.timetable;
            renderTimetableEditor(currentTimetable);
        } else {
            showNotification('No timetable found. Create a new one.', 'info');
        }
    } catch (error) {
        showNotification('Error loading timetable', 'error');
    }
}

function createNewTimetable() {
    const semester = document.getElementById('timetableSemester').value;
    const course = document.getElementById('timetableCourse').value;

    if (!semester || !course) {
        showNotification('Please select semester and course', 'warning');
        return;
    }

    // Create default timetable structure with actual college timings
    const periods = [
        { number: 1, startTime: '09:40', endTime: '10:40' },
        { number: 2, startTime: '10:40', endTime: '11:40' },
        { number: 3, startTime: '11:40', endTime: '12:10' },
        { number: 4, startTime: '12:10', endTime: '13:10' }, // Lunch
        { number: 5, startTime: '13:10', endTime: '14:10' },
        { number: 6, startTime: '14:10', endTime: '14:20' }, // Break
        { number: 7, startTime: '14:20', endTime: '15:30' },
        { number: 8, startTime: '15:30', endTime: '16:10' }
    ];

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const timetable = {};
    days.forEach(day => {
        timetable[day] = periods.map(p => ({
            period: p.number,
            subject: p.number === 4 ? 'Lunch Break' : p.number === 6 ? 'Break' : '',
            room: '',
            isBreak: p.number === 4 || p.number === 6
        }));
    });

    currentTimetable = { semester, branch: course, periods, timetable };
    renderTimetableEditor(currentTimetable);
}

function renderTimetableEditor(timetable) {
    const editor = document.getElementById('timetableEditor');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

    let html = '<div class="timetable-info">';
    html += `<p><strong>Course:</strong> ${timetable.branch} | <strong>Semester:</strong> ${timetable.semester}</p>`;
    html += `<p><strong>Schedule:</strong> Monday to Friday | <strong>Periods:</strong> 8 (including breaks)</p>`;
    html += '</div>';

    html += '<div class="timetable-grid">';

    // Header row
    html += '<div class="timetable-cell header">Day/Period</div>';
    timetable.periods.forEach(period => {
        const isBreak = period.number === 4 || period.number === 6;
        html += `<div class="timetable-cell header ${isBreak ? 'break-header' : ''}">
            ${isBreak ? (period.number === 4 ? '🍽️' : '☕') : `P${period.number}`}<br>
            <small>${period.startTime}-${period.endTime}</small>
        </div>`;
    });

    // Data rows
    days.forEach((day, dayIdx) => {
        html += `<div class="timetable-cell header">${day}</div>`;
        const daySchedule = timetable.timetable[dayKeys[dayIdx]] || [];
        daySchedule.forEach((period, periodIdx) => {
            const isBreak = period.isBreak || period.subject.includes('Break');
            html += `<div class="timetable-cell ${isBreak ? 'break-cell' : 'editable'}" ${!isBreak ? `onclick="editTimetableCell(${dayIdx}, ${periodIdx})"` : ''}>
                ${isBreak ? `<div class="break-label">${period.subject}</div>` : `
                    <div class="subject-name">${period.subject || '-'}</div>
                    ${period.room ? `<div class="room-name">${period.room}</div>` : ''}
                `}
            </div>`;
        });
    });

    html += '</div>';
    html += '<div class="timetable-actions">';
    html += '<button class="btn btn-primary" onclick="saveTimetable()">💾 Save Timetable</button>';
    html += '<button class="btn btn-secondary" onclick="exportTimetable()">📥 Export</button>';
    html += '</div>';

    editor.innerHTML = html;
}


function editTimetableCell(dayIdx, periodIdx) {
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const period = currentTimetable.timetable[dayKeys[dayIdx]][periodIdx];

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>Edit Period</h2>
        <form id="periodForm">
            <div class="form-group">
                <label>Subject</label>
                <input type="text" name="subject" class="form-input" value="${period.subject || ''}">
            </div>
            <div class="form-group">
                <label>Room</label>
                <input type="text" name="room" class="form-input" value="${period.room || ''}">
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" name="isBreak" ${period.isBreak ? 'checked' : ''}> Is Break
                </label>
            </div>
            <button type="submit" class="btn btn-primary">Save</button>
        </form>
    `;

    document.getElementById('periodForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        period.subject = formData.get('subject');
        period.room = formData.get('room');
        period.isBreak = formData.has('isBreak');

        closeModal();
        renderTimetableEditor(currentTimetable);
    });

    openModal();
}

async function saveTimetable() {
    try {
        const response = await fetch(`${SERVER_URL}/api/timetable`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentTimetable)
        });

        if (response.ok) {
            showNotification('Timetable saved successfully', 'success');
        } else {
            showNotification('Failed to save timetable', 'error');
        }
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    }
}

function exportTimetable() {
    if (!currentTimetable) {
        showNotification('No timetable to export', 'warning');
        return;
    }

    const dataStr = JSON.stringify(currentTimetable, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `timetable_${currentTimetable.branch}_sem${currentTimetable.semester}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Timetable exported successfully', 'success');
}

// Utility Functions
function openModal() {
    document.getElementById('modal').classList.add('active');
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

function showNotification(message, type = 'info') {
    // Simple notification - you can enhance this
    alert(message);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function loadSettings() {
    const savedUrl = localStorage.getItem('serverUrl');
    if (savedUrl) {
        SERVER_URL = savedUrl;
        document.getElementById('serverUrl').value = savedUrl;
    }
}

function saveServerSettings() {
    const url = document.getElementById('serverUrl').value;
    SERVER_URL = url;
    localStorage.setItem('serverUrl', url);
    showNotification('Settings saved', 'success');
    checkServerConnection();
}

// Delete functions
async function deleteStudent(id) {
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
        const response = await fetch(`${SERVER_URL}/api/students/${id}`, { method: 'DELETE' });
        if (response.ok) {
            showNotification('Student deleted', 'success');
            loadStudents();
        }
    } catch (error) {
        showNotification('Error deleting student', 'error');
    }
}

async function deleteTeacher(id) {
    if (!confirm('Are you sure you want to delete this teacher?')) return;

    try {
        const response = await fetch(`${SERVER_URL}/api/teachers/${id}`, { method: 'DELETE' });
        if (response.ok) {
            showNotification('Teacher deleted', 'success');
            loadTeachers();
        }
    } catch (error) {
        showNotification('Error deleting teacher', 'error');
    }
}

async function deleteClassroom(id) {
    const classroom = classrooms.find(c => c._id === id);
    if (!confirm(`Are you sure you want to delete classroom ${classroom?.roomNumber || 'this'}?`)) return;

    try {
        const response = await fetch(`${SERVER_URL}/api/classrooms/${id}`, { method: 'DELETE' });
        if (response.ok) {
            showNotification('Classroom deleted', 'success');
            loadClassrooms();
        }
    } catch (error) {
        showNotification('Error deleting classroom', 'error');
    }
}

// Edit functions
async function editStudent(id) {
    const student = students.find(s => s._id === id);
    if (!student) return;

    // Get current photo
    let currentPhotoUrl = student.photoUrl;
    if (currentPhotoUrl && currentPhotoUrl.startsWith('student_photo_')) {
        currentPhotoUrl = localStorage.getItem(currentPhotoUrl);
    }
    if (!currentPhotoUrl) {
        currentPhotoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=00d9ff&color=fff&size=128`;
    }

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>Edit Student</h2>
        <form id="editStudentForm">
            <div class="form-group">
                <label>Enrollment Number *</label>
                <input type="text" name="enrollmentNo" class="form-input" value="${student.enrollmentNo}" required>
            </div>
            <div class="form-group">
                <label>Full Name *</label>
                <input type="text" name="name" class="form-input" value="${student.name}" required>
            </div>
            <div class="form-group">
                <label>Email *</label>
                <input type="email" name="email" class="form-input" value="${student.email}" required>
            </div>
            <div class="form-group">
                <label>Password (leave blank to keep current)</label>
                <input type="password" name="password" class="form-input" placeholder="Enter new password">
            </div>
            <div class="form-group">
                <label>Course *</label>
                <select name="course" class="form-select" required>
                    <option value="CSE" ${student.course === 'CSE' ? 'selected' : ''}>Computer Science</option>
                    <option value="ECE" ${student.course === 'ECE' ? 'selected' : ''}>Electronics</option>
                    <option value="ME" ${student.course === 'ME' ? 'selected' : ''}>Mechanical</option>
                    <option value="CE" ${student.course === 'CE' ? 'selected' : ''}>Civil</option>
                </select>
            </div>
            <div class="form-group">
                <label>Semester *</label>
                <select name="semester" class="form-select" required>
                    ${[1, 2, 3, 4, 5, 6, 7, 8].map(s => `<option value="${s}" ${student.semester == s ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Date of Birth *</label>
                <input type="date" name="dob" class="form-input" value="${student.dob ? student.dob.split('T')[0] : ''}" required>
            </div>
            <div class="form-group">
                <label>Phone Number</label>
                <input type="tel" name="phone" class="form-input" value="${student.phone || ''}">
            </div>
            <div class="form-group">
                <label>Profile Photo</label>
                <div class="photo-capture">
                    <div class="photo-preview" id="photoPreview">
                        <img src="${currentPhotoUrl}" alt="Current Photo" class="captured-photo">
                    </div>
                    <div class="photo-buttons">
                        <button type="button" class="btn btn-secondary" onclick="openCamera()">📸 Take Photo</button>
                        <button type="button" class="btn btn-secondary" onclick="uploadPhoto()">📁 Upload</button>
                        <button type="button" class="btn btn-danger" onclick="clearPhoto()" id="clearPhotoBtn">🗑️ Clear</button>
                    </div>
                    <input type="file" id="photoUpload" accept="image/*" style="display:none;" onchange="handlePhotoUpload(event)">
                    <input type="hidden" name="photoData" id="photoData">
                </div>
            </div>
            <button type="submit" class="btn btn-primary">Update Student</button>
        </form>
        
        <!-- Camera Modal -->
        <div id="cameraModal" class="camera-modal" style="display:none;">
            <div class="camera-content">
                <video id="cameraVideo" autoplay playsinline></video>
                <canvas id="cameraCanvas" style="display:none;"></canvas>
                <div class="camera-controls">
                    <button type="button" class="btn btn-primary" onclick="capturePhoto()">📸 Capture</button>
                    <button type="button" class="btn btn-secondary" onclick="closeCamera()">❌ Cancel</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('editStudentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const studentData = Object.fromEntries(formData);

        // Remove password if empty
        if (!studentData.password) {
            delete studentData.password;
        }

        // Upload photo to server if changed
        if (studentData.photoData) {
            try {
                const photoResponse = await fetch(`${SERVER_URL}/api/upload-photo`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        photoData: studentData.photoData,
                        type: 'student',
                        id: studentData.enrollmentNo
                    })
                });

                if (photoResponse.ok) {
                    const photoResult = await photoResponse.json();
                    studentData.photoUrl = `${SERVER_URL}${photoResult.photoUrl}`;
                }
            } catch (error) {
                console.error('Error uploading photo:', error);
            }
            delete studentData.photoData;
        }

        try {
            const response = await fetch(`${SERVER_URL}/api/students/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(studentData)
            });

            if (response.ok) {
                showNotification('Student updated successfully', 'success');
                closeModal();
                loadStudents();
            } else {
                showNotification('Failed to update student', 'error');
            }
        } catch (error) {
            showNotification('Error: ' + error.message, 'error');
        }
    });

    openModal();
}

async function editTeacher(id) {
    const teacher = teachers.find(t => t._id === id);
    if (!teacher) return;

    // Get current photo
    let currentPhotoUrl = teacher.photoUrl;
    if (currentPhotoUrl && currentPhotoUrl.startsWith('teacher_photo_')) {
        currentPhotoUrl = localStorage.getItem(currentPhotoUrl);
    }
    if (!currentPhotoUrl) {
        currentPhotoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name)}&background=7c3aed&color=fff&size=128`;
    }

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>Edit Teacher</h2>
        <form id="editTeacherForm">
            <div class="form-group">
                <label>Employee ID *</label>
                <input type="text" name="employeeId" class="form-input" value="${teacher.employeeId}" required>
            </div>
            <div class="form-group">
                <label>Full Name *</label>
                <input type="text" name="name" class="form-input" value="${teacher.name}" required>
            </div>
            <div class="form-group">
                <label>Email *</label>
                <input type="email" name="email" class="form-input" value="${teacher.email}" required>
            </div>
            <div class="form-group">
                <label>Password (leave blank to keep current)</label>
                <input type="password" name="password" class="form-input" placeholder="Enter new password">
            </div>
            <div class="form-group">
                <label>Department *</label>
                <select name="department" class="form-select" required>
                    <option value="CSE" ${teacher.department === 'CSE' ? 'selected' : ''}>Computer Science</option>
                    <option value="ECE" ${teacher.department === 'ECE' ? 'selected' : ''}>Electronics</option>
                    <option value="ME" ${teacher.department === 'ME' ? 'selected' : ''}>Mechanical</option>
                    <option value="CE" ${teacher.department === 'CE' ? 'selected' : ''}>Civil</option>
                </select>
            </div>
            <div class="form-group">
                <label>Subject *</label>
                <input type="text" name="subject" class="form-input" value="${teacher.subject || ''}" required>
            </div>
            <div class="form-group">
                <label>Semester</label>
                <input type="text" name="semester" class="form-input" value="${teacher.semester || ''}">
            </div>
            <div class="form-group">
                <label>Date of Birth *</label>
                <input type="date" name="dob" class="form-input" value="${teacher.dob ? teacher.dob.split('T')[0] : ''}" required>
            </div>
            <div class="form-group">
                <label>Phone Number</label>
                <input type="tel" name="phone" class="form-input" value="${teacher.phone || ''}">
            </div>
            <div class="form-group">
                <label>Profile Photo</label>
                <div class="photo-capture">
                    <div class="photo-preview" id="photoPreview">
                        <img src="${currentPhotoUrl}" alt="Current Photo" class="captured-photo">
                    </div>
                    <div class="photo-buttons">
                        <button type="button" class="btn btn-secondary" onclick="openCamera()">📸 Take Photo</button>
                        <button type="button" class="btn btn-secondary" onclick="uploadPhoto()">📁 Upload</button>
                        <button type="button" class="btn btn-danger" onclick="clearPhoto()" id="clearPhotoBtn">🗑️ Clear</button>
                    </div>
                    <input type="file" id="photoUpload" accept="image/*" style="display:none;" onchange="handlePhotoUpload(event)">
                    <input type="hidden" name="photoData" id="photoData">
                </div>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" name="canEditTimetable" ${teacher.canEditTimetable ? 'checked' : ''}> Can Edit Timetable
                </label>
            </div>
            <button type="submit" class="btn btn-primary">Update Teacher</button>
        </form>
        
        <!-- Camera Modal -->
        <div id="cameraModal" class="camera-modal" style="display:none;">
            <div class="camera-content">
                <video id="cameraVideo" autoplay playsinline></video>
                <canvas id="cameraCanvas" style="display:none;"></canvas>
                <div class="camera-controls">
                    <button type="button" class="btn btn-primary" onclick="capturePhoto()">📸 Capture</button>
                    <button type="button" class="btn btn-secondary" onclick="closeCamera()">❌ Cancel</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('editTeacherForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const teacherData = Object.fromEntries(formData);
        teacherData.canEditTimetable = formData.has('canEditTimetable');

        // Remove password if empty
        if (!teacherData.password) {
            delete teacherData.password;
        }

        // Upload photo to server if changed
        if (teacherData.photoData) {
            try {
                const photoResponse = await fetch(`${SERVER_URL}/api/upload-photo`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        photoData: teacherData.photoData,
                        type: 'teacher',
                        id: teacherData.employeeId
                    })
                });

                if (photoResponse.ok) {
                    const photoResult = await photoResponse.json();
                    teacherData.photoUrl = `${SERVER_URL}${photoResult.photoUrl}`;
                }
            } catch (error) {
                console.error('Error uploading photo:', error);
            }
            delete teacherData.photoData;
        }

        try {
            const response = await fetch(`${SERVER_URL}/api/teachers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(teacherData)
            });

            if (response.ok) {
                showNotification('Teacher updated successfully', 'success');
                closeModal();
                loadTeachers();
            } else {
                showNotification('Failed to update teacher', 'error');
            }
        } catch (error) {
            showNotification('Error: ' + error.message, 'error');
        }
    });

    openModal();
}

async function editClassroom(id) {
    const classroom = classrooms.find(c => c._id === id);
    if (!classroom) {
        showNotification('Classroom not found', 'error');
        return;
    }

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>Edit Classroom</h2>
        <form id="editClassroomForm">
            <div class="form-group">
                <label>Room Number *</label>
                <input type="text" name="roomNumber" class="form-input" value="${classroom.roomNumber}" required>
            </div>
            <div class="form-group">
                <label>Building *</label>
                <input type="text" name="building" class="form-input" value="${classroom.building}" required>
            </div>
            <div class="form-group">
                <label>Capacity *</label>
                <input type="number" name="capacity" class="form-input" value="${classroom.capacity}" required>
            </div>
            <div class="form-group">
                <label>WiFi BSSID</label>
                <input type="text" name="wifiBSSID" class="form-input" value="${classroom.wifiBSSID || ''}" placeholder="XX:XX:XX:XX:XX:XX">
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" name="isActive" ${classroom.isActive ? 'checked' : ''}> Active
                </label>
            </div>
            <button type="submit" class="btn btn-primary">Update Classroom</button>
        </form>
    `;

    document.getElementById('editClassroomForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const classroomData = Object.fromEntries(formData);
        classroomData.isActive = formData.has('isActive');

        try {
            const response = await fetch(`${SERVER_URL}/api/classrooms/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(classroomData)
            });

            if (response.ok) {
                showNotification('Classroom updated successfully', 'success');
                closeModal();
                loadClassrooms();
            } else {
                showNotification('Failed to update classroom', 'error');
            }
        } catch (error) {
            showNotification('Error: ' + error.message, 'error');
        }
    });

    openModal();
}


// ==================== ADVANCED FEATURES ====================

// Export to CSV
function exportStudentsToCSV() {
    const headers = ['enrollmentNo', 'name', 'email', 'course', 'semester', 'dob', 'phone'];
    const csvContent = [
        headers.join(','),
        ...students.map(s => headers.map(h => s[h] || '').join(','))
    ].join('\n');

    downloadCSV(csvContent, 'students_export.csv');
    showNotification('Students exported successfully', 'success');
}

function exportTeachersToCSV() {
    const headers = ['employeeId', 'name', 'email', 'department', 'dob', 'phone', 'canEditTimetable'];
    const csvContent = [
        headers.join(','),
        ...teachers.map(t => headers.map(h => t[h] || '').join(','))
    ].join('\n');

    downloadCSV(csvContent, 'teachers_export.csv');
    showNotification('Teachers exported successfully', 'success');
}

function exportClassroomsToCSV() {
    const headers = ['roomNumber', 'building', 'capacity', 'wifiBSSID', 'isActive'];
    const csvContent = [
        headers.join(','),
        ...classrooms.map(c => headers.map(h => c[h] || '').join(','))
    ].join('\n');

    downloadCSV(csvContent, 'classrooms_export.csv');
    showNotification('Classrooms exported successfully', 'success');
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Better Notifications
let notificationTimeout;
function showNotification(message, type = 'info') {
    // Clear existing notification
    const existing = document.getElementById('notification');
    if (existing) existing.remove();

    // Create notification
    const notification = document.createElement('div');
    notification.id = 'notification';
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-icon">${getNotificationIcon(type)}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="closeNotification()">✕</button>
    `;

    document.body.appendChild(notification);

    // Auto-hide after 5 seconds
    clearTimeout(notificationTimeout);
    notificationTimeout = setTimeout(() => {
        closeNotification();
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    return icons[type] || icons.info;
}

function closeNotification() {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.classList.add('notification-hide');
        setTimeout(() => notification.remove(), 300);
    }
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+S or Cmd+S - Save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const activeSection = document.querySelector('.section.active');
        if (activeSection.id === 'timetable-section' && currentTimetable) {
            saveTimetable();
        }
    }

    // Escape - Close modal
    if (e.key === 'Escape') {
        closeModal();
        closeNotification();
    }

    // Ctrl+F or Cmd+F - Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('globalSearch').focus();
    }
});

// Global Search
document.getElementById('globalSearch').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    if (!query) return;

    // Search in current section
    const activeSection = document.querySelector('.section.active');
    if (activeSection.id === 'students-section') {
        document.getElementById('studentSearch').value = query;
        filterStudents();
    } else if (activeSection.id === 'teachers-section') {
        document.getElementById('teacherSearch').value = query;
        filterTeachers();
    }
});

// Add export buttons to sections
function addExportButtons() {
    // Students section
    const studentsActions = document.querySelector('#students-section .action-buttons');
    if (studentsActions && !document.getElementById('exportStudentsBtn')) {
        const exportBtn = document.createElement('button');
        exportBtn.id = 'exportStudentsBtn';
        exportBtn.className = 'btn btn-secondary';
        exportBtn.innerHTML = '📥 Export CSV';
        exportBtn.onclick = exportStudentsToCSV;
        studentsActions.insertBefore(exportBtn, studentsActions.firstChild);
    }

    // Teachers section
    const teachersActions = document.querySelector('#teachers-section .action-buttons');
    if (teachersActions && !document.getElementById('exportTeachersBtn')) {
        const exportBtn = document.createElement('button');
        exportBtn.id = 'exportTeachersBtn';
        exportBtn.className = 'btn btn-secondary';
        exportBtn.innerHTML = '📥 Export CSV';
        exportBtn.onclick = exportTeachersToCSV;
        teachersActions.insertBefore(exportBtn, teachersActions.firstChild);
    }

    // Classrooms section
    const classroomsActions = document.querySelector('#classrooms-section .action-buttons');
    if (classroomsActions && !document.getElementById('exportClassroomsBtn')) {
        const exportBtn = document.createElement('button');
        exportBtn.id = 'exportClassroomsBtn';
        exportBtn.className = 'btn btn-secondary';
        exportBtn.innerHTML = '📥 Export CSV';
        exportBtn.onclick = exportClassroomsToCSV;
        classroomsActions.insertBefore(exportBtn, classroomsActions.firstChild);
    }
}

// Initialize export buttons after DOM is ready
setTimeout(addExportButtons, 100);

// Confirmation Dialog
function confirmAction(message, onConfirm) {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>Confirm Action</h2>
        <p style="margin: 20px 0; font-size: 16px;">${message}</p>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            <button class="btn btn-danger" id="confirmBtn">Confirm</button>
        </div>
    `;

    document.getElementById('confirmBtn').onclick = () => {
        closeModal();
        onConfirm();
    };

    openModal();
}

// Update delete functions to use confirmation dialog
const originalDeleteStudent = deleteStudent;
deleteStudent = function (id) {
    const student = students.find(s => s._id === id);
    confirmAction(
        `Are you sure you want to delete student "${student?.name}"? This action cannot be undone.`,
        () => originalDeleteStudent(id)
    );
};

const originalDeleteTeacher = deleteTeacher;
deleteTeacher = function (id) {
    const teacher = teachers.find(t => t._id === id);
    confirmAction(
        `Are you sure you want to delete teacher "${teacher?.name}"? This action cannot be undone.`,
        () => originalDeleteTeacher(id)
    );
};

const originalDeleteClassroom = deleteClassroom;
deleteClassroom = function (id) {
    const classroom = classrooms.find(c => c._id === id);
    confirmAction(
        `Are you sure you want to delete classroom "${classroom?.roomNumber}"? This action cannot be undone.`,
        () => originalDeleteClassroom(id)
    );
};

// Print Timetable
function printTimetable() {
    if (!currentTimetable) {
        showNotification('No timetable loaded', 'warning');
        return;
    }

    const printWindow = window.open('', '_blank');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    let html = `
        <html>
        <head>
            <title>Timetable - ${currentTimetable.branch} Semester ${currentTimetable.semester}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #000; padding: 10px; text-align: center; }
                th { background: #f0f0f0; }
                .break { background: #ffe0b2; }
                @media print { button { display: none; } }
            </style>
        </head>
        <body>
            <h1>Timetable - ${currentTimetable.branch} Semester ${currentTimetable.semester}</h1>
            <button onclick="window.print()">Print</button>
            <table>
                <thead>
                    <tr>
                        <th>Day/Period</th>
                        ${currentTimetable.periods.map(p => `<th>P${p.number}<br>${p.startTime}-${p.endTime}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${days.map((day, dayIdx) => `
                        <tr>
                            <th>${day}</th>
                            ${currentTimetable.timetable[dayKeys[dayIdx]].map(period => `
                                <td class="${period.isBreak ? 'break' : ''}">
                                    ${period.isBreak ? 'Break' : `${period.subject || '-'}<br><small>${period.room || ''}</small>`}
                                </td>
                            `).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
}

// Add print button to timetable section
function addPrintButton() {
    const timetableActions = document.querySelector('#timetable-section .action-buttons');
    if (timetableActions && !document.getElementById('printTimetableBtn')) {
        const printBtn = document.createElement('button');
        printBtn.id = 'printTimetableBtn';
        printBtn.className = 'btn btn-secondary';
        printBtn.innerHTML = '🖨️ Print';
        printBtn.onclick = printTimetable;
        timetableActions.appendChild(printBtn);
    }
}

setTimeout(addPrintButton, 100);

console.log('✅ All features loaded successfully!');


// Student Attendance Report
async function showStudentAttendance(studentId, studentName) {
    const modal = document.getElementById('attendanceModal');
    const modalBody = document.getElementById('attendanceModalBody');

    modalBody.innerHTML = '<div class="loading">Loading attendance data...</div>';
    modal.classList.add('active');

    try {
        // Fetch student details
        const studentRes = await fetch(`${SERVER_URL}/api/student-management?enrollmentNo=${studentId}`);
        const studentData = await studentRes.json();
        const student = studentData.student;

        // Fetch attendance records
        const attendanceRes = await fetch(`${SERVER_URL}/api/attendance/records?studentId=${studentId}`);
        const attendanceData = await attendanceRes.json();
        const records = attendanceData.records || [];

        // Calculate statistics
        const totalDays = records.length;
        const presentDays = records.filter(r => r.status === 'present');
        const absentDays = records.filter(r => r.status === 'absent');
        const attendanceRate = totalDays > 0 ? ((presentDays.length / totalDays) * 100).toFixed(2) : 0;

        // Calculate lectures attended
        const totalLectures = presentDays.reduce((sum, r) => sum + (r.lecturesAttended || 0), 0);
        const avgLectures = presentDays.length > 0 ? (totalLectures / presentDays.length).toFixed(2) : 0;

        // Get date range
        const dates = records.map(r => new Date(r.date)).sort((a, b) => a - b);
        const startDate = dates[0] ? dates[0].toLocaleDateString() : 'N/A';
        const endDate = dates[dates.length - 1] ? dates[dates.length - 1].toLocaleDateString() : 'N/A';

        // Render report
        let html = `
            <div class="attendance-report">
                <div class="report-header">
                    <h2>📊 Attendance Report</h2>
                    <button class="btn btn-secondary" onclick="exportAttendanceReport('${studentId}')">📥 Export</button>
                </div>
                
                <div class="student-info-card">
                    <h3>${studentName}</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Enrollment No:</span>
                            <span class="info-value">${studentId}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Course:</span>
                            <span class="info-value">${student?.course || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Semester:</span>
                            <span class="info-value">${student?.semester || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Email:</span>
                            <span class="info-value">${student?.email || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="stats-row">
                    <div class="stat-box stat-total">
                        <div class="stat-number">${totalDays}</div>
                        <div class="stat-label">Total Days</div>
                    </div>
                    <div class="stat-box stat-present">
                        <div class="stat-number">${presentDays.length}</div>
                        <div class="stat-label">Present</div>
                    </div>
                    <div class="stat-box stat-absent">
                        <div class="stat-number">${absentDays.length}</div>
                        <div class="stat-label">Absent</div>
                    </div>
                    <div class="stat-box stat-rate">
                        <div class="stat-number">${attendanceRate}%</div>
                        <div class="stat-label">Attendance Rate</div>
                    </div>
                </div>
                
                <div class="stats-row">
                    <div class="stat-box">
                        <div class="stat-number">${totalLectures}</div>
                        <div class="stat-label">Total Lectures Attended</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number">${avgLectures}/8</div>
                        <div class="stat-label">Avg Lectures Per Day</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number">${startDate}</div>
                        <div class="stat-label">Start Date</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number">${endDate}</div>
                        <div class="stat-label">End Date</div>
                    </div>
                </div>
                
                <div class="attendance-table-container">
                    <h3>Detailed Records</h3>
                    <table class="attendance-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Day</th>
                                <th>Status</th>
                                <th>Check In</th>
                                <th>Check Out</th>
                                <th>Lectures</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${records.sort((a, b) => new Date(b.date) - new Date(a.date)).map(record => {
            const date = new Date(record.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dateStr = date.toLocaleDateString();
            const checkIn = record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-';
            const checkOut = record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-';
            const lectures = record.lecturesAttended ? `${record.lecturesAttended}/8` : '-';
            const statusClass = record.status === 'present' ? 'status-present' : 'status-absent';

            return `
                                    <tr>
                                        <td>${dateStr}</td>
                                        <td>${dayName}</td>
                                        <td><span class="status-badge ${statusClass}">${record.status}</span></td>
                                        <td>${checkIn}</td>
                                        <td>${checkOut}</td>
                                        <td>${lectures}</td>
                                    </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        modalBody.innerHTML = html;

    } catch (error) {
        console.error('Error loading attendance:', error);
        modalBody.innerHTML = '<div class="error-state">Error loading attendance data</div>';
    }
}

function closeAttendanceModal() {
    document.getElementById('attendanceModal').classList.remove('active');
}

function exportAttendanceReport(studentId) {
    showNotification('Export functionality coming soon!', 'info');
}
