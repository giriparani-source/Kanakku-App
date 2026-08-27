/**
 * HealthScoreWidget.tsx
 * Financial Health Score — animated SVG gauge (0–100)
 * Computed purely from existing AppContext data
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';

interface ScoreFactor {
  label: string;
  points: number;
  maxPoints: number;
  icon: string;
  description: string;
}

const getScoreColor = (score: number): string => {
  if (score >= 85) return '#00C853';
  if (score >= 70) return '#00BFA5';
  if (score >= 50) return '#FF9500';
  if (score >= 30) return '#FF6B00';
  return '#FF2D55';
};

const getScoreLabel = (score: number): { label: string; emoji: string } => {
  if (score >= 85) return { label: 'Excellent', emoji: '🏆' };
  if (score >= 70) return { label: 'Very Good', emoji: '🌟' };
  if (score >= 50) return { label: 'Good', emoji: '👍' };
  if (score >= 30) return { label: 'Needs Attention', emoji: '⚠️' };
  return { label: 'Critical', emoji: '🔴' };
};

export const HealthScoreWidget: React.FC = () => {
  const {
    transactions,
    totalReceived,
    totalExpenses,
    needAmount,
    wantAmount,
    spendingByCategory,
    formatMoney,
  } = useApp();

  const [isExpanded, setIsExpanded] = useState(false);

  const { score, factors } = useMemo(() => {
    const now = Date.now();
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

    // ── Factor 1: Savings Rate (0–30 pts) ────────────────────────────────────
    const netFlow = totalReceived - totalExpenses;
    const savingsRate = totalReceived > 0 ? (netFlow / totalReceived) * 100 : 0;
    let savingsPoints = 0;
    if (savingsRate >= 20) savingsPoints = 30;
    else if (savingsRate >= 10) savingsPoints = 20;
    else if (savingsRate >= 0) savingsPoints = 10;
    // negative = 0

    // ── Factor 2: Budget Discipline / Need-Want (0–20 pts) ──────────────────
    const totalExp = needAmount + wantAmount;
    const needPct = totalExp > 0 ? (needAmount / totalExp) * 100 : 50;
    let disciplinePoints = 0;
    if (needPct <= 50) disciplinePoints = 20;
    else if (needPct <= 60) disciplinePoints = 14;
    else if (needPct <= 75) disciplinePoints = 7;
    // > 75% needs = 0

    // ── Factor 3: Logging Consistency (0–20 pts) ────────────────────────────
    const recentTx = transactions.filter((t) => (t.timestamp || 0) >= monthAgo);
    let consistencyPoints = 0;
    if (recentTx.length >= 8) consistencyPoints = 20;
    else if (recentTx.length >= 4) consistencyPoints = 13;
    else if (recentTx.length >= 1) consistencyPoints = 6;

    // ── Factor 4: Positive Net Flow (0–20 pts) ───────────────────────────────
    let flowPoints = 0;
    if (totalReceived > 0 && netFlow > 0) flowPoints = 20;
    else if (totalReceived > 0 && netFlow === 0) flowPoints = 10;
    // negative = 0

    // ── Factor 5: Spending Diversification (0–10 pts) ────────────────────────
    let diversifyPoints = 0;
    const catCount = spendingByCategory.length;
    if (catCount >= 3) diversifyPoints = 10;
    else if (catCount >= 2) diversifyPoints = 6;
    else if (catCount >= 1) diversifyPoints = 3;

    const totalScore = Math.min(
      100,
      savingsPoints + disciplinePoints + consistencyPoints + flowPoints + diversifyPoints
    );

    const scoredFactors: ScoreFactor[] = [
      {
        label: 'Savings Rate',
        points: savingsPoints,
        maxPoints: 30,
        icon: 'savings',
        description: savingsRate >= 20
          ? `${Math.round(savingsRate)}% savings rate — excellent!`
          : savingsRate >= 0
          ? `${Math.round(savingsRate)}% savings. Target ≥20%.`
          : 'Expenses exceed income. Reduce spending.',
      },
      {
        label: 'Budget Discipline',
        points: disciplinePoints,
        maxPoints: 20,
        icon: 'psychology',
        description: needPct <= 50
          ? `${Math.round(needPct)}% essential needs — perfectly balanced.`
          : `${Math.round(needPct)}% on essentials. 50% is ideal.`,
      },
      {
        label: 'Log Consistency',
        points: consistencyPoints,
        maxPoints: 20,
        icon: 'edit_note',
        description: `${recentTx.length} transactions logged this month. ${recentTx.length >= 8 ? 'Great habit!' : 'Log at least 8/month.'}`,
      },
      {
        label: 'Cash Flow',
        points: flowPoints,
        maxPoints: 20,
        icon: 'trending_up',
        description: netFlow > 0
          ? `Positive flow of ${formatMoney(netFlow)} — healthy!`
          : netFlow === 0
          ? 'Breaking even. Try to save more.'
          : `Negative flow by ${formatMoney(Math.abs(netFlow))}. Critical!`,
      },
      {
        label: 'Diversification',
        points: diversifyPoints,
        maxPoints: 10,
        icon: 'donut_large',
        description: `Spending across ${catCount} categor${catCount === 1 ? 'y' : 'ies'}. ${catCount >= 3 ? 'Well tracked!' : 'Categorize more expenses.'}`,
      },
    ];

    return { score: totalScore, factors: scoredFactors };
  }, [transactions, totalReceived, totalExpenses, needAmount, wantAmount, spendingByCategory, formatMoney]);

  const scoreColor = getScoreColor(score);
  const { label, emoji } = getScoreLabel(score);

  // SVG Arc calculations
  const R = 52;
  const CX = 64;
  const CY = 64;
  const circumference = Math.PI * R; // half circle (180 degrees)
  const startAngle = 180; // 9 o'clock
  const fillLength = (score / 100) * circumference;

  // Convert to SVG arc path (half circle)
  const describeArc = (fraction: number) => {
    const angle = 180 * fraction; // 0–180 degrees of half circle
    const startRad = Math.PI; // start at 180° = left
    const endRad = Math.PI - angle * (Math.PI / 180);
    const x1 = CX + R * Math.cos(startRad);
    const y1 = CY + R * Math.sin(startRad);
    const x2 = CX + R * Math.cos(endRad);
    const y2 = CY + R * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  return (
    <div className="bg-[#F4F5F7] dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-3xl p-6 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-black text-black dark:text-white tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-lg" style={{ color: scoreColor }}>
              health_metrics
            </span>
            Financial Health Score
          </h3>
          <p className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mt-0.5">
            Based on your real spending data
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56] text-xs font-black text-black dark:text-white hover:shadow-sm transition-all cursor-pointer"
        >
          {isExpanded ? 'Less' : 'Details'}
          <span className="material-symbols-outlined text-sm">
            {isExpanded ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </div>

      {/* Main Score Area */}
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* SVG Gauge */}
        <div className="relative w-32 h-20 shrink-0">
          <svg viewBox="0 0 128 80" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF2D55" />
                <stop offset="40%" stopColor="#FF9500" />
                <stop offset="100%" stopColor="#00C853" />
              </linearGradient>
            </defs>
            {/* Track */}
            <path
              d={describeArc(1)}
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.1"
              strokeWidth="12"
              strokeLinecap="round"
              className="text-black dark:text-white"
            />
            {/* Score fill */}
            <path
              d={describeArc(score / 100)}
              fill="none"
              stroke="url(#scoreGrad)"
              strokeWidth="12"
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 1s ease-out',
              }}
            />
            {/* Score text */}
            <text x={CX} y={CY + 6} textAnchor="middle" fontSize="22" fontWeight="900" fill={scoreColor}>
              {score}
            </text>
            <text x={CX} y={CY + 18} textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor" fillOpacity="0.5" className="text-black dark:text-white">
              out of 100
            </text>
          </svg>
        </div>

        {/* Score label + factor bars */}
        <div className="flex-1 w-full space-y-2.5">
          {/* Badge */}
          <div className="flex items-center gap-2">
            <span
              className="px-3 py-1 rounded-full text-xs font-black text-white shadow-sm"
              style={{ backgroundColor: scoreColor }}
            >
              {emoji} {label}
            </span>
          </div>

          {/* Factor mini-bars */}
          <div className="space-y-1.5">
            {factors.map((f) => (
              <div key={f.label} className="flex items-center gap-2">
                <span className="text-[10px] font-black text-neutral-500 dark:text-neutral-400 w-20 shrink-0 truncate">
                  {f.label}
                </span>
                <div className="flex-1 h-1.5 bg-neutral-200 dark:bg-[#1C263A] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(f.points / f.maxPoints) * 100}%`,
                      backgroundColor: f.points === f.maxPoints ? '#00C853' : f.points >= f.maxPoints * 0.6 ? '#FF9500' : '#FF2D55',
                    }}
                  />
                </div>
                <span className="text-[10px] font-black text-neutral-500 dark:text-neutral-400 w-10 text-right shrink-0">
                  {f.points}/{f.maxPoints}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expanded breakdown */}
      {isExpanded && (
        <div className="mt-5 pt-4 border-t border-neutral-200 dark:border-[#243048] space-y-2 animate-fadeIn">
          <p className="text-[11px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
            Score Breakdown
          </p>
          {factors.map((f) => (
            <div
              key={f.label}
              className="flex items-start gap-3 p-3 rounded-2xl bg-white dark:bg-[#1C263A] border border-neutral-200 dark:border-[#2E3C56]"
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${f.points === f.maxPoints ? '#00C853' : f.points >= f.maxPoints * 0.6 ? '#FF9500' : '#FF2D55'}22` }}
              >
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ color: f.points === f.maxPoints ? '#00C853' : f.points >= f.maxPoints * 0.6 ? '#FF9500' : '#FF2D55' }}
                >
                  {f.icon}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-black dark:text-white">{f.label}</span>
                  <span
                    className="text-xs font-black tabular-nums"
                    style={{ color: f.points === f.maxPoints ? '#00C853' : f.points >= f.maxPoints * 0.6 ? '#FF9500' : '#FF2D55' }}
                  >
                    +{f.points} pts
                  </span>
                </div>
                <p className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {f.description}
                </p>
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="flex justify-between items-center px-3 py-2.5 rounded-2xl bg-black dark:bg-white text-white dark:text-black mt-1">
            <span className="text-xs font-black">Total Health Score</span>
            <span className="text-sm font-black tabular-nums">{score} / 100 {emoji}</span>
          </div>
        </div>
      )}
    </div>
  );
};
