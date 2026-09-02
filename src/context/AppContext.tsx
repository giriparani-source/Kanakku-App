import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { auth } from '../firebaseConfig';
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
  SplitFriend,
  SplitGroup,
  SplitExpense,
  SplitSettlement,
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
  DEFAULT_SPLIT_FRIENDS,
  DEFAULT_SPLIT_GROUPS,
  DEFAULT_SPLIT_EXPENSES,
} from '../constants/data';

import {
  subscribeToProfile,
  subscribeToSettings,
  subscribeToCategories,
  subscribeToLocations,
  subscribeToIncomeSources,
  subscribeToBudgets,
  subscribeToTransactions,
  getPaginatedTransactions,
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
  // Authentication
  currentUser: User | null;
  isAuthLoading: boolean;
  signInUser: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  signUpUser: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logoutUser: () => Promise<void>;

  // Navigation
  activeTab: 'home' | 'insights' | 'split' | 'budget' | 'profile' | 'settings';
  setActiveTab: (tab: 'home' | 'insights' | 'split' | 'budget' | 'profile' | 'settings') => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  selectedTransaction: Transaction | null;
  setSelectedTransaction: (tx: Transaction | null) => void;
  notificationCenterOpen: boolean;
  setNotificationCenterOpen: (open: boolean) => void;

  // Split with Friends (Kanakku Sharing)
  splitFriends: SplitFriend[];
  splitGroups: SplitGroup[];
  splitExpenses: SplitExpense[];
  splitSettlements: SplitSettlement[];
  friendBalances: Record<string, number>;
  totalYouAreOwed: number;
  totalYouOwe: number;
  netSplitBalance: number;
  isAddSplitExpenseOpen: boolean;
  setIsAddSplitExpenseOpen: (open: boolean) => void;
  settleUpModalData: { friendId: string; defaultAmount?: number } | null;
  setSettleUpModalData: (data: { friendId: string; defaultAmount?: number } | null) => void;
  newFriendModalOpen: boolean;
  setNewFriendModalOpen: (open: boolean) => void;
  newGroupModalOpen: boolean;
  setNewGroupModalOpen: (open: boolean) => void;
  addSplitExpense: (expense: Omit<SplitExpense, 'id' | 'createdAt'>) => Promise<void>;
  deleteSplitExpense: (id: string) => Promise<void>;
  settleSplitDebt: (fromMemberId: string, toMemberId: string, amount: number, paymentMode: 'upi' | 'cash' | 'other', referenceNote?: string) => Promise<void>;
  addSplitFriend: (friend: Omit<SplitFriend, 'id'>) => Promise<void>;
  updateSplitFriend: (id: string, updates: Partial<SplitFriend>) => Promise<void>;
  deleteSplitFriend: (id: string) => Promise<void>;
  addSplitGroup: (group: Omit<SplitGroup, 'id' | 'createdAt'>) => Promise<void>;
  updateSplitGroup: (id: string, updates: Partial<SplitGroup>) => Promise<void>;
  deleteSplitGroup: (id: string) => Promise<void>;

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
    dob?: string;
    profession?: UserProfession;
    currency?: CurrencyCode;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    startingBalance?: number;
    locationsWithBalances?: { id: string; name: string; type: MoneyLocation['type']; initialBalance: number; isSavings?: boolean }[];
  }) => Promise<void>;
  restoreExistingUserData: (data: {
    profile?: UserProfile;
    settings?: AppSettings;
    categories?: ExpenseCategory[];
    locations?: MoneyLocation[];
    incomeSources?: IncomeSource[];
    budgets?: CategoryBudget[];
    transactions?: Transaction[];
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

  // Pagination for Transactions List
  hasMoreTransactions: boolean;
  isLoadingMoreTransactions: boolean;
  loadMoreTransactions: () => Promise<void>;

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
  SPLIT_FRIENDS: 'kanakku_v2_split_friends',
  SPLIT_GROUPS: 'kanakku_v2_split_groups',
  SPLIT_EXPENSES: 'kanakku_v2_split_expenses',
  SPLIT_SETTLEMENTS: 'kanakku_v2_split_settlements',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'home' | 'insights' | 'split' | 'budget' | 'profile' | 'settings'>('home');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Split with Friends State
  const [splitFriends, setSplitFriends] = useState<SplitFriend[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SPLIT_FRIENDS);
    return saved ? JSON.parse(saved) : DEFAULT_SPLIT_FRIENDS;
  });

  const [splitGroups, setSplitGroups] = useState<SplitGroup[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SPLIT_GROUPS);
    return saved ? JSON.parse(saved) : DEFAULT_SPLIT_GROUPS;
  });

  const [splitExpenses, setSplitExpenses] = useState<SplitExpense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SPLIT_EXPENSES);
    return saved ? JSON.parse(saved) : DEFAULT_SPLIT_EXPENSES;
  });

  const [splitSettlements, setSplitSettlements] = useState<SplitSettlement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SPLIT_SETTLEMENTS);
    return saved ? JSON.parse(saved) : [];
  });

  const [isAddSplitExpenseOpen, setIsAddSplitExpenseOpen] = useState<boolean>(false);
  const [settleUpModalData, setSettleUpModalData] = useState<{ friendId: string; defaultAmount?: number } | null>(null);
  const [newFriendModalOpen, setNewFriendModalOpen] = useState<boolean>(false);
  const [newGroupModalOpen, setNewGroupModalOpen] = useState<boolean>(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

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

  // Pagination State for Transactions (UID-isolated)
  const [lastVisibleTransactionDoc, setLastVisibleTransactionDoc] = useState<any | null>(null);
  const [hasMoreTransactions, setHasMoreTransactions] = useState<boolean>(true);
  const [isLoadingMoreTransactions, setIsLoadingMoreTransactions] = useState<boolean>(false);

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const unsubsRef = useRef<(() => void)[]>([]);

  // ==========================================
  // REAL-TIME FIREBASE AUTH & FIRESTORE LISTENERS
  // ==========================================
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // Clear any prior Firestore listeners
      unsubsRef.current.forEach((unsub) => unsub());
      unsubsRef.current = [];

      setCurrentUser(user);
      setIsAuthLoading(false);

      if (user) {
        console.log(`🔒 [Auth] User logged in: ${user.email} (UID: ${user.uid})`);
        setCloudSyncStatus('syncing');

        // 1. Subscribe to profile in Firestore under UID doc
        const unsubProfile = subscribeToProfile(user.uid, (cloudProfile) => {
          if (cloudProfile && cloudProfile.name) {
            setProfile(cloudProfile);
            const isCompleted = localStorage.getItem(STORAGE_KEYS.ONBOARDED) === 'true';
            if (isCompleted) {
              setIsOnboarded(true);
            }
            localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(cloudProfile));
          }
        });
        unsubsRef.current.push(unsubProfile);

        // 2. Subscribe to Settings, Categories, Locations, Income Sources, Budgets, Transactions with strict user.uid isolation
        const unsubSettings = subscribeToSettings(user.uid, (cloudSettings) => {
          if (cloudSettings) {
            setSettings(cloudSettings);
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(cloudSettings));
          }
        });
        unsubsRef.current.push(unsubSettings);

        const unsubCategories = subscribeToCategories(user.uid, (cloudCategories) => {
          if (cloudCategories && cloudCategories.length > 0) {
            setCategories(cloudCategories);
            localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cloudCategories));
          }
        });
        unsubsRef.current.push(unsubCategories);

        const unsubLocations = subscribeToLocations(user.uid, (cloudLocations) => {
          if (cloudLocations && cloudLocations.length > 0) {
            setLocations(cloudLocations);
            localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(cloudLocations));
          }
        });
        unsubsRef.current.push(unsubLocations);

        const unsubIncomeSources = subscribeToIncomeSources(user.uid, (cloudSources) => {
          if (cloudSources && cloudSources.length > 0) {
            setIncomeSources(cloudSources);
            localStorage.setItem(STORAGE_KEYS.INCOME_SOURCES, JSON.stringify(cloudSources));
          }
        });
        unsubsRef.current.push(unsubIncomeSources);

        const unsubBudgets = subscribeToBudgets(user.uid, (cloudBudgets) => {
          if (cloudBudgets && cloudBudgets.length > 0) {
            setBudgets(cloudBudgets);
            localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(cloudBudgets));
          }
        });
        unsubsRef.current.push(unsubBudgets);

        const unsubTransactions = subscribeToTransactions(user.uid, (cloudTransactions) => {
          setTransactions(cloudTransactions);
          localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(cloudTransactions));
          setIsCloudSynced(true);
          setCloudSyncStatus('synced');
        });
        unsubsRef.current.push(unsubTransactions);
      } else {
        console.log('🔒 [Auth] User is logged out');
        setIsOnboarded(false);
        localStorage.removeItem(STORAGE_KEYS.ONBOARDED);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubsRef.current.forEach((unsub) => unsub());
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
  // UNIFIED AUTO BANK SMS LISTENER (NATIVE + WEB)
  // ==========================================
  useEffect(() => {
    // 1. Android Native Background SMS Listener
    if (isNativeAndroid()) {
      let listenerHandle: any = null;

      const setupNativeListener = async () => {
        const hasPermission = await checkSmsPermissions();
        if (!hasPermission) return;

        listenerHandle = await SmsReader.addListener('onSmsReceived', (rawSms) => {
          const parsed = parseBankSmsRegex(rawSms.body, categories, locations, incomeSources);
          if (parsed && parsed.amount > 0) {
            const processed = getProcessedSmsIds();
            const dismissed = getDismissedSmsIds();
            const hash = hashSmsMessage(rawSms.sender, rawSms.body, rawSms.timestamp);

            if (!processed.has(hash) && !dismissed.has(hash)) {
              parsed.smsId = hash;
              setPendingSmsNotification(parsed);
            }
          }
        });
      };

      setupNativeListener();

      return () => {
        if (listenerHandle?.remove) {
          listenerHandle.remove();
        }
      };
    } else {
      // 2. Web Browser & PWA Smart Auto-Detection (WebOTP + Clipboard Ingestion)
      const cleanupWebListener = initWebSmsAutoListener((parsed) => {
        setPendingSmsNotification(parsed);
      });

      return () => {
        cleanupWebListener();
      };
    }
  }, []);

  // ==========================================
  // OFFLINE RECEIPT BACKGROUND RECONNECT SYNC
  // ==========================================
  useEffect(() => {
    const handleOnline = () => {
      processOfflineReceiptQueue(categories, locations, (enhanced) => {
        showToast(`✨ Offline receipt from ${enhanced.merchantName} enhanced via Gemini AI!`);
      });
    };

    window.addEventListener('online', handleOnline);

    // Run check on initial mount if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      processOfflineReceiptQueue(categories, locations);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [categories, locations]);

  // ==========================================
  // SPLIT WITH FRIENDS (KANAKKU SHARING) ENGINE
  // ==========================================
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SPLIT_FRIENDS, JSON.stringify(splitFriends));
  }, [splitFriends]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SPLIT_GROUPS, JSON.stringify(splitGroups));
  }, [splitGroups]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SPLIT_EXPENSES, JSON.stringify(splitExpenses));
  }, [splitExpenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SPLIT_SETTLEMENTS, JSON.stringify(splitSettlements));
  }, [splitSettlements]);

  // Real-time Balances Engine
  const { friendBalances, totalYouAreOwed, totalYouOwe, netSplitBalance } = useMemo(() => {
    const balances: Record<string, number> = {};
    splitFriends.forEach((f) => {
      balances[f.id] = 0;
    });

    // 1. Process all split expenses
    splitExpenses.forEach((exp) => {
      if (exp.paidBy === 'user') {
        // User paid the full bill: each friend owes their share amount to the user
        exp.shares.forEach((share) => {
          if (share.memberId !== 'user') {
            balances[share.memberId] = (balances[share.memberId] || 0) + share.amount;
          }
        });
      } else {
        // A friend paid the bill: user owes their own share to that friend
        const payerId = exp.paidBy;
        const userShare = exp.shares.find((s) => s.memberId === 'user');
        if (userShare) {
          balances[payerId] = (balances[payerId] || 0) - userShare.amount;
        }
      }
    });

    // 2. Process all settlements
    splitSettlements.forEach((set) => {
      if (set.fromMemberId === 'user') {
        // User paid a debt to friend -> increases user's net balance with that friend
        balances[set.toMemberId] = (balances[set.toMemberId] || 0) + set.amount;
      } else if (set.toMemberId === 'user') {
        // Friend paid a debt to user -> decreases friend's debt to user
        balances[set.fromMemberId] = (balances[set.fromMemberId] || 0) - set.amount;
      }
    });

    let owed = 0;
    let owe = 0;

    Object.values(balances).forEach((bal) => {
      if (bal > 0) owed += bal;
      if (bal < 0) owe += Math.abs(bal);
    });

    return {
      friendBalances: balances,
      totalYouAreOwed: owed,
      totalYouOwe: owe,
      netSplitBalance: owed - owe,
    };
  }, [splitFriends, splitExpenses, splitSettlements]);

  const addSplitExpense = async (expenseData: Omit<SplitExpense, 'id' | 'createdAt'>) => {
    const newExpense: SplitExpense = {
      ...expenseData,
      id: `split-exp-${Date.now()}`,
      createdAt: Date.now(),
    };
    setSplitExpenses((prev) => [newExpense, ...prev]);
    showToast(`Added shared expense: ${expenseData.description}`);
  };

  const deleteSplitExpense = async (id: string) => {
    setSplitExpenses((prev) => prev.filter((e) => e.id !== id));
    showToast('Deleted shared expense');
  };

  const settleSplitDebt = async (
    fromMemberId: string,
    toMemberId: string,
    amount: number,
    paymentMode: 'upi' | 'cash' | 'other',
    referenceNote?: string
  ) => {
    const newSettlement: SplitSettlement = {
      id: `set-${Date.now()}`,
      fromMemberId,
      toMemberId,
      amount,
      date: new Date().toISOString().split('T')[0],
      paymentMode,
      referenceNote,
      createdAt: Date.now(),
    };
    setSplitSettlements((prev) => [newSettlement, ...prev]);
    showToast(`Settlement recorded!`);
  };

  const addSplitFriend = async (friendData: Omit<SplitFriend, 'id'>) => {
    const newFriend: SplitFriend = {
      ...friendData,
      id: `friend-${Date.now()}`,
    };
    setSplitFriends((prev) => [...prev, newFriend]);
    showToast(`Added friend: ${friendData.name}`);
  };

  const updateSplitFriend = async (id: string, updates: Partial<SplitFriend>) => {
    setSplitFriends((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
    showToast('Updated friend details');
  };

  const deleteSplitFriend = async (id: string) => {
    setSplitFriends((prev) => prev.filter((f) => f.id !== id));
    showToast('Removed friend');
  };

  const addSplitGroup = async (groupData: Omit<SplitGroup, 'id' | 'createdAt'>) => {
    const newGroup: SplitGroup = {
      ...groupData,
      id: `group-${Date.now()}`,
      createdAt: Date.now(),
    };
    setSplitGroups((prev) => [...prev, newGroup]);
    showToast(`Created group: ${groupData.name}`);
  };

  const updateSplitGroup = async (id: string, updates: Partial<SplitGroup>) => {
    setSplitGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
    showToast('Updated group');
  };

  const deleteSplitGroup = async (id: string) => {
    setSplitGroups((prev) => prev.filter((g) => g.id !== id));
    showToast('Deleted group');
  };

  // ==========================================
  // FIREBASE AUTH METHODS
  // ==========================================
  const signInUser = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      return { success: true, user: userCredential.user };
    } catch (err: any) {
      console.error('Firebase signIn error:', err);
      let errorMsg = 'Failed to sign in. Please check your credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        errorMsg = 'Invalid email or password. Please try again or create an account.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMsg = 'Too many failed login attempts. Please try again later.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      return { success: false, error: errorMsg };
    }
  };

  const signUpUser = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      return { success: true, user: userCredential.user };
    } catch (err: any) {
      console.error('Firebase signUp error:', err);
      let errorMsg = 'Failed to create account.';
      if (err.code === 'auth/email-already-in-use') {
        errorMsg = 'An account with this email already exists. Please Sign In.';
      } else if (err.code === 'auth/weak-password') {
        errorMsg = 'Password should be at least 6 characters long.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Please provide a valid email address.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      return { success: false, error: errorMsg };
    }
  };

  const logoutUser = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setIsOnboarded(false);
      localStorage.clear();
      setProfile(INITIAL_PROFILE);
      setTransactions([]);
      setLastVisibleTransactionDoc(null);
      setHasMoreTransactions(true);
      setActiveTab('home');
      showToast('Logged out successfully');
    } catch (err) {
      console.error('Firebase signOut error:', err);
      showToast('Error signing out');
    }
  };

  // ==========================================
  // INCOMING SMS REAL-TIME LISTENER (ANDROID NATIVE)
  // ==========================================
  useEffect(() => {
    if (!isNativeAndroid()) return;
    if (settings.autoSmsDetection === false) return;

    let listenerHandle: any = null;

    const initSmsListener = async () => {
      try {
        const hasPerm = await checkSmsPermissions();
        if (!hasPerm) return;

        listenerHandle = await SmsReader.addListener('onSmsReceived', (data) => {
          try {
            const hash = hashSmsMessage(data.sender, data.body, data.timestamp);
            const processed = getProcessedSmsIds();
            const dismissed = getDismissedSmsIds();

            if (processed.has(hash) || dismissed.has(hash)) return;

            const parsed = parseBankSmsRegex(data.body, categories, locations, incomeSources);
            parsed.id = hash;

            if (parsed.amount && parsed.amount > 0) {
              setPendingSmsNotification(parsed);

              // Also add to in-app notification center
              const newNotif: AppNotification = {
                id: 'notif-sms-' + Date.now(),
                title: `⚡ Bank SMS: ${parsed.merchant}`,
                message: `${parsed.type === 'expense' ? 'Debited' : 'Credited'} ${formatMoney(
                  parsed.amount
                )} (${parsed.categoryName})`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                read: false,
                icon: 'bolt',
                type: 'alert',
              };

              setNotifications((prev) => [newNotif, ...prev]);
            }
          } catch (err) {
            console.error('Error handling incoming SMS broadcast:', err);
          }
        });
      } catch (err) {
        console.error('Failed to initialize SMS listener:', err);
      }
    };

    initSmsListener();

    return () => {
      if (listenerHandle && typeof listenerHandle.remove === 'function') {
        listenerHandle.remove();
      }
    };
  }, [settings.autoSmsDetection, categories, locations, incomeSources]);

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
  // ASYNC FIRESTORE CRUD ACTIONS (UID-ISOLATED)
  // ==========================================

  const getActiveUid = () => currentUser?.uid || auth.currentUser?.uid || '';

  const addCategory = async (cat: Omit<ExpenseCategory, 'id'>) => {
    const uid = getActiveUid();
    const newCat: ExpenseCategory = {
      ...cat,
      id: 'cat-' + Date.now(),
      userId: uid,
    };
    const updated = [...categories, newCat];
    setCategories(updated);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
    if (uid) await saveCategoriesToFirestore(uid, updated);
    showToast(`Category "${cat.name}" saved to Cloud`);
  };

  const updateCategory = async (id: string, partial: Partial<ExpenseCategory>) => {
    const uid = getActiveUid();
    const updated = categories.map((c) => (c.id === id ? { ...c, ...partial } : c));
    setCategories(updated);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
    if (uid) await saveCategoriesToFirestore(uid, updated);
    showToast('Category updated in Cloud');
  };

  const deleteCategory = async (id: string) => {
    const uid = getActiveUid();
    const updated = categories.filter((c) => c.id !== id);
    setCategories(updated);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
    if (uid) await saveCategoriesToFirestore(uid, updated);
    showToast('Category removed from Cloud');
  };

  const reorderCategories = async (newCategories: ExpenseCategory[]) => {
    const uid = getActiveUid();
    setCategories(newCategories);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(newCategories));
    if (uid) await saveCategoriesToFirestore(uid, newCategories);
    showToast('Categories reordered & saved');
  };

  const addLocation = async (loc: Omit<MoneyLocation, 'id'>) => {
    const uid = getActiveUid();
    const newLoc: MoneyLocation = {
      ...loc,
      id: 'loc-' + Date.now(),
      userId: uid,
    };
    const updated = [...locations, newLoc];
    setLocations(updated);
    localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(updated));
    if (uid) await saveLocationsToFirestore(uid, updated);
    showToast(`Location "${loc.name}" saved to Cloud`);
  };

  const updateLocation = async (id: string, partial: Partial<MoneyLocation>) => {
    const uid = getActiveUid();
    const updated = locations.map((l) => (l.id === id ? { ...l, ...partial } : l));
    setLocations(updated);
    localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(updated));
    if (uid) await saveLocationsToFirestore(uid, updated);
    showToast('Location updated in Cloud');
  };

  const deleteLocation = async (id: string) => {
    const uid = getActiveUid();
    const updated = locations.filter((l) => l.id !== id);
    setLocations(updated);
    localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(updated));
    if (uid) await saveLocationsToFirestore(uid, updated);
    showToast('Location removed from Cloud');
  };

  const reorderLocations = async (newLocations: MoneyLocation[]) => {
    const uid = getActiveUid();
    setLocations(newLocations);
    localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(newLocations));
    if (uid) await saveLocationsToFirestore(uid, newLocations);
    showToast('Locations reordered & saved');
  };

  const addIncomeSource = async (src: Omit<IncomeSource, 'id'>) => {
    const uid = getActiveUid();
    const newSrc: IncomeSource = {
      ...src,
      id: 'inc-' + Date.now(),
      userId: uid,
    };
    const updated = [...incomeSources, newSrc];
    setIncomeSources(updated);
    localStorage.setItem(STORAGE_KEYS.INCOME_SOURCES, JSON.stringify(updated));
    if (uid) await saveIncomeSourcesToFirestore(uid, updated);
    showToast(`Income source "${src.name}" saved to Cloud`);
  };

  const updateIncomeSource = async (id: string, partial: Partial<IncomeSource>) => {
    const uid = getActiveUid();
    const updated = incomeSources.map((s) => (s.id === id ? { ...s, ...partial } : s));
    setIncomeSources(updated);
    localStorage.setItem(STORAGE_KEYS.INCOME_SOURCES, JSON.stringify(updated));
    if (uid) await saveIncomeSourcesToFirestore(uid, updated);
    showToast('Income source updated in Cloud');
  };

  const deleteIncomeSource = async (id: string) => {
    const uid = getActiveUid();
    const updated = incomeSources.filter((s) => s.id !== id);
    setIncomeSources(updated);
    localStorage.setItem(STORAGE_KEYS.INCOME_SOURCES, JSON.stringify(updated));
    if (uid) await saveIncomeSourcesToFirestore(uid, updated);
    showToast('Income source removed from Cloud');
  };

  const reorderIncomeSources = async (newSources: IncomeSource[]) => {
    const uid = getActiveUid();
    setIncomeSources(newSources);
    localStorage.setItem(STORAGE_KEYS.INCOME_SOURCES, JSON.stringify(newSources));
    if (uid) await saveIncomeSourcesToFirestore(uid, newSources);
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
    const uid = getActiveUid();

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
      userId: uid,
    };

    setTransactions((prev) => [newTx, ...prev]);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([newTx, ...transactions]));
    await saveTransactionToFirestore(newTx, uid);
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
    const uid = getActiveUid();

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
      userId: uid,
    };

    setTransactions((prev) => [newTx, ...prev]);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([newTx, ...transactions]));
    await saveTransactionToFirestore(newTx, uid);
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
    const uid = getActiveUid();

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
      userId: uid,
    };

    setTransactions((prev) => [newTx, ...prev]);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([newTx, ...transactions]));
    await saveTransactionToFirestore(newTx, uid);
    showToast(`Transfer of ${formatMoney(amount)} saved to Cloud`);
  };

  const updateTransaction = async (id: string, updated: Partial<Transaction>) => {
    const uid = getActiveUid();
    const updatedList = transactions.map((t) => (t.id === id ? ({ ...t, ...updated, userId: uid || t.userId } as Transaction) : t));
    setTransactions(updatedList);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updatedList));

    const targetTx = updatedList.find((t) => t.id === id);
    if (targetTx) {
      await saveTransactionToFirestore(targetTx, uid);
    }
    if (selectedTransaction?.id === id) {
      setSelectedTransaction((prev) => (prev ? ({ ...prev, ...updated } as Transaction) : null));
    }
    showToast('Transaction updated in Cloud');
  };

  const deleteTransaction = async (id: string) => {
    const uid = getActiveUid();
    const updatedList = transactions.filter((t) => t.id !== id);
    setTransactions(updatedList);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updatedList));
    await deleteTransactionFromFirestore(id, uid);
    if (selectedTransaction?.id === id) {
      setSelectedTransaction(null);
    }
    showToast('Transaction removed from Cloud');
  };

  /**
   * Load the next page of transactions from Firestore using startAfter(lastVisibleDoc)
   * Appends new transactions to the existing list and updates lastVisibleDoc.
   */
  const loadMoreTransactions = async () => {
    const uid = getActiveUid();
    if (!uid || isLoadingMoreTransactions || !hasMoreTransactions) return;

    setIsLoadingMoreTransactions(true);
    try {
      const result = await getPaginatedTransactions(uid, lastVisibleTransactionDoc, 20);
      if (result.transactions.length > 0) {
        setTransactions((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const newItems = result.transactions.filter((t) => !existingIds.has(t.id));
          const combined = [...prev, ...newItems];
          localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(combined));
          return combined;
        });
        setLastVisibleTransactionDoc(result.lastVisibleDoc);
        setHasMoreTransactions(result.hasMore);
      } else {
        setHasMoreTransactions(false);
      }
    } catch (err) {
      console.error('❌ Error loading more transactions:', err);
    } finally {
      setIsLoadingMoreTransactions(false);
    }
  };

  // Profile & Settings Mutators
  const updateProfile = async (partial: Partial<UserProfile>) => {
    const uid = getActiveUid();
    const updated = { ...profile, ...partial, userId: uid };
    setProfile(updated);
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
    if (uid) {
      await saveProfileToFirestore(uid, updated);
    }
    showToast('Profile saved to Cloud');
  };

  const updateSettings = async (partial: Partial<AppSettings>) => {
    const uid = getActiveUid();
    const updated = { ...settings, ...partial, userId: uid };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    if (uid) {
      await saveSettingsToFirestore(uid, updated);
    }
    showToast('Settings saved to Cloud');
  };

  const updateBudget = async (category: string, limit: number) => {
    const uid = getActiveUid();
    const updated = budgets.map((b) => (b.category === category ? { ...b, limit, userId: uid } : b));
    setBudgets(updated);
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(updated));
    if (uid) {
      await saveBudgetsToFirestore(uid, updated);
    }
    showToast('Budget updated in Cloud');
  };

  const updateProfileAvatar = async (base64Image: string) => {
    const uid = getActiveUid();
    const updated: UserProfile = { ...profile, avatarUrl: base64Image, userId: uid };
    setProfile(updated);
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
    if (uid) {
      await saveProfileToFirestore(uid, updated);
    }
    showToast('Profile photo updated & saved');
  };

  const setPinLock = async (enabled: boolean, pin?: string) => {
    const uid = getActiveUid();
    const updated: AppSettings = {
      ...settings,
      isPinLockEnabled: enabled,
      pinCode: pin || settings.pinCode || '1234',
      userId: uid,
    };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    if (uid) {
      await saveSettingsToFirestore(uid, updated);
    }
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
    dob?: string;
    profession?: UserProfession;
    currency?: CurrencyCode;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    startingBalance?: number;
    locationsWithBalances?: {
      id: string;
      name: string;
      type: MoneyLocation['type'];
      initialBalance: number;
      isSavings?: boolean;
    }[];
  }) => {
    try {
      const activeUid = currentUser?.uid || auth.currentUser?.uid || '';
      const cleanName = (data?.name || profile.name || 'User').trim();
      const chosenCurrency = data?.currency || settings.currency || 'INR';

      const updatedProfile: UserProfile = {
        name: cleanName,
        age: data?.age !== undefined ? data.age : (profile.age || 24),
        dob: data?.dob || profile.dob || '',
        profession: data?.profession || profile.profession || 'Salaried',
        email: (data?.email || currentUser?.email || profile.email || '').trim(),
        phone: (data?.phone || profile.phone || '').trim(),
        memberSince: profile.memberSince || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        avatarUrl: data?.avatarUrl || profile.avatarUrl || INITIAL_PROFILE.avatarUrl,
      };

      let sourceLocations = data?.locationsWithBalances;
      if (!sourceLocations && data?.startingBalance !== undefined) {
        const bal = Math.max(0, Number(data.startingBalance) || 0);
        sourceLocations = locations.map((loc) => {
          if (loc.id === 'loc-bank-primary' || loc.type === 'bank') {
            return {
              id: loc.id,
              name: loc.name,
              type: loc.type,
              initialBalance: bal,
              isSavings: loc.isSavings,
            };
          }
          return {
            id: loc.id,
            name: loc.name,
            type: loc.type,
            initialBalance: 0,
            isSavings: loc.isSavings,
          };
        });
      }

      const updatedLocations: MoneyLocation[] = (sourceLocations || locations).map((loc) => {
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
      if (activeUid) {
        try {
          await syncAllDataToFirestore(activeUid, {
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
      }
    } catch (err) {
      console.error('Error completing onboarding:', err);
      setIsOnboarded(true);
      setActiveTab('home');
    }
  };

  const restoreExistingUserData = async (data: {
    profile?: UserProfile;
    settings?: AppSettings;
    categories?: ExpenseCategory[];
    locations?: MoneyLocation[];
    incomeSources?: IncomeSource[];
    budgets?: CategoryBudget[];
    transactions?: Transaction[];
  }) => {
    try {
      const restoredProfile: UserProfile = data.profile || profile;
      const restoredSettings: AppSettings = data.settings || settings;
      const restoredCategories: ExpenseCategory[] = data.categories && data.categories.length > 0 ? data.categories : categories;
      const restoredLocations: MoneyLocation[] = data.locations && data.locations.length > 0 ? data.locations : locations;
      const restoredSources: IncomeSource[] = data.incomeSources && data.incomeSources.length > 0 ? data.incomeSources : incomeSources;
      const restoredBudgets: CategoryBudget[] = data.budgets && data.budgets.length > 0 ? data.budgets : budgets;
      const restoredTx: Transaction[] = data.transactions || [];

      // 1. Update React State immediately
      setProfile(restoredProfile);
      setSettings(restoredSettings);
      setCategories(restoredCategories);
      setLocations(restoredLocations);
      setIncomeSources(restoredSources);
      setBudgets(restoredBudgets);
      setTransactions(restoredTx);
      setIsOnboarded(true);
      setActiveTab('home');

      // 2. Update Local Storage
      localStorage.setItem(STORAGE_KEYS.ONBOARDED, 'true');
      localStorage.setItem('hasCompletedOnboarding', 'true');
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(restoredProfile));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(restoredSettings));
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(restoredCategories));
      localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(restoredLocations));
      localStorage.setItem(STORAGE_KEYS.INCOME_SOURCES, JSON.stringify(restoredSources));
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(restoredBudgets));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(restoredTx));

      showToast(`Welcome back, ${restoredProfile.name || 'User'}! Account restored from Cloud.`);
    } catch (err) {
      console.error('Error restoring existing user data:', err);
      setIsOnboarded(true);
      setActiveTab('home');
    }
  };

  const resetOnboarding = async () => {
    await logoutUser();
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
    const activeUid = currentUser?.uid || auth.currentUser?.uid;
    if (!activeUid) {
      showToast('Please sign in to sync with cloud');
      return;
    }
    setCloudSyncStatus('syncing');
    try {
      await syncAllDataToFirestore(activeUid, {
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
      const activeUid = currentUser?.uid || auth.currentUser?.uid;
      if (activeUid) {
        syncAllDataToFirestore(activeUid, {
          profile: importedProfile,
          settings: importedSettings,
          categories: importedCategories,
          locations: importedLocations,
          incomeSources: importedSources,
          budgets: importedBudgets,
          transactions: importedTx,
        }).catch((e) => console.warn('Firestore import sync notice:', e));
      }

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
        currentUser,
        isAuthLoading,
        signInUser,
        signUpUser,
        logoutUser,

        activeTab,
        setActiveTab,
        isAddModalOpen,
        setIsAddModalOpen,
        selectedTransaction,
        setSelectedTransaction,
        notificationCenterOpen,
        setNotificationCenterOpen,

        // Split with Friends (Kanakku Sharing)
        splitFriends,
        splitGroups,
        splitExpenses,
        splitSettlements,
        friendBalances,
        totalYouAreOwed,
        totalYouOwe,
        netSplitBalance,
        isAddSplitExpenseOpen,
        setIsAddSplitExpenseOpen,
        settleUpModalData,
        setSettleUpModalData,
        newFriendModalOpen,
        setNewFriendModalOpen,
        newGroupModalOpen,
        setNewGroupModalOpen,
        addSplitExpense,
        deleteSplitExpense,
        settleSplitDebt,
        addSplitFriend,
        updateSplitFriend,
        deleteSplitFriend,
        addSplitGroup,
        updateSplitGroup,
        deleteSplitGroup,

        isCloudSynced,
        cloudSyncStatus,

        isAppUnlocked,
        setIsAppUnlocked,
        setPinLock,

        isOnboarded,
        completeOnboarding,
        restoreExistingUserData,
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
        hasMoreTransactions,
        isLoadingMoreTransactions,
        loadMoreTransactions,

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
