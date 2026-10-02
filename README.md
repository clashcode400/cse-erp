# Computer Science & Engineering (CSE) Department ERP Portal

A full-stack, enterprise-grade academic ERP system designed exclusively for the **Computer Science & Engineering Department**. Built with a **React + Tailwind CSS + Recharts** frontend and a **Django REST Framework + SimpleJWT** backend.

---

## 🏛️ System Architecture & Scope

- **Department Scope**: Exclusively Computer Science & Engineering (CSE).
- **Frontend**: React 18, Vite, Tailwind CSS v3, Recharts, Lucide Icons, Plus Jakarta Sans typography.
- **Backend**: Django 6.1, Django REST Framework 3.18, SimpleJWT, SQLite (default zero-config) / PostgreSQL (configurable via environment variables).
- **Security & Authorization**: Enforced at the DRF permission class layer on the server. Student write attempts return `403 Forbidden`. Admin role write attempts on marks/attendance return `403 Forbidden`. Every faculty modification writes an immutable `AuditLog` entry.

---

## 🔐 Roles & Permission Matrix

| Role | Academic Read | Academic Write (Marks, Attendance, Grades, Tasks) | Account Admin (Create/Deactivate) | Backend Permission Class |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | **Read-Only** (Only their own records) | ❌ **FORBIDDEN (403)** | ❌ **FORBIDDEN (403)** | `AcademicDataPermission`, `StudentSelfOnly` |
| **Faculty** | ✅ **Full Read** | ✅ **ALLOWED (The ONLY role with write access)** | ❌ **FORBIDDEN (403)** | `AcademicDataPermission` |
| **Admin** | ✅ **Read Monitor** | ❌ **FORBIDDEN (403 - Cannot edit marks or attendance)** | ✅ **ALLOWED** | `UserManagementOnlyAdmin` |

### 🛡️ Audit Logging
Every modification made by Faculty or Administrative users triggers an immutable log entry in `AuditLog` capturing:
- `user` (Foreign key to User)
- `user_name` & `user_role`
- `action` (e.g. `SAVE_ATTENDANCE_SESSION`, `UPDATE_INTERNAL_MARKS`, `BULK_SAVE_SEMESTER_GRADES`, `CREATE_ASSIGNMENT`, `POST_NOTICE`)
- `model_name` & `record_id`
- `old_value` (JSON snapshot of previous state)
- `new_value` (JSON snapshot of modified state)
- `timestamp` & `ip_address`

---

## 📐 Formulas & Server-Side Calculations

1. **Overall & Subject Attendance Percentage**:
   $$\text{Attendance \%} = \frac{\text{Attended Classes (Present + On-Duty)}}{\text{Total Conducted Classes}} \times 100$$
   *If attendance is below 75.0%, the portal prominently displays a Coral Alert (`#FF7A6B`) warning banner.*

2. **Continuous Internal Assessment (CIA) Percentage**:
   $$\text{Internal \%} = \frac{\sum \text{Marks Obtained}}{\sum \text{Maximum Marks}} \times 100$$

3. **Cumulative Grade Point Average (CGPA)**:
   $$\text{CGPA} = \frac{\sum (\text{Course Credits} \times \text{Grade Point})}{\sum \text{Course Credits}}$$
   *Standard Grade Scale:*
   - **O** = 10 pts (90–100%)
   - **A+** = 9 pts (80–89.9%)
   - **A** = 8 pts (70–79.9%)
   - **B+** = 7 pts (60–69.9%)
   - **B** = 6 pts (55–59.9%)
   - **C** = 5 pts (50–54.9%)
   - **U** = 0 pts (Fail / Reappear, < 50%)

4. **Overall Total Percentage**:
   $$\text{Overall Percentage} = \frac{\sum \text{Total Marks Obtained across all courses}}{\sum \text{Total Maximum Marks}} \times 100$$

---

## 📂 Project Directory Structure

```
cse-erp/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── erp_backend/
│   │   ├── __init__.py
│   │   ├── settings.py           # SimpleJWT, CORS, Custom User, DRF config
│   │   ├── urls.py               # Root URL router
│   │   ├── wsgi.py
│   │   └── asgi.py
│   └── core/
│       ├── models.py             # User, StudentProfile, FacultyProfile, Subject,
│       │                         # AttendanceSession, AttendanceRecord, InternalAssessment,
│       │                         # InternalMark, SemesterResult, SubjectGrade, Assignment,
│       │                         # AssignmentSubmission, Project, ProjectReview, Notice, AuditLog
│       ├── serializers.py        # DRF serializers for all domain models
│       ├── permissions.py        # Strict role permissions (Student write -> 403)
│       ├── services.py           # Calculations (CGPA, Attendance %, Submission Pending)
│       ├── views.py              # API views for Auth, Student, Faculty, Admin, Audit
│       ├── urls.py               # Endpoint routes (/api/...)
│       ├── tests.py              # Automated test suite for permissions & validation
│       └── management/
│           └── commands/
│               └── seed_data.py  # Rich fictional CSE department seed generator
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js        # Design tokens: Cloud, Ink, Primary, Aqua, Coral, Amber
    ├── tsconfig.json
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx               # Root view router
    │   ├── index.css             # Glassmorphism, Plus Jakarta Sans, scrollbars
    │   ├── types/
    │   │   └── index.ts          # Complete TypeScript interfaces
    │   ├── context/
    │   │   ├── AuthContext.tsx   # JWT session, quick role-switchers
    │   │   └── ThemeContext.tsx  # Dark & Light theme with persistence
    │   ├── services/
    │   │   └── api.ts            # Axios client with JWT interceptor
    │   ├── components/
    │   │   ├── common/
    │   │   │   ├── Navbar.tsx
    │   │   │   ├── Sidebar.tsx
    │   │   │   ├── MobileBottomBar.tsx
    │   │   │   ├── StatCard.tsx
    │   │   │   ├── CircularProgress.tsx
    │   │   │   ├── Badge.tsx
    │   │   │   └── Toast.tsx
    │   │   ├── student/
    │   │   │   ├── StudentProfileHeader.tsx
    │   │   │   ├── AttendanceCard.tsx
    │   │   │   ├── CgpaTrendChart.tsx
    │   │   │   ├── InternalMarksTable.tsx
    │   │   │   ├── SemesterResultsCard.tsx
    │   │   │   ├── SubmissionPendingPanel.tsx
    │   │   │   ├── AssignmentsList.tsx
    │   │   │   ├── ProjectsList.tsx
    │   │   │   └── NoticesSection.tsx
    │   │   ├── faculty/
    │   │   │   └── FacultyPortal.tsx       # Spreadsheet table with bulk save & validation
    │   │   └── admin/
    │   │       ├── AdminPortal.tsx         # Account management & deactivation
    │   │       └── AuditLogViewer.tsx      # Old/New state diff inspection
    │   └── pages/
    │       └── StudentDashboard.tsx
```

---

## 🌐 API Endpoint Reference

| Method | Endpoint | Description | Role Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login/` | Obtains JWT pair and role details | Public |
| `GET` | `/api/auth/me/` | Retrieves active user and linked profile | Authenticated |
| `GET` | `/api/auth/demo-accounts/` | List of seeded fictional accounts for quick-login | Public |
| `GET` | `/api/student/dashboard/` | Complete consolidated academic dashboard | Student (self) / Faculty / Admin |
| `GET` | `/api/student/attendance/` | Overall and subject-wise attendance breakdown | Student (self) / Faculty / Admin |
| `GET` | `/api/student/marks/` | Internal marks, periodic tests, and progress | Student (self) / Faculty / Admin |
| `GET` | `/api/student/results/` | End-semester SGPA and transcript grades | Student (self) / Faculty / Admin |
| `POST` | `/api/student/submissions/<id>/submit/` | Submit assignment repository URL / text | Student (own work only) |
| `GET` | `/api/faculty/classes/` | Subject and class rosters for faculty pickers | Faculty |
| `GET` | `/api/faculty/attendance/sheet/` | Spreadsheet roster for date, subject, section | Faculty |
| `POST` | `/api/faculty/attendance/sheet/` | Bulk save attendance (No future dates allowed) | **Faculty ONLY (403 for others)** |
| `GET` | `/api/faculty/marks/sheet/` | Spreadsheet roster for assessment marks | Faculty |
| `POST` | `/api/faculty/marks/sheet/` | Bulk save internal marks (validates $\le$ max) | **Faculty ONLY (403 for others)** |
| `GET` | `/api/faculty/semester-marks/sheet/` | Semester internal/external marks sheet | Faculty |
| `POST` | `/api/faculty/semester-marks/sheet/` | Bulk save semester grades and recalculate CGPA | **Faculty ONLY (403 for others)** |
| `POST` | `/api/faculty/assignments/` | Create and distribute new coursework assignment | **Faculty ONLY (403 for others)** |
| `POST` | `/api/faculty/submissions/<id>/grade/` | Grade student submission with marks & feedback | **Faculty ONLY (403 for others)** |
| `POST` | `/api/faculty/notices/` | Post department circulars with pinned status | **Faculty ONLY (403 for others)** |
| `GET` | `/api/admin/users/` | List all student, faculty, and admin accounts | Admin |
| `POST` | `/api/admin/users/` | Create student or faculty user accounts | **Admin ONLY (403 for others)** |
| `PATCH` | `/api/admin/users/<id>/toggle/` | Activate or deactivate user account | **Admin ONLY (403 for others)** |
| `GET` | `/api/admin/audit-logs/` | View complete audit trail of faculty changes | Admin / Faculty |

---

## 🚀 Quickstart & Running Locally

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
cd backend
# Create virtual environment
python -m venv ../venv
# Activate virtual environment
# Windows: ..\venv\Scripts\activate | Unix: source ../venv/bin/activate
pip install -r requirements.txt

# Run migrations and seed data
python manage.py makemigrations core
python manage.py migrate
python manage.py seed_data

# Run automated permission tests
python manage.py test core

# Start server
python manage.py runserver 127.0.0.1:8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```
Open **`http://127.0.0.1:5173`** in your browser.

---

## 👥 Seeded Demonstration Accounts

| Role | Username | Password | Persona & Test Scenario |
| :--- | :--- | :--- | :--- |
| **Student** | `student_rohit` | `StudentPassword123!` | Rohit Verma (Year 3 CSE) • 88% Attendance • 8.85 CGPA |
| **Student** | `student_arjun` | `StudentPassword123!` | Arjun Patel (Year 3 CSE) • **65% Low Attendance Alert** (Triggers Coral Warning `#FF7A6B`) |
| **Student** | `student_sneha` | `StudentPassword123!` | Sneha Kulkarni • 96% Attendance • 9.45 CGPA |
| **Faculty** | `faculty_ananya` | `FacultyPassword123!` | Dr. Ananya Sharma (Associate Professor, ML & Algorithms) |
| **Faculty** | `faculty_hod` | `FacultyPassword123!` | Dr. K. Ramanathan (Professor & HOD, Cloud Computing) |
| **Admin** | `admin_user` | `AdminPassword123!` | Dr. Rajesh Narayanan (System Admin - Accounts & Audit only) |
