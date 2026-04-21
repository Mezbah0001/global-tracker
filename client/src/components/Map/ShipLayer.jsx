import { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useDataStore, usePrefsStore } from '../../store/useStore';
import { makeShipIcon } from '../../utils/icons';

const HEADING_THRESHOLD = 4;
const GLIDE_MS = 7500; // ships update every 8s, glide over 7.5s

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export default function ShipLayer() {
  const map = useMap();
  const layerRef = useRef(null);
  const stateRef = useRef({}); // id -> { marker, heading, selected, style, fromLat, fromLng, toLat, toLng, startTime }
  const rafRef = useRef(null);

  const { ships, selectedId, selectedType, setSelected } = useDataStore();
  const { layers, markerStyle, smoothInterpolation } = usePrefsStore();

  useEffect(() => {
    layerRef.current = L.layerGroup().addTo(map);
    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current);
    };
  }, [map]);

  // RAF glide loop for ships
  useEffect(() => {
    const animate = (now) => {
      Object.values(stateRef.current).forEach((s) => {
        if (!s.marker || s.startTime == null) return;
        const t = easeInOut(Math.min((now - s.startTime) / GLIDE_MS, 1));
        if (t >= 1) return;
        const lat = s.fromLat + (s.toLat - s.fromLat) * t;
        let dLng = s.toLng - s.fromLng;
        if (dLng > 180) dLng -= 360;
        if (dLng < -180) dLng += 360;
        s.marker.setLatLng([lat, s.fromLng + dLng * t]);
      });
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleClick = useCallback((id) => setSelected(id, 'ship'), [setSelected]);

  useEffect(() => {
    if (!layerRef.current) return;

    if (!layers.ships) {
      Object.values(stateRef.current).forEach(({ marker }) => {
        if (marker && map.hasLayer(marker)) map.removeLayer(marker);
      });
      stateRef.current = {};
      return;
    }

    const currentIds = new Set(Object.keys(ships));

    // Remove gone
    Object.keys(stateRef.current).forEach((id) => {
      if (!currentIds.has(id)) {
        const { marker } = stateRef.current[id];
        if (marker && map.hasLayer(marker)) map.removeLayer(marker);
        delete stateRef.current[id];
      }
    });

    Object.values(ships).forEach((ship) => {
      const isSelected = selectedId === ship.id && selectedType === 'ship';
      const existing = stateRef.current[ship.id];

      if (existing) {
        if (smoothInterpolation) {
          const curLL = existing.marker.getLatLng();
          existing.fromLat = curLL.lat;
          existing.fromLng = curLL.lng;
          existing.toLat = ship.lat;
          existing.toLng = ship.lng;
          existing.startTime = performance.now();
        } else {
          existing.marker.setLatLng([ship.lat, ship.lng]);
          existing.fromLat = ship.lat;
          existing.fromLng = ship.lng;
          existing.toLat = ship.lat;
          existing.toLng = ship.lng;
          existing.startTime = null;
        }

        const headingDiff = Math.abs(ship.heading - existing.heading);
        if (headingDiff > HEADING_THRESHOLD || existing.selected !== isSelected || existing.style !== markerStyle) {
          existing.marker.setIcon(makeShipIcon(ship, { selected: isSelected, style: markerStyle }));
          existing.heading = ship.heading;
          existing.selected = isSelected;
          existing.style = markerStyle;
        }
      } else {
        const icon = makeShipIcon(ship, { selected: isSelected, style: markerStyle });
        const marker = L.marker([ship.lat, ship.lng], {
          icon,
          zIndexOffset: isSelected ? 1000 : 0,
        });

        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          handleClick(ship.id);
        });

        marker.bindTooltip(
          `<div style="font-family:Inter,sans-serif;font-size:11px;line-height:1.5">
            <strong>${ship.name}</strong><br/>
            ${ship.type} · ${ship.country} ${ship.flag}<br/>
            ${ship.speed} kn${ship.destination ? ' → ' + ship.destination : ''}
          </div>`,
          { direction: 'top', offset: [0, -8], opacity: 0.95 }
        );

        marker.addTo(layerRef.current);
        stateRef.current[ship.id] = {
          marker,
          heading: ship.heading,
          selected: isSelected,
          style: markerStyle,
          fromLat: ship.lat,
          fromLng: ship.lng,
          toLat: ship.lat,
          toLng: ship.lng,
          startTime: null,
        };
      }
    });
  }, [ships, selectedId, selectedType, layers.ships, markerStyle, smoothInterpolation]);

  return null;
}
