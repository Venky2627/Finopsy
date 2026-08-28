'use client';

import React from 'react';
import { FinancialSummary } from '../../api';
import { AnimatedNumber } from '../ui/AnimatedNumber';

interface AutopsyModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: FinancialSummary;
  username?: string | null;
  roast: string;
  isRoasting?: boolean;
  onOpenShareCard: () => void;
}

export function AutopsyModal({
  isOpen,
  onClose,
  summary,
  username,
  roast,
  isRoasting,
  onOpenShareCard,
}: AutopsyModalProps) {
  if (!isOpen) return null;

  const topCategory = Object.entries(summary?.category_totals || {})
    .sort((a, b) => b[1] - a[1])[0];

  const topPercentage =
    summary?.total_spending > 0 && topCategory
      ? Math.round((topCategory[1] / summary.total_spending) * 100)
      : 0;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="surface-card w-full max-w-lg p-7 sm:p-9 border border-[rgba(212,255,0,0.3)] shadow-2xl relative bg-[#121312]">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#8E9089] hover:text-[#F4F3EE] text-xs font-mono-num px-2 py-1"
        >
          ESC
        </button>

        {/* Header */}
        <div className="border-b border-[rgba(255,255,255,0.06)] pb-4 mb-6">
          <span className="font-mono-num text-[11px] text-[#D4FF00] uppercase tracking-wider block mb-1 font-semibold">
            Finopsy • Forensic Verdict
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#F4F3EE]">
            {username ? `@${username}'s Autopsy` : 'Financial Autopsy'}
          </h2>
        </div>

        {/* Diagnosis */}
        <div className="mb-6">
          <span className="font-mono-num text-[11px] text-[#8E9089] uppercase tracking-wider block mb-1">
            Diagnosis
          </span>
          <p className="font-display text-3xl sm:text-4xl font-extrabold text-[#F4F3EE] tracking-tight">
            {getPersonality()}
          </p>
        </div>

        {/* Metric Block */}
        <div className="grid grid-cols-2 gap-4 bg-[#181918] p-5 rounded-lg border border-[rgba(255,255,255,0.06)] mb-6">
          <div>
            <span className="font-mono-num text-[10px] text-[#8E9089] uppercase tracking-wider block mb-1">
              Total Spent
            </span>
            <span className="font-mono-num text-2xl font-bold text-[#F4F3EE]">
              <AnimatedNumber value={summary?.total_spending || 0} />
            </span>
          </div>

          <div>
            <span className="font-mono-num text-[10px] text-[#8E9089] uppercase tracking-wider block mb-1">
              Main Culprit
            </span>
            <span className="font-sans text-base font-bold text-[#D4FF00] truncate block mt-0.5">
              {topCategory ? `${topCategory[0]} (${topPercentage}%)` : 'None'}
            </span>
          </div>
        </div>

        {/* Observation Quote */}
        <div className="mb-8 pl-3.5 border-l-2 border-[#D4FF00]">
          <span className="font-mono-num text-[10px] text-[#8E9089] uppercase tracking-wider block mb-1">
            Observation
          </span>
          <p className="font-sans text-sm font-medium text-[#F4F3EE] italic leading-relaxed">
            {isRoasting ? (
              <span className="text-[#D4FF00] not-italic animate-pulse">
                Assembling commentary...
              </span>
            ) : (
              `“${roast}”`
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => {
              onClose();
              onOpenShareCard();
            }}
            className="btn-primary flex-1 text-xs py-3 font-bold uppercase tracking-wider"
          >
            Export Autopsy Poster
          </button>

          <button
            onClick={onClose}
            className="btn-secondary text-xs px-5"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
