import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { AcademicSummary } from '../../types';
import { StatCard } from '../common/StatCard';
import { Award, TrendingUp, Layers, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface CgpaTrendChartProps {
  summary: AcademicSummary;
}

export const CgpaTrendChart: React.FC<CgpaTrendChartProps> = ({ summary }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const chartData = summary.trend.map((item) => ({
    name: item.semester,
    SGPA: item.sgpa,
    Percentage: item.percentage,
  }));

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 rounded-xl shadow-lg border border-ink-100 dark:border-darkborder text-xs">
          <p className="font-extrabold text-ink dark:text-white mb-1">{label}</p>
          <p className="text-primary font-bold">
            SGPA: <span className="text-ink dark:text-white">{payload[0].value.toFixed(2)}</span> / 10.0
          </p>
          {payload[1] && (
            <p className="text-aqua-dark dark:text-aqua font-bold">
              Percentage: <span className="text-ink dark:text-white">{payload[1].value.toFixed(1)}%</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card rounded-3xl p-6 shadow-card transition-all duration-300">
      
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Overall CGPA"
          value={summary.overall_cgpa.toFixed(2)}
          subtitle="Cumulative Grade Point Average"
          icon={<Award className="w-5 h-5" />}
          badge={{ text: 'Scale 10.0', variant: 'positive' }}
        />
        <StatCard
          title="Overall Percentage"
          value={`${summary.overall_percentage.toFixed(1)}%`}
          subtitle="Calculated across all credited courses"
          icon={<TrendingUp className="w-5 h-5" />}
          badge={{ text: 'Total Marks', variant: 'accent' }}
        />
        <StatCard
          title="Earned Credits"
          value={`${summary.cumulative_credits} Credits`}
          subtitle="Completed through Semester 5"
          icon={<Layers className="w-5 h-5" />}
          badge={{ text: '100% Cleared', variant: 'neutral' }}
        />
      </div>

      {/* Chart Header */}
      <div className="flex items-center justify-between pb-3 border-b border-ink-100 dark:border-darkborder">
        <div>
          <h3 className="text-base font-extrabold text-ink dark:text-white">
            Semester-wise Performance Trend
          </h3>
          <p className="text-xs text-ink-500 dark:text-ink-400">
            SGPA trajectory and overall marks distribution per semester.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-primary">
            <span className="w-3 h-3 rounded-full bg-primary" /> SGPA (Scale 10)
          </span>
          <span className="flex items-center gap-1.5 text-aqua-dark dark:text-aqua">
            <span className="w-3 h-3 rounded-full bg-aqua" /> Percentage (%)
          </span>
        </div>
      </div>

      {/* Line Chart */}
      <div className="mt-4 h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -15, bottom: 5 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? '#292E4D' : '#E6E7EE'}
              vertical={false}
            />
            <XAxis
              dataKey="name"
              stroke={isDark ? '#A4A8BF' : '#7B81A2'}
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: isDark ? '#292E4D' : '#E6E7EE' }}
            />
            <YAxis
              yAxisId="left"
              domain={[5, 10]}
              stroke={isDark ? '#A4A8BF' : '#7B81A2'}
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: isDark ? '#292E4D' : '#E6E7EE' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[50, 100]}
              stroke={isDark ? '#A4A8BF' : '#7B81A2'}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={customTooltip} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="SGPA"
              stroke="#5B5BD6"
              strokeWidth={3}
              dot={{ r: 5, fill: '#5B5BD6', strokeWidth: 2, stroke: '#FFFFFF' }}
              activeDot={{ r: 7, fill: '#5B5BD6' }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="Percentage"
              stroke="#2DD4BF"
              strokeWidth={2.5}
              strokeDasharray="4 4"
              dot={{ r: 4, fill: '#2DD4BF' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};
