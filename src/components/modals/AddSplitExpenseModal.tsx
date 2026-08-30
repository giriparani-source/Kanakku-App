import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SplitMemberShare } from '../../types';

interface AddSplitExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddSplitExpenseModal: React.FC<AddSplitExpenseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    splitFriends,
    splitGroups,
    categories,
    addSplitExpense,
    formatMoney,
    getCurrencySymbol,
    showToast,
  } = useApp();

  const [description, setDescription] = useState('');
  const [totalAmountStr, setTotalAmountStr] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [categoryName, setCategoryName] = useState<string>('Food & Dining');
  const [dateStr, setDateStr] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paidBy, setPaidBy] = useState<string>('user'); // 'user' or friend.id
  const [splitType, setSplitType] = useState<'equal' | 'exact'>('equal');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(['user']);
  const [customShares, setCustomShares] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Initialize selected members from group or default friends
  useEffect(() => {
    if (selectedGroupId) {
      const group = splitGroups.find((g) => g.id === selectedGroupId);
      if (group) {
        setSelectedMemberIds(group.memberIds);
      }
    } else {
      setSelectedMemberIds(['user', ...splitFriends.map((f) => f.id)]);
    }
  }, [selectedGroupId, splitGroups, splitFriends, isOpen]);

  if (!isOpen) return null;

  const totalAmount = parseFloat(totalAmountStr) || 0;

  const toggleMemberSelection = (memberId: string) => {
    if (selectedMemberIds.includes(memberId)) {
      if (selectedMemberIds.length === 1) {
        showToast('At least one person must be included');
        return;
      }
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== memberId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, memberId]);
    }
  };

  const calculateShares = (): SplitMemberShare[] => {
    if (splitType === 'equal') {
      const count = selectedMemberIds.length;
      if (count === 0) return [];
      const equalShare = Math.round((totalAmount / count) * 100) / 100;
      return selectedMemberIds.map((mId) => ({
        memberId: mId,
        amount: equalShare,
        hasSettled: mId === paidBy,
      }));
    } else {
      return selectedMemberIds.map((mId) => ({
        memberId: mId,
        amount: parseFloat(customShares[mId] || '0') || 0,
        hasSettled: mId === paidBy,
      }));
    }
  };

  const getMemberDisplayName = (mId: string) => {
    if (mId === 'user') return 'You';
    const friend = splitFriends.find((f) => f.id === mId);
    return friend ? friend.name : 'Friend';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast('Please enter an expense description');
      return;
    }
    if (totalAmount <= 0) {
      showToast('Please enter a valid amount');
      return;
    }

    const calculatedShares = calculateShares();
    const sumShares = calculatedShares.reduce((s, sh) => s + sh.amount, 0);

    if (splitType === 'exact' && Math.abs(sumShares - totalAmount) > 0.05) {
      showToast(`Custom shares (${formatMoney(sumShares)}) must equal total bill (${formatMoney(totalAmount)})`);
      return;
    }

    setIsSaving(true);
    try {
      await addSplitExpense({
        description: description.trim(),
        totalAmount,
        category: categoryName,
        date: dateStr,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        paidBy,
        splitType,
        shares: calculatedShares,
        settled: false,
        groupId: selectedGroupId || undefined,
        notes: notes.trim() || undefined,
      });

      setDescription('');
      setTotalAmountStr('');
      setNotes('');
      onClose();
    } catch (err) {
      console.error('Failed to add split expense:', err);
      showToast('Error saving split expense');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-black">
              <span className="material-symbols-outlined text-2xl">call_split</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-black dark:text-white">
                Add Shared Expense
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Split bills with friends or groups in Kanakku
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Description & Amount */}
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-neutral-500 block mb-1">
                Description <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Dinner at Saravana Bhavan, Villa rent, Cab fare"
                className="w-full p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-neutral-500 block mb-1">
                Total Bill Amount <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl focus-within:ring-2 focus-within:ring-black dark:focus-within:ring-white">
                <span className="text-xl font-black text-black dark:text-white">
                  {getCurrencySymbol()}
                </span>
                <input
                  type="number"
                  required
                  step="any"
                  min="1"
                  value={totalAmountStr}
                  onChange={(e) => setTotalAmountStr(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-lg font-black text-black dark:text-white bg-transparent focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Group & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-neutral-500 block mb-1">
                Group (Optional)
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-bold text-black dark:text-white"
              >
                <option value="">No Group (Direct Friends)</option>
                {splitGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-neutral-500 block mb-1">
                Category
              </label>
              <select
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-bold text-black dark:text-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Paid By Selector */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-neutral-500 block mb-1.5">
              Paid By
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPaidBy('user')}
                className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  paidBy === 'user'
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                    : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <span className="material-symbols-outlined text-sm">person</span>
                You Paid
              </button>

              {splitFriends.map((friend) => (
                <button
                  key={friend.id}
                  type="button"
                  onClick={() => setPaidBy(friend.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                    paidBy === friend.id
                      ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                      : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: friend.color || '#3B82F6' }}
                  />
                  {friend.name}
                </button>
              ))}
            </div>
          </div>

          {/* Split Mode Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-neutral-500">
                Split Mode
              </label>
              <div className="flex bg-neutral-100 dark:bg-neutral-900 p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setSplitType('equal')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    splitType === 'equal'
                      ? 'bg-white dark:bg-neutral-800 text-black dark:text-white shadow-sm'
                      : 'text-neutral-400'
                  }`}
                >
                  Split Equally (=)
                </button>
                <button
                  type="button"
                  onClick={() => setSplitType('exact')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    splitType === 'exact'
                      ? 'bg-white dark:bg-neutral-800 text-black dark:text-white shadow-sm'
                      : 'text-neutral-400'
                  }`}
                >
                  Custom Amounts (₹)
                </button>
              </div>
            </div>

            {/* Members Included List */}
            <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 space-y-2">
              <p className="text-[10px] font-black uppercase text-neutral-400">
                Select Members & Review Share:
              </p>

              {/* User Option */}
              <div className="flex items-center justify-between py-1.5">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMemberIds.includes('user')}
                    onChange={() => toggleMemberSelection('user')}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs font-black text-black dark:text-white">
                    You (Account Owner)
                  </span>
                </label>

                {splitType === 'equal' ? (
                  <span className="text-xs font-bold text-neutral-500">
                    {selectedMemberIds.includes('user') && totalAmount > 0
                      ? formatMoney(totalAmount / selectedMemberIds.length)
                      : '₹0'}
                  </span>
                ) : (
                  <input
                    type="number"
                    value={customShares['user'] || ''}
                    onChange={(e) =>
                      setCustomShares({ ...customShares, user: e.target.value })
                    }
                    placeholder="0"
                    disabled={!selectedMemberIds.includes('user')}
                    className="w-20 p-1 text-right text-xs font-black bg-white dark:bg-[#141B2A] border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none"
                  />
                )}
              </div>

              {/* Friends Options */}
              {splitFriends.map((friend) => {
                const isSelected = selectedMemberIds.includes(friend.id);
                return (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between py-1.5 border-t border-neutral-200/50 dark:border-neutral-800/50"
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMemberSelection(friend.id)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-black dark:text-white flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: friend.color || '#3B82F6' }}
                        />
                        {friend.name}
                      </span>
                    </label>

                    {splitType === 'equal' ? (
                      <span className="text-xs font-bold text-neutral-500">
                        {isSelected && totalAmount > 0
                          ? formatMoney(totalAmount / selectedMemberIds.length)
                          : '₹0'}
                      </span>
                    ) : (
                      <input
                        type="number"
                        value={customShares[friend.id] || ''}
                        onChange={(e) =>
                          setCustomShares({ ...customShares, [friend.id]: e.target.value })
                        }
                        placeholder="0"
                        disabled={!isSelected}
                        className="w-20 p-1 text-right text-xs font-black bg-white dark:bg-[#141B2A] border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving || totalAmount <= 0}
              className="w-full py-3.5 px-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-black text-xs shadow-xl hover:opacity-90 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-base font-black">call_split</span>
              Save Shared Expense ({formatMoney(totalAmount)})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
