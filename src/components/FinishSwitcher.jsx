export default function FinishSwitcher({ finishes, value, onChange, label = 'Finish' }) {
  return (
    <div className="flex items-center gap-3" role="radiogroup" aria-label={`${label} selector`}>
      <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <div className="flex gap-2">
        {finishes.map((f) => {
          const active = value === f.id
          return (
            <button
              key={f.id}
              role="radio"
              aria-checked={active}
              aria-label={f.label}
              title={f.label}
              onClick={() => onChange(f)}
              className={`relative h-8 w-8 rounded-full border transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan
                ${active ? 'scale-110 border-cyan' : 'border-white/20 hover:border-white/50'}`}
              style={{ background: f.color }}
            >
              {active && <span className="absolute -inset-1.5 rounded-full border border-cyan/40" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
