import { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useDataStore, usePrefsStore } from '../../store/useStore';
import { makeFlightIcon, altitudeColor } from '../../utils/icons';
import { predictPosition } from '../../utils/geo';

const MAX_MARKERS = 1500;
const HEADING_THRESHOLD = 4;
const GLIDE_MS = 13000; // glide to new position over ~13s (just under the 15s update cycle)

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export default function FlightLayer() {
  const map = useMap();
  const layerRef = useRef(null);
  // id -> { marker, heading, selected, style, fromLat, fromLng, toLat, toLng, startTime }
  const stateRef = useRef({});
  const rafRef = useRef(null);

  const { flights, selectedId, selectedType, setSelected } = useDataStore();
  const { layers, markerStyle, smoothInterpolation } = usePrefsStore();

  // Create layer group once
  useEffect(() => {
    layerRef.current = L.layerGroup().addTo(map);
    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current);
    };
  }, [map]);

  // RAF animation loop — runs every frame, glides markers toward their targets
  useEffect(() => {
    const animate = (now) => {
      Object.values(stateRef.current).forEach((s) => {
        if (!s.marker || s.startTime == null) return;
        const elapsed = now - s.startTime;
        const t = easeInOut(Math.min(elapsed / GLIDE_MS, 1));
        if (t >= 1) return; // already at target, skip

        const lat = s.fromLat + (s.toLat - s.fromLat) * t;
        // Handle antimeridian wrapping
        let dLng = s.toLng - s.fromLng;
        if (dLng > 180) dLng -= 360;
        if (dLng < -180) dLng += 360;
        const lng = s.fromLng + dLng * t;
        s.marker.setLatLng([lat, lng]);
      });
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleClick = useCallback((id) => setSelected(id, 'flight'), [setSelected]);

  // Sync markers whenever flight data or display prefs change
  useEffect(() => {
    if (!layerRef.current) return;

    if (!layers.flights) {
      Object.values(stateRef.current).forEach(({ marker }) => {
        if (marker && map.hasLayer(marker)) map.removeLayer(marker);
      });
      stateRef.current = {};
      return;
    }

    const flightArr = Object.values(flights);
    const visible = flightArr
      .sort((a, b) => {
        if (a.id === selectedId) return -1;
        if (b.id === selectedId) return 1;
        return b.velocityKnots - a.velocityKnots;
      })
      .slice(0, MAX_MARKERS);

    const visibleIds = new Set(visible.map((f) => f.id));

    // Remove markers no longer in visible set
    Object.keys(stateRef.current).forEach((id) => {
      if (id === '__prediction__') return;
      if (!visibleIds.has(id)) {
        const { marker } = stateRef.current[id];
        if (marker && map.hasLayer(marker)) map.removeLayer(marker);
        delete stateRef.current[id];
      }
    });

    visible.forEach((flight) => {
      const isSelected = selectedId === flight.id && selectedType === 'flight';
      const color = altitudeColor(flight.altitudeFt);
      const existing = stateRef.current[flight.id];

      if (existing) {
        if (smoothInterpolation) {
          // Snapshot current interpolated position as new start point
          const curLL = existing.marker.getLatLng();
          existing.fromLat = curLL.lat;
          existing.fromLng = curLL.lng;
          existing.toLat = flight.lat;
          existing.toLng = flight.lng;
          existing.startTime = performance.now();
        } else {
          // Instant jump
          existing.marker.setLatLng([flight.lat, flight.lng]);
          existing.fromLat = flight.lat;
          existing.fromLng = flight.lng;
          existing.toLat = flight.lat;
          existing.toLng = flight.lng;
          existing.startTime = null;
        }

        // Only redraw SVG icon when heading or selection changes (expensive)
        const headingDiff = Math.abs(flight.heading - existing.heading);
        const selChanged = existing.selected !== isSelected;
        const styleChanged = existing.style !== markerStyle;
        if (headingDiff > HEADING_THRESHOLD || selChanged || styleChanged) {
          existing.marker.setIcon(
            makeFlightIcon(flight, { selected: isSelected, color, style: markerStyle })
          );
          existing.heading = flight.heading;
          existing.selected = isSelected;
          existing.style = markerStyle;
        }
      } else {
        // Brand-new marker
        const icon = makeFlightIcon(flight, { selected: isSelected, color, style: markerStyle });
        const marker = L.marker([flight.lat, flight.lng], {
          icon,
          zIndexOffset: isSelected ? 1000 : 0,
        });

        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          handleClick(flight.id);
        });

        marker.bindTooltip(
          `<div style="font-family:Inter,sans-serif;font-size:11px;line-height:1.5">
            <strong>${flight.callsign || flight.id}</strong><br/>
            ${flight.country} ${flight.flag}<br/>
            ${flight.altitudeFt ? flight.altitudeFt.toLocaleString() + ' ft' : '—'} · ${flight.velocityKnots} kn
          </div>`,
          { direction: 'top', offset: [0, -8], opacity: 0.95 }
        );

        marker.addTo(layerRef.current);
        stateRef.current[flight.id] = {
          marker,
          heading: flight.heading,
          selected: isSelected,
          style: markerStyle,
          fromLat: flight.lat,
          fromLng: flight.lng,
          toLat: flight.lat,
          toLng: flight.lng,
          startTime: null, // no interpolation on first placement
        };
      }
    });
  }, [flights, selectedId, selectedType, layers.flights, markerStyle, smoothInterpolation]);

  // Prediction dot for selected flight
  useEffect(() => {
    const pred = stateRef.current['__prediction__'];
    if (pred?.marker) {
      map.removeLayer(pred.marker);
      delete stateRef.current['__prediction__'];
    }

    if (selectedId && selectedType === 'flight' && flights[selectedId]) {
      const f = flights[selectedId];
      const pos = predictPosition(f.lat, f.lng, f.heading, f.velocityKnots, 300);
      const icon = L.divIcon({
        html: `<div style="width:10px;height:10px;border-radius:50%;
          background:rgba(251,191,36,0.4);border:2px dashed #fbbf24"></div>`,
        className: '',
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      });
      const predMarker = L.marker([pos.lat, pos.lng], { icon, interactive: false });
      predMarker.bindTooltip('Predicted (5 min)', { direction: 'top', offset: [0, -6] });
      predMarker.addTo(layerRef.current);
      stateRef.current['__prediction__'] = {
        marker: predMarker,
        heading: 0, selected: false, style: '',
        fromLat: pos.lat, fromLng: pos.lng,
        toLat: pos.lat, toLng: pos.lng,
        startTime: null,
      };
    }
  }, [selectedId, selectedType, flights]);

  return null;
}
