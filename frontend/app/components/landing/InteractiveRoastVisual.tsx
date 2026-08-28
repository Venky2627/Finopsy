'use client';

import React, { useState } from 'react';

const ROAST_CYCLES = [
  { topic: 'Shopping', text: 'Respectfully, the mall won against your bank account.' },
  { topic: 'Food Delivery', text: 'Your kitchen is basically a glorified microwave stand.' },
  { topic: 'Subscriptions', text: 'Paying ₹3,000/mo for gym memberships you haven\'t opened since 2024.' },
  { topic: 'Late Night Outflows', text: 'Nothing good happens to your wallet after 1:00 AM.' },
  { topic: 'Retail Therapy', text: 'Amazon delivery drivers know your dogs by name. Retail therapy won\'t fix your GPA.' },
];

export function InteractiveRoastVisual() {
  const [index, setIndex] = useState(0);
  const [isCycling, setIsCycling] = useState(false);

  const handleRoastClick = () => {
    setIsCycling(true);
    let count = 0;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % ROAST_CYCLES.length);
      count++;
      if (count >= 5) {
        clearInterval(interval);
        setIsCycling(false);
      }
    }, 120);
  };

  const current = ROAST_CYCLES[index];

  return (
    <div className="verdict-box w-full max-w-xl mx-auto space-y-4 text-left">
      <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
        <span className="font-mono-num text-[11px] text-[#D4FF00] font-bold uppercase tracking-wider">
          Interactive Roast Engine • {current.topic}
        </span>
        <span className="font-mono-num text-xs text-[#8E9089]">
          1-Click Simulator
        </span>
      </div>

      <p className="font-sans font-bold text-lg sm:text-xl text-[#F4F3EE] leading-relaxed italic min-h-[60px] flex items-center">
        {isCycling ? (
          <span className="text-[#D4FF00] not-italic animate-pulse">
            Calculating roast severity...
          </span>
        ) : (
          `“${current.text}”`
        )}
      </p>

      <div className="pt-2 flex justify-between items-center">
        <button
          onClick={handleRoastClick}
          disabled={isCycling}
          className="btn-primary text-xs py-2 px-5 font-bold"
        >
          {isCycling ? 'Shuffling...' : 'Roast Me'}
        </button>

        <span className="font-mono-num text-[11px] text-[#8E9089]">
          Click to simulate another financial crime
        </span>
      </div>
    </div>
  );
}
