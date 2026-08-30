import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  friendId: string;
  defaultAmount?: number;
}

export const SettleUpModal: React.FC<SettleUpModalProps> = ({
  isOpen,
  onClose,
  friendId,
  defaultAmount,
}) => {
  const {
    splitFriends,
    friendBalances,
    settleSplitDebt,
    formatMoney,
    getCurrencySymbol,
    showToast,
  } = useApp();

  const friend = splitFriends.find((f) => f.id === friendId);
  const currentBalance = friendBalances[friendId] || 0; // > 0: friend owes user, < 0: user owes friend

  const initialAmount = defaultAmount || Math.abs(currentBalance) || 0;
  const [amountStr, setAmountStr] = useState<string>(initialAmount > 0 ? initialAmount.toString() : '');
  const [paymentMode, setPaymentMode] = useState<'upi' | 'cash' | 'other'>('upi');
  const [note, setNote] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!isOpen || !friend) return null;

  const isUserPayingFriend = currentBalance < 0;
  const amount = parseFloat(amountStr) || 0;

  const handleLaunchUpi = () => {
    if (!friend.upiId) {
      showToast('No UPI ID provided for this friend');
      return;
    }
    const upiUri = `upi://pay?pa=${encodeURIComponent(friend.upiId)}&pn=${encodeURIComponent(
      friend.name
    )}&am=${amount}&cu=INR&tn=${encodeURIComponent('Kanakku Settlement')}`;

    window.location.href = upiUri;
  };

  const handleRecordSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      showToast('Please enter a valid settlement amount');
      return;
    }

    setIsSaving(true);
    try {
      if (isUserPayingFriend) {
        // User paid friend
        await settleSplitDebt('user', friend.id, amount, paymentMode, note);
      } else {
        // Friend paid user
        await settleSplitDebt(friend.id, 'user', amount, paymentMode, note);
      }
      onClose();
    } catch (err) {
      console.error('Error settling up:', err);
      showToast('Failed to record settlement');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black">
              <span className="material-symbols-outlined text-2xl">handshake</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-black dark:text-white">
                Settle Up with {friend.name}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {currentBalance > 0
                  ? `${friend.name} owes you ${formatMoney(currentBalance)}`
                  : currentBalance < 0
                  ? `You owe ${friend.name} ${formatMoney(Math.abs(currentBalance))}`
                  : 'All settled up'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleRecordSettlement} className="p-5 space-y-4">
          {/* Amount input */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-neutral-500 block mb-1">
              Settlement Amount
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl focus-within:ring-2 focus-within:ring-black dark:focus-within:ring-white">
              <span className="text-2xl font-black text-black dark:text-white">
                {getCurrencySymbol()}
              </span>
              <input
                type="number"
                required
                step="any"
                min="1"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full text-xl font-black text-black dark:text-white bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-neutral-500 block mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode('upi')}
                className={`py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer flex flex-col items-center gap-1 ${
                  paymentMode === 'upi'
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                    : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <span className="material-symbols-outlined text-base">qr_code_scanner</span>
                UPI App
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('cash')}
                className={`py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer flex flex-col items-center gap-1 ${
                  paymentMode === 'cash'
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                    : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <span className="material-symbols-outlined text-base">payments</span>
                Cash
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('other')}
                className={`py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer flex flex-col items-center gap-1 ${
                  paymentMode === 'other'
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                    : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <span className="material-symbols-outlined text-base">account_balance</span>
                Bank Transfer
              </button>
            </div>
          </div>

          {/* Direct UPI Payment button if user owes friend and UPI is available */}
          {isUserPayingFriend && friend.upiId && (
            <button
              type="button"
              onClick={handleLaunchUpi}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-md"
            >
              <span className="material-symbols-outlined text-base">open_in_new</span>
              Pay {formatMoney(amount)} via UPI (GPay / PhonePe)
            </button>
          )}

          {/* Note input */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-neutral-500 block mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Paid via GPay, Cash at restaurant"
              className="w-full p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-bold text-black dark:text-white focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving || amount <= 0}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xl active:scale-95 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-base font-black">check_circle</span>
              Record Settlement ({formatMoney(amount)})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
