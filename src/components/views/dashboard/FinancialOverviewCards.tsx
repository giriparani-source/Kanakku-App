/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface FinancialOverviewCardsProps {
  totalNetWorth: number;
  totalSavings: number;
  totalAvailable: number;
  totalReceived: number;
  totalExpenses: number;
  locationCount: number;
  formatMoney: (amount: number) => string;
}

/**
 * FinancialOverviewCards — Top 4 summary stat cards on the Dashboard.
 * Shows Net Worth, Savings, Available Money, and Monthly Cash Flow.
 */
export const FinancialOverviewCards: React.FC<FinancialOverviewCardsProps> = ({
  totalNetWorth,
  totalSavings,
  totalAvailable,
  totalReceived,
  totalExpenses,
  locationCount,
  formatMoney,
}) => {
  const netFlow = totalReceived - totalExpenses;

  return (
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
            All Locations ({locationCount})
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
          <span className="material-symbols-outlined text-[#FF9500] text-sm font-black">savings</span>
          <span className="text-[11px] font-black text-[#FF9500]">Reserve Funds</span>
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
            Cash &amp; Checking
          </span>
        </div>
      </div>

      {/* Monthly Cash Flow */}
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
          <span className={`tabular-nums ${netFlow >= 0 ? 'text-[#00C853]' : 'text-[#FF2D55]'}`}>
            {netFlow >= 0 ? '+' : ''}{formatMoney(netFlow)}
          </span>
        </div>
      </div>
    </section>
  );
};
