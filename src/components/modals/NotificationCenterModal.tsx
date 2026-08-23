import React from 'react';
import { useApp } from '../../context/AppContext';

export const NotificationCenterModal: React.FC = () => {
  const {
    notifications,
    isNotificationCenterOpen,
    setNotificationCenterOpen,
    markNotificationAsRead,
    clearAllNotifications,
  } = useApp();

  if (!isNotificationCenterOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn text-black dark:text-white">
      <div className="w-full max-w-md bg-white dark:bg-[#141B2A] rounded-3xl p-6 shadow-2xl space-y-4 border border-neutral-200 dark:border-[#243048] animate-slideUp">
        <div className="flex justify-between items-center pb-2 border-b border-neutral-200 dark:border-[#243048]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xl text-black dark:text-white font-black">
              notifications
            </span>
            <h3 className="text-lg font-black text-black dark:text-white">
              Notifications
            </h3>
          </div>
          <button
            onClick={() => setNotificationCenterOpen(false)}
            className="p-1 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl font-black">close</span>
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-neutral-400 dark:text-neutral-500 text-xs font-bold">
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markNotificationAsRead(n.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  n.read
                    ? 'bg-[#F4F5F7] dark:bg-[#1C263A] border-neutral-200 dark:border-[#2E3C56] opacity-75'
                    : 'bg-white dark:bg-[#1C263A] border-black dark:border-white shadow-sm'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-black text-black dark:text-white">{n.title}</span>
                  <span className="text-[10px] font-bold text-neutral-400">{n.time}</span>
                </div>
                <p className="text-xs font-bold text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  {n.message}
                </p>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <button
            onClick={clearAllNotifications}
            className="w-full py-2.5 rounded-xl text-xs font-black bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
          >
            Clear All Notifications
          </button>
        )}
      </div>
    </div>
  );
};
