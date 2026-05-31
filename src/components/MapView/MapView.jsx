import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import './MapView.css'
import RouteLayer from './RouteLayer.jsx'
import AppleMapView from './AppleMapView.jsx'
import { createTeamMarkerEl, updateTeamMarkerEl, createWaypointMarkerEl, updateWaypointMarkerEl } from './markerUtils.js'
import useAppStore from '../../store/useAppStore.js'

const STYLE_URLS = {
  liberty: 'https://tiles.openfreemap.org/styles/liberty',
  bright: 'https://tiles.openfreemap.org/styles/bright',
}

export default function MapView({ placingWaypoint, onMapClick, animatingIds, onAnimateComplete, speeds }) {
  const teams = useAppStore((s) => s.teams)
  const waypoints = useAppStore((s) => s.waypoints)
  const routes = useAppStore((s) => s.routes)
  const mapStyle = useAppStore((s) => s.mapStyle)

  // --- Apple Maps path ---
  if (mapStyle?.provider === 'apple' && mapStyle?.appleToken) {
    return (
      <AppleMapView
        token={mapStyle.appleToken}
        teams={teams}
        waypoints={waypoints}
        routes={routes}
        placingWaypoint={placingWaypoint}
        onMapClick={onMapClick}
        animatingIds={animatingIds}
        onAnimateComplete={onAnimateComplete}
        speeds={speeds}
      />
    )
  }

  // --- MapLibre path ---
  return (
    <MapLibreMap
      teams={teams}
      waypoints={waypoints}
      routes={routes}
      mapStyle={mapStyle}
      placingWaypoint={placingWaypoint}
      onMapClick={onMapClick}
      animatingIds={animatingIds}
      onAnimateComplete={onAnimateComplete}
      speeds={speeds}
    />
  )
}

function MapLibreMap({ teams, waypoints, routes, mapStyle, placingWaypoint, onMapClick, animatingIds, onAnimateComplete, speeds }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)
  const teamMarkersRef = useRef({})   // id → { marker, el }
  const waypointMarkersRef = useRef({}) // id → { marker, el }

  const styleUrl = STYLE_URLS[mapStyle?.openFreeStyle] || STYLE_URLS.liberty

  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: [0, 20],
      zoom: 2,
      attributionControl: false,
    })
    map.addControl(new maplibregl.NavigationControl(), 'top-left')
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    mapRef.current = map
    map.on('load', () => setMapReady(true))

    return () => {
      Object.values(teamMarkersRef.current).forEach(({ marker }) => marker.remove())
      Object.values(waypointMarkersRef.current).forEach(({ marker }) => marker.remove())
      map.remove()
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const onClick = (e) => { if (placingWaypoint) onMapClick({ lng: e.lngLat.lng, lat: e.lngLat.lat }) }
    map.on('click', onClick)
    return () => map.off('click', onClick)
  }, [placingWaypoint, onMapClick])

  // Team markers
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    const waypointMap = Object.fromEntries(waypoints.map((w) => [w.id, w]))

    // Remove deleted
    Object.keys(teamMarkersRef.current).forEach((id) => {
      if (!teams.find((t) => t.id === id)) {
        teamMarkersRef.current[id].marker.remove()
        delete teamMarkersRef.current[id]
      }
    })

    teams.forEach((team) => {
      const wp = waypointMap[team.waypointId]
      if (teamMarkersRef.current[team.id]) {
        const { marker, el } = teamMarkersRef.current[team.id]
        updateTeamMarkerEl(el, team)
        if (wp) {
          marker.setLngLat([wp.lng, wp.lat])
          marker.getElement().style.display = ''
        } else {
          marker.getElement().style.display = 'none'
        }
      } else {
        const el = createTeamMarkerEl(team)
        const lnglat = wp ? [wp.lng, wp.lat] : [0, 0]
        // anchor:'top-left' + zero-size el means spike tip = coordinate exactly
        const marker = new maplibregl.Marker({ element: el, anchor: 'top-left' })
          .setLngLat(lnglat)
          .addTo(map)
        if (!wp) marker.getElement().style.display = 'none'
        teamMarkersRef.current[team.id] = { marker, el }
      }
    })
  }, [teams, waypoints, mapReady])

  // Waypoint markers
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    Object.keys(waypointMarkersRef.current).forEach((id) => {
      if (!waypoints.find((w) => w.id === id)) {
        waypointMarkersRef.current[id].marker.remove()
        delete waypointMarkersRef.current[id]
      }
    })

    waypoints.forEach((wp) => {
      if (waypointMarkersRef.current[wp.id]) {
        const { marker, el } = waypointMarkersRef.current[wp.id]
        marker.setLngLat([wp.lng, wp.lat])
        updateWaypointMarkerEl(el, wp)
      } else {
        const el = createWaypointMarkerEl(wp)
        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([wp.lng, wp.lat])
          .addTo(map)
        waypointMarkersRef.current[wp.id] = { marker, el }
      }
    })
  }, [waypoints, mapReady])

  return (
    <div ref={containerRef} className={`map-container${placingWaypoint ? ' placing' : ''}`}>
      {mapReady && (
        <RouteLayer
          map={mapRef.current}
          routes={routes}
          waypoints={waypoints}
          teams={teams}
          teamMarkersRef={teamMarkersRef}
          animatingIds={animatingIds}
          onAnimateComplete={onAnimateComplete}
          speeds={speeds}
        />
      )}
    </div>
  )
}
