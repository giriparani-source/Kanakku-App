/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/views/DashboardView';
import { InsightsView } from './components/views/InsightsView';
import { BudgetView } from './components/views/BudgetView';
import { ProfileView } from './components/views/ProfileView';
import { SettingsView } from './components/views/SettingsView';
import { AddTransactionModal } from './components/views/AddTransactionModal';
import { TransactionDetailModal } from './components/modals/TransactionDetailModal';
import { LinkAccountModal } from './components/modals/LinkAccountModal';
import { NotificationCenterModal } from './components/modals/NotificationCenterModal';
import { PinLockScreen } from './components/modals/PinLockScreen';
import { OnboardingView } from './components/views/OnboardingView';

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
        <PinLockScreen />
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
        <OnboardingView />
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

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B0F17] text-black dark:text-white flex flex-col antialiased transition-colors duration-200">
      {/* Top Bar for Desktop & Mobile */}
      <div className="max-w-[1200px] mx-auto w-full px-4 md:px-8">
        <TopBar />
      </div>

      {/* Main Content View */}
      <div className="flex-1 max-w-[1200px] mx-auto w-full px-4 md:px-8">
        {renderActiveView()}
      </div>

      {/* Bottom Nav / Desktop Action */}
      <BottomNav />

      {/* Modals */}
      <AddTransactionModal />
      <TransactionDetailModal />
      <LinkAccountModal
        isOpen={isLinkAccountOpen}
        onClose={() => setIsLinkAccountOpen(false)}
      />
      <NotificationCenterModal />

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
