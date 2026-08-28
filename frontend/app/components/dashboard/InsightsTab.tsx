'use client';

import React, { useState, useEffect } from 'react';
import { FinancialSummary, Subscription, BudgetOut, fetchBudgets, createBudget, deleteBudget } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { DoodleIcon, getDoodleForMerchant } from '../ui/DoodleIcon';

interface InsightsTabProps {
  summary: FinancialSummary;
  isDemo?: boolean;
}

const DEFAULT_DEMO_BUDGETS: BudgetOut[] = [
  { id: 'b1', category: 'Food', monthly_limit: 8000, spent_this_month: 9450, remaining: -1450, percentage: 118.1, status: 'exceeded', created_at: '' },
  { id: 'b2', category: 'Shopping', monthly_limit: 7000, spent_this_month: 6528, remaining: 472, percentage: 93.2, status: 'warning', created_at: '' },
  { id: 'b3', category: 'Entertainment', monthly_limit: 4000, spent_this_month: 2800, remaining: 1200, percentage: 70.0, status: 'safe', created_at: '' },
  { id: 'b4', category: 'Transport', monthly_limit: 3500, spent_this_month: 2150, remaining: 1350, percentage: 61.4, status: 'safe', created_at: '' },
];

const DOODLE_ACCENTS: Record<string, { bg: string; text: string }> = {
  entertainment: { bg: 'rgba(229, 9, 20, 0.12)', text: '#FF4D4D' },
  music: { bg: 'rgba(30, 215, 96, 0.12)', text: '#1ED760' },
  education: { bg: 'rgba(0, 86, 210, 0.15)', text: '#4D94FF' },
  fitness: { bg: 'rgba(255, 215, 0, 0.12)', text: '#FFD700' },
  food: { bg: 'rgba(255, 122, 51, 0.12)', text: '#FF7A33' },
  shopping: { bg: 'rgba(212, 255, 0, 0.12)', text: '#D4FF00' },
  transport: { bg: 'rgba(77, 166, 255, 0.12)', text: '#4DA6FF' },
  bills: { bg: 'rgba(168, 85, 247, 0.12)', text: '#A855F7' },
  groceries: { bg: 'rgba(74, 222, 128, 0.12)', text: '#4ADE80' },
  healthcare: { bg: 'rgba(255, 92, 138, 0.12)', text: '#FF5C8A' },
  travel: { bg: 'rgba(255, 132, 124, 0.12)', text: '#FF847C' },
  general: { bg: 'rgba(255, 255, 255, 0.08)', text: '#F4F3EE' },
};

export function InsightsTab({ summary, isDemo = false }: InsightsTabProps) {
  const { session, isAuthenticated } = useAuth();
  const [budgets, setBudgets] = useState<BudgetOut[]>([]);
  const [isAddingBudget, setIsAddingBudget] = useState(false);
  const [newCategory, setNewCategory] = useState('Food');
  const [newLimit, setNewLimit] = useState('');

  const subscriptions: Subscription[] = summary?.subscriptions || [];
  const totalMonthlySub = subscriptions.reduce((sum, s) => sum + s.monthly_amount, 0);
  const totalAnnualSub = totalMonthlySub * 12;

  useEffect(() => {
    if (isDemo || !isAuthenticated) {
      if (summary?.transaction_count > 0) {
        setBudgets(DEFAULT_DEMO_BUDGETS);
      } else {
        setBudgets([]);
      }
      return;
    }

    if (session?.access_token) {
      fetchBudgets(session.access_token)
        .then((b) => setBudgets(b || []))
        .catch((e) => console.error(e));
    }
  }, [isDemo, isAuthenticated, session, summary]);

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLimit || isNaN(Number(newLimit))) return;

    if (isDemo || !isAuthenticated) {
      const spent = summary?.category_totals?.[newCategory] || 0;
      const limit = Number(newLimit);
      const percentage = (spent / limit) * 100;
      const status = percentage > 100 ? 'exceeded' : percentage > 85 ? 'warning' : 'safe';

      const mock: BudgetOut = {
        id: `demo-${Date.now()}`,
        category: newCategory,
        monthly_limit: limit,
        spent_this_month: spent,
        remaining: limit - spent,
        percentage,
        status,
        created_at: new Date().toISOString(),
      };
      setBudgets([...budgets, mock]);
      setNewLimit('');
      setIsAddingBudget(false);
      return;
    }

    if (session?.access_token) {
      try {
        const created = await createBudget(session.access_token, {
          category: newCategory,
          monthly_limit: Number(newLimit),
        });
        setBudgets([...budgets, created]);
        setNewLimit('');
        setIsAddingBudget(false);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (isDemo || !isAuthenticated) {
      setBudgets(budgets.filter((b) => b.id !== id));
      return;
    }
    if (session?.access_token) {
      try {
        await deleteBudget(session.access_token, id);
        setBudgets(budgets.filter((b) => b.id !== id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  // =========================================================================
  // EMPTY STATE (0 TRANSACTIONS)
  // =========================================================================
  if (!summary || summary.transaction_count === 0) {
    return (
      <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto py-8">
        <div className="surface-card p-8 sm:p-12 text-center border border-[rgba(255,255,255,0.08)] bg-[#121312] rounded-2xl space-y-4">
          <span className="font-mono-num text-[11px] text-[#8E9089] font-bold uppercase tracking-wider block">
            INSIGHTS • AWAITING DATA
          </span>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#F4F3EE]">
              NOTHING TO INVESTIGATE YET.
            </h3>
            <p className="text-xs sm:text-sm text-[#8E9089] leading-relaxed">
              Import some transactions and we&apos;ll start looking for recurring vampire charges, annual leaks, and monthly guardrails.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const exceededBudgets = budgets.filter((b) => b.status === 'exceeded' || b.percentage > 100);
  const primaryExceeded = exceededBudgets[0];

  const availableCategories = Object.keys(summary?.category_totals || {}).filter(
    (cat) => !budgets.some((b) => b.category === cat)
  );

  return (
    <div className="space-y-10 animate-fadeIn max-w-5xl">
      {/* Header */}
      <div className="border-b border-[rgba(255,255,255,0.06)] pb-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#F4F3EE]">
            Insights & Guardrails
          </h2>
          <p className="text-xs text-[#8E9089] mt-0.5">
            Recurring commitments, monthly budgets, and spending velocity
          </p>
        </div>
      </div>

      {/* 1. SUBSCRIPTIONS (DOODLE ICON BADGES) */}
      <section className="surface-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[rgba(255,255,255,0.06)] pb-4">
          <div>
            <span className="font-mono-num text-[11px] text-[#D4FF00] font-bold uppercase tracking-wider block mb-1">
              Recurring Services
            </span>
            <h3 className="font-display text-xl sm:text-2xl font-extrabold text-[#F4F3EE]">
              Active Subscriptions
            </h3>
          </div>

          <div className="text-left sm:text-right font-mono-num">
            <span className="text-2xl font-extrabold text-[#F4F3EE]">
              ₹{totalMonthlySub.toLocaleString('en-IN')}<span className="text-xs text-[#8E9089]">/mo</span>
            </span>
            <span className="text-xs text-[#8E9089] block mt-0.5">
              That equals <strong className="text-[#D4FF00] font-bold">₹{totalAnnualSub.toLocaleString('en-IN')}/year</strong>
            </span>
          </div>
        </div>

        <p className="text-sm text-[#8E9089]">
          You are paying <span className="text-[#F4F3EE] font-bold">₹{totalMonthlySub.toLocaleString('en-IN')}</span> every month across {subscriptions.length} recurring services.
        </p>

        {/* Subscriptions Grid with Doodle Icons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {subscriptions.map((sub, idx) => {
            const doodleType = getDoodleForMerchant(sub.merchant, 'Subscriptions');
            const accent = DOODLE_ACCENTS[doodleType] || DOODLE_ACCENTS.general;
            const annualAmount = Math.round(sub.annual_projection || sub.monthly_amount * 12);

            return (
              <div
                key={idx}
                className="bg-[#161716] p-5 rounded-xl border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)] hover:bg-[#1A1C1A] transition-all duration-200 flex items-center justify-between group shadow-sm"
              >
                {/* Left: Quirky Doodle Icon + Details */}
                <div className="flex items-center gap-3.5 min-w-0 pr-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/10 shadow-inner group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: accent.bg, color: accent.text }}
                  >
                    <DoodleIcon type={doodleType} size={20} />
                  </div>

                  <div className="min-w-0 truncate">
                    <p className="font-sans font-bold text-sm text-[#F4F3EE] truncate group-hover:text-white">
                      {sub.merchant}
                    </p>
                    <span className="font-mono-num text-[11px] text-[#8E9089] block mt-0.5">
                      {sub.frequency || 'Monthly'} • {sub.occurrence_count} charges
                    </span>
                  </div>
                </div>

                {/* Right: Highlighted Amounts */}
                <div className="text-right font-mono-num shrink-0">
                  <span className="font-extrabold text-base text-[#F4F3EE] block">
                    ₹{sub.monthly_amount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-[#D4FF00] font-semibold bg-[#D4FF00]/10 px-2 py-0.5 rounded inline-block mt-1">
                    ₹{annualAmount.toLocaleString('en-IN')}/yr
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. BUDGET GUARDRAILS */}
      <section className="surface-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[rgba(255,255,255,0.06)] pb-4">
          <div>
            <span className="font-mono-num text-xs text-[#8E9089] font-semibold uppercase tracking-wider block mb-1">
              Monthly Caps
            </span>
            <h3 className="font-display text-xl sm:text-2xl font-extrabold text-[#F4F3EE]">
              Category Budgets
            </h3>
          </div>

          <button
            onClick={() => setIsAddingBudget(!isAddingBudget)}
            className="btn-ghost text-xs text-[#D4FF00] hover:text-[#D4FF00]"
          >
            {isAddingBudget ? 'Cancel' : '+ Set category limit'}
          </button>
        </div>

        {/* Primary Budget Overage */}
        {primaryExceeded ? (
          <div className="bg-[#1C1414] p-5 rounded-xl border border-[#FF4560]/30 space-y-1.5 shadow-sm">
            <div className="flex justify-between items-baseline">
              <h4 className="font-display text-base font-bold text-[#FF4560]">
                You are over budget on {primaryExceeded.category}.
              </h4>
              <span className="font-mono-num text-xs text-[#FF4560] font-bold bg-[#FF4560]/15 px-2 py-0.5 rounded">
                +₹{Math.abs(primaryExceeded.remaining).toLocaleString('en-IN')} over limit
              </span>
            </div>
            <p className="text-xs text-[#8E9089]">
              Spent ₹{primaryExceeded.spent_this_month.toLocaleString('en-IN')} against a monthly limit of ₹{primaryExceeded.monthly_limit.toLocaleString('en-IN')}.
            </p>
          </div>
        ) : (
          <p className="text-sm text-[#8E9089]">
            All tracked category limits are currently within set budgets.
          </p>
        )}

        {/* Add Budget Form */}
        {isAddingBudget && (
          <form onSubmit={handleAddBudget} className="bg-[#181918] p-5 rounded-xl border border-[rgba(255,255,255,0.08)] space-y-3 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-[#8E9089] block mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-[#121312] border border-[rgba(255,255,255,0.1)] text-xs text-[#F4F3EE] p-2.5 rounded-lg focus:outline-none"
                >
                  {(availableCategories.length > 0 ? availableCategories : ['Food', 'Shopping', 'Transport', 'Entertainment', 'Bills']).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#8E9089] block mb-1">Monthly Limit (₹)</label>
                <input
                  type="number"
                  placeholder="5000"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  className="w-full bg-[#121312] border border-[rgba(255,255,255,0.1)] text-xs text-[#F4F3EE] p-2.5 rounded-lg focus:outline-none font-mono-num"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button type="submit" className="btn-primary text-xs py-2 px-5">
                Save Limit
              </button>
            </div>
          </form>
        )}

        {/* Full Budgets List */}
        <div className="space-y-4 pt-2">
          {budgets.map((b) => {
            const isExceeded = b.status === 'exceeded' || b.percentage > 100;
            const isWarning = b.status === 'warning' || (b.percentage > 85 && !isExceeded);
            const statusLabel = isExceeded ? 'Over limit' : isWarning ? 'Near limit' : 'On track';
            const pillColor = isExceeded
              ? 'bg-[#FF4560]/15 text-[#FF4560] border border-[#FF4560]/30'
              : isWarning
              ? 'bg-[#FFB347]/15 text-[#FFB347] border border-[#FFB347]/30'
              : 'bg-[#4ADE80]/15 text-[#4ADE80] border border-[#4ADE80]/30';
            const barColor = isExceeded ? 'bg-[#FF4560]' : isWarning ? 'bg-[#FFB347]' : 'bg-[#4ADE80]';

            return (
              <div key={b.id} className="p-3.5 rounded-lg bg-[#161716] border border-[rgba(255,255,255,0.06)] space-y-2 group hover:border-[rgba(255,255,255,0.14)] transition">
                <div className="flex justify-between items-center text-xs font-sans">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-[#F4F3EE] text-sm">{b.category}</span>
                    <span className={`font-mono-num text-[10px] px-2 py-0.5 rounded font-bold ${pillColor}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono-num text-xs">
                    <span className="text-[#8E9089]">
                      <strong className="text-[#F4F3EE]">₹{b.spent_this_month.toLocaleString('en-IN')}</strong> / ₹{b.monthly_limit.toLocaleString('en-IN')}
                    </span>
                    <button
                      onClick={() => handleDeleteBudget(b.id)}
                      className="text-[#8E9089] hover:text-[#FF4560] opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 font-bold"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="w-full bg-[#0A0B0A] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(b.percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. PATTERNS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="surface-card p-6 space-y-2 bg-[#141514]">
          <span className="font-mono-num text-xs text-[#D4FF00] font-bold uppercase tracking-wider block">
            Velocity Pattern
          </span>
          <h4 className="font-display text-base font-bold text-[#F4F3EE]">
            Weekend Outflows ↑ 34%
          </h4>
          <p className="text-xs text-[#8E9089] leading-relaxed">
            Dining and late-night delivery spikes aggressively between Friday night and Sunday.
          </p>
        </div>

        <div className="surface-card p-6 space-y-2 bg-[#141514]">
          <span className="font-mono-num text-xs text-[#D4FF00] font-bold uppercase tracking-wider block">
            Concentration
          </span>
          <h4 className="font-display text-base font-bold text-[#F4F3EE]">
            Top 3 Merchants = 48%
          </h4>
          <p className="text-xs text-[#8E9089] leading-relaxed">
            Almost half of all monthly capital disappears into Amazon, Swiggy, and your rent.
          </p>
        </div>
      </section>
    </div>
  );
}
