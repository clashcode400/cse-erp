import React, { useState } from 'react';
import { authService } from '../../services/api';
import {
  UserPlus, Hash, User, Lock, Mail, Phone, ArrowLeft,
  CheckCircle, Clock, XCircle, AlertTriangle, Loader2, Eye, EyeOff
} from 'lucide-react';

interface Props {
  onBack: () => void;
}

type Step = 'form' | 'submitted' | 'check_status';

export const StudentRegisterForm: React.FC<Props> = ({ onBack }) => {
  const [step, setStep] = useState<Step>('form');

  // Form fields
  const [registerNo, setRegisterNo] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [showPw, setShowPw] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  // Status check
  const [checkRegNo, setCheckRegNo] = useState('');
  const [statusData, setStatusData] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!registerNo.trim()) e.register_no = 'Register number is required.';
    if (!fullName.trim()) e.full_name = 'Full name is required.';
    if (!username.trim() || username.length < 4) e.username = 'Username must be at least 4 characters.';
    if (password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (password !== confirmPw) e.confirmPw = 'Passwords do not match.';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setIsLoading(true);
    try {
      const data = await authService.selfRegister({
        register_no: registerNo.toUpperCase(),
        username: username.toLowerCase(),
        password,
        full_name: fullName,
        email,
        phone,
      });
      setSuccessData(data);
      setStep('submitted');
    } catch (err: any) {
      const apiErrors = err?.response?.data?.errors || {};
      if (Object.keys(apiErrors).length) {
        setErrors(apiErrors);
      } else {
        setErrors({ general: err?.response?.data?.error || err?.response?.data?.message || 'Submission failed. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!checkRegNo.trim()) return;
    setIsChecking(true);
    setStatusData(null);
    try {
      const data = await authService.checkRegistrationStatus(checkRegNo.toUpperCase());
      setStatusData(data);
    } catch {
      setStatusData({ status: 'ERROR', message: 'Could not check status. Try again.' });
    } finally {
      setIsChecking(false);
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'PENDING') return <Clock className="w-5 h-5 text-amber" />;
    if (status === 'APPROVED') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status === 'REJECTED') return <XCircle className="w-5 h-5 text-coral" />;
    return <AlertTriangle className="w-5 h-5 text-ink-400" />;
  };

  // ── Success screen ──────────────────────────────────────────────────
  if (step === 'submitted' && successData) {
    return (
      <div className="space-y-5 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <div>
          <h3 className="text-lg font-extrabold text-ink dark:text-white">Request Submitted!</h3>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1 max-w-xs mx-auto">
            Your registration request is pending faculty review. You'll be able to login once approved.
          </p>
        </div>
        <div className="glass-card rounded-xl p-4 text-left space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-ink-500">Request ID</span>
            <span className="font-bold text-ink dark:text-white">#{successData.request_id}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-ink-500">Register No</span>
            <span className="font-bold text-primary dark:text-aqua">{successData.register_no}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-ink-500">Status</span>
            <span className="flex items-center gap-1 font-bold text-amber">
              <Clock className="w-3 h-3" /> Pending Faculty Approval
            </span>
          </div>
        </div>
        <button
          onClick={onBack}
          className="w-full py-2.5 rounded-xl text-sm font-bold gradient-brand text-white shadow-md"
        >
          Back to Login
        </button>
      </div>
    );
  }

  // ── Main form ───────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-lg text-ink-400 hover:text-ink dark:hover:text-white hover:bg-ink-100 dark:hover:bg-darkcard2 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h3 className="text-base font-extrabold text-ink dark:text-white">Create Student Account</h3>
          <p className="text-xs text-ink-500 dark:text-ink-400">Use your register number to request access</p>
        </div>
      </div>

      {/* Check status shortcut */}
      <div className="bg-ink-50 dark:bg-darkcard2 rounded-xl p-3 border border-ink-100 dark:border-darkborder">
        <p className="text-[10px] font-bold text-ink-400 uppercase tracking-wider mb-2">Already submitted? Check status</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={checkRegNo}
            onChange={e => setCheckRegNo(e.target.value.toUpperCase())}
            placeholder="Your Register No."
            className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-darkcard border border-ink-200 dark:border-darkborder text-ink dark:text-white placeholder:text-ink-300 focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
          <button
            onClick={handleCheckStatus}
            disabled={isChecking}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary/10 hover:bg-primary/20 text-primary dark:text-aqua transition-colors disabled:opacity-50"
          >
            {isChecking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Check'}
          </button>
        </div>
        {statusData && (
          <div className={`mt-2 flex items-center gap-2 text-xs font-semibold rounded-lg px-3 py-2 ${
            statusData.status === 'APPROVED' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
            statusData.status === 'REJECTED' ? 'bg-coral-light text-coral' :
            statusData.status === 'PENDING' ? 'bg-amber/10 text-amber-dark dark:text-amber' :
            'bg-ink-100 dark:bg-darkcard text-ink-500'
          }`}>
            <StatusIcon status={statusData.status} />
            <span>
              {statusData.status === 'NOT_FOUND' ? 'No request found.' :
               statusData.status === 'APPROVED' ? `Approved! Login with @${statusData.desired_username}` :
               statusData.status === 'REJECTED' ? `Rejected: ${statusData.rejection_reason}` :
               'Pending faculty review...'}
            </span>
          </div>
        )}
      </div>

      {/* Registration form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {errors.general && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-coral-light text-coral text-xs font-semibold border border-coral/20">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {errors.general}
          </div>
        )}

        {/* Register No + Full Name side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-400 mb-1">Register No *</label>
            <div className="relative">
              <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400" />
              <input
                type="text"
                value={registerNo}
                onChange={e => { setRegisterNo(e.target.value.toUpperCase()); setErrors(p => ({...p, register_no: ''})); }}
                placeholder="23CS101"
                className={`w-full pl-8 pr-2 py-2 text-xs rounded-lg border bg-white dark:bg-darkcard2 text-ink dark:text-white placeholder:text-ink-300 focus:outline-none focus:ring-1 ${errors.register_no ? 'border-coral ring-coral/20' : 'border-ink-200 dark:border-darkborder focus:ring-primary/30'}`}
              />
            </div>
            {errors.register_no && <p className="text-[10px] text-coral mt-0.5">{errors.register_no}</p>}
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-400 mb-1">Full Name *</label>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400" />
              <input
                type="text"
                value={fullName}
                onChange={e => { setFullName(e.target.value); setErrors(p => ({...p, full_name: ''})); }}
                placeholder="Arjun Sharma"
                className={`w-full pl-8 pr-2 py-2 text-xs rounded-lg border bg-white dark:bg-darkcard2 text-ink dark:text-white placeholder:text-ink-300 focus:outline-none focus:ring-1 ${errors.full_name ? 'border-coral ring-coral/20' : 'border-ink-200 dark:border-darkborder focus:ring-primary/30'}`}
              />
            </div>
            {errors.full_name && <p className="text-[10px] text-coral mt-0.5">{errors.full_name}</p>}
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-400 mb-1">Desired Username *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink-400 font-bold">@</span>
            <input
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value.toLowerCase().replace(/\s/g,'')); setErrors(p => ({...p, username: ''})); }}
              placeholder="arjun_2023"
              className={`w-full pl-7 pr-3 py-2 text-xs rounded-lg border bg-white dark:bg-darkcard2 text-ink dark:text-white placeholder:text-ink-300 focus:outline-none focus:ring-1 ${errors.username ? 'border-coral ring-coral/20' : 'border-ink-200 dark:border-darkborder focus:ring-primary/30'}`}
            />
          </div>
          {errors.username && <p className="text-[10px] text-coral mt-0.5">{errors.username}</p>}
        </div>

        {/* Password row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-400 mb-1">Password *</label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setErrors(p => ({...p, password: '', confirmPw: ''})); }}
                placeholder="Min 6 chars"
                className={`w-full pl-8 pr-8 py-2 text-xs rounded-lg border bg-white dark:bg-darkcard2 text-ink dark:text-white placeholder:text-ink-300 focus:outline-none focus:ring-1 ${errors.password ? 'border-coral ring-coral/20' : 'border-ink-200 dark:border-darkborder focus:ring-primary/30'}`}
              />
              <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink">
                {showPw ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
            </div>
            {errors.password && <p className="text-[10px] text-coral mt-0.5">{errors.password}</p>}
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-400 mb-1">Confirm *</label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400" />
              <input
                type={showPw ? 'text' : 'password'}
                value={confirmPw}
                onChange={e => { setConfirmPw(e.target.value); setErrors(p => ({...p, confirmPw: ''})); }}
                placeholder="Re-enter"
                className={`w-full pl-8 pr-2 py-2 text-xs rounded-lg border bg-white dark:bg-darkcard2 text-ink dark:text-white placeholder:text-ink-300 focus:outline-none focus:ring-1 ${errors.confirmPw ? 'border-coral ring-coral/20' : 'border-ink-200 dark:border-darkborder focus:ring-primary/30'}`}
              />
            </div>
            {errors.confirmPw && <p className="text-[10px] text-coral mt-0.5">{errors.confirmPw}</p>}
          </div>
        </div>

        {/* Optional fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-400 mb-1">Email (optional)</label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@college.edu"
                className="w-full pl-8 pr-2 py-2 text-xs rounded-lg border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard2 text-ink dark:text-white placeholder:text-ink-300 focus:outline-none focus:ring-1 focus:ring-primary/30" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-400 mb-1">Phone (optional)</label>
            <div className="relative">
              <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400" />
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210"
                className="w-full pl-8 pr-2 py-2 text-xs rounded-lg border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard2 text-ink dark:text-white placeholder:text-ink-300 focus:outline-none focus:ring-1 focus:ring-primary/30" />
            </div>
          </div>
        </div>

        <div className="bg-primary/5 dark:bg-primary/10 border border-primary/15 rounded-xl px-3 py-2 text-[10px] text-ink-500 dark:text-ink-400">
          <span className="font-bold text-primary dark:text-aqua">Note:</span> Your request will be reviewed by your faculty. You will be able to login only after approval.
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 rounded-xl text-sm font-extrabold text-white gradient-brand shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          {isLoading ? 'Submitting...' : 'Submit Registration Request'}
        </button>
      </form>
    </div>
  );
};
