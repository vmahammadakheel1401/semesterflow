import React, { useState, useRef } from 'react';
import { useSemester } from '../../context/SemesterContext';
import { ColorBadge, LegendBar } from '../ColorBadge';
import { getTodayDateString, isTodayDate } from '../../utils/dateUtils';
import { parseUploadedCalendarFile } from '../../utils/calendarParser';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarCheck,
  Clock,
  MapPin,
  X,
  ExternalLink,
  UploadCloud,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const MainCalendarScreen: React.FC = () => {
  const {
    calendarEvents,
    selectedDate,
    setSelectedDate,
    setActiveScreen,
    openModal,
    getClassesForDate,
    getTasksForDate,
    appendCalendarEvents,
    updateSemesterInfo,
  } = useSemester();

  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(8); // 8 = September (0-indexed)
  const [activeDateModal, setActiveDateModal] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadFeedback, setUploadFeedback] = useState<{
    message: string;
    type: 'success' | 'error';
    details?: { total: number; exams: number; holidays: number; deadlines: number };
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCalendarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    setIsUploading(true);
    setUploadFeedback(null);

    try {
      const allEvents = [];
      let examCount = 0;
      let holidayCount = 0;
      let deadlineCount = 0;

      for (const file of files) {
        const result = await parseUploadedCalendarFile(file);
        if (result.events && result.events.length > 0) {
          allEvents.push(...result.events);
          examCount += result.summary?.exams || result.events.filter((ev) => ev.type === 'exam').length;
          holidayCount += result.summary?.holidays || result.events.filter((ev) => ev.type === 'holiday').length;
          deadlineCount += result.summary?.deadlines || result.events.filter((ev) => ev.type === 'deadline').length;
        }
      }

      if (allEvents.length > 0) {
        // 1. Instant Auto-Commit to global context
        appendCalendarEvents(allEvents);
        updateSemesterInfo({ calendarFileName: files.map((f) => f.name).join(', ') });

        // 2. Auto switch calendar view to the month of the first event
        const firstDateStr = allEvents[0].date;
        const [firstY, firstM] = firstDateStr.split('-').map(Number);
        if (!isNaN(firstY) && !isNaN(firstM)) {
          setCurrentYear(firstY);
          setCurrentMonth(firstM - 1);
        }

        setUploadFeedback({
          type: 'success',
          message: `Auto-committed ${allEvents.length} calendar entries from ${files.map((f) => f.name).join(', ')} in real-time!`,
          details: {
            total: allEvents.length,
            exams: examCount,
            holidays: holidayCount,
            deadlines: deadlineCount,
          },
        });
      } else {
        setUploadFeedback({
          type: 'error',
          message: `Uploaded ${files.map((f) => f.name).join(', ')}, but no dated entries were detected.`,
        });
      }
    } catch (err: any) {
      setUploadFeedback({
        type: 'error',
        message: `Failed to import calendar: ${err.message || 'Unknown error'}`,
      });
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // Calendar Math
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const todayStr = getTodayDateString();

  const handleGoToday = () => {
    const [y, m] = todayStr.split('-').map(Number);
    setCurrentYear(y);
    setCurrentMonth(m - 1);
    setSelectedDate(todayStr);
    setActiveDateModal(todayStr);
  };

  // Get date string helper: YYYY-MM-DD
  const getDateString = (day: number): string => {
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${currentYear}-${mm}-${dd}`;
  };

  const isToday = (dateStr: string) => isTodayDate(dateStr);

  // Details for date modal
  const selectedModalDate = activeDateModal || selectedDate;
  const eventsForModalDate = calendarEvents.filter((e) => e.date === selectedModalDate);
  const classesForModalDate = getClassesForDate(selectedModalDate);
  const tasksForModalDate = getTasksForDate(selectedModalDate);

  const modalDateFormatted = new Date(selectedModalDate + 'T00:00:00').toLocaleDateString(
    'en-US',
    {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }
  );

  return (
    <div id="screen-main-calendar" className="max-w-6xl mx-auto py-6 px-4 space-y-5">
      <input
        ref={fileInputRef}
        id="cal-file-upload-input"
        type="file"
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,.tsv,.json,.txt"
        className="hidden"
        onChange={handleCalendarFileUpload}
      />

      {/* Calendar Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Semester Calendar
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Medium-density monthly view showing academic days, exams, holidays, and milestones.
          </p>
        </div>

        {/* Navigation Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="cal-upload-calendar-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-700 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-colors"
            title="Auto-import calendar file (PDF, CSV, JSON, TXT)"
          >
            <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isUploading ? 'Importing...' : 'Upload / Replace Calendar'}</span>
          </button>

          <button
            id="cal-today-btn"
            onClick={handleGoToday}
            className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
          >
            Today (Sep 18)
          </button>

          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              id="cal-prev-month"
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-colors"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold text-slate-800 px-3 min-w-[120px] text-center">
              {monthNames[currentMonth]} {currentYear}
            </span>

            <button
              id="cal-next-month"
              onClick={handleNextMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-colors"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            id="cal-add-event-btn"
            onClick={() => openModal('event', 'create')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Upload & Auto-Commit Notification Banner */}
      {uploadFeedback && (
        <div
          className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            uploadFeedback.type === 'success'
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
              : 'bg-rose-50/90 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {uploadFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <X className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-xs sm:text-sm font-semibold">{uploadFeedback.message}</p>
              {uploadFeedback.details && (
                <div className="flex items-center gap-2 mt-1.5 text-[11px] font-medium flex-wrap">
                  <span className="bg-white/80 px-2 py-0.5 rounded border border-emerald-200 text-slate-800">
                    {uploadFeedback.details.total} Total Dates
                  </span>
                  <span className="bg-white/80 px-2 py-0.5 rounded border border-rose-200 text-rose-700">
                    {uploadFeedback.details.exams} Exams
                  </span>
                  <span className="bg-white/80 px-2 py-0.5 rounded border border-emerald-200 text-emerald-700">
                    {uploadFeedback.details.holidays} Holidays
                  </span>
                  <span className="bg-white/80 px-2 py-0.5 rounded border border-amber-200 text-amber-700">
                    {uploadFeedback.details.deadlines} Deadlines
                  </span>
                  <span className="text-emerald-700 font-semibold">• Live in Calendar, Exams & Daily Planner</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={() => setActiveScreen('calendar-review')}
              className="text-xs font-semibold px-2.5 py-1 bg-white hover:bg-slate-50 border rounded-md transition-colors"
            >
              Review Line-by-Line
            </button>
            <button
              onClick={() => setUploadFeedback(null)}
              className="p-1 hover:bg-black/5 rounded-md transition-colors"
              aria-label="Dismiss message"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <LegendBar />

      {/* Monthly Grid Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-600 py-2.5">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Month Day Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 border-b border-slate-200">
          {/* Leading Empty Cells */}
          {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="min-h-[92px] bg-slate-50/40 p-2 text-slate-300 select-none"
            />
          ))}

          {/* Actual Days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateStr = getDateString(dayNum);
            const today = isToday(dateStr);
            const isSelected = selectedDate === dateStr;

            // Events on this day
            const dayEvents = calendarEvents.filter((e) => e.date === dateStr);
            const holiday = dayEvents.find((e) => e.type === 'holiday');
            const exams = dayEvents.filter((e) => e.type === 'exam');
            const deadlinesOrEvents = dayEvents.filter(
              (e) => e.type === 'event' || e.type === 'deadline'
            );

            // Day of week
            const dayOfWeek = (firstDayOfMonth + idx) % 7;
            const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
            const isCollegeDay = isWeekday && !holiday;

            return (
              <div
                key={dateStr}
                id={`calendar-cell-${dateStr}`}
                onClick={() => {
                  setSelectedDate(dateStr);
                  setActiveDateModal(dateStr);
                }}
                className={`min-h-[96px] p-2 flex flex-col justify-between cursor-pointer transition-all duration-150 relative ${
                  today
                    ? 'bg-indigo-50/50 ring-2 ring-indigo-500 ring-inset z-10'
                    : isSelected
                    ? 'bg-slate-50'
                    : 'hover:bg-slate-50/80 bg-white'
                }`}
              >
                {/* Top Row: Date Number and Indicators */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold rounded-md w-6 h-6 flex items-center justify-center ${
                      today
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-800'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {/* Classification Tag Dot */}
                  <div className="flex items-center gap-1">
                    {holiday && (
                      <span
                        className="w-2 h-2 rounded-full bg-emerald-500"
                        title="College Holiday"
                      />
                    )}
                    {exams.length > 0 && (
                      <span
                        className="w-2 h-2 rounded-full bg-rose-500"
                        title="Exam scheduled"
                      />
                    )}
                    {deadlinesOrEvents.length > 0 && (
                      <span
                        className="w-2 h-2 rounded-full bg-purple-500"
                        title="Event or Deadline"
                      />
                    )}
                    {isCollegeDay && !holiday && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-orange-400"
                        title="College Instructional Day"
                      />
                    )}
                  </div>
                </div>

                {/* Day Content Badges (Medium Density) */}
                <div className="space-y-1 my-1 overflow-hidden">
                  {holiday && (
                    <div className="text-[10px] truncate px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                      {holiday.title}
                    </div>
                  )}

                  {exams.slice(0, 1).map((ex) => (
                    <div
                      key={ex.id}
                      className="text-[10px] truncate px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-semibold"
                    >
                      {ex.title.replace('Mid-Semester Examinations — ', '')}
                    </div>
                  ))}

                  {deadlinesOrEvents.slice(0, 1).map((dev) => (
                    <div
                      key={dev.id}
                      className="text-[10px] truncate px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 font-medium"
                    >
                      {dev.title}
                    </div>
                  ))}

                  {/* Fallback subtle college indicator if no major event */}
                  {isCollegeDay && dayEvents.length === 0 && (
                    <div className="text-[10px] text-orange-700/80 px-1 truncate">
                      College Day
                    </div>
                  )}
                </div>

                {/* Footer Count if overflow */}
                {dayEvents.length > 2 && (
                  <div className="text-[9px] font-medium text-slate-400 text-right">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Date Details Drawer / Modal (When clicked) */}
      {activeDateModal && (
        <div
          id="calendar-date-drawer"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveDateModal(null);
          }}
        >
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    {modalDateFormatted}
                  </h2>
                  {isToday(selectedModalDate) && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-600 text-white">
                      TODAY
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Academic commitments, classes, and planned study sessions
                </p>
              </div>

              <button
                id="close-date-drawer"
                onClick={() => setActiveDateModal(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Calendar Events / Exams / Holidays */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Calendar Events & Milestones
                  </h3>
                  <button
                    onClick={() => {
                      setActiveDateModal(null);
                      openModal('event', 'create', { date: selectedModalDate });
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>

                {eventsForModalDate.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-2.5 rounded-lg">
                    No special calendar events or holidays on this date. Regular college day.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {eventsForModalDate.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3 rounded-lg border border-slate-200 bg-white flex items-start justify-between gap-3 shadow-2xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-900">
                              {ev.title}
                            </span>
                            <ColorBadge type={ev.type} size="sm" />
                          </div>
                          {ev.description && (
                            <p className="text-xs text-slate-500 mt-1">
                              {ev.description}
                            </p>
                          )}
                          {ev.location && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                              <MapPin className="w-3 h-3" />
                              <span>{ev.location}</span>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            setActiveDateModal(null);
                            openModal(
                              ev.type === 'exam'
                                ? 'exam'
                                : ev.type === 'deadline'
                                ? 'deadline'
                                : 'event',
                              'edit',
                              ev
                            );
                          }}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium shrink-0"
                        >
                          Edit
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* College Classes on this day */}
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  College Lectures & Labs
                </h3>
                {classesForModalDate.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-2.5 rounded-lg">
                    No college classes scheduled (Weekend or Campus Holiday).
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {classesForModalDate.map((cls) => (
                      <div
                        key={cls.id}
                        className="p-2.5 rounded-lg bg-orange-50/60 border border-orange-200 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-orange-900">
                            {cls.startTime} – {cls.endTime}
                          </span>
                          <span className="text-slate-800 font-medium">
                            {cls.subject} ({cls.code})
                          </span>
                        </div>
                        <span className="text-[11px] text-orange-800 bg-orange-100/80 px-2 py-0.5 rounded font-medium">
                          {cls.type.toUpperCase()} • {cls.room}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Planned Study Tasks */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Planned Tasks for this Date
                  </h3>
                  <button
                    onClick={() => {
                      setActiveDateModal(null);
                      openModal('task', 'create', { date: selectedModalDate });
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Plan Task
                  </button>
                </div>

                {tasksForModalDate.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-2.5 rounded-lg">
                    No personal study tasks manually planned for this date yet.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {tasksForModalDate.map((task) => (
                      <div
                        key={task.id}
                        className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-200 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-blue-900">
                            {task.startTime} – {task.endTime}
                          </span>
                          <span
                            className={
                              task.completed
                                ? 'line-through text-slate-400'
                                : 'text-slate-800 font-medium'
                            }
                          >
                            {task.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-blue-800 bg-blue-100 px-2 py-0.5 rounded font-medium">
                          {task.category}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer with shortcut to Today Screen */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedDate(selectedModalDate);
                  setActiveDateModal(null);
                  setActiveScreen('today');
                }}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Daily Planner</span>
              </button>

              <button
                onClick={() => setActiveDateModal(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
