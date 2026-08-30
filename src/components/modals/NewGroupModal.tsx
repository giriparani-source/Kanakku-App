import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GROUP_ICONS = [
  { icon: 'groups', label: 'General' },
  { icon: 'beach_access', label: 'Trip' },
  { icon: 'apartment', label: 'Flat' },
  { icon: 'restaurant', label: 'Food' },
  { icon: 'flight', label: 'Travel' },
  { icon: 'local_bar', label: 'Party' },
  { icon: 'shopping_bag', label: 'Shopping' },
  { icon: 'directions_car', label: 'Drive' },
];

export const NewGroupModal: React.FC<NewGroupModalProps> = ({ isOpen, onClose }) => {
  const { splitFriends, addSplitGroup, showToast } = useApp();

  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('groups');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(['user']);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const toggleFriend = (friendId: string) => {
    if (selectedMemberIds.includes(friendId)) {
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== friendId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, friendId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter a group name');
      return;
    }
    if (selectedMemberIds.length < 2) {
      showToast('Select at least 1 friend to create a group');
      return;
    }

    setIsSaving(true);
    try {
      await addSplitGroup({
        name: name.trim(),
        icon: selectedIcon,
        color: '#06B6D4',
        memberIds: selectedMemberIds,
      });

      setName('');
      setSelectedMemberIds(['user']);
      onClose();
    } catch (err) {
      console.error('Error creating group:', err);
      showToast('Failed to create group');
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
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-black">
              <span className="material-symbols-outlined text-2xl">group_add</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-black dark:text-white">Create New Group</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Split shared expenses for trips, flats, or parties
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
              Group Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Goa Trip 🏖️, Flat 302 🏠, Office Lunch"
              className="w-full p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>

          {/* Icon Selector */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-neutral-500 block mb-1.5">
              Group Icon
            </label>
            <div className="grid grid-cols-4 gap-2">
              {GROUP_ICONS.map((item) => (
                <button
                  key={item.icon}
                  type="button"
                  onClick={() => setSelectedIcon(item.icon)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                    selectedIcon === item.icon
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  <span className="text-[10px]">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Members Checklist */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-neutral-500 block mb-1.5">
              Include Members
            </label>
            <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 space-y-2 max-h-48 overflow-y-auto">
              <div className="flex items-center gap-2.5 opacity-80">
                <input type="checkbox" checked disabled className="w-4 h-4 rounded text-blue-600" />
                <span className="text-xs font-bold text-black dark:text-white">You (Creator)</span>
              </div>

              {splitFriends.map((friend) => (
                <label
                  key={friend.id}
                  className="flex items-center gap-2.5 cursor-pointer py-1 border-t border-neutral-200/50 dark:border-neutral-800/50"
                >
                  <input
                    type="checkbox"
                    checked={selectedMemberIds.includes(friend.id)}
                    onChange={() => toggleFriend(friend.id)}
                    className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-black dark:text-white flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: friend.color || '#3B82F6' }}
                    />
                    {friend.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="w-full py-3.5 px-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-black text-xs shadow-xl active:scale-95 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-base font-black">group_add</span>
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
