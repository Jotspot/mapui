import './PlaybackBar.css'
import useAppStore from '../../store/useAppStore.js'

const MODE_ICONS = { flight: '✈️', driving: '🚗', transit: '🚆', walking: '🚶' }

export default function PlaybackBar({ isPlaying, animatingId, onPlay, onStop }) {
  const routes = useAppStore((s) => s.routes)
  const waypoints = useAppStore((s) => s.waypoints)

  const queue = routes.filter((r) => r.queued)
  const wpName = (id) => waypoints.find((w) => w.id === id)?.name || '?'

  const currentRoute = routes.find((r) => r.id === animatingId)
  const currentProgress = currentRoute ? (currentRoute.progress ?? 0) : 0

  const completedInQueue = queue.filter((r) => r.id !== animatingId && (r.progress ?? 1) >= 1).length
  const overallProgress = queue.length === 0 ? 0
    : (completedInQueue + (animatingId ? currentProgress : 0)) / queue.length

  return (
    <div className="playback-bar">
      <div className="playback-progress-track">
        <div className="playback-progress-fill" style={{ width: `${overallProgress * 100}%` }} />
      </div>
      <div className="playback-controls">
        <button
          className={`playback-play-btn${isPlaying ? ' playing' : ''}`}
          onClick={isPlaying ? onStop : onPlay}
          title={isPlaying ? 'Stop' : 'Play queue'}
        >
          {isPlaying ? '⏹' : '▶'}
        </button>

        <div className="playback-queue">
          {queue.length === 0
            ? <span className="playback-queue-empty">Queue routes using the + button in the Routes panel</span>
            : queue.map((route, i) => (
              <div
                key={route.id}
                className={`queue-chip${route.id === animatingId ? ' active' : ''}`}
              >
                <div className="queue-chip-dot" style={{ background: route.color }} />
                {MODE_ICONS[route.mode]} {wpName(route.fromWaypointId)} → {wpName(route.toWaypointId)}
              </div>
            ))
          }
        </div>

        {isPlaying && currentRoute && (
          <div className="playback-current-progress">
            <div className="playback-route-bar-track">
              <div className="playback-route-bar-fill" style={{ width: `${currentProgress * 100}%` }} />
            </div>
            <span className="playback-step-info">
              {Math.round(currentProgress * 100)}%
            </span>
          </div>
        )}

        {queue.length > 0 && !isPlaying && (
          <span className="playback-step-info">{queue.length} route{queue.length !== 1 ? 's' : ''} queued</span>
        )}
      </div>
    </div>
  )
}
