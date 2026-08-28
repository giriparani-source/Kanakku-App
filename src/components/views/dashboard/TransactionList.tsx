/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Transaction, ExpenseTransaction, IncomeTransaction, TransferTransaction } from '../../../types';
import { exportPDF, exportExcel } from '../../../utils/exportUtils';

interface TransactionListProps {
  transactions: Transaction[];
  formatMoney: (amount: number) => string;
  getCurrencySymbol: () => string;
  profileName: string;
  showToast: (msg: string) => void;
  setSelectedTransaction: (tx: Transaction) => void;
  setIsAddModalOpen: (open: boolean) => void;
  getLocationName: (id?: string) => string;
  loadMoreTransactions?: () => Promise<void>;
  hasMoreTransactions?: boolean;
  isLoadingMoreTransactions?: boolean;
}

/**
 * TransactionList — Activity Stream section of the Dashboard.
 * Handles filtering, searching, export (PDF/Excel), and paginated display
 * of all transactions with click-to-detail support.
 */
export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  formatMoney,
  getCurrencySymbol,
  profileName,
  showToast,
  setSelectedTransaction,
  setIsAddModalOpen,
  getLocationName,
  loadMoreTransactions,
  hasMoreTransactions = true,
  isLoadingMoreTransactions = false,
}) => {
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
        profileName,
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
        profileName,
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

  return (
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
              title =
                tr.transferType === 'transfer'
                  ? `Transfer to ${getLocationName(tr.toLocationId)}`
                  : `Transfer (${tr.transferType})`;
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
                      {subtitle} • {tx.date}
                      {tx.time ? `, ${tx.time}` : ''}
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
                    {isIncome
                      ? `+${formatMoney(tx.amount)}`
                      : isExpense
                      ? `-${formatMoney(tx.amount)}`
                      : formatMoney(tx.amount)}
                  </span>
                  <span className="block text-[10px] font-bold text-neutral-400 capitalize">{tx.type}</span>
                </div>
              </div>
            );
          })
        )}

        {/* Load More Pagination Section */}
        {filteredTransactions.length > 0 && hasMoreTransactions && (
          <div className="p-4 flex flex-col items-center justify-center gap-2 bg-white/60 dark:bg-[#141B2A]/60 border-t border-neutral-200 dark:border-[#243048]">
            <button
              type="button"
              onClick={async () => {
                if (!viewAllOpen) setViewAllOpen(true);
                if (loadMoreTransactions) {
                  await loadMoreTransactions();
                }
              }}
              disabled={isLoadingMoreTransactions}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 text-xs md:text-sm font-black transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isLoadingMoreTransactions ? (
                <>
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Loading more transactions...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base font-black">expand_more</span>
                  <span>Load More Transactions</span>
                </>
              )}
            </button>
            <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500">
              Showing {recentList.length} of {filteredTransactions.length} loaded
            </span>
          </div>
        )}

        {/* All Loaded Indicator */}
        {!hasMoreTransactions && filteredTransactions.length > 6 && (
          <div className="py-3 px-4 text-center bg-white/40 dark:bg-[#141B2A]/40 border-t border-neutral-200 dark:border-[#243048]">
            <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-emerald-500 font-black">check_circle</span>
              All {filteredTransactions.length} transactions loaded
            </span>
          </div>
        )}
      </div>
    </section>
  );
};
