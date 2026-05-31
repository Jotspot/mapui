import { useEffect, useRef, useCallback } from 'react'
import { createTeamMarkerEl, updateTeamMarkerEl, createWaypointMarkerEl } from './markerUtils.js'
import { sliceCoords, easeInOut } from '../../utils/geo.js'
import useAppStore from '../../store/useAppStore.js'

// Load MapKit JS once
let mkReady = false
let mkPromise = null
function loadMapKit() {
  if (mkReady) return Promise.resolve()
  if (mkPromise) return mkPromise
  mkPromise = new Promise((res) => {
    const s = document.createElement('script')
    s.src = 'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.core.js'
    s.crossOrigin = 'anonymous'
    s.addEventListener('load', res)
    document.head.appendChild(s)
  }).then(() => { mkReady = true })
  return mkPromise
}

export default function AppleMapView({
  token, teams, waypoints, routes,
  placingWaypoint, onMapClick,
  animatingIds, onAnimateComplete, speeds,
}) {
  const updateRoute = useAppStore((s) => s.updateRoute)
  const containerRef = useRef()
  const canvasRef = useRef()
  const mapRef = useRef()
  const mapReadyRef = useRef(false)
  const teamAnnsRef = useRef({})      // teamId → mapkit.Annotation
  const wpAnnsRef = useRef({})        // waypointId → mapkit.Annotation
  const animatorsRef = useRef({})     // routeId → raf id
  const routeProgressRef = useRef({}) // routeId → current t (0-1)

  // Init MapKit JS
  useEffect(() => {
    let dead = false
    loadMapKit().then(() => {
      if (dead) return
      const mk = window.mapkit
      mk.init({ authorizationCallback: (done) => done(token) })

      const map = new mk.Map(containerRef.current, {
        showsCompass: mk.FeatureVisibility.Hidden,
        showsZoomControl: false,
        showsScale: mk.FeatureVisibility.Hidden,
        mapType: mk.Map.MapTypes.Standard,
      })
      mapRef.current = map
      mapReadyRef.current = true

      const redraw = () => drawCanvas()
      map.addEventListener('regionwillchange', redraw)
      map.addEventListener('regiondidchange', redraw)
    })
    return () => { dead = true }
  }, [token])

  // Project lng/lat → canvas pixel
  const project = useCallback(([lng, lat]) => {
    const map = mapRef.current
    if (!map || !window.mapkit) return null
    try {
      const pt = map.convertCoordinateToPointOnPage(
        new window.mapkit.Coordinate(lat, lng)
      )
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return null
      return [pt.x - rect.left, pt.y - rect.top]
    } catch { return null }
  }, [])

  // Draw all routes onto canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    routes.forEach((route) => {
      const coords = route.geometry
      if (!coords || coords.length < 2) return
      const t = routeProgressRef.current[route.id] ?? (route.progress ?? 1)
      const traveled = sliceCoords(coords, t)
      const tipIdx = Math.floor(t * (coords.length - 1))
      const remaining = t >= 1 ? [] : [traveled[traveled.length - 1], ...coords.slice(tipIdx + 1)]

      const drawLine = (pts, dashed, alpha) => {
        if (pts.length < 2) return
        const screen = pts.map(project).filter(Boolean)
        if (screen.length < 2) return
        ctx.save()
        ctx.beginPath()
        ctx.strokeStyle = route.color
        ctx.lineWidth = 4
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.globalAlpha = alpha
        if (dashed) ctx.setLineDash([6, 8])
        ctx.moveTo(...screen[0])
        screen.slice(1).forEach((p) => ctx.lineTo(...p))
        ctx.stroke()
        ctx.restore()
      }

      drawLine(remaining, true, 0.4)
      drawLine(traveled, false, 1.0)

      // Moving dot
      if (t > 0 && t < 1 && traveled.length) {
        const tip = project(traveled[traveled.length - 1])
        if (tip) {
          ctx.save()
          ctx.beginPath()
          ctx.arc(tip[0], tip[1], 7, 0, Math.PI * 2)
          ctx.fillStyle = route.color
          ctx.fill()
          ctx.strokeStyle = 'white'
          ctx.lineWidth = 2.5
          ctx.stroke()
          ctx.restore()
        }
      }
    })
  }, [routes, project])

  // Keep canvas synced on resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ro = new ResizeObserver(() => drawCanvas())
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [drawCanvas])

  // Redraw when routes change (slider, etc.)
  useEffect(() => { drawCanvas() }, [routes, drawCanvas])

  // Sync team annotations
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReadyRef.current || !window.mapkit) return
    const mk = window.mapkit
    const wpMap = Object.fromEntries(waypoints.map((w) => [w.id, w]))

    Object.keys(teamAnnsRef.current).forEach((id) => {
      if (!teams.find((t) => t.id === id)) {
        try { map.removeAnnotation(teamAnnsRef.current[id]) } catch {}
        delete teamAnnsRef.current[id]
      }
    })

    teams.forEach((team) => {
      const wp = wpMap[team.waypointId]
      if (!wp) return
      const coord = new mk.Coordinate(wp.lat, wp.lng)
      if (teamAnnsRef.current[team.id]) {
        teamAnnsRef.current[team.id].coordinate = coord
        updateTeamMarkerEl(teamAnnsRef.current[team.id]._element, team)
      } else {
        const teamEl = createTeamMarkerEl(team)
        // Store reference to element for future updates
        const ann = new mk.Annotation(coord, () => {
          ann._element = teamEl
          return teamEl
        }, { anchorOffset: new DOMPoint(0, -teamEl.offsetHeight / 2) })
        map.addAnnotation(ann)
        teamAnnsRef.current[team.id] = ann
      }
    })
  }, [teams, waypoints])

  // Sync waypoint annotations
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReadyRef.current || !window.mapkit) return
    const mk = window.mapkit

    Object.keys(wpAnnsRef.current).forEach((id) => {
      if (!waypoints.find((w) => w.id === id)) {
        try { map.removeAnnotation(wpAnnsRef.current[id]) } catch {}
        delete wpAnnsRef.current[id]
      }
    })

    waypoints.forEach((wp) => {
      const coord = new mk.Coordinate(wp.lat, wp.lng)
      if (wpAnnsRef.current[wp.id]) {
        wpAnnsRef.current[wp.id].coordinate = coord
      } else {
        const wpEl = createWaypointMarkerEl(wp)
        const ann = new mk.Annotation(coord, () => wpEl,
          { anchorOffset: new DOMPoint(0, -wpEl.offsetHeight / 2) })
        map.addAnnotation(ann)
        wpAnnsRef.current[wp.id] = ann
      }
    })
  }, [waypoints])

  // Handle animations
  useEffect(() => {
    if (!animatingIds?.length) return

    animatingIds.forEach((id) => {
      if (animatorsRef.current[id]) return // already running
      const route = routes.find((r) => r.id === id)
      if (!route?.geometry) return

      const startProgress = route.progress ?? 0
      const totalDuration = (speeds?.[route.mode] ?? 4) * 1000
      const duration = totalDuration * (1 - startProgress)
      const startTime = performance.now()

      const tick = (now) => {
        const raw = Math.min((now - startTime) / Math.max(duration, 1), 1)
        const t = startProgress + easeInOut(raw) * (1 - startProgress)
        routeProgressRef.current[id] = t
        updateRoute(id, { progress: t })
        drawCanvas()

        if (raw < 1) {
          animatorsRef.current[id] = requestAnimationFrame(tick)
        } else {
          routeProgressRef.current[id] = 1
          updateRoute(id, { progress: 1 })
          delete animatorsRef.current[id]
          onAnimateComplete?.(id)
          drawCanvas()
        }
      }
      animatorsRef.current[id] = requestAnimationFrame(tick)
    })

    // Stop animators no longer in animatingIds
    Object.keys(animatorsRef.current).forEach((id) => {
      if (!animatingIds.includes(id)) {
        cancelAnimationFrame(animatorsRef.current[id])
        delete animatorsRef.current[id]
      }
    })
  }, [animatingIds, routes, speeds, drawCanvas, updateRoute, onAnimateComplete])

  // Map click for waypoint placement
  const handleClick = useCallback((e) => {
    if (!placingWaypoint || !mapRef.current || !window.mapkit) return
    const coord = mapRef.current.convertPointOnPageToCoordinate(
      new DOMPoint(e.clientX, e.clientY)
    )
    if (coord) onMapClick?.({ lng: coord.longitude, lat: coord.latitude })
  }, [placingWaypoint, onMapClick])

  return (
    <div style={{ flex: 1, height: '100vh', position: 'relative' }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', cursor: placingWaypoint ? 'crosshair' : 'default' }}
        onClick={handleClick}
      />
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', width: '100%', height: '100%' }}
      />
    </div>
  )
}
