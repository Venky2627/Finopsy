'use client';

import React, { useState, useEffect } from 'react';

interface AutopsyLoadingScreenProps {
  onComplete?: () => void;
  isEncrypted?: boolean;
  errorMessage?: string | null;
  onPasswordSubmit?: (pw: string) => void;
  onRetry?: () => void;
}

const POP_MESSAGES = [
  {
    tag: 'UPI DETECTED',
    bubble: 'Scanning 11:42 PM midnight food orders...',
    sticker: '42 SWIGGY ORDERS',
    sub: 'Extracting messy payment references',
    color: '#D4FF00',
  },
  {
    tag: 'RETAIL DETECTED',
    bubble: 'Amazon delivery drivers know your dog by name...',
    sticker: 'RETAIL CRIME',
    sub: 'Categorizing shopping & late night impulses',
    color: '#FF7A33',
  },
  {
    tag: 'VAMPIRES CAUGHT',
    bubble: 'Wait, ₹1,500/mo for a gym you visited once in 2024?!',
    sticker: 'VAMPIRE ALERT',
    sub: 'Isolating recurring auto-debit leeches',
    color: '#FF4560',
  },
  {
    tag: 'AUTOPSY FINALIZED',
    bubble: 'Cooking up the most brutally honest roast possible...',
    sticker: 'DAMAGE: CRITICAL',
    sub: 'Generating your financial autopsy poster',
    color: '#D4FF00',
  },
];

export function AutopsyLoadingScreen({
  isEncrypted = false,
  errorMessage = null,
  onPasswordSubmit,
  onRetry,
}: AutopsyLoadingScreenProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(15);
  const [password, setPassword] = useState('');
  const [stampSlam, setStampSlam] = useState(false);

  useEffect(() => {
    if (isEncrypted || errorMessage) return;

    const t1 = setTimeout(() => {
      setStepIdx(1);
      setProgress(45);
    }, 700);

    const t2 = setTimeout(() => {
      setStepIdx(2);
      setProgress(75);
    }, 1400);

    const t3 = setTimeout(() => {
      setStepIdx(3);
      setProgress(95);
    }, 2100);

    const t4 = setTimeout(() => {
      setProgress(100);
      setStampSlam(true);
    }, 2700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isEncrypted, errorMessage]);

  // Handle Encrypted PDF
  if (isEncrypted) {
    return (
      <div className="max-w-md mx-auto py-16 text-center animate-fadeIn select-none">
        <div className="surface-card p-8 border-2 border-[#D4FF00] bg-[#121312] text-left space-y-5 shadow-2xl relative">
          <div className="flex items-center gap-2">
            <span className="font-mono-num text-[11px] font-extrabold uppercase tracking-wider bg-[#D4FF00] text-black px-2 py-0.5 rounded">
              LOCKED STATEMENT
            </span>
          </div>

          <h3 className="font-display text-2xl font-black text-[#F4F3EE]">
            Enter PDF Password
          </h3>
          <p className="text-xs text-[#8E9089] leading-relaxed">
            Your bank statement is locked. Enter the password (DOB, PAN, or account digits) to unlock:
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (password && onPasswordSubmit) onPasswordSubmit(password);
            }}
            className="space-y-4 pt-1"
          >
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter statement password"
              className="input-field text-sm font-mono-num"
              autoFocus
              required
            />

            <button
              type="submit"
              className="btn-primary w-full text-xs font-bold py-3 uppercase tracking-wider"
            >
              Unlock & Run Autopsy
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Handle Error
  if (errorMessage) {
    return (
      <div className="max-w-md mx-auto py-16 text-center animate-fadeIn select-none">
        <div className="surface-card p-8 border-2 border-[#FF4560] bg-[#161212] text-left space-y-4 shadow-2xl">
          <span className="font-mono-num text-[11px] font-extrabold uppercase tracking-wider bg-[#FF4560] text-white px-2 py-0.5 rounded">
            PARSING FAILED
          </span>

          <h3 className="font-display text-xl font-bold text-[#F4F3EE]">
            Could not read this statement
          </h3>
          <p className="text-xs text-[#8E9089] leading-relaxed">
            {errorMessage}
          </p>

          <div className="pt-2">
            <button
              onClick={onRetry}
              className="btn-secondary w-full text-xs font-semibold py-2.5"
            >
              Try Another File
            </button>
          </div>
        </div>
      </div>
    );
  }

  const current = POP_MESSAGES[stepIdx] || POP_MESSAGES[0];

  return (
    <div className="max-w-md mx-auto py-16 text-center animate-fadeIn select-none">
      {/* Pop-Culture Kinetic Container */}
      <div className="surface-card p-7 sm:p-8 bg-[#121312] border-2 border-[rgba(255,255,255,0.12)] shadow-2xl relative overflow-hidden space-y-6">
        {/* Animated Halftone / Radial Burst in Background */}
        <div
          className="absolute -right-8 -top-8 w-36 h-36 opacity-15 pointer-events-none animate-spin"
          style={{
            backgroundImage: 'radial-gradient(#D4FF00 2px, transparent 2px)',
            backgroundSize: '12px 12px',
            animationDuration: '20s',
          }}
        />

        {/* Top Comic Badge Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span
              className="font-mono-num text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded transition-colors duration-300"
              style={{ backgroundColor: current.color, color: '#0A0B0A' }}
            >
              {current.tag}
            </span>
          </div>

          <span className="font-mono-num text-xs font-extrabold text-[#F4F3EE]">
            {progress}%
          </span>
        </div>

        {/* Floating Kinetic Comic Sticker Tag */}
        <div className="flex justify-center">
          <div
            key={current.sticker}
            className="inline-block transform -rotate-2 border-2 border-black bg-white text-black font-display font-black text-xs uppercase px-3 py-1 rounded shadow-[3px_3px_0px_#D4FF00] animate-bounce"
          >
            {current.sticker}
          </div>
        </div>

        {/* The Snappy Comic Speech Bubble */}
        <div className="relative bg-[#1A1C1A] border border-white/15 p-4 rounded-xl shadow-lg text-left transition-all duration-300">
          <p
            key={current.bubble}
            className="font-sans font-extrabold text-sm sm:text-base text-[#F4F3EE] leading-relaxed italic animate-fadeIn"
          >
            &ldquo;{current.bubble}&rdquo;
          </p>

          <span className="font-mono-num text-[11px] text-[#8E9089] block mt-2">
            {current.sub}
          </span>

          {/* Speech Bubble Tail */}
          <div className="absolute -bottom-2 left-8 w-3 h-3 bg-[#1A1C1A] border-r border-b border-white/15 transform rotate-45" />
        </div>

        {/* Chunky Pop Comic Progress Meter */}
        <div className="space-y-2 pt-2">
          <div className="w-full bg-[#0A0B0A] h-3 rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(212,255,0,0.5)]"
              style={{
                backgroundColor: current.color,
                width: `${progress}%`,
              }}
            />
          </div>

          {/* Segment Steps */}
          <div className="flex justify-between items-center px-1 font-mono-num text-[10px] text-[#666666] font-bold">
            <span className={stepIdx >= 0 ? 'text-[#D4FF00]' : ''}>1. RAW</span>
            <span className={stepIdx >= 1 ? 'text-[#FF7A33]' : ''}>2. MERCHANTS</span>
            <span className={stepIdx >= 2 ? 'text-[#FF4560]' : ''}>3. VAMPIRES</span>
            <span className={stepIdx >= 3 ? 'text-[#D4FF00]' : ''}>4. ROAST</span>
          </div>
        </div>

        {/* End Stamp Slam */}
        {stampSlam && (
          <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn pointer-events-none">
            <div className="border-4 border-black bg-[#D4FF00] text-black p-4 rounded-md shadow-2xl transform rotate-6 border-dashed flex flex-col items-center">
              <span className="font-black text-2xl uppercase tracking-tight font-display">
                AUTOPSY READY
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
