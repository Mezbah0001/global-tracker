import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useDataStore, usePrefsStore } from '../../store/useStore';

export default function TrailLayer() {
  const map = useMap();
  const layerRef = useRef(null);
  const polylinesRef = useRef({});

  const { trails, selectedId, flights, ships } = useDataStore();
  const { showTrails, trailLength, layers } = usePrefsStore();

  useEffect(() => {
    layerRef.current = L.layerGroup().addTo(map);
    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current);
    };
  }, [map]);

  useEffect(() => {
    if (!layerRef.current) return;

    // Clear existing polylines
    Object.values(polylinesRef.current).forEach((p) => {
      if (map.hasLayer(p)) map.removeLayer(p);
    });
    polylinesRef.current = {};

    if (!showTrails) return;

    // Only draw trail for selected item, or for all if showTrails is true
    const idsToRender = selectedId ? [selectedId] : [];

    // If no selection, draw short trails for all visible items
    if (!selectedId) {
      if (layers.flights) Object.keys(flights).forEach((id) => idsToRender.push(id));
      if (layers.ships) Object.keys(ships).forEach((id) => idsToRender.push(id));
    }

    idsToRender.forEach((id) => {
      const trail = trails[id];
      if (!trail || trail.length < 2) return;

      const points = trail.slice(-trailLength);
      const isSelected = id === selectedId;
      const isFlight = !!flights[id];

      // Gradient effect: older points more transparent
      for (let i = 1; i < points.length; i++) {
        const opacity = (i / points.length) * (isSelected ? 0.9 : 0.3);
        const weight = isSelected ? (i / points.length) * 3 : 1;
        const color = isFlight
          ? isSelected ? '#fbbf24' : '#38bdf8'
          : isSelected ? '#fbbf24' : '#818cf8';

        const segment = L.polyline([points[i - 1], points[i]], {
          color,
          weight,
          opacity,
          smoothFactor: 1,
          className: 'trail-line',
        });
        segment.addTo(layerRef.current);
        polylinesRef.current[`${id}_${i}`] = segment;
      }
    });
  }, [trails, selectedId, showTrails, trailLength, layers]);

  return null;
}
