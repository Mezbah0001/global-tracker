import React, { useMemo, useState } from 'react';
import { useDataStore, usePrefsStore } from '../../store/useStore';

const SHIP_TYPES = ['Container', 'Tanker', 'Bulk Carrier', 'Cargo', 'Passenger', 'LNG Carrier', 'RORO', 'Fishing'];

const SORT_OPTIONS = [
  { id: 'none', label: 'Default' },
  { id: 'fastest', label: 'Fastest' },
  { id: 'highest', label: 'Highest Alt' },
  { id: 'nearest', label: 'Nearest' },
];

function Chip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-0.5 rounded-full text-xs font-medium transition-all"
      style={{
        background: active ? 'var(--accent)' : 'var(--bg-card)',
        color: active ? '#000' : 'var(--text-secondary)',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      }}
    >
      {label}
    </button>
  );
}

function RangeSlider({ label, min, max, value, onChange, format }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
        <span>{label}</span>
        <span style={{ color: 'var(--accent)' }}>
          {format ? format(value[0]) : value[0]} – {format ? format(value[1]) : value[1]}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value[0]}
          onChange={(e) => onChange([+e.target.value, value[1]])}
          className="w-full mb-1"
          style={{ accentColor: 'var(--accent)' }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value[1]}
          onChange={(e) => onChange([value[0], +e.target.value])}
          className="w-full"
          style={{ accentColor: 'var(--accent)' }}
        />
      </div>
    </div>
  );
}

export default function FilterPanel() {
  const { flights, ships } = useDataStore();
  const {
    filterCountries, setFilterCountries,
    filterShipTypes, setFilterShipTypes,
    filterSpeedRange, setFilterSpeedRange,
    filterAltRange, setFilterAltRange,
    sortBy, setSortBy,
    setUserLocation,
  } = usePrefsStore();

  const [countrySearch, setCountrySearch] = useState('');

  // Unique countries from current data
  const countries = useMemo(() => {
    const set = new Set();
    Object.values(flights).forEach((f) => f.country && set.add(f.country));
    Object.values(ships).forEach((s) => s.country && set.add(s.country));
    return [...set]
      .filter((c) => c.toLowerCase().includes(countrySearch.toLowerCase()))
      .sort()
      .slice(0, 40);
  }, [flights, ships, countrySearch]);

  const toggleCountry = (c) => {
    setFilterCountries(
      filterCountries.includes(c)
        ? filterCountries.filter((x) => x !== c)
        : [...filterCountries, c]
    );
  };

  const toggleShipType = (t) => {
    setFilterShipTypes(
      filterShipTypes.includes(t)
        ? filterShipTypes.filter((x) => x !== t)
        : [...filterShipTypes, t]
    );
  };

  const requestLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert('Location access denied')
    );
  };

  const activeFilterCount =
    filterCountries.length +
    filterShipTypes.length +
    (filterSpeedRange[0] > 0 || filterSpeedRange[1] < 1200 ? 1 : 0) +
    (filterAltRange[0] > 0 || filterAltRange[1] < 15000 ? 1 : 0);

  return (
    <div className="p-3 text-sm" style={{ color: 'var(--text-primary)' }}>
      {/* Active filter badge */}
      {activeFilterCount > 0 && (
        <div
          className="flex items-center justify-between mb-3 px-2.5 py-1.5 rounded-lg text-xs"
          style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--accent-red)' }}
        >
          <span>{activeFilterCount} active filter{activeFilterCount > 1 ? 's' : ''}</span>
          <button
            onClick={() => {
              setFilterCountries([]);
              setFilterShipTypes([]);
              setFilterSpeedRange([0, 1200]);
              setFilterAltRange([0, 15000]);
            }}
            className="underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Sort */}
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
          Sort By
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {SORT_OPTIONS.map((o) => (
            <Chip key={o.id} label={o.label} active={sortBy === o.id} onClick={() => setSortBy(o.id)} />
          ))}
        </div>
        {sortBy === 'nearest' && (
          <button
            onClick={requestLocation}
            className="mt-2 w-full text-xs py-1.5 rounded-lg transition-colors"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--accent)' }}
          >
            📍 Use my location
          </button>
        )}
      </div>

      {/* Speed range */}
      <RangeSlider
        label="Speed Range"
        min={0}
        max={1200}
        value={filterSpeedRange}
        onChange={setFilterSpeedRange}
        format={(v) => `${v} kn`}
      />

      {/* Altitude range */}
      <RangeSlider
        label="Altitude Range"
        min={0}
        max={15000}
        value={filterAltRange}
        onChange={setFilterAltRange}
        format={(v) => `${(v / 1000).toFixed(0)}k ft`}
      />

      {/* Ship types */}
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
          Ship Types
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SHIP_TYPES.map((t) => (
            <Chip key={t} label={t} active={filterShipTypes.includes(t)} onClick={() => toggleShipType(t)} />
          ))}
        </div>
      </div>

      {/* Countries */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
          Countries {filterCountries.length > 0 && `(${filterCountries.length})`}
        </p>
        <input
          type="text"
          placeholder="Search countries..."
          value={countrySearch}
          onChange={(e) => setCountrySearch(e.target.value)}
          className="w-full px-2.5 py-1.5 rounded-lg text-xs mb-2 outline-none"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        />
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
          {countries.map((c) => (
            <Chip key={c} label={c} active={filterCountries.includes(c)} onClick={() => toggleCountry(c)} />
          ))}
          {countries.length === 0 && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No countries found</p>
          )}
        </div>
      </div>
    </div>
  );
}
