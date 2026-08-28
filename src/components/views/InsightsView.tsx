import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExpenseTransaction, IncomeTransaction } from '../../types';
import { exportPDF, exportExcel } from '../../utils/exportUtils';
import { HealthScoreWidget } from './HealthScoreWidget';
import { AiBudgetCoach } from './AiBudgetCoach';

export const InsightsView: React.FC = () => {
  const {
    transactions,
    spendingByCategory,
    totalExpenses,
    totalReceived,
    formatMoney,
    getCurrencySymbol,
    setIsAddModalOpen,
    profile,
    showToast,
  } = useApp();

  const [timeframe, setTimeframe] = useState<'Week' | 'Month' | 'Year'>('Month');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(5);
  const [isExporting, setIsExporting] = useState<'pdf' | 'excel' | null>(null);

  const currencySymbol = getCurrencySymbol();
  const expenseTransactions = transactions.filter((t): t is ExpenseTransaction => t.type === 'expense');
  const incomeTransactions = transactions.filter((t): t is IncomeTransaction => t.type === 'income');

  // ─── Timeframe-filtered transactions for export ────────────────────────────
  const filteredForExport = (() => {
    const now = new Date();
    if (timeframe === 'Week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return transactions.filter((t) => t.timestamp >= weekAgo.getTime());
    } else if (timeframe === 'Month') {
      return transactions.filter((t) => {
        const d = new Date(t.timestamp || Date.now());
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (timeframe === 'Year') {
      return transactions.filter((t) => {
        const d = new Date(t.timestamp || Date.now());
        return d.getFullYear() === now.getFullYear();
      });
    }
    return transactions;
  })();

  // Human-readable period label for the PDF/Excel
  const getPeriodLabel = () => {
    const now = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    if (timeframe === 'Week') {
      const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
      return `${weekAgo.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – ${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    } else if (timeframe === 'Month') {
      return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    } else {
      return `Year ${now.getFullYear()}`;
    }
  };

  // ─── Export Handlers ──────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    if (filteredForExport.length === 0) {
      showToast(`No transactions found for the selected ${timeframe} period`);
      return;
    }
    setIsExporting('pdf');
    try {
      const periodLabel = getPeriodLabel();
      const filteredIncome = filteredForExport.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const filteredExpenses = filteredForExport.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      exportPDF(
        filteredForExport,
        currencySymbol,
        profile.name || 'Kanakku User',
        filteredIncome,
        filteredExpenses,
        `${timeframe}ly Financial Statement`,
        periodLabel
      );
      showToast(`Bank Statement PDF (${timeframe}) exported successfully!`);
    } catch (err) {
      console.error('PDF export error:', err);
      showToast('Failed to export PDF');
    } finally {
      setTimeout(() => setIsExporting(null), 600);
    }
  };

  const handleExportExcel = async () => {
    if (filteredForExport.length === 0) {
      showToast(`No transactions found for the selected ${timeframe} period`);
      return;
    }
    setIsExporting('excel');
    try {
      const periodLabel = getPeriodLabel();
      const filteredIncome = filteredForExport.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const filteredExpenses = filteredForExport.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      exportExcel(
        filteredForExport,
        currencySymbol,
        profile.name || 'Kanakku User',
        filteredIncome,
        filteredExpenses,
        periodLabel
      );
      showToast(`Excel statement (.xlsx) for ${timeframe} exported successfully!`);
    } catch (err) {
      console.error('Excel export error:', err);
      showToast('Failed to export Excel');
    } finally {
      setTimeout(() => setIsExporting(null), 600);
    }
  };

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
              Start logging your income &amp; expenses to unlock real-time category distribution, doughnut charts, and monthly comparison trends.
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

  // ─── Monthly Trends (last 12 months for line + bar charts) ───────────────
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonthIdx = new Date().getMonth();

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(currentMonthIdx - (5 - i));
    return { name: monthNames[d.getMonth()], monthNum: d.getMonth(), year: d.getFullYear() };
  });

  const monthlyTrends = last6Months.map((m) => {
    const incInMonth = incomeTransactions
      .filter((t) => { const d = new Date(t.timestamp || Date.now()); return d.getMonth() === m.monthNum && d.getFullYear() === m.year; })
      .reduce((s, t) => s + t.amount, 0);

    const expInMonth = expenseTransactions
      .filter((t) => { const d = new Date(t.timestamp || Date.now()); return d.getMonth() === m.monthNum && d.getFullYear() === m.year; })
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

  const activeMonth = monthlyTrends[selectedMonthIndex] || monthlyTrends[monthlyTrends.length - 1];

  // ─── SVG Line Chart data ──────────────────────────────────────────────────
  const LINE_W = 340;
  const LINE_H = 90;
  const maxExpense = Math.max(...monthlyTrends.map((m) => m.expense), 1);
  const maxIncome = Math.max(...monthlyTrends.map((m) => m.income), 1);
  const overallMax = Math.max(maxExpense, maxIncome, 1);

  const toLinePoint = (value: number, idx: number, total: number) => {
    const x = (idx / (total - 1)) * LINE_W;
    const y = LINE_H - (value / overallMax) * LINE_H;
    return { x, y };
  };

  const expensePoints = monthlyTrends.map((m, i) => toLinePoint(m.expense, i, monthlyTrends.length));
  const incomePoints = monthlyTrends.map((m, i) => toLinePoint(m.income, i, monthlyTrends.length));

  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  const toArea = (pts: { x: number; y: number }[]) =>
    `${toPath(pts)} L${(pts[pts.length - 1].x).toFixed(1)},${LINE_H} L0,${LINE_H} Z`;

  // Donut chart
  const circumference = 2 * Math.PI * 38;
  let accumulatedAngle = 0;

  return (
    <main className="flex-grow w-full max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col gap-6 md:gap-8 pb-28 md:pb-12 animate-fadeIn text-black dark:text-white">

      {/* ─── Financial Health Score ────────────────────────────────────────── */}
      <HealthScoreWidget />

      {/* ─── Header + Export Buttons ───────────────────────────────────────── */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-black dark:text-white tracking-tight">
            Visual Spending Breakdown
          </h1>
          <p className="text-sm md:text-base font-bold text-neutral-600 dark:text-neutral-400 mt-1">
            Analyze your cash flow and export a bank-style statement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe selector */}
          <div className="flex bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-full p-1 shadow-sm">
            {(['Week', 'Month', 'Year'] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setTimeframe(period)}
                className={`px-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                  timeframe === period
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow'
                    : 'text-black dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-[#1C263A]'
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          {/* Export PDF */}
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExporting !== null}
            title="Export as a formal Bank Statement PDF"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500 text-white text-xs font-black hover:bg-rose-600 active:scale-95 transition-all shadow-sm disabled:opacity-60 cursor-pointer"
          >
            {isExporting === 'pdf' ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-sm font-black">picture_as_pdf</span>
            )}
            <span>Export as PDF</span>
          </button>

          {/* Export Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExporting !== null}
            title="Export filtered transactions into an Excel (.xlsx) spreadsheet"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 active:scale-95 transition-all shadow-sm disabled:opacity-60 cursor-pointer"
          >
            {isExporting === 'excel' ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-sm font-black">table_chart</span>
            )}
            <span>Export as Excel</span>
          </button>
        </div>
      </section>

      {/* ─── Main Grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left Column ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-5 flex flex-col gap-6">

          {/* Spending Donut */}
          <div className="bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center relative min-h-[360px]">
            <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-wider self-start absolute top-6 left-6">
              Total Expenses
            </h3>

            <div className="relative w-60 h-60 mt-6 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#E2E8F0" className="dark:stroke-[#243048]" strokeWidth="14" />
                {totalExpenses > 0 && spendingByCategory.map((cat, idx) => {
                  const fraction = cat.amount / totalExpenses;
                  const strokeDash = fraction * circumference;
                  const rotation = accumulatedAngle * 360;
                  accumulatedAngle += fraction;
                  return (
                    <circle
                      key={idx}
                      cx="50" cy="50" r="38"
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
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                <span className="text-2xl md:text-3xl font-black text-black dark:text-white tabular-nums tracking-tight">
                  {formatMoney(totalExpenses)}
                </span>
                <span className="text-xs font-black text-neutral-500 dark:text-neutral-400 mt-0.5">Total Spent</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-4 w-full text-xs font-bold text-black dark:text-white">
              {spendingByCategory.slice(0, 4).map((cat) => (
                <span key={cat.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.name} ({cat.percentage}%)
                </span>
              ))}
            </div>
          </div>

          {/* ── NEW: Monthly Spending Trend — SVG Line Chart ─────────────── */}
          <div className="bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-black dark:text-white tracking-tight">Monthly Spending Trend</h3>
                <p className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mt-0.5">Last 6 months — Income vs Expenses</p>
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
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF2D55" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#FF2D55" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00C853" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#00C853" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
                  <line
                    key={i}
                    x1="0" y1={f * LINE_H}
                    x2={LINE_W} y2={f * LINE_H}
                    stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.6"
                    className="text-black dark:text-white"
                  />
                ))}

                {/* Expense area fill */}
                <path d={toArea(expensePoints)} fill="url(#expGrad)" />
                {/* Income area fill */}
                <path d={toArea(incomePoints)} fill="url(#incGrad)" />

                {/* Expense line */}
                <path d={toPath(expensePoints)} fill="none" stroke="#FF2D55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {/* Income line */}
                <path d={toPath(incomePoints)} fill="none" stroke="#00C853" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                {/* Data points */}
                {expensePoints.map((p, i) => (
                  <circle key={`e${i}`} cx={p.x} cy={p.y} r="3" fill="#FF2D55" stroke="white" strokeWidth="1.2" />
                ))}
                {incomePoints.map((p, i) => (
                  <circle key={`ic${i}`} cx={p.x} cy={p.y} r="3" fill="#00C853" stroke="white" strokeWidth="1.2" />
                ))}

                {/* Month labels */}
                {monthlyTrends.map((m, i) => {
                  const x = (i / (monthlyTrends.length - 1)) * LINE_W;
                  return (
                    <text
                      key={m.month}
                      x={x} y={LINE_H + 14}
                      textAnchor="middle"
                      fontSize="7"
                      fontWeight="700"
                      fill="currentColor"
                      fillOpacity="0.55"
                      className="text-black dark:text-white"
                    >
                      {m.month}
                    </text>
                  );
                })}
              </svg>
            </div>

            {/* Quick stats below line chart */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Peak Expense', value: formatMoney(Math.max(...monthlyTrends.map(m => m.expense))), color: 'text-rose-500' },
                { label: 'Peak Income', value: formatMoney(Math.max(...monthlyTrends.map(m => m.income))), color: 'text-emerald-500' },
                { label: 'Avg/Month', value: formatMoney(monthlyTrends.reduce((s, m) => s + m.expense, 0) / 6), color: 'text-blue-500' },
              ].map((s) => (
                <div key={s.label} className="bg-white dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56] rounded-2xl p-3 text-center">
                  <p className={`text-xs font-black tabular-nums ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] font-bold text-neutral-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Column ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-7 flex flex-col gap-6">

          {/* Top Spending Categories */}
          <div className="bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl p-6 shadow-sm flex flex-col gap-2">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg md:text-xl font-black text-black dark:text-white tracking-tight">Top Spending Categories</h3>
              <span className="text-xs font-black text-neutral-500 dark:text-neutral-400">{spendingByCategory.length} Active</span>
            </div>

            <div className="flex flex-col divide-y divide-neutral-200 dark:divide-[#243048]">
              {spendingByCategory.map((cat) => (
                <div key={cat.name} className="flex flex-col gap-2.5 py-3.5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: cat.color }}>
                        <span className="material-symbols-outlined text-xl font-black">{cat.icon}</span>
                      </div>
                      <span className="text-sm font-black text-black dark:text-white">{cat.name}</span>
                    </div>
                    <span className="text-base font-black text-black dark:text-white tabular-nums">{formatMoney(cat.amount)}</span>
                  </div>
                  <div className="h-2 w-full bg-neutral-200 dark:bg-[#1C263A] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── NEW: Income vs Expense — Bar Chart ───────────────────────── */}
          <div className="bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg md:text-xl font-black text-black dark:text-white tracking-tight">Income vs Expense</h3>
                <p className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">Month-by-month comparison — click a bar to inspect</p>
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

            {/* Selected Month Details */}
            <div className="bg-white dark:bg-[#1C263A] rounded-2xl p-3 flex justify-between items-center text-xs border border-neutral-200 dark:border-[#2E3C56] shadow-sm">
              <span className="font-black text-black dark:text-white">{activeMonth.month} Overview:</span>
              <div className="flex gap-4">
                <span className="text-[#00C853] font-black">Income: {formatMoney(activeMonth.income)}</span>
                <span className="text-[#FF2D55] font-black">Expenses: {formatMoney(activeMonth.expense)}</span>
                <span className={`font-black ${activeMonth.income >= activeMonth.expense ? 'text-blue-500' : 'text-amber-500'}`}>
                  Net: {formatMoney(activeMonth.income - activeMonth.expense)}
                </span>
              </div>
            </div>

            {/* Bar Chart Area */}
            <div className="w-full relative flex items-end justify-between pt-6 pb-2 h-44">
              {/* Horizontal grid */}
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
                    className="relative z-10 flex flex-col items-center gap-2 w-1/6 group cursor-pointer"
                  >
                    <div className="flex gap-1.5 items-end h-28">
                      {/* Income bar */}
                      <div
                        className={`w-3 md:w-4 rounded-t-md transition-all duration-500 ${
                          isSelected ? 'bg-[#00C853] shadow-md shadow-green-500/30' : 'bg-[#00C853]/50 group-hover:bg-[#00C853]'
                        }`}
                        style={{ height: `${trend.incPct}%` }}
                        title={`${trend.month} Income: ${formatMoney(trend.income)}`}
                      />
                      {/* Expense bar */}
                      <div
                        className={`w-3 md:w-4 rounded-t-md transition-all duration-500 ${
                          isSelected ? 'bg-[#FF2D55] shadow-md shadow-rose-500/30' : 'bg-[#FF2D55]/50 group-hover:bg-[#FF2D55]'
                        }`}
                        style={{ height: `${trend.expPct}%` }}
                        title={`${trend.month} Expense: ${formatMoney(trend.expense)}`}
                      />
                    </div>

                    {/* Net indicator dot */}
                    {isSelected && (
                      <span
                        className={`absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${netPositive ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      />
                    )}

                    <span className={`text-xs transition-colors ${isSelected ? 'font-black text-black dark:text-white' : 'font-bold text-neutral-500 dark:text-neutral-400'}`}>
                      {trend.month}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Savings rate indicator */}
            {(() => {
              const totalInc = monthlyTrends.reduce((s, m) => s + m.income, 0);
              const totalExp = monthlyTrends.reduce((s, m) => s + m.expense, 0);
              const savingsRate = totalInc > 0 ? Math.round(((totalInc - totalExp) / totalInc) * 100) : 0;
              return (
                <div className="bg-white dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56] rounded-2xl p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-black dark:text-white">6-Month Savings Rate</p>
                    <p className="text-[11px] font-bold text-neutral-400 mt-0.5">
                      {totalInc > 0 ? `${formatMoney(totalInc - totalExp)} saved of ${formatMoney(totalInc)} earned` : 'No income recorded'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xl font-black tabular-nums ${savingsRate >= 20 ? 'text-emerald-500' : savingsRate >= 0 ? 'text-amber-500' : 'text-rose-500'}`}>
                      {savingsRate}%
                    </span>
                    <span className="text-[10px] font-black text-neutral-400">
                      {savingsRate >= 20 ? '🎯 Excellent' : savingsRate >= 10 ? '👍 Good' : savingsRate >= 0 ? '⚠️ Low' : '🔴 Deficit'}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ─── AI Budget Coach ───────────────────────────────────────────────── */}
      <AiBudgetCoach />

    </main>
  );
};
