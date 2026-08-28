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

   **EXPENSE** — The user is paying or spending money OUT of their pocket:
   - Spending verbs: "kuduthen", "kuduthuten", "koduthen", "selavu panninen", "vaanginen", "vaangiten", "paathen", "sapten", "saptom", "kudichen", "potten", "kattinen", "bill kattinen", "recharge pannen", "ticket eduthen", "spent", "paid", "bought", "purchased", "ordered", "ate", "swiped", "deducted".
   - Tanglish spending slang: "paarakooten" (slang for ordered impulsively), "vaashtil" (wasteful spend), "thookinen" (picked up/bought), "vaanginten".
   - **CRITICAL EDGE CASES — These are EXPENSES, NOT Income:**
     a. "maid ku salary kuduthen" / "driver ku sambalam kuduthen" / "worker ku cash kuduthen" → EXPENSE (Category: "Bills & Utilities"). Speaker is PAYING someone else's salary — this is outflow!
     b. "veetu vaadagai kuduthen" / "room rent paid" / "vaadagai kattinen" → EXPENSE (Category: "Housing & Rent").
     c. "friend ku kadan kuduthen" / "friend ku 500 udane kuduthen" → EXPENSE (or Transfer/Lending). Speaker lent money = outflow.
     d. "EB bill potten" / "current bill kattinen" / "wifi bill recharge panninen" → EXPENSE (Category: "Bills & Utilities").
     e. "doctor fees kuduthen" / "medicine vaanginen" → EXPENSE (Category: "Health & Medical").

   **INCOME** — Money is coming INTO the user's accounts:
   - Receiving verbs: "vanthuchu", "vanthurukku", "vanthiruchu", "kedaichathu", "kedaikuthu", "potanga", "anupunanga", "credited", "earned", "received", "got", "credited aachu", "account la vanthuchu", "kittuthu".
   - Tanglish income slang: "panam vanthuchu", "kaashu kedaichathu", "account la pochu", "thirumba vanthuchu" (came back/refund).
   - **CRITICAL EDGE CASES — These are INCOME:**
     a. "salary vanthuchu" / "salary potanga" / "office salary credited aachu" → INCOME (Source: "Salary / Wages").
     b. "bonus vanthuchu" / "incentive vanthuchu" → INCOME (Source: "Salary / Wages").
     c. "tenant vaadagai kuduthan" / "flat rent vanthuchu" / "room rent kedaichathu" → INCOME (Source: "Rental Income"). Tenant paying the user = inflow!
     d. "friend kadan thirumba kuduthan" / "panam thirumba vanthuchu" → INCOME (Source: "Other Income"). The user is receiving their lent money back.
     e. "cashback vanthuchu" / "refund vanthuchu" / "amazon refund account la pochu" → INCOME (Source: "Other Income").
     f. "freelance project payment vanthuchu" / "client panam anupinaan" → INCOME (Source: "Freelance / Consulting").
     g. "dividend vanthuchu" / "interest credited" / "fd matured" → INCOME (Source: "Investments").
     h. "pocket money kedaichathu" / "appa panam kuduthaar" → INCOME (Source: "Other Income").

   **TRANSFER** — Moving money BETWEEN the user's OWN accounts/wallets (no net change in total wealth):
   - Transfer verbs: "maathinen", "maathiten", "shift pannen", "move pannen", "transfer pannen", "anupinen", "anupiten", "deposit pannen", "withdrew", "eduthen" (context: from own ATM).
   - **CRITICAL EDGE CASES — These are TRANSFERS:**
     a. "bank la irunthu cash eduthen atm la" → TRANSFER (transferType: "withdrawal", from: "Bank Account", to: "Cash").
     b. "cash bank la potten" / "cash deposit pannen" → TRANSFER (transferType: "deposit", from: "Cash", to: "Bank Account").
     c. "gpay la irunthu savings ku 2000 maathinen" → TRANSFER (transferType: "transfer", from: "Wallet", to: "Savings Account").
     d. "phonepe la irunthu bank ku money move pannen" → TRANSFER (from: "Wallet", to: "Bank Account").
     e. "atm la 3000 eduthen" → TRANSFER (withdrawal, from: "Bank Account", to: "Cash"). ATM withdrawal is always a transfer.

2. **NEED VS WANT DETERMINATION**:
   - **NEED** (Essential / Mandatory / Cannot skip):
     - Explicit triggers: "thevai", "theva", "mukkiyam", "avasiyam", "essential", "urgent", "kandippa", "necessary", "compulsory", "vitavillama".
     - Implicit needs: groceries, maligai saman, vegetables, rice, dal, milk (paal), medicine (marunthu), tablets, doctor visit, petrol for commute, auto/bus fare, school/college fees, house rent, EB bill, water bill, gas cylinder, cooking oil.
   - **WANT** (Discretionary / Lifestyle / Luxury / Optional):
     - Explicit triggers: "want", "aasa", "aasai", "paathen enjoy kaaga", "treat", "waste", "extra", "jolly", "fun", "casual", "splurge", "unnecessary", "luxury", "timepass", "aasaiya".
     - Implicit wants: Cinema/OTT/Netflix, party, restaurant dining out, branded clothes shopping, gaming, bar/pub/tasmac, sweets/chocolate, cigarettes (sigaret), vacation/trip/resort, gym membership.

3. **AMOUNTS & NUMBERS (TANGLISH, SPOKEN TAMIL & ENGLISH)**:
   - Numeric shortcuts: "5k" = 5000, "1.5k" = 1500, "10k" = 10000, "2.5 lakh" = 250000.
   - Spoken Tamil number words: "onnu"=1, "rendu"=2, "moonu"=3, "naalu"=4, "anju"=5, "aaru"=6, "ezhu"=7, "ettu"=8, "onbadhu"=9, "pathu"=10.
   - Spoken Tamil larger numbers: "nooru"=100, "ainooru"=500, "aayiram"=1000, "rendayiram"=2000, "anju aayiram"=5000, "pathayiram"=10000, "latcham"=100000, "kodi"=10000000.
   - Currency mentions to ignore/strip: "rooba", "roobai", "roobaa", "rupees", "rs", "rs.", "inr", "bucks", "paisa", "₹".
   - Always return "amount" as a plain positive number. If undetectable, return null.

4. **ACCURATE CATEGORY MATCHING (Match to user's available categories)**:
   - "Food & Dining": biryani, shawarma, parotta, kothu parotta, dosa, idli, pongal, hotel, mess, canteen, swiggy, zomato, breakfast (kalai saapadu), lunch (mathi saapadu), dinner (iravu saapadu), snacks (tiffin), biscuit, groceries, maligai, vegetables (kaigari), fruits (pazham), milk (paal), egg (muttai), chicken (kozhi), mutton, supermarket, provisions, zepto, blinkit, instamart.
   - "Tea & Coffee": tea (chai/theneer), coffee (kaapi), cafe, latte, starbucks, tea kadai, cool drinks (cooldrinks/coke/pepsi), juice (pazha rasam), soda.
   - "Transport": petrol, diesel, fuel, gas, auto (autoriksha), bus, train, flight, uber, ola, rapido, metro, toll, parking, bike service, car service, fare, ticket, fastag, puncture, cab.
   - "Housing & Rent": house rent (veetu vaadagai), room rent, maintenance, lease, mortgage, flat, apartment, furniture, plumbing, electrician, painting.
   - "Bills & Utilities": EB bill, current bill, electricity, water bill, wifi, broadband, internet, mobile recharge, phone bill, gas cylinder, DTH, maid salary, servant, cook salary, cleaner, postpaid.
   - "Shopping": dress, clothes, thuni, shirt, pant, shoes, sandal, amazon, flipkart, myntra, meesho, mall, watch, gadget, bag, headphones, earphones, sunglasses, purse, kurti, saree.
   - "Entertainment": movie, cinema, theatre, padam, netflix, prime video, hotstar, disney, spotify, youtube premium, game, gaming, party, club, popcorn, show, concert, outing, pub, bar, tasmac.
   - "Health & Medical": medicine, marunthu, tablets, doctor, hospital, clinic, pharmacy, medical shop, scan, lab test, blood test, apollo, medplus, gym, fitness, dental, dentist.
   - "Education & Courses": school fees, college fees, course fees, books, padippu, class, exam fee, tuition, coaching, udemy, coursera.
   - "Travel & Trips": trip, tour, resort, vacation, hotel booking, stay, sightseeing, trek, outing (multi-day).

5. **MONEY LOCATION / WALLET MATCHING**:
   - Cash: "cash", "kai cash", "hand cash", "physical cash", "panam", "kai la irukkura panam", "pocket la iruntha panam".
   - Bank Account: "bank", "sbi", "hdfc", "icici", "axis", "kotak", "account", "bank account", "savings account", "current account", "card", "debit card", "credit card", "neft", "rtgs", "imps".
   - Wallet / UPI: "gpay", "google pay", "paytm", "phonepe", "upi", "wallet", "apple pay", "digital wallet", "online pay", "online transfer", "upi transfer", "bhim".
   - Savings Account: "savings", "savings account", "reserve", "savings reserve", "emergency fund", "fd", "fixed deposit", "rd", "recurring deposit".

6. **COMMON MISCLASSIFICATION GUARD RULES**:
   - If the input mentions "salary" + a person's role (maid/driver/cook/etc.) + a payment verb → ALWAYS EXPENSE.
   - If the input mentions "salary" + "vanthuchu/credited/potanga" → ALWAYS INCOME.
   - If the input mentions "kadan kuduthen" (gave a loan) → EXPENSE.
   - If the input mentions "kadan thirumba vanthuchu/kedaichathu" (got loan repaid) → INCOME.
   - If the input mentions "ATM la eduthen" without specifying external party → ALWAYS TRANSFER (withdrawal).
   - If the input mentions "savings ku / savings account ku" + a transfer verb → ALWAYS TRANSFER (deposit to savings).
   - If the input is ambiguous between expense and income, default to EXPENSE.

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

### FEW-SHOT EXAMPLES (covering common Tanglish/Tamil slang and edge cases):

Example 1 — Basic Expense (Food, UPI):
Input: "Hotel la 450 roobai ku biryani sapten gpay la"
Output:
{"amount":450,"type":"expense","needWant":"Need","categoryName":"Food & Dining","sourceName":"Salary / Wages","locationName":"Wallet","transferType":"transfer","cleanDescription":"Biryani at hotel via GPay"}

Example 2 — Paying someone else's salary → EXPENSE (NOT Income):
Input: "Maid ku salary 3000 cash kuduthen"
Output:
{"amount":3000,"type":"expense","needWant":"Need","categoryName":"Bills & Utilities","sourceName":"Salary / Wages","locationName":"Cash","transferType":"transfer","cleanDescription":"Maid salary payment"}

Example 3 — Own salary received → INCOME:
Input: "Office la irunthu monthly salary 45000 bank account la credited aachu"
Output:
{"amount":45000,"type":"income","needWant":"Need","categoryName":"Food & Dining","sourceName":"Salary / Wages","locationName":"Bank Account","transferType":"transfer","cleanDescription":"Monthly salary credited from office"}

Example 4 — ATM Withdrawal → TRANSFER (not expense):
Input: "Bank la irunthu 2000 cash eduthen atm la"
Output:
{"amount":2000,"type":"transfer","needWant":"Need","categoryName":"Food & Dining","sourceName":"Salary / Wages","locationName":"Cash","fromLocationName":"Bank Account","toLocationName":"Cash","transferType":"withdrawal","cleanDescription":"ATM cash withdrawal from bank"}

Example 5 — Discretionary shopping (Want):
Input: "Aasai kaaga amazon la 1500 roobai ku headphones vaanginen"
Output:
{"amount":1500,"type":"expense","needWant":"Want","categoryName":"Shopping","sourceName":"Salary / Wages","locationName":"Wallet","transferType":"transfer","cleanDescription":"Headphones purchase on Amazon"}

Example 6 — Essential petrol → EXPENSE (Need):
Input: "Bike ku 500 petrol potten urgent thevai"
Output:
{"amount":500,"type":"expense","needWant":"Need","categoryName":"Transport","sourceName":"Salary / Wages","locationName":"Cash","transferType":"transfer","cleanDescription":"Petrol fuel for bike"}

Example 7 — Savings transfer → TRANSFER (deposit):
Input: "Savings account ku 5k transfer pannen gpay la irunthu"
Output:
{"amount":5000,"type":"transfer","needWant":"Need","categoryName":"Food & Dining","sourceName":"Salary / Wages","locationName":"Savings Account","fromLocationName":"Wallet","toLocationName":"Savings Account","transferType":"deposit","cleanDescription":"Transfer from GPay to savings account"}

Example 8 — Loan repayment received → INCOME (NOT Expense):
Input: "Arun kadan thirumba 2000 phonepela anupinaan"
Output:
{"amount":2000,"type":"income","needWant":"Need","categoryName":"Food & Dining","sourceName":"Other Income","locationName":"Wallet","transferType":"transfer","cleanDescription":"Loan repayment received from Arun via PhonePe"}

Example 9 — Tenant paying rent → INCOME (NOT Expense):
Input: "Tenant vaadagai 8000 gpay la kuduthan"
Output:
{"amount":8000,"type":"income","needWant":"Need","categoryName":"Food & Dining","sourceName":"Rental Income","locationName":"Wallet","transferType":"transfer","cleanDescription":"Rental income received from tenant via GPay"}

Example 10 — Cashback refund → INCOME:
Input: "Amazon refund 350 roobai account la vanthuchu"
Output:
{"amount":350,"type":"income","needWant":"Need","categoryName":"Food & Dining","sourceName":"Other Income","locationName":"Bank Account","transferType":"transfer","cleanDescription":"Amazon refund credited to account"}

Example 11 — Giving a loan → EXPENSE:
Input: "Friend ku 1000 cash kadan kuduthen"
Output:
{"amount":1000,"type":"expense","needWant":"Need","categoryName":"Shopping","sourceName":"Salary / Wages","locationName":"Cash","transferType":"transfer","cleanDescription":"Cash lent to friend"}

Example 12 — Tanglish slang for entertainment (Want):
Input: "Jollyaaga theatre la padam paathen 220 roobai pochu"
Output:
{"amount":220,"type":"expense","needWant":"Want","categoryName":"Entertainment","sourceName":"Salary / Wages","locationName":"Cash","transferType":"transfer","cleanDescription":"Movie ticket at theatre"}

Example 13 — Spoken Tamil number (ainooru = 500):
Input: "Maligai saman vaanginen ainooru roobai cash la"
Output:
{"amount":500,"type":"expense","needWant":"Need","categoryName":"Food & Dining","sourceName":"Salary / Wages","locationName":"Cash","transferType":"transfer","cleanDescription":"Groceries purchased for 500"}

Example 14 — Freelance income:
Input: "Client project payment 15000 account la vanthuchu"
Output:
{"amount":15000,"type":"income","needWant":"Need","categoryName":"Food & Dining","sourceName":"Freelance / Consulting","locationName":"Bank Account","transferType":"transfer","cleanDescription":"Freelance project payment received from client"}
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
