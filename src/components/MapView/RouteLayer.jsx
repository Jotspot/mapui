import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { getRouteLayerSpecs } from '../../utils/routeStyles.js'
import { greatCircleArc, fetchRoadGeometry, sliceCoords } from '../../utils/geo.js'
import { RouteAnimator } from './RouteAnimator.js'
import useAppStore from '../../store/useAppStore.js'

function makeGJ(coords) {
  return { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } }
}

export default function RouteLayer({ map, routes, waypoints, animatingIds = [], onAnimateComplete, speeds }) {
  const updateRoute = useAppStore((s) => s.updateRoute)
  const initializedRoutes = useRef(new Set())
  const animators = useRef({})   // routeId → RouteAnimator
  const dotMarkers = useRef({})  // routeId → maplibregl.Marker
  const prevAnimatingIds = useRef([])

  // Initialize new routes (sources + layers)
  useEffect(() => {
    if (!map) return
    const waypointMap = Object.fromEntries(waypoints.map((w) => [w.id, w]))

    routes.forEach(async (route) => {
      const from = waypointMap[route.fromWaypointId]
      const to = waypointMap[route.toWaypointId]
      if (!from || !to) return

      let coords = route.geometry
      if (!coords) {
        if (route.mode === 'flight') {
          coords = greatCircleArc([from.lng, from.lat], [to.lng, to.lat])
        } else {
          const road = await fetchRoadGeometry([from.lng, from.lat], [to.lng, to.lat], route.mode)
          coords = road || greatCircleArc([from.lng, from.lat], [to.lng, to.lat])
        }
        updateRoute(route.id, { geometry: coords })
      }

      if (initializedRoutes.current.has(route.id)) return
      initializedRoutes.current.add(route.id)

      const t = route.progress ?? 1
      const traveled = sliceCoords(coords, t)
      const tipIdx = Math.floor(t * (coords.length - 1))
      const remaining = t >= 1 ? [] : [traveled[traveled.length - 1], ...coords.slice(tipIdx + 1)]

      const tId = `${route.id}-traveled`
      const rId = `${route.id}-remaining`
      if (!map.getSource(tId)) map.addSource(tId, { type: 'geojson', data: makeGJ(traveled) })
      if (!map.getSource(rId)) map.addSource(rId, { type: 'geojson', data: makeGJ(remaining) })

      const { traveledLayer, remainingLayer } = getRouteLayerSpecs(route.id, route.mode, route.color)
      if (!map.getLayer(remainingLayer.id)) map.addLayer(remainingLayer)
      if (!map.getLayer(traveledLayer.id)) map.addLayer(traveledLayer)

      const dotEl = document.createElement('div')
      dotEl.style.cssText = `width:14px;height:14px;border-radius:50%;background:${route.color};border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:${t >= 1 ? 'none' : 'block'}`
      const dotMarker = new maplibregl.Marker({ element: dotEl, anchor: 'center' })
        .setLngLat(traveled[traveled.length - 1] || [from.lng, from.lat])
        .addTo(map)
      dotMarkers.current[route.id] = dotMarker
    })
  }, [map, routes, waypoints])

  // Sync static progress changes (slider drags) for non-animating routes
  useEffect(() => {
    if (!map) return
    routes.forEach((route) => {
      if (animatingIds.includes(route.id)) return
      if (!initializedRoutes.current.has(route.id)) return
      const coords = route.geometry
      if (!coords) return

      const t = route.progress ?? 1
      const traveled = sliceCoords(coords, t)
      const tipIdx = Math.floor(t * (coords.length - 1))
      const remaining = t >= 1 ? [] : [traveled[traveled.length - 1], ...coords.slice(tipIdx + 1)]

      map.getSource(`${route.id}-traveled`)?.setData(makeGJ(traveled))
      map.getSource(`${route.id}-remaining`)?.setData(makeGJ(remaining.length > 1 ? remaining : []))

      const dot = dotMarkers.current[route.id]
      if (dot) {
        dot.getElement().style.display = t >= 1 ? 'none' : 'block'
        if (traveled.length) dot.setLngLat(traveled[traveled.length - 1])
      }
    })
  }, [map, routes, animatingIds])

  // Start/stop animators as animatingIds changes
  useEffect(() => {
    if (!map) return
    const prev = prevAnimatingIds.current
    const curr = animatingIds

    // Start newly added IDs
    curr.forEach((id) => {
      if (prev.includes(id)) return // already running
      if (animators.current[id]) animators.current[id].stop()

      const route = routes.find((r) => r.id === id)
      if (!route?.geometry) return
      if (!initializedRoutes.current.has(id)) return

      const dot = dotMarkers.current[id]
      if (dot) dot.getElement().style.display = 'block'

      const durationMs = (speeds?.[route.mode] ?? 4) * 1000
      const animator = new RouteAnimator({
        map,
        routeId: id,
        coords: route.geometry,
        durationMs,
        startProgress: route.progress ?? 0,
        dotMarker: dot,
        onProgress: (t) => updateRoute(id, { progress: t }),
        onComplete: () => {
          updateRoute(id, { progress: 1 })
          onAnimateComplete?.(id)
        },
      })
      animators.current[id] = animator
      animator.start()
    })

    // Stop removed IDs
    prev.forEach((id) => {
      if (!curr.includes(id) && animators.current[id]) {
        animators.current[id].stop()
        delete animators.current[id]
      }
    })

    prevAnimatingIds.current = curr
  }, [map, animatingIds, routes, speeds])

  // Cleanup removed routes
  useEffect(() => {
    if (!map) return
    const routeIds = new Set(routes.map((r) => r.id))
    initializedRoutes.current.forEach((id) => {
      if (!routeIds.has(id)) {
        animators.current[id]?.stop()
        dotMarkers.current[id]?.remove()
        if (map.getLayer(`${id}-traveled`)) map.removeLayer(`${id}-traveled`)
        if (map.getLayer(`${id}-remaining`)) map.removeLayer(`${id}-remaining`)
        if (map.getSource(`${id}-traveled`)) map.removeSource(`${id}-traveled`)
        if (map.getSource(`${id}-remaining`)) map.removeSource(`${id}-remaining`)
        delete animators.current[id]
        delete dotMarkers.current[id]
        initializedRoutes.current.delete(id)
      }
    })
  }, [map, routes])

  useEffect(() => () => {
    Object.values(animators.current).forEach((a) => a.stop())
    Object.values(dotMarkers.current).forEach((m) => m.remove())
  }, [])

  return null
}
