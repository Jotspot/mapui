import { useState } from 'react'
import Modal from './Modal.jsx'
import TransportSelector from '../UI/TransportSelector.jsx'
import ColorPicker from '../UI/ColorPicker.jsx'
import useAppStore from '../../store/useAppStore.js'

const fieldStyle = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1.5px solid #e2e8f0', fontSize: 14, color: '#1e293b', outline: 'none',
}
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }

export default function AddRouteModal({ onClose }) {
  const addRoute = useAppStore((s) => s.addRoute)
  const waypoints = useAppStore((s) => s.waypoints)
  const teams = useAppStore((s) => s.teams)

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [mode, setMode] = useState('flight')
  const [color, setColor] = useState('#EF4444')
  const [teamId, setTeamId] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!from || !to || from === to) return
    addRoute({
      fromWaypointId: from,
      toWaypointId: to,
      mode,
      color,
      teamId: teamId || null,
      animationProgress: 0,
      geometry: null,
    })
    onClose()
  }

  return (
    <Modal title="Add Route" onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>From</label>
            <select style={fieldStyle} value={from} onChange={(e) => setFrom(e.target.value)}>
              <option value="">— Select —</option>
              {waypoints.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>To</label>
            <select style={fieldStyle} value={to} onChange={(e) => setTo(e.target.value)}>
              <option value="">— Select —</option>
              {waypoints.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Transport Mode</label>
          <TransportSelector value={mode} onChange={setMode} />
        </div>
        <div>
          <label style={labelStyle}>Route Color</label>
          <ColorPicker value={color} onChange={setColor} />
        </div>
        <div>
          <label style={labelStyle}>Team (optional)</label>
          <select style={fieldStyle} value={teamId} onChange={(e) => setTeamId(e.target.value)}>
            <option value="">— None —</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <button
          type="submit"
          style={{
            padding: '10px 0', borderRadius: 8, background: color,
            color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}
        >
          Add &amp; Animate Route
        </button>
      </form>
    </Modal>
  )
}
