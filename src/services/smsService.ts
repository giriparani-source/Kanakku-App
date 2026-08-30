import { registerPlugin, PluginListenerHandle, Capacitor } from '@capacitor/core';
import { RawSmsMessage } from '../types';
import { parseBankSmsRegex, ParsedSmsResult } from '../utils/smsParser';

export interface SmsReaderPluginInterface {
  isAvailable(): Promise<{ available: boolean; platform: string }>;
  checkSmsPermissions(): Promise<{ granted: boolean; readSms: boolean; receiveSms: boolean }>;
  requestSmsPermissions(): Promise<{ granted: boolean; readSms: boolean; receiveSms: boolean }>;
  getRecentSms(options?: { limit?: number; filterBankOnly?: boolean }): Promise<{ messages: RawSmsMessage[]; count: number }>;
  addListener(
    eventName: 'onSmsReceived',
    listenerFunc: (data: RawSmsMessage) => void
  ): Promise<PluginListenerHandle>;
  removeAllListeners(): Promise<void>;
}

export const SmsReader = registerPlugin<SmsReaderPluginInterface>('SmsReader');

// Local storage key for processed SMS message IDs / hashes
const PROCESSED_SMS_KEY = 'kanakku_processed_sms_ids';
const DISMISSED_SMS_KEY = 'kanakku_dismissed_sms_ids';

export const isNativeAndroid = (): boolean => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};

export const getProcessedSmsIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(PROCESSED_SMS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

export const markSmsAsProcessed = (idOrHash: string): void => {
  try {
    const set = getProcessedSmsIds();
    set.add(idOrHash);
    // Keep only last 200 items to avoid storage bloat
    const arr = Array.from(set).slice(-200);
    localStorage.setItem(PROCESSED_SMS_KEY, JSON.stringify(arr));
  } catch (err) {
    console.error('Failed to mark SMS as processed:', err);
  }
};

export const getDismissedSmsIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DISMISSED_SMS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

export const markSmsAsDismissed = (idOrHash: string): void => {
  try {
    const set = getDismissedSmsIds();
    set.add(idOrHash);
    const arr = Array.from(set).slice(-200);
    localStorage.setItem(DISMISSED_SMS_KEY, JSON.stringify(arr));
  } catch (err) {
    console.error('Failed to mark SMS as dismissed:', err);
  }
};

/**
 * Generate a deterministic hash for an SMS if it lacks a distinct database ID
 */
export const hashSmsMessage = (sender: string, body: string, timestamp: number): string => {
  const normalized = `${sender}_${timestamp}_${body.substring(0, 40)}`.replace(/\s+/g, '');
  return normalized;
};

/**
 * Check if SMS permissions are granted on Android
 */
export const checkSmsPermissions = async (): Promise<boolean> => {
  if (!isNativeAndroid()) return false;
  try {
    const result = await SmsReader.checkSmsPermissions();
    return !!result?.granted;
  } catch {
    return false;
  }
};

/**
 * Request SMS permissions on Android
 */
export const requestSmsPermissions = async (): Promise<boolean> => {
  if (!isNativeAndroid()) return false;
  try {
    const result = await SmsReader.requestSmsPermissions();
    return !!result?.granted;
  } catch (err) {
    console.error('Error requesting SMS permissions:', err);
    return false;
  }
};

/**
 * Scan recent bank SMS from inbox
 */
export const scanRecentBankSms = async (
  limit = 40
): Promise<RawSmsMessage[]> => {
  if (!isNativeAndroid()) return [];
  try {
    const result = await SmsReader.getRecentSms({ limit, filterBankOnly: true });
    return result?.messages || [];
  } catch (err) {
    console.error('Error scanning SMS:', err);
    return [];
  }
};

// ==============================================================================
// WEB BROWSER SMS AUTO-DETECTION (WebOTP + Smart Clipboard Sync)
// ==============================================================================

/**
 * 1. WebOTP API: Auto-captures incoming SMS in Chromium / Android Chrome browsers
 */
export const listenForWebOtpSms = async (
  onSmsDetected: (smsText: string) => void,
  abortSignal?: AbortSignal
): Promise<void> => {
  if (typeof window === 'undefined' || !('OTPCredential' in window) || !(navigator as any).credentials) {
    return;
  }

  try {
    const content = await (navigator as any).credentials.get({
      otp: { transport: ['sms'] },
      signal: abortSignal,
    });

    if (content && content.code) {
      onSmsDetected(content.code);
    }
  } catch (err: any) {
    if (err?.name !== 'AbortError') {
      console.warn('WebOTP API listening ended:', err);
    }
  }
};

let lastCheckedClipboardText = '';

/**
 * 2. Smart Clipboard Ingestion: Auto-detects bank transactional SMS copied to clipboard
 * when the user switches tabs / focuses on Kanakku app in browser.
 */
export const checkClipboardForBankSms = async (
  onSmsDetected: (parsed: ParsedSmsResult) => void
): Promise<void> => {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.readText) {
    return;
  }

  try {
    const text = await navigator.clipboard.readText();
    if (!text || text.trim() === '' || text === lastCheckedClipboardText) {
      return;
    }

    lastCheckedClipboardText = text;

    // Check if the text looks like an Indian bank or UPI message
    const isBankMessage =
      /(?:debited|credited|spent|paid|withdrawn|transferred|acct|a\/c|card|inr|rs\.?|₹|hdfc|sbi|icici|axis|kotak|paytm|upi|gpay|phonepe)/i.test(
        text
      );

    if (!isBankMessage) return;

    const parsed = parseBankSmsRegex(text);
    if (parsed && parsed.amount && parsed.amount > 0) {
      const processed = getProcessedSmsIds();
      const dismissed = getDismissedSmsIds();
      const hash = hashSmsMessage('CLIPBOARD', text, Math.floor(Date.now() / 60000)); // 1 min bucket

      if (!processed.has(hash) && !dismissed.has(hash)) {
        parsed.smsId = hash;
        onSmsDetected(parsed);
      }
    }
  } catch (err) {
    // Clipboard permission might be denied or silent on non-focused window
  }
};

/**
 * 3. Unified Web SMS Auto-Listener for web browsers and PWAs
 */
export const initWebSmsAutoListener = (
  onSmsDetected: (parsed: ParsedSmsResult) => void
): (() => void) => {
  if (isNativeAndroid()) return () => {};

  const abortController = new AbortController();

  // 1. WebOTP listener
  listenForWebOtpSms((rawText) => {
    const parsed = parseBankSmsRegex(rawText);
    if (parsed && parsed.amount && parsed.amount > 0) {
      onSmsDetected(parsed);
    }
  }, abortController.signal);

  // 2. Clipboard auto-check on tab focus / visibility change
  const handleFocus = () => {
    checkClipboardForBankSms(onSmsDetected);
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      checkClipboardForBankSms(onSmsDetected);
    }
  };

  window.addEventListener('focus', handleFocus);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Initial check on load
  setTimeout(() => {
    checkClipboardForBankSms(onSmsDetected);
  }, 1000);

  return () => {
    abortController.abort();
    window.removeEventListener('focus', handleFocus);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};

