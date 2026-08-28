/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';

// Always-visible layout shell — eager imports (small, always needed)
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { LoadingSpinner } from './components/LoadingSpinner';
import {
  DashboardSkeleton,
  InsightsSkeleton,
  ViewSkeleton,
} from './components/common/Skeletons';

// ─── Lazy-loaded route views ──────────────────────────────────────────────────
// Each view is split into its own async chunk by Vite/Rollup.
// They are only downloaded when the user navigates to that tab.
const DashboardView     = lazy(() => import('./components/views/DashboardView').then(m => ({ default: m.DashboardView })));
const InsightsView      = lazy(() => import('./components/views/InsightsView').then(m => ({ default: m.InsightsView })));
const BudgetView        = lazy(() => import('./components/views/BudgetView').then(m => ({ default: m.BudgetView })));
const ProfileView       = lazy(() => import('./components/views/ProfileView').then(m => ({ default: m.ProfileView })));
const SettingsView      = lazy(() => import('./components/views/SettingsView').then(m => ({ default: m.SettingsView })));
const OnboardingView    = lazy(() => import('./components/views/OnboardingView').then(m => ({ default: m.OnboardingView })));

// ─── Lazy-loaded modals ───────────────────────────────────────────────────────
// Modals are always rendered in the DOM (visibility controlled via context state),
// but their JS is only fetched after the main shell loads.
const AddTransactionModal    = lazy(() => import('./components/views/AddTransactionModal').then(m => ({ default: m.AddTransactionModal })));
const TransactionDetailModal = lazy(() => import('./components/modals/TransactionDetailModal').then(m => ({ default: m.TransactionDetailModal })));
const LinkAccountModal       = lazy(() => import('./components/modals/LinkAccountModal').then(m => ({ default: m.LinkAccountModal })));
const NotificationCenterModal = lazy(() => import('./components/modals/NotificationCenterModal').then(m => ({ default: m.NotificationCenterModal })));
const PinLockScreen          = lazy(() => import('./components/modals/PinLockScreen').then(m => ({ default: m.PinLockScreen })));

// ─────────────────────────────────────────────────────────────────────────────

const AppContent: React.FC = () => {
  const { activeTab, toastMessage, isOnboarded, settings, isAppUnlocked, isAuthLoading } = useApp();
  const [isLinkAccountOpen, setIsLinkAccountOpen] = useState(false);

  // If Firebase Auth is still resolving initial session, show sleek loading indicator
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 animate-fadeIn">
          <div className="w-12 h-12 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-xl">
            <span className="material-symbols-outlined text-2xl font-black">account_balance</span>
          </div>
          <span className="text-sm font-black text-black dark:text-white tracking-tight">Kanakku</span>
          <div className="w-5 h-5 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin mt-2" />
        </div>
      </div>
    );
  }

  // If PIN Lock is active and session is locked, show Lock Screen
  if (settings.isPinLockEnabled && !isAppUnlocked) {
    return (
      <>
        <Suspense fallback={<LoadingSpinner />}>
          <PinLockScreen />
        </Suspense>
        {toastMessage && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-110 px-5 py-2.5 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs md:text-sm font-bold shadow-2xl animate-bounce">
            {toastMessage}
          </div>
        )}
      </>
    );
  }

  // If first time user / not onboarded, show dedicated setup screen
  if (!isOnboarded) {
    return (
      <>
        <Suspense fallback={<LoadingSpinner />}>
          <OnboardingView />
        </Suspense>
        {toastMessage && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs md:text-sm font-bold shadow-2xl animate-bounce">
            {toastMessage}
          </div>
        )}
      </>
    );
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'insights':
        return <InsightsView />;
      case 'budget':
        return <BudgetView />;
      case 'profile':
        return <ProfileView onOpenLinkAccount={() => setIsLinkAccountOpen(true)} />;
      case 'settings':
        return <SettingsView />;
      case 'home':
      default:
        return <DashboardView />;
    }
  };

  const renderFallbackSkeleton = () => {
    switch (activeTab) {
      case 'insights':
        return <InsightsSkeleton />;
      case 'budget':
        return <ViewSkeleton title="Budget & Goals" />;
      case 'profile':
        return <ViewSkeleton title="Profile & Accounts" />;
      case 'settings':
        return <ViewSkeleton title="App Settings" />;
      case 'home':
      default:
        return <DashboardSkeleton />;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B0F17] text-black dark:text-white flex flex-col antialiased transition-colors duration-200">
      {/* Top Bar for Desktop & Mobile — always eager-loaded */}
      <div className="max-w-[1200px] mx-auto w-full px-4 md:px-8">
        <TopBar />
      </div>

      {/* Main Content View — Granular Skeleton boundary for lazy route views */}
      <div className="flex-1 max-w-[1200px] mx-auto w-full px-4 md:px-8">
        <Suspense fallback={renderFallbackSkeleton()}>
          {renderActiveView()}
        </Suspense>
      </div>

      {/* Bottom Nav / Desktop Action — always eager-loaded */}
      <BottomNav />

      {/* Modals — single Suspense boundary covers all modals together */}
      <Suspense fallback={null}>
        <AddTransactionModal />
        <TransactionDetailModal />
        <LinkAccountModal
          isOpen={isLinkAccountOpen}
          onClose={() => setIsLinkAccountOpen(false)}
        />
        <NotificationCenterModal />
      </Suspense>

      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs md:text-sm font-bold shadow-2xl animate-bounce">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
