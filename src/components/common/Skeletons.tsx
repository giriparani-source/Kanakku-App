/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

/**
 * Basic pulsing bar placeholder with light/dark theme support
 */
export const SkeletonBar: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`bg-neutral-200/80 dark:bg-[#1C263A] rounded-xl animate-pulse ${className}`}
  />
);

/**
 * Skeleton for Dashboard Summary Cards (FinancialOverviewCards)
 */
export const FinancialCardsSkeleton: React.FC = () => {
  return (
    <section className="grid grid-cols-2 md:grid-cols-5 gap-3.5 w-full">
      {/* Primary Net Worth card (spans 2 on mobile) */}
      <div className="col-span-2 md:col-span-1 p-5 rounded-3xl bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] flex flex-col justify-between min-h-[140px] shadow-sm animate-pulse">
        <div className="flex justify-between items-start mb-3">
          <div className="w-9 h-9 rounded-2xl bg-neutral-300 dark:bg-[#1C263A]" />
          <div className="w-16 h-5 rounded-full bg-neutral-300 dark:bg-[#1C263A]" />
        </div>
        <div className="space-y-2">
          <div className="w-20 h-3 rounded bg-neutral-300 dark:bg-[#1C263A]" />
          <div className="w-32 h-6 rounded-lg bg-neutral-300 dark:bg-[#243048]" />
        </div>
      </div>

      {/* 4 Standard cards */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-3xl bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] flex flex-col justify-between min-h-[140px] shadow-sm animate-pulse"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="w-9 h-9 rounded-2xl bg-neutral-300 dark:bg-[#1C263A]" />
            <div className="w-10 h-4 rounded-full bg-neutral-200 dark:bg-[#1C263A]" />
          </div>
          <div className="space-y-2">
            <div className="w-16 h-3 rounded bg-neutral-300 dark:bg-[#1C263A]" />
            <div className="w-24 h-6 rounded-lg bg-neutral-300 dark:bg-[#243048]" />
          </div>
        </div>
      ))}
    </section>
  );
};

/**
 * Skeleton for Real-Time Balances Grid
 */
export const BalancesGridSkeleton: React.FC = () => {
  return (
    <section className="space-y-3 w-full">
      <div className="flex justify-between items-center px-1">
        <div className="w-48 h-4 rounded bg-neutral-200 dark:bg-[#1C263A] animate-pulse" />
        <div className="w-24 h-4 rounded bg-neutral-200 dark:bg-[#1C263A] animate-pulse" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] flex flex-col justify-between min-h-[110px] animate-pulse"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-neutral-300 dark:bg-[#1C263A]" />
              <div className="w-12 h-4 rounded-full bg-neutral-200 dark:bg-[#1C263A]" />
            </div>
            <div className="space-y-1.5">
              <div className="w-16 h-3 rounded bg-neutral-200 dark:bg-[#1C263A]" />
              <div className="w-20 h-5 rounded bg-neutral-300 dark:bg-[#243048]" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

/**
 * Skeleton for Single Transaction Row
 */
export const TransactionRowSkeleton: React.FC = () => {
  return (
    <div className="flex items-center justify-between p-4 md:p-5 animate-pulse">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-11 h-11 rounded-2xl bg-neutral-300 dark:bg-[#1C263A] shrink-0" />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-28 md:w-36 h-4 rounded bg-neutral-300 dark:bg-[#243048]" />
            <div className="w-12 h-3.5 rounded-full bg-neutral-200 dark:bg-[#1C263A]" />
          </div>
          <div className="w-36 md:w-48 h-3 rounded bg-neutral-200 dark:bg-[#1C263A]" />
        </div>
      </div>
      <div className="space-y-1.5 text-right">
        <div className="w-20 h-5 rounded bg-neutral-300 dark:bg-[#243048] ml-auto" />
        <div className="w-12 h-2.5 rounded bg-neutral-200 dark:bg-[#1C263A] ml-auto" />
      </div>
    </div>
  );
};

/**
 * Skeleton for Activity Stream / Transaction List
 */
export const TransactionListSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <section className="w-full space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-32 h-6 rounded-lg bg-neutral-300 dark:bg-[#1C263A] animate-pulse" />
          <div className="w-8 h-5 rounded-full bg-neutral-200 dark:bg-[#1C263A] animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-8 rounded-full bg-neutral-200 dark:bg-[#1C263A] animate-pulse" />
          <div className="w-24 h-8 rounded-full bg-neutral-200 dark:bg-[#1C263A] animate-pulse" />
          <div className="w-20 h-8 rounded-full bg-neutral-200 dark:bg-[#1C263A] animate-pulse" />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5 px-1">
        <div className="w-full sm:flex-1 h-10 rounded-2xl bg-neutral-200/80 dark:bg-[#141B2A] animate-pulse" />
        <div className="flex gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-16 h-10 rounded-xl bg-neutral-200/80 dark:bg-[#141B2A] animate-pulse" />
          ))}
        </div>
      </div>

      {/* Rows Container */}
      <div className="bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-[2rem] overflow-hidden divide-y divide-neutral-200 dark:divide-[#243048] shadow-sm">
        {Array.from({ length: rows }).map((_, i) => (
          <TransactionRowSkeleton key={i} />
        ))}
      </div>
    </section>
  );
};

/**
 * Skeleton for Pro Analytics Dual Charts (Monthly Trend + Income vs Expense)
 */
export const AnalyticsChartsSkeleton: React.FC = () => {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      {/* Chart 1: Line Chart Skeleton */}
      <div className="bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl p-6 shadow-sm flex flex-col gap-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="w-40 h-5 rounded bg-neutral-300 dark:bg-[#243048]" />
            <div className="w-52 h-3 rounded bg-neutral-200 dark:bg-[#1C263A]" />
          </div>
          <div className="space-y-1">
            <div className="w-16 h-3 rounded bg-neutral-200 dark:bg-[#1C263A]" />
            <div className="w-16 h-3 rounded bg-neutral-200 dark:bg-[#1C263A]" />
          </div>
        </div>

        {/* SVG Graphic area placeholder */}
        <div className="w-full h-36 rounded-2xl bg-neutral-200/70 dark:bg-[#1C263A]/70 flex items-center justify-center p-4">
          <div className="w-full h-full border-b border-neutral-300 dark:border-[#2E3C56] flex items-end justify-between px-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-8 h-2 rounded bg-neutral-300 dark:bg-[#243048]" />
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#1C263A] rounded-2xl p-3 text-center space-y-1">
              <div className="w-14 h-4 rounded bg-neutral-200 dark:bg-[#243048] mx-auto" />
              <div className="w-10 h-2.5 rounded bg-neutral-100 dark:bg-[#141B2A] mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Chart 2: Bar Chart Skeleton */}
      <div className="bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl p-6 shadow-sm flex flex-col gap-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="w-36 h-5 rounded bg-neutral-300 dark:bg-[#243048]" />
            <div className="w-48 h-3 rounded bg-neutral-200 dark:bg-[#1C263A]" />
          </div>
          <div className="flex gap-3">
            <div className="w-12 h-3.5 rounded-full bg-neutral-200 dark:bg-[#1C263A]" />
            <div className="w-12 h-3.5 rounded-full bg-neutral-200 dark:bg-[#1C263A]" />
          </div>
        </div>

        {/* Month preview pill */}
        <div className="w-full h-9 rounded-2xl bg-white dark:bg-[#1C263A] p-2" />

        {/* Bar chart vertical placeholders */}
        <div className="w-full h-36 flex items-end justify-between px-4 pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-1 items-end">
              <div
                className="w-3 md:w-4 rounded-t bg-neutral-300 dark:bg-[#243048]"
                style={{ height: `${30 + (i % 3) * 25}%` }}
              />
              <div
                className="w-3 md:w-4 rounded-t bg-neutral-200 dark:bg-[#1C263A]"
                style={{ height: `${20 + (i % 4) * 20}%` }}
              />
            </div>
          ))}
        </div>

        {/* Savings rate footer */}
        <div className="w-full h-12 rounded-2xl bg-white dark:bg-[#1C263A]" />
      </div>
    </section>
  );
};

/**
 * Full Dashboard Skeleton (used as Suspense fallback for DashboardView)
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <main className="flex-1 flex flex-col gap-6 md:gap-8 max-w-4xl mx-auto w-full pb-36 md:pb-16 animate-fadeIn">
      {/* 1. Summary Cards */}
      <FinancialCardsSkeleton />

      {/* 2. Real-Time Balances Grid */}
      <BalancesGridSkeleton />

      {/* 3. Pro Analytics Charts */}
      <section className="space-y-3">
        <div className="w-36 h-4 rounded bg-neutral-200 dark:bg-[#1C263A] animate-pulse" />
        <AnalyticsChartsSkeleton />
      </section>

      {/* 4. Activity Stream */}
      <TransactionListSkeleton rows={5} />
    </main>
  );
};

/**
 * Full Insights View Skeleton (used as Suspense fallback for InsightsView)
 */
export const InsightsSkeleton: React.FC = () => {
  return (
    <main className="flex-grow w-full max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col gap-6 md:gap-8 pb-28 md:pb-12 animate-fadeIn">
      {/* Health Score banner skeleton */}
      <div className="w-full h-28 rounded-3xl bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] animate-pulse" />

      {/* Header and timeframe pills */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="w-48 h-7 rounded bg-neutral-300 dark:bg-[#243048] animate-pulse" />
          <div className="w-64 h-3.5 rounded bg-neutral-200 dark:bg-[#1C263A] animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="w-32 h-8 rounded-full bg-neutral-200 dark:bg-[#1C263A] animate-pulse" />
          <div className="w-24 h-8 rounded-xl bg-neutral-200 dark:bg-[#1C263A] animate-pulse" />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="w-full h-80 rounded-3xl bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] animate-pulse" />
        </div>
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="w-full h-80 rounded-3xl bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] animate-pulse" />
        </div>
      </div>
    </main>
  );
};

/**
 * Generic View Skeleton fallback for other tabs (Budget, Profile, Settings)
 */
export const ViewSkeleton: React.FC<{ title?: string }> = ({ title = 'Loading' }) => {
  return (
    <main className="flex-grow w-full max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col gap-6 pb-28 md:pb-12 animate-fadeIn">
      <div className="space-y-2">
        <div className="w-40 h-7 rounded bg-neutral-300 dark:bg-[#243048] animate-pulse" />
        <div className="w-60 h-3.5 rounded bg-neutral-200 dark:bg-[#1C263A] animate-pulse" />
      </div>
      <div className="space-y-4">
        <div className="w-full h-40 rounded-3xl bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] animate-pulse" />
        <div className="w-full h-64 rounded-3xl bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] animate-pulse" />
      </div>
    </main>
  );
};
