import React from 'react';
import { EventType } from '../types';

interface ColorBadgeProps {
  type: EventType | 'task' | 'class';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ColorBadge: React.FC<ColorBadgeProps> = ({
  type,
  label,
  size = 'md',
  className = '',
}) => {
  const getStyles = () => {
    switch (type) {
      case 'college_day':
      case 'class':
        return {
          bg: 'bg-orange-50 text-orange-800 border-orange-200',
          dot: 'bg-orange-500',
          defaultLabel: 'College Day',
        };
      case 'holiday':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          defaultLabel: 'Holiday',
        };
      case 'exam':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          dot: 'bg-rose-500',
          defaultLabel: 'Exam',
        };
      case 'event':
      case 'deadline':
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-200',
          dot: 'bg-purple-500',
          defaultLabel: type === 'deadline' ? 'Deadline' : 'College Event',
        };
      case 'task':
      default:
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          dot: 'bg-blue-600',
          defaultLabel: 'Study Task',
        };
    }
  };

  const style = getStyles();
  const text = label || style.defaultLabel;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border ${style.bg} ${sizeClasses[size]} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      <span>{text}</span>
    </span>
  );
};

export const LegendBar: React.FC = () => {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
      <span className="font-semibold text-slate-700">Legend:</span>
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
        <span>College Days</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        <span>Holidays</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
        <span>Exams</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
        <span>Events / Deadlines</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
        <span>Personal Study</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full ring-2 ring-indigo-500 bg-white" />
        <span className="font-medium text-slate-900">Today</span>
      </div>
    </div>
  );
};
