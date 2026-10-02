import React from 'react';
import { ProjectItem } from '../../types';
import { FolderGit2, Calendar, MapPin, Award, CheckCircle2, UserCheck } from 'lucide-react';
import { Badge } from '../common/Badge';

interface ProjectsListProps {
  projects: ProjectItem[];
}

export const ProjectsList: React.FC<ProjectsListProps> = ({ projects }) => {
  return (
    <div className="glass-card rounded-3xl p-6 shadow-card transition-all duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-ink-100 dark:border-darkborder mb-4">
        <div>
          <h2 className="text-lg font-extrabold text-ink dark:text-white flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-aqua" />
            CSE Capstone & Mini Projects
          </h2>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
            Phase milestones, faculty guides, review schedules, and viva evaluation rubrics.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {projects.map((proj) => (
          <div
            key={proj.id}
            className="p-5 rounded-2xl bg-white dark:bg-darkcard border border-ink-100 dark:border-darkborder shadow-sm hover:border-aqua/40 transition-colors"
          >
            {/* Title & Domain */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div>
                <span className="text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-md bg-aqua-light text-aqua-dark dark:bg-aqua/20 dark:text-aqua">
                  {proj.domain}
                </span>
                <h3 className="text-base font-extrabold text-ink dark:text-white mt-1">
                  {proj.title}
                </h3>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light border border-primary/20 self-start sm:self-center">
                {proj.status.replace('_', ' ')}
              </span>
            </div>

            <p className="text-xs text-ink-500 dark:text-ink-400 mt-1 leading-relaxed">
              {proj.abstract}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-600 dark:text-ink-300 pt-2 border-t border-ink-100 dark:border-darkborder">
              <span className="flex items-center gap-1 font-semibold">
                <UserCheck className="w-3.5 h-3.5 text-primary" />
                Guide: {proj.guide_name}
              </span>
              <span>Year {proj.year} • Academic Year {proj.academic_year}</span>
            </div>

            {/* Reviews Section */}
            {proj.reviews && proj.reviews.length > 0 && (
              <div className="mt-4 pt-3 border-t border-ink-100 dark:border-darkborder">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-ink-400 dark:text-ink-400 mb-2">
                  Review Milestones & Viva
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {proj.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3 rounded-xl bg-ink-50/70 dark:bg-darkcard2/50 border border-ink-100 dark:border-darkborder text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-ink dark:text-white">
                          {rev.review_name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light">
                          {rev.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-ink-500 dark:text-ink-400 mt-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(rev.review_date).toLocaleDateString()} at {new Date(rev.review_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-ink-500 dark:text-ink-400 mt-0.5">
                        <MapPin className="w-3 h-3 text-coral" />
                        <span>{rev.venue}</span>
                      </div>

                      {rev.comments && (
                        <p className="mt-1.5 text-[11px] text-ink-600 dark:text-ink-300 italic">
                          "{rev.comments}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};
