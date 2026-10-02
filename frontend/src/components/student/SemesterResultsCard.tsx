import React, { useState } from 'react';
import { SemesterResult } from '../../types';
import { Award, CheckCircle2, XCircle, FileText, ChevronRight } from 'lucide-react';

interface SemesterResultsCardProps {
  semesters: SemesterResult[];
}

export const SemesterResultsCard: React.FC<SemesterResultsCardProps> = ({ semesters }) => {
  const [selectedSem, setSelectedSem] = useState<number>(() => {
    return semesters.length > 0 ? semesters[semesters.length - 1].semester : 1;
  });

  const activeResult = semesters.find((s) => s.semester === selectedSem) || semesters[0];

  return (
    <div className="glass-card rounded-3xl p-6 shadow-card transition-all duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-ink-100 dark:border-darkborder gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-ink dark:text-white">
            End-Semester Academic Transcripts
          </h2>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
            Published semester grades, credits earned, and university result status.
          </p>
        </div>

        {/* Semester selector tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-ink-100/70 dark:bg-darkcard2 border border-ink-200/50 dark:border-darkborder overflow-x-auto">
          {semesters.map((sem) => (
            <button
              key={sem.semester}
              onClick={() => setSelectedSem(sem.semester)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                selectedSem === sem.semester
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-ink-600 dark:text-ink-300 hover:text-ink dark:hover:text-white'
              }`}
            >
              Sem {sem.semester}
            </button>
          ))}
        </div>
      </div>

      {activeResult && (
        <div className="mt-5 space-y-5 animate-fade-in">
          
          {/* Summary Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-ink-50/60 dark:bg-darkcard2/40 border border-ink-100/60 dark:border-darkborder">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                SGPA
              </span>
              <p className="text-xl sm:text-2xl font-black text-primary dark:text-aqua">
                {activeResult.sgpa.toFixed(2)}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                Percentage
              </span>
              <p className="text-xl sm:text-2xl font-black text-ink dark:text-white">
                {activeResult.percentage.toFixed(1)}%
              </p>
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                Credits Earned
              </span>
              <p className="text-xl sm:text-2xl font-black text-ink dark:text-white">
                {activeResult.earned_credits} / {activeResult.total_credits}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                Result Status
              </span>
              <div className="mt-0.5">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black ${
                    activeResult.status === 'PASS'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400'
                  }`}
                >
                  {activeResult.status === 'PASS' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {activeResult.status}
                </span>
              </div>
            </div>
          </div>

          {/* Grades Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 dark:border-darkborder text-[11px] font-extrabold tracking-wider uppercase text-ink-400">
                  <th className="py-2.5 px-3">Subject Code & Title</th>
                  <th className="py-2.5 px-2 text-center">Credits</th>
                  <th className="py-2.5 px-2 text-center">CIA (50)</th>
                  <th className="py-2.5 px-2 text-center">ESE (50)</th>
                  <th className="py-2.5 px-2 text-center">Total (100)</th>
                  <th className="py-2.5 px-3 text-center">Grade</th>
                  <th className="py-2.5 px-3 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-darkborder">
                {activeResult.grades.map((g, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-ink-50/50 dark:hover:bg-darkcard2/30 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="font-mono text-xs font-bold text-primary dark:text-aqua">
                        {g.subject_code}
                      </div>
                      <div className="text-xs font-bold text-ink dark:text-white">
                        {g.subject_name}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-xs text-ink-700 dark:text-ink-200">
                      {g.credits}
                    </td>
                    <td className="py-3 px-2 text-center text-xs text-ink-600 dark:text-ink-300">
                      {g.internal_marks}
                    </td>
                    <td className="py-3 px-2 text-center text-xs text-ink-600 dark:text-ink-300">
                      {g.external_marks}
                    </td>
                    <td className="py-3 px-2 text-center font-extrabold text-xs text-ink dark:text-white">
                      {g.total_marks}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-md font-black text-xs bg-ink-100 dark:bg-darkcard2 text-ink-900 dark:text-white border border-ink-200 dark:border-darkborder">
                        {g.grade} ({g.grade_point})
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          g.result_status === 'PASS'
                            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                            : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30'
                        }`}
                      >
                        {g.result_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
};
