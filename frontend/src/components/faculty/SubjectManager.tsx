import React, { useState, useEffect, useCallback } from 'react';
import { facultyService } from '../../services/api';
import { Toast, ToastMessage } from '../common/Toast';
import {
  BookOpen, Edit3, Save, X, Users, UserPlus, UserMinus,
  Search, ChevronRight, RefreshCw, CheckCircle, AlertTriangle,
  Tag, Hash, BookMarked, GraduationCap, Loader2
} from 'lucide-react';

interface SubjectItem {
  id: number;
  code: string;
  name: string;
  semester: number;
  year: number;
  credits: number;
  faculty_name: string;
}

interface StudentItem {
  id: number;
  register_no: string;
  name: string;
  year: number;
  section: string;
  current_semester: number;
  overall_cgpa: string;
}

export const SubjectManager: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<SubjectItem | null>(null);
  const [subjectSearch, setSubjectSearch] = useState('');

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editErrors, setEditErrors] = useState<{ code?: string; name?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  // Enrollment state
  const [enrolled, setEnrolled] = useState<StudentItem[]>([]);
  const [available, setAvailable] = useState<StudentItem[]>([]);
  const [enrollSearch, setEnrollSearch] = useState('');
  const [removeSearch, setRemoveSearch] = useState('');
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'warning', title?: string) => {
    setToast({
      id: Date.now().toString(),
      type,
      title: title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Notice'),
      message: msg,
    });
  };

  // Load subjects list
  useEffect(() => {
    facultyService.getClassesAndSubjects().then(data => {
      setSubjects(data.subjects || []);
    }).catch(() => showToast('Failed to load subjects', 'error'));
  }, []);

  // Load students when subject selected
  const loadStudents = useCallback(async (subjectId: number) => {
    setIsLoadingStudents(true);
    setEnrolled([]);
    setAvailable([]);
    try {
      const data = await facultyService.getSubjectStudents(subjectId);
      setEnrolled(data.enrolled || []);
      setAvailable(data.available || []);
    } catch {
      showToast('Failed to load student roster', 'error');
    } finally {
      setIsLoadingStudents(false);
    }
  }, []);

  const handleSelectSubject = (subj: SubjectItem) => {
    setSelectedSubject(subj);
    setIsEditing(false);
    setEditCode(subj.code);
    setEditName(subj.name);
    setEditErrors({});
    setEnrollSearch('');
    setRemoveSearch('');
    loadStudents(subj.id);
  };

  // Save subject name/code
  const handleSaveEdit = async () => {
    if (!selectedSubject) return;
    const errors: { code?: string; name?: string } = {};
    if (!editCode.trim()) errors.code = 'Subject code is required.';
    if (!editName.trim()) errors.name = 'Subject name is required.';
    if (Object.keys(errors).length) { setEditErrors(errors); return; }

    setIsSaving(true);
    try {
      const updated = await facultyService.editSubject(selectedSubject.id, {
        code: editCode.trim().toUpperCase(),
        name: editName.trim(),
      });
      // Update local list
      setSubjects(prev => prev.map(s => s.id === updated.id ? { ...s, code: updated.code, name: updated.name } : s));
      setSelectedSubject(prev => prev ? { ...prev, code: updated.code, name: updated.name } : prev);
      setIsEditing(false);
      showToast(`Subject updated to "${updated.code} – ${updated.name}"`, 'success');
    } catch (err: any) {
      const apiErrors = err?.response?.data?.errors || {};
      setEditErrors(apiErrors);
      if (!apiErrors.code && !apiErrors.name) showToast('Failed to save changes', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Add student to subject
  const handleEnroll = async (student: StudentItem) => {
    if (!selectedSubject) return;
    setActionLoadingId(student.id);
    try {
      await facultyService.updateEnrollment(selectedSubject.id, { student_id: student.id, action: 'add' });
      setAvailable(prev => prev.filter(s => s.id !== student.id));
      setEnrolled(prev => [student, ...prev].sort((a, b) => a.register_no.localeCompare(b.register_no)));
      showToast(`✓ Enrolled ${student.name} (${student.register_no})`, 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.response?.data?.error || 'Enrollment failed', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Remove student from subject
  const handleRemove = async (student: StudentItem) => {
    if (!selectedSubject) return;
    setActionLoadingId(student.id);
    try {
      await facultyService.updateEnrollment(selectedSubject.id, { student_id: student.id, action: 'remove' });
      setEnrolled(prev => prev.filter(s => s.id !== student.id));
      setAvailable(prev => [student, ...prev].sort((a, b) => a.register_no.localeCompare(b.register_no)));
      showToast(`Removed ${student.name} from ${selectedSubject.code}`, 'warning');
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to remove student', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredSubjects = subjects.filter(s =>
    s.code.toLowerCase().includes(subjectSearch.toLowerCase()) ||
    s.name.toLowerCase().includes(subjectSearch.toLowerCase())
  );

  const filteredEnrolled = enrolled.filter(s =>
    s.register_no.toLowerCase().includes(removeSearch.toLowerCase()) ||
    s.name.toLowerCase().includes(removeSearch.toLowerCase())
  );

  const filteredAvailable = available.filter(s =>
    s.register_no.toLowerCase().includes(enrollSearch.toLowerCase()) ||
    s.name.toLowerCase().includes(enrollSearch.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
            <BookMarked className="w-4 h-4 text-primary dark:text-aqua" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-ink dark:text-white">Subject Management</h2>
            <p className="text-xs text-ink-500 dark:text-ink-400">Edit subject details • Add or remove enrolled students</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-aqua/10 text-aqua-dark dark:text-aqua border border-aqua/20">
          Faculty Edit Access
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Subject List */}
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-primary dark:text-aqua" />
            <span className="text-sm font-bold text-ink dark:text-white">All Subjects</span>
            <span className="ml-auto text-xs text-ink-400">{subjects.length} total</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400" />
            <input
              type="text"
              value={subjectSearch}
              onChange={e => setSubjectSearch(e.target.value)}
              placeholder="Search subjects..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-ink-50 dark:bg-darkcard2 border border-ink-100 dark:border-darkborder text-ink dark:text-white placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
            {filteredSubjects.map(subj => (
              <button
                key={subj.id}
                onClick={() => handleSelectSubject(subj)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-2 group ${
                  selectedSubject?.id === subj.id
                    ? 'bg-primary/10 border-primary/40 dark:bg-primary/20 dark:border-primary'
                    : 'border-ink-100 dark:border-darkborder hover:bg-ink-50 dark:hover:bg-darkcard2'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary dark:text-aqua">
                      {subj.code}
                    </span>
                    <span className="text-[10px] text-ink-400">Sem {subj.semester}</span>
                  </div>
                  <p className="text-xs font-semibold text-ink dark:text-white truncate">{subj.name}</p>
                  <p className="text-[10px] text-ink-400 mt-0.5">{subj.credits} credits • Year {subj.year}</p>
                </div>
                <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${selectedSubject?.id === subj.id ? 'text-primary rotate-90' : 'text-ink-300 group-hover:translate-x-0.5'}`} />
              </button>
            ))}
            {filteredSubjects.length === 0 && (
              <div className="text-center py-8 text-ink-400 text-xs">No subjects found</div>
            )}
          </div>
        </div>

        {/* Right: Detail Panel */}
        {!selectedSubject ? (
          <div className="lg:col-span-2 glass-card rounded-2xl flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="w-10 h-10 text-ink-200 dark:text-ink-600 mb-3" />
            <p className="text-sm font-semibold text-ink-400">Select a subject from the list</p>
            <p className="text-xs text-ink-300 dark:text-ink-500 mt-1">to edit its details and manage enrollments</p>
          </div>
        ) : (
          <div className="lg:col-span-2 space-y-4">
            {/* Subject Details Card */}
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary dark:text-aqua" />
                  <span className="text-sm font-bold text-ink dark:text-white">Subject Details</span>
                </div>
                {!isEditing ? (
                  <button
                    onClick={() => { setIsEditing(true); setEditCode(selectedSubject.code); setEditName(selectedSubject.name); setEditErrors({}); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary dark:text-aqua border border-primary/20 dark:border-aqua/20 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Details
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setIsEditing(false); setEditErrors({}); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-ink-100 hover:bg-ink-200 dark:bg-darkcard2 dark:hover:bg-darkborder text-ink-600 dark:text-ink-300 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white transition-colors disabled:opacity-60"
                    >
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Save Changes
                    </button>
                  </div>
                )}
              </div>

              {!isEditing ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: Hash, label: 'Subject Code', value: selectedSubject.code, highlight: true },
                    { icon: BookOpen, label: 'Subject Name', value: selectedSubject.name, highlight: false, span: true },
                    { icon: GraduationCap, label: 'Semester', value: `Sem ${selectedSubject.semester}`, highlight: false },
                    { icon: BookMarked, label: 'Credits', value: `${selectedSubject.credits} Credits`, highlight: false },
                  ].map(({ icon: Icon, label, value, highlight, span }) => (
                    <div key={label} className={`bg-ink-50 dark:bg-darkcard2 rounded-xl p-3 ${span ? 'col-span-2' : ''}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className="w-3 h-3 text-ink-400" />
                        <span className="text-[10px] font-bold text-ink-400 uppercase tracking-wider">{label}</span>
                      </div>
                      <p className={`text-sm font-bold ${highlight ? 'text-primary dark:text-aqua' : 'text-ink dark:text-white'}`}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Code Field */}
                  <div>
                    <label className="block text-xs font-bold text-ink-500 dark:text-ink-400 mb-1.5 uppercase tracking-wider">
                      Subject Code *
                    </label>
                    <input
                      type="text"
                      value={editCode}
                      onChange={e => { setEditCode(e.target.value.toUpperCase()); setEditErrors(p => ({ ...p, code: undefined })); }}
                      placeholder="e.g. CS501"
                      maxLength={20}
                      className={`w-full px-3 py-2.5 text-sm font-mono rounded-xl border bg-white dark:bg-darkcard2 text-ink dark:text-white placeholder:text-ink-300 focus:outline-none focus:ring-2 transition-all ${
                        editErrors.code ? 'border-coral ring-coral/20' : 'border-ink-200 dark:border-darkborder focus:ring-primary/30 focus:border-primary'
                      }`}
                    />
                    {editErrors.code && (
                      <p className="mt-1 text-xs text-coral flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {editErrors.code}
                      </p>
                    )}
                  </div>
                  {/* Name Field */}
                  <div>
                    <label className="block text-xs font-bold text-ink-500 dark:text-ink-400 mb-1.5 uppercase tracking-wider">
                      Subject Name *
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => { setEditName(e.target.value); setEditErrors(p => ({ ...p, name: undefined })); }}
                      placeholder="e.g. Advanced Algorithms"
                      maxLength={150}
                      className={`w-full px-3 py-2.5 text-sm rounded-xl border bg-white dark:bg-darkcard2 text-ink dark:text-white placeholder:text-ink-300 focus:outline-none focus:ring-2 transition-all ${
                        editErrors.name ? 'border-coral ring-coral/20' : 'border-ink-200 dark:border-darkborder focus:ring-primary/30 focus:border-primary'
                      }`}
                    />
                    {editErrors.name && (
                      <p className="mt-1 text-xs text-coral flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {editErrors.name}
                      </p>
                    )}
                  </div>
                  <div className="col-span-full bg-amber/10 border border-amber/20 rounded-xl px-3 py-2 flex items-start gap-2 text-xs text-amber-dark dark:text-amber">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>Changing the subject code or name will be recorded in the Audit Log. All linked attendance, marks and grades will remain intact.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Enrollment Management */}
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-aqua-dark dark:text-aqua" />
                <span className="text-sm font-bold text-ink dark:text-white">Student Enrollment</span>
                <div className="ml-auto flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-aqua/10 text-aqua-dark dark:text-aqua border border-aqua/20">
                    {enrolled.length} enrolled
                  </span>
                  <button
                    onClick={() => loadStudents(selectedSubject.id)}
                    disabled={isLoadingStudents}
                    className="p-1.5 rounded-lg text-ink-400 hover:text-ink dark:hover:text-white hover:bg-ink-100 dark:hover:bg-darkcard2 transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStudents ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {isLoadingStudents ? (
                <div className="py-12 flex flex-col items-center gap-2 text-ink-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-xs">Loading students...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Currently Enrolled */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-xs font-bold text-ink dark:text-white">Currently Enrolled</span>
                      <span className="text-[10px] text-ink-400">({enrolled.length})</span>
                    </div>
                    <div className="relative mb-2">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-ink-400" />
                      <input
                        type="text"
                        value={removeSearch}
                        onChange={e => setRemoveSearch(e.target.value)}
                        placeholder="Search to remove..."
                        className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg bg-ink-50 dark:bg-darkcard2 border border-ink-100 dark:border-darkborder text-ink dark:text-white placeholder:text-ink-400 focus:outline-none focus:ring-1 focus:ring-coral/30"
                      />
                    </div>
                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
                      {filteredEnrolled.length === 0 ? (
                        <div className="text-center py-6 text-xs text-ink-400">
                          {enrolled.length === 0 ? 'No students enrolled yet' : 'No matching students'}
                        </div>
                      ) : filteredEnrolled.map(s => (
                        <div key={s.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20 group">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-ink dark:text-white truncate">{s.name}</p>
                            <p className="text-[10px] text-ink-400">{s.register_no} • Yr {s.year}{s.section}</p>
                          </div>
                          <button
                            onClick={() => handleRemove(s)}
                            disabled={actionLoadingId === s.id}
                            title={`Remove ${s.name}`}
                            className="p-1.5 rounded-lg text-coral hover:bg-coral/10 transition-colors flex-shrink-0 disabled:opacity-40"
                          >
                            {actionLoadingId === s.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <UserMinus className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Available to Add */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <UserPlus className="w-3.5 h-3.5 text-primary dark:text-aqua" />
                      <span className="text-xs font-bold text-ink dark:text-white">Available to Add</span>
                      <span className="text-[10px] text-ink-400">({available.length})</span>
                    </div>
                    <div className="relative mb-2">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-ink-400" />
                      <input
                        type="text"
                        value={enrollSearch}
                        onChange={e => setEnrollSearch(e.target.value)}
                        placeholder="Search to add..."
                        className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg bg-ink-50 dark:bg-darkcard2 border border-ink-100 dark:border-darkborder text-ink dark:text-white placeholder:text-ink-400 focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                    </div>
                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
                      {filteredAvailable.length === 0 ? (
                        <div className="text-center py-6 text-xs text-ink-400">
                          {available.length === 0 ? 'All students are already enrolled' : 'No matching students'}
                        </div>
                      ) : filteredAvailable.map(s => (
                        <div key={s.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-ink-50 dark:bg-darkcard2 border border-ink-100 dark:border-darkborder group hover:border-primary/30 dark:hover:border-aqua/30 transition-colors">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-ink dark:text-white truncate">{s.name}</p>
                            <p className="text-[10px] text-ink-400">{s.register_no} • Yr {s.year}{s.section}</p>
                          </div>
                          <button
                            onClick={() => handleEnroll(s)}
                            disabled={actionLoadingId === s.id}
                            title={`Enroll ${s.name}`}
                            className="p-1.5 rounded-lg text-primary dark:text-aqua hover:bg-primary/10 dark:hover:bg-aqua/10 transition-colors flex-shrink-0 disabled:opacity-40"
                          >
                            {actionLoadingId === s.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <UserPlus className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
