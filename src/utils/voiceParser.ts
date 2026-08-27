import { GoogleGenAI } from '@google/genai';
import {
  MoneyLocation,
  ExpenseCategory,
  IncomeSource,
  NeedWantType,
  TransactionType,
  TransferType,
} from '../types';

// ==============================================================================
// TAMIL & ENGLISH NUMBER WORDS MAPPING
// ==============================================================================
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
  lakhs: 100000,
  crore: 10000000,
  crores: 10000000,
  million: 1000000,

  // Tamil & Tanglish Spoken Numbers
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
  elu: 7,
  ettu: 8,
  onbadhu: 9,
  ombodhu: 9,
  ombadhu: 9,
  pathu: 10,
  paththu: 10,
  padhinonnu: 11,
  panirendu: 12,
  padhimoonu: 13,
  padhinaalu: 14,
  padhinanju: 15,
  padhinaaru: 16,
  padhinezhu: 17,
  padhinettu: 18,
  pathonbadhu: 19,
  irubadhu: 20,
  iruvathu: 20,
  irubathi: 20,
  muppadhu: 30,
  muppathu: 30,
  muppathi: 30,
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
  aanooru: 600,
  ezhunooru: 700,
  ennooru: 800,
  thollayiram: 900,
  aayiram: 1000,
  ayiram: 1000,
  onraayiram: 1500,
  rendayiram: 2000,
  moonnayiram: 3000,
  naalayiram: 4000,
  anjavathayiram: 5000,
  pathayiram: 10000,
  irubadhayiram: 20000,
  ambadhayiram: 50000,
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

// ==============================================================================
// AI VOICE PARSER SYSTEM PROMPT & FEW-SHOT EXAMPLES
// ==============================================================================
export const VOICE_PARSER_SYSTEM_PROMPT = `
You are the expert Financial Voice Parsing Agent for the "Kanakku" Personal Finance & Expense Tracker app.
Your task is to parse spoken voice transcripts—which frequently blend English, Tamil, and Tanglish (Tamil written in Latin script)—into a structured, accurate financial transaction JSON object.

### CRITICAL RULES & INSTRUCTIONS:

1. **TRANSACTION TYPE DISAMBIGUATION (Expense vs Income vs Transfer)**:
   - **EXPENSE**:
     - Words indicating spending/payment: "kuduthen", "kuduthuten", "koduthen", "selavu", "vaanginen", "vaangiten", "paathen", "sapten", "saptom", "kudichen", "potten", "bill kattinen", "recharge pannen", "ticket eduthen", "spent", "paid", "bought", "purchased", "ordered", "ate".
     - **CRITICAL EDGE CASE**: If someone says "maid ku salary kuduthen", "driver ku sambalam kuduthen", or "worker ku cash kuduthen" -> This is an **EXPENSE** (Category: "Bills & Utilities" or "Housing & Rent"), NOT an Income! The speaker is paying out someone else's salary.
     - "veetu vaadagai kuduthen" / "room rent paid" -> **EXPENSE** (Housing & Rent).
     - "friend ku kadan kuduthen" -> **EXPENSE** (or Transfer/Lending).
   - **INCOME**:
     - Words indicating earnings/receipts: "vanthuchu", "vanthurukku", "kedaichathu", "potanga", "anupunanga", "credited", "earned", "received", "got", "salary vanthuchu", "salary potanga", "bonus vanthuchu", "dividend", "interest", "cashback", "refund", "stipend", "pocket money vanthuchu".
     - "tenant vaadagai kuduthan" / "rent vanthuchu" -> **INCOME** (Source: "Rental Income").
     - "office la irunthu salary potanga" -> **INCOME** (Source: "Salary / Wages").
     - "friend kadan thirumba kuduthan" -> **INCOME** (Source: "Other Income").
   - **TRANSFER**:
     - Words indicating shifting money between the user's own accounts/wallets: "maathinen", "maathiten", "shift pannen", "move pannen", "transfer pannen", "anupinen", "anupiten", "deposit", "withdrew", "atm la eduthen", "sent to savings".
     - "bank la irunthu cash eduthen" -> **TRANSFER** (transferType: "withdrawal", from: "Bank", to: "Cash").
     - "cash bank la potten" -> **TRANSFER** (transferType: "deposit", from: "Cash", to: "Bank").
     - "gpay la irunthu savings ku 2000 maathinen" -> **TRANSFER** (transferType: "transfer", from: "Wallet", to: "Savings").

2. **NEED VS WANT DETERMINATION**:
   - **NEED** (Essential / Mandatory):
     - Triggers: "thevai", "theva", "mukkiyam", "avasiyam", "essential", "urgent", "kandippa", "bills", "rent", "groceries", "maligai", "medicines", "marunthu", "fuel", "petrol", "school fees".
     - General essentials: Basic food, utilities, rent, healthcare, commute fuel.
   - **WANT** (Discretionary / Lifestyle / Luxury):
     - Triggers: "want", "aasa", "aasai", "treat", "waste", "extra", "jolly", "fun", "casual", "splurge", "unnecessary", "luxury".
     - General wants: Cinema tickets, restaurant outings, cafes, shopping clothes, gaming, bar/pub, streaming subscriptions.

3. **AMOUNTS & NUMBERS (TANGLISH & ENGLISH)**:
   - Handle 'k' notation: "5k" = 5000, "1.5k" = 1500, "10 k" = 10000.
   - Handle Tamil words: "ainooru" = 500, "aayiram" = 1000, "rendayiram" = 2000, "pathayiram" = 10000, "oru latcham" = 100000.
   - Handle currency mentions: "rooba", "roobai", "rs", "rupees", "inr", "bucks".

4. **ACCURATE CATEGORY MATCHING**:
   - Match to one of the user's available categories. If none match exactly, pick the closest semantic match:
     - "Food & Dining": biryani, shawarma, parotta, hotel, mess, canteen, swiggy, zomato, breakfast, lunch, dinner, tea, coffee, snacks, groceries, vegetables, milk, chicken, fruits.
     - "Transport": petrol, diesel, auto fare, bus ticket, metro, rapido, uber, ola, toll, puncture, bike service.
     - "Bills & Utilities": eb bill, current bill, wifi, mobile recharge, gas cylinder, dth, water bill, maid salary.
     - "Housing & Rent": house rent, room rent, maintenance, flat advance.
     - "Shopping": dress, clothes, shoes, amazon, flipkart, myntra, electronic gadget, watch.
     - "Entertainment": movie, cinema, theatre, netflix, hotstar, spotify, game, party.
     - "Health & Medical": tablets, medicine, doctor fees, hospital, scan, lab test, pharmacy.
     - "Education & Courses": tuition, college fees, school fees, books, exam fee.

5. **MONEY LOCATION / WALLET MATCHING**:
   - "cash" / "kai cash" / "hand cash" -> Cash
   - "bank" / "sbi" / "hdfc" / "icici" / "card" / "debit card" -> Bank Account
   - "gpay" / "phonepe" / "paytm" / "upi" / "online" -> Wallet / UPI
   - "savings" / "reserve" / "emergency fund" -> Savings Account

### OUTPUT JSON SCHEMA:
Always return a strictly valid, raw JSON object (no markdown code fences, no introductory text):
{
  "amount": number | null,
  "type": "expense" | "income" | "transfer",
  "needWant": "Need" | "Want",
  "categoryName": string,
  "sourceName": string,
  "locationName": string,
  "fromLocationName"?: string,
  "toLocationName"?: string,
  "transferType": "deposit" | "withdrawal" | "transfer",
  "cleanDescription": string
}

### FEW-SHOT EXAMPLES:

Example 1:
Input: "Hotel la 450 roobai ku biryani sapten gpay la"
Output:
{"amount":450,"type":"expense","needWant":"Need","categoryName":"Food & Dining","sourceName":"Salary / Wages","locationName":"Wallet","transferType":"transfer","cleanDescription":"Biryani at hotel"}

Example 2:
Input: "Maid ku salary 3000 cash kuduthen"
Output:
{"amount":3000,"type":"expense","needWant":"Need","categoryName":"Bills & Utilities","sourceName":"Salary / Wages","locationName":"Cash","transferType":"transfer","cleanDescription":"Maid salary payment"}

Example 3:
Input: "Office la irunthu monthly salary 45000 bank account la credited aachu"
Output:
{"amount":45000,"type":"income","needWant":"Need","categoryName":"Food & Dining","sourceName":"Salary / Wages","locationName":"Bank Account","transferType":"transfer","cleanDescription":"Monthly salary credited from office"}

Example 4:
Input: "Bank la irunthu 2000 cash eduthen atm la"
Output:
{"amount":2000,"type":"transfer","needWant":"Need","categoryName":"Food & Dining","sourceName":"Salary / Wages","locationName":"Cash","fromLocationName":"Bank Account","toLocationName":"Cash","transferType":"withdrawal","cleanDescription":"ATM cash withdrawal from bank"}

Example 5:
Input: "Aasai kaaga amazon la 1500 roobai ku headphones vaanginen"
Output:
{"amount":1500,"type":"expense","needWant":"Want","categoryName":"Shopping","sourceName":"Salary / Wages","locationName":"Wallet","transferType":"transfer","cleanDescription":"Headphones purchase on Amazon"}

Example 6:
Input: "Bike ku 500 petrol potten urgent thevai"
Output:
{"amount":500,"type":"expense","needWant":"Need","categoryName":"Transport","sourceName":"Salary / Wages","locationName":"Cash","transferType":"transfer","cleanDescription":"Petrol fuel for bike"}

Example 7:
Input: "Savings account ku 5k transfer pannen gpay la irunthu"
Output:
{"amount":5000,"type":"transfer","needWant":"Need","categoryName":"Food & Dining","sourceName":"Salary / Wages","locationName":"Savings Account","fromLocationName":"Wallet","toLocationName":"Savings Account","transferType":"deposit","cleanDescription":"Transfer to savings reserve"}
`;

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
 * Universal flexible Natural Language Parser for Tamil / Tanglish / English (Heuristic engine)
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

  // 2. EXTRACT TRANSACTION TYPE (WITH EXPENSE VS INCOME VS TRANSFER DISAMBIGUATION)
  let detectedType: TransactionType = 'expense';
  let detectedTransferType: TransferType = 'transfer';

  // Check for salary paid to someone else (e.g., "maid ku salary", "driver ku sambalam") -> MUST BE EXPENSE
  const isPayingSalaryToOthers = /\b(maid|driver|servant|worker|cleaner|gardener|cook|aalu|velaikari|veetu vela)\s*(ku\s*)?(salary|sambalam|kaasu|panam)?\s*(kuduthen|potten|paid|kuduthuten)\b/i.test(normalized) ||
    /\b(salary|sambalam)\s*(kuduthen|kuduthuten|paid|koduthen)\b/i.test(normalized);

  // Check for rent paid to landlord -> MUST BE EXPENSE
  const isPayingRent = /\b(veetu\s*vaadagai|room\s*rent|house\s*rent|vaadagai)\s*(kuduthen|kuduthuten|paid|kattinen)\b/i.test(normalized);

  // Check for lending money -> EXPENSE
  const isLending = /\b(kadan\s*kuduthen|borrow\s*pannaan|loan\s*kuduthen)\b/i.test(normalized);

  if (isPayingSalaryToOthers || isPayingRent || isLending) {
    detectedType = 'expense';
  } else if (
    /\b(transfer|transferred|shift|shifted|move|moved|maathinen|maathiten|anupinen|anupiten|sent to)\b/i.test(
      normalized
    )
  ) {
    detectedType = 'transfer';
    detectedTransferType = 'transfer';
  } else if (/\b(deposit|deposit to savings|savings la potten|savings ku potten)\b/i.test(normalized)) {
    detectedType = 'transfer';
    detectedTransferType = 'deposit';
  } else if (/\b(withdraw|withdrawal|atm withdrawal|atm la eduthen|eduthen|eduthom)\b/i.test(normalized)) {
    detectedType = 'transfer';
    detectedTransferType = 'withdrawal';
  } else if (
    /\b(income|credited|vanthuchu|vanthurukku|kedaichathu|earned|varavu|bonus|dividend|interest|cashback|refund|stipend|payout|pocket money vanthuchu|salary potanga|salary vanthuchu)\b/i.test(
      normalized
    )
  ) {
    detectedType = 'income';
  } else {
    detectedType = 'expense';
  }

  // 3. EXTRACT NEED VS WANT TAG (ANY POSITION)
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

  // 4. EXTRACT CATEGORY (ANY POSITION)
  let matchedCategory: ExpenseCategory | undefined;

  // High-priority domain keyword mappings
  const categoryKeywords: Record<string, string[]> = {
    'Food & Dining': [
      'food', 'dinner', 'lunch', 'breakfast', 'sapadu', 'saapadu', 'hotel', 'restaurant',
      'swiggy', 'zomato', 'biryani', 'dosa', 'idli', 'meals', 'snacks', 'biscuit', 'grocery',
      'groceries', 'maligai', 'vegetables', 'fruits', 'milk', 'paal', 'egg', 'muttai',
      'chicken', 'mutton', 'supermarket', 'eat', 'eating', 'provisions', 'zepto', 'blinkit',
      'instamart', 'shawarma', 'parotta', 'mess', 'canteen'
    ],
    'Tea & Coffee': [
      'tea', 'coffee', 'chai', 'kaapi', 'cafe', 'latte', 'starbucks', 'tea kadai', 'kadai tea',
      'beverage', 'cool drinks', 'juice', 'soda'
    ],
    'Transport': [
      'petrol', 'diesel', 'fuel', 'gas', 'auto', 'bus', 'train', 'flight', 'uber', 'ola',
      'rapido', 'metro', 'toll', 'parking', 'transport', 'travel', 'bike', 'car', 'service',
      'fare', 'ticket', 'fastag', 'puncture', 'cab', 'flight ticket', 'train ticket'
    ],
    'Housing & Rent': [
      'rent', 'house rent', 'veetu vaadagai', 'vaadagai', 'room rent', 'maintenance', 'lease',
      'mortgage', 'flat', 'apartment', 'furniture', 'plumbing', 'electrician'
    ],
    'Bills & Utilities': [
      'bill', 'current bill', 'eb bill', 'electricity', 'current', 'water bill', 'wifi',
      'broadband', 'recharge', 'mobile recharge', 'phone bill', 'gas cylinder', 'cylinder',
      'dth', 'utility', 'utilities', 'maid', 'servant', 'cook', 'cleaner', 'postpaid'
    ],
    'Shopping': [
      'shopping', 'dress', 'clothes', 'clothing', 'thuni', 'shirt', 'pant', 'shoes',
      'amazon', 'flipkart', 'myntra', 'meesho', 'mall', 'watch', 'gadget', 'bag', 'bought', 'purchase',
      'headphone', 'earphone', 'case', 'cover'
    ],
    'Entertainment': [
      'movie', 'cinema', 'theatre', 'film', 'padam', 'netflix', 'prime', 'hotstar',
      'spotify', 'game', 'gaming', 'party', 'club', 'popcorn', 'show', 'concert', 'outing', 'pub'
    ],
    'Health & Medical': [
      'medicine', 'medicines', 'marunthu', 'doctor', 'hospital', 'clinic', 'pharmacy',
      'medical', 'tablets', 'gym', 'fitness', 'dentist', 'lab', 'test', 'scan', 'apollo', 'medplus'
    ],
    'Education & Courses': [
      'school', 'college', 'fees', 'course', 'books', 'padippu', 'class', 'exam', 'tuition', 'coaching', 'udemy'
    ],
    'Travel & Trips': [
      'trip', 'tour', 'resort', 'vacation', 'hotel booking', 'stay', 'sightseeing', 'trek'
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
    wallet: ['gpay', 'google pay', 'paytm', 'phonepe', 'upi', 'wallet', 'apple pay', 'digital wallet', 'online pay', 'online'],
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
    if (/\b(from bank|bank la irunthu|bank la irundhu|checking la)\b/i.test(normalized)) {
      matchedFromLocation = locations.find((l) => l.type === 'bank') || locations[0];
    } else if (/\b(from cash|cash la irunthu|kai cash)\b/i.test(normalized)) {
      matchedFromLocation = locations.find((l) => l.type === 'cash') || locations[0];
    } else if (/\b(from wallet|gpay la irunthu|paytm la irunthu)\b/i.test(normalized)) {
      matchedFromLocation = locations.find((l) => l.type === 'wallet') || locations[0];
    }

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

/**
 * AI-powered Gemini Voice Parsing Service with automatic fallback to heuristics
 */
export const parseVoiceWithGemini = async (
  rawText: string,
  categories: ExpenseCategory[],
  locations: MoneyLocation[],
  incomeSources: IncomeSource[]
): Promise<ParsedVoiceResult> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

  // If no Gemini API key is configured or offline, use heuristic parser directly
  if (!apiKey || !navigator.onLine) {
    return parseSmartVoiceTransaction(rawText, categories, locations, incomeSources);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const availableCategoriesStr = categories.map((c) => c.name).join(', ');
    const availableLocationsStr = locations.map((l) => `${l.name} (${l.type})`).join(', ');
    const availableSourcesStr = incomeSources.map((s) => s.name).join(', ');

    const promptContent = `
Available App Categories: [${availableCategoriesStr}]
Available Money Locations: [${availableLocationsStr}]
Available Income Sources: [${availableSourcesStr}]

Voice Transcript to Parse: "${rawText}"
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptContent,
      config: {
        systemInstruction: VOICE_PARSER_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const jsonText = response.text?.trim();
    if (!jsonText) {
      return parseSmartVoiceTransaction(rawText, categories, locations, incomeSources);
    }

    const aiResult = JSON.parse(jsonText);

    // Map AI result to existing category/location/source objects
    const matchedCategory = categories.find(
      (c) => c.name.toLowerCase() === (aiResult.categoryName || '').toLowerCase()
    ) || categories[0];

    const matchedLocation = locations.find(
      (l) => l.name.toLowerCase().includes((aiResult.locationName || '').toLowerCase()) ||
             (aiResult.locationName || '').toLowerCase().includes(l.type)
    ) || locations[0];

    const matchedFromLoc = locations.find(
      (l) => l.name.toLowerCase().includes((aiResult.fromLocationName || '').toLowerCase()) ||
             (aiResult.fromLocationName || '').toLowerCase().includes(l.type)
    ) || locations[0];

    const matchedToLoc = locations.find(
      (l) => l.name.toLowerCase().includes((aiResult.toLocationName || '').toLowerCase()) ||
             (aiResult.toLocationName || '').toLowerCase().includes(l.type)
    ) || locations[1] || locations[0];

    const matchedSource = incomeSources.find(
      (s) => s.name.toLowerCase().includes((aiResult.sourceName || '').toLowerCase())
    ) || incomeSources[0];

    return {
      amount: typeof aiResult.amount === 'number' && aiResult.amount > 0 ? aiResult.amount : null,
      type: (['expense', 'income', 'transfer'].includes(aiResult.type) ? aiResult.type : 'expense') as TransactionType,
      needWant: (['Need', 'Want'].includes(aiResult.needWant) ? aiResult.needWant : 'Need') as NeedWantType,
      categoryName: matchedCategory?.name || 'Food & Dining',
      sourceName: matchedSource?.name || 'Salary / Wages',
      locationId: matchedLocation?.id || locations[0]?.id || '',
      fromLocationId: matchedFromLoc?.id || locations[0]?.id,
      toLocationId: matchedToLoc?.id || locations[1]?.id || locations[0]?.id,
      transferType: (['deposit', 'withdrawal', 'transfer'].includes(aiResult.transferType) ? aiResult.transferType : 'transfer') as TransferType,
      cleanNote: aiResult.cleanDescription ? `Voice: "${aiResult.cleanDescription}"` : `Voice: "${rawText}"`,
      matchedEntities: {
        amountMatched: aiResult.amount !== null,
        categoryMatched: matchedCategory?.name,
        needWantMatched: aiResult.needWant,
        locationMatched: matchedLocation?.name,
        typeMatched: aiResult.type,
      },
    };
  } catch (err) {
    console.warn('⚠️ [VoiceParser] Gemini AI voice parsing failed, falling back to heuristics:', err);
    return parseSmartVoiceTransaction(rawText, categories, locations, incomeSources);
  }
};
