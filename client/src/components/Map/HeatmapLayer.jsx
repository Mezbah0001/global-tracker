import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useDataStore, usePrefsStore } from '../../store/useStore';

// Canvas-based density heatmap drawn directly on Leaflet's overlay pane
export default function HeatmapLayer() {
  const map = useMap();
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  const { flights, ships } = useDataStore();
  const { layers } = usePrefsStore();

  useEffect(() => {
    // Create canvas and attach to Leaflet overlay pane
    const canvas = L.DomUtil.create('canvas', 'leaflet-heatmap-layer');
    const pane = map.getPanes().overlayPane;
    pane.appendChild(canvas);
    canvasRef.current = canvas;

    const resize = () => {
      const size = map.getSize();
      canvas.width = size.x;
      canvas.height = size.y;
      canvas.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;';
    };

    resize();
    map.on('moveend zoomend resize', render);
    map.on('resize', resize);

    function render() {
      if (!canvasRef.current) return;
      const size = map.getSize();
      canvas.width = size.x;
      canvas.height = size.y;

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, size.x, size.y);

      const drawPoints = (items, r, g, b) => {
        items.forEach((item) => {
          try {
            const p = map.latLngToContainerPoint([item.lat, item.lng]);
            if (p.x < -50 || p.x > size.x + 50 || p.y < -50 || p.y > size.y + 50) return;
            const radius = 20;
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
            grad.addColorStop(0, `rgba(${r},${g},${b},0.25)`);
            grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            ctx.fill();
          } catch (_) {}
        });
      };

      if (layers.flights) drawPoints(Object.values(flights), 56, 189, 248);
      if (layers.ships) drawPoints(Object.values(ships), 129, 140, 248);
    }

    render();

    return () => {
      map.off('moveend zoomend resize', render);
      map.off('resize', resize);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      canvasRef.current = null;
    };
  }, [map]);

  // Re-render when data or layer visibility changes
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const size = map.getSize();
    canvas.width = size.x;
    canvas.height = size.y;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size.x, size.y);

    const drawPoints = (items, r, g, b) => {
      items.forEach((item) => {
        try {
          const p = map.latLngToContainerPoint([item.lat, item.lng]);
          if (p.x < -50 || p.x > size.x + 50 || p.y < -50 || p.y > size.y + 50) return;
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 20);
          grad.addColorStop(0, `rgba(${r},${g},${b},0.25)`);
          grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
          ctx.fill();
        } catch (_) {}
      });
    };

    if (layers.flights) drawPoints(Object.values(flights), 56, 189, 248);
    if (layers.ships) drawPoints(Object.values(ships), 129, 140, 248);
  }, [flights, ships, layers]);

  return null;
}
