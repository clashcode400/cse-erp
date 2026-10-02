import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: {
    text: string;
    variant: 'positive' | 'warning' | 'neutral' | 'accent';
  };
  highlightColor?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  badge,
  className = '',
}) => {
  return (
    <div
      className={`glass-card p-5 rounded-2xl shadow-card transition-all duration-300 hover:shadow-cardHover hover:-translate-y-1 ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold tracking-wider uppercase text-ink-400 dark:text-ink-300">
          {title}
        </span>
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-primary-light dark:bg-darkcard2 flex items-center justify-center text-primary dark:text-aqua">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-2">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-ink dark:text-white tracking-tight">
          {value}
        </h3>
        {badge && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              badge.variant === 'positive'
                ? 'bg-aqua-light text-aqua-dark dark:bg-aqua/20 dark:text-aqua'
                : badge.variant === 'warning'
                ? 'bg-coral-light text-coral dark:bg-coral/20 dark:text-coral'
                : badge.variant === 'accent'
                ? 'bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light'
                : 'bg-ink-100 text-ink-700 dark:bg-darkcard2 dark:text-ink-200'
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
          {subtitle}
        </p>
      )}
    </div>
  );
};
