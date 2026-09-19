import React from 'react';
import { useSemester } from '../../context/SemesterContext';
import { ColorBadge } from '../ColorBadge';
import { getTodayDateString } from '../../utils/dateUtils';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  ArrowRight,
  Target,
  AlertCircle,
  Layers,
  Sparkles,
  CalendarDays,
  ListTodo,
} from 'lucide-react';

export const DashboardScreen: React.FC = () => {
  const {
    userProfile,
    semesterInfo,
    selectedDate,
    setSelectedDate,
    setActiveScreen,
    getClassesForDate,
    getTasksForDate,
    getEventsForDate,
    getAvailableStudyHours,
    toggleTaskComplete,
    calendarEvents,
    getWeeklyStats,
    openModal,
  } = useSemester();

  const todayStr = getTodayDateString();
  const todayDate = new Date(todayStr + 'T00:00:00');

  const formattedDate = todayDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const classesToday = getClassesForDate(todayStr);
  const tasksToday = getTasksForDate(todayStr);
  const availableHours = getAvailableStudyHours(todayStr);
  const weeklyStats = getWeeklyStats();

  const completedToday = tasksToday.filter((t) => t.completed).length;
  const progressPercent = tasksToday.length > 0 ? Math.round((completedToday / tasksToday.length) * 100) : 0;

  // Upcoming exams & deadlines after today
  const upcomingExams = calendarEvents
    .filter((e) => e.type === 'exam' && e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  const upcomingDeadlines = calendarEvents
    .filter((e) => (e.type === 'deadline' || e.type === 'event') && e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  const nextExam = upcomingExams[0];
  const nextDeadline = upcomingDeadlines[0];

  const daysUntilExam = nextExam
    ? Math.max(0, Math.ceil((new Date(nextExam.date + 'T00:00:00').getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  const daysUntilDeadline = nextDeadline
    ? Math.max(0, Math.ceil((new Date(nextDeadline.date + 'T00:00:00').getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  const todayDayName = todayDate.toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div id="screen-dashboard" className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Greeting Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            {semesterInfo.name || 'Semester 3'} • {semesterInfo.college || 'Engineering College'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Good morning, {userProfile.name.split(' ')[0]}
          </h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Today is {formattedDate}</span>
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="dash-quick-add-task"
            onClick={() => openModal('task', 'create', { date: todayStr })}
            className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>

          <button
            id="dash-quick-add-event"
            onClick={() => openModal('event', 'create', { date: todayStr })}
            className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Event</span>
          </button>

          <button
            id="dash-view-calendar"
            onClick={() => setActiveScreen('calendar')}
            className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>View Calendar</span>
          </button>

          <button
            id="dash-plan-week"
            onClick={() => setActiveScreen('weekly-plan')}
            className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>Plan Week</span>
          </button>
        </div>
      </div>

      {/* Main Focus: Today's High-Level Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Available Study Window */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Today's Available Study Time</span>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-2">
              {availableHours} Hours
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Time available after {classesToday.length} classes and meal breaks.
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedDate(todayStr);
              setActiveScreen('today');
            }}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-4 pt-3 border-t border-slate-100"
          >
            <span>Open Daily Planner</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Today's Planned Tasks & Progress */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Today's Task Progress</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-2">
              {completedToday} / {tasksToday.length}
            </div>
            {/* Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              {progressPercent}% completed of today's planned tasks.
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedDate(todayStr);
              setActiveScreen('today');
            }}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-4 pt-3 border-t border-slate-100"
          >
            <span>Manage today's tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* This Week's Overall Progress */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Week 5 Progress</span>
              <Target className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-3xl font-bold text-indigo-600 mt-2">
              {weeklyStats.completedTargetHours}h{' '}
              <span className="text-sm font-normal text-slate-500">
                / {weeklyStats.totalWeeklyTargetHours}h
              </span>
            </div>
            {/* Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    (weeklyStats.completedTargetHours /
                      (weeklyStats.totalWeeklyTargetHours || 1)) *
                      100
                  )}%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Targeting GATE 2028 & Core CS courses.
            </p>
          </div>
          <button
            onClick={() => setActiveScreen('weekly-plan')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-4 pt-3 border-t border-slate-100"
          >
            <span>View weekly breakdown</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Two Column Grid: Today's Tasks & Today's Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Today's Tasks */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-sm font-semibold text-slate-900">
              Today's Planned Study Tasks
            </h2>
            <button
              onClick={() => openModal('task', 'create', { date: todayStr })}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>

          <div className="p-4 space-y-2.5">
            {tasksToday.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-3 text-center bg-slate-50 rounded-lg">
                No study tasks scheduled yet for today.
              </p>
            ) : (
              tasksToday.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50/60 transition-colors text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      onClick={() => toggleTaskComplete(task.id)}
                      className="text-slate-400 hover:text-indigo-600 shrink-0"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`font-semibold truncate ${
                          task.completed
                            ? 'line-through text-slate-400 font-normal'
                            : 'text-slate-900'
                        }`}
                      >
                        {task.title}
                      </p>
                      <span className="text-[11px] text-slate-500">
                        {task.startTime} – {task.endTime} ({task.durationMinutes} mins)
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded ml-2 shrink-0">
                    {task.category}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Today's College Schedule */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-orange-50/30">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <h2 className="text-sm font-semibold text-slate-900">
                Today's College Classes ({todayDayName})
              </h2>
            </div>
            <button
              onClick={() => setActiveScreen('timetable')}
              className="text-xs font-semibold text-orange-700 hover:text-orange-900"
            >
              View Full Timetable
            </button>
          </div>

          <div className="p-4 space-y-2">
            {classesToday.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-3 text-center bg-slate-50 rounded-lg">
                No classes scheduled for {todayDayName}.
              </p>
            ) : (
              classesToday.map((cls) => (
                <div
                  key={cls.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-orange-100 bg-orange-50/20 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-orange-900 min-w-[85px]">
                      {cls.startTime} – {cls.endTime}
                    </span>
                    <span className="font-semibold text-slate-900">{cls.subject}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-orange-800 bg-orange-100 px-1.5 py-0.5 rounded">
                      {cls.type}
                    </span>
                    <span className="text-slate-500">{cls.room}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Milestones: Next Exam & Next Important Deadline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Next Exam */}
        <div className="bg-white p-5 rounded-xl border border-rose-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Upcoming Exam
            </span>
            <span className="text-[11px] text-slate-400">
              {daysUntilExam !== null ? `${daysUntilExam} ${daysUntilExam === 1 ? 'day' : 'days'} remaining` : 'Upcoming'}
            </span>
          </div>

          {nextExam ? (
            <div>
              <h3 className="text-sm font-bold text-slate-900">{nextExam.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{nextExam.description}</p>
              <div className="mt-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 p-2 rounded-lg flex items-center justify-between">
                <span>Date: {nextExam.date}</span>
                <span>{nextExam.startTime ? `${nextExam.startTime} – ${nextExam.endTime}` : 'Morning Slot'}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No exams in the immediate horizon.</p>
          )}
        </div>

        {/* Next Important Deadline */}
        <div className="bg-white p-5 rounded-xl border border-purple-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Next Important Deadline
            </span>
            <span className="text-[11px] text-slate-400">
              {daysUntilDeadline !== null ? `${daysUntilDeadline} ${daysUntilDeadline === 1 ? 'day' : 'days'} remaining` : 'Upcoming'}
            </span>
          </div>

          {nextDeadline ? (
            <div>
              <h3 className="text-sm font-bold text-slate-900">{nextDeadline.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{nextDeadline.description}</p>
              <div className="mt-3 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-100 p-2 rounded-lg flex items-center justify-between">
                <span>Due Date: {nextDeadline.date}</span>
                <span>{nextDeadline.startTime ? nextDeadline.startTime : '23:59 PM'}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No upcoming submission deadlines.</p>
          )}
        </div>
      </div>
    </div>
  );
};
