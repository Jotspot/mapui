import useAppStore from '../../store/useAppStore.js'

export default function TeamsPanel({ onAdd, onEdit }) {
  const teams = useAppStore((s) => s.teams)
  const removeTeam = useAppStore((s) => s.removeTeam)

  return (
    <div>
      <button className="panel-add-btn" onClick={onAdd}>+ Add Team</button>
      {teams.length === 0 && (
        <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 20 }}>
          No teams yet. Add one to get started!
        </p>
      )}
      {teams.map((team) => (
        <div key={team.id} className="panel-item">
          {team.photoDataUrl ? (
            <img
              src={team.photoDataUrl}
              alt={team.name}
              style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: team.color, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 800, fontSize: 11,
              }}
            >
              {team.name.split(/[\s/]+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          )}
          <span className="panel-item-name">{team.name}</span>
          <button className="panel-item-action edit" onClick={() => onEdit(team)}>Edit</button>
          <button className="panel-item-action remove" onClick={() => removeTeam(team.id)}>×</button>
        </div>
      ))}
    </div>
  )
}
