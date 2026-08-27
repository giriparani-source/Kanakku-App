/**
 * SmartAlertsWidget.tsx
 * Real-time, rule-based smart financial alerts for Kanakku
 * Computed purely from existing AppContext data — no new API calls
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ExpenseTransaction } from '../../types';

interface Alert {
  id: string;
  type: 'danger' | 'warning' | 'success' | 'info';
  icon: string;
  title: string;
  description: string;
  priority: number; // lower = more urgent
}

const TYPE_STYLES: Record<Alert['type'], { border: string; bg: string; iconBg: string; iconColor: string; badge: string }> = {
  danger:  { border: 'border-l-[#FF2D55]', bg: 'bg-rose-50 dark:bg-rose-950/30', iconBg: 'bg-rose-100 dark:bg-rose-900/50',   iconColor: 'text-[#FF2D55]', badge: 'bg-rose-100 dark:bg-rose-900/60 text-[#FF2D55]' },
  warning: { border: 'border-l-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30', iconBg: 'bg-amber-100 dark:bg-amber-900/50', iconColor: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-600' },
  success: { border: 'border-l-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', iconBg: 'bg-emerald-100 dark:bg-emerald-900/50', iconColor: 'text-emerald-600', badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600' },
  info:    { border: 'border-l-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', iconBg: 'bg-blue-100 dark:bg-blue-900/50', iconColor: 'text-blue-600 dark:text-blue-400', badge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-600' },
};

export const SmartAlertsWidget: React.FC = () => {
  const {
    transactions,
    budgets,
    locations,
    locationBalances,
    totalReceived,
    totalExpenses,
    needAmount,
    wantAmount,
    formatMoney,
  } = useApp();

  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const alerts = useMemo<Alert[]>(() => {
    const result: Alert[] = [];
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const expenses = transactions.filter((t): t is ExpenseTransaction => t.type === 'expense');

    // ── Rule 1: Budget Overspending ──────────────────────────────────────────
    const expByCategory: Record<string, number> = {};
    expenses.forEach((t) => {
      const c = t.category || 'Other Expenses';
      expByCategory[c] = (expByCategory[c] || 0) + t.amount;
    });

    budgets.forEach((b) => {
      if (b.limit <= 0) return;
      const spent = expByCategory[b.category] || 0;
      const pct = (spent / b.limit) * 100;
      if (pct >= 100) {
        result.push({
          id: `budget-over-${b.category}`,
          type: 'danger',
          icon: 'warning',
          title: `${b.category} Budget Exceeded!`,
          description: `You've spent ${formatMoney(spent)} — ${Math.round(pct - 100)}% over your ${formatMoney(b.limit)} limit.`,
          priority: 1,
        });
      } else if (pct >= 90) {
        result.push({
          id: `budget-near-${b.category}`,
          type: 'warning',
          icon: 'trending_up',
          title: `${b.category} Near Limit`,
          description: `${Math.round(pct)}% of ${formatMoney(b.limit)} budget used. ${formatMoney(b.limit - spent)} remaining.`,
          priority: 2,
        });
      }
    });

    // ── Rule 2: Need/Want Imbalance ──────────────────────────────────────────
    const totalExp = needAmount + wantAmount;
    if (totalExp > 0) {
      const wantPct = Math.round((wantAmount / totalExp) * 100);
      if (wantPct > 40) {
        result.push({
          id: 'need-want-imbalance',
          type: 'warning',
          icon: 'psychology',
          title: 'High "Want" Spending',
          description: `${wantPct}% of expenses are lifestyle wants. The 50/30/20 rule recommends keeping it ≤30%.`,
          priority: 3,
        });
      }
    }

    // ── Rule 3: Low Balance Warning ──────────────────────────────────────────
    locations.forEach((loc) => {
      if (loc.isSavings) return;
      const balance = locationBalances[loc.id] ?? loc.initialBalance;
      if (balance < 1000 && balance >= 0) {
        result.push({
          id: `low-balance-${loc.id}`,
          type: 'danger',
          icon: 'account_balance_wallet',
          title: `Low Balance: ${loc.name}`,
          description: `Only ${formatMoney(balance)} left in ${loc.name}. Consider topping up soon.`,
          priority: 2,
        });
      }
    });

    // ── Rule 4: Savings Milestones ───────────────────────────────────────────
    const netSavings = totalReceived - totalExpenses;
    const milestones = [100000, 50000, 10000];
    for (const m of milestones) {
      if (netSavings >= m) {
        result.push({
          id: `milestone-${m}`,
          type: 'success',
          icon: 'emoji_events',
          title: `Savings Milestone Reached! 🎉`,
          description: `Amazing! Your net savings crossed ${formatMoney(m)}. Keep it up!`,
          priority: 4,
        });
        break; // only show highest milestone
      }
    }

    // ── Rule 5: Positive Cash Flow Streak ───────────────────────────────────
    const monthlyMap: Record<string, { income: number; expense: number }> = {};
    transactions.forEach((t) => {
      const d = new Date(t.timestamp || now);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!monthlyMap[key]) monthlyMap[key] = { income: 0, expense: 0 };
      if (t.type === 'income') monthlyMap[key].income += t.amount;
      else if (t.type === 'expense') monthlyMap[key].expense += t.amount;
    });

    // Check last 3 months for positive streak
    let streakCount = 0;
    for (let i = 0; i < 3; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const m = monthlyMap[key];
      if (m && m.income > m.expense) streakCount++;
      else break;
    }
    if (streakCount >= 3) {
      result.push({
        id: 'positive-streak',
        type: 'success',
        icon: 'local_fire_department',
        title: '3-Month Positive Streak! 🏆',
        description: 'Income exceeded expenses for 3 consecutive months. Excellent financial discipline!',
        priority: 5,
      });
    }

    // ── Rule 6: No Transaction Nudge ─────────────────────────────────────────
    const recentTx = transactions.filter((t) => (t.timestamp || 0) >= sevenDaysAgo);
    if (transactions.length > 0 && recentTx.length === 0) {
      result.push({
        id: 'no-log-nudge',
        type: 'info',
        icon: 'edit_note',
        title: 'No Activity This Week',
        description: "You haven't logged any transactions in 7 days. Stay consistent for accurate insights!",
        priority: 6,
      });
    }

    // ── Rule 7: Negative Net Flow ────────────────────────────────────────────
    if (totalReceived > 0 && totalExpenses > totalReceived) {
      result.push({
        id: 'negative-flow',
        type: 'danger',
        icon: 'trending_down',
        title: 'Spending Exceeds Income',
        description: `Expenses are ${formatMoney(totalExpenses - totalReceived)} more than income. Review your budget immediately.`,
        priority: 1,
      });
    }

    return result.sort((a, b) => a.priority - b.priority);
  }, [transactions, budgets, locations, locationBalances, totalReceived, totalExpenses, needAmount, wantAmount, formatMoney]);

  const visibleAlerts = alerts.filter((a) => !dismissed.has(a.id));

  const dismissAlert = (id: string) => {
    setDismissed((prev) => new Set([...prev, id]));
  };

  if (visibleAlerts.length === 0) {
    return (
      <section className="w-full">
        <div className="flex items-center gap-2 px-1 mb-2">
          <span className="material-symbols-outlined text-base text-emerald-500">verified</span>
          <h2 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">Smart Alerts</h2>
        </div>
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
          <span className="material-symbols-outlined text-emerald-500 text-xl">check_circle</span>
          <p className="text-xs font-black text-emerald-700 dark:text-emerald-400">
            All clear — you're on track! No alerts right now. 🎯
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-amber-500">notifications_active</span>
          <h2 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">Smart Alerts</h2>
          <span className="px-2 py-0.5 rounded-full bg-[#FF2D55] text-white text-[10px] font-black">
            {visibleAlerts.length}
          </span>
        </div>
        {visibleAlerts.length > 1 && (
          <button
            type="button"
            onClick={() => setDismissed(new Set(alerts.map((a) => a.id)))}
            className="text-[10px] font-black text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
          >
            Dismiss All
          </button>
        )}
      </div>

      {/* Alert Cards — Horizontal scroll on mobile, vertical stack on desktop */}
      <div className="flex gap-3 overflow-x-auto pb-1 md:pb-0 md:flex-col md:overflow-x-visible scrollbar-hide">
        {visibleAlerts.map((alert) => {
          const s = TYPE_STYLES[alert.type];
          return (
            <div
              key={alert.id}
              className={`
                flex-shrink-0 w-72 md:w-full
                flex items-start gap-3
                p-4 rounded-2xl border-l-4 border border-transparent
                ${s.border} ${s.bg}
                shadow-sm transition-all duration-300
                animate-fadeIn
              `}
            >
              {/* Icon */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${s.iconBg}`}>
                <span className={`material-symbols-outlined text-[18px] font-black ${s.iconColor}`}>
                  {alert.icon}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-black text-black dark:text-white leading-tight mb-0.5`}>
                  {alert.title}
                </p>
                <p className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-2">
                  {alert.description}
                </p>
              </div>

              {/* Dismiss */}
              <button
                type="button"
                onClick={() => dismissAlert(alert.id)}
                className="shrink-0 w-6 h-6 rounded-full bg-white/60 dark:bg-black/30 flex items-center justify-center hover:bg-white dark:hover:bg-black/50 transition-colors cursor-pointer ml-1"
                aria-label="Dismiss alert"
              >
                <span className="material-symbols-outlined text-sm text-neutral-500">close</span>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
