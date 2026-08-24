import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { UserProfession } from '../../types';
import { fileToBase64 } from '../../utils/imageUtils';

interface ProfileViewProps {
  onOpenLinkAccount: () => void;
}

// Helper to calculate age from Date of Birth string (YYYY-MM-DD) or fallback age
function calculateAge(dobString?: string, fallbackAge?: number | string): number | string {
  if (dobString) {
    const birthDate = new Date(dobString);
    if (!isNaN(birthDate.getTime())) {
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age >= 0) return age;
    }
  }
  return fallbackAge !== undefined && fallbackAge !== '' ? fallbackAge : 24;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onOpenLinkAccount }) => {
  const {
    profile,
    updateProfile,
    updateProfileAvatar,
    locations,
    locationBalances,
    formatMoney,
    setActiveTab,
    resetOnboarding,
    exportBackupData,
    importBackupData,
    settings,
    setPinLock,
    showToast,
  } = useApp();

  const userAge = calculateAge(profile.dob, profile.age);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const profileFileInputRef = useRef<HTMLInputElement | null>(null);

  // Edit Personal Info Form State
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name || '');
  const [dobInput, setDobInput] = useState(profile.dob || '');
  const [ageInput, setAgeInput] = useState<string>(userAge ? userAge.toString() : '24');
  const [professionInput, setProfessionInput] = useState<UserProfession>(profile.profession || 'Salaried');
  const [emailInput, setEmailInput] = useState(profile.email || '');
  const [phoneInput, setPhoneInput] = useState(profile.phone || '');

  // Modals
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [securityModal, setSecurityModal] = useState(false);
  const [privacyModal, setPrivacyModal] = useState(false);
  const [supportModal, setSupportModal] = useState(false);

  // PIN Lock Management State
  const [isPinEnabled, setIsPinEnabled] = useState(!!settings.isPinLockEnabled);
  const [newPinInput, setNewPinInput] = useState(settings.pinCode || '1234');
  const [confirmPinInput, setConfirmPinInput] = useState(settings.pinCode || '1234');
  const [pinError, setPinError] = useState('');

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      await updateProfileAvatar(base64);
    } catch (err) {
      console.error('Avatar error:', err);
      showToast('Failed to update avatar photo');
    }
  };

  const handleProfileFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        await importBackupData(content);
        if (profileFileInputRef.current) profileFileInputRef.current.value = '';
        setPrivacyModal(false);
      } catch (err) {
        console.error('File read error:', err);
        showToast('Failed to read JSON backup file');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const computedAge = dobInput ? calculateAge(dobInput, ageInput) : (parseInt(ageInput) || 24);
    updateProfile({
      name: nameInput.trim() || 'User',
      dob: dobInput,
      age: computedAge,
      profession: professionInput,
      email: emailInput.trim(),
      phone: phoneInput.trim(),
    });
    setIsEditingInfo(false);
    showToast('Personal information updated');
  };

  const handleSavePinLock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPinEnabled) {
      await setPinLock(false);
      setSecurityModal(false);
      return;
    }

    if (!/^\d{4}$/.test(newPinInput)) {
      setPinError('PIN must be exactly 4 digits');
      return;
    }

    if (newPinInput !== confirmPinInput) {
      setPinError('PIN confirmation does not match');
      return;
    }

    setPinError('');
    await setPinLock(true, newPinInput);
    setSecurityModal(false);
  };

  const handleLogOut = () => {
    setShowLogoutConfirm(false);
    resetOnboarding();
  };

  return (
    <main className="max-w-2xl mx-auto px-4 md:px-0 py-6 space-y-6 pb-28 md:pb-12 animate-fadeIn text-black dark:text-white">
      {/* Hidden Avatar Input */}
      <input
        type="file"
        ref={avatarInputRef}
        accept="image/*"
        onChange={handleAvatarUpload}
        className="hidden"
      />

      {/* Profile Header & Interactive Avatar */}
      <section className="flex flex-col items-center text-center space-y-3 pt-2">
        <div
          onClick={() => avatarInputRef.current?.click()}
          className="relative group cursor-pointer"
          title="Click to change profile picture"
        >
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white dark:border-[#243048] shadow-xl bg-neutral-200 dark:bg-neutral-800 transition-transform group-hover:scale-105">
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-3xl font-black">photo_camera</span>
          </div>
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="absolute bottom-0 right-0 p-2 rounded-full bg-black dark:bg-white text-white dark:text-black shadow-md border-2 border-white dark:border-[#141B2A] cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm font-black block">photo_camera</span>
          </button>
        </div>

        <div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black text-black dark:text-white tracking-tight">
              {profile.name || 'User'}
            </h1>
            <button
              onClick={() => {
                setNameInput(profile.name || '');
                setDobInput(profile.dob || '');
                setAgeInput(userAge ? userAge.toString() : '24');
                setProfessionInput(profile.profession || 'Salaried');
                setEmailInput(profile.email || '');
                setPhoneInput(profile.phone || '');
                setIsEditingInfo(true);
              }}
              className="p-1.5 text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-colors cursor-pointer"
              title="Edit Profile"
            >
              <span className="material-symbols-outlined text-base font-black">edit</span>
            </button>
          </div>
          <div className="flex items-center justify-center gap-2 mt-1">
            {profile.profession && (
              <span className="px-2.5 py-0.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-[10px] font-black uppercase">
                {profile.profession.toUpperCase()}
              </span>
            )}
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
              Age {userAge}{profile.memberSince ? ` • Member since ${profile.memberSince}` : ''}
            </span>
          </div>
        </div>
      </section>

      {/* Edit Profile Modal */}
      {isEditingInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#141B2A] rounded-3xl p-6 shadow-2xl space-y-4 border border-neutral-200 dark:border-[#243048] text-black dark:text-white animate-slideUp">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-black dark:text-white">Edit Personal Information</h3>
              <button
                type="button"
                onClick={() => setIsEditingInfo(false)}
                className="text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveInfo} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-black dark:text-neutral-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white font-bold text-sm outline-none border border-neutral-200 dark:border-[#2E3C56] focus:border-black dark:focus:border-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-black dark:text-neutral-300 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={dobInput}
                    onChange={(e) => {
                      setDobInput(e.target.value);
                      if (e.target.value) {
                        const calculated = calculateAge(e.target.value);
                        setAgeInput(calculated.toString());
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white font-bold text-sm outline-none border border-neutral-200 dark:border-[#2E3C56] focus:border-black dark:focus:border-white cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-black dark:text-neutral-300 mb-1">Profession *</label>
                  <select
                    value={professionInput}
                    onChange={(e) => setProfessionInput(e.target.value as UserProfession)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white font-bold text-sm outline-none border border-neutral-200 dark:border-[#2E3C56] focus:border-black dark:focus:border-white cursor-pointer"
                  >
                    <option value="Salaried" className="bg-white dark:bg-[#141B2A]">💼 Salaried</option>
                    <option value="Student" className="bg-white dark:bg-[#141B2A]">🎓 Student</option>
                    <option value="Freelancer" className="bg-white dark:bg-[#141B2A]">💻 Freelancer</option>
                    <option value="Business" className="bg-white dark:bg-[#141B2A]">🏢 Business</option>
                    <option value="Self-Employed" className="bg-white dark:bg-[#141B2A]">🛠️ Self-Employed</option>
                    <option value="Other" className="bg-white dark:bg-[#141B2A]">✨ Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-black dark:text-neutral-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white font-bold text-sm outline-none border border-neutral-200 dark:border-[#2E3C56] focus:border-black dark:focus:border-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black dark:text-neutral-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white font-bold text-sm outline-none border border-neutral-200 dark:border-[#2E3C56] focus:border-black dark:focus:border-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingInfo(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-black bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-sm font-black bg-black dark:bg-white text-white dark:text-black hover:opacity-90 cursor-pointer"
                >
                  Save Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Personal Information Card */}
      <div className="bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-[24px] p-6 space-y-4 shadow-sm">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
            Personal Information
          </h2>
          <button
            type="button"
            onClick={() => {
              setNameInput(profile.name || '');
              setDobInput(profile.dob || '');
              setAgeInput(userAge ? userAge.toString() : '24');
              setProfessionInput(profile.profession || 'Salaried');
              setEmailInput(profile.email || '');
              setPhoneInput(profile.phone || '');
              setIsEditingInfo(true);
            }}
            className="text-xs font-black text-[#0066FF] dark:text-[#60A5FA] hover:underline cursor-pointer"
          >
            Edit
          </button>
        </div>

        <div className="space-y-3.5">
          {/* 1st item: Age */}
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-white dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56] flex items-center justify-center text-black dark:text-white shadow-sm shrink-0">
              <span className="material-symbols-outlined text-xl font-bold">cake</span>
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400">Age</p>
              <p className="text-sm font-black text-black dark:text-white">
                {userAge ? `${userAge} years old` : 'Not set'}
                {profile.dob ? ` (DOB: ${profile.dob})` : ''}
              </p>
            </div>
          </div>

          <div className="h-px bg-neutral-200 dark:bg-[#243048] ml-15" />

          {/* 2nd item: Profession */}
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-white dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56] flex items-center justify-center text-black dark:text-white shadow-sm shrink-0">
              <span className="material-symbols-outlined text-xl font-bold">work</span>
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400">Profession</p>
              <p className="text-sm font-black text-black dark:text-white">
                {profile.profession || 'Not set'}
              </p>
            </div>
          </div>

          <div className="h-px bg-neutral-200 dark:bg-[#243048] ml-15" />

          {/* 3rd item: Email Address */}
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-white dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56] flex items-center justify-center text-black dark:text-white shadow-sm shrink-0">
              <span className="material-symbols-outlined text-xl font-bold">mail</span>
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400">Email Address</p>
              <p className="text-sm font-black text-black dark:text-white truncate">
                {profile.email || 'Not configured'}
              </p>
            </div>
          </div>

          <div className="h-px bg-neutral-200 dark:bg-[#243048] ml-15" />

          {/* 4th item: Phone Number */}
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-white dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56] flex items-center justify-center text-black dark:text-white shadow-sm shrink-0">
              <span className="material-symbols-outlined text-xl font-bold">call</span>
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400">Phone Number</p>
              <p className="text-sm font-black text-black dark:text-white">
                {profile.phone || 'Not configured'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Money Locations (Accounts) */}
      <div className="bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-[24px] p-6 space-y-3 shadow-sm">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
            Money Locations ({locations.length})
          </h2>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className="text-xs font-black text-[#0066FF] dark:text-[#60A5FA] hover:underline cursor-pointer"
          >
            Manage in Settings
          </button>
        </div>

        <div className="space-y-2.5">
          {locations.map((loc) => {
            const balance = locationBalances[loc.id] ?? loc.initialBalance;
            return (
              <div
                key={loc.id}
                className="flex justify-between items-center p-3.5 rounded-2xl bg-white dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56] hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: loc.color || '#0066FF' }}
                  >
                    <span className="material-symbols-outlined text-xl font-black">{loc.icon}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-black dark:text-white">{loc.name}</p>
                      {loc.isSavings && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-[#FF9500]/15 text-[#FF9500]">
                          Savings
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 capitalize">{loc.type}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black text-black dark:text-white tabular-nums">
                    {formatMoney(balance)}
                  </span>
                  <span className="block text-[10px] text-neutral-400">Available</span>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={onOpenLinkAccount}
            className="w-full mt-2 py-3 flex items-center justify-center gap-2 text-black dark:text-white font-black text-sm hover:bg-neutral-200 dark:hover:bg-[#1C263A] rounded-xl transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg font-black">add</span>
            Link another location / account
          </button>
        </div>
      </div>

      {/* Settings Shortcuts */}
      <div className="bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-[24px] overflow-hidden divide-y divide-neutral-200 dark:divide-[#243048] shadow-sm">
        <button
          onClick={() => setActiveTab('settings')}
          className="w-full flex justify-between items-center p-4.5 hover:bg-white dark:hover:bg-[#1C263A] transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-[#0066FF] text-white flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-xl font-bold">tune</span>
            </div>
            <div>
              <h3 className="text-sm font-black text-black dark:text-white">
                Custom Lists & Settings
              </h3>
              <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 mt-0.5">Categories, Locations, Income Sources, Currency</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-black dark:text-white font-black text-lg">chevron_right</span>
        </button>

        {/* Security & PIN Lock Button */}
        <button
          onClick={() => {
            setIsPinEnabled(!!settings.isPinLockEnabled);
            setNewPinInput(settings.pinCode || '1234');
            setConfirmPinInput(settings.pinCode || '1234');
            setPinError('');
            setSecurityModal(true);
          }}
          className="w-full flex justify-between items-center p-4.5 hover:bg-white dark:hover:bg-[#1C263A] transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-xl font-bold">lock</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-black dark:text-white">
                  Security & 4-Digit PIN Lock
                </h3>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    settings.isPinLockEnabled
                      ? 'bg-[#00C853]/15 text-[#00C853]'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
                  }`}
                >
                  {settings.isPinLockEnabled ? 'ACTIVE' : 'OFF'}
                </span>
              </div>
              <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 mt-0.5">
                {settings.isPinLockEnabled ? 'Prompt 4-digit PIN on app open' : 'App lock currently disabled'}
              </p>
            </div>
          </div>
          <span className="material-symbols-outlined text-black dark:text-white font-black text-lg">chevron_right</span>
        </button>

        {/* Data & Privacy */}
        <button
          onClick={() => setPrivacyModal(true)}
          className="w-full flex justify-between items-center p-4.5 hover:bg-white dark:hover:bg-[#1C263A] transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-[#00C853] text-white flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-xl font-bold">verified_user</span>
            </div>
            <div>
              <h3 className="text-sm font-black text-black dark:text-white">
                Data & Privacy
              </h3>
              <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 mt-0.5">Export and Import JSON backups</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-black dark:text-white font-black text-lg">chevron_right</span>
        </button>

        {/* Support & Help */}
        <button
          onClick={() => setSupportModal(true)}
          className="w-full flex justify-between items-center p-4.5 hover:bg-white dark:hover:bg-[#1C263A] transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-[#FF9500] text-white flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-xl font-bold">help</span>
            </div>
            <div>
              <h3 className="text-sm font-black text-black dark:text-white">
                Support & Help
              </h3>
              <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 mt-0.5">Concierge assistance</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-black dark:text-white font-black text-lg">chevron_right</span>
        </button>
      </div>

      {/* Log Out Action */}
      <div className="pt-2 flex justify-center">
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="flex items-center justify-center gap-2 w-full md:w-auto px-10 py-3.5 rounded-2xl bg-[#F4F5F7] dark:bg-[#141B2A] border border-[#FF2D55]/30 text-[#FF2D55] font-black text-sm hover:bg-[#FF2D55]/10 active:scale-[0.98] transition-all shadow-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg font-black">logout</span>
          Reset Session & Log Out
        </button>
      </div>

      {/* Logout Confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-[#141B2A] rounded-3xl p-6 shadow-2xl space-y-4 text-center border border-neutral-200 dark:border-[#243048] text-black dark:text-white">
            <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl font-black">logout</span>
            </div>
            <h3 className="text-lg font-black text-black dark:text-white">Log Out?</h3>
            <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
              Are you sure you want to end your current session? You can re-open at any time.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-black bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogOut}
                className="flex-1 py-2.5 rounded-xl text-sm font-black bg-[#FF2D55] text-white hover:opacity-90 cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security & 4-Digit PIN Modal */}
      {securityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#141B2A] rounded-3xl p-6 shadow-2xl space-y-5 border border-neutral-200 dark:border-[#243048] text-black dark:text-white animate-slideUp">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl">lock</span>
                <h3 className="text-lg font-black text-black dark:text-white">Security & PIN Lock</h3>
              </div>
              <button onClick={() => setSecurityModal(false)} className="text-black dark:text-white hover:opacity-70 cursor-pointer">
                <span className="material-symbols-outlined font-black">close</span>
              </button>
            </div>

            <form onSubmit={handleSavePinLock} className="space-y-4">
              {/* Toggle Switch */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F4F5F7] dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56]">
                <div>
                  <span className="text-sm font-black text-black dark:text-white block">Require 4-Digit PIN Lock</span>
                  <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                    {isPinEnabled ? 'Lock app on open / reload' : 'Disabled (Direct dashboard access)'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPinEnabled}
                    onChange={(e) => setIsPinEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-300 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00C853]"></div>
                </label>
              </div>

              {/* PIN Inputs (Shown when enabled) */}
              {isPinEnabled && (
                <div className="space-y-3 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-black text-black dark:text-neutral-300 uppercase tracking-wider mb-1">
                      Set 4-Digit PIN
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      pattern="[0-9]{4}"
                      inputMode="numeric"
                      required
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="••••"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white font-black text-center text-lg tracking-widest outline-none border border-neutral-200 dark:border-[#2E3C56] focus:border-black dark:focus:border-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-black dark:text-neutral-300 uppercase tracking-wider mb-1">
                      Confirm 4-Digit PIN
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      pattern="[0-9]{4}"
                      inputMode="numeric"
                      required
                      value={confirmPinInput}
                      onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="••••"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white font-black text-center text-lg tracking-widest outline-none border border-neutral-200 dark:border-[#2E3C56] focus:border-black dark:focus:border-white"
                    />
                  </div>

                  {pinError && (
                    <p className="text-xs font-bold text-rose-500 animate-fadeIn">{pinError}</p>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSecurityModal(false)}
                  className="flex-1 py-3 rounded-2xl text-xs md:text-sm font-black bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl text-xs md:text-sm font-black bg-black dark:bg-white text-white dark:text-black hover:opacity-90 shadow-md cursor-pointer"
                >
                  Save Security
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {privacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#141B2A] rounded-3xl p-6 shadow-2xl space-y-4 border border-neutral-200 dark:border-[#243048] text-black dark:text-white">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-black dark:text-white">Data & Privacy</h3>
              <button onClick={() => setPrivacyModal(false)} className="text-black dark:text-white hover:opacity-70 cursor-pointer">
                <span className="material-symbols-outlined font-black">close</span>
              </button>
            </div>
            <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
              Your financial logs and Need vs. Want classifications are securely saved and synced. You can export or restore a full backup at any time.
            </p>

            <div className="space-y-2.5 pt-1">
              {/* Hidden file input */}
              <input
                type="file"
                ref={profileFileInputRef}
                accept=".json"
                onChange={handleProfileFileUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => {
                  exportBackupData();
                  setPrivacyModal(false);
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#F4F5F7] dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56] hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl text-black dark:text-white">download</span>
                  <div className="text-left">
                    <span className="text-sm font-black text-black dark:text-white block">Export Backup</span>
                    <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400">Download backup_kanakku.json</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-sm font-black">chevron_right</span>
              </button>

              <button
                type="button"
                onClick={() => profileFileInputRef.current?.click()}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#F4F5F7] dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56] hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl text-black dark:text-white">upload_file</span>
                  <div className="text-left">
                    <span className="text-sm font-black text-black dark:text-white block">Import Backup</span>
                    <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400">Restore from .json backup file</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-sm font-black">chevron_right</span>
              </button>
            </div>

            <button
              onClick={() => setPrivacyModal(false)}
              className="w-full py-3 rounded-2xl text-sm font-black bg-black dark:bg-white text-white dark:text-black hover:opacity-90 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Support Modal */}
      {supportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#141B2A] rounded-3xl p-6 shadow-2xl space-y-4 border border-neutral-200 dark:border-[#243048] text-black dark:text-white">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-black dark:text-white">Support & Help</h3>
              <button onClick={() => setSupportModal(false)} className="text-black dark:text-white hover:opacity-70 cursor-pointer">
                <span className="material-symbols-outlined font-black">close</span>
              </button>
            </div>
            <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
              For feedback or assistance with transaction classification and budget envelopes:
            </p>
            <p className="text-xs font-black text-black dark:text-white">help@kanakku.finance</p>
            <button
              onClick={() => setSupportModal(false)}
              className="w-full py-2.5 rounded-xl text-sm font-black bg-black dark:bg-white text-white dark:text-black hover:opacity-90 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
};
