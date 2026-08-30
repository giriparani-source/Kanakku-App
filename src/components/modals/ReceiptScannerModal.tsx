import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  scanReceiptWithGemini,
  extractReceiptOffline,
  isDeviceOnline,
  SAMPLE_RECEIPTS_DATA,
  ParsedReceiptResult,
  ReceiptItem,
} from '../../utils/receiptOcr';
import { fileToBase64 } from '../../utils/imageUtils';
import { NeedWantType } from '../../types';

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectForEdit?: (receiptData: ParsedReceiptResult) => void;
}

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectForEdit,
}) => {
  const {
    categories,
    locations,
    addExpense,
    formatMoney,
    getCurrencySymbol,
    showToast,
  } = useApp();

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [parsedResult, setParsedResult] = useState<ParsedReceiptResult | null>(null);
  const [activeTab, setActiveTab] = useState<'camera' | 'samples'>('camera');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleProcessImage = async (file: File) => {
    try {
      setIsScanning(true);
      const base64 = await fileToBase64(file, 1024, 0.88);
      setImageSrc(base64);

      if (!isDeviceOnline()) {
        const offlineResult = extractReceiptOffline(
          base64,
          categories,
          locations,
          file.name.replace(/\.[^/.]+$/, '')
        );
        setParsedResult(offlineResult);
        showToast('⚡ Offline mode: Extracted items on-device. Queued for AI auto-sync!');
        return;
      }

      try {
        const result = await scanReceiptWithGemini(base64, categories, locations);
        setParsedResult(result);
        showToast(`Extracted ${result.items.length} items from ${result.merchantName}`);
      } catch (err: any) {
        console.warn('Gemini OCR error, switching to on-device offline extraction:', err);
        const offlineResult = extractReceiptOffline(
          base64,
          categories,
          locations,
          file.name.replace(/\.[^/.]+$/, '')
        );
        setParsedResult(offlineResult);
        showToast('⚡ AI server busy: Processed on-device locally.');
      }
    } catch (err) {
      console.error('File reading error:', err);
      showToast('Failed to read receipt image');
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessImage(file);
    }
  };

  const handleSelectSample = (key: string) => {
    const sample = SAMPLE_RECEIPTS_DATA[key];
    if (sample) {
      // Deep clone sample so edits don't mutate template
      const cloned: ParsedReceiptResult = JSON.parse(JSON.stringify(sample));
      setParsedResult(cloned);
      setImageSrc(null);
      showToast(`Loaded sample: ${sample.merchantName}`);
    }
  };

  const handleToggleItem = (itemId: string) => {
    if (!parsedResult) return;
    const updatedItems = parsedResult.items.map((it) =>
      it.id === itemId ? { ...it, selected: !it.selected } : it
    );
    const newTotal = updatedItems
      .filter((it) => it.selected !== false)
      .reduce((sum, it) => sum + it.totalPrice, 0);

    setParsedResult({
      ...parsedResult,
      items: updatedItems,
      totalAmount: newTotal,
    });
  };

  const handleToggleNeedWant = (itemId: string) => {
    if (!parsedResult) return;
    const updatedItems = parsedResult.items.map((it) =>
      it.id === itemId
        ? { ...it, needWant: (it.needWant === 'Need' ? 'Want' : 'Need') as NeedWantType }
        : it
    );
    setParsedResult({
      ...parsedResult,
      items: updatedItems,
    });
  };

  const handleDeleteItem = (itemId: string) => {
    if (!parsedResult) return;
    const updatedItems = parsedResult.items.filter((it) => it.id !== itemId);
    const newTotal = updatedItems
      .filter((it) => it.selected !== false)
      .reduce((sum, it) => sum + it.totalPrice, 0);

    setParsedResult({
      ...parsedResult,
      items: updatedItems,
      totalAmount: newTotal,
    });
  };

  const handleAddItem = () => {
    if (!parsedResult) return;
    const newItem: ReceiptItem = {
      id: `custom-${Date.now()}`,
      name: 'New Item',
      quantity: 1,
      unitPrice: 50,
      totalPrice: 50,
      categoryName: parsedResult.primaryCategory || categories[0]?.name || 'Food & Dining',
      needWant: 'Need',
      selected: true,
    };
    const updatedItems = [...parsedResult.items, newItem];
    const newTotal = updatedItems
      .filter((it) => it.selected !== false)
      .reduce((sum, it) => sum + it.totalPrice, 0);

    setParsedResult({
      ...parsedResult,
      items: updatedItems,
      totalAmount: newTotal,
    });
  };

  // Option 1: Save entire bill as single consolidated expense
  const handleSaveSingleExpense = async () => {
    if (!parsedResult) return;
    setIsSaving(true);
    try {
      const selectedItems = parsedResult.items.filter((it) => it.selected !== false);
      const itemsSummary = selectedItems
        .map((it) => `• ${it.name} (x${it.quantity || 1}) - ${formatMoney(it.totalPrice)} [${it.needWant}]`)
        .join('\n');

      const billNotes = [
        `Receipt: ${parsedResult.merchantName}`,
        parsedResult.billNumber ? `Bill #${parsedResult.billNumber}` : '',
        `\nItemized Breakdown:\n${itemsSummary}`,
      ]
        .filter(Boolean)
        .join('\n');

      await addExpense({
        amount: parsedResult.totalAmount,
        description: parsedResult.merchantName || 'Supermarket Receipt',
        category: parsedResult.primaryCategory,
        locationId: parsedResult.locationId,
        needWant: parsedResult.primaryNeedWant,
        date: parsedResult.dateStr || 'Today',
        time: parsedResult.timeStr,
        notes: billNotes,
      });

      showToast(`⚡ Saved bill: ${formatMoney(parsedResult.totalAmount)} (${parsedResult.merchantName})`);
      onClose();
      setParsedResult(null);
      setImageSrc(null);
    } catch (err) {
      console.error('Failed to save receipt:', err);
      showToast('Error saving receipt');
    } finally {
      setIsSaving(false);
    }
  };

  // Option 2: Split and save every checked item as separate transactions
  const handleSaveSplitItems = async () => {
    if (!parsedResult) return;
    const selectedItems = parsedResult.items.filter((it) => it.selected !== false);
    if (selectedItems.length === 0) {
      showToast('No items selected to save');
      return;
    }

    setIsSaving(true);
    try {
      let count = 0;
      for (const item of selectedItems) {
        await addExpense({
          amount: item.totalPrice,
          description: `${item.name} (${parsedResult.merchantName})`,
          category: item.categoryName || parsedResult.primaryCategory,
          locationId: parsedResult.locationId,
          needWant: item.needWant,
          date: parsedResult.dateStr || 'Today',
          time: parsedResult.timeStr,
          notes: `Item from ${parsedResult.merchantName} receipt (Qty: ${item.quantity || 1})`,
        });
        count++;
      }

      showToast(`📦 Saved ${count} separate itemized transactions!`);
      onClose();
      setParsedResult(null);
      setImageSrc(null);
    } catch (err) {
      console.error('Failed to split save items:', err);
      showToast('Error saving itemized transactions');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-slideUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-black">
              <span className="material-symbols-outlined text-2xl">document_scanner</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-black dark:text-white flex items-center gap-2">
                Bill & Receipt Scanner
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isDeviceOnline() ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {isDeviceOnline() ? 'Gemini Vision OCR' : '⚡ Offline OCR'}
                </span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Extract itemized list and auto-categorize grocery & restaurant bills
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Scanning Progress Loader */}
          {isScanning ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-blue-500/10 text-blue-500 flex items-center justify-center relative">
                <span className="material-symbols-outlined text-3xl animate-bounce">
                  document_scanner
                </span>
                <span className="absolute inset-0 rounded-3xl border-2 border-blue-500 border-t-transparent animate-spin" />
              </div>
              <div>
                <h3 className="text-base font-black text-black dark:text-white">
                  Analyzing Receipt with Gemini Vision...
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mt-1">
                  Extracting store details, line items, quantities, prices, and Need vs. Want tags
                </p>
              </div>
            </div>
          ) : !parsedResult ? (
            /* Upload / Camera Capture Screen */
            <div className="space-y-5">
              {/* Tab Selector */}
              <div className="flex bg-neutral-100 dark:bg-neutral-900 p-1 rounded-2xl gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('camera')}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'camera'
                      ? 'bg-white dark:bg-[#141B2A] text-black dark:text-white shadow-sm'
                      : 'text-neutral-500'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">photo_camera</span>
                  Camera / Upload
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('samples')}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'samples'
                      ? 'bg-white dark:bg-[#141B2A] text-black dark:text-white shadow-sm'
                      : 'text-neutral-500'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">receipt_long</span>
                  Quick Demo Bills (5)
                </button>
              </div>

              {activeTab === 'camera' ? (
                <div className="space-y-4">
                  {/* Big Upload / Dropzone Box */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-10 border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-3xl text-center bg-neutral-50 dark:bg-neutral-900/40 cursor-pointer transition group"
                  >
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                    </div>
                    <h4 className="text-sm font-black text-black dark:text-white">
                      Take Photo or Upload Receipt Image
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
                      Supports Supermarket receipts, Restaurant bills, Pharmacy slips, or Grocery lists (JPEG / PNG)
                    </p>
                  </div>

                  {/* Hidden Inputs */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {/* Quick Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="py-3 px-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black text-xs font-black flex items-center justify-center gap-2 shadow-lg hover:opacity-90 active:scale-95 transition cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">photo_camera</span>
                      Snap with Camera
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="py-3 px-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">upload_file</span>
                      Choose from Gallery
                    </button>
                  </div>
                </div>
              ) : (
                /* Sample Presets Tab */
                <div className="space-y-3">
                  <p className="text-xs text-neutral-500 font-bold">
                    Pick a realistic Indian receipt sample to test instant itemized extraction:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleSelectSample('dmart')}
                      className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 text-left bg-neutral-50 dark:bg-neutral-900/50 transition cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-black dark:text-white group-hover:text-blue-500">
                          🛒 DMart Supermarket
                        </span>
                        <span className="text-xs font-black text-neutral-800 dark:text-neutral-200">
                          ₹1,845
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1">
                        10 items • Atta, Oil, Dal, Detergent, Cadbury, Butter
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectSample('restaurant')}
                      className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 text-left bg-neutral-50 dark:bg-neutral-900/50 transition cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-black dark:text-white group-hover:text-blue-500">
                          🍛 Saravana Bhavan
                        </span>
                        <span className="text-xs font-black text-neutral-800 dark:text-neutral-200">
                          ₹680
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1">
                        5 items • Ghee Podi Dosa, Vada, Filter Coffee, Jamun
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectSample('pharmacy')}
                      className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 text-left bg-neutral-50 dark:bg-neutral-900/50 transition cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-black dark:text-white group-hover:text-blue-500">
                          💊 Apollo Pharmacy
                        </span>
                        <span className="text-xs font-black text-neutral-800 dark:text-neutral-200">
                          ₹940
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1">
                        7 items • Dolo 650, Shelcal, Becosules, Protein bar
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectSample('starbucks')}
                      className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 text-left bg-neutral-50 dark:bg-neutral-900/50 transition cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-black dark:text-white group-hover:text-blue-500">
                          ☕ Starbucks Coffee
                        </span>
                        <span className="text-xs font-black text-neutral-800 dark:text-neutral-200">
                          ₹760
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1">
                        3 items • Java Chip Frappuccino, Latte, Cookie
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectSample('fuel')}
                      className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 text-left bg-neutral-50 dark:bg-neutral-900/50 transition cursor-pointer group sm:col-span-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-black dark:text-white group-hover:text-blue-500">
                          ⛽ Shell Petrol Station
                        </span>
                        <span className="text-xs font-black text-neutral-800 dark:text-neutral-200">
                          ₹1,500
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1">
                        1 item • Shell V-Power Petrol (14.28 Litres)
                      </p>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Parsed Receipt Review & Itemized Table */
            <div className="space-y-4">
              {/* Receipt Header Summary Card */}
              <div className="p-4 rounded-3xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase text-blue-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm font-black">verified</span>
                        Receipt Extracted
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                        {parsedResult.dateStr}
                      </span>
                    </div>

                    <input
                      type="text"
                      value={parsedResult.merchantName}
                      onChange={(e) =>
                        setParsedResult({ ...parsedResult, merchantName: e.target.value })
                      }
                      className="text-lg font-black text-black dark:text-white bg-transparent border-b border-dashed border-neutral-300 dark:border-neutral-700 focus:outline-none w-full mt-1"
                      placeholder="Merchant / Store Name"
                    />

                    {parsedResult.storeAddress && (
                      <p className="text-[11px] text-neutral-500 mt-0.5 truncate">
                        {parsedResult.storeAddress}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                      Total Bill Amount
                    </span>
                    <span className="text-xl md:text-2xl font-black text-rose-600 dark:text-rose-400">
                      {formatMoney(parsedResult.totalAmount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setParsedResult(null);
                        setImageSrc(null);
                      }}
                      className="text-[10px] text-blue-500 font-bold hover:underline block mt-1"
                    >
                      Scan Another
                    </button>
                  </div>
                </div>

                {/* Category & Location Selectors */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                  <div>
                    <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">
                      Primary Category
                    </label>
                    <select
                      value={parsedResult.primaryCategory}
                      onChange={(e) =>
                        setParsedResult({ ...parsedResult, primaryCategory: e.target.value })
                      }
                      className="w-full p-2 rounded-xl bg-white dark:bg-[#141B2A] border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-black dark:text-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">
                      Paid From (Wallet / Bank)
                    </label>
                    <select
                      value={parsedResult.locationId}
                      onChange={(e) =>
                        setParsedResult({ ...parsedResult, locationId: e.target.value })
                      }
                      className="w-full p-2 rounded-xl bg-white dark:bg-[#141B2A] border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-black dark:text-white"
                    >
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Itemized Items Breakdown Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-black uppercase text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5">
                    <span>Itemized Breakdown</span>
                    <span className="text-[11px] font-bold text-neutral-400">
                      ({parsedResult.items.filter((it) => it.selected !== false).length} of{' '}
                      {parsedResult.items.length} selected)
                    </span>
                  </h3>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Add Item
                  </button>
                </div>

                <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden divide-y divide-neutral-200 dark:divide-neutral-800">
                  {parsedResult.items.map((item) => {
                    const isSelected = item.selected !== false;
                    return (
                      <div
                        key={item.id}
                        className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                          isSelected ? 'bg-transparent' : 'opacity-40 bg-neutral-100 dark:bg-neutral-950'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleItem(item.id)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />

                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => {
                                const newItems = parsedResult.items.map((it) =>
                                  it.id === item.id ? { ...it, name: e.target.value } : it
                                );
                                setParsedResult({ ...parsedResult, items: newItems });
                              }}
                              className="text-xs font-black text-black dark:text-white bg-transparent focus:outline-none w-full truncate"
                            />
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-neutral-400 font-bold">
                                Qty: {item.quantity || 1}
                              </span>
                              <span className="text-[10px] text-neutral-400">•</span>
                              <button
                                type="button"
                                onClick={() => handleToggleNeedWant(item.id)}
                                className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded transition cursor-pointer ${
                                  item.needWant === 'Need'
                                    ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                                }`}
                              >
                                {item.needWant}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Price & Delete */}
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <input
                              type="number"
                              value={item.totalPrice || ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const newItems = parsedResult.items.map((it) =>
                                  it.id === item.id ? { ...it, totalPrice: val } : it
                                );
                                const newTotal = newItems
                                  .filter((it) => it.selected !== false)
                                  .reduce((s, it) => s + it.totalPrice, 0);
                                setParsedResult({
                                  ...parsedResult,
                                  items: newItems,
                                  totalAmount: newTotal,
                                });
                              }}
                              className="w-16 p-1 text-right text-xs font-black text-black dark:text-white bg-white dark:bg-[#141B2A] border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 text-neutral-400 hover:text-rose-500 transition cursor-pointer"
                            title="Remove item"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveSingleExpense}
                    className="py-3 px-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-black text-xs shadow-xl hover:opacity-90 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base font-black">bolt</span>
                    1-Tap Save Full Bill ({formatMoney(parsedResult.totalAmount)})
                  </button>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveSplitItems}
                    className="py-3 px-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">call_split</span>
                    Split & Save Items ({parsedResult.items.filter((it) => it.selected !== false).length})
                  </button>
                </div>

                {onSelectForEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectForEdit(parsedResult);
                      onClose();
                    }}
                    className="w-full py-2 text-center text-xs font-bold text-neutral-500 hover:text-black dark:hover:text-white cursor-pointer transition"
                  >
                    Edit in Manual Form →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-neutral-50 dark:bg-neutral-900/60 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-blue-500">auto_awesome</span>
            Google Gemini Vision Multimodal OCR
          </div>

          <button
            type="button"
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
