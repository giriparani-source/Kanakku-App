import { GoogleGenAI } from '@google/genai';
import {
  MoneyLocation,
  ExpenseCategory,
  IncomeSource,
  NeedWantType,
  TransactionType,
  TransferType,
} from '../types';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_LOCATIONS,
  DEFAULT_INCOME_SOURCES,
} from '../constants/data';

export interface ParsedSmsResult {
  id?: string;
  smsId?: string;
  rawText: string;
  amount: number | null;
  type: TransactionType;
  needWant: NeedWantType;
  merchant: string;
  categoryName: string;
  sourceName: string;
  locationId: string;
  locationName: string;
  accountNumber?: string;
  bankName?: string;
  availableBalance?: number | null;
  dateStr?: string;
  transferType: TransferType;
  referenceNumber?: string;
  isConfidenceHigh: boolean;
}

// ==============================================================================
// INDIAN MERCHANT & KEYWORD CATEGORY MAPPINGS
// ==============================================================================
const MERCHANT_CATEGORY_RULES: Array<{
  keywords: string[];
  category: string;
  needWant: NeedWantType;
}> = [
  {
    keywords: [
      'swiggy', 'zomato', 'mcdonald', 'kfc', 'domino', 'pizza', 'burger', 'starbucks',
      'cafe', 'chai', 'tea', 'coffee', 'hotel', 'restaurant', 'bakery', 'bakes',
      'biryani', 'eats', 'barbeque', 'tiffin', 'canteen', 'subway', 'haldiram'
    ],
    category: 'Food & Dining',
    needWant: 'Want',
  },
  {
    keywords: [
      'zepto', 'blinkit', 'instamart', 'bigbasket', 'dunzo', 'dmart', 'more retail',
      'reliance fresh', 'nature basket', 'supermarket', 'provisions', 'groceries',
      'milk', 'dairy', 'vegetables', 'fruits'
    ],
    category: 'Food & Dining',
    needWant: 'Need',
  },
  {
    keywords: [
      'uber', 'ola', 'rapido', 'fastag', 'metro', 'irctc', 'redbus', 'makemytrip',
      'fuel', 'petrol', 'diesel', 'hpcl', 'iocl', 'bpcl', 'shell', 'parking', 'toll'
    ],
    category: 'Transport',
    needWant: 'Need',
  },
  {
    keywords: [
      'amazon', 'flipkart', 'myntra', 'meesho', 'ajio', 'tata cliq', 'nykaa', 'zara',
      'h&m', 'trends', 'westside', 'lifestyle', 'shoppers stop', 'croma', 'reliance digital'
    ],
    category: 'Shopping',
    needWant: 'Want',
  },
  {
    keywords: [
      'airtel', 'jio', 'vi', 'vodafone', 'bsnl', 'tneb', 'bescom', 'cesc', 'mpeb',
      'electricity', 'power', 'water bill', 'gas', 'indane', 'hp gas', 'bharat gas',
      'broadband', 'act fibernet', 'hathway', 'tata play', 'dish tv', 'dth'
    ],
    category: 'Bills & Utilities',
    needWant: 'Need',
  },
  {
    keywords: [
      'apollo', 'pharmeasy', '1mg', 'medplus', 'netmeds', 'hospital', 'clinic',
      'pharmacy', 'diagnostic', 'doctor', 'dental', 'max healthcare', 'fortis'
    ],
    category: 'Health & Medical',
    needWant: 'Need',
  },
  {
    keywords: [
      'netflix', 'prime video', 'hotstar', 'disney', 'spotify', 'youtube', 'pvr',
      'inox', 'cinepolis', 'bookmyshow', 'theatre', 'gaming', 'steam', 'playstation'
    ],
    category: 'Entertainment',
    needWant: 'Want',
  },
  {
    keywords: ['salary', 'payroll', 'wages', 'stipend', 'incentive', 'bonus'],
    category: 'Salary / Wages',
    needWant: 'Need',
  },
  {
    keywords: ['rent', 'housing', 'society maintenance', 'nobroker', 'mygate'],
    category: 'Housing & Rent',
    needWant: 'Need',
  },
];

// Bank identifier patterns
const KNOWN_BANKS = [
  { name: 'HDFC Bank', triggers: ['hdfc', 'hdfcbk'] },
  { name: 'State Bank of India', triggers: ['sbi', 'sbiinb', 'sbin'] },
  { name: 'ICICI Bank', triggers: ['icici', 'icicib'] },
  { name: 'Axis Bank', triggers: ['axis', 'axisbk'] },
  { name: 'Kotak Bank', triggers: ['kotak', 'kotakb'] },
  { name: 'Punjab National Bank', triggers: ['pnb'] },
  { name: 'Bank of Baroda', triggers: ['bob', 'baroda'] },
  { name: 'Canara Bank', triggers: ['canara', 'cnrb'] },
  { name: 'IndusInd Bank', triggers: ['indusind'] },
  { name: 'Union Bank', triggers: ['union', 'uboi'] },
  { name: 'IDFC FIRST Bank', triggers: ['idfc', 'idfcbk'] },
  { name: 'Paytm Payments Bank', triggers: ['paytm'] },
  { name: 'Federal Bank', triggers: ['federal'] },
  { name: 'Yes Bank', triggers: ['yesbk', 'yesbank'] },
];

/**
 * Regex-based Indian Bank SMS Parser
 */
export const parseBankSmsRegex = (
  rawText: string,
  categories: ExpenseCategory[] = DEFAULT_CATEGORIES,
  locations: MoneyLocation[] = DEFAULT_LOCATIONS,
  incomeSources: IncomeSource[] = DEFAULT_INCOME_SOURCES
): ParsedSmsResult => {
  if (!rawText || !rawText.trim()) {
    return createDefaultResult(rawText, locations);
  }

  const cleanText = rawText.replace(/\r?\n|\r/g, ' ').trim();
  const lowerText = cleanText.toLowerCase();

  // 1. EXTRACT AMOUNT
  let amount: number | null = null;
  const amountPatterns = [
    /(?:rs\.?|inr|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
    /(?:amount\s*(?:of|is)?\s*(?:rs\.?|inr|₹)?\s*)([0-9,]+(?:\.[0-9]{1,2})?)/i,
    /(?:debited\s*(?:by|for)?\s*(?:rs\.?|inr|₹)?\s*)([0-9,]+(?:\.[0-9]{1,2})?)/i,
    /(?:credited\s*(?:by|with)?\s*(?:rs\.?|inr|₹)?\s*)([0-9,]+(?:\.[0-9]{1,2})?)/i,
    /(?:spent|paid|withdrawn|transferred)\s*(?:rs\.?|inr|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
    /([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:rs\.?|inr|₹)/i,
  ];

  for (const pattern of amountPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      const parsedNum = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(parsedNum) && parsedNum > 0) {
        amount = parsedNum;
        break;
      }
    }
  }

  // 2. DETECT TRANSACTION TYPE
  let type: TransactionType = 'expense';
  let transferType: TransferType = 'transfer';

  const isCredit =
    (lowerText.includes('credited') ||
     lowerText.includes('received') ||
     lowerText.includes('deposited') ||
     lowerText.includes('refund') ||
     lowerText.includes('cashback')) &&
    !lowerText.includes('debited');

  const isAtmWithdrawal =
    (lowerText.includes('atm') || lowerText.includes('cash withdrawal')) &&
    (lowerText.includes('withdrawn') || lowerText.includes('debit'));

  if (isAtmWithdrawal) {
    type = 'transfer';
    transferType = 'withdrawal';
  } else if (isCredit) {
    type = 'income';
  } else {
    type = 'expense';
  }

  // 3. EXTRACT ACCOUNT / CARD NUMBER & BANK NAME
  let accountNumber: string | undefined;
  const acctMatch = cleanText.match(/(?:a\/c|acct|account|card)\s*(?:no\.?)?\s*(?:ending\s*(?:with|in)?)?\s*[*xX]*([0-9]{3,4})/i);
  if (acctMatch && acctMatch[1]) {
    accountNumber = acctMatch[1];
  }

  let bankName: string | undefined;
  for (const b of KNOWN_BANKS) {
    if (b.triggers.some((t) => lowerText.includes(t))) {
      bankName = b.name;
      break;
    }
  }

  // 4. EXTRACT AVAILABLE BALANCE
  let availableBalance: number | null = null;
  const balMatch = cleanText.match(/(?:avl\s*bal|available\s*bal|bal)\s*:?\s*(?:inr|rs\.?|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
  if (balMatch && balMatch[1]) {
    const balNum = parseFloat(balMatch[1].replace(/,/g, ''));
    if (!isNaN(balNum)) availableBalance = balNum;
  }

  // 5. EXTRACT REFERENCE NUMBER
  let referenceNumber: string | undefined;
  const refMatch = cleanText.match(/(?:ref\s*no\.?|upi\s*ref|ref\s*#?|rrn|txn\s*id)\s*:?\s*([0-9a-zA-Z]+)/i);
  if (refMatch && refMatch[1]) {
    referenceNumber = refMatch[1];
  }

  // 6. EXTRACT MERCHANT / PAYEE
  let merchant = '';
  const merchantPatterns = [
    /(?:towards|to\s+vpa|to|at|vpa|info:?)\s+([^.,;\n/]+?)(?:\s+on|\s+via|\s+ref|\s+avl|\s+upi|\.|\s+dt|$)/i,
    /(?:in\s*favor\s*of)\s+([^.,;\n/]+?)(?:\s+on|\s+via|\.|$)/i,
    /(?:on\s*pos\s*at)\s+([^.,;\n/]+?)(?:\s+on|\s+via|\.|$)/i,
    /(?:for\s+)([^.,;\n/]+?)(?:\s+on|\s+via|\s+ref|\.|$)/i,
  ];

  for (const mp of merchantPatterns) {
    const match = cleanText.match(mp);
    if (match && match[1]) {
      const candidate = match[1].trim();
      // Clean up common noise words
      if (
        candidate.length > 1 &&
        !['a/c', 'account', 'your', 'rs', 'inr', 'bank', 'upi'].includes(candidate.toLowerCase())
      ) {
        merchant = candidate;
        break;
      }
    }
  }

  if (!merchant && isAtmWithdrawal) {
    merchant = 'ATM Cash Withdrawal';
  } else if (!merchant && type === 'income') {
    merchant = lowerText.includes('salary') ? 'Salary Deposit' : 'Bank Credit / Refund';
  } else if (!merchant) {
    merchant = bankName ? `${bankName} Transaction` : 'Bank Transaction';
  }

  // Capitalize merchant neatly
  merchant = sanitizeMerchantName(merchant);

  // 7. MATCH CATEGORY & NEED/WANT
  let categoryName = categories[0]?.name || 'Food & Dining';
  let needWant: NeedWantType = 'Need';
  let sourceName = incomeSources[0]?.name || 'Salary / Wages';

  const lookupText = `${merchant} ${lowerText}`;

  for (const rule of MERCHANT_CATEGORY_RULES) {
    if (rule.keywords.some((kw) => lookupText.includes(kw))) {
      // Find matching category in available categories
      const matchedCat = categories.find((c) =>
        c.name.toLowerCase().includes(rule.category.toLowerCase()) ||
        rule.category.toLowerCase().includes(c.name.toLowerCase())
      );
      if (matchedCat) {
        categoryName = matchedCat.name;
        needWant = matchedCat.defaultNeed ? 'Need' : rule.needWant;
      }

      const matchedSrc = incomeSources.find((s) =>
        s.name.toLowerCase().includes(rule.category.toLowerCase()) ||
        rule.category.toLowerCase().includes(s.name.toLowerCase())
      );
      if (matchedSrc) {
        sourceName = matchedSrc.name;
      }
      break;
    }
  }

  // 8. MATCH LOCATION (Bank Account / Wallet)
  let matchedLocation = locations[0];
  if (bankName || accountNumber) {
    const bankLoc = locations.find((l) => {
      const lName = l.name.toLowerCase();
      const bName = (bankName || '').toLowerCase();
      return (
        (bName && lName.includes(bName)) ||
        (accountNumber && (l.mask === accountNumber || lName.includes(accountNumber))) ||
        (l.type === 'bank')
      );
    });
    if (bankLoc) matchedLocation = bankLoc;
  } else if (lowerText.includes('upi') || lowerText.includes('gpay') || lowerText.includes('phonepe') || lowerText.includes('paytm')) {
    const upiLoc = locations.find((l) => l.type === 'wallet' || l.name.toLowerCase().includes('upi') || l.name.toLowerCase().includes('gpay'));
    if (upiLoc) matchedLocation = upiLoc;
  }

  return {
    rawText: cleanText,
    amount,
    type,
    needWant,
    merchant,
    categoryName,
    sourceName,
    locationId: matchedLocation?.id || 'loc_bank',
    locationName: matchedLocation?.name || 'Bank Account',
    accountNumber,
    bankName,
    availableBalance,
    transferType,
    referenceNumber,
    isConfidenceHigh: amount !== null && amount > 0,
  };
};

/**
 * Clean up messy merchant strings extracted from raw SMS
 */
const sanitizeMerchantName = (str: string): string => {
  if (!str) return 'Bank Transaction';
  let cleaned = str
    .replace(/^[@/\\#:-]+/, '')
    .replace(/[@/\\#:-]+$/, '')
    .replace(/UPI\s*Ref.*$/i, '')
    .replace(/Avl\s*Bal.*$/i, '')
    .replace(/A\/c.*$/i, '')
    .replace(/on\s*\d{1,2}[-/][A-Za-z0-9]+.*$/i, '')
    .trim();

  // If it's a VPA (e.g. swiggy@icici), extract the brand name
  if (cleaned.includes('@')) {
    const vpaPrefix = cleaned.split('@')[0];
    if (vpaPrefix.length > 2) {
      cleaned = vpaPrefix;
    }
  }

  if (cleaned.length > 30) cleaned = cleaned.substring(0, 30);
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

const createDefaultResult = (rawText: string, locations: MoneyLocation[]): ParsedSmsResult => ({
  rawText,
  amount: null,
  type: 'expense',
  needWant: 'Need',
  merchant: 'Bank Transaction',
  categoryName: 'Bills & Utilities',
  sourceName: 'Other Income',
  locationId: locations[0]?.id || 'loc_bank',
  locationName: locations[0]?.name || 'Bank Account',
  transferType: 'transfer',
  isConfidenceHigh: false,
});

/**
 * Gemini AI SMS Parser (Optional fallback for weirdly formatted SMS)
 */
export const parseSmsWithGemini = async (
  rawText: string,
  categories: ExpenseCategory[],
  locations: MoneyLocation[],
  incomeSources: IncomeSource[]
): Promise<ParsedSmsResult> => {
  // First run local regex parser for instant baseline
  const localResult = parseBankSmsRegex(rawText, categories, locations, incomeSources);

  const apiKey =
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    '';

  if (!apiKey) {
    return localResult;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const availableCategories = categories.map((c) => c.name).join(', ');
    const availableSources = incomeSources.map((s) => s.name).join(', ');
    const availableLocations = locations.map((l) => `${l.name} (${l.type})`).join(', ');

    const prompt = `
You are a Bank SMS Transaction Parser for an Indian expense tracker app "Kanakku".
Parse the following bank SMS:
"${rawText}"

Available Categories: [${availableCategories}]
Available Income Sources: [${availableSources}]
Available Wallets/Accounts: [${availableLocations}]

Return ONLY a JSON object:
{
  "amount": number,
  "type": "expense" | "income" | "transfer",
  "needWant": "Need" | "Want",
  "merchant": string,
  "categoryName": string,
  "sourceName": string,
  "bankName": string,
  "accountNumber": string,
  "availableBalance": number | null
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const jsonText = response.text ? response.text.trim() : '{}';
    const parsed = JSON.parse(jsonText);

    if (parsed.amount && typeof parsed.amount === 'number') {
      const matchedCat = categories.find(
        (c) => c.name.toLowerCase() === (parsed.categoryName || '').toLowerCase()
      );
      const matchedLoc = locations.find(
        (l) => l.name.toLowerCase() === (parsed.locationName || '').toLowerCase()
      );

      return {
        ...localResult,
        amount: parsed.amount,
        type: parsed.type || localResult.type,
        needWant: parsed.needWant || localResult.needWant,
        merchant: parsed.merchant || localResult.merchant,
        categoryName: matchedCat?.name || localResult.categoryName,
        sourceName: parsed.sourceName || localResult.sourceName,
        locationId: matchedLoc?.id || localResult.locationId,
        locationName: matchedLoc?.name || localResult.locationName,
        bankName: parsed.bankName || localResult.bankName,
        accountNumber: parsed.accountNumber || localResult.accountNumber,
        availableBalance: parsed.availableBalance ?? localResult.availableBalance,
        isConfidenceHigh: true,
      };
    }
  } catch (err) {
    console.warn('Gemini SMS Parser fallback to regex:', err);
  }

  return localResult;
};
