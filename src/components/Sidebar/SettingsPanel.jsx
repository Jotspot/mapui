import useAppStore from '../../store/useAppStore.js'

const MODES = [
  { id: 'flight', label: '✈️ Flight', min: 1, max: 20 },
  { id: 'driving', label: '🚗 Driving', min: 1, max: 30 },
  { id: 'transit', label: '🚆 Transit', min: 1, max: 30 },
  { id: 'walking', label: '🚶 Walking', min: 1, max: 60 },
]

export default function SettingsPanel() {
  const speeds = useAppStore((s) => s.speeds)
  const setSpeed = useAppStore((s) => s.setSpeed)

  return (
    <div>
      <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
        Animation duration per transport mode (seconds).
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {MODES.map(({ id, label, min, max }) => {
          const val = speeds?.[id] ?? 4
          return (
            <div key={id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{label}</span>
                <span style={{
                  fontSize: 12, fontWeight: 700, color: 'white',
                  background: '#3b82f6', borderRadius: 20, padding: '2px 9px',
                  minWidth: 44, textAlign: 'center',
                }}>
                  {val}s
                </span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step="0.5"
                value={val}
                onChange={(e) => setSpeed(id, Number(e.target.value))}
                style={{ width: '100%', accentColor: '#3b82f6', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#cbd5e1', marginTop: 2 }}>
                <span>Fast ({min}s)</span>
                <span>Slow ({max}s)</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
