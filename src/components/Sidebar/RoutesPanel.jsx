import useAppStore from '../../store/useAppStore.js'

const MODE_LABELS = { flight: '✈️', driving: '🚗', transit: '🚆', walking: '🚶' }

export default function RoutesPanel({ onAdd }) {
  const routes = useAppStore((s) => s.routes)
  const waypoints = useAppStore((s) => s.waypoints)
  const removeRoute = useAppStore((s) => s.removeRoute)
  const updateRoute = useAppStore((s) => s.updateRoute)

  const wpName = (id) => waypoints.find((w) => w.id === id)?.name || '?'

  return (
    <div>
      <button className="panel-add-btn" onClick={onAdd}>+ Add Route</button>
      {routes.length === 0 && (
        <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 20 }}>
          No routes yet. Add waypoints first, then connect them with a route.
        </p>
      )}
      {routes.map((route) => (
        <div key={route.id} className="panel-item" style={{ flexWrap: 'wrap', gap: 6 }}>
          <div className="color-dot" style={{ background: route.color }} />
          <span style={{ fontSize: 16 }}>{MODE_LABELS[route.mode] || '🗺️'}</span>
          <span className="panel-item-name">
            {wpName(route.fromWaypointId)} → {wpName(route.toWaypointId)}
          </span>
          <button
            className="panel-item-action animate"
            onClick={() => updateRoute(route.id, { animationProgress: 0 })}
          >
            ▶ Play
          </button>
          <button className="panel-item-action remove" onClick={() => removeRoute(route.id)}>×</button>
        </div>
      ))}
    </div>
  )
}
