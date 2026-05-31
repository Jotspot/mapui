// Pure DOM marker creation — no React roots, guaranteed to render before MapLibre measures the element

export function createTeamMarkerEl(team) {
  const el = document.createElement('div')
  el.style.cssText = 'display:inline-block;cursor:pointer;'

  const initials = team.name
    .split(/[\s/]+/)
    .map((w) => w[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // Unique clipPath ID per team (safe for multiple markers on same page)
  const clipId = `tm-${team.id}`

  const photo = team.photoDataUrl
    ? `<image href="${team.photoDataUrl}" x="8" y="4" width="56" height="56"
         clip-path="url(#${clipId})" preserveAspectRatio="xMidYMid slice"/>`
    : `<text x="36" y="33" text-anchor="middle" dominant-baseline="central"
         fill="white" font-weight="900" font-size="19"
         font-family="-apple-system,BlinkMacSystemFont,sans-serif">${initials}</text>`

  // SVG teardrop: circle top + pointed bottom, seamlessly connected
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;position:relative;filter:drop-shadow(0 6px 18px rgba(0,0,0,0.52))">
      <svg width="72" height="88" viewBox="0 0 72 88" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="${clipId}">
            <circle cx="36" cy="32" r="26"/>
          </clipPath>
        </defs>
        <path d="M36,3 C18,3 3,18 3,36 C3,54 18,70 36,85 C54,70 69,54 69,36 C69,18 54,3 36,3 Z"
              fill="${team.color}"/>
        ${photo}
      </svg>
      <div style="
        position:absolute;
        top:calc(100% + 4px);
        left:50%;
        transform:translateX(-50%);
        background:${team.color};
        color:white;
        font-weight:900;
        font-size:11px;
        letter-spacing:1px;
        text-transform:uppercase;
        padding:4px 11px;
        border-radius:4px;
        white-space:nowrap;
        box-shadow:0 2px 8px rgba(0,0,0,0.38);
        pointer-events:none;
      ">${team.name}</div>
    </div>`

  return el
}

export function updateTeamMarkerEl(el, team) {
  const newEl = createTeamMarkerEl(team)
  el.innerHTML = newEl.innerHTML
}

export function createWaypointMarkerEl(waypoint) {
  const el = document.createElement('div')
  el.style.cssText = 'display:inline-block;cursor:pointer;'

  el.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;position:relative;filter:drop-shadow(0 4px 10px rgba(0,0,0,0.4))">
      <div style="width:22px;height:22px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 0 0 1.5px #2563eb;position:relative;flex-shrink:0">
        <div style="position:absolute;inset:3px;border-radius:50%;background:white"></div>
      </div>
      <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:10px solid #2563eb;margin-top:-1px"></div>
      <div style="
        position:absolute;
        top:1px;
        left:calc(100% + 6px);
        background:#2563eb;
        color:white;
        font-weight:700;
        font-size:12px;
        letter-spacing:0.3px;
        padding:3px 9px;
        border-radius:4px;
        white-space:nowrap;
        box-shadow:0 2px 6px rgba(0,0,0,0.3);
        pointer-events:none;
      ">${waypoint.name}</div>
    </div>`

  return el
}

export function updateWaypointMarkerEl(el, waypoint) {
  const newEl = createWaypointMarkerEl(waypoint)
  el.innerHTML = newEl.innerHTML
}
