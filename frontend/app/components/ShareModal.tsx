'use client';

import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import { ShareCard, PosterSticker } from './ShareCard';
import { FinancialSummary, generateRoast } from '../api';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: FinancialSummary;
  username?: string | null;
  initialRoast: string;
  transactions: any[];
}

export function ShareModal({
  isOpen,
  onClose,
  summary,
  username,
  initialRoast,
  transactions,
}: ShareModalProps) {
  const [currentRoast, setCurrentRoast] = useState<string>(initialRoast);
  const [severity, setSeverity] = useState<'mild' | 'savage' | 'unhinged'>('savage');
  const [redactNumbers, setRedactNumbers] = useState<boolean>(false);
  const [activeStickers, setActiveStickers] = useState<PosterSticker[]>(['top-killer']);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [copiedCaption, setCopiedCaption] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [seenRoasts, setSeenRoasts] = useState<string[]>([initialRoast]);

  const posterRef = useRef<HTMLDivElement>(null);

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

  const personality = getPersonality();

  // Find top merchant
  const merchantTotals: Record<string, number> = {};
  transactions
    .filter((t: any) => t.type === 'expense')
    .forEach((t: any) => {
      merchantTotals[t.merchant] = (merchantTotals[t.merchant] || 0) + t.amount;
    });
  const topMerchantEntry = Object.entries(merchantTotals).sort((a, b) => b[1] - a[1])[0];
  const topMerchant = topMerchantEntry ? topMerchantEntry[0] : 'Unknown';
  const topMerchantAmount = topMerchantEntry ? topMerchantEntry[1] : 0;

  // Toggle Sticker
  const handleToggleSticker = (sticker: PosterSticker) => {
    if (activeStickers.includes(sticker)) {
      setActiveStickers(activeStickers.filter((s) => s !== sticker));
    } else {
      setActiveStickers([...activeStickers, sticker]);
    }
  };

  // Severity Change
  const handleSelectSeverity = async (newSev: 'mild' | 'savage' | 'unhinged') => {
    setSeverity(newSev);
    setIsShuffling(true);
    try {
      const res = await generateRoast({
        total_spent: summary.total_spending,
        category_totals: summary.category_totals,
        category_percentages: summary.category_percentages,
        top_merchant: topMerchant,
        top_merchant_amount: topMerchantAmount,
        transaction_count: summary.transaction_count,
        severity: newSev,
        seen_roasts: seenRoasts,
      });
      if (res && res.text) {
        setCurrentRoast(res.text);
        setSeenRoasts((prev) => [...prev, res.text]);
      }
    } finally {
      setIsShuffling(false);
    }
  };

  // Shuffle Roast
  const handleShuffleRoast = async () => {
    setIsShuffling(true);
    try {
      const res = await generateRoast({
        total_spent: summary.total_spending,
        category_totals: summary.category_totals,
        category_percentages: summary.category_percentages,
        top_merchant: topMerchant,
        top_merchant_amount: topMerchantAmount,
        transaction_count: summary.transaction_count,
        severity,
        seen_roasts: seenRoasts,
      });
      if (res && res.text) {
        setCurrentRoast(res.text);
        setSeenRoasts((prev) => [...prev, res.text]);
      }
    } finally {
      setIsShuffling(false);
    }
  };

  // Copy Social Caption
  const handleCopyCaption = async () => {
    const primaryCatText = topCategory ? `${topCategory[0]} took ${topPercentage}% of the damage` : 'Casualties autopsied';
    const amountText = redactNumbers ? '₹XX,XXX' : `₹${summary.total_spending.toLocaleString('en-IN')}`;
    const caption = `Finopsy just autopsied my bank account.\n\nDiagnosis: ${personality}\nMonthly Damage: ${amountText} (${primaryCatText})\n\n"${currentRoast}"\n\nfinopsy.app #MoneyAutopsy #Finopsy`;

    try {
      await navigator.clipboard.writeText(caption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2500);
    } catch {
      alert('Could not copy caption to clipboard.');
    }
  };

  // Download High-Res Poster
  const handleDownload = async () => {
    if (!posterRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(posterRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `finopsy-autopsy-${username || 'case'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Failed to export poster image:', e);
      alert('Could not generate poster PNG. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-fadeIn overflow-y-auto">
      <div className="surface-card w-full max-w-5xl p-5 sm:p-7 border border-[rgba(255,255,255,0.12)] shadow-2xl relative bg-[#121312] my-auto">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.06)] pb-3.5 mb-5">
          <div className="flex items-center gap-3">
            <span className="font-mono-num text-[10px] text-[#D4FF00] uppercase tracking-wider font-bold bg-[#D4FF00]/10 px-2 py-0.5 rounded border border-[#D4FF00]/25">
              Poster Studio
            </span>
            <h3 className="font-display text-lg sm:text-xl font-bold text-[#F4F3EE]">
              Customize Your Autopsy Artifact
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#8E9089] hover:text-[#F4F3EE] text-xs font-mono-num px-2 py-1"
          >
            ESC ✕
          </button>
        </div>

        {/* 2-Column Customizer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Scaled Interactive Live Poster (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center bg-[#0A0B0A] p-3 sm:p-4 rounded-xl border border-[rgba(255,255,255,0.08)] shadow-inner overflow-hidden">
            {/* Poster Canvas Wrapper with CSS Scale to fit nicely on screens */}
            <div className="w-full flex justify-center items-center overflow-hidden py-1">
              <div
                style={{
                  transform: 'scale(0.46)',
                  transformOrigin: 'top center',
                  width: '1080px',
                  height: '1080px',
                  marginBottom: '-580px',
                }}
              >
                <div ref={posterRef}>
                  <ShareCard
                    totalSpent={summary.total_spending}
                    remaining={summary.remaining}
                    topCategory={topCategory ? { name: topCategory[0], percentage: topPercentage } : null}
                    moneyPersonality={personality}
                    roast={currentRoast}
                    transactionCount={summary.transaction_count}
                    username={username || undefined}
                    redactNumbers={redactNumbers}
                    activeStickers={activeStickers}
                    caseId="0828"
                  />
                </div>
              </div>
            </div>

            <span className="font-mono-num text-[10px] text-[#545650] mt-3">
              1080 × 1080 High-Resolution Vector Export
            </span>
          </div>

          {/* Right: Studio Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* 1. Roast Severity Selector */}
            <div className="space-y-2">
              <label className="font-mono-num text-[11px] uppercase tracking-wider text-[#8E9089] font-bold block">
                Roast Severity
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['mild', 'savage', 'unhinged'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => handleSelectSeverity(lvl)}
                    disabled={isShuffling}
                    className={`text-xs py-2 px-2 rounded-lg font-mono-num font-bold uppercase transition ${
                      severity === lvl
                        ? 'bg-[#D4FF00] text-black shadow-sm'
                        : 'bg-[#181918] text-[#8E9089] border border-[rgba(255,255,255,0.08)] hover:text-[#F4F3EE]'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Selectable Evidence Stickers (3 max) */}
            <div className="space-y-2">
              <label className="font-mono-num text-[11px] uppercase tracking-wider text-[#8E9089] font-bold block">
                Slap Evidence Stickers
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleToggleSticker('top-killer')}
                  className={`text-xs py-1.5 px-3 rounded-lg font-mono-num font-bold uppercase transition flex items-center gap-1.5 ${
                    activeStickers.includes('top-killer')
                      ? 'bg-[#181918] text-[#D4FF00] border border-[#D4FF00]'
                      : 'bg-[#141514] text-[#545650] border border-[rgba(255,255,255,0.06)] hover:text-[#8E9089]'
                  }`}
                >
                  <span>{activeStickers.includes('top-killer') ? '✓' : '+'}</span>
                  <span>[ TOP KILLER ]</span>
                </button>

                <button
                  onClick={() => handleToggleSticker('vampire')}
                  className={`text-xs py-1.5 px-3 rounded-lg font-mono-num font-bold uppercase transition flex items-center gap-1.5 ${
                    activeStickers.includes('vampire')
                      ? 'bg-[#FF4560]/20 text-[#FF4560] border border-[#FF4560]'
                      : 'bg-[#141514] text-[#545650] border border-[rgba(255,255,255,0.06)] hover:text-[#8E9089]'
                  }`}
                >
                  <span>{activeStickers.includes('vampire') ? '✓' : '+'}</span>
                  <span>[ VAMPIRE ]</span>
                </button>

                <button
                  onClick={() => handleToggleSticker('in-the-red')}
                  className={`text-xs py-1.5 px-3 rounded-lg font-mono-num font-bold uppercase transition flex items-center gap-1.5 ${
                    activeStickers.includes('in-the-red')
                      ? 'bg-[#FF4560]/20 text-[#FF4560] border border-[#FF4560]'
                      : 'bg-[#141514] text-[#545650] border border-[rgba(255,255,255,0.06)] hover:text-[#8E9089]'
                  }`}
                >
                  <span>{activeStickers.includes('in-the-red') ? '✓' : '+'}</span>
                  <span>[ IN THE RED ]</span>
                </button>
              </div>
            </div>

            {/* 3. Privacy: Redact Numbers Toggle */}
            <div className="pt-3 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between">
              <div>
                <span className="font-sans text-xs font-bold text-[#F4F3EE] block">
                  Redact Rupee Amounts
                </span>
                <span className="font-mono-num text-[11px] text-[#8E9089]">
                  Replaces totals with ₹XX,XXX for safe sharing
                </span>
              </div>
              <button
                onClick={() => setRedactNumbers(!redactNumbers)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  redactNumbers ? 'bg-[#D4FF00]' : 'bg-[#2A2C2A]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-black transition-transform ${
                    redactNumbers ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 4. Action Buttons */}
            <div className="pt-3 border-t border-[rgba(255,255,255,0.06)] space-y-2.5">
              <button
                onClick={handleShuffleRoast}
                disabled={isShuffling}
                className="btn-secondary w-full text-xs py-2.5 flex items-center justify-center gap-2 font-bold"
              >
                <span>{isShuffling ? 'Assembling...' : '🎲 Shuffle Punchline'}</span>
              </button>

              <button
                onClick={handleCopyCaption}
                className="btn-secondary w-full text-xs py-2.5 flex items-center justify-center gap-2 font-bold"
              >
                <span>{copiedCaption ? '✓ Copied to Clipboard!' : '📋 Copy Social Caption'}</span>
              </button>

              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="btn-primary w-full text-xs py-3 flex items-center justify-center gap-2 font-bold"
              >
                <span>{isDownloading ? 'Generating Image...' : '⚡ Download Poster (.PNG)'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
