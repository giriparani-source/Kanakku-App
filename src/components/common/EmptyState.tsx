/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface EmptyStateProps {
  variant?: 'transactions' | 'insights' | 'search' | 'generic';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'transactions',
  title,
  description,
  actionLabel,
  onAction,
  actionIcon = 'add',
  className = '',
}) => {
  // Defaults based on variant
  const defaultTitle =
    variant === 'transactions'
      ? 'No Transactions Yet'
      : variant === 'insights'
      ? 'No Spending Data Yet'
      : variant === 'search'
      ? 'No Results Found'
      : 'Nothing to Display';

  const defaultDescription =
    variant === 'transactions'
      ? 'No transactions yet. Click the + button to add your first expense!'
      : variant === 'insights'
      ? 'Start logging your income & expenses to unlock real-time category distribution, doughnut charts, and monthly comparison trends.'
      : variant === 'search'
      ? 'No transactions match your current search or filter. Try adjusting your query.'
      : 'Start tracking your personal finances to see your activity stream and analytics.';

  const defaultActionLabel =
    variant === 'transactions'
      ? 'Add First Transaction'
      : variant === 'insights'
      ? 'Record First Transaction'
      : variant === 'search'
      ? 'Clear Filters'
      : 'Add Transaction';

  const resolvedTitle = title || defaultTitle;
  const resolvedDescription = description || defaultDescription;
  const resolvedActionLabel = actionLabel || defaultActionLabel;

  return (
    <div
      className={`bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-[2rem] p-8 md:p-12 text-center shadow-sm flex flex-col items-center justify-center space-y-5 animate-fadeIn ${className}`}
    >
      {/* ── Visual SVG Illustration ────────────────────────────────────────── */}
      <div className="relative flex items-center justify-center">
        {variant === 'transactions' && (
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Ambient background glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/10 via-emerald-500/10 to-rose-500/10 dark:from-blue-500/20 dark:via-emerald-500/20 dark:to-rose-500/20 blur-xl" />

            {/* Custom SVG Wallet & Receipt Graphic */}
            <svg
              className="w-24 h-24 relative z-10"
              viewBox="0 0 96 96"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Receipt backdrop */}
              <rect
                x="34"
                y="12"
                width="34"
                height="46"
                rx="6"
                className="fill-white dark:fill-[#1C263A] stroke-neutral-300 dark:stroke-[#2E3C56]"
                strokeWidth="2"
                transform="rotate(6 51 35)"
              />
              <line
                x1="41"
                y1="24"
                x2="59"
                y2="26"
                className="stroke-neutral-300 dark:stroke-[#2E3C56]"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="40"
                y1="32"
                x2="54"
                y2="34"
                className="stroke-neutral-300 dark:stroke-[#2E3C56]"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* Modern Wallet */}
              <rect
                x="14"
                y="34"
                width="64"
                height="44"
                rx="12"
                className="fill-white dark:fill-[#1C263A] stroke-black dark:stroke-white"
                strokeWidth="2.5"
              />
              {/* Wallet flap line */}
              <path
                d="M14 46C24 46 28 42 42 42C56 42 60 46 78 46"
                className="stroke-neutral-300 dark:stroke-[#2E3C56]"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* Wallet clasp */}
              <rect
                x="60"
                y="50"
                width="20"
                height="14"
                rx="5"
                className="fill-black dark:fill-white"
              />
              <circle cx="67" cy="57" r="2.5" className="fill-white dark:fill-black" />

              {/* Coin with INR / Coin badge */}
              <circle
                cx="30"
                cy="28"
                r="13"
                className="fill-emerald-500 stroke-white dark:stroke-[#0B0F17]"
                strokeWidth="2.5"
              />
              <text
                x="30"
                y="33"
                textAnchor="middle"
                fontSize="12"
                fontWeight="900"
                fill="white"
                fontFamily="sans-serif"
              >
                ₹
              </text>

              {/* Sparkle badge */}
              <circle cx="76" cy="22" r="3" className="fill-blue-500 animate-ping" opacity="0.75" />
              <circle cx="76" cy="22" r="3" className="fill-blue-500" />
            </svg>
          </div>
        )}

        {variant === 'insights' && (
          <div className="relative w-28 h-28 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500/10 via-blue-500/10 to-emerald-500/10 dark:from-purple-500/20 dark:via-blue-500/20 dark:to-emerald-500/20 blur-xl" />

            <svg
              className="w-24 h-24 relative z-10"
              viewBox="0 0 96 96"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Analytics Card Base */}
              <rect
                x="14"
                y="18"
                width="68"
                height="60"
                rx="14"
                className="fill-white dark:fill-[#1C263A] stroke-black dark:stroke-white"
                strokeWidth="2.5"
              />

              {/* Chart Bars */}
              <rect
                x="26"
                y="52"
                width="8"
                height="16"
                rx="3"
                className="fill-blue-500"
              />
              <rect
                x="38"
                y="40"
                width="8"
                height="28"
                rx="3"
                className="fill-emerald-500"
              />
              <rect
                x="50"
                y="46"
                width="8"
                height="22"
                rx="3"
                className="fill-rose-500"
              />
              <rect
                x="62"
                y="32"
                width="8"
                height="36"
                rx="3"
                className="fill-[#0066FF]"
              />

              {/* Trend line */}
              <path
                d="M28 48L42 34L54 40L66 26"
                className="stroke-amber-400"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="66" cy="26" r="3" className="fill-amber-400" />
            </svg>
          </div>
        )}

        {variant === 'search' && (
          <div className="relative w-24 h-24 flex items-center justify-center">
            <div className="w-16 h-16 rounded-3xl bg-white dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56] flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-3xl text-neutral-400 dark:text-neutral-500 font-bold">
                search_off
              </span>
            </div>
          </div>
        )}

        {variant === 'generic' && (
          <div className="relative w-24 h-24 flex items-center justify-center">
            <div className="w-16 h-16 rounded-3xl bg-white dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56] flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-3xl text-black dark:text-white font-bold">
                receipt_long
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="max-w-md space-y-2">
        <h3 className="text-lg md:text-xl font-black text-black dark:text-white tracking-tight">
          {resolvedTitle}
        </h3>
        <p className="text-xs md:text-sm font-bold text-neutral-600 dark:text-neutral-400 leading-relaxed">
          {resolvedDescription}
        </p>
      </div>

      {/* ── Action Button ─────────────────────────────────────────────────── */}
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-6 py-3 rounded-2xl bg-black dark:bg-white text-white dark:text-black text-xs md:text-sm font-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all shadow-md active:scale-98 cursor-pointer inline-flex items-center gap-2"
        >
          {actionIcon && (
            <span className="material-symbols-outlined text-base font-black">
              {actionIcon}
            </span>
          )}
          <span>{resolvedActionLabel}</span>
        </button>
      )}
    </div>
  );
};
