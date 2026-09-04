import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchAllFirestoreData, saveNewUser, fetchUserProfile } from '../../services/firestoreService';
import { validateImageFileAndDimensions } from '../../utils/imageUtils';
import { ImageCropperModal } from '../modals/ImageCropperModal';
import { DEFAULT_AVATAR } from '../../constants/data';
import { CurrencyCode, UserProfession } from '../../types';
import { AndroidSmartBanner, AndroidDownloadButton } from '../AndroidSmartBanner';

// Calculate age from Date of Birth string (YYYY-MM-DD)
function calculateAge(dobString: string): number {
  if (!dobString) return 24;
  const birthDate = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : 24;
}

export const OnboardingView: React.FC = () => {
  const {
    currentUser,
    signInUser,
    signUpUser,
    profile,
    updateProfile,
    settings,
    updateSettings,
    locations,
    updateLocation,
    completeOnboarding,
    restoreExistingUserData,
    setActiveTab,
    getCurrencySymbol,
    showToast,
  } = useApp();

  // Step-based state: currentTab from 1 to 4
  const [currentTab, setCurrentTab] = useState<1 | 2 | 3 | 4>(1);

  // ==========================================
  // TAB 1 STATE: Real Firebase Auth (Sign In vs Sign Up)
  // ==========================================
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState(profile.email || currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState(profile.phone || '');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [tab1Error, setTab1Error] = useState<string | null>(null);

  // ==========================================
  // TAB 2 STATE: Profile Setup
  // ==========================================
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [profession, setProfession] = useState<UserProfession>('Salaried');
  const [avatar, setAvatar] = useState<string>(DEFAULT_AVATAR);
  const [tab2Error, setTab2Error] = useState<string | null>(null);

  // Cropper State
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ==========================================
  // TAB 3 STATE: Starting Balances & Currency
  // ==========================================
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(settings.currency || 'INR');
  const [balances, setBalances] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    locations.forEach((loc) => {
      map[loc.id] = '';
    });
    return map;
  });
  const [tab3Error, setTab3Error] = useState<string | null>(null);

  // ==========================================
  // TAB 4 STATE: Launching
  // ==========================================
  const [isLaunching, setIsLaunching] = useState(false);

  const currencies: { code: CurrencyCode; label: string; symbol: string }[] = [
    { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
    { code: 'USD', label: 'US Dollar', symbol: '$' },
    { code: 'EUR', label: 'Euro', symbol: '€' },
    { code: 'GBP', label: 'British Pound', symbol: '£' },
    { code: 'JPY', label: 'Japanese Yen', symbol: '¥' },
  ];

  const tabList = [
    { num: 1, label: 'Auth', icon: 'lock' },
    { num: 2, label: 'Profile', icon: 'person' },
    { num: 3, label: 'Balances', icon: 'account_balance_wallet' },
    { num: 4, label: 'Launch', icon: 'rocket_launch' },
  ];

  const currentCurrencySymbol = getCurrencySymbol(selectedCurrency);

  // Sum of all individual account balances safely treating empty strings as 0
  const totalStartingNetWorth = locations.reduce((sum, loc) => {
    const rawVal = balances[loc.id] ?? '';
    const parsed = parseFloat(rawVal);
    return sum + (isNaN(parsed) ? 0 : Math.max(0, parsed));
  }, 0);

  const handleBalanceChange = (locId: string, val: string) => {
    setBalances((prev) => ({ ...prev, [locId]: val }));
  };

  const handleQuickAdd = (locId: string, delta: number) => {
    setBalances((prev) => {
      const current = parseFloat(prev[locId] || '0') || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [locId]: next.toString() };
    });
  };

  // ==========================================
  // TAB 1: Real Firebase Auth Handler
  // ==========================================
  const handleTab1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTab1Error(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setTab1Error('Please enter your email address.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(cleanEmail)) {
      setTab1Error('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setTab1Error('Please enter your password.');
      return;
    }

    if (password.length < 6) {
      setTab1Error('Password must be at least 6 characters long.');
      return;
    }

    try {
      setIsAuthenticating(true);

      if (authMode === 'signin') {
        // Sign In with Firebase Authentication
        console.log(`🔐 Signing in user with Firebase Auth: ${cleanEmail}`);
        const res = await signInUser(cleanEmail, password);

        if (!res.success || !res.user) {
          setTab1Error(res.error || 'Invalid email or password. Please try again.');
          return;
        }

        const userUid = res.user.uid;
        showToast('Signed in successfully! Fetching cloud profile...');

        // Check if user has an existing profile in Firestore under their UID
        const existingProfile = await fetchUserProfile(userUid);

        if (existingProfile && existingProfile.name) {
          // Existing user with setup completed: restore cloud data and go straight to Dashboard
          const existingData = await fetchAllFirestoreData(userUid);
          if (existingData) {
            await restoreExistingUserData({
              ...existingData,
              profile: existingData.profile || existingProfile,
            });
          } else {
            await restoreExistingUserData({
              profile: existingProfile,
            });
          }
          setActiveTab('home');
          showToast(`Welcome back, ${existingProfile.name}!`);
        } else {
          // User authenticated, but first-time profile configuration needed
          setFullName('');
          setDob('');
          setProfession('Salaried');
          setAvatar(DEFAULT_AVATAR);
          showToast('Account verified! Let\'s set up your profile.');
          setCurrentTab(2);
        }
      } else {
        // Sign Up with Firebase Authentication
        console.log(`🔐 Creating new user with Firebase Auth: ${cleanEmail}`);
        const res = await signUpUser(cleanEmail, password);

        if (!res.success || !res.user) {
          setTab1Error(res.error || 'Failed to create account. Please try again.');
          return;
        }

        showToast('Account created! Now personalize your profile.');
        setFullName('');
        setDob('');
        setProfession('Salaried');
        setAvatar(DEFAULT_AVATAR);

        // Prepopulate context profile with authenticated email
        updateProfile({
          name: '',
          email: cleanEmail,
          phone: phone.trim(),
          dob: '',
          age: 24,
          profession: 'Salaried',
          avatarUrl: DEFAULT_AVATAR,
        });

        setCurrentTab(2);
      }
    } catch (err: any) {
      console.error('Authentication error in OnboardingView:', err);
      setTab1Error(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // ==========================================
  // TAB 2: Image Selection & Cropping Handlers
  // ==========================================
  const handleSelectImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value to allow re-upload of the same file if desired
    e.target.value = '';

    // Strict validation: format (JPEG/PNG), size (<=5MB), and min resolution (>=256x256px)
    const validation = await validateImageFileAndDimensions(file);
    if (!validation.isValid) {
      showToast(validation.error || 'Invalid image file.');
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setCropSrc(reader.result?.toString() || '');
      setIsCropModalOpen(true);
    });
    reader.readAsDataURL(file);
  };

  const handleApplyCroppedAvatar = (croppedBase64: string) => {
    if (croppedBase64) {
      setAvatar(croppedBase64);
      showToast('Profile photo cropped & updated!');
    }
  };

  // ==========================================
  // TAB 2: Next Handler (Save Profile Details)
  // ==========================================
  const handleTab2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTab2Error(null);

    const cleanName = fullName.trim();
    if (!cleanName) {
      setTab2Error('Please enter your full name.');
      return;
    }

    if (!dob) {
      setTab2Error('Please select your date of birth.');
      return;
    }

    const calculatedAge = calculateAge(dob);

    updateProfile({
      name: cleanName,
      dob: dob,
      age: calculatedAge,
      profession: profession,
      avatarUrl: avatar,
      email: email.trim(),
      phone: phone.trim(),
    });

    showToast('Profile details saved!');
    setCurrentTab(3);
  };

  // ==========================================
  // TAB 3: Next Handler (Save Starting Balances & Move to Tab 4)
  // ==========================================
  const handleTab3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTab3Error(null);

    updateSettings({ currency: selectedCurrency });

    locations.forEach((loc) => {
      const rawVal = balances[loc.id] ?? '0';
      const parsed = Math.max(0, parseFloat(rawVal) || 0);
      updateLocation(loc.id, { initialBalance: parsed });
    });

    showToast('Starting balances saved!');
    setCurrentTab(4);
  };

  // ==========================================
  // TAB 4: Final Launch Handler (Save to Firestore with Real UID)
  // ==========================================
  const handleLaunchApp = async () => {
    try {
      setIsLaunching(true);

      const activeUid = currentUser?.uid || '';
      if (!activeUid) {
        throw new Error('No authenticated user session found. Please sign in again.');
      }

      console.log(`🚀 Saving new user under UID "${activeUid}" and launching dashboard...`);

      const cleanName = fullName.trim() || 'User';
      const cleanEmail = email.trim();
      const cleanPhone = phone.trim();
      const calculatedAge = calculateAge(dob);

      const locationsWithBalances = locations.map((loc) => ({
        id: loc.id,
        name: loc.name,
        type: loc.type,
        initialBalance: Math.max(0, parseFloat(balances[loc.id] || '0') || 0),
        isSavings: loc.isSavings,
      }));

      // 1. Persist user document to Firestore 'users/{activeUid}'
      await saveNewUser(activeUid, {
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        dob: dob,
        age: calculatedAge,
        profession: profession,
        avatarUrl: avatar,
        startingBalance: totalStartingNetWorth,
        currency: selectedCurrency,
        locationsWithBalances,
      });

      // 2. Complete onboarding in local context & sync all app state
      await completeOnboarding({
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        dob: dob,
        age: calculatedAge,
        profession: profession,
        avatarUrl: avatar,
        currency: selectedCurrency,
        startingBalance: totalStartingNetWorth,
        locationsWithBalances,
      });

      showToast(`Welcome to Kanakku, ${cleanName}! Your dashboard is live.`);
      setActiveTab('home');
    } catch (err: any) {
      console.error('Error during onboarding launch:', err);
      showToast(err.message || 'Error launching app. Check cloud connection.');
      setActiveTab('home');
    } finally {
      setIsLaunching(false);
    }
  };

  const todayDateISO = new Date().toISOString().split('T')[0];
  const computedAge = calculateAge(dob);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] text-neutral-900 dark:text-white flex flex-col items-center justify-center p-4 md:p-8 animate-fadeIn transition-colors">
      {/* Mobile Web Floating Smart Install Pill / Banner */}
      <div className="w-full max-w-xl mb-4">
        <AndroidSmartBanner />
      </div>

      <div className="w-full max-w-xl bg-white dark:bg-[#141B2A] border border-neutral-200/80 dark:border-[#243048] rounded-[2.5rem] p-6 md:p-10 shadow-2xl space-y-6">
        
        {/* Header & 4-Tab Progress Bar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black shadow-md">
                <span className="material-symbols-outlined text-xl">account_balance</span>
              </div>
              <div>
                <span className="text-2xl font-black text-black dark:text-white tracking-tight">Kanakku</span>
                <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 block -mt-1 tracking-wider uppercase">
                  Finance Tracker
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <AndroidDownloadButton className="hidden sm:inline-flex text-[11px] py-1.5 px-3" />
              <div className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56] text-[11px] font-black text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                Step {currentTab} of 4
              </div>
            </div>
          </div>

          {/* Tab Progress Indicator */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            {tabList.map((tab) => {
              const isActive = currentTab === tab.num;
              const isCompleted = currentTab > tab.num;

              return (
                <div key={tab.num} className="flex flex-col gap-1.5">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isActive
                        ? 'bg-black dark:bg-white'
                        : isCompleted
                        ? 'bg-[#00C853]'
                        : 'bg-neutral-200 dark:bg-neutral-800'
                    }`}
                  />
                  <div className="flex items-center justify-center">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider transition-colors ${
                        isActive
                          ? 'text-black dark:text-white'
                          : isCompleted
                          ? 'text-[#00C853]'
                          : 'text-neutral-400 dark:text-neutral-600'
                      }`}
                    >
                      {tab.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: Real Firebase Authentication (Sign In & Sign Up)                   */}
        {/* ========================================================================= */}
        {currentTab === 1 && (
          <form onSubmit={handleTab1Submit} className="space-y-6 animate-fadeIn">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-[11px] font-bold">
                <span className="material-symbols-outlined text-xs">lock</span>
                <span>Firebase Authentication</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-black dark:text-white tracking-tight pt-1">
                {authMode === 'signin' ? 'Sign In to Kanakku' : 'Create an Account'}
              </h2>
              <p className="text-xs md:text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                {authMode === 'signin'
                  ? 'Enter your credentials to access and sync your encrypted financial vault.'
                  : 'Register a new secure account to start tracking your finances.'}
              </p>
            </div>

            {/* Sign In vs Create Account Toggle Tabs */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-neutral-100 dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56]">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setTab1Error(null);
                }}
                className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  authMode === 'signin'
                    ? 'bg-white dark:bg-[#141B2A] text-black dark:text-white shadow-md'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setTab1Error(null);
                }}
                className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  authMode === 'signup'
                    ? 'bg-white dark:bg-[#141B2A] text-black dark:text-white shadow-md'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error Message Box */}
            {tab1Error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2.5 animate-fadeIn">
                <span className="material-symbols-outlined text-lg shrink-0">error</span>
                <span>{tab1Error}</span>
              </div>
            )}

            {/* Form Inputs */}
            <div className="space-y-4">
              {/* Email Address Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  Email Address *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-neutral-400 text-lg pointer-events-none">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    disabled={isAuthenticating}
                    className="w-full pl-11 pr-4 py-3.5 bg-neutral-50 dark:bg-[#1C263A] rounded-2xl text-black dark:text-white font-bold text-sm border border-neutral-200 dark:border-[#2E3C56] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white placeholder:text-neutral-400 disabled:opacity-60 transition-all"
                  />
                </div>
              </div>

              {/* Password Input with Show/Hide toggle */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  Password *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-neutral-400 text-lg pointer-events-none">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    disabled={isAuthenticating}
                    className="w-full pl-11 pr-12 py-3.5 bg-neutral-50 dark:bg-[#1C263A] rounded-2xl text-black dark:text-white font-bold text-sm border border-neutral-200 dark:border-[#2E3C56] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white placeholder:text-neutral-400 disabled:opacity-60 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Phone Number (Visible when Signing Up) */}
              {authMode === 'signup' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="block text-xs font-black text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-neutral-400 text-lg pointer-events-none">
                      call
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      disabled={isAuthenticating}
                      className="w-full pl-11 pr-4 py-3.5 bg-neutral-50 dark:bg-[#1C263A] rounded-2xl text-black dark:text-white font-bold text-sm border border-neutral-200 dark:border-[#2E3C56] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white placeholder:text-neutral-400 disabled:opacity-60 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Cloud Sync Notice */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#1C263A]/60 border border-neutral-200/80 dark:border-[#2E3C56]/60 flex items-start gap-3">
              <span className="material-symbols-outlined text-neutral-500 dark:text-neutral-400 text-lg mt-0.5">
                verified_user
              </span>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed">
                {authMode === 'signin'
                  ? 'Signing in links your account with your unique Firebase UID and automatically restores your cloud records.'
                  : 'Creating an account configures your secure profile linked to Firebase Cloud Firestore.'}
              </p>
            </div>

            {/* Continue / Sign In Button */}
            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full bg-black dark:bg-white text-white dark:text-black font-black text-sm py-4 rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all shadow-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2.5"
            >
              {isAuthenticating ? (
                <>
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>{authMode === 'signin' ? 'Authenticating...' : 'Creating Account...'}</span>
                </>
              ) : (
                <>
                  <span>{authMode === 'signin' ? 'Sign In' : 'Create & Continue'}</span>
                  <span className="material-symbols-outlined text-base font-black">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: Personal Profile Setup (Avatar Crop, Full Name, DOB, Profession)   */}
        {/* ========================================================================= */}
        {currentTab === 2 && (
          <form onSubmit={handleTab2Submit} className="space-y-6 animate-fadeIn">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                <span className="material-symbols-outlined text-xs">person</span>
                <span>Step 2 • Profile Setup</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-black dark:text-white tracking-tight pt-1">
                Personal Profile
              </h2>
              <p className="text-xs md:text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                Personalize your financial identity with your photo, name, and background.
              </p>
            </div>

            {/* Error Message Box */}
            {tab2Error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2.5 animate-fadeIn">
                <span className="material-symbols-outlined text-lg shrink-0">error</span>
                <span>{tab2Error}</span>
              </div>
            )}

            {/* 1. Avatar Upload Section with 1:1 Cropping Trigger */}
            <div className="flex flex-col items-center justify-center gap-2 pt-1 pb-1">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleSelectImageFile}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative group cursor-pointer"
                title="Click to choose a photo and crop (1:1)"
              >
                <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-black dark:border-white shadow-xl bg-neutral-100 dark:bg-neutral-800 transition-transform group-hover:scale-105">
                  <img
                    src={avatar}
                    alt="User Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-2xl font-black">crop</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-black dark:bg-white text-white dark:text-black shadow-lg border-2 border-white dark:border-[#141B2A] cursor-pointer hover:scale-110 transition-transform"
                >
                  <span className="material-symbols-outlined text-xs font-black block">photo_camera</span>
                </button>
              </div>

              <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                Click photo to upload & crop to 1:1 aspect ratio
              </span>
            </div>

            <div className="space-y-4">
              {/* 2. Full Name Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  Full Name *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-neutral-400 text-lg pointer-events-none">
                    badge
                  </span>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g., Karthik Raja"
                    className="w-full pl-11 pr-4 py-3.5 bg-neutral-50 dark:bg-[#1C263A] rounded-2xl text-black dark:text-white font-bold text-sm border border-neutral-200 dark:border-[#2E3C56] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white placeholder:text-neutral-400 transition-all"
                  />
                </div>
              </div>

              {/* 3. Date of Birth & 4. Profession in a 2-Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date of Birth */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                      Date of Birth *
                    </label>
                    {dob && (
                      <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400">
                        ({computedAge} yrs)
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      max={todayDateISO}
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-4 py-3.5 bg-neutral-50 dark:bg-[#1C263A] rounded-2xl text-black dark:text-white font-bold text-sm border border-neutral-200 dark:border-[#2E3C56] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all cursor-pointer"
                    />
                  </div>
                </div>

                {/* Profession Dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                    Profession *
                  </label>
                  <div className="relative">
                    <select
                      value={profession}
                      onChange={(e) => setProfession(e.target.value as UserProfession)}
                      className="w-full px-4 py-3.5 bg-neutral-50 dark:bg-[#1C263A] rounded-2xl text-black dark:text-white font-bold text-sm border border-neutral-200 dark:border-[#2E3C56] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all cursor-pointer appearance-none"
                    >
                      <option value="Salaried">💼 Salaried Employee</option>
                      <option value="Student">🎓 Student</option>
                      <option value="Freelancer">💻 Freelancer</option>
                      <option value="Business">🏢 Business Owner</option>
                      <option value="Self-Employed">🛠️ Self-Employed</option>
                      <option value="Other">✨ Other</option>
                    </select>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-neutral-400 pointer-events-none text-base">
                      unfold_more
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentTab(1)}
                className="flex-1 py-4 rounded-2xl text-xs md:text-sm font-black bg-neutral-100 dark:bg-[#1C263A] text-black dark:text-white border border-neutral-200 dark:border-[#2E3C56] hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
              >
                ← Back
              </button>
              <button
                type="submit"
                className="flex-2 bg-black dark:bg-white text-white dark:text-black font-black text-xs md:text-sm py-4 rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all shadow-xl cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Next (Balances)</span>
                <span className="material-symbols-outlined text-base font-black">arrow_forward</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: Detailed Starting Balances & Currency Calibration                  */}
        {/* ========================================================================= */}
        {currentTab === 3 && (
          <form onSubmit={handleTab3Submit} className="space-y-6 animate-fadeIn">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 text-[11px] font-bold">
                <span className="material-symbols-outlined text-xs">account_balance_wallet</span>
                <span>Step 3 • Starting Balances</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-black dark:text-white tracking-tight pt-1">
                Starting Balances ({currentCurrencySymbol})
              </h2>
              <p className="text-xs md:text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                Choose your base currency and calibrate your cash, bank, savings, and wallet balances.
              </p>
            </div>

            {/* Error Message Box */}
            {tab3Error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2.5 animate-fadeIn">
                <span className="material-symbols-outlined text-lg shrink-0">error</span>
                <span>{tab3Error}</span>
              </div>
            )}

            {/* 1. Base Currency Selector Section */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                Select Base Currency *
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {currencies.map((c) => {
                  const isSelected = selectedCurrency === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setSelectedCurrency(c.code)}
                      className={`py-2.5 px-1 rounded-2xl text-center border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-lg font-black scale-105'
                          : 'bg-neutral-50 dark:bg-[#1C263A] text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-[#2E3C56] hover:bg-neutral-100 dark:hover:bg-neutral-800 font-bold'
                      }`}
                    >
                      <span className="text-sm font-black">{c.symbol}</span>
                      <span className="text-[10px] font-black">{c.code}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Detailed Account Numeric Inputs with Quick-Add Chips */}
            <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#1C263A] border border-neutral-200/80 dark:border-[#2E3C56] shadow-sm space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                        style={{ backgroundColor: loc.color || '#0066FF' }}
                      >
                        <span className="material-symbols-outlined text-lg">{loc.icon}</span>
                      </div>
                      <div>
                        <span className="text-xs font-black text-black dark:text-white block">
                          {loc.name}
                        </span>
                        <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 capitalize">
                          {loc.isSavings ? 'Savings Reserve' : loc.institution || loc.type}
                        </span>
                      </div>
                    </div>

                    {/* Numeric Input with Currency Symbol */}
                    <div className="flex items-center gap-1 w-36">
                      <span className="text-sm font-black text-neutral-600 dark:text-neutral-300">
                        {currentCurrencySymbol}
                      </span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={balances[loc.id] ?? ''}
                        onChange={(e) => handleBalanceChange(loc.id, e.target.value)}
                        placeholder="0"
                        className="w-full px-2.5 py-2 bg-white dark:bg-[#141B2A] rounded-xl text-black dark:text-white font-black text-sm border border-neutral-200 dark:border-[#2E3C56] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white text-right tabular-nums placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                      />
                    </div>
                  </div>

                  {/* Quick-Add Amount Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5 border-t border-neutral-200/60 dark:border-[#2E3C56]/60">
                    <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 mr-1">Quick:</span>
                    {[500, 2000, 5000, 25000, 50000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleQuickAdd(loc.id, amt)}
                        className="px-2 py-0.5 rounded-lg bg-white dark:bg-[#141B2A] hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-[#2E3C56] text-[10px] font-black text-neutral-700 dark:text-neutral-300 cursor-pointer transition-colors shadow-2xs"
                      >
                        +{currentCurrencySymbol}{amt.toLocaleString()}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleBalanceChange(loc.id, '')}
                      className="px-2 py-0.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-[10px] font-black text-neutral-600 dark:text-neutral-400 cursor-pointer transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 3. Prominent INITIAL NET WORTH Total Section */}
            <div className="p-4.5 rounded-2xl bg-black dark:bg-[#0B0F17] border border-neutral-800 dark:border-[#1F293D] text-white flex justify-between items-center shadow-xl">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00C853] text-lg">account_balance</span>
                <span className="text-xs font-black uppercase tracking-wider text-neutral-300">
                  INITIAL NET WORTH
                </span>
              </div>
              <span className="text-xl md:text-2xl font-black tabular-nums text-[#00C853] drop-shadow-[0_0_8px_rgba(0,200,83,0.35)]">
                {currentCurrencySymbol}{totalStartingNetWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* 4. Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentTab(2)}
                className="flex-1 py-4 rounded-2xl text-xs md:text-sm font-black bg-neutral-100 dark:bg-[#1C263A] text-black dark:text-white border border-neutral-200 dark:border-[#2E3C56] hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
              >
                ← Back
              </button>
              <button
                type="submit"
                className="flex-2 bg-black dark:bg-white text-white dark:text-black font-black text-xs md:text-sm py-4 rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all shadow-xl cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Review & Complete</span>
                <span className="material-symbols-outlined text-base font-black">arrow_forward</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: Ready to Go / All Set Success Screen                              */}
        {/* ========================================================================= */}
        {currentTab === 4 && (
          <div className="space-y-6 text-center animate-fadeIn">
            {/* Animated Celebration Icon */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-[#00C853]/15 text-[#00C853] flex items-center justify-center shadow-inner animate-pulse">
                <span className="material-symbols-outlined text-5xl font-black">verified</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-sm font-black">rocket_launch</span>
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-black text-black dark:text-white tracking-tight">
                All Set, {fullName || 'there'}!
              </h2>
              <p className="text-xs md:text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                Your Kanakku personal finance tracker has been configured with Firebase Authentication.
              </p>
            </div>

            {/* Profile & Financial Summary Card */}
            <div className="p-5 rounded-3xl bg-neutral-50 dark:bg-[#1C263A] border border-neutral-200/80 dark:border-[#2E3C56] text-left space-y-4 shadow-sm">
              {/* User Identity Snapshot */}
              <div className="flex items-center gap-3.5 pb-3 border-b border-neutral-200 dark:border-[#2E3C56]">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-black dark:border-white shadow-md shrink-0">
                  <img
                    src={avatar}
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-base font-black text-black dark:text-white truncate block">
                    {fullName || 'User'}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold truncate block">
                    {email} {phone ? `• ${phone}` : ''}
                  </span>
                  {currentUser?.uid && (
                    <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 truncate block mt-0.5">
                      UID: {currentUser.uid}
                    </span>
                  )}
                </div>
              </div>

              {/* Badges Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-2xl bg-white dark:bg-[#141B2A] border border-neutral-200/70 dark:border-[#2E3C56]/70">
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                    Profession & Age
                  </span>
                  <span className="text-xs font-black text-black dark:text-white mt-0.5 block">
                    {profession} • {computedAge} yrs
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-white dark:bg-[#141B2A] border border-neutral-200/70 dark:border-[#2E3C56]/70">
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                    Initial Net Worth ({selectedCurrency})
                  </span>
                  <span className="text-xs font-black text-[#00C853] mt-0.5 block tabular-nums">
                    {currentCurrencySymbol}{totalStartingNetWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Accounts Breakdown Preview */}
              <div className="space-y-1.5 pt-1 text-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                  Calibrated Starting Balances
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {locations.map((loc) => (
                    <div
                      key={loc.id}
                      className="p-2.5 rounded-xl bg-white dark:bg-[#141B2A] border border-neutral-200/60 dark:border-[#2E3C56]/60 flex items-center justify-between"
                    >
                      <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-300 truncate">
                        {loc.name}
                      </span>
                      <span className="text-xs font-black text-black dark:text-white tabular-nums">
                        {currentCurrencySymbol}{(parseFloat(balances[loc.id] || '0') || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-2 pt-1 text-xs">
                <div className="flex items-center gap-2 text-black dark:text-white font-bold">
                  <span className="material-symbols-outlined text-base text-[#00C853]">verified_user</span>
                  <span>Authenticated via Firebase Auth</span>
                </div>
                <div className="flex items-center gap-2 text-black dark:text-white font-bold">
                  <span className="material-symbols-outlined text-base text-[#00C853]">cloud_done</span>
                  <span>Direct Firestore UID Document Linked</span>
                </div>
                <div className="flex items-center gap-2 text-black dark:text-white font-bold">
                  <span className="material-symbols-outlined text-base text-[#00C853]">lock</span>
                  <span>Encrypted & Privacy-First Architecture</span>
                </div>
              </div>
            </div>

            {/* Launch Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isLaunching}
                onClick={() => setCurrentTab(3)}
                className="flex-1 py-4 rounded-2xl text-xs md:text-sm font-black bg-neutral-100 dark:bg-[#1C263A] text-black dark:text-white border border-neutral-200 dark:border-[#2E3C56] hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer transition-colors disabled:opacity-50"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={isLaunching}
                onClick={handleLaunchApp}
                className="flex-2 bg-black dark:bg-white text-white dark:text-black font-black text-sm py-4 rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all shadow-2xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2.5"
              >
                {isLaunching ? (
                  <>
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Saving Cloud Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Launch App</span>
                    <span className="material-symbols-outlined text-base font-black">rocket_launch</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 1:1 AVATAR CROP MODAL (Reusable ImageCropperModal) */}
      <ImageCropperModal
        isOpen={isCropModalOpen}
        imageSrc={cropSrc}
        onClose={() => setIsCropModalOpen(false)}
        onApplyCrop={handleApplyCroppedAvatar}
        title="Crop Profile Photo"
      />
    </div>
  );
};
