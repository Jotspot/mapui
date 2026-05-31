import './TeamMarker.css'

export default function TeamMarker({ team }) {
  const initials = team.name
    .split(/[\s/]+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="team-marker-wrap" style={{ '--team-color': team.color }}>
      <div className="team-pin">
        {team.photoDataUrl ? (
          <img src={team.photoDataUrl} alt={team.name} />
        ) : (
          <div className="initials">{initials}</div>
        )}
      </div>
      <div className="team-pin-point" />
      <div className="team-label">{team.name}</div>
    </div>
  )
}
