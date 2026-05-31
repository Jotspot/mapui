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
  const updateRoute = useAppStore((s) => s.updateRoute)

  const [modal, setModal] = useState(null)
  const [placingWaypoint, setPlacingWaypoint] = useState(false)
  const [waypointPrefill, setWaypointPrefill] = useState(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [animatingId, setAnimatingId] = useState(null)
  const queueRef = useRef([]) // ordered list of route IDs to play

  const closeModal = () => setModal(null)

  const handleMapClick = useCallback(({ lng, lat }) => {
    if (placingWaypoint) {
      setPlacingWaypoint(false)
      setWaypointPrefill((prev) => ({ ...prev, lng, lat }))
      setModal({ type: 'waypoint' })
    }
  }, [placingWaypoint])

  const openAddWaypoint = () => {
    setWaypointPrefill(null)
    setModal({ type: 'waypoint' })
  }

  const handleStartPlacing = () => {
    setModal(null)
    setPlacingWaypoint(true)
  }

  // Play a single route immediately (bypasses queue)
  const handlePlaySingle = useCallback((routeId) => {
    const route = routes.find((r) => r.id === routeId)
    if (!route?.geometry) return
    queueRef.current = [routeId]
    setIsPlaying(true)
    setAnimatingId(routeId)
  }, [routes])

  // Play all queued routes in order
  const handlePlayQueue = useCallback(() => {
    const queue = routes.filter((r) => r.queued)
    if (queue.length === 0) return
    // Reset progress for all queued routes to 0
    queue.forEach((r) => updateRoute(r.id, { progress: 0 }))
    queueRef.current = queue.map((r) => r.id)
    setIsPlaying(true)
    setAnimatingId(queueRef.current[0])
  }, [routes, updateRoute])

  const handleStop = useCallback(() => {
    setIsPlaying(false)
    setAnimatingId(null)
    queueRef.current = []
  }, [])

  // Called by RouteLayer when one animation finishes
  const handleAnimateComplete = useCallback((finishedId) => {
    const idx = queueRef.current.indexOf(finishedId)
    const nextId = queueRef.current[idx + 1]
    if (nextId) {
      setAnimatingId(nextId)
    } else {
      setIsPlaying(false)
      setAnimatingId(null)
      queueRef.current = []
    }
  }, [])

  return (
    <>
      <MapView
        placingWaypoint={placingWaypoint}
        onMapClick={handleMapClick}
        animatingId={animatingId}
        onAnimateComplete={handleAnimateComplete}
      />
      <Sidebar
        onAddTeam={() => setModal({ type: 'team', data: null })}
        onEditTeam={(team) => setModal({ type: 'team', data: team })}
        onAddWaypoint={openAddWaypoint}
        onAddRoute={() => setModal({ type: 'route' })}
        onPlaySingle={handlePlaySingle}
      />
      <PlaybackBar
        isPlaying={isPlaying}
        animatingId={animatingId}
        onPlay={handlePlayQueue}
        onStop={handleStop}
      />

      {placingWaypoint && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          background: '#1e293b', color: 'white', padding: '10px 20px',
          borderRadius: 30, fontSize: 14, fontWeight: 600,
          zIndex: 500, boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          pointerEvents: 'none',
        }}>
          📍 Click anywhere on the map to place waypoint
        </div>
      )}

      {modal?.type === 'team' && (
        <AddTeamModal initial={modal.data} onClose={closeModal} />
      )}
      {modal?.type === 'waypoint' && (
        <AddWaypointModal
          prefill={waypointPrefill}
          onClose={closeModal}
          onStartPlacing={handleStartPlacing}
        />
      )}
      {modal?.type === 'route' && (
        <AddRouteModal onClose={closeModal} />
      )}
    </>
  )
}
