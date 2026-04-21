export function haversine(lat1, lng1, lat2, lng2) {
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

// Predict next position given speed (knots), heading (deg), seconds ahead
export function predictPosition(lat, lng, headingDeg, speedKnots, seconds = 60) {
  const R = 6371000; // Earth radius in meters
  const d = speedKnots * 0.514444 * seconds; // distance in meters
  const bearing = (headingDeg * Math.PI) / 180;

  const lat1 = (lat * Math.PI) / 180;
  const lng1 = (lng * Math.PI) / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d / R) +
      Math.cos(lat1) * Math.sin(d / R) * Math.cos(bearing)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(d / R) * Math.cos(lat1),
      Math.cos(d / R) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    lat: +((lat2 * 180) / Math.PI).toFixed(4),
    lng: +((((lng2 * 180) / Math.PI + 540) % 360) - 180).toFixed(4),
  };
}

// Simple anomaly detection: check if heading deviates significantly from trail
export function detectAnomaly(trail, currentHeading) {
  if (trail.length < 3) return false;
  const recent = trail.slice(-3);
  const vectors = [];
  for (let i = 1; i < recent.length; i++) {
    const dLat = recent[i][0] - recent[i - 1][0];
    const dLng = recent[i][1] - recent[i - 1][1];
    vectors.push((Math.atan2(dLng, dLat) * 180) / Math.PI);
  }
  const avgDir = vectors.reduce((a, b) => a + b, 0) / vectors.length;
  const diff = Math.abs(((currentHeading - avgDir + 540) % 360) - 180);
  return diff > 45; // >45° sudden deviation
}

export function formatAlt(meters) {
  if (meters == null || meters === 0) return 'N/A';
  return `${Math.round(meters * 3.28084).toLocaleString()} ft`;
}

export function formatSpeed(ms) {
  if (ms == null) return 'N/A';
  return `${Math.round(ms * 1.94384)} kn`;
}

export function formatSpeedKnots(kn) {
  if (kn == null) return 'N/A';
  return `${kn} kn`;
}

export function headingToCardinal(deg) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(((deg % 360) + 360) / 22.5) % 16];
}
