import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { getRouteLayerSpecs } from '../../utils/routeStyles.js'
import { greatCircleArc, fetchRoadGeometry, sliceCoords } from '../../utils/geo.js'
import { RouteAnimator } from './RouteAnimator.js'
import useAppStore from '../../store/useAppStore.js'

export default function RouteLayer({ map, routes, waypoints }) {
  const updateRoute = useAppStore((s) => s.updateRoute)
  const addedSources = useRef(new Set())
  const animators = useRef({})
  const dotMarkers = useRef({})

  useEffect(() => {
    if (!map) return

    const waypointMap = Object.fromEntries(waypoints.map((w) => [w.id, w]))

    routes.forEach(async (route) => {
      const from = waypointMap[route.fromWaypointId]
      const to = waypointMap[route.toWaypointId]
      if (!from || !to) return

      const traveledId = `${route.id}-traveled`
      const remainingId = `${route.id}-remaining`

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

      if (!addedSources.current.has(route.id)) {
        addedSources.current.add(route.id)

        const t = route.animationProgress ?? 1
        const traveled = sliceCoords(coords, t)
        const remaining = t >= 1 ? [] : coords.slice(Math.max(0, traveled.length - 1))

        const makeGJ = (c) => ({ type: 'Feature', geometry: { type: 'LineString', coordinates: c } })

        if (!map.getSource(traveledId)) {
          map.addSource(traveledId, { type: 'geojson', data: makeGJ(traveled) })
        }
        if (!map.getSource(remainingId)) {
          map.addSource(remainingId, { type: 'geojson', data: makeGJ(remaining) })
        }

        const { traveledLayer, remainingLayer } = getRouteLayerSpecs(route.id, route.mode, route.color)

        if (!map.getLayer(remainingLayer.id)) map.addLayer(remainingLayer)
        if (!map.getLayer(traveledLayer.id)) map.addLayer(traveledLayer)

        const dotEl = document.createElement('div')
        dotEl.style.cssText = `width:14px;height:14px;border-radius:50%;background:${route.color};border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:${t >= 1 ? 'none' : 'block'}`
        const dotMarker = new maplibregl.Marker({ element: dotEl, anchor: 'center' })
          .setLngLat(traveled[traveled.length - 1] || [from.lng, from.lat])
          .addTo(map)
        dotMarkers.current[route.id] = dotMarker
      }

      if (route.animationProgress === 0 && coords) {
        if (animators.current[route.id]) {
          animators.current[route.id].stop()
        }
        const dotMarker = dotMarkers.current[route.id]
        if (dotMarker) dotMarker.getElement().style.display = 'block'

        const animator = new RouteAnimator({
          map,
          routeId: route.id,
          coords,
          durationMs: 4000,
          dotMarker,
          onComplete: () => {
            updateRoute(route.id, { animationProgress: 1 })
          },
        })
        animators.current[route.id] = animator
        animator.start()
      }
    })

    return () => {
      // animators cleaned up on unmount
    }
  }, [map, routes, waypoints])

  useEffect(() => {
    return () => {
      Object.values(animators.current).forEach((a) => a.stop())
      Object.values(dotMarkers.current).forEach((m) => m.remove())
    }
  }, [])

  return null
}
