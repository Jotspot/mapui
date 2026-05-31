import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import maplibregl from 'maplibre-gl'
import './MapView.css'
import TeamMarker from './TeamMarker.jsx'
import WaypointMarker from './WaypointMarker.jsx'
import RouteLayer from './RouteLayer.jsx'
import useAppStore from '../../store/useAppStore.js'

export default function MapView({ placingWaypoint, onMapClick }) {
  const teams = useAppStore((s) => s.teams)
  const waypoints = useAppStore((s) => s.waypoints)
  const routes = useAppStore((s) => s.routes)

  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)
  const teamMarkersRef = useRef({})
  const waypointMarkersRef = useRef({})

  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [0, 20],
      zoom: 2,
      attributionControl: false,
    })
    map.addControl(new maplibregl.NavigationControl(), 'top-left')
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    mapRef.current = map
    map.on('load', () => setMapReady(true))

    return () => {
      Object.values(teamMarkersRef.current).forEach(({ marker, root }) => {
        root.unmount()
        marker.remove()
      })
      Object.values(waypointMarkersRef.current).forEach(({ marker, root }) => {
        root.unmount()
        marker.remove()
      })
      map.remove()
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const onClick = (e) => {
      if (placingWaypoint) {
        onMapClick({ lng: e.lngLat.lng, lat: e.lngLat.lat })
      }
    }
    map.on('click', onClick)
    return () => map.off('click', onClick)
  }, [placingWaypoint, onMapClick])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    const waypointMap = Object.fromEntries(waypoints.map((w) => [w.id, w]))

    // Sync team markers
    const currentTeamIds = new Set(teams.map((t) => t.id))
    Object.keys(teamMarkersRef.current).forEach((id) => {
      if (!currentTeamIds.has(id)) {
        const { marker, root } = teamMarkersRef.current[id]
        root.unmount()
        marker.remove()
        delete teamMarkersRef.current[id]
      }
    })

    teams.forEach((team) => {
      const wp = waypointMap[team.waypointId]
      if (!wp) return

      if (teamMarkersRef.current[team.id]) {
        const { marker, root } = teamMarkersRef.current[team.id]
        marker.setLngLat([wp.lng, wp.lat])
        root.render(<TeamMarker team={team} />)
      } else {
        const el = document.createElement('div')
        const root = createRoot(el)
        root.render(<TeamMarker team={team} />)
        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([wp.lng, wp.lat])
          .addTo(map)
        teamMarkersRef.current[team.id] = { marker, root }
      }
    })
  }, [teams, waypoints, mapReady])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    const currentWpIds = new Set(waypoints.map((w) => w.id))
    Object.keys(waypointMarkersRef.current).forEach((id) => {
      if (!currentWpIds.has(id)) {
        const { marker, root } = waypointMarkersRef.current[id]
        root.unmount()
        marker.remove()
        delete waypointMarkersRef.current[id]
      }
    })

    waypoints.forEach((wp) => {
      if (waypointMarkersRef.current[wp.id]) {
        const { marker, root } = waypointMarkersRef.current[wp.id]
        marker.setLngLat([wp.lng, wp.lat])
        root.render(<WaypointMarker waypoint={wp} />)
      } else {
        const el = document.createElement('div')
        const root = createRoot(el)
        root.render(<WaypointMarker waypoint={wp} />)
        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([wp.lng, wp.lat])
          .addTo(map)
        waypointMarkersRef.current[wp.id] = { marker, root }
      }
    })
  }, [waypoints, mapReady])

  return (
    <div ref={containerRef} className={`map-container${placingWaypoint ? ' placing' : ''}`}>
      {mapReady && (
        <RouteLayer map={mapRef.current} routes={routes} waypoints={waypoints} />
      )}
    </div>
  )
}
