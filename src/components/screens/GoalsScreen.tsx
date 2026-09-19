import React, { useState } from 'react';
import { useSemester } from '../../context/SemesterContext';
import { Goal } from '../../types';
import {
  Target,
  Plus,
  Calendar,
  Clock,
  Trash2,
  Edit2,
  Award,
  ChevronRight,
  Lightbulb,
  X,
} from 'lucide-react';

export const GoalsScreen: React.FC = () => {
  const { goals, addGoal, updateGoal, deleteGoal, setActiveScreen } = useSemester();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('2028-02-05');
  const [weeklyTargetHours, setWeeklyTargetHours] = useState(8);
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('GATE');

  const goalTemplates = [
    {
      title: 'GATE 2028 (Computer Science)',
      targetDate: '2028-02-05',
      weeklyTargetHours: 10,
      priority: 'High' as const,
      category: 'GATE',
      description: 'Systematic mastery of Engineering Mathematics, Discrete Math, Algorithms, and Core CS.',
    },
    {
      title: 'Tier-1 Campus Placements (SDE)',
      targetDate: '2027-08-15',
      weeklyTargetHours: 8,
      priority: 'High' as const,
      category: 'Placement',
      description: 'Daily LeetCode medium problem solving, DSA sheets, OOPs fundamentals, and mock interviews.',
    },
    {
      title: 'Build Full-Stack Distributed Systems Project',
      targetDate: '2026-12-20',
      weeklyTargetHours: 5,
      priority: 'Medium' as const,
      category: 'Project',
      description: 'Architect and deploy a real-world scalable system applying Operating Systems & Networking.',
    },
    {
      title: 'Learn Modern Python & Async Concurrency',
      targetDate: '2026-11-30',
      weeklyTargetHours: 4,
      priority: 'Medium' as const,
      category: 'Personal',
      description: 'FastAPI, asyncio, pytest, and backend architectural design patterns.',
    },
    {
      title: 'Higher Studies (GRE / MS in CS / Research)',
      targetDate: '2027-10-01',
      weeklyTargetHours: 6,
      priority: 'Medium' as const,
      category: 'Personal',
      description: 'GRE quantitative vocabulary prep, research paper reviews, and professor collaborations.',
    },
  ];

  const handleOpenAdd = () => {
    setEditingGoal(null);
    setTitle('');
    setTargetDate('2027-08-15');
    setWeeklyTargetHours(8);
    setPriority('High');
    setDescription('');
    setCategory('Placement');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (g: Goal) => {
    setEditingGoal(g);
    setTitle(g.title);
    setTargetDate(g.targetDate);
    setWeeklyTargetHours(g.weeklyTargetHours);
    setPriority(g.priority);
    setDescription(g.description);
    setCategory(g.category);
    setIsModalOpen(true);
  };

  const handleApplyTemplate = (tmpl: typeof goalTemplates[0]) => {
    setTitle(tmpl.title);
    setTargetDate(tmpl.targetDate);
    setWeeklyTargetHours(tmpl.weeklyTargetHours);
    setPriority(tmpl.priority);
    setDescription(tmpl.description);
    setCategory(tmpl.category);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingGoal) {
      updateGoal({
        id: editingGoal.id,
        title: title.trim(),
        targetDate,
        weeklyTargetHours: Number(weeklyTargetHours) || 5,
        priority,
        description: description.trim(),
        category,
      });
    } else {
      addGoal({
        title: title.trim(),
        targetDate,
        weeklyTargetHours: Number(weeklyTargetHours) || 5,
        priority,
        description: description.trim(),
        category,
      });
    }
    setIsModalOpen(false);
  };

  const totalCommittedHours = goals.reduce((sum, g) => sum + g.weeklyTargetHours, 0);

  return (
    <div id="screen-goals" className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            What are you working toward?
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Engineering goals you are pursuing alongside college academics (GATE, Placements, Coding, Projects).
          </p>
        </div>

        <button
          id="add-goal-main-btn"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Goal</span>
        </button>
      </div>

      {/* Summary Bandwidth Card */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Goal Commitment Summary
            </div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {goals.length} Active Goals • {totalCommittedHours} Hours / Week Targeted
            </div>
          </div>
        </div>

        <button
          onClick={() => setActiveScreen('weekly-plan')}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 self-start sm:self-auto"
        >
          <span>Plan this week's targets</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((g) => {
          const priorityStyles =
            g.priority === 'High'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : g.priority === 'Medium'
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-slate-100 text-slate-700 border-slate-200';

          return (
            <div
              key={g.id}
              id={`goal-card-${g.id}`}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${priorityStyles}`}
                  >
                    {g.priority} Priority
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(g)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded"
                      aria-label="Edit goal"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete goal "${g.title}"?`)) {
                          deleteGoal(g.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      aria-label="Delete goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h2 className="text-base font-bold text-slate-900">{g.title}</h2>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {g.description || 'Continuous self-directed study and milestone completion.'}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{g.weeklyTargetHours} hrs / week</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Target: {g.targetDate}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggested Goal Templates */}
      <div className="bg-slate-50/70 p-5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Common Engineering Aspirations (Quick Fill)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {goalTemplates.map((tmpl, idx) => (
            <button
              key={idx}
              id={`tmpl-goal-${idx}`}
              onClick={() => handleApplyTemplate(tmpl)}
              className="p-3 text-left bg-white hover:bg-indigo-50/50 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors group"
            >
              <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-900">
                {tmpl.title}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                <span>{tmpl.weeklyTargetHours}h / week</span>
                <span className="text-indigo-600 font-semibold group-hover:underline">
                  + Use Template
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Add / Edit Goal Modal */}
      {isModalOpen && (
        <div
          id="goal-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                {editingGoal ? 'Edit Goal' : 'Add New Engineering Goal'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Goal Name
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. GATE 2028 or Software Engineering Placements"
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Weekly Hours Target
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={weeklyTargetHours}
                    onChange={(e) => setWeeklyTargetHours(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as 'High' | 'Medium' | 'Low')}
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Category Tag
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. GATE, Placement, Project"
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Short Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key focus areas, syllabus scope, or resources..."
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
