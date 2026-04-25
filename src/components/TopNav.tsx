import { useStore } from '../store';

const TABS = [
  { id: 'Overview',   icon: '🏙️' },
  { id: 'Smart Bus',  icon: '🚌' },
  { id: 'Lighting',   icon: '💡' },
  { id: 'CCTV',       icon: '📷' },
  { id: 'ITMS',       icon: '🚦' },
  { id: 'Environment',icon: '🌿' },
  { id: 'Parking',    icon: '🅿️' },
  { id: 'Garbage',    icon: '🗑️' },
  { id: 'STP',        icon: '🏭' },
  { id: 'Water',      icon: '💧' },
  { id: 'Power',      icon: '⚡' },
  { id: 'IBMS',       icon: '🏢' },
];

export default function TopNav() {
  const activeTab = useStore(s => s.activeTab);
  const setActiveTab = useStore(s => s.setActiveTab);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'stretch',
      height: 38,
      background: 'linear-gradient(180deg, rgba(2,10,24,0.98) 0%, rgba(6,21,37,0.95) 100%)',
      borderBottom: '1px solid rgba(0,212,255,0.15)',
      overflow: 'hidden',
      flexShrink: 0,
      position: 'relative',
    }}>
      {/* POLIS Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '0 16px',
        borderRight: '1px solid rgba(0,212,255,0.15)',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: 'Orbitron', fontSize: 13, fontWeight: 800, letterSpacing: '0.15em',
          background: 'linear-gradient(135deg, #00d4ff, #0a84ff)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>POLIS</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', alignItems: 'stretch', overflowX: 'auto', flex: 1 }}
        className="no-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`top-nav-tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span style={{ fontSize: 11 }}>{tab.icon}</span>
            {tab.id}
          </button>
        ))}
      </div>

      {/* City name badge right */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '0 14px',
        borderLeft: '1px solid rgba(0,212,255,0.15)', flexShrink: 0, gap: 6,
      }}>
        <span style={{ fontFamily: 'Orbitron', fontSize: 7, color: '#4a7a8f', letterSpacing: '0.15em' }}>UNIFIED OPS CENTER</span>
      </div>
    </div>
  );
}
