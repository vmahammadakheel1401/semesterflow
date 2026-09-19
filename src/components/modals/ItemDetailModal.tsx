import React, { useState, useEffect } from 'react';
import { useSemester } from '../../context/SemesterContext';
import { ColorBadge } from '../ColorBadge';
import { EventType, TaskCategory } from '../../types';
import { getTodayDateString } from '../../utils/dateUtils';
import { X, Trash2, Calendar, Clock, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

export const ItemDetailModal: React.FC = () => {
  const {
    modalConfig,
    closeModal,
    goals,
    selectedDate,
    addTask,
    updateTask,
    deleteTask,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
  } = useSemester();

  const { isOpen, itemType, mode, data } = modalConfig;

  // Form states
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('19:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [category, setCategory] = useState<TaskCategory>('DSA');
  const [eventType, setEventType] = useState<EventType>('event');
  const [goalId, setGoalId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [isAllDay, setIsAllDay] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const defaultDate = selectedDate || getTodayDateString();
    setIsConfirmingDelete(false);
    setSuccessNotice(null);

    if (mode === 'create') {
      setTitle(data?.title || '');
      setDate(data?.date || defaultDate);
      setStartTime(data?.startTime || '10:00');
      setEndTime(data?.endTime || '12:00');
      const resolvedInitialType: EventType =
        data?.type ||
        (itemType === 'holiday'
          ? 'holiday'
          : itemType === 'exam'
          ? 'exam'
          : itemType === 'deadline'
          ? 'deadline'
          : itemType === 'college_day'
          ? 'college_day'
          : 'event');
      setEventType(resolvedInitialType);
      setIsAllDay(
        data?.isAllDay !== undefined
          ? data.isAllDay
          : resolvedInitialType === 'holiday'
      );
      setDurationMinutes(data?.durationMinutes || 60);
      setCategory(data?.category || 'DSA');
      setGoalId(data?.goalId || goals[0]?.id || '');
      setNotes(data?.notes || data?.description || '');
      setLocation(data?.location || '');
      setIsCompleted(false);
    } else if (data) {
      setTitle(data.title || '');
      setDate(data.date || defaultDate);
      setStartTime(data.startTime || '10:00');
      setEndTime(data.endTime || '12:00');
      setIsAllDay(!data.startTime);
      setDurationMinutes(data.durationMinutes || 60);
      setCategory(data.category || 'DSA');
      setEventType(
        data.type ||
          (itemType === 'exam'
            ? 'exam'
            : itemType === 'deadline'
            ? 'deadline'
            : itemType === 'holiday'
            ? 'holiday'
            : itemType === 'college_day'
            ? 'college_day'
            : 'event')
      );
      setGoalId(data.goalId || '');
      setNotes(data.notes || data.description || '');
      setLocation(data.location || '');
      setIsCompleted(!!data.completed);
    } else {
      // Default reset
      setTitle('');
      setDate(defaultDate);
      setStartTime('10:00');
      setEndTime('12:00');
      const initialEventType: EventType =
        itemType === 'exam'
          ? 'exam'
          : itemType === 'deadline'
          ? 'deadline'
          : itemType === 'holiday'
          ? 'holiday'
          : itemType === 'college_day'
          ? 'college_day'
          : 'event';
      setIsAllDay(initialEventType === 'holiday');
      setDurationMinutes(60);
      setCategory('DSA');
      setEventType(initialEventType);
      setGoalId(goals[0]?.id || '');
      setNotes('');
      setLocation('');
      setIsCompleted(false);
    }
    setError(null);
  }, [isOpen, itemType, mode, data, goals, selectedDate]);

  if (!isOpen) return null;

  const saveCurrentItem = (): boolean => {
    if (!title.trim()) {
      setError('Please provide a title');
      return false;
    }

    if (itemType === 'task') {
      if (data && data.id && mode !== 'create') {
        updateTask({
          id: data.id,
          title: title.trim(),
          date,
          startTime,
          endTime,
          durationMinutes: Number(durationMinutes) || 45,
          category,
          goalId: goalId || undefined,
          notes: notes.trim() || undefined,
          completed: isCompleted,
        });
      } else {
        addTask({
          title: title.trim(),
          date,
          startTime,
          endTime,
          durationMinutes: Number(durationMinutes) || 45,
          category,
          goalId: goalId || undefined,
          notes: notes.trim() || undefined,
          completed: false,
        });
      }
    } else {
      // Event / Exam / Deadline / Holiday / College Day:
      const resolvedType: EventType = eventType;

      if (data && data.id && mode !== 'create') {
        updateCalendarEvent({
          id: data.id,
          title: title.trim(),
          date,
          startTime: isAllDay ? undefined : (startTime || undefined),
          endTime: isAllDay ? undefined : (endTime || undefined),
          type: resolvedType,
          description: notes.trim() || undefined,
          location: location.trim() || undefined,
        });
      } else {
        addCalendarEvent({
          title: title.trim(),
          date,
          startTime: isAllDay ? undefined : (startTime || undefined),
          endTime: isAllDay ? undefined : (endTime || undefined),
          type: resolvedType,
          description: notes.trim() || undefined,
          location: location.trim() || undefined,
        });
      }
    }

    return true;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (saveCurrentItem()) {
      closeModal();
    }
  };

  const handleSaveAndAddAnother = (e: React.MouseEvent) => {
    e.preventDefault();
    if (saveCurrentItem()) {
      const savedTitle = title.trim();
      setTitle('');
      setNotes('');
      setError(null);
      setSuccessNotice(`Saved "${savedTitle}". You can now add the next entry below!`);
      setTimeout(() => setSuccessNotice(null), 3500);
    }
  };

  const handleDelete = () => {
    if (!data?.id) return;
    if (itemType === 'task') {
      deleteTask(data.id);
    } else {
      deleteCalendarEvent(data.id);
    }
    closeModal();
  };

  const getHeading = () => {
    const action = mode === 'create' ? 'Add' : mode === 'edit' ? 'Edit' : 'View';
    const typeLabel =
      itemType === 'task'
        ? 'Study Task'
        : itemType === 'exam'
        ? 'Examination'
        : itemType === 'deadline'
        ? 'Important Deadline'
        : itemType === 'holiday'
        ? 'Holiday'
        : itemType === 'college_day'
        ? 'Instructional College Day'
        : 'Calendar Event';
    return `${action} ${typeLabel}`;
  };

  return (
    <div
      id="item-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div
        id="item-detail-modal-card"
        className="relative w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">{getHeading()}</h2>
            <ColorBadge
              type={
                itemType === 'task'
                  ? 'task'
                  : itemType === 'exam'
                  ? 'exam'
                  : itemType === 'deadline'
                  ? 'deadline'
                  : eventType
              }
              size="sm"
            />
          </div>
          <button
            id="close-modal-button"
            onClick={closeModal}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successNotice && (
            <div className="flex items-center gap-2 p-3 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{successNotice}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Title
            </label>
            <input
              id="item-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                itemType === 'task'
                  ? 'e.g. COA — Cache Memory notes & practice questions'
                  : itemType === 'exam'
                  ? 'e.g. CS201 Data Structures Midterm Exam'
                  : 'e.g. Technical Paper Submission Deadline'
              }
              className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Date & Time Grid */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Date
                </label>
                <div className="relative">
                  <input
                    id="item-date-input"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              {itemType !== 'task' ? (
                <div className="flex flex-col justify-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 select-none">
                    <input
                      id="item-allday-checkbox"
                      type="checkbox"
                      checked={isAllDay}
                      onChange={(e) => setIsAllDay(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span>All-Day Event (No specific time)</span>
                  </label>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Start Time
                  </label>
                  <div className="relative">
                    <input
                      id="item-time-input"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>

            {/* If event and NOT all-day, show Start and End Times */}
            {itemType !== 'task' && !isAllDay && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Start Time
                  </label>
                  <div className="relative">
                    <input
                      id="item-event-starttime-input"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    End Time
                  </label>
                  <input
                    id="item-event-endtime-input"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* End Time or Duration for tasks, Location for events */}
          {itemType === 'task' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  End Time
                </label>
                <input
                  id="item-endtime-input"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Duration (Minutes)
                </label>
                <input
                  id="item-duration-input"
                  type="number"
                  min={5}
                  step={5}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Location / Venue (Optional)
              </label>
              <input
                id="item-location-input"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Exam Hall CS-204, Campus Auditorium, Moodle"
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Categorization */}
          {itemType === 'task' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Subject / Category
                </label>
                <select
                  id="item-category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TaskCategory)}
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="DSA">DSA (Data Structures & Algorithms)</option>
                  <option value="COA">COA (Computer Org & Architecture)</option>
                  <option value="OS">OS (Operating Systems)</option>
                  <option value="ML">ML (Machine Learning)</option>
                  <option value="GATE">GATE 2028 Preparation</option>
                  <option value="Placement">Coding / Placements</option>
                  <option value="Project">Personal Engineering Project</option>
                  <option value="Personal">General / Revision</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Linked Goal (Optional)
                </label>
                <select
                  id="item-goal-select"
                  value={goalId}
                  onChange={(e) => setGoalId(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">No goal linked</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title} ({g.priority})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Category Tag
                </label>
                <ColorBadge type={eventType} size="sm" />
              </div>
              <select
                id="item-eventtype-select"
                value={eventType}
                onChange={(e) => {
                  const newType = e.target.value as EventType;
                  setEventType(newType);
                  if (newType === 'holiday') {
                    setIsAllDay(true);
                  }
                }}
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="holiday">Holiday (Green)</option>
                <option value="exam">Examination (Red)</option>
                <option value="deadline">Submission / Project Deadline (Purple)</option>
                <option value="event">College Event / Fest / Seminar (Purple)</option>
                <option value="college_day">College Instructional Day (Orange)</option>
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Notes & Details
            </label>
            <textarea
              id="item-notes-textarea"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add specific topics, links, formulas or chapter references..."
              className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status Checkbox for tasks */}
          {itemType === 'task' && data && (
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                id="item-completed-checkbox"
                type="checkbox"
                checked={isCompleted}
                onChange={(e) => setIsCompleted(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-slate-800">Mark task as completed</span>
            </label>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {data && data.id ? (
              isConfirmingDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-rose-700">Confirm deletion?</span>
                  <button
                    type="button"
                    id="confirm-delete-item-button"
                    onClick={handleDelete}
                    className="px-2.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors"
                  >
                    Yes, Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className="px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  id="delete-item-button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button
                type="button"
                id="cancel-item-button"
                onClick={closeModal}
                className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>

              {mode === 'create' && (
                <button
                  type="button"
                  id="save-and-add-another-button"
                  onClick={handleSaveAndAddAnother}
                  className="px-3.5 py-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                >
                  Save & Add Another
                </button>
              )}

              <button
                type="submit"
                id="save-item-button"
                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-colors"
              >
                {mode === 'create' ? 'Save Entry' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
