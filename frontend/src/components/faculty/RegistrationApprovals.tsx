import React, { useState, useEffect } from 'react';
import { facultyService } from '../../services/api';
import { Toast, ToastMessage } from '../common/Toast';
import {
  UserCheck, UserX, Clock, CheckCircle, XCircle,
  Search, RefreshCw, Filter, AlertTriangle, Loader2,
  User, Hash, Mail, Phone, Calendar, UserPlus, X
} from 'lucide-react';

interface RegistrationRequest {
  id: number;
  register_no: string;
  full_name: string;
  profile_name: string;
  year: number | null;
  section: string | null;
  desired_username: string;
  email: string;
  phone: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason: string;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by_name: string | null;
}

export const RegistrationApprovals: React.FC = () => {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: number; name: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Add Student State
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentRegNo, setNewStudentRegNo] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentYear, setNewStudentYear] = useState<number>(3);
  const [newStudentSection, setNewStudentSection] = useState('A');
  const [newStudentSem, setNewStudentSem] = useState<number>(5);
  const [newStudentAdmissionYear, setNewStudentAdmissionYear] = useState<number>(2023);
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' | 'warning', title?: string) => {
    setToast({
      id: Date.now().toString(),
      type,
      title: title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Notice'),
      message: msg,
    });
  };

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const filter = statusFilter === 'ALL' ? undefined : statusFilter;
      const data = await facultyService.getRegistrationRequests(filter);
      setRequests(data);
    } catch {
      showToast('Failed to load registration requests', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadRequests(); }, [statusFilter]);

  const handleApprove = async (req: RegistrationRequest) => {
    setActionLoadingId(req.id);
    try {
      const res = await facultyService.actionRegistrationRequest(req.id, { action: 'approve' });
      showToast(`✓ ${res.message}`, 'success');
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'APPROVED' } : r));
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Approval failed', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoadingId(rejectModal.id);
    try {
      await facultyService.actionRegistrationRequest(rejectModal.id, {
        action: 'reject',
        rejection_reason: rejectionReason || 'Rejected by faculty.',
      });
      showToast(`Request for ${rejectModal.name} rejected.`, 'warning');
      setRequests(prev => prev.map(r => r.id === rejectModal.id ? { ...r, status: 'REJECTED', rejection_reason: rejectionReason } : r));
      setRejectModal(null);
      setRejectionReason('');
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Rejection failed', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentRegNo.trim() || !newStudentName.trim()) {
      showToast('Register number and name are required', 'error');
      return;
    }
    setIsAddingStudent(true);
    try {
      const res = await facultyService.addStudent({
        register_no: newStudentRegNo.trim().toUpperCase(),
        name: newStudentName.trim(),
        year: Number(newStudentYear),
        section: newStudentSection,
        current_semester: Number(newStudentSem),
        admission_year: Number(newStudentAdmissionYear),
      });
      showToast(res.message || 'Student added successfully!', 'success');
      setShowAddStudentModal(false);
      setNewStudentRegNo('');
      setNewStudentName('');
      loadRequests();
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to add student', 'error');
    } finally {
      setIsAddingStudent(false);
    }
  };

  const filtered = requests.filter(r =>
    r.register_no.toLowerCase().includes(search.toLowerCase()) ||
    r.full_name.toLowerCase().includes(search.toLowerCase()) ||
    r.desired_username.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="space-y-5">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber/10 flex items-center justify-center">
            <UserCheck className="w-4 h-4 text-amber-dark dark:text-amber" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-ink dark:text-white flex items-center gap-2">
              Student Registration Approvals
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber text-white animate-pulse">
                  {pendingCount} pending
                </span>
              )}
            </h2>
            <p className="text-xs text-ink-500 dark:text-ink-400">Review and approve student login account requests</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddStudentModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary/90 transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Add New Student
          </button>
          <button
            onClick={loadRequests}
            disabled={isLoading}
            className="p-2 rounded-xl text-ink-400 hover:text-ink dark:hover:text-white hover:bg-ink-100 dark:hover:bg-darkcard2 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter + Search bar */}
      <div className="glass-card rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <div className="flex gap-1.5">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === s
                  ? s === 'PENDING' ? 'bg-amber text-white' :
                    s === 'APPROVED' ? 'bg-green-500 text-white' :
                    s === 'REJECTED' ? 'bg-coral text-white' :
                    'bg-primary text-white'
                  : 'bg-ink-100 dark:bg-darkcard2 text-ink-500 dark:text-ink-300 hover:bg-ink-200'
              }`}
            >
              {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, reg no, username..."
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-ink-50 dark:bg-darkcard2 border border-ink-100 dark:border-darkborder text-ink dark:text-white placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center gap-3 text-ink-400">
          <Loader2 className="w-7 h-7 animate-spin" />
          <span className="text-sm">Loading requests...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl py-16 flex flex-col items-center gap-3 text-ink-400">
          <UserCheck className="w-10 h-10 text-ink-200 dark:text-ink-600" />
          <p className="text-sm font-semibold">
            {statusFilter === 'PENDING' ? 'No pending requests 🎉' : 'No requests found'}
          </p>
          <p className="text-xs text-ink-300 dark:text-ink-500">Students can register from the Login page</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => (
            <div
              key={req.id}
              className={`glass-card rounded-2xl p-4 border-l-4 transition-all ${
                req.status === 'PENDING'  ? 'border-l-amber' :
                req.status === 'APPROVED' ? 'border-l-green-500' :
                'border-l-coral'
              }`}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                {/* Info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-sm ${
                    req.status === 'PENDING' ? 'bg-amber/80' :
                    req.status === 'APPROVED' ? 'bg-green-500' : 'bg-coral'
                  }`}>
                    {req.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-extrabold text-ink dark:text-white">{req.full_name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                        req.status === 'PENDING'  ? 'bg-amber/10 text-amber-dark dark:text-amber' :
                        req.status === 'APPROVED' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                        'bg-coral-light text-coral'
                      }`}>
                        {req.status === 'PENDING'  ? <Clock className="w-3 h-3" /> :
                         req.status === 'APPROVED' ? <CheckCircle className="w-3 h-3" /> :
                         <XCircle className="w-3 h-3" />}
                        {req.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      <span className="flex items-center gap-1 text-[11px] text-ink-500">
                        <Hash className="w-3 h-3" /> {req.register_no}
                        {req.year && <span className="text-ink-400"> • Yr {req.year}{req.section}</span>}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-primary dark:text-aqua font-semibold">
                        <User className="w-3 h-3" /> @{req.desired_username}
                      </span>
                      {req.email && <span className="flex items-center gap-1 text-[11px] text-ink-400"><Mail className="w-3 h-3" />{req.email}</span>}
                      {req.phone && <span className="flex items-center gap-1 text-[11px] text-ink-400"><Phone className="w-3 h-3" />{req.phone}</span>}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-ink-400">
                      <Calendar className="w-3 h-3" />
                      Submitted: {new Date(req.submitted_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      {req.reviewed_by_name && (
                        <span className="ml-2">• Reviewed by {req.reviewed_by_name}</span>
                      )}
                    </div>
                    {req.status === 'REJECTED' && req.rejection_reason && (
                      <div className="mt-1.5 flex items-start gap-1 text-[11px] text-coral font-medium">
                        <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        Reason: {req.rejection_reason}
                      </div>
                    )}
                    {req.profile_name && req.profile_name !== req.full_name && (
                      <div className="mt-1 text-[10px] text-ink-400">
                        Matched profile: <span className="font-semibold text-ink-600 dark:text-ink-300">{req.profile_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions (only for PENDING) */}
                {req.status === 'PENDING' && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => { setRejectModal({ id: req.id, name: req.full_name }); setRejectionReason(''); }}
                      disabled={actionLoadingId === req.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-coral/30 text-coral hover:bg-coral/10 transition-colors disabled:opacity-50"
                    >
                      <UserX className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button
                      onClick={() => handleApprove(req)}
                      disabled={actionLoadingId === req.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-green-500 hover:bg-green-600 text-white transition-colors disabled:opacity-50"
                    >
                      {actionLoadingId === req.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <UserCheck className="w-3.5 h-3.5" />}
                      Approve
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="glass-card max-w-sm w-full rounded-2xl p-6 shadow-2xl border border-ink-200 dark:border-darkborder animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-coral/10 flex items-center justify-center">
                <UserX className="w-4 h-4 text-coral" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-ink dark:text-white">Reject Registration</h3>
                <p className="text-xs text-ink-500">Rejecting request for <span className="font-bold">{rejectModal.name}</span></p>
              </div>
            </div>
            <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-1.5">
              Reason for rejection (optional)
            </label>
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              rows={3}
              placeholder="e.g. Register number not found in our records. Please contact class coordinator."
              className="w-full px-3 py-2 text-xs rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard2 text-ink dark:text-white placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-coral/30 resize-none"
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setRejectModal(null)} className="flex-1 py-2 rounded-xl text-xs font-bold bg-ink-100 hover:bg-ink-200 dark:bg-darkcard2 text-ink-700 dark:text-ink-200 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoadingId !== null}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-coral hover:bg-coral/90 text-white transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {actionLoadingId !== null ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full rounded-2xl p-6 shadow-2xl border border-ink-200 dark:border-darkborder animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-ink dark:text-white">Add New Student</h3>
                  <p className="text-xs text-ink-500">Create new student record in CSE Department</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="p-1 rounded-lg text-ink-400 hover:text-ink dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-ink-600 dark:text-ink-300 mb-1">
                  Register Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE23055"
                  value={newStudentRegNo}
                  onChange={e => setNewStudentRegNo(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard2 text-ink dark:text-white uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-600 dark:text-ink-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arun Kumar"
                  value={newStudentName}
                  onChange={e => setNewStudentName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard2 text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-600 dark:text-ink-300 mb-1">
                    Year
                  </label>
                  <select
                    value={newStudentYear}
                    onChange={e => {
                      const yr = Number(e.target.value);
                      setNewStudentYear(yr);
                      setNewStudentSem(yr * 2 - 1);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard2 text-ink dark:text-white focus:outline-none"
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-600 dark:text-ink-300 mb-1">
                    Section
                  </label>
                  <select
                    value={newStudentSection}
                    onChange={e => setNewStudentSection(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard2 text-ink dark:text-white focus:outline-none"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-600 dark:text-ink-300 mb-1">
                    Current Semester
                  </label>
                  <select
                    value={newStudentSem}
                    onChange={e => setNewStudentSem(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard2 text-ink dark:text-white focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-600 dark:text-ink-300 mb-1">
                    Admission Year
                  </label>
                  <input
                    type="number"
                    value={newStudentAdmissionYear}
                    onChange={e => setNewStudentAdmissionYear(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard2 text-ink dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-ink-50 dark:bg-darkcard border border-ink-100 dark:border-darkborder text-[11px] text-ink-500">
                <span className="font-semibold text-ink-700 dark:text-ink-200">Tip:</span> Once created, the student can go to the login page, register with their Register Number, and their account will be submitted for faculty approval.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-ink-100 hover:bg-ink-200 dark:bg-darkcard2 text-ink-700 dark:text-ink-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingStudent}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {isAddingStudent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
