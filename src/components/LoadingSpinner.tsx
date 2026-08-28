/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

/**
 * LoadingSpinner — Branded Suspense fallback for lazy-loaded route views.
 * Matches the dark/light Kanakku design system with a pulsing logo + spinner.
 */
export const LoadingSpinner: React.FC = () => {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] w-full animate-fadeIn"
      role="status"
      aria-label="Loading…"
    >
      {/* Logo mark */}
      <div className="relative mb-4">
        <div className="w-14 h-14 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-xl">
          <span className="material-symbols-outlined text-2xl font-black">account_balance</span>
        </div>
        {/* Spinning ring around logo */}
        <div className="absolute -inset-1.5 rounded-[1.15rem] border-2 border-black/20 dark:border-white/20 border-t-black dark:border-t-white animate-spin" />
      </div>

      {/* App name */}
      <span className="text-sm font-black text-black dark:text-white tracking-tight mb-1">
        Kanakku
      </span>

      {/* Subtitle */}
      <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 tracking-wide">
        Loading view…
      </span>
    </div>
  );
};
