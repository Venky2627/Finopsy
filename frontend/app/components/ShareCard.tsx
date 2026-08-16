import React from 'react';

export interface ShareCardProps {
  totalSpent: number;
  topCategory: { name: string; percentage: number } | null;
  moneyPersonality: string;
  roast: string;
  transactionCount: number;
}

export const ShareCard: React.FC<ShareCardProps> = ({
  totalSpent,
  topCategory,
  moneyPersonality,
  roast,
  transactionCount,
}) => {
  const formattedTotal = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(totalSpent);

  const getStatus = (count: number) => {
    if (count > 50) return "CRITICAL";
    if (count > 20) return "CONCERNING";
    return "STABLE";
  };

  return (
    <div
      id="finopsy-share-card"
      style={{
        width: '1080px',
        height: '1080px',
        backgroundColor: '#10110f',
        color: '#f6f3e8',
        padding: '80px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '32px', fontWeight: 900, margin: 0, letterSpacing: '0.1em', color: '#f6f3e8' }}>
            FINOPSY
          </h2>
          <p style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0 0 0', color: '#d5ff51', letterSpacing: '0.2em' }}>
            MONEY AUTOPSY
          </p>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 8px 0', color: '#5c5c54', letterSpacing: '0.15em' }}>
            FINANCIAL VITALS
          </p>
          <p style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#f6f3e8', textTransform: 'uppercase' }}>
            STATUS: <span style={{ color: '#d5ff51' }}>{getStatus(transactionCount)}</span>
          </p>
          <p style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0 0 0', color: '#f6f3e8', textTransform: 'uppercase' }}>
            TXNS: {transactionCount}
          </p>
        </div>
      </div>

      {/* Damage */}
      <div>
        <h1 style={{ fontSize: '200px', fontWeight: 900, margin: 0, lineHeight: 0.85, letterSpacing: '-0.05em' }}>
          {formattedTotal}
        </h1>
        <p style={{ fontSize: '32px', fontWeight: 900, color: '#5c5c54', margin: '24px 0 0 0', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          TOTAL DAMAGE
        </p>
      </div>

      <div style={{ width: '100%', height: '2px', backgroundColor: '#20211f' }} />

      {/* Personality */}
      <div>
        <p style={{ fontSize: '20px', fontWeight: 900, color: '#d5ff51', margin: '0 0 16px 0', letterSpacing: '0.15em' }}>
          YOUR MONEY PERSONALITY
        </p>
        <h2 style={{ fontSize: '96px', fontWeight: 900, margin: 0, lineHeight: 0.9, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
          {moneyPersonality}
        </h2>
        {topCategory && (
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#8b8b80', margin: '24px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {topCategory.name} = {Math.round(topCategory.percentage)}% OF YOUR DAMAGE
          </p>
        )}
      </div>

      {/* Verdict */}
      <div style={{ borderLeft: '8px solid #d5ff51', paddingLeft: '32px' }}>
        <p style={{ fontSize: '18px', fontWeight: 900, color: '#5c5c54', margin: '0 0 12px 0', letterSpacing: '0.15em' }}>
          THE VERDICT
        </p>
        <p style={{ fontSize: '48px', fontWeight: 800, margin: 0, lineHeight: 1.1, color: '#f6f3e8' }}>
          "{roast}"
        </p>
      </div>
    </div>
  );
};
