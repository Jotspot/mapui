import './TeamMarker.css'

export default function TeamMarker({ team }) {
  const initials = team.name
    .split(/[\s/]+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="jetlag-pin" style={{ '--team-color': team.color }}>
      <div className="jetlag-bubble">
        {team.photoDataUrl
          ? <img src={team.photoDataUrl} alt={team.name} />
          : <div className="jetlag-initials">{initials}</div>
        }
      </div>
      <div className="jetlag-spike" />
      <div className="jetlag-label">{team.name}</div>
    </div>
  )
}
