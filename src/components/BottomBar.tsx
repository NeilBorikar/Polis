import type { ReactNode } from 'react';
import { useStore } from '../store';
import { Zap, Droplets, Factory, Building2 } from 'lucide-react';

interface KVProps { label: string; value: string | number; unit?: string; color?: string }
function KV({ label, value, unit, color = '#00d4ff' }: KVProps) {
  return (
    <div className="bottom-kv">
      <span className="bottom-k">{label}</span>
      <span className="bottom-v" style={{ color, textShadow: `0 0 8px ${color}66` }}>
        {value}{unit && <span style={{ fontSize: 9, color: '#4a7a8f' }}> {unit}</span>}
      </span>
    </div>
  );
}

function Divider() {
  return <div style={{ width: 1, background: 'rgba(0,212,255,0.12)', alignSelf: 'stretch', margin: '0 8px' }} />;
}

function Section({ icon, title, color, children }: { icon: ReactNode; title: string; color: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontFamily: 'Orbitron', fontSize: 8, fontWeight: 600, letterSpacing: '0.1em', color, textTransform: 'uppercase' }}>{title}</span>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {children}
      </div>
    </div>
  );
}

export default function BottomBar() {
  const power = useStore(s => s.power);
  const water  = useStore(s => s.water);
  const stp    = useStore(s => s.stp);

  return (
    <div style={{
      height: 100, flexShrink: 0,
      background: 'linear-gradient(180deg, rgba(2,10,24,0.98), rgba(6,21,37,0.99))',
      borderTop: '1px solid rgba(0,212,255,0.15)',
      display: 'flex', alignItems: 'center',
      padding: '0 14px', gap: 8, overflowX: 'auto',
    }}>
      {/* Power */}
      <Section icon={<Zap size={12} />} title="Power System" color="#ff9f1c">
        <KV label="Total (KVAR)" value={power.total} color="#ff9f1c" />
        <KV label="HiTech City"  value={power.hiTechCity} color="#ffcc44" />
        <KV label="Kondapur"     value={power.kondapur}   color="#ffcc44" />
        <KV label="Raidurg"      value={power.raidurg}    color="#ffcc44" />
      </Section>

      <Divider />

      {/* Water */}
      <Section icon={<Droplets size={12} />} title="Water System" color="#00d4ff">
        <KV label="Plants"        value={water.treatmentPlants}    color="#00d4ff" />
        <KV label="Efficiency"    value={water.plantEfficiency}    unit="%" color="#00ff9d" />
        <KV label="DWQ"           value={water.drinkingWaterQuality} unit="%" color="#00ff9d" />
        <KV label="Avg. MLD"      value={water.avgWaterProcessed}  color="#4488ff" />
      </Section>

      <Divider />

      {/* STP */}
      <Section icon={<Factory size={12} />} title="Sewage Treatment" color="#7b61ff">
        <KV label="Plants"        value={stp.treatmentPlants}      color="#7b61ff" />
        <KV label="Cap. (MLD)"    value={stp.operationalCapacity}  color="#7b61ff" />
        <KV label="Sewage MLD"    value={stp.avgSewageProcessed}   color="#7b61ff" />
        <KV label="Efficiency"    value={stp.operationalEfficiency} unit="%" color={stp.operationalEfficiency < 85 ? '#ff9f1c' : '#00ff9d'} />
      </Section>

      <Divider />

      {/* IBMS */}
      <Section icon={<Building2 size={12} />} title="IBMS" color="#4488ff">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { name: 'Municipal Corp. — Main', counts: [0,6,1,1], colors: ['#00ff9d','#ff9f1c','#ff3b5c','#4a7a8f'] },
            { name: 'Command Control Ctr',    counts: [0,4,3,2], colors: ['#00ff9d','#ff9f1c','#ff3b5c','#4a7a8f'] },
            { name: 'MCH Complex',            counts: [0,7,1,1], colors: ['#00ff9d','#ff9f1c','#ff3b5c','#4a7a8f'] },
          ].map((bldg, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4488ff', boxShadow: '0 0 4px #4488ff', flexShrink: 0 }} />
              <span style={{ fontSize: 8, color: '#7aacbf', minWidth: 130 }}>{bldg.name}</span>
              {bldg.counts.map((c, j) => (
                <span key={j} className="ibms-pill" style={{ background: `${bldg.colors[j]}22`, color: bldg.colors[j] }}>{c}</span>
              ))}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
