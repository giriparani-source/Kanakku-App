/**
 * AiBudgetCoach.tsx
 * AI-Powered Budget Coach using Google Gemini API
 * Falls back gracefully to local rule-based tips if no API key is configured
 */

import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useApp } from '../../context/AppContext';
import { ExpenseTransaction } from '../../types';

// ── Tip category type ──────────────────────────────────────────────────────────
interface LocalTip {
  icon: string;
  color: string;
  title: string;
  body: string;
}

// ── Local fallback tip engine ─────────────────────────────────────────────────
const generateLocalTips = (
  savingsRate: number,
  wantPct: number,
  topCategory: string,
  topCategoryAmount: number,
  netFlow: number,
  formatMoney: (n: number) => string
): LocalTip[] => {
  const tips: LocalTip[] = [];

  if (savingsRate < 0) {
    tips.push({
      icon: 'warning',
      color: '#FF2D55',
      title: '🚨 Deficit Alert!',
      body: `You're spending more than you earn (${formatMoney(Math.abs(netFlow))} deficit). Cut non-essentials immediately.`,
    });
  } else if (savingsRate < 10) {
    tips.push({
      icon: 'savings',
      color: '#FF9500',
      title: '⚠️ Low Savings Rate',
      body: `Only ${Math.round(savingsRate)}% savings. Financial experts recommend at least 20%. Try the 24-hour rule before purchases.`,
    });
  } else if (savingsRate >= 20) {
    tips.push({
      icon: 'emoji_events',
      color: '#00C853',
      title: '🏆 Excellent Saver!',
      body: `${Math.round(savingsRate)}% savings rate — you're crushing it! Consider investing the surplus in SIPs or FDs.`,
    });
  }

  if (wantPct > 40) {
    tips.push({
      icon: 'psychology',
      color: '#FF6B00',
      title: '🛍️ Lifestyle Spending High',
      body: `${Math.round(wantPct)}% of expenses are "wants". Apply the 50/30/20 rule — keep wants ≤30% of spending.`,
    });
  }

  if (topCategory && topCategoryAmount > 0) {
    tips.push({
      icon: 'trending_up',
      color: '#0066FF',
      title: `📊 Top Spend: ${topCategory}`,
      body: `You spent ${formatMoney(topCategoryAmount)} on ${topCategory}. Review if there's room to negotiate or reduce this category.`,
    });
  }

  tips.push({
    icon: 'lightbulb',
    color: '#FF9500',
    title: '💡 Pro Tip: Emergency Fund',
    body: 'Build 3–6 months of expenses as an emergency fund before investing. This protects you from unexpected financial shocks.',
  });

  if (tips.length < 3) {
    tips.push({
      icon: 'auto_graph',
      color: '#00BFA5',
      title: '📈 Stay Consistent',
      body: 'Log every transaction — even small ones. Awareness is the first step to financial freedom. Keep tracking!',
    });
  }

  return tips;
};

// ── Gemini prompt builder ─────────────────────────────────────────────────────
const buildGeminiPrompt = (
  userName: string,
  totalIncome: number,
  totalExpenses: number,
  savingsRate: number,
  netFlow: number,
  needPct: number,
  wantPct: number,
  topCategories: { name: string; amount: number; percentage: number }[],
  currencySymbol: string
): string => `
You are Kanakku AI — a friendly, expert personal finance coach for Indian users.

Analyze this user's financial data and provide 4–5 personalized, actionable tips.

USER: ${userName}
CURRENCY: ${currencySymbol}
TOTAL INCOME: ${currencySymbol}${totalIncome.toFixed(2)}
TOTAL EXPENSES: ${currencySymbol}${totalExpenses.toFixed(2)}
NET SAVINGS: ${currencySymbol}${netFlow.toFixed(2)}
SAVINGS RATE: ${savingsRate.toFixed(1)}%
NEEDS SPENDING: ${needPct.toFixed(0)}%
WANTS SPENDING: ${wantPct.toFixed(0)}%
TOP SPENDING CATEGORIES:
${topCategories.map((c, i) => `  ${i + 1}. ${c.name}: ${currencySymbol}${c.amount.toFixed(2)} (${c.percentage}%)`).join('\n')}

INSTRUCTIONS:
- Give exactly 4–5 tips. Each tip MUST start with a relevant emoji.
- Be specific — use the actual numbers from the data above.
- Format each tip as: **💡 Tip Title** followed by 1–2 sentences.
- Keep language simple, encouraging, and actionable.
- Reference Indian financial context where relevant (SIP, FD, UPI, EMI, etc.).
- If savings rate ≥ 20%, celebrate it enthusiastically. If negative, be supportive but direct.
- End with one motivational closing line.
- Do NOT use bullet points or dashes. Use numbered list (1. 2. 3. etc.)
`.trim();

export const AiBudgetCoach: React.FC = () => {
  const {
    profile,
    transactions,
    totalReceived,
    totalExpenses,
    needAmount,
    wantAmount,
    spendingByCategory,
    formatMoney,
    getCurrencySymbol,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [useLocalFallback, setUseLocalFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currencySymbol = getCurrencySymbol();
  const netFlow = totalReceived - totalExpenses;
  const savingsRate = totalReceived > 0 ? (netFlow / totalReceived) * 100 : 0;
  const totalExp = needAmount + wantAmount;
  const needPct = totalExp > 0 ? (needAmount / totalExp) * 100 : 50;
  const wantPct = totalExp > 0 ? (wantAmount / totalExp) * 100 : 50;

  const topCategory = spendingByCategory[0]?.name || '';
  const topCategoryAmount = spendingByCategory[0]?.amount || 0;

  const localTips = useMemo(() =>
    generateLocalTips(savingsRate, wantPct, topCategory, topCategoryAmount, netFlow, formatMoney),
    [savingsRate, wantPct, topCategory, topCategoryAmount, netFlow, formatMoney]
  );

  const handleGetAdvice = async () => {
    if (isOpen && aiResponse) {
      setIsOpen(false);
      return;
    }
    setIsOpen(true);
    if (aiResponse) return; // already fetched

    setIsLoading(true);
    setError(null);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      // Graceful fallback — no API key
      await new Promise((r) => setTimeout(r, 800)); // simulate loading
      setUseLocalFallback(true);
      setIsLoading(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = buildGeminiPrompt(
        profile.name || 'User',
        totalReceived,
        totalExpenses,
        savingsRate,
        netFlow,
        needPct,
        wantPct,
        spendingByCategory.slice(0, 4),
        currencySymbol
      );

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });

      const text = response.text ?? '';
      setAiResponse(text);
      setUseLocalFallback(false);
    } catch (err: any) {
      console.error('Gemini API error:', err);
      setUseLocalFallback(true); // fallback gracefully
    } finally {
      setIsLoading(false);
    }
  };

  // Format Gemini markdown-style response into readable JSX
  const renderAiResponse = (text: string) => {
    return text.split('\n').filter(Boolean).map((line, i) => {
      const isBold = line.includes('**');
      const cleaned = line.replace(/\*\*/g, '');
      return (
        <p key={i} className={`text-sm leading-relaxed ${isBold ? 'font-black text-black dark:text-white mt-3 first:mt-0' : 'font-semibold text-neutral-600 dark:text-neutral-400'}`}>
          {cleaned}
        </p>
      );
    });
  };

  return (
    <div className="bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl overflow-hidden shadow-sm">
      {/* ── Header / Trigger Button ──────────────────────────────────────────── */}
      <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md bg-gradient-to-br from-violet-500 to-purple-700">
            <span className="material-symbols-outlined text-xl text-white font-black">
              auto_awesome
            </span>
          </div>
          <div>
            <h3 className="text-base font-black text-black dark:text-white tracking-tight">
              AI Budget Coach
            </h3>
            <p className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mt-0.5">
              {import.meta.env.VITE_GEMINI_API_KEY && import.meta.env.VITE_GEMINI_API_KEY !== 'your_gemini_api_key_here'
                ? 'Powered by Gemini AI — personalized advice from your real data'
                : 'Smart financial tips based on your spending patterns'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGetAdvice}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white text-sm font-black shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-70 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 shrink-0"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analyzing…
            </>
          ) : isOpen ? (
            <>
              <span className="material-symbols-outlined text-base">expand_less</span>
              Close
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-base">auto_awesome</span>
              Get Advice
            </>
          )}
        </button>
      </div>

      {/* ── Expanded Panel ────────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="border-t border-neutral-200 dark:border-[#243048] animate-fadeIn">
          {/* Loading skeleton */}
          {isLoading && (
            <div className="p-6 space-y-3">
              {[90, 75, 85, 60].map((w, i) => (
                <div key={i} className="space-y-1.5">
                  <div
                    className="h-3.5 bg-neutral-200 dark:bg-[#1C263A] rounded-full animate-pulse"
                    style={{ width: `${w}%` }}
                  />
                  <div
                    className="h-3 bg-neutral-200 dark:bg-[#1C263A] rounded-full animate-pulse"
                    style={{ width: `${w - 20}%` }}
                  />
                </div>
              ))}
              <p className="text-[11px] font-black text-violet-500 dark:text-violet-400 pt-1 flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                Analyzing your financial patterns…
              </p>
            </div>
          )}

          {/* AI Response */}
          {!isLoading && !useLocalFallback && aiResponse && (
            <div className="p-6 space-y-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-violet-500 text-sm">auto_awesome</span>
                <p className="text-[11px] font-black text-violet-500 dark:text-violet-400 uppercase tracking-wider">
                  Gemini AI Analysis
                </p>
              </div>
              <div className="space-y-0.5">{renderAiResponse(aiResponse)}</div>
              <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-600 pt-4">
                AI-generated advice. Not financial advice. Always consult a professional for major decisions.
              </p>
            </div>
          )}

          {/* Local Fallback Tips */}
          {!isLoading && useLocalFallback && (
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-amber-500 text-sm">lightbulb</span>
                <p className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Smart Financial Tips
                </p>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 font-black">
                  Local Engine
                </span>
              </div>

              {localTips.map((tip, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56]"
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${tip.color}22` }}
                  >
                    <span className="material-symbols-outlined text-[16px]" style={{ color: tip.color }}>
                      {tip.icon}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-black text-black dark:text-white mb-0.5">{tip.title}</p>
                    <p className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {tip.body}
                    </p>
                  </div>
                </div>
              ))}

              <div className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
                <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                  💡 Add <code className="bg-amber-100 dark:bg-amber-900/60 px-1 rounded text-[10px]">VITE_GEMINI_API_KEY</code> in your{' '}
                  <code className="bg-amber-100 dark:bg-amber-900/60 px-1 rounded text-[10px]">.env</code> file to unlock Gemini AI-powered personalized advice!
                </p>
              </div>
            </div>
          )}

          {/* Error state */}
          {!isLoading && error && (
            <div className="p-6">
              <p className="text-xs font-bold text-rose-500">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
