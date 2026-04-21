const axios = require('axios');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 12 });

// Map country codes to full names for a subset of common origins
const COUNTRY_FLAGS = {
  'United States': '🇺🇸', 'China': '🇨🇳', 'Russia': '🇷🇺', 'Germany': '🇩🇪',
  'France': '🇫🇷', 'United Kingdom': '🇬🇧', 'Japan': '🇯🇵', 'Canada': '🇨🇦',
  'Australia': '🇦🇺', 'Brazil': '🇧🇷', 'Spain': '🇪🇸', 'Italy': '🇮🇹',
  'Netherlands': '🇳🇱', 'Turkey': '🇹🇷', 'India': '🇮🇳', 'South Korea': '🇰🇷',
  'Norway': '🇳🇴', 'Sweden': '🇸🇪', 'Switzerland': '🇨🇭', 'UAE': '🇦🇪',
};

async function fetchFlights() {
  const cached = cache.get('flights');
  if (cached) return cached;

  const authConfig = process.env.OPENSKY_USER
    ? { auth: { username: process.env.OPENSKY_USER, password: process.env.OPENSKY_PASS } }
    : {};

  const response = await axios.get('https://opensky-network.org/api/states/all', {
    timeout: 12000,
    headers: { 'Accept-Encoding': 'gzip, deflate' },
    ...authConfig,
  });

  if (!response.data || !response.data.states) return [];

  const flights = response.data.states
    .filter(s => s[5] != null && s[6] != null) // must have position
    .map(s => ({
      id: s[0],
      callsign: (s[1] || '').trim() || s[0],
      country: s[2] || 'Unknown',
      flag: COUNTRY_FLAGS[s[2]] || '🌐',
      lat: +s[6].toFixed(4),
      lng: +s[5].toFixed(4),
      altitude: s[7] != null ? Math.round(s[7]) : 0,         // meters
      altitudeFt: s[7] != null ? Math.round(s[7] * 3.28084) : 0,
      onGround: !!s[8],
      velocity: s[9] != null ? Math.round(s[9]) : 0,         // m/s
      velocityKnots: s[9] != null ? Math.round(s[9] * 1.94384) : 0,
      heading: s[10] != null ? +s[10].toFixed(1) : 0,
      verticalRate: s[11] != null ? +s[11].toFixed(1) : 0,
      squawk: s[14] || '',
      type: 'flight',
    }))
    .filter(f => !f.onGround) // only airborne
    .slice(0, 4000);

  cache.set('flights', flights);
  console.log(`[OpenSky] Fetched ${flights.length} flights`);
  return flights;
}

module.exports = { fetchFlights };
