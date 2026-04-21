import React from 'react';
import { useMap } from 'react-leaflet';
import { useDataStore, usePrefsStore } from '../../store/useStore';

// Zoom buttons wired to the Leaflet map instance
function ZoomButtons() {
  const map = useMap();
  return (
    <div className="flex flex-col gap-0.5">
      <button
        onClick={() => map.zoomIn()}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        title="Zoom in"
      >+</button>
      <button
        onClick={() => map.zoomOut()}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        title="Zoom out"
      >−</button>
      <button
        onClick={() => map.setView([20, 0], 3, { animate: true })}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-xs transition-colors"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        title="Reset view"
      >⊙</button>
    </div>
  );
}

// Layer toggles with live counts
function LayerToggles() {
  const { layers, toggleLayer, showHeatmap, setShowHeatmap, showTrails, setShowTrails } = usePrefsStore();
  const { flights, ships } = useDataStore();

  const flightCount = Object.keys(flights).length;
  const shipCount = Object.keys(ships).length;

  const Btn = ({ active, onClick, title, children }) => (
    <button
      onClick={onClick}
      title={title}
      className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
      style={{
        background: active ? 'var(--accent)' : 'var(--bg-card)',
        color: active ? '#000' : 'var(--text-secondary)',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        boxShadow: active ? '0 0 8px rgba(56,189,248,0.25)' : 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col gap-1.5">
      <Btn active={layers.flights} onClick={() => toggleLayer('flights')} title="Toggle flights">
        <span>✈</span><span>{flightCount.toLocaleString()}</span>
      </Btn>
      <Btn active={layers.ships} onClick={() => toggleLayer('ships')} title="Toggle ships">
        <span>🚢</span><span>{shipCount}</span>
      </Btn>
      <Btn active={showHeatmap} onClick={() => setShowHeatmap(!showHeatmap)} title="Toggle heatmap">
        <span>🌡</span><span>Heat</span>
      </Btn>
      <Btn active={showTrails} onClick={() => setShowTrails(!showTrails)} title="Toggle trails">
        <span>〜</span><span>Trail</span>
      </Btn>
    </div>
  );
}

// ControlBar renders as an absolutely-positioned overlay on top of the map canvas.
// It must be rendered inside <MapContainer> so ZoomButtons can call useMap().
export default function ControlBar() {
  const { connected, lastUpdate } = useDataStore();
  const { sidebarOpen, setSidebarOpen } = usePrefsStore();

  const timeSince = lastUpdate ? Math.round((Date.now() - lastUpdate) / 1000) : null;

  // Prevent Leaflet from intercepting clicks on our overlay
  const stopProp = (e) => e.stopPropagation();

  return (
    <div
      className="absolute z-[1000] flex flex-col gap-2"
      style={{ top: '16px', right: '16px', pointerEvents: 'auto' }}
      onMouseDown={stopProp}
      onClick={stopProp}
    >
      {/* Connection status */}
      <div
        className="glass px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs"
        style={{ color: connected ? 'var(--accent-green)' : 'var(--accent-red)' }}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${connected ? 'animate-pulse' : ''}`}
          style={{ background: connected ? 'var(--accent-green)' : 'var(--accent-red)' }}
        />
        {connected
          ? `Live${timeSince != null ? ` · ${timeSince}s ago` : ''}`
          : 'Reconnecting...'}
      </div>

      {/* Zoom controls */}
      <div className="glass rounded-xl p-1.5">
        <ZoomButtons />
      </div>

      {/* Layer toggles */}
      <div className="glass rounded-xl p-1.5">
        <LayerToggles />
      </div>

      {/* Sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="glass w-8 h-8 flex items-center justify-center rounded-lg text-sm"
        style={{ color: 'var(--text-primary)' }}
        title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
      >
        {sidebarOpen ? '◀' : '▶'}
      </button>
    </div>
  );
}
