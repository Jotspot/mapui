const COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6',
  '#F43F5E', '#06B6D4', '#84CC16', '#A855F7',
]

export default function ColorPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          style={{
            width: 28, height: 28, borderRadius: '50%',
            background: c,
            border: value === c ? '3px solid #1e293b' : '2px solid transparent',
            outline: value === c ? '2px solid white' : 'none',
            outlineOffset: 1,
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}
        />
      ))}
    </div>
  )
}
