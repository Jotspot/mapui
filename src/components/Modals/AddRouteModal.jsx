import { useState, useEffect } from 'react'
import Modal from './Modal.jsx'
import TransportSelector from '../UI/TransportSelector.jsx'
import useAppStore from '../../store/useAppStore.js'

const fieldStyle = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1.5px solid #e2e8f0', fontSize: 14, color: '#1e293b', outline: 'none',
}
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }

export default function AddRouteModal({ initial, onClose }) {
  const addRoute = useAppStore((s) => s.addRoute)
  const updateRoute = useAppStore((s) => s.updateRoute)
  const updateTeam = useAppStore((s) => s.updateTeam)
  const waypoints = useAppStore((s) => s.waypoints)
  const teams = useAppStore((s) => s.teams)

  const [teamId, setTeamId] = useState(initial?.teamId || '')
  const [from, setFrom] = useState(initial?.fromWaypointId || '')
  const [to, setTo] = useState(initial?.toWaypointId || '')
  const [mode, setMode] = useState(initial?.mode || 'flight')

  const team = teams.find((t) => t.id === teamId)
  const color = team?.color || '#3b82f6'

  const isEdit = !!initial?.id

  const submit = (e) => {
    e.preventDefault()
    if (!from || !to || from === to) return
    if (isEdit) {
      // Reset geometry if from/to/mode changed
      const geoChanged = from !== initial.fromWaypointId || to !== initial.toWaypointId || mode !== initial.mode
      updateRoute(initial.id, {
        teamId: teamId || null,
        color,
        fromWaypointId: from,
        toWaypointId: to,
        mode,
        ...(geoChanged ? { geometry: null, progress: 0 } : {}),
      })
    } else {
      addRoute({ fromWaypointId: from, toWaypointId: to, mode, color, teamId: teamId || null, progress: 0, queued: false, geometry: null })
      // Auto-place team at the from waypoint if they have no position
      if (teamId) {
        const t = teams.find((t) => t.id === teamId)
        if (t && !t.waypointId) updateTeam(teamId, { waypointId: from })
      }
    }
    onClose()
  }

  return (
    <Modal title={isEdit ? 'Edit Route' : 'Add Route'} onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div>
          <label style={labelStyle}>Team</label>
          <select style={fieldStyle} value={teamId} onChange={(e) => setTeamId(e.target.value)}>
            <option value="">— No team (color only) —</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {team && (
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: team.color }} />
              <span style={{ fontSize: 12, color: '#64748b' }}>Route will use {team.name}'s color</span>
            </div>
          )}
        </div>

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

        <button
          type="submit"
          style={{
            padding: '10px 0', borderRadius: 8,
            background: color, color: 'white',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
            opacity: (!from || !to || from === to) ? 0.5 : 1,
          }}
        >
          {isEdit ? 'Save Route' : 'Add Route'}
        </button>
      </form>
    </Modal>
  )
}
