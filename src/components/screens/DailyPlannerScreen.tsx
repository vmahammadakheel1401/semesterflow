import React, { useState } from 'react';
import { useSemester } from '../../context/SemesterContext';
import { DailyTask, FreeTimeAllocation } from '../../types';
import { ColorBadge } from '../ColorBadge';
import { isTodayDate, shiftDateString } from '../../utils/dateUtils';
import { FreeTimeAllocationModal } from '../DailyPlanner/FreeTimeAllocationModal';
import { TimeTrackerModal } from '../DailyPlanner/TimeTrackerModal';
import { DayTimeBreakdownCard } from '../DailyPlanner/DayTimeBreakdownCard';
import {
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  MoveRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  MapPin,
  Check,
  X,
  Target,
  Timer,
  Tag,
  ArrowUpRight,
} from 'lucide-react';

export const DailyPlannerScreen: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    resetToToday,
    getClassesForDate,
    getTasksForDate,
    getEventsForDate,
    getUnavailableForDate,
    getAvailableStudyHours,
    toggleTaskComplete,
    deleteTask,
    moveTaskTime,
    logTaskActualTime,
    freeTimeAllocations,
    addFreeTimeAllocation,
    updateFreeTimeAllocation,
    deleteFreeTimeAllocation,
    toggleFreeTimeComplete,
    logAllocationActualTime,
    getFreeTimeAllocationsForDate,
    openModal,
  } = useSemester();

  // Move task time modal state
  const [movingTask, setMovingTask] = useState<DailyTask | null>(null);
  const [newStartTime, setNewStartTime] = useState('18:00');
  const [newEndTime, setNewEndTime] = useState('19:00');

  // Free-time allocation modal state
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<FreeTimeAllocation | null>(null);

  // Universal Time Tracking modal state
  const [trackingItem, setTrackingItem] = useState<{
    isOpen: boolean;
    id: string;
    title: string;
    category: string;
    plannedMinutes: number;
    initialActualMinutes: number;
    type: 'task' | 'allocation';
  } | null>(null);

  const dateObj = new Date(selectedDate + 'T00:00:00');
  const isToday = isTodayDate(selectedDate);

  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const dateFormatted = dateObj.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handlePrevDay = () => {
    setSelectedDate(shiftDateString(selectedDate, -1));
  };

  const handleNextDay = () => {
    setSelectedDate(shiftDateString(selectedDate, 1));
  };

  const handleResetToday = () => {
    resetToToday();
  };

  const classesToday = getClassesForDate(selectedDate);
  const tasksToday = getTasksForDate(selectedDate);
  const eventsToday = getEventsForDate(selectedDate);
  const unavailToday = getUnavailableForDate(selectedDate);
  const availableHours = getAvailableStudyHours(selectedDate);
  const allocationsToday = getFreeTimeAllocationsForDate(selectedDate);

  // Aggregate completion and actual logged time
  const completedTasksCount = tasksToday.filter((t) => t.completed).length;

  const totalLoggedMinutes =
    tasksToday.reduce(
      (sum, t) => sum + (t.actualMinutes !== undefined ? t.actualMinutes : t.completed ? t.durationMinutes : 0),
      0
    ) +
    allocationsToday.reduce(
      (sum, a) => sum + (a.actualMinutes !== undefined ? a.actualMinutes : a.completed ? a.plannedMinutes : 0),
      0
    );
  const totalLoggedHours = Number((totalLoggedMinutes / 60).toFixed(1));

  // Open move modal
  const handleOpenMoveModal = (task: DailyTask) => {
    setMovingTask(task);
    setNewStartTime(task.startTime);
    setNewEndTime(task.endTime);
  };

  const handleSaveMove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movingTask) return;
    moveTaskTime(movingTask.id, newStartTime, newEndTime);
    setMovingTask(null);
  };

  // Open Allocation modal
  const handleOpenAddAllocation = (initialPreset?: { title: string; category: string; color: string }) => {
    if (initialPreset) {
      setEditingAllocation({
        id: '',
        title: initialPreset.title,
        activityCategory: initialPreset.category,
        date: selectedDate,
        startTime: '16:00',
        endTime: '18:00',
        plannedMinutes: 120,
        color: initialPreset.color,
      });
    } else {
      setEditingAllocation(null);
    }
    setIsAllocationModalOpen(true);
  };

  const handleEditAllocation = (alloc: FreeTimeAllocation) => {
    setEditingAllocation(alloc);
    setIsAllocationModalOpen(true);
  };

  const handleSaveAllocation = (alloc: Omit<FreeTimeAllocation, 'id'> | FreeTimeAllocation) => {
    if ('id' in alloc && alloc.id) {
      updateFreeTimeAllocation(alloc as FreeTimeAllocation);
    } else {
      addFreeTimeAllocation(alloc);
    }
  };

  // Quick increment time on task
  const handleQuickAddMinutesTask = (task: DailyTask, minutesToAdd: number) => {
    const current = task.actualMinutes !== undefined ? task.actualMinutes : task.completed ? task.durationMinutes : 0;
    const newTotal = Math.max(0, current + minutesToAdd);
    logTaskActualTime(task.id, newTotal);
  };

  // Quick increment time on allocation
  const handleQuickAddMinutesAllocation = (alloc: FreeTimeAllocation, minutesToAdd: number) => {
    const current = alloc.actualMinutes !== undefined ? alloc.actualMinutes : alloc.completed ? alloc.plannedMinutes : 0;
    const newTotal = Math.max(0, current + minutesToAdd);
    logAllocationActualTime(alloc.id, newTotal);
  };

  // Open Time Tracker Modal
  const handleOpenTrackTask = (task: DailyTask) => {
    setTrackingItem({
      isOpen: true,
      id: task.id,
      title: task.title,
      category: task.category,
      plannedMinutes: task.durationMinutes,
      initialActualMinutes: task.actualMinutes !== undefined ? task.actualMinutes : task.completed ? task.durationMinutes : 0,
      type: 'task',
    });
  };

  const handleOpenTrackAllocation = (alloc: FreeTimeAllocation) => {
    setTrackingItem({
      isOpen: true,
      id: alloc.id,
      title: alloc.title,
      category: alloc.activityCategory,
      plannedMinutes: alloc.plannedMinutes,
      initialActualMinutes: alloc.actualMinutes !== undefined ? alloc.actualMinutes : alloc.completed ? alloc.plannedMinutes : 0,
      type: 'allocation',
    });
  };

  const handleSaveTrackedTime = (actualMinutes: number) => {
    if (!trackingItem) return;
    if (trackingItem.type === 'task') {
      logTaskActualTime(trackingItem.id, actualMinutes);
    } else {
      logAllocationActualTime(trackingItem.id, actualMinutes);
    }
  };

  return (
    <div id="screen-daily-planner" className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Date Header and Day Navigation */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100">
              {isToday ? 'TODAY' : 'DAY VIEW'}
            </span>
            <span className="text-xs text-slate-500 font-medium">{dayName}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {dateFormatted}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Allocate free-time focus slots, schedule tasks, and track actual study hours.
          </p>
        </div>

        {/* Date Switching Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isToday && (
            <button
              id="daily-return-today-btn"
              onClick={handleResetToday}
              className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
            >
              Back to Today
            </button>
          )}

          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              id="daily-prev-day-btn"
              onClick={handlePrevDay}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-colors"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="daily-next-day-btn"
              onClick={handleNextDay}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-colors"
              aria-label="Next day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            id="daily-add-allocation-header-btn"
            onClick={() => handleOpenAddAllocation()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pre-assign Free Time</span>
          </button>

          <button
            id="daily-add-task-btn"
            onClick={() => openModal('task', 'create', { date: selectedDate })}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Special Events Banner if any */}
      {eventsToday.length > 0 && (
        <div className="space-y-2">
          {eventsToday.map((ev) => (
            <div
              key={ev.id}
              className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <ColorBadge type={ev.type} size="sm" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">{ev.title}</h2>
                  {ev.description && (
                    <p className="text-xs text-slate-500">{ev.description}</p>
                  )}
                </div>
              </div>
              {ev.location && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {ev.location}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Daily Metrics Pill Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">College Lectures</div>
          <div className="text-lg font-bold text-orange-600 mt-0.5">
            {classesToday.length} Classes
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Available Study Window</div>
          <div className="text-lg font-bold text-blue-600 mt-0.5">
            {availableHours} Hours
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Tracked Study Time</div>
          <div className="text-lg font-bold text-indigo-700 mt-0.5">
            {totalLoggedHours} / {availableHours}h
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Completed Tasks</div>
          <div className="text-lg font-bold text-emerald-600 mt-0.5">
            {completedTasksCount} / {tasksToday.length}
          </div>
        </div>
      </div>

      {/* Section 1: College Schedule for Today */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-orange-50/30">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <h2 className="text-sm font-semibold text-slate-900">
              College Academic Timetable for {dayName}
            </h2>
          </div>
          <span className="text-xs text-orange-800 font-medium">
            {classesToday.length} sessions
          </span>
        </div>

        <div className="p-4 space-y-2">
          {classesToday.length === 0 ? (
            <p className="text-xs text-slate-400 italic p-3 text-center bg-slate-50 rounded-lg">
              No college classes on this day (Weekend or College Holiday). Full day available for self-study and development.
            </p>
          ) : (
            classesToday.map((cls) => (
              <div
                key={cls.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-orange-100 bg-orange-50/20 text-xs gap-2"
              >
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-bold text-orange-900 min-w-[85px]">
                    {cls.startTime} – {cls.endTime}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {cls.subject}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {cls.code}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-500 flex-wrap">
                  {cls.faculty && (
                    <span className="text-slate-600 font-medium">
                      {cls.faculty}
                    </span>
                  )}
                  {cls.room && (
                    <span className="text-slate-500">
                      {cls.room}
                    </span>
                  )}
                  <span
                    className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      cls.type === 'lab'
                        ? 'bg-purple-100 text-purple-800'
                        : cls.type === 'tutorial'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {cls.type}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Section 2: Optional Free-Time Activity Allocation & Time Tracking */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-indigo-50/30">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Available Study Time & Activity Allocation
              </h2>
              <p className="text-[11px] text-slate-500">
                Pre-assign focus blocks (e.g. GATE Prep, Placement Practice) into your {availableHours} hrs free time.
              </p>
            </div>
          </div>

          <button
            id="preassign-free-time-btn"
            onClick={() => handleOpenAddAllocation()}
            className="text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
            <span>Pre-assign Activity Block</span>
          </button>
        </div>

        <div className="p-4 space-y-3">
          {allocationsToday.length === 0 ? (
            <div className="p-6 text-center text-slate-500 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
              <Sparkles className="w-7 h-7 text-indigo-500 mx-auto mb-1.5" />
              <p className="text-sm font-semibold text-slate-800">
                No free activity blocks allocated yet for {dayName}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                You have <strong>{availableHours} hours</strong> of calculated free study time. Tag specific blocks to stay on track.
              </p>

              {/* Quick 1-click Preset Suggestions */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3.5">
                <button
                  onClick={() =>
                    handleOpenAddAllocation({
                      title: 'GATE Preparation (Core Subjects)',
                      category: 'GATE',
                      color: '#4f46e5',
                    })
                  }
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                >
                  🎯 + GATE Prep (2 hrs)
                </button>
                <button
                  onClick={() =>
                    handleOpenAddAllocation({
                      title: 'Placement Practice (DSA & LeetCode)',
                      category: 'Placement',
                      color: '#0891b2',
                    })
                  }
                  className="px-3 py-1.5 text-xs font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg transition-colors"
                >
                  💼 + Placement Practice (1.5 hrs)
                </button>
                <button
                  onClick={() =>
                    handleOpenAddAllocation({
                      title: 'Project Development Sprint',
                      category: 'Project',
                      color: '#059669',
                    })
                  }
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                >
                  🛠️ + Project Sprint (1 hr)
                </button>
              </div>
            </div>
          ) : (
            allocationsToday.map((alloc) => {
              const plannedH = (alloc.plannedMinutes / 60).toFixed(1);
              const actualMins =
                alloc.actualMinutes !== undefined
                  ? alloc.actualMinutes
                  : alloc.completed
                  ? alloc.plannedMinutes
                  : 0;
              const actualH = (actualMins / 60).toFixed(1);
              const isTracked = alloc.actualMinutes !== undefined;

              return (
                <div
                  key={alloc.id}
                  id={`allocation-item-${alloc.id}`}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    alloc.completed
                      ? 'bg-slate-50/90 border-slate-200 opacity-90'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Toggle Complete Checkbox */}
                    <button
                      id={`toggle-allocation-${alloc.id}`}
                      onClick={() => toggleFreeTimeComplete(alloc.id)}
                      className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                      aria-label={alloc.completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {alloc.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded text-white"
                          style={{ backgroundColor: alloc.color || '#4f46e5' }}
                        >
                          {alloc.activityCategory}
                        </span>

                        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-mono">
                          {alloc.startTime} – {alloc.endTime} ({plannedH} hrs)
                        </span>

                        <h3
                          className={`text-sm font-bold transition-all ${
                            alloc.completed
                              ? 'line-through text-slate-400 font-normal'
                              : 'text-slate-900'
                          }`}
                        >
                          {alloc.title}
                        </h3>
                      </div>

                      {alloc.notes && (
                        <p className="text-xs text-slate-500 mt-1">{alloc.notes}</p>
                      )}

                      {/* Time Tracking Progress Indicator */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                        <span className="text-slate-500 font-medium">Actual Logged:</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded border text-[11px] ${
                            actualMins >= alloc.plannedMinutes
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : actualMins > 0
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {actualH} hrs ({actualMins}m / {alloc.plannedMinutes}m)
                        </span>

                        {/* Fast Time Increment Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            id={`quick-add-15-alloc-${alloc.id}`}
                            onClick={() => handleQuickAddMinutesAllocation(alloc, 15)}
                            className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors"
                            title="Quick log +15 minutes"
                          >
                            +15m
                          </button>
                          <button
                            id={`quick-add-30-alloc-${alloc.id}`}
                            onClick={() => handleQuickAddMinutesAllocation(alloc, 30)}
                            className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors"
                            title="Quick log +30 minutes"
                          >
                            +30m
                          </button>
                          <button
                            id={`quick-add-60-alloc-${alloc.id}`}
                            onClick={() => handleQuickAddMinutesAllocation(alloc, 60)}
                            className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors"
                            title="Quick log +1 hour"
                          >
                            +1h
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Track Time, Edit, Delete */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      id={`track-time-alloc-${alloc.id}`}
                      onClick={() => handleOpenTrackAllocation(alloc)}
                      className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <Timer className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{isTracked ? 'Log Time' : 'Track Time'}</span>
                    </button>

                    <button
                      onClick={() => handleEditAllocation(alloc)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                      aria-label="Edit allocation"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Remove allocation "${alloc.title}"?`)) {
                          deleteFreeTimeAllocation(alloc.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                      aria-label="Delete allocation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Section 3: Today's Planned Study Tasks & Time Tracking */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Today's Planned Study Tasks
              </h2>
              <p className="text-[11px] text-slate-500">
                Track exact time spent versus planned schedule.
              </p>
            </div>
          </div>

          <button
            id="plan-another-task-btn"
            onClick={() => openModal('task', 'create', { date: selectedDate })}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>

        <div className="p-4 space-y-2.5">
          {tasksToday.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">
                No study tasks planned for this day yet
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Schedule focused slots for DSA problem sets, GATE revision, or engineering assignments.
              </p>
              <button
                onClick={() => openModal('task', 'create', { date: selectedDate })}
                className="mt-3 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Study Task</span>
              </button>
            </div>
          ) : (
            tasksToday.map((task) => {
              const actualMins =
                task.actualMinutes !== undefined
                  ? task.actualMinutes
                  : task.completed
                  ? task.durationMinutes
                  : 0;
              const actualH = (actualMins / 60).toFixed(1);
              const isTracked = task.actualMinutes !== undefined;

              return (
                <div
                  key={task.id}
                  id={`task-item-${task.id}`}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    task.completed
                      ? 'bg-slate-50/80 border-slate-200 opacity-80'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Toggle Complete Checkbox */}
                    <button
                      id={`toggle-task-${task.id}`}
                      onClick={() => toggleTaskComplete(task.id)}
                      className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                      aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-mono">
                          {task.startTime} – {task.endTime} ({task.durationMinutes}m)
                        </span>
                        <h3
                          className={`text-sm font-semibold transition-all ${
                            task.completed
                              ? 'line-through text-slate-400 font-normal'
                              : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </h3>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {task.category}
                        </span>
                      </div>

                      {task.notes && (
                        <p
                          className={`text-xs mt-1 ${
                            task.completed ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          {task.notes}
                        </p>
                      )}

                      {/* Time Tracking Row for Task */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                        <span className="text-slate-500 font-medium">Logged Time:</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded border text-[11px] ${
                            actualMins >= task.durationMinutes
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : actualMins > 0
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {actualH} hrs ({actualMins}m / {task.durationMinutes}m)
                        </span>

                        {/* Quick Increment buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            id={`quick-add-15-task-${task.id}`}
                            onClick={() => handleQuickAddMinutesTask(task, 15)}
                            className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors"
                            title="Quick log +15 minutes"
                          >
                            +15m
                          </button>
                          <button
                            id={`quick-add-30-task-${task.id}`}
                            onClick={() => handleQuickAddMinutesTask(task, 30)}
                            className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors"
                            title="Quick log +30 minutes"
                          >
                            +30m
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Track Time, Move time, Edit, Delete */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <button
                      id={`track-time-task-${task.id}`}
                      onClick={() => handleOpenTrackTask(task)}
                      className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                      title="Log actual time spent"
                    >
                      <Timer className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{isTracked ? 'Log Time' : 'Track'}</span>
                    </button>

                    <button
                      id={`move-time-task-${task.id}`}
                      onClick={() => handleOpenMoveModal(task)}
                      className="px-2 py-1 text-xs text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors flex items-center gap-1"
                      title="Move to another time slot"
                    >
                      <MoveRight className="w-3.5 h-3.5" />
                      <span>Move</span>
                    </button>

                    <button
                      onClick={() => openModal('task', 'edit', task)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                      aria-label="Edit task"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Delete task "${task.title}"?`)) {
                          deleteTask(task.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                      aria-label="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Section 4: End-of-Day Time Breakdown Summary Card */}
      <DayTimeBreakdownCard
        availableFreeHours={availableHours}
        tasks={tasksToday}
        allocations={allocationsToday}
        onOpenAddAllocation={() => handleOpenAddAllocation()}
        dayName={dayName}
        dateFormatted={dateFormatted}
      />

      {/* Free-Time Allocation Modal */}
      <FreeTimeAllocationModal
        isOpen={isAllocationModalOpen}
        onClose={() => {
          setIsAllocationModalOpen(false);
          setEditingAllocation(null);
        }}
        onSave={handleSaveAllocation}
        onDelete={(id) => deleteFreeTimeAllocation(id)}
        initialData={editingAllocation}
        selectedDate={selectedDate}
      />

      {/* Universal Time Tracker Modal */}
      {trackingItem && (
        <TimeTrackerModal
          isOpen={trackingItem.isOpen}
          onClose={() => setTrackingItem(null)}
          title={trackingItem.title}
          category={trackingItem.category}
          plannedMinutes={trackingItem.plannedMinutes}
          initialActualMinutes={trackingItem.initialActualMinutes}
          type={trackingItem.type}
          onSaveTime={handleSaveTrackedTime}
        />
      )}

      {/* Move Task Time Modal */}
      {movingTask && (
        <div
          id="move-task-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMovingTask(null);
          }}
        >
          <div className="w-full max-w-sm bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                Move Task Time
              </h2>
              <button
                onClick={() => setMovingTask(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMove} className="p-5 space-y-4 text-xs">
              <p className="text-xs text-slate-600 font-medium truncate">
                {movingTask.title}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              {/* Quick Shift Buttons */}
              <div>
                <span className="block text-[11px] text-slate-500 mb-1">
                  Quick adjustments:
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewStartTime('20:00');
                      setNewEndTime('21:00');
                    }}
                    className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                  >
                    Post-Dinner (8 PM)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewStartTime('21:30');
                      setNewEndTime('22:30');
                    }}
                    className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                  >
                    Late Night (9:30 PM)
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMovingTask(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Update Time
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
