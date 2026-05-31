// Pure DOM marker creation — no innerHTML, no SVG, no CSS filter.
// Guarantees content exists before MapLibre measures the element.

function initials(name) {
  return name.split(/[\s/]+/).map((w) => w[0] || '').join('').slice(0, 2).toUpperCase()
}

export function createTeamMarkerEl(team) {
  // el height = ring + spike only (label is absolute, doesn't affect height)
  // With anchor:'bottom' the spike tip sits exactly on the coordinate
  const el = document.createElement('div')
  el.style.cssText = 'position:relative;display:inline-flex;flex-direction:column;align-items:center;cursor:pointer;'

  // Coloured ring
  const ring = document.createElement('div')
  ring.style.cssText = [
    'width:68px', 'height:68px', 'border-radius:50%',
    `background:${team.color}`,
    'display:flex', 'align-items:center', 'justify-content:center',
    'box-shadow:0 4px 18px rgba(0,0,0,0.45)', 'flex-shrink:0',
    'overflow:hidden',
  ].join(';')

  if (team.photoDataUrl) {
    const img = document.createElement('img')
    img.src = team.photoDataUrl
    img.style.cssText = 'width:60px;height:60px;border-radius:50%;object-fit:cover;display:block;flex-shrink:0;'
    img.draggable = false
    ring.appendChild(img)
  } else {
    const ini = document.createElement('div')
    ini.textContent = initials(team.name)
    ini.style.cssText = [
      'color:white', 'font-weight:900', 'font-size:20px',
      "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      'line-height:1', 'letter-spacing:0.5px', 'user-select:none',
    ].join(';')
    ring.appendChild(ini)
  }

  // Downward triangle spike — clip-path avoids the border-trick gap
  const spike = document.createElement('div')
  spike.style.cssText = [
    `background:${team.color}`,
    'width:24px', 'height:20px',
    'clip-path:polygon(50% 100%,0% 0%,100% 0%)',
    'margin-top:-3px', 'flex-shrink:0',
  ].join(';')

  // Label — position:absolute keeps it out of element flow
  const label = document.createElement('div')
  label.textContent = team.name
  label.style.cssText = [
    'position:absolute',
    'top:calc(100% + 5px)',
    'left:50%', 'transform:translateX(-50%)',
    `background:${team.color}`,
    'color:white', 'font-weight:900', 'font-size:11px',
    'letter-spacing:1px', 'text-transform:uppercase',
    'padding:4px 11px', 'border-radius:4px',
    'white-space:nowrap',
    'box-shadow:0 2px 8px rgba(0,0,0,0.35)',
    'pointer-events:none',
    "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
  ].join(';')

  el.appendChild(ring)
  el.appendChild(spike)
  el.appendChild(label)
  return el
}

export function updateTeamMarkerEl(el, team) {
  const fresh = createTeamMarkerEl(team)
  // Move children from fresh into el (avoids cloning + keeps same node reference)
  while (el.firstChild) el.removeChild(el.firstChild)
  while (fresh.firstChild) el.appendChild(fresh.firstChild)
  el.style.cssText = fresh.style.cssText
}

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

export function updateWaypointMarkerEl(el, waypoint) {
  const fresh = createWaypointMarkerEl(waypoint)
  while (el.firstChild) el.removeChild(el.firstChild)
  while (fresh.firstChild) el.appendChild(fresh.firstChild)
  el.style.cssText = fresh.style.cssText
}
