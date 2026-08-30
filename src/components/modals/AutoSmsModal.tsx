import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  parseBankSmsRegex,
  parseSmsWithGemini,
  ParsedSmsResult,
} from '../../utils/smsParser';
import {
  isNativeAndroid,
  checkSmsPermissions,
  requestSmsPermissions,
  scanRecentBankSms,
  getProcessedSmsIds,
  markSmsAsProcessed,
  hashSmsMessage,
} from '../../services/smsService';
import { RawSmsMessage } from '../../types';

interface AutoSmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectForEdit?: (parsed: ParsedSmsResult) => void;
}

const SAMPLE_SMS_LIST = [
  {
    label: '🍔 Swiggy (HDFC UPI)',
    sms: 'Sent Rs.450.00 from HDFC Bank A/C **1234 to SWIGGY on 29-AUG-26 via UPI Ref 4239847291. Avl Bal: INR 15,230.50.',
  },
  {
    label: '💼 Salary (SBI Credit)',
    sms: 'Your A/C ending 9876 is credited with INR 55,000.00 on 01-Sep-26 by SALARY CREDIT. Avl Bal: INR 72,500.00 - SBI',
  },
  {
    label: '🏧 ATM Cash (ICICI)',
    sms: 'Cash withdrawal of Rs 2,000.00 from ATM at ICICI T.Nagar using Debit Card **4321 on 29-Aug-26. Avl Bal Rs 8,400.00.',
  },
  {
    label: '☕ Chai (GPay UPI)',
    sms: 'Paid Rs.40.00 to CHAI POINT via Google Pay UPI ref 4928172910 on 29-Aug-26. Available balance in A/C XX5678: Rs 3,450.00.',
  },
  {
    label: '⚡ Electricity Bill (TNEB)',
    sms: 'Rs.1,420.00 debited from Axis Bank A/C 7890 on 28-Aug-26 towards TNEB Electricity Bill. Ref: AX89127.',
  },
];

export const AutoSmsModal: React.FC<AutoSmsModalProps> = ({
  isOpen,
  onClose,
  onSelectForEdit,
}) => {
  const {
    categories,
    locations,
    incomeSources,
    addExpense,
    addIncome,
    addTransfer,
    formatMoney,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'scan' | 'paste'>('scan');
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannedMessages, setScannedMessages] = useState<ParsedSmsResult[]>([]);
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());

  // Paste Tab States
  const [pastedText, setPastedText] = useState<string>('');
  const [parsedPastedResult, setParsedPastedResult] = useState<ParsedSmsResult | null>(null);
  const [isParsingPasted, setIsParsingPasted] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setProcessedIds(getProcessedSmsIds());
      checkPermsAndScan();
    }
  }, [isOpen]);

  const checkPermsAndScan = async () => {
    if (isNativeAndroid()) {
      const granted = await checkSmsPermissions();
      setHasPermission(granted);
      if (granted) {
        handleScanInbox();
      }
    } else {
      // In browser/desktop: default to paste tab or show demo scan
      setHasPermission(false);
    }
  };

  const handleRequestPermission = async () => {
    setIsScanning(true);
    try {
      const granted = await requestSmsPermissions();
      setHasPermission(granted);
      if (granted) {
        await handleScanInbox();
      } else {
        showToast('SMS permission is required to read bank SMS');
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleScanInbox = async () => {
    setIsScanning(true);
    try {
      const rawMessages: RawSmsMessage[] = await scanRecentBankSms(35);
      const parsedList: ParsedSmsResult[] = [];

      for (const msg of rawMessages) {
        const hash = hashSmsMessage(msg.sender, msg.body, msg.timestamp);
        const parsed = parseBankSmsRegex(msg.body, categories, locations, incomeSources);
        parsed.id = hash;
        if (parsed.amount !== null && parsed.amount > 0) {
          parsedList.push(parsed);
        }
      }

      setScannedMessages(parsedList);
      if (parsedList.length === 0) {
        showToast('No new bank transaction SMS detected in inbox');
      } else {
        showToast(`Found ${parsedList.length} bank transactions`);
      }
    } catch (err) {
      console.error('Error scanning inbox:', err);
      showToast('Failed to scan SMS inbox');
    } finally {
      setIsScanning(false);
    }
  };

  const handleParsePastedText = async (text: string) => {
    if (!text.trim()) {
      setParsedPastedResult(null);
      return;
    }
    setIsParsingPasted(true);
    try {
      const result = await parseSmsWithGemini(text, categories, locations, incomeSources);
      result.id = `pasted_${Date.now()}`;
      setParsedPastedResult(result);
    } catch (err) {
      console.error('Failed to parse pasted SMS:', err);
      const localFallback = parseBankSmsRegex(text, categories, locations, incomeSources);
      localFallback.id = `pasted_${Date.now()}`;
      setParsedPastedResult(localFallback);
    } finally {
      setIsParsingPasted(false);
    }
  };

  const handleAddSingleTransaction = async (parsed: ParsedSmsResult) => {
    if (!parsed.amount || parsed.amount <= 0) return;

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const smsNote = `Auto SMS from ${parsed.bankName || 'Bank'}${
        parsed.referenceNumber ? ` (Ref: ${parsed.referenceNumber})` : ''
      }`;

      if (parsed.type === 'expense') {
        await addExpense({
          amount: parsed.amount,
          description: parsed.merchant,
          category: parsed.categoryName,
          locationId: parsed.locationId,
          needWant: parsed.needWant,
          date: todayStr,
          time: timeStr,
          notes: smsNote,
        });
      } else if (parsed.type === 'income') {
        await addIncome({
          amount: parsed.amount,
          source: parsed.sourceName || parsed.merchant,
          locationId: parsed.locationId,
          date: todayStr,
          time: timeStr,
          notes: smsNote,
        });
      } else {
        await addTransfer({
          amount: parsed.amount,
          locationId: parsed.locationId,
          transferType: parsed.transferType,
          fromLocationId: parsed.locationId,
          toLocationId: parsed.locationId,
          date: todayStr,
          time: timeStr,
          notes: smsNote,
        });
      }

      if (parsed.id) {
        markSmsAsProcessed(parsed.id);
        setProcessedIds(new Set([...processedIds, parsed.id]));
      }

      showToast(`Added: ${formatMoney(parsed.amount)} (${parsed.merchant})`);

      if (activeTab === 'paste') {
        setPastedText('');
        setParsedPastedResult(null);
        onClose();
      }
    } catch (err) {
      console.error('Failed to save parsed transaction:', err);
      showToast('Error saving transaction');
    }
  };

  const handleAddAllScanned = async () => {
    const unadded = scannedMessages.filter((m) => m.id && !processedIds.has(m.id));
    if (unadded.length === 0) {
      showToast('All detected transactions are already added!');
      return;
    }

    let count = 0;
    for (const item of unadded) {
      await handleAddSingleTransaction(item);
      count++;
    }
    showToast(`✓ Successfully added ${count} transactions!`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-slideUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black">
              <span className="material-symbols-outlined text-2xl">bolt</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-black dark:text-white flex items-center gap-2">
                Bank SMS Parser
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  1-Tap Add
                </span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Automatically detect & add bank transaction SMS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex px-6 pt-4 gap-2 border-b border-neutral-100 dark:border-neutral-800">
          <button
            onClick={() => setActiveTab('scan')}
            className={`pb-3 px-4 text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'scan'
                ? 'border-b-2 border-black dark:border-white text-black dark:text-white'
                : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            <span className="material-symbols-outlined text-sm">mark_email_unread</span>
            Scan Bank Inbox {scannedMessages.length > 0 && `(${scannedMessages.length})`}
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-3 px-4 text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'paste'
                ? 'border-b-2 border-black dark:border-white text-black dark:text-white'
                : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            <span className="material-symbols-outlined text-sm">content_paste</span>
            Paste SMS / Demo
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'scan' ? (
            <div>
              {/* If on Android and no permission */}
              {isNativeAndroid() && !hasPermission ? (
                <div className="text-center py-10 px-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-800">
                  <div className="w-14 h-14 mx-auto rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-3xl">sms</span>
                  </div>
                  <h3 className="text-base font-black text-black dark:text-white">
                    Enable Bank SMS Detection
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto mt-2 mb-6">
                    Allow Kanakku to read incoming bank transaction SMS so you can add expenses and income with 1 tap. Your SMS data stays 100% private on your phone.
                  </p>
                  <button
                    onClick={handleRequestPermission}
                    disabled={isScanning}
                    className="py-3 px-6 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-black text-xs shadow-xl hover:opacity-90 active:scale-95 transition cursor-pointer"
                  >
                    {isScanning ? 'Requesting...' : 'Grant SMS Permission'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Action Bar */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 font-bold">
                      {isNativeAndroid()
                        ? 'Recent bank transactions from your phone SMS:'
                        : 'Web Preview: Scan native inbox or test SMS below'}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleScanInbox}
                        disabled={isScanning}
                        className="py-1.5 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-bold text-black dark:text-white flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <span className={`material-symbols-outlined text-sm ${isScanning ? 'animate-spin' : ''}`}>
                          refresh
                        </span>
                        {isScanning ? 'Scanning...' : 'Rescan Inbox'}
                      </button>

                      {scannedMessages.length > 0 && (
                        <button
                          onClick={handleAddAllScanned}
                          className="py-1.5 px-3 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-black shadow-md hover:opacity-90 transition cursor-pointer"
                        >
                          Add All
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Scanned List */}
                  {scannedMessages.length === 0 ? (
                    <div className="text-center py-12 px-4 bg-neutral-50 dark:bg-neutral-900/40 rounded-3xl border border-neutral-100 dark:border-neutral-800">
                      <span className="material-symbols-outlined text-4xl text-neutral-300 dark:text-neutral-600 mb-2">
                        mark_email_read
                      </span>
                      <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                        {isScanning
                          ? 'Scanning your SMS inbox for bank messages...'
                          : 'No bank transaction SMS found. Try the "Paste SMS" tab to test!'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {scannedMessages.map((item, idx) => {
                        const isAdded = item.id && processedIds.has(item.id);
                        const isExpense = item.type === 'expense';
                        const isIncome = item.type === 'income';

                        return (
                          <div
                            key={item.id || idx}
                            className={`p-4 rounded-2xl border transition-all ${
                              isAdded
                                ? 'bg-neutral-50/50 dark:bg-neutral-900/30 border-neutral-200 dark:border-neutral-800 opacity-60'
                                : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700/60 hover:border-neutral-400 dark:hover:border-neutral-600'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                                      isExpense
                                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                                        : isIncome
                                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                                        : 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                                    }`}
                                  >
                                    {item.type}
                                  </span>
                                  <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
                                    {item.categoryName}
                                  </span>
                                  {item.bankName && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-bold">
                                      {item.bankName}
                                    </span>
                                  )}
                                </div>

                                <h4 className="text-sm font-black text-black dark:text-white mt-1">
                                  {item.merchant}
                                </h4>

                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1 italic mt-0.5">
                                  "{item.rawText}"
                                </p>
                              </div>

                              <div className="text-right flex flex-col items-end gap-1.5">
                                <div
                                  className={`text-base font-black ${
                                    isExpense
                                      ? 'text-rose-600 dark:text-rose-400'
                                      : isIncome
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-blue-600 dark:text-blue-400'
                                  }`}
                                >
                                  {isExpense ? '-' : isIncome ? '+' : ''}
                                  {formatMoney(item.amount || 0)}
                                </div>

                                {isAdded ? (
                                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">check_circle</span>
                                    Added
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    {onSelectForEdit && (
                                      <button
                                        onClick={() => {
                                          onSelectForEdit(item);
                                          onClose();
                                        }}
                                        className="p-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-bold hover:opacity-80 transition cursor-pointer"
                                        title="Edit before adding"
                                      >
                                        <span className="material-symbols-outlined text-xs">edit</span>
                                      </button>
                                    )}

                                    <button
                                      onClick={() => handleAddSingleTransaction(item)}
                                      className="py-1 px-3 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-black shadow-md hover:opacity-90 active:scale-95 transition cursor-pointer flex items-center gap-1"
                                    >
                                      <span className="material-symbols-outlined text-xs font-black">bolt</span>
                                      1-Tap Add
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* PASTE SMS TAB */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-neutral-500 dark:text-neutral-400 mb-2">
                  Paste SMS Text
                </label>
                <textarea
                  value={pastedText}
                  onChange={(e) => {
                    setPastedText(e.target.value);
                    handleParsePastedText(e.target.value);
                  }}
                  rows={3}
                  placeholder="Paste any bank SMS text here... e.g. Rs.450 debited from HDFC A/C **1234 towards SWIGGY on 29-Aug"
                  className="w-full p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition"
                />
              </div>

              {/* Sample SMS Prompts for Instant Testing */}
              <div>
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                  Quick Test Samples:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_SMS_LIST.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setPastedText(sample.sms);
                        handleParsePastedText(sample.sms);
                      }}
                      className="py-1.5 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition cursor-pointer"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parsed Result Card */}
              {isParsingPasted ? (
                <div className="text-center py-6 text-xs text-neutral-400 font-bold">
                  Parsing SMS with Smart Engine...
                </div>
              ) : parsedPastedResult && parsedPastedResult.amount ? (
                <div className="p-5 rounded-3xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-amber-500 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm font-black">verified</span>
                      Detected Transaction
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-black uppercase ${
                        parsedPastedResult.type === 'expense'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                          : parsedPastedResult.type === 'income'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                          : 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {parsedPastedResult.type}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-neutral-400 text-[10px] uppercase font-bold block">
                        Amount
                      </span>
                      <span className="text-lg font-black text-black dark:text-white">
                        {formatMoney(parsedPastedResult.amount)}
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-400 text-[10px] uppercase font-bold block">
                        Merchant / Payee
                      </span>
                      <span className="text-sm font-black text-black dark:text-white truncate block">
                        {parsedPastedResult.merchant}
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-400 text-[10px] uppercase font-bold block">
                        Category
                      </span>
                      <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        {parsedPastedResult.categoryName} ({parsedPastedResult.needWant})
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-400 text-[10px] uppercase font-bold block">
                        Account / Wallet
                      </span>
                      <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        {parsedPastedResult.locationName}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 flex gap-2">
                    {onSelectForEdit && (
                      <button
                        onClick={() => {
                          onSelectForEdit(parsedPastedResult);
                          onClose();
                        }}
                        className="flex-1 py-3 px-4 rounded-2xl bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold hover:opacity-90 transition cursor-pointer"
                      >
                        Edit Details
                      </button>
                    )}

                    <button
                      onClick={() => handleAddSingleTransaction(parsedPastedResult)}
                      className="flex-1 py-3 px-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black text-xs font-black shadow-xl hover:opacity-90 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm font-black">bolt</span>
                      1-Tap Quick Add
                    </button>
                  </div>
                </div>
              ) : pastedText.trim() ? (
                <div className="text-center py-6 text-xs text-rose-500 font-bold">
                  Could not extract financial transaction from this text. Please check format.
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-neutral-50 dark:bg-neutral-900/60 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-emerald-500">lock</span>
            100% on-device private processing
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold hover:opacity-80 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
