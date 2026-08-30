import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CurrencyCode, ExpenseCategory, MoneyLocation, IncomeSource, LocationType } from '../../types';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetOnboarding,
    showToast,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    locations,
    addLocation,
    updateLocation,
    deleteLocation,
    reorderLocations,
    incomeSources,
    addIncomeSource,
    updateIncomeSource,
    deleteIncomeSource,
    reorderIncomeSources,
    locationBalances,
    formatMoney,
    syncToCloud,
    cloudSyncStatus,
    exportBackupData,
    importBackupData,
    setIsAutoSmsModalOpen,
  } = useApp();

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        await importBackupData(content);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        console.error('File read error:', err);
        showToast('Failed to read JSON backup file');
      }
    };
    reader.readAsText(file);
  };

  const [activeSubTab, setActiveSubTab] = useState<'categories' | 'locations' | 'income' | 'general'>('categories');

  // Drag and Drop States
  const [draggedCatIndex, setDraggedCatIndex] = useState<number | null>(null);
  const [dragOverCatIndex, setDragOverCatIndex] = useState<number | null>(null);

  const [draggedLocIndex, setDraggedLocIndex] = useState<number | null>(null);
  const [dragOverLocIndex, setDragOverLocIndex] = useState<number | null>(null);

  const [draggedSrcIndex, setDraggedSrcIndex] = useState<number | null>(null);
  const [dragOverSrcIndex, setDragOverSrcIndex] = useState<number | null>(null);

  // Modal States
  const [currencyModal, setCurrencyModal] = useState(false);
  const [resetModal, setResetModal] = useState(false);
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; item?: ExpenseCategory | null }>({ open: false, item: null });
  const [locationModal, setLocationModal] = useState<{ open: boolean; item?: MoneyLocation | null }>({ open: false, item: null });
  const [incomeSourceModal, setIncomeSourceModal] = useState<{ open: boolean; item?: IncomeSource | null }>({ open: false, item: null });

  // Category Form State
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('category');
  const [catColor, setCatColor] = useState('#0066FF');
  const [catDefaultNeed, setCatDefaultNeed] = useState(true);

  // Location Form State
  const [locName, setLocName] = useState('');
  const [locType, setLocType] = useState<LocationType>('bank');
  const [locInitialBalance, setLocInitialBalance] = useState('0');
  const [locIsSavings, setLocIsSavings] = useState(false);
  const [locIcon, setLocIcon] = useState('account_balance');

  // Income Source Form State
  const [incName, setIncName] = useState('');
  const [incIcon, setIncIcon] = useState('payments');

  const currencies: { code: CurrencyCode; label: string; symbol: string }[] = [
    { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
    { code: 'USD', label: 'US Dollar', symbol: '$' },
    { code: 'EUR', label: 'Euro', symbol: '€' },
    { code: 'GBP', label: 'British Pound', symbol: '£' },
    { code: 'JPY', label: 'Japanese Yen', symbol: '¥' },
  ];

  const COLOR_PALETTE = [
    '#FF2D55', '#0066FF', '#00C853', '#06B6D4', '#9333EA',
    '#F59E0B', '#10B981', '#F97316', '#0D9488', '#6366F1', '#52525B'
  ];

  const ICON_PALETTE = [
    'restaurant', 'directions_car', 'home', 'receipt_long', 'shopping_bag',
    'movie', 'favorite', 'local_cafe', 'school', 'flight', 'payments',
    'account_balance', 'savings', 'account_balance_wallet', 'work', 'fitness_center'
  ];

  // ==========================================
  // DRAG AND DROP HANDLERS
  // ==========================================

  // Category Drag and Drop
  const handleCategoryDragStart = (e: React.DragEvent, index: number) => {
    setDraggedCatIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleCategoryDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCatIndex !== index) {
      setDragOverCatIndex(index);
    }
  };

  const handleCategoryDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedCatIndex === null || draggedCatIndex === targetIndex) {
      setDraggedCatIndex(null);
      setDragOverCatIndex(null);
      return;
    }

    const updated = [...categories];
    const [movedItem] = updated.splice(draggedCatIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    reorderCategories(updated);
    setDraggedCatIndex(null);
    setDragOverCatIndex(null);
  };

  const handleCategoryDragEnd = () => {
    setDraggedCatIndex(null);
    setDragOverCatIndex(null);
  };

  const moveCategoryItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const updated = [...categories];
    const [movedItem] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, movedItem);
    reorderCategories(updated);
  };

  // Location Drag and Drop
  const handleLocationDragStart = (e: React.DragEvent, index: number) => {
    setDraggedLocIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleLocationDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverLocIndex !== index) {
      setDragOverLocIndex(index);
    }
  };

  const handleLocationDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedLocIndex === null || draggedLocIndex === targetIndex) {
      setDraggedLocIndex(null);
      setDragOverLocIndex(null);
      return;
    }

    const updated = [...locations];
    const [movedItem] = updated.splice(draggedLocIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    reorderLocations(updated);
    setDraggedLocIndex(null);
    setDragOverLocIndex(null);
  };

  const handleLocationDragEnd = () => {
    setDraggedLocIndex(null);
    setDragOverLocIndex(null);
  };

  const moveLocationItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= locations.length) return;

    const updated = [...locations];
    const [movedItem] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, movedItem);
    reorderLocations(updated);
  };

  // Income Source Drag and Drop
  const handleSourceDragStart = (e: React.DragEvent, index: number) => {
    setDraggedSrcIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleSourceDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSrcIndex !== index) {
      setDragOverSrcIndex(index);
    }
  };

  const handleSourceDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedSrcIndex === null || draggedSrcIndex === targetIndex) {
      setDraggedSrcIndex(null);
      setDragOverSrcIndex(null);
      return;
    }

    const updated = [...incomeSources];
    const [movedItem] = updated.splice(draggedSrcIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    reorderIncomeSources(updated);
    setDraggedSrcIndex(null);
    setDragOverSrcIndex(null);
  };

  const handleSourceDragEnd = () => {
    setDraggedSrcIndex(null);
    setDragOverSrcIndex(null);
  };

  const moveSourceItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= incomeSources.length) return;

    const updated = [...incomeSources];
    const [movedItem] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, movedItem);
    reorderIncomeSources(updated);
  };

  // Open Edit Modals
  const openEditCategory = (cat: ExpenseCategory) => {
    setCatName(cat.name);
    setCatIcon(cat.icon);
    setCatColor(cat.color || '#0066FF');
    setCatDefaultNeed(cat.defaultNeed);
    setCategoryModal({ open: true, item: cat });
  };

  const openAddCategory = () => {
    setCatName('');
    setCatIcon('shopping_bag');
    setCatColor('#0066FF');
    setCatDefaultNeed(true);
    setCategoryModal({ open: true, item: null });
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    if (categoryModal.item) {
      updateCategory(categoryModal.item.id, {
        name: catName.trim(),
        icon: catIcon,
        color: catColor,
        bgColor: `bg-[${catColor}] text-white`,
        textColor: `text-[${catColor}]`,
        defaultNeed: catDefaultNeed,
      });
    } else {
      addCategory({
        name: catName.trim(),
        icon: catIcon,
        color: catColor,
        bgColor: `bg-[${catColor}] text-white`,
        textColor: `text-[${catColor}]`,
        defaultNeed: catDefaultNeed,
      });
    }
    setCategoryModal({ open: false, item: null });
  };

  const openEditLocation = (loc: MoneyLocation) => {
    setLocName(loc.name);
    setLocType(loc.type);
    setLocInitialBalance(loc.initialBalance.toString());
    setLocIsSavings(!!loc.isSavings);
    setLocIcon(loc.icon);
    setLocationModal({ open: true, item: loc });
  };

  const openAddLocation = () => {
    setLocName('');
    setLocType('bank');
    setLocInitialBalance('0');
    setLocIsSavings(false);
    setLocIcon('account_balance');
    setLocationModal({ open: true, item: null });
  };

  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locName.trim()) return;
    const initialAmt = Math.max(0, parseFloat(locInitialBalance) || 0);

    const defaultColor = locIsSavings || locType === 'savings' ? '#FF9500' : locType === 'bank' ? '#0066FF' : locType === 'wallet' ? '#8B5CF6' : '#00C853';

    if (locationModal.item) {
      updateLocation(locationModal.item.id, {
        name: locName.trim(),
        type: locType,
        initialBalance: initialAmt,
        isSavings: locIsSavings || locType === 'savings',
        icon: locIcon,
        color: defaultColor,
      });
    } else {
      addLocation({
        name: locName.trim(),
        type: locType,
        initialBalance: initialAmt,
        isSavings: locIsSavings || locType === 'savings',
        icon: locIcon,
        color: defaultColor,
        mask: locType.toUpperCase(),
        institution: locName.trim(),
      });
    }
    setLocationModal({ open: false, item: null });
  };

  const openEditIncomeSource = (src: IncomeSource) => {
    setIncName(src.name);
    setIncIcon(src.icon);
    setIncomeSourceModal({ open: true, item: src });
  };

  const openAddIncomeSource = () => {
    setIncName('');
    setIncIcon('payments');
    setIncomeSourceModal({ open: true, item: null });
  };

  const handleSaveIncomeSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incName.trim()) return;

    if (incomeSourceModal.item) {
      updateIncomeSource(incomeSourceModal.item.id, {
        name: incName.trim(),
        icon: incIcon,
      });
    } else {
      addIncomeSource({
        name: incName.trim(),
        icon: incIcon,
      });
    }
    setIncomeSourceModal({ open: false, item: null });
  };

  const handleExportData = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      profile: localStorage.getItem('kanakku_v2_profile'),
      locations: localStorage.getItem('kanakku_v2_locations'),
      categories: localStorage.getItem('kanakku_v2_categories'),
      incomeSources: localStorage.getItem('kanakku_v2_income_sources'),
      transactions: localStorage.getItem('kanakku_v2_transactions'),
      settings: localStorage.getItem('kanakku_v2_settings'),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kanakku-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('Data exported successfully (.json)');
  };

  return (
    <main className="w-full max-w-3xl mx-auto px-4 py-6 md:px-0 space-y-6 pb-28 md:pb-12 animate-fadeIn text-black dark:text-white">
      {/* Settings Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-black dark:text-white tracking-tight">
          Settings & Custom Dropdowns
        </h1>
        <p className="text-xs md:text-sm font-bold text-neutral-600 dark:text-neutral-400 mt-1">
          Customize Categories, Money Locations, Income Sources, Drag & Drop to Reorder, and App Preferences.
        </p>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-2xl p-1 overflow-x-auto gap-1">
        <button
          type="button"
          onClick={() => setActiveSubTab('categories')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'categories'
              ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
              : 'text-black dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-[#1C263A]'
          }`}
        >
          Categories ({categories.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('locations')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'locations'
              ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
              : 'text-black dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-[#1C263A]'
          }`}
        >
          Money Locations ({locations.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('income')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'income'
              ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
              : 'text-black dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-[#1C263A]'
          }`}
        >
          Income Sources ({incomeSources.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('general')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'general'
              ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
              : 'text-black dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-[#1C263A]'
          }`}
        >
          General & Preferences
        </button>
      </div>

      {/* SUB-TAB 1: CATEGORIES MANAGEMENT WITH DRAG AND DROP */}
      {activeSubTab === 'categories' && (
        <section className="space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div>
              <h2 className="text-sm font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>Expense Categories List</span>
                <span className="text-[11px] font-bold text-neutral-400 normal-case">(Drag to reorder)</span>
              </h2>
              <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                Reordering here automatically updates the order in the Add Transaction modal & Dashboard charts.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddCategory}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all shadow-sm active:scale-95 cursor-pointer self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>Add Category</span>
            </button>
          </div>

          <div className="bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-2xl overflow-hidden divide-y divide-neutral-200 dark:divide-[#243048] shadow-sm">
            {categories.map((cat, index) => {
              const isDragging = draggedCatIndex === index;
              const isDragOver = dragOverCatIndex === index;

              return (
                <div
                  key={cat.id}
                  draggable
                  onDragStart={(e) => handleCategoryDragStart(e, index)}
                  onDragOver={(e) => handleCategoryDragOver(e, index)}
                  onDrop={(e) => handleCategoryDrop(e, index)}
                  onDragEnd={handleCategoryDragEnd}
                  className={`flex items-center justify-between p-4 transition-all duration-200 ${
                    isDragging ? 'opacity-40 bg-neutral-300 dark:bg-neutral-800 scale-98' : 'hover:bg-white dark:hover:bg-[#1C263A]'
                  } ${
                    isDragOver && !isDragging
                      ? 'border-t-2 border-black dark:border-white bg-white/80 dark:bg-[#1C263A]'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Drag Handle */}
                    <div
                      title="Drag to reorder"
                      className="cursor-grab active:cursor-grabbing p-1 text-neutral-400 hover:text-black dark:hover:text-white touch-none"
                    >
                      <span className="material-symbols-outlined text-xl">drag_indicator</span>
                    </div>

                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0"
                      style={{ backgroundColor: cat.color || '#0066FF' }}
                    >
                      <span className="material-symbols-outlined text-xl">{cat.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-black dark:text-white block leading-snug truncate">
                          {cat.name}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">#{index + 1}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            cat.defaultNeed
                              ? 'bg-[#0052FF]/15 text-[#0052FF] dark:text-[#60A5FA]'
                              : 'bg-[#00C853]/15 text-[#00C853] dark:text-[#4ADE80]'
                          }`}
                        >
                          Default: {cat.defaultNeed ? 'NEED' : 'WANT'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Mobile & Accessible Reorder Buttons */}
                    <div className="flex items-center mr-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveCategoryItem(index, 'up')}
                        className="p-1.5 text-neutral-400 hover:text-black dark:hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                        title="Move Up"
                      >
                        <span className="material-symbols-outlined text-base font-black">arrow_upward</span>
                      </button>
                      <button
                        type="button"
                        disabled={index === categories.length - 1}
                        onClick={() => moveCategoryItem(index, 'down')}
                        className="p-1.5 text-neutral-400 hover:text-black dark:hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                        title="Move Down"
                      >
                        <span className="material-symbols-outlined text-base font-black">arrow_downward</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => openEditCategory(cat)}
                      className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
                      title="Edit Category"
                    >
                      <span className="material-symbols-outlined text-lg font-black">edit</span>
                    </button>
                    {categories.length > 2 && (
                      <button
                        type="button"
                        onClick={() => deleteCategory(cat.id)}
                        className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        <span className="material-symbols-outlined text-lg font-black">delete</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SUB-TAB 2: MONEY LOCATIONS MANAGEMENT WITH DRAG AND DROP */}
      {activeSubTab === 'locations' && (
        <section className="space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div>
              <h2 className="text-sm font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>Money Locations (Cash, Bank, Wallets)</span>
                <span className="text-[11px] font-bold text-neutral-400 normal-case">(Drag to reorder)</span>
              </h2>
              <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                Track real-time balances: Initial + Income - Expense + Transfers In - Transfers Out.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddLocation}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all shadow-sm active:scale-95 cursor-pointer self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>Add Location</span>
            </button>
          </div>

          <div className="bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-2xl overflow-hidden divide-y divide-neutral-200 dark:divide-[#243048] shadow-sm">
            {locations.map((loc, index) => {
              const currentBalance = locationBalances[loc.id] ?? loc.initialBalance;
              const isDragging = draggedLocIndex === index;
              const isDragOver = dragOverLocIndex === index;

              return (
                <div
                  key={loc.id}
                  draggable
                  onDragStart={(e) => handleLocationDragStart(e, index)}
                  onDragOver={(e) => handleLocationDragOver(e, index)}
                  onDrop={(e) => handleLocationDrop(e, index)}
                  onDragEnd={handleLocationDragEnd}
                  className={`flex items-center justify-between p-4 transition-all duration-200 ${
                    isDragging ? 'opacity-40 bg-neutral-300 dark:bg-neutral-800 scale-98' : 'hover:bg-white dark:hover:bg-[#1C263A]'
                  } ${
                    isDragOver && !isDragging
                      ? 'border-t-2 border-black dark:border-white bg-white/80 dark:bg-[#1C263A]'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Drag Handle */}
                    <div
                      title="Drag to reorder"
                      className="cursor-grab active:cursor-grabbing p-1 text-neutral-400 hover:text-black dark:hover:text-white touch-none"
                    >
                      <span className="material-symbols-outlined text-xl">drag_indicator</span>
                    </div>

                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0"
                      style={{ backgroundColor: loc.color || '#0066FF' }}
                    >
                      <span className="material-symbols-outlined text-xl">{loc.icon}</span>
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-black dark:text-white block truncate">
                          {loc.name}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">#{index + 1}</span>
                        {loc.isSavings && (
                          <span className="px-2 py-0.5 rounded-full bg-[#FF9500]/15 text-[#FF9500] text-[10px] font-black shrink-0">
                            Savings Reserve
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mt-0.5">
                        Type: {loc.type.toUpperCase()} • Starting: {formatMoney(loc.initialBalance)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <div className="text-right">
                      <span className="text-sm font-black text-black dark:text-white block tabular-nums">
                        {formatMoney(currentBalance)}
                      </span>
                      <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400">
                        Available
                      </span>
                    </div>

                    <div className="flex items-center">
                      {/* Mobile Reorder Arrows */}
                      <div className="flex items-center mr-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveLocationItem(index, 'up')}
                          className="p-1.5 text-neutral-400 hover:text-black dark:hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                          title="Move Up"
                        >
                          <span className="material-symbols-outlined text-base font-black">arrow_upward</span>
                        </button>
                        <button
                          type="button"
                          disabled={index === locations.length - 1}
                          onClick={() => moveLocationItem(index, 'down')}
                          className="p-1.5 text-neutral-400 hover:text-black dark:hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                          title="Move Down"
                        >
                          <span className="material-symbols-outlined text-base font-black">arrow_downward</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => openEditLocation(loc)}
                        className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
                        title="Edit Location"
                      >
                        <span className="material-symbols-outlined text-lg font-black">edit</span>
                      </button>
                      {locations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => deleteLocation(loc.id)}
                          className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                          title="Delete Location"
                        >
                          <span className="material-symbols-outlined text-lg font-black">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SUB-TAB 3: INCOME SOURCES MANAGEMENT WITH DRAG AND DROP */}
      {activeSubTab === 'income' && (
        <section className="space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div>
              <h2 className="text-sm font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>Income Sources List</span>
                <span className="text-[11px] font-bold text-neutral-400 normal-case">(Drag to reorder)</span>
              </h2>
              <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                Populates the Income Tracker dropdowns when recording inflows.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddIncomeSource}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all shadow-sm active:scale-95 cursor-pointer self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>Add Source</span>
            </button>
          </div>

          <div className="bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-2xl overflow-hidden divide-y divide-neutral-200 dark:divide-[#243048] shadow-sm">
            {incomeSources.map((src, index) => {
              const isDragging = draggedSrcIndex === index;
              const isDragOver = dragOverSrcIndex === index;

              return (
                <div
                  key={src.id}
                  draggable
                  onDragStart={(e) => handleSourceDragStart(e, index)}
                  onDragOver={(e) => handleSourceDragOver(e, index)}
                  onDrop={(e) => handleSourceDrop(e, index)}
                  onDragEnd={handleSourceDragEnd}
                  className={`flex items-center justify-between p-4 transition-all duration-200 ${
                    isDragging ? 'opacity-40 bg-neutral-300 dark:bg-neutral-800 scale-98' : 'hover:bg-white dark:hover:bg-[#1C263A]'
                  } ${
                    isDragOver && !isDragging
                      ? 'border-t-2 border-black dark:border-white bg-white/80 dark:bg-[#1C263A]'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Drag Handle */}
                    <div
                      title="Drag to reorder"
                      className="cursor-grab active:cursor-grabbing p-1 text-neutral-400 hover:text-black dark:hover:text-white touch-none"
                    >
                      <span className="material-symbols-outlined text-xl">drag_indicator</span>
                    </div>

                    <div className="w-10 h-10 rounded-2xl bg-[#00C853] flex items-center justify-center text-white shadow-sm shrink-0">
                      <span className="material-symbols-outlined text-xl">{src.icon}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-sm font-black text-black dark:text-white truncate">
                        {src.name}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400">#{index + 1}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Mobile Reorder Arrows */}
                    <div className="flex items-center mr-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveSourceItem(index, 'up')}
                        className="p-1.5 text-neutral-400 hover:text-black dark:hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                        title="Move Up"
                      >
                        <span className="material-symbols-outlined text-base font-black">arrow_upward</span>
                      </button>
                      <button
                        type="button"
                        disabled={index === incomeSources.length - 1}
                        onClick={() => moveSourceItem(index, 'down')}
                        className="p-1.5 text-neutral-400 hover:text-black dark:hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                        title="Move Down"
                      >
                        <span className="material-symbols-outlined text-base font-black">arrow_downward</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => openEditIncomeSource(src)}
                      className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
                      title="Edit Source"
                    >
                      <span className="material-symbols-outlined text-lg font-black">edit</span>
                    </button>
                    {incomeSources.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteIncomeSource(src.id)}
                        className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                        title="Delete Source"
                      >
                        <span className="material-symbols-outlined text-lg font-black">delete</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SUB-TAB 4: GENERAL PREFERENCES & BACKUP */}
      {activeSubTab === 'general' && (
        <section className="space-y-6 animate-fadeIn">
          {/* Spending Psychology Overview */}
          <div>
            <h2 className="text-xs font-black text-black dark:text-white uppercase tracking-wider mb-2 pl-2">
              Spending Psychology • Need vs. Want
            </h2>
            <div className="p-4 rounded-2xl bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] space-y-2 shadow-sm text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#0052FF] text-white font-black text-[10px]">
                  NEED
                </span>
                <span className="font-black text-black dark:text-white">Essentials (Target: ~50%)</span>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 font-bold pl-1">
                Housing, basic groceries, utilities, health care, transport to work, education.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#00C853] text-white font-black text-[10px]">
                  WANT
                </span>
                <span className="font-black text-black dark:text-white">Discretionary (Target: ~30%)</span>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 font-bold pl-1">
                Dining out, coffee runs, shopping, entertainment, subscriptions, trips.
              </p>
            </div>
          </div>

          {/* App Preferences */}
          <div>
            <h2 className="text-xs font-black text-black dark:text-white uppercase tracking-wider mb-2 pl-2">
              Preferences
            </h2>
            <div className="bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-2xl overflow-hidden divide-y divide-neutral-200 dark:divide-[#243048] shadow-sm">
              {/* Currency */}
              <div
                onClick={() => setCurrencyModal(true)}
                className="flex items-center justify-between p-4 hover:bg-white dark:hover:bg-[#1C263A] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center text-black dark:text-white">
                    <span className="material-symbols-outlined text-xl">payments</span>
                  </div>
                  <div>
                    <span className="text-sm font-black text-black dark:text-white block">Base Currency</span>
                    <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">{settings.currency}</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-black dark:text-white font-black">chevron_right</span>
              </div>

              {/* Dark Mode */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center text-black dark:text-white">
                    <span className="material-symbols-outlined text-xl">
                      {settings.darkMode ? 'dark_mode' : 'light_mode'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-black text-black dark:text-white block">Dark Mode</span>
                    <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                      {settings.darkMode ? 'Active (Dark theme)' : 'Inactive (Light theme)'}
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.darkMode}
                    onChange={(e) => updateSettings({ darkMode: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-300 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00C853]"></div>
                </label>
              </div>

              {/* Push Alerts */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center text-black dark:text-white">
                    <span className="material-symbols-outlined text-xl">campaign</span>
                  </div>
                  <div>
                    <span className="text-sm font-black text-black dark:text-white block">Transaction Alerts</span>
                    <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">Inflow & limit alerts</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.pushAlerts}
                    onChange={(e) => updateSettings({ pushAlerts: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-300 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00C853]"></div>
                </label>
              </div>

              {/* Auto Bank SMS Transaction Detection */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center text-amber-500">
                    <span className="material-symbols-outlined text-xl font-black">bolt</span>
                  </div>
                  <div>
                    <span className="text-sm font-black text-black dark:text-white block">
                      Auto Bank SMS Detection (1-Tap Add)
                    </span>
                    <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                      Detect bank transaction SMS & quick-add
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAutoSmsModalOpen(true)}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-black transition cursor-pointer"
                  >
                    Scan Inbox
                  </button>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoSmsDetection !== false}
                      onChange={(e) => updateSettings({ autoSmsDetection: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-300 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00C853]"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Backup & Data Management */}
          <div>
            <h2 className="text-xs font-black text-black dark:text-white uppercase tracking-wider mb-2 pl-2">
              Cloud Sync & Data
            </h2>
            <div className="bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-2xl overflow-hidden divide-y divide-neutral-200 dark:divide-[#243048] shadow-sm">
              <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-[#1C263A]/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center text-[#00C853]">
                    <span className="material-symbols-outlined text-xl">cloud_done</span>
                  </div>
                  <div>
                    <span className="text-sm font-black text-black dark:text-white block">Firebase Firestore Cloud</span>
                    <span className="text-xs font-bold text-[#00C853]">Connected • Real-Time Cloud Persistence</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => syncToCloud()}
                  className="text-[11px] font-black px-3 py-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:opacity-80 active:scale-95 transition-all shadow-sm cursor-pointer"
                >
                  {cloudSyncStatus === 'syncing' ? 'Syncing...' : 'Sync All Now ☁️'}
                </button>
              </div>

              {/* Hidden file input for backup import */}
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Export Backup */}
              <div
                onClick={exportBackupData}
                className="flex items-center justify-between p-4 hover:bg-white dark:hover:bg-[#1C263A] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center text-black dark:text-white">
                    <span className="material-symbols-outlined text-xl">download</span>
                  </div>
                  <div>
                    <span className="text-sm font-black text-black dark:text-white block">Export Backup</span>
                    <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">Download backup_kanakku.json</span>
                  </div>
                </div>
                <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#2E3C56] text-black dark:text-white">
                  Export JSON
                </span>
              </div>

              {/* Import Backup */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-between p-4 hover:bg-white dark:hover:bg-[#1C263A] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center text-black dark:text-white">
                    <span className="material-symbols-outlined text-xl">upload_file</span>
                  </div>
                  <div>
                    <span className="text-sm font-black text-black dark:text-white block">Import Backup</span>
                    <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">Select & restore a .json backup file</span>
                  </div>
                </div>
                <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black shadow-sm">
                  Upload File
                </span>
              </div>

              {/* Reset App */}
              <div
                onClick={() => setResetModal(true)}
                className="flex items-center justify-between p-4 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center text-rose-600">
                    <span className="material-symbols-outlined text-xl">restart_alt</span>
                  </div>
                  <div>
                    <span className="text-sm font-black text-rose-600 block">Reset App (Clean Slate)</span>
                    <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">Wipe data and restart first-time setup</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-rose-600 font-black">chevron_right</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* MODAL: ADD / EDIT CATEGORY */}
      {categoryModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#141B2A] rounded-3xl p-6 shadow-2xl space-y-4 border border-neutral-200 dark:border-[#243048] animate-slideUp text-black dark:text-white">
            <h3 className="text-lg font-black text-black dark:text-white">
              {categoryModal.item ? 'Edit Category' : 'New Expense Category'}
            </h3>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-black dark:text-neutral-300 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g., Groceries, Pet Care"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white font-bold text-sm outline-none border border-neutral-200 dark:border-[#2E3C56] focus:border-black dark:focus:border-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black dark:text-neutral-300 mb-1">Icon</label>
                <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-1 border border-neutral-200 dark:border-[#2E3C56] rounded-xl">
                  {ICON_PALETTE.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setCatIcon(icon)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                        catIcon === icon
                          ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm scale-105'
                          : 'bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">{icon}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-black dark:text-neutral-300 mb-1">Accent Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCatColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform cursor-pointer ${
                        catColor === c ? 'ring-3 ring-black dark:ring-white scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F4F5F7] dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56]">
                <div>
                  <span className="text-xs font-black text-black dark:text-white block">Default Need vs. Want</span>
                  <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400">Auto-suggested classification</span>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setCatDefaultNeed(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      catDefaultNeed ? 'bg-[#0052FF] text-white shadow-sm' : 'bg-white dark:bg-[#141B2A] border border-neutral-200 dark:border-[#2E3C56] text-black dark:text-white'
                    }`}
                  >
                    Need
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatDefaultNeed(false)}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      !catDefaultNeed ? 'bg-[#00C853] text-white shadow-sm' : 'bg-white dark:bg-[#141B2A] border border-neutral-200 dark:border-[#2E3C56] text-black dark:text-white'
                    }`}
                  >
                    Want
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCategoryModal({ open: false, item: null })}
                  className="flex-1 py-2.5 rounded-xl text-sm font-black bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-sm font-black bg-black dark:bg-white text-white dark:text-black hover:opacity-90 shadow-sm cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT LOCATION */}
      {locationModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#141B2A] rounded-3xl p-6 shadow-2xl space-y-4 border border-neutral-200 dark:border-[#243048] animate-slideUp text-black dark:text-white">
            <h3 className="text-lg font-black text-black dark:text-white">
              {locationModal.item ? 'Edit Money Location' : 'New Money Location'}
            </h3>
            <form onSubmit={handleSaveLocation} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-black dark:text-neutral-300 mb-1">Location Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  placeholder="e.g., HDFC Salary Account, Cash Wallet"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white font-bold text-sm outline-none border border-neutral-200 dark:border-[#2E3C56] focus:border-black dark:focus:border-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black dark:text-neutral-300 mb-1">Location Type</label>
                <select
                  value={locType}
                  onChange={(e) => setLocType(e.target.value as LocationType)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white font-bold text-sm outline-none border border-neutral-200 dark:border-[#2E3C56] focus:border-black dark:focus:border-white cursor-pointer"
                >
                  <option value="cash" className="bg-white dark:bg-[#141B2A]">Cash in Hand</option>
                  <option value="bank" className="bg-white dark:bg-[#141B2A]">Bank / Checking Account</option>
                  <option value="wallet" className="bg-white dark:bg-[#141B2A]">Digital Wallet (UPI / GPay / Apple Pay)</option>
                  <option value="savings" className="bg-white dark:bg-[#141B2A]">Savings Account</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-black dark:text-neutral-300 mb-1">Starting Balance</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={locInitialBalance}
                  onChange={(e) => setLocInitialBalance(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white font-black text-sm outline-none border border-neutral-200 dark:border-[#2E3C56] focus:border-black dark:focus:border-white tabular-nums"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F4F5F7] dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56]">
                <div>
                  <span className="text-xs font-black text-black dark:text-white block">Savings Reserve</span>
                  <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400">Counts towards Total Savings metric</span>
                </div>
                <input
                  type="checkbox"
                  checked={locIsSavings || locType === 'savings'}
                  onChange={(e) => setLocIsSavings(e.target.checked)}
                  className="w-5 h-5 rounded accent-black dark:accent-white cursor-pointer"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLocationModal({ open: false, item: null })}
                  className="flex-1 py-2.5 rounded-xl text-sm font-black bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-sm font-black bg-black dark:bg-white text-white dark:text-black hover:opacity-90 shadow-sm cursor-pointer"
                >
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT INCOME SOURCE */}
      {incomeSourceModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-[#141B2A] rounded-3xl p-6 shadow-2xl space-y-4 border border-neutral-200 dark:border-[#243048] animate-slideUp text-black dark:text-white">
            <h3 className="text-lg font-black text-black dark:text-white">
              {incomeSourceModal.item ? 'Edit Income Source' : 'New Income Source'}
            </h3>
            <form onSubmit={handleSaveIncomeSource} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-black dark:text-neutral-300 mb-1">Source Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={incName}
                  onChange={(e) => setIncName(e.target.value)}
                  placeholder="e.g., Consulting, Dividends"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white font-bold text-sm outline-none border border-neutral-200 dark:border-[#2E3C56] focus:border-black dark:focus:border-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIncomeSourceModal({ open: false, item: null })}
                  className="flex-1 py-2.5 rounded-xl text-sm font-black bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-sm font-black bg-black dark:bg-white text-white dark:text-black hover:opacity-90 shadow-sm cursor-pointer"
                >
                  Save Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CURRENCY SELECTOR */}
      {currencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-[#141B2A] rounded-3xl p-6 shadow-2xl space-y-4 border border-neutral-200 dark:border-[#243048] animate-slideUp text-black dark:text-white">
            <h3 className="text-lg font-black text-black dark:text-white">Select Base Currency</h3>
            <div className="space-y-2">
              {currencies.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    updateSettings({ currency: c.code });
                    setCurrencyModal(false);
                  }}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all cursor-pointer ${
                    settings.currency === c.code
                      ? 'bg-black dark:bg-white text-white dark:text-black font-black'
                      : 'bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-[#2E3C56]'
                  }`}
                >
                  <span className="text-sm">{c.label} ({c.symbol})</span>
                  <span className="font-mono text-xs font-black">{c.code}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setCurrencyModal(false)}
              className="w-full py-2.5 rounded-xl text-sm font-black bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* MODAL: APP RESET CONFIRMATION */}
      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-[#141B2A] rounded-3xl p-6 shadow-2xl space-y-4 text-center border border-neutral-200 dark:border-[#243048] animate-slideUp text-black dark:text-white">
            <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl font-black">warning</span>
            </div>
            <h3 className="text-lg font-black text-black dark:text-white">Reset to Clean Slate?</h3>
            <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400 leading-relaxed">
              This will wipe all transactions, accounts, and profile data from storage and return you to the initial onboarding screen.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetModal(false)}
                className="flex-1 py-3 rounded-2xl text-xs md:text-sm font-black bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setResetModal(false);
                  resetOnboarding();
                }}
                className="flex-1 py-3 rounded-2xl text-xs md:text-sm font-black bg-rose-600 text-white hover:bg-rose-700 shadow-md cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
