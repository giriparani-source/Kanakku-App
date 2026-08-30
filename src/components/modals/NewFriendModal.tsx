import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface NewFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FRIEND_COLORS = [
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#EF4444', // Red
  '#F97316', // Orange
];

export const NewFriendModal: React.FC<NewFriendModalProps> = ({ isOpen, onClose }) => {
  const { addSplitFriend, showToast } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [upiId, setUpiId] = useState('');
  const [selectedColor, setSelectedColor] = useState(FRIEND_COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter a friend name');
      return;
    }

    setIsSaving(true);
    try {
      await addSplitFriend({
        name: name.trim(),
        phone: phone.trim() || undefined,
        upiId: upiId.trim() || undefined,
        color: selectedColor,
      });

      setName('');
      setPhone('');
      setUpiId('');
      onClose();
    } catch (err) {
      console.error('Error adding friend:', err);
      showToast('Failed to add friend');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-black">
              <span className="material-symbols-outlined text-2xl">person_add</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-black dark:text-white">Add New Friend</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Split bills and track balances with friends
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-neutral-500 block mb-1">
              Friend Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Vignesh Kumar, Ananya"
              className="w-full p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>

          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-neutral-500 block mb-1">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-bold text-black dark:text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-neutral-500 block mb-1">
              UPI ID for 1-Tap Payments (Optional)
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. friend@okhdfcbank, 9876543210@upi"
              className="w-full p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-bold text-black dark:text-white focus:outline-none"
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-neutral-500 block mb-1.5">
              Avatar Color Tag
            </label>
            <div className="flex items-center gap-2">
              {FRIEND_COLORS.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setSelectedColor(col)}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                    selectedColor === col ? 'scale-125 ring-2 ring-offset-2 ring-black dark:ring-white' : ''
                  }`}
                  style={{ backgroundColor: col }}
                >
                  {selectedColor === col && (
                    <span className="material-symbols-outlined text-white text-xs font-bold">
                      check
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="w-full py-3.5 px-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-black text-xs shadow-xl active:scale-95 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-base font-black">person_add</span>
              Save Friend
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
