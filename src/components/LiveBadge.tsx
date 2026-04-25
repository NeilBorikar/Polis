import { useState, useEffect } from 'react';

export default function LiveBadge() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div className="live-badge">
        <span className="live-dot" />
        LIVE
      </div>
      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#4a7a8f' }}>
        {time.toLocaleTimeString('en-IN', { hour12: false })}
      </span>
    </div>
  );
}
