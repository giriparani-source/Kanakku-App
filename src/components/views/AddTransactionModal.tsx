import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { TransactionType, NeedWantType, TransferType } from '../../types';
import { parseSmartVoiceTransaction, parseVoiceWithGemini, ParsedVoiceResult } from '../../utils/voiceParser';

// Speech Recognition Type Definitions
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const AddTransactionModal: React.FC = () => {
  const {
    isAddModalOpen,
    setIsAddModalOpen,
    categories,
    locations,
    incomeSources,
    addExpense,
    addIncome,
    addTransfer,
    getCurrencySymbol,
    getLocationBalance,
    formatMoney,
    showToast,
  } = useApp();

  const [activeType, setActiveType] = useState<TransactionType>('expense');

  // Common Fields
  const [amountStr, setAmountStr] = useState<string>('');
  const [dateChoice, setDateChoice] = useState<'Today' | 'Yesterday' | 'Custom'>('Today');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Module C (Expense) Fields
  const [description, setDescription] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [expenseLocationId, setExpenseLocationId] = useState<string>('');
  const [needWant, setNeedWant] = useState<NeedWantType>('Need');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);

  // Module B (Income) Fields
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [incomeLocationId, setIncomeLocationId] = useState<string>('');

  // Module D (Transfer) Fields
  const [transferType, setTransferType] = useState<TransferType>('transfer');
  const [fromLocationId, setFromLocationId] = useState<string>('');
  const [toLocationId, setToLocationId] = useState<string>('');
  const [singleLocationId, setSingleLocationId] = useState<string>('');

  // Voice Input States
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const recognitionRef = useRef<any>(null);

  // ─── Voice Review Modal State ────────────────────────────────────────────────
  const [voiceReviewData, setVoiceReviewData] = useState<ParsedVoiceResult | null>(null);
  const [reviewAmountStr, setReviewAmountStr] = useState<string>('');
  const [reviewType, setReviewType] = useState<TransactionType>('expense');
  const [reviewCategory, setReviewCategory] = useState<string>('');
  const [reviewSource, setReviewSource] = useState<string>('');
  const [reviewLocationId, setReviewLocationId] = useState<string>('');
  const [reviewNeedWant, setReviewNeedWant] = useState<NeedWantType>('Need');
  const [reviewRawText, setReviewRawText] = useState<string>('');
  // ─────────────────────────────────────────────────────────────────────────────

  // Initialize dropdown defaults
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].name);
      setNeedWant(categories[0].defaultNeed ? 'Need' : 'Want');
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    if (locations.length > 0) {
      if (!expenseLocationId) setExpenseLocationId(locations[0].id);
      if (!incomeLocationId) setIncomeLocationId(locations[0].id);
      if (!singleLocationId) setSingleLocationId(locations[0].id);

      if (!fromLocationId) setFromLocationId(locations[0].id);
      const secondLoc = locations.find((l) => l.id !== locations[0].id);
      if (!toLocationId) setToLocationId(secondLoc?.id || locations[0].id);
    }
  }, [locations, expenseLocationId, incomeLocationId, fromLocationId, toLocationId, singleLocationId]);

  useEffect(() => {
    if (incomeSources.length > 0 && !selectedSource) {
      setSelectedSource(incomeSources[0].name);
    }
  }, [incomeSources, selectedSource]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ignore */ }
      }
    };
  }, []);

  if (!isAddModalOpen) return null;

  const handleCategorySelect = (catName: string, defaultNeed: boolean) => {
    setSelectedCategory(catName);
    setNeedWant(defaultNeed ? 'Need' : 'Want');
  };

  // ─── Voice Parser: populate Review Modal instead of saving directly ──────────
  const handleSmartVoiceInput = async (rawText: string) => {
    if (!rawText.trim()) return;

    // Use AI voice parser with instant heuristic fallback
    const parsed = await parseVoiceWithGemini(rawText, categories, locations, incomeSources);

    // Populate review state
    setReviewRawText(rawText.trim());
    setReviewType(parsed.type);
    setReviewNeedWant(parsed.needWant);
    setReviewCategory(parsed.categoryName);
    setReviewSource(parsed.sourceName);
    setReviewLocationId(parsed.locationId);
    setReviewAmountStr(parsed.amount && parsed.amount > 0 ? parsed.amount.toString() : '');

    // Open the review modal
    setVoiceReviewData(parsed);
    setIsListening(false);
  };

  // ─── Confirm & Save from Review Modal ────────────────────────────────────────
  const handleConfirmVoice = () => {
    const parsedAmount = parseFloat(reviewAmountStr);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('Please enter a valid positive amount before confirming.');
      return;
    }

    const dateLabel = dateChoice === 'Custom' ? customDate : dateChoice;
    setIsSaving(true);

    setTimeout(() => {
      if (reviewType === 'expense') {
        addExpense({
          description: reviewRawText || reviewCategory || 'Expense',
          category: reviewCategory || categories[0]?.name || 'Other Expenses',
          amount: parsedAmount,
          locationId: reviewLocationId || locations[0]?.id || '',
          needWant: reviewNeedWant,
          date: dateLabel,
          notes: `Voice: "${reviewRawText}"`,
          isRecurring: false,
        });
      } else if (reviewType === 'income') {
        addIncome({
          source: reviewSource || incomeSources[0]?.name || 'Salary / Wages',
          amount: parsedAmount,
          locationId: reviewLocationId || locations[0]?.id || '',
          date: dateLabel,
          notes: `Voice: "${reviewRawText}"`,
        });
      } else if (reviewType === 'transfer' && voiceReviewData) {
        addTransfer({
          transferType: voiceReviewData.transferType,
          amount: parsedAmount,
          locationId: reviewLocationId,
          fromLocationId: voiceReviewData.fromLocationId,
          toLocationId: voiceReviewData.toLocationId,
          date: dateLabel,
          notes: `Voice: "${reviewRawText}"`,
        });
      }

      setIsSaving(false);
      setVoiceReviewData(null);
      setIsAddModalOpen(false);
      setAmountStr('');
      setDescription('');
      setNotes('');
    }, 180);
  };

  // ─── Cancel Review Modal ─────────────────────────────────────────────────────
  const handleCancelVoiceReview = () => {
    setVoiceReviewData(null);
    setReviewAmountStr('');
    setReviewRawText('');
  };

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Voice input is not supported in this browser. Please type manually.');
      return;
    }

    try {
      if (recognitionRef.current) recognitionRef.current.stop();
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Works seamlessly for Indian English and Tanglish

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        if (event.results[0] && event.results[0].isFinal) {
          handleSmartVoiceInput(currentTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        showToast(`Voice input error: ${event.error}`);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      showToast('Could not initialize microphone.');
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    }
    setIsListening(false);
    if (transcript) handleSmartVoiceInput(transcript);
  };

  // Form Submit Handler (for manual form)
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amountStr);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('Please enter a valid positive amount');
      return;
    }

    const dateLabel = dateChoice === 'Custom' ? customDate : dateChoice;
    setIsSaving(true);

    setTimeout(() => {
      if (activeType === 'expense') {
        addExpense({
          description: description.trim() || selectedCategory || 'Expense',
          category: selectedCategory || categories[0]?.name || 'Other Expenses',
          amount: parsedAmount,
          locationId: expenseLocationId || locations[0]?.id || '',
          needWant,
          date: dateLabel,
          notes: notes.trim() || undefined,
          isRecurring,
        });
      } else if (activeType === 'income') {
        addIncome({
          source: selectedSource || incomeSources[0]?.name || 'Salary / Wages',
          amount: parsedAmount,
          locationId: incomeLocationId || locations[0]?.id || '',
          date: dateLabel,
          notes: notes.trim() || undefined,
        });
      } else if (activeType === 'transfer') {
        if (transferType === 'transfer' && fromLocationId === toLocationId) {
          showToast('Source and destination locations must be different');
          setIsSaving(false);
          return;
        }

        addTransfer({
          transferType,
          amount: parsedAmount,
          locationId: transferType === 'transfer' ? toLocationId : singleLocationId,
          fromLocationId: transferType === 'transfer' ? fromLocationId : transferType === 'withdrawal' ? singleLocationId : undefined,
          toLocationId: transferType === 'transfer' ? toLocationId : transferType === 'deposit' ? singleLocationId : undefined,
          date: dateLabel,
          notes: notes.trim() || undefined,
        });
      }

      setIsSaving(false);
      setIsAddModalOpen(false);
      setAmountStr('');
      setDescription('');
      setNotes('');
    }, 180);
  };

  // ─── Type badge helper ────────────────────────────────────────────────────────
  const typeBadgeClass: Record<TransactionType, string> = {
    expense: 'bg-rose-500/15 text-rose-500 border border-rose-500/30',
    income:  'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30',
    transfer:'bg-blue-500/15 text-[#0066FF] border border-blue-500/30',
  };

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════════
          VOICE REVIEW MODAL — shown above the Add Transaction modal
          ═══════════════════════════════════════════════════════════════════════ */}
      {voiceReviewData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-md max-h-[90vh] flex flex-col bg-white dark:bg-[#141B2A] text-black dark:text-white rounded-3xl shadow-2xl border border-neutral-200 dark:border-[#243048] overflow-hidden animate-slideUp my-auto">

            {/* Header */}
            <div className="p-6 pb-4 border-b border-neutral-100 dark:border-[#243048] shrink-0">
              <div className="flex items-center gap-3 mb-1.5">
                <div className="w-9 h-9 rounded-2xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-violet-500 text-xl">auto_awesome</span>
                </div>
                <div>
                  <h3 className="font-black text-lg text-black dark:text-white leading-tight">
                    Review AI-Parsed Transaction
                  </h3>
                  <p className="text-xs font-bold text-neutral-400 dark:text-neutral-500">
                    Correct any mistakes before saving
                  </p>
                </div>
              </div>
              {/* Raw transcript reference */}
              {reviewRawText && (
                <div className="mt-3.5 p-3.5 bg-neutral-50 dark:bg-[#0B0F17] rounded-2xl border border-neutral-200 dark:border-[#2E3C56]">
                  <p className="text-[11px] font-black text-neutral-400 dark:text-neutral-500 mb-1 uppercase tracking-wider">
                    You said
                  </p>
                  <p className="text-xs font-bold text-black dark:text-white italic leading-relaxed">
                    "{reviewRawText}"
                  </p>
                </div>
              )}
            </div>

            {/* Editable Fields — scrollable body */}
            <div className="p-6 py-5 space-y-5 overflow-y-auto flex-1">

              {/* Amount — fully editable */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-2">
                  Amount <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2.5 px-4 py-3.5 bg-[#F4F5F7] dark:bg-[#1C263A] rounded-2xl border border-neutral-200 dark:border-[#2E3C56] focus-within:ring-2 focus-within:ring-black dark:focus-within:ring-white transition-all">
                  <span className="text-2xl font-black text-black dark:text-white select-none">
                    {getCurrencySymbol()}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    autoFocus
                    placeholder="0"
                    value={reviewAmountStr}
                    onChange={(e) => setReviewAmountStr(e.target.value)}
                    className="flex-1 text-2xl font-black bg-transparent border-none outline-none focus:ring-0 text-black dark:text-white placeholder-neutral-300 dark:placeholder-neutral-600 tabular-nums"
                  />
                  {/* Transaction type badge — read-only indicator */}
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full shrink-0 ${typeBadgeClass[reviewType]}`}>
                    {reviewType}
                  </span>
                </div>
                {!reviewAmountStr && (
                  <p className="text-xs text-amber-500 font-bold mt-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    Amount not recognized — please enter manually
                  </p>
                )}
              </div>

              {/* Category (expense) or Income Source */}
              {reviewType === 'expense' && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-2">
                    Category
                  </label>
                  <select
                    value={reviewCategory}
                    onChange={(e) => {
                      setReviewCategory(e.target.value);
                      const cat = categories.find((c) => c.name === e.target.value);
                      if (cat) setReviewNeedWant(cat.defaultNeed ? 'Need' : 'Want');
                    }}
                    className="w-full px-4 py-3.5 bg-[#F4F5F7] dark:bg-[#1C263A] rounded-2xl text-black dark:text-white font-black text-sm border border-neutral-200 dark:border-[#2E3C56] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name} className="bg-white dark:bg-[#1C263A]">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {reviewType === 'income' && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-2">
                    Income Source
                  </label>
                  <select
                    value={reviewSource}
                    onChange={(e) => setReviewSource(e.target.value)}
                    className="w-full px-4 py-3.5 bg-[#F4F5F7] dark:bg-[#1C263A] rounded-2xl text-black dark:text-white font-black text-sm border border-neutral-200 dark:border-[#2E3C56] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white cursor-pointer"
                  >
                    {incomeSources.map((src) => (
                      <option key={src.id} value={src.name} className="bg-white dark:bg-[#1C263A]">
                        {src.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Location */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-2">
                  {reviewType === 'income' ? 'Deposit to Location' : 'Deduct from Location'}
                </label>
                <select
                  value={reviewLocationId}
                  onChange={(e) => setReviewLocationId(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[#F4F5F7] dark:bg-[#1C263A] rounded-2xl text-black dark:text-white font-black text-sm border border-neutral-200 dark:border-[#2E3C56] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white cursor-pointer"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id} className="bg-white dark:bg-[#1C263A]">
                      {loc.name} ({formatMoney(getLocationBalance(loc.id))})
                    </option>
                  ))}
                </select>
              </div>

              {/* Need / Want toggle — expense only */}
              {reviewType === 'expense' && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-2">
                    Need vs. Want
                  </label>
                  <div className="grid grid-cols-2 gap-2.5 p-1 bg-[#F4F5F7] dark:bg-[#1C263A] rounded-2xl border border-neutral-200 dark:border-[#2E3C56]">
                    <button
                      type="button"
                      onClick={() => setReviewNeedWant('Need')}
                      className={`py-3 px-3.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        reviewNeedWant === 'Need'
                          ? 'bg-[#0052FF] text-white shadow-md'
                          : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Essential NEED
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewNeedWant('Want')}
                      className={`py-3 px-3.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        reviewNeedWant === 'Want'
                          ? 'bg-[#00C853] text-white shadow-md'
                          : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">favorite</span>
                      Lifestyle WANT
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-6 pt-4 pb-6 flex gap-3 shrink-0 border-t border-neutral-100 dark:border-[#243048] bg-neutral-50/50 dark:bg-[#141B2A]/50">
              {/* Cancel */}
              <button
                type="button"
                onClick={handleCancelVoiceReview}
                className="flex-1 py-3.5 px-4 rounded-2xl border border-neutral-200 dark:border-[#2E3C56] bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white font-black text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">close</span>
                Cancel
              </button>

              {/* Confirm & Save */}
              <button
                type="button"
                onClick={handleConfirmVoice}
                disabled={isSaving || !reviewAmountStr || parseFloat(reviewAmountStr) <= 0}
                className="flex-[1.6] py-3.5 px-4 rounded-2xl bg-black text-white dark:bg-white dark:text-black font-black text-sm shadow-xl hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSaving ? (
                  <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    Confirm &amp; Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN ADD TRANSACTION MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
        <div className="w-full h-full md:h-auto md:max-h-[92vh] md:max-w-lg bg-white dark:bg-[#141B2A] text-black dark:text-white md:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-neutral-200 dark:border-[#243048] animate-slideUp transition-colors">
          {/* Modal Header */}
          <header className="w-full top-0 bg-white dark:bg-[#141B2A] flex justify-between items-center px-6 py-4 border-b border-neutral-200 dark:border-[#243048]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (isListening) stopVoiceInput();
                  setIsAddModalOpen(false);
                }}
                className="p-1 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors active:scale-95 cursor-pointer"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-2xl font-black">close</span>
              </button>
              <h2 className="font-black text-xl text-black dark:text-white tracking-tight">
                Add Transaction
              </h2>
            </div>

            {/* Voice Input Button */}
            <button
              type="button"
              onClick={isListening ? stopVoiceInput : startVoiceInput}
              title={isListening ? 'Stop Listening' : 'Voice Input (Tanglish / English / Tamil)'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                isListening
                  ? 'bg-[#FF2D55] text-white animate-pulse shadow-md shadow-rose-500/30'
                  : 'bg-[#F4F5F7] dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56] text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 active:scale-95'
              }`}
            >
              <span className="material-symbols-outlined text-lg font-black">
                {isListening ? 'mic' : 'mic_none'}
              </span>
              <span>{isListening ? 'Listening...' : 'Smart Voice'}</span>
            </button>
          </header>

          {/* Live Voice Banner */}
          {isListening && (
            <div className="bg-black dark:bg-[#0B0F17] text-white px-6 py-4 flex flex-col items-center justify-center gap-2 animate-fadeIn border-b border-neutral-800 dark:border-[#243048]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#FF2D55] animate-ping" />
                <span className="text-xs font-black uppercase tracking-wider text-[#00C853]">
                  Smart Tanglish/Tamil AI Listening...
                </span>
              </div>
              <p className="text-sm font-bold text-center text-neutral-200 italic min-h-[1.5rem]">
                {transcript ? `"${transcript}"` : 'Say e.g. "Kaalaile tea 20 rupees cash want" or "1500 petrol bank need"...'}
              </p>
              <button
                type="button"
                onClick={stopVoiceInput}
                className="mt-1 text-[11px] font-black text-neutral-400 hover:text-white underline cursor-pointer"
              >
                Tap to Finish Speaking
              </button>
            </div>
          )}

          {/* Segmented Mode Selector: Expense | Income | Transfer */}
          <div className="px-6 pt-4">
            <div className="flex bg-[#F4F5F7] dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56] p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveType('expense')}
                className={`flex-1 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all cursor-pointer ${
                  activeType === 'expense'
                    ? 'bg-white dark:bg-[#243048] text-[#FF2D55] shadow-sm'
                    : 'text-black dark:text-neutral-300 hover:opacity-80'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setActiveType('income')}
                className={`flex-1 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all cursor-pointer ${
                  activeType === 'income'
                    ? 'bg-white dark:bg-[#243048] text-[#00C853] shadow-sm'
                    : 'text-black dark:text-neutral-300 hover:opacity-80'
                }`}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => setActiveType('transfer')}
                className={`flex-1 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all cursor-pointer ${
                  activeType === 'transfer'
                    ? 'bg-white dark:bg-[#243048] text-[#0066FF] shadow-sm'
                    : 'text-black dark:text-neutral-300 hover:opacity-80'
                }`}
              >
                Transfer
              </button>
            </div>
          </div>

          {/* Scrollable Form Body */}
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-4 space-y-5 pb-28">
            {/* Amount Display */}
            <div className="flex flex-col items-center justify-center pt-2">
              <span className="text-xs font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1">
                Amount
              </span>
              <div className="flex items-center justify-center gap-1 w-full">
                <span className="text-4xl md:text-5xl font-black text-black dark:text-white select-none">
                  {getCurrencySymbol()}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  autoFocus
                  placeholder="0"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  className="w-56 text-center text-4xl md:text-5xl font-black bg-transparent border-none outline-none focus:ring-0 text-black dark:text-white placeholder-neutral-300 dark:placeholder-neutral-600 tabular-nums"
                />
              </div>
            </div>

            {/* ========================================== */}
            {/* MODULE C: EXPENSE TRACKER SPECIFIC FIELDS */}
            {/* ========================================== */}
            {activeType === 'expense' && (
              <div className="space-y-4">
                {/* MANDATORY NEED VS. WANT TAG */}
                <div className="p-4 rounded-2xl bg-black dark:bg-[#0B0F17] text-white border border-neutral-800 dark:border-[#243048] space-y-2.5 shadow-md">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg text-amber-400">psychology</span>
                      <span className="text-xs font-black uppercase tracking-wider text-white">
                        Need vs. Want Tag <span className="text-rose-400">*Mandatory</span>
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-neutral-400">Spending Psychology</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-900 dark:bg-[#141B2A] rounded-xl border border-neutral-800 dark:border-[#243048]">
                    <button
                      type="button"
                      onClick={() => setNeedWant('Need')}
                      className={`py-2.5 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        needWant === 'Need'
                          ? 'bg-[#0052FF] text-white shadow-md'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      <span>Essential NEED</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNeedWant('Want')}
                      className={`py-2.5 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        needWant === 'Want'
                          ? 'bg-[#00C853] text-white shadow-md'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">favorite</span>
                      <span>Lifestyle WANT</span>
                    </button>
                  </div>
                </div>

                {/* Description Input */}
                <div>
                  <label className="block text-xs font-black text-black dark:text-neutral-200 uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Grocery at Supermarket, Dinner with friends"
                    className="w-full px-4 py-3 bg-[#F4F5F7] dark:bg-[#1C263A] rounded-2xl text-black dark:text-white font-bold text-sm border border-neutral-200 dark:border-[#2E3C56] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                  />
                </div>

                {/* Category Grid */}
                <div>
                  <label className="block text-xs font-black text-black dark:text-neutral-200 uppercase tracking-wider mb-2">
                    Category ({categories.length})
                  </label>
                  <div className="grid grid-cols-4 gap-2.5 max-h-40 overflow-y-auto p-1">
                    {categories.map((cat) => {
                      const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleCategorySelect(cat.name, cat.defaultNeed)}
                          className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-black text-white dark:bg-white dark:text-black shadow-md scale-102'
                              : 'bg-[#F4F5F7] dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56] text-black dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700'
                          }`}
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                            style={{
                              backgroundColor: isSelected ? (isSelected && !document.documentElement.classList.contains('dark') ? '#FFFFFF' : '#0B0F17') : cat.color || '#0066FF',
                              color: isSelected ? (isSelected && !document.documentElement.classList.contains('dark') ? '#000000' : '#FFFFFF') : '#FFFFFF',
                            }}
                          >
                            <span className="material-symbols-outlined text-base">{cat.icon}</span>
                          </div>
                          <span className="text-[10px] font-black truncate max-w-full">
                            {cat.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Expense Money Location */}
                <div>
                  <label className="block text-xs font-black text-black dark:text-neutral-200 uppercase tracking-wider mb-1">
                    Deduct from Location
                  </label>
                  <select
                    value={expenseLocationId}
                    onChange={(e) => setExpenseLocationId(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F4F5F7] dark:bg-[#1C263A] rounded-2xl text-black dark:text-white font-black text-sm border border-neutral-200 dark:border-[#2E3C56] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white cursor-pointer"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id} className="bg-white dark:bg-[#1C263A] text-black dark:text-white">
                        {loc.name} (Balance: {formatMoney(getLocationBalance(loc.id))})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* ========================================== */}
            {/* MODULE B: INCOME TRACKER SPECIFIC FIELDS */}
            {/* ========================================== */}
            {activeType === 'income' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-black dark:text-neutral-200 uppercase tracking-wider mb-1">
                    Income Source
                  </label>
                  <select
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F4F5F7] dark:bg-[#1C263A] rounded-2xl text-black dark:text-white font-black text-sm border border-neutral-200 dark:border-[#2E3C56] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white cursor-pointer"
                  >
                    {incomeSources.map((src) => (
                      <option key={src.id} value={src.name} className="bg-white dark:bg-[#1C263A] text-black dark:text-white">
                        {src.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-black dark:text-neutral-200 uppercase tracking-wider mb-1">
                    Deposit to Location
                  </label>
                  <select
                    value={incomeLocationId}
                    onChange={(e) => setIncomeLocationId(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F4F5F7] dark:bg-[#1C263A] rounded-2xl text-black dark:text-white font-black text-sm border border-neutral-200 dark:border-[#2E3C56] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white cursor-pointer"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id} className="bg-white dark:bg-[#1C263A] text-black dark:text-white">
                        {loc.name} (Current: {formatMoney(getLocationBalance(loc.id))})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* ========================================== */}
            {/* MODULE D: TRANSFERS SPECIFIC FIELDS */}
            {/* ========================================== */}
            {activeType === 'transfer' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-[#0066FF]/10 dark:bg-[#0066FF]/20 border border-[#0066FF]/20 text-[#0066FF] dark:text-[#60A5FA] flex items-center gap-2.5 text-xs font-bold">
                  <span className="material-symbols-outlined text-lg shrink-0">info</span>
                  <span>Transfers adjust location balances directly and do <strong>NOT</strong> count toward total expenses.</span>
                </div>

                <div>
                  <label className="block text-xs font-black text-black dark:text-neutral-200 uppercase tracking-wider mb-1">
                    Transfer Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'transfer', label: 'Between Locations' },
                      { id: 'deposit', label: 'Deposit' },
                      { id: 'withdrawal', label: 'Withdrawal' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTransferType(t.id as TransferType)}
                        className={`py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          transferType === t.id
                            ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                            : 'bg-[#F4F5F7] dark:bg-[#1C263A] text-black dark:text-white border border-neutral-200 dark:border-[#2E3C56] hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {transferType === 'transfer' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-black text-black dark:text-neutral-300 uppercase mb-1">
                        From Location
                      </label>
                      <select
                        value={fromLocationId}
                        onChange={(e) => setFromLocationId(e.target.value)}
                        className="w-full p-2.5 bg-[#F4F5F7] dark:bg-[#1C263A] rounded-xl text-black dark:text-white font-bold text-xs border border-neutral-200 dark:border-[#2E3C56] outline-none"
                      >
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id} className="bg-white dark:bg-[#1C263A]">
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-black dark:text-neutral-300 uppercase mb-1">
                        To Location
                      </label>
                      <select
                        value={toLocationId}
                        onChange={(e) => setToLocationId(e.target.value)}
                        className="w-full p-2.5 bg-[#F4F5F7] dark:bg-[#1C263A] rounded-xl text-black dark:text-white font-bold text-xs border border-neutral-200 dark:border-[#2E3C56] outline-none"
                      >
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id} className="bg-white dark:bg-[#1C263A]">
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-black text-black dark:text-neutral-200 uppercase tracking-wider mb-1">
                      {transferType === 'deposit' ? 'Target Location' : 'Source Location'}
                    </label>
                    <select
                      value={singleLocationId}
                      onChange={(e) => setSingleLocationId(e.target.value)}
                      className="w-full px-4 py-3 bg-[#F4F5F7] dark:bg-[#1C263A] rounded-2xl text-black dark:text-white font-black text-sm border border-neutral-200 dark:border-[#2E3C56] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white cursor-pointer"
                    >
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id} className="bg-white dark:bg-[#1C263A]">
                          {loc.name} (Balance: {formatMoney(getLocationBalance(loc.id))})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Common Date Picker & Notes */}
            <div className="bg-[#F4F5F7] dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-black dark:text-white">calendar_today</span>
                  <span className="text-xs font-black text-black dark:text-white">Date</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {(['Today', 'Yesterday', 'Custom'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDateChoice(d)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black transition-colors cursor-pointer ${
                        dateChoice === d
                          ? 'bg-black text-white dark:bg-white dark:text-black'
                          : 'bg-white dark:bg-[#141B2A] border border-neutral-200 dark:border-[#2E3C56] text-black dark:text-white'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {dateChoice === 'Custom' && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-[#141B2A] rounded-xl text-xs font-bold text-black dark:text-white border border-neutral-200 dark:border-[#2E3C56]"
                />
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-neutral-200 dark:border-[#2E3C56]">
                <span className="material-symbols-outlined text-lg text-black dark:text-white">edit_note</span>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add optional notes / tags..."
                  className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-black dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:ring-0 p-0"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSaving || !amountStr || parseFloat(amountStr) <= 0}
              className="w-full bg-black text-white dark:bg-white dark:text-black font-black text-base py-4 rounded-2xl shadow-xl hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                `Save ${activeType.charAt(0).toUpperCase() + activeType.slice(1)}`
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};
