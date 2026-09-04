import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

const APK_URL = '/Kanakku.apk';
const APK_FILENAME = 'Kanakku.apk';
const BANNER_STORAGE_KEY = 'kanakku_dismiss_apk_banner';

/**
 * Hook to determine whether the app is running in a standard web browser
 * rather than the native Android/iOS Capacitor wrapper.
 */
export const useIsWebPlatform = () => {
  const [isWeb, setIsWeb] = useState<boolean>(() => {
    try {
      return !Capacitor.isNativePlatform();
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      setIsWeb(!Capacitor.isNativePlatform());
    } catch {
      setIsWeb(true);
    }
  }, []);

  return isWeb;
};

/**
 * Prominent, stylish modern gradient CTA button for Desktop / Navigation Header.
 * Labeled: 'Download Android App (APK)' with robot icon (🤖) and direct APK link.
 */
export const AndroidDownloadButton: React.FC<{ className?: string; compactOnMedium?: boolean }> = ({
  className = '',
  compactOnMedium = true,
}) => {
  const isWeb = useIsWebPlatform();

  // Hidden when running inside native Android/iOS Capacitor app
  if (!isWeb) return null;

  return (
    <a
      href={APK_URL}
      download={APK_FILENAME}
      title="Download Android App (APK) for voice entry & offline sync"
      className={`group relative inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:via-teal-400 hover:to-emerald-500 text-white font-black text-xs md:text-sm tracking-tight shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer whitespace-nowrap select-none overflow-hidden ${className}`}
    >
      {/* Subtle shine highlight */}
      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
      
      <span className="text-base leading-none group-hover:scale-110 transition-transform">🤖</span>
      
      {compactOnMedium ? (
        <>
          <span className="hidden xl:inline">Download Android App (APK)</span>
          <span className="inline xl:hidden">Download Android App (APK)</span>
        </>
      ) : (
        <span>Download Android App (APK)</span>
      )}

      <span className="material-symbols-outlined text-[16px] font-bold group-hover:translate-y-0.5 transition-transform">
        download
      </span>
    </a>
  );
};

/**
 * Floating smart install pill / banner for Mobile Web browsers.
 * Text: 'Experience faster voice entry on our Native Android App — [Download APK]'
 * Hidden on native app or if dismissed during session.
 */
export const AndroidSmartBanner: React.FC<{ className?: string }> = ({ className = '' }) => {
  const isWeb = useIsWebPlatform();
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(BANNER_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  if (!isWeb || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem(BANNER_STORAGE_KEY, 'true');
    } catch {
      // Ignored in private browsing / memory fallbacks
    }
  };

  return (
    <div className={`w-full transition-all duration-300 animate-fadeIn ${className}`}>
      <div className="relative flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-neutral-900/95 dark:bg-[#131C2E]/95 text-white border border-emerald-500/40 shadow-xl shadow-emerald-500/10 backdrop-blur-xl">
        {/* Left Side: Robot Icon & Value Proposition Message */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="relative shrink-0 flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-base">
            <span className="select-none leading-none">🤖</span>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
          </div>

          <p className="text-[11px] sm:text-xs font-semibold text-neutral-100 dark:text-neutral-200 leading-snug">
            Experience faster voice entry on our Native Android App —
          </p>
        </div>

        {/* Right Side: CTA Button & Dismiss Action */}
        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={APK_URL}
            download={APK_FILENAME}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-95 text-white font-black text-xs shadow-md shadow-emerald-600/30 transition-all cursor-pointer whitespace-nowrap select-none"
            title="Download APK"
          >
            <span>Download APK</span>
            <span className="material-symbols-outlined text-[14px] font-black">download</span>
          </a>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss Android app banner"
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
            title="Dismiss"
          >
            <span className="material-symbols-outlined text-[16px] leading-none block">close</span>
          </button>
        </div>
      </div>
    </div>
  );
};
