'use client';

import React, { useState, useEffect } from 'react';

const TRANSACTIONS_STREAM = [
  { merchant: 'SWIGGY', time: '11:42 PM', amount: 480, tag: 'FOOD' },
  { merchant: 'AMAZON', time: '03:15 PM', amount: 2149, tag: 'SHOPPING' },
  { merchant: 'UBER', time: '02:15 AM', amount: 340, tag: 'TRANSPORT' },
  { merchant: 'STEAM SUMMER SALE', time: '01:20 AM', amount: 1890, tag: 'GAMING' },
  { merchant: 'NETFLIX', time: 'AUTO-DEBIT', amount: 649, tag: 'VAMPIRE' },
  { merchant: 'ZOMATO', time: '09:30 PM', amount: 560, tag: 'FOOD' },
  { merchant: 'MYNTRA', time: '06:45 PM', amount: 3200, tag: 'SHOPPING' },
];

export function ThermalReceiptVisual() {
  const [items, setItems] = useState<typeof TRANSACTIONS_STREAM>([]);
  const [isStamped, setIsStamped] = useState(false);
  const [recoil, setRecoil] = useState(false);

  useEffect(() => {
    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < 4) {
        setItems((prev) => [...prev, TRANSACTIONS_STREAM[currentIdx]]);
        currentIdx++;
      } else if (currentIdx === 4) {
        // Slam stamp with recoil
        setIsStamped(true);
        setRecoil(true);
        setTimeout(() => setRecoil(false), 200);
        currentIdx++;
      } else {
        // Reset cycle
        setTimeout(() => {
          setIsStamped(false);
          setItems([]);
          currentIdx = 0;
        }, 3200);
      }
    }, 900);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-sm mx-auto flex flex-col items-center select-none">
      {/* Top Printer Slot */}
      <div className="w-full bg-[#1A1C1A] h-3.5 rounded-t-lg border-x border-t border-white/20 shadow-inner flex items-center justify-center">
        <div className="w-48 h-1 bg-black rounded-full" />
      </div>

      {/* The Thermal Paper Receipt */}
      <div
        className={`w-full bg-[#F4F3EE] text-[#0A0B0A] font-mono-num p-5 sm:p-6 shadow-2xl rounded-b-sm border-x border-b border-black/10 transition-transform duration-150 relative overflow-hidden ${
          recoil ? 'translate-y-1 scale-[0.99]' : 'translate-y-0 scale-100'
        }`}
        style={{ minHeight: '360px' }}
      >
        {/* Receipt Header */}
        <div className="text-center border-b-2 border-dashed border-black/20 pb-3 mb-4">
          <span className="font-extrabold text-sm uppercase tracking-widest block">
            FINOPSY • THERMAL
          </span>
          <span className="text-[10px] text-[#555555] block mt-0.5">
            UPI CASUALTY RECORD • {new Date().toLocaleDateString('en-IN')}
          </span>
        </div>

        {/* Printed Lines */}
        <div className="space-y-2.5 text-xs">
          {items.map((txn, idx) => (
            <div
              key={idx}
              className="flex justify-between items-baseline border-b border-black/5 pb-1.5 animate-fadeIn"
            >
              <div>
                <span className="font-bold text-xs uppercase block text-[#0A0B0A]">
                  {txn.merchant}
                </span>
                <span className="text-[10px] text-[#666666]">{txn.time}</span>
              </div>
              <span className="font-extrabold text-xs text-[#0A0B0A]">
                ₹{txn.amount.toLocaleString('en-IN')}
              </span>
            </div>
          ))}

          {items.length === 0 && (
            <div className="py-12 text-center text-[#888888] text-xs italic">
              Printing statement transactions...
            </div>
          )}
        </div>

        {/* Total casualty summary */}
        {items.length >= 4 && (
          <div className="mt-4 pt-3 border-t-2 border-dashed border-black/20 flex justify-between items-baseline font-bold text-xs">
            <span>TOTAL DAMAGE</span>
            <span className="font-extrabold text-sm">₹6,279.00</span>
          </div>
        )}

        {/* THE SLAMMED RUBBER STAMP */}
        {isStamped && (
          <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none animate-fadeIn">
            <div className="border-4 border-[#0A0B0A] bg-[#D4FF00] text-[#0A0B0A] p-4 rounded-md shadow-2xl transform -rotate-12 border-dashed flex flex-col items-center">
              <span className="text-[10px] font-extrabold tracking-widest uppercase bg-black text-[#D4FF00] px-2 py-0.5 mb-1">
                TOP KILLER
              </span>
              <span className="font-extrabold text-2xl sm:text-3xl uppercase tracking-tight">
                SHOPPING
              </span>
              <span className="text-xs font-bold text-[#0A0B0A]">
                24% OF MONTHLY LIQUIDITY
              </span>
            </div>
          </div>
        )}

        {/* Jagged Bottom Edge */}
        <div
          className="absolute bottom-0 left-0 right-0 h-2 bg-[#0A0B0A]"
          style={{
            clipPath:
              'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)',
          }}
        />
      </div>
    </div>
  );
}
