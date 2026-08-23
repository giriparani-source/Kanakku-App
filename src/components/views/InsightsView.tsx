import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExpenseTransaction, IncomeTransaction } from '../../types';

export const InsightsView: React.FC = () => {
  const {
    transactions,
    spendingByCategory,
    totalExpenses,
    formatMoney,
    setIsAddModalOpen,
  } = useApp();

  const [timeframe, setTimeframe] = useState<'Week' | 'Month' | 'Year'>('Month');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(5);

  const expenseTransactions = transactions.filter((t): t is ExpenseTransaction => t.type === 'expense');
  const incomeTransactions = transactions.filter((t): t is IncomeTransaction => t.type === 'income');

  if (transactions.length === 0) {
    return (
      <main className="flex-grow w-full max-w-4xl mx-auto px-4 md:px-6 py-8 flex flex-col gap-6 pb-28 md:pb-12 animate-fadeIn text-black dark:text-white">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-black dark:text-white tracking-tight">
            Visual Breakdown
          </h1>
          <p className="text-sm md:text-base font-bold text-neutral-600 dark:text-neutral-400 mt-1">
            Analyze your spending patterns with clear metrics.
          </p>
        </div>

        <div className="bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-[2rem] p-8 md:p-12 text-center shadow-sm flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-white dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56] flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-3xl text-black dark:text-white">analytics</span>
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="text-lg font-black text-black dark:text-white">No Spending Data Yet</h3>
            <p className="text-xs md:text-sm font-bold text-neutral-600 dark:text-neutral-400">
              Start logging your income & expenses to unlock real-time category distribution, doughnut charts, and monthly comparison trends.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-3 rounded-2xl bg-black dark:bg-white text-white dark:text-black text-xs md:text-sm font-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all shadow-md active:scale-98 cursor-pointer flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Record First Transaction</span>
          </button>
        </div>
      </main>
    );
  }

  // Monthly trends from actual transactions (transfers excluded from expenses)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonthIdx = new Date().getMonth();

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(currentMonthIdx - (5 - i));
    return {
      name: monthNames[d.getMonth()],
      monthNum: d.getMonth(),
      year: d.getFullYear(),
    };
  });

  const monthlyTrends = last6Months.map((m) => {
    const incInMonth = incomeTransactions
      .filter((t) => {
        const d = new Date(t.timestamp || Date.now());
        return d.getMonth() === m.monthNum && d.getFullYear() === m.year;
      })
      .reduce((s, t) => s + t.amount, 0);

    const expInMonth = expenseTransactions
      .filter((t) => {
        const d = new Date(t.timestamp || Date.now());
        return d.getMonth() === m.monthNum && d.getFullYear() === m.year;
      })
      .reduce((s, t) => s + t.amount, 0);

    const maxVal = Math.max(incInMonth, expInMonth, 1);

    return {
      month: m.name,
      income: incInMonth,
      expense: expInMonth,
      incPct: incInMonth > 0 ? Math.max(12, Math.round((incInMonth / maxVal) * 100)) : 0,
      expPct: expInMonth > 0 ? Math.max(12, Math.round((expInMonth / maxVal) * 100)) : 0,
    };
  });

  const activeMonth = monthlyTrends[selectedMonthIndex] || monthlyTrends[monthlyTrends.length - 1];

  // Pie Chart SVG Slices
  const circumference = 2 * Math.PI * 38;
  let accumulatedAngle = 0;

  return (
    <main className="flex-grow w-full max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col gap-6 md:gap-8 pb-28 md:pb-12 animate-fadeIn text-black dark:text-white">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-black dark:text-white tracking-tight">
            Visual Spending Breakdown
          </h1>
          <p className="text-sm md:text-base font-bold text-neutral-600 dark:text-neutral-400 mt-1">
            Analyze your cash flow and expense categories.
          </p>
        </div>

        {/* Time-frame selector */}
        <div className="flex bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-full p-1 self-start md:self-auto w-full md:w-auto shadow-sm">
          {(['Week', 'Month', 'Year'] as const).map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setTimeframe(period)}
              className={`flex-1 md:flex-none px-6 py-2 rounded-full text-xs md:text-sm font-black transition-all cursor-pointer ${
                timeframe === period
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow'
                  : 'text-black dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-[#1C263A]'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </section>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Spending Donut Chart */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center relative min-h-[360px]">
            <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-wider self-start absolute top-6 left-6">
              Total Expenses
            </h3>

            {/* SVG Doughnut Chart */}
            <div className="relative w-60 h-60 mt-6 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#E2E8F0"
                  className="dark:stroke-[#243048]"
                  strokeWidth="14"
                />
                {totalExpenses > 0 &&
                  spendingByCategory.map((cat, idx) => {
                    const fraction = cat.amount / totalExpenses;
                    const strokeDash = fraction * circumference;
                    const rotation = accumulatedAngle * 360;
                    accumulatedAngle += fraction;

                    return (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={cat.color}
                        strokeWidth="14"
                        strokeDasharray={`${strokeDash} ${circumference}`}
                        transform={`rotate(${rotation} 50 50)`}
                        className="transition-all duration-700 ease-out"
                      />
                    );
                  })}
              </svg>

              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                <span className="text-2xl md:text-3xl font-black text-black dark:text-white tabular-nums tracking-tight">
                  {formatMoney(totalExpenses)}
                </span>
                <span className="text-xs font-black text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Total Spent
                </span>
              </div>
            </div>

            {/* Doughnut Legend */}
            <div className="flex flex-wrap justify-center gap-3 mt-4 w-full text-xs font-bold text-black dark:text-white">
              {spendingByCategory.slice(0, 4).map((cat) => (
                <span key={cat.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.name} ({cat.percentage}%)
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Top Categories & Comparisons */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Top Spending Categories List */}
          <div className="bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl p-6 shadow-sm flex flex-col gap-2">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg md:text-xl font-black text-black dark:text-white tracking-tight">
                Top Spending Categories
              </h3>
              <span className="text-xs font-black text-neutral-500 dark:text-neutral-400">
                {spendingByCategory.length} Active Categories
              </span>
            </div>

            <div className="flex flex-col divide-y divide-neutral-200 dark:divide-[#243048]">
              {spendingByCategory.map((cat) => (
                <div key={cat.name} className="flex flex-col gap-2.5 py-3.5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm"
                        style={{ backgroundColor: cat.color }}
                      >
                        <span className="material-symbols-outlined text-xl font-black">
                          {cat.icon}
                        </span>
                      </div>
                      <span className="text-sm font-black text-black dark:text-white">
                        {cat.name}
                      </span>
                    </div>
                    <span className="text-base font-black text-black dark:text-white tabular-nums">
                      {formatMoney(cat.amount)}
                    </span>
                  </div>

                  <div className="h-2 w-full bg-neutral-200 dark:bg-[#1C263A] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Comparison Chart Area */}
          <div className="bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-lg md:text-xl font-black text-black dark:text-white tracking-tight">
                Monthly Inflow vs Outflow
              </h3>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#00C853]" />
                  <span className="text-xs text-black dark:text-white font-black">Income</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#FF2D55]" />
                  <span className="text-xs text-black dark:text-white font-black">Expenses</span>
                </div>
              </div>
            </div>

            {/* Selected Month Details */}
            <div className="bg-white dark:bg-[#1C263A] rounded-2xl p-3 flex justify-between items-center text-xs border border-neutral-200 dark:border-[#2E3C56] shadow-sm">
              <span className="font-black text-black dark:text-white">
                {activeMonth.month} Overview:
              </span>
              <div className="flex gap-4">
                <span className="text-[#00C853] font-black">
                  Income: {formatMoney(activeMonth.income)}
                </span>
                <span className="text-[#FF2D55] font-black">
                  Expenses: {formatMoney(activeMonth.expense)}
                </span>
              </div>
            </div>

            {/* Chart Area */}
            <div className="w-full relative flex items-end justify-between pt-6 pb-2 h-44">
              <div className="absolute inset-0 flex flex-col justify-between pt-6 pb-8 pointer-events-none">
                <div className="border-b border-neutral-200 dark:border-[#243048] w-full" />
                <div className="border-b border-neutral-200 dark:border-[#243048] w-full" />
                <div className="border-b border-neutral-200 dark:border-[#243048] w-full" />
              </div>

              {monthlyTrends.map((trend, idx) => {
                const isSelected = idx === selectedMonthIndex;
                return (
                  <button
                    key={trend.month}
                    type="button"
                    onClick={() => setSelectedMonthIndex(idx)}
                    className="relative z-10 flex flex-col items-center gap-2 w-1/6 group cursor-pointer"
                  >
                    <div className="flex gap-1.5 items-end h-28">
                      <div
                        className={`w-3 md:w-4 rounded-t-md transition-all duration-300 ${
                          isSelected ? 'bg-[#00C853] shadow-md shadow-green-500/30' : 'bg-[#00C853]/60 group-hover:bg-[#00C853]'
                        }`}
                        style={{ height: `${trend.incPct}%` }}
                        title={`${trend.month} Income: ${formatMoney(trend.income)}`}
                      />
                      <div
                        className={`w-3 md:w-4 rounded-t-md transition-all duration-300 ${
                          isSelected ? 'bg-[#FF2D55] shadow-md shadow-rose-500/30' : 'bg-[#FF2D55]/60 group-hover:bg-[#FF2D55]'
                        }`}
                        style={{ height: `${trend.expPct}%` }}
                        title={`${trend.month} Expense: ${formatMoney(trend.expense)}`}
                      />
                    </div>
                    <span
                      className={`text-xs transition-colors ${
                        isSelected ? 'font-black text-black dark:text-white' : 'font-bold text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      {trend.month}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
