export type TransactionType = 'expense' | 'income' | 'transfer';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY';

export type LocationType = 'cash' | 'bank' | 'wallet' | 'savings';

export type TransferType = 'deposit' | 'withdrawal' | 'transfer';

export type NeedWantType = 'Need' | 'Want';

export type UserProfession = 'Student' | 'Salaried';

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
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  bgColor: string;
  textColor: string;
  color: string;
  defaultNeed: boolean;
}

export interface IncomeSource {
  id: string;
  name: string;
  icon: string;
}

export interface BaseTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // YYYY-MM-DD or readable string e.g. "Today"
  time: string; // e.g. "2:30 PM"
  timestamp: number;
  notes?: string;
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
  profession?: UserProfession;
  email: string;
  phone: string;
  memberSince: string;
  avatarUrl: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: string;
  type: 'alert' | 'success' | 'info';
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
}

export interface CategoryBudget {
  category: string;
  limit: number;
}
