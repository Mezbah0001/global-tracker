// Realistic ship simulation across global shipping lanes
// Ships follow great-circle routes and wrap around the globe

const SHIP_TYPES = ['Container', 'Tanker', 'Bulk Carrier', 'Cargo', 'Passenger', 'LNG Carrier', 'RORO', 'Fishing'];

const SHIP_FLAGS = {
  Panama: '🇵🇦', Liberia: '🇱🇷', Marshall: '🇲🇭', Bahamas: '🇧🇸',
  Singapore: '🇸🇬', Malta: '🇲🇹', China: '🇨🇳', 'Hong Kong': '🇭🇰',
  Greece: '🇬🇷', Cyprus: '🇨🇾', Japan: '🇯🇵', Norway: '🇳🇴',
  'United Kingdom': '🇬🇧', Germany: '🇩🇪', 'South Korea': '🇰🇷',
};

// Major shipping routes: [startLat, startLng, endLat, endLng, name]
const ROUTES = [
  // Pacific - Trans-Pacific
  [31.2, 121.5, 33.7, -118.2, 'Shanghai→LA'],
  [35.7, 139.7, 37.8, -122.4, 'Tokyo→San Francisco'],
  [22.3, 114.2, 49.3, -123.1, 'Hong Kong→Vancouver'],
  [1.3, 103.8, 34.0, -118.2, 'Singapore→LA'],
  [35.1, 129.0, 21.3, -157.8, 'Busan→Honolulu'],
  [-33.9, 151.2, 47.6, -122.3, 'Sydney→Seattle'],

  // Atlantic - Trans-Atlantic
  [51.5, -0.1, 40.7, -74.0, 'London→New York'],
  [53.4, -3.0, 25.8, -80.2, 'Liverpool→Miami'],
  [48.9, 2.4, 40.7, -74.0, 'Paris→New York'],
  [52.4, 4.9, 40.7, -74.0, 'Rotterdam→New York'],
  [36.1, -5.4, 40.7, -74.0, 'Gibraltar→New York'],
  [-23.0, -43.2, 51.5, -0.1, 'Rio→London'],
  [-33.9, 18.4, 51.5, -0.1, 'Cape Town→London'],

  // Mediterranean
  [43.3, 5.4, 36.9, 30.7, 'Marseille→Antalya'],
  [40.6, 14.3, 37.0, 22.1, 'Naples→Piraeus'],
  [31.2, 29.9, 40.6, 14.3, 'Alexandria→Naples'],
  [36.9, 30.7, 41.0, 28.9, 'Antalya→Istanbul'],
  [37.0, 22.1, 31.2, 29.9, 'Piraeus→Alexandria'],

  // Indian Ocean
  [25.3, 55.4, 1.3, 103.8, 'Dubai→Singapore'],
  [22.6, 88.4, 25.3, 55.4, 'Kolkata→Dubai'],
  [11.6, 43.1, 25.3, 55.4, 'Djibouti→Dubai'],
  [-20.2, 57.5, 1.3, 103.8, 'Mauritius→Singapore'],
  [4.2, 73.5, 25.3, 55.4, 'Maldives→Dubai'],
  [-4.0, 39.7, 22.6, 88.4, 'Mombasa→Kolkata'],

  // Suez/Red Sea Route
  [31.2, 29.9, 11.6, 43.1, 'Alexandria→Djibouti'],
  [27.2, 33.8, 11.6, 43.1, 'Suez→Djibouti'],

  // Southeast Asia
  [1.3, 103.8, 13.7, 100.5, 'Singapore→Bangkok'],
  [22.3, 114.2, 1.3, 103.8, 'Hong Kong→Singapore'],
  [10.8, 106.7, 1.3, 103.8, 'Ho Chi Minh→Singapore'],
  [13.1, 100.9, 22.3, 114.2, 'Bangkok→Hong Kong'],

  // Australasia
  [-33.9, 151.2, 1.3, 103.8, 'Sydney→Singapore'],
  [-37.8, 144.9, -33.9, 151.2, 'Melbourne→Sydney'],
  [-31.9, 115.9, -33.9, 151.2, 'Perth→Sydney'],

  // Americas Coastwise
  [40.7, -74.0, 25.8, -80.2, 'New York→Miami'],
  [25.8, -80.2, 9.1, -79.4, 'Miami→Panama'],
  [9.1, -79.4, -23.0, -43.2, 'Panama→Rio'],
  [-33.5, -70.7, 9.1, -79.4, 'Valparaiso→Panama'],
  [-34.6, -58.4, -23.0, -43.2, 'Buenos Aires→Rio'],

  // North Sea / Baltic
  [52.4, 4.9, 57.7, 11.9, 'Rotterdam→Gothenburg'],
  [55.7, 12.6, 52.4, 4.9, 'Copenhagen→Rotterdam'],
  [59.9, 24.9, 52.4, 4.9, 'Helsinki→Rotterdam'],
  [59.3, 18.1, 55.7, 12.6, 'Stockholm→Copenhagen'],

  // Persian Gulf
  [26.2, 50.6, 25.3, 55.4, 'Dammam→Dubai'],
  [29.4, 48.0, 25.3, 55.4, 'Kuwait→Dubai'],
  [24.5, 54.4, 25.3, 55.4, 'Abu Dhabi→Dubai'],
];

const SHIP_NAMES = [
  'Ever Given', 'MSC Oscar', 'Emma Maersk', 'CMA CGM Jules Verne', 'MSC Gülsün',
  'HMM Algeciras', 'OOCL Hong Kong', 'MSC Mia', 'Ever Ace', 'Maersk Mc-Kinney Møller',
  'MOL Triumph', 'MSC Maya', 'COSCO Shipping Universe', 'CMA CGM Bougainville',
  'MSC Zoe', 'Seaspan Efficiency', 'Pacific Carrier', 'Atlantic Explorer', 'Ocean Pioneer',
  'Sea Dragon', 'Wind Spirit', 'Star Performer', 'Nordic Crown', 'Eastern Gateway',
  'Southern Cross', 'Blue Horizon', 'Golden Gate', 'Silver Stream', 'Crystal Bay',
  'Arctic Voyager', 'Tropical Sun', 'Desert Wind', 'Coral Sea', 'Jade Emperor',
  'Tiger Express', 'Phoenix Rising', 'Titan Glory', 'Neptune Dream', 'Poseidon Star',
  'Triton Wave', 'Odyssey', 'Endeavour', 'Discovery', 'Resolution', 'Challenger',
  'Meridian Star', 'Latitude', 'Longitude', 'Compass Rose', 'True North',
  'Baltic Pioneer', 'Adriatic Glory', 'Aegean Spirit', 'Ionian Dream', 'Tyrrhenian',
  'Caspian Star', 'Arabian Knight', 'Persian Gulf', 'Red Sea Queen', 'Dead Sea',
  'Black Sea Star', 'North Sea', 'Celtic Pride', 'Iberian Express', 'Lusitania',
  'Britannia', 'Hibernia', 'Caledonia', 'Cambria', 'Cymru',
  'Nippon Maru', 'Fuji Dragon', 'Sakura Express', 'Yamato', 'Musashi',
  'Yangtze River', 'Pearl River', 'Yellow River', 'Min River', 'Han River',
  'Ganges Dream', 'Indus Valley', 'Brahmaputra', 'Irrawaddy', 'Mekong Star',
  'Amazon Queen', 'Orinoco', 'La Plata', 'Parana River', 'Uruguay Star',
  'Mississippi Delta', 'Missouri Star', 'Ohio River', 'Tennessee', 'Columbia',
  'Congo Express', 'Niger Delta', 'Nile Queen', 'Zambezi', 'Limpopo',
  'Murray Darling', 'Swan River', 'Derwent', 'Brisbane', 'Yarra Delta',
];

const FLAG_COUNTRIES = Object.keys(SHIP_FLAGS);

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lngDiff(lng1, lng2) {
  // Handle antimeridian crossing
  let d = lng2 - lng1;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

function calcHeading(lat1, lng1, lat2, lng2) {
  const dLng = lngDiff(lng1, lng2) * (Math.PI / 180);
  const lat1r = lat1 * (Math.PI / 180);
  const lat2r = lat2 * (Math.PI / 180);
  const y = Math.sin(dLng) * Math.cos(lat2r);
  const x = Math.cos(lat1r) * Math.sin(lat2r) - Math.sin(lat1r) * Math.cos(lat2r) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

class ShipSimulator {
  constructor() {
    this.ships = [];
    this.tickCount = 0;
    this._initShips();
  }

  _initShips() {
    let id = 1;
    // Distribute ships across routes
    ROUTES.forEach((route, ri) => {
      const count = ri < 6 ? 5 : ri < 20 ? 3 : 2; // more ships on busier routes
      for (let i = 0; i < count; i++) {
        const progress = Math.random();
        const [sLat, sLng, eLat, eLng, routeName] = route;
        const lat = lerp(sLat, eLat, progress);
        const dlng = lngDiff(sLng, eLng);
        const lng = sLng + dlng * progress;

        const type = SHIP_TYPES[Math.floor(Math.random() * SHIP_TYPES.length)];
        const country = FLAG_COUNTRIES[Math.floor(Math.random() * FLAG_COUNTRIES.length)];
        const name = SHIP_NAMES[(id - 1) % SHIP_NAMES.length];

        // Speed: tankers 12-16 kn, containers 18-25 kn, cargo 13-18 kn
        const baseSpeed = type === 'Container' ? 20 + Math.random() * 5
          : type === 'Tanker' || type === 'LNG Carrier' ? 13 + Math.random() * 4
          : type === 'Passenger' ? 18 + Math.random() * 6
          : 14 + Math.random() * 5;

        this.ships.push({
          id: `SHIP${String(id++).padStart(6, '0')}`,
          mmsi: 200000000 + id,
          name,
          type,
          country,
          flag: SHIP_FLAGS[country] || '🌐',
          lat: +lat.toFixed(4),
          lng: +lng.toFixed(4),
          heading: calcHeading(sLat, sLng, eLat, eLng),
          speed: +baseSpeed.toFixed(1),
          length: type === 'Container' ? 300 + Math.floor(Math.random() * 100)
            : type === 'Tanker' ? 250 + Math.floor(Math.random() * 130)
            : 150 + Math.floor(Math.random() * 100),
          draft: 10 + Math.floor(Math.random() * 10),
          destination: route[4].split('→')[1],
          origin: route[4].split('→')[0],
          route: route[4],
          progress,
          routeIndex: ri,
          direction: 1,
          // Slight randomization to spread ships on same route
          latOffset: (Math.random() - 0.5) * 0.5,
          lngOffset: (Math.random() - 0.5) * 0.5,
          status: Math.random() > 0.05 ? 'Underway' : 'At Anchor',
        });
      }
    });

    console.log(`[ShipSim] Initialized ${this.ships.length} vessels`);
  }

  tick() {
    this.tickCount++;

    this.ships = this.ships.map(ship => {
      const route = ROUTES[ship.routeIndex];
      const [sLat, sLng, eLat, eLng] = route;

      // Speed in degrees per tick (~4s intervals, knots * 0.000514 deg/sec)
      const degPerSec = (ship.speed * 0.000514) * (180 / (Math.PI * 6371));
      const progressDelta = degPerSec * 4 / Math.max(
        Math.abs(eLat - sLat) + Math.abs(lngDiff(sLng, eLng)), 1
      );

      let newProgress = ship.progress + progressDelta * ship.direction;

      // Bounce between 0 and 1 (simulate return voyage)
      if (newProgress >= 1) {
        newProgress = 1 - (newProgress - 1);
        ship.direction = -1;
      } else if (newProgress <= 0) {
        newProgress = Math.abs(newProgress);
        ship.direction = 1;
      }

      const newLat = lerp(sLat, eLat, newProgress) + ship.latOffset;
      const dlng = lngDiff(sLng, eLng);
      let newLng = sLng + dlng * newProgress + ship.lngOffset;

      // Normalize longitude
      if (newLng > 180) newLng -= 360;
      if (newLng < -180) newLng += 360;

      // Heading: forward or reverse depending on direction
      const heading = ship.direction === 1
        ? calcHeading(sLat, sLng, eLat, eLng)
        : calcHeading(eLat, eLng, sLat, sLng);

      // Small speed fluctuation
      const speedDelta = (Math.random() - 0.5) * 0.2;
      const newSpeed = Math.max(0, Math.min(30, ship.speed + speedDelta));

      return {
        ...ship,
        lat: +newLat.toFixed(4),
        lng: +newLng.toFixed(4),
        heading: +heading.toFixed(1),
        speed: +newSpeed.toFixed(1),
        progress: newProgress,
        type: 'ship',
      };
    });

    return this.ships;
  }
}

module.exports = { ShipSimulator };
