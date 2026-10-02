import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000/api`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT access token to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Global response interceptor for 401 Unauthorized handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired/invalid
      if (!error.config.url.includes('/auth/login/')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (credentials: { username: string; password: string }) => {
    const res = await api.post('/auth/login/', credentials);
    if (res.data.access) {
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
    }
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await api.get('/auth/me/');
    return res.data;
  },
  getDemoAccounts: async () => {
    const res = await api.get('/auth/demo-accounts/');
    return res.data;
  },
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
  selfRegister: async (payload: {
    register_no: string;
    username: string;
    password: string;
    full_name: string;
    email?: string;
    phone?: string;
  }) => {
    const res = await api.post('/auth/register/', payload);
    return res.data;
  },
  checkRegistrationStatus: async (register_no: string) => {
    const res = await api.get('/auth/register/', { params: { register_no } });
    return res.data;
  },
};

export const studentService = {
  getDashboard: async (studentId?: number) => {
    const params = studentId ? { student_id: studentId } : {};
    const res = await api.get('/student/dashboard/', { params });
    return res.data;
  },
  getAttendance: async (studentId?: number) => {
    const params = studentId ? { student_id: studentId } : {};
    const res = await api.get('/student/attendance/', { params });
    return res.data;
  },
  getMarks: async (studentId?: number) => {
    const params = studentId ? { student_id: studentId } : {};
    const res = await api.get('/student/marks/', { params });
    return res.data;
  },
  getResults: async (studentId?: number) => {
    const params = studentId ? { student_id: studentId } : {};
    const res = await api.get('/student/results/', { params });
    return res.data;
  },
  submitAssignment: async (submissionId: number, data: { submission_text?: string; file_url?: string }) => {
    const res = await api.post(`/student/submissions/${submissionId}/submit/`, data);
    return res.data;
  }
};

export const facultyService = {
  getClassesAndSubjects: async () => {
    const res = await api.get('/faculty/classes/');
    return res.data;
  },
  getAttendanceSheet: async (params: { subject_id?: number; date?: string; year?: number; section?: string }) => {
    const res = await api.get('/faculty/attendance/sheet/', { params });
    return res.data;
  },
  saveAttendanceSheet: async (payload: {
    subject_id: number;
    date: string;
    session_slot?: string;
    topic?: string;
    year: number;
    section: string;
    roster: Array<{ student_id: number; status: string }>;
  }) => {
    const res = await api.post('/faculty/attendance/sheet/', payload);
    return res.data;
  },
  getMarksSheet: async (params: { subject_id?: number; assessment_id?: number; year?: number; section?: string }) => {
    const res = await api.get('/faculty/marks/sheet/', { params });
    return res.data;
  },
  saveMarksSheet: async (payload: {
    assessment_id: number;
    roster: Array<{ student_id: number; marks_obtained: number; is_absent?: boolean; remarks?: string }>;
  }) => {
    const res = await api.post('/faculty/marks/sheet/', payload);
    return res.data;
  },
  getSemesterMarksSheet: async (params: { semester?: number; subject_id?: number; year?: number; section?: string }) => {
    const res = await api.get('/faculty/semester-marks/sheet/', { params });
    return res.data;
  },
  saveSemesterMarksSheet: async (payload: {
    semester: number;
    subject_id: number;
    roster: Array<{
      student_id: number;
      internal_marks: number;
      external_marks: number;
      grade: string;
    }>;
  }) => {
    const res = await api.post('/faculty/semester-marks/sheet/', payload);
    return res.data;
  },
  getAssignments: async () => {
    const res = await api.get('/faculty/assignments/');
    return res.data;
  },
  createAssignment: async (payload: {
    subject_id: number;
    title: string;
    description: string;
    due_date: string;
    max_marks: number;
    year: number;
    section: string;
  }) => {
    const res = await api.post('/faculty/assignments/', payload);
    return res.data;
  },
  gradeSubmission: async (submissionId: number, payload: {
    marks_awarded: number;
    faculty_feedback?: string;
    status?: string;
  }) => {
    const res = await api.post(`/faculty/submissions/${submissionId}/grade/`, payload);
    return res.data;
  },
  getNotices: async () => {
    const res = await api.get('/faculty/notices/');
    return res.data;
  },
  createNotice: async (payload: {
    title: string;
    content: string;
    category: string;
    is_pinned?: boolean;
    target_year?: number;
  }) => {
    const res = await api.post('/faculty/notices/', payload);
    return res.data;
  },
  updateNotice: async (noticeId: number, payload: Partial<{
    title: string;
    content: string;
    category: string;
    is_pinned: boolean;
    is_active: boolean;
  }>) => {
    const res = await api.patch(`/faculty/notices/${noticeId}/`, payload);
    return res.data;
  },
  // Subject Management
  editSubject: async (subjectId: number, payload: { code?: string; name?: string }) => {
    const res = await api.patch(`/faculty/subjects/${subjectId}/edit/`, payload);
    return res.data;
  },
  getSubjectStudents: async (subjectId: number) => {
    const res = await api.get(`/faculty/subjects/${subjectId}/students/`);
    return res.data;
  },
  updateEnrollment: async (subjectId: number, payload: { student_id: number; action: 'add' | 'remove' }) => {
    const res = await api.post(`/faculty/subjects/${subjectId}/enroll/`, payload);
    return res.data;
  },
  // Student Registration Approvals
  getRegistrationRequests: async (statusFilter?: string) => {
    const params = statusFilter ? { status: statusFilter } : {};
    const res = await api.get('/faculty/registrations/', { params });
    return res.data;
  },
  actionRegistrationRequest: async (requestId: number, payload: { action: 'approve' | 'reject'; rejection_reason?: string }) => {
    const res = await api.patch(`/faculty/registrations/${requestId}/`, payload);
    return res.data;
  },
  // Department Students Management
  getAllStudents: async () => {
    const res = await api.get('/faculty/students/');
    return res.data;
  },
  addStudent: async (payload: {
    register_no: string;
    name: string;
    year?: number;
    section?: string;
    current_semester?: number;
    admission_year?: number;
  }) => {
    const res = await api.post('/faculty/students/', payload);
    return res.data;
  },
};

export const adminService = {
  getUsers: async () => {
    const res = await api.get('/admin/users/');
    return res.data;
  },
  createUser: async (payload: {
    username: string;
    password?: string;
    role: string;
    first_name: string;
    last_name: string;
    email: string;
    register_no?: string;
    year?: number;
    section?: string;
    faculty_id?: string;
    designation?: string;
  }) => {
    const res = await api.post('/admin/users/', payload);
    return res.data;
  },
  toggleUserStatus: async (userId: number, isActive: boolean) => {
    const res = await api.patch(`/admin/users/${userId}/toggle/`, { is_active: isActive });
    return res.data;
  },
  getAuditLogs: async () => {
    const res = await api.get('/admin/audit-logs/');
    return res.data;
  }
};
