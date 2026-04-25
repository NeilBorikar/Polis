import { useEffect, useState } from 'react';

interface GaugeProps {
  value: number;
  max?: number;
  color?: string;
  size?: number;
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const s = { x: cx + r * Math.cos(rad(startDeg)), y: cy + r * Math.sin(rad(startDeg)) };
  const e = { x: cx + r * Math.cos(rad(endDeg)),   y: cy + r * Math.sin(rad(endDeg)) };
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x.toFixed(3)} ${s.y.toFixed(3)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(3)} ${e.y.toFixed(3)}`;
}

// Arc length of a partial circle
function arcLen(r: number, deg: number) { return (deg / 360) * 2 * Math.PI * r; }

export default function GaugeWidget({ value, max = 100, color = '#00d4ff', size = 110 }: GaugeProps) {
  const [pct, setPct] = useState(0);
  useEffect(() => { const t = setTimeout(() => setPct(value / max), 300); return () => clearTimeout(t); }, [value, max]);

  const cx = size / 2;
  const cy = size * 0.6;
  const r  = size * 0.36;
  const sw = Math.max(6, size * 0.075);

  // 250-degree arc: starts at 145deg, ends at 395deg (both in SVG clockwise coords)
  const START = 145, SWEEP = 250, END = START + SWEEP;

  const bgPath    = describeArc(cx, cy, r, START, END);
  const zone1Path = describeArc(cx, cy, r, START, START + SWEEP * 0.33);
  const zone2Path = describeArc(cx, cy, r, START + SWEEP * 0.33, START + SWEEP * 0.66);
  const zone3Path = describeArc(cx, cy, r, START + SWEEP * 0.66, END);

  // Filled arc via dasharray
  const totalLen  = arcLen(r, SWEEP);
  const filledLen = totalLen * pct;

  // Needle
  const needleDeg = START + SWEEP * pct;
  const nRad = (needleDeg * Math.PI) / 180;
  const nLen = r - sw * 0.5;
  const nx = cx + nLen * Math.cos(nRad);
  const ny = cy + nLen * Math.sin(nRad);

  const svgH = cy + r * 0.65; // crop below the arc bottom

  return (
    <svg width={size} height={svgH} viewBox={`0 0 ${size} ${svgH}`} overflow="visible" style={{ display: 'block' }}>
      <defs>
        <filter id={`gw-glow-${color.replace('#','')}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Zone background bands */}
      <path d={zone1Path} fill="none" stroke="#ff3b5c" strokeWidth={sw} strokeLinecap="round" opacity={0.2} />
      <path d={zone2Path} fill="none" stroke="#ff9f1c" strokeWidth={sw} strokeLinecap="round" opacity={0.2} />
      <path d={zone3Path} fill="none" stroke="#00ff9d" strokeWidth={sw} strokeLinecap="round" opacity={0.2} />

      {/* Dark track */}
      <path d={bgPath} fill="none" stroke="rgba(0,40,70,0.7)" strokeWidth={sw} strokeLinecap="round" />

      {/* Filled arc — animates via stroke-dasharray */}
      <path
        d={bgPath}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={`${filledLen.toFixed(3)} ${(totalLen * 2).toFixed(3)}`}
        style={{
          filter: `drop-shadow(0 0 4px ${color})`,
          transition: 'stroke-dasharray 1.4s cubic-bezier(0.4,0,0.2,1)',
        }}
      />

      {/* Tick marks */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const deg = START + SWEEP * t;
        const rad2 = (deg * Math.PI) / 180;
        const inner = r + sw * 0.7;
        const outer = r + sw * 1.1;
        return (
          <line key={t}
            x1={cx + inner * Math.cos(rad2)} y1={cy + inner * Math.sin(rad2)}
            x2={cx + outer * Math.cos(rad2)} y2={cy + outer * Math.sin(rad2)}
            stroke={color} strokeWidth={1} opacity={0.5}
          />
        );
      })}

      {/* Needle */}
      <line x1={cx} y1={cy} x2={nx} y2={ny}
        stroke="rgba(255,255,255,0.9)" strokeWidth={1.5} strokeLinecap="round"
        style={{ transition: 'x2 1.4s cubic-bezier(0.4,0,0.2,1), y2 1.4s cubic-bezier(0.4,0,0.2,1)' }}
      />
      <circle cx={cx} cy={cy} r={3.5} fill={color}
        filter={`url(#gw-glow-${color.replace('#','')})`} />

      {/* Value text */}
      <text x={cx} y={cy - r * 0.1} textAnchor="middle" dominantBaseline="middle"
        fontFamily="Orbitron, monospace" fontWeight="700" fontSize={size * 0.18}
        fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }}>
        {value}
      </text>
      <text x={cx} y={cy + r * 0.22} textAnchor="middle"
        fontFamily="JetBrains Mono, monospace" fontSize={7} fill="#4a7a8f">
        / {max}
      </text>
    </svg>
  );
}
