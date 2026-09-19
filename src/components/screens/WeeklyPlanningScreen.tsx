import React, { useState } from 'react';
import { useSemester } from '../../context/SemesterContext';
import { WeeklyTarget } from '../../types';
import {
  ListTodo,
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  Target,
  X,
} from 'lucide-react';

export const WeeklyPlanningScreen: React.FC = () => {
  const {
    weeklyTargets,
    addWeeklyTarget,
    updateWeeklyTarget,
    deleteWeeklyTarget,
    toggleSubtask,
    addSubtask,
    deleteSubtask,
    goals,
    getWeeklyStats,
    openModal,
    setActiveScreen,
  } = useSemester();

  const [isAddTargetModalOpen, setIsAddTargetModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<WeeklyTarget | null>(null);

  // Subtask adding inline per target
  const [activeSubtaskInput, setActiveSubtaskInput] = useState<{ [key: string]: string }>({});

  // Target Form
  const [title, setTitle] = useState('');
  const [targetHours, setTargetHours] = useState(4);
  const [goalId, setGoalId] = useState('');

  const stats = getWeeklyStats();

  const handleOpenAdd = () => {
    setEditingTarget(null);
    setTitle('');
    setTargetHours(4);
    setGoalId(goals[0]?.id || '');
    setIsAddTargetModalOpen(true);
  };

  const handleOpenEdit = (t: WeeklyTarget) => {
    setEditingTarget(t);
    setTitle(t.title);
    setTargetHours(t.targetHours);
    setGoalId(t.goalId || '');
    setIsAddTargetModalOpen(true);
  };

  const handleSaveTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingTarget) {
      updateWeeklyTarget({
        ...editingTarget,
        title: title.trim(),
        targetHours: Number(targetHours) || 3,
        goalId: goalId || undefined,
      });
    } else {
      addWeeklyTarget({
        title: title.trim(),
        targetHours: Number(targetHours) || 3,
        completedHours: 0,
        weekStartDate: '2026-09-14',
        goalId: goalId || undefined,
        subtasks: [],
      });
    }
    setIsAddTargetModalOpen(false);
  };

  const handleAddInlineSubtask = (targetId: string) => {
    const text = activeSubtaskInput[targetId]?.trim();
    if (!text) return;
    addSubtask(targetId, text);
    setActiveSubtaskInput({ ...activeSubtaskInput, [targetId]: '' });
  };

  return (
    <div id="screen-weekly-plan" className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <span>Current Week</span>
            <span>•</span>
            <span>Sep 14 – Sep 20, 2026</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Weekly Planning
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Commit to realistic weekly study targets and break them down into actionable milestones.
          </p>
        </div>

        <button
          id="add-weekly-target-btn"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Weekly Target</span>
        </button>
      </div>

      {/* Week Overview Bandwidth Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Available Study Hours</div>
          <div className="text-2xl font-bold text-slate-900 mt-0.5">
            {stats.availableWeeklyStudyHours} hrs
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Free from classes and routine blocks</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Committed Targets</div>
          <div className="text-2xl font-bold text-indigo-600 mt-0.5">
            {stats.totalWeeklyTargetHours} hrs
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Across {weeklyTargets.length} key subject targets
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Completed This Week</div>
          <div className="text-2xl font-bold text-emerald-600 mt-0.5">
            {stats.completedTargetHours} / {stats.totalWeeklyTargetHours} hrs
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all"
              style={{
                width: `${Math.min(
                  100,
                  (stats.completedTargetHours / (stats.totalWeeklyTargetHours || 1)) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Weekly Targets List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Active Targets for Week 5
          </h2>
          <span className="text-xs text-slate-500">
            {weeklyTargets.length} targets defined
          </span>
        </div>

        {weeklyTargets.map((target) => {
          const linkedGoal = goals.find((g) => g.id === target.goalId);
          const percent = Math.round((target.completedHours / target.targetHours) * 100);
          const doneSubtasks = target.subtasks.filter((s) => s.completed).length;

          return (
            <div
              key={target.id}
              id={`weekly-target-${target.id}`}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
            >
              {/* Target Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-base font-bold text-slate-900">
                      {target.title}
                    </h3>
                    {linkedGoal && (
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                        Goal: {linkedGoal.title}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      {target.completedHours}h completed of {target.targetHours}h target
                    </span>
                    <span>•</span>
                    <span>
                      {doneSubtasks} / {target.subtasks.length} subtasks done ({percent}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => handleOpenEdit(target)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
                    aria-label="Edit target"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Remove target "${target.title}"?`)) {
                        deleteWeeklyTarget(target.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md"
                    aria-label="Delete target"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, percent)}%` }}
                />
              </div>

              {/* Subtasks (Manual breakdown) */}
              <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Manual Breakdown Tasks:</span>
                  <button
                    onClick={() =>
                      openModal('task', 'create', {
                        title: target.title,
                        goalId: target.goalId,
                      })
                    }
                    className="text-indigo-600 hover:text-indigo-800 text-[11px] font-semibold"
                  >
                    + Schedule directly in Today
                  </button>
                </div>

                {target.subtasks.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    No breakdown subtasks added yet. Break this target into 2-4 bite-sized actions below.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {target.subtasks.map((st) => (
                      <div
                        key={st.id}
                        className="flex items-center justify-between gap-2 text-xs bg-white p-2 rounded-md border border-slate-200"
                      >
                        <button
                          onClick={() => toggleSubtask(target.id, st.id)}
                          className="flex items-center gap-2 text-left flex-1 min-w-0"
                        >
                          {st.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <span
                            className={
                              st.completed
                                ? 'line-through text-slate-400'
                                : 'text-slate-800 font-medium'
                            }
                          >
                            {st.title}
                          </span>
                        </button>

                        <button
                          onClick={() => deleteSubtask(target.id, st.id)}
                          className="p-1 text-slate-300 hover:text-rose-600 rounded"
                          aria-label="Delete subtask"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline Add Subtask Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={activeSubtaskInput[target.id] || ''}
                    onChange={(e) =>
                      setActiveSubtaskInput({
                        ...activeSubtaskInput,
                        [target.id]: e.target.value,
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddInlineSubtask(target.id);
                      }
                    }}
                    placeholder="Add breakdown task (e.g. Solve 5 problems, read chapter 3)..."
                    className="flex-1 px-3 py-1.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => handleAddInlineSubtask(target.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 rounded-md"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Weekly Target Modal */}
      {isAddTargetModalOpen && (
        <div
          id="weekly-target-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddTargetModalOpen(false);
          }}
        >
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                {editingTarget ? 'Edit Weekly Target' : 'Add Weekly Target'}
              </h2>
              <button
                onClick={() => setIsAddTargetModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTarget} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Target Description
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Finish COA Module 2 (Cache Memory)"
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Hours Planned
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={40}
                    value={targetHours}
                    onChange={(e) => setTargetHours(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Linked Goal (Optional)
                  </label>
                  <select
                    value={goalId}
                    onChange={(e) => setGoalId(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">No goal linked</option>
                    {goals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddTargetModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Save Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
