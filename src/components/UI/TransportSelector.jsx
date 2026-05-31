const MODES = [
  { id: 'flight', label: '✈️ Flight' },
  { id: 'driving', label: '🚗 Driving' },
  { id: 'transit', label: '🚆 Transit' },
  { id: 'walking', label: '🚶 Walking' },
]

export default function TransportSelector({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          style={{
            padding: '6px 12px',
            borderRadius: 20,
            border: value === m.id ? '2px solid #3b82f6' : '2px solid #e2e8f0',
            background: value === m.id ? '#eff6ff' : 'white',
            color: value === m.id ? '#1d4ed8' : '#64748b',
            fontWeight: value === m.id ? 700 : 400,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
