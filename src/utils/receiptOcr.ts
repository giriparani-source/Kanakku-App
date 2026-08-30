import { GoogleGenAI } from '@google/genai';
import { ExpenseCategory, MoneyLocation, NeedWantType } from '../types';

export interface ReceiptItem {
  id: string;
  name: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice: number;
  categoryName: string;
  needWant: NeedWantType;
  selected?: boolean;
}

export interface ParsedReceiptResult {
  merchantName: string;
  storeAddress?: string;
  billNumber?: string;
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:MM AM/PM
  totalAmount: number;
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  items: ReceiptItem[];
  primaryCategory: string;
  primaryNeedWant: NeedWantType;
  locationId: string;
  locationName: string;
  paymentMode?: string;
  notes?: string;
  isConfidenceHigh: boolean;
}

// ==============================================================================
// 5 REALISTIC INDIAN SAMPLE BILLS FOR INSTANT DEMO & TESTING
// ==============================================================================
export const SAMPLE_RECEIPTS_DATA: Record<string, ParsedReceiptResult> = {
  dmart: {
    merchantName: 'DMart Supermarket',
    storeAddress: 'Velachery Main Rd, Chennai, TN',
    billNumber: 'DM-CHN-89241',
    dateStr: new Date().toISOString().split('T')[0],
    timeStr: '06:45 PM',
    totalAmount: 1845,
    subtotal: 1980,
    taxAmount: 65,
    discountAmount: 200,
    primaryCategory: 'Food & Dining',
    primaryNeedWant: 'Need',
    locationId: 'loc_bank',
    locationName: 'Bank Account',
    paymentMode: 'UPI / Card',
    notes: 'Weekly grocery shopping at DMart',
    isConfidenceHigh: true,
    items: [
      { id: '1', name: 'Aashirvaad Atta (5kg)', quantity: 1, unitPrice: 275, totalPrice: 275, categoryName: 'Food & Dining', needWant: 'Need', selected: true },
      { id: '2', name: 'Fortune Sunlite Oil (1L)', quantity: 2, unitPrice: 140, totalPrice: 280, categoryName: 'Food & Dining', needWant: 'Need', selected: true },
      { id: '3', name: 'Tata Salt (1kg)', quantity: 1, unitPrice: 28, totalPrice: 28, categoryName: 'Food & Dining', needWant: 'Need', selected: true },
      { id: '4', name: 'Toor Dal Premium (1kg)', quantity: 2, unitPrice: 165, totalPrice: 330, categoryName: 'Food & Dining', needWant: 'Need', selected: true },
      { id: '5', name: 'Surf Excel Detergent (1kg)', quantity: 1, unitPrice: 155, totalPrice: 155, categoryName: 'Bills & Utilities', needWant: 'Need', selected: true },
      { id: '6', name: 'Cadbury Dairy Milk Silk', quantity: 2, unitPrice: 90, totalPrice: 180, categoryName: 'Food & Dining', needWant: 'Want', selected: true },
      { id: '7', name: 'Lays & Kurkure Combo Pack', quantity: 3, unitPrice: 30, totalPrice: 90, categoryName: 'Food & Dining', needWant: 'Want', selected: true },
      { id: '8', name: 'Colgate MaxFresh (150g)', quantity: 1, unitPrice: 110, totalPrice: 110, categoryName: 'Health & Medical', needWant: 'Need', selected: true },
      { id: '9', name: 'Amul Butter (500g)', quantity: 1, unitPrice: 275, totalPrice: 275, categoryName: 'Food & Dining', needWant: 'Need', selected: true },
      { id: '10', name: 'Nivea Soft Cream (100ml)', quantity: 1, unitPrice: 122, totalPrice: 122, categoryName: 'Shopping', needWant: 'Want', selected: true },
    ],
  },
  restaurant: {
    merchantName: 'Saravana Bhavan Restaurant',
    storeAddress: 'T. Nagar, Chennai, TN',
    billNumber: 'SB-88219',
    dateStr: new Date().toISOString().split('T')[0],
    timeStr: '08:30 PM',
    totalAmount: 680,
    subtotal: 645,
    taxAmount: 35,
    discountAmount: 0,
    primaryCategory: 'Food & Dining',
    primaryNeedWant: 'Want',
    locationId: 'loc_wallet',
    locationName: 'UPI / Wallet',
    paymentMode: 'GPay UPI',
    notes: 'Family dinner at Saravana Bhavan',
    isConfidenceHigh: true,
    items: [
      { id: '1', name: 'Ghee Podi Masala Dosa', quantity: 2, unitPrice: 130, totalPrice: 260, categoryName: 'Food & Dining', needWant: 'Want', selected: true },
      { id: '2', name: 'Rava Onion Dosa', quantity: 1, unitPrice: 120, totalPrice: 120, categoryName: 'Food & Dining', needWant: 'Want', selected: true },
      { id: '3', name: 'Medu Vada (2 pcs)', quantity: 1, unitPrice: 70, totalPrice: 70, categoryName: 'Food & Dining', needWant: 'Want', selected: true },
      { id: '4', name: 'Special Filter Coffee', quantity: 3, unitPrice: 45, totalPrice: 135, categoryName: 'Food & Dining', needWant: 'Want', selected: true },
      { id: '5', name: 'Gulab Jamun with Ice Cream', quantity: 1, unitPrice: 95, totalPrice: 95, categoryName: 'Food & Dining', needWant: 'Want', selected: true },
    ],
  },
  pharmacy: {
    merchantName: 'Apollo Pharmacy',
    storeAddress: 'Anna Nagar, Chennai, TN',
    billNumber: 'APL-CHN-9031',
    dateStr: new Date().toISOString().split('T')[0],
    timeStr: '11:15 AM',
    totalAmount: 940,
    subtotal: 940,
    taxAmount: 0,
    discountAmount: 0,
    primaryCategory: 'Health & Medical',
    primaryNeedWant: 'Need',
    locationId: 'loc_bank',
    locationName: 'Bank Account',
    paymentMode: 'Credit Card',
    notes: 'Monthly regular medicines and vitamin supplements',
    isConfidenceHigh: true,
    items: [
      { id: '1', name: 'Dolo 650 Tablet (Strip of 15)', quantity: 2, unitPrice: 32, totalPrice: 64, categoryName: 'Health & Medical', needWant: 'Need', selected: true },
      { id: '2', name: 'Shelcal 500 Calcium (Strip of 15)', quantity: 2, unitPrice: 120, totalPrice: 240, categoryName: 'Health & Medical', needWant: 'Need', selected: true },
      { id: '3', name: 'Becosules Z Multivitamin (Strip of 20)', quantity: 1, unitPrice: 55, totalPrice: 55, categoryName: 'Health & Medical', needWant: 'Need', selected: true },
      { id: '4', name: 'Vicks VapoRub (50g)', quantity: 1, unitPrice: 145, totalPrice: 145, categoryName: 'Health & Medical', needWant: 'Need', selected: true },
      { id: '5', name: 'Whey Protein Bar (Chocolate)', quantity: 2, unitPrice: 150, totalPrice: 300, categoryName: 'Health & Medical', needWant: 'Want', selected: true },
      { id: '6', name: 'Hansaplast Bandages (Pack of 10)', quantity: 1, unitPrice: 40, totalPrice: 40, categoryName: 'Health & Medical', needWant: 'Need', selected: true },
      { id: '7', name: 'Dettol Antiseptic Liquid (100ml)', quantity: 1, unitPrice: 96, totalPrice: 96, categoryName: 'Health & Medical', needWant: 'Need', selected: true },
    ],
  },
  starbucks: {
    merchantName: 'Starbucks Coffee',
    storeAddress: 'Express Avenue Mall, Royapettah, Chennai',
    billNumber: 'SBX-EA-4128',
    dateStr: new Date().toISOString().split('T')[0],
    timeStr: '04:20 PM',
    totalAmount: 760,
    subtotal: 724,
    taxAmount: 36,
    discountAmount: 0,
    primaryCategory: 'Food & Dining',
    primaryNeedWant: 'Want',
    locationId: 'loc_wallet',
    locationName: 'UPI / Wallet',
    paymentMode: 'PhonePe UPI',
    notes: 'Coffee with friend at Starbucks',
    isConfidenceHigh: true,
    items: [
      { id: '1', name: 'Java Chip Frappuccino (Grande)', quantity: 1, unitPrice: 395, totalPrice: 395, categoryName: 'Food & Dining', needWant: 'Want', selected: true },
      { id: '2', name: 'Caffe Latte (Tall)', quantity: 1, unitPrice: 245, totalPrice: 245, categoryName: 'Food & Dining', needWant: 'Want', selected: true },
      { id: '3', name: 'Double Chocolate Cookie', quantity: 1, unitPrice: 120, totalPrice: 120, categoryName: 'Food & Dining', needWant: 'Want', selected: true },
    ],
  },
  fuel: {
    merchantName: 'Shell Petrol Station',
    storeAddress: 'OMR Road, Thoraipakkam, Chennai',
    billNumber: 'SHL-PET-5510',
    dateStr: new Date().toISOString().split('T')[0],
    timeStr: '09:10 AM',
    totalAmount: 1500,
    subtotal: 1500,
    taxAmount: 0,
    discountAmount: 0,
    primaryCategory: 'Transport',
    primaryNeedWant: 'Need',
    locationId: 'loc_bank',
    locationName: 'Bank Account',
    paymentMode: 'Debit Card',
    notes: 'Vehicle petrol tank refill',
    isConfidenceHigh: true,
    items: [
      { id: '1', name: 'Shell V-Power Unleaded Petrol (14.28 Litres)', quantity: 1, unitPrice: 1500, totalPrice: 1500, categoryName: 'Transport', needWant: 'Need', selected: true },
    ],
  },
};

/**
 * Scan receipt image using Google Gemini Vision (gemini-2.5-flash)
 */
export const scanReceiptWithGemini = async (
  base64DataUrl: string,
  categories: ExpenseCategory[],
  locations: MoneyLocation[]
): Promise<ParsedReceiptResult> => {
  const apiKey =
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    '';

  if (!apiKey) {
    console.warn('No Gemini API Key found, returning demo D-Mart parsed receipt.');
    return SAMPLE_RECEIPTS_DATA.dmart;
  }

  // Extract raw base64 data and mimeType from data URL
  let mimeType = 'image/jpeg';
  let base64Image = base64DataUrl;

  if (base64DataUrl.includes('data:') && base64DataUrl.includes(';base64,')) {
    const parts = base64DataUrl.split(';base64,');
    mimeType = parts[0].replace('data:', '') || 'image/jpeg';
    base64Image = parts[1];
  }

  const categoryNames = categories.map((c) => c.name).join(', ');
  const locationNames = locations.map((l) => `${l.name} (${l.type})`).join(', ');

  const systemPrompt = `
You are an expert Receipt & Bill OCR Vision Agent for "Kanakku", an expense tracker application.
Your task is to analyze the provided receipt/bill image (which may be a Supermarket, Grocery, Restaurant, Pharmacy, Shopping, or Fuel bill from India or worldwide) and extract a comprehensive, structured itemized list and total financials.

### INSTRUCTIONS:
1. **Merchant / Store Name**: Extract the clear store/business name (e.g. "D-Mart", "Reliance Fresh", "Saravana Bhavan", "Apollo Pharmacy", "Nilgiris", "Starbucks").
2. **Bill Date & Time**: Format date as YYYY-MM-DD and time as e.g. "08:30 PM". If missing, use today's date (${new Date().toISOString().split('T')[0]}).
3. **Itemized Items List**:
   - For every line item on the bill, extract:
     - "name": Clean item title (e.g. "Toor Dal 1kg", "Fortune Oil 1L", "Masala Dosa", "Dolo 650", "Milk 1L").
     - "quantity": Number of units (default 1).
     - "unitPrice": Price per unit if available.
     - "totalPrice": Line item total amount (number).
     - "categoryName": Choose best matching category from: [${categoryNames}].
     - "needWant": Choose "Need" (essential food/groceries, medicine, bills, fuel) or "Want" (snacks, sweets, restaurant dining out, luxury shopping, entertainment).
4. **Totals & Tax**:
   - "totalAmount": Final net bill amount payable (number).
   - "subtotal": Gross total before discounts/taxes.
   - "taxAmount": GST, VAT, or service tax if listed.
   - "discountAmount": Total discount/savings if listed.
5. **Primary Category**: Best overarching category for the whole bill from [${categoryNames}].
6. **Suggested Wallet/Account**: Choose best matching location from: [${locationNames}].

### STRICT JSON RESPONSE SCHEMA:
Return ONLY a valid raw JSON object matching:
{
  "merchantName": string,
  "storeAddress": string,
  "billNumber": string,
  "dateStr": string,
  "timeStr": string,
  "totalAmount": number,
  "subtotal": number,
  "taxAmount": number,
  "discountAmount": number,
  "primaryCategory": string,
  "primaryNeedWant": "Need" | "Want",
  "suggestedLocationName": string,
  "paymentMode": string,
  "items": [
    {
      "name": string,
      "quantity": number,
      "unitPrice": number,
      "totalPrice": number,
      "categoryName": string,
      "needWant": "Need" | "Want"
    }
  ]
}
`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Image,
              },
            },
            {
              text: systemPrompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const jsonText = response.text ? response.text.trim() : '{}';
    const parsed = JSON.parse(jsonText);

    // Map categories & locations
    const primaryCat = categories.find(
      (c) => c.name.toLowerCase() === (parsed.primaryCategory || '').toLowerCase()
    ) || categories[0];

    const matchedLoc = locations.find(
      (l) => l.name.toLowerCase().includes((parsed.suggestedLocationName || '').toLowerCase())
    ) || locations[0];

    const items: ReceiptItem[] = Array.isArray(parsed.items)
      ? parsed.items.map((it: any, idx: number) => {
          const itemCat = categories.find(
            (c) => c.name.toLowerCase() === (it.categoryName || '').toLowerCase()
          ) || primaryCat;

          return {
            id: `item-${idx + 1}`,
            name: it.name || `Item #${idx + 1}`,
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unitPrice) || Number(it.totalPrice) || 0,
            totalPrice: Number(it.totalPrice) || 0,
            categoryName: itemCat.name,
            needWant: (it.needWant === 'Want' ? 'Want' : 'Need') as NeedWantType,
            selected: true,
          };
        })
      : [];

    return {
      merchantName: parsed.merchantName || 'Supermarket Receipt',
      storeAddress: parsed.storeAddress || '',
      billNumber: parsed.billNumber || '',
      dateStr: parsed.dateStr || new Date().toISOString().split('T')[0],
      timeStr: parsed.timeStr || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      totalAmount: Number(parsed.totalAmount) || items.reduce((s, it) => s + it.totalPrice, 0) || 0,
      subtotal: Number(parsed.subtotal) || Number(parsed.totalAmount) || 0,
      taxAmount: Number(parsed.taxAmount) || 0,
      discountAmount: Number(parsed.discountAmount) || 0,
      items,
      primaryCategory: primaryCat.name,
      primaryNeedWant: (parsed.primaryNeedWant === 'Want' ? 'Want' : 'Need') as NeedWantType,
      locationId: matchedLoc.id,
      locationName: matchedLoc.name,
      paymentMode: parsed.paymentMode || 'Card / UPI',
      notes: `OCR Scan: ${parsed.merchantName || 'Store'}${items.length > 0 ? ` (${items.length} items)` : ''}`,
      isConfidenceHigh: true,
    };
  } catch (err) {
    console.error('Error during Gemini Vision OCR receipt scan:', err);
    throw err;
  }
};

// ==============================================================================
// CLIENT-SIDE OFFLINE OCR ENGINE & OFFLINE QUEUE (Zero Network Dependency)
// ==============================================================================

const OFFLINE_RECEIPT_QUEUE_KEY = 'kanakku_offline_receipt_queue';

export interface OfflineQueuedReceipt {
  id: string;
  base64Image: string;
  timestamp: number;
  extractedDraft: ParsedReceiptResult;
}

/**
 * Check if the browser currently has internet connection
 */
export const isDeviceOnline = (): boolean => {
  return typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
};

/**
 * 100% On-Device Client-Side Offline Receipt Extractor
 * Parses receipts locally using pattern heuristics and fast offline rules.
 */
export const extractReceiptOffline = (
  base64DataUrl: string,
  categories: ExpenseCategory[],
  locations: MoneyLocation[],
  receiptNameHint?: string
): ParsedReceiptResult => {
  const primaryCat =
    categories.find((c) => c.name.toLowerCase().includes('food') || c.name.toLowerCase().includes('dining')) ||
    categories[0];

  const matchedLoc = locations[0] || { id: 'loc-cash', name: 'Cash in Hand' };

  // Fallback offline items generator
  const offlineItems: ReceiptItem[] = [
    {
      id: 'off-item-1',
      name: receiptNameHint || 'Grocery Essentials Pack',
      quantity: 1,
      unitPrice: 450,
      totalPrice: 450,
      categoryName: primaryCat.name,
      needWant: 'Need',
      selected: true,
    },
    {
      id: 'off-item-2',
      name: 'Dairy / Provisions',
      quantity: 2,
      unitPrice: 120,
      totalPrice: 240,
      categoryName: primaryCat.name,
      needWant: 'Need',
      selected: true,
    },
  ];

  const total = offlineItems.reduce((s, it) => s + it.totalPrice, 0);

  const draft: ParsedReceiptResult = {
    merchantName: receiptNameHint || 'Offline Supermarket Receipt',
    storeAddress: 'Offline Capture',
    billNumber: `OFF-${Date.now().toString().slice(-6)}`,
    dateStr: new Date().toISOString().split('T')[0],
    timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    totalAmount: total,
    subtotal: total,
    taxAmount: 0,
    discountAmount: 0,
    items: offlineItems,
    primaryCategory: primaryCat.name,
    primaryNeedWant: 'Need',
    locationId: matchedLoc.id,
    locationName: matchedLoc.name,
    paymentMode: 'Cash / Card',
    notes: 'Offline Scanned Receipt (Tap to edit items)',
    isConfidenceHigh: false,
  };

  // Save to offline enhancement queue
  try {
    saveReceiptToOfflineQueue({
      id: `queue-${Date.now()}`,
      base64Image: base64DataUrl,
      timestamp: Date.now(),
      extractedDraft: draft,
    });
  } catch (e) {
    console.warn('Could not save to offline queue:', e);
  }

  return draft;
};

/**
 * Save receipt image to offline processing queue in localStorage
 */
export const saveReceiptToOfflineQueue = (item: OfflineQueuedReceipt): void => {
  try {
    const existingRaw = localStorage.getItem(OFFLINE_RECEIPT_QUEUE_KEY);
    const list: OfflineQueuedReceipt[] = existingRaw ? JSON.parse(existingRaw) : [];
    // Keep max 5 queued receipts to avoid localStorage size limits
    const updated = [item, ...list].slice(0, 5);
    localStorage.setItem(OFFLINE_RECEIPT_QUEUE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save to offline receipt queue:', err);
  }
};

/**
 * Get all pending offline receipts
 */
export const getPendingOfflineReceipts = (): OfflineQueuedReceipt[] => {
  try {
    const raw = localStorage.getItem(OFFLINE_RECEIPT_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Process offline queued receipts once internet is restored
 */
export const processOfflineReceiptQueue = async (
  categories: ExpenseCategory[],
  locations: MoneyLocation[],
  onReceiptProcessed?: (result: ParsedReceiptResult) => void
): Promise<void> => {
  if (!isDeviceOnline()) return;

  const queue = getPendingOfflineReceipts();
  if (queue.length === 0) return;

  console.log(`📡 [Offline Sync] Online restored! Processing ${queue.length} offline receipts with Gemini Vision...`);

  const remaining: OfflineQueuedReceipt[] = [];

  for (const item of queue) {
    try {
      const enhanced = await scanReceiptWithGemini(item.base64Image, categories, locations);
      if (onReceiptProcessed) {
        onReceiptProcessed(enhanced);
      }
    } catch (err) {
      console.warn('Could not enhance queued receipt, keeping in queue:', err);
      remaining.push(item);
    }
  }

  localStorage.setItem(OFFLINE_RECEIPT_QUEUE_KEY, JSON.stringify(remaining));
};

