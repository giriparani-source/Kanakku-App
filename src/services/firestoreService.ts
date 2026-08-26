import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import {
  ExpenseCategory,
  MoneyLocation,
  IncomeSource,
  Transaction,
  UserProfile,
  AppSettings,
  CategoryBudget,
  CurrencyCode,
} from '../types';

// Helper to remove any undefined or non-serializable fields
const sanitizeData = <T>(obj: T): T => {
  return JSON.parse(
    JSON.stringify(obj, (_, v) => (v === undefined ? null : v))
  );
};

// ==========================================
// EXPLICIT FIRESTORE COLLECTIONS & DOCUMENTS
// ==========================================
const TRANSACTIONS_COLLECTION = collection(db, 'transactions');
const EXPENSES_COLLECTION = collection(db, 'expenses');
const INCOME_COLLECTION = collection(db, 'income');
const TRANSFERS_COLLECTION = collection(db, 'transfers');
const LOCATIONS_COLLECTION = collection(db, 'locations');
const CATEGORIES_COLLECTION = collection(db, 'categories');
const INCOME_SOURCES_COLLECTION = collection(db, 'income_sources');

// Global / shared collections singleton Doc IDs
const SETTINGS_DOC_ID = 'app_settings';
const BUDGETS_DOC_ID = 'category_budgets';
const CATEGORIES_ORDER_DOC_ID = 'category_list_meta';
const LOCATIONS_ORDER_DOC_ID = 'location_list_meta';
const INCOME_SOURCES_ORDER_DOC_ID = 'source_list_meta';

// ==========================================
// REAL-TIME FIRESTORE SUBSCRIPTIONS
// ==========================================

export const subscribeToProfile = (
  userId: string,
  onUpdate: (profile: UserProfile | null) => void
): Unsubscribe => {
  if (!userId) {
    onUpdate(null);
    return () => {};
  }

  return onSnapshot(
    doc(db, 'users', userId),
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onUpdate({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          dob: data.dob || '',
          age: data.age !== undefined && data.age !== '' ? data.age : undefined,
          profession: data.profession || '',
          memberSince: data.memberSince || '',
          avatarUrl: data.avatarUrl || '',
        });
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn('Firestore profile subscription warning:', err);
    }
  );
};

export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!userId) return null;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      const data = snap.data();
      return {
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        dob: data.dob || '',
        age: data.age !== undefined && data.age !== '' ? data.age : undefined,
        profession: data.profession || '',
        memberSince: data.memberSince || '',
        avatarUrl: data.avatarUrl || '',
      };
    }
    return null;
  } catch (err) {
    console.error('❌ Error fetching user profile from Firestore:', err);
    return null;
  }
};

export const subscribeToSettings = (onUpdate: (settings: AppSettings | null) => void): Unsubscribe => {
  return onSnapshot(
    doc(db, 'settings', SETTINGS_DOC_ID),
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as AppSettings);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn('Firestore settings subscription warning:', err);
    }
  );
};

export const subscribeToCategories = (onUpdate: (categories: ExpenseCategory[] | null) => void): Unsubscribe => {
  return onSnapshot(
    CATEGORIES_COLLECTION,
    (snapshot) => {
      if (!snapshot.empty) {
        const list: ExpenseCategory[] = [];
        snapshot.forEach((d) => {
          if (d.id !== CATEGORIES_ORDER_DOC_ID) {
            list.push(d.data() as ExpenseCategory);
          }
        });

        // Also check if custom order meta exists
        const metaDoc = snapshot.docs.find((d) => d.id === CATEGORIES_ORDER_DOC_ID);
        if (metaDoc && metaDoc.exists() && Array.isArray(metaDoc.data()?.list)) {
          onUpdate(metaDoc.data().list as ExpenseCategory[]);
        } else if (list.length > 0) {
          onUpdate(list);
        }
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn('Firestore categories subscription warning:', err);
    }
  );
};

export const subscribeToLocations = (onUpdate: (locations: MoneyLocation[] | null) => void): Unsubscribe => {
  return onSnapshot(
    LOCATIONS_COLLECTION,
    (snapshot) => {
      if (!snapshot.empty) {
        const list: MoneyLocation[] = [];
        snapshot.forEach((d) => {
          if (d.id !== LOCATIONS_ORDER_DOC_ID) {
            list.push(d.data() as MoneyLocation);
          }
        });

        const metaDoc = snapshot.docs.find((d) => d.id === LOCATIONS_ORDER_DOC_ID);
        if (metaDoc && metaDoc.exists() && Array.isArray(metaDoc.data()?.list)) {
          onUpdate(metaDoc.data().list as MoneyLocation[]);
        } else if (list.length > 0) {
          onUpdate(list);
        }
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn('Firestore locations subscription warning:', err);
    }
  );
};

export const subscribeToIncomeSources = (onUpdate: (sources: IncomeSource[] | null) => void): Unsubscribe => {
  return onSnapshot(
    INCOME_SOURCES_COLLECTION,
    (snapshot) => {
      if (!snapshot.empty) {
        const list: IncomeSource[] = [];
        snapshot.forEach((d) => {
          if (d.id !== INCOME_SOURCES_ORDER_DOC_ID) {
            list.push(d.data() as IncomeSource);
          }
        });

        const metaDoc = snapshot.docs.find((d) => d.id === INCOME_SOURCES_ORDER_DOC_ID);
        if (metaDoc && metaDoc.exists() && Array.isArray(metaDoc.data()?.list)) {
          onUpdate(metaDoc.data().list as IncomeSource[]);
        } else if (list.length > 0) {
          onUpdate(list);
        }
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn('Firestore income sources subscription warning:', err);
    }
  );
};

export const subscribeToBudgets = (onUpdate: (budgets: CategoryBudget[] | null) => void): Unsubscribe => {
  return onSnapshot(
    doc(db, 'budgets', BUDGETS_DOC_ID),
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onUpdate(data.list || []);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn('Firestore budgets subscription warning:', err);
    }
  );
};

export const subscribeToTransactions = (onUpdate: (transactions: Transaction[]) => void): Unsubscribe => {
  return onSnapshot(
    TRANSACTIONS_COLLECTION,
    (snapshot) => {
      const list: Transaction[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Transaction);
      });
      list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      onUpdate(list);
    },
    (err) => {
      console.warn('Firestore transactions subscription warning:', err);
    }
  );
};

// Save / update profile in Firestore 'users' collection linked directly to UID
export const updateUserProfile = async (
  userId: string,
  profile: Partial<UserProfile>
): Promise<void> => {
  if (!userId) {
    console.warn('⚠️ [Firestore] Cannot update profile: No userId provided');
    return;
  }
  try {
    const clean = sanitizeData({
      ...profile,
      updatedAt: new Date().toISOString(),
      timestamp: Date.now(),
    });
    // Write directly to user's UID doc in 'users' collection
    await setDoc(doc(db, 'users', userId), clean, { merge: true });
    console.log(`🔥 [Firestore] Profile updated for user UID: ${userId}`);
  } catch (err) {
    console.error('❌ Error updating profile in Firestore:', err);
  }
};

export const saveProfileToFirestore = updateUserProfile;

export const saveSettingsToFirestore = async (settings: AppSettings): Promise<void> => {
  try {
    const clean = sanitizeData({
      ...settings,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'settings', SETTINGS_DOC_ID), clean, { merge: true });
    console.log('🔥 [Firestore] Settings saved to collection "settings"');
  } catch (err) {
    console.error('❌ Error saving settings to Firestore:', err);
  }
};

export const saveLocationsToFirestore = async (locations: MoneyLocation[]): Promise<void> => {
  try {
    const cleanList = sanitizeData(locations);
    // 1. Write metadata list to preserve custom drag-and-drop order
    await setDoc(
      doc(db, 'locations', LOCATIONS_ORDER_DOC_ID),
      { list: cleanList, updatedAt: new Date().toISOString() },
      { merge: true }
    );
    // 2. Write individual document per location to 'locations' collection
    const promises = cleanList.map((loc) =>
      setDoc(doc(db, 'locations', loc.id), loc, { merge: true })
    );
    await Promise.all(promises);
    console.log(`🔥 [Firestore] Saved ${locations.length} locations to collection "locations"`);
  } catch (err) {
    console.error('❌ Error saving locations to Firestore:', err);
  }
};

export const saveCategoriesToFirestore = async (categories: ExpenseCategory[]): Promise<void> => {
  try {
    const cleanList = sanitizeData(categories);
    // 1. Write metadata list to preserve custom drag-and-drop order
    await setDoc(
      doc(db, 'categories', CATEGORIES_ORDER_DOC_ID),
      { list: cleanList, updatedAt: new Date().toISOString() },
      { merge: true }
    );
    // 2. Write individual document per category to 'categories' collection
    const promises = cleanList.map((cat) =>
      setDoc(doc(db, 'categories', cat.id), cat, { merge: true })
    );
    await Promise.all(promises);
    console.log(`🔥 [Firestore] Saved ${categories.length} categories to collection "categories"`);
  } catch (err) {
    console.error('❌ Error saving categories to Firestore:', err);
  }
};

export const saveIncomeSourcesToFirestore = async (sources: IncomeSource[]): Promise<void> => {
  try {
    const cleanList = sanitizeData(sources);
    await setDoc(
      doc(db, 'income_sources', INCOME_SOURCES_ORDER_DOC_ID),
      { list: cleanList, updatedAt: new Date().toISOString() },
      { merge: true }
    );
    const promises = cleanList.map((src) =>
      setDoc(doc(db, 'income_sources', src.id), src, { merge: true })
    );
    await Promise.all(promises);
    console.log(`🔥 [Firestore] Saved ${sources.length} sources to collection "income_sources"`);
  } catch (err) {
    console.error('❌ Error saving income sources to Firestore:', err);
  }
};

export const saveBudgetsToFirestore = async (budgets: CategoryBudget[]): Promise<void> => {
  try {
    const cleanList = sanitizeData(budgets);
    await setDoc(
      doc(db, 'budgets', BUDGETS_DOC_ID),
      { list: cleanList, updatedAt: new Date().toISOString() },
      { merge: true }
    );
    console.log('🔥 [Firestore] Budgets saved to collection "budgets"');
  } catch (err) {
    console.error('❌ Error saving budgets to Firestore:', err);
  }
};

export const saveTransactionToFirestore = async (tx: Transaction): Promise<void> => {
  try {
    const cleanTx = sanitizeData({
      ...tx,
      updatedAt: new Date().toISOString(),
    });

    // 1. Write to primary 'transactions' collection
    await setDoc(doc(db, 'transactions', tx.id), cleanTx, { merge: true });

    // 2. Also write to specific collection ('expenses', 'income', 'transfers')
    if (tx.type === 'expense') {
      await setDoc(doc(db, 'expenses', tx.id), cleanTx, { merge: true });
      console.log(`🔥 [Firestore] Expense saved to collections "transactions" & "expenses":`, tx.id);
    } else if (tx.type === 'income') {
      await setDoc(doc(db, 'income', tx.id), cleanTx, { merge: true });
      console.log(`🔥 [Firestore] Income saved to collections "transactions" & "income":`, tx.id);
    } else if (tx.type === 'transfer') {
      await setDoc(doc(db, 'transfers', tx.id), cleanTx, { merge: true });
      console.log(`🔥 [Firestore] Transfer saved to collections "transactions" & "transfers":`, tx.id);
    }
  } catch (err) {
    console.error('❌ Error saving transaction to Firestore:', err);
  }
};

export const deleteTransactionFromFirestore = async (txId: string): Promise<void> => {
  try {
    await Promise.all([
      deleteDoc(doc(db, 'transactions', txId)),
      deleteDoc(doc(db, 'expenses', txId)).catch(() => {}),
      deleteDoc(doc(db, 'income', txId)).catch(() => {}),
      deleteDoc(doc(db, 'transfers', txId)).catch(() => {}),
    ]);
    console.log(`🔥 [Firestore] Deleted transaction ${txId} from Firestore collections`);
  } catch (err) {
    console.error('❌ Error deleting transaction from Firestore:', err);
  }
};

export const clearAllTransactionsFromFirestore = async (): Promise<void> => {
  try {
    const [txSnap, expSnap, incSnap, trSnap] = await Promise.all([
      getDocs(TRANSACTIONS_COLLECTION),
      getDocs(EXPENSES_COLLECTION),
      getDocs(INCOME_COLLECTION),
      getDocs(TRANSFERS_COLLECTION),
    ]);

    const deletePromises = [
      ...txSnap.docs.map((d) => deleteDoc(d.ref)),
      ...expSnap.docs.map((d) => deleteDoc(d.ref)),
      ...incSnap.docs.map((d) => deleteDoc(d.ref)),
      ...trSnap.docs.map((d) => deleteDoc(d.ref)),
    ];
    await Promise.all(deletePromises);
    console.log('🔥 [Firestore] All transaction collections cleared');
  } catch (err) {
    console.error('❌ Error clearing transactions from Firestore:', err);
  }
};

// Check if a user with exact email exists in the 'users' collection
export const checkUserExistsByEmail = async (
  email: string
): Promise<{ exists: boolean; userId?: string; profile?: UserProfile }> => {
  try {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return { exists: false };

    const usersRef = collection(db, 'users');
    const qEmail = query(usersRef, where('email', '==', cleanEmail));
    const snap = await getDocs(qEmail);

    if (!snap.empty) {
      const firstDoc = snap.docs[0];
      return {
        exists: true,
        userId: firstDoc.id,
        profile: firstDoc.data() as UserProfile,
      };
    }

    return { exists: false };
  } catch (err) {
    console.error('❌ Error checking user in Firestore:', err);
    return { exists: false };
  }
};

// Fetch all Firestore documents for restoring an existing account
export const fetchAllFirestoreData = async (userId?: string): Promise<{
  profile?: UserProfile;
  settings?: AppSettings;
  categories?: ExpenseCategory[];
  locations?: MoneyLocation[];
  incomeSources?: IncomeSource[];
  budgets?: CategoryBudget[];
  transactions?: Transaction[];
} | null> => {
  try {
    const userDocRef = userId ? doc(db, 'users', userId) : null;
    const [profileSnap, settingsSnap, catSnap, locSnap, incSnap, budgetSnap, txSnap] =
      await Promise.all([
        userDocRef ? getDoc(userDocRef) : Promise.resolve(null),
        getDoc(doc(db, 'settings', SETTINGS_DOC_ID)),
        getDocs(CATEGORIES_COLLECTION),
        getDocs(LOCATIONS_COLLECTION),
        getDocs(INCOME_SOURCES_COLLECTION),
        getDoc(doc(db, 'budgets', BUDGETS_DOC_ID)),
        getDocs(TRANSACTIONS_COLLECTION),
      ]);

    const profile = profileSnap && profileSnap.exists() ? (profileSnap.data() as UserProfile) : undefined;
    const settings = settingsSnap.exists() ? (settingsSnap.data() as AppSettings) : undefined;

    let categories: ExpenseCategory[] = [];
    if (!catSnap.empty) {
      catSnap.forEach((d) => {
        if (d.id !== CATEGORIES_ORDER_DOC_ID) categories.push(d.data() as ExpenseCategory);
      });
      const meta = catSnap.docs.find((d) => d.id === CATEGORIES_ORDER_DOC_ID);
      if (meta && meta.exists() && Array.isArray(meta.data()?.list)) {
        categories = meta.data().list;
      }
    }

    let locations: MoneyLocation[] = [];
    if (!locSnap.empty) {
      locSnap.forEach((d) => {
        if (d.id !== LOCATIONS_ORDER_DOC_ID) locations.push(d.data() as MoneyLocation);
      });
      const meta = locSnap.docs.find((d) => d.id === LOCATIONS_ORDER_DOC_ID);
      if (meta && meta.exists() && Array.isArray(meta.data()?.list)) {
        locations = meta.data().list;
      }
    }

    let incomeSources: IncomeSource[] = [];
    if (!incSnap.empty) {
      incSnap.forEach((d) => {
        if (d.id !== INCOME_SOURCES_ORDER_DOC_ID) incomeSources.push(d.data() as IncomeSource);
      });
      const meta = incSnap.docs.find((d) => d.id === INCOME_SOURCES_ORDER_DOC_ID);
      if (meta && meta.exists() && Array.isArray(meta.data()?.list)) {
        incomeSources = meta.data().list;
      }
    }

    const budgets = budgetSnap.exists() ? (budgetSnap.data()?.list as CategoryBudget[]) : undefined;

    const transactions: Transaction[] = [];
    if (!txSnap.empty) {
      txSnap.forEach((d) => {
        transactions.push(d.data() as Transaction);
      });
      transactions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }

    return {
      profile,
      settings,
      categories: categories.length > 0 ? categories : undefined,
      locations: locations.length > 0 ? locations : undefined,
      incomeSources: incomeSources.length > 0 ? incomeSources : undefined,
      budgets,
      transactions,
    };
  } catch (err) {
    console.error('❌ Error fetching all data from Firestore:', err);
    return null;
  }
};

// Initial Cloud Sync / Migration Helper
export const syncAllDataToFirestore = async (
  userId: string,
  data: {
    profile: UserProfile;
    settings: AppSettings;
    categories: ExpenseCategory[];
    locations: MoneyLocation[];
    incomeSources: IncomeSource[];
    budgets: CategoryBudget[];
    transactions: Transaction[];
  }
): Promise<void> => {
  try {
    console.log(`🔥 [Firestore] Syncing all collections to Firestore for UID "${userId}"...`);
    await Promise.all([
      saveProfileToFirestore(userId, data.profile),
      saveSettingsToFirestore(data.settings),
      saveCategoriesToFirestore(data.categories),
      saveLocationsToFirestore(data.locations),
      saveIncomeSourcesToFirestore(data.incomeSources),
      saveBudgetsToFirestore(data.budgets),
      ...data.transactions.map((tx) => saveTransactionToFirestore(tx)),
    ]);
    console.log('✅ [Firestore] All collections synced to Firebase Cloud successfully!');
  } catch (err) {
    console.error('❌ Error syncing all data to Firestore:', err);
  }
};

export interface NewUserData {
  name: string;
  email: string;
  phone?: string;
  dob?: string;
  age?: number | string;
  profession?: string;
  avatarUrl?: string;
  startingBalance?: number;
  currency?: CurrencyCode;
  locationsWithBalances?: {
    id: string;
    name: string;
    type: MoneyLocation['type'];
    initialBalance: number;
    isSavings?: boolean;
  }[];
}

// Stores the new user document in the Firestore 'users' collection linked directly to UID
export const saveNewUser = async (
  userId: string,
  userData: NewUserData
): Promise<{ success: boolean; id?: string }> => {
  if (!userId) {
    console.error('❌ Error saving new user: No userId provided');
    return { success: false };
  }

  try {
    const cleanUser = sanitizeData({
      name: (userData.name || 'User').trim(),
      email: (userData.email || '').trim().toLowerCase(),
      phone: (userData.phone || '').trim(),
      dob: userData.dob || '',
      age: userData.age !== undefined ? userData.age : 24,
      profession: userData.profession || 'Salaried',
      avatarUrl: userData.avatarUrl || '',
      startingBalance: Math.max(0, Number(userData.startingBalance) || 0),
      currency: userData.currency || 'INR',
      memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timestamp: Date.now(),
    });

    // Write to 'users/{userId}'
    await setDoc(doc(db, 'users', userId), cleanUser, { merge: true });

    console.log(`🔥 [Firestore] User "${cleanUser.name}" profile saved under UID "${userId}"`);
    return { success: true, id: userId };
  } catch (err) {
    console.error('❌ Error saving new user to Firestore:', err);
    return { success: false };
  }
};
