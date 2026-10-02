import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { StudentRegisterForm } from './StudentRegisterForm';
import { Lock, User, ArrowRight, ShieldCheck, Moon, Sun, AlertTriangle, UserPlus } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, quickLoginAs, demoAccounts, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [username, setUsername] = useState('student_rohit');
  const [password, setPassword] = useState('StudentPassword123!');
  const [errorMsg, setErrorMsg] = useState('');
  const [showRegister, setShowRegister] = useState(false);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await login(username, password);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Invalid credentials. Try quick-login buttons below.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-cloud dark:bg-darkbg transition-colors duration-200 relative overflow-hidden">
      
      {/* Decorative gradient blur spheres */}
      <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-aqua/15 blur-3xl pointer-events-none" />

      {/* Theme toggle in top corner */}
      <button
        onClick={toggleTheme}
        className="absolute top-5 right-5 p-2.5 rounded-2xl glass-card text-ink-600 dark:text-ink-200 hover:text-ink dark:hover:text-white transition-all shadow-sm"
        title="Toggle Theme"
      >
        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber" />}
      </button>

      <div className="max-w-md w-full glass-card rounded-3xl p-8 shadow-cardHover border border-ink-100 dark:border-darkborder relative z-10 animate-slide-up">

        {/* ── Registration form ─────────────────────────── */}
        {showRegister ? (
          <StudentRegisterForm onBack={() => setShowRegister(false)} />
        ) : (
          <>
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl gradient-brand mx-auto flex items-center justify-center text-white font-black text-2xl shadow-glow mb-3">
            CSE
          </div>
          <h1 className="text-2xl font-black tracking-tight text-ink dark:text-white">
            CSE Department ERP
          </h1>
          <p className="text-xs font-semibold text-primary dark:text-aqua mt-0.5">
            Academic Portal • Scope: Computer Science & Engineering
          </p>
          <p className="text-xs text-ink-400 mt-1">
            Sign in with institutional credentials or quick-select a persona below.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-coral-light dark:bg-coral/20 border border-coral/30 text-coral text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleManualLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400 mb-1">
              Username / Register No
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3 text-ink-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. student_rohit or faculty_ananya"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard text-sm font-semibold text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-ink-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Institutional Password"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard text-sm font-semibold text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-2xl text-sm font-extrabold text-white gradient-brand shadow-glow hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? 'Authenticating...' : 'Sign In to Portal'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick 1-Click Role Logins */}
        <div className="mt-6 pt-5 border-t border-ink-100 dark:border-darkborder">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-ink-400 mb-2.5 text-center">
            One-Click Evaluation Personas
          </div>

          <div className="space-y-2">
            {/* Student 1 */}
            <button
              onClick={() => quickLoginAs('student_rohit')}
              className="w-full p-2.5 rounded-xl border border-ink-200 dark:border-darkborder hover:border-primary/50 bg-white/60 dark:bg-darkcard text-left flex items-center justify-between text-xs transition-all"
            >
              <div>
                <span className="font-extrabold text-ink dark:text-white">Rohit Verma</span>
                <span className="text-ink-400"> (23CSE101)</span>
                <div className="text-[11px] text-ink-500">Student • 88% Attendance • 8.85 CGPA</div>
              </div>
              <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-primary-light text-primary">Student</span>
            </button>

            {/* Student 2: Warning */}
            <button
              onClick={() => quickLoginAs('student_arjun')}
              className="w-full p-2.5 rounded-xl border border-coral/30 hover:border-coral bg-coral-light/20 dark:bg-coral/10 text-left flex items-center justify-between text-xs transition-all"
            >
              <div>
                <span className="font-extrabold text-ink dark:text-white">Arjun Patel</span>
                <span className="text-ink-400"> (23CSE103)</span>
                <div className="text-[11px] text-coral font-bold">Student • 65% Low Attendance Alert Demo</div>
              </div>
              <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-coral-light text-coral">Warning Demo</span>
            </button>

            {/* Faculty */}
            <button
              onClick={() => quickLoginAs('faculty_ananya')}
              className="w-full p-2.5 rounded-xl border border-ink-200 dark:border-darkborder hover:border-aqua/50 bg-white/60 dark:bg-darkcard text-left flex items-center justify-between text-xs transition-all"
            >
              <div>
                <span className="font-extrabold text-ink dark:text-white">Dr. Ananya Sharma</span>
                <div className="text-[11px] text-aqua-dark dark:text-aqua font-semibold">Faculty • Academic marks & attendance editor</div>
              </div>
              <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-aqua-light text-aqua-dark">Faculty</span>
            </button>

            {/* Admin */}
            <button
              onClick={() => quickLoginAs('admin_user')}
              className="w-full p-2.5 rounded-xl border border-ink-200 dark:border-darkborder hover:border-ink-400 bg-white/60 dark:bg-darkcard text-left flex items-center justify-between text-xs transition-all"
            >
              <div>
                <span className="font-extrabold text-ink dark:text-white">Dr. Rajesh Narayanan</span>
                <div className="text-[11px] text-ink-500">Admin • User accounts & audit log review only</div>
              </div>
              <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-ink-100 text-ink-700">Admin</span>
            </button>
          </div>
        </div>

        <div className="mt-4 text-center text-[10px] text-ink-400">
          Enforced server-side via DRF. Student write attempts return 403 Forbidden.
        </div>

        {/* Create account link */}
        <div className="mt-4 pt-3 border-t border-ink-100 dark:border-darkborder text-center">
          <p className="text-xs text-ink-400 dark:text-ink-500">
            New student?{' '}
            <button
              onClick={() => setShowRegister(true)}
              className="text-primary dark:text-aqua font-bold hover:underline inline-flex items-center gap-1"
            >
              <UserPlus className="w-3 h-3" /> Create Account
            </button>
          </p>
        </div>

          </>
        )}

      </div>
    </div>
  );
};
