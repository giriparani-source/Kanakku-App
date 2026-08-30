import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SplitFriend, SplitGroup, SplitExpense } from '../../types';

export const SplitView: React.FC = () => {
  const {
    splitFriends,
    splitGroups,
    splitExpenses,
    splitSettlements,
    friendBalances,
    totalYouAreOwed,
    totalYouOwe,
    netSplitBalance,
    setIsAddSplitExpenseOpen,
    setSettleUpModalData,
    setNewFriendModalOpen,
    setNewGroupModalOpen,
    deleteSplitExpense,
    deleteSplitFriend,
    deleteSplitGroup,
    formatMoney,
    getCurrencySymbol,
    profile,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'friends' | 'groups' | 'activity'>('friends');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // WhatsApp Share Helper
  const handleShareWhatsApp = (friend: SplitFriend, balance: number) => {
    const isOwed = balance > 0;
    const isDebt = balance < 0;

    let text = '';
    if (isOwed) {
      text = `👋 Hey ${friend.name}!\n\n📊 *Kanakku Bill Split Summary*\nAccording to our shared expenses, your pending balance is *${formatMoney(
        balance
      )}*.\n\n👉 You can UPI to: ${
        profile.phone ? `${profile.phone}@upi` : 'my UPI ID'
      }\n\nShared via Kanakku App ✨`;
    } else if (isDebt) {
      text = `👋 Hey ${friend.name}!\n\n📊 *Kanakku Bill Split Summary*\nI owe you *${formatMoney(
        Math.abs(balance)
      )}* for our shared expenses. Please share your UPI ID so I can settle it up!\n\nShared via Kanakku App ✨`;
    } else {
      text = `👋 Hey ${friend.name}!\n\nAll our shared expenses on Kanakku are completely settled up! 🎉\n\nShared via Kanakku App ✨`;
    }

    const whatsappUrl = `https://wa.me/${(friend.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
      text
    )}`;
    window.open(whatsappUrl, '_blank');
  };

  const getMemberName = (memberId: string): string => {
    if (memberId === 'user') return 'You';
    const friend = splitFriends.find((f) => f.id === memberId);
    return friend ? friend.name : 'Friend';
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl text-blue-500 font-black">
              call_split
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-black dark:text-white tracking-tight">
              Split with Friends
            </h1>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
              Kanakku Sharing
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Split trips, flat bills, and dinners with friends in 1-tap
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setNewFriendModalOpen(true)}
            className="py-2 px-3 rounded-xl bg-neutral-100 dark:bg-[#1C263A] hover:bg-neutral-200 dark:hover:bg-[#243048] text-black dark:text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            <span>+ Friend</span>
          </button>

          <button
            type="button"
            onClick={() => setNewGroupModalOpen(true)}
            className="py-2 px-3 rounded-xl bg-neutral-100 dark:bg-[#1C263A] hover:bg-neutral-200 dark:hover:bg-[#243048] text-black dark:text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">group_add</span>
            <span>+ Group</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddSplitExpenseOpen(true)}
            className="py-2 px-4 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-black shadow-lg hover:opacity-90 active:scale-95 transition cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base font-black">add</span>
            <span>Split Bill</span>
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total You are Owed */}
        <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
              You are Owed
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatMoney(totalYouAreOwed)}
            </span>
            <span className="text-[10px] font-bold text-neutral-500 block mt-0.5">
              From {Object.values(friendBalances).filter((b: number) => b > 0).length} friends
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl font-black">arrow_downward</span>
          </div>
        </div>

        {/* Total You Owe */}
        <div className="p-5 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
              You Owe
            </span>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {formatMoney(totalYouOwe)}
            </span>
            <span className="text-[10px] font-bold text-neutral-500 block mt-0.5">
              To {Object.values(friendBalances).filter((b: number) => b < 0).length} friends
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl font-black">arrow_upward</span>
          </div>
        </div>

        {/* Net Balance */}
        <div className="p-5 rounded-3xl bg-neutral-100 dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-neutral-500 block">
              Net Balance
            </span>
            <span
              className={`text-2xl font-black ${
                netSplitBalance > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : netSplitBalance < 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-neutral-500'
              }`}
            >
              {netSplitBalance > 0 ? `+${formatMoney(netSplitBalance)}` : formatMoney(netSplitBalance)}
            </span>
            <span className="text-[10px] font-bold text-neutral-500 block mt-0.5">
              {netSplitBalance > 0
                ? 'Overall in profit'
                : netSplitBalance < 0
                ? 'Overall in debt'
                : 'Completely settled'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-neutral-200 dark:bg-[#1C263A] text-black dark:text-white flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl font-black">scale</span>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex bg-neutral-100 dark:bg-[#141B2A] p-1.5 rounded-2xl border border-neutral-200 dark:border-[#243048] max-w-md">
        <button
          type="button"
          onClick={() => {
            setActiveTab('friends');
            setSelectedGroupId(null);
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'friends'
              ? 'bg-white dark:bg-[#243048] text-black dark:text-white shadow-sm'
              : 'text-neutral-500'
          }`}
        >
          <span className="material-symbols-outlined text-base">group</span>
          Friends ({splitFriends.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('groups')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'groups'
              ? 'bg-white dark:bg-[#243048] text-black dark:text-white shadow-sm'
              : 'text-neutral-500'
          }`}
        >
          <span className="material-symbols-outlined text-base">beach_access</span>
          Groups ({splitGroups.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'activity'
              ? 'bg-white dark:bg-[#243048] text-black dark:text-white shadow-sm'
              : 'text-neutral-500'
          }`}
        >
          <span className="material-symbols-outlined text-base">receipt_long</span>
          Activity ({splitExpenses.length})
        </button>
      </div>

      {/* TAB 1: FRIENDS LIST & BALANCES */}
      {activeTab === 'friends' && (
        <div className="space-y-3">
          {splitFriends.length === 0 ? (
            <div className="p-12 text-center bg-neutral-50 dark:bg-[#141B2A] rounded-3xl border border-neutral-200 dark:border-[#243048]">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-3xl">person_add</span>
              </div>
              <h3 className="text-sm font-black text-black dark:text-white">No Friends Added Yet</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                Add friends to start splitting restaurant bills, trips, or cab fares.
              </p>
              <button
                type="button"
                onClick={() => setNewFriendModalOpen(true)}
                className="mt-4 py-2 px-4 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-black cursor-pointer"
              >
                + Add First Friend
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {splitFriends.map((friend) => {
                const balance = friendBalances[friend.id] || 0;
                const isOwed = balance > 0;
                const isDebt = balance < 0;

                return (
                  <div
                    key={friend.id}
                    className="p-5 rounded-3xl bg-white dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] shadow-sm flex flex-col justify-between gap-4 transition-all hover:border-neutral-300 dark:hover:border-neutral-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-sm"
                          style={{ backgroundColor: friend.color || '#3B82F6' }}
                        >
                          {friend.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-black dark:text-white flex items-center gap-1.5">
                            {friend.name}
                          </h3>
                          <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-bold mt-0.5">
                            {friend.phone && <span>{friend.phone}</span>}
                            {friend.phone && friend.upiId && <span>•</span>}
                            {friend.upiId && <span className="text-purple-400">{friend.upiId}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Balance Badge */}
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                          {isOwed ? 'Owes You' : isDebt ? 'You Owe' : 'Status'}
                        </span>
                        <span
                          className={`text-base font-black ${
                            isOwed
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isDebt
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-neutral-400'
                          }`}
                        >
                          {balance !== 0 ? formatMoney(Math.abs(balance)) : 'Settled Up'}
                        </span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
                      <div className="flex items-center gap-2">
                        {/* WhatsApp Share Button */}
                        <button
                          type="button"
                          onClick={() => handleShareWhatsApp(friend, balance)}
                          className="py-1.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center gap-1.5 transition cursor-pointer"
                          title="Share balance on WhatsApp"
                        >
                          <span className="material-symbols-outlined text-sm">share</span>
                          <span>WhatsApp</span>
                        </button>

                        {/* Delete Friend */}
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Remove ${friend.name}?`)) {
                              deleteSplitFriend(friend.id);
                            }
                          }}
                          className="p-1.5 rounded-xl text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                          title="Remove Friend"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>

                      {/* Settle Up Button */}
                      {balance !== 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setSettleUpModalData({
                              friendId: friend.id,
                              defaultAmount: Math.abs(balance),
                            })
                          }
                          className="py-1.5 px-4 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-black shadow-md hover:opacity-90 active:scale-95 transition cursor-pointer flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm font-black">
                            handshake
                          </span>
                          <span>Settle Up</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GROUPS LIST */}
      {activeTab === 'groups' && (
        <div className="space-y-4">
          {splitGroups.length === 0 ? (
            <div className="p-12 text-center bg-neutral-50 dark:bg-[#141B2A] rounded-3xl border border-neutral-200 dark:border-[#243048]">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-3xl">beach_access</span>
              </div>
              <h3 className="text-sm font-black text-black dark:text-white">No Groups Created Yet</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                Create groups for Goa trips, Roommate rent, or Office lunches to split expenses together.
              </p>
              <button
                type="button"
                onClick={() => setNewGroupModalOpen(true)}
                className="mt-4 py-2 px-4 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-black cursor-pointer"
              >
                + Create First Group
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {splitGroups.map((group) => {
                const groupExpenses = splitExpenses.filter((e) => e.groupId === group.id);
                const totalGroupSpend = groupExpenses.reduce((s, e) => s + e.totalAmount, 0);

                return (
                  <div
                    key={group.id}
                    className="p-5 rounded-3xl bg-white dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] shadow-sm flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-black">
                            <span className="material-symbols-outlined text-2xl font-black">
                              {group.icon || 'groups'}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-base font-black text-black dark:text-white">
                              {group.name}
                            </h3>
                            <p className="text-xs text-neutral-400 font-bold">
                              {group.memberIds.length} Members • {groupExpenses.length} Shared Expenses
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                            Group Total Spend
                          </span>
                          <span className="text-lg font-black text-black dark:text-white">
                            {formatMoney(totalGroupSpend)}
                          </span>
                        </div>
                      </div>

                      {/* Member Avatar Chips */}
                      <div className="flex items-center gap-1.5 mt-4 flex-wrap">
                        {group.memberIds.map((mId) => (
                          <span
                            key={mId}
                            className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">
                              {mId === 'user' ? 'account_circle' : 'person'}
                            </span>
                            {getMemberName(mId)}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Group Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete group "${group.name}"?`)) {
                            deleteSplitGroup(group.id);
                          }
                        }}
                        className="p-1.5 rounded-xl text-neutral-400 hover:text-rose-500 transition cursor-pointer"
                        title="Delete Group"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsAddSplitExpenseOpen(true)}
                        className="py-1.5 px-3 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-black transition cursor-pointer flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm font-black">add</span>
                        <span>Add Expense to Group</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ACTIVITY / EXPENSES FEED */}
      {activeTab === 'activity' && (
        <div className="space-y-3">
          {splitExpenses.length === 0 ? (
            <div className="p-12 text-center bg-neutral-50 dark:bg-[#141B2A] rounded-3xl border border-neutral-200 dark:border-[#243048]">
              <span className="material-symbols-outlined text-4xl text-neutral-400 mb-2">
                receipt_long
              </span>
              <h3 className="text-sm font-black text-black dark:text-white">No Shared Expenses</h3>
              <p className="text-xs text-neutral-500 mt-1">
                When you split bills with friends, the full activity history will appear here.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden shadow-sm">
              {splitExpenses.map((exp) => {
                const group = splitGroups.find((g) => g.id === exp.groupId);
                const isPaidByUser = exp.paidBy === 'user';
                const userShare = exp.shares.find((s) => s.memberId === 'user');

                return (
                  <div key={exp.id} className="p-4 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-black mt-0.5">
                          <span className="material-symbols-outlined text-xl">call_split</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-black dark:text-white">
                              {exp.description}
                            </h4>
                            {group && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                                {group.name}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-neutral-500 mt-0.5">
                            Paid by <span className="font-bold text-black dark:text-white">{getMemberName(exp.paidBy)}</span> • {exp.date}
                          </p>

                          {/* Share breakdown chips */}
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            {exp.shares.map((sh) => (
                              <span
                                key={sh.memberId}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                              >
                                {getMemberName(sh.memberId)}: {formatMoney(sh.amount)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Total & Delete */}
                      <div className="text-right">
                        <span className="text-base font-black text-black dark:text-white block">
                          {formatMoney(exp.totalAmount)}
                        </span>
                        <span
                          className={`text-[11px] font-bold block ${
                            isPaidByUser
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isPaidByUser
                            ? `You lent ${formatMoney(exp.totalAmount - (userShare?.amount || 0))}`
                            : `You borrowed ${formatMoney(userShare?.amount || 0)}`}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete expense "${exp.description}"?`)) {
                              deleteSplitExpense(exp.id);
                            }
                          }}
                          className="text-[11px] text-neutral-400 hover:text-rose-500 font-bold mt-1 inline-block"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
