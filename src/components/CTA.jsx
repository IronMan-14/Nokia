import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getDeviceTier, TIER_SETTINGS, useReducedMotion } from '../lib/hooks.js'

/** Canvas particle burst on successful signup. Count scales with device tier. */
function Burst({ trigger, accent = '#3DF0FF' }) {
  const canvas = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!trigger || reduced) return
    const c = canvas.current
    if (!c) return
    const ctx = c.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const rect = c.getBoundingClientRect()
    c.width = rect.width * dpr; c.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const count = TIER_SETTINGS[getDeviceTier()].particles
    const cx = rect.width / 2, cy = rect.height / 2
    const parts = Array.from({ length: count }, () => {
      const a = Math.random() * Math.PI * 2
      const s = 1.4 + Math.random() * 4.2
      return { x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.7, r: 1 + Math.random() * 2.2, life: 1 }
    })

    let raf
    const tick = () => {
      ctx.clearRect(0, 0, rect.width, rect.height)
      let alive = false
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy
        p.vy += 0.045; p.vx *= 0.985; p.vy *= 0.985
        p.life -= 0.016
        if (p.life <= 0) continue
        alive = true
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.fillStyle = Math.random() > 0.5 ? accent : '#1E5FD0'
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill()
      }
      ctx.globalAlpha = 1
      if (alive) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [trigger, accent, reduced])

  return <canvas ref={canvas} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />
}

export default function CTA() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState('idle') // idle | error | done
  const [burst, setBurst] = useState(0)

  const submit = (e) => {
    e.preventDefault()
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
    if (!ok) { setState('error'); return }
    setState('done')
    setBurst((n) => n + 1)
  }

  return (
    <section id="waitlist" className="relative overflow-hidden px-6 py-24 sm:py-32">
      <div aria-hidden className="circuit-bg absolute inset-0 opacity-70" />
      <div className="relative mx-auto max-w-3xl text-center">
        <p className="eyebrow">Be first in line</p>
        <h2 className="h-display mt-3 text-4xl sm:text-5xl">
          The comeback needs<span className="block bg-gradient-to-r from-cyan to-nokiaLight bg-clip-text text-transparent">people who still care.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-slate-400">
          Join the concept waitlist for build updates on Aura and Terra. No tracking, no resale —
          which would rather defeat the point.
        </p>

        <div className="relative mx-auto mt-10 max-w-md">
          <Burst trigger={burst} />
          <AnimatePresence mode="wait">
            {state !== 'done' ? (
              <motion.form
                key="form" onSubmit={submit} noValidate
                exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.25 }}
                className="relative flex flex-col gap-3 sm:flex-row"
              >
                <label htmlFor="email" className="sr-only">Email address</label>
                <input
                  id="email" type="email" value={email} inputMode="email" autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={state === 'error'}
                  aria-describedby={state === 'error' ? 'email-err' : undefined}
                  onChange={(e) => { setEmail(e.target.value); if (state === 'error') setState('idle') }}
                  className={`w-full rounded-full border bg-white/[0.04] px-6 py-3.5 text-white placeholder:text-slate-600
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan
                    ${state === 'error' ? 'border-red-400/70' : 'border-white/12'}`}
                />
                <button type="submit" className="btn-primary shrink-0">Join waitlist</button>
              </motion.form>
            ) : (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="glass relative px-6 py-7"
              >
                <p className="font-display text-xl text-white">You're on the list.</p>
                <p className="mt-2 text-sm text-slate-400">
                  We'll reach {email} when the next concept milestone ships.
                </p>
                <button
                  onClick={() => { setState('idle'); setEmail('') }}
                  className="mt-4 text-xs uppercase tracking-[0.18em] text-cyan hover:underline"
                >
                  Add another address
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <p aria-live="polite" className="mt-3 min-h-[1.25rem] text-xs">
            {state === 'error' && <span id="email-err" className="text-red-400">Please enter a valid email address.</span>}
          </p>
        </div>
      </div>
    </section>
  )
}
