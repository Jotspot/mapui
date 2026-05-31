import useAppStore from '../../store/useAppStore.js'

const MODES = [
  { id: 'flight', label: '✈️ Flight', min: 1, max: 20 },
  { id: 'driving', label: '🚗 Driving', min: 1, max: 30 },
  { id: 'transit', label: '🚆 Transit', min: 1, max: 30 },
  { id: 'walking', label: '🚶 Walking', min: 1, max: 60 },
]

const fieldStyle = {
  width: '100%', padding: '7px 10px', borderRadius: 7,
  border: '1.5px solid #e2e8f0', fontSize: 13, color: '#1e293b',
  outline: 'none', marginTop: 6,
}

const sectionHead = { fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 10 }

export default function SettingsPanel() {
  const speeds = useAppStore((s) => s.speeds)
  const setSpeed = useAppStore((s) => s.setSpeed)
  const mapStyle = useAppStore((s) => s.mapStyle)
  const setMapStyle = useAppStore((s) => s.setMapStyle)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Map Provider */}
      <div>
        <p style={sectionHead}>🗺️ Map Provider</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { id: 'openfreemap', label: 'OpenFreeMap', sub: 'Free, no account needed' },
            { id: 'apple', label: 'Apple Maps', sub: 'Requires MapKit JS token' },
          ].map((opt) => (
            <label key={opt.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
              background: mapStyle?.provider === opt.id ? '#eff6ff' : '#f8fafc',
              border: `1.5px solid ${mapStyle?.provider === opt.id ? '#3b82f6' : '#e2e8f0'}`,
            }}>
              <input
                type="radio"
                name="mapProvider"
                checked={mapStyle?.provider === opt.id}
                onChange={() => setMapStyle({ provider: opt.id })}
                style={{ accentColor: '#3b82f6' }}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{opt.sub}</div>
              </div>
            </label>
          ))}
        </div>

        {mapStyle?.provider === 'openfreemap' && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Style</div>
            <select
              style={fieldStyle}
              value={mapStyle?.openFreeStyle || 'liberty'}
              onChange={(e) => setMapStyle({ openFreeStyle: e.target.value })}
            >
              <option value="liberty">Liberty (detailed)</option>
              <option value="bright">Bright (clean / Apple-like)</option>
            </select>
          </div>
        )}

        {mapStyle?.provider === 'apple' && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 2 }}>
              MapKit JS Token
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
              Generate a long-lived JWT at{' '}
              <a href="https://developer.apple.com/maps/web" target="_blank" rel="noreferrer"
                style={{ color: '#3b82f6' }}>developer.apple.com/maps/web</a>
            </div>
            <input
              type="password"
              style={fieldStyle}
              value={mapStyle?.appleToken || ''}
              onChange={(e) => setMapStyle({ appleToken: e.target.value })}
              placeholder="eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6..."
            />
            {mapStyle?.appleToken && (
              <div style={{ marginTop: 6, fontSize: 11, color: '#10b981', fontWeight: 600 }}>
                ✓ Token set — reload the page to apply
              </div>
            )}
          </div>
        )}
      </div>

      {/* Speed sliders */}
      <div>
        <p style={sectionHead}>⏱ Animation Speed</p>
        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>Duration per transport mode (seconds)</p>
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
                  type="range" min={min} max={max} step="0.5" value={val}
                  onChange={(e) => setSpeed(id, Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#3b82f6', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#cbd5e1', marginTop: 2 }}>
                  <span>Fast ({min}s)</span><span>Slow ({max}s)</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
