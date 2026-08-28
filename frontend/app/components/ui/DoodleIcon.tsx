'use client';

import React from 'react';

export type DoodleType =
  | 'food'
  | 'entertainment'
  | 'music'
  | 'shopping'
  | 'fitness'
  | 'education'
  | 'transport'
  | 'bills'
  | 'groceries'
  | 'healthcare'
  | 'travel'
  | 'general';

interface DoodleIconProps {
  type: DoodleType;
  className?: string;
  size?: number;
}

export function DoodleIcon({ type, className = '', size = 20 }: DoodleIconProps) {
  switch (type) {
    case 'food':
      // Plate & Fork/Spoon Doodle
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Plate */}
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" strokeDasharray="2 2" />
          {/* Fork */}
          <path d="M7 6v4a1 1 0 0 0 1 1h0a1 1 0 0 0 1-1V6" />
          <path d="M8 11v7" />
          {/* Knife */}
          <path d="M16 6v12" />
          <path d="M16 6a2 2 0 0 0-2 2v4h2" />
        </svg>
      );

    case 'entertainment':
      // Popcorn / TV Screen Doodle
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Retro TV / Popcorn */}
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7L5 3" />
          <path d="M16 7l3-4" />
          <line x1="8" y1="13" x2="8" y2="15" />
          <circle cx="15" cy="13.5" r="1.5" />
        </svg>
      );

    case 'music':
      // Over-ear Headphones Doodle
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M3 14v-3a9 9 0 0 1 18 0v3" />
          <rect x="2" y="14" width="4" height="6" rx="2" />
          <rect x="18" y="14" width="4" height="6" rx="2" />
        </svg>
      );

    case 'shopping':
      // Quirky Shopping Tote Doodle
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      );

    case 'fitness':
      // Dumbbell Doodle
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M6 5v14" />
          <path d="M18 5v14" />
          <path d="M2 9v6" />
          <path d="M22 9v6" />
          <path d="M6 12h12" />
        </svg>
      );

    case 'education':
      // Open Book Doodle
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      );

    case 'transport':
      // Quirky Car Doodle
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11 2 11.5 2 12v4c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <circle cx="17" cy="17" r="2" />
        </svg>
      );

    case 'groceries':
      // Apple / Fresh Market Doodle
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M12 4c.5-1.5 2-2 3-2" />
          <path d="M12 4C8 2 4 4 4 9c0 7 8 13 8 13s8-6 8-13c0-5-4-7-8-5z" />
        </svg>
      );

    case 'bills':
      // Lightning Spark Doodle
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );

    case 'healthcare':
      // Pill / First Aid Doodle
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M10.5 20.5l10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
          <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" />
        </svg>
      );

    case 'travel':
      // Paper Airplane / Compass Doodle
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M22 2L11 13" />
          <path d="M22 2L15 22L11 13L2 9L22 2Z" />
        </svg>
      );

    default:
      // Star Sparkle Doodle
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M12 2l2.4 6.9 7.1.3-5.5 4.5 1.8 6.9-5.8-4.2-5.8 4.2 1.8-6.9-5.5-4.5 7.1-.3z" />
        </svg>
      );
  }
}

export function getDoodleForCategory(cat: string): DoodleType {
  const c = cat.toLowerCase();
  if (c.includes('food') || c.includes('dining') || c.includes('restaurant') || c.includes('swiggy') || c.includes('zomato')) return 'food';
  if (c.includes('entertainment') || c.includes('netflix') || c.includes('prime') || c.includes('hotstar') || c.includes('movie')) return 'entertainment';
  if (c.includes('music') || c.includes('spotify') || c.includes('apple music') || c.includes('wynk')) return 'music';
  if (c.includes('shopping') || c.includes('amazon') || c.includes('myntra') || c.includes('flipkart')) return 'shopping';
  if (c.includes('fitness') || c.includes('gym') || c.includes('gold') || c.includes('cult') || c.includes('sport')) return 'fitness';
  if (c.includes('education') || c.includes('coursera') || c.includes('udemy') || c.includes('college') || c.includes('course')) return 'education';
  if (c.includes('transport') || c.includes('uber') || c.includes('ola') || c.includes('rapido') || c.includes('fuel') || c.includes('cab')) return 'transport';
  if (c.includes('grocer') || c.includes('blinkit') || c.includes('zepto') || c.includes('instamart')) return 'groceries';
  if (c.includes('bill') || c.includes('utilit') || c.includes('electric') || c.includes('wifi') || c.includes('recharge')) return 'bills';
  if (c.includes('health') || c.includes('doctor') || c.includes('pharm') || c.includes('apollo')) return 'healthcare';
  if (c.includes('travel') || c.includes('flight') || c.includes('hotel') || c.includes('makemytrip')) return 'travel';
  return 'general';
}

export function getDoodleForMerchant(merchant: string, category: string): DoodleType {
  const m = merchant.toLowerCase();
  if (m.includes('netflix') || m.includes('prime video') || m.includes('hotstar') || m.includes('hbo')) return 'entertainment';
  if (m.includes('spotify') || m.includes('apple music') || m.includes('youtube music')) return 'music';
  if (m.includes('coursera') || m.includes('udemy') || m.includes('edx') || m.includes('skillshare')) return 'education';
  if (m.includes('gym') || m.includes('gold') || m.includes('cult') || m.includes('fitness') || m.includes('anytime')) return 'fitness';
  if (m.includes('swiggy') || m.includes('zomato') || m.includes('mcdonald') || m.includes('starbucks')) return 'food';
  if (m.includes('amazon') || m.includes('myntra') || m.includes('flipkart') || m.includes('ajio')) return 'shopping';
  if (m.includes('uber') || m.includes('ola') || m.includes('rapido')) return 'transport';
  return getDoodleForCategory(category);
}
