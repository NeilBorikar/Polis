import React from 'react';

export default function ReportButton({ onReport }: { onReport: () => void }) {
  return (
    <button onClick={onReport} style={{
      position: 'absolute', right: 18, bottom: 90,
      background: 'linear-gradient(180deg,#ff5b6b,#ff3b5c)',
      color: 'white', border: 'none', padding: '10px 14px', borderRadius: 8,
      boxShadow: '0 6px 18px rgba(255,59,92,0.28)', cursor: 'pointer', fontWeight: 700,
      fontFamily: 'Inter', fontSize: 12,
    }}>Report Issue</button>
  );
}
