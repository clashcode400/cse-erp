import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { User } from '../../types';
import { Toast, ToastMessage } from '../common/Toast';
import { Users, UserPlus, Power, ShieldAlert, CheckCircle, Search, AlertCircle } from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('Pass@123');
  const [role, setRole] = useState<'STUDENT' | 'FACULTY'>('STUDENT');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [registerNo, setRegisterNo] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [designation, setDesignation] = useState('Assistant Professor');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const updatedStatus = !user.is_active;
      await adminService.toggleUserStatus(user.id, updatedStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: updatedStatus } : u))
      );
      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: updatedStatus ? 'Account Activated' : 'Account Deactivated',
        message: `User ${user.username} is now ${updatedStatus ? 'Active' : 'Deactivated'}. Audit log generated.`,
      });
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Action Failed',
        message: err.response?.data?.error || 'Could not update user status.',
      });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.createUser({
        username,
        password,
        role,
        first_name: firstName,
        last_name: lastName,
        email,
        register_no: role === 'STUDENT' ? registerNo : undefined,
        faculty_id: role === 'FACULTY' ? facultyId : undefined,
        designation: role === 'FACULTY' ? designation : undefined,
      });

      setShowCreateModal(false);
      setUsername('');
      setFirstName('');
      setLastName('');
      setEmail('');
      setRegisterNo('');
      setFacultyId('');
      loadUsers();

      setToast({
        id: Date.now().toString(),
        type: 'success',
        title: 'User Account Created',
        message: `Account ${username} created successfully with role ${role}. Audit logged.`,
      });
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        title: 'Creation Failed',
        message: err.response?.data?.error || 'Could not create account.',
      });
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Security Rule Card */}
      <div className="p-4 rounded-2xl bg-primary-light/40 dark:bg-darkcard2 border border-primary/20 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-extrabold text-ink dark:text-white block text-sm">
            Role Policy: Admin Boundaries
          </span>
          The Administrator role is strictly restricted to account creation and activation/deactivation. Academic data (marks, attendance, grades) CANNOT be modified by Admin; all write attempts are blocked at the DRF permission layer with HTTP 403 Forbidden.
        </div>
      </div>

      {/* Main Table Card */}
      <div className="glass-card rounded-3xl p-6 shadow-card">
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-ink-100 dark:border-darkborder gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-ink dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              CSE Department User Accounts
            </h3>
            <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
              Manage student, faculty, and administrative credentials.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard text-xs text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white gradient-brand shadow-sm flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              New Account
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 dark:border-darkborder text-[11px] font-extrabold tracking-wider uppercase text-ink-400">
                <th className="py-3 px-3">User</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-darkborder">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-ink-50/50 dark:hover:bg-darkcard2/40">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: u.avatar_color || '#5B5BD6' }}
                      >
                        {u.name ? u.name.charAt(0).toUpperCase() : u.username.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-ink dark:text-white">
                          {u.name || u.username}
                        </div>
                        <div className="text-[11px] text-ink-400">{u.username} • {u.email || 'no email'}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        u.role === 'STUDENT'
                          ? 'bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light'
                          : u.role === 'FACULTY'
                          ? 'bg-aqua-light text-aqua-dark dark:bg-aqua/20 dark:text-aqua'
                          : 'bg-coral-light text-coral dark:bg-coral/20'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-xs text-ink-600 dark:text-ink-300">
                    {u.department}
                  </td>

                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black ${
                        u.is_active
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400'
                      }`}
                    >
                      {u.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right">
                    {u.role !== 'ADMIN' && (
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                          u.is_active
                            ? 'bg-coral-light text-coral hover:bg-coral/20'
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        }`}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Create Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-card max-w-md w-full rounded-3xl p-6 shadow-2xl border border-ink-200 dark:border-darkborder animate-slide-up">
            <h3 className="text-lg font-extrabold text-ink dark:text-white mb-3">
              Create New Department Account
            </h3>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-ink-500 mb-1">Account Role</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('STUDENT')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      role === 'STUDENT'
                        ? 'border-primary bg-primary text-white'
                        : 'border-ink-200 text-ink-600 dark:text-ink-300'
                    }`}
                  >
                    Student (Read-Only)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('FACULTY')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      role === 'FACULTY'
                        ? 'border-aqua bg-aqua text-white'
                        : 'border-ink-200 text-ink-600 dark:text-ink-300'
                    }`}
                  >
                    Faculty (Academic)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-500 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard text-xs text-ink dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-500 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard text-xs text-ink dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-500 mb-1">Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 23cse106 or fac_ramesh"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard text-xs text-ink dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-500 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="user@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard text-xs text-ink dark:text-white"
                />
              </div>

              {role === 'STUDENT' ? (
                <div>
                  <label className="block text-xs font-bold text-ink-500 mb-1">Register No</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 23CSE106"
                    value={registerNo}
                    onChange={(e) => setRegisterNo(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard text-xs text-ink dark:text-white"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-ink-500 mb-1">Faculty ID</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. FAC-CSE-05"
                      value={facultyId}
                      onChange={(e) => setFacultyId(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard text-xs text-ink dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink-500 mb-1">Designation</label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard text-xs text-ink dark:text-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-ink-100 dark:border-darkborder">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-ink-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white gradient-brand shadow-sm"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
