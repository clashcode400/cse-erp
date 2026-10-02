import React from 'react';
import { SubjectInternalMark } from '../../types';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface InternalMarksTableProps {
  marks: SubjectInternalMark[];
}

export const InternalMarksTable: React.FC<InternalMarksTableProps> = ({ marks }) => {
  return (
    <div className="glass-card rounded-3xl p-6 shadow-card transition-all duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-ink-100 dark:border-darkborder mb-4">
        <div>
          <h2 className="text-lg font-extrabold text-ink dark:text-white">
            Continuous Internal Assessments (CIA)
          </h2>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
            Subject-wise periodic tests, practical lab exams, and internal weightages.
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light border border-primary/20">
          Semester 5
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-100 dark:border-darkborder text-[11px] font-extrabold tracking-wider uppercase text-ink-400 dark:text-ink-400">
              <th className="py-3 px-3">Subject</th>
              <th className="py-3 px-3">Assessments</th>
              <th className="py-3 px-3">Total Marks</th>
              <th className="py-3 px-3 min-w-[140px]">Progress</th>
              <th className="py-3 px-3 text-right">Percentage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100 dark:divide-darkborder">
            {marks.map((sub) => {
              const isExcellent = sub.percentage >= 85;
              const isSatisfactory = sub.percentage >= 70;

              return (
                <tr
                  key={sub.subject_id}
                  className="hover:bg-ink-50/60 dark:hover:bg-darkcard2/40 transition-colors"
                >
                  {/* Subject info */}
                  <td className="py-3.5 px-3">
                    <div className="font-mono text-xs font-bold text-primary dark:text-aqua">
                      {sub.subject_code}
                    </div>
                    <div className="text-xs font-bold text-ink dark:text-white">
                      {sub.subject_name}
                    </div>
                  </td>

                  {/* Individual assessments */}
                  <td className="py-3.5 px-3">
                    <div className="flex flex-wrap gap-1.5">
                      {sub.assessments.map((a, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-ink-100/70 dark:bg-darkcard2 text-[11px] font-semibold text-ink-700 dark:text-ink-200 border border-ink-200/50 dark:border-darkborder"
                          title={`${a.name}: ${a.marks_obtained}/${a.max_marks} (${a.date})`}
                        >
                          <span className="text-ink-400">{a.name.replace('Internal Assessment', 'IA')}:</span>
                          <span className="font-bold text-ink dark:text-white">
                            {a.marks_obtained}
                          </span>
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Total Obtained */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span className="font-extrabold text-ink dark:text-white">
                      {sub.total_obtained.toFixed(1)}
                    </span>
                    <span className="text-xs text-ink-400"> / {sub.total_max}</span>
                  </td>

                  {/* Progress Bar */}
                  <td className="py-3.5 px-3">
                    <div className="w-full h-2.5 rounded-full bg-ink-100 dark:bg-darkcard2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isExcellent
                            ? 'bg-aqua'
                            : isSatisfactory
                            ? 'bg-primary'
                            : 'bg-amber'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, sub.percentage))}%` }}
                      />
                    </div>
                  </td>

                  {/* Percentage */}
                  <td className="py-3.5 px-3 text-right whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                        isExcellent
                          ? 'bg-aqua-light text-aqua-dark dark:bg-aqua/20 dark:text-aqua'
                          : isSatisfactory
                          ? 'bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light'
                          : 'bg-amber-light text-amber-dark dark:bg-amber/20 dark:text-amber'
                      }`}
                    >
                      {sub.percentage.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};
