import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, LogOut, Users, ShieldAlert, BookOpen, GraduationCap, ChevronDown, Check } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, role, logout, demoAccounts, quickLoginAs } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  const getRoleBadge = () => {
    switch (role) {
      case 'STUDENT':
        return { text: 'Student (Read-Only)', bg: 'bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light border-primary/20' };
      case 'FACULTY':
        return { text: 'Faculty (Academic Editor)', bg: 'bg-aqua-light text-aqua-dark dark:bg-aqua/20 dark:text-aqua border-aqua/30' };
      case 'ADMIN':
        return { text: 'Admin (Accounts Only)', bg: 'bg-coral-light text-coral dark:bg-coral/20 dark:text-coral border-coral/30' };
      default:
        return { text: 'Guest', bg: 'bg-ink-100 text-ink-600' };
    }
  };

  const badge = getRoleBadge();

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass border-b border-ink-100 dark:border-darkborder transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Department Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
              <img
                src="/cse-logo.jpg"
                alt="CSE Department Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div
                className="w-10 h-10 gradient-brand items-center justify-center text-white font-extrabold text-base shadow-sm hidden"
                style={{ display: 'none' }}
              >
                CSE
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-ink dark:text-white">
                  Department ERP
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider bg-primary/10 text-primary dark:bg-aqua/10 dark:text-aqua">
                  CSE Scope Only
                </span>
              </div>
              <p className="hidden md:block text-[11px] font-medium text-ink-400 dark:text-ink-400 -mt-0.5">
                Computer Science & Engineering Portal
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Role indicator pill */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}
              title="Enforced on DRF Backend: Students receive 403 on write; Admin cannot edit marks"
            >
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              {badge.text}
            </div>

            {/* Quick Role Switcher Button */}
            <button
              onClick={() => setShowSwitchModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-ink-100 hover:bg-ink-200 dark:bg-darkcard2 dark:hover:bg-darkborder text-ink-700 dark:text-ink-200 transition-all border border-ink-200/50 dark:border-darkborder"
              title="Quick switch role for testing"
            >
              <Users className="w-3.5 h-3.5 text-primary dark:text-aqua" />
              <span className="hidden md:inline">Switch Role</span>
              <ChevronDown className="w-3 h-3 text-ink-400" />
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-ink-500 hover:text-ink dark:text-ink-300 dark:hover:text-white hover:bg-ink-100 dark:hover:bg-darkcard2 transition-colors"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber" />}
            </button>

            {/* User Profile avatar & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-ink-200/60 dark:border-darkborder">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                style={{ backgroundColor: user?.avatar_color || '#5B5BD6' }}
                title={`${user?.name} (${user?.username})`}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-xl text-ink-400 hover:text-coral hover:bg-coral-light dark:hover:bg-coral/10 transition-colors"
                title="Sign Out"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Role Switcher Modal for Easy Interactive Evaluation */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-card max-w-lg w-full rounded-2xl p-6 shadow-2xl border border-ink-200 dark:border-darkborder animate-slide-up">
            <div className="flex items-center justify-between pb-4 border-b border-ink-100 dark:border-darkborder">
              <div>
                <h3 className="text-lg font-extrabold text-ink dark:text-white">
                  Quick Switch Role & Profile
                </h3>
                <p className="text-xs text-ink-500 dark:text-ink-400">
                  Instantly switch between fictional accounts to test Student, Faculty, and Admin permissions.
                </p>
              </div>
              <button
                onClick={() => setShowSwitchModal(false)}
                className="text-ink-400 hover:text-ink dark:hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2 max-h-96 overflow-y-auto pr-1">
              <div className="text-[11px] font-bold tracking-wider uppercase text-ink-400 dark:text-ink-400 mb-1">
                Student Accounts (Read-Only)
              </div>
              {demoAccounts
                .filter(a => a.role === 'STUDENT')
                .map(acc => (
                  <button
                    key={acc.id}
                    onClick={async () => {
                      await quickLoginAs(acc.username);
                      setActiveTab('dashboard');
                      setShowSwitchModal(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      user?.username === acc.username
                        ? 'border-primary bg-primary-light/40 dark:bg-primary/20 dark:border-primary'
                        : 'border-ink-100 dark:border-darkborder hover:bg-ink-50 dark:hover:bg-darkcard2'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: acc.avatar_color }}
                      >
                        {acc.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-ink dark:text-white flex items-center gap-2">
                          {acc.name}
                          <span className="text-[11px] font-normal text-ink-400">
                            ({acc.register_no})
                          </span>
                        </div>
                        <div className="text-xs text-ink-500 dark:text-ink-400">
                          {acc.username === 'student_arjun' ? (
                            <span className="text-coral font-semibold">⚠️ 65% Low Attendance Alert Demo</span>
                          ) : (
                            `Year ${acc.year} • Sem ${acc.semester} • Regular`
                          )}
                        </div>
                      </div>
                    </div>
                    {user?.username === acc.username && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </button>
                ))}

              <div className="text-[11px] font-bold tracking-wider uppercase text-ink-400 dark:text-ink-400 mt-4 mb-1">
                Faculty Accounts (Academic Editors)
              </div>
              {demoAccounts
                .filter(a => a.role === 'FACULTY')
                .map(acc => (
                  <button
                    key={acc.id}
                    onClick={async () => {
                      await quickLoginAs(acc.username);
                      setActiveTab('faculty-portal');
                      setShowSwitchModal(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      user?.username === acc.username
                        ? 'border-aqua bg-aqua-light/40 dark:bg-aqua/20 dark:border-aqua'
                        : 'border-ink-100 dark:border-darkborder hover:bg-ink-50 dark:hover:bg-darkcard2'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: acc.avatar_color }}
                      >
                        {acc.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-ink dark:text-white">
                          {acc.name}
                        </div>
                        <div className="text-xs text-aqua-dark dark:text-aqua font-medium">
                          {acc.designation} • {acc.faculty_id}
                        </div>
                      </div>
                    </div>
                    {user?.username === acc.username && (
                      <Check className="w-5 h-5 text-aqua" />
                    )}
                  </button>
                ))}

              <div className="text-[11px] font-bold tracking-wider uppercase text-ink-400 dark:text-ink-400 mt-4 mb-1">
                Admin Account (User Mgmt Only)
              </div>
              {demoAccounts
                .filter(a => a.role === 'ADMIN')
                .map(acc => (
                  <button
                    key={acc.id}
                    onClick={async () => {
                      await quickLoginAs(acc.username);
                      setActiveTab('admin-portal');
                      setShowSwitchModal(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      user?.username === acc.username
                        ? 'border-coral bg-coral-light/40 dark:bg-coral/20 dark:border-coral'
                        : 'border-ink-100 dark:border-darkborder hover:bg-ink-50 dark:hover:bg-darkcard2'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: acc.avatar_color }}
                      >
                        A
                      </div>
                      <div>
                        <div className="text-sm font-bold text-ink dark:text-white">
                          {acc.name}
                        </div>
                        <div className="text-xs text-ink-500 dark:text-ink-400">
                          System Admin (Cannot edit marks or attendance)
                        </div>
                      </div>
                    </div>
                    {user?.username === acc.username && (
                      <Check className="w-5 h-5 text-coral" />
                    )}
                  </button>
                ))}
            </div>

            <div className="mt-5 pt-3 border-t border-ink-100 dark:border-darkborder flex justify-end">
              <button
                onClick={() => setShowSwitchModal(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-ink-100 hover:bg-ink-200 dark:bg-darkcard2 dark:hover:bg-darkborder text-ink-800 dark:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
