import React from 'react';
import { useApp } from '../../context/AppContext';
import { ParsedSmsResult } from '../../utils/smsParser';
import { markSmsAsProcessed, markSmsAsDismissed } from '../../services/smsService';

interface SmsReviewBannerProps {
  parsedSms: ParsedSmsResult | null;
  onDismiss: () => void;
  onOpenEditModal: (parsed: ParsedSmsResult) => void;
}

export const SmsReviewBanner: React.FC<SmsReviewBannerProps> = ({
  parsedSms,
  onDismiss,
  onOpenEditModal,
}) => {
  const {
    addExpense,
    addIncome,
    addTransfer,
    formatMoney,
    getCurrencySymbol,
    showToast,
    categories,
    locations,
    incomeSources,
  } = useApp();

  if (!parsedSms || parsedSms.amount === null || parsedSms.amount <= 0) {
    return null;
  }

  const handleQuickAdd = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const smsNote = `Auto SMS from ${parsedSms.bankName || 'Bank'}${
        parsedSms.referenceNumber ? ` (Ref: ${parsedSms.referenceNumber})` : ''
      }`;

      if (parsedSms.type === 'expense') {
        await addExpense({
          amount: parsedSms.amount!,
          description: parsedSms.merchant,
          category: parsedSms.categoryName,
          locationId: parsedSms.locationId,
          needWant: parsedSms.needWant,
          date: todayStr,
          time: timeStr,
          notes: smsNote,
        });
      } else if (parsedSms.type === 'income') {
        await addIncome({
          amount: parsedSms.amount!,
          source: parsedSms.sourceName || parsedSms.merchant,
          locationId: parsedSms.locationId,
          date: todayStr,
          time: timeStr,
          notes: smsNote,
        });
      } else {
        await addTransfer({
          amount: parsedSms.amount!,
          locationId: parsedSms.locationId,
          transferType: parsedSms.transferType,
          fromLocationId: parsedSms.locationId,
          toLocationId: parsedSms.locationId,
          date: todayStr,
          time: timeStr,
          notes: smsNote,
        });
      }

      if (parsedSms.id) {
        markSmsAsProcessed(parsedSms.id);
      }

      showToast(`⚡ 1-Tap Saved: ${formatMoney(parsedSms.amount!)} (${parsedSms.merchant})`);
      onDismiss();
    } catch (err) {
      console.error('Error during 1-Tap Quick Add:', err);
      showToast('Failed to add transaction');
    }
  };

  const handleIgnore = () => {
    if (parsedSms.id) {
      markSmsAsDismissed(parsedSms.id);
    }
    onDismiss();
  };

  const isExpense = parsedSms.type === 'expense';
  const isIncome = parsedSms.type === 'income';

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-120 w-full max-w-lg px-4 animate-slideDown">
      <div className="bg-white/95 dark:bg-[#141B2A]/95 backdrop-blur-xl border-2 border-neutral-900/10 dark:border-white/10 rounded-3xl p-4 shadow-2xl ring-4 ring-black/5 dark:ring-white/5 transition-all">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="flex items-center gap-1.5 text-xs font-black tracking-wide uppercase text-neutral-800 dark:text-neutral-200">
              <span className="material-symbols-outlined text-[16px] text-amber-500 font-black">bolt</span>
              Bank SMS Detected
            </div>
            {parsedSms.bankName && (
              <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                {parsedSms.bankName}
              </span>
            )}
          </div>

          <button
            onClick={handleIgnore}
            title="Dismiss"
            className="p-1 rounded-full text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Transaction Summary Content */}
        <div className="flex items-start justify-between gap-3 my-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                  isExpense
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                    : isIncome
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                    : 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                }`}
              >
                {parsedSms.type}
              </span>
              <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 truncate">
                {parsedSms.categoryName}
              </span>
              {isExpense && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                  {parsedSms.needWant}
                </span>
              )}
            </div>

            <h4 className="text-base font-black text-black dark:text-white truncate mt-1">
              {parsedSms.merchant}
            </h4>

            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1 italic mt-0.5">
              "{parsedSms.rawText}"
            </p>
          </div>

          {/* Amount Badge */}
          <div className="text-right">
            <div
              className={`text-lg md:text-xl font-black ${
                isExpense
                  ? 'text-rose-600 dark:text-rose-400'
                  : isIncome
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-blue-600 dark:text-blue-400'
              }`}
            >
              {isExpense ? '-' : isIncome ? '+' : ''}
              {formatMoney(parsedSms.amount)}
            </div>
            <div className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
              {parsedSms.locationName}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <button
            onClick={() => onOpenEditModal(parsedSms)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            Review / Edit
          </button>

          <button
            onClick={handleQuickAdd}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-black dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-95 text-xs font-black shadow-lg transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm font-black">bolt</span>
            1-Tap Quick Add
          </button>
        </div>
      </div>
    </div>
  );
};
