import type { ReactNode } from 'react';

interface StatRowItem {
  color: string;
  label: string;
  value: number | string;
  pct?: string;
}

interface StatCardProps {
  icon: ReactNode;
  title: string;
  total?: number | string;
  totalLabel?: string;
  rows: StatRowItem[];
  accentColor?: string;
}

export default function StatCard({ icon, title, total, totalLabel = 'Total', rows, accentColor = '#00d4ff' }: StatCardProps) {
  return (
    <div className="glass-panel hover-panel anim-fade-in" style={{ padding: '0 0 8px 0' }}>
      <div className="panel-header">
        <span style={{ color: accentColor, display: 'flex', alignItems: 'center' }}>{icon}</span>
        <span className="panel-title">{title}</span>
      </div>
      <div style={{ padding: '6px 10px' }}>
        {total !== undefined && (
          <div className="stat-row" style={{ marginBottom: 4 }}>
            <span className="stat-label" style={{ color: '#a0c8d8' }}>{totalLabel}</span>
            <span className="stat-value" style={{ color: accentColor, fontFamily: 'Orbitron', fontSize: 11 }}>{total}</span>
          </div>
        )}
        {rows.map((row, i) => (
          <div className="stat-row" key={i}>
            <span className="stat-dot" style={{ background: row.color, boxShadow: `0 0 5px ${row.color}55` }} />
            <span className="stat-label">{row.label}</span>
            <span className="stat-value">{row.value}</span>
            {row.pct !== undefined && <span className="stat-pct">{row.pct}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
