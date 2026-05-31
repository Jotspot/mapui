import { useState, useCallback } from 'react'
import MapView from './components/MapView/MapView.jsx'
import Sidebar from './components/Sidebar/Sidebar.jsx'
import AddTeamModal from './components/Modals/AddTeamModal.jsx'
import AddWaypointModal from './components/Modals/AddWaypointModal.jsx'
import AddRouteModal from './components/Modals/AddRouteModal.jsx'

export default function App() {
  const [modal, setModal] = useState(null) // { type, data }
  const [placingWaypoint, setPlacingWaypoint] = useState(false)
  const [waypointPrefill, setWaypointPrefill] = useState(null)

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

  return (
    <>
      <MapView placingWaypoint={placingWaypoint} onMapClick={handleMapClick} />
      <Sidebar
        onAddTeam={() => setModal({ type: 'team', data: null })}
        onEditTeam={(team) => setModal({ type: 'team', data: team })}
        onAddWaypoint={openAddWaypoint}
        onAddRoute={() => setModal({ type: 'route' })}
      />

      {placingWaypoint && (
        <div
          style={{
            position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
            background: '#1e293b', color: 'white', padding: '10px 20px',
            borderRadius: 30, fontSize: 14, fontWeight: 600,
            zIndex: 500, boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
          }}
        >
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
