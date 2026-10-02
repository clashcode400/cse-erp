import React, { useState, useEffect } from 'react';
import { SubmissionPendingItem } from '../../types';
import { Clock, AlertTriangle, CheckCircle, ArrowRight, Calendar, AlertCircle } from 'lucide-react';
import { Badge } from '../common/Badge';

interface SubmissionPendingPanelProps {
  items: SubmissionPendingItem[];
  onSubmitClick?: (submissionId: number) => void;
}

export const SubmissionPendingPanel: React.FC<SubmissionPendingPanelProps> = ({
  items,
  onSubmitClick,
}) => {
  // Live ticker that triggers state rerender every second to keep countdowns accurate
  const [, setTick] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (dueDateStr: string) => {
    const now = new Date().getTime();
    const target = new Date(dueDateStr).getTime();
    const diff = target - now;

    if (diff <= 0) {
      const pastSeconds = Math.abs(Math.floor(diff / 1000));
      const hours = Math.floor(pastSeconds / 3600);
      const mins = Math.floor((pastSeconds % 3600) / 60);
      return { text: `Overdue by ${hours}h ${mins}m`, isOverdue: true, isUrgent: false };
    }

    const totalSecs = Math.floor(diff / 1000);
    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    const isUrgent = days === 0; // Less than 24 hours

    if (days > 0) {
      return { text: `${days}d ${hours}h ${mins}m left`, isOverdue: false, isUrgent };
    }
    return { text: `${hours}h ${mins}m ${secs}s left`, isOverdue: false, isUrgent: true };
  };

  return (
    <div className="glass-card rounded-3xl p-6 shadow-card transition-all duration-300 border-l-4 border-l-amber">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-ink-100 dark:border-darkborder mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-ink dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber" />
              Submission Pending Panel
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-light text-amber-dark dark:bg-amber/20 dark:text-amber border border-amber/30">
              {items.length} Pending
            </span>
          </div>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
            All unsubmitted assignments & upcoming project review milestones, sorted strictly by nearest deadline.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center text-ink-500 dark:text-ink-400">
          <CheckCircle className="w-10 h-10 text-aqua mx-auto mb-2" />
          <p className="text-sm font-bold text-ink dark:text-white">All Caught Up!</p>
          <p className="text-xs">No pending assignments or immediate review deadlines scheduled.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => {
            const countdown = formatCountdown(item.due_date);

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all duration-300 relative flex flex-col justify-between ${
                  countdown.isOverdue
                    ? 'bg-coral-light/30 dark:bg-coral/10 border-coral/40'
                    : countdown.isUrgent
                    ? 'bg-amber-light/40 dark:bg-amber/10 border-amber/50 shadow-sm'
                    : 'bg-white dark:bg-darkcard border-ink-100 dark:border-darkborder hover:border-primary/40'
                }`}
              >
                <div>
                  {/* Top tags */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-md bg-ink-100 dark:bg-darkcard2 text-ink-600 dark:text-ink-300">
                      {item.type === 'ASSIGNMENT' ? 'Course Assignment' : 'Project Review'}
                    </span>

                    {/* Urgency Countdown Chip */}
                    <span
                      className={`inline-flex items-center gap-1 font-mono text-xs font-black px-2.5 py-0.5 rounded-full ${
                        countdown.isOverdue
                          ? 'bg-coral text-white shadow-sm'
                          : countdown.isUrgent
                          ? 'bg-amber text-ink font-bold animate-pulse shadow-sm'
                          : 'bg-ink-100 dark:bg-darkcard2 text-ink-700 dark:text-ink-200'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {countdown.text}
                    </span>
                  </div>

                  {/* Title & Subject */}
                  <h4 className="text-sm font-bold text-ink dark:text-white leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-xs font-semibold text-primary dark:text-aqua mt-0.5">
                    {item.subject}
                  </p>

                  {/* Details */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-500 dark:text-ink-400">
                    {item.faculty && (
                      <span>Faculty: <strong className="text-ink dark:text-white">{item.faculty}</strong></span>
                    )}
                    {item.venue && (
                      <span>Venue: <strong className="text-ink dark:text-white">{item.venue}</strong></span>
                    )}
                    <span>Max Marks: <strong className="text-ink dark:text-white">{item.max_marks}</strong></span>
                  </div>
                </div>

                {/* Submit action for assignments */}
                {item.type === 'ASSIGNMENT' && item.submission_id && (
                  <div className="mt-4 pt-3 border-t border-ink-100/70 dark:border-darkborder flex items-center justify-between">
                    <span className="text-[11px] text-ink-400">
                      Deadline: {new Date(item.due_date).toLocaleDateString()} at {new Date(item.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={() => onSubmitClick && item.submission_id && onSubmitClick(item.submission_id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-white gradient-brand hover:opacity-90 transition-opacity flex items-center gap-1 shadow-sm"
                    >
                      Submit Now
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
