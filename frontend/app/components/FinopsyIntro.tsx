'use client';

import React, { useState, useEffect } from 'react';

export default function FinopsyIntro() {
  const [step, setStep] = useState(0);
  const [isLifting, setIsLifting] = useState(false);
  const [isGone, setIsGone] = useState(false);

  useEffect(() => {
    // Step 0 -> 1: Warning Badge Pop (450ms)
    const t1 = setTimeout(() => setStep(1), 450);

    // Step 1 -> 2: FINOPSY Title Slam (1100ms)
    const t2 = setTimeout(() => setStep(2), 1100);

    // Step 2 -> 3: Subtle Comic Speech Bubble Pop (1900ms)
    const t3 = setTimeout(() => setStep(3), 1900);

    // Step 3 -> 4: Tagline Stamp Slam (2800ms)
    const t4 = setTimeout(() => setStep(4), 2800);

    // Step 4 -> 5: Smooth Shutter Lift (3700ms)
    const t5 = setTimeout(() => setIsLifting(true), 3700);

    // Step 5 -> Gone: (4600ms)
    const t6 = setTimeout(() => setIsGone(true), 4600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
    };
  }, []);

  const handleSkip = () => {
    setIsGone(true);
  };

  if (isGone) return null;

  return (
    <div
      className={`intro-curtain select-none ${isLifting ? 'lifting' : ''}`}
      style={{
        backgroundColor: '#080908',
        transition: 'transform 0.85s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease',
      }}
    >
      {/* Skip Button */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 font-mono-num text-[11px] font-bold text-[#888888] hover:text-[#FFFFFF] uppercase tracking-widest px-3 py-1.5 rounded border border-white/15 hover:border-white/40 transition z-50 cursor-pointer"
      >
        Skip [ESC]
      </button>

      {/* Subtle Halftone Matrix in Background */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#D4FF00 1.5px, transparent 1.5px)',
          backgroundSize: '16px 16px',
        }}
      />

      {/* Center Kinetic Pop Stage */}
      <div className="text-center px-4 relative z-10 flex flex-col items-center justify-center min-h-[340px] max-w-lg mx-auto space-y-5">
        {/* POP 1: Streetwear Warning Badge */}
        <div
          className={`transform -rotate-2 transition-all duration-400 ${
            step >= 1 ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-2'
          }`}
        >
          <span className="inline-block font-display font-extrabold text-xs uppercase px-3.5 py-1 bg-[#D4FF00] text-[#0A0B0A] border-2 border-black rounded-md shadow-[2px_2px_0px_#FFFFFF] tracking-wider">
            FORENSIC AUTOPSY ENGINE
          </span>
        </div>

        {/* POP 2: Massive Kinetic Brand Typography */}
        <div
          className={`transition-all duration-500 transform ${
            step >= 2 ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-4'
          }`}
        >
          <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight text-[#FFFFFF] uppercase leading-none drop-shadow-[0_6px_16px_rgba(0,0,0,0.8)]">
            FINOPSY<span className="text-[#D4FF00]">.</span>
          </h1>
        </div>

        {/* POP 3: Subtle Graphic Speech Bubble */}
        <div
          className={`relative bg-[#181A18] border border-white/20 px-6 py-3.5 rounded-2xl shadow-xl transition-all duration-400 max-w-md ${
            step >= 3 ? 'scale-100 opacity-100 translate-y-0' : 'scale-85 opacity-0 translate-y-3 pointer-events-none'
          }`}
        >
          <p className="font-sans font-bold text-sm sm:text-base text-[#F4F3EE] italic leading-snug">
            &ldquo;Your bank account has officially been summoned.&rdquo;
          </p>

          {/* Speech Bubble Tail */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-[#181A18] border-r border-b border-white/20 transform rotate-45" />
        </div>

        {/* POP 4: Tagline Stamp Slam */}
        <div
          className={`pt-2 transition-all duration-400 ${
            step >= 4 ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-2'
          }`}
        >
          <span className="font-mono-num text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-[#D4FF00] bg-black/70 px-4 py-1.5 rounded-full border border-[#D4FF00]/40 inline-block shadow-[0_0_16px_rgba(212,255,0,0.25)]">
            YOUR MONEY. AUTOPSIED.
          </span>
        </div>
      </div>
    </div>
  );
}
