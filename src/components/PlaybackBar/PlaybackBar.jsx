import './PlaybackBar.css'
import useAppStore from '../../store/useAppStore.js'

const MODE_ICONS = { flight: '✈️', driving: '🚗', transit: '🚆', walking: '🚶' }

export default function PlaybackBar({ isPlaying, animatingIds = [], onPlay, onPlayAll, onStop }) {
  const routes = useAppStore((s) => s.routes)
  const waypoints = useAppStore((s) => s.waypoints)

  const queue = routes.filter((r) => r.queued)
  const wpName = (id) => waypoints.find((w) => w.id === id)?.name || '?'

  // Overall progress: average of all currently animating routes
  const overallProgress = animatingIds.length === 0 ? 0
    : animatingIds.reduce((sum, id) => {
        const r = routes.find((r) => r.id === id)
        return sum + (r?.progress ?? 0)
      }, 0) / animatingIds.length

  return (
    <div className="playback-bar">
      <div className="playback-progress-track">
        <div className="playback-progress-fill" style={{ width: `${overallProgress * 100}%` }} />
      </div>
      <div className="playback-controls">

        {/* Stop / Play queued */}
        <button
          className={`playback-play-btn${isPlaying ? ' playing' : ''}`}
          onClick={isPlaying ? onStop : onPlay}
          title={isPlaying ? 'Stop all' : 'Play queued routes simultaneously'}
        >
          {isPlaying ? '⏹' : '▶'}
        </button>

        {/* Play All */}
        {!isPlaying && (
          <button
            className="playback-play-btn"
            onClick={onPlayAll}
            title="Play ALL routes simultaneously"
            style={{ width: 'auto', borderRadius: 20, padding: '0 12px', fontSize: 12, fontWeight: 700 }}
          >
            ▶▶ All
          </button>
        )}

        {/* Queue chips */}
        <div className="playback-queue">
          {queue.length === 0
            ? <span className="playback-queue-empty">☆ Star routes to queue them, then ▶ plays all at once</span>
            : queue.map((route) => (
              <div
                key={route.id}
                className={`queue-chip${animatingIds.includes(route.id) ? ' active' : ''}`}
              >
                <div className="queue-chip-dot" style={{ background: route.color }} />
                {MODE_ICONS[route.mode]} {wpName(route.fromWaypointId)} → {wpName(route.toWaypointId)}
              </div>
            ))
          }
        </div>

        {/* Live progress readout */}
        {isPlaying && (
          <div className="playback-current-progress">
            <div className="playback-route-bar-track">
              <div className="playback-route-bar-fill" style={{ width: `${overallProgress * 100}%` }} />
            </div>
            <span className="playback-step-info">
              {Math.round(overallProgress * 100)}%
              {animatingIds.length > 1 && ` (${animatingIds.length} routes)`}
            </span>
          </div>
        )}

        {queue.length > 0 && !isPlaying && (
          <span className="playback-step-info">{queue.length} queued</span>
        )}
      </div>
    </div>
  )
}
