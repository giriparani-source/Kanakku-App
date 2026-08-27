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
} from '../types';

// Helper to remove any undefined or non-serializable fields
const sanitizeData = <T>(obj: T): T => {
  return JSON.parse(
    JSON.stringify(obj, (_, v) => (v === undefined ? null : v))
  );
};

// ==========================================
// EXPLICIT FIRESTORE COLLECTIONS
// ==========================================
const TRANSACTIONS_COLLECTION = collection(db, 'transactions');
const EXPENSES_COLLECTION = collection(db, 'expenses');
const INCOME_COLLECTION = collection(db, 'income');
const TRANSFERS_COLLECTION = collection(db, 'transfers');
const LOCATIONS_COLLECTION = collection(db, 'locations');
const CATEGORIES_COLLECTION = collection(db, 'categories');
const INCOME_SOURCES_COLLECTION = collection(db, 'income_sources');

// ==========================================
// REAL-TIME FIRESTORE SUBSCRIPTIONS (UID-ISOLATED)
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
          userId: data.userId || userId,
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
        userId: data.userId || userId,
      };
    }
    return null;
  } catch (err) {
    console.error('❌ Error fetching user profile from Firestore:', err);
    return null;
  }
};

export const subscribeToSettings = (
  userId: string,
  onUpdate: (settings: AppSettings | null) => void
): Unsubscribe => {
  if (!userId) {
    onUpdate(null);
    return () => {};
  }

  return onSnapshot(
    doc(db, 'settings', userId),
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

export const subscribeToCategories = (
  userId: string,
  onUpdate: (categories: ExpenseCategory[] | null) => void
): Unsubscribe => {
  if (!userId) {
    onUpdate(null);
    return () => {};
  }

  const q = query(CATEGORIES_COLLECTION, where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const list: ExpenseCategory[] = [];
        let metaList: ExpenseCategory[] | null = null;
        snapshot.forEach((d) => {
          const data = d.data();
          if (data.isMeta && Array.isArray(data.list)) {
            metaList = data.list as ExpenseCategory[];
          } else if (!data.isMeta) {
            list.push(data as ExpenseCategory);
          }
        });

        if (metaList) {
          onUpdate(metaList);
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

export const subscribeToLocations = (
  userId: string,
  onUpdate: (locations: MoneyLocation[] | null) => void
): Unsubscribe => {
  if (!userId) {
    onUpdate(null);
    return () => {};
  }

  const q = query(LOCATIONS_COLLECTION, where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const list: MoneyLocation[] = [];
        let metaList: MoneyLocation[] | null = null;
        snapshot.forEach((d) => {
          const data = d.data();
          if (data.isMeta && Array.isArray(data.list)) {
            metaList = data.list as MoneyLocation[];
          } else if (!data.isMeta) {
            list.push(data as MoneyLocation);
          }
        });

        if (metaList) {
          onUpdate(metaList);
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

export const subscribeToIncomeSources = (
  userId: string,
  onUpdate: (sources: IncomeSource[] | null) => void
): Unsubscribe => {
  if (!userId) {
    onUpdate(null);
    return () => {};
  }

  const q = query(INCOME_SOURCES_COLLECTION, where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const list: IncomeSource[] = [];
        let metaList: IncomeSource[] | null = null;
        snapshot.forEach((d) => {
          const data = d.data();
          if (data.isMeta && Array.isArray(data.list)) {
            metaList = data.list as IncomeSource[];
          } else if (!data.isMeta) {
            list.push(data as IncomeSource);
          }
        });

        if (metaList) {
          onUpdate(metaList);
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

export const subscribeToBudgets = (
  userId: string,
  onUpdate: (budgets: CategoryBudget[] | null) => void
): Unsubscribe => {
  if (!userId) {
    onUpdate(null);
    return () => {};
  }

  return onSnapshot(
    doc(db, 'budgets', userId),
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

export const subscribeToTransactions = (
  userId: string,
  onUpdate: (transactions: Transaction[]) => void
): Unsubscribe => {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const q = query(TRANSACTIONS_COLLECTION, where('userId', '==', userId));
  return onSnapshot(
    q,
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
// ASYNC FIRESTORE MUTATORS (STRICT UID ATTACHMENT)
// ==========================================

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
      userId,
      updatedAt: new Date().toISOString(),
      timestamp: Date.now(),
    });
    await setDoc(doc(db, 'users', userId), clean, { merge: true });
    console.log(`🔥 [Firestore] Profile updated for user UID: ${userId}`);
  } catch (err) {
    console.error('❌ Error updating profile in Firestore:', err);
  }
};

export const saveProfileToFirestore = updateUserProfile;

export const saveSettingsToFirestore = async (
  userId: string,
  settings: AppSettings
): Promise<void> => {
  if (!userId) return;
  try {
    const clean = sanitizeData({
      ...settings,
      userId,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'settings', userId), clean, { merge: true });
    console.log(`🔥 [Firestore] Settings saved for user UID: ${userId}`);
  } catch (err) {
    console.error('❌ Error saving settings to Firestore:', err);
  }
};

export const saveLocationsToFirestore = async (
  userId: string,
  locations: MoneyLocation[]
): Promise<void> => {
  if (!userId) return;
  try {
    const cleanList = sanitizeData(locations.map((loc) => ({ ...loc, userId })));
    // 1. Write user-scoped metadata list to preserve custom order
    await setDoc(
      doc(db, 'locations', `location_order_${userId}`),
      { list: cleanList, userId, isMeta: true, updatedAt: new Date().toISOString() },
      { merge: true }
    );
    // 2. Write individual document per location with userId
    const promises = cleanList.map((loc) =>
      setDoc(doc(db, 'locations', `${userId}_${loc.id}`), loc, { merge: true })
    );
    await Promise.all(promises);
    console.log(`🔥 [Firestore] Saved ${locations.length} locations for user UID: ${userId}`);
  } catch (err) {
    console.error('❌ Error saving locations to Firestore:', err);
  }
};

export const saveCategoriesToFirestore = async (
  userId: string,
  categories: ExpenseCategory[]
): Promise<void> => {
  if (!userId) return;
  try {
    const cleanList = sanitizeData(categories.map((cat) => ({ ...cat, userId })));
    // 1. Write user-scoped metadata list to preserve custom order
    await setDoc(
      doc(db, 'categories', `category_order_${userId}`),
      { list: cleanList, userId, isMeta: true, updatedAt: new Date().toISOString() },
      { merge: true }
    );
    // 2. Write individual document per category with userId
    const promises = cleanList.map((cat) =>
      setDoc(doc(db, 'categories', `${userId}_${cat.id}`), cat, { merge: true })
    );
    await Promise.all(promises);
    console.log(`🔥 [Firestore] Saved ${categories.length} categories for user UID: ${userId}`);
  } catch (err) {
    console.error('❌ Error saving categories to Firestore:', err);
  }
};

export const saveIncomeSourcesToFirestore = async (
  userId: string,
  sources: IncomeSource[]
): Promise<void> => {
  if (!userId) return;
  try {
    const cleanList = sanitizeData(sources.map((src) => ({ ...src, userId })));
    await setDoc(
      doc(db, 'income_sources', `source_order_${userId}`),
      { list: cleanList, userId, isMeta: true, updatedAt: new Date().toISOString() },
      { merge: true }
    );
    const promises = cleanList.map((src) =>
      setDoc(doc(db, 'income_sources', `${userId}_${src.id}`), src, { merge: true })
    );
    await Promise.all(promises);
    console.log(`🔥 [Firestore] Saved ${sources.length} sources for user UID: ${userId}`);
  } catch (err) {
    console.error('❌ Error saving income sources to Firestore:', err);
  }
};

export const saveBudgetsToFirestore = async (
  userId: string,
  budgets: CategoryBudget[]
): Promise<void> => {
  if (!userId) return;
  try {
    const cleanList = sanitizeData(budgets.map((b) => ({ ...b, userId })));
    await setDoc(
      doc(db, 'budgets', userId),
      { list: cleanList, userId, updatedAt: new Date().toISOString() },
      { merge: true }
    );
    console.log(`🔥 [Firestore] Budgets saved for user UID: ${userId}`);
  } catch (err) {
    console.error('❌ Error saving budgets to Firestore:', err);
  }
};

export const saveTransactionToFirestore = async (
  tx: Transaction,
  userId?: string
): Promise<void> => {
  try {
    const uid = userId || tx.userId || '';
    const cleanTx = sanitizeData({
      ...tx,
      userId: uid,
      updatedAt: new Date().toISOString(),
    });

    // 1. Write to primary 'transactions' collection with userId
    await setDoc(doc(db, 'transactions', tx.id), cleanTx, { merge: true });

    // 2. Also write to specific type collection with userId
    if (tx.type === 'expense') {
      await setDoc(doc(db, 'expenses', tx.id), cleanTx, { merge: true });
    } else if (tx.type === 'income') {
      await setDoc(doc(db, 'income', tx.id), cleanTx, { merge: true });
    } else if (tx.type === 'transfer') {
      await setDoc(doc(db, 'transfers', tx.id), cleanTx, { merge: true });
    }
    console.log(`🔥 [Firestore] Saved transaction ${tx.id} for user UID: "${uid}"`);
  } catch (err) {
    console.error('❌ Error saving transaction to Firestore:', err);
  }
};

export const deleteTransactionFromFirestore = async (
  txId: string,
  userId?: string
): Promise<void> => {
  try {
    await Promise.all([
      deleteDoc(doc(db, 'transactions', txId)),
      deleteDoc(doc(db, 'expenses', txId)).catch(() => {}),
      deleteDoc(doc(db, 'income', txId)).catch(() => {}),
      deleteDoc(doc(db, 'transfers', txId)).catch(() => {}),
    ]);
    console.log(`🔥 [Firestore] Deleted transaction ${txId} (UID: ${userId || 'N/A'})`);
  } catch (err) {
    console.error('❌ Error deleting transaction from Firestore:', err);
  }
};

export const clearAllTransactionsFromFirestore = async (userId: string): Promise<void> => {
  if (!userId) return;
  try {
    const qTx = query(TRANSACTIONS_COLLECTION, where('userId', '==', userId));
    const qExp = query(EXPENSES_COLLECTION, where('userId', '==', userId));
    const qInc = query(INCOME_COLLECTION, where('userId', '==', userId));
    const qTr = query(TRANSFERS_COLLECTION, where('userId', '==', userId));

    const [txSnap, expSnap, incSnap, trSnap] = await Promise.all([
      getDocs(qTx),
      getDocs(qExp),
      getDocs(qInc),
      getDocs(qTr),
    ]);

    const deletePromises = [
      ...txSnap.docs.map((d) => deleteDoc(d.ref)),
      ...expSnap.docs.map((d) => deleteDoc(d.ref)),
      ...incSnap.docs.map((d) => deleteDoc(d.ref)),
      ...trSnap.docs.map((d) => deleteDoc(d.ref)),
    ];
    await Promise.all(deletePromises);
    console.log(`🔥 [Firestore] All transactions cleared for user UID: ${userId}`);
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

// Fetch all Firestore documents for restoring an existing account (UID-scoped)
export const fetchAllFirestoreData = async (userId?: string): Promise<{
  profile?: UserProfile;
  settings?: AppSettings;
  categories?: ExpenseCategory[];
  locations?: MoneyLocation[];
  incomeSources?: IncomeSource[];
  budgets?: CategoryBudget[];
  transactions?: Transaction[];
} | null> => {
  if (!userId) return null;
  try {
    const [profileSnap, settingsSnap, catSnap, locSnap, incSnap, budgetSnap, txSnap] =
      await Promise.all([
        getDoc(doc(db, 'users', userId)),
        getDoc(doc(db, 'settings', userId)),
        getDocs(query(CATEGORIES_COLLECTION, where('userId', '==', userId))),
        getDocs(query(LOCATIONS_COLLECTION, where('userId', '==', userId))),
        getDocs(query(INCOME_SOURCES_COLLECTION, where('userId', '==', userId))),
        getDoc(doc(db, 'budgets', userId)),
        getDocs(query(TRANSACTIONS_COLLECTION, where('userId', '==', userId))),
      ]);

    const profile = profileSnap.exists() ? (profileSnap.data() as UserProfile) : undefined;
    const settings = settingsSnap.exists() ? (settingsSnap.data() as AppSettings) : undefined;

    let categories: ExpenseCategory[] = [];
    if (!catSnap.empty) {
      catSnap.forEach((d) => {
        const data = d.data();
        if (data.isMeta && Array.isArray(data.list)) {
          categories = data.list;
        } else if (!data.isMeta) {
          categories.push(data as ExpenseCategory);
        }
      });
    }

    let locations: MoneyLocation[] = [];
    if (!locSnap.empty) {
      locSnap.forEach((d) => {
        const data = d.data();
        if (data.isMeta && Array.isArray(data.list)) {
          locations = data.list;
        } else if (!data.isMeta) {
          locations.push(data as MoneyLocation);
        }
      });
    }

    let incomeSources: IncomeSource[] = [];
    if (!incSnap.empty) {
      incSnap.forEach((d) => {
        const data = d.data();
        if (data.isMeta && Array.isArray(data.list)) {
          incomeSources = data.list;
        } else if (!data.isMeta) {
          incomeSources.push(data as IncomeSource);
        }
      });
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
  if (!userId) return;
  try {
    console.log(`🔥 [Firestore] Syncing all collections to Firestore for UID "${userId}"...`);
    await Promise.all([
      saveProfileToFirestore(userId, data.profile),
      saveSettingsToFirestore(userId, data.settings),
      saveCategoriesToFirestore(userId, data.categories),
      saveLocationsToFirestore(userId, data.locations),
      saveIncomeSourcesToFirestore(userId, data.incomeSources),
      saveBudgetsToFirestore(userId, data.budgets),
      ...data.transactions.map((tx) => saveTransactionToFirestore(tx, userId)),
    ]);
    console.log(`✅ [Firestore] All collections synced for UID "${userId}" successfully!`);
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
  currency?: AppSettings['currency'];
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
      userId,
    });

    await setDoc(doc(db, 'users', userId), cleanUser, { merge: true });
    console.log(`🔥 [Firestore] User "${cleanUser.name}" profile saved under UID "${userId}"`);
    return { success: true, id: userId };
  } catch (err) {
    console.error('❌ Error saving new user to Firestore:', err);
    return { success: false };
  }
};
