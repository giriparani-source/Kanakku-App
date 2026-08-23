import { MoneyLocation, ExpenseCategory, IncomeSource, NeedWantType, TransactionType, TransferType } from '../types';

// Tamil & English Number Words mapping
const NUMBER_WORDS: Record<string, number> = {
  // English
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
  thousand: 1000,
  lakh: 100000,
  crore: 10000000,
  million: 1000000,

  // Tamil / Tanglish
  onnu: 1,
  ondru: 1,
  oru: 1,
  rendu: 2,
  irandu: 2,
  moonu: 3,
  moondru: 3,
  naalu: 4,
  naangu: 4,
  anju: 5,
  aindhu: 5,
  aaru: 6,
  ezhu: 7,
  ettu: 8,
  onbadhu: 9,
  ombodhu: 9,
  pathu: 10,
  irubadhu: 20,
  iruvathu: 20,
  muppadhu: 30,
  muppathu: 30,
  naarpadhu: 40,
  nappathu: 40,
  aimbadhu: 50,
  ambadhu: 50,
  ambathu: 50,
  arubadhu: 60,
  aruvathu: 60,
  ezhubadhu: 70,
  eluvathu: 70,
  enbadhu: 80,
  yembathu: 80,
  thonnooru: 90,
  nooru: 100,
  nuru: 100,
  irunooru: 200,
  munnooru: 300,
  naanooru: 400,
  ainooru: 500,
  anuru: 500,
  aayiram: 1000,
  ayiram: 1000,
  rendayiram: 2000,
  pathayiram: 10000,
  latcham: 100000,
  patcham: 100000,
  kodi: 10000000,
};

export interface ParsedVoiceResult {
  amount: number | null;
  type: TransactionType;
  needWant: NeedWantType;
  categoryName: string;
  sourceName: string;
  locationId: string;
  fromLocationId?: string;
  toLocationId?: string;
  transferType: TransferType;
  cleanNote: string;
  matchedEntities: {
    amountMatched?: boolean;
    categoryMatched?: string;
    needWantMatched?: NeedWantType;
    locationMatched?: string;
    typeMatched?: TransactionType;
  };
}

/**
 * Parses spoken number words into a numeric value
 */
export const parseWordsToNumber = (text: string): number | null => {
  const words = text.toLowerCase().replace(/[-_,.]/g, ' ').split(/\s+/);
  let total = 0;
  let current = 0;
  let found = false;

  for (const word of words) {
    if (NUMBER_WORDS[word] !== undefined) {
      found = true;
      const val = NUMBER_WORDS[word];
      if (val === 100) {
        current = (current || 1) * 100;
      } else if (val >= 1000) {
        current = (current || 1) * val;
        total += current;
        current = 0;
      } else {
        current += val;
      }
    }
  }

  total += current;
  return found && total > 0 ? total : null;
};

/**
 * Universal flexible Natural Language Parser for Tamil / Tanglish / English
 */
export const parseSmartVoiceTransaction = (
  rawText: string,
  categories: ExpenseCategory[],
  locations: MoneyLocation[],
  incomeSources: IncomeSource[]
): ParsedVoiceResult => {
  const text = rawText.toLowerCase().trim();
  const normalized = text.replace(/[\(\)\[\]\{\}\/\\,]/g, ' ');

  // 1. EXTRACT AMOUNT (ANY POSITION)
  let extractedAmount: number | null = null;

  // 1a. Look for 'k' format like '5k', '1.5k', '10 k'
  const kMatch = normalized.match(/\b(\d+(?:\.\d+)?)\s*k\b/i);
  if (kMatch && kMatch[1]) {
    extractedAmount = parseFloat(kMatch[1]) * 1000;
  }

  // 1b. Look for standard digits with currency words or plain numbers
  if (!extractedAmount) {
    // Match numbers with or without symbols: ₹, rs, inr, $, €, £, rooba, roobai, rupees, etc.
    const digitMatch = normalized.match(
      /(?:₹|rs\.?|inr|\$|€|£)?\s*(\d+(?:\.\d{1,2})?)\s*(?:₹|rs\.?|inr|\$|€|£|rooba|roobai|rupees?|bucks|dollars?)?/i
    );
    if (digitMatch && digitMatch[1]) {
      const parsed = parseFloat(digitMatch[1]);
      if (!isNaN(parsed) && parsed > 0) {
        extractedAmount = parsed;
      }
    }
  }

  // 1c. Spoken words fallback (e.g. "ainooru", "two thousand", "aayiram")
  if (!extractedAmount) {
    extractedAmount = parseWordsToNumber(normalized);
  }

  // 2. EXTRACT NEED VS WANT TAG (ANY POSITION)
  let matchedNeedWant: NeedWantType | undefined;
  if (
    /\b(want|wants|lifestyle|luxury|wish|aasa|aasai|treat|waste|extra|fun|jolly|casual|splurge|unnecessary)\b/i.test(
      normalized
    )
  ) {
    matchedNeedWant = 'Want';
  } else if (
    /\b(need|needs|essential|thevai|theva|mukkiyam|avasiyam|kandippa|necessary|vital|urgent|compulsory)\b/i.test(
      normalized
    )
  ) {
    matchedNeedWant = 'Need';
  }

  // 3. EXTRACT TRANSACTION TYPE (ANY POSITION)
  let detectedType: TransactionType = 'expense';
  let detectedTransferType: TransferType = 'transfer';

  if (
    /\b(transfer|transferred|shift|shifted|move|moved|maathinen|maathiten|anupinen|anupiten|sent to)\b/i.test(
      normalized
    )
  ) {
    detectedType = 'transfer';
    detectedTransferType = 'transfer';
  } else if (/\b(deposit|deposit to savings|savings la potten)\b/i.test(normalized)) {
    detectedType = 'transfer';
    detectedTransferType = 'deposit';
  } else if (/\b(withdraw|withdrawal|atm withdrawal|eduthen|eduthom)\b/i.test(normalized)) {
    detectedType = 'transfer';
    detectedTransferType = 'withdrawal';
  } else if (
    /\b(salary|income|credited|vanthuchu|vanthurukku|earned|varavu|sambalam|bonus|dividend|interest|cashback|refund|stipend|payout)\b/i.test(
      normalized
    )
  ) {
    detectedType = 'income';
  } else {
    detectedType = 'expense';
  }

  // 4. EXTRACT CATEGORY (ANY POSITION)
  let matchedCategory: ExpenseCategory | undefined;

  // High-priority domain keyword mappings
  const categoryKeywords: Record<string, string[]> = {
    'Food & Dining': [
      'food', 'dinner', 'lunch', 'breakfast', 'sapadu', 'saapadu', 'hotel', 'restaurant',
      'swiggy', 'zomato', 'biryani', 'dosa', 'idli', 'meals', 'snacks', 'biscuit', 'grocery',
      'groceries', 'maligai', 'vegetables', 'fruits', 'milk', 'paal', 'egg', 'muttai',
      'chicken', 'mutton', 'supermarket', 'eat', 'eating', 'provisions'
    ],
    'Tea & Coffee': [
      'tea', 'coffee', 'chai', 'kaapi', 'cafe', 'latte', 'starbucks', 'tea kadai', 'kadai tea',
      'beverage', 'cool drinks', 'juice'
    ],
    'Transport': [
      'petrol', 'diesel', 'fuel', 'gas', 'auto', 'bus', 'train', 'flight', 'uber', 'ola',
      'rapido', 'metro', 'toll', 'parking', 'transport', 'travel', 'bike', 'car', 'service',
      'fare', 'ticket'
    ],
    'Housing & Rent': [
      'rent', 'house rent', 'veetu vaadagai', 'vaadagai', 'room rent', 'maintenance', 'lease',
      'mortgage', 'flat', 'apartment', 'furniture', 'plumbing'
    ],
    'Bills & Utilities': [
      'bill', 'current bill', 'eb bill', 'electricity', 'current', 'water bill', 'wifi',
      'broadband', 'recharge', 'mobile recharge', 'phone bill', 'gas cylinder', 'cylinder',
      'dth', 'utility', 'utilities'
    ],
    'Shopping': [
      'shopping', 'dress', 'clothes', 'clothing', 'thuni', 'shirt', 'pant', 'shoes',
      'amazon', 'flipkart', 'myntra', 'meesho', 'mall', 'watch', 'gadget', 'bag', 'bought', 'purchase'
    ],
    'Entertainment': [
      'movie', 'cinema', 'theatre', 'film', 'padam', 'netflix', 'prime', 'hotstar',
      'spotify', 'game', 'gaming', 'party', 'club', 'popcorn', 'show', 'concert'
    ],
    'Health & Medical': [
      'medicine', 'medicines', 'marunthu', 'doctor', 'hospital', 'clinic', 'pharmacy',
      'medical', 'tablets', 'gym', 'fitness', 'dentist', 'lab', 'test', 'scan'
    ],
    'Education & Courses': [
      'school', 'college', 'fees', 'course', 'books', 'padippu', 'class', 'exam', 'tuition', 'coaching'
    ],
    'Travel & Trips': [
      'trip', 'tour', 'resort', 'vacation', 'hotel booking', 'stay', 'flight ticket', 'sightseeing'
    ],
  };

  // Match against keyword dictionary
  for (const [catTitle, kws] of Object.entries(categoryKeywords)) {
    for (const kw of kws) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(normalized)) {
        matchedCategory = categories.find((c) => c.name.toLowerCase() === catTitle.toLowerCase());
        if (!matchedCategory) {
          matchedCategory = categories.find((c) => c.name.toLowerCase().includes(catTitle.split(' ')[0].toLowerCase()));
        }
        break;
      }
    }
    if (matchedCategory) break;
  }

  // Fallback match directly on custom category names
  if (!matchedCategory) {
    for (const cat of categories) {
      if (normalized.includes(cat.name.toLowerCase())) {
        matchedCategory = cat;
        break;
      }
    }
  }

  // Final category fallback
  const resolvedCategory = matchedCategory || categories[0] || {
    id: 'cat-food',
    name: 'Food & Dining',
    defaultNeed: true,
  };

  // Resolve final Need/Want: If user specified verbally, use that. Otherwise use category default.
  const finalNeedWant: NeedWantType = matchedNeedWant || (resolvedCategory.defaultNeed ? 'Need' : 'Want');

  // 5. EXTRACT LOCATION (ANY POSITION)
  let matchedLocation: MoneyLocation | undefined;
  let matchedFromLocation: MoneyLocation | undefined;
  let matchedToLocation: MoneyLocation | undefined;

  // Keyword dictionary for locations
  const locationAliases: Record<string, string[]> = {
    cash: ['cash', 'kai cash', 'hand cash', 'physical cash', 'panam', 'pocket money'],
    bank: ['bank', 'sbi', 'hdfc', 'icici', 'axis', 'checking', 'account', 'bank account', 'card', 'debit card', 'credit card'],
    wallet: ['gpay', 'google pay', 'paytm', 'phonepe', 'upi', 'wallet', 'apple pay', 'digital wallet', 'online pay'],
    savings: ['savings', 'savings account', 'reserve', 'savings reserve', 'emergency fund', 'fd', 'rd'],
  };

  for (const [typeKey, aliases] of Object.entries(locationAliases)) {
    for (const alias of aliases) {
      const regex = new RegExp(`\\b${alias}\\b`, 'i');
      if (regex.test(normalized)) {
        matchedLocation = locations.find((l) => l.type === typeKey || l.name.toLowerCase().includes(alias));
        break;
      }
    }
    if (matchedLocation) break;
  }

  // For Transfers: Detect From vs To
  if (detectedType === 'transfer') {
    // Detect 'bank la irunthu' / 'from bank'
    if (/\b(from bank|bank la irunthu|bank la irundhu|checking la)\b/i.test(normalized)) {
      matchedFromLocation = locations.find((l) => l.type === 'bank') || locations[0];
    } else if (/\b(from cash|cash la irunthu|kai cash)\b/i.test(normalized)) {
      matchedFromLocation = locations.find((l) => l.type === 'cash') || locations[0];
    } else if (/\b(from wallet|gpay la irunthu|paytm)\b/i.test(normalized)) {
      matchedFromLocation = locations.find((l) => l.type === 'wallet') || locations[0];
    }

    // Detect 'savings ku' / 'to savings'
    if (/\b(to savings|savings ku|savings reserve)\b/i.test(normalized)) {
      matchedToLocation = locations.find((l) => l.isSavings || l.type === 'savings') || locations[1] || locations[0];
    } else if (/\b(to bank|bank ku|bank account)\b/i.test(normalized)) {
      matchedToLocation = locations.find((l) => l.type === 'bank') || locations[0];
    } else if (/\b(to cash|cash ku|wallet ku)\b/i.test(normalized)) {
      matchedToLocation = locations.find((l) => l.type === 'cash' || l.type === 'wallet') || locations[0];
    }
  }

  const resolvedLocationId = matchedLocation?.id || locations[0]?.id || '';

  // 6. EXTRACT INCOME SOURCE (ANY POSITION)
  let matchedSource: IncomeSource | undefined;
  for (const src of incomeSources) {
    if (normalized.includes(src.name.toLowerCase()) || src.name.toLowerCase().split(' ').some((w) => normalized.includes(w))) {
      matchedSource = src;
      break;
    }
  }
  if (!matchedSource) {
    if (/\b(salary|sambalam|payroll|paycheck)\b/i.test(normalized)) {
      matchedSource = incomeSources.find((s) => s.name.toLowerCase().includes('salary')) || incomeSources[0];
    } else if (/\b(freelance|consulting|project|client)\b/i.test(normalized)) {
      matchedSource = incomeSources.find((s) => s.name.toLowerCase().includes('freelance')) || incomeSources[0];
    } else if (/\b(business|sales|shop|vyabaram)\b/i.test(normalized)) {
      matchedSource = incomeSources.find((s) => s.name.toLowerCase().includes('business')) || incomeSources[0];
    } else if (/\b(rent|rental|vaadagai)\b/i.test(normalized)) {
      matchedSource = incomeSources.find((s) => s.name.toLowerCase().includes('rental')) || incomeSources[0];
    } else {
      matchedSource = incomeSources[0];
    }
  }

  return {
    amount: extractedAmount,
    type: detectedType,
    needWant: finalNeedWant,
    categoryName: resolvedCategory.name,
    sourceName: matchedSource?.name || incomeSources[0]?.name || 'Salary / Wages',
    locationId: resolvedLocationId,
    fromLocationId: matchedFromLocation?.id || locations.find((l) => l.type === 'bank')?.id || locations[0]?.id,
    toLocationId: matchedToLocation?.id || locations.find((l) => l.isSavings || l.type === 'savings')?.id || locations[1]?.id || locations[0]?.id,
    transferType: detectedTransferType,
    cleanNote: `Voice: "${rawText}"`,
    matchedEntities: {
      amountMatched: extractedAmount !== null,
      categoryMatched: matchedCategory?.name,
      needWantMatched: matchedNeedWant,
      locationMatched: matchedLocation?.name,
      typeMatched: detectedType,
    },
  };
};
