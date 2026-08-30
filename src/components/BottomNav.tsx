import React from 'react';
import { useApp } from '../context/AppContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, setIsAddModalOpen } = useApp();

  return (
    <>
      {/* Mobile Floating Bottom Bar */}
      <nav className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-50 flex justify-around items-center h-18 px-4 bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-[2.5rem] shadow-xl transition-colors">
        {/* Home */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center w-12 py-1 transition-transform duration-150 active:scale-90 cursor-pointer ${
            activeTab === 'home'
              ? 'text-[#0066FF] font-black'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white font-bold'
          }`}
          aria-label="Home"
        >
          <span
            className={`material-symbols-outlined text-[24px] ${
              activeTab === 'home' ? 'fill text-[#0066FF]' : ''
            }`}
          >
            home
          </span>
          <span className="text-[10px] font-bold mt-0.5">Home</span>
        </button>

        {/* Insights */}
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex flex-col items-center justify-center w-12 py-1 transition-transform duration-150 active:scale-90 cursor-pointer ${
            activeTab === 'insights'
              ? 'text-[#0066FF] font-black'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white font-bold'
          }`}
          aria-label="Insights"
        >
          <span
            className={`material-symbols-outlined text-[24px] ${
              activeTab === 'insights' ? 'fill text-[#0066FF]' : ''
            }`}
          >
            query_stats
          </span>
          <span className="text-[10px] font-bold mt-0.5">Insights</span>
        </button>

        {/* Center Add Button */}
        <div className="flex items-center justify-center -mt-6">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-13 h-13 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-200 shadow-xl shadow-black/30 border-2 border-white dark:border-[#141B2A] cursor-pointer"
            aria-label="Add Transaction"
          >
            <span className="material-symbols-outlined text-2xl font-black">add</span>
          </button>
        </div>



        {/* Budget */}
        <button
          onClick={() => setActiveTab('budget')}
          className={`flex flex-col items-center justify-center w-11 py-1 transition-transform duration-150 active:scale-90 cursor-pointer ${
            activeTab === 'budget'
              ? 'text-[#0066FF] font-black'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white font-bold'
          }`}
          aria-label="Budget"
        >
          <span
            className={`material-symbols-outlined text-[24px] ${
              activeTab === 'budget' ? 'fill text-[#0066FF]' : ''
            }`}
          >
            account_balance_wallet
          </span>
          <span className="text-[10px] font-bold mt-0.5">Budget</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center w-12 py-1 transition-transform duration-150 active:scale-90 cursor-pointer ${
            activeTab === 'profile' || activeTab === 'settings'
              ? 'text-[#0066FF] font-black'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white font-bold'
          }`}
          aria-label="Profile"
        >
          <span
            className={`material-symbols-outlined text-[24px] ${
              activeTab === 'profile' || activeTab === 'settings' ? 'fill text-[#0066FF]' : ''
            }`}
          >
            person
          </span>
          <span className="text-[10px] font-bold mt-0.5">Profile</span>
        </button>
      </nav>

      {/* Desktop Floating Action Button */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="hidden md:flex fixed bottom-8 right-8 w-14 h-14 bg-black dark:bg-white text-white dark:text-black rounded-full items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-200 z-40 shadow-2xl shadow-black/35 group border-2 border-white dark:border-[#141B2A] cursor-pointer"
        aria-label="Add Transaction"
      >
        <span className="material-symbols-outlined text-2xl font-black group-hover:rotate-90 transition-transform duration-300">
          add
        </span>
      </button>
    </>
  );
};
