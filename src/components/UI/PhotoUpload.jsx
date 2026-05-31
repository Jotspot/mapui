import { useRef } from 'react'
import { processPhoto } from '../../utils/imageUtils.js'

export default function PhotoUpload({ value, onChange }) {
  const ref = useRef()

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const dataUrl = await processPhoto(file)
    onChange(dataUrl)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {value && (
        <img
          src={value}
          alt="preview"
          style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }}
        />
      )}
      <button
        type="button"
        onClick={() => ref.current.click()}
        style={{
          padding: '6px 14px', borderRadius: 6,
          background: '#f1f5f9', border: '1px solid #cbd5e1',
          fontSize: 13, color: '#475569', cursor: 'pointer',
        }}
      >
        {value ? 'Change Photo' : 'Upload Photo'}
      </button>
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          style={{ fontSize: 12, color: '#94a3b8', cursor: 'pointer' }}
        >
          Remove
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
    </div>
  )
}
