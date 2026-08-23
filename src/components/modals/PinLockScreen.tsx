import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export const PinLockScreen: React.FC = () => {
  const { profile, settings, setIsAppUnlocked, showToast } = useApp();
  const [pinInput, setPinInput] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const targetPin = settings.pinCode || '1234';

  const handleKeyPress = (digit: string) => {
    if (pinInput.length < 4) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);
      setIsError(false);
      setErrorMessage('');

      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setIsError(false);
    setErrorMessage('');
  };

  const handleClear = () => {
    setPinInput('');
    setIsError(false);
    setErrorMessage('');
  };

  const verifyPin = (entered: string) => {
    if (entered === targetPin) {
      setIsAppUnlocked(true);
      showToast('App Unlocked');
    } else {
      setIsError(true);
      setErrorMessage('Incorrect PIN. Please try again.');
      setTimeout(() => {
        setPinInput('');
      }, 500);
    }
  };

  // Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pinInput, targetPin]);

  return (
    <div className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-white dark:bg-[#0B0F17] text-black dark:text-white p-6 animate-fadeIn transition-colors select-none">
      <div className="w-full max-w-xs flex flex-col items-center space-y-6">
        {/* User Avatar & Lock Icon */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-black/10 dark:border-white/20 shadow-xl">
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-sm font-black">lock</span>
          </div>
        </div>

        {/* User Greeting & Instructions */}
        <div className="text-center space-y-1">
          <h2 className="text-xl font-black text-black dark:text-white tracking-tight">
            Welcome back, {profile.name}!
          </h2>
          <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
            Enter your 4-digit PIN to access Kanakku
          </p>
        </div>

        {/* 4 Dots PIN Display with Shake animation on error */}
        <div className={`flex items-center gap-4 my-2 ${isError ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pinInput.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? isError
                      ? 'bg-rose-500 scale-110'
                      : 'bg-black dark:bg-white scale-110 shadow-sm'
                    : 'border-2 border-neutral-300 dark:border-neutral-700 bg-transparent'
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        {errorMessage ? (
          <p className="text-xs font-bold text-rose-500 animate-fadeIn h-4">
            {errorMessage}
          </p>
        ) : (
          <div className="h-4" />
        )}

        {/* Numeric Keypad Grid (1 to 9, Clear, 0, Backspace) */}
        <div className="grid grid-cols-3 gap-3.5 w-full pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="h-16 rounded-2xl bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] text-xl font-black text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-[#1C263A] active:scale-95 transition-all shadow-sm flex items-center justify-center cursor-pointer"
            >
              {num}
            </button>
          ))}

          {/* Clear Button */}
          <button
            type="button"
            onClick={handleClear}
            className="h-16 rounded-2xl bg-transparent text-xs font-black text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white active:scale-95 transition-all flex items-center justify-center cursor-pointer"
          >
            Clear
          </button>

          {/* 0 Button */}
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-16 rounded-2xl bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] text-xl font-black text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-[#1C263A] active:scale-95 transition-all shadow-sm flex items-center justify-center cursor-pointer"
          >
            0
          </button>

          {/* Backspace Button */}
          <button
            type="button"
            onClick={handleDelete}
            className="h-16 rounded-2xl bg-transparent text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white active:scale-95 transition-all flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl font-black">backspace</span>
          </button>
        </div>
      </div>
    </div>
  );
};
