import {
  ExpenseCategory,
  MoneyLocation,
  IncomeSource,
  Transaction,
  UserProfile,
  AppNotification,
  AppSettings,
  CategoryBudget,
} from '../types';

export const DEFAULT_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBffeNuyoir-SNa7zTngY-drLW4eJoyllX_Ji24atYpXlLUR5MOFQgDz0b5yoVx7n06H4-3oVIBXfQP5Ly2LlAmNvu6BN-CEUZx2iSjRvsggd1Jt2dpSicNpFdamS3tjPMQpVN07cZvyi5f0s9QEGxTX8zGjnfgbU77pCCdHAvaxmz-1NOM2Tk1QeUkgKA3SEJbPsXw7pKDf93SVRx369haAEh63ukzorBcbCZ6Ve4jSLARPm4x4j4WlA';

export const USER_AVATAR_ALT =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCTDMzJmufRdTQ_03RTRf-1Drxr06oyTqypl4iD2bcIfF77RUaIr_FfiJYB-Kt-taaO9ayDMvGIA_15KLG4ly_AwXoYJOGKeaV8o2mVaVjyR_TyRRgEO3G8rDByO0PRC92Mw2wCZvoRYRnqErClS8MBw2EGCXBv_t9P8UnoyAOUQuMyguuXKbHiFF35j_KxXziRSbLs2hNtq6O7JZIHU4bdW4-nTevv7fpjQ-STbkUZgKXLnVwah9wysA';

export const DEFAULT_CATEGORIES: ExpenseCategory[] = [
  {
    id: 'cat-food',
    name: 'Food & Dining',
    icon: 'restaurant',
    bgColor: 'bg-rose-500 text-white',
    textColor: 'text-rose-600',
    color: '#FF2D55',
    defaultNeed: true,
  },
  {
    id: 'cat-transport',
    name: 'Transport',
    icon: 'directions_car',
    bgColor: 'bg-cyan-600 text-white',
    textColor: 'text-cyan-600',
    color: '#06B6D4',
    defaultNeed: true,
  },
  {
    id: 'cat-housing',
    name: 'Housing & Rent',
    icon: 'home',
    bgColor: 'bg-blue-600 text-white',
    textColor: 'text-blue-600',
    color: '#0066FF',
    defaultNeed: true,
  },
  {
    id: 'cat-bills',
    name: 'Bills & Utilities',
    icon: 'receipt_long',
    bgColor: 'bg-amber-500 text-white',
    textColor: 'text-amber-600',
    color: '#F59E0B',
    defaultNeed: true,
  },
  {
    id: 'cat-shopping',
    name: 'Shopping',
    icon: 'shopping_bag',
    bgColor: 'bg-purple-600 text-white',
    textColor: 'text-purple-600',
    color: '#9333EA',
    defaultNeed: false,
  },
  {
    id: 'cat-ent',
    name: 'Entertainment',
    icon: 'movie',
    bgColor: 'bg-indigo-600 text-white',
    textColor: 'text-indigo-600',
    color: '#6366F1',
    defaultNeed: false,
  },
  {
    id: 'cat-health',
    name: 'Health & Medical',
    icon: 'favorite',
    bgColor: 'bg-emerald-500 text-white',
    textColor: 'text-emerald-600',
    color: '#10B981',
    defaultNeed: true,
  },
  {
    id: 'cat-tea',
    name: 'Tea & Coffee',
    icon: 'local_cafe',
    bgColor: 'bg-orange-500 text-white',
    textColor: 'text-orange-600',
    color: '#F97316',
    defaultNeed: false,
  },
  {
    id: 'cat-edu',
    name: 'Education & Courses',
    icon: 'school',
    bgColor: 'bg-teal-600 text-white',
    textColor: 'text-teal-600',
    color: '#0D9488',
    defaultNeed: true,
  },
  {
    id: 'cat-travel',
    name: 'Travel & Trips',
    icon: 'flight',
    bgColor: 'bg-pink-600 text-white',
    textColor: 'text-pink-600',
    color: '#DB2777',
    defaultNeed: false,
  },
  {
    id: 'cat-more',
    name: 'Other Expenses',
    icon: 'more_horiz',
    bgColor: 'bg-neutral-800 text-white',
    textColor: 'text-neutral-900',
    color: '#52525B',
    defaultNeed: false,
  },
];

export const DEFAULT_LOCATIONS: MoneyLocation[] = [
  {
    id: 'loc-cash',
    name: 'Cash in Hand',
    type: 'cash',
    initialBalance: 0,
    icon: 'payments',
    color: '#00C853',
    isSavings: false,
    mask: 'CASH',
    institution: 'Physical Cash',
  },
  {
    id: 'loc-bank-primary',
    name: 'Primary Bank Account',
    type: 'bank',
    initialBalance: 0,
    icon: 'account_balance',
    color: '#0066FF',
    isSavings: false,
    mask: 'BANK',
    institution: 'Checking Account',
  },
  {
    id: 'loc-savings',
    name: 'Savings Reserve',
    type: 'savings',
    initialBalance: 0,
    icon: 'savings',
    color: '#FF9500',
    isSavings: true,
    mask: 'SAVE',
    institution: 'High-Yield Savings',
  },
  {
    id: 'loc-wallet',
    name: 'Digital Wallet',
    type: 'wallet',
    initialBalance: 0,
    icon: 'account_balance_wallet',
    color: '#8B5CF6',
    isSavings: false,
    mask: 'GPAY',
    institution: 'GPay / Apple Wallet',
  },
];

export const DEFAULT_INCOME_SOURCES: IncomeSource[] = [
  { id: 'inc-salary', name: 'Salary / Wages', icon: 'payments' },
  { id: 'inc-freelance', name: 'Freelance & Consulting', icon: 'work' },
  { id: 'inc-business', name: 'Business & Sales', icon: 'storefront' },
  { id: 'inc-investments', name: 'Investment Return / Dividends', icon: 'trending_up' },
  { id: 'inc-rental', name: 'Rental Income', icon: 'real_estate_agent' },
  { id: 'inc-gift', name: 'Gift / Allowance', icon: 'featured_seasonal_and_gifts' },
  { id: 'inc-cashback', name: 'Refund / Cashback', icon: 'currency_exchange' },
  { id: 'inc-other', name: 'Other Income', icon: 'attach_money' },
];

export const INITIAL_PROFILE: UserProfile = {
  name: '',
  age: '',
  dob: '',
  profession: '',
  email: '',
  phone: '',
  memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  avatarUrl: DEFAULT_AVATAR,
};

// CLEAN SLATE: Start with zero dummy transactions
export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-welcome',
    title: 'Welcome to Kanakku!',
    message: 'Your personal finance tracker is ready. Log your daily income, expenses with mandatory Need/Want, and transfers.',
    time: 'Just now',
    read: false,
    icon: 'account_balance_wallet',
    type: 'success',
  },
];

export const INITIAL_SETTINGS: AppSettings = {
  currency: 'INR',
  language: 'English (US)',
  darkMode: false,
  pushAlerts: true,
  dailyReminders: false,
  biometricLock: false,
  pinCode: '1234',
  isPinLockEnabled: false,
};

export const INITIAL_BUDGETS: CategoryBudget[] = [
  { category: 'Food & Dining', limit: 12000 },
  { category: 'Housing & Rent', limit: 20000 },
  { category: 'Transport', limit: 5000 },
  { category: 'Bills & Utilities', limit: 4000 },
  { category: 'Shopping', limit: 5000 },
  { category: 'Entertainment', limit: 3000 },
  { category: 'Health & Medical', limit: 3000 },
];

export const DEFAULT_SPLIT_FRIENDS = [
  {
    id: 'friend-rahul',
    name: 'Rahul Sharma',
    phone: '+91 98765 43210',
    upiId: 'rahulsharma@okhdfcbank',
    avatarUrl: '',
    color: '#3B82F6',
  },
  {
    id: 'friend-priya',
    name: 'Priya Nair',
    phone: '+91 98450 11223',
    upiId: 'priyanair@okaxis',
    avatarUrl: '',
    color: '#EC4899',
  },
  {
    id: 'friend-karthik',
    name: 'Karthik Raj',
    phone: '+91 97100 88990',
    upiId: 'karthikraj@paytm',
    avatarUrl: '',
    color: '#10B981',
  },
];

export const DEFAULT_SPLIT_GROUPS = [
  {
    id: 'group-goa',
    name: 'Goa Trip 🏖️',
    icon: 'beach_access',
    color: '#06B6D4',
    memberIds: ['user', 'friend-rahul', 'friend-priya', 'friend-karthik'],
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'group-flat',
    name: 'Flat 302 Roommates 🏠',
    icon: 'apartment',
    color: '#F59E0B',
    memberIds: ['user', 'friend-rahul', 'friend-karthik'],
    createdAt: Date.now() - 86400000 * 30,
  },
];

export const DEFAULT_SPLIT_EXPENSES = [
  {
    id: 'split-exp-1',
    groupId: 'group-goa',
    description: 'Beach Shack Seafood Dinner',
    totalAmount: 3600,
    category: 'Food & Dining',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    time: '08:30 PM',
    paidBy: 'user', // Paid by user
    splitType: 'equal' as const,
    shares: [
      { memberId: 'user', amount: 900, hasSettled: true },
      { memberId: 'friend-rahul', amount: 900, hasSettled: false },
      { memberId: 'friend-priya', amount: 900, hasSettled: false },
      { memberId: 'friend-karthik', amount: 900, hasSettled: false },
    ],
    settled: false,
    notes: 'Goa beachfront restaurant with fresh seafood',
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'split-exp-2',
    groupId: 'group-goa',
    description: 'Scuba Diving & Boat Ride',
    totalAmount: 4800,
    category: 'Entertainment',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    time: '11:00 AM',
    paidBy: 'friend-rahul', // Paid by Rahul
    splitType: 'equal' as const,
    shares: [
      { memberId: 'user', amount: 1200, hasSettled: false },
      { memberId: 'friend-rahul', amount: 1200, hasSettled: true },
      { memberId: 'friend-priya', amount: 1200, hasSettled: false },
      { memberId: 'friend-karthik', amount: 1200, hasSettled: false },
    ],
    settled: false,
    notes: 'Grand Island water sports package',
    createdAt: Date.now() - 86400000,
  },
];

