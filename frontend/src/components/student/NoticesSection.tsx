import React, { useState } from 'react';
import { NoticeItem } from '../../types';
import { Bell, Pin, Calendar, Tag, ChevronDown, ChevronUp } from 'lucide-react';

interface NoticesSectionProps {
  notices: NoticeItem[];
}

export const NoticesSection: React.FC<NoticesSectionProps> = ({ notices }) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const categories = ['ALL', 'EXAM', 'ACADEMIC', 'PLACEMENT', 'PROJECT', 'EVENT'];

  const filteredNotices = notices.filter(
    (n) => filterCategory === 'ALL' || n.category === filterCategory
  );

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'EXAM':
        return 'bg-coral-light text-coral dark:bg-coral/20 border-coral/30';
      case 'PLACEMENT':
        return 'bg-amber-light text-amber-dark dark:bg-amber/20 border-amber/30';
      case 'PROJECT':
        return 'bg-aqua-light text-aqua-dark dark:bg-aqua/20 border-aqua/30';
      case 'EVENT':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-300/30';
      default:
        return 'bg-primary-light text-primary dark:bg-primary/20 border-primary/30';
    }
  };

  return (
    <div className="glass-card rounded-3xl p-6 shadow-card transition-all duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-ink-100 dark:border-darkborder gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-ink dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Department Circulars & Notices
          </h2>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
            Official announcements, examination schedules, placement drives, and symposiums.
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterCategory === cat
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-ink-100 dark:bg-darkcard2 text-ink-600 dark:text-ink-300 hover:text-ink'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 divide-y divide-ink-100 dark:divide-darkborder">
        {filteredNotices.map((notice) => {
          const isExpanded = expandedId === notice.id;

          return (
            <div key={notice.id} className="py-3.5 first:pt-0 last:pb-0">
              <div
                onClick={() => setExpandedId(isExpanded ? null : notice.id)}
                className="cursor-pointer group flex items-start justify-between gap-3"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {notice.is_pinned && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-coral text-white shadow-sm">
                        <Pin className="w-3 h-3 rotate-45" /> PINNED
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${getCategoryColor(
                        notice.category
                      )}`}
                    >
                      {notice.category}
                    </span>
                    <span className="text-[11px] text-ink-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(notice.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-ink dark:text-white group-hover:text-primary dark:group-hover:text-aqua transition-colors">
                    {notice.title}
                  </h4>

                  <p
                    className={`text-xs text-ink-500 dark:text-ink-300 mt-1 transition-all ${
                      isExpanded ? 'whitespace-pre-line' : 'line-clamp-2'
                    }`}
                  >
                    {notice.content}
                  </p>
                </div>

                <button className="text-ink-400 group-hover:text-ink dark:group-hover:text-white p-1 rounded-lg mt-1">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {notice.posted_by_name && (
                <div className="mt-2 text-[11px] text-ink-400 flex items-center gap-1">
                  Issued by: <strong className="text-ink-600 dark:text-ink-200">{notice.posted_by_name}</strong>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
