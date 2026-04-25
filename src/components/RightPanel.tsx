import type { ReactNode } from 'react';
import { Car, Leaf, Circle } from 'lucide-react';
import StatCard from './StatCard';
import GaugeWidget from './GaugeWidget';
import { useStore } from '../store';

function pct(v: number, t: number) { return t ? `(${Math.round((v / t) * 100)} %)` : '(0 %)'; }

function IndexRow({ label, value, color, children }: { label: string; value: number; color: string; children?: ReactNode }) {
  return (
    <div className="glass-panel hover-panel" style={{ padding: 0, marginBottom: 6 }}>
      <div className="panel-header">
        <Circle size={8} color={color} fill={color} />
        <span className="panel-title" style={{ color }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 10px 8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="gauge-num" style={{ color, textShadow: `0 0 12px ${color}`, fontSize: 28 }}>{value}</span>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#4a7a8f' }}>/ 100</span>
        </div>
        <GaugeWidget value={value} color={color} size={100} />
      </div>
      {children}
    </div>
  );
}

export default function RightPanel() {
  const parking           = useStore(s => s.parking);
  const environment       = useStore(s => s.environment);
  const livabilityIndex   = useStore(s => s.livabilityIndex);
  const drinkingWaterIndex = useStore(s => s.drinkingWaterIndex);
  const revenueIndex      = useStore(s => s.revenueIndex);

  return (
    <div style={{ width: 268, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 6px 6px 0', overflowY: 'auto' }}>

      {/* Environment Sensors */}
      <StatCard icon={<Leaf size={12} />} title="Environment Sensors" accentColor="#00ff9d"
        rows={[
          { color: '#ff3b5c', label: 'Severe',       value: environment.severe,       pct: '' },
          { color: '#ff6b35', label: 'Very Poor',    value: environment.veryPoor,     pct: '' },
          { color: '#ff9f1c', label: 'Poor',         value: environment.poor,         pct: '' },
          { color: '#ffcc44', label: 'Moderate',     value: environment.moderate,     pct: '' },
          { color: '#00ff9d', label: 'Satisfactory', value: environment.satisfactory, pct: '' },
          { color: '#4488ff', label: 'Good',         value: environment.good,         pct: '' },
        ]}
      />

      {/* Smart Parking */}
      <StatCard icon={<Car size={12} />} title="Smart Parking" total={parking.total} accentColor="#4488ff"
        rows={[
          { color: '#ff3b5c', label: 'Full',         value: parking.full,        pct: pct(parking.full, parking.total) },
          { color: '#4a7a8f', label: 'Not Occupied', value: parking.notOccupied, pct: pct(parking.notOccupied, parking.total) },
          { color: '#00ff9d', label: '< 25%',        value: parking.under25,     pct: pct(parking.under25, parking.total) },
          { color: '#4488ff', label: '< 50%',        value: parking.under50,     pct: pct(parking.under50, parking.total) },
          { color: '#ff9f1c', label: '< 75%',        value: parking.under75,     pct: pct(parking.under75, parking.total) },
          { color: '#7b61ff', label: '> 75%',        value: parking.over75,      pct: pct(parking.over75, parking.total) },
        ]}
      />

      {/* Index Gauges */}
      <IndexRow label="Livability Index"     value={livabilityIndex}    color="#00d4ff" />
      <IndexRow label="Drinking Water Index" value={drinkingWaterIndex} color="#00ff9d" />
      <IndexRow label="Revenue Index"        value={revenueIndex}       color="#ff9f1c" />
    </div>
  );
}
