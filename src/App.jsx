import { useState, useCallback, useRef } from 'react'
import MapView from './components/MapView/MapView.jsx'
import Sidebar from './components/Sidebar/Sidebar.jsx'
import PlaybackBar from './components/PlaybackBar/PlaybackBar.jsx'
import AddTeamModal from './components/Modals/AddTeamModal.jsx'
import AddWaypointModal from './components/Modals/AddWaypointModal.jsx'
import AddRouteModal from './components/Modals/AddRouteModal.jsx'
import useAppStore from './store/useAppStore.js'

export default function App() {
  const routes = useAppStore((s) => s.routes)
  const speeds = useAppStore((s) => s.speeds)
  const updateRoute = useAppStore((s) => s.updateRoute)

  const [modal, setModal] = useState(null)
  const [placingWaypoint, setPlacingWaypoint] = useState(false)
  const [waypointPrefill, setWaypointPrefill] = useState(null)

  // Multiple simultaneous animations
  const [animatingIds, setAnimatingIds] = useState([])
  const isPlaying = animatingIds.length > 0

  // Video recording
  const [isRecording, setIsRecording] = useState(false)
  const mapInstanceRef = useRef(null)
  const recorderRef = useRef(null)
  const recordingActiveRef = useRef(false)

  const handleMapReady = useCallback((map) => {
    mapInstanceRef.current = map
  }, [])

  // Called when one animation finishes
  const handleAnimateComplete = useCallback((finishedId) => {
    setAnimatingIds((prev) => {
      const next = prev.filter((id) => id !== finishedId)
      // Stop recording when all animations complete
      if (next.length === 0 && recordingActiveRef.current && recorderRef.current?.state === 'recording') {
        setTimeout(() => recorderRef.current?.stop(), 800)
      }
      return next
    })
  }, [])

  // Play queued routes ALL AT ONCE (simultaneously)
  const handlePlayQueue = useCallback(() => {
    const queue = routes.filter((r) => r.queued)
    if (!queue.length) return
    queue.forEach((r) => updateRoute(r.id, { progress: 0 }))
    setAnimatingIds(queue.map((r) => r.id))
  }, [routes, updateRoute])

  // Play every route simultaneously
  const handlePlayAll = useCallback(() => {
    if (!routes.length) return
    routes.forEach((r) => updateRoute(r.id, { progress: 0 }))
    setAnimatingIds(routes.map((r) => r.id))
  }, [routes, updateRoute])

  // Play a single route
  const handlePlaySingle = useCallback((routeId) => {
    updateRoute(routeId, { progress: 0 })
    setAnimatingIds((prev) => prev.includes(routeId) ? prev : [...prev, routeId])
  }, [updateRoute])

  const handleStop = useCallback(() => {
    setAnimatingIds([])
  }, [])

  // Record all routes to a video file (captures the map canvas)
  const handleRecord = useCallback(() => {
    const map = mapInstanceRef.current
    if (!map || !routes.length) return

    const canvas = map.getCanvas()
    const stream = canvas.captureStream(30)

    const mimeType = ['video/webm;codecs=vp9', 'video/webm', 'video/mp4']
      .find((t) => MediaRecorder.isTypeSupported(t)) || 'video/webm'

    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 })
    const chunks = []

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
      a.download = `jetlag-map-${Date.now()}.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setIsRecording(false)
      recordingActiveRef.current = false
    }

    recorderRef.current = recorder
    recordingActiveRef.current = true
    setIsRecording(true)
    recorder.start(100)

    routes.forEach((r) => updateRoute(r.id, { progress: 0 }))
    setAnimatingIds(routes.map((r) => r.id))
  }, [routes, updateRoute])

  return (
    <>
      <MapView
        placingWaypoint={placingWaypoint}
        onMapClick={({ lng, lat }) => {
          if (placingWaypoint) {
            setPlacingWaypoint(false)
            setWaypointPrefill({ lng, lat })
            setModal({ type: 'waypoint' })
          }
        }}
        animatingIds={animatingIds}
        onAnimateComplete={handleAnimateComplete}
        speeds={speeds}
        onMapReady={handleMapReady}
      />
      <Sidebar
        onAddTeam={() => setModal({ type: 'team', data: null })}
        onEditTeam={(team) => setModal({ type: 'team', data: team })}
        onAddWaypoint={() => { setWaypointPrefill(null); setModal({ type: 'waypoint' }) }}
        onAddRoute={() => setModal({ type: 'route', data: null })}
        onEditRoute={(route) => setModal({ type: 'route', data: route })}
        onPlaySingle={handlePlaySingle}
      />
      <PlaybackBar
        isPlaying={isPlaying}
        isRecording={isRecording}
        animatingIds={animatingIds}
        onPlay={handlePlayQueue}
        onPlayAll={handlePlayAll}
        onStop={handleStop}
        onRecord={handleRecord}
      />

      {placingWaypoint && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          background: '#1e293b', color: 'white', padding: '10px 20px',
          borderRadius: 30, fontSize: 14, fontWeight: 600,
          zIndex: 500, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', pointerEvents: 'none',
        }}>
          📍 Click anywhere on the map to place waypoint
        </div>
      )}

      {modal?.type === 'team' && <AddTeamModal initial={modal.data} onClose={() => setModal(null)} />}
      {modal?.type === 'waypoint' && (
        <AddWaypointModal
          prefill={waypointPrefill}
          onClose={() => setModal(null)}
          onStartPlacing={() => { setModal(null); setPlacingWaypoint(true) }}
        />
      )}
      {modal?.type === 'route' && <AddRouteModal initial={modal.data} onClose={() => setModal(null)} />}
    </>
  )
}
