'use client';

import React, { useState, useEffect } from 'react';

const RAW_ROWS = [
  { raw: 'UPI/93847291/SWIGGY_BLR/28391', clean: 'Swiggy', cat: 'Food & Dining', amt: '₹480' },
  { raw: 'POS-AMZN*492817*MKTG-IN', clean: 'Amazon', cat: 'Shopping', amt: '₹2,149' },
  { raw: 'UBER*TRIP*HELP*91823', clean: 'Uber', cat: 'Transport', amt: '₹340' },
  { raw: 'NETFLIX*DIGITAL*MEMBERSHIP', clean: 'Netflix', cat: 'Subscriptions', amt: '₹649' },
];

export function LaserScannerVisual() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % RAW_ROWS.length);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="surface-card p-6 sm:p-8 w-full max-w-xl mx-auto bg-[#121312] border border-[rgba(255,255,255,0.08)] shadow-2xl relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-3 mb-5">
        <div className="flex items-center gap-2">
          <span className="font-mono-num text-[10px] text-[#D4FF00] font-bold uppercase tracking-wider">
            Autopsy Scanner
          </span>
          <span className="text-xs text-[#8E9089]">Live Decoding</span>
        </div>
        <span className="font-mono-num text-xs text-[#D4FF00] font-semibold animate-pulse">
          Active
        </span>
      </div>

      {/* Rows with real-time laser decoding */}
      <div className="space-y-3">
        {RAW_ROWS.map((row, idx) => {
          const isDecoded = idx <= activeStep;

          return (
            <div
              key={idx}
              className={`p-3.5 rounded-lg border transition-all duration-500 relative overflow-hidden ${
                isDecoded
                  ? 'bg-[#181918] border-[rgba(212,255,0,0.25)]'
                  : 'bg-[#0E0F0E] border-white/5 opacity-50'
              }`}
            >
              {/* Laser beam sweep effect */}
              {idx === activeStep && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4FF00]/15 to-transparent animate-pulse pointer-events-none" />
              )}

              <div className="flex justify-between items-center text-xs font-mono-num">
                <div>
                  {isDecoded ? (
                    <div>
                      <p className="font-sans font-bold text-sm text-[#F4F3EE]">
                        {row.clean}
                      </p>
                      <span className="text-[11px] text-[#D4FF00]">
                        {row.cat}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[#8E9089] text-[11px] font-mono-num">
                      {row.raw}
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className="font-bold text-sm text-[#F4F3EE]">
                    {row.amt}
                  </span>
                  <span className="text-[10px] text-[#8E9089] block">
                    {isDecoded ? 'Cleaned' : 'Raw string'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
