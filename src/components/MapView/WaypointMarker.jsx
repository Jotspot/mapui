import './WaypointMarker.css'

export default function WaypointMarker({ waypoint }) {
  return (
    <div className="waypoint-marker-wrap">
      <div className="waypoint-pin">
        <div className="waypoint-circle" />
        <div className="waypoint-stem" />
      </div>
      <div className="waypoint-label">{waypoint.name}</div>
    </div>
  )
}
