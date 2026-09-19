import React, { useState } from 'react';
import { useSemester } from '../../context/SemesterContext';
import { UnavailableBlock, UnavailableCategory } from '../../types';
import { getTodayDateString } from '../../utils/dateUtils';
import {
  Plus,
  Clock,
  Moon,
  Utensils,
  Dumbbell,
  Car,
  Users,
  Briefcase,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

export const AvailabilityScreen: React.FC = () => {
  const {
    unavailableBlocks,
    addUnavailableBlock,
    updateUnavailableBlock,
    deleteUnavailableBlock,
    getWeeklyStats,
  } = useSemester();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<UnavailableBlock | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<UnavailableCategory>('Sleep');
  const [isRecurring, setIsRecurring] = useState(true);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('08:00');
  const [specificDate, setSpecificDate] = useState(getTodayDateString());

  const days = [
    { num: 1, short: 'Mon' },
    { num: 2, short: 'Tue' },
    { num: 3, short: 'Wed' },
    { num: 4, short: 'Thu' },
    { num: 5, short: 'Fri' },
    { num: 6, short: 'Sat' },
    { num: 0, short: 'Sun' },
  ];

  const categories: { label: UnavailableCategory; icon: React.ElementType }[] = [
    { label: 'Sleep', icon: Moon },
    { label: 'Meals', icon: Utensils },
    { label: 'Gym', icon: Dumbbell },
    { label: 'Commute', icon: Car },
    { label: 'Family/personal', icon: Users },
    { label: 'Other', icon: Briefcase },
  ];

  const getCategoryIcon = (cat: UnavailableCategory) => {
    switch (cat) {
      case 'Sleep':
        return Moon;
      case 'Meals':
        return Utensils;
      case 'Gym':
        return Dumbbell;
      case 'Commute':
        return Car;
      case 'Family/personal':
        return Users;
      default:
        return Briefcase;
    }
  };

  const handleOpenAdd = (presetCategory?: UnavailableCategory) => {
    setEditingBlock(null);
    if (presetCategory) {
      setCategory(presetCategory);
      setTitle(
        presetCategory === 'Sleep'
          ? 'Night Sleep'
          : presetCategory === 'Meals'
          ? 'Mess Dinner'
          : presetCategory === 'Gym'
          ? 'Workout & Sports'
          : presetCategory === 'Commute'
          ? 'Hostel/Campus Commute'
          : 'Personal Activity'
      );
      if (presetCategory === 'Sleep') {
        setStartTime('23:30');
        setEndTime('07:00');
        setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
      } else if (presetCategory === 'Meals') {
        setStartTime('12:30');
        setEndTime('13:30');
      } else {
        setStartTime('17:00');
        setEndTime('18:00');
      }
    } else {
      setCategory('Sleep');
      setTitle('');
      setStartTime('08:00');
      setEndTime('09:00');
    }
    setIsModalOpen(true);
  };

  const handleOpenEdit = (block: UnavailableBlock) => {
    setEditingBlock(block);
    setTitle(block.title);
    setCategory(block.category);
    setIsRecurring(block.isRecurring);
    setSelectedDays(block.daysOfWeek || [1, 2, 3, 4, 5]);
    setStartTime(block.startTime);
    setEndTime(block.endTime);
    setSpecificDate(block.date || getTodayDateString());
    setIsModalOpen(true);
  };

  const toggleDay = (dayNum: number) => {
    if (selectedDays.includes(dayNum)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayNum));
    } else {
      setSelectedDays([...selectedDays, dayNum]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Calculate duration in minutes
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let startMins = sh * 60 + sm;
    let endMins = eh * 60 + em;
    if (endMins < startMins) endMins += 24 * 60; // Overnight
    const durationMinutes = endMins - startMins;

    if (editingBlock) {
      updateUnavailableBlock({
        id: editingBlock.id,
        title: title.trim(),
        category,
        isRecurring,
        daysOfWeek: isRecurring ? selectedDays : [],
        date: !isRecurring ? specificDate : undefined,
        startTime,
        endTime,
        durationMinutes,
      });
    } else {
      addUnavailableBlock({
        title: title.trim(),
        category,
        isRecurring,
        daysOfWeek: isRecurring ? selectedDays : [],
        date: !isRecurring ? specificDate : undefined,
        startTime,
        endTime,
        durationMinutes,
      });
    }
    setIsModalOpen(false);
  };

  const weeklyStats = getWeeklyStats();

  return (
    <div id="screen-availability" className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Availability & Unavailable Time
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Define times when you cannot study (sleep, mess meals, gym, commute) to calculate your real study bandwidth.
          </p>
        </div>

        <button
          id="add-unavailable-block-btn"
          onClick={() => handleOpenAdd()}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Time Block</span>
        </button>
      </div>

      {/* Quick Add Presets Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
          Quick Preset Time Blocks
        </h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.label}
                id={`preset-btn-${cat.label.toLowerCase()}`}
                onClick={() => handleOpenAdd(cat.label)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              >
                <Icon className="w-3.5 h-3.5 text-slate-500" />
                <span>+ Add {cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Available Study Hours Indicator */}
      <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
            Weekly Study Bandwidth Calculated
          </span>
          <div className="text-2xl font-bold text-blue-950 mt-0.5">
            ~{weeklyStats.availableWeeklyStudyHours} Hours Available / Week
          </div>
          <p className="text-xs text-blue-700 mt-0.5">
            Computed after deducting all recurring college classes, sleep, mess meals, and gym.
          </p>
        </div>

        <div className="text-right text-xs text-blue-900 bg-white/70 p-3 rounded-lg border border-blue-200/60 shrink-0">
          <div className="font-semibold">Committed Target: {weeklyStats.totalWeeklyTargetHours}h</div>
          <div className="text-emerald-700 font-medium">Safe Margin: {(weeklyStats.availableWeeklyStudyHours - weeklyStats.totalWeeklyTargetHours).toFixed(1)}h buffer</div>
        </div>
      </div>

      {/* Blocks List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-semibold text-slate-900">
            Registered Non-Study Windows ({unavailableBlocks.length})
          </h3>
          <span className="text-xs text-slate-500">Recurring weekly or one-off</span>
        </div>

        <div className="divide-y divide-slate-100">
          {unavailableBlocks.map((block) => {
            const Icon = getCategoryIcon(block.category);
            const daysLabel = block.isRecurring
              ? block.daysOfWeek.length === 7
                ? 'Every Day (Mon – Sun)'
                : block.daysOfWeek
                    .map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d])
                    .join(', ')
              : `One-off: ${block.date}`;

            return (
              <div
                key={block.id}
                id={`unavail-item-${block.id}`}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-slate-600" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-900">
                        {block.title}
                      </h4>
                      <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {block.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {block.startTime} – {block.endTime} ({block.durationMinutes} mins)
                      </span>
                      <span>•</span>
                      <span>{daysLabel}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <button
                    onClick={() => handleOpenEdit(block)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md"
                    aria-label="Edit time block"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Remove "${block.title}"?`)) {
                        deleteUnavailableBlock(block.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                    aria-label="Delete time block"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Time Block Modal */}
      {isModalOpen && (
        <div
          id="unavail-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                {editingBlock ? 'Edit Unavailable Window' : 'Add Unavailable Window'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mess Dinner, Gym Workout, Commute"
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as UnavailableCategory)}
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Sleep">Sleep (Night / Rest)</option>
                  <option value="Meals">Meals (Breakfast / Lunch / Dinner)</option>
                  <option value="Gym">Gym / Sports / Fitness</option>
                  <option value="Commute">Commute / Travel</option>
                  <option value="Family/personal">Family / Personal Activities</option>
                  <option value="Other">Other Non-Study Time</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                  />
                  <span className="text-xs font-medium text-slate-800">
                    Recurring every week
                  </span>
                </label>

                {isRecurring ? (
                  <div>
                    <span className="block text-[11px] text-slate-500 mb-1.5">
                      Active Days:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {days.map((d) => {
                        const active = selectedDays.includes(d.num);
                        return (
                          <button
                            key={d.num}
                            type="button"
                            onClick={() => toggleDay(d.num)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors ${
                              active
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {d.short}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Specific Date
                    </label>
                    <input
                      type="date"
                      value={specificDate}
                      onChange={(e) => setSpecificDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Save Time Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
