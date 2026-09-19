import React, { useState, useEffect, useRef } from 'react';
import { Clock, Play, Pause, RotateCcw, Plus, Check, X, AlertCircle, ArrowUpRight } from 'lucide-react';

interface TimeTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  category: string;
  plannedMinutes: number;
  initialActualMinutes?: number;
  onSaveTime: (actualMinutes: number) => void;
  type: 'task' | 'allocation';
}

export const TimeTrackerModal: React.FC<TimeTrackerModalProps> = ({
  isOpen,
  onClose,
  title,
  category,
  plannedMinutes,
  initialActualMinutes = 0,
  onSaveTime,
  type,
}) => {
  const [loggedMinutes, setLoggedMinutes] = useState<number>(initialActualMinutes);
  const [hoursInput, setHoursInput] = useState<number>(Math.floor(initialActualMinutes / 60));
  const [minsInput, setMinsInput] = useState<number>(initialActualMinutes % 60);

  // Live Timer states
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      const init = initialActualMinutes || 0;
      setLoggedMinutes(init);
      setHoursInput(Math.floor(init / 60));
      setMinsInput(init % 60);
      setIsTimerRunning(false);
      setElapsedSeconds(0);
    }
  }, [isOpen, initialActualMinutes]);

  // Live stopwatch interval
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  if (!isOpen) return null;

  const handleApplyElapsedTimer = () => {
    const additionalMins = Math.max(1, Math.round(elapsedSeconds / 60));
    const newTotal = loggedMinutes + additionalMins;
    setLoggedMinutes(newTotal);
    setHoursInput(Math.floor(newTotal / 60));
    setMinsInput(newTotal % 60);
    setElapsedSeconds(0);
    setIsTimerRunning(false);
  };

  const handleQuickAdd = (minutes: number) => {
    const updated = Math.max(0, loggedMinutes + minutes);
    setLoggedMinutes(updated);
    setHoursInput(Math.floor(updated / 60));
    setMinsInput(updated % 60);
  };

  const handleManualHoursChange = (h: number) => {
    const validH = Math.max(0, Math.min(24, isNaN(h) ? 0 : h));
    setHoursInput(validH);
    setLoggedMinutes(validH * 60 + minsInput);
  };

  const handleManualMinsChange = (m: number) => {
    const validM = Math.max(0, Math.min(59, isNaN(m) ? 0 : m));
    setMinsInput(validM);
    setLoggedMinutes(hoursInput * 60 + validM);
  };

  const handleSetToPlanned = () => {
    setLoggedMinutes(plannedMinutes);
    setHoursInput(Math.floor(plannedMinutes / 60));
    setMinsInput(plannedMinutes % 60);
  };

  const handleResetToZero = () => {
    setLoggedMinutes(0);
    setHoursInput(0);
    setMinsInput(0);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveTime(loggedMinutes);
    onClose();
  };

  // Planned vs Logged metrics
  const plannedHours = (plannedMinutes / 60).toFixed(1);
  const loggedHours = (loggedMinutes / 60).toFixed(1);
  const diffMinutes = loggedMinutes - plannedMinutes;
  const percentage = plannedMinutes > 0 ? Math.round((loggedMinutes / plannedMinutes) * 100) : 100;

  // Format stopwatch seconds
  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div
      id="time-tracker-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Log Actual Time Spent
              </h2>
              <p className="text-xs text-slate-500">
                Record real study duration for {type === 'task' ? 'task' : 'free activity'}.
              </p>
            </div>
          </div>
          <button
            id="close-time-tracker-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-5 text-xs">
          {/* Target Activity Summary */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                {category}
              </span>
              <span className="text-xs font-semibold text-slate-600">
                Planned: <strong className="text-slate-900">{plannedHours} hrs</strong> ({plannedMinutes}m)
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{title}</h3>
          </div>

          {/* Planned vs Actual Comparison Metric */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Actual Logged Duration</span>
              <span className="text-sm font-bold text-indigo-700">
                {loggedHours} hrs ({loggedMinutes} min)
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
              <div
                className={`h-full transition-all duration-300 ${
                  percentage >= 100
                    ? 'bg-emerald-500'
                    : percentage >= 50
                    ? 'bg-indigo-600'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, percentage)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>{percentage}% of planned time</span>
              {diffMinutes > 0 ? (
                <span className="text-emerald-700 font-semibold">+{diffMinutes}m overtime</span>
              ) : diffMinutes < 0 ? (
                <span className="text-amber-700 font-semibold">{Math.abs(diffMinutes)}m remaining</span>
              ) : (
                <span className="text-slate-700 font-semibold">Exactly on target</span>
              )}
            </div>
          </div>

          {/* Quick Increment Buttons */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Quick Log Actions
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                id="quick-add-15m-btn"
                onClick={() => handleQuickAdd(15)}
                className="px-2.5 py-2 font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
              >
                +15 min
              </button>
              <button
                type="button"
                id="quick-add-30m-btn"
                onClick={() => handleQuickAdd(30)}
                className="px-2.5 py-2 font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
              >
                +30 min
              </button>
              <button
                type="button"
                id="quick-add-45m-btn"
                onClick={() => handleQuickAdd(45)}
                className="px-2.5 py-2 font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
              >
                +45 min
              </button>
              <button
                type="button"
                id="quick-add-60m-btn"
                onClick={() => handleQuickAdd(60)}
                className="px-2.5 py-2 font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
              >
                +1 hour
              </button>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                id="set-to-planned-btn"
                onClick={handleSetToPlanned}
                className="flex-1 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
              >
                Match Planned ({plannedMinutes}m)
              </button>
              <button
                type="button"
                id="reset-logged-btn"
                onClick={handleResetToZero}
                className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Reset (0m)
              </button>
            </div>
          </div>

          {/* Manual Input (Hours & Minutes) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="log-hours-input" className="block font-semibold text-slate-700 mb-1">
                Hours Spent
              </label>
              <input
                id="log-hours-input"
                type="number"
                min="0"
                max="24"
                value={hoursInput}
                onChange={(e) => handleManualHoursChange(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label htmlFor="log-mins-input" className="block font-semibold text-slate-700 mb-1">
                Minutes Spent
              </label>
              <input
                id="log-mins-input"
                type="number"
                min="0"
                max="59"
                value={minsInput}
                onChange={(e) => handleManualMinsChange(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Optional Live Session Stopwatch */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Live Session Stopwatch</span>
              </span>
              <span className="font-mono font-bold text-sm text-slate-900">
                {formatTimer(elapsedSeconds)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {!isTimerRunning ? (
                <button
                  type="button"
                  id="start-live-timer-btn"
                  onClick={() => setIsTimerRunning(true)}
                  className="flex-1 py-1.5 px-2.5 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Live Timer</span>
                </button>
              ) : (
                <button
                  type="button"
                  id="pause-live-timer-btn"
                  onClick={() => setIsTimerRunning(false)}
                  className="flex-1 py-1.5 px-2.5 font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause Timer</span>
                </button>
              )}

              {elapsedSeconds > 0 && (
                <button
                  type="button"
                  id="apply-timer-to-log-btn"
                  onClick={handleApplyElapsedTimer}
                  className="py-1.5 px-3 font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors whitespace-nowrap"
                >
                  + Add {Math.max(1, Math.round(elapsedSeconds / 60))}m to Log
                </button>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              id="time-tracker-cancel-btn"
              onClick={onClose}
              className="px-3.5 py-1.5 font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="time-tracker-save-btn"
              className="px-4 py-1.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Log ({loggedHours} hrs)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
