import React from 'react';

export type BadgeVariant =
  | 'pending'
  | 'submitted'
  | 'late'
  | 'graded'
  | 'pass'
  | 'fail'
  | 'urgent'
  | 'primary'
  | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  let variantClasses = '';
  switch (variant) {
    case 'pending':
      variantClasses = 'bg-amber-light text-amber-dark dark:bg-amber/20 dark:text-amber border border-amber/30';
      break;
    case 'submitted':
      variantClasses = 'bg-aqua-light text-aqua-dark dark:bg-aqua/20 dark:text-aqua border border-aqua/30';
      break;
    case 'late':
      variantClasses = 'bg-coral-light text-coral dark:bg-coral/20 dark:text-coral border border-coral/30';
      break;
    case 'graded':
      variantClasses = 'bg-primary-light text-primary dark:bg-primary/20 dark:text-primary-light border border-primary/30';
      break;
    case 'pass':
      variantClasses = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20';
      break;
    case 'fail':
      variantClasses = 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-500/20';
      break;
    case 'urgent':
      variantClasses = 'bg-coral text-white font-bold animate-pulse shadow-sm';
      break;
    case 'primary':
      variantClasses = 'bg-primary text-white font-medium shadow-sm';
      break;
    case 'neutral':
    default:
      variantClasses = 'bg-ink-100 text-ink-700 dark:bg-darkcard2 dark:text-ink-200 border border-ink-200/50 dark:border-darkborder';
      break;
  }

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full uppercase tracking-wider ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};
