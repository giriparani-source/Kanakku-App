/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { SmartAlertsWidget } from './SmartAlertsWidget';
import { FinancialOverviewCards } from './dashboard/FinancialOverviewCards';
import { TransactionList } from './dashboard/TransactionList';
import { ProChartsSection } from './dashboard/ProChartsSection';

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
    setIsAutoSmsModalOpen,
    setIsReceiptScannerOpen,
    loadMoreTransactions,
    hasMoreTransactions,
    isLoadingMoreTransactions,
  } = useApp();

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

      {/* SECTION 1: TOP FINANCIAL OVERVIEW CARDS */}
      <FinancialOverviewCards
        totalNetWorth={totalNetWorth}
        totalSavings={totalSavings}
        totalAvailable={totalAvailable}
        totalReceived={totalReceived}
        totalExpenses={totalExpenses}
        locationCount={locations.length}
        formatMoney={formatMoney}
      />

      {/* SECTION 2: REAL-TIME BALANCES ACROSS LOCATIONS */}
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-sm font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-base">account_balance_wallet</span>
            <span>Real-Time Balances Across Locations</span>
          </h2>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsReceiptScannerOpen(true)}
              className="text-xs font-black text-blue-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
              title="Scan Bill / Receipt (Vision OCR)"
            >
              <span className="material-symbols-outlined text-sm font-black">document_scanner</span>
              <span>Scan Bill</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAutoSmsModalOpen(true)}
              className="text-xs font-black text-amber-500 hover:text-amber-600 flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm font-black">bolt</span>
              <span>Auto SMS</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs font-black text-[#0066FF] dark:text-[#60A5FA] hover:underline cursor-pointer"
            >
              + Log
            </button>
          </div>
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

      {/* SECTION 5: PRO ANALYTICS — Monthly Trend + Income vs Expense Charts */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <h2 className="text-sm font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-base">auto_graph</span>
            <span>Pro Analytics</span>
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-[9px] font-black">LIVE</span>
        </div>
        <ProChartsSection transactions={transactions} formatMoney={formatMoney} />
      </section>

      {/* SECTION 6: RECENT ACTIVITY STREAM */}
      <TransactionList
        transactions={transactions}
        formatMoney={formatMoney}
        getCurrencySymbol={getCurrencySymbol}
        profileName={profile.name || 'Kanakku User'}
        showToast={showToast}
        setSelectedTransaction={setSelectedTransaction}
        setIsAddModalOpen={setIsAddModalOpen}
        getLocationName={getLocationName}
        loadMoreTransactions={loadMoreTransactions}
        hasMoreTransactions={hasMoreTransactions}
        isLoadingMoreTransactions={isLoadingMoreTransactions}
      />
    </main>
  );
};
