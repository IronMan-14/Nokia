import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ECOSYSTEM } from '../lib/data.js'
import { useReducedMotion } from '../lib/hooks.js'

export default function EcosystemDiagram() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.35 })
  const reduced = useReducedMotion()
  const { center, nodes } = ECOSYSTEM

  return (
    <section id="ecosystem" className="relative px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="eyebrow">Ecosystem</p>
          <h2 className="h-display mt-3 text-4xl sm:text-5xl">One trust layer, everywhere</h2>
          <p className="mt-4 text-slate-400">
            Devices, wearables and EU-hosted services connected by a single on-device identity —
            with an offline mesh so Terra keeps working when the network doesn't.
          </p>
        </div>

        <div ref={ref} className="glass relative mt-14 aspect-[4/3] w-full overflow-hidden p-4 sm:aspect-[16/9]">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
            <defs>
              <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#124191" />
                <stop offset="100%" stopColor="#3DF0FF" />
              </linearGradient>
            </defs>
            {nodes.map((n, i) => (
              <motion.line
                key={n.id}
                x1={center.x} y1={center.y} x2={n.x} y2={n.y}
                stroke="url(#edge)" strokeWidth="0.35" vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={inView ? { pathLength: 1, opacity: 0.85 } : {}}
                transition={{ duration: reduced ? 0 : 0.9, delay: reduced ? 0 : 0.2 + i * 0.12, ease: 'easeInOut' }}
              />
            ))}
            {!reduced && nodes.map((n, i) => (
              <motion.circle
                key={`p-${n.id}`} r="0.8" fill="#3DF0FF"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: [0, 1, 1, 0], cx: [center.x, n.x], cy: [center.y, n.y] } : {}}
                transition={{ duration: 2.4, delay: 1.2 + i * 0.35, repeat: Infinity, repeatDelay: 2.6, ease: 'easeInOut' }}
              />
            ))}
          </svg>

          {/* center node */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${center.x}%`, top: `${center.y}%` }}
          >
            <div className="relative rounded-2xl border border-cyan/40 bg-[#0A0E17] px-5 py-4 text-center shadow-glow">
              <span className="block font-display text-base text-white">{center.label}</span>
              <span className="mt-0.5 block text-[11px] uppercase tracking-[0.18em] text-cyan/80">{center.sub}</span>
              {!reduced && <span className="absolute -inset-3 -z-10 animate-pulse rounded-3xl border border-cyan/15" />}
            </div>
          </motion.div>

          {/* satellites */}
          {nodes.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: reduced ? 0 : 0.7 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${n.x}%`, top: `${n.y}%` }}
            >
              <div className="group cursor-default rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-center backdrop-blur-md transition-colors hover:border-cyan/50">
                <span className="block whitespace-nowrap text-xs font-medium text-white sm:text-sm">{n.label}</span>
                <span className="hidden whitespace-nowrap text-[10px] text-slate-500 sm:block">{n.sub}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <ul className="sr-only">
          <li>{center.label} connects to: {nodes.map((n) => `${n.label} (${n.sub})`).join(', ')}.</li>
        </ul>
      </div>
    </section>
  )
}
