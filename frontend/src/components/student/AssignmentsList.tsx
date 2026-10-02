import React, { useState } from 'react';
import { AssignmentItem } from '../../types';
import { Badge } from '../common/Badge';
import { FileText, Send, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { studentService } from '../../services/api';

interface AssignmentsListProps {
  assignments: AssignmentItem[];
  onSubmissionSuccess?: () => void;
}

export const AssignmentsList: React.FC<AssignmentsListProps> = ({
  assignments,
  onSubmissionSuccess,
}) => {
  const [activeModalSubmission, setActiveModalSubmission] = useState<AssignmentItem | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleOpenSubmit = (item: AssignmentItem) => {
    setActiveModalSubmission(item);
    setSubmissionText(item.submission_text || '');
    setFileUrl(item.file_url || '');
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalSubmission) return;
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await studentService.submitAssignment(activeModalSubmission.id, {
        submission_text: submissionText,
        file_url: fileUrl,
      });
      setActiveModalSubmission(null);
      if (onSubmissionSuccess) onSubmissionSuccess();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to submit assignment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card rounded-3xl p-6 shadow-card transition-all duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-ink-100 dark:border-darkborder mb-4">
        <div>
          <h2 className="text-lg font-extrabold text-ink dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Course Assignments
          </h2>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
            Submit coursework, track evaluation grades, and review faculty remarks.
          </p>
        </div>
      </div>

      <div className="divide-y divide-ink-100 dark:divide-darkborder">
        {assignments.map((item) => {
          const isPending = item.status === 'PENDING';
          const isGraded = item.status === 'GRADED';

          return (
            <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Badge variant={item.status.toLowerCase() as any}>
                    {item.status}
                  </Badge>
                  <span className="text-xs text-ink-400">
                    Due: {new Date(item.due_date).toLocaleDateString()} at {new Date(item.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <h4 className="text-base font-bold text-ink dark:text-white">
                  {item.assignment_title}
                </h4>

                {item.faculty_feedback && (
                  <div className="mt-2 p-2.5 rounded-xl bg-ink-50 dark:bg-darkcard2 border border-ink-100 dark:border-darkborder text-xs text-ink-600 dark:text-ink-300">
                    <strong className="text-primary dark:text-aqua">Faculty Feedback:</strong> {item.faculty_feedback}
                  </div>
                )}
              </div>

              {/* Right side: marks / submit action */}
              <div className="flex items-center gap-3 shrink-0">
                {isGraded ? (
                  <div className="text-right">
                    <span className="text-[11px] uppercase font-bold text-ink-400 block">Score</span>
                    <span className="text-lg font-extrabold text-primary dark:text-aqua">
                      {item.marks_awarded} / {item.max_marks}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-ink-400">
                    Max: {item.max_marks} pts
                  </span>
                )}

                <button
                  onClick={() => handleOpenSubmit(item)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isPending
                      ? 'text-white gradient-brand hover:opacity-90 shadow-sm'
                      : 'bg-ink-100 hover:bg-ink-200 dark:bg-darkcard2 dark:hover:bg-darkborder text-ink-700 dark:text-ink-200'
                  }`}
                >
                  {isPending ? 'Submit Work' : 'View / Edit'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submission Modal */}
      {activeModalSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-card max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-ink-200 dark:border-darkborder animate-slide-up">
            <h3 className="text-lg font-extrabold text-ink dark:text-white">
              Assignment Submission
            </h3>
            <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">
              {activeModalSubmission.assignment_title}
            </p>

            {errorMsg && (
              <div className="mt-3 p-3 rounded-xl bg-coral-light dark:bg-coral/20 text-coral text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400 mb-1">
                  GitHub Repository or Submission URL
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/username/repo-name"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard text-ink dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400 mb-1">
                  Submission Notes & Solution Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe your design choices, test cases, and instructions to run your solution..."
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-ink-200 dark:border-darkborder bg-white dark:bg-darkcard text-ink dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-ink-100 dark:border-darkborder">
                <button
                  type="button"
                  onClick={() => setActiveModalSubmission(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-darkcard2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white gradient-brand shadow-md hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
