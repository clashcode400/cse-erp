import React from 'react';
import { CircularProgress } from '../common/CircularProgress';
import { AttendanceData } from '../../types';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

interface AttendanceCardProps {
  data: AttendanceData;
}

export const AttendanceCard: React.FC<AttendanceCardProps> = ({ data }) => {
  const isWarning = data.overall_percentage < 75.0;

  return (
    <div className="glass-card rounded-3xl p-6 shadow-card transition-all duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-ink-100 dark:border-darkborder">
        <div>
          <h2 className="text-lg font-extrabold text-ink dark:text-white flex items-center gap-2">
            Attendance Monitoring
            {isWarning ? (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-coral-light text-coral dark:bg-coral/20 border border-coral/30 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Shortage Alert (&lt; 75%)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-aqua-light text-aqua-dark dark:bg-aqua/20 dark:text-aqua border border-aqua/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Eligible (&ge; 75%)
              </span>
            )}
          </h2>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
            Minimum 75% required by CSE Department Regulations for University Examinations.
          </p>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-xs text-ink-400 dark:text-ink-400">Total Classes</span>
          <p className="text-base font-extrabold text-ink dark:text-white">
            {data.attended_classes} / {data.total_classes}
          </p>
        </div>
      </div>

      {/* Coral Warning Banner if below 75% */}
      {isWarning && (
        <div className="mt-4 p-3.5 rounded-2xl bg-coral-light dark:bg-coral/15 border border-coral/30 text-coral flex items-start gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-extrabold block text-sm">
              Attendance Shortage Warning ({data.overall_percentage}%)
            </span>
            Your overall attendance is below the mandatory 75% threshold. Please meet your Faculty Advisor and submit medical or on-duty certificates immediately to avoid exam debarment.
          </div>
        </div>
      )}

      {/* Main Grid: Ring + Subject Bars */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Left: Overall Ring */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-2xl bg-ink-50/50 dark:bg-darkcard2/40 border border-ink-100/60 dark:border-darkborder">
          <CircularProgress
            value={data.overall_percentage}
            size={150}
            strokeWidth={14}
            warningThreshold={75}
            subtext="Overall Aggregate"
            attendedText={`${data.attended_classes} of ${data.total_classes} classes attended`}
          />
          <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-ink-600 dark:text-ink-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-aqua" /> &ge; 75% Safe
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-coral" /> &lt; 75% Alert
            </span>
          </div>
        </div>

        {/* Right: Subject-wise Bars */}
        <div className="md:col-span-8 space-y-3.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-400 dark:text-ink-300">
            Subject-wise Breakdown
          </h3>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {data.subjects.map((sub) => {
              const subWarning = sub.percentage < 75.0;
              return (
                <div
                  key={sub.subject_id}
                  className="p-3 rounded-2xl bg-white dark:bg-darkcard border border-ink-100 dark:border-darkborder shadow-sm hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-primary dark:text-aqua">
                        {sub.code}
                      </span>
                      <span className="text-xs font-bold text-ink dark:text-white truncate max-w-[200px] sm:max-w-xs">
                        {sub.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-ink-400">
                        {sub.attended_classes}/{sub.total_classes}
                      </span>
                      <span
                        className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                          subWarning
                            ? 'bg-coral-light text-coral dark:bg-coral/20'
                            : 'bg-aqua-light text-aqua-dark dark:bg-aqua/20 dark:text-aqua'
                        }`}
                      >
                        {sub.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-ink-100 dark:bg-darkcard2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        subWarning ? 'bg-coral' : 'bg-aqua'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, sub.percentage))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
