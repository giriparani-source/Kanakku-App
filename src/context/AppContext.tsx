import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Transaction,
  IncomeTransaction,
  ExpenseTransaction,
  TransferTransaction,
  UserProfile,
  MoneyLocation,
  ExpenseCategory,
  IncomeSource,
  AppNotification,
  AppSettings,
  CategoryBudget,
  CurrencyCode,
  NeedWantType,
  TransferType,
  UserProfession,
} from '../types';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_LOCATIONS,
  DEFAULT_INCOME_SOURCES,
  INITIAL_PROFILE,
  INITIAL_TRANSACTIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SETTINGS,
  INITIAL_BUDGETS,
} from '../constants/data';
import {
  subscribeToProfile,
  subscribeToSettings,
  subscribeToCategories,
  subscribeToLocations,
  subscribeToIncomeSources,
  subscribeToBudgets,
  subscribeToTransactions,
  saveProfileToFirestore,
  saveSettingsToFirestore,
  saveCategoriesToFirestore,
  saveLocationsToFirestore,
  saveIncomeSourcesToFirestore,
  saveBudgetsToFirestore,
  saveTransactionToFirestore,
  deleteTransactionFromFirestore,
  clearAllTransactionsFromFirestore,
  syncAllDataToFirestore,
} from '../services/firestoreService';

interface AppContextType {
  // Navigation
  activeTab: 'home' | 'insights' | 'add' | 'budget' | 'profile' | 'settings';
  setActiveTab: (tab: 'home' | 'insights' | 'add' | 'budget' | 'profile' | 'settings') => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  selectedTransaction: Transaction | null;
  setSelectedTransaction: (tx: Transaction | null) => void;
  notificationCenterOpen: boolean;
  setNotificationCenterOpen: (open: boolean) => void;

  // Cloud Sync Status
  isCloudSynced: boolean;
  cloudSyncStatus: 'synced' | 'syncing' | 'offline';

  // App Security / PIN Lock
  isAppUnlocked: boolean;
  setIsAppUnlocked: (unlocked: boolean) => void;
  setPinLock: (enabled: boolean, pin?: string) => Promise<void>;

  // Onboarding
  isOnboarded: boolean;
  completeOnboarding: (data?: {
    name?: string;
    age?: number | string;
    profession?: UserProfession;
    currency?: CurrencyCode;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    locationsWithBalances?: { id: string; name: string; type: MoneyLocation['type']; initialBalance: number; isSavings?: boolean }[];
  }) => Promise<void>;
  resetOnboarding: () => void;

  // Profile & Settings
  profile: UserProfile;
  updateProfile: (profile: Partial<UserProfile>) => void;
  updateProfileAvatar: (base64Image: string) => Promise<void>;
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  notifications: AppNotification[];
  markAllNotificationsAsRead: () => void;
  clearNotification: (id: string) => void;

  // Categories
  categories: ExpenseCategory[];
  addCategory: (cat: Omit<ExpenseCategory, 'id'>) => void;
  updateCategory: (id: string, cat: Partial<ExpenseCategory>) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (newCategories: ExpenseCategory[]) => void;

  // Locations
  locations: MoneyLocation[];
  addLocation: (loc: Omit<MoneyLocation, 'id'>) => void;
  updateLocation: (id: string, loc: Partial<MoneyLocation>) => void;
  deleteLocation: (id: string) => void;
  reorderLocations: (newLocations: MoneyLocation[]) => void;

  // Income Sources
  incomeSources: IncomeSource[];
  addIncomeSource: (src: Omit<IncomeSource, 'id'>) => void;
  updateIncomeSource: (id: string, src: Partial<IncomeSource>) => void;
  deleteIncomeSource: (id: string) => void;
  reorderIncomeSources: (newSources: IncomeSource[]) => void;

  budgets: CategoryBudget[];
  updateBudget: (category: string, limit: number) => void;

  // Transactions (Modules B, C, D)
  transactions: Transaction[];
  addIncome: (data: {
    source: string;
    amount: number;
    locationId: string;
    date?: string;
    time?: string;
    notes?: string;
  }) => void;
  addExpense: (data: {
    description: string;
    category: string;
    amount: number;
    locationId: string;
    needWant: NeedWantType; // Mandatory
    date?: string;
    time?: string;
    notes?: string;
    isRecurring?: boolean;
  }) => void;
  addTransfer: (data: {
    transferType: TransferType;
    amount: number;
    locationId: string;
    fromLocationId?: string;
    toLocationId?: string;
    date?: string;
    time?: string;
    notes?: string;
  }) => void;
  updateTransaction: (id: string, updatedTx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // Computed Real-Time Balances & Metrics
  locationBalances: Record<string, number>;
  getLocationBalance: (locationId: string) => number;
  totalAvailable: number;
  totalSavings: number;
  totalNetWorth: number;
  totalReceived: number;
  totalExpenses: number;
  netCashFlow: number;

  // Need vs. Want Metrics
  needAmount: number;
  wantAmount: number;
  needPercentage: number;
  wantPercentage: number;

  // Category Breakdown for Pie Chart
  spendingByCategory: {
    name: string;
    amount: number;
    percentage: number;
    color: string;
    icon: string;
  }[];

  // Helpers
  formatMoney: (amount: number, forceCurrency?: CurrencyCode) => string;
  getCurrencySymbol: (curr?: CurrencyCode) => string;
  syncToCloud: () => Promise<void>;
  exportBackupData: () => void;
  importBackupData: (backupData: any) => Promise<boolean>;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
};

const STORAGE_KEYS = {
  ONBOARDED: 'kanakku_v2_onboarded',
  PROFILE: 'kanakku_v2_profile',
  SETTINGS: 'kanakku_v2_settings',
  LOCATIONS: 'kanakku_v2_locations',
  CATEGORIES: 'kanakku_v2_categories',
  INCOME_SOURCES: 'kanakku_v2_income_sources',
  TRANSACTIONS: 'kanakku_v2_transactions',
  NOTIFICATIONS: 'kanakku_v2_notifications',
  BUDGETS: 'kanakku_v2_budgets',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'insights' | 'add' | 'budget' | 'profile' | 'settings'>('home');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Cloud status
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');

  // Onboarding status
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDED) === 'true';
  });

  // Session App Lock status
  const [isAppUnlocked, setIsAppUnlocked] = useState<boolean>(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        return !parsed.isPinLockEnabled;
      } catch (e) {
        return true;
      }
    }
    return true;
  });

  // Persistent States (Initialized from cache, synced with Firestore)
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return saved ? JSON.parse(saved) : INITIAL_PROFILE;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [categories, setCategories] = useState<ExpenseCategory[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [locations, setLocations] = useState<MoneyLocation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOCATIONS);
    return saved ? JSON.parse(saved) : DEFAULT_LOCATIONS;
  });

  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INCOME_SOURCES);
    return saved ? JSON.parse(saved) : DEFAULT_INCOME_SOURCES;
  });

  const [budgets, setBudgets] = useState<CategoryBudget[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // ==========================================
  // FIRESTORE REAL-TIME SYNCHRONIZATION
  // ==========================================
  useEffect(() => {
    setCloudSyncStatus('syncing');

    // Subscribe to Firestore collections & documents in real-time
    const unsubProfile = subscribeToProfile((cloudProfile) => {
      if (cloudProfile) {
        setProfile(cloudProfile);
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(cloudProfile));
      }
    });

    const unsubSettings = subscribeToSettings((cloudSettings) => {
      if (cloudSettings) {
        setSettings(cloudSettings);
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(cloudSettings));
      }
    });

    const unsubCategories = subscribeToCategories((cloudCategories) => {
      if (cloudCategories && cloudCategories.length > 0) {
        setCategories(cloudCategories);
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cloudCategories));
      }
    });

    const unsubLocations = subscribeToLocations((cloudLocations) => {
      if (cloudLocations && cloudLocations.length > 0) {
        setLocations(cloudLocations);
        localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(cloudLocations));
      }
    });

    const unsubIncomeSources = subscribeToIncomeSources((cloudSources) => {
      if (cloudSources && cloudSources.length > 0) {
        setIncomeSources(cloudSources);
        localStorage.setItem(STORAGE_KEYS.INCOME_SOURCES, JSON.stringify(cloudSources));
      }
    });

    const unsubBudgets = subscribeToBudgets((cloudBudgets) => {
      if (cloudBudgets && cloudBudgets.length > 0) {
        setBudgets(cloudBudgets);
        localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(cloudBudgets));
      }
    });

    const unsubTransactions = subscribeToTransactions((cloudTransactions) => {
      setTransactions(cloudTransactions);
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(cloudTransactions));
      setIsCloudSynced(true);
      setCloudSyncStatus('synced');
    });

    // Auto-seed Firestore on initial load if user is onboarded
    if (localStorage.getItem(STORAGE_KEYS.ONBOARDED) === 'true') {
      const savedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const savedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      const savedLocations = localStorage.getItem(STORAGE_KEYS.LOCATIONS);
      const savedSources = localStorage.getItem(STORAGE_KEYS.INCOME_SOURCES);
      const savedBudgets = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      const savedTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);

      syncAllDataToFirestore({
        profile: savedProfile ? JSON.parse(savedProfile) : profile,
        settings: savedSettings ? JSON.parse(savedSettings) : settings,
        categories: savedCategories ? JSON.parse(savedCategories) : categories,
        locations: savedLocations ? JSON.parse(savedLocations) : locations,
        incomeSources: savedSources ? JSON.parse(savedSources) : incomeSources,
        budgets: savedBudgets ? JSON.parse(savedBudgets) : budgets,
        transactions: savedTx ? JSON.parse(savedTx) : transactions,
      }).catch((e) => console.warn('Auto cloud sync notice:', e));
    }

    return () => {
      unsubProfile();
      unsubSettings();
      unsubCategories();
      unsubLocations();
      unsubIncomeSources();
      unsubBudgets();
      unsubTransactions();
    };
  }, []);

  // Theme Sync Effect
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [settings.darkMode]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // ==========================================
  // REAL-TIME BALANCE COMPUTATION ENGINE
  // ==========================================
  const locationBalances = useMemo(() => {
    const map: Record<string, number> = {};

    // 1. Initialize starting balances
    locations.forEach((loc) => {
      map[loc.id] = Number(loc.initialBalance) || 0;
    });

    // 2. Iterate transactions
    transactions.forEach((tx) => {
      if (tx.type === 'income') {
        const inc = tx as IncomeTransaction;
        if (inc.locationId && map[inc.locationId] !== undefined) {
          map[inc.locationId] += inc.amount;
        }
      } else if (tx.type === 'expense') {
        const exp = tx as ExpenseTransaction;
        if (exp.locationId && map[exp.locationId] !== undefined) {
          map[exp.locationId] -= exp.amount;
        }
      } else if (tx.type === 'transfer') {
        const tr = tx as TransferTransaction;
        if (tr.transferType === 'transfer') {
          if (tr.fromLocationId && map[tr.fromLocationId] !== undefined) {
            map[tr.fromLocationId] -= tr.amount;
          }
          if (tr.toLocationId && map[tr.toLocationId] !== undefined) {
            map[tr.toLocationId] += tr.amount;
          }
        } else if (tr.transferType === 'deposit') {
          const target = tr.toLocationId || tr.locationId;
          if (target && map[target] !== undefined) {
            map[target] += tr.amount;
          }
        } else if (tr.transferType === 'withdrawal') {
          const src = tr.fromLocationId || tr.locationId;
          if (src && map[src] !== undefined) {
            map[src] -= tr.amount;
          }
        }
      }
    });

    return map;
  }, [locations, transactions]);

  const getLocationBalance = (locationId: string) => {
    return locationBalances[locationId] ?? 0;
  };

  const totalAvailable = useMemo(() => {
    return locations
      .filter((loc) => !loc.isSavings && loc.type !== 'savings')
      .reduce((sum, loc) => sum + (locationBalances[loc.id] || 0), 0);
  }, [locations, locationBalances]);

  const totalSavings = useMemo(() => {
    return locations
      .filter((loc) => loc.isSavings || loc.type === 'savings')
      .reduce((sum, loc) => sum + (locationBalances[loc.id] || 0), 0);
  }, [locations, locationBalances]);

  const totalNetWorth = useMemo(() => {
    return locations.reduce((sum, loc) => sum + (locationBalances[loc.id] || 0), 0);
  }, [locations, locationBalances]);

  const incomeTransactions = useMemo(() => {
    return transactions.filter((t): t is IncomeTransaction => t.type === 'income');
  }, [transactions]);

  const expenseTransactions = useMemo(() => {
    return transactions.filter((t): t is ExpenseTransaction => t.type === 'expense');
  }, [transactions]);

  const totalReceived = useMemo(() => {
    return incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [incomeTransactions]);

  const totalExpenses = useMemo(() => {
    return expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [expenseTransactions]);

  const netCashFlow = totalReceived - totalExpenses;

  // Need vs. Want Calculations
  const needAmount = useMemo(() => {
    return expenseTransactions
      .filter((t) => t.needWant === 'Need')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [expenseTransactions]);

  const wantAmount = useMemo(() => {
    return expenseTransactions
      .filter((t) => t.needWant === 'Want')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [expenseTransactions]);

  const totalCategorizedExpenses = needAmount + wantAmount;
  const needPercentage = totalCategorizedExpenses > 0
    ? Math.round((needAmount / totalCategorizedExpenses) * 100)
    : 0;
  const wantPercentage = totalCategorizedExpenses > 0
    ? 100 - needPercentage
    : 0;

  // Category Breakdown for Pie Chart (Preserves user custom defined order)
  const spendingByCategory = useMemo(() => {
    const totals: Record<string, number> = {};
    expenseTransactions.forEach((tx) => {
      const cat = tx.category || 'Other Expenses';
      totals[cat] = (totals[cat] || 0) + tx.amount;
    });

    const totalExp = totalExpenses > 0 ? totalExpenses : 1;

    // 1. Categories in user's custom defined order
    const list = categories
      .filter((c) => (totals[c.name] || 0) > 0)
      .map((c) => {
        const amt = totals[c.name] || 0;
        return {
          name: c.name,
          amount: amt,
          percentage: Math.round((amt / totalExp) * 100),
          color: c.color || '#3B82F6',
          icon: c.icon || 'receipt',
        };
      });

    // 2. Append unlisted categories from old records
    Object.entries(totals).forEach(([catName, amt]) => {
      if (!list.some((item) => item.name.toLowerCase() === catName.toLowerCase()) && amt > 0) {
        list.push({
          name: catName,
          amount: amt,
          percentage: Math.round((amt / totalExp) * 100),
          color: '#6B7280',
          icon: 'receipt',
        });
      }
    });

    return list;
  }, [expenseTransactions, totalExpenses, categories]);

  // ==========================================
  // ASYNC FIRESTORE CRUD ACTIONS
  // ==========================================

  const addCategory = async (cat: Omit<ExpenseCategory, 'id'>) => {
    const newCat: ExpenseCategory = {
      ...cat,
      id: 'cat-' + Date.now(),
    };
    const updated = [...categories, newCat];
    setCategories(updated);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
    await saveCategoriesToFirestore(updated);
    showToast(`Category "${cat.name}" saved to Cloud`);
  };

  const updateCategory = async (id: string, partial: Partial<ExpenseCategory>) => {
    const updated = categories.map((c) => (c.id === id ? { ...c, ...partial } : c));
    setCategories(updated);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
    await saveCategoriesToFirestore(updated);
    showToast('Category updated in Cloud');
  };

  const deleteCategory = async (id: string) => {
    const updated = categories.filter((c) => c.id !== id);
    setCategories(updated);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
    await saveCategoriesToFirestore(updated);
    showToast('Category removed from Cloud');
  };

  const reorderCategories = async (newCategories: ExpenseCategory[]) => {
    setCategories(newCategories);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(newCategories));
    await saveCategoriesToFirestore(newCategories);
    showToast('Categories reordered & saved');
  };

  const addLocation = async (loc: Omit<MoneyLocation, 'id'>) => {
    const newLoc: MoneyLocation = {
      ...loc,
      id: 'loc-' + Date.now(),
    };
    const updated = [...locations, newLoc];
    setLocations(updated);
    localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(updated));
    await saveLocationsToFirestore(updated);
    showToast(`Location "${loc.name}" saved to Cloud`);
  };

  const updateLocation = async (id: string, partial: Partial<MoneyLocation>) => {
    const updated = locations.map((l) => (l.id === id ? { ...l, ...partial } : l));
    setLocations(updated);
    localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(updated));
    await saveLocationsToFirestore(updated);
    showToast('Location updated in Cloud');
  };

  const deleteLocation = async (id: string) => {
    const updated = locations.filter((l) => l.id !== id);
    setLocations(updated);
    localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(updated));
    await saveLocationsToFirestore(updated);
    showToast('Location removed from Cloud');
  };

  const reorderLocations = async (newLocations: MoneyLocation[]) => {
    setLocations(newLocations);
    localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(newLocations));
    await saveLocationsToFirestore(newLocations);
    showToast('Locations reordered & saved');
  };

  const addIncomeSource = async (src: Omit<IncomeSource, 'id'>) => {
    const newSrc: IncomeSource = {
      ...src,
      id: 'inc-' + Date.now(),
    };
    const updated = [...incomeSources, newSrc];
    setIncomeSources(updated);
    localStorage.setItem(STORAGE_KEYS.INCOME_SOURCES, JSON.stringify(updated));
    await saveIncomeSourcesToFirestore(updated);
    showToast(`Income source "${src.name}" saved to Cloud`);
  };

  const updateIncomeSource = async (id: string, partial: Partial<IncomeSource>) => {
    const updated = incomeSources.map((s) => (s.id === id ? { ...s, ...partial } : s));
    setIncomeSources(updated);
    localStorage.setItem(STORAGE_KEYS.INCOME_SOURCES, JSON.stringify(updated));
    await saveIncomeSourcesToFirestore(updated);
    showToast('Income source updated in Cloud');
  };

  const deleteIncomeSource = async (id: string) => {
    const updated = incomeSources.filter((s) => s.id !== id);
    setIncomeSources(updated);
    localStorage.setItem(STORAGE_KEYS.INCOME_SOURCES, JSON.stringify(updated));
    await saveIncomeSourcesToFirestore(updated);
    showToast('Income source removed from Cloud');
  };

  const reorderIncomeSources = async (newSources: IncomeSource[]) => {
    setIncomeSources(newSources);
    localStorage.setItem(STORAGE_KEYS.INCOME_SOURCES, JSON.stringify(newSources));
    await saveIncomeSourcesToFirestore(newSources);
    showToast('Income sources reordered & saved');
  };

  // Transactions Actions
  const addIncome = async ({
    source,
    amount,
    locationId,
    date = 'Today',
    time,
    notes,
  }: {
    source: string;
    amount: number;
    locationId: string;
    date?: string;
    time?: string;
    notes?: string;
  }) => {
    const now = new Date();
    const formattedTime = time || now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    const newTx: IncomeTransaction = {
      id: 'tx-inc-' + Date.now(),
      type: 'income',
      source,
      amount: Math.max(0, Number(amount) || 0),
      locationId,
      date,
      time: formattedTime,
      timestamp: Date.now(),
      notes: notes?.trim() || undefined,
    };

    setTransactions((prev) => [newTx, ...prev]);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([newTx, ...transactions]));
    await saveTransactionToFirestore(newTx);
    showToast(`+${formatMoney(amount)} Income saved to Cloud`);
  };

  const addExpense = async ({
    description,
    category,
    amount,
    locationId,
    needWant,
    date = 'Today',
    time,
    notes,
    isRecurring = false,
  }: {
    description: string;
    category: string;
    amount: number;
    locationId: string;
    needWant: NeedWantType; // Mandatory
    date?: string;
    time?: string;
    notes?: string;
    isRecurring?: boolean;
  }) => {
    const now = new Date();
    const formattedTime = time || now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    const newTx: ExpenseTransaction = {
      id: 'tx-exp-' + Date.now(),
      type: 'expense',
      description: description.trim() || category || 'Expense',
      category: category || categories[0]?.name || 'Other Expenses',
      amount: Math.max(0, Number(amount) || 0),
      locationId,
      needWant, // Mandatory
      date,
      time: formattedTime,
      timestamp: Date.now(),
      notes: notes?.trim() || undefined,
      isRecurring,
    };

    setTransactions((prev) => [newTx, ...prev]);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([newTx, ...transactions]));
    await saveTransactionToFirestore(newTx);
    showToast(`-${formatMoney(amount)} Expense saved [${needWant.toUpperCase()}]`);
  };

  const addTransfer = async ({
    transferType,
    amount,
    locationId,
    fromLocationId,
    toLocationId,
    date = 'Today',
    time,
    notes,
  }: {
    transferType: TransferType;
    amount: number;
    locationId: string;
    fromLocationId?: string;
    toLocationId?: string;
    date?: string;
    time?: string;
    notes?: string;
  }) => {
    const now = new Date();
    const formattedTime = time || now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    const newTx: TransferTransaction = {
      id: 'tx-tr-' + Date.now(),
      type: 'transfer',
      transferType,
      amount: Math.max(0, Number(amount) || 0),
      locationId: locationId || toLocationId || fromLocationId || '',
      fromLocationId,
      toLocationId,
      date,
      time: formattedTime,
      timestamp: Date.now(),
      notes: notes?.trim() || undefined,
    };

    setTransactions((prev) => [newTx, ...prev]);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([newTx, ...transactions]));
    await saveTransactionToFirestore(newTx);
    showToast(`Transfer of ${formatMoney(amount)} saved to Cloud`);
  };

  const updateTransaction = async (id: string, updated: Partial<Transaction>) => {
    const updatedList = transactions.map((t) => (t.id === id ? ({ ...t, ...updated } as Transaction) : t));
    setTransactions(updatedList);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updatedList));

    const targetTx = updatedList.find((t) => t.id === id);
    if (targetTx) {
      await saveTransactionToFirestore(targetTx);
    }
    if (selectedTransaction?.id === id) {
      setSelectedTransaction((prev) => (prev ? ({ ...prev, ...updated } as Transaction) : null));
    }
    showToast('Transaction updated in Cloud');
  };

  const deleteTransaction = async (id: string) => {
    const updatedList = transactions.filter((t) => t.id !== id);
    setTransactions(updatedList);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updatedList));
    await deleteTransactionFromFirestore(id);
    if (selectedTransaction?.id === id) {
      setSelectedTransaction(null);
    }
    showToast('Transaction removed from Cloud');
  };

  // Profile & Settings Mutators
  const updateProfile = async (partial: Partial<UserProfile>) => {
    const updated = { ...profile, ...partial };
    setProfile(updated);
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
    await saveProfileToFirestore(updated);
    showToast('Profile saved to Cloud');
  };

  const updateSettings = async (partial: Partial<AppSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    await saveSettingsToFirestore(updated);
    showToast('Settings saved to Cloud');
  };

  const updateBudget = async (category: string, limit: number) => {
    const updated = budgets.map((b) => (b.category === category ? { ...b, limit } : b));
    setBudgets(updated);
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(updated));
    await saveBudgetsToFirestore(updated);
    showToast('Budget updated in Cloud');
  };

  const updateProfileAvatar = async (base64Image: string) => {
    const updated: UserProfile = { ...profile, avatarUrl: base64Image };
    setProfile(updated);
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
    await saveProfileToFirestore(updated);
    showToast('Profile photo updated & saved');
  };

  const setPinLock = async (enabled: boolean, pin?: string) => {
    const updated: AppSettings = {
      ...settings,
      isPinLockEnabled: enabled,
      pinCode: pin || settings.pinCode || '1234',
    };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    await saveSettingsToFirestore(updated);
    if (enabled) {
      setIsAppUnlocked(true);
      showToast('4-Digit PIN Lock Enabled');
    } else {
      setIsAppUnlocked(true);
      showToast('PIN Lock Disabled');
    }
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Onboarding Completion & Cloud Seed
  const completeOnboarding = async (data?: {
    name?: string;
    age?: number | string;
    profession?: UserProfession;
    currency?: CurrencyCode;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    locationsWithBalances?: {
      id: string;
      name: string;
      type: MoneyLocation['type'];
      initialBalance: number;
      isSavings?: boolean;
    }[];
  }) => {
    try {
      const cleanName = (data?.name || profile.name || 'User').trim();
      const chosenCurrency = data?.currency || settings.currency || 'INR';

      const updatedProfile: UserProfile = {
        name: cleanName,
        age: data?.age !== undefined ? data.age : (profile.age || 24),
        profession: data?.profession || profile.profession || 'Salaried',
        email: (data?.email || profile.email || '').trim(),
        phone: (data?.phone || profile.phone || '').trim(),
        memberSince: profile.memberSince || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        avatarUrl: data?.avatarUrl || profile.avatarUrl || INITIAL_PROFILE.avatarUrl,
      };

      const updatedLocations: MoneyLocation[] = (data?.locationsWithBalances || locations).map((loc) => {
        const existing = DEFAULT_LOCATIONS.find((d) => d.id === loc.id) || {
          color: loc.isSavings ? '#FF9500' : loc.type === 'bank' ? '#0066FF' : loc.type === 'wallet' ? '#8B5CF6' : '#00C853',
          icon: loc.isSavings ? 'savings' : loc.type === 'bank' ? 'account_balance' : loc.type === 'wallet' ? 'account_balance_wallet' : 'payments',
          mask: loc.type.toUpperCase(),
          institution: loc.name,
        };

        return {
          id: loc.id,
          name: loc.name,
          type: loc.type,
          initialBalance: Math.max(0, Number(loc.initialBalance) || 0),
          icon: existing.icon || 'account_balance_wallet',
          color: existing.color || '#0066FF',
          isSavings: !!loc.isSavings,
          mask: existing.mask || loc.type.toUpperCase(),
          institution: existing.institution || loc.name,
        };
      });

      const updatedSettings: AppSettings = {
        ...settings,
        currency: chosenCurrency,
      };

      // 1. Immediately update React state
      setProfile(updatedProfile);
      setLocations(updatedLocations);
      setSettings(updatedSettings);
      setIsOnboarded(true);
      setActiveTab('home');

      // 2. Persist to Local Storage
      localStorage.setItem(STORAGE_KEYS.ONBOARDED, 'true');
      localStorage.setItem('hasCompletedOnboarding', 'true');
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updatedProfile));
      localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(updatedLocations));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));

      // 3. Asynchronously sync all setup data into Firebase Firestore
      try {
        await syncAllDataToFirestore({
          profile: updatedProfile,
          settings: updatedSettings,
          categories,
          locations: updatedLocations,
          incomeSources,
          budgets,
          transactions: [],
        });
        showToast('Setup complete! Connected to Cloud');
      } catch (firestoreError) {
        console.warn('Firebase Firestore initial sync notice:', firestoreError);
        showToast('Setup complete! (Saved locally & syncing)');
      }
    } catch (err) {
      console.error('Error completing onboarding:', err);
      setIsOnboarded(true);
      setActiveTab('home');
    }
  };

  const resetOnboarding = async () => {
    setIsOnboarded(false);
    setTransactions([]);
    localStorage.clear();
    await clearAllTransactionsFromFirestore();
    showToast('App reset to clean slate');
  };

  const getCurrencySymbol = (curr?: CurrencyCode) => {
    const code = curr || settings.currency || 'INR';
    return CURRENCY_SYMBOLS[code] || '₹';
  };

  const formatMoney = (amount: number, forceCurrency?: CurrencyCode) => {
    const symbol = getCurrencySymbol(forceCurrency);
    return `${symbol}${Number(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const syncToCloud = async () => {
    setCloudSyncStatus('syncing');
    try {
      await syncAllDataToFirestore({
        profile,
        settings,
        categories,
        locations,
        incomeSources,
        budgets,
        transactions,
      });
      setIsCloudSynced(true);
      setCloudSyncStatus('synced');
      showToast('All collections synced to Firebase Cloud!');
    } catch (err) {
      console.error('Manual sync error:', err);
      showToast('Cloud sync completed with local cache');
    }
  };

  const exportBackupData = () => {
    try {
      const backupPayload = {
        version: '2.0',
        appName: 'Kanakku - Personal Finance & Budget Tracker',
        exportedAt: new Date().toISOString(),
        timestamp: Date.now(),
        profile,
        settings,
        categories,
        locations,
        incomeSources,
        budgets,
        transactions,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', 'backup_kanakku.json');
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast('Backup exported successfully (backup_kanakku.json)');
    } catch (err) {
      console.error('Export error:', err);
      showToast('Failed to export backup data');
    }
  };

  const importBackupData = async (rawInput: any): Promise<boolean> => {
    try {
      let data = rawInput;
      if (typeof rawInput === 'string') {
        data = JSON.parse(rawInput);
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid backup format');
      }

      // Extract collections (supports both direct export object or stringified localStorage dump)
      const importedProfile: UserProfile = typeof data.profile === 'string' ? JSON.parse(data.profile) : data.profile || profile;
      const importedSettings: AppSettings = typeof data.settings === 'string' ? JSON.parse(data.settings) : data.settings || settings;
      const importedCategories: ExpenseCategory[] = typeof data.categories === 'string' ? JSON.parse(data.categories) : (Array.isArray(data.categories) ? data.categories : categories);
      const importedLocations: MoneyLocation[] = typeof data.locations === 'string' ? JSON.parse(data.locations) : (Array.isArray(data.locations) ? data.locations : locations);
      const importedSources: IncomeSource[] = typeof data.incomeSources === 'string' ? JSON.parse(data.incomeSources) : (Array.isArray(data.incomeSources) ? data.incomeSources : (Array.isArray(data.income_sources) ? data.income_sources : incomeSources));
      const importedBudgets: CategoryBudget[] = typeof data.budgets === 'string' ? JSON.parse(data.budgets) : (Array.isArray(data.budgets) ? data.budgets : budgets);
      const importedTx: Transaction[] = typeof data.transactions === 'string' ? JSON.parse(data.transactions) : (Array.isArray(data.transactions) ? data.transactions : transactions);

      // 1. Update React State immediately
      setProfile(importedProfile);
      setSettings(importedSettings);
      setCategories(importedCategories);
      setLocations(importedLocations);
      setIncomeSources(importedSources);
      setBudgets(importedBudgets);
      setTransactions(importedTx);
      setIsOnboarded(true);

      // 2. Update Local Storage
      localStorage.setItem(STORAGE_KEYS.ONBOARDED, 'true');
      localStorage.setItem('hasCompletedOnboarding', 'true');
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(importedProfile));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(importedSettings));
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(importedCategories));
      localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(importedLocations));
      localStorage.setItem(STORAGE_KEYS.INCOME_SOURCES, JSON.stringify(importedSources));
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(importedBudgets));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(importedTx));

      // 3. Asynchronously Sync into Firebase Firestore
      syncAllDataToFirestore({
        profile: importedProfile,
        settings: importedSettings,
        categories: importedCategories,
        locations: importedLocations,
        incomeSources: importedSources,
        budgets: importedBudgets,
        transactions: importedTx,
      }).catch((e) => console.warn('Firestore import sync notice:', e));

      showToast('Backup restored successfully! Dashboard balances updated.');
      return true;
    } catch (err) {
      console.error('Import error:', err);
      showToast('Error restoring backup: Invalid JSON file');
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isAddModalOpen,
        setIsAddModalOpen,
        selectedTransaction,
        setSelectedTransaction,
        notificationCenterOpen,
        setNotificationCenterOpen,

        isCloudSynced,
        cloudSyncStatus,

        isAppUnlocked,
        setIsAppUnlocked,
        setPinLock,

        isOnboarded,
        completeOnboarding,
        resetOnboarding,

        profile,
        updateProfile,
        updateProfileAvatar,
        settings,
        updateSettings,
        notifications,
        markAllNotificationsAsRead,
        clearNotification,

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

        budgets,
        updateBudget,

        transactions,
        addIncome,
        addExpense,
        addTransfer,
        updateTransaction,
        deleteTransaction,

        locationBalances,
        getLocationBalance,
        totalAvailable,
        totalSavings,
        totalNetWorth,
        totalReceived,
        totalExpenses,
        netCashFlow,

        needAmount,
        wantAmount,
        needPercentage,
        wantPercentage,
        spendingByCategory,

        formatMoney,
        getCurrencySymbol,
        syncToCloud,
        exportBackupData,
        importBackupData,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
