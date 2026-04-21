import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Haversine distance in km
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Persisted prefs (theme, favorites, filters)
const usePrefsStore = create(
  persist(
    (set) => ({
      theme: 'dark',
      mapStyle: 'night',
      markerStyle: 'detailed',
      animationSpeed: 'normal',
      smoothInterpolation: true,
      showTrails: true,
      trailLength: 8,
      showHeatmap: false,
      layers: { flights: true, ships: true },
      favorites: [],
      filterCountries: [],
      filterShipTypes: [],
      filterSpeedRange: [0, 1200],
      filterAltRange: [0, 15000],
      filterSearchQuery: '',
      sortBy: 'none',
      statsVisible: true,
      sidebarOpen: true,
      customLayout: {},

      setTheme: (theme) => set({ theme }),
      setMapStyle: (mapStyle) => set({ mapStyle }),
      setMarkerStyle: (markerStyle) => set({ markerStyle }),
      setAnimationSpeed: (animationSpeed) => set({ animationSpeed }),
      setSmoothInterpolation: (v) => set({ smoothInterpolation: v }),
      setShowTrails: (v) => set({ showTrails: v }),
      setTrailLength: (v) => set({ trailLength: v }),
      setShowHeatmap: (v) => set({ showHeatmap: v }),
      setLayers: (layers) => set((s) => ({ layers: { ...s.layers, ...layers } })),
      toggleLayer: (key) => set((s) => ({ layers: { ...s.layers, [key]: !s.layers[key] } })),
      addFavorite: (id) => set((s) => ({ favorites: [...new Set([...s.favorites, id])] })),
      removeFavorite: (id) => set((s) => ({ favorites: s.favorites.filter((f) => f !== id) })),
      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((f) => f !== id)
            : [...s.favorites, id],
        })),
      setFilterCountries: (v) => set({ filterCountries: v }),
      setFilterShipTypes: (v) => set({ filterShipTypes: v }),
      setFilterSpeedRange: (v) => set({ filterSpeedRange: v }),
      setFilterAltRange: (v) => set({ filterAltRange: v }),
      setFilterSearchQuery: (v) => set({ filterSearchQuery: v }),
      setSortBy: (v) => set({ sortBy: v }),
      setStatsVisible: (v) => set({ statsVisible: v }),
      setSidebarOpen: (v) => set({ sidebarOpen: v }),
    }),
    {
      name: 'tracker-prefs',
      partialize: (s) => ({
        theme: s.theme,
        mapStyle: s.mapStyle,
        markerStyle: s.markerStyle,
        animationSpeed: s.animationSpeed,
        smoothInterpolation: s.smoothInterpolation,
        showTrails: s.showTrails,
        trailLength: s.trailLength,
        showHeatmap: s.showHeatmap,
        layers: s.layers,
        favorites: s.favorites,
        statsVisible: s.statsVisible,
        sidebarOpen: s.sidebarOpen,
      }),
    }
  )
);

// Live data store (no persistence)
const useDataStore = create((set, get) => ({
  flights: {},
  ships: {},
  trails: {},           // { [id]: [[lat,lng], ...] }
  selectedId: null,
  selectedType: null,   // 'flight' | 'ship'
  userLocation: null,
  history: [],          // traffic history [{time, flights, ships}]
  connected: false,
  lastUpdate: null,

  setConnected: (v) => set({ connected: v }),
  setUserLocation: (loc) => set({ userLocation: loc }),
  setHistory: (history) => set({ history }),

  updateFlights: (flights) => {
    const newMap = {};
    flights.forEach((f) => { newMap[f.id] = f; });

    // Incrementally update trails only for moved flights
    const prevTrails = get().trails;
    const trailLength = usePrefsStore.getState().trailLength;
    const updatedTrails = {};

    flights.forEach((f) => {
      const existing = prevTrails[f.id] || [];
      const last = existing[existing.length - 1];
      if (!last || last[0] !== f.lat || last[1] !== f.lng) {
        updatedTrails[f.id] = [...existing, [f.lat, f.lng]].slice(-trailLength);
      }
    });

    const trails = Object.keys(updatedTrails).length > 0
      ? { ...prevTrails, ...updatedTrails }
      : prevTrails;

    set({ flights: newMap, trails, lastUpdate: Date.now() });
  },

  updateShips: (ships) => {
    const newMap = {};
    ships.forEach((s) => { newMap[s.id] = s; });

    const prevTrails = get().trails;
    const trailLength = usePrefsStore.getState().trailLength;
    const updatedTrails = {};

    ships.forEach((s) => {
      const existing = prevTrails[s.id] || [];
      const last = existing[existing.length - 1];
      if (!last || last[0] !== s.lat || last[1] !== s.lng) {
        updatedTrails[s.id] = [...existing, [s.lat, s.lng]].slice(-trailLength);
      }
    });

    const trails = Object.keys(updatedTrails).length > 0
      ? { ...prevTrails, ...updatedTrails }
      : prevTrails;

    set({ ships: newMap, trails, lastUpdate: Date.now() });
  },

  setSelected: (id, type) => set({ selectedId: id, selectedType: type }),
  clearSelected: () => set({ selectedId: null, selectedType: null }),

  // Derived: filtered + sorted list
  getFilteredItems: () => {
    const state = get();
    const prefs = usePrefsStore.getState();
    const {
      layers, filterCountries, filterShipTypes,
      filterSpeedRange, filterAltRange, filterSearchQuery, sortBy,
    } = prefs;

    const items = [];

    if (layers.flights) {
      Object.values(state.flights).forEach((f) => {
        if (filterCountries.length && !filterCountries.includes(f.country)) return;
        if (f.velocityKnots < filterSpeedRange[0] || f.velocityKnots > filterSpeedRange[1]) return;
        if (f.altitudeFt < filterAltRange[0] || f.altitudeFt > filterAltRange[1]) return;
        if (filterSearchQuery) {
          const q = filterSearchQuery.toLowerCase();
          if (!f.callsign?.toLowerCase().includes(q) && !f.country?.toLowerCase().includes(q)) return;
        }
        items.push(f);
      });
    }

    if (layers.ships) {
      Object.values(state.ships).forEach((s) => {
        if (filterCountries.length && !filterCountries.includes(s.country)) return;
        if (filterShipTypes.length && !filterShipTypes.includes(s.type)) return;
        const speedKnots = s.speed;
        if (speedKnots < filterSpeedRange[0] || speedKnots > filterSpeedRange[1]) return;
        if (filterSearchQuery) {
          const q = filterSearchQuery.toLowerCase();
          if (!s.name?.toLowerCase().includes(q) && !s.type?.toLowerCase().includes(q) && !s.country?.toLowerCase().includes(q)) return;
        }
        items.push(s);
      });
    }

    if (sortBy === 'fastest') {
      items.sort((a, b) => {
        const sa = a.type === 'flight' ? a.velocityKnots : a.speed;
        const sb = b.type === 'flight' ? b.velocityKnots : b.speed;
        return sb - sa;
      });
    } else if (sortBy === 'highest') {
      items.sort((a, b) => (b.altitudeFt || 0) - (a.altitudeFt || 0));
    } else if (sortBy === 'nearest' && state.userLocation) {
      const { lat, lng } = state.userLocation;
      items.sort((a, b) => haversine(lat, lng, a.lat, a.lng) - haversine(lat, lng, b.lat, b.lng));
    }

    return items;
  },
}));

export { usePrefsStore, useDataStore };
