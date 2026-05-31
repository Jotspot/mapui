import { useState } from 'react'
import Modal from './Modal.jsx'
import ColorPicker from '../UI/ColorPicker.jsx'
import PhotoUpload from '../UI/PhotoUpload.jsx'
import useAppStore from '../../store/useAppStore.js'

const fieldStyle = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1.5px solid #e2e8f0', fontSize: 14, color: '#1e293b',
  outline: 'none',
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }

export default function AddTeamModal({ initial, onClose }) {
  const addTeam = useAppStore((s) => s.addTeam)
  const updateTeam = useAppStore((s) => s.updateTeam)

  const [name, setName] = useState(initial?.name || '')
  const [color, setColor] = useState(initial?.color || '#EF4444')
  const [photo, setPhoto] = useState(initial?.photoDataUrl || null)

  const submit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    if (initial?.id) {
      updateTeam(initial.id, { name: name.trim(), color, photoDataUrl: photo })
    } else {
      addTeam({ name: name.trim(), color, photoDataUrl: photo })
    }
    onClose()
  }

  return (
    <Modal title={initial?.id ? 'Edit Team' : 'Add Team'} onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Team Name</label>
          <input
            style={fieldStyle}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. BEN/ADAM"
            autoFocus
          />
        </div>
        <div>
          <label style={labelStyle}>Team Color</label>
          <ColorPicker value={color} onChange={setColor} />
        </div>
        <div>
          <label style={labelStyle}>Photo (optional)</label>
          <PhotoUpload value={photo} onChange={setPhoto} />
        </div>
        <button
          type="submit"
          style={{
            padding: '10px 0', borderRadius: 8, background: color,
            color: 'white', fontWeight: 700, fontSize: 14,
            marginTop: 4, cursor: 'pointer',
          }}
        >
          {initial?.id ? 'Save Changes' : 'Add Team'}
        </button>
      </form>
    </Modal>
  )
}
