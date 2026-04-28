import React from 'react';
import { useStore } from '../store';

function statusColor(status: string) {
  if (status === 'Resolved') return '#17c964';
  if (status === 'In Progress') return '#ffb020';
  return '#ff3b5c';
}

export default function AlertsPanel() {
  const issues = useStore(s => s.issues);
  const recent = React.useMemo(() => {
    return issues
      .slice()
      .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
      .slice(0, 6);
  }, [issues]);

  return (
    <div style={{ position: 'absolute', right: 18, top: 90, width: 260, background: 'rgba(8,12,20,0.72)', border: '1px solid rgba(255,255,255,0.04)', padding: 10, borderRadius: 8, color: '#dfefff', fontFamily: 'Inter', fontSize: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong style={{ fontSize: 12, letterSpacing: '0.06em' }}>Live Alerts</strong>
        <span style={{ fontSize: 11, color: '#9fbcd9' }}>{new Date().toLocaleTimeString()}</span>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {recent.map(i => (
          <div key={i.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 8px', borderRadius: 6, background: 'linear-gradient(180deg, rgba(255,255,255,0.02), transparent)' }}>
            <div style={{ width: 10, height: 10, borderRadius: 6, background: statusColor(i.status), boxShadow: `0 0 8px ${statusColor(i.status)}66` }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{i.category}</div>
              <div style={{ fontSize: 11, color: '#9fbcd9' }}>{new Date(i.timestamp).toLocaleString()}</div>
            </div>
            <div style={{ fontSize: 11, color: '#bcd6ef' }}>{i.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
