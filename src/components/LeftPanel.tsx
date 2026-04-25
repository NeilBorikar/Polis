import { Bus, Camera, TrafficCone, Trash2, Lightbulb } from 'lucide-react';
import StatCard from './StatCard';
import { useStore } from '../store';

function pct(v: number, t: number) { return t ? `(${Math.round((v / t) * 100)} %)` : '(0 %)'; }

export default function LeftPanel() {
  const smartBus    = useStore(s => s.smartBus);
  const streetLight = useStore(s => s.streetLight);
  const cctv        = useStore(s => s.cctv);
  const itms        = useStore(s => s.itms);
  const garbage     = useStore(s => s.garbage);

  return (
    <div style={{ width: 268, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 0 6px 6px', overflowY: 'auto' }}>

      {/* Smart Bus */}
      <StatCard icon={<Bus size={12} />} title="Smart Bus System" total={smartBus.total} accentColor="#00d4ff"
        rows={[
          { color: '#00ff9d', label: 'Running',     value: smartBus.running,    pct: pct(smartBus.running, smartBus.total) },
          { color: '#4488ff', label: 'Stopped',     value: smartBus.stopped,    pct: pct(smartBus.stopped, smartBus.total) },
          { color: '#ff9f1c', label: 'Halt',        value: smartBus.halt,       pct: pct(smartBus.halt, smartBus.total) },
          { color: '#ff3b5c', label: 'Not Polling', value: smartBus.notPolling, pct: pct(smartBus.notPolling, smartBus.total) },
        ]}
      />

      {/* Street Lighting */}
      <StatCard icon={<Lightbulb size={12} />} title="Street Light System" total={streetLight.total} accentColor="#ffcc44"
        rows={[
          { color: '#00ff9d', label: 'On',   value: streetLight.on,   pct: pct(streetLight.on, streetLight.total) },
          { color: '#ff3b5c', label: 'Off',  value: streetLight.off,  pct: pct(streetLight.off, streetLight.total) },
          { color: '#4488ff', label: 'Dim1', value: streetLight.dim1, pct: pct(streetLight.dim1, streetLight.total) },
          { color: '#7b61ff', label: 'Dim2', value: streetLight.dim2, pct: pct(streetLight.dim2, streetLight.total) },
        ]}
      />

      {/* CCTV */}
      <StatCard icon={<Camera size={12} />} title="CCTV" total={cctv.total} accentColor="#7b61ff"
        rows={[
          { color: '#00ff9d', label: 'Normal',       value: cctv.normal,      pct: pct(cctv.normal, cctv.total) },
          { color: '#ff9f1c', label: 'Faulty',       value: cctv.faulty,      pct: pct(cctv.faulty, cctv.total) },
          { color: '#ff3b5c', label: 'No Feed',      value: cctv.noFeed,      pct: pct(cctv.noFeed, cctv.total) },
          { color: '#4a7a8f', label: 'No Recording', value: cctv.noRecording, pct: pct(cctv.noRecording, cctv.total) },
        ]}
      />

      {/* ITMS */}
      <StatCard icon={<TrafficCone size={12} />} title="ITMS System" total={itms.total} accentColor="#ff9f1c"
        rows={[
          { color: '#00ff9d', label: 'Working', value: itms.working, pct: pct(itms.working, itms.total) },
          { color: '#ff3b5c', label: 'Faulty',  value: itms.faulty,  pct: pct(itms.faulty, itms.total) },
        ]}
      />

      {/* Smart Garbage */}
      <StatCard icon={<Trash2 size={12} />} title="Smart Garbage Bins" total={garbage.total} accentColor="#00ff9d"
        rows={[
          { color: '#ff3b5c', label: '100% Full',     value: garbage.full,    pct: pct(garbage.full, garbage.total) },
          { color: '#4a7a8f', label: 'Empty',         value: garbage.empty,   pct: pct(garbage.empty, garbage.total) },
          { color: '#00ff9d', label: '0–25% Full',    value: garbage.under25, pct: pct(garbage.under25, garbage.total) },
          { color: '#4488ff', label: '25–50% Full',   value: garbage.under50, pct: pct(garbage.under50, garbage.total) },
          { color: '#ff9f1c', label: '50–75% Full',   value: garbage.under75, pct: pct(garbage.under75, garbage.total) },
          { color: '#ff3b5c', label: '>75% Full',     value: garbage.over75,  pct: pct(garbage.over75, garbage.total) },
        ]}
      />
    </div>
  );
}
