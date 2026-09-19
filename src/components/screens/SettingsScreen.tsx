import React, { useState } from 'react';
import { useSemester } from '../../context/SemesterContext';
import {
  User,
  BookOpen,
  Clock,
  Target,
  Bell,
  Download,
  Upload,
  RotateCcw,
  Check,
  Shield,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const {
    userProfile,
    updateUserProfile,
    semesterInfo,
    updateSemesterInfo,
    resetToDemoData,
    goals,
    classes,
    weeklyTargets,
    dailyTasks,
    calendarEvents,
    unavailableBlocks,
  } = useSemester();

  // Local form states
  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [degree, setDegree] = useState(userProfile.degree);
  const [semName, setSemName] = useState(semesterInfo.name);
  const [college, setCollege] = useState(semesterInfo.college);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Notification toggles
  const [classAlerts, setClassAlerts] = useState(true);
  const [morningSummary, setMorningSummary] = useState(true);
  const [examCountdown, setExamCountdown] = useState(true);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({ name, email, degree });
    updateSemesterInfo({ name: semName, college });
    setSavedNotice('Profile and semester settings saved successfully');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleExportData = () => {
    const dataToExport = {
      userProfile,
      semesterInfo,
      classes,
      goals,
      weeklyTargets,
      dailyTasks,
      calendarEvents,
      unavailableBlocks,
      exportDate: new Date().toISOString(),
    };
    const jsonStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SemesterFlow_Backup_${semesterInfo.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (confirm('Reset all data back to the default Semester 3 CSE engineering demo state?')) {
      resetToDemoData();
      setName('Aryan Sharma');
      setEmail('aryan.cs24@nitc.edu');
      setDegree('B.Tech in Computer Science & Engineering');
      setSemName('Semester 3 (Fall 2026)');
      setCollege('National Institute of Technology');
      setSavedNotice('Reset to default Semester 3 CSE demo plan completed');
      setTimeout(() => setSavedNotice(null), 3000);
    }
  };

  return (
    <div id="screen-settings" className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Settings & Preferences
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your engineering student profile, academic semester settings, and data exports.
        </p>
      </div>

      {savedNotice && (
        <div className="p-3 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* 1. Student Profile & Semester Form */}
      <form onSubmit={handleSaveProfile} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-600" />
          <span>Student Profile & Semester Details</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Student Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Degree & Branch
          </label>
          <input
            type="text"
            required
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Semester Title
            </label>
            <input
              type="text"
              required
              value={semName}
              onChange={(e) => setSemName(e.target.value)}
              className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              College / University
            </label>
            <input
              type="text"
              required
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            Save Changes
          </button>
        </div>
      </form>

      {/* 2. Notification Preferences */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-600" />
          <span>Notification & Alert Preferences</span>
        </h2>

        <div className="space-y-3 pt-1">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-xs font-semibold text-slate-800">College Class Timetable Alerts</span>
              <p className="text-[11px] text-slate-500">
                Notify 10 minutes before every lecture or laboratory session.
              </p>
            </div>
            <input
              type="checkbox"
              checked={classAlerts}
              onChange={(e) => setClassAlerts(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-xs font-semibold text-slate-800">Daily Morning Planner Summary</span>
              <p className="text-[11px] text-slate-500">
                Receive a daily 8:00 AM overview of free windows and planned study tasks.
              </p>
            </div>
            <input
              type="checkbox"
              checked={morningSummary}
              onChange={(e) => setMorningSummary(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-xs font-semibold text-slate-800">Exam & Deadline Countdown</span>
              <p className="text-[11px] text-slate-500">
                Highlight exams and submission deadlines 7 days and 48 hours in advance.
              </p>
            </div>
            <input
              type="checkbox"
              checked={examCountdown}
              onChange={(e) => setExamCountdown(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
          </label>
        </div>
      </div>

      {/* 3. Data & Storage Management */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
          <Download className="w-4 h-4 text-indigo-600" />
          <span>Data, Backup & Import Management</span>
        </h2>

        <p className="text-xs text-slate-500 leading-relaxed">
          SemesterFlow stores your entire semester configuration, timetable, study tasks, and goals locally in your browser. You can export a full JSON backup or reset anytime.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleExportData}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Plan as JSON</span>
          </button>

          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span>Reset to Semester 3 CSE Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
