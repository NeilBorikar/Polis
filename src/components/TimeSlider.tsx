import { useStore } from '../store';
import { Clock } from 'lucide-react';

export default function TimeSlider() {
  const timeFilter = useStore(state => state.timeFilter);
  const setTimeFilter = useStore(state => state.setTimeFilter);

  // Map 0-100 to 00:00 - 24:00
  const hour = Math.floor((timeFilter / 100) * 24);
  const minute = Math.floor(((timeFilter / 100) * 24 - hour) * 60);

  const formatTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 shadow-2xl flex items-center gap-6 z-10">
      <div className="flex flex-col items-center justify-center shrink-0 w-24">
        <Clock className="text-blue-400 mb-1" size={20} />
        <span className="text-xl font-bold font-mono text-white">{formatTime}</span>
      </div>
      
      <div className="flex-1">
        <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">
          <span>Morning</span>
          <span>Noon</span>
          <span>Evening</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={timeFilter}
          onChange={(e) => setTimeFilter(parseInt(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>
    </div>
  );
}
