import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useDataStore, usePrefsStore } from '../../store/useStore';

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div
      className="glass-card rounded-xl px-3 py-2.5 flex items-center gap-3 min-w-[120px]"
      style={{ flex: '1 1 110px' }}
    >
      <div className="text-2xl">{icon}</div>
      <div>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        <p className="text-lg font-bold leading-tight" style={{ color: color || 'var(--text-primary)' }}>{value}</p>
        {sub && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs" style={{ color: 'var(--text-primary)' }}>
      <p className="font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
        {label ? new Date(+label).toLocaleTimeString() : ''}
      </p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function StatsPanel() {
  const { flights, ships, history } = useDataStore();
  const { statsVisible, setStatsVisible } = usePrefsStore();

  const flightArr = Object.values(flights);
  const shipArr = Object.values(ships);

  const stats = useMemo(() => {
    const avgSpd = flightArr.length
      ? Math.round(flightArr.reduce((s, f) => s + f.velocityKnots, 0) / flightArr.length)
      : 0;
    const avgAlt = flightArr.length
      ? Math.round(flightArr.reduce((s, f) => s + (f.altitudeFt || 0), 0) / flightArr.length)
      : 0;
    const avgShipSpd = shipArr.length
      ? +(shipArr.reduce((s, v) => s + v.speed, 0) / shipArr.length).toFixed(1)
      : 0;

    // Country distribution (top 5)
    const countryMap = {};
    flightArr.forEach((f) => { countryMap[f.country] = (countryMap[f.country] || 0) + 1; });
    const topCountries = Object.entries(countryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name: name.slice(0, 12), count }));

    // Ship type distribution
    const typeMap = {};
    shipArr.forEach((s) => { typeMap[s.type] = (typeMap[s.type] || 0) + 1; });
    const shipTypes = Object.entries(typeMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    return { avgSpd, avgAlt, avgShipSpd, topCountries, shipTypes };
  }, [flights, ships]);

  // Format history data for chart
  const chartData = useMemo(
    () =>
      history.map((h) => ({
        time: h.time,
        Flights: h.flights,
        Ships: h.ships,
      })),
    [history]
  );

  return (
    <AnimatePresence>
      {statsVisible && (
        <motion.div
          className="glass absolute z-[999] rounded-t-2xl"
          style={{ bottom: 0, left: '320px', right: '64px' }}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {/* Drag handle + toggle */}
          <div
            className="flex items-center justify-between px-4 py-2 cursor-pointer"
            onClick={() => setStatsVisible(false)}
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-1 rounded-full mx-auto" style={{ background: 'var(--border)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Analytics Dashboard
              </span>
            </div>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>▼ collapse</span>
          </div>

          <div className="p-3 overflow-x-auto">
            {/* Stat cards row */}
            <div className="flex gap-2 flex-wrap mb-3">
              <StatCard icon="✈" label="Flights" value={flightArr.length.toLocaleString()} color="var(--accent)" />
              <StatCard icon="🚢" label="Ships" value={shipArr.length.toLocaleString()} color="var(--accent-alt)" />
              <StatCard icon="⚡" label="Avg Speed" value={`${stats.avgSpd} kn`} sub="flights" color="var(--accent-green)" />
              <StatCard icon="⬆" label="Avg Alt" value={`${(stats.avgAlt / 1000).toFixed(0)}k ft`} sub="flights" color="var(--accent-amber)" />
              <StatCard icon="🌊" label="Ship Speed" value={`${stats.avgShipSpd} kn`} sub="avg" color="var(--accent-alt)" />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-3 gap-3">
              {/* Traffic over time */}
              <div>
                <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Traffic History</p>
                <ResponsiveContainer width="100%" height={80}>
                  <AreaChart data={chartData} margin={{ top: 2, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gFlights" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gShips" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-alt)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--accent-alt)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" hide />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="Flights" stroke="var(--accent)" fill="url(#gFlights)" strokeWidth={1.5} dot={false} />
                    <Area type="monotone" dataKey="Ships" stroke="var(--accent-alt)" fill="url(#gShips)" strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Top countries */}
              <div>
                <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Top Origins</p>
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart data={stats.topCountries} margin={{ top: 2, right: 4, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="var(--accent)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Ship types */}
              <div>
                <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Ship Types</p>
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart data={stats.shipTypes} margin={{ top: 2, right: 4, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="var(--accent-alt)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
