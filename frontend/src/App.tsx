import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginView } from './components/auth/LoginView';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { MobileBottomBar } from './components/common/MobileBottomBar';
import { StudentDashboard } from './pages/StudentDashboard';
import { FacultyPortal } from './components/faculty/FacultyPortal';
import { AdminPortal } from './components/admin/AdminPortal';
import { AuditLogViewer } from './components/admin/AuditLogViewer';

export function AppContent() {
  const { isAuthenticated, isLoading, role } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cloud dark:bg-darkbg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-glow animate-pulse-subtle flex-shrink-0">
            <img src="/cse-logo.jpg" alt="CSE Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-xs font-bold text-ink-500 dark:text-ink-400">
            Initializing CSE Department Portal...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  // Determine which page content to render
  const renderMainContent = () => {
    // If student clicks on faculty or admin tab, enforce read-only student dashboard
    if (role === 'STUDENT' && (activeTab === 'faculty-portal' || activeTab === 'admin-portal')) {
      return <StudentDashboard activeTab="dashboard" />;
    }

    if (activeTab === 'faculty-portal' || activeTab === 'faculty-assignments' || activeTab === 'faculty-notices') {
      return <FacultyPortal />;
    }

    if (activeTab === 'admin-portal') {
      return <AdminPortal />;
    }

    if (activeTab === 'audit-log') {
      return <AuditLogViewer />;
    }

    return <StudentDashboard activeTab={activeTab} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-cloud dark:bg-darkbg text-ink dark:text-white transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Layout: Left Sidebar + Center Scrollable Workspace */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 min-w-0 overflow-y-auto">
          {renderMainContent()}
        </main>
      </div>

      {/* Mobile Bottom Bar */}
      <MobileBottomBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
