require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { fetchFlights } = require('./services/opensky');
const { ShipSimulator } = require('./services/shipSimulator');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 30000,
});

app.use(cors());
app.use(express.json());

const simulator = new ShipSimulator();
let cachedFlights = [];
let cachedShips = [];
let flightHistory = []; // rolling 24h traffic counts

function recordTrafficSnapshot() {
  const now = Date.now();
  flightHistory.push({ time: now, flights: cachedFlights.length, ships: cachedShips.length });
  // Keep last 144 entries (24h at 10-min intervals)
  if (flightHistory.length > 144) flightHistory.shift();
}

async function updateFlights() {
  try {
    const flights = await fetchFlights();
    if (flights.length > 0) cachedFlights = flights;
    io.emit('flights:update', cachedFlights);
  } catch (err) {
    console.error('[OpenSky] Error:', err.message);
    // Still emit cached data so clients stay connected
    io.emit('flights:update', cachedFlights);
  }
}

function updateShips() {
  cachedShips = simulator.tick();
  io.emit('ships:update', cachedShips);
}

// REST endpoints for initial load
app.get('/api/flights', (req, res) => res.json(cachedFlights));
app.get('/api/ships', (req, res) => res.json(cachedShips));
app.get('/api/history', (req, res) => res.json(flightHistory));
app.get('/api/stats', (req, res) => {
  const airborne = cachedFlights.filter(f => !f.onGround);
  res.json({
    totalFlights: airborne.length,
    totalShips: cachedShips.length,
    avgFlightSpeed: airborne.length
      ? Math.round(airborne.reduce((s, f) => s + (f.velocity || 0), 0) / airborne.length)
      : 0,
    avgFlightAlt: airborne.length
      ? Math.round(airborne.reduce((s, f) => s + (f.altitude || 0), 0) / airborne.length)
      : 0,
    avgShipSpeed: cachedShips.length
      ? +(cachedShips.reduce((s, v) => s + v.speed, 0) / cachedShips.length).toFixed(1)
      : 0,
    topCountries: getTopCountries(),
  });
});

function getTopCountries() {
  const counts = {};
  cachedFlights.forEach(f => { counts[f.country] = (counts[f.country] || 0) + 1; });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([country, count]) => ({ country, count }));
}

io.on('connection', (socket) => {
  console.log('[Socket] Client connected:', socket.id);
  // Send current snapshot immediately
  socket.emit('flights:update', cachedFlights);
  socket.emit('ships:update', cachedShips);
  socket.emit('history:update', flightHistory);
  socket.on('disconnect', () => console.log('[Socket] Client disconnected:', socket.id));
});

// Boot sequence: load data, then set intervals
(async () => {
  console.log('[Server] Starting up...');
  updateShips();
  await updateFlights();
  recordTrafficSnapshot();

  setInterval(updateFlights, 15000);
  setInterval(updateShips, 8000); // 8s — ships move slowly, no need for 4s
  setInterval(() => {
    recordTrafficSnapshot();
    io.emit('history:update', flightHistory);
  }, 600000); // every 10 min
})();

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`[Server] Listening on http://localhost:${PORT}`));
