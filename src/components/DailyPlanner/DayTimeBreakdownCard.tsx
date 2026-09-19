import React from 'react';
import { DailyTask, FreeTimeAllocation } from '../../types';
import { Clock, PieChart, Sparkles, Plus, CheckCircle2, ArrowUpRight } from 'lucide-react';

interface DayTimeBreakdownCardProps {
  availableFreeHours: number;
  tasks: DailyTask[];
  allocations: FreeTimeAllocation[];
  onOpenAddAllocation: () => void;
  dayName: string;
  dateFormatted: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  GATE: '#4f46e5', // indigo
  Placement: '#0891b2', // cyan
  DSA: '#2563eb', // blue
  COA: '#7c3aed', // purple
  OS: '#d97706', // amber
  ML: '#ec4899', // pink
  Project: '#059669', // emerald
  'Core Studies': '#9333ea', // purple
  'Skill Learning': '#f59e0b', // amber
  Personal: '#64748b', // slate
  Other: '#475569',
};

export const DayTimeBreakdownCard: React.FC<DayTimeBreakdownCardProps> = ({
  availableFreeHours,
  tasks,
  allocations,
  onOpenAddAllocation,
  dayName,
  dateFormatted,
}) => {
  // Aggregate logged minutes by category & item
  const categoryMap: Record<
    string,
    { category: string; label: string; plannedMinutes: number; actualMinutes: number; color: string; itemsCount: number }
  > = {};

  // 1. Process free-time allocations
  allocations.forEach((alloc) => {
    const cat = alloc.activityCategory || 'Other';
    const actual = alloc.actualMinutes !== undefined ? alloc.actualMinutes : (alloc.completed ? alloc.plannedMinutes : 0);
    const color = alloc.color || CATEGORY_COLORS[cat] || '#4f46e5';

    if (!categoryMap[cat]) {
      categoryMap[cat] = {
        category: cat,
        label: alloc.title.split('(')[0].trim() || cat,
        plannedMinutes: 0,
        actualMinutes: 0,
        color,
        itemsCount: 0,
      };
    }
    categoryMap[cat].plannedMinutes += alloc.plannedMinutes || 0;
    categoryMap[cat].actualMinutes += actual;
    categoryMap[cat].itemsCount += 1;
  });

  // 2. Process tasks
  tasks.forEach((task) => {
    const cat = task.category || 'Other';
    const actual = task.actualMinutes !== undefined ? task.actualMinutes : (task.completed ? task.durationMinutes : 0);
    const color = CATEGORY_COLORS[cat] || '#2563eb';

    if (!categoryMap[cat]) {
      categoryMap[cat] = {
        category: cat,
        label: cat,
        plannedMinutes: 0,
        actualMinutes: 0,
        color,
        itemsCount: 0,
      };
    }
    categoryMap[cat].plannedMinutes += task.durationMinutes || 0;
    categoryMap[cat].actualMinutes += actual;
    categoryMap[cat].itemsCount += 1;
  });

  const categories = Object.values(categoryMap).sort((a, b) => b.actualMinutes - a.actualMinutes);

  const totalLoggedMinutes = categories.reduce((sum, c) => sum + c.actualMinutes, 0);
  const totalPlannedMinutes = categories.reduce((sum, c) => sum + c.plannedMinutes, 0);

  const totalLoggedHours = Number((totalLoggedMinutes / 60).toFixed(1));
  const totalPlannedHours = Number((totalPlannedMinutes / 60).toFixed(1));
  const availableFreeMinutes = Math.round(availableFreeHours * 60);

  const remainingFreeMinutes = Math.max(0, availableFreeMinutes - totalLoggedMinutes);
  const remainingFreeHours = Number((remainingFreeMinutes / 60).toFixed(1));

  const utilizationRate = availableFreeHours > 0 ? Math.min(100, Math.round((totalLoggedHours / availableFreeHours) * 100)) : 0;

  return (
    <div
      id="end-of-day-time-summary-card"
      className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/60">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
          <h2 className="text-sm font-semibold text-slate-900">
            End-of-Day Time Breakdown Summary
          </h2>
          <span className="text-xs text-slate-500 font-medium">({dayName})</span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="font-semibold text-slate-700">
            Total Free Time: <strong className="text-indigo-700">{availableFreeHours} hrs</strong>
          </span>
          <span className="text-slate-300">|</span>
          <span className="font-semibold text-slate-700">
            Logged: <strong className="text-emerald-700">{totalLoggedHours} hrs</strong>
          </span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Core Summary Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[11px] font-medium text-slate-500">Calculated Free Time</div>
            <div className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              {availableFreeHours} hrs
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">open study window</div>
          </div>

          <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
            <div className="text-[11px] font-medium text-indigo-700">Pre-assigned / Planned</div>
            <div className="text-base sm:text-lg font-bold text-indigo-900 mt-0.5">
              {totalPlannedHours} hrs
            </div>
            <div className="text-[10px] text-indigo-600 mt-0.5">{categories.length} focus areas</div>
          </div>

          <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
            <div className="text-[11px] font-medium text-emerald-700">Actually Logged</div>
            <div className="text-base sm:text-lg font-bold text-emerald-900 mt-0.5">
              {totalLoggedHours} hrs
            </div>
            <div className="text-[10px] text-emerald-600 mt-0.5">tracked & completed</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[11px] font-medium text-slate-500">Unlogged / Rest</div>
            <div className="text-base sm:text-lg font-bold text-slate-700 mt-0.5">
              {remainingFreeHours} hrs
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{utilizationRate}% utilized</div>
          </div>
        </div>

        {/* Proportional Segmented Progress Bar */}
        {totalLoggedMinutes > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-indigo-600" />
                <span>Time Distribution by Activity</span>
              </span>
              <span className="text-[11px] text-slate-500">
                {totalLoggedHours} of {availableFreeHours} hrs allocated ({utilizationRate}%)
              </span>
            </div>

            {/* Segmented bar */}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              {categories.map((cat) => {
                if (cat.actualMinutes === 0) return null;
                const pct = (cat.actualMinutes / totalLoggedMinutes) * 100;
                return (
                  <div
                    key={cat.category}
                    style={{
                      width: `${pct}%`,
                      backgroundColor: cat.color,
                    }}
                    className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                    title={`${cat.label}: ${(cat.actualMinutes / 60).toFixed(1)} hrs (${Math.round(pct)}%)`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Activity Breakdown List */}
        {categories.length === 0 ? (
          <div className="p-4 text-center text-slate-500 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <p className="font-medium text-slate-700">No time logged yet for {dateFormatted}.</p>
            <p className="text-slate-400 mt-0.5">
              Pre-assign an activity block or log time on your study tasks above to see your day's breakdown.
            </p>
            <button
              onClick={onOpenAddAllocation}
              className="mt-3 px-3.5 py-1.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Pre-assign Activity Block</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {categories.map((cat) => {
                const loggedH = (cat.actualMinutes / 60).toFixed(1);
                const plannedH = (cat.plannedMinutes / 60).toFixed(1);
                const sharePct =
                  totalLoggedMinutes > 0
                    ? Math.round((cat.actualMinutes / totalLoggedMinutes) * 100)
                    : 0;

                return (
                  <div
                    key={cat.category}
                    className="p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 text-xs truncate">
                          {cat.label}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Planned: {plannedH} hrs • {cat.itemsCount} {cat.itemsCount === 1 ? 'item' : 'items'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-slate-900">
                        {loggedH} hrs
                      </div>
                      <div className="text-[10px] font-semibold text-indigo-600">
                        {sharePct}% of day
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick action button to pre-assign additional block */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                💡 Logged times automatically sync with your weekly goals and targets.
              </span>
              <button
                id="breakdown-add-allocation-btn"
                onClick={onOpenAddAllocation}
                className="px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Free-Time Block</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
