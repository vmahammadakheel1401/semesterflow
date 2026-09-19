import React, { useState } from 'react';
import { useSemester } from '../../context/SemesterContext';
import { DailyTask } from '../../types';
import { ColorBadge } from '../ColorBadge';
import { isTodayDate, shiftDateString } from '../../utils/dateUtils';
import {
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  ArrowRight,
  MoveRight,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  MapPin,
  Coffee,
  Check,
  X,
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
    openModal,
  } = useSemester();

  // Move task time modal state
  const [movingTask, setMovingTask] = useState<DailyTask | null>(null);
  const [newStartTime, setNewStartTime] = useState('18:00');
  const [newEndTime, setNewEndTime] = useState('19:00');

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

  const completedTasksCount = tasksToday.filter((t) => t.completed).length;

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
            Your single focal point: college commitments, open study gaps, and manual tasks.
          </p>
        </div>

        {/* Date Switching Controls */}
        <div className="flex items-center gap-2">
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
          <div className="text-[11px] font-medium text-slate-500">Available Study Time</div>
          <div className="text-lg font-bold text-blue-600 mt-0.5">
            {availableHours} Hours
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Planned Tasks</div>
          <div className="text-lg font-bold text-slate-900 mt-0.5">
            {tasksToday.length} Tasks
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500">Completed Today</div>
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
              No college classes on this day (Weekend or College Holiday). Full day available for self-study.
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

      {/* Section 2: Today's Manually Planned Study Tasks */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Today's Manually Planned Tasks
            </h2>
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
            tasksToday.map((task) => (
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
                      <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {task.startTime} – {task.endTime}
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
                  </div>
                </div>

                {/* Actions: Move time, Edit, Delete */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
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
            ))
          )}
        </div>
      </div>

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

            <form onSubmit={handleSaveMove} className="p-5 space-y-4">
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
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg"
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
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg"
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
