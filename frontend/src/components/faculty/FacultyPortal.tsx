import React, { useState, useEffect } from 'react';
import { facultyService } from '../../services/api';
import { SubjectItem } from '../../types';
import { Toast, ToastMessage } from '../common/Toast';
import { SubjectManager } from './SubjectManager';
import { RegistrationApprovals } from './RegistrationApprovals';
import {
  FileSpreadsheet,
  CalendarCheck2,
  GraduationCap,
  ClipboardList,
  Bell,
  Save,
  AlertTriangle,
  CheckCircle,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  BookMarked,
  UserCheck
} from 'lucide-react';

export const FacultyPortal: React.FC = () => {
  const [activeModule, setActiveModule] = useState<'attendance' | 'marks' | 'semester' | 'assignments' | 'notices' | 'subjects' | 'registrations'>('attendance');
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number>(1);
  const [selectedYear, setSelectedYear] = useState<number>(3);
  const [selectedSection, setSelectedSection] = useState<string>('A');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Today's date in YYYY-MM-DD for attendance (prevents future dates)
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Attendance Sheet State
  const [attendanceDate, setAttendanceDate] = useState<string>(todayStr);
  const [sessionSlot, setSessionSlot] = useState<string>('09:00 - 10:00 AM');
  const [attendanceTopic, setAttendanceTopic] = useState<string>('Algorithms & System Design');
  const [attendanceRoster, setAttendanceRoster] = useState<Array<{ student_id: number; register_no: string; name: string; status: string }>>([]);

  // 2. Internal Marks State
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number>(1);
  const [maxMarks, setMaxMarks] = useState<number>(50);
  const [marksRoster, setMarksRoster] = useState<Array<{ student_id: number; register_no: string; name: string; marks_obtained: number; is_absent: boolean; remarks: string }>>([]);

  // 3. Semester Marks State
  const [selectedSemester, setSelectedSemester] = useState<number>(5);
  const [semesterRoster, setSemesterRoster] = useState<Array<{ student_id: number; register_no: string; name: string; internal_marks: number; external_marks: number; total_marks: number; grade: string }>>([]);

  // 4. Assignments Management State
  const [facultyAssignments, setFacultyAssignments] = useState<any[]>([]);
  const [showNewAssignModal, setShowNewAssignModal] = useState(false);
  const [newAssignTitle, setNewAssignTitle] = useState('');
  const [newAssignDesc, setNewAssignDesc] = useState('');
  const [newAssignDue, setNewAssignDue] = useState('');
  const [newAssignMax, setNewAssignMax] = useState(20);

  // 5. Notices State
  const [facultyNotices, setFacultyNotices] = useState<any[]>([]);
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeContent, setNewNoticeContent] = useState('');
  const [newNoticeCat, setNewNoticeCat] = useState('ACADEMIC');
  const [newNoticePinned, setNewNoticePinned] = useState(false);

  // Initial Load Classes and Subjects
  useEffect(() => {
    loadClassesAndSubjects();
  }, []);

  const loadClassesAndSubjects = async () => {
    try {
      const data = await facultyService.getClassesAndSubjects();
      setSubjects(data.subjects);
      if (data.subjects.length > 0) {
        setSelectedSubjectId(data.subjects[0].id);
      }
    } catch (err) {
      console.error('Failed to load classes and subjects', err);
    }
  };

  // Load active module sheet whenever subject/date/year changes
  useEffect(() => {
    if (activeModule === 'attendance') {
      loadAttendanceSheet();
    } else if (activeModule === 'marks') {
      loadMarksSheet();
    } else if (activeModule === 'semester') {
      loadSemesterSheet();
    } else if (activeModule === 'assignments') {
      loadAssignments();
    } else if (activeModule === 'notices') {
      loadNotices();
    }
    setHasUnsavedChanges(false);
  }, [activeModule, selectedSubjectId, selectedYear, selectedSection, attendanceDate, selectedSemester, selectedAssessmentId]);

  // Load Attendance
  const loadAttendanceSheet = async () => {
    setIsLoading(true);
    try {
      const data = await facultyService.getAttendanceSheet({
        subject_id: selectedSubjectId,
        date: attendanceDate,
        year: selectedYear,
        section: selectedSection,
      });
      setAttendanceRoster(data.roster);
      if (data.session_slot) setSessionSlot(data.session_slot);
      if (data.topic) setAttendanceTopic(data.topic);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load Marks
  const loadMarksSheet = async () => {
    setIsLoading(true);
    try {
      const data = await facultyService.getMarksSheet({
        subject_id: selectedSubjectId,
        assessment_id: selectedAssessmentId,
        year: selectedYear,
        section: selectedSection,
      });
      setAssessments(data.assessments || []);
      if (data.selected_assessment) {
        setSelectedAssessmentId(data.selected_assessment.id);
        setMaxMarks(data.max_marks || 50);
      }
      setMarksRoster(data.roster || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load Semester Marks
  const loadSemesterSheet = async () => {
    setIsLoading(true);
    try {
      const data = await facultyService.getSemesterMarksSheet({
        semester: selectedSemester,
        subject_id: selectedSubjectId,
        year: selectedYear,
        section: selectedSection,
      });
      setSemesterRoster(data.roster || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAssignments = async () => {
    setIsLoading(true);
    try {
      const data = await facultyService.getAssignments();
      setFacultyAssignments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotices = async () => {
    setIsLoading(true);
    try {
      const data = await facultyService.getNotices();
      setFacultyNotices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 1. SAVE ATTENDANCE
  const handleSaveAttendance = async () => {
    // Validate: NO FUTURE DATES ALLOWED
    const selectedDt = new Date(attendanceDate);
    const today = new Date(todayStr);
    if (selectedDt > today) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Validation Error',
        message: 'Attendance cannot be marked for future dates. Please select today or an earlier date.',
      });
      return;
    }

    setIsLoading(true);
    try {
      await facultyService.saveAttendanceSheet({
        subject_id: selectedSubjectId,
        date: attendanceDate,
        session_slot: sessionSlot,
        topic: attendanceTopic,
        year: selectedYear,
        section: selectedSection,
        roster: attendanceRoster.map((r) => ({
          student_id: r.student_id,
          status: r.status,
        })),
      });
      setHasUnsavedChanges(false);
      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'Attendance Saved',
        message: `Attendance for ${attendanceDate} saved successfully. Audit entry logged.`,
      });
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Save Failed',
        message: err.response?.data?.error || 'Could not save attendance.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Quick mark all present
  const handleMarkAllPresent = () => {
    setAttendanceRoster((prev) =>
      prev.map((item) => ({ ...item, status: 'PRESENT' }))
    );
    setHasUnsavedChanges(true);
  };

  // 2. SAVE INTERNAL MARKS
  const handleSaveMarks = async () => {
    // Validate: Marks within max
    for (const r of marksRoster) {
      if (r.marks_obtained < 0 || r.marks_obtained > maxMarks) {
        setToast({
          id: Date.now().toString(),
          type: 'error',
          title: 'Validation Error',
          message: `Marks for ${r.register_no} (${r.marks_obtained}) must be between 0 and maximum of ${maxMarks}.`,
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      await facultyService.saveMarksSheet({
        assessment_id: selectedAssessmentId,
        roster: marksRoster.map((r) => ({
          student_id: r.student_id,
          marks_obtained: Number(r.marks_obtained),
          is_absent: r.is_absent,
          remarks: r.remarks,
        })),
      });
      setHasUnsavedChanges(false);
      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'Marks Saved',
        message: `Internal assessment marks recorded and validated. Audit log generated.`,
      });
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Save Failed',
        message: err.response?.data?.error || 'Could not save marks.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 3. SAVE SEMESTER MARKS
  const handleSaveSemesterMarks = async () => {
    setIsLoading(true);
    try {
      await facultyService.saveSemesterMarksSheet({
        semester: selectedSemester,
        subject_id: selectedSubjectId,
        roster: semesterRoster.map((r) => ({
          student_id: r.student_id,
          internal_marks: Number(r.internal_marks),
          external_marks: Number(r.external_marks),
          grade: r.grade,
        })),
      });
      setHasUnsavedChanges(false);
      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'Semester Transcripts Saved',
        message: `Semester ${selectedSemester} grades saved and SGPA recomputed. Audit log recorded.`,
      });
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Save Failed',
        message: err.response?.data?.error || 'Could not save semester marks.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 4. CREATE ASSIGNMENT
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await facultyService.createAssignment({
        subject_id: selectedSubjectId,
        title: newAssignTitle,
        description: newAssignDesc,
        due_date: newAssignDue,
        max_marks: newAssignMax,
        year: selectedYear,
        section: selectedSection,
      });
      setShowNewAssignModal(false);
      setNewAssignTitle('');
      setNewAssignDesc('');
      loadAssignments();
      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'Assignment Created',
        message: 'Assignment distributed to student rosters and audit logged.',
      });
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Creation Failed',
        message: err.response?.data?.error || 'Could not create assignment.',
      });
    }
  };

  // 5. CREATE NOTICE
  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await facultyService.createNotice({
        title: newNoticeTitle,
        content: newNoticeContent,
        category: newNoticeCat,
        is_pinned: newNoticePinned,
        target_year: selectedYear,
      });
      setNewNoticeTitle('');
      setNewNoticeContent('');
      loadNotices();
      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'Notice Published',
        message: 'Department notice published to students and audit trail logged.',
      });
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Publish Failed',
        message: err.response?.data?.error || 'Could not publish notice.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Module Selector Nav Bar */}
      <div className="glass-card rounded-3xl p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveModule('attendance')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeModule === 'attendance'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-ink-100 dark:bg-darkcard2 text-ink-700 dark:text-ink-200 hover:text-ink'
              }`}
            >
              <CalendarCheck2 className="w-4 h-4" />
              Attendance Sheet
            </button>

            <button
              onClick={() => setActiveModule('marks')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeModule === 'marks'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-ink-100 dark:bg-darkcard2 text-ink-700 dark:text-ink-200 hover:text-ink'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Internal Marks (CIA)
            </button>

            <button
              onClick={() => setActiveModule('semester')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeModule === 'semester'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-ink-100 dark:bg-darkcard2 text-ink-700 dark:text-ink-200 hover:text-ink'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Semester Grades
            </button>

            <button
              onClick={() => setActiveModule('assignments')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeModule === 'assignments'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-ink-100 dark:bg-darkcard2 text-ink-700 dark:text-ink-200 hover:text-ink'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              Assignments
            </button>

            <button
              onClick={() => setActiveModule('notices')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeModule === 'notices'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-ink-100 dark:bg-darkcard2 text-ink-700 dark:text-ink-200 hover:text-ink'
              }`}
            >
              <Bell className="w-4 h-4" />
              Publish Notices
            </button>

            <button
              onClick={() => setActiveModule('subjects')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeModule === 'subjects'
                  ? 'bg-aqua-dark text-white shadow-md'
                  : 'bg-ink-100 dark:bg-darkcard2 text-ink-700 dark:text-ink-200 hover:text-ink'
              }`}
            >
              <BookMarked className="w-4 h-4" />
              Subject Mgmt
            </button>

            <button
              onClick={() => setActiveModule('registrations')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeModule === 'registrations'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-ink-100 dark:bg-darkcard2 text-ink-700 dark:text-ink-200 hover:text-ink'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Student Approvals
            </button>
          </div>

          {/* Unsaved changes indicator */}
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-light text-amber-dark dark:bg-amber/20 border border-amber/40 animate-pulse">
              <AlertTriangle className="w-4 h-4" />
              Unsaved Changes
            </div>
          )}
        </div>
      </div>

      {/* Class & Subject Filter Bar - hidden when Subject Management is active */}
      {activeModule !== 'subjects' && <div className="glass-card rounded-3xl p-5 shadow-card">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Subject Picker */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400 mb-1">
              Select Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard text-ink dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name} (Sem {s.semester})
                </option>
              ))}
            </select>
          </div>

          {/* Class Year */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400 mb-1">
              Class Year & Section
            </label>
            <div className="flex gap-2">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-1/2 px-3 py-2 rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard text-ink dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={1}>Year 1</option>
                <option value={2}>Year 2</option>
                <option value={3}>Year 3 (CSE)</option>
                <option value={4}>Year 4</option>
              </select>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-1/2 px-3 py-2 rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard text-ink dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="A">Sec A</option>
                <option value="B">Sec B</option>
              </select>
            </div>
          </div>

          {/* Module-specific controls */}
          {activeModule === 'attendance' && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400 mb-1">
                Attendance Date (No Future Dates)
              </label>
              <input
                type="date"
                max={todayStr}
                value={attendanceDate}
                onChange={(e) => {
                  setAttendanceDate(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                className="w-full px-3 py-2 rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard text-ink dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {activeModule === 'marks' && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400 mb-1">
                Assessment
              </label>
              <select
                value={selectedAssessmentId}
                onChange={(e) => setSelectedAssessmentId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard text-ink dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {assessments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} (Max {a.max_marks})
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeModule === 'semester' && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400 mb-1">
                Semester
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard text-ink dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={1}>Semester 1</option>
                <option value={2}>Semester 2</option>
                <option value={3}>Semester 3</option>
                <option value={4}>Semester 4</option>
                <option value={5}>Semester 5</option>
              </select>
            </div>
          )}

          {/* Action Button */}
          <div className="flex items-end">
            {activeModule === 'attendance' && (
              <button
                onClick={handleSaveAttendance}
                disabled={isLoading}
                className="w-full px-4 py-2.5 rounded-xl text-xs font-extrabold text-white gradient-brand shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Saving...' : 'Bulk Save Attendance'}
              </button>
            )}
            {activeModule === 'marks' && (
              <button
                onClick={handleSaveMarks}
                disabled={isLoading}
                className="w-full px-4 py-2.5 rounded-xl text-xs font-extrabold text-white gradient-brand shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Saving...' : 'Bulk Save Marks'}
              </button>
            )}
            {activeModule === 'semester' && (
              <button
                onClick={handleSaveSemesterMarks}
                disabled={isLoading}
                className="w-full px-4 py-2.5 rounded-xl text-xs font-extrabold text-white gradient-brand shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Saving...' : 'Bulk Save Grades'}
              </button>
            )}
          </div>

        </div>
      </div>}

      {/* MODULE 1: ATTENDANCE SPREADSHEET */}
      {activeModule === 'attendance' && (
        <div className="glass-card rounded-3xl p-6 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-ink-100 dark:border-darkborder gap-3">
            <div>
              <h3 className="text-base font-extrabold text-ink dark:text-white flex items-center gap-2">
                Daily Attendance Register
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-aqua-light text-aqua-dark dark:bg-aqua/20 dark:text-aqua">
                  {attendanceRoster.length} Enrolled
                </span>
              </h3>
              <p className="text-xs text-ink-500 dark:text-ink-400">
                Click Present / Absent / On-Duty buttons for each student, then save all changes.
              </p>
            </div>

            <button
              onClick={handleMarkAllPresent}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-aqua-light text-aqua-dark dark:bg-aqua/20 dark:text-aqua hover:bg-aqua/30 transition-colors"
            >
              Mark All Present
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 dark:border-darkborder text-[11px] font-extrabold tracking-wider uppercase text-ink-400">
                  <th className="py-3 px-3">Reg No</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Quick Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-darkborder">
                {attendanceRoster.map((item, index) => (
                  <tr key={item.student_id} className="hover:bg-ink-50/50 dark:hover:bg-darkcard2/40">
                    <td className="py-3 px-3 font-mono font-bold text-xs text-primary dark:text-aqua">
                      {item.register_no}
                    </td>
                    <td className="py-3 px-3 font-bold text-xs text-ink dark:text-white">
                      {item.name}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-black ${
                          item.status === 'PRESENT'
                            ? 'bg-aqua-light text-aqua-dark dark:bg-aqua/20 dark:text-aqua'
                            : item.status === 'ABSENT'
                            ? 'bg-coral-light text-coral dark:bg-coral/20'
                            : 'bg-amber-light text-amber-dark dark:bg-amber/20 dark:text-amber'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-ink-100 dark:bg-darkcard2">
                        {['PRESENT', 'ABSENT', 'OD'].map((st) => (
                          <button
                            key={st}
                            onClick={() => {
                              const updated = [...attendanceRoster];
                              updated[index].status = st;
                              setAttendanceRoster(updated);
                              setHasUnsavedChanges(true);
                            }}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                              item.status === st
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-ink-600 dark:text-ink-300 hover:text-ink'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODULE 2: INTERNAL MARKS SPREADSHEET */}
      {activeModule === 'marks' && (
        <div className="glass-card rounded-3xl p-6 shadow-card">
          <div className="flex items-center justify-between pb-4 border-b border-ink-100 dark:border-darkborder mb-4">
            <div>
              <h3 className="text-base font-extrabold text-ink dark:text-white">
                Internal Assessment Marks Entry
              </h3>
              <p className="text-xs text-ink-500 dark:text-ink-400">
                Spreadsheet grid with real-time validation: Marks must not exceed max {maxMarks}.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light">
              Max Allowed: {maxMarks} Marks
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 dark:border-darkborder text-[11px] font-extrabold tracking-wider uppercase text-ink-400">
                  <th className="py-3 px-3">Reg No</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Marks Obtained (0 - {maxMarks})</th>
                  <th className="py-3 px-3">Absent?</th>
                  <th className="py-3 px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-darkborder">
                {marksRoster.map((item, index) => {
                  const isInvalid = item.marks_obtained < 0 || item.marks_obtained > maxMarks;

                  return (
                    <tr key={item.student_id} className="hover:bg-ink-50/50 dark:hover:bg-darkcard2/40">
                      <td className="py-3 px-3 font-mono font-bold text-xs text-primary dark:text-aqua">
                        {item.register_no}
                      </td>
                      <td className="py-3 px-3 font-bold text-xs text-ink dark:text-white">
                        {item.name}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={maxMarks}
                            value={item.marks_obtained}
                            onChange={(e) => {
                              const updated = [...marksRoster];
                              updated[index].marks_obtained = Number(e.target.value);
                              setMarksRoster(updated);
                              setHasUnsavedChanges(true);
                            }}
                            className={`w-28 px-3 py-1.5 rounded-xl border text-xs font-bold bg-white dark:bg-darkcard text-ink dark:text-white ${
                              isInvalid
                                ? 'border-coral text-coral bg-coral-light/20'
                                : 'border-ink-200 dark:border-darkborder'
                            }`}
                          />
                          {isInvalid && (
                            <span className="text-[11px] font-bold text-coral flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> &gt; {maxMarks}!
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          checked={item.is_absent}
                          onChange={(e) => {
                            const updated = [...marksRoster];
                            updated[index].is_absent = e.target.checked;
                            if (e.target.checked) updated[index].marks_obtained = 0;
                            setMarksRoster(updated);
                            setHasUnsavedChanges(true);
                          }}
                          className="w-4 h-4 rounded text-primary"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          placeholder="e.g. Good derivation, needs proof check"
                          value={item.remarks}
                          onChange={(e) => {
                            const updated = [...marksRoster];
                            updated[index].remarks = e.target.value;
                            setMarksRoster(updated);
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full px-3 py-1.5 rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard text-ink dark:text-white text-xs"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODULE 3: SEMESTER MARKS & GRADES */}
      {activeModule === 'semester' && (
        <div className="glass-card rounded-3xl p-6 shadow-card">
          <div className="flex items-center justify-between pb-4 border-b border-ink-100 dark:border-darkborder mb-4">
            <div>
              <h3 className="text-base font-extrabold text-ink dark:text-white">
                Semester Transcript & Grade Entry
              </h3>
              <p className="text-xs text-ink-500 dark:text-ink-400">
                Grade points (O=10, A+=9, A=8, B+=7, B=6, C=5, U=0) automatically calculate CGPA.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-aqua-light text-aqua-dark dark:bg-aqua/20 dark:text-aqua">
              Semester {selectedSemester}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 dark:border-darkborder text-[11px] font-extrabold tracking-wider uppercase text-ink-400">
                  <th className="py-3 px-3">Reg No</th>
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3">Internal (50)</th>
                  <th className="py-3 px-3">External (50)</th>
                  <th className="py-3 px-3">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-darkborder">
                {semesterRoster.map((item, index) => (
                  <tr key={item.student_id} className="hover:bg-ink-50/50 dark:hover:bg-darkcard2/40">
                    <td className="py-3 px-3 font-mono font-bold text-xs text-primary dark:text-aqua">
                      {item.register_no}
                    </td>
                    <td className="py-3 px-3 font-bold text-xs text-ink dark:text-white">
                      {item.name}
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={item.internal_marks}
                        onChange={(e) => {
                          const updated = [...semesterRoster];
                          updated[index].internal_marks = Number(e.target.value);
                          setSemesterRoster(updated);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-24 px-3 py-1.5 rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard text-xs font-bold text-ink dark:text-white"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={item.external_marks}
                        onChange={(e) => {
                          const updated = [...semesterRoster];
                          updated[index].external_marks = Number(e.target.value);
                          setSemesterRoster(updated);
                          setHasUnsavedChanges(true);
                        }}
                        className="w-24 px-3 py-1.5 rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard text-xs font-bold text-ink dark:text-white"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={item.grade}
                        onChange={(e) => {
                          const updated = [...semesterRoster];
                          updated[index].grade = e.target.value;
                          setSemesterRoster(updated);
                          setHasUnsavedChanges(true);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard text-xs font-extrabold text-ink dark:text-white"
                      >
                        <option value="O">O (10)</option>
                        <option value="A+">A+ (9)</option>
                        <option value="A">A (8)</option>
                        <option value="B+">B+ (7)</option>
                        <option value="B">B (6)</option>
                        <option value="C">C (5)</option>
                        <option value="U">U (0 - Fail)</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODULE 4: ASSIGNMENTS MANAGER */}
      {activeModule === 'assignments' && (
        <div className="glass-card rounded-3xl p-6 shadow-card">
          <div className="flex items-center justify-between pb-4 border-b border-ink-100 dark:border-darkborder mb-4">
            <div>
              <h3 className="text-base font-extrabold text-ink dark:text-white">
                Coursework & Assignment Manager
              </h3>
              <p className="text-xs text-ink-500 dark:text-ink-400">
                Create new tasks, monitor student submission statuses, and award grades with audit logging.
              </p>
            </div>
            <button
              onClick={() => setShowNewAssignModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white gradient-brand flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Assignment
            </button>
          </div>

          <div className="divide-y divide-ink-100 dark:divide-darkborder">
            {facultyAssignments.map((a) => (
              <div key={a.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-primary dark:text-aqua">
                      {a.subject_code}
                    </span>
                    <span className="text-xs text-ink-400">
                      Due: {new Date(a.due_date).toLocaleDateString()}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-ink-100 dark:bg-darkcard2 text-ink-700 dark:text-ink-200">
                      Year {a.year} - Sec {a.section}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-ink dark:text-white">
                    {a.title}
                  </h4>
                  <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
                    {a.description}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs text-ink-400 block">Max Score: {a.max_marks} pts</span>
                  <span className="text-xs font-bold text-aqua-dark dark:text-aqua">Active in Portal</span>
                </div>
              </div>
            ))}
          </div>

          {/* New Assignment Modal */}
          {showNewAssignModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
              <div className="glass-card max-w-md w-full rounded-3xl p-6 shadow-2xl border border-ink-200 dark:border-darkborder animate-slide-up">
                <h3 className="text-lg font-extrabold text-ink dark:text-white mb-3">
                  Create New Assignment
                </h3>
                <form onSubmit={handleCreateAssignment} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-ink-500 mb-1">Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Distributed Consensus Engine"
                      value={newAssignTitle}
                      onChange={(e) => setNewAssignTitle(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard text-ink dark:text-white text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink-500 mb-1">Description</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Instructions, problem statement, and deliverables..."
                      value={newAssignDesc}
                      onChange={(e) => setNewAssignDesc(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard text-ink dark:text-white text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-ink-500 mb-1">Due Date & Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={newAssignDue}
                        onChange={(e) => setNewAssignDue(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard text-ink dark:text-white text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink-500 mb-1">Max Marks</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={newAssignMax}
                        onChange={(e) => setNewAssignMax(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard text-ink dark:text-white text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-ink-100 dark:border-darkborder">
                    <button
                      type="button"
                      onClick={() => setShowNewAssignModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-ink-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl text-xs font-bold text-white gradient-brand shadow-sm"
                    >
                      Publish Assignment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODULE 5: NOTICE PUBLISHER */}
      {activeModule === 'notices' && (
        <div className="glass-card rounded-3xl p-6 shadow-card">
          <div className="pb-4 border-b border-ink-100 dark:border-darkborder mb-4">
            <h3 className="text-base font-extrabold text-ink dark:text-white">
              Publish CSE Department Notice
            </h3>
            <p className="text-xs text-ink-500 dark:text-ink-400">
              Broadcast announcements, examination alerts, or project deadlines to student portals.
            </p>
          </div>

          <form onSubmit={handleCreateNotice} className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs font-bold text-ink-500 mb-1">Notice Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Model Practical Examination Schedule"
                value={newNoticeTitle}
                onChange={(e) => setNewNoticeTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard text-ink dark:text-white text-xs font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink-500 mb-1">Category</label>
                <select
                  value={newNoticeCat}
                  onChange={(e) => setNewNoticeCat(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard text-ink dark:text-white text-xs font-bold"
                >
                  <option value="ACADEMIC">Academic</option>
                  <option value="EXAM">Examination</option>
                  <option value="PLACEMENT">Placement & Internship</option>
                  <option value="PROJECT">Project Review</option>
                  <option value="EVENT">Technical Symposium</option>
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-ink dark:text-white">
                  <input
                    type="checkbox"
                    checked={newNoticePinned}
                    onChange={(e) => setNewNoticePinned(e.target.checked)}
                    className="w-4 h-4 rounded text-primary"
                  />
                  Pin this notice to top of student dashboard
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-500 mb-1">Detailed Content</label>
              <textarea
                rows={4}
                required
                placeholder="Write full circular description, dates, venue, and required actions..."
                value={newNoticeContent}
                onChange={(e) => setNewNoticeContent(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard text-ink dark:text-white text-xs"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-extrabold text-white gradient-brand shadow-md hover:opacity-90"
            >
              Post Department Notice
            </button>
          </form>
        </div>
      )}

      {/* Subject Management Module */}
      {activeModule === 'subjects' && (
        <SubjectManager />
      )}

      {/* Student Registration Approvals Module */}
      {activeModule === 'registrations' && (
        <RegistrationApprovals />
      )}

    </div>
  );
};
