// MapLibre custom marker elements.
//
// Root cause of past positioning bugs: MapLibre positions a marker by setting
// `el.style.transform` and relies on its own CSS class `.maplibregl-marker`
// giving the element `position:absolute; top:0; left:0`. If our inline style
// sets `position:relative`, it OVERRIDES that, the element falls back into
// normal document flow, and the transform offsets it from the wrong origin
// (markers drift / stack in a line, worse when zoomed out).
//
// Fix: every marker root is a 0x0 `position:absolute` anchor point. Used with
// anchor:'top-left', MapLibre places that point exactly at the map coordinate.
// All visuals hang off it via absolutely-positioned children with fixed pixel
// offsets, so positioning never depends on measuring element size.

function initials(name) {
  return name.split(/[\s/]+/).map((w) => w[0] || '').join('').slice(0, 2).toUpperCase()
}

// ---- Team marker ----------------------------------------------------------
const RING = 56            // circle diameter (px)
const SPIKE_W = 20
const SPIKE_H = 16
const SPIKE_OVERLAP = 2    // spike overlaps ring by this much
const PIN_H = RING + SPIKE_H - SPIKE_OVERLAP // total pin height, tip at bottom

function teamRootStyle() {
  // 0x0 absolute anchor — the (0,0) corner sits on the map coordinate.
  return 'position:absolute;top:0;left:0;width:0;height:0;cursor:pointer;overflow:visible;'
}

export function createTeamMarkerEl(team) {
  const el = document.createElement('div')
  el.style.cssText = teamRootStyle()

  // Pin: ring + spike stacked. Positioned so the spike tip lands on el's origin.
  const pin = document.createElement('div')
  pin.style.cssText = [
    'position:absolute',
    `left:${-RING / 2}px`,   // center the ring horizontally on the origin
    `top:${-PIN_H}px`,       // lift the pin so the spike tip is at the origin
    `width:${RING}px`,
    'display:flex', 'flex-direction:column', 'align-items:center',
  ].join(';')

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
    img.style.cssText = `width:${RING - 6}px;height:${RING - 6}px;border-radius:50%;object-fit:cover;display:block;`
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

  const spike = document.createElement('div')
  spike.style.cssText = [
    `background:${team.color}`,
    `width:${SPIKE_W}px`, `height:${SPIKE_H}px`,
    'clip-path:polygon(50% 100%,0% 0%,100% 0%)',
    `margin-top:${-SPIKE_OVERLAP}px`, 'flex-shrink:0',
  ].join(';')

  pin.appendChild(ring)
  pin.appendChild(spike)
  el.appendChild(pin)

  // Label: to the right of the ring, vertically centered on it.
  const label = document.createElement('div')
  label.textContent = team.name
  label.style.cssText = [
    'position:absolute',
    `top:${-PIN_H + RING / 2 - 11}px`,  // center on ring (~22px tall label)
    `left:${RING / 2 + 6}px`,           // just right of the ring
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
  // NEVER touch el.style — it holds MapLibre's positioning transform.
}

// ---- Waypoint marker ------------------------------------------------------
// Head is 22px content + 3px white border each side = 28px effective diameter.
const HEAD = 28            // effective head diameter (border included)
const WP_STEM_H = 10
const WP_STEM_OVERLAP = 1
const WP_H = HEAD + WP_STEM_H - WP_STEM_OVERLAP

export function createWaypointMarkerEl(waypoint) {
  const el = document.createElement('div')
  el.style.cssText = 'position:absolute;top:0;left:0;width:0;height:0;cursor:pointer;overflow:visible;'

  const pin = document.createElement('div')
  pin.style.cssText = [
    'position:absolute',
    `left:${-HEAD / 2}px`,
    `top:${-WP_H}px`,
    `width:${HEAD}px`,
    'display:flex', 'flex-direction:column', 'align-items:center',
  ].join(';')

  // Original head visuals: 22px blue circle, 3px white border, blue outer ring.
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
    `width:${WP_STEM_H}px`, `height:${WP_STEM_H}px`,
    'clip-path:polygon(50% 100%,0% 0%,100% 0%)',
    `margin-top:${-WP_STEM_OVERLAP}px`, 'flex-shrink:0',
  ].join(';')

  pin.appendChild(head)
  pin.appendChild(stem)
  el.appendChild(pin)

  const label = document.createElement('div')
  label.textContent = waypoint.name
  label.style.cssText = [
    'position:absolute',
    `top:${-WP_H + 2}px`,
    `left:${HEAD / 2 + 6}px`,
    'background:#2563eb', 'color:white',
    'font-weight:700', 'font-size:12px', 'letter-spacing:0.3px',
    'padding:3px 9px', 'border-radius:4px',
    'white-space:nowrap',
    'box-shadow:0 2px 6px rgba(0,0,0,0.3)',
    'pointer-events:none',
    "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
  ].join(';')
  el.appendChild(label)

  return el
}

export function updateWaypointMarkerEl(el, waypoint) {
  const fresh = createWaypointMarkerEl(waypoint)
  while (el.firstChild) el.removeChild(el.firstChild)
  while (fresh.firstChild) el.appendChild(fresh.firstChild)
  // NEVER touch el.style — MapLibre's transform lives there.
}
