import { useState } from 'react'
import Modal from './Modal.jsx'
import useAppStore from '../../store/useAppStore.js'

const fieldStyle = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1.5px solid #e2e8f0', fontSize: 14, color: '#1e293b', outline: 'none',
}
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }

export default function AddWaypointModal({ prefill, onClose, onStartPlacing }) {
  const addWaypoint = useAppStore((s) => s.addWaypoint)
  const [name, setName] = useState(prefill?.name || '')
  const [lat, setLat] = useState(prefill?.lat != null ? String(prefill.lat.toFixed(5)) : '')
  const [lng, setLng] = useState(prefill?.lng != null ? String(prefill.lng.toFixed(5)) : '')

  const submit = (e) => {
    e.preventDefault()
    const latN = parseFloat(lat)
    const lngN = parseFloat(lng)
    if (!name.trim() || isNaN(latN) || isNaN(lngN)) return
    addWaypoint({ name: name.trim(), lat: latN, lng: lngN })
    onClose()
  }

  return (
    <Modal title="Add Waypoint" onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Location Name</label>
          <input
            style={fieldStyle}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Tokyo"
            autoFocus
          />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Latitude</label>
            <input style={fieldStyle} value={lat} onChange={(e) => setLat(e.target.value)} placeholder="35.6895" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Longitude</label>
            <input style={fieldStyle} value={lng} onChange={(e) => setLng(e.target.value)} placeholder="139.6917" />
          </div>
        </div>
        <button
          type="button"
          onClick={onStartPlacing}
          style={{
            padding: '8px 0', borderRadius: 8, border: '1.5px dashed #94a3b8',
            background: '#f8fafc', color: '#475569', fontSize: 13, cursor: 'pointer',
          }}
        >
          📍 Click on Map to Place
        </button>
        <button
          type="submit"
          style={{
            padding: '10px 0', borderRadius: 8, background: '#3b82f6',
            color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}
        >
          Add Waypoint
        </button>
      </form>
    </Modal>
  )
}
