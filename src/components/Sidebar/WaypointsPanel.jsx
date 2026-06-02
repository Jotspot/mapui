import useAppStore from '../../store/useAppStore.js'

export default function WaypointsPanel({ onAdd }) {
  const waypoints = useAppStore((s) => s.waypoints)
  const removeWaypoint = useAppStore((s) => s.removeWaypoint)
  const updateWaypoint = useAppStore((s) => s.updateWaypoint)

  return (
    <div>
      <button className="panel-add-btn" onClick={onAdd}>+ Add Waypoint</button>
      {waypoints.length === 0 && (
        <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 20 }}>
          No waypoints yet. Click "Add Waypoint" or place one on the map.
        </p>
      )}
      {waypoints.map((wp) => (
        <div key={wp.id} className="panel-item" style={{ opacity: wp.hidden ? 0.45 : 1 }}>
          <span style={{ fontSize: 16 }}>📍</span>
          <span className="panel-item-name" style={{ flex: 1 }}>{wp.name}</span>
          <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>
            {wp.lat.toFixed(2)}, {wp.lng.toFixed(2)}
          </span>
          <button
            className="panel-item-action"
            style={{ background: '#f1f5f9', color: wp.hidden ? '#94a3b8' : '#475569', flexShrink: 0 }}
            onClick={() => updateWaypoint(wp.id, { hidden: !wp.hidden })}
            title={wp.hidden ? 'Show on map' : 'Hide from map'}
          >
            {wp.hidden ? '🙈' : '👁'}
          </button>
          <button className="panel-item-action remove" onClick={() => removeWaypoint(wp.id)}>×</button>
        </div>
      ))}
    </div>
  )
}

