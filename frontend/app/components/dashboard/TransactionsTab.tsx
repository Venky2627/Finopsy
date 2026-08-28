'use client';

import React, { useState } from 'react';
import { Transaction } from '../../api';
import { DoodleIcon, getDoodleForMerchant } from '../ui/DoodleIcon';

interface TransactionsTabProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onUploadClick?: () => void;
  onAddClick?: () => void;
}

const CATEGORY_PILLS: Record<string, { bg: string; text: string }> = {
  Shopping: { bg: 'rgba(212, 255, 0, 0.1)', text: '#D4FF00' },
  Food: { bg: 'rgba(255, 122, 51, 0.12)', text: '#FF7A33' },
  Transport: { bg: 'rgba(77, 166, 255, 0.12)', text: '#4DA6FF' },
  Bills: { bg: 'rgba(168, 85, 247, 0.12)', text: '#A855F7' },
  'Bills & Utilities': { bg: 'rgba(168, 85, 247, 0.12)', text: '#A855F7' },
  Groceries: { bg: 'rgba(74, 222, 128, 0.12)', text: '#4ADE80' },
  Healthcare: { bg: 'rgba(255, 92, 138, 0.12)', text: '#FF5C8A' },
  Entertainment: { bg: 'rgba(250, 204, 21, 0.12)', text: '#FACC15' },
  Subscriptions: { bg: 'rgba(255, 69, 96, 0.12)', text: '#FF4560' },
  Education: { bg: 'rgba(77, 166, 255, 0.12)', text: '#4DA6FF' },
  Travel: { bg: 'rgba(255, 132, 124, 0.12)', text: '#FF847C' },
  Income: { bg: 'rgba(212, 255, 0, 0.15)', text: '#D4FF00' },
  Other: { bg: 'rgba(255, 255, 255, 0.06)', text: '#8E9089' },
};

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
  general: { bg: 'rgba(255, 255, 255, 0.06)', text: '#8E9089' },
};

export function TransactionsTab({
  transactions,
  onDeleteTransaction,
  onUploadClick,
  onAddClick,
}: TransactionsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date' | 'amount-desc' | 'amount-asc'>('date');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // =========================================================================
  // EMPTY STATE (0 TRANSACTIONS)
  // =========================================================================
  if (!transactions || transactions.length === 0) {
    return (
      <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto py-8">
        <div className="surface-card p-8 sm:p-12 text-center border border-[rgba(255,255,255,0.08)] bg-[#121312] rounded-2xl space-y-5">
          <span className="font-mono-num text-[11px] text-[#8E9089] font-bold uppercase tracking-wider block">
            LEDGER • EMPTY
          </span>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#F4F3EE]">
              NO EVIDENCE YET.
            </h3>
            <p className="text-xs sm:text-sm text-[#8E9089] leading-relaxed">
              Upload a statement or add today&apos;s spending to start building your verified ledger.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-sm mx-auto">
            {onAddClick && (
              <button
                onClick={onAddClick}
                className="btn-primary w-full sm:w-auto text-xs py-2.5 px-5 font-bold"
              >
                + Add Today&apos;s Spending
              </button>
            )}
            {onUploadClick && (
              <button
                onClick={onUploadClick}
                className="btn-secondary w-full sm:w-auto text-xs py-2.5 px-5 font-bold"
              >
                Upload Statement
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Extract unique categories
  const categories = ['All', ...Array.from(new Set(transactions.map((t) => t.category)))];

  // Filtering
  const filtered = transactions
    .filter((t) => {
      const matchesQuery =
        t.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'All' || t.category === selectedCategory;
      return matchesQuery && matchesCat;
    })
    .sort((a, b) => {
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  const totalFilteredAmount = filtered
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[rgba(255,255,255,0.06)] pb-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#F4F3EE]">
            Transaction Ledger
          </h2>
          <p className="text-xs text-[#8E9089] mt-0.5">
            Full history of your verified banking records
          </p>
        </div>

        <div className="font-mono-num text-xs text-[#8E9089]">
          <span>{filtered.length} transactions</span>
          <span className="mx-2">•</span>
          <span>Total Outflow: <strong className="text-[#D4FF00]">₹{totalFilteredAmount.toLocaleString('en-IN')}</strong></span>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <input
          type="text"
          placeholder="Search merchant or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-[#121312] border border-[rgba(255,255,255,0.08)] text-xs text-[#F4F3EE] px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-[rgba(255,255,255,0.25)] font-sans placeholder-[#545650] w-full sm:w-64"
        />

        {/* Category & Sort Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#121312] border border-[rgba(255,255,255,0.08)] text-xs text-[#F4F3EE] px-3 py-2 rounded-lg focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#121312] border border-[rgba(255,255,255,0.08)] text-xs text-[#F4F3EE] px-3 py-2 rounded-lg focus:outline-none"
          >
            <option value="date">Sort: Most Recent</option>
            <option value="amount-desc">Sort: Highest Amount</option>
            <option value="amount-asc">Sort: Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="surface-card p-2 sm:p-4">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-xs text-[#8E9089]">
              No transactions match your active filters.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[rgba(255,255,255,0.04)]">
            {filtered.map((txn, idx) => {
              const id = txn.id || `txn-${idx}`;
              const isExpanded = expandedId === id;
              const isExpense = txn.type === 'expense';
              const doodleType = getDoodleForMerchant(txn.merchant, txn.category);
              const accent = DOODLE_ACCENTS[doodleType] || DOODLE_ACCENTS.general;
              const pill = CATEGORY_PILLS[txn.category] || CATEGORY_PILLS.Other;

              return (
                <div key={id} className="transition-all">
                  <div
                    onClick={() => toggleExpand(id)}
                    className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-[#181A18] hover:translate-x-1 transition-all duration-150 cursor-pointer group select-none"
                  >
                    {/* Left: Doodle Badge + Date + Merchant */}
                    <div className="flex items-center gap-3.5 min-w-0 pr-4">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-105 transition-transform"
                        style={{ backgroundColor: accent.bg, color: accent.text }}
                      >
                        <DoodleIcon type={doodleType} size={18} />
                      </div>

                      <div className="min-w-0 truncate">
                        <p className="font-sans text-sm font-semibold text-[#F4F3EE] truncate group-hover:text-white">
                          {txn.merchant}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono-num text-[11px] text-[#8E9089]">
                            {txn.date}
                          </span>
                          <span
                            className="font-mono-num text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase"
                            style={{ backgroundColor: pill.bg, color: pill.text }}
                          >
                            {txn.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount */}
                    <div className="flex items-center gap-4 shrink-0 text-right">
                      <span
                        className={`font-mono-num text-sm font-bold tabular-nums ${
                          isExpense ? 'text-[#F4F3EE]' : 'text-[#D4FF00]'
                        }`}
                      >
                        {isExpense ? '−' : '+'}₹{txn.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Inline Expanded Detail */}
                  {isExpanded && (
                    <div className="bg-[#181918] p-4 my-1.5 mx-2 rounded-lg border border-[rgba(255,255,255,0.06)] text-xs space-y-2.5 animate-fadeIn">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono-num">
                        <div>
                          <span className="text-[#8E9089] block text-[9px] uppercase tracking-wider font-semibold">
                            Source
                          </span>
                          <span className="text-[#F4F3EE]">
                            {txn.source || 'Statement'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#8E9089] block text-[9px] uppercase tracking-wider font-semibold">
                            Confidence
                          </span>
                          <span className="text-[#D4FF00] font-bold">
                            {Math.round((txn.category_confidence || 0.95) * 100)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-[#8E9089] block text-[9px] uppercase tracking-wider font-semibold">
                            Payment Method
                          </span>
                          <span className="text-[#F4F3EE]">
                            {txn.payment_method || 'UPI / Bank Transfer'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#8E9089] block text-[9px] uppercase tracking-wider font-semibold">
                            Type
                          </span>
                          <span className="text-[#F4F3EE] capitalize">
                            {txn.type}
                          </span>
                        </div>
                      </div>

                      {txn.description && (
                        <div className="pt-2 border-t border-[rgba(255,255,255,0.04)] text-xs text-[#8E9089]">
                          <span>{txn.description}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-[rgba(255,255,255,0.04)] flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTransaction(txn.id);
                          }}
                          className="text-[#FF4560] hover:text-[#ff6b82] text-xs font-semibold transition"
                        >
                          Delete entry
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
