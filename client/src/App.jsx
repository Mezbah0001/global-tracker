import React, { useEffect } from 'react';
import MapView from './components/Map/MapView';
import Sidebar from './components/Sidebar/Sidebar';
import InfoModal from './components/UI/InfoModal';
import StatsPanel from './components/Dashboard/StatsPanel';
import { useSocket } from './hooks/useSocket';
import { usePrefsStore } from './store/useStore';

export default function App() {
  const { theme, statsVisible, setStatsVisible, sidebarOpen } = usePrefsStore();
  useSocket();

  // Sync theme attribute to document root for CSS variable switching
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Full-screen map (contains ControlBar via MapContainer context) */}
      <div className="absolute inset-0">
        <MapView />
      </div>

      {/* Floating panels rendered above the map */}
      <Sidebar />
      <InfoModal />
      <StatsPanel />

      {/* Collapsed stats toggle */}
      {!statsVisible && (
        <button
          onClick={() => setStatsVisible(true)}
          className="glass absolute z-[999] rounded-xl px-3 py-1.5 text-xs font-medium transition-all"
          style={{
            bottom: '16px',
            left: sidebarOpen ? '332px' : '16px',
            color: 'var(--accent)',
            transition: 'left 0.25s ease',
          }}
        >
          📊 Analytics ▲
        </button>
      )}
    </div>
  );
}
