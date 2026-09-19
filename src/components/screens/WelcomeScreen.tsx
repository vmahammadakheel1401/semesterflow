import React from 'react';
import { useSemester } from '../../context/SemesterContext';
import { BookOpen, Calendar, ArrowRight, CheckCircle2, Clock, Target, Layers } from 'lucide-react';

export const WelcomeScreen: React.FC = () => {
  const { setActiveScreen, resetToDemoData } = useSemester();

  return (
    <div
      id="screen-welcome"
      className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-8 max-w-4xl mx-auto text-center"
    >
      {/* Visual illustration / Calendar Graphic */}
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md">
          <Calendar className="w-10 h-10" />
        </div>
        {/* Floating subtle badges */}
        <div className="absolute -top-2 -right-8 bg-orange-100 border border-orange-200 text-orange-800 text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          College
        </div>
        <div className="absolute -bottom-2 -left-8 bg-blue-100 border border-blue-200 text-blue-800 text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          GATE & Goals
        </div>
      </div>

      {/* Main Titles */}
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-3">
        SemesterFlow
      </h1>
      <p className="text-lg sm:text-xl text-slate-600 max-w-xl mx-auto mb-8 font-normal">
        Plan your semester around college, goals, and real life.
      </p>

      {/* Primary Value Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl w-full mb-10">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 flex items-center justify-center mb-2.5">
            <Clock className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold text-slate-900 mb-1">College Timetable</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Import your lecture & lab schedule. Automatically find real available study windows.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center mb-2.5">
            <Target className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold text-slate-900 mb-1">High-Stakes Goals</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Set targets for GATE, placement prep, coding, or projects alongside academic coursework.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mb-2.5">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold text-slate-900 mb-1">Clear Daily Focus</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            No endless feeds. Always know exactly: "What do I need to get done today?"
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <button
          id="welcome-get-started-button"
          onClick={() => setActiveScreen('setup')}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
        >
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          id="welcome-login-button"
          onClick={() => setActiveScreen('dashboard')}
          className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors"
        >
          <span>Existing User: Log In</span>
        </button>
      </div>

      {/* Demo helper */}
      <div className="mt-8 pt-6 border-t border-slate-200/60 text-xs text-slate-500">
        <span>Want to preview a pre-filled engineering student setup? </span>
        <button
          id="welcome-load-demo-button"
          onClick={() => {
            resetToDemoData();
            setActiveScreen('dashboard');
          }}
          className="font-semibold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 ml-1"
        >
          Load Semester 3 CSE Demo
        </button>
      </div>
    </div>
  );
};
