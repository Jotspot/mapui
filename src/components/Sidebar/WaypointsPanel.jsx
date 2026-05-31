import useAppStore from '../../store/useAppStore.js'

export default function WaypointsPanel({ onAdd }) {
  const waypoints = useAppStore((s) => s.waypoints)
  const removeWaypoint = useAppStore((s) => s.removeWaypoint)

  return (
    <div>
      <button className="panel-add-btn" onClick={onAdd}>+ Add Waypoint</button>
      {waypoints.length === 0 && (
        <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 20 }}>
          No waypoints yet. Click "Add Waypoint" or place one on the map.
        </p>
      )}
      {waypoints.map((wp) => (
        <div key={wp.id} className="panel-item">
          <span style={{ fontSize: 16 }}>📍</span>
          <span className="panel-item-name">{wp.name}</span>
          <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>
            {wp.lat.toFixed(2)}, {wp.lng.toFixed(2)}
          </span>
          <button className="panel-item-action remove" onClick={() => removeWaypoint(wp.id)}>×</button>
        </div>
      ))}
    </div>
  )
}
