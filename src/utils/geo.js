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

// Resample `coords` to `numPoints` evenly-spaced points by arc length.
// OSRM road geometry clusters points densely at turns and sparsely on
// straights; index-based animation therefore slows at bends and speeds
// on straights. Resampling by distance normalises this so t=0.5 always
// means "half the actual road distance travelled".
export function resampleByDistance(coords, numPoints = 300) {
  if (coords.length < 2) return coords
  const dists = [0]
  for (let i = 1; i < coords.length; i++) {
    const dx = coords[i][0] - coords[i - 1][0]
    const dy = coords[i][1] - coords[i - 1][1]
    dists.push(dists[i - 1] + Math.sqrt(dx * dx + dy * dy))
  }
  const total = dists[dists.length - 1]
  if (total === 0) return coords
  const result = [coords[0]]
  let j = 0
  for (let i = 1; i < numPoints - 1; i++) {
    const target = (i / (numPoints - 1)) * total
    while (j < dists.length - 2 && dists[j + 1] < target) j++
    const frac = (target - dists[j]) / (dists[j + 1] - dists[j])
    result.push(interpolateCoord(coords[j], coords[j + 1], frac))
  }
  result.push(coords[coords.length - 1])
  return result
}

// FOSSGIS hosts the same per-profile OSRM instances that power
// openstreetmap.org's directions — free, no API key, CORS-enabled. Each mode
// hits a different instance so walking uses real pedestrian paths (footways,
// park trails) instead of car roads. The {profile} URL segment is always
// "driving" — OSRM ignores it; the routing comes from which instance you hit.
const OSRM_HOSTS = {
  driving: 'https://routing.openstreetmap.de/routed-car',
  walking: 'https://routing.openstreetmap.de/routed-foot',
  cycling: 'https://routing.openstreetmap.de/routed-bike',
  transit: 'https://routing.openstreetmap.de/routed-car', // road proxy (no free transit routing)
}

async function fetchOSRM(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('OSRM error')
  const data = await res.json()
  if (data.routes?.[0]) return data.routes[0].geometry.coordinates
  throw new Error('No route found')
}

export async function fetchRoadGeometry(from, to, mode) {
  const coords = `${from[0]},${from[1]};${to[0]},${to[1]}`
  const base = OSRM_HOSTS[mode] || OSRM_HOSTS.driving
  const params = 'geometries=geojson&overview=full'
  try {
    return await fetchOSRM(`${base}/route/v1/driving/${coords}?${params}`)
  } catch {
    // Fallback: public OSRM demo (driving only) so we still draw a road path
    try {
      return await fetchOSRM(`https://router.project-osrm.org/route/v1/driving/${coords}?${params}`)
    } catch {
      return null
    }
  }
}
