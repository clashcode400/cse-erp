import React from 'react';

interface CircularProgressProps {
  value: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  warningThreshold?: number; // default 75
  subtext?: string;
  attendedText?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 140,
  strokeWidth = 12,
  warningThreshold = 75,
  subtext = 'Overall Attendance',
  attendedText,
}) => {
  const isWarning = value < warningThreshold;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(100, Math.max(0, value));
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  // Colors based on warning threshold
  const strokeColor = isWarning ? '#FF7A6B' : '#2DD4BF';
  const trackColor = isWarning ? 'rgba(255, 122, 107, 0.15)' : 'rgba(45, 212, 191, 0.15)';

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
          />
          {/* Animated active progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center label */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className={`text-3xl font-extrabold tracking-tight ${isWarning ? 'text-coral' : 'text-ink dark:text-white'}`}>
            {value.toFixed(1)}%
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-300">
            {isWarning ? 'Low Alert' : 'Good'}
          </span>
        </div>
      </div>

      {subtext && (
        <p className="mt-2 text-xs font-medium text-ink-500 dark:text-ink-300 text-center">
          {subtext}
        </p>
      )}
      {attendedText && (
        <span className="text-xs font-semibold text-ink-700 dark:text-ink-200 mt-0.5">
          {attendedText}
        </span>
      )}
    </div>
  );
};
