import { useState } from 'react'
import { motion } from 'framer-motion'
import PhoneScene from './LazyPhoneScene.jsx'
import PhoneCarousel from './PhoneCarousel.jsx'
import FinishSwitcher from './FinishSwitcher.jsx'
import { DEVICES } from '../lib/data.js'
import { useReducedMotion } from '../lib/hooks.js'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: 0.15 + i * 0.09, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
}

export default function Hero({ device, finish, onFinishChange, use3D, onToggle3D }) {
  const reduced = useReducedMotion()
  const [showFallback, setShowFallback] = useState(false)
  const d = DEVICES[device]

  const slides = d.finishes.map((f, i) => ({
    color: f.color,
    title: `${d.name} — ${f.label}`,
    body: d.pillars[i % d.pillars.length].body,
  }))

  return (
    <section id="hero" className="relative min-h-[100svh] w-full overflow-hidden grain">
      <div aria-hidden className="circuit-bg absolute inset-0" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#0A0E17]" />

      {/* 3D layer */}
      <div className="absolute inset-0 md:left-[38%]">
        {use3D && !showFallback ? (
          <PhoneScene
            variant={d.id}
            color={finish.color}
            accent={d.accent}
            autoRotate={!reduced}
            posterLabel={d.name}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6 pt-32 md:pt-6">
            <PhoneCarousel device={d} slides={slides} />
          </div>
        )}
      </div>

      {/* copy */}
      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col justify-center px-6 pb-24 pt-28 md:pb-0">
        <div className="max-w-xl">
          <motion.p variants={fadeUp} initial="hidden" animate="show" custom={0} className="eyebrow">
            Concept study · Not a real Nokia product
          </motion.p>

          <motion.h1
            variants={fadeUp} initial="hidden" animate="show" custom={1}
            className="h-display mt-5 text-[13vw] leading-[0.92] sm:text-6xl lg:text-7xl"
          >
            The Comeback,
            <span className="block bg-gradient-to-r from-white via-cyan to-nokiaLight bg-clip-text text-transparent">
              Reimagined.
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} initial="hidden" animate="show" custom={2}
            className="mt-6 max-w-md text-base leading-relaxed text-slate-400 sm:text-lg">
            Two devices, one mission. A privacy-first flagship and a rugged everyday workhorse —
            a strategic case study in what a Nokia return could look like.
          </motion.p>

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3}
            className="mt-9 flex flex-wrap items-center gap-3">
            <a href="#waitlist" className="btn-primary">Join the waitlist</a>
            <a href="#devices" className="btn-ghost">Compare devices</a>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4}
            className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <FinishSwitcher finishes={d.finishes} value={finish.id} onChange={onFinishChange} />
            <button
              onClick={() => { setShowFallback((s) => !s); onToggle3D?.(!showFallback) }}
              className="text-xs uppercase tracking-[0.18em] text-slate-500 underline-offset-4 transition-colors hover:text-cyan focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
            >
              {showFallback ? 'Enable 3D view' : 'Use 2D carousel instead'}
            </button>
          </motion.div>

          {use3D && !showFallback && (
            <p className="mt-5 text-xs text-slate-600">Drag the device to rotate it.</p>
          )}
        </div>
      </div>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
        className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-center"
      >
        <span className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-slate-500">Scroll</span>
        <span className="mx-auto flex h-9 w-5 items-start justify-center rounded-full border border-white/20 p-1">
          <motion.span
            className="block h-1.5 w-1 rounded-full bg-cyan"
            animate={reduced ? {} : { y: [0, 12, 0], opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </span>
      </motion.div>
    </section>
  )
}
