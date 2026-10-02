export type Role = 'STUDENT' | 'FACULTY' | 'ADMIN';

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: Role;
  role_display?: string;
  department: string;
  phone?: string;
  avatar_color?: string;
  is_active?: boolean;
}

export interface StudentProfile {
  id: number;
  user: number;
  username: string;
  email: string;
  register_no: string;
  name: string;
  department: string;
  year: number;
  section: string;
  current_semester: number;
  admission_year: number;
  overall_cgpa: number;
  overall_percentage: number;
  overall_attendance_pct: number;
}

export interface FacultyProfile {
  id: number;
  user: number;
  username: string;
  faculty_id: string;
  name: string;
  department: string;
  designation: string;
  cabin: string;
  email: string;
  phone?: string;
}

export interface SubjectAttendance {
  subject_id: number;
  code: string;
  name: string;
  credits: number;
  total_classes: number;
  attended_classes: number;
  percentage: number;
  is_low_attendance: boolean;
}

export interface AttendanceData {
  total_classes: number;
  attended_classes: number;
  overall_percentage: number;
  is_low_overall: boolean;
  subjects: SubjectAttendance[];
}

export interface AssessmentMarkItem {
  assessment_id: number;
  name: string;
  date: string;
  marks_obtained: number;
  max_marks: number;
  percentage: number;
  is_absent: boolean;
  remarks: string;
}

export interface SubjectInternalMark {
  subject_id: number;
  subject_code: string;
  subject_name: string;
  assessments: AssessmentMarkItem[];
  total_obtained: number;
  total_max: number;
  percentage: number;
}

export interface SubjectGrade {
  subject_code: string;
  subject_name: string;
  credits: number;
  internal_marks: number;
  external_marks: number;
  total_marks: number;
  grade: 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'U';
  grade_point: number;
  result_status: 'PASS' | 'FAIL';
}

export interface SemesterResult {
  semester: number;
  academic_year: string;
  sgpa: number;
  percentage: number;
  total_credits: number;
  earned_credits: number;
  status: 'PASS' | 'FAIL' | 'WITHHELD';
  grades: SubjectGrade[];
}

export interface SemesterTrendItem {
  semester: string;
  semester_num: number;
  sgpa: number;
  percentage: number;
}

export interface AcademicSummary {
  overall_cgpa: number;
  overall_percentage: number;
  cumulative_credits: number;
  trend: SemesterTrendItem[];
  semesters: SemesterResult[];
}

export interface AssignmentItem {
  id: number;
  assignment: number;
  assignment_title: string;
  student: number;
  student_reg: string;
  student_name: string;
  status: 'PENDING' | 'SUBMITTED' | 'LATE' | 'GRADED';
  submission_text?: string;
  file_url?: string;
  submitted_at?: string;
  marks_awarded?: number | null;
  max_marks: number;
  due_date: string;
  faculty_feedback?: string;
}

export interface ProjectReview {
  id: number;
  project: number;
  review_number: number;
  review_name: string;
  review_date: string;
  venue: string;
  max_marks: number;
  marks_awarded?: number | null;
  comments?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'PENDING_REVISION';
}

export interface ProjectItem {
  id: number;
  title: string;
  domain: string;
  guide: number;
  guide_name: string;
  year: number;
  academic_year: string;
  abstract: string;
  status: 'PROPOSED' | 'IN_PROGRESS' | 'REVIEW_SCHEDULED' | 'COMPLETED';
  students_detail?: StudentProfile[];
  reviews: ProjectReview[];
}

export interface SubmissionPendingItem {
  id: string;
  submission_id?: number;
  review_id?: number;
  type: 'ASSIGNMENT' | 'PROJECT_REVIEW';
  title: string;
  subject: string;
  faculty?: string;
  venue?: string;
  due_date: string;
  seconds_left: number;
  is_overdue: boolean;
  max_marks: number;
  status: string;
  urgency: 'URGENT' | 'OVERDUE' | 'NORMAL';
}

export interface NoticeItem {
  id: number;
  title: string;
  content: string;
  posted_by_name?: string;
  category: 'ACADEMIC' | 'EXAM' | 'PLACEMENT' | 'PROJECT' | 'EVENT';
  category_display?: string;
  is_pinned: boolean;
  is_active: boolean;
  target_year?: number | null;
  created_at: string;
}

export interface StudentDashboardResponse {
  profile: {
    register_no: string;
    name: string;
    department: string;
    year: number;
    section: string;
    current_semester: number;
    admission_year: number;
    email: string;
  };
  attendance: AttendanceData;
  internal_marks: SubjectInternalMark[];
  academic_summary: AcademicSummary;
  notices: NoticeItem[];
  assignments: AssignmentItem[];
  projects: ProjectItem[];
  submission_pending: SubmissionPendingItem[];
}

export interface AuditLogItem {
  id: number;
  user?: number;
  user_name: string;
  user_role: string;
  action: string;
  model_name: string;
  record_id: string;
  old_value: any;
  new_value: any;
  ip_address?: string;
  timestamp: string;
}

export interface SubjectItem {
  id: number;
  code: string;
  name: string;
  department: string;
  semester: number;
  year: number;
  credits: number;
  faculty?: number;
  faculty_name?: string;
  syllabus_summary?: string;
}
