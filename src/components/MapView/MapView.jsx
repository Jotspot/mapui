import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import './MapView.css'
import RouteLayer from './RouteLayer.jsx'
import AppleMapView from './AppleMapView.jsx'
import { createTeamMarkerEl, updateTeamMarkerEl, createWaypointMarkerEl, updateWaypointMarkerEl } from './markerUtils.js'
import { drawTeamMarker, drawWaypointMarker } from './markerCanvas.js'
import useAppStore from '../../store/useAppStore.js'

const STYLE_URLS = {
  liberty: 'https://tiles.openfreemap.org/styles/liberty',
  bright: 'https://tiles.openfreemap.org/styles/bright',
}

const OUTPUT_AR = { '16:9': [16,9], '4:3': [4,3], '1:1': [1,1], '9:16': [9,16] }
const OUTPUT_RES_H = { '720p': 720, '1080p': 1080, '1440p': 1440 }
function outputDims(aspect, res) {
  const [aw, ah] = OUTPUT_AR[aspect] || OUTPUT_AR['16:9']
  const h = OUTPUT_RES_H[res] || 1080
  return { w: Math.round(h * aw / ah), h }
}

export default function MapView({ placingWaypoint, onMapClick, animatingIds, onAnimateComplete, speeds, onMapReady }) {
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
      onMapReady={onMapReady}
    />
  )
}

function MapLibreMap({ teams, waypoints, routes, mapStyle, placingWaypoint, onMapClick, animatingIds, onAnimateComplete, speeds, onMapReady }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)
  const teamMarkersRef = useRef({})   // id → { marker, el }
  const waypointMarkersRef = useRef({}) // id → { marker, el }

  // Live data refs so the recorder can read current values without
  // re-creating its callbacks each render.
  const teamsRef = useRef(teams)
  const waypointsRef = useRef(waypoints)
  const mapStyleRef = useRef(mapStyle)
  useEffect(() => { teamsRef.current = teams }, [teams])
  useEffect(() => { waypointsRef.current = waypoints }, [waypoints])
  useEffect(() => { mapStyleRef.current = mapStyle }, [mapStyle])

  const setMapStyle = useAppStore((s) => s.setMapStyle)
  const labelsHidden = !!mapStyle?.labelsHidden

  const styleUrl = STYLE_URLS[mapStyle?.openFreeStyle] || STYLE_URLS.liberty

  // --- Video recording: composite the WebGL map canvas with a 2D canvas that
  //     redraws the pins (DOM markers are invisible to captureStream).
  //
  //     The composite is a fixed 1920x1080 (16:9) frame. The map (which fills
  //     whatever non-16:9 area the window leaves) is cover-fitted into it, and
  //     the same transform is applied to pin positions.
  //
  //     Critically, the frame is drawn inside the map's 'render' event: at that
  //     moment the WebGL drawing buffer is guaranteed to hold the just-rendered
  //     scene. Copying from a separate rAF tick captures an empty buffer (which
  //     is why earlier the base map didn't show up — only the 2D pins did). ---
  const recorderRef = useRef(null)
  const startRecording = useCallback(async ({ onStop } = {}) => {
    const map = mapRef.current
    if (!map || typeof MediaRecorder === 'undefined') return false

    const mapCanvas = map.getCanvas()
    const w = mapCanvas.width
    const h = mapCanvas.height
    const s = mapCanvas.clientWidth ? w / mapCanvas.clientWidth : (window.devicePixelRatio || 1)

    // Output frame dimensions from persisted settings
    const { recordingAspect = '16:9', recordingResolution = '1080p' } = mapStyleRef.current || {}
    const { w: OUT_W, h: OUT_H } = outputDims(recordingAspect, recordingResolution)
    const scale = Math.max(OUT_W / w, OUT_H / h)   // cover-fit (fill frame, crop overflow)
    const drawnW = w * scale
    const drawnH = h * scale
    const offsetX = (OUT_W - drawnW) / 2
    const offsetY = (OUT_H - drawnH) / 2
    const k = s * scale   // maps a CSS pixel (map.project units) to composite pixels

    // Preload team photos so they're ready to draw on the first frame.
    const photoImgs = {}
    await Promise.all(
      teamsRef.current
        .filter((t) => t.photoDataUrl)
        .map((t) => new Promise((resolve) => {
          const img = new Image()
          img.onload = () => { photoImgs[t.id] = img; resolve() }
          img.onerror = () => resolve()
          img.src = t.photoDataUrl
        }))
    )

    const composite = document.createElement('canvas')
    composite.width = OUT_W
    composite.height = OUT_H
    const ctx = composite.getContext('2d')

    const drawComposite = () => {
      ctx.fillStyle = '#0f172a'        // backdrop (only visible if a letterbox edge appears)
      ctx.fillRect(0, 0, OUT_W, OUT_H)
      ctx.drawImage(mapCanvas, offsetX, offsetY, drawnW, drawnH)

      // Waypoint pins (skip hidden)
      waypointsRef.current.forEach((wp) => {
        if (wp.hidden) return
        const p = map.project([wp.lng, wp.lat])
        drawWaypointMarker(ctx, offsetX + p.x * k, offsetY + p.y * k, wp, k)
      })

      // Team pins — read LIVE position from the marker (it moves during
      // animation) and skip ones currently hidden.
      teamsRef.current.forEach((team) => {
        const entry = teamMarkersRef.current[team.id]
        if (!entry) return
        if (entry.marker.getElement().style.display === 'none') return
        const p = map.project(entry.marker.getLngLat())
        drawTeamMarker(ctx, offsetX + p.x * k, offsetY + p.y * k, team, photoImgs[team.id], k)
      })

      // Attribution — required by OpenStreetMap/OSRM usage terms
      const attrText = '© OpenStreetMap contributors'
      const attrFontSize = Math.max(11, Math.round(OUT_H * 0.012))
      ctx.save()
      ctx.font = `${attrFontSize}px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif`
      ctx.textBaseline = 'bottom'
      ctx.textAlign = 'right'
      const attrW = ctx.measureText(attrText).width + 14
      const attrH = attrFontSize + 8
      const attrX = OUT_W - 6
      const attrY = OUT_H - 6
      ctx.fillStyle = 'rgba(255,255,255,0.82)'
      ctx.beginPath()
      ctx.roundRect(attrX - attrW, attrY - attrH, attrW, attrH, 3)
      ctx.fill()
      ctx.fillStyle = '#333'
      ctx.fillText(attrText, attrX - 7, attrY - 4)
      ctx.restore()
    }

    // Draw once now, then on every map render (each animation frame triggers one).
    drawComposite()
    map.on('render', drawComposite)
    // Keep the map's render loop ticking for the whole recording so frames keep
    // flowing even during brief idle moments.
    const keepAlive = () => { if (recorderRef.current?.state === 'recording') { map.triggerRepaint(); requestAnimationFrame(keepAlive) } }

    const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4']
      .find((t) => MediaRecorder.isTypeSupported(t)) || 'video/webm'
    const stream = composite.captureStream(30)
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 12_000_000 })
    const chunks = []
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
    recorder.onstop = () => {
      map.off('render', drawComposite)
      const blob = new Blob(chunks, { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `jetlag-map-${Date.now()}.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      onStop?.()
    }

    recorderRef.current = recorder
    recorder.start(100)
    requestAnimationFrame(keepAlive)
    return true
  }, [])

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  }, [])

  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: [0, 20],
      zoom: 2,
      attributionControl: false,
      preserveDrawingBuffer: true,
    })
    map.addControl(new maplibregl.NavigationControl(), 'top-left')
    map.addControl(new maplibregl.AttributionControl({ compact: false }), 'bottom-right')
    mapRef.current = map
    map.on('load', () => {
      setMapReady(true)
      onMapReady?.({ map, startRecording, stopRecording })
    })

    return () => {
      Object.values(teamMarkersRef.current).forEach(({ marker }) => marker.remove())
      Object.values(waypointMarkersRef.current).forEach(({ marker }) => marker.remove())
      map.remove()
    }
  }, [])

  // Toggle visibility of every symbol (label/icon) layer in the base style.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    const apply = () => {
      const layers = map.getStyle()?.layers || []
      layers.forEach((l) => {
        if (l.type === 'symbol') {
          try {
            map.setLayoutProperty(l.id, 'visibility', labelsHidden ? 'none' : 'visible')
          } catch { /* layer may not accept the property; ignore */ }
        }
      })
    }
    if (map.isStyleLoaded()) apply()
    else map.once('idle', apply)
  }, [labelsHidden, mapReady])

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
        marker.getElement().style.display = wp.hidden ? 'none' : ''
      } else {
        const el = createWaypointMarkerEl(wp)
        const marker = new maplibregl.Marker({ element: el, anchor: 'top-left' })
          .setLngLat([wp.lng, wp.lat])
          .addTo(map)
        if (wp.hidden) marker.getElement().style.display = 'none'
        waypointMarkersRef.current[wp.id] = { marker, el }
      }
    })
  }, [waypoints, mapReady])

  return (
    <div ref={containerRef} className={`map-container${placingWaypoint ? ' placing' : ''}`}>
      <button
        className={`map-label-toggle${labelsHidden ? ' active' : ''}`}
        onClick={() => setMapStyle({ labelsHidden: !labelsHidden })}
        title={labelsHidden ? 'Show map labels' : 'Hide map labels'}
      >
        {labelsHidden ? '🏷️ Labels off' : '🏷️ Labels on'}
      </button>
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
