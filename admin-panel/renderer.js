
// Configuration
// Server URL - can be changed in Settings
// Priority: 1. Saved in localStorage, 2. Render URL, 3. Local IP
let SERVER_URL = localStorage.getItem('serverUrl') || 
                 'https://google-8j5x.onrender.com' || // Your Render URL
                 'http://192.168.9.31:3000'; // Fallback to local

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
    // Initialize cursor tracking after a short delay to ensure DOM is ready
    setTimeout(() => {
        initCursorTracking();
    }, 500);
}

// Global Cursor Light Effect
function initCursorTracking() {
    console.log('🎨 Initializing Global Cursor Light...');

    // Remove existing spotlight if any
    const existingSpotlight = document.querySelector('.global-spotlight');
    if (existingSpotlight) {
        existingSpotlight.remove();
    }

    // Create global spotlight
    const spotlight = document.createElement('div');
    spotlight.className = 'global-spotlight';
    document.body.appendChild(spotlight);
    console.log('✅ Global spotlight created');

    // Track mouse movement everywhere
    document.addEventListener('mousemove', (e) => {
        // Always show spotlight and follow cursor
        spotlight.style.left = `${e.clientX}px`;
        spotlight.style.top = `${e.clientY}px`;
        spotlight.style.opacity = '1';

        // Update bento cards if they exist
        const bentoCards = document.querySelectorAll('.bento-card');
        if (bentoCards.length > 0) {
            const SPOTLIGHT_RADIUS = 300;
            const PROXIMITY = SPOTLIGHT_RADIUS * 0.5;
            const FADE_DISTANCE = SPOTLIGHT_RADIUS * 0.75;

            bentoCards.forEach(card => {
                const cardRect = card.getBoundingClientRect();

                // Calculate relative position for card glow
                const relativeX = ((e.clientX - cardRect.left) / cardRect.width) * 100;
                const relativeY = ((e.clientY - cardRect.top) / cardRect.height) * 100;

                card.style.setProperty('--glow-x', `${relativeX}%`);
                card.style.setProperty('--glow-y', `${relativeY}%`);

                // Calculate distance from cursor to card center
                const centerX = cardRect.left + cardRect.width / 2;
                const centerY = cardRect.top + cardRect.height / 2;
                const distance = Math.hypot(e.clientX - centerX, e.clientY - centerY) -
                    Math.max(cardRect.width, cardRect.height) / 2;
                const effectiveDistance = Math.max(0, distance);

                // Calculate glow intensity
                let glowIntensity = 0;
                if (effectiveDistance <= PROXIMITY) {
                    glowIntensity = 1;
                } else if (effectiveDistance <= FADE_DISTANCE) {
                    glowIntensity = (FADE_DISTANCE - effectiveDistance) / (FADE_DISTANCE - PROXIMITY);
                }

                card.style.setProperty('--glow-intensity', glowIntensity.toString());
            });
        }

        // Subtle glow on navigation items only
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(element => {
            const rect = element.getBoundingClientRect();
            const distance = Math.hypot(
                e.clientX - (rect.left + rect.width / 2),
                e.clientY - (rect.top + rect.height / 2)
            );

            if (distance < 150) {
                const intensity = 1 - (distance / 150);
                element.style.boxShadow = `0 0 ${15 * intensity}px rgba(0, 217, 255, ${0.2 * intensity})`;
            } else {
                element.style.boxShadow = '';
            }
        });
    });

    // Handle mouse leave document
    document.addEventListener('mouseleave', () => {
        spotlight.style.opacity = '0';
    });

    // Handle mouse enter document
    document.addEventListener('mouseenter', () => {
        spotlight.style.opacity = '1';
    });
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
        case 'calendar': loadCalendar(); break;
        case 'dashboard':
            loadDashboardData();
            setTimeout(() => initCursorTracking(), 300);
            break;
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

        // Course distribution with progress bars
        const courseCounts = students.reduce((acc, s) => {
            acc[s.course] = (acc[s.course] || 0) + 1;
            return acc;
        }, {});

        const totalStudents = students.length;
        const courses = ['CSE', 'ECE', 'ME', 'Civil'];

        courses.forEach(course => {
            const count = courseCounts[course] || 0;
            const percentage = totalStudents > 0 ? (count / totalStudents * 100).toFixed(1) : 0;

            const countId = course === 'Civil' ? 'civilCount' : `${course.toLowerCase()}Count`;
            const progressId = course === 'Civil' ? 'civilProgress' : `${course.toLowerCase()}Progress`;

            document.getElementById(countId).textContent = count;
            const progressBar = document.getElementById(progressId);
            if (progressBar) {
                setTimeout(() => {
                    progressBar.style.width = `${percentage}%`;
                }, 100);
            }
        });

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

            const photoResult = await photoResponse.json();

            if (photoResponse.ok && photoResult.success) {
                // Server now returns full URL, no need to prepend SERVER_URL
                studentData.photoUrl = photoResult.photoUrl;
                console.log('✅ Photo uploaded with face detected:', studentData.photoUrl);
            } else {
                // Face not detected or other error
                const errorMsg = photoResult.error || 'Photo upload failed';
                console.error('❌ Photo upload failed:', errorMsg);
                alert('Photo Upload Failed\n\n' + errorMsg + '\n\nPlease use a clear, well-lit photo showing your face.');
                return; // Don't save student if photo validation failed
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('❌ Error uploading photo: ' + error.message);
            return; // Don't save student if photo upload failed
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

            const photoResult = await photoResponse.json();

            if (photoResponse.ok && photoResult.success) {
                teacherData.photoUrl = photoResult.photoUrl;
                console.log('✅ Photo uploaded with face detected');
            } else {
                const errorMsg = photoResult.error || 'Photo upload failed';
                console.error('❌ Photo upload failed:', errorMsg);
                alert('Photo Upload Failed\n\n' + errorMsg + '\n\nPlease use a clear, well-lit photo showing your face.');
                return;
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('❌ Error uploading photo: ' + error.message);
            return;
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
// Advanced Timetable Editor State
let selectedCells = [];
let clipboardData = null;
let undoStack = [];
let redoStack = [];
let timetableHistory = [];

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
            saveToHistory();
            renderAdvancedTimetableEditor(currentTimetable);
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

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const timetable = {};
    days.forEach(day => {
        timetable[day] = periods.map(p => ({
            period: p.number,
            subject: p.number === 4 ? 'Lunch Break' : p.number === 6 ? 'Break' : '',
            room: '',
            isBreak: p.number === 4 || p.number === 6,
            teacher: '',
            color: ''
        }));
    });

    currentTimetable = { semester, branch: course, periods, timetable };
    saveToHistory();
    renderAdvancedTimetableEditor(currentTimetable);
}

// History Management
function saveToHistory() {
    if (currentTimetable) {
        undoStack.push(JSON.parse(JSON.stringify(currentTimetable)));
        redoStack = [];
        if (undoStack.length > 50) undoStack.shift();
    }
}

function undo() {
    if (undoStack.length > 1) {
        redoStack.push(undoStack.pop());
        currentTimetable = JSON.parse(JSON.stringify(undoStack[undoStack.length - 1]));
        renderAdvancedTimetableEditor(currentTimetable);
        showNotification('Undo successful', 'success');
    }
}

function redo() {
    if (redoStack.length > 0) {
        const state = redoStack.pop();
        undoStack.push(state);
        currentTimetable = JSON.parse(JSON.stringify(state));
        renderAdvancedTimetableEditor(currentTimetable);
        showNotification('Redo successful', 'success');
    }
}

function renderAdvancedTimetableEditor(timetable) {
    const editor = document.getElementById('timetableEditor');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    let html = '';

    // Advanced Toolbar
    html += '<div class="advanced-toolbar">';
    html += '<div class="toolbar-section">';
    html += '<h3>📝 Edit Tools</h3>';
    html += '<button class="tool-btn" onclick="undo()" title="Undo (Ctrl+Z)">↶ Undo</button>';
    html += '<button class="tool-btn" onclick="redo()" title="Redo (Ctrl+Y)">↷ Redo</button>';
    html += '<button class="tool-btn" onclick="clearSelection()">✖ Clear Selection</button>';
    html += '</div>';

    html += '<div class="toolbar-section">';
    html += '<h3>📋 Copy/Paste</h3>';
    html += '<button class="tool-btn" onclick="copySelected()">📄 Copy</button>';
    html += '<button class="tool-btn" onclick="pasteToSelected()">📋 Paste</button>';
    html += '<button class="tool-btn" onclick="cutSelected()">✂️ Cut</button>';
    html += '</div>';

    html += '<div class="toolbar-section">';
    html += '<h3>🔄 Bulk Actions</h3>';
    html += '<button class="tool-btn" onclick="showCopyDayDialog()">📅 Copy Day</button>';
    html += '<button class="tool-btn" onclick="showFillDialog()">🎨 Fill Cells</button>';
    html += '<button class="tool-btn" onclick="clearDay()">🗑️ Clear Day</button>';
    html += '</div>';

    html += '<div class="toolbar-section">';
    html += '<h3>📚 Subject Tools</h3>';
    html += '<button class="tool-btn" onclick="showSubjectManager()">📖 Manage Subjects</button>';
    html += '<button class="tool-btn" onclick="showTeacherAssign()">👨‍🏫 Assign Teachers</button>';
    html += '<button class="tool-btn" onclick="showColorPicker()">🎨 Color Code</button>';
    html += '</div>';

    html += '<div class="toolbar-section">';
    html += '<h3>🔍 View Options</h3>';
    html += `<button class="tool-btn" onclick="toggleTeacherView()">👨‍🏫 ${showTeachers ? 'Hide' : 'Show'} Teachers</button>`;
    html += `<button class="tool-btn" onclick="toggleRoomView()">🏢 ${showRooms ? 'Hide' : 'Show'} Rooms</button>`;
    html += `<button class="tool-btn" onclick="toggleCompactView()">📏 ${compactView ? 'Normal' : 'Compact'} View</button>`;
    html += '</div>';

    html += '<div class="toolbar-section">';
    html += '<h3>📤 Export/Import</h3>';
    html += '<button class="tool-btn" onclick="exportToPDF()">📄 Export PDF</button>';
    html += '<button class="tool-btn" onclick="exportToExcel()">📊 Export Excel</button>';
    html += '<button class="tool-btn" onclick="showImportDialog()">📥 Import</button>';
    html += '</div>';

    html += '<div class="toolbar-section">';
    html += '<h3>⚙️ Advanced</h3>';
    html += '<button class="tool-btn" onclick="showPeriodSettings()">⏰ Period Settings</button>';
    html += '<button class="tool-btn" onclick="showTemplateDialog()">💾 Save Template</button>';
    html += '<button class="tool-btn" onclick="duplicateTimetable()">📑 Duplicate</button>';
    html += '<button class="tool-btn" onclick="showConflictCheck()">⚠️ Check Conflicts</button>';
    html += '</div>';
    html += '</div>';

    // Timetable Info
    html += '<div class="timetable-info-advanced">';
    html += `<div class="info-item"><strong>Course:</strong> ${timetable.branch}</div>`;
    html += `<div class="info-item"><strong>Semester:</strong> ${timetable.semester}</div>`;
    html += `<div class="info-item"><strong>Days:</strong> 6 (Mon-Sat)</div>`;
    html += `<div class="info-item"><strong>Periods:</strong> 8 per day</div>`;
    html += `<div class="info-item"><strong>Selected:</strong> <span id="selectedCount">0</span> cells</div>`;
    html += '</div>';

    // Timetable Grid with dynamic columns
    const numPeriods = timetable.periods.length;
    html += `<div class="timetable-grid-advanced" style="grid-template-columns: 120px repeat(${numPeriods}, 1fr);">`;

    // Header row
    html += '<div class="tt-cell tt-header tt-corner">Day/Period</div>';
    timetable.periods.forEach(period => {
        const isBreak = period.isBreak || period.number === 4 || period.number === 6;
        html += `<div class="tt-cell tt-header ${isBreak ? 'tt-break-header' : ''}">
            <div class="period-number">${isBreak ? (period.number === 4 ? '🍽️' : '☕') : `P${period.number}`}</div>
            <div class="period-time">${period.startTime}-${period.endTime}</div>
        </div>`;
    });

    // Data rows
    days.forEach((day, dayIdx) => {
        html += `<div class="tt-cell tt-header tt-day-header">${day}</div>`;
        const daySchedule = timetable.timetable[dayKeys[dayIdx]] || [];
        daySchedule.forEach((period, periodIdx) => {
            const isBreak = period.isBreak || period.subject.includes('Break');
            const cellId = `cell-${dayIdx}-${periodIdx}`;
            const bgColor = period.color || '';

            html += `<div class="tt-cell ${isBreak ? 'tt-break-cell' : 'tt-editable'}" 
                id="${cellId}"
                data-day="${dayIdx}" 
                data-period="${periodIdx}"
                style="${bgColor ? `background-color: ${bgColor}` : ''}"
                ${!isBreak ? `onclick="handleCellClick(event, ${dayIdx}, ${periodIdx})"` : ''}
                ${!isBreak ? `ondblclick="editAdvancedCell(${dayIdx}, ${periodIdx})"` : ''}
                ${!isBreak ? `oncontextmenu="showCellContextMenu(event, ${dayIdx}, ${periodIdx}); return false;"` : ''}>
                ${isBreak ? `<div class="break-label">${period.subject}</div>` : `
                    <div class="cell-content">
                        <div class="subject-name">${period.subject || '-'}</div>
                        ${period.teacher ? `<div class="teacher-name">👨‍🏫 ${period.teacher}</div>` : ''}
                        ${period.room ? `<div class="room-name">🏢 ${period.room}</div>` : ''}
                    </div>
                `}
            </div>`;
        });
    });

    html += '</div>';

    // Quick Actions Bar
    html += '<div class="quick-actions-bar">';
    html += '<button class="btn btn-primary" onclick="saveTimetable()">💾 Save Timetable</button>';
    html += '<button class="btn btn-success" onclick="autoFillTimetable()">🤖 Auto Fill</button>';
    html += '<button class="btn btn-warning" onclick="validateTimetable()">✓ Validate</button>';
    html += '<button class="btn btn-secondary" onclick="printTimetable()">🖨️ Print</button>';
    html += '<button class="btn btn-info" onclick="shareTimetable()">🔗 Share</button>';
    html += '</div>';

    editor.innerHTML = html;

    // Initialize keyboard shortcuts
    initKeyboardShortcuts();
}

// Keep old function for backward compatibility
function renderTimetableEditor(timetable) {
    renderAdvancedTimetableEditor(timetable);
}


// Cell Selection and Interaction
function handleCellClick(event, dayIdx, periodIdx) {
    const cellId = `cell-${dayIdx}-${periodIdx}`;
    const cell = document.getElementById(cellId);

    if (event.ctrlKey || event.metaKey) {
        // Multi-select with Ctrl
        toggleCellSelection(cellId, dayIdx, periodIdx);
    } else if (event.shiftKey && selectedCells.length > 0) {
        // Range select with Shift
        selectRange(selectedCells[0], { dayIdx, periodIdx });
    } else {
        // Single select
        clearSelection();
        toggleCellSelection(cellId, dayIdx, periodIdx);
    }
}

function toggleCellSelection(cellId, dayIdx, periodIdx) {
    const cell = document.getElementById(cellId);
    const index = selectedCells.findIndex(c => c.cellId === cellId);

    if (index >= 0) {
        selectedCells.splice(index, 1);
        cell.classList.remove('selected');
    } else {
        selectedCells.push({ cellId, dayIdx, periodIdx });
        cell.classList.add('selected');
    }

    document.getElementById('selectedCount').textContent = selectedCells.length;
}

function clearSelection() {
    selectedCells.forEach(({ cellId }) => {
        const cell = document.getElementById(cellId);
        if (cell) cell.classList.remove('selected');
    });
    selectedCells = [];
    document.getElementById('selectedCount').textContent = '0';
}

function selectRange(start, end) {
    clearSelection();
    const minDay = Math.min(start.dayIdx, end.dayIdx);
    const maxDay = Math.max(start.dayIdx, end.dayIdx);
    const minPeriod = Math.min(start.periodIdx, end.periodIdx);
    const maxPeriod = Math.max(start.periodIdx, end.periodIdx);

    for (let d = minDay; d <= maxDay; d++) {
        for (let p = minPeriod; p <= maxPeriod; p++) {
            const cellId = `cell-${d}-${p}`;
            toggleCellSelection(cellId, d, p);
        }
    }
}

function editAdvancedCell(dayIdx, periodIdx) {
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const period = currentTimetable.timetable[dayKeys[dayIdx]][periodIdx];

    // Generate teacher options
    const teacherOptions = teachers.map(t =>
        `<option value="${t.name}" ${period.teacher === t.name ? 'selected' : ''}>${t.name} (${t.employeeId})</option>`
    ).join('');

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>✏️ Edit Period</h2>
        <form id="periodForm">
            <div class="form-group">
                <label>📚 Subject</label>
                <input type="text" name="subject" class="form-input" value="${period.subject || ''}" list="subjectList">
                <datalist id="subjectList">
                    <option value="Mathematics">
                    <option value="Physics">
                    <option value="Chemistry">
                    <option value="Programming">
                    <option value="Data Structures">
                    <option value="DBMS">
                    <option value="Operating Systems">
                    <option value="Computer Networks">
                </datalist>
            </div>
            <div class="form-group">
                <label>👨‍🏫 Teacher</label>
                <select name="teacher" class="form-select">
                    <option value="">-- Select Teacher --</option>
                    ${teacherOptions}
                </select>
                <small style="color: var(--text-secondary); font-size: 12px;">Only registered teachers can be assigned</small>
            </div>
            <div class="form-group">
                <label>🏢 Room</label>
                <input type="text" name="room" class="form-input" value="${period.room || ''}">
            </div>
            <div class="form-group">
                <label>🎨 Color</label>
                <input type="color" name="color" class="form-input" value="${period.color || '#ffffff'}">
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" name="isBreak" ${period.isBreak ? 'checked' : ''}> Is Break Period
                </label>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">💾 Save</button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;

    document.getElementById('periodForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveToHistory();
        const formData = new FormData(e.target);
        period.subject = formData.get('subject');
        period.teacher = formData.get('teacher');
        period.room = formData.get('room');
        period.color = formData.get('color');
        period.isBreak = formData.has('isBreak');

        closeModal();
        renderAdvancedTimetableEditor(currentTimetable);
        showNotification('Period updated successfully', 'success');
    });

    openModal();
}

// Keep old function for compatibility
function editTimetableCell(dayIdx, periodIdx) {
    editAdvancedCell(dayIdx, periodIdx);
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

// Copy/Paste Functions
function copySelected() {
    if (selectedCells.length === 0) {
        showNotification('No cells selected', 'warning');
        return;
    }

    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    clipboardData = selectedCells.map(({ dayIdx, periodIdx }) => {
        const period = currentTimetable.timetable[dayKeys[dayIdx]][periodIdx];
        return JSON.parse(JSON.stringify(period));
    });

    showNotification(`Copied ${selectedCells.length} cell(s)`, 'success');
}

function cutSelected() {
    copySelected();
    if (clipboardData) {
        saveToHistory();
        const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        selectedCells.forEach(({ dayIdx, periodIdx }) => {
            const period = currentTimetable.timetable[dayKeys[dayIdx]][periodIdx];
            if (!period.isBreak) {
                period.subject = '';
                period.teacher = '';
                period.room = '';
                period.color = '';
            }
        });
        renderAdvancedTimetableEditor(currentTimetable);
        showNotification('Cut successful', 'success');
    }
}

function pasteToSelected() {
    if (!clipboardData || clipboardData.length === 0) {
        showNotification('Nothing to paste', 'warning');
        return;
    }

    if (selectedCells.length === 0) {
        showNotification('No cells selected', 'warning');
        return;
    }

    saveToHistory();
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    selectedCells.forEach(({ dayIdx, periodIdx }, index) => {
        const sourceData = clipboardData[index % clipboardData.length];
        const targetPeriod = currentTimetable.timetable[dayKeys[dayIdx]][periodIdx];

        if (!targetPeriod.isBreak) {
            targetPeriod.subject = sourceData.subject;
            targetPeriod.teacher = sourceData.teacher;
            targetPeriod.room = sourceData.room;
            targetPeriod.color = sourceData.color;
        }
    });

    renderAdvancedTimetableEditor(currentTimetable);
    showNotification('Paste successful', 'success');
}

// Bulk Actions
function showCopyDayDialog() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>📅 Copy Day</h2>
        <form id="copyDayForm">
            <div class="form-group">
                <label>From Day:</label>
                <select name="fromDay" class="form-select">
                    <option value="0">Monday</option>
                    <option value="1">Tuesday</option>
                    <option value="2">Wednesday</option>
                    <option value="3">Thursday</option>
                    <option value="4">Friday</option>
                    <option value="5">Saturday</option>
                </select>
            </div>
            <div class="form-group">
                <label>To Day(s):</label>
                <div class="checkbox-group">
                    <label><input type="checkbox" name="toDay" value="0"> Monday</label>
                    <label><input type="checkbox" name="toDay" value="1"> Tuesday</label>
                    <label><input type="checkbox" name="toDay" value="2"> Wednesday</label>
                    <label><input type="checkbox" name="toDay" value="3"> Thursday</label>
                    <label><input type="checkbox" name="toDay" value="4"> Friday</label>
                    <label><input type="checkbox" name="toDay" value="5"> Saturday</label>
                </div>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Copy</button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;

    document.getElementById('copyDayForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const fromDay = parseInt(formData.get('fromDay'));
        const toDays = formData.getAll('toDay').map(d => parseInt(d));

        if (toDays.length === 0) {
            showNotification('Select at least one target day', 'warning');
            return;
        }

        saveToHistory();
        const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const sourceDay = currentTimetable.timetable[dayKeys[fromDay]];

        toDays.forEach(toDay => {
            if (toDay !== fromDay) {
                currentTimetable.timetable[dayKeys[toDay]] = JSON.parse(JSON.stringify(sourceDay));
            }
        });

        closeModal();
        renderAdvancedTimetableEditor(currentTimetable);
        showNotification(`Copied to ${toDays.length} day(s)`, 'success');
    });

    openModal();
}

function showFillDialog() {
    if (selectedCells.length === 0) {
        showNotification('Select cells first', 'warning');
        return;
    }

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>🎨 Fill Selected Cells</h2>
        <form id="fillForm">
            <div class="form-group">
                <label>Subject:</label>
                <input type="text" name="subject" class="form-input">
            </div>
            <div class="form-group">
                <label>Teacher:</label>
                <input type="text" name="teacher" class="form-input">
            </div>
            <div class="form-group">
                <label>Room:</label>
                <input type="text" name="room" class="form-input">
            </div>
            <div class="form-group">
                <label>Color:</label>
                <input type="color" name="color" class="form-input">
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Fill</button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;

    document.getElementById('fillForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveToHistory();
        const formData = new FormData(e.target);
        const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        selectedCells.forEach(({ dayIdx, periodIdx }) => {
            const period = currentTimetable.timetable[dayKeys[dayIdx]][periodIdx];
            if (!period.isBreak) {
                if (formData.get('subject')) period.subject = formData.get('subject');
                if (formData.get('teacher')) period.teacher = formData.get('teacher');
                if (formData.get('room')) period.room = formData.get('room');
                if (formData.get('color')) period.color = formData.get('color');
            }
        });

        closeModal();
        renderAdvancedTimetableEditor(currentTimetable);
        showNotification('Cells filled successfully', 'success');
    });

    openModal();
}

function clearDay() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>🗑️ Clear Day</h2>
        <p>Select day to clear:</p>
        <form id="clearDayForm">
            <div class="form-group">
                <select name="day" class="form-select">
                    <option value="0">Monday</option>
                    <option value="1">Tuesday</option>
                    <option value="2">Wednesday</option>
                    <option value="3">Thursday</option>
                    <option value="4">Friday</option>
                    <option value="5">Saturday</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-danger">Clear</button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;

    document.getElementById('clearDayForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveToHistory();
        const formData = new FormData(e.target);
        const dayIdx = parseInt(formData.get('day'));
        const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        currentTimetable.timetable[dayKeys[dayIdx]].forEach(period => {
            if (!period.isBreak) {
                period.subject = '';
                period.teacher = '';
                period.room = '';
                period.color = '';
            }
        });

        closeModal();
        renderAdvancedTimetableEditor(currentTimetable);
        showNotification('Day cleared', 'success');
    });

    openModal();
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

                const photoResult = await photoResponse.json();

                if (photoResponse.ok && photoResult.success) {
                    studentData.photoUrl = photoResult.photoUrl;
                    console.log('✅ Photo updated with face detected');
                } else {
                    const errorMsg = photoResult.error || 'Photo upload failed';
                    console.error('❌ Photo upload failed:', errorMsg);
                    alert('Photo Upload Failed\n\n' + errorMsg + '\n\nPlease use a clear, well-lit photo showing your face.');
                    return;
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

                const photoResult = await photoResponse.json();

                if (photoResponse.ok && photoResult.success) {
                    teacherData.photoUrl = photoResult.photoUrl;
                    console.log('✅ Photo updated with face detected');
                } else {
                    const errorMsg = photoResult.error || 'Photo upload failed';
                    console.error('❌ Photo upload failed:', errorMsg);
                    alert('Photo Upload Failed\n\n' + errorMsg + '\n\nPlease use a clear, well-lit photo showing your face.');
                    return;
                }
            } catch (error) {
                console.error('Error uploading photo:', error);
                alert('❌ Error uploading photo: ' + error.message);
                return;
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

        // Separate by status
        const presentDays = records.filter(r => r.status === 'present');
        const absentDays = records.filter(r => r.status === 'absent');
        const leaveDays = records.filter(r => r.status === 'leave');

        // Calculate attendance rate (excluding leave days)
        const classDays = presentDays.length + absentDays.length;
        const attendanceRate = classDays > 0 ? ((presentDays.length / classDays) * 100).toFixed(1) : 0;

        // Calculate total minutes
        const totalMinutesAttended = records.reduce((sum, r) => sum + (r.totalAttended || 0), 0);
        const totalClassMinutes = records.reduce((sum, r) => sum + (r.totalClassTime || 0), 0);
        const minutePercentage = totalClassMinutes > 0 ? ((totalMinutesAttended / totalClassMinutes) * 100).toFixed(1) : 0;

        // Get date range
        const dates = records.map(r => new Date(r.date)).sort((a, b) => a - b);
        const startDate = dates[0] ? dates[0].toLocaleDateString() : 'N/A';
        const endDate = dates[dates.length - 1] ? dates[dates.length - 1].toLocaleDateString() : 'N/A';

        // Render report
        let html = `
            <div class="attendance-report">
                <div class="report-header">
                    <h2>📊 Detailed Attendance Report</h2>
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
                        <div class="stat-number">${records.length}</div>
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
                    <div class="stat-box stat-leave">
                        <div class="stat-number">${leaveDays.length}</div>
                        <div class="stat-label">Leave</div>
                    </div>
                </div>
                
                <div class="stats-row">
                    <div class="stat-box stat-rate">
                        <div class="stat-number">${attendanceRate}%</div>
                        <div class="stat-label">Attendance Rate</div>
                        <div class="stat-sublabel">${presentDays.length}/${classDays} class days</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number">${Math.floor(totalMinutesAttended / 60)}h ${totalMinutesAttended % 60}m</div>
                        <div class="stat-label">Total Time Attended</div>
                        <div class="stat-sublabel">${minutePercentage}% of class time</div>
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
                    <h3>📅 Detailed Daily Records</h3>
                    <table class="attendance-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Day</th>
                                <th>Status</th>
                                <th>Attended</th>
                                <th>Total</th>
                                <th>%</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${records.sort((a, b) => new Date(b.date) - new Date(a.date)).map(record => {
            const date = new Date(record.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dateStr = date.toLocaleDateString();

            let statusClass = 'status-absent';
            let statusText = record.status;
            if (record.status === 'present') statusClass = 'status-present';
            if (record.status === 'leave') statusClass = 'status-leave';

            const attended = record.totalAttended || 0;
            const total = record.totalClassTime || 0;
            const percentage = record.dayPercentage || 0;

            const lectureCount = record.lectures ? record.lectures.length : 0;
            const presentLectures = record.lectures ? record.lectures.filter(l => l.present).length : 0;

            return `
                                    <tr onclick="showDayDetails('${record._id || record.studentId + '_' + dateStr}')" style="cursor: pointer;" title="Click for lecture-wise details">
                                        <td>${dateStr}</td>
                                        <td>${dayName}</td>
                                        <td><span class="status-badge ${statusClass}">${statusText.toUpperCase()}</span></td>
                                        <td>${attended} min</td>
                                        <td>${total} min</td>
                                        <td><strong>${percentage}%</strong></td>
                                        <td>${record.status === 'leave' ? '🏖️ No Classes' : `${presentLectures}/${lectureCount} lectures`}</td>
                                    </tr>
                                    ${record.lectures && record.lectures.length > 0 ? `
                                    <tr class="lecture-details-row" id="details_${record._id || record.studentId + '_' + dateStr}" style="display: none;">
                                        <td colspan="7">
                                            <div class="lecture-breakdown">
                                                <h4>📚 Lecture-wise Breakdown:</h4>
                                                <table class="lecture-table">
                                                    <thead>
                                                        <tr>
                                                            <th>#</th>
                                                            <th>Subject</th>
                                                            <th>Time</th>
                                                            <th>Room</th>
                                                            <th>Attended</th>
                                                            <th>Total</th>
                                                            <th>%</th>
                                                            <th>Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        ${record.lectures.map((lec, idx) => `
                                                        <tr>
                                                            <td>${idx + 1}</td>
                                                            <td><strong>${lec.subject}</strong></td>
                                                            <td>${lec.startTime}-${lec.endTime}</td>
                                                            <td>${lec.room}</td>
                                                            <td>${lec.attended} min</td>
                                                            <td>${lec.total} min</td>
                                                            <td><strong>${lec.percentage}%</strong></td>
                                                            <td><span class="status-badge ${lec.present ? 'status-present' : 'status-absent'}">${lec.present ? '✓ Present' : '✗ Absent'}</span></td>
                                                        </tr>
                                                        `).join('')}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
                                    ` : ''}
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

function showDayDetails(recordId) {
    const detailsRow = document.getElementById(`details_${recordId}`);
    if (detailsRow) {
        if (detailsRow.style.display === 'none') {
            detailsRow.style.display = 'table-row';
        } else {
            detailsRow.style.display = 'none';
        }
    }
}

function exportAttendanceReport(studentId) {
    showNotification('Export functionality coming soon!', 'info');
}


// Advanced Timetable Features

// Keyboard Shortcuts
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'z':
                    e.preventDefault();
                    undo();
                    break;
                case 'y':
                    e.preventDefault();
                    redo();
                    break;
                case 'c':
                    if (selectedCells.length > 0) {
                        e.preventDefault();
                        copySelected();
                    }
                    break;
                case 'v':
                    if (selectedCells.length > 0 && clipboardData) {
                        e.preventDefault();
                        pasteToSelected();
                    }
                    break;
                case 'x':
                    if (selectedCells.length > 0) {
                        e.preventDefault();
                        cutSelected();
                    }
                    break;
                case 's':
                    e.preventDefault();
                    saveTimetable();
                    break;
            }
        }

        if (e.key === 'Delete' && selectedCells.length > 0) {
            e.preventDefault();
            deleteSelectedCells();
        }

        if (e.key === 'Escape') {
            clearSelection();
        }
    });
}

function deleteSelectedCells() {
    saveToHistory();
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    selectedCells.forEach(({ dayIdx, periodIdx }) => {
        const period = currentTimetable.timetable[dayKeys[dayIdx]][periodIdx];
        if (!period.isBreak) {
            period.subject = '';
            period.teacher = '';
            period.room = '';
            period.color = '';
        }
    });

    renderAdvancedTimetableEditor(currentTimetable);
    showNotification('Deleted selected cells', 'success');
}

// Subject Manager
function showSubjectManager() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>📖 Subject Manager</h2>
        <p>Manage common subjects for quick access</p>
        <div class="subject-list">
            <div class="subject-item">Mathematics <button onclick="applySubjectToSelected('Mathematics')">Apply</button></div>
            <div class="subject-item">Physics <button onclick="applySubjectToSelected('Physics')">Apply</button></div>
            <div class="subject-item">Chemistry <button onclick="applySubjectToSelected('Chemistry')">Apply</button></div>
            <div class="subject-item">Programming <button onclick="applySubjectToSelected('Programming')">Apply</button></div>
            <div class="subject-item">Data Structures <button onclick="applySubjectToSelected('Data Structures')">Apply</button></div>
            <div class="subject-item">DBMS <button onclick="applySubjectToSelected('DBMS')">Apply</button></div>
            <div class="subject-item">Operating Systems <button onclick="applySubjectToSelected('Operating Systems')">Apply</button></div>
            <div class="subject-item">Computer Networks <button onclick="applySubjectToSelected('Computer Networks')">Apply</button></div>
        </div>
        <button class="btn btn-secondary" onclick="closeModal()">Close</button>
    `;
    openModal();
}

function applySubjectToSelected(subject) {
    if (selectedCells.length === 0) {
        showNotification('Select cells first', 'warning');
        return;
    }

    saveToHistory();
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    selectedCells.forEach(({ dayIdx, periodIdx }) => {
        const period = currentTimetable.timetable[dayKeys[dayIdx]][periodIdx];
        if (!period.isBreak) {
            period.subject = subject;
        }
    });

    closeModal();
    renderAdvancedTimetableEditor(currentTimetable);
    showNotification(`Applied "${subject}" to ${selectedCells.length} cell(s)`, 'success');
}

// Teacher Assignment
function showTeacherAssign() {
    if (selectedCells.length === 0) {
        showNotification('Select cells first', 'warning');
        return;
    }

    // Generate teacher options
    const teacherOptions = teachers.map(t =>
        `<option value="${t.name}">${t.name} (${t.employeeId}) - ${t.department}</option>`
    ).join('');

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>👨‍🏫 Assign Teacher</h2>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">
            Assigning to ${selectedCells.length} selected cell(s)
        </p>
        <form id="teacherForm">
            <div class="form-group">
                <label>Select Teacher:</label>
                <select name="teacher" class="form-select" required>
                    <option value="">-- Select Teacher --</option>
                    ${teacherOptions}
                </select>
                <small style="color: var(--text-secondary); font-size: 12px; display: block; margin-top: 8px;">
                    Only registered teachers from the database can be assigned
                </small>
            </div>
            ${teachers.length === 0 ? `
                <div style="padding: 12px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin-bottom: 16px;">
                    <strong>⚠️ No teachers found!</strong><br>
                    Please add teachers in the Teachers section first.
                </div>
            ` : ''}
            <div class="form-actions">
                <button type="submit" class="btn btn-primary" ${teachers.length === 0 ? 'disabled' : ''}>Assign to Selected</button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;

    document.getElementById('teacherForm').addEventListener('submit', (e) => {
        e.preventDefault();

        saveToHistory();
        const formData = new FormData(e.target);
        const teacher = formData.get('teacher');

        if (!teacher) {
            showNotification('Please select a teacher', 'warning');
            return;
        }

        const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        selectedCells.forEach(({ dayIdx, periodIdx }) => {
            const period = currentTimetable.timetable[dayKeys[dayIdx]][periodIdx];
            if (!period.isBreak) {
                period.teacher = teacher;
            }
        });

        closeModal();
        renderAdvancedTimetableEditor(currentTimetable);
        showNotification(`Assigned "${teacher}" to ${selectedCells.length} cell(s)`, 'success');
    });

    openModal();
}

// Color Picker
function showColorPicker() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>🎨 Color Code Subjects</h2>
        <p>Select a color for selected cells:</p>
        <div class="color-palette">
            <div class="color-option" style="background: #ffebee" onclick="applyColorToSelected('#ffebee')"></div>
            <div class="color-option" style="background: #e3f2fd" onclick="applyColorToSelected('#e3f2fd')"></div>
            <div class="color-option" style="background: #e8f5e9" onclick="applyColorToSelected('#e8f5e9')"></div>
            <div class="color-option" style="background: #fff3e0" onclick="applyColorToSelected('#fff3e0')"></div>
            <div class="color-option" style="background: #f3e5f5" onclick="applyColorToSelected('#f3e5f5')"></div>
            <div class="color-option" style="background: #e0f2f1" onclick="applyColorToSelected('#e0f2f1')"></div>
            <div class="color-option" style="background: #fce4ec" onclick="applyColorToSelected('#fce4ec')"></div>
            <div class="color-option" style="background: #fff9c4" onclick="applyColorToSelected('#fff9c4')"></div>
        </div>
        <button class="btn btn-secondary" onclick="closeModal()">Close</button>
    `;
    openModal();
}

function applyColorToSelected(color) {
    if (selectedCells.length === 0) {
        showNotification('Select cells first', 'warning');
        return;
    }

    saveToHistory();
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    selectedCells.forEach(({ dayIdx, periodIdx }) => {
        const period = currentTimetable.timetable[dayKeys[dayIdx]][periodIdx];
        if (!period.isBreak) {
            period.color = color;
        }
    });

    closeModal();
    renderAdvancedTimetableEditor(currentTimetable);
    showNotification('Color applied', 'success');
}

// View Toggles
let showTeachers = true;
let showRooms = true;
let compactView = false;

function toggleTeacherView() {
    showTeachers = !showTeachers;
    renderAdvancedTimetableEditor(currentTimetable);
    showNotification(`Teachers ${showTeachers ? 'shown' : 'hidden'}`, 'info');
}

function toggleRoomView() {
    showRooms = !showRooms;
    renderAdvancedTimetableEditor(currentTimetable);
    showNotification(`Rooms ${showRooms ? 'shown' : 'hidden'}`, 'info');
}

function toggleCompactView() {
    compactView = !compactView;
    document.querySelector('.timetable-grid-advanced').classList.toggle('compact-mode');
    showNotification(`Compact mode ${compactView ? 'enabled' : 'disabled'}`, 'info');
}

// Export Functions
function exportToPDF() {
    showNotification('PDF export feature coming soon!', 'info');
    // TODO: Implement PDF export using jsPDF
}

function exportToExcel() {
    showNotification('Excel export feature coming soon!', 'info');
    // TODO: Implement Excel export
}

function showImportDialog() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>📥 Import Timetable</h2>
        <p>Upload a JSON file to import timetable</p>
        <input type="file" id="importFile" accept=".json">
        <div class="form-actions">
            <button class="btn btn-primary" onclick="importTimetableFile()">Import</button>
            <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        </div>
    `;
    openModal();
}

function importTimetableFile() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];

    if (!file) {
        showNotification('Select a file first', 'warning');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            saveToHistory();
            currentTimetable = imported;
            closeModal();
            renderAdvancedTimetableEditor(currentTimetable);
            showNotification('Timetable imported successfully', 'success');
        } catch (error) {
            showNotification('Invalid file format', 'error');
        }
    };
    reader.readAsText(file);
}

// Template Functions
function showTemplateDialog() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>💾 Save as Template</h2>
        <form id="templateForm">
            <div class="form-group">
                <label>Template Name:</label>
                <input type="text" name="templateName" class="form-input" placeholder="e.g., CSE Standard Template">
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Save Template</button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;

    document.getElementById('templateForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const templateName = formData.get('templateName');

        // Save to localStorage
        const templates = JSON.parse(localStorage.getItem('timetableTemplates') || '[]');
        templates.push({
            name: templateName,
            data: currentTimetable,
            created: new Date().toISOString()
        });
        localStorage.setItem('timetableTemplates', JSON.stringify(templates));

        closeModal();
        showNotification('Template saved successfully', 'success');
    });

    openModal();
}

function duplicateTimetable() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>📑 Duplicate Timetable</h2>
        <form id="duplicateForm">
            <div class="form-group">
                <label>Target Semester:</label>
                <select name="semester" class="form-select">
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                    <option value="3">Semester 3</option>
                    <option value="4">Semester 4</option>
                    <option value="5">Semester 5</option>
                    <option value="6">Semester 6</option>
                    <option value="7">Semester 7</option>
                    <option value="8">Semester 8</option>
                </select>
            </div>
            <div class="form-group">
                <label>Target Course:</label>
                <select name="course" class="form-select">
                    <option value="CSE">Computer Science</option>
                    <option value="ECE">Electronics</option>
                    <option value="ME">Mechanical</option>
                    <option value="CE">Civil</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Duplicate</button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;

    document.getElementById('duplicateForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newTimetable = JSON.parse(JSON.stringify(currentTimetable));
        newTimetable.semester = formData.get('semester');
        newTimetable.branch = formData.get('course');

        try {
            const response = await fetch(`${SERVER_URL}/api/timetable`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTimetable)
            });

            if (response.ok) {
                closeModal();
                showNotification('Timetable duplicated successfully', 'success');
            } else {
                showNotification('Failed to duplicate timetable', 'error');
            }
        } catch (error) {
            showNotification('Error: ' + error.message, 'error');
        }
    });

    openModal();
}

// Conflict Check
function showConflictCheck() {
    const conflicts = [];
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Check for teacher conflicts (same teacher, same time, different days)
    const teacherSchedule = {};

    dayKeys.forEach((dayKey, dayIdx) => {
        currentTimetable.timetable[dayKey].forEach((period, periodIdx) => {
            if (period.teacher && !period.isBreak) {
                const key = `${period.teacher}-${periodIdx}`;
                if (!teacherSchedule[key]) {
                    teacherSchedule[key] = [];
                }
                teacherSchedule[key].push({ day: days[dayIdx], period: periodIdx + 1, subject: period.subject });
            }
        });
    });

    // Find conflicts
    Object.keys(teacherSchedule).forEach(key => {
        if (teacherSchedule[key].length > 1) {
            const [teacher, period] = key.split('-');
            conflicts.push({
                type: 'Teacher Conflict',
                teacher: teacher,
                details: teacherSchedule[key]
            });
        }
    });

    const modalBody = document.getElementById('modalBody');
    if (conflicts.length === 0) {
        modalBody.innerHTML = `
            <h2>✓ No Conflicts Found</h2>
            <p>Your timetable looks good!</p>
            <button class="btn btn-primary" onclick="closeModal()">Close</button>
        `;
    } else {
        let html = `<h2>⚠️ Conflicts Found</h2>`;
        html += `<p>Found ${conflicts.length} conflict(s):</p>`;
        html += '<div class="conflict-list">';
        conflicts.forEach(conflict => {
            html += `<div class="conflict-item">`;
            html += `<strong>${conflict.type}:</strong> ${conflict.teacher}<br>`;
            conflict.details.forEach(d => {
                html += `${d.day} Period ${d.period} - ${d.subject}<br>`;
            });
            html += `</div>`;
        });
        html += '</div>';
        html += '<button class="btn btn-primary" onclick="closeModal()">Close</button>';
        modalBody.innerHTML = html;
    }

    openModal();
}

// Auto Fill
function autoFillTimetable() {
    showNotification('Auto-fill feature coming soon!', 'info');
    // TODO: Implement AI-based auto-fill
}

// Validate
function validateTimetable() {
    let issues = [];
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    dayKeys.forEach(dayKey => {
        currentTimetable.timetable[dayKey].forEach((period, idx) => {
            if (!period.isBreak && !period.subject) {
                issues.push(`Empty cell found in ${dayKey} period ${idx + 1}`);
            }
        });
    });

    if (issues.length === 0) {
        showNotification('✓ Timetable is valid!', 'success');
    } else {
        showNotification(`Found ${issues.length} issue(s)`, 'warning');
    }
}

// Print
function printTimetable() {
    window.print();
}

// Share
function shareTimetable() {
    const url = `${window.location.origin}/timetable/${currentTimetable.branch}/${currentTimetable.semester}`;
    navigator.clipboard.writeText(url);
    showNotification('Link copied to clipboard!', 'success');
}

// Context Menu
function showCellContextMenu(event, dayIdx, periodIdx) {
    event.preventDefault();

    // Remove existing context menu
    const existing = document.querySelector('.context-menu');
    if (existing) existing.remove();

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.left = event.pageX + 'px';
    menu.style.top = event.pageY + 'px';
    menu.innerHTML = `
        <div class="context-menu-item" onclick="editAdvancedCell(${dayIdx}, ${periodIdx}); closeContextMenu()">✏️ Edit</div>
        <div class="context-menu-item" onclick="copySingleCell(${dayIdx}, ${periodIdx}); closeContextMenu()">📄 Copy</div>
        <div class="context-menu-item" onclick="pasteSingleCell(${dayIdx}, ${periodIdx}); closeContextMenu()">📋 Paste</div>
        <div class="context-menu-item" onclick="clearSingleCell(${dayIdx}, ${periodIdx}); closeContextMenu()">🗑️ Clear</div>
    `;

    document.body.appendChild(menu);

    // Close on click outside
    setTimeout(() => {
        document.addEventListener('click', closeContextMenu);
    }, 100);
}

function closeContextMenu() {
    const menu = document.querySelector('.context-menu');
    if (menu) menu.remove();
    document.removeEventListener('click', closeContextMenu);
}

function copySingleCell(dayIdx, periodIdx) {
    selectedCells = [{ cellId: `cell-${dayIdx}-${periodIdx}`, dayIdx, periodIdx }];
    copySelected();
}

function pasteSingleCell(dayIdx, periodIdx) {
    selectedCells = [{ cellId: `cell-${dayIdx}-${periodIdx}`, dayIdx, periodIdx }];
    pasteToSelected();
}

function clearSingleCell(dayIdx, periodIdx) {
    saveToHistory();
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const period = currentTimetable.timetable[dayKeys[dayIdx]][periodIdx];

    if (!period.isBreak) {
        period.subject = '';
        period.teacher = '';
        period.room = '';
        period.color = '';
    }

    renderAdvancedTimetableEditor(currentTimetable);
}

// Period Settings Management
function showPeriodSettings() {
    if (!currentTimetable) {
        showNotification('Please load or create a timetable first', 'warning');
        return;
    }

    const modalBody = document.getElementById('modalBody');
    let html = '<h2>⏰ Period Settings</h2>';
    html += '<p style="color: var(--text-secondary); margin-bottom: 20px;">Configure period timings for your college schedule</p>';

    html += '<div class="period-settings-container">';

    // Period list
    html += '<div class="period-list">';
    currentTimetable.periods.forEach((period, index) => {
        const isBreak = currentTimetable.timetable.monday[index]?.isBreak || false;
        html += `
            <div class="period-item" id="period-item-${index}">
                <div class="period-header">
                    <span class="period-label">Period ${period.number}</span>
                    <div class="period-actions">
                        <button class="icon-btn" onclick="editPeriod(${index})" title="Edit">✏️</button>
                        <button class="icon-btn" onclick="deletePeriod(${index})" title="Delete">🗑️</button>
                        <button class="icon-btn" onclick="movePeriodUp(${index})" ${index === 0 ? 'disabled' : ''} title="Move Up">⬆️</button>
                        <button class="icon-btn" onclick="movePeriodDown(${index})" ${index === currentTimetable.periods.length - 1 ? 'disabled' : ''} title="Move Down">⬇️</button>
                    </div>
                </div>
                <div class="period-details">
                    <span class="time-badge">⏰ ${period.startTime} - ${period.endTime}</span>
                    <span class="duration-badge">⏱️ ${calculateDuration(period.startTime, period.endTime)} min</span>
                    ${isBreak ? '<span class="break-badge">☕ Break</span>' : ''}
                </div>
            </div>
        `;
    });
    html += '</div>';

    // Add period button
    html += '<button class="btn btn-primary" onclick="addNewPeriod()" style="width: 100%; margin-top: 20px;">➕ Add New Period</button>';

    html += '</div>';

    modalBody.innerHTML = html;
    openModal();
}

function calculateDuration(startTime, endTime) {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return endMinutes - startMinutes;
}

function editPeriod(index) {
    const period = currentTimetable.periods[index];
    const isBreak = currentTimetable.timetable.monday[index]?.isBreak || false;

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>✏️ Edit Period ${period.number}</h2>
        <form id="editPeriodForm">
            <div class="form-group">
                <label>Period Number</label>
                <input type="number" id="periodNumber" class="form-input" value="${period.number}" min="1" required>
            </div>
            <div class="form-group">
                <label>Start Time</label>
                <input type="time" id="startTime" class="form-input" value="${period.startTime}" required>
            </div>
            <div class="form-group">
                <label>End Time</label>
                <input type="time" id="endTime" class="form-input" value="${period.endTime}" required>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="isBreak" ${isBreak ? 'checked' : ''}>
                    Mark as Break Period
                </label>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">💾 Save Changes</button>
                <button type="button" class="btn btn-secondary" onclick="showPeriodSettings()">❌ Cancel</button>
            </div>
        </form>
    `;

    document.getElementById('editPeriodForm').addEventListener('submit', (e) => {
        e.preventDefault();
        savePeriodEdit(index);
    });
}

function savePeriodEdit(index) {
    const periodNumber = parseInt(document.getElementById('periodNumber').value);
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const isBreak = document.getElementById('isBreak').checked;

    // Validate times
    if (startTime >= endTime) {
        showNotification('End time must be after start time', 'error');
        return;
    }

    saveToHistory();

    // Update period timing
    currentTimetable.periods[index] = {
        number: periodNumber,
        startTime,
        endTime
    };

    // Update break status in all days
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    dayKeys.forEach(day => {
        if (currentTimetable.timetable[day][index]) {
            currentTimetable.timetable[day][index].isBreak = isBreak;
            if (isBreak && !currentTimetable.timetable[day][index].subject.includes('Break')) {
                currentTimetable.timetable[day][index].subject = 'Break';
            }
        }
    });

    showNotification('Period updated successfully', 'success');
    showPeriodSettings();
}

function addNewPeriod() {
    const modalBody = document.getElementById('modalBody');

    // Calculate suggested time based on last period
    const lastPeriod = currentTimetable.periods[currentTimetable.periods.length - 1];
    const suggestedStart = lastPeriod ? lastPeriod.endTime : '09:00';
    const [h, m] = suggestedStart.split(':').map(Number);
    const suggestedEnd = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    modalBody.innerHTML = `
        <h2>➕ Add New Period</h2>
        <form id="addPeriodForm">
            <div class="form-group">
                <label>Period Number</label>
                <input type="number" id="newPeriodNumber" class="form-input" value="${currentTimetable.periods.length + 1}" min="1" required>
            </div>
            <div class="form-group">
                <label>Start Time</label>
                <input type="time" id="newStartTime" class="form-input" value="${suggestedStart}" required>
            </div>
            <div class="form-group">
                <label>End Time</label>
                <input type="time" id="newEndTime" class="form-input" value="${suggestedEnd}" required>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="newIsBreak">
                    Mark as Break Period
                </label>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">➕ Add Period</button>
                <button type="button" class="btn btn-secondary" onclick="showPeriodSettings()">❌ Cancel</button>
            </div>
        </form>
    `;

    document.getElementById('addPeriodForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveNewPeriod();
    });
}

function saveNewPeriod() {
    const periodNumber = parseInt(document.getElementById('newPeriodNumber').value);
    const startTime = document.getElementById('newStartTime').value;
    const endTime = document.getElementById('newEndTime').value;
    const isBreak = document.getElementById('newIsBreak').checked;

    // Validate times
    if (startTime >= endTime) {
        showNotification('End time must be after start time', 'error');
        return;
    }

    saveToHistory();

    // Add new period
    currentTimetable.periods.push({
        number: periodNumber,
        startTime,
        endTime
    });

    // Add period slot to all days
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    dayKeys.forEach(day => {
        currentTimetable.timetable[day].push({
            period: periodNumber,
            subject: isBreak ? 'Break' : '',
            room: '',
            isBreak: isBreak,
            teacher: '',
            color: ''
        });
    });

    showNotification('Period added successfully', 'success');
    renderAdvancedTimetableEditor(currentTimetable);
    showPeriodSettings();
}

function deletePeriod(index) {
    if (currentTimetable.periods.length <= 1) {
        showNotification('Cannot delete the last period', 'error');
        return;
    }

    if (!confirm(`Are you sure you want to delete Period ${currentTimetable.periods[index].number}? This will remove it from all days.`)) {
        return;
    }

    saveToHistory();

    // Remove period
    currentTimetable.periods.splice(index, 1);

    // Remove period from all days
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    dayKeys.forEach(day => {
        currentTimetable.timetable[day].splice(index, 1);
    });

    // Renumber remaining periods
    currentTimetable.periods.forEach((period, idx) => {
        period.number = idx + 1;
        dayKeys.forEach(day => {
            currentTimetable.timetable[day][idx].period = idx + 1;
        });
    });

    showNotification('Period deleted successfully', 'success');
    renderAdvancedTimetableEditor(currentTimetable);
    showPeriodSettings();
}

function movePeriodUp(index) {
    if (index === 0) return;

    saveToHistory();

    // Swap periods
    [currentTimetable.periods[index], currentTimetable.periods[index - 1]] =
        [currentTimetable.periods[index - 1], currentTimetable.periods[index]];

    // Swap in all days
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    dayKeys.forEach(day => {
        [currentTimetable.timetable[day][index], currentTimetable.timetable[day][index - 1]] =
            [currentTimetable.timetable[day][index - 1], currentTimetable.timetable[day][index]];
    });

    // Renumber
    currentTimetable.periods.forEach((period, idx) => {
        period.number = idx + 1;
        dayKeys.forEach(day => {
            currentTimetable.timetable[day][idx].period = idx + 1;
        });
    });

    showNotification('Period moved up', 'success');
    renderAdvancedTimetableEditor(currentTimetable);
    showPeriodSettings();
}

function movePeriodDown(index) {
    if (index === currentTimetable.periods.length - 1) return;

    saveToHistory();

    // Swap periods
    [currentTimetable.periods[index], currentTimetable.periods[index + 1]] =
        [currentTimetable.periods[index + 1], currentTimetable.periods[index]];

    // Swap in all days
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    dayKeys.forEach(day => {
        [currentTimetable.timetable[day][index], currentTimetable.timetable[day][index + 1]] =
            [currentTimetable.timetable[day][index + 1], currentTimetable.timetable[day][index]];
    });

    // Renumber
    currentTimetable.periods.forEach((period, idx) => {
        period.number = idx + 1;
        dayKeys.forEach(day => {
            currentTimetable.timetable[day][idx].period = idx + 1;
        });
    });

    showNotification('Period moved down', 'success');
    renderAdvancedTimetableEditor(currentTimetable);
    showPeriodSettings();
}

// Inline Period Time Editing
function editPeriodTime(index, currentStart, currentEnd) {
    const modalBody = document.getElementById('modalBody');
    const isBreak = currentTimetable.timetable.monday[index]?.isBreak || false;

    modalBody.innerHTML = `
        <h2>⏰ Edit Period ${index + 1} Timing</h2>
        <form id="editTimeForm">
            <div class="form-group">
                <label>Start Time</label>
                <input type="time" id="editStartTime" class="form-input" value="${currentStart}" required>
            </div>
            <div class="form-group">
                <label>End Time</label>
                <input type="time" id="editEndTime" class="form-input" value="${currentEnd}" required>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="editIsBreak" ${isBreak ? 'checked' : ''}>
                    Mark as Break Period
                </label>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">💾 Save</button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;

    document.getElementById('editTimeForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const newStart = document.getElementById('editStartTime').value;
        const newEnd = document.getElementById('editEndTime').value;
        const isBreak = document.getElementById('editIsBreak').checked;

        if (newStart >= newEnd) {
            showNotification('End time must be after start time', 'error');
            return;
        }

        saveToHistory();
        currentTimetable.periods[index].startTime = newStart;
        currentTimetable.periods[index].endTime = newEnd;

        // Update break status
        const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        dayKeys.forEach(day => {
            if (currentTimetable.timetable[day][index]) {
                currentTimetable.timetable[day][index].isBreak = isBreak;
                if (isBreak && !currentTimetable.timetable[day][index].subject.includes('Break')) {
                    currentTimetable.timetable[day][index].subject = 'Break';
                }
            }
        });

        renderAdvancedTimetableEditor(currentTimetable);
        closeModal();
        showNotification('Period timing updated', 'success');
    });

    openModal();
}

function addNewPeriodInline() {
    const lastPeriod = currentTimetable.periods[currentTimetable.periods.length - 1];
    const suggestedStart = lastPeriod ? lastPeriod.endTime : '09:00';
    const [h, m] = suggestedStart.split(':').map(Number);
    const suggestedEnd = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>➕ Add New Period</h2>
        <form id="addPeriodForm">
            <div class="form-group">
                <label>Start Time</label>
                <input type="time" id="newStartTime" class="form-input" value="${suggestedStart}" required>
            </div>
            <div class="form-group">
                <label>End Time</label>
                <input type="time" id="newEndTime" class="form-input" value="${suggestedEnd}" required>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="newIsBreak">
                    Mark as Break Period
                </label>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">➕ Add</button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;

    document.getElementById('addPeriodForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const startTime = document.getElementById('newStartTime').value;
        const endTime = document.getElementById('newEndTime').value;
        const isBreak = document.getElementById('newIsBreak').checked;

        if (startTime >= endTime) {
            showNotification('End time must be after start time', 'error');
            return;
        }

        saveToHistory();

        const newPeriodNumber = currentTimetable.periods.length + 1;
        currentTimetable.periods.push({
            number: newPeriodNumber,
            startTime,
            endTime
        });

        const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        dayKeys.forEach(day => {
            currentTimetable.timetable[day].push({
                period: newPeriodNumber,
                subject: isBreak ? 'Break' : '',
                room: '',
                isBreak: isBreak,
                teacher: '',
                color: ''
            });
        });

        renderAdvancedTimetableEditor(currentTimetable);
        closeModal();
        showNotification('Period added successfully', 'success');
    });

    openModal();
}


// ============================================
// CALENDAR MANAGEMENT
// ============================================

let currentCalendarDate = new Date();
let holidays = [];
let academicEvents = [];

// Calendar Schema for MongoDB
const holidaySchema = {
    date: Date,
    name: String,
    type: String, // 'holiday', 'exam', 'event'
    description: String,
    color: String
};

async function loadCalendar() {
    await loadHolidays();
    renderCalendar();
    renderHolidaysList();
}

async function loadHolidays() {
    try {
        const response = await fetch(`${SERVER_URL}/api/holidays`);
        const data = await response.json();
        if (data.success) {
            holidays = data.holidays || [];
        }
    } catch (error) {
        console.log('Error loading holidays:', error);
        // Use default holidays if server fails
        holidays = getDefaultHolidays();
    }
}

function getDefaultHolidays() {
    const year = new Date().getFullYear();
    return [
        // National Holidays
        { date: new Date(year, 0, 26), name: 'Republic Day', type: 'holiday', color: '#ff6b6b', description: 'National Holiday' },
        { date: new Date(year, 7, 15), name: 'Independence Day', type: 'holiday', color: '#ff6b6b', description: 'National Holiday' },
        { date: new Date(year, 9, 2), name: 'Gandhi Jayanti', type: 'holiday', color: '#ff6b6b', description: 'National Holiday' },
        
        // Religious Holidays (2025 dates - update yearly)
        { date: new Date(year, 2, 14), name: 'Holi', type: 'holiday', color: '#e74c3c', description: 'Festival of Colors' },
        { date: new Date(year, 2, 29), name: 'Good Friday', type: 'holiday', color: '#9b59b6', description: 'Christian Holiday' },
        { date: new Date(year, 3, 10), name: 'Eid ul-Fitr', type: 'holiday', color: '#27ae60', description: 'Islamic Festival' },
        { date: new Date(year, 3, 14), name: 'Mahavir Jayanti', type: 'holiday', color: '#f39c12', description: 'Jain Festival' },
        { date: new Date(year, 3, 21), name: 'Ram Navami', type: 'holiday', color: '#e67e22', description: 'Hindu Festival' },
        { date: new Date(year, 4, 23), name: 'Buddha Purnima', type: 'holiday', color: '#3498db', description: 'Buddhist Festival' },
        { date: new Date(year, 5, 16), name: 'Eid ul-Adha', type: 'holiday', color: '#27ae60', description: 'Islamic Festival' },
        { date: new Date(year, 7, 15), name: 'Raksha Bandhan', type: 'holiday', color: '#e74c3c', description: 'Hindu Festival' },
        { date: new Date(year, 7, 26), name: 'Janmashtami', type: 'holiday', color: '#3498db', description: 'Hindu Festival' },
        { date: new Date(year, 8, 15), name: 'Ganesh Chaturthi', type: 'holiday', color: '#e67e22', description: 'Hindu Festival' },
        { date: new Date(year, 9, 2), name: 'Dussehra', type: 'holiday', color: '#e74c3c', description: 'Hindu Festival' },
        { date: new Date(year, 9, 20), name: 'Diwali', type: 'holiday', color: '#f39c12', description: 'Festival of Lights' },
        { date: new Date(year, 10, 5), name: 'Guru Nanak Jayanti', type: 'holiday', color: '#3498db', description: 'Sikh Festival' },
        { date: new Date(year, 11, 25), name: 'Christmas', type: 'holiday', color: '#e74c3c', description: 'Christian Holiday' },
        
        // Academic Events
        { date: new Date(year, 0, 1), name: 'New Year', type: 'event', color: '#9b59b6', description: 'New Year Celebration' },
        { date: new Date(year, 1, 5), name: 'Semester Start', type: 'event', color: '#3498db', description: 'Even Semester Begins' },
        { date: new Date(year, 6, 15), name: 'Semester Start', type: 'event', color: '#3498db', description: 'Odd Semester Begins' },
    ];
}

function renderCalendar() {
    const calendar = document.getElementById('adminCalendar');
    const monthYear = document.getElementById('calendarMonthYear');
    
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    
    monthYear.textContent = `${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    let html = '<div class="calendar-grid">';
    
    // Day headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        html += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // Empty cells before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
        html += '<div class="calendar-cell empty"></div>';
    }
    
    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toDateString();
        const today = new Date().toDateString() === dateStr;
        const holiday = holidays.find(h => new Date(h.date).toDateString() === dateStr);
        const isSunday = date.getDay() === 0;
        
        html += `<div class="calendar-cell ${today ? 'today' : ''} ${holiday ? 'has-event' : ''} ${isSunday ? 'sunday' : ''}" 
                      onclick="selectDate('${dateStr}')"
                      style="${holiday ? `border-left: 4px solid ${holiday.color}` : ''}">
            <div class="calendar-date">${day}</div>
            ${holiday ? `<div class="calendar-event" style="background: ${holiday.color}">${holiday.name}</div>` : ''}
        </div>`;
    }
    
    html += '</div>';
    calendar.innerHTML = html;
}

function renderHolidaysList() {
    const list = document.getElementById('holidaysList');
    
    // Sort holidays by date
    const sortedHolidays = [...holidays].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let html = '';
    sortedHolidays.forEach((holiday, index) => {
        const date = new Date(holiday.date);
        // Use Indian date format: DD MMM YYYY
        const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const dayName = date.toLocaleDateString('en-IN', { weekday: 'short' });
        
        html += `
            <div class="holiday-item" style="border-left: 4px solid ${holiday.color}">
                <div class="holiday-info">
                    <div class="holiday-name">${holiday.name}</div>
                    <div class="holiday-date">${dayName}, ${dateStr}</div>
                    ${holiday.description ? `<div class="holiday-desc">${holiday.description}</div>` : ''}
                </div>
                <div class="holiday-actions">
                    <button class="icon-btn" onclick="editHoliday(${index})" title="Edit">✏️</button>
                    <button class="icon-btn" onclick="deleteHoliday(${index})" title="Delete">🗑️</button>
                </div>
            </div>
        `;
    });
    
    if (sortedHolidays.length === 0) {
        html = '<div class="no-holidays">No holidays added yet. Click "Add Holiday" to get started.</div>';
    }
    
    list.innerHTML = html;
}

function previousMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
}

function selectDate(dateStr) {
    const date = new Date(dateStr);
    const holiday = holidays.find(h => new Date(h.date).toDateString() === dateStr);
    
    if (holiday) {
        showHolidayDetails(holiday);
    } else {
        showAddHolidayModal(date);
    }
}

document.getElementById('addHolidayBtn').addEventListener('click', () => {
    showAddHolidayModal(new Date());
});

function showAddHolidayModal(date = new Date()) {
    const modalBody = document.getElementById('modalBody');
    const dateStr = date.toISOString().split('T')[0];
    
    modalBody.innerHTML = `
        <h2>➕ Add Holiday/Event</h2>
        <form id="holidayForm">
            <div class="form-group">
                <label>Date *</label>
                <input type="date" id="holidayDate" class="form-input" value="${dateStr}" required>
            </div>
            <div class="form-group">
                <label>Name *</label>
                <input type="text" id="holidayName" class="form-input" placeholder="e.g., Diwali" required>
            </div>
            <div class="form-group">
                <label>Type *</label>
                <select id="holidayType" class="form-select" required>
                    <option value="holiday">🏖️ Holiday</option>
                    <option value="exam">📝 Exam</option>
                    <option value="event">🎉 Event</option>
                </select>
            </div>
            <div class="form-group">
                <label>Color</label>
                <div class="color-picker">
                    <input type="color" id="holidayColor" value="#ff6b6b">
                    <span class="color-label">Choose color</span>
                </div>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="holidayDescription" class="form-textarea" rows="3" placeholder="Optional description"></textarea>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">➕ Add</button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">❌ Cancel</button>
            </div>
        </form>
    `;
    
    document.getElementById('holidayForm').addEventListener('submit', handleAddHoliday);
    openModal();
}

async function handleAddHoliday(e) {
    e.preventDefault();
    
    const holiday = {
        date: new Date(document.getElementById('holidayDate').value),
        name: document.getElementById('holidayName').value,
        type: document.getElementById('holidayType').value,
        color: document.getElementById('holidayColor').value,
        description: document.getElementById('holidayDescription').value
    };
    
    try {
        const response = await fetch(`${SERVER_URL}/api/holidays`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(holiday)
        });
        
        if (response.ok) {
            holidays.push(holiday);
            renderCalendar();
            renderHolidaysList();
            closeModal();
            showNotification('Holiday added successfully', 'success');
        }
    } catch (error) {
        // Fallback to local storage
        holidays.push(holiday);
        localStorage.setItem('holidays', JSON.stringify(holidays));
        renderCalendar();
        renderHolidaysList();
        closeModal();
        showNotification('Holiday added (saved locally)', 'success');
    }
}

function editHoliday(index) {
    const holiday = holidays[index];
    const modalBody = document.getElementById('modalBody');
    const dateStr = new Date(holiday.date).toISOString().split('T')[0];
    
    modalBody.innerHTML = `
        <h2>✏️ Edit Holiday/Event</h2>
        <form id="editHolidayForm">
            <div class="form-group">
                <label>Date *</label>
                <input type="date" id="editHolidayDate" class="form-input" value="${dateStr}" required>
            </div>
            <div class="form-group">
                <label>Name *</label>
                <input type="text" id="editHolidayName" class="form-input" value="${holiday.name}" required>
            </div>
            <div class="form-group">
                <label>Type *</label>
                <select id="editHolidayType" class="form-select" required>
                    <option value="holiday" ${holiday.type === 'holiday' ? 'selected' : ''}>🏖️ Holiday</option>
                    <option value="exam" ${holiday.type === 'exam' ? 'selected' : ''}>📝 Exam</option>
                    <option value="event" ${holiday.type === 'event' ? 'selected' : ''}>🎉 Event</option>
                </select>
            </div>
            <div class="form-group">
                <label>Color</label>
                <input type="color" id="editHolidayColor" value="${holiday.color || '#ff6b6b'}">
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="editHolidayDescription" class="form-textarea" rows="3">${holiday.description || ''}</textarea>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">💾 Save</button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">❌ Cancel</button>
            </div>
        </form>
    `;
    
    document.getElementById('editHolidayForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveHolidayEdit(index);
    });
    openModal();
}

async function saveHolidayEdit(index) {
    holidays[index] = {
        date: new Date(document.getElementById('editHolidayDate').value),
        name: document.getElementById('editHolidayName').value,
        type: document.getElementById('editHolidayType').value,
        color: document.getElementById('editHolidayColor').value,
        description: document.getElementById('editHolidayDescription').value
    };
    
    try {
        await fetch(`${SERVER_URL}/api/holidays/${index}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(holidays[index])
        });
    } catch (error) {
        localStorage.setItem('holidays', JSON.stringify(holidays));
    }
    
    renderCalendar();
    renderHolidaysList();
    closeModal();
    showNotification('Holiday updated', 'success');
}

async function deleteHoliday(index) {
    if (!confirm('Are you sure you want to delete this holiday?')) return;
    
    try {
        await fetch(`${SERVER_URL}/api/holidays/${index}`, { method: 'DELETE' });
    } catch (error) {
        console.log('Error deleting holiday:', error);
    }
    
    holidays.splice(index, 1);
    localStorage.setItem('holidays', JSON.stringify(holidays));
    renderCalendar();
    renderHolidaysList();
    showNotification('Holiday deleted', 'success');
}

function showHolidayDetails(holiday) {
    const modalBody = document.getElementById('modalBody');
    const date = new Date(holiday.date);
    // Use Indian date format
    const dateStr = date.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    modalBody.innerHTML = `
        <div class="holiday-details">
            <div class="holiday-icon" style="background: ${holiday.color}">
                ${holiday.type === 'holiday' ? '🏖️' : holiday.type === 'exam' ? '📝' : '🎉'}
            </div>
            <h2>${holiday.name}</h2>
            <p class="holiday-date-full">${dateStr}</p>
            ${holiday.description ? `<p class="holiday-description">${holiday.description}</p>` : ''}
            <div class="holiday-type-badge" style="background: ${holiday.color}20; color: ${holiday.color}">
                ${holiday.type.toUpperCase()}
            </div>
        </div>
    `;
    openModal();
}

// Academic Year Settings (Indian Academic Calendar)
function showAcademicYearSettings() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>📅 Academic Year Settings</h2>
        <p style="color: var(--text-secondary); margin-bottom: 16px;">
            Indian academic year typically runs from July to June
        </p>
        <form id="academicYearForm">
            <div class="form-group">
                <label>Academic Year</label>
                <input type="text" class="form-input" value="2024-2025" placeholder="e.g., 2024-2025">
            </div>
            <div class="form-group">
                <label>Start Date (Usually July)</label>
                <input type="date" class="form-input" value="2024-07-01">
            </div>
            <div class="form-group">
                <label>End Date (Usually June)</label>
                <input type="date" class="form-input" value="2025-06-30">
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" checked> Include Indian Holidays
                </label>
            </div>
            <button type="submit" class="btn btn-primary">💾 Save</button>
        </form>
    `;
    openModal();
}

// Semester Dates
function showSemesterDates() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>📆 Semester Dates</h2>
        <div class="semester-dates-list">
            <div class="semester-date-item">
                <h4>Semester 1 (Odd)</h4>
                <input type="date" class="form-input" placeholder="Start Date">
                <input type="date" class="form-input" placeholder="End Date">
            </div>
            <div class="semester-date-item">
                <h4>Semester 2 (Even)</h4>
                <input type="date" class="form-input" placeholder="Start Date">
                <input type="date" class="form-input" placeholder="End Date">
            </div>
        </div>
        <button class="btn btn-primary">💾 Save Dates</button>
    `;
    openModal();
}

// Exam Schedule
function showExamSchedule() {
    showNotification('Exam Schedule feature coming soon!', 'info');
}

// Event Manager
function showEventManager() {
    showNotification('Event Manager feature coming soon!', 'info');
}

// Bulk Import Holidays
function bulkImportHolidays() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>📥 Bulk Import Holidays</h2>
        <p>Upload a CSV file with columns: date, name, type, color, description</p>
        <input type="file" accept=".csv" class="form-input" id="holidayCSV">
        <button class="btn btn-primary" onclick="processHolidayCSV()">Import</button>
    `;
    openModal();
}

function processHolidayCSV() {
    showNotification('CSV import feature coming soon!', 'info');
}
