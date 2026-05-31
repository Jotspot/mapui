import './WaypointMarker.css'

export default function WaypointMarker({ waypoint }) {
  return (
    <div className="wp-marker">
      <div className="wp-pin">
        <div className="wp-head" />
        <div className="wp-spike" />
      </div>
      <div className="wp-label">{waypoint.name}</div>
    </div>
  )
}
