import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import {
  ExpenseCategory,
  MoneyLocation,
  IncomeSource,
  Transaction,
  IncomeTransaction,
  ExpenseTransaction,
  TransferTransaction,
  UserProfile,
  AppSettings,
  CategoryBudget,
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
const USERS_COLLECTION = collection(db, 'users');
const TRANSACTIONS_COLLECTION = collection(db, 'transactions');
const EXPENSES_COLLECTION = collection(db, 'expenses');
const INCOME_COLLECTION = collection(db, 'income');
const TRANSFERS_COLLECTION = collection(db, 'transfers');
const LOCATIONS_COLLECTION = collection(db, 'locations');
const CATEGORIES_COLLECTION = collection(db, 'categories');
const INCOME_SOURCES_COLLECTION = collection(db, 'income_sources');
const SETTINGS_COLLECTION = collection(db, 'settings');
const BUDGETS_COLLECTION = collection(db, 'budgets');

// User & Settings Singleton Docs
const USER_DOC_ID = 'default_user';
const SETTINGS_DOC_ID = 'app_settings';
const BUDGETS_DOC_ID = 'category_budgets';
const CATEGORIES_ORDER_DOC_ID = 'category_list_meta';
const LOCATIONS_ORDER_DOC_ID = 'location_list_meta';
const INCOME_SOURCES_ORDER_DOC_ID = 'source_list_meta';

// ==========================================
// REAL-TIME FIRESTORE SUBSCRIPTIONS
// ==========================================

export const subscribeToProfile = (onUpdate: (profile: UserProfile | null) => void): Unsubscribe => {
  return onSnapshot(
    doc(db, 'users', USER_DOC_ID),
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onUpdate({
          name: data.name || 'User',
          email: data.email || '',
          phone: data.phone || '',
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

// ==========================================
// ASYNC FIRESTORE EXPLICIT WRITES
// ==========================================

export const saveProfileToFirestore = async (profile: UserProfile): Promise<void> => {
  try {
    const clean = sanitizeData({
      ...profile,
      updatedAt: new Date().toISOString(),
      timestamp: Date.now(),
    });
    await setDoc(doc(db, 'users', USER_DOC_ID), clean, { merge: true });
    console.log('🔥 [Firestore] Profile saved to collection "users"');
  } catch (err) {
    console.error('❌ Error saving profile to Firestore:', err);
  }
};

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

// Initial Cloud Sync / Migration Helper
export const syncAllDataToFirestore = async (data: {
  profile: UserProfile;
  settings: AppSettings;
  categories: ExpenseCategory[];
  locations: MoneyLocation[];
  incomeSources: IncomeSource[];
  budgets: CategoryBudget[];
  transactions: Transaction[];
}): Promise<void> => {
  try {
    console.log('🔥 [Firestore] Syncing all collections to Firestore (users, settings, categories, locations, income_sources, budgets, transactions)...');
    await Promise.all([
      saveProfileToFirestore(data.profile),
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
