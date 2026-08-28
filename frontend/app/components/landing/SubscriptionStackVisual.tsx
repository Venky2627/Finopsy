'use client';

import React, { useState } from 'react';

export function SubscriptionStackVisual() {
  const [viewAnnual, setViewAnnual] = useState(false);

  return (
    <div className="surface-card p-6 sm:p-8 w-full max-w-xl mx-auto bg-[#121312] border border-[rgba(255,255,255,0.08)] shadow-2xl space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[rgba(255,255,255,0.06)] pb-4">
        <div>
          <span className="font-mono-num text-[10px] text-[#D4FF00] font-bold uppercase tracking-wider block mb-1">
            Subscription Vampires
          </span>
          <h3 className="font-display text-xl font-bold text-[#F4F3EE]">
            The Silent Auto-Pilot Drain
          </h3>
        </div>

        <button
          onClick={() => setViewAnnual(!viewAnnual)}
          className="btn-secondary text-xs py-1.5 px-3 font-mono-num"
        >
          {viewAnnual ? 'Show Monthly' : 'Show 1-Year Total'}
        </button>
      </div>

      {/* Dynamic Amount Highlight */}
      <div className="bg-[#181918] p-5 rounded-xl border border-[rgba(212,255,0,0.25)] flex justify-between items-center">
        <div>
          <span className="text-xs text-[#8E9089] block font-mono-num">
            {viewAnnual ? 'Annual Projected Outflow' : 'Monthly Recurring Outflow'}
          </span>
          <span className="font-mono-num text-3xl font-extrabold text-[#F4F3EE]">
            {viewAnnual ? '₹36,414.00' : '₹3,034.50'}
          </span>
        </div>

        <span className="font-mono-num text-xs text-[#D4FF00] font-bold bg-[#D4FF00]/10 px-2.5 py-1 rounded">
          {viewAnnual ? '12 Months Auto-Debit' : '4 Active Vampires'}
        </span>
      </div>

      {/* Stack of Subscriptions */}
      <div className="grid grid-cols-2 gap-3 text-xs font-mono-num">
        <div className="bg-[#141514] p-3 rounded-lg border border-white/5 flex justify-between items-center">
          <span className="text-[#F4F3EE] font-bold">Netflix</span>
          <span className="text-[#8E9089]">₹499/mo</span>
        </div>
        <div className="bg-[#141514] p-3 rounded-lg border border-white/5 flex justify-between items-center">
          <span className="text-[#F4F3EE] font-bold">Spotify</span>
          <span className="text-[#8E9089]">₹119/mo</span>
        </div>
        <div className="bg-[#141514] p-3 rounded-lg border border-white/5 flex justify-between items-center">
          <span className="text-[#F4F3EE] font-bold">Coursera</span>
          <span className="text-[#8E9089]">₹916/mo</span>
        </div>
        <div className="bg-[#141514] p-3 rounded-lg border border-white/5 flex justify-between items-center">
          <span className="text-[#F4F3EE] font-bold">Gym</span>
          <span className="text-[#8E9089]">₹1,500/mo</span>
        </div>
      </div>
    </div>
  );
}
