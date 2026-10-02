import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CalendarCheck2,
  GraduationCap,
  FileText,
  FolderGit2,
  Bell,
  Edit3,
  Users2,
  FileSpreadsheet,
  ShieldCheck,
  ClipboardList
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { role, user } = useAuth();

  const studentNavItems = [
    { id: 'dashboard', label: 'Student Dashboard', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance Analysis', icon: CalendarCheck2 },
    { id: 'marks', label: 'Internal Marks & CGPA', icon: GraduationCap },
    { id: 'assignments', label: 'Assignments', icon: FileText },
    { id: 'projects', label: 'Projects & Reviews', icon: FolderGit2 },
    { id: 'notices', label: 'Department Notices', icon: Bell },
  ];

  const facultyNavItems = [
    { id: 'faculty-portal', label: 'Faculty Spreadsheet', icon: FileSpreadsheet },
    { id: 'faculty-assignments', label: 'Assignment Manager', icon: ClipboardList },
    { id: 'faculty-notices', label: 'Publish Notices', icon: Bell },
    { id: 'dashboard', label: 'Preview Student View', icon: LayoutDashboard },
    { id: 'audit-log', label: 'My Faculty Audit Log', icon: ShieldCheck },
  ];

  const adminNavItems = [
    { id: 'admin-portal', label: 'Account Management', icon: Users2 },
    { id: 'audit-log', label: 'Audit Trail Logs', icon: ShieldCheck },
    { id: 'dashboard', label: 'Student View', icon: LayoutDashboard },
  ];

  const currentNavItems =
    role === 'FACULTY' ? facultyNavItems : role === 'ADMIN' ? adminNavItems : studentNavItems;

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 glass border-r border-ink-100 dark:border-darkborder p-4 transition-colors duration-200">
      
      {/* Department Summary Badge */}
      <div className="p-3 mb-4 rounded-xl bg-gradient-brand-subtle dark:bg-darkcard2 border border-primary/20 dark:border-aqua/20">
        <div className="text-[11px] font-bold uppercase tracking-wider text-primary dark:text-aqua">
          Academic ERP
        </div>
        <div className="text-xs font-semibold text-ink-700 dark:text-ink-200">
          Dept of Computer Science
        </div>
        <div className="text-[10px] text-ink-400 mt-0.5">
          Term: Fall Semester 2026-27
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto">
        {currentNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
                  : 'text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-darkcard2 hover:text-ink dark:hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-ink-400 dark:text-ink-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Security Rule Pill */}
      <div className="mt-auto pt-3 border-t border-ink-100 dark:border-darkborder">
        <div className="p-2.5 rounded-xl bg-ink-50 dark:bg-darkcard text-[11px] text-ink-500 dark:text-ink-400 flex flex-col gap-1 border border-ink-100/80 dark:border-darkborder">
          <span className="font-bold text-ink dark:text-ink-200 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-aqua" />
            Backend Enforced
          </span>
          <span className="text-[10px] leading-tight">
            {role === 'STUDENT'
              ? 'Read-only access. Write operations return 403 Forbidden.'
              : role === 'FACULTY'
              ? 'Academic edits recorded in audit logs with old/new values.'
              : 'Account creation/deactivation only. Marks editing blocked.'}
          </span>
        </div>
      </div>
    </aside>
  );
};
