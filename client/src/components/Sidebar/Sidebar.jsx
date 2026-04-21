import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDataStore, usePrefsStore } from '../../store/useStore';
import FilterPanel from './FilterPanel';
import ThemePanel from './ThemePanel';

// Only refresh the list at most once per 2s — prevents thrashing on every socket update
function useDebouncedItems(ms = 2000) {
  const getFilteredItems = useDataStore((s) => s.getFilteredItems);
  const lastUpdate = useDataStore((s) => s.lastUpdate);
  const [items, setItems] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerRef.current) return; // already scheduled
    timerRef.current = setTimeout(() => {
      setItems(getFilteredItems());
      timerRef.current = null;
    }, ms);
  }, [lastUpdate, ms]);

  // Immediate update for search/filter changes
  const forceRefresh = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    setItems(getFilteredItems());
  };

  return { items, forceRefresh };
}

const TABS = [
  { id: 'search', label: 'Search', icon: '🔍' },
  { id: 'filter', label: 'Filters', icon: '⚙️' },
  { id: 'theme', label: 'Display', icon: '🎨' },
  { id: 'favorites', label: 'Saved', icon: '⭐' },
];

function SearchPanel() {
  const { filterSearchQuery, setFilterSearchQuery } = usePrefsStore();
  const { setSelected } = useDataStore();
  const { items, forceRefresh } = useDebouncedItems(2000);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 pb-0">
        <input
          type="text"
          placeholder="Search flight, ship, country..."
          value={filterSearchQuery}
          onChange={(e) => { setFilterSearchQuery(e.target.value); forceRefresh(); }}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        />
        <p className="text-xs mt-1.5 px-1" style={{ color: 'var(--text-muted)' }}>
          {items.length.toLocaleString()} results
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {items.slice(0, 80).map((item) => (
          <button
            key={item.id}
            onClick={() => setSelected(item.id, item.type)}
            className="w-full text-left px-2.5 py-2 rounded-lg mb-1 transition-colors group"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">{item.type === 'flight' ? '✈' : '🚢'}</span>
                <div>
                  <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                    {item.type === 'flight' ? (item.callsign || item.id) : item.name}
                  </p>
                  <p className="text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>
                    {item.country} {item.flag}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: 'var(--accent)' }}>
                  {item.type === 'flight'
                    ? `${item.velocityKnots} kn`
                    : `${item.speed} kn`}
                </p>
                {item.type === 'flight' && item.altitudeFt && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {(item.altitudeFt / 1000).toFixed(0)}k ft
                  </p>
                )}
                {item.type === 'ship' && item.destination && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    → {item.destination}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
        {items.length > 80 && (
          <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>
            + {items.length - 80} more (use filters to narrow)
          </p>
        )}
      </div>
    </div>
  );
}

function FavoritesPanel() {
  const { favorites, toggleFavorite } = usePrefsStore();
  const { flights, ships, setSelected } = useDataStore();

  const favItems = favorites
    .map((id) => flights[id] || ships[id])
    .filter(Boolean);

  if (favItems.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-3xl mb-2">⭐</p>
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No saved items</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          Click a flight or ship on the map, then tap ☆ to save it.
        </p>
      </div>
    );
  }

  return (
    <div className="p-2">
      {favItems.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between px-2.5 py-2 rounded-lg mb-1"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <button
            className="flex items-center gap-2 flex-1 text-left"
            onClick={() => setSelected(item.id, item.type)}
          >
            <span className="text-sm">{item.type === 'flight' ? '✈' : '🚢'}</span>
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                {item.type === 'flight' ? (item.callsign || item.id) : item.name}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {item.country} {item.flag}
                {item.type === 'ship' && item.destination && ` → ${item.destination}`}
              </p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--accent)' }}>
              {item.type === 'flight' ? `${item.velocityKnots} kn` : `${item.speed} kn`}
            </span>
            <button
              onClick={() => toggleFavorite(item.id)}
              className="text-sm"
              title="Remove from favorites"
            >
              ⭐
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = usePrefsStore();
  const [activeTab, setActiveTab] = useState('search');

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <motion.div
          className="glass absolute z-[1000] flex flex-col rounded-2xl"
          style={{
            top: '16px',
            left: '16px',
            bottom: '16px',
            width: '300px',
          }}
          initial={{ x: -320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -320, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🌍</span>
              <div>
                <h1 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Global Tracker
                </h1>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Live · Flights & Ships
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="w-6 h-6 flex items-center justify-center rounded-full text-sm"
              style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}
            >
              ×
            </button>
          </div>

          {/* Tab bar */}
          <div
            className="flex flex-shrink-0"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 py-2 text-xs font-medium transition-all flex flex-col items-center gap-0.5"
                style={{
                  color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                  borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {activeTab === 'search' && <SearchPanel />}
            {activeTab === 'filter' && <FilterPanel />}
            {activeTab === 'theme' && <ThemePanel />}
            {activeTab === 'favorites' && <FavoritesPanel />}
          </div>

          {/* Footer */}
          <div
            className="flex-shrink-0 px-3 py-2 text-center text-xs"
            style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            OpenSky Network · AIS Simulation
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
