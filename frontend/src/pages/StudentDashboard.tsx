import React, { useState, useEffect } from 'react';
import { studentService } from '../services/api';
import { StudentDashboardResponse } from '../types';
import { StudentProfileHeader } from '../components/student/StudentProfileHeader';
import { AttendanceCard } from '../components/student/AttendanceCard';
import { CgpaTrendChart } from '../components/student/CgpaTrendChart';
import { InternalMarksTable } from '../components/student/InternalMarksTable';
import { SemesterResultsCard } from '../components/student/SemesterResultsCard';
import { SubmissionPendingPanel } from '../components/student/SubmissionPendingPanel';
import { AssignmentsList } from '../components/student/AssignmentsList';
import { ProjectsList } from '../components/student/ProjectsList';
import { NoticesSection } from '../components/student/NoticesSection';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface StudentDashboardProps {
  activeTab: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ activeTab }) => {
  const [data, setData] = useState<StudentDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const loadDashboard = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const resp = await studentService.getDashboard();
      setData(resp);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Failed to load student dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-ink-500 dark:text-ink-400">
          Loading CSE Department Academic Records...
        </p>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="p-8 glass-card rounded-3xl text-center max-w-md mx-auto my-12">
        <AlertTriangle className="w-10 h-10 text-coral mx-auto mb-3" />
        <h3 className="text-base font-extrabold text-ink dark:text-white">Unable to Load Dashboard</h3>
        <p className="text-xs text-ink-500 mt-1">{errorMsg}</p>
        <button
          onClick={loadDashboard}
          className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white gradient-brand"
        >
          Retry
        </button>
      </div>
    );
  }

  // Render individual tabs when requested from sidebar, or consolidated dashboard
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* 1. Header Profile Card */}
      <StudentProfileHeader
        profile={data.profile}
        overallCgpa={data.academic_summary.overall_cgpa}
        overallAttendance={data.attendance.overall_percentage}
      />

      {/* When activeTab is 'attendance', show focused Attendance module */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <AttendanceCard data={data.attendance} />
        </div>
      )}

      {/* When activeTab is 'marks', show focused Marks & Results */}
      {activeTab === 'marks' && (
        <div className="space-y-6">
          <CgpaTrendChart summary={data.academic_summary} />
          <InternalMarksTable marks={data.internal_marks} />
          <SemesterResultsCard semesters={data.academic_summary.semesters} />
        </div>
      )}

      {/* When activeTab is 'assignments', show Assignments */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <SubmissionPendingPanel items={data.submission_pending} />
          <AssignmentsList assignments={data.assignments} onSubmissionSuccess={loadDashboard} />
        </div>
      )}

      {/* When activeTab is 'projects', show Projects */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <ProjectsList projects={data.projects} />
        </div>
      )}

      {/* When activeTab is 'notices', show Notices */}
      {activeTab === 'notices' && (
        <div className="space-y-6">
          <NoticesSection notices={data.notices} />
        </div>
      )}

      {/* Default Dashboard: Consolidated complete academic portal */}
      {activeTab === 'dashboard' && (
        <>
          {/* Submission Pending Panel: Urgently sorted by nearest deadline */}
          {data.submission_pending.length > 0 && (
            <SubmissionPendingPanel items={data.submission_pending} />
          )}

          {/* Attendance + Internal Marks Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-12">
              <AttendanceCard data={data.attendance} />
            </div>
          </div>

          {/* CGPA Trend Chart */}
          <CgpaTrendChart summary={data.academic_summary} />

          {/* Internal Marks Table */}
          <InternalMarksTable marks={data.internal_marks} />

          {/* End-Semester Transcripts */}
          <SemesterResultsCard semesters={data.academic_summary.semesters} />

          {/* Assignments & Capstone Projects */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <AssignmentsList assignments={data.assignments} onSubmissionSuccess={loadDashboard} />
            </div>
            <div className="lg:col-span-5">
              <NoticesSection notices={data.notices} />
            </div>
          </div>

          {/* Capstone Projects Section */}
          <ProjectsList projects={data.projects} />
        </>
      )}

    </div>
  );
};
