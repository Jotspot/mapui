// Marker elements for MapLibre custom markers.
//
// Team marker uses anchor:'top-left' with a zero-size anchor point at (0,0).
// All visuals hang above-and-right via position:absolute, so MapLibre never
// needs to measure element size to compute the anchor offset.
// The spike tip is placed exactly at the coordinate via a negative offset.

function initials(name) {
  return name.split(/[\s/]+/).map((w) => w[0] || '').join('').slice(0, 2).toUpperCase()
}

// Ring diameter + spike geometry constants — must match CSS below.
const RING = 56   // px, circle diameter
const SPIKE_H = 14 // px, visible spike height (16px height - 2px overlap)
const PIN_H = RING + SPIKE_H  // 70px total pin height

export function createTeamMarkerEl(team) {
  // Zero-size anchor div. anchor:'top-left' + offset places this corner exactly
  // at the spike tip. All visuals are absolutely positioned relative to this div.
  const el = document.createElement('div')
  el.style.cssText = 'position:relative;width:0;height:0;cursor:pointer;overflow:visible;'

  // Pin wrapper — absolutely positioned so spike tip aligns with el's origin
  const pin = document.createElement('div')
  // Left-center the pin on the spike tip: left = -RING/2, top = -PIN_H
  pin.style.cssText = [
    'position:absolute',
    `left:${-RING / 2}px`,  // center ring over spike tip
    `top:${-PIN_H}px`,      // push pin up so spike tip is at origin
    `width:${RING}px`,
    'display:flex', 'flex-direction:column', 'align-items:center',
    'pointer-events:auto',
  ].join(';')

  // Coloured ring
  const ring = document.createElement('div')
  ring.style.cssText = [
    `width:${RING}px`, `height:${RING}px`, 'border-radius:50%',
    `background:${team.color}`,
    'display:flex', 'align-items:center', 'justify-content:center',
    'box-shadow:0 4px 18px rgba(0,0,0,0.45)',
    'overflow:hidden', 'flex-shrink:0',
  ].join(';')

  if (team.photoDataUrl) {
    const img = document.createElement('img')
    img.src = team.photoDataUrl
    img.style.cssText = `width:${RING - 6}px;height:${RING - 6}px;border-radius:50%;object-fit:cover;display:block;flex-shrink:0;`
    img.draggable = false
    ring.appendChild(img)
  } else {
    const ini = document.createElement('div')
    ini.textContent = initials(team.name)
    ini.style.cssText = [
      'color:white', 'font-weight:900', 'font-size:18px',
      "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      'line-height:1', 'letter-spacing:0.5px', 'user-select:none',
    ].join(';')
    ring.appendChild(ini)
  }

  // Spike
  const spike = document.createElement('div')
  spike.style.cssText = [
    `background:${team.color}`,
    'width:20px', 'height:16px',
    'clip-path:polygon(50% 100%,0% 0%,100% 0%)',
    'margin-top:-2px', 'flex-shrink:0',
  ].join(';')

  pin.appendChild(ring)
  pin.appendChild(spike)
  el.appendChild(pin)

  // Label — to the right of the ring, vertically centered on it
  const label = document.createElement('div')
  label.textContent = team.name
  label.style.cssText = [
    'position:absolute',
    `top:${-PIN_H + 10}px`,          // align with top of ring + small padding
    `left:${RING / 2 + 6}px`,        // right of ring center
    `background:${team.color}`,
    'color:white', 'font-weight:900', 'font-size:11px',
    'letter-spacing:1px', 'text-transform:uppercase',
    'padding:4px 10px', 'border-radius:4px',
    'white-space:nowrap',
    'box-shadow:0 2px 8px rgba(0,0,0,0.35)',
    'pointer-events:none',
    "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
  ].join(';')

  el.appendChild(label)
  return el
}

export function updateTeamMarkerEl(el, team) {
  const fresh = createTeamMarkerEl(team)
  while (el.firstChild) el.removeChild(el.firstChild)
  while (fresh.firstChild) el.appendChild(fresh.firstChild)
  // Do NOT touch el.style — MapLibre's positioning transform lives there.
  // The base styles (position, width, height, overflow) never change between teams.
}

export function updateWaypointMarkerEl(el, waypoint) {
  const fresh = createWaypointMarkerEl(waypoint)
  while (el.firstChild) el.removeChild(el.firstChild)
  while (fresh.firstChild) el.appendChild(fresh.firstChild)
  // Same: don't overwrite el.style.cssText or MapLibre's transform is lost.
}

// Waypoints use the original working implementation unchanged.
export function createWaypointMarkerEl(waypoint) {
  const el = document.createElement('div')
  el.style.cssText = 'position:relative;display:inline-flex;flex-direction:column;align-items:center;cursor:pointer;'

  const head = document.createElement('div')
  head.style.cssText = [
    'width:22px', 'height:22px', 'border-radius:50%',
    'background:#2563eb', 'border:3px solid white',
    'box-shadow:0 0 0 1.5px #2563eb', 'position:relative', 'flex-shrink:0',
  ].join(';')

  const dot = document.createElement('div')
  dot.style.cssText = 'position:absolute;inset:3px;border-radius:50%;background:white;'
  head.appendChild(dot)

  const stem = document.createElement('div')
  stem.style.cssText = [
    'background:#2563eb',
    'width:10px', 'height:10px',
    'clip-path:polygon(50% 100%,0% 0%,100% 0%)',
    'margin-top:-1px', 'flex-shrink:0',
  ].join(';')

  const label = document.createElement('div')
  label.textContent = waypoint.name
  label.style.cssText = [
    'position:absolute',
    'top:1px', 'left:calc(100% + 6px)',
    'background:#2563eb', 'color:white',
    'font-weight:700', 'font-size:12px', 'letter-spacing:0.3px',
    'padding:3px 9px', 'border-radius:4px',
    'white-space:nowrap',
    'box-shadow:0 2px 6px rgba(0,0,0,0.3)',
    'pointer-events:none',
    "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
  ].join(';')

  el.appendChild(head)
  el.appendChild(stem)
  el.appendChild(label)
  return el
}

