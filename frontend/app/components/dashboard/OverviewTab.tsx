'use client';

import React, { useState } from 'react';
import { FinancialSummary, Transaction } from '../../api';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface OverviewTabProps {
  summary: FinancialSummary;
  username?: string | null;
  roast: string;
  isRoasting?: boolean;
  roastLevel?: number;
  transactions?: Transaction[];
  onRegenerateRoast: () => void;
  onOpenAutopsy: () => void;
  onUploadClick: () => void;
  onDemoClick: () => void;
  onQuickAdd: (data: { amount: number; merchant: string; category: string; date: string }) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Shopping: '#D4FF00',
  Food: '#FF7A33',
  Transport: '#4DA6FF',
  Bills: '#A855F7',
  'Bills & Utilities': '#A855F7',
  Groceries: '#4ADE80',
  Healthcare: '#FF5C8A',
  Entertainment: '#FACC15',
  Education: '#4DA6FF',
  Travel: '#FF847C',
  Subscriptions: '#FF4560',
};

export function OverviewTab({
  summary,
  username,
  roast,
  isRoasting,
  roastLevel = 1,
  transactions = [],
  onRegenerateRoast,
  onOpenAutopsy,
  onUploadClick,
  onDemoClick,
  onQuickAdd,
}: OverviewTabProps) {
  // Inline Quick Add state for Daily Check-In
  const [isAddingDaily, setIsAddingDaily] = useState(false);
  const [dailyAmount, setDailyAmount] = useState('');
  const [dailyMerchant, setDailyMerchant] = useState('');
  const [dailyCategory, setDailyCategory] = useState('Food');

  // Calculate local date (YYYY-MM-DD)
  const todayLocalStr = new Date().toLocaleDateString('en-CA');

  // Filter manual transactions made today for the Daily Check-in state
  const todayManualTxns = transactions.filter(
    (t) => t.date === todayLocalStr && t.source === 'manual' && t.type === 'expense'
  );
  const todaySpent = todayManualTxns.reduce((sum, t) => sum + t.amount, 0);
  const isTodayTracked = todayManualTxns.length > 0;

  const handleDailySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(dailyAmount);
    if (isNaN(amt) || amt <= 0 || !dailyMerchant.trim()) return;

    onQuickAdd({
      amount: amt,
      merchant: dailyMerchant.trim(),
      category: dailyCategory,
      date: todayLocalStr,
    });

    setDailyAmount('');
    setDailyMerchant('');
    setIsAddingDaily(false);
  };

  // =========================================================================
  // 1. EMPTY STATE (0 TRANSACTIONS)
  // =========================================================================
  if (!summary || summary.transaction_count === 0) {
    return (
      <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto py-6">
        {/* Editorial Forensic Empty Card */}
        <div className="surface-card p-8 sm:p-12 text-center border border-[rgba(212,255,0,0.25)] bg-[#121312] rounded-2xl shadow-xl space-y-6">
          <div className="inline-block bg-[#D4FF00]/10 text-[#D4FF00] font-mono-num text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-[#D4FF00]/25">
            Awaiting Evidence
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#F4F3EE] tracking-tight">
              YOUR FIRST AUTOPSY STARTS HERE.
            </h2>
            <p className="text-sm sm:text-base text-[#8E9089] leading-relaxed">
              Upload a bank statement. We&apos;ll calculate the damage, unmask the vampire leeches, and deliver your diagnosis.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-md mx-auto">
            <button
              onClick={onUploadClick}
              className="btn-primary w-full sm:w-auto text-xs py-3 px-6 font-bold"
            >
              Upload Statement [BETA]
            </button>
            <button
              onClick={onDemoClick}
              className="btn-secondary w-full sm:w-auto text-xs py-3 px-6 font-bold"
            >
              Try Live Demo
            </button>
          </div>
        </div>

        {/* Daily Check-In Micro Widget in Empty State */}
        <div className="surface-card p-6 border border-[rgba(255,255,255,0.08)] bg-[#151715] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="font-mono-num text-[11px] text-[#D4FF00] uppercase font-bold tracking-wider block">
              TODAY&apos;S CHECK-IN
            </span>
            <p className="font-sans text-sm font-semibold text-[#F4F3EE] mt-0.5">
              Start small by adding today&apos;s coffee, lunch, or groceries.
            </p>
          </div>

          <button
            onClick={() => setIsAddingDaily(!isAddingDaily)}
            className="btn-secondary text-xs py-2 px-4 font-bold shrink-0"
          >
            {isAddingDaily ? 'Cancel' : '+ Add today\'s spending'}
          </button>
        </div>

        {/* Inline Quick Add Form */}
        {isAddingDaily && (
          <form
            onSubmit={handleDailySubmit}
            className="surface-card p-5 border border-[rgba(212,255,0,0.3)] bg-[#181918] rounded-xl space-y-4 animate-fadeIn"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-mono-num font-bold text-[#8E9089] block mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  placeholder="350"
                  step="0.01"
                  value={dailyAmount}
                  onChange={(e) => setDailyAmount(e.target.value)}
                  className="w-full bg-[#121312] border border-[rgba(255,255,255,0.1)] text-xs text-[#F4F3EE] p-2.5 rounded-lg focus:outline-none font-mono-num"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-mono-num font-bold text-[#8E9089] block mb-1">
                  Merchant
                </label>
                <input
                  type="text"
                  placeholder="Swiggy, Blue Tokai, Metro..."
                  value={dailyMerchant}
                  onChange={(e) => setDailyMerchant(e.target.value)}
                  className="w-full bg-[#121312] border border-[rgba(255,255,255,0.1)] text-xs text-[#F4F3EE] p-2.5 rounded-lg focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-mono-num font-bold text-[#8E9089] block mb-1">
                  Category
                </label>
                <select
                  value={dailyCategory}
                  onChange={(e) => setDailyCategory(e.target.value)}
                  className="w-full bg-[#121312] border border-[rgba(255,255,255,0.1)] text-xs text-[#F4F3EE] p-2.5 rounded-lg focus:outline-none"
                >
                  {['Food', 'Shopping', 'Transport', 'Groceries', 'Entertainment', 'Bills', 'Other'].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button type="submit" className="btn-primary text-xs py-2 px-5 font-bold">
                Save Check-in
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // =========================================================================
  // 2. ACTIVE OVERVIEW (DATA PRESENT)
  // =========================================================================
  const categories = Object.entries(summary?.category_totals || {})
    .filter(([_, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1]);

  const topCategory = categories[0];
  const topPercentage =
    summary?.total_spending > 0 && topCategory
      ? Math.round((topCategory[1] / summary.total_spending) * 100)
      : 0;

  const dailySpending = summary?.daily_spending || [];
  let peakDay = dailySpending.length > 0 ? dailySpending[0] : null;
  for (const d of dailySpending) {
    if (peakDay && d.amount > peakDay.amount) {
      peakDay = d;
    }
  }

  const formatPeakDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const chartData = dailySpending.map((d) => {
    const parts = d.date.split('-');
    const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : d.date;
    return {
      date: label,
      amount: d.amount,
      rawDate: d.date,
    };
  });

  const isDeficit = (summary?.remaining || 0) < 0;

  const getPersonality = () => {
    if (!topCategory) return 'CLEAN SLATE';
    const name = topCategory[0];
    if (name === 'Food' || name === 'Groceries') return 'SWIGGY SPONSOR';
    if (name === 'Shopping') return 'RETAIL RECEPTACLE';
    if (name === 'Transport' || name === 'Travel') return 'LOCOMOTIVE DRAIN';
    if (name === 'Entertainment') return 'DISTRACTION DEVOTEE';
    if (name === 'Subscriptions') return 'VAMPIRE HOST';
    return 'BALANCED BROKE';
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl">
      {/* 1. TOP LEVEL: UNIFIED COMPACT SPEND STRIP */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[rgba(255,255,255,0.06)] pb-4 pt-1">
        <div>
          <span className="font-mono-num text-[11px] text-[#8E9089] uppercase tracking-wider block font-semibold mb-1">
            Monthly Casualty
          </span>
          <div className="flex items-baseline gap-3">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#F4F3EE]">
              <AnimatedNumber value={summary?.total_spending || 0} />
            </h1>
            <span className="font-sans text-xs uppercase tracking-wider text-[#8E9089] font-bold">
              Spent This Month
            </span>
          </div>
        </div>

        {/* Right context strip */}
        <div className="flex flex-wrap items-center gap-3 font-mono-num text-xs">
          {isDeficit ? (
            <span className="bg-[#FF4560]/15 text-[#FF4560] border border-[#FF4560]/30 px-3 py-1 rounded font-bold">
              −₹{Math.abs(summary?.remaining || 0).toLocaleString('en-IN')} In The Red
            </span>
          ) : (
            <span className="bg-[#D4FF00]/15 text-[#D4FF00] border border-[#D4FF00]/30 px-3 py-1 rounded font-bold">
              +₹{(summary?.remaining || 0).toLocaleString('en-IN')} Surplus
            </span>
          )}

          <span className="text-[#8E9089]">
            Income: <strong className="text-[#F4F3EE]">₹{(summary?.total_income || 0).toLocaleString('en-IN')}</strong>
          </span>
          <span className="text-[#545650]">•</span>
          <span className="text-[#8E9089]">
            {summary?.transaction_count || 0} txns
          </span>
        </div>
      </section>

      {/* 2. DAILY CHECK-IN BAR */}
      <div className="bg-[#151715] p-4 rounded-xl border border-[rgba(255,255,255,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`font-mono-num text-[11px] font-bold px-2.5 py-0.5 rounded ${
              isTodayTracked
                ? 'bg-[#D4FF00]/15 text-[#D4FF00] border border-[#D4FF00]/30'
                : 'bg-[#1E201E] text-[#8E9089]'
            }`}
          >
            {isTodayTracked ? "TODAY'S CHECK-IN ✓" : "TODAY'S CHECK-IN"}
          </span>

          <span className="font-sans text-xs text-[#F4F3EE]">
            {isTodayTracked ? (
              <>
                <strong className="text-[#D4FF00] font-mono-num">₹{todaySpent.toLocaleString('en-IN')}</strong> tracked today across {todayManualTxns.length} expense{todayManualTxns.length > 1 ? 's' : ''}
              </>
            ) : (
              'No expenses logged for today yet.'
            )}
          </span>
        </div>

        <button
          onClick={() => setIsAddingDaily(!isAddingDaily)}
          className="btn-secondary text-xs py-1.5 px-3 font-bold shrink-0"
        >
          {isAddingDaily ? 'Cancel' : isTodayTracked ? '+ Add another' : '+ Add today\'s spending'}
        </button>
      </div>

      {/* Inline Quick Add Form when open */}
      {isAddingDaily && (
        <form
          onSubmit={handleDailySubmit}
          className="surface-card p-5 border border-[rgba(212,255,0,0.3)] bg-[#181918] rounded-xl space-y-4 animate-fadeIn"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-mono-num font-bold text-[#8E9089] block mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                placeholder="250"
                step="0.01"
                value={dailyAmount}
                onChange={(e) => setDailyAmount(e.target.value)}
                className="w-full bg-[#121312] border border-[rgba(255,255,255,0.1)] text-xs text-[#F4F3EE] p-2.5 rounded-lg focus:outline-none font-mono-num"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-mono-num font-bold text-[#8E9089] block mb-1">
                Merchant
              </label>
              <input
                type="text"
                placeholder="Swiggy, Chai Point, Uber..."
                value={dailyMerchant}
                onChange={(e) => setDailyMerchant(e.target.value)}
                className="w-full bg-[#121312] border border-[rgba(255,255,255,0.1)] text-xs text-[#F4F3EE] p-2.5 rounded-lg focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-mono-num font-bold text-[#8E9089] block mb-1">
                Category
              </label>
              <select
                value={dailyCategory}
                onChange={(e) => setDailyCategory(e.target.value)}
                className="w-full bg-[#121312] border border-[rgba(255,255,255,0.1)] text-xs text-[#F4F3EE] p-2.5 rounded-lg focus:outline-none"
              >
                {['Food', 'Shopping', 'Transport', 'Groceries', 'Entertainment', 'Bills', 'Other'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="submit" className="btn-primary text-xs py-2 px-5 font-bold">
              Save Check-in
            </button>
          </div>
        </form>
      )}

      {/* 3. ROW 1: SIDE-BY-SIDE POWER BENTO (ROAST + TRAJECTORY GRAPH) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left (7 cols): The Roast Verdict Card */}
        <div className="lg:col-span-7 verdict-box flex flex-col justify-between p-5 sm:p-6 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono-num text-[11px] text-[#D4FF00] font-bold uppercase tracking-wider">
                Verdict • {getPersonality()}
              </span>
              <span className="font-mono-num text-[11px] text-[#8E9089]">
                Live Diagnosis
              </span>
            </div>

            <p className="font-sans font-bold text-base sm:text-lg text-[#F4F3EE] leading-relaxed italic">
              {isRoasting ? (
                <span className="text-[#D4FF00] not-italic animate-pulse">
                  Assembling financial roast...
                </span>
              ) : (
                `“${roast}”`
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-[rgba(255,255,255,0.06)]">
            <button
              onClick={onRegenerateRoast}
              disabled={isRoasting}
              className="btn-primary text-xs py-2 px-4 font-bold transition-transform active:scale-95"
            >
              {isRoasting
                ? 'Roasting...'
                : roastLevel === 1
                ? 'Roast Me Harder'
                : roastLevel === 2
                ? 'Go Harder'
                : roastLevel === 3
                ? 'Unhinged Mode'
                : 'One More'}
            </button>

            <button
              onClick={onOpenAutopsy}
              className="btn-secondary text-xs py-2 px-4 font-bold"
            >
              Export Poster
            </button>
          </div>
        </div>

        {/* Right (5 cols): The Damage Trajectory Chart */}
        <div className="lg:col-span-5 surface-card p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex justify-between items-baseline mb-2">
            <h3 className="font-display text-sm font-bold text-[#F4F3EE]">
              The Damage
            </h3>
            {peakDay && peakDay.amount > 0 && (
              <span className="font-mono-num text-[11px] text-[#8E9089]">
                Peak: <strong className="text-[#D4FF00]">{formatPeakDate(peakDay.date)}</strong> (₹{peakDay.amount.toLocaleString('en-IN')})
              </span>
            )}
          </div>

          <div className="w-full h-[130px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.08)"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#8E9089', fontFamily: 'var(--font-mono)' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.08)"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#8E9089', fontFamily: 'var(--font-mono)' }}
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#181918] border border-[rgba(255,255,255,0.15)] py-1 px-2.5 rounded font-mono-num text-[11px]">
                            <span className="text-[#8E9089] block text-[9px]">{data.rawDate}</span>
                            <span className="text-[#D4FF00] font-bold">
                              ₹{Number(data.amount).toLocaleString('en-IN')}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#D4FF00"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3.5, fill: '#D4FF00', stroke: '#0A0B0A', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#8E9089]">
                No daily trajectory available yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. ROW 2: UNIFIED CATEGORY BREAKDOWN (NO SPLIT CARDS) */}
      {topCategory && (
        <section className="surface-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
            <h3 className="font-display text-base font-bold text-[#F4F3EE]">
              Where It Went
            </h3>
            <span className="font-mono-num text-xs text-[#8E9089]">
              {categories.length} categories active
            </span>
          </div>

          {/* Top Driver Spotlight */}
          <div className="p-4 rounded-lg bg-[#181918] border border-[rgba(212,255,0,0.25)] space-y-2">
            <div className="flex justify-between items-baseline">
              <div>
                <span className="font-mono-num text-[10px] text-[#D4FF00] font-bold tracking-wider block">
                  01 / BIGGEST CATEGORY
                </span>
                <span className="font-display text-xl sm:text-2xl font-extrabold uppercase text-[#F4F3EE]">
                  {topCategory[0]}
                </span>
              </div>
              <div className="text-right font-mono-num">
                <span className="text-xl sm:text-2xl font-extrabold text-[#D4FF00] block">
                  ₹{topCategory[1].toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-[#8E9089]">
                  {topPercentage}% of all spending
                </span>
              </div>
            </div>

            <div className="w-full bg-[#0A0B0A] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#D4FF00] h-full rounded-full transition-all duration-700"
                style={{ width: `${topPercentage}%` }}
              />
            </div>
          </div>

          {/* Secondary Ranked Categories In Same Card */}
          {categories.length > 1 && (
            <div className="divide-y divide-[rgba(255,255,255,0.04)] pt-1">
              {categories.slice(1, 5).map(([category, amount], idx) => {
                const pct = Math.round((amount / summary.total_spending) * 100);
                const color = CATEGORY_COLORS[category] || '#8E9089';

                return (
                  <div key={category} className="py-2.5 flex items-center justify-between text-xs font-sans group">
                    <div className="flex items-center gap-3">
                      <span className="font-mono-num text-[11px] text-[#545650] font-semibold">
                        0{idx + 2}
                      </span>
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-medium text-[#8E9089] group-hover:text-[#F4F3EE] transition-colors">
                        {category}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 font-mono-num">
                      <span className="text-[#8E9089]">
                        ₹{amount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[#F4F3EE] font-bold w-9 text-right">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
