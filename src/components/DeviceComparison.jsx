import { useState } from 'react'
import { motion } from 'framer-motion'
import { DEVICES } from '../lib/data.js'

export default function DeviceComparison({ active, onSelect }) {
  return (
    <section id="devices" className="relative px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="eyebrow">Two devices, one mission</p>
          <h2 className="h-display mt-3 text-4xl sm:text-5xl">
            A flagship that protects. A workhorse that endures.
          </h2>
          <p className="mt-4 text-slate-400">
            The comeback isn't one hero phone. It's a two-device strategy covering the top and
            the volume of the market with the same promise: honesty, longevity, trust.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {Object.values(DEVICES).map((d, i) => (
            <DeviceCard key={d.id} device={d} index={i} active={active === d.id} onSelect={onSelect} />
          ))}
        </div>
      </div>
    </section>
  )
}

function DeviceCard({ device, index, active, onSelect }) {
  const [hover, setHover] = useState(false)
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`glass relative overflow-hidden p-8 transition-colors duration-500 ${active ? 'border-cyan/40' : ''}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full blur-[70px] transition-opacity duration-500"
        style={{ background: device.accent, opacity: hover || active ? 0.22 : 0.1 }}
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="eyebrow" style={{ color: device.accent }}>{device.category}</span>
            <h3 className="h-display mt-2 text-3xl">{device.name}</h3>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">{device.price}</span>
        </div>

        <p className="mt-5 border-l-2 pl-4 font-display text-lg italic leading-snug text-white"
           style={{ borderColor: device.accent }}>
          “{device.tagline}”
        </p>

        <p className="mt-5 text-sm leading-relaxed text-slate-400">{device.blurb}</p>

        <ul className="mt-7 space-y-4">
          {device.pillars.map((p) => (
            <li key={p.title} className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: device.accent }} aria-hidden />
              <div>
                <p className="text-sm font-medium text-white">{p.title}</p>
                <p className="text-sm text-slate-500">{p.body}</p>
              </div>
            </li>
          ))}
        </ul>

        <button
          onClick={() => onSelect(device.id)}
          aria-pressed={active}
          className={`mt-8 w-full rounded-full px-6 py-3 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan
            ${active ? 'bg-white/10 text-white' : 'border border-white/15 text-slate-200 hover:border-cyan/60 hover:text-white'}`}
        >
          {active ? `Viewing ${device.name} in 3D` : `View ${device.name} in 3D`}
        </button>
      </div>
    </motion.article>
  )
}
