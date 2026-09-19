/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SemesterProvider, useSemester } from './context/SemesterContext';
import { Navigation } from './components/Navigation';
import { WelcomeScreen } from './components/screens/WelcomeScreen';
import { SemesterSetupScreen } from './components/screens/SemesterSetupScreen';
import { CalendarReviewScreen } from './components/screens/CalendarReviewScreen';
import { MainCalendarScreen } from './components/screens/MainCalendarScreen';
import { TimetableScreen } from './components/screens/TimetableScreen';
import { AvailabilityScreen } from './components/screens/AvailabilityScreen';
import { GoalsScreen } from './components/screens/GoalsScreen';
import { WeeklyPlanningScreen } from './components/screens/WeeklyPlanningScreen';
import { DailyPlannerScreen } from './components/screens/DailyPlannerScreen';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { ItemDetailModal } from './components/modals/ItemDetailModal';
import { Calendar, Clock, Plus, Sparkles } from 'lucide-react';

const ScreenRenderer: React.FC = () => {
  const { activeScreen, setActiveScreen, openModal } = useSemester();

  // Onboarding screens have dedicated full-page wizard layouts
  if (activeScreen === 'welcome') {
    return (
      <>
        <WelcomeScreen />
        <ItemDetailModal />
      </>
    );
  }

  if (activeScreen === 'setup') {
    return (
      <>
        <SemesterSetupScreen />
        <ItemDetailModal />
      </>
    );
  }

  if (activeScreen === 'calendar-review') {
    return (
      <>
        <CalendarReviewScreen />
        <ItemDetailModal />
      </>
    );
  }

  // Regular application screens with persistent navigation
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row">
      {/* Navigation (Sidebar on Desktop, Bottom Bar on Mobile) */}
      <Navigation />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col pb-20 md:pb-6">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider hidden sm:inline">
              SemesterFlow
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>

            {/* Quick Screen Switcher Selector */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="screen-quick-select" className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden lg:inline">
                Jump to Screen:
              </label>
              <select
                id="screen-quick-select"
                value={activeScreen}
                onChange={(e) => setActiveScreen(e.target.value as any)}
                className="text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <optgroup label="Core Daily & Academic (Screens 4–10)">
                  <option value="today">Screen 9: Today (Daily Planner) ★</option>
                  <option value="dashboard">Screen 10: Home Dashboard</option>
                  <option value="calendar">Screen 4: Semester Calendar</option>
                  <option value="timetable">Screen 5: College Timetable</option>
                  <option value="availability">Screen 6: Availability & Non-Study</option>
                  <option value="goals">Screen 7: Goals (GATE, SDE)</option>
                  <option value="weekly-plan">Screen 8: Weekly Planning</option>
                </optgroup>
                <optgroup label="Onboarding Wizard (Screens 1–3)">
                  <option value="welcome">Screen 1: Welcome & Intro</option>
                  <option value="setup">Screen 2: Semester Setup</option>
                  <option value="calendar-review">Screen 3: Calendar Review</option>
                </optgroup>
                <optgroup label="Configuration (Screen 12)">
                  <option value="settings">Screen 12: Settings & Profile</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="top-quick-task-btn"
              onClick={() => openModal('task', 'create')}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Task</span>
            </button>
            <button
              id="top-quick-event-btn"
              onClick={() => openModal('event', 'create')}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Event</span>
            </button>
          </div>
        </header>

        {/* Screen View */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          {activeScreen === 'today' && <DailyPlannerScreen />}
          {activeScreen === 'dashboard' && <DashboardScreen />}
          {activeScreen === 'calendar' && <MainCalendarScreen />}
          {activeScreen === 'timetable' && <TimetableScreen />}
          {activeScreen === 'availability' && <AvailabilityScreen />}
          {activeScreen === 'goals' && <GoalsScreen />}
          {activeScreen === 'weekly-plan' && <WeeklyPlanningScreen />}
          {activeScreen === 'settings' && <SettingsScreen />}
        </div>
      </main>

      {/* Screen 11: Universal Reusable Modal for Task/Event Create & Edit */}
      <ItemDetailModal />
    </div>
  );
};

export default function App() {
  return (
    <SemesterProvider>
      <ScreenRenderer />
    </SemesterProvider>
  );
}
