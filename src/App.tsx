import { useState } from 'react';
import { useStore } from './store';
import { Layers, Activity, AlertTriangle } from 'lucide-react';
import CityMap from './components/CityMap';
import AddIssueForm from './components/AddIssueForm';
import KanbanBoard from './components/KanbanBoard';
import TimeSlider from './components/TimeSlider';
import { AnimatePresence } from 'framer-motion';

function App() {
  const issues = useStore(state => state.issues);
  const [viewMode, setViewMode] = useState<'map' | 'kanban'>('map');
  const [newIssueCoords, setNewIssueCoords] = useState<[number, number, number] | null>(null);

  const activeCount = issues.filter(i => i.status !== 'Resolved').length;
  const resolvedCount = issues.filter(i => i.status === 'Resolved').length;
  const resolvedPercent = issues.length ? Math.round((resolvedCount / issues.length) * 100) : 0;

  return (
    <div className="w-screen h-screen bg-slate-900 flex flex-col relative overflow-hidden font-sans">
      {/* Top Bar - Command Center */}
      <header className="absolute top-0 left-0 w-full z-10 bg-slate-900/60 backdrop-blur-md border-b border-slate-700/50 p-4 shrink-0 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 text-white">
            <Layers className="text-blue-500 w-8 h-8" />
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              CityPulse 3D
            </h1>
          </div>
          
          <div className="flex space-x-8">
            <div className="flex flex-col items-center">
              <span className="text-slate-400 text-xs uppercase tracking-wider">Active</span>
              <span className="text-xl font-bold text-red-400 flex items-center gap-1">
                <AlertTriangle size={16} /> {activeCount}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-slate-400 text-xs uppercase tracking-wider">Resolved</span>
              <span className="text-xl font-bold text-emerald-400 flex items-center gap-1">
                <Activity size={16} /> {resolvedPercent}%
              </span>
            </div>
          </div>
          
          <div className="flex bg-slate-800 p-1 rounded-lg">
            <button 
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'map' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              onClick={() => setViewMode('map')}
            >
              3D Map
            </button>
            <button 
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'kanban' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              onClick={() => setViewMode('kanban')}
            >
              Kanban
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full h-full pt-20">
        {viewMode === 'map' ? (
          <div className="w-full h-full relative">
            <CityMap onMapClick={(coords) => setNewIssueCoords(coords)} />
            
            <AnimatePresence>
              {newIssueCoords && (
                <AddIssueForm 
                  coordinates={newIssueCoords} 
                  onClose={() => setNewIssueCoords(null)} 
                />
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center bg-slate-900 text-slate-500 overflow-y-auto">
            <KanbanBoard />
          </div>
        )}
        
        {/* Global Time Slider overlay */}
        <TimeSlider />
      </main>
    </div>
  );
}

export default App;
