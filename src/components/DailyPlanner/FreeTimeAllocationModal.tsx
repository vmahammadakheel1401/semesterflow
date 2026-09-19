import React, { useState, useEffect } from 'react';
import { FreeTimeAllocation } from '../../types';
import { X, Sparkles, Clock, Tag, BookOpen, Check } from 'lucide-react';

interface FreeTimeAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (allocation: Omit<FreeTimeAllocation, 'id'> | FreeTimeAllocation) => void;
  onDelete?: (id: string) => void;
  initialData?: FreeTimeAllocation | null;
  selectedDate: string;
}

const PRESET_ACTIVITIES = [
  { label: 'GATE Preparation', category: 'GATE', color: '#4f46e5', icon: '🎯' },
  { label: 'Placement Practice', category: 'Placement', color: '#0891b2', icon: '💼' },
  { label: 'Competitive Programming / DSA', category: 'DSA', color: '#2563eb', icon: '⚡' },
  { label: 'Core Engineering Revision', category: 'Core Studies', color: '#7c3aed', icon: '📚' },
  { label: 'Project / Hackathon Sprint', category: 'Project', color: '#059669', icon: '🛠️' },
  { label: 'System Design & Tech Stack', category: 'Skill Learning', color: '#d97706', icon: '⚙️' },
  { label: 'Reading & Research', category: 'Personal', color: '#475569', icon: '📖' },
];

const COLOR_OPTIONS = [
  { label: 'Indigo', value: '#4f46e5', bg: 'bg-indigo-600' },
  { label: 'Cyan', value: '#0891b2', bg: 'bg-cyan-600' },
  { label: 'Blue', value: '#2563eb', bg: 'bg-blue-600' },
  { label: 'Emerald', value: '#059669', bg: 'bg-emerald-600' },
  { label: 'Purple', value: '#7c3aed', bg: 'bg-purple-600' },
  { label: 'Amber', value: '#d97706', bg: 'bg-amber-600' },
  { label: 'Rose', value: '#e11d48', bg: 'bg-rose-600' },
  { label: 'Slate', value: '#475569', bg: 'bg-slate-600' },
];

export const FreeTimeAllocationModal: React.FC<FreeTimeAllocationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  selectedDate,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('GATE');
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('18:00');
  const [color, setColor] = useState('#4f46e5');
  const [notes, setNotes] = useState('');
  const [actualMinutes, setActualMinutes] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title);
        setCategory(initialData.activityCategory);
        setStartTime(initialData.startTime);
        setEndTime(initialData.endTime);
        setColor(initialData.color || '#4f46e5');
        setNotes(initialData.notes || '');
        setActualMinutes(initialData.actualMinutes);
      } else {
        setTitle('GATE Preparation');
        setCategory('GATE');
        setStartTime('16:00');
        setEndTime('18:00');
        setColor('#4f46e5');
        setNotes('');
        setActualMinutes(undefined);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // Calculate planned duration in minutes
  const calculatePlannedMinutes = (start: string, end: string): number => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const diff = eh * 60 + em - (sh * 60 + sm);
    return diff > 0 ? diff : 60;
  };

  const plannedMinutes = calculatePlannedMinutes(startTime, endTime);
  const plannedHoursFormatted = (plannedMinutes / 60).toFixed(1) + ' hrs';

  const handleSelectPreset = (preset: typeof PRESET_ACTIVITIES[0]) => {
    setTitle(preset.label);
    setCategory(preset.category);
    setColor(preset.color);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = {
      title: title.trim(),
      activityCategory: category,
      date: initialData?.date || selectedDate,
      startTime,
      endTime,
      plannedMinutes,
      actualMinutes: actualMinutes !== undefined ? actualMinutes : undefined,
      color,
      notes: notes.trim() || undefined,
      completed: initialData ? initialData.completed : false,
    };

    if (initialData?.id) {
      onSave({ ...payload, id: initialData.id });
    } else {
      onSave(payload);
    }
    onClose();
  };

  return (
    <div
      id="free-time-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {initialData ? 'Edit Free-Time Allocation' : 'Pre-assign Free-Time Activity'}
              </h2>
              <p className="text-xs text-slate-500">
                Dedicate open study hours for exams, placements, or self-development.
              </p>
            </div>
          </div>
          <button
            id="close-free-time-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Quick Preset Tags */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Quick Focus Presets
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_ACTIVITIES.map((preset) => {
                const isSelected = title === preset.label;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{preset.icon}</span>
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Activity Label / Title */}
          <div>
            <label htmlFor="fta-title" className="block font-semibold text-slate-700 mb-1">
              Activity Label / Focus Goal <span className="text-rose-500">*</span>
            </label>
            <input
              id="fta-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. GATE Preparation, Placement Practice, OS Lab..."
              className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Time Slot Selector & Calculated Duration */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Time Block & Duration</span>
              </span>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                Planned: {plannedHoursFormatted} ({plannedMinutes} min)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="fta-start-time" className="block font-medium text-slate-600 mb-1">
                  Start Time
                </label>
                <input
                  id="fta-start-time"
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label htmlFor="fta-end-time" className="block font-medium text-slate-600 mb-1">
                  End Time
                </label>
                <input
                  id="fta-end-time"
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Quick Presets for Duration */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-500">Quick durations:</span>
              {[
                { label: '1 Hour', hours: 1 },
                { label: '1.5 Hours', hours: 1.5 },
                { label: '2 Hours', hours: 2 },
                { label: '3 Hours', hours: 3 },
              ].map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => {
                    const [sh, sm] = startTime.split(':').map(Number);
                    const totalMins = sh * 60 + sm + d.hours * 60;
                    const endH = Math.min(23, Math.floor(totalMins / 60));
                    const endM = totalMins % 60;
                    setEndTime(
                      `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
                    );
                  }}
                  className="px-2 py-0.5 text-[11px] font-medium bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-700 transition-colors"
                >
                  +{d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color Tag & Category Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="fta-category" className="block font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                id="fta-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="GATE">GATE Preparation</option>
                <option value="Placement">Placement Practice</option>
                <option value="DSA">Competitive Coding / DSA</option>
                <option value="Core Studies">Core Engineering Subject</option>
                <option value="Project">Project / Lab Work</option>
                <option value="Skill Learning">Skill Learning / Tech Stack</option>
                <option value="Personal">Personal & Reading</option>
                <option value="Other">Other Focus</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Color Tag
              </label>
              <div className="flex items-center gap-1.5 pt-1">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform flex items-center justify-center ${
                      color === c.value
                        ? 'border-slate-900 scale-110 shadow-xs'
                        : 'border-transparent hover:scale-105'
                    } ${c.bg}`}
                    title={c.label}
                  >
                    {color === c.value && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="fta-notes" className="block font-semibold text-slate-700 mb-1">
              Specific Objectives / Subtopics (Optional)
            </label>
            <textarea
              id="fta-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Chapter 4 Pipelining questions, LeetCode 3 medium problems..."
              className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {initialData && onDelete ? (
              <button
                type="button"
                id="fta-delete-btn"
                onClick={() => {
                  if (confirm(`Remove allocation for "${initialData.title}"?`)) {
                    onDelete(initialData.id);
                    onClose();
                  }
                }}
                className="px-3 py-1.5 font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1"
              >
                Delete Block
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="fta-cancel-btn"
                onClick={onClose}
                className="px-3.5 py-1.5 font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="fta-save-btn"
                className="px-4 py-1.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{initialData ? 'Update Allocation' : 'Pre-assign Block'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
