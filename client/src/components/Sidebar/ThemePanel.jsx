import React from 'react';
import { usePrefsStore } from '../../store/useStore';

const THEMES = [
  { id: 'dark', label: 'Dark', icon: '🌙', desc: 'Soft dark tones' },
  { id: 'light', label: 'Light', icon: '☀️', desc: 'Clean and bright' },
  { id: 'cyberpunk', label: 'Cyber', icon: '⚡', desc: 'Neon glow' },
];

const MAP_STYLES = [
  { id: 'night', label: 'Night', icon: '🌃' },
  { id: 'street', label: 'Street', icon: '🗺' },
  { id: 'satellite', label: 'Satellite', icon: '🛰' },
  { id: 'minimal', label: 'Minimal', icon: '⬜' },
];

const MARKER_STYLES = [
  { id: 'simple', label: 'Simple' },
  { id: 'detailed', label: 'Detailed' },
  { id: 'glowing', label: 'Glow ✨' },
];

const ANIM_SPEEDS = [
  { id: 'slow', label: 'Slow' },
  { id: 'normal', label: 'Normal' },
  { id: 'fast', label: 'Fast' },
];

function Section({ title, children }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function ToggleGroup({ options, value, onChange, size = 'sm' }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${size === 'sm' ? '' : 'py-1.5'}`}
          style={{
            background: value === opt.id ? 'var(--accent)' : 'var(--bg-card)',
            color: value === opt.id ? '#000' : 'var(--text-secondary)',
            border: `1px solid ${value === opt.id ? 'var(--accent)' : 'var(--border)'}`,
          }}
        >
          {opt.icon && <span className="mr-1">{opt.icon}</span>}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function ThemePanel() {
  const {
    theme, setTheme,
    mapStyle, setMapStyle,
    markerStyle, setMarkerStyle,
    animationSpeed, setAnimationSpeed,
    smoothInterpolation, setSmoothInterpolation,
    showTrails, setShowTrails,
    trailLength, setTrailLength,
    showHeatmap, setShowHeatmap,
  } = usePrefsStore();

  return (
    <div className="p-3 text-sm" style={{ color: 'var(--text-primary)' }}>
      <Section title="Theme">
        <div className="grid grid-cols-3 gap-1.5">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className="rounded-xl p-2 text-center transition-all"
              style={{
                background: theme === t.id ? 'var(--accent)' : 'var(--bg-card)',
                color: theme === t.id ? '#000' : 'var(--text-secondary)',
                border: `1px solid ${theme === t.id ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              <div className="text-lg">{t.icon}</div>
              <div className="text-xs font-semibold mt-0.5">{t.label}</div>
              <div className="text-xs opacity-60" style={{ fontSize: '10px' }}>{t.desc}</div>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Map Style">
        <div className="grid grid-cols-2 gap-1.5">
          {MAP_STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => setMapStyle(s.id)}
              className="rounded-lg p-2 flex items-center gap-2 transition-all"
              style={{
                background: mapStyle === s.id ? 'var(--accent)' : 'var(--bg-card)',
                color: mapStyle === s.id ? '#000' : 'var(--text-secondary)',
                border: `1px solid ${mapStyle === s.id ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              <span>{s.icon}</span>
              <span className="text-xs font-medium">{s.label}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Marker Style">
        <ToggleGroup options={MARKER_STYLES} value={markerStyle} onChange={setMarkerStyle} />
      </Section>

      <Section title="Animation">
        <ToggleGroup options={ANIM_SPEEDS} value={animationSpeed} onChange={setAnimationSpeed} />
        <label className="flex items-center justify-between mt-2 cursor-pointer">
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Smooth Interpolation</span>
          <div
            onClick={() => setSmoothInterpolation(!smoothInterpolation)}
            className={`relative w-9 h-5 rounded-full transition-colors ${smoothInterpolation ? '' : ''}`}
            style={{ background: smoothInterpolation ? 'var(--accent)' : 'var(--border)' }}
          >
            <div
              className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
              style={{ transform: smoothInterpolation ? 'translateX(20px)' : 'translateX(2px)' }}
            />
          </div>
        </label>
      </Section>

      <Section title="Trails">
        <label className="flex items-center justify-between mb-2 cursor-pointer">
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Show Trails</span>
          <div
            onClick={() => setShowTrails(!showTrails)}
            className="relative w-9 h-5 rounded-full transition-colors"
            style={{ background: showTrails ? 'var(--accent)' : 'var(--border)' }}
          >
            <div
              className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
              style={{ transform: showTrails ? 'translateX(20px)' : 'translateX(2px)' }}
            />
          </div>
        </label>
        <div>
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
            <span>Trail Length</span>
            <span style={{ color: 'var(--accent)' }}>{trailLength} pts</span>
          </div>
          <input
            type="range"
            min={2}
            max={20}
            value={trailLength}
            onChange={(e) => setTrailLength(+e.target.value)}
            className="w-full"
            style={{ accentColor: 'var(--accent)' }}
          />
        </div>
      </Section>

      <Section title="Heatmap">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Traffic Density</span>
          <div
            onClick={() => setShowHeatmap(!showHeatmap)}
            className="relative w-9 h-5 rounded-full transition-colors"
            style={{ background: showHeatmap ? 'var(--accent)' : 'var(--border)' }}
          >
            <div
              className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
              style={{ transform: showHeatmap ? 'translateX(20px)' : 'translateX(2px)' }}
            />
          </div>
        </label>
      </Section>
    </div>
  );
}
