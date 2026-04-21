# 🌍 Global Tracker — Live Flight & Ship Tracking

A real-time global tracker for flights and ships, built with a modern dark UI. Powered by the [OpenSky Network](https://opensky-network.org/) API for live aircraft data and a realistic ship simulation engine.

![Global Tracker](https://img.shields.io/badge/status-live-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![Node](https://img.shields.io/badge/node-18+-green) ![React](https://img.shields.io/badge/react-18-blue)

---

## ✨ Features

### 🗺️ Map
- Interactive global map with **4 styles**: Night · Street · Satellite · Minimal
- **4,000+ real live flights** from OpenSky Network API
- **122 simulated ships** on realistic global shipping routes
- Rotate aircraft icons based on heading direction
- Color-coded flights by altitude (yellow → cyan → white)
- Ship icons vary by vessel type (Container, Tanker, Passenger, etc.)

### 🎨 Themes
| Dark | Light | Cyberpunk |
|------|-------|-----------|
| Soft dark tones `#0f172a` | Clean and bright | Neon glow `#00f5ff` / `#ff00cc` |

### ⚙️ Controls
- **Layer toggles** — Flights / Ships / Heatmap / Trails
- **3 marker styles** — Simple · Detailed · Glowing
- **Smooth interpolation** — RAF-based glide between position updates
- **Path trails** — configurable length (2–20 points)
- **Traffic heatmap** — canvas density overlay
- **Animation speed** — Slow · Normal · Fast

### 🔍 Search & Filter
- Search by callsign, ship name, or country
- Filter by country, ship type, speed range, altitude range
- Sort by: Fastest · Highest Altitude · Nearest to you
- Debounced list (updates every 2s, not every socket tick)

### 📊 Analytics Dashboard
- Live stats: total flights, ships, avg speed, avg altitude
- **Traffic history** chart (AreaChart)
- **Top origin countries** chart (BarChart)
- **Ship type distribution** chart (BarChart)

### 🧠 Smart Features
- **Position prediction** — 5-minute ahead dot based on heading + speed
- **Anomaly detection** — flags sudden heading deviations (>45°)
- **Auto-pan** to selected flight/ship
- **Favorites** — save and track specific flights/ships (persisted to localStorage)

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) 18+
- npm 9+

### Install & Run
```bash
# 1. Clone
git clone https://github.com/Mezbah0001/global-tracker.git
cd global-tracker

# 2. Install all dependencies (root + server + client)
npm run install:all

# 3. Start both servers
npm run dev
```

Then open **http://localhost:5173** in your browser.

### Manual (two terminals)
```bash
# Terminal 1 — Backend (port 3001)
cd server
npm install
npm run dev

# Terminal 2 — Frontend (port 5173)
cd client
npm install
npm run dev
```

---

## 📁 Project Structure

```
global-tracker/
├── package.json              # Root — runs both servers via concurrently
│
├── server/                   # Node.js + Express + Socket.io
│   ├── index.js              # Server entry, WebSocket hub, API routes
│   ├── .env.example          # Environment variables template
│   └── services/
│       ├── opensky.js        # OpenSky Network API proxy + 12s cache
│       └── shipSimulator.js  # 122 ships across 50 global shipping routes
│
└── client/                   # React + Vite + Tailwind
    └── src/
        ├── App.jsx                    # Root — theme sync, layout
        ├── store/useStore.js          # Zustand (prefs persisted, live data ephemeral)
        ├── hooks/useSocket.js         # Socket.io connection
        ├── components/
        │   ├── Map/
        │   │   ├── MapView.jsx        # Leaflet MapContainer + tile layers
        │   │   ├── FlightLayer.jsx    # Flight markers with RAF interpolation
        │   │   ├── ShipLayer.jsx      # Ship markers with RAF interpolation
        │   │   ├── TrailLayer.jsx     # Path trail polylines
        │   │   └── HeatmapLayer.jsx   # Canvas density heatmap
        │   ├── Sidebar/
        │   │   ├── Sidebar.jsx        # Collapsible sidebar, tabs
        │   │   ├── FilterPanel.jsx    # Filters, sort, country/type chips
        │   │   └── ThemePanel.jsx     # Theme, map style, marker, animation
        │   ├── Dashboard/
        │   │   └── StatsPanel.jsx     # Stat cards + Recharts charts
        │   └── UI/
        │       ├── InfoModal.jsx      # Selected item detail panel
        │       └── ControlBar.jsx     # Zoom, layer toggles, connection status
        └── utils/
            ├── geo.js                 # Haversine, prediction, anomaly detection
            └── icons.js              # SVG DivIcons for flights and ships
```

---

## 🛰️ Data Sources

| Data | Source | Refresh |
|------|--------|---------|
| Live flights | [OpenSky Network](https://opensky-network.org/) (free, anonymous) | every 15s |
| Ships | Built-in simulation engine | every 8s |
| Map tiles | CartoDB / OpenStreetMap / Esri | on demand |

### Optional: OpenSky credentials
Anonymous access allows ~400 API credits/day (~26 fetches). For unlimited access:
1. Register free at [opensky-network.org](https://opensky-network.org/)
2. Copy `server/.env.example` → `server/.env`
3. Add your credentials:
```env
OPENSKY_USER=your_username
OPENSKY_PASS=your_password
```

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Map | Leaflet, React-Leaflet |
| State | Zustand (with localStorage persistence) |
| Animations | Framer Motion, requestAnimationFrame |
| Charts | Recharts |
| Backend | Node.js, Express |
| Real-time | Socket.io (WebSockets) |
| API | OpenSky Network |

---

## 📱 Mobile Access

If your phone is on the same Wi-Fi as your PC, open:
```
http://<your-local-ip>:5173
```
The Vite dev server binds to `0.0.0.0` so it's accessible from any device on your network.

---

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run install:all` | Install all dependencies |
| `npm run dev` | Start both servers concurrently |
| `npm run server` | Start backend only |
| `npm run client` | Start frontend only |
| `cd client && npm run build` | Production build |

---

## 📄 License

MIT — free to use, modify, and distribute.
