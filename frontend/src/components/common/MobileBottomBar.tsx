import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, CalendarCheck2, GraduationCap, FileSpreadsheet, Users2, Bell } from 'lucide-react';

interface MobileBottomBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({ activeTab, setActiveTab }) => {
  const { role } = useAuth();

  const studentItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck2 },
    { id: 'marks', label: 'Marks', icon: GraduationCap },
    { id: 'notices', label: 'Notices', icon: Bell },
  ];

  const facultyItems = [
    { id: 'faculty-portal', label: 'Sheet', icon: FileSpreadsheet },
    { id: 'faculty-assignments', label: 'Tasks', icon: GraduationCap },
    { id: 'faculty-notices', label: 'Notices', icon: Bell },
    { id: 'dashboard', label: 'Student', icon: LayoutDashboard },
  ];

  const adminItems = [
    { id: 'admin-portal', label: 'Accounts', icon: Users2 },
    { id: 'audit-log', label: 'Audit', icon: GraduationCap },
    { id: 'dashboard', label: 'Student', icon: LayoutDashboard },
  ];

  const items = role === 'FACULTY' ? facultyItems : role === 'ADMIN' ? adminItems : studentItems;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-ink-100 dark:border-darkborder px-2 py-1.5 flex items-center justify-around">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isActive
                ? 'text-primary dark:text-aqua font-bold'
                : 'text-ink-400 hover:text-ink-600 dark:hover:text-ink-200'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
