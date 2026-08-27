import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Transaction, ExpenseTransaction, IncomeTransaction, TransferTransaction } from '../../types';
import { SmartAlertsWidget } from './SmartAlertsWidget';
import { exportPDF, exportExcel } from '../../utils/exportUtils';

export const DashboardView: React.FC = () => {
  const {
    totalNetWorth,
    totalSavings,
    totalAvailable,
    totalReceived,
    totalExpenses,
    needAmount,
    wantAmount,
    needPercentage,
    wantPercentage,
    locations,
    locationBalances,
    spendingByCategory,
    transactions,
    formatMoney,
    getCurrencySymbol,
    profile,
    showToast,
    setSelectedTransaction,
    setIsAddModalOpen,
  } = useApp();

  const [viewAllOpen, setViewAllOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState<'pdf' | 'excel' | null>(null);

  // Filter Transactions
  const filteredTransactions = transactions.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      if (t.type === 'expense') {
        const exp = t as ExpenseTransaction;
        return (
          exp.description.toLowerCase().includes(query) ||
          exp.category.toLowerCase().includes(query) ||
          (exp.notes && exp.notes.toLowerCase().includes(query))
        );
      } else if (t.type === 'income') {
        const inc = t as IncomeTransaction;
        return (
          inc.source.toLowerCase().includes(query) ||
          (inc.notes && inc.notes.toLowerCase().includes(query))
        );
      } else if (t.type === 'transfer') {
        const tr = t as TransferTransaction;
        return (
          tr.transferType.toLowerCase().includes(query) ||
          (tr.notes && tr.notes.toLowerCase().includes(query))
        );
      }
    }
    return true;
  });

  const recentList = viewAllOpen ? filteredTransactions : filteredTransactions.slice(0, 6);

  const filteredIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

  const filteredExpenses = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const handleExportPDF = () => {
    if (filteredTransactions.length === 0) {
      showToast('No transactions found to export');
      return;
    }
    setIsExporting('pdf');
    try {
      exportPDF(
        filteredTransactions,
        getCurrencySymbol(),
        profile.name || 'Kanakku User',
        filteredIncome,
        filteredExpenses,
        'Transactions Statement'
      );
      showToast('Bank Statement PDF exported successfully!');
    } catch (err) {
      console.error('PDF export error:', err);
      showToast('Failed to export PDF');
    } finally {
      setTimeout(() => setIsExporting(null), 600);
    }
  };

  const handleExportExcel = () => {
    if (filteredTransactions.length === 0) {
      showToast('No transactions found to export');
      return;
    }
    setIsExporting('excel');
    try {
      exportExcel(
        filteredTransactions,
        getCurrencySymbol(),
        profile.name || 'Kanakku User',
        filteredIncome,
        filteredExpenses
      );
      showToast('Excel statement (.xlsx) exported successfully!');
    } catch (err) {
      console.error('Excel export error:', err);
      showToast('Failed to export Excel');
    } finally {
      setTimeout(() => setIsExporting(null), 600);
    }
  };

  // Pie chart calculation helper
  const renderPieChartSlices = () => {
    if (spendingByCategory.length === 0 || totalExpenses === 0) {
      return (
        <circle
          cx="50"
          cy="50"
          r="38"
          fill="transparent"
          stroke="#E2E8F0"
          className="dark:stroke-[#243048]"
          strokeWidth="14"
        />
      );
    }

    const circumference = 2 * Math.PI * 38; // ~238.76
    let accumulatedAngle = 0;

    return spendingByCategory.map((cat, idx) => {
      const fraction = cat.amount / totalExpenses;
      const strokeDash = fraction * circumference;
      const rotation = accumulatedAngle * 360 - 90;
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
          className="transition-all duration-700 ease-out cursor-pointer hover:opacity-90"
        />
      );
    });
  };

  const getLocationName = (id?: string) => {
    const loc = locations.find((l) => l.id === id);
    return loc ? loc.name : id || 'Account';
  };

  return (
    <main className="flex-1 flex flex-col gap-6 md:gap-8 max-w-4xl mx-auto w-full pb-36 md:pb-16 animate-fadeIn text-black dark:text-white">
      {/* SECTION 1: TOP FINANCIAL OVERVIEW */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5 md:gap-4">
        {/* Total Net Worth */}
        <div className="bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-black/5 dark:bg-white/5 rounded-bl-[3rem] -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="z-10">
            <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
              Total Net Worth
            </span>
            <span className="text-xl md:text-2xl lg:text-3xl font-black text-black dark:text-white block tracking-tight tabular-nums">
              {formatMoney(totalNetWorth)}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 z-10">
            <span className="material-symbols-outlined text-black dark:text-white text-sm font-black">
              account_balance
            </span>
            <span className="text-[11px] font-black text-black dark:text-white">
              All Locations ({locations.length})
            </span>
          </div>
        </div>

        {/* Total Savings */}
        <div className="bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF9500]/10 rounded-bl-[3rem] -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="z-10">
            <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
              Total Savings
            </span>
            <span className="text-xl md:text-2xl lg:text-3xl font-black text-[#FF9500] block tracking-tight tabular-nums">
              {formatMoney(totalSavings)}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 z-10">
            <span className="material-symbols-outlined text-[#FF9500] text-sm font-black">
              savings
            </span>
            <span className="text-[11px] font-black text-[#FF9500]">
              Reserve Funds
            </span>
          </div>
        </div>

        {/* Total Available (Liquid) */}
        <div className="bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#0066FF]/10 rounded-bl-[3rem] -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="z-10">
            <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
              Available Money
            </span>
            <span className="text-xl md:text-2xl lg:text-3xl font-black text-[#0066FF] dark:text-[#60A5FA] block tracking-tight tabular-nums">
              {formatMoney(totalAvailable)}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 z-10">
            <span className="material-symbols-outlined text-[#0066FF] dark:text-[#60A5FA] text-sm font-black">
              payments
            </span>
            <span className="text-[11px] font-black text-[#0066FF] dark:text-[#60A5FA]">
              Cash & Checking
            </span>
          </div>
        </div>

        {/* Total Inflow vs Outflow */}
        <div className="bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
          <div>
            <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
              Monthly Cash Flow
            </span>
            <div className="space-y-1 mt-1">
              <div className="flex justify-between items-center text-xs font-black">
                <span className="text-[#00C853] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">arrow_downward</span> In:
                </span>
                <span className="tabular-nums text-black dark:text-white">+{formatMoney(totalReceived)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-black">
                <span className="text-[#FF2D55] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">arrow_upward</span> Out:
                </span>
                <span className="tabular-nums text-black dark:text-white">-{formatMoney(totalExpenses)}</span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-neutral-200 dark:border-[#243048] flex justify-between text-[11px] font-black">
            <span className="text-neutral-500 dark:text-neutral-400">Net:</span>
            <span className={`tabular-nums ${totalReceived >= totalExpenses ? 'text-[#00C853]' : 'text-[#FF2D55]'}`}>
              {totalReceived >= totalExpenses ? '+' : ''}{formatMoney(totalReceived - totalExpenses)}
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 2: REAL-TIME BALANCES ACROSS LOCATIONS */}
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-sm font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-base">account_balance_wallet</span>
            <span>Real-Time Balances Across Locations</span>
          </h2>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs font-black text-[#0066FF] dark:text-[#60A5FA] hover:underline cursor-pointer"
          >
            + Log Transaction
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {locations.map((loc) => {
            const balance = locationBalances[loc.id] ?? loc.initialBalance;
            return (
              <div
                key={loc.id}
                className="p-4 rounded-2xl bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] flex flex-col justify-between hover:bg-white dark:hover:bg-[#1C263A] hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: loc.color || '#0066FF' }}
                  >
                    <span className="material-symbols-outlined text-lg">{loc.icon}</span>
                  </div>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-white dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56] text-neutral-600 dark:text-neutral-300">
                    {loc.isSavings ? 'Savings' : loc.type}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-black text-black dark:text-white block truncate mb-0.5">
                    {loc.name}
                  </span>
                  <span className="text-base md:text-lg font-black text-black dark:text-white block tabular-nums tracking-tight">
                    {formatMoney(balance)}
                  </span>
                  <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 block mt-0.5">
                    Starting: {formatMoney(loc.initialBalance)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: SMART ALERTS */}
      <SmartAlertsWidget />

      {/* SECTION 4: VISUAL CHARTS */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Pie Chart: Spending by Category */}
        <div className="md:col-span-6 bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[360px]">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-sm font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-base">pie_chart</span>
                <span>Spending by Category</span>
              </h3>
              <span className="text-xs font-black text-black dark:text-white tabular-nums">
                Total: {formatMoney(totalExpenses)}
              </span>
            </div>
            <p className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
              Interactive distribution across expense categories.
            </p>
          </div>

          {totalExpenses === 0 ? (
            <div className="my-auto py-8 text-center space-y-2">
              <span className="material-symbols-outlined text-4xl text-neutral-400 dark:text-neutral-600">donut_large</span>
              <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400">No expense recorded yet.</p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-auto pt-4 pb-2">
              <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {renderPieChartSlices()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
                  <span className="text-lg font-black text-black dark:text-white tabular-nums tracking-tight">
                    {formatMoney(totalExpenses)}
                  </span>
                  <span className="text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-400">
                    Spent
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-1.5 max-h-48 overflow-y-auto pr-1 w-full text-xs">
                {spendingByCategory.slice(0, 5).map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between p-1.5 rounded-xl bg-white dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="font-black text-black dark:text-white truncate max-w-[100px]">{cat.name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-black text-black dark:text-white tabular-nums">{formatMoney(cat.amount)}</span>
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400 ml-1">({cat.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bar Chart: Need vs. Want */}
        <div className="md:col-span-6 bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[360px]">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-sm font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-base">psychology</span>
                <span>Need vs. Want Tag</span>
              </h3>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-black dark:bg-white text-white dark:text-black font-black">
                Rule 50/30
              </span>
            </div>
            <p className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
              Spending psychology analysis via mandatory tagging.
            </p>
          </div>

          <div className="my-auto space-y-5 pt-4">
            <div className="space-y-4">
              {/* Need Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black text-black dark:text-white flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#0052FF]" /> Essential Needs
                  </span>
                  <span className="font-black text-black dark:text-white tabular-nums">
                    {formatMoney(needAmount)} ({needPercentage}%)
                  </span>
                </div>
                <div className="h-4 w-full bg-neutral-200 dark:bg-[#1C263A] rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-[#0052FF] to-[#00A3FF] rounded-full transition-all duration-700 shadow-sm"
                    style={{ width: `${Math.max(needPercentage > 0 ? needPercentage : 0, 0)}%` }}
                  />
                </div>
              </div>

              {/* Want Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black text-black dark:text-white flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#00C853]" /> Lifestyle Wants
                  </span>
                  <span className="font-black text-black dark:text-white tabular-nums">
                    {formatMoney(wantAmount)} ({wantPercentage}%)
                  </span>
                </div>
                <div className="h-4 w-full bg-neutral-200 dark:bg-[#1C263A] rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-[#00C853] to-[#05DF72] rounded-full transition-all duration-700 shadow-sm"
                    style={{ width: `${Math.max(wantPercentage > 0 ? wantPercentage : 0, 0)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Status callout */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
                  <span className="material-symbols-outlined text-base font-black">analytics</span>
                </div>
                <div>
                  <span className="font-black text-black dark:text-white block">Budget Discipline</span>
                  <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400">
                    {needPercentage >= 60 ? 'High essentials burden' : 'Well-balanced ratio'}
                  </span>
                </div>
              </div>
              <span className="font-black text-black dark:text-white tabular-nums text-sm">
                {needPercentage}% / {wantPercentage}%
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: RECENT ACTIVITY STREAM */}
      <section className="w-full space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-black text-black dark:text-white tracking-tight">
              Activity Stream
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] text-black dark:text-white text-xs font-black">
              {filteredTransactions.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Export as PDF */}
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExporting !== null || filteredTransactions.length === 0}
              title="Export filtered transactions as a formal Bank Statement PDF"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-500 hover:bg-rose-600 active:scale-95 text-white text-xs font-black transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isExporting === 'pdf' ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-sm font-black">picture_as_pdf</span>
              )}
              <span>Export as PDF</span>
            </button>

            {/* Export as Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExporting !== null || filteredTransactions.length === 0}
              title="Export filtered transactions into an Excel (.xlsx) spreadsheet"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isExporting === 'excel' ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-sm font-black">table_chart</span>
              )}
              <span>Export as Excel</span>
            </button>

            {/* See All */}
            <button
              type="button"
              onClick={() => setViewAllOpen(!viewAllOpen)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 text-xs font-black transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <span>{viewAllOpen ? 'Show Less' : 'See All'}</span>
              <span className="material-symbols-outlined text-sm font-black">
                {viewAllOpen ? 'expand_less' : 'chevron_right'}
              </span>
            </button>
          </div>
        </div>

        {/* Filter Chips & Search */}
        <div className="flex flex-col sm:flex-row gap-2.5 px-1">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-neutral-400 font-bold text-lg pointer-events-none">
              search
            </span>
            <input
              type="text"
              placeholder="Search description, category, source, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs md:text-sm bg-[#F4F5F7] dark:bg-[#141B2A] text-black dark:text-white font-bold rounded-2xl border border-neutral-200 dark:border-[#243048] outline-none focus:ring-2 focus:ring-black dark:focus:ring-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'expense', 'income', 'transfer'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black capitalize transition-all shrink-0 cursor-pointer ${
                  filterType === type
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
                    : 'bg-[#F4F5F7] dark:bg-[#141B2A] text-black dark:text-white border border-neutral-200 dark:border-[#243048] hover:bg-neutral-200 dark:hover:bg-neutral-800'
                }`}
              >
                {type === 'all' ? 'All Activities' : type}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions List Container */}
        <div className="bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-[2rem] overflow-hidden divide-y divide-neutral-200 dark:divide-[#243048] shadow-sm">
          {recentList.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <span className="material-symbols-outlined text-4xl text-neutral-400 font-bold">
                receipt_long
              </span>
              <p className="text-sm text-black dark:text-white font-bold">No transactions recorded yet.</p>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="mt-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-xs font-black rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
              >
                Log Your First Transaction
              </button>
            </div>
          ) : (
            recentList.map((tx: Transaction) => {
              const isIncome = tx.type === 'income';
              const isExpense = tx.type === 'expense';
              const isTransfer = tx.type === 'transfer';

              let title = '';
              let subtitle = '';
              let badgeBg = 'bg-neutral-200 text-black';
              let badgeLabel = '';
              let icon = 'receipt';
              let iconBg = 'bg-neutral-700 text-white';

              if (isExpense) {
                const exp = tx as ExpenseTransaction;
                title = exp.description || exp.category;
                subtitle = `${exp.category} • ${getLocationName(exp.locationId)}`;
                badgeLabel = exp.needWant.toUpperCase();
                badgeBg = exp.needWant === 'Need' ? 'bg-[#0052FF] text-white' : 'bg-[#00C853] text-white';
                icon = 'shopping_bag';
                iconBg = 'bg-[#FF2D55] text-white';
              } else if (isIncome) {
                const inc = tx as IncomeTransaction;
                title = inc.source || 'Income';
                subtitle = `Deposited to: ${getLocationName(inc.locationId)}`;
                badgeLabel = 'INCOME';
                badgeBg = 'bg-[#00C853] text-white';
                icon = 'payments';
                iconBg = 'bg-[#00C853] text-white';
              } else if (isTransfer) {
                const tr = tx as TransferTransaction;
                title = tr.transferType === 'transfer' ? `Transfer to ${getLocationName(tr.toLocationId)}` : `Transfer (${tr.transferType})`;
                subtitle = `From: ${getLocationName(tr.fromLocationId || tr.locationId)}`;
                badgeLabel = 'TRANSFER';
                badgeBg = 'bg-[#0066FF] text-white';
                icon = 'sync_alt';
                iconBg = 'bg-[#0066FF] text-white';
              }

              return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTransaction(tx)}
                  className="flex items-center justify-between p-4 md:p-5 hover:bg-white dark:hover:bg-[#1C263A] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${iconBg}`}>
                      <span className="material-symbols-outlined text-[20px] font-black">{icon}</span>
                    </div>

                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-black dark:text-white text-sm md:text-base truncate">
                          {title}
                        </span>
                        {badgeLabel && (
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${badgeBg}`}>
                            {badgeLabel}
                          </span>
                        )}
                      </div>
                      <span className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                        {subtitle} • {tx.date}{tx.time ? `, ${tx.time}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <span
                      className={`font-black text-base md:text-lg tabular-nums ${
                        isIncome
                          ? 'text-[#00C853]'
                          : isExpense
                          ? 'text-[#FF2D55]'
                          : 'text-[#0066FF] dark:text-[#60A5FA]'
                      }`}
                    >
                      {isIncome ? `+${formatMoney(tx.amount)}` : isExpense ? `-${formatMoney(tx.amount)}` : formatMoney(tx.amount)}
                    </span>
                    <span className="block text-[10px] font-bold text-neutral-400 capitalize">
                      {tx.type}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
};
