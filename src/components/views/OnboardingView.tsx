import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CurrencyCode, LocationType, UserProfession } from '../../types';
import { fileToBase64 } from '../../utils/imageUtils';

export const OnboardingView: React.FC = () => {
  const {
    profile,
    updateProfile,
    settings,
    updateSettings,
    locations,
    updateLocation,
    completeOnboarding,
    setActiveTab,
    getCurrencySymbol,
    formatMoney,
    showToast,
  } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [userName, setUserName] = useState(profile.name || '');
  const [userAge, setUserAge] = useState<string>(profile.age ? profile.age.toString() : '24');
  const [userProfession, setUserProfession] = useState<UserProfession>(profile.profession || 'Salaried');
  const [userEmail, setUserEmail] = useState(profile.email || '');
  const [userPhone, setUserPhone] = useState(profile.phone || '');
  const [userAvatar, setUserAvatar] = useState(profile.avatarUrl);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(settings.currency || 'INR');
  const [isLaunching, setIsLaunching] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initial balances map
  const [balances, setBalances] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    locations.forEach((loc) => {
      map[loc.id] = loc.initialBalance.toString();
    });
    return map;
  });

  const currencies: { code: CurrencyCode; label: string; symbol: string }[] = [
    { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
    { code: 'USD', label: 'US Dollar', symbol: '$' },
    { code: 'EUR', label: 'Euro', symbol: '€' },
    { code: 'GBP', label: 'British Pound', symbol: '£' },
    { code: 'JPY', label: 'Japanese Yen', symbol: '¥' },
  ];

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      setUserAvatar(base64);
      showToast('Profile photo updated');
    } catch (err) {
      console.error('Error processing photo:', err);
      showToast('Failed to process image');
    }
  };

  const handleBalanceChange = (locId: string, val: string) => {
    setBalances((prev) => ({ ...prev, [locId]: val }));
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: userName.trim() || 'User',
      age: parseInt(userAge) || 24,
      profession: userProfession,
      email: userEmail.trim(),
      phone: userPhone.trim(),
      avatarUrl: userAvatar,
    });
    updateSettings({ currency: selectedCurrency });
    setStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    locations.forEach((loc) => {
      const rawVal = balances[loc.id];
      const parsed = Math.max(0, parseFloat(rawVal) || 0);
      updateLocation(loc.id, { initialBalance: parsed });
    });
    setStep(3);
  };

  const handleFinalLaunch = async () => {
    try {
      setIsLaunching(true);
      console.log('🚀 Initializing user dashboard and cloud persistence...');

      const locationsWithBalances = locations.map((loc) => ({
        id: loc.id,
        name: loc.name,
        type: loc.type,
        initialBalance: Math.max(0, parseFloat(balances[loc.id]) || 0),
        isSavings: loc.isSavings,
      }));

      await completeOnboarding({
        name: userName.trim() || profile.name || 'User',
        age: parseInt(userAge) || 24,
        profession: userProfession,
        email: userEmail.trim(),
        phone: userPhone.trim(),
        avatarUrl: userAvatar,
        currency: selectedCurrency,
        locationsWithBalances,
      });

      setActiveTab('home');
      console.log('✅ Dashboard launched successfully!');
    } catch (error) {
      console.error('Error during onboarding launch:', error);
      setActiveTab('home');
    } finally {
      setIsLaunching(false);
    }
  };

  const totalStartingNetWorth = locations.reduce((sum, loc) => {
    const rawVal = balances[loc.id];
    const parsed = parseFloat(rawVal) || 0;
    return sum + parsed;
  }, 0);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B0F17] text-black dark:text-white flex items-center justify-center p-4 md:p-8 animate-fadeIn transition-colors">
      <div className="w-full max-w-lg bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-[2.5rem] p-6 md:p-10 shadow-2xl space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-black dark:text-white tracking-tight">Kanakku</span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-black dark:bg-white text-white dark:text-black">
              Clean Setup
            </span>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-7 h-1.5 rounded-full transition-all duration-300 ${
                  step === s ? 'bg-black dark:bg-white w-10' : step > s ? 'bg-[#00C853]' : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: Personal Information, Avatar & Currency */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-5 animate-fadeIn">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-black dark:text-white tracking-tight">
                Welcome! Let's set up your profile.
              </h2>
              <p className="text-xs md:text-sm font-bold text-neutral-600 dark:text-neutral-400 mt-0.5">
                Tell us a little bit about yourself to personalize your budget.
              </p>
            </div>

            {/* Interactive Avatar Upload */}
            <div className="flex flex-col items-center justify-center gap-2 pt-1 pb-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative group cursor-pointer"
              >
                <div className="w-22 h-22 rounded-full overflow-hidden border-3 border-black dark:border-white shadow-lg bg-neutral-200 dark:bg-neutral-800 transition-transform group-hover:scale-105">
                  <img
                    src={userAvatar}
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-2xl font-black">photo_camera</span>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-black dark:bg-white text-white dark:text-black shadow-md border-2 border-white dark:border-[#141B2A] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs font-black block">edit</span>
                </button>
              </div>
              <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                Click photo to change avatar (Gallery / Photos / Camera)
              </span>
            </div>

            <div className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-black text-black dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g., Karthik Raja"
                  className="w-full px-4 py-2.5 bg-white dark:bg-[#1C263A] rounded-xl text-black dark:text-white font-bold text-sm border border-neutral-200 dark:border-[#2E3C56] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white placeholder:text-neutral-400"
                />
              </div>

              {/* Age and Profession Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-black dark:text-neutral-300 uppercase tracking-wider mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="120"
                    value={userAge}
                    onChange={(e) => setUserAge(e.target.value)}
                    placeholder="24"
                    className="w-full px-4 py-2.5 bg-white dark:bg-[#1C263A] rounded-xl text-black dark:text-white font-bold text-sm border border-neutral-200 dark:border-[#2E3C56] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-black dark:text-neutral-300 uppercase tracking-wider mb-1">
                    Profession *
                  </label>
                  <select
                    value={userProfession}
                    onChange={(e) => setUserProfession(e.target.value as UserProfession)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-[#1C263A] rounded-xl text-black dark:text-white font-bold text-sm border border-neutral-200 dark:border-[#2E3C56] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white cursor-pointer"
                  >
                    <option value="Student" className="bg-white dark:bg-[#141B2A]">Student</option>
                    <option value="Salaried" className="bg-white dark:bg-[#141B2A]">Salaried</option>
                  </select>
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-black dark:text-neutral-300 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="karthik@example.com"
                    className="w-full px-4 py-2.5 bg-white dark:bg-[#1C263A] rounded-xl text-black dark:text-white font-bold text-sm border border-neutral-200 dark:border-[#2E3C56] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white placeholder:text-neutral-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-black dark:text-neutral-300 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2.5 bg-white dark:bg-[#1C263A] rounded-xl text-black dark:text-white font-bold text-sm border border-neutral-200 dark:border-[#2E3C56] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white placeholder:text-neutral-400"
                  />
                </div>
              </div>

              {/* Base Currency */}
              <div>
                <label className="block text-xs font-black text-black dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Base Currency
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {currencies.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setSelectedCurrency(c.code)}
                      className={`py-2 px-1 rounded-xl text-center border transition-all cursor-pointer ${
                        selectedCurrency === c.code
                          ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-sm font-black'
                          : 'bg-white dark:bg-[#1C263A] text-black dark:text-white border-neutral-200 dark:border-[#2E3C56] hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <span className="text-sm font-black block">{c.symbol} {c.code}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-black dark:bg-white text-white dark:text-black font-black text-sm py-4 rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all shadow-xl cursor-pointer mt-2"
            >
              Continue to Starting Balances →
            </button>
          </form>
        )}

        {/* STEP 2: Money Locations Initial Balances */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-black dark:text-white tracking-tight">
                Starting Balances ({getCurrencySymbol()})
              </h2>
              <p className="text-xs md:text-sm font-bold text-neutral-600 dark:text-neutral-400 mt-1">
                Enter your current cash, bank, and wallet amounts to calibrate your initial Net Worth.
              </p>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56] flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                      style={{ backgroundColor: loc.color || '#0066FF' }}
                    >
                      <span className="material-symbols-outlined text-lg">{loc.icon}</span>
                    </div>
                    <div>
                      <span className="text-xs font-black text-black dark:text-white block">{loc.name}</span>
                      <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 capitalize">
                        {loc.isSavings ? 'Savings Reserve' : loc.type}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 w-32">
                    <span className="text-sm font-black text-black dark:text-white">{getCurrencySymbol()}</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={balances[loc.id] ?? ''}
                      onChange={(e) => handleBalanceChange(loc.id, e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2 py-1.5 bg-[#F4F5F7] dark:bg-[#141B2A] rounded-xl text-black dark:text-white font-black text-sm border border-neutral-200 dark:border-[#2E3C56] outline-none text-right tabular-nums"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Total Starting Net Worth Preview */}
            <div className="p-4 rounded-2xl bg-black dark:bg-[#0B0F17] text-white flex justify-between items-center shadow-md">
              <span className="text-xs font-black uppercase tracking-wider text-neutral-300">
                Initial Net Worth
              </span>
              <span className="text-lg md:text-xl font-black tabular-nums text-[#00C853]">
                {formatMoney(totalStartingNetWorth)}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3.5 rounded-2xl text-xs md:text-sm font-black bg-white dark:bg-[#1C263A] text-black dark:text-white border border-neutral-200 dark:border-[#2E3C56] hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="submit"
                className="flex-2 bg-black dark:bg-white text-white dark:text-black font-black text-xs md:text-sm py-3.5 rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all shadow-xl cursor-pointer"
              >
                Review & Complete →
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Ready to Launch */}
        {step === 3 && (
          <div className="space-y-6 text-center animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-[#00C853]/15 text-[#00C853] flex items-center justify-center mx-auto shadow-inner">
              <span className="material-symbols-outlined text-4xl font-black">verified</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-black dark:text-white tracking-tight">
                You're All Set, {userName}!
              </h2>
              <p className="text-xs md:text-sm font-bold text-neutral-600 dark:text-neutral-400">
                Starting Net Worth: <strong className="text-black dark:text-white">{formatMoney(totalStartingNetWorth)}</strong>
              </p>
              <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                Profession: <strong className="text-black dark:text-white">{userProfession}</strong> • Age: <strong className="text-black dark:text-white">{userAge}</strong>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56] text-left text-xs space-y-2">
              <div className="flex items-center gap-2 text-black dark:text-white font-black">
                <span className="material-symbols-outlined text-base text-[#00C853]">check_circle</span>
                <span>Personal Profile & Avatar calibrated</span>
              </div>
              <div className="flex items-center gap-2 text-black dark:text-white font-black">
                <span className="material-symbols-outlined text-base text-[#00C853]">check_circle</span>
                <span>Custom Lists & Settings initialized</span>
              </div>
              <div className="flex items-center gap-2 text-black dark:text-white font-black">
                <span className="material-symbols-outlined text-base text-[#00C853]">check_circle</span>
                <span>Mandatory Need vs. Want tagging active</span>
              </div>
              <div className="flex items-center gap-2 text-black dark:text-white font-black">
                <span className="material-symbols-outlined text-base text-[#00C853]">check_circle</span>
                <span>Zero dummy transactions (Clean Slate)</span>
              </div>
            </div>

            <button
              type="button"
              disabled={isLaunching}
              onClick={handleFinalLaunch}
              className="w-full bg-black dark:bg-white text-white dark:text-black font-black text-sm py-4 rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all shadow-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLaunching ? (
                <>
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Launching Clean Dashboard...</span>
                </>
              ) : (
                <span>Launch Clean Dashboard 🚀</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
