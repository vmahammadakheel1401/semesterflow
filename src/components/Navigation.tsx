import React from 'react';
import { useSemester, ScreenId } from '../context/SemesterContext';
import {
  LayoutDashboard,
  CalendarDays,
  CalendarCheck,
  Clock,
  Target,
  ListTodo,
  ShieldAlert,
  Settings,
  Sparkles,
  ChevronRight,
  BookMarked,
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const { activeScreen, setActiveScreen, semesterInfo, userProfile } = useSemester();

  const navItems: { id: ScreenId; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'today', label: 'Today', icon: CalendarCheck, badge: 'Main' },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Semester Calendar', icon: CalendarDays },
    { id: 'timetable', label: 'College Timetable', icon: Clock },
    { id: 'weekly-plan', label: 'Weekly Plan', icon: ListTodo },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'availability', label: 'Availability', icon: ShieldAlert },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside
        id="desktop-sidebar"
        className="hidden md:flex flex-col w-64 shrink-0 bg-white border-r border-slate-200 min-h-screen select-none"
      >
        {/* App Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                <BookMarked className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-900">
                SemesterFlow
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 pl-10 font-normal">
              Engineering Academic Planner
            </p>
          </div>
        </div>

        {/* Current Student & Semester Badge */}
        <div className="p-3 mx-3 my-2 bg-slate-50 border border-slate-200/80 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 truncate">
              {semesterInfo.name || 'Semester 3'}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              Phase 1
            </span>
          </div>
          <p className="text-[11px] text-slate-500 truncate mt-0.5">
            {semesterInfo.college || 'NIT CSE'}
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-1.5">
            Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => setActiveScreen(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-indigo-600' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-indigo-200/60 text-indigo-800'
                        : 'bg-slate-200/60 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Quick Setup Screens Access */}
          <div className="pt-4 mt-4 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-1.5">
              Setup & Review
            </div>
            <button
              id="nav-setup-welcome"
              onClick={() => setActiveScreen('welcome')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeScreen === 'welcome'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <span>1. Welcome Screen</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button
              id="nav-setup-semester"
              onClick={() => setActiveScreen('setup')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeScreen === 'setup'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <span>2. Semester Setup</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button
              id="nav-setup-review"
              onClick={() => setActiveScreen('calendar-review')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeScreen === 'calendar-review'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <span>3. Calendar Review</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </nav>

        {/* User Info Footer */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center border border-slate-300">
              {userProfile.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {userProfile.name}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {userProfile.degree}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header
        id="mobile-header"
        className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white">
            <BookMarked className="w-4 h-4" />
          </div>
          <span className="font-bold text-base text-slate-900">SemesterFlow</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="mobile-setup-switch-button"
            onClick={() => setActiveScreen('setup')}
            className="text-xs font-medium px-2.5 py-1 text-slate-700 bg-slate-100 rounded-md"
          >
            Setup Flow
          </button>
          <button
            id="mobile-settings-button"
            onClick={() => setActiveScreen('settings')}
            className="p-1 text-slate-600 hover:text-slate-900"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex items-center justify-around py-1.5 px-1 shadow-lg"
      >
        <button
          id="mobile-nav-today"
          onClick={() => setActiveScreen('today')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            activeScreen === 'today'
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <CalendarCheck className="w-5 h-5 mb-0.5" />
          <span>Today</span>
        </button>

        <button
          id="mobile-nav-dashboard"
          onClick={() => setActiveScreen('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            activeScreen === 'dashboard'
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Dashboard</span>
        </button>

        <button
          id="mobile-nav-calendar"
          onClick={() => setActiveScreen('calendar')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            activeScreen === 'calendar'
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <CalendarDays className="w-5 h-5 mb-0.5" />
          <span>Calendar</span>
        </button>

        <button
          id="mobile-nav-timetable"
          onClick={() => setActiveScreen('timetable')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            activeScreen === 'timetable'
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-5 h-5 mb-0.5" />
          <span>Timetable</span>
        </button>

        <button
          id="mobile-nav-weekly"
          onClick={() => setActiveScreen('weekly-plan')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            activeScreen === 'weekly-plan'
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ListTodo className="w-5 h-5 mb-0.5" />
          <span>Plan</span>
        </button>

        <button
          id="mobile-nav-goals"
          onClick={() => setActiveScreen('goals')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            activeScreen === 'goals'
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Target className="w-5 h-5 mb-0.5" />
          <span>Goals</span>
        </button>
      </nav>
    </>
  );
};
