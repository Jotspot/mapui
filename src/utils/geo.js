const toRad = (d) => (d * Math.PI) / 180
const toDeg = (r) => (r * 180) / Math.PI

// Correct spherical linear interpolation (SLERP) great-circle arc
export function greatCircleArc(from, to, numPoints = 100) {
  const [lng1, lat1] = from
  const [lng2, lat2] = to
  const φ1 = toRad(lat1), λ1 = toRad(lng1)
  const φ2 = toRad(lat2), λ2 = toRad(lng2)

  // Angular distance between the two points
  const cosD = Math.sin(φ1) * Math.sin(φ2) + Math.cos(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1)
  const d = Math.acos(Math.max(-1, Math.min(1, cosD)))

  // If points are the same (or very close), just return a straight line
  if (d < 1e-10) {
    return [[lng1, lat1], [lng2, lat2]]
  }

  const coords = []
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints
    const A = Math.sin((1 - t) * d) / Math.sin(d)
    const B = Math.sin(t * d) / Math.sin(d)

    const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2)
    const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2)
    const z = A * Math.sin(φ1) + B * Math.sin(φ2)

    const φ = Math.atan2(z, Math.sqrt(x * x + y * y))
    const λ = Math.atan2(y, x)
    coords.push([toDeg(λ), toDeg(φ)])
  }
  return coords
}

export function interpolateCoord(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
}

export function sliceCoords(coords, t) {
  if (t <= 0) return [coords[0]]
  if (t >= 1) return coords

  const targetIdx = t * (coords.length - 1)
  const floor = Math.floor(targetIdx)
  const frac = targetIdx - floor

  const sliced = coords.slice(0, floor + 1)
  if (frac > 0 && floor + 1 < coords.length) {
    sliced.push(interpolateCoord(coords[floor], coords[floor + 1], frac))
  }
  return sliced
}

export function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

export async function fetchRoadGeometry(from, to, mode) {
  const profile = mode === 'walking' ? 'foot' : 'driving'
  const url = `https://router.project-osrm.org/route/v1/${profile}/${from[0]},${from[1]};${to[0]},${to[1]}?geometries=geojson&overview=full`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('OSRM error')
    const data = await res.json()
    if (data.routes?.[0]) return data.routes[0].geometry.coordinates
    throw new Error('No route found')
  } catch {
    return null
  }
}
