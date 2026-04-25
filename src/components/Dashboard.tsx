import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import TopNav from './TopNav';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import BottomBar from './BottomBar';
import CityScene from './CityScene';
import AddIssueForm from './AddIssueForm';
import TimeSlider from './TimeSlider';
import KanbanBoard from './KanbanBoard';
import LiveBadge from './LiveBadge';
import { useStore } from '../store';
import { LayoutGrid, Map } from 'lucide-react';

export default function Dashboard() {
  const [newIssueCoords, setNewIssueCoords] = useState<[number, number, number] | null>(null);
  const [view, setView] = useState<'map' | 'kanban'>('map');
  const issues = useStore(s => s.issues);
  const activeCount = issues.filter(i => i.status !== 'Resolved').length;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#020a18',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Scan line overlay */}
      <div className="scan-overlay" />

      {/* Top Nav */}
      <TopNav />

      {/* Header strip with title + controls */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 14px',
        background: 'linear-gradient(90deg, rgba(0,212,255,0.04), transparent, rgba(0,212,255,0.04))',
        borderBottom: '1px solid rgba(0,212,255,0.08)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <h1 style={{
            fontFamily: 'Orbitron', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
            background: 'linear-gradient(135deg, #00d4ff, #0a84ff, #7b61ff)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            UNIFIED CITY OPERATIONS CENTER
          </h1>
          <LiveBadge />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Active issues badge */}
          {activeCount > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 4,
              background: 'rgba(255,59,92,0.12)',
              border: '1px solid rgba(255,59,92,0.3)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff3b5c', boxShadow: '0 0 6px #ff3b5c' }} className="anim-blink" />
              <span style={{ fontFamily: 'Orbitron', fontSize: 9, color: '#ff3b5c' }}>{activeCount} ACTIVE ISSUES</span>
            </div>
          )}

          {/* View toggle */}
          <div style={{
            display: 'flex', gap: 2,
            background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)',
            borderRadius: 5, padding: 2,
          }}>
            {([
              { id: 'map',    icon: <Map size={11} />,        label: '3D City' },
              { id: 'kanban', icon: <LayoutGrid size={11} />, label: 'Kanban'  },
            ] as const).map(btn => (
              <button key={btn.id} onClick={() => setView(btn.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '3px 10px', borderRadius: 4, border: 'none', cursor: 'pointer',
                  fontFamily: 'Inter', fontSize: 9, fontWeight: 500,
                  background: view === btn.id ? 'rgba(0,212,255,0.18)' : 'transparent',
                  color: view === btn.id ? '#00d4ff' : '#4a7a8f',
                  transition: 'all 0.2s',
                }}>
                {btn.icon} {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <LeftPanel />

        {/* Center */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {view === 'map' ? (
            <>
              <CityScene onMapClick={(coords) => setNewIssueCoords(coords)} />
              <AnimatePresence>
                {newIssueCoords && (
                  <AddIssueForm coordinates={newIssueCoords} onClose={() => setNewIssueCoords(null)} />
                )}
              </AnimatePresence>
              <TimeSlider />

              {/* City center overlay label */}
              <div style={{
                position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
                textAlign: 'center', pointerEvents: 'none',
              }}>
                <div style={{
                  fontFamily: 'Orbitron', fontSize: 9, letterSpacing: '0.2em', color: 'rgba(0,212,255,0.4)',
                  textTransform: 'uppercase',
                }}>
                  ◈ Click city to report an issue ◈
                </div>
              </div>
            </>
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#020a18', overflowY: 'auto' }}>
              <KanbanBoard />
            </div>
          )}
        </div>

        <RightPanel />
      </div>

      <BottomBar />
    </div>
  );
}
