import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExpenseTransaction, IncomeTransaction, TransferTransaction, NeedWantType } from '../../types';

export const TransactionDetailModal: React.FC = () => {
  const {
    selectedTransaction,
    setSelectedTransaction,
    updateTransaction,
    deleteTransaction,
    categories,
    locations,
    incomeSources,
    formatMoney,
    getCurrencySymbol,
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [editAmount, setEditAmount] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('');
  const [editSource, setEditSource] = useState<string>('');
  const [editLocationId, setEditLocationId] = useState<string>('');
  const [editNeedWant, setEditNeedWant] = useState<NeedWantType>('Need');
  const [editNotes, setEditNotes] = useState<string>('');

  if (!selectedTransaction) return null;

  const isExpense = selectedTransaction.type === 'expense';
  const isIncome = selectedTransaction.type === 'income';
  const isTransfer = selectedTransaction.type === 'transfer';

  const expTx = isExpense ? (selectedTransaction as ExpenseTransaction) : null;
  const incTx = isIncome ? (selectedTransaction as IncomeTransaction) : null;
  const trTx = isTransfer ? (selectedTransaction as TransferTransaction) : null;

  const getLocationName = (id?: string) => {
    const loc = locations.find((l) => l.id === id);
    return loc ? loc.name : id || 'Account';
  };

  const startEdit = () => {
    setEditAmount(selectedTransaction.amount.toString());
    setEditNotes(selectedTransaction.notes || '');
    setEditLocationId(selectedTransaction.locationId || locations[0]?.id || '');

    if (isExpense && expTx) {
      setEditDescription(expTx.description || '');
      setEditCategory(expTx.category || categories[0]?.name || '');
      setEditNeedWant(expTx.needWant || 'Need');
    } else if (isIncome && incTx) {
      setEditSource(incTx.source || incomeSources[0]?.name || '');
    }
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(editAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    if (isExpense) {
      updateTransaction(selectedTransaction.id, {
        amount: parsedAmount,
        description: editDescription.trim(),
        category: editCategory,
        locationId: editLocationId,
        needWant: editNeedWant, // Mandatory
        notes: editNotes.trim() || undefined,
      });
    } else if (isIncome) {
      updateTransaction(selectedTransaction.id, {
        amount: parsedAmount,
        source: editSource,
        locationId: editLocationId,
        notes: editNotes.trim() || undefined,
      });
    } else if (isTransfer) {
      updateTransaction(selectedTransaction.id, {
        amount: parsedAmount,
        locationId: editLocationId,
        notes: editNotes.trim() || undefined,
      });
    }

    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteTransaction(selectedTransaction.id);
    setSelectedTransaction(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn text-black dark:text-white">
      <div className="w-full max-w-md bg-white dark:bg-[#141B2A] rounded-3xl p-6 shadow-2xl space-y-5 border border-neutral-200 dark:border-[#243048] animate-slideUp">
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-neutral-200 dark:border-[#243048]">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-black px-2.5 py-0.5 rounded-full uppercase ${
                isIncome
                  ? 'bg-[#00C853] text-white'
                  : isExpense
                  ? 'bg-[#FF2D55] text-white'
                  : 'bg-[#0066FF] text-white'
              }`}
            >
              {selectedTransaction.type}
            </span>
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
              {selectedTransaction.date} {selectedTransaction.time ? `• ${selectedTransaction.time}` : ''}
            </span>
          </div>

          <button
            onClick={() => setSelectedTransaction(null)}
            className="p-1 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl font-black">close</span>
          </button>
        </div>

        {/* View Mode */}
        {!isEditing ? (
          <div className="space-y-4">
            <div className="text-center py-2">
              <span
                className={`text-3xl md:text-4xl font-black tabular-nums ${
                  isIncome
                    ? 'text-[#00C853]'
                    : isExpense
                    ? 'text-[#FF2D55]'
                    : 'text-[#0066FF] dark:text-[#60A5FA]'
                }`}
              >
                {isIncome ? '+' : isExpense ? '-' : ''}
                {formatMoney(selectedTransaction.amount)}
              </span>
              <h3 className="text-base font-black text-black dark:text-white mt-1">
                {isExpense
                  ? expTx?.description
                  : isIncome
                  ? incTx?.source
                  : `Transfer (${trTx?.transferType})`}
              </h3>
            </div>

            {/* Details table */}
            <div className="bg-[#F4F5F7] dark:bg-[#1C263A] rounded-2xl p-4 space-y-2.5 text-xs border border-neutral-200 dark:border-[#2E3C56]">
              {isExpense && expTx && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-neutral-500 dark:text-neutral-400">Category</span>
                    <span className="font-black text-black dark:text-white">{expTx.category}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-neutral-500 dark:text-neutral-400">Need vs. Want</span>
                    <span
                      className={`font-black px-2 py-0.5 rounded-md ${
                        expTx.needWant === 'Need'
                          ? 'bg-[#0052FF] text-white'
                          : 'bg-[#00C853] text-white'
                      }`}
                    >
                      {expTx.needWant}
                    </span>
                  </div>
                </>
              )}

              {isIncome && incTx && (
                <div className="flex justify-between items-center">
                  <span className="font-bold text-neutral-500 dark:text-neutral-400">Income Source</span>
                  <span className="font-black text-black dark:text-white">{incTx.source}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="font-bold text-neutral-500 dark:text-neutral-400">
                  {isTransfer ? 'Location' : isExpense ? 'Paid from' : 'Deposited to'}
                </span>
                <span className="font-black text-black dark:text-white">
                  {getLocationName(selectedTransaction.locationId)}
                </span>
              </div>

              {selectedTransaction.notes && (
                <div className="pt-2 border-t border-neutral-200 dark:border-[#2E3C56]">
                  <span className="font-bold text-neutral-500 dark:text-neutral-400 block mb-0.5">Notes</span>
                  <p className="font-bold text-black dark:text-white italic">{selectedTransaction.notes}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-3 rounded-xl text-xs font-black bg-rose-50 dark:bg-rose-950/30 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/50 cursor-pointer"
              >
                Delete Record
              </button>
              <button
                type="button"
                onClick={startEdit}
                className="flex-1 py-3 rounded-xl text-xs font-black bg-black dark:bg-white text-white dark:text-black hover:opacity-90 cursor-pointer"
              >
                Edit Transaction
              </button>
            </div>
          </div>
        ) : (
          /* Edit Mode Form */
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-black dark:text-neutral-300 mb-1">
                Amount ({getCurrencySymbol()})
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white font-black text-sm outline-none border border-neutral-200 dark:border-[#2E3C56] tabular-nums"
              />
            </div>

            {isExpense && (
              <>
                <div>
                  <label className="block text-xs font-black text-black dark:text-neutral-300 mb-1">Description</label>
                  <input
                    type="text"
                    required
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white font-bold text-sm outline-none border border-neutral-200 dark:border-[#2E3C56]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-black text-black dark:text-neutral-300 mb-1">Category</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white font-bold text-xs border border-neutral-200 dark:border-[#2E3C56]"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name} className="bg-white dark:bg-[#1C263A]">
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-black dark:text-neutral-300 mb-1">Need vs Want</label>
                    <select
                      value={editNeedWant}
                      onChange={(e) => setEditNeedWant(e.target.value as NeedWantType)}
                      className="w-full p-2.5 rounded-xl bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white font-bold text-xs border border-neutral-200 dark:border-[#2E3C56]"
                    >
                      <option value="Need" className="bg-white dark:bg-[#1C263A]">Need (Essential)</option>
                      <option value="Want" className="bg-white dark:bg-[#1C263A]">Want (Lifestyle)</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {isIncome && (
              <div>
                <label className="block text-xs font-black text-black dark:text-neutral-300 mb-1">Income Source</label>
                <select
                  value={editSource}
                  onChange={(e) => setEditSource(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white font-bold text-xs border border-neutral-200 dark:border-[#2E3C56]"
                >
                  {incomeSources.map((s) => (
                    <option key={s.id} value={s.name} className="bg-white dark:bg-[#1C263A]">
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-black dark:text-neutral-300 mb-1">Money Location</label>
              <select
                value={editLocationId}
                onChange={(e) => setEditLocationId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white font-bold text-xs border border-neutral-200 dark:border-[#2E3C56]"
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id} className="bg-white dark:bg-[#1C263A]">
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-black dark:text-neutral-300 mb-1">Notes</label>
              <input
                type="text"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white font-bold text-xs border border-neutral-200 dark:border-[#2E3C56]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-black bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl text-xs font-black bg-black dark:bg-white text-white dark:text-black hover:opacity-90 cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
