import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LocationType } from '../../types';

interface LinkAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INSTITUTIONS = [
  { name: 'State Bank of India (SBI)', type: 'bank' as LocationType, icon: 'account_balance' },
  { name: 'HDFC Bank', type: 'bank' as LocationType, icon: 'account_balance' },
  { name: 'ICICI Bank', type: 'bank' as LocationType, icon: 'account_balance' },
  { name: 'Chase Bank', type: 'bank' as LocationType, icon: 'account_balance' },
  { name: 'High-Yield Savings', type: 'savings' as LocationType, icon: 'savings' },
  { name: 'Paytm / UPI Wallet', type: 'wallet' as LocationType, icon: 'account_balance_wallet' },
  { name: 'Apple Pay / Google Wallet', type: 'wallet' as LocationType, icon: 'account_balance_wallet' },
  { name: 'Cash Reserve', type: 'cash' as LocationType, icon: 'payments' },
];

export const LinkAccountModal: React.FC<LinkAccountModalProps> = ({ isOpen, onClose }) => {
  const { addLocation, getCurrencySymbol } = useApp();
  const [selectedInst, setSelectedInst] = useState(INSTITUTIONS[0]);
  const [customName, setCustomName] = useState('SBI Primary Account');
  const [accountType, setAccountType] = useState<LocationType>('bank');
  const [lastFour, setLastFour] = useState('1234');
  const [balance, setBalance] = useState('10000.00');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedBalance = Math.max(0, parseFloat(balance) || 0);

    addLocation({
      name: customName || selectedInst.name,
      type: accountType,
      initialBalance: parsedBalance,
      mask: lastFour || '0000',
      institution: selectedInst.name,
      icon: selectedInst.icon,
      color: accountType === 'savings' ? '#FF9500' : accountType === 'bank' ? '#0066FF' : accountType === 'wallet' ? '#8B5CF6' : '#00C853',
      isSavings: accountType === 'savings',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn text-black dark:text-white">
      <div className="w-full max-w-md bg-white dark:bg-[#141B2A] rounded-3xl p-6 shadow-2xl space-y-4 border border-neutral-200 dark:border-[#243048] animate-slideUp">
        <div className="flex justify-between items-center pb-2 border-b border-neutral-200 dark:border-[#243048]">
          <h3 className="text-lg font-black text-black dark:text-white">
            Add Money Location / Account
          </h3>
          <button onClick={onClose} className="p-1 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-xl font-black">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-black dark:text-neutral-300 mb-1">
              Select Preset or Provider
            </label>
            <select
              value={selectedInst.name}
              onChange={(e) => {
                const inst = INSTITUTIONS.find((i) => i.name === e.target.value) || INSTITUTIONS[0];
                setSelectedInst(inst);
                setCustomName(`${inst.name}`);
                setAccountType(inst.type);
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white font-bold text-sm outline-none border border-neutral-200 dark:border-[#2E3C56] focus:border-black dark:focus:border-white cursor-pointer"
            >
              {INSTITUTIONS.map((inst) => (
                <option key={inst.name} value={inst.name} className="bg-white dark:bg-[#1C263A]">
                  {inst.name} ({inst.type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-black dark:text-neutral-300 mb-1">
              Display Name
            </label>
            <input
              type="text"
              required
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white font-bold text-sm outline-none border border-neutral-200 dark:border-[#2E3C56] focus:border-black dark:focus:border-white"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-black dark:text-neutral-300 mb-1">
              Location Type
            </label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as LocationType)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white font-bold text-sm outline-none border border-neutral-200 dark:border-[#2E3C56] focus:border-black dark:focus:border-white cursor-pointer"
            >
              <option value="bank" className="bg-white dark:bg-[#1C263A]">Bank / Checking Account</option>
              <option value="savings" className="bg-white dark:bg-[#1C263A]">Savings Account (Reserve)</option>
              <option value="wallet" className="bg-white dark:bg-[#1C263A]">Digital Wallet</option>
              <option value="cash" className="bg-white dark:bg-[#1C263A]">Cash Wallet</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-black dark:text-neutral-300 mb-1">
                Identifier / Last 4
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={lastFour}
                onChange={(e) => setLastFour(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white font-black text-sm outline-none border border-neutral-200 dark:border-[#2E3C56] focus:border-black dark:focus:border-white font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-black dark:text-neutral-300 mb-1">
                Initial Balance ({getCurrencySymbol()})
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white font-black text-sm outline-none border border-neutral-200 dark:border-[#2E3C56] focus:border-black dark:focus:border-white font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-black bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-[#2E3C56] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-sm font-black bg-black dark:bg-white text-white dark:text-black hover:opacity-90 shadow-sm cursor-pointer"
            >
              Add Location
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
