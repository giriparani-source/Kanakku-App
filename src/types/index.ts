export type TransactionType = 'expense' | 'income' | 'transfer';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY';

export type LocationType = 'cash' | 'bank' | 'wallet' | 'savings';

export type TransferType = 'deposit' | 'withdrawal' | 'transfer';

export type NeedWantType = 'Need' | 'Want';

export type UserProfession = 'Student' | 'Salaried' | 'Freelancer' | 'Business' | 'Self-Employed' | string;

export interface MoneyLocation {
  id: string;
  name: string;
  type: LocationType;
  initialBalance: number;
  icon: string;
  color: string;
  isSavings?: boolean;
  mask?: string;
  institution?: string;
  userId?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  bgColor: string;
  textColor: string;
  color: string;
  defaultNeed: boolean;
  userId?: string;
}

export interface IncomeSource {
  id: string;
  name: string;
  icon: string;
  userId?: string;
}

export interface BaseTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // YYYY-MM-DD or readable string e.g. "Today"
  time: string; // e.g. "2:30 PM"
  timestamp: number;
  notes?: string;
  userId?: string;
}

export interface IncomeTransaction extends BaseTransaction {
  type: 'income';
  source: string; // Income source name or id
  locationId: string; // Money location credited
}

export interface ExpenseTransaction extends BaseTransaction {
  type: 'expense';
  description: string; // Description of spending
  category: string; // Category name or id
  locationId: string; // Money location debited
  needWant: NeedWantType; // MANDATORY Need vs. Want tag
  isRecurring?: boolean;
}

export interface TransferTransaction extends BaseTransaction {
  type: 'transfer';
  transferType: TransferType; // deposit, withdrawal, or transfer
  locationId: string; // Primary/target location
  fromLocationId?: string; // Location debited
  toLocationId?: string; // Location credited
}

export type Transaction = IncomeTransaction | ExpenseTransaction | TransferTransaction;

export interface UserProfile {
  name: string;
  age?: number | string;
  dob?: string;
  profession?: UserProfession;
  email: string;
  phone: string;
  memberSince: string;
  avatarUrl: string;
  userId?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: string;
  type: 'alert' | 'success' | 'info';
  userId?: string;
}

export interface AppSettings {
  currency: CurrencyCode;
  language: string;
  darkMode: boolean;
  pushAlerts: boolean;
  dailyReminders: boolean;
  biometricLock: boolean;
  pinCode: string; // 4-digit PIN
  isPinLockEnabled: boolean; // toggle choice for app security
  autoSmsDetection?: boolean; // toggle for auto bank SMS transaction detection
  userId?: string;
}

export interface CategoryBudget {
  category: string;
  limit: number;
  userId?: string;
}

export interface RawSmsMessage {
  id: string;
  sender: string;
  body: string;
  date: string;
  timestamp: number;
}

// ==========================================
// SPLIT WITH FRIENDS (KANAKKU SHARING)
// ==========================================
export interface SplitFriend {
  id: string;
  name: string;
  phone?: string;
  upiId?: string;
  avatarUrl?: string;
  color?: string;
  userId?: string;
}

export interface SplitGroup {
  id: string;
  name: string;
  icon: string;
  color: string;
  memberIds: string[]; // List of friend IDs + 'user'
  createdAt: number;
  userId?: string;
}

export interface SplitMemberShare {
  memberId: string; // 'user' or friend.id
  amount: number;
  hasSettled?: boolean;
}

export interface SplitExpense {
  id: string;
  groupId?: string; // Optional: associated group
  description: string;
  totalAmount: number;
  category: string;
  date: string; // YYYY-MM-DD
  time?: string;
  paidBy: string; // 'user' or friend.id
  splitType: 'equal' | 'exact' | 'percentage';
  shares: SplitMemberShare[];
  settled: boolean;
  notes?: string;
  createdAt: number;
  userId?: string;
}

export interface SplitSettlement {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  date: string;
  paymentMode: 'upi' | 'cash' | 'other';
  referenceNote?: string;
  createdAt: number;
  userId?: string;
}
