/**
 * ProChartsSection.tsx
 * Reusable Pro Analytics Charts for the Kanakku Dashboard & Insights screens.
 *
 * Renders two fully SVG-native, zero-dependency charts:
 *   1. Monthly Spending Trend — Line Chart (last 6 months, Income vs Expenses)
 *   2. Income vs Expense Comparison — Bar Chart (last 6 months, click to inspect)
 *
 * Data is strictly derived from the `transactions` prop (Firebase UID-isolated,
 * passed from AppContext). No hardcoded or dummy data is used.
 */

import React, { useState } from 'react';
import { Transaction, IncomeTransaction, ExpenseTransaction } from '../../../types';

interface ProChartsSectionProps {
  transactions: Transaction[];
  formatMoney: (amount: number) => string;
}

export const ProChartsSection: React.FC<ProChartsSectionProps> = ({
  transactions,
  formatMoney,
}) => {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(5); // Default: most recent month

  // ── Build last-6-months metadata ──────────────────────────────────────────
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonthIdx = new Date().getMonth();

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(currentMonthIdx - (5 - i));
    return { name: MONTH_NAMES[d.getMonth()], monthNum: d.getMonth(), year: d.getFullYear() };
  });

  const incomeTransactions = transactions.filter((t): t is IncomeTransaction => t.type === 'income');
  const expenseTransactions = transactions.filter((t): t is ExpenseTransaction => t.type === 'expense');

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
      incPct: incInMonth > 0 ? Math.max(8, Math.round((incInMonth / maxVal) * 100)) : 0,
      expPct: expInMonth > 0 ? Math.max(8, Math.round((expInMonth / maxVal) * 100)) : 0,
    };
  });

  const activeMonth = monthlyTrends[selectedMonthIndex] ?? monthlyTrends[monthlyTrends.length - 1];

  // ── SVG Line Chart geometry ────────────────────────────────────────────────
  const LINE_W = 340;
  const LINE_H = 90;
  const overallMax = Math.max(
    ...monthlyTrends.map((m) => m.expense),
    ...monthlyTrends.map((m) => m.income),
    1
  );

  const toPoint = (value: number, idx: number) => ({
    x: (idx / (monthlyTrends.length - 1)) * LINE_W,
    y: LINE_H - (value / overallMax) * LINE_H,
  });

  const expensePoints = monthlyTrends.map((m, i) => toPoint(m.expense, i));
  const incomePoints = monthlyTrends.map((m, i) => toPoint(m.income, i));

  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  const toArea = (pts: { x: number; y: number }[]) =>
    `${toPath(pts)} L${pts[pts.length - 1].x.toFixed(1)},${LINE_H} L0,${LINE_H} Z`;

  // ── 6-month summary stats ──────────────────────────────────────────────────
  const totalInc6 = monthlyTrends.reduce((s, m) => s + m.income, 0);
  const totalExp6 = monthlyTrends.reduce((s, m) => s + m.expense, 0);
  const savingsRate = totalInc6 > 0 ? Math.round(((totalInc6 - totalExp6) / totalInc6) * 100) : 0;
  const avgMonthlyExp = totalExp6 / 6;
  const peakExp = Math.max(...monthlyTrends.map((m) => m.expense));
  const peakInc = Math.max(...monthlyTrends.map((m) => m.income));

  // Guard: hide charts if no transactions at all
  const hasData = transactions.length > 0 && (totalInc6 > 0 || totalExp6 > 0);

  if (!hasData) {
    return (
      <section className="bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl p-6 shadow-sm text-center space-y-3">
        <span className="material-symbols-outlined text-4xl text-neutral-400 dark:text-neutral-600 block">
          show_chart
        </span>
        <p className="text-sm font-black text-black dark:text-white">
          Pro Analytics Unavailable
        </p>
        <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
          Log at least one income or expense to unlock the Monthly Spending Trend and Income vs Expense charts.
        </p>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* ── Chart 1: Monthly Spending Trend — SVG Line Chart ─────────────── */}
      <div className="bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-black dark:text-white tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[#00C853]">show_chart</span>
              Monthly Spending Trend
            </h3>
            <p className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mt-0.5">
              Last 6 months — Income vs Expenses
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-[11px] font-black text-neutral-600 dark:text-neutral-300">
              <span className="w-4 h-0.5 bg-[#00C853] rounded-full inline-block" />Income
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-black text-neutral-600 dark:text-neutral-300">
              <span className="w-4 h-0.5 bg-[#FF2D55] rounded-full inline-block" />Expense
            </span>
          </div>
        </div>

        <div className="w-full overflow-hidden">
          <svg
            viewBox={`-4 -8 ${LINE_W + 8} ${LINE_H + 28}`}
            className="w-full"
            preserveAspectRatio="none"
            style={{ height: '140px' }}
          >
            <defs>
              <linearGradient id="dashExpGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF2D55" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#FF2D55" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="dashIncGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00C853" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#00C853" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Subtle grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
              <line
                key={i}
                x1="0" y1={f * LINE_H}
                x2={LINE_W} y2={f * LINE_H}
                stroke="currentColor" strokeOpacity="0.07" strokeWidth="0.6"
                className="text-black dark:text-white"
              />
            ))}

            {/* Area fills */}
            <path d={toArea(expensePoints)} fill="url(#dashExpGrad)" />
            <path d={toArea(incomePoints)} fill="url(#dashIncGrad)" />

            {/* Lines */}
            <path d={toPath(expensePoints)} fill="none" stroke="#FF2D55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d={toPath(incomePoints)} fill="none" stroke="#00C853" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

            {/* Data points */}
            {expensePoints.map((p, i) => (
              <circle key={`dashep${i}`} cx={p.x} cy={p.y} r="3" fill="#FF2D55" stroke="white" strokeWidth="1.2" />
            ))}
            {incomePoints.map((p, i) => (
              <circle key={`daship${i}`} cx={p.x} cy={p.y} r="3" fill="#00C853" stroke="white" strokeWidth="1.2" />
            ))}

            {/* Month labels */}
            {monthlyTrends.map((m, i) => (
              <text
                key={m.month}
                x={(i / (monthlyTrends.length - 1)) * LINE_W}
                y={LINE_H + 14}
                textAnchor="middle"
                fontSize="7"
                fontWeight="700"
                fill="currentColor"
                fillOpacity="0.55"
                className="text-black dark:text-white"
              >
                {m.month}
              </text>
            ))}
          </svg>
        </div>

        {/* Quick stat pills */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Peak Expense', value: formatMoney(peakExp), color: 'text-rose-500' },
            { label: 'Peak Income', value: formatMoney(peakInc), color: 'text-emerald-500' },
            { label: 'Avg/Month', value: formatMoney(avgMonthlyExp), color: 'text-blue-500' },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56] rounded-2xl p-3 text-center">
              <p className={`text-xs font-black tabular-nums ${s.color}`}>{s.value}</p>
              <p className="text-[10px] font-bold text-neutral-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Chart 2: Income vs Expense — Interactive Bar Chart ───────────── */}
      <div className="bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-black text-black dark:text-white tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[#0066FF]">bar_chart</span>
              Income vs Expense
            </h3>
            <p className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
              Month-by-month — click a bar to inspect
            </p>
          </div>
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

        {/* Selected month details panel */}
        <div className="bg-white dark:bg-[#1C263A] rounded-2xl p-3 flex flex-wrap justify-between items-center text-xs border border-neutral-200 dark:border-[#2E3C56] shadow-sm gap-2">
          <span className="font-black text-black dark:text-white">{activeMonth.month} Overview:</span>
          <div className="flex flex-wrap gap-3">
            <span className="text-[#00C853] font-black">In: {formatMoney(activeMonth.income)}</span>
            <span className="text-[#FF2D55] font-black">Out: {formatMoney(activeMonth.expense)}</span>
            <span className={`font-black ${activeMonth.income >= activeMonth.expense ? 'text-blue-500' : 'text-amber-500'}`}>
              Net: {formatMoney(activeMonth.income - activeMonth.expense)}
            </span>
          </div>
        </div>

        {/* Bar chart area */}
        <div className="w-full relative flex items-end justify-between pt-6 pb-2 h-40">
          {/* Horizontal grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pt-6 pb-8 pointer-events-none">
            <div className="border-b border-neutral-200 dark:border-[#243048] w-full" />
            <div className="border-b border-neutral-200 dark:border-[#243048] w-full" />
            <div className="border-b border-neutral-200 dark:border-[#243048] w-full" />
          </div>

          {monthlyTrends.map((trend, idx) => {
            const isSelected = idx === selectedMonthIndex;
            const netPositive = trend.income >= trend.expense;
            return (
              <button
                key={trend.month}
                type="button"
                onClick={() => setSelectedMonthIndex(idx)}
                title={`${trend.month}: Income ${formatMoney(trend.income)}, Expense ${formatMoney(trend.expense)}`}
                className="relative z-10 flex flex-col items-center gap-1.5 w-1/6 group cursor-pointer"
              >
                <div className="flex gap-1.5 items-end h-24">
                  {/* Income bar */}
                  <div
                    className={`w-3 md:w-4 rounded-t-md transition-all duration-500 ${
                      isSelected
                        ? 'bg-[#00C853] shadow-md shadow-green-500/30'
                        : 'bg-[#00C853]/45 group-hover:bg-[#00C853]/80'
                    }`}
                    style={{ height: `${trend.incPct}%` }}
                  />
                  {/* Expense bar */}
                  <div
                    className={`w-3 md:w-4 rounded-t-md transition-all duration-500 ${
                      isSelected
                        ? 'bg-[#FF2D55] shadow-md shadow-rose-500/30'
                        : 'bg-[#FF2D55]/45 group-hover:bg-[#FF2D55]/80'
                    }`}
                    style={{ height: `${trend.expPct}%` }}
                  />
                </div>

                {/* Net indicator dot */}
                {isSelected && (
                  <span
                    className={`absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                      netPositive ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                )}

                <span
                  className={`text-[10px] md:text-xs transition-colors ${
                    isSelected
                      ? 'font-black text-black dark:text-white'
                      : 'font-bold text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {trend.month}
                </span>
              </button>
            );
          })}
        </div>

        {/* 6-month savings rate footer */}
        <div className="bg-white dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56] rounded-2xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-black dark:text-white">6-Month Savings Rate</p>
            <p className="text-[11px] font-bold text-neutral-400 mt-0.5">
              {totalInc6 > 0
                ? `${formatMoney(totalInc6 - totalExp6)} saved of ${formatMoney(totalInc6)} earned`
                : 'No income recorded yet'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span
              className={`text-xl font-black tabular-nums ${
                savingsRate >= 20 ? 'text-emerald-500' : savingsRate >= 0 ? 'text-amber-500' : 'text-rose-500'
              }`}
            >
              {savingsRate}%
            </span>
            <span className="text-[10px] font-black text-neutral-400">
              {savingsRate >= 20 ? '🎯 Excellent' : savingsRate >= 10 ? '👍 Good' : savingsRate >= 0 ? '⚠️ Low' : '🔴 Deficit'}
            </span>
          </div>
        </div>
      </div>

    </section>
  );
};
