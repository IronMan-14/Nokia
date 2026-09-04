import { useState } from 'react'

/**
 * Non-3D fallback: keyboard-navigable image/CSS carousel shown when the user
 * opts out of 3D (or lands on a low-tier device / reduced-motion setup).
 */
export default function PhoneCarousel({ device, slides }) {
  const [i, setI] = useState(0)
  const go = (n) => setI((p) => (p + n + slides.length) % slides.length)

  return (
    <div className="glass w-full max-w-lg p-6">
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10"
        style={{ background: `radial-gradient(circle at 50% 30%, ${device.accent}22, #05070C 70%)` }}
        role="group"
        aria-roledescription="carousel"
        aria-label={`${device.name} views`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') { e.preventDefault(); go(1) }
          if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1) }
        }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
          <div
            className="h-32 w-[74px] rounded-2xl border border-white/20"
            style={{ background: `linear-gradient(150deg, ${slides[i].color}, #05070C)` }}
          />
          <p className="font-display text-lg text-white">{slides[i].title}</p>
          <p className="max-w-xs text-sm text-slate-400">{slides[i].body}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button className="btn-ghost !px-4 !py-2 text-sm" onClick={() => go(-1)} aria-label="Previous view">←</button>
        <div className="flex gap-2" aria-hidden>
          {slides.map((_, n) => (
            <span key={n} className={`h-1.5 rounded-full transition-all ${n === i ? 'w-6 bg-cyan' : 'w-1.5 bg-white/25'}`} />
          ))}
        </div>
        <button className="btn-ghost !px-4 !py-2 text-sm" onClick={() => go(1)} aria-label="Next view">→</button>
      </div>
      <p className="mt-3 text-center text-xs text-slate-500">
        Slide {i + 1} of {slides.length} · use ← → keys
      </p>
    </div>
  )
}
