import L from 'leaflet';

// Returns SVG string for aircraft icon (rotated by heading)
export function flightSVG(heading = 0, color = '#38bdf8', size = 24, style = 'detailed') {
  const simple = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
      <path fill="${color}" d="M12 2L8 9H3L7 13L5 20L12 16L19 20L17 13L21 9H16L12 2Z"/>
    </svg>`;

  const detailed = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">
      <g fill="${color}">
        <path d="M16 2 L13 12 L2 14 L4 17 L13 15 L11 28 L16 26 L21 28 L19 15 L28 17 L30 14 L19 12 Z"/>
      </g>
    </svg>`;

  const glowing = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <g fill="${color}" filter="url(#glow)">
        <path d="M16 2 L13 12 L2 14 L4 17 L13 15 L11 28 L16 26 L21 28 L19 15 L28 17 L30 14 L19 12 Z"/>
      </g>
    </svg>`;

  const svg = style === 'simple' ? simple : style === 'glowing' ? glowing : detailed;
  return svg;
}

// Ship SVG by vessel type
export function shipSVG(type = 'Cargo', color = '#818cf8', size = 20, style = 'detailed') {
  const shapes = {
    Container: 'M4 18 L4 10 L12 6 L20 10 L20 18 L16 20 L8 20 Z',
    Tanker: 'M3 17 L3 12 L8 8 L16 8 L21 12 L21 17 L17 19 L7 19 Z',
    Passenger: 'M5 18 L4 11 L8 7 L16 7 L20 11 L19 18 L5 18 Z M6 13 L18 13',
    'Bulk Carrier': 'M3 18 L3 13 L7 9 L17 9 L21 13 L21 18 Z',
    Cargo: 'M4 18 L4 12 L10 8 L18 9 L22 13 L20 18 Z',
    'LNG Carrier': 'M2 18 L4 11 L8 7 L16 7 L20 11 L22 18 Z',
    RORO: 'M3 17 L3 11 L7 7 L17 7 L21 11 L21 17 L19 19 L5 19 Z',
    Fishing: 'M6 18 L4 13 L7 9 L13 8 L17 11 L16 18 Z',
  };

  const path = shapes[type] || shapes.Cargo;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
      ${style === 'glowing' ? `
        <defs>
          <filter id="sglow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>` : ''}
      <path fill="${color}" d="${path}" ${style === 'glowing' ? 'filter="url(#sglow)"' : ''}/>
    </svg>`;
  return svg;
}

// Build a Leaflet DivIcon for a flight
export function makeFlightIcon(flight, options = {}) {
  const {
    selected = false,
    color = '#38bdf8',
    selectedColor = '#f59e0b',
    size = 24,
    style = 'detailed',
  } = options;

  const c = selected ? selectedColor : color;
  const sz = selected ? size * 1.3 : size;
  const svg = flightSVG(flight.heading, c, sz, style);

  return L.divIcon({
    html: `<div class="flight-icon ${style === 'glowing' ? 'glowing' : ''}" style="transform:rotate(${flight.heading}deg);width:${sz}px;height:${sz}px">${svg}${selected ? '<span class="marker-ping" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:8px;height:8px;background:'+c+';border-radius:50%;"></span>' : ''}</div>`,
    className: '',
    iconSize: [sz, sz],
    iconAnchor: [sz / 2, sz / 2],
  });
}

// Build a Leaflet DivIcon for a ship
export function makeShipIcon(ship, options = {}) {
  const {
    selected = false,
    color = '#818cf8',
    selectedColor = '#f59e0b',
    size = 20,
    style = 'detailed',
  } = options;

  const typeColors = {
    Container: '#60a5fa',
    Tanker: '#f97316',
    'Bulk Carrier': '#a78bfa',
    Cargo: '#34d399',
    Passenger: '#f472b6',
    'LNG Carrier': '#facc15',
    RORO: '#2dd4bf',
    Fishing: '#fb7185',
  };

  const c = selected ? selectedColor : (typeColors[ship.type] || color);
  const sz = selected ? size * 1.4 : size;
  const svg = shipSVG(ship.type, c, sz, style);

  return L.divIcon({
    html: `<div class="ship-icon ${style === 'glowing' ? 'glowing' : ''}" style="transform:rotate(${ship.heading}deg);width:${sz}px;height:${sz}px">${svg}</div>`,
    className: '',
    iconSize: [sz, sz],
    iconAnchor: [sz / 2, sz / 2],
  });
}

// Color for flight altitude gradient (low=yellow, mid=cyan, high=white)
export function altitudeColor(altFt) {
  if (!altFt || altFt < 5000) return '#fbbf24';
  if (altFt < 20000) return '#34d399';
  if (altFt < 35000) return '#38bdf8';
  return '#e0f2fe';
}

// Color for ship type
export function shipTypeColor(type) {
  const colors = {
    Container: '#60a5fa', Tanker: '#f97316', 'Bulk Carrier': '#a78bfa',
    Cargo: '#34d399', Passenger: '#f472b6', 'LNG Carrier': '#facc15',
    RORO: '#2dd4bf', Fishing: '#fb7185',
  };
  return colors[type] || '#94a3b8';
}
