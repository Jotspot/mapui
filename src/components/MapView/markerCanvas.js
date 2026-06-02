// Canvas equivalents of the DOM markers in markerUtils.js.
//
// During video recording we composite the WebGL map canvas with a 2D canvas so
// the team/waypoint pins (which are HTML overlays, invisible to captureStream)
// appear in the exported video. These functions redraw the exact same pin
// geometry — same dimensions, same colors — using the Canvas 2D API.
//
// All dimensions below match markerUtils.js. `(px, py)` is the spike tip in
// device pixels (the map coordinate). `s` is the device-pixel scale (dpr) so
// the pins render at the same on-screen size as their DOM counterparts.

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"

// ---- Team marker (must match markerUtils.js constants) --------------------
const RING = 56
const SPIKE_W = 20
const SPIKE_H = 16
const PIN_H = 70 // RING + SPIKE_H - SPIKE_OVERLAP(2)

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function initials(name) {
  return name.split(/[\s/]+/).map((w) => w[0] || '').join('').slice(0, 2).toUpperCase()
}

export function drawTeamMarker(ctx, px, py, team, img, s = 1) {
  const ringR = (RING / 2) * s
  const ringCx = px
  const ringCy = py - (PIN_H - RING / 2) * s // = py - 42*s

  // Spike (drawn first so the ring overlaps it cleanly). Tip sits at (px, py);
  // its top edge is SPIKE_H above the tip.
  const spikeTopY = py - SPIKE_H * s
  ctx.save()
  ctx.fillStyle = team.color
  ctx.beginPath()
  ctx.moveTo(px - (SPIKE_W / 2) * s, spikeTopY)
  ctx.lineTo(px + (SPIKE_W / 2) * s, spikeTopY)
  ctx.lineTo(px, py)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  // Ring (circle) with drop shadow
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.45)'
  ctx.shadowBlur = 18 * s
  ctx.shadowOffsetY = 4 * s
  ctx.fillStyle = team.color
  ctx.beginPath()
  ctx.arc(ringCx, ringCy, ringR, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Photo (clipped to inner circle) or initials
  if (img && img.complete && img.naturalWidth) {
    const innerR = ((RING - 6) / 2) * s
    ctx.save()
    ctx.beginPath()
    ctx.arc(ringCx, ringCy, innerR, 0, Math.PI * 2)
    ctx.clip()
    // cover-fit the source image into the circle's bounding box
    const d = innerR * 2
    const iw = img.naturalWidth
    const ih = img.naturalHeight
    const ratio = Math.max(d / iw, d / ih)
    const dw = iw * ratio
    const dh = ih * ratio
    ctx.drawImage(img, ringCx - dw / 2, ringCy - dh / 2, dw, dh)
    ctx.restore()
  } else {
    ctx.save()
    ctx.fillStyle = 'white'
    ctx.font = `900 ${18 * s}px ${FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(initials(team.name), ringCx, ringCy + 1 * s)
    ctx.restore()
  }

  // Label to the right of the ring, vertically centered on it
  drawLabel(ctx, {
    text: (team.name || '').toUpperCase(),
    left: px + (RING / 2 + 6) * s,
    centerY: ringCy,
    bg: team.color,
    fontPx: 11 * s,
    padV: 4 * s,
    padH: 10 * s,
    radius: 4 * s,
    letterSpacing: 1 * s,
  })
}

// ---- Waypoint marker (must match markerUtils.js constants) ----------------
const HEAD = 28
const WP_STEM_W = 10
const WP_STEM_H = 10
const WP_H = 37 // HEAD + WP_STEM_H - WP_STEM_OVERLAP(1)

const WP_BLUE = '#2563eb'

export function drawWaypointMarker(ctx, px, py, waypoint, s = 1) {
  const headCx = px
  const headCy = py - (WP_H - HEAD / 2) * s // py - 23*s

  // Stem triangle. Tip at (px, py); top edge WP_STEM_H above the tip.
  const stemTopY = py - WP_STEM_H * s
  ctx.save()
  ctx.fillStyle = WP_BLUE
  ctx.beginPath()
  ctx.moveTo(px - (WP_STEM_W / 2) * s, stemTopY)
  ctx.lineTo(px + (WP_STEM_W / 2) * s, stemTopY)
  ctx.lineTo(px, py)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  // Concentric head: blue outer ring, white border, blue, white center
  const circle = (r, color) => {
    ctx.beginPath()
    ctx.arc(headCx, headCy, r * s, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
  }
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.3)'
  ctx.shadowBlur = 6 * s
  ctx.shadowOffsetY = 2 * s
  circle(15.5, WP_BLUE)
  ctx.restore()
  circle(14, 'white')
  circle(11, WP_BLUE)
  circle(8, 'white')

  // Label to the right
  drawLabel(ctx, {
    text: waypoint.name || '',
    left: px + (HEAD / 2 + 6) * s,
    centerY: headCy,
    bg: WP_BLUE,
    fontPx: 12 * s,
    padV: 3 * s,
    padH: 9 * s,
    radius: 4 * s,
    letterSpacing: 0.3 * s,
  })
}

// Shared rounded-rect text label, vertically centered on `centerY`.
function drawLabel(ctx, { text, left, centerY, bg, fontPx, padV, padH, radius, letterSpacing }) {
  ctx.save()
  ctx.font = `700 ${fontPx}px ${FONT}`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'

  // measure (approximate letter-spacing by adding per-gap spacing)
  const gaps = Math.max(text.length - 1, 0)
  const textW = ctx.measureText(text).width + gaps * (letterSpacing || 0)
  const boxW = textW + 2 * padH
  const boxH = fontPx + 2 * padV
  const top = centerY - boxH / 2

  ctx.shadowColor = 'rgba(0,0,0,0.3)'
  ctx.shadowBlur = 6
  ctx.shadowOffsetY = 1
  ctx.fillStyle = bg
  roundRect(ctx, left, top, boxW, boxH, radius)
  ctx.fill()
  ctx.shadowColor = 'transparent'

  ctx.fillStyle = 'white'
  if (letterSpacing) {
    // manual letter-spacing: draw glyph by glyph
    let x = left + padH
    for (const ch of text) {
      ctx.fillText(ch, x, centerY)
      x += ctx.measureText(ch).width + letterSpacing
    }
  } else {
    ctx.fillText(text, left + padH, centerY)
  }
  ctx.restore()
}
