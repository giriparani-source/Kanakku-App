import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExpenseTransaction } from '../../types';

export const BudgetView: React.FC = () => {
  const {
    budgets,
    updateBudget,
    transactions,
    formatMoney,
    totalReceived,
    needAmount,
    wantAmount,
    totalSavings,
  } = useApp();

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newLimitStr, setNewLimitStr] = useState<string>('');

  const totalPlannedBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const baseIncome = totalReceived > 0 ? totalReceived : totalPlannedBudget > 0 ? totalPlannedBudget : 50000;
  const targetNeeds = baseIncome * 0.5;
  const targetWants = baseIncome * 0.3;
  const targetSavings = baseIncome * 0.2;

  // Group current expense by category
  const expenseByCategory: Record<string, number> = {};
  transactions
    .filter((t): t is ExpenseTransaction => t.type === 'expense')
    .forEach((t) => {
      const c = t.category || 'Other Expenses';
      expenseByCategory[c] = (expenseByCategory[c] || 0) + t.amount;
    });

  const handleEditBudget = (cat: string, currentLimit: number) => {
    setEditingCategory(cat);
    setNewLimitStr(currentLimit.toString());
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    const parsed = parseFloat(newLimitStr);
    if (!isNaN(parsed) && parsed > 0) {
      updateBudget(editingCategory, parsed);
    }
    setEditingCategory(null);
  };

  return (
    <main className="max-w-3xl mx-auto px-4 md:px-0 py-6 space-y-6 pb-28 md:pb-12 animate-fadeIn text-black dark:text-white">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-black dark:text-white tracking-tight">
          Budget Envelopes & 50/30/20 Rule
        </h1>
        <p className="text-xs md:text-sm font-bold text-neutral-600 dark:text-neutral-400 mt-1">
          Plan limits and balance your psychological spending allocation.
        </p>
      </div>

      {/* 50/30/20 Framework Card */}
      <section className="bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
            50 / 30 / 20 Framework Allocation
          </h2>
          <span className="text-xs font-black text-black dark:text-white">Base: {formatMoney(baseIncome)}</span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          {/* Needs */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C263A] border-2 border-[#0052FF]/30 dark:border-[#0052FF]/50 shadow-sm">
            <span className="text-[11px] font-black uppercase text-[#0052FF] dark:text-[#60A5FA] block mb-1">
              Needs (50%)
            </span>
            <span className="text-sm md:text-base font-black text-black dark:text-white block tabular-nums">
              {formatMoney(needAmount)}
            </span>
            <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 block mt-0.5">
              Goal: {formatMoney(targetNeeds)}
            </span>
          </div>

          {/* Wants */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C263A] border-2 border-[#00C853]/30 dark:border-[#00C853]/50 shadow-sm">
            <span className="text-[11px] font-black uppercase text-[#00C853] dark:text-[#4ADE80] block mb-1">
              Wants (30%)
            </span>
            <span className="text-sm md:text-base font-black text-black dark:text-white block tabular-nums">
              {formatMoney(wantAmount)}
            </span>
            <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 block mt-0.5">
              Goal: {formatMoney(targetWants)}
            </span>
          </div>

          {/* Savings */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C263A] border-2 border-[#FF9500]/30 dark:border-[#FF9500]/50 shadow-sm">
            <span className="text-[11px] font-black uppercase text-[#FF9500] block mb-1">
              Savings (20%)
            </span>
            <span className="text-sm md:text-base font-black text-black dark:text-white block tabular-nums">
              {formatMoney(totalSavings)}
            </span>
            <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 block mt-0.5">
              Goal: {formatMoney(targetSavings)}
            </span>
          </div>
        </div>
      </section>

      {/* Category Envelopes */}
      <section className="bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
          Category Envelopes ({budgets.length})
        </h2>

        <div className="space-y-4 divide-y divide-neutral-200 dark:divide-[#243048]">
          {budgets.map((b) => {
            const spent = expenseByCategory[b.category] || 0;
            const percentage = Math.min(Math.round((spent / b.limit) * 100), 100);
            const isExceeded = spent > b.limit;
            const isNearLimit = percentage >= 80 && !isExceeded;

            return (
              <div key={b.category} className="pt-3.5 first:pt-0">
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-black dark:text-white">
                      {b.category}
                    </span>
                    {isExceeded ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FF2D55] text-white">
                        Exceeded by {formatMoney(spent - b.limit)}
                      </span>
                    ) : isNearLimit ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FF9500] text-white">
                        {percentage}% Spent
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-black dark:text-white tabular-nums">
                      {formatMoney(spent)} / {formatMoney(b.limit)}
                    </span>
                    <button
                      onClick={() => handleEditBudget(b.category, b.limit)}
                      className="p-1 text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
                      title="Edit Limit"
                    >
                      <span className="material-symbols-outlined text-sm font-black">edit</span>
                    </button>
                  </div>
                </div>

                <div className="h-2.5 w-full bg-neutral-200 dark:bg-[#1C263A] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isExceeded
                        ? 'bg-[#FF2D55]'
                        : isNearLimit
                        ? 'bg-[#FF9500]'
                        : 'bg-[#0052FF]'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Edit Budget Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-[#141B2A] rounded-3xl p-6 shadow-2xl space-y-4 border border-neutral-200 dark:border-[#243048] animate-slideUp text-black dark:text-white">
            <h3 className="text-lg font-black text-black dark:text-white">
              Set {editingCategory} Limit
            </h3>
            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-black dark:text-neutral-300 mb-1">
                  Monthly Limit
                </label>
                <input
                  type="number"
                  step="100"
                  min="10"
                  required
                  autoFocus
                  placeholder="0"
                  value={newLimitStr}
                  onChange={(e) => setNewLimitStr(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white font-black text-sm outline-none border border-neutral-200 dark:border-[#2E3C56] focus:border-black dark:focus:border-white tabular-nums"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-black bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-sm font-black bg-black dark:bg-white text-white dark:text-black hover:opacity-90 cursor-pointer"
                >
                  Save Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};
