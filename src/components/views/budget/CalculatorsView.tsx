import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  calculateEmi,
  generateAmortizationSchedule,
  calculateSip,
  calculateGoalSip,
  calculateLumpSum,
} from '../../../utils/calculators';

export const CalculatorsView: React.FC = () => {
  const { formatMoney, getCurrencySymbol, showToast } = useApp();

  const [activeCalc, setActiveCalc] = useState<'emi' | 'sip' | 'goal' | 'lumpsum'>('emi');

  // ==========================================
  // 1. LOAN EMI CALCULATOR STATES
  // ==========================================
  const [loanAmount, setLoanAmount] = useState<number>(800000); // 8 Lakhs (Car Loan default)
  const [interestRate, setInterestRate] = useState<number>(8.5); // 8.5% p.a.
  const [tenureYears, setTenureYears] = useState<number>(5); // 5 years
  const [showAmortization, setShowAmortization] = useState<boolean>(false);

  const emiResult = calculateEmi(loanAmount, interestRate, tenureYears);
  const amortizationSchedule = generateAmortizationSchedule(loanAmount, interestRate, tenureYears);

  // ==========================================
  // 2. SIP WEALTH CALCULATOR STATES
  // ==========================================
  const [sipMonthly, setSipMonthly] = useState<number>(5000); // ₹5,000 / month
  const [sipReturnRate, setSipReturnRate] = useState<number>(12); // 12% p.a.
  const [sipYears, setSipYears] = useState<number>(15); // 15 years
  const [isStepUpEnabled, setIsStepUpEnabled] = useState<boolean>(false);
  const [stepUpRate, setStepUpRate] = useState<number>(10); // 10% annual step-up

  const sipResult = calculateSip(
    sipMonthly,
    sipReturnRate,
    sipYears,
    isStepUpEnabled ? stepUpRate : 0
  );

  // ==========================================
  // 3. GOAL PLANNER CALCULATOR STATES
  // ==========================================
  const [goalTargetAmount, setGoalTargetAmount] = useState<number>(1500000); // ₹15 Lakhs
  const [goalYears, setGoalYears] = useState<number>(3); // 3 years
  const [goalReturnRate, setGoalReturnRate] = useState<number>(12); // 12% p.a.

  const goalResult = calculateGoalSip(goalTargetAmount, goalYears, goalReturnRate);

  // ==========================================
  // 4. LUMP SUM CALCULATOR STATES
  // ==========================================
  const [lumpSumAmount, setLumpSumAmount] = useState<number>(100000); // ₹1 Lakh
  const [lumpSumRate, setLumpSumRate] = useState<number>(11); // 11% p.a.
  const [lumpSumYears, setLumpSumYears] = useState<number>(10); // 10 years

  const lumpSumResult = calculateLumpSum(lumpSumAmount, lumpSumRate, lumpSumYears);

  // Preset Handlers
  const applyEmiPreset = (p: number, r: number, y: number, name: string) => {
    setLoanAmount(p);
    setInterestRate(r);
    setTenureYears(y);
    showToast(`Loaded ${name} preset`);
  };

  const applySipPreset = (m: number, r: number, y: number, name: string) => {
    setSipMonthly(m);
    setSipReturnRate(r);
    setSipYears(y);
    showToast(`Loaded ${name} preset`);
  };

  const applyGoalPreset = (t: number, y: number, name: string) => {
    setGoalTargetAmount(t);
    setGoalYears(y);
    showToast(`Loaded ${name} goal preset`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Sub-navigation Tabs */}
      <div className="flex bg-neutral-100 dark:bg-[#141B2A] p-1.5 rounded-2xl border border-neutral-200 dark:border-[#243048] max-w-2xl overflow-x-auto gap-1">
        <button
          type="button"
          onClick={() => setActiveCalc('emi')}
          className={`flex-1 min-w-[120px] py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeCalc === 'emi'
              ? 'bg-white dark:bg-[#243048] text-black dark:text-white shadow-sm'
              : 'text-neutral-500'
          }`}
        >
          <span className="material-symbols-outlined text-base">directions_car</span>
          Loan EMI
        </button>

        <button
          type="button"
          onClick={() => setActiveCalc('sip')}
          className={`flex-1 min-w-[120px] py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeCalc === 'sip'
              ? 'bg-white dark:bg-[#243048] text-black dark:text-white shadow-sm'
              : 'text-neutral-500'
          }`}
        >
          <span className="material-symbols-outlined text-base">trending_up</span>
          SIP Wealth
        </button>

        <button
          type="button"
          onClick={() => setActiveCalc('goal')}
          className={`flex-1 min-w-[120px] py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeCalc === 'goal'
              ? 'bg-white dark:bg-[#243048] text-black dark:text-white shadow-sm'
              : 'text-neutral-500'
          }`}
        >
          <span className="material-symbols-outlined text-base">flag</span>
          Goal Planner
        </button>

        <button
          type="button"
          onClick={() => setActiveCalc('lumpsum')}
          className={`flex-1 min-w-[120px] py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeCalc === 'lumpsum'
              ? 'bg-white dark:bg-[#243048] text-black dark:text-white shadow-sm'
              : 'text-neutral-500'
          }`}
        >
          <span className="material-symbols-outlined text-base">savings</span>
          Lump Sum
        </button>
      </div>

      {/* =========================================================================
          CALCULATOR 1: LOAN EMI (CAR / HOME / PERSONAL)
          ========================================================================= */}
      {activeCalc === 'emi' && (
        <div className="space-y-6">
          {/* Quick Presets */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-[11px] font-black uppercase text-neutral-400 shrink-0">
              Presets:
            </span>
            <button
              type="button"
              onClick={() => applyEmiPreset(800000, 8.5, 5, 'Car Loan')}
              className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:border-blue-500 transition cursor-pointer shrink-0"
            >
              🚗 Car Loan (8.5%, 5 yrs)
            </button>
            <button
              type="button"
              onClick={() => applyEmiPreset(4500000, 8.75, 20, 'Home Loan')}
              className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:border-blue-500 transition cursor-pointer shrink-0"
            >
              🏠 Home Loan (8.75%, 20 yrs)
            </button>
            <button
              type="button"
              onClick={() => applyEmiPreset(300000, 12, 3, 'Personal Loan')}
              className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:border-blue-500 transition cursor-pointer shrink-0"
            >
              💳 Personal Loan (12%, 3 yrs)
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Controls (Left Column) */}
            <div className="lg:col-span-7 bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl p-6 space-y-5">
              {/* 1. Loan Amount */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase tracking-wider text-neutral-500">
                    Loan Principal Amount
                  </label>
                  <div className="flex items-center gap-1 font-black text-black dark:text-white bg-white dark:bg-[#1C263A] px-3 py-1 rounded-xl border border-neutral-200 dark:border-[#2E3C56]">
                    <span className="text-xs">{getCurrencySymbol()}</span>
                    <input
                      type="number"
                      step="10000"
                      min="10000"
                      max="100000000"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Math.max(0, Number(e.target.value)))}
                      className="w-28 text-right text-sm font-black bg-transparent focus:outline-none"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="10000000"
                  step="25000"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full accent-blue-600 h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-bold text-neutral-400">
                  <span>₹50 K</span>
                  <span>₹50 Lakhs</span>
                  <span>₹1 Crore</span>
                </div>
              </div>

              {/* 2. Interest Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase tracking-wider text-neutral-500">
                    Interest Rate (% per annum)
                  </label>
                  <div className="flex items-center gap-1 font-black text-black dark:text-white bg-white dark:bg-[#1C263A] px-3 py-1 rounded-xl border border-neutral-200 dark:border-[#2E3C56]">
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="30"
                      value={interestRate}
                      onChange={(e) => setInterestRate(Math.max(0, Number(e.target.value)))}
                      className="w-16 text-right text-sm font-black bg-transparent focus:outline-none"
                    />
                    <span className="text-xs">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="5"
                  max="25"
                  step="0.25"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full accent-blue-600 h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-bold text-neutral-400">
                  <span>5% (Subsidized)</span>
                  <span>10% (Average)</span>
                  <span>25% (High)</span>
                </div>
              </div>

              {/* 3. Loan Tenure */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase tracking-wider text-neutral-500">
                    Loan Tenure (Years)
                  </label>
                  <div className="flex items-center gap-1 font-black text-black dark:text-white bg-white dark:bg-[#1C263A] px-3 py-1 rounded-xl border border-neutral-200 dark:border-[#2E3C56]">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      max="30"
                      value={tenureYears}
                      onChange={(e) => setTenureYears(Math.max(1, Number(e.target.value)))}
                      className="w-12 text-right text-sm font-black bg-transparent focus:outline-none"
                    />
                    <span className="text-xs">Yrs ({tenureYears * 12}M)</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={tenureYears}
                  onChange={(e) => setTenureYears(Number(e.target.value))}
                  className="w-full accent-blue-600 h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-bold text-neutral-400">
                  <span>1 Year</span>
                  <span>15 Years</span>
                  <span>30 Years</span>
                </div>
              </div>
            </div>

            {/* Results & Breakdown (Right Column) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Monthly EMI Big Card */}
              <div className="p-6 rounded-3xl bg-blue-600 text-white shadow-xl space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-200 block">
                  Monthly Loan EMI Payable
                </span>
                <span className="text-3xl sm:text-4xl font-black block tabular-nums">
                  {formatMoney(emiResult.monthlyEmi)}
                </span>
                <span className="text-xs text-blue-100 block">
                  For {tenureYears * 12} monthly installments
                </span>
              </div>

              {/* Financial Totals Card */}
              <div className="p-5 rounded-3xl bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-neutral-500">Principal Loan Amount:</span>
                  <span className="font-black text-black dark:text-white">
                    {formatMoney(loanAmount)} ({emiResult.principalPercentage}%)
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-neutral-500">Total Interest Payable:</span>
                  <span className="font-black text-rose-600 dark:text-rose-400">
                    {formatMoney(emiResult.totalInterest)} ({emiResult.interestPercentage}%)
                  </span>
                </div>

                <div className="pt-2 border-t border-neutral-200 dark:border-[#2E3C56] flex justify-between items-center text-sm font-black">
                  <span className="text-black dark:text-white">Total Amount (P + I):</span>
                  <span className="text-black dark:text-white">
                    {formatMoney(emiResult.totalPayment)}
                  </span>
                </div>

                {/* Progress ratio bar */}
                <div className="h-3 w-full bg-rose-500 rounded-full overflow-hidden flex">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300"
                    style={{ width: `${emiResult.principalPercentage}%` }}
                    title={`Principal: ${emiResult.principalPercentage}%`}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-blue-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    Principal ({emiResult.principalPercentage}%)
                  </span>
                  <span className="text-rose-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Interest ({emiResult.interestPercentage}%)
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAmortization(!showAmortization)}
                className="w-full py-2.5 px-4 rounded-2xl bg-neutral-100 dark:bg-[#1C263A] hover:bg-neutral-200 dark:hover:bg-[#243048] text-xs font-bold text-black dark:text-white transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">
                  {showAmortization ? 'expand_less' : 'table_chart'}
                </span>
                {showAmortization ? 'Hide Amortization Table' : 'View Year-wise Amortization Schedule'}
              </button>
            </div>
          </div>

          {/* Collapsible Amortization Table */}
          {showAmortization && (
            <div className="bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl p-5 space-y-3 animate-fadeIn">
              <h3 className="text-sm font-black text-black dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500 text-base">table_rows</span>
                Year-by-Year Loan Amortization Schedule
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-[#2E3C56] text-neutral-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Year</th>
                      <th className="py-2.5 px-3">Opening Balance</th>
                      <th className="py-2.5 px-3">Principal Paid</th>
                      <th className="py-2.5 px-3">Interest Paid</th>
                      <th className="py-2.5 px-3">Total Paid</th>
                      <th className="py-2.5 px-3">Closing Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-[#243048] font-bold">
                    {amortizationSchedule.map((row) => (
                      <tr key={row.year} className="hover:bg-black/5 dark:hover:bg-white/5">
                        <td className="py-2.5 px-3 font-black">Year {row.year}</td>
                        <td className="py-2.5 px-3">{formatMoney(row.openingBalance)}</td>
                        <td className="py-2.5 px-3 text-blue-600 dark:text-blue-400">
                          {formatMoney(row.principalPaid)}
                        </td>
                        <td className="py-2.5 px-3 text-rose-600 dark:text-rose-400">
                          {formatMoney(row.interestPaid)}
                        </td>
                        <td className="py-2.5 px-3 text-black dark:text-white">
                          {formatMoney(row.totalPaid)}
                        </td>
                        <td className="py-2.5 px-3 font-black">
                          {formatMoney(row.closingBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          CALCULATOR 2: SIP WEALTH PROJECTOR
          ========================================================================= */}
      {activeCalc === 'sip' && (
        <div className="space-y-6">
          {/* Quick Presets */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-[11px] font-black uppercase text-neutral-400 shrink-0">
              Presets:
            </span>
            <button
              type="button"
              onClick={() => applySipPreset(5000, 12, 15, 'Nifty 50 Index')}
              className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:border-emerald-500 transition cursor-pointer shrink-0"
            >
              📈 Nifty 50 Index (₹5K @ 12%, 15 yrs)
            </button>
            <button
              type="button"
              onClick={() => applySipPreset(10000, 14, 20, 'Wealth Creator')}
              className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:border-emerald-500 transition cursor-pointer shrink-0"
            >
              🚀 Aggressive Equity (₹10K @ 14%, 20 yrs)
            </button>
            <button
              type="button"
              onClick={() => applySipPreset(3000, 8, 10, 'Conservative Balanced')}
              className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:border-emerald-500 transition cursor-pointer shrink-0"
            >
              🛡️ Safe Balanced (₹3K @ 8%, 10 yrs)
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Controls */}
            <div className="lg:col-span-7 bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl p-6 space-y-5">
              {/* 1. Monthly Investment */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase tracking-wider text-neutral-500">
                    Monthly Investment Amount
                  </label>
                  <div className="flex items-center gap-1 font-black text-black dark:text-white bg-white dark:bg-[#1C263A] px-3 py-1 rounded-xl border border-neutral-200 dark:border-[#2E3C56]">
                    <span className="text-xs">{getCurrencySymbol()}</span>
                    <input
                      type="number"
                      step="500"
                      min="500"
                      max="1000000"
                      value={sipMonthly}
                      onChange={(e) => setSipMonthly(Math.max(0, Number(e.target.value)))}
                      className="w-24 text-right text-sm font-black bg-transparent focus:outline-none"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="500"
                  max="100000"
                  step="500"
                  value={sipMonthly}
                  onChange={(e) => setSipMonthly(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-bold text-neutral-400">
                  <span>₹500</span>
                  <span>₹50,000</span>
                  <span>₹1 Lakh / mo</span>
                </div>
              </div>

              {/* 2. Expected Return Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase tracking-wider text-neutral-500">
                    Expected Return Rate (% p.a.)
                  </label>
                  <div className="flex items-center gap-1 font-black text-black dark:text-white bg-white dark:bg-[#1C263A] px-3 py-1 rounded-xl border border-neutral-200 dark:border-[#2E3C56]">
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="30"
                      value={sipReturnRate}
                      onChange={(e) => setSipReturnRate(Math.max(0, Number(e.target.value)))}
                      className="w-16 text-right text-sm font-black bg-transparent focus:outline-none"
                    />
                    <span className="text-xs">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="6"
                  max="24"
                  step="0.5"
                  value={sipReturnRate}
                  onChange={(e) => setSipReturnRate(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-bold text-neutral-400">
                  <span>6% (FD)</span>
                  <span>12% (Nifty Index)</span>
                  <span>20% (Aggressive)</span>
                </div>
              </div>

              {/* 3. Time Horizon */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase tracking-wider text-neutral-500">
                    Investment Period (Years)
                  </label>
                  <div className="flex items-center gap-1 font-black text-black dark:text-white bg-white dark:bg-[#1C263A] px-3 py-1 rounded-xl border border-neutral-200 dark:border-[#2E3C56]">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      max="40"
                      value={sipYears}
                      onChange={(e) => setSipYears(Math.max(1, Number(e.target.value)))}
                      className="w-12 text-right text-sm font-black bg-transparent focus:outline-none"
                    />
                    <span className="text-xs">Years</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="35"
                  step="1"
                  value={sipYears}
                  onChange={(e) => setSipYears(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-bold text-neutral-400">
                  <span>1 Year</span>
                  <span>15 Years</span>
                  <span>35 Years</span>
                </div>
              </div>

              {/* 4. Step-up SIP Toggle */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-black dark:text-white block">
                      Annual Step-Up SIP (Salary Growth)
                    </span>
                    <span className="text-[10px] text-neutral-400 block">
                      Increase SIP by % every year as your income grows
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isStepUpEnabled}
                    onChange={(e) => setIsStepUpEnabled(e.target.checked)}
                    className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>

                {isStepUpEnabled && (
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <span className="text-xs font-bold text-neutral-500">Yearly Increase:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={stepUpRate}
                        onChange={(e) => setStepUpRate(Number(e.target.value))}
                        className="w-14 p-1 text-right text-xs font-black bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg"
                      />
                      <span className="text-xs font-bold">% / year</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Results Display */}
            <div className="lg:col-span-5 space-y-4">
              {/* Total Maturity Value */}
              <div className="p-6 rounded-3xl bg-emerald-600 text-white shadow-xl space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                    Expected Future Maturity Value
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/20 text-white">
                    {sipResult.wealthMultiplier}x Wealth
                  </span>
                </div>
                <span className="text-3xl sm:text-4xl font-black block tabular-nums">
                  {formatMoney(sipResult.totalMaturityValue)}
                </span>
                <span className="text-xs text-emerald-100 block">
                  Inflation-adjusted real value: {formatMoney(sipResult.inflationAdjustedValue)} (at 6% inflation)
                </span>
              </div>

              {/* Breakdown Cards */}
              <div className="p-5 rounded-3xl bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-neutral-500">Invested Capital:</span>
                  <span className="font-black text-black dark:text-white">
                    {formatMoney(sipResult.totalInvested)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-neutral-500">Estimated Returns (Wealth Gain):</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    +{formatMoney(sipResult.estimatedReturns)}
                  </span>
                </div>

                {/* Progress ratio bar */}
                <div className="h-3 w-full bg-emerald-500 rounded-full overflow-hidden flex">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300"
                    style={{
                      width: `${
                        sipResult.totalMaturityValue > 0
                          ? Math.round(
                              (sipResult.totalInvested / sipResult.totalMaturityValue) * 100
                            )
                          : 100
                      }%`,
                    }}
                  />
                </div>

                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-blue-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    Invested Amount
                  </span>
                  <span className="text-emerald-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Estimated Profit
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CALCULATOR 3: GOAL PLANNER
          ========================================================================= */}
      {activeCalc === 'goal' && (
        <div className="space-y-6">
          {/* Quick Presets */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-[11px] font-black uppercase text-neutral-400 shrink-0">
              Presets:
            </span>
            <button
              type="button"
              onClick={() => applyGoalPreset(1200000, 3, 'Buy a Car')}
              className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:border-purple-500 transition cursor-pointer shrink-0"
            >
              🚗 Buy a Car (₹12L in 3 yrs)
            </button>
            <button
              type="button"
              onClick={() => applyGoalPreset(2500000, 5, 'Home Down Payment')}
              className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:border-purple-500 transition cursor-pointer shrink-0"
            >
              🏠 Home Down Payment (₹25L in 5 yrs)
            </button>
            <button
              type="button"
              onClick={() => applyGoalPreset(4000000, 10, 'Child Education')}
              className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:border-purple-500 transition cursor-pointer shrink-0"
            >
              🎓 Child Higher Education (₹40L in 10 yrs)
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl p-6 space-y-5">
              {/* Target Goal Amount */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase tracking-wider text-neutral-500">
                    Target Goal Amount
                  </label>
                  <div className="flex items-center gap-1 font-black text-black dark:text-white bg-white dark:bg-[#1C263A] px-3 py-1 rounded-xl border border-neutral-200 dark:border-[#2E3C56]">
                    <span className="text-xs">{getCurrencySymbol()}</span>
                    <input
                      type="number"
                      step="50000"
                      min="10000"
                      value={goalTargetAmount}
                      onChange={(e) => setGoalTargetAmount(Math.max(0, Number(e.target.value)))}
                      className="w-28 text-right text-sm font-black bg-transparent focus:outline-none"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="10000000"
                  step="50000"
                  value={goalTargetAmount}
                  onChange={(e) => setGoalTargetAmount(Number(e.target.value))}
                  className="w-full accent-purple-600 h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Timeframe */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase tracking-wider text-neutral-500">
                    Target Timeframe (Years)
                  </label>
                  <div className="flex items-center gap-1 font-black text-black dark:text-white bg-white dark:bg-[#1C263A] px-3 py-1 rounded-xl border border-neutral-200 dark:border-[#2E3C56]">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      max="30"
                      value={goalYears}
                      onChange={(e) => setGoalYears(Math.max(1, Number(e.target.value)))}
                      className="w-12 text-right text-sm font-black bg-transparent focus:outline-none"
                    />
                    <span className="text-xs">Yrs</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="25"
                  step="1"
                  value={goalYears}
                  onChange={(e) => setGoalYears(Number(e.target.value))}
                  className="w-full accent-purple-600 h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Expected Return Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase tracking-wider text-neutral-500">
                    Expected Investment Return (% p.a.)
                  </label>
                  <div className="flex items-center gap-1 font-black text-black dark:text-white bg-white dark:bg-[#1C263A] px-3 py-1 rounded-xl border border-neutral-200 dark:border-[#2E3C56]">
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="30"
                      value={goalReturnRate}
                      onChange={(e) => setGoalReturnRate(Math.max(0, Number(e.target.value)))}
                      className="w-14 text-right text-sm font-black bg-transparent focus:outline-none"
                    />
                    <span className="text-xs">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="4"
                  max="20"
                  step="0.5"
                  value={goalReturnRate}
                  onChange={(e) => setGoalReturnRate(Number(e.target.value))}
                  className="w-full accent-purple-600 h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Goal Output Display */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-6 rounded-3xl bg-purple-600 text-white shadow-xl space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-200 block">
                  Required Monthly SIP Savings
                </span>
                <span className="text-3xl sm:text-4xl font-black block tabular-nums">
                  {formatMoney(goalResult.requiredMonthlySavings)} / mo
                </span>
                <span className="text-xs text-purple-100 block">
                  Invest monthly for {goalYears} years to reach {formatMoney(goalTargetAmount)}
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-neutral-500">Your Total Investment:</span>
                  <span className="font-black text-black dark:text-white">
                    {formatMoney(goalResult.totalInvestment)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-neutral-500">Compounding Interest Gain:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    +{formatMoney(goalResult.interestBenefit)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CALCULATOR 4: LUMP SUM COMPOUND INTEREST
          ========================================================================= */}
      {activeCalc === 'lumpsum' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl p-6 space-y-5">
              {/* Initial Deposit */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase tracking-wider text-neutral-500">
                    One-Time Deposit Amount
                  </label>
                  <div className="flex items-center gap-1 font-black text-black dark:text-white bg-white dark:bg-[#1C263A] px-3 py-1 rounded-xl border border-neutral-200 dark:border-[#2E3C56]">
                    <span className="text-xs">{getCurrencySymbol()}</span>
                    <input
                      type="number"
                      step="10000"
                      min="1000"
                      value={lumpSumAmount}
                      onChange={(e) => setLumpSumAmount(Math.max(0, Number(e.target.value)))}
                      className="w-28 text-right text-sm font-black bg-transparent focus:outline-none"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="5000000"
                  step="10000"
                  value={lumpSumAmount}
                  onChange={(e) => setLumpSumAmount(Number(e.target.value))}
                  className="w-full accent-amber-500 h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Interest Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase tracking-wider text-neutral-500">
                    Annual Compound Rate (%)
                  </label>
                  <div className="flex items-center gap-1 font-black text-black dark:text-white bg-white dark:bg-[#1C263A] px-3 py-1 rounded-xl border border-neutral-200 dark:border-[#2E3C56]">
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="30"
                      value={lumpSumRate}
                      onChange={(e) => setLumpSumRate(Math.max(0, Number(e.target.value)))}
                      className="w-14 text-right text-sm font-black bg-transparent focus:outline-none"
                    />
                    <span className="text-xs">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="4"
                  max="20"
                  step="0.5"
                  value={lumpSumRate}
                  onChange={(e) => setLumpSumRate(Number(e.target.value))}
                  className="w-full accent-amber-500 h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Tenure */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase tracking-wider text-neutral-500">
                    Tenure (Years)
                  </label>
                  <div className="flex items-center gap-1 font-black text-black dark:text-white bg-white dark:bg-[#1C263A] px-3 py-1 rounded-xl border border-neutral-200 dark:border-[#2E3C56]">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      max="30"
                      value={lumpSumYears}
                      onChange={(e) => setLumpSumYears(Math.max(1, Number(e.target.value)))}
                      className="w-12 text-right text-sm font-black bg-transparent focus:outline-none"
                    />
                    <span className="text-xs">Yrs</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={lumpSumYears}
                  onChange={(e) => setLumpSumYears(Number(e.target.value))}
                  className="w-full accent-amber-500 h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Output */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-6 rounded-3xl bg-amber-600 text-white shadow-xl space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-200">
                    Future Maturity Value
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/20 text-white">
                    {lumpSumResult.wealthMultiplier}x
                  </span>
                </div>
                <span className="text-3xl sm:text-4xl font-black block tabular-nums">
                  {formatMoney(lumpSumResult.maturityAmount)}
                </span>
                <span className="text-xs text-amber-100 block">
                  Inflation-adjusted real value: {formatMoney(lumpSumResult.inflationAdjustedValue)}
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-neutral-500">Initial Deposit:</span>
                  <span className="font-black text-black dark:text-white">
                    {formatMoney(lumpSumAmount)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-neutral-500">Total Interest Earned:</span>
                  <span className="font-black text-amber-600 dark:text-amber-400">
                    +{formatMoney(lumpSumResult.totalInterest)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
