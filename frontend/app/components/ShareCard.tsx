'use client';

import React from 'react';

export type PosterSticker = 'top-killer' | 'vampire' | 'in-the-red';

export interface ShareCardProps {
  totalSpent: number;
  remaining?: number;
  topCategory: { name: string; percentage: number } | null;
  moneyPersonality: string;
  roast: string;
  transactionCount: number;
  username?: string;
  redactNumbers?: boolean;
  activeStickers?: PosterSticker[];
  caseId?: string;
}

export function ShareCard({
  totalSpent,
  remaining = 0,
  topCategory,
  moneyPersonality,
  roast,
  transactionCount,
  username,
  redactNumbers = false,
  activeStickers = [],
  caseId = '0828',
}: ShareCardProps) {
  const isDeficit = remaining < 0;

  const formatAmount = (amt: number) => {
    if (redactNumbers) return '₹XX,XXX';
    return `₹${Math.abs(amt).toLocaleString('en-IN')}`;
  };

  return (
    <div
      id="finopsy-share-poster"
      style={{
        width: '1080px',
        height: '1080px',
        backgroundColor: '#F4F3EE',
        color: '#0A0B0A',
        fontFamily: 'var(--font-sans, -apple-system, sans-serif)',
        padding: '64px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        border: '1px solid rgba(0, 0, 0, 0.12)',
        overflow: 'hidden',
      }}
    >
      {/* Halftone subtle background texture grid */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          pointerEvents: 'none',
        }}
      />

      {/* 1. TOP HEADER */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            borderBottom: '3px solid #0A0B0A',
            paddingBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '20px',
                letterSpacing: '-0.02em',
                color: '#0A0B0A',
                fontWeight: '900',
                textTransform: 'uppercase',
              }}
            >
              FINOPSY
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '13px',
                color: '#555555',
                fontWeight: '700',
                letterSpacing: '0.1em',
              }}
            >
              CASE #{caseId}
            </span>
          </div>

          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '13px',
              fontWeight: '700',
              color: '#333333',
              letterSpacing: '0.05em',
            }}
          >
            {transactionCount} TRANSACTIONS AUTOPSIED
          </span>
        </div>

        {/* Diagnosis & Personality */}
        <div style={{ marginTop: '36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '12px',
                letterSpacing: '0.2em',
                color: '#666666',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '8px',
                fontWeight: '800',
              }}
            >
              FORENSIC DIAGNOSIS
            </span>
            <h1
              style={{
                fontSize: '64px',
                fontWeight: '900',
                letterSpacing: '-0.04em',
                textTransform: 'uppercase',
                color: '#0A0B0A',
                margin: 0,
                lineHeight: 1.0,
              }}
            >
              {moneyPersonality}
            </h1>
            {username && (
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '14px',
                  color: '#444444',
                  fontWeight: '700',
                  display: 'block',
                  marginTop: '8px',
                }}
              >
                PATIENT: @{username.toUpperCase()}
              </span>
            )}
          </div>

          {/* Active Stamp Badges Slapped Right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
            {activeStickers.includes('top-killer') && (
              <div
                style={{
                  backgroundColor: '#0A0B0A',
                  color: '#D4FF00',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '14px',
                  fontWeight: '900',
                  padding: '6px 14px',
                  borderRadius: '4px',
                  transform: 'rotate(-2deg)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  border: '1px solid #D4FF00',
                }}
              >
                [ TOP KILLER ]
              </div>
            )}
            {activeStickers.includes('vampire') && (
              <div
                style={{
                  backgroundColor: '#FF4560',
                  color: '#FFFFFF',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '14px',
                  fontWeight: '900',
                  padding: '6px 14px',
                  borderRadius: '4px',
                  transform: 'rotate(3deg)',
                  boxShadow: '0 4px 12px rgba(255,69,96,0.25)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                [ VAMPIRE DETECTED ]
              </div>
            )}
            {activeStickers.includes('in-the-red') && (
              <div
                style={{
                  backgroundColor: '#0A0B0A',
                  color: '#FF4560',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '14px',
                  fontWeight: '900',
                  padding: '6px 14px',
                  borderRadius: '4px',
                  transform: 'rotate(-4deg)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  border: '2px solid #FF4560',
                }}
              >
                [ IN THE RED ]
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. MAIN METRIC SLATE */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '32px',
          backgroundColor: '#0A0B0A',
          color: '#F4F3EE',
          borderRadius: '12px',
          padding: '40px 48px',
          position: 'relative',
          zIndex: 2,
          boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
        }}
      >
        <div>
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '13px',
              color: '#8E9089',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              display: 'block',
              marginBottom: '6px',
              fontWeight: '700',
            }}
          >
            Total Monthly Casualty
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '56px',
              fontWeight: '900',
              color: '#F4F3EE',
              letterSpacing: '-0.03em',
              lineHeight: 1.0,
            }}
          >
            {formatAmount(totalSpent)}
          </span>
        </div>

        <div>
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '13px',
              color: '#8E9089',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              display: 'block',
              marginBottom: '6px',
              fontWeight: '700',
            }}
          >
            Primary Cause
          </span>
          <span
            style={{
              fontFamily: 'var(--font-sans, sans-serif)',
              fontSize: '34px',
              fontWeight: '900',
              color: '#D4FF00',
              display: 'block',
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            {topCategory ? `${topCategory.name} (${Math.round(topCategory.percentage)}%)` : 'NONE'}
          </span>
        </div>
      </div>

      {/* 3. PHYSICIAN'S NOTES (ROAST) */}
      <div
        style={{
          borderLeft: '5px solid #0A0B0A',
          paddingLeft: '32px',
          margin: '4px 0',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '12px',
            letterSpacing: '0.15em',
            color: '#666666',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: '10px',
            fontWeight: '800',
          }}
        >
          PHYSICIAN&apos;S NOTES
        </span>
        <p
          style={{
            fontSize: '26px',
            fontStyle: 'italic',
            lineHeight: 1.35,
            color: '#111111',
            margin: 0,
            fontWeight: '700',
            maxWidth: '880px',
          }}
        >
          &ldquo;{roast}&rdquo;
        </p>
      </div>

      {/* 4. BOTTOM FOOTER & CASE CLOSED STAMP */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          borderTop: '3px solid #0A0B0A',
          paddingTop: '20px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div>
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '14px',
              color: '#0A0B0A',
              fontWeight: '900',
              display: 'block',
              letterSpacing: '0.05em',
            }}
          >
            finopsy.app
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '12px',
              color: '#666666',
              fontWeight: '600',
            }}
          >
            Your Money. Autopsied.
          </span>
        </div>

        {/* Case Closed Official Stamp */}
        <div
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '14px',
            fontWeight: '900',
            letterSpacing: '0.12em',
            color: '#0A0B0A',
            border: '2px solid #0A0B0A',
            padding: '6px 16px',
            borderRadius: '4px',
            textTransform: 'uppercase',
          }}
        >
          [ CASE CLOSED ]
        </div>
      </div>
    </div>
  );
}
