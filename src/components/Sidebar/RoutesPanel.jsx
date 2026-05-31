import useAppStore from '../../store/useAppStore.js'

const MODE_LABELS = { flight: '✈️', driving: '🚗', transit: '🚆', walking: '🚶' }

export default function RoutesPanel({ onAdd, onEdit, onPlaySingle }) {
  const routes = useAppStore((s) => s.routes)
  const waypoints = useAppStore((s) => s.waypoints)
  const teams = useAppStore((s) => s.teams)
  const removeRoute = useAppStore((s) => s.removeRoute)
  const updateRoute = useAppStore((s) => s.updateRoute)

  const wpName = (id) => waypoints.find((w) => w.id === id)?.name || '?'

  return (
    <div>
      <button className="panel-add-btn" onClick={onAdd}>+ Add Route</button>
      {routes.length === 0 && (
        <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 20 }}>
          No routes yet. Add waypoints first, then connect them.
        </p>
      )}
      {routes.map((route) => {
        const progress = route.progress ?? 1
        const team = teams.find((t) => t.id === route.teamId)
        const color = team?.color || route.color || '#3b82f6'
        return (
          <div key={route.id} className="panel-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="color-dot" style={{ background: color }} />
              <span style={{ fontSize: 15 }}>{MODE_LABELS[route.mode] || '🗺️'}</span>
              <span className="panel-item-name" style={{ flex: 1 }}>
                {team ? <strong>{team.name}:</strong> : null}{' '}
                {wpName(route.fromWaypointId)} → {wpName(route.toWaypointId)}
              </span>
            </div>

            {/* Slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: '#94a3b8', width: 18, flexShrink: 0 }}>0</span>
              <input
                type="range" min="0" max="100"
                value={Math.round(progress * 100)}
                onChange={(e) => updateRoute(route.id, { progress: Number(e.target.value) / 100 })}
                style={{ flex: 1, accentColor: color, cursor: 'pointer' }}
              />
              <span style={{ fontSize: 10, color: '#94a3b8', width: 28, flexShrink: 0, textAlign: 'right' }}>
                {Math.round(progress * 100)}%
              </span>
            </div>

            {/* Actions row */}
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="panel-item-action animate" style={{ flex: 1 }} onClick={() => onPlaySingle(route.id)}>
                ▶ Play
              </button>
              <button
                className="panel-item-action"
                style={{
                  flex: 1,
                  background: route.queued ? '#fef3c7' : '#f1f5f9',
                  color: route.queued ? '#d97706' : '#64748b',
                  border: route.queued ? '1.5px solid #f59e0b' : '1.5px solid transparent',
                }}
                onClick={() => updateRoute(route.id, { queued: !route.queued })}
              >
                {route.queued ? '★ Queued' : '☆ Queue'}
              </button>
              <button
                className="panel-item-action"
                style={{ background: '#f8fafc', color: '#64748b' }}
                onClick={() => onEdit(route)}
                title="Edit route"
              >
                ✎
              </button>
              <button
                className="panel-item-action"
                style={{ background: '#f8fafc', color: '#94a3b8' }}
                onClick={() => updateRoute(route.id, { progress: 0 })}
                title="Reset to start"
              >
                ↺
              </button>
              <button className="panel-item-action remove" onClick={() => removeRoute(route.id)}>×</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
