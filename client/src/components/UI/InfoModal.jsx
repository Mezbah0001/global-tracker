import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDataStore, usePrefsStore } from '../../store/useStore';
import { headingToCardinal, detectAnomaly } from '../../utils/geo';

function StatRow({ label, value, highlight }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b" style={{ borderColor: 'var(--border)' }}>
      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span
        className={`text-xs font-semibold ${highlight ? '' : ''}`}
        style={{ color: highlight ? 'var(--accent-amber)' : 'var(--text-primary)' }}
      >
        {value}
      </span>
    </div>
  );
}

function FlightInfo({ flight, onClose, isFavorite, onToggleFavorite }) {
  const { trails } = useDataStore();
  const trail = trails[flight.id] || [];
  const anomaly = detectAnomaly(trail, flight.heading);
  const climbDesc = flight.verticalRate > 1 ? '▲ Climbing' : flight.verticalRate < -1 ? '▼ Descending' : '→ Level';

  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
              ✈ {flight.callsign || flight.id}
            </span>
            {anomaly && (
              <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                style={{ background: 'rgba(248,113,113,0.15)', color: 'var(--accent-red)', border: '1px solid var(--accent-red)' }}>
                ⚠ Anomaly
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {flight.country} {flight.flag} · ICAO: {flight.id.toUpperCase()}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleFavorite}
            className="text-lg transition-transform hover:scale-110"
            title={isFavorite ? 'Remove favorite' : 'Add to favorites'}
          >
            {isFavorite ? '⭐' : '☆'}
          </button>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-full text-sm transition-colors"
            style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            ×
          </button>
        </div>
      </div>

      <StatRow label="Altitude" value={flight.altitudeFt ? `${flight.altitudeFt.toLocaleString()} ft` : '—'} />
      <StatRow label="Speed" value={`${flight.velocityKnots} kn (${flight.velocity} m/s)`} />
      <StatRow label="Heading" value={`${flight.heading}° ${headingToCardinal(flight.heading)}`} />
      <StatRow label="Vertical Rate" value={`${climbDesc} (${flight.verticalRate} m/s)`} />
      <StatRow label="Position" value={`${flight.lat.toFixed(3)}°, ${flight.lng.toFixed(3)}°`} />
      {flight.squawk && <StatRow label="Squawk" value={flight.squawk} />}
      <StatRow label="Trail Points" value={trail.length} />

      <div className="mt-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Altitude Band</div>
        <div className="w-full rounded-full h-1.5" style={{ background: 'var(--border)' }}>
          <div
            className="h-1.5 rounded-full transition-all"
            style={{
              width: `${Math.min(100, ((flight.altitudeFt || 0) / 45000) * 100)}%`,
              background: 'linear-gradient(to right, #fbbf24, #38bdf8, #e0f2fe)',
            }}
          />
        </div>
        <div className="flex justify-between text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          <span>0</span><span>FL450</span>
        </div>
      </div>
    </div>
  );
}

function ShipInfo({ ship, onClose, isFavorite, onToggleFavorite }) {
  const typeColors = {
    Container: '#60a5fa', Tanker: '#f97316', 'Bulk Carrier': '#a78bfa',
    Cargo: '#34d399', Passenger: '#f472b6', 'LNG Carrier': '#facc15',
    RORO: '#2dd4bf', Fishing: '#fb7185',
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="text-lg font-bold"
              style={{ color: typeColors[ship.type] || 'var(--accent-alt)' }}
            >
              🚢 {ship.name}
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {ship.type} · {ship.country} {ship.flag}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={onToggleFavorite} className="text-lg transition-transform hover:scale-110">
            {isFavorite ? '⭐' : '☆'}
          </button>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-full text-sm transition-colors"
            style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            ×
          </button>
        </div>
      </div>

      <StatRow label="Speed" value={`${ship.speed} knots`} />
      <StatRow label="Heading" value={`${ship.heading}° ${headingToCardinal(ship.heading)}`} />
      <StatRow label="Status" value={ship.status || 'Underway'} highlight={ship.status === 'At Anchor'} />
      <StatRow label="Origin" value={ship.origin || '—'} />
      <StatRow label="Destination" value={ship.destination || '—'} />
      <StatRow label="Route" value={ship.route || '—'} />
      <StatRow label="MMSI" value={ship.mmsi || ship.id} />
      <StatRow label="Length" value={ship.length ? `${ship.length} m` : '—'} />
      <StatRow label="Draft" value={ship.draft ? `${ship.draft} m` : '—'} />
      <StatRow label="Position" value={`${ship.lat.toFixed(3)}°, ${ship.lng.toFixed(3)}°`} />

      <div className="mt-3 pt-2 flex items-center gap-2" style={{ borderTop: '1px solid var(--border)' }}>
        <div
          className="w-3 h-3 rounded-full"
          style={{ background: typeColors[ship.type] || '#94a3b8' }}
        />
        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{ship.type}</span>
      </div>
    </div>
  );
}

export default function InfoModal() {
  const { selectedId, selectedType, flights, ships, clearSelected } = useDataStore();
  const { favorites, toggleFavorite } = usePrefsStore();

  const item = selectedId
    ? (selectedType === 'flight' ? flights[selectedId] : ships[selectedId])
    : null;

  const isFavorite = selectedId ? favorites.includes(selectedId) : false;

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          key={selectedId}
          className="glass absolute z-[1000] rounded-xl p-4 w-72"
          style={{
            bottom: '80px',
            right: '16px',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {selectedType === 'flight' ? (
            <FlightInfo
              flight={item}
              onClose={clearSelected}
              isFavorite={isFavorite}
              onToggleFavorite={() => toggleFavorite(selectedId)}
            />
          ) : (
            <ShipInfo
              ship={item}
              onClose={clearSelected}
              isFavorite={isFavorite}
              onToggleFavorite={() => toggleFavorite(selectedId)}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
