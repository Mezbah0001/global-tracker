import React, { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { useDataStore, usePrefsStore } from '../../store/useStore';
import FlightLayer from './FlightLayer';
import ShipLayer from './ShipLayer';
import TrailLayer from './TrailLayer';
import HeatmapLayer from './HeatmapLayer';
import ControlBar from '../UI/ControlBar';

const TILE_LAYERS = {
  night: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com">CARTO</a>',
    maxZoom: 19,
  },
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, DigitalGlobe, GeoEye',
    maxZoom: 18,
  },
  minimal: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com">CARTO</a>',
    maxZoom: 19,
  },
};

// Inner component: responds to map clicks and handles tile layer switching
function MapController({ mapStyle, onMapClick }) {
  const map = useMap();

  useMapEvents({
    click: (e) => {
      onMapClick(e);
    },
  });

  return null;
}

// Auto-follow selected item
function AutoFollow() {
  const map = useMap();
  const { selectedId, selectedType, flights, ships } = useDataStore();
  const prevSelected = useRef(null);

  useEffect(() => {
    if (!selectedId) return;
    const item = selectedType === 'flight' ? flights[selectedId] : ships[selectedId];
    if (!item) return;
    // Only pan when selection changes, not every update
    if (prevSelected.current !== selectedId) {
      map.panTo([item.lat, item.lng], { animate: true, duration: 0.8 });
      prevSelected.current = selectedId;
    }
  }, [selectedId]);

  return null;
}

export default function MapView() {
  const { mapStyle, showHeatmap } = usePrefsStore();
  const { clearSelected } = useDataStore();
  const tile = TILE_LAYERS[mapStyle] || TILE_LAYERS.night;

  const handleMapClick = (e) => {
    // Only clear if click target is the map itself (not a marker)
    if (e.originalEvent.target.closest('.flight-icon, .ship-icon')) return;
    clearSelected();
  };

  return (
    <MapContainer
      center={[20, 0]}
      zoom={3}
      minZoom={2}
      maxZoom={18}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
      worldCopyJump={true}
      preferCanvas={true}
    >
      <TileLayer
        key={mapStyle}
        url={tile.url}
        attribution={tile.attribution}
        maxZoom={tile.maxZoom}
        subdomains="abcd"
      />

      <MapController mapStyle={mapStyle} onMapClick={handleMapClick} />
      <AutoFollow />
      <TrailLayer />
      <FlightLayer />
      <ShipLayer />
      {showHeatmap && <HeatmapLayer />}
      <ControlBar />
    </MapContainer>
  );
}
