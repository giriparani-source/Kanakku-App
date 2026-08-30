import React from 'react';
import { useApp } from '../context/AppContext';

export const TopBar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    profile,
    notifications,
    setNotificationCenterOpen,
    setIsAutoSmsModalOpen,
    settings,
    updateSettings,
    cloudSyncStatus,
  } = useApp();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getTitle = () => {
    switch (activeTab) {
      case 'insights':
        return 'Insights';
      case 'split':
        return 'Split with Friends';
      case 'budget':
        return 'Budget & Envelopes';
      case 'profile':
        return 'Profile';
      case 'settings':
        return 'Settings';
      default:
        return 'Kanakku';
    }
  };

  const toggleDarkMode = () => {
    updateSettings({ darkMode: !settings.darkMode });
  };

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:flex justify-between items-center w-full top-0 sticky z-40 bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] h-18 my-4 rounded-3xl px-8 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('home')}
            className="text-left font-black text-2xl tracking-tight text-black dark:text-white hover:opacity-80 transition-opacity cursor-pointer"
          >
            Kanakku
          </button>

          {/* Cloud Sync Indicator */}
          <div
            title={cloudSyncStatus === 'synced' ? 'Connected to Firebase Firestore Cloud' : 'Syncing with Firestore...'}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56] text-[10px] font-black text-neutral-600 dark:text-neutral-300"
          >
            <span className={`w-2 h-2 rounded-full ${cloudSyncStatus === 'synced' ? 'bg-[#00C853] animate-pulse' : 'bg-[#FF9500] animate-spin'}`} />
            <span>{cloudSyncStatus === 'synced' ? 'Cloud Synced' : 'Syncing...'}</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="flex items-center gap-8">
          <button
            onClick={() => setActiveTab('home')}
            className={`text-sm transition-all pb-1 cursor-pointer ${
              activeTab === 'home'
                ? 'text-black dark:text-white font-black border-b-2 border-black dark:border-white'
                : 'text-neutral-600 dark:text-neutral-400 font-bold hover:text-black dark:hover:text-white'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`text-sm transition-all pb-1 cursor-pointer ${
              activeTab === 'insights'
                ? 'text-black dark:text-white font-black border-b-2 border-black dark:border-white'
                : 'text-neutral-600 dark:text-neutral-400 font-bold hover:text-black dark:hover:text-white'
            }`}
          >
            Insights
          </button>
          <button
            onClick={() => setActiveTab('split')}
            className={`text-sm transition-all pb-1 cursor-pointer ${
              activeTab === 'split'
                ? 'text-black dark:text-white font-black border-b-2 border-black dark:border-white'
                : 'text-neutral-600 dark:text-neutral-400 font-bold hover:text-black dark:hover:text-white'
            }`}
          >
            Split
          </button>
          <button
            onClick={() => setActiveTab('budget')}
            className={`text-sm transition-all pb-1 cursor-pointer ${
              activeTab === 'budget'
                ? 'text-black dark:text-white font-black border-b-2 border-black dark:border-white'
                : 'text-neutral-600 dark:text-neutral-400 font-bold hover:text-black dark:hover:text-white'
            }`}
          >
            Budget
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`text-sm transition-all pb-1 cursor-pointer ${
              activeTab === 'settings'
                ? 'text-black dark:text-white font-black border-b-2 border-black dark:border-white'
                : 'text-neutral-600 dark:text-neutral-400 font-bold hover:text-black dark:hover:text-white'
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`text-sm transition-all pb-1 cursor-pointer ${
              activeTab === 'profile'
                ? 'text-black dark:text-white font-black border-b-2 border-black dark:border-white'
                : 'text-neutral-600 dark:text-neutral-400 font-bold hover:text-black dark:hover:text-white'
            }`}
          >
            Profile
          </button>
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Quick Bank SMS Scanner Button */}
          <button
            onClick={() => setIsAutoSmsModalOpen(true)}
            aria-label="Bank SMS Scanner"
            title="Scan Bank SMS (1-Tap Add)"
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all text-xs font-black cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px] font-black">bolt</span>
            <span>Auto SMS</span>
          </button>

          {/* Quick Dark Mode Toggle Button in Header */}
          <button
            onClick={toggleDarkMode}
            aria-label="Toggle Dark Mode"
            title={settings.darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2.5 rounded-full bg-white dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56] hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-black dark:text-white cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">
              {settings.darkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          <button
            onClick={() => setNotificationCenterOpen(true)}
            aria-label="Notifications"
            className="relative p-2.5 rounded-full bg-white dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56] hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-black dark:text-white cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#FF2D55] rounded-full border-2 border-white dark:border-[#1C263A] animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-black/10 dark:border-white/20 shadow-sm hover:scale-105 transition-transform cursor-pointer"
          >
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      </header>

      {/* Mobile Top Header */}
      <div className="md:hidden flex justify-between items-center px-4 pt-4 pb-2 sticky top-0 z-40 bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-md border-b border-neutral-100 dark:border-[#1E2638] transition-colors">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden border border-neutral-200 dark:border-[#243048] shadow-sm active:scale-95 transition-transform cursor-pointer"
          >
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          </button>

          <span
            title="Cloud Synced"
            className="w-2 h-2 rounded-full bg-[#00C853] animate-pulse"
          />
        </div>

        <h1 className="font-black text-xl text-black dark:text-white tracking-tight">
          {getTitle()}
        </h1>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsAutoSmsModalOpen(true)}
            aria-label="Auto SMS Scanner"
            title="Scan Bank SMS"
            className="p-2 text-amber-500 rounded-full active:scale-95 transition-transform bg-amber-500/10 border border-amber-500/20 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px] font-black">bolt</span>
          </button>

          <button
            onClick={toggleDarkMode}
            aria-label="Toggle Dark Mode"
            className="p-2 text-black dark:text-white rounded-full active:scale-95 transition-transform bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">
              {settings.darkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          <button
            onClick={() => setNotificationCenterOpen(true)}
            aria-label="Notifications"
            className="relative p-2 text-black dark:text-white rounded-full active:scale-95 transition-transform bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#FF2D55] rounded-full border-2 border-white dark:border-[#141B2A]" />
            )}
          </button>
        </div>
      </div>
    </>
  );
};
