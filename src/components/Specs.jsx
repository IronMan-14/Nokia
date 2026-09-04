import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { SPECS, COUNTERS, DEVICES } from '../lib/data.js'
import { useInView, useReducedMotion } from '../lib/hooks.js'

function Counter({ value, suffix = '', duration = 1600 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { threshold: 0.5 })
  const reduced = useReducedMotion()
  const [n, setN] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduced) { setN(value); return }
    let raf, start
    const step = (t) => {
      if (!start) start = t
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setN(Math.round(value * eased))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, duration, reduced])

  return (
    <span ref={ref} className="h-display text-4xl tabular-nums sm:text-5xl">
      {n.toLocaleString()}<span className="text-cyan">{suffix}</span>
    </span>
  )
}

export default function Specs() {
  return (
    <section id="specs" className="relative px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="eyebrow">Specifications</p>
          <h2 className="h-display mt-3 text-4xl sm:text-5xl">The numbers behind the promise</h2>
          <p className="mt-4 text-slate-400">Indicative concept targets for the case study — not final hardware.</p>
        </div>

        {/* animated counters */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COUNTERS.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="glass p-6"
            >
              <Counter value={c.value} suffix={c.suffix} />
              <p className="mt-3 text-sm text-slate-300">{c.label}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-600">{c.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* spec table */}
        <div className="glass mt-10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <caption className="sr-only">Nokia Aura and Nokia Terra concept specifications</caption>
              <thead>
                <tr className="border-b border-white/10">
                  <th scope="col" className="w-1/3 px-6 py-5 text-[11px] uppercase tracking-[0.2em] text-slate-500">Specification</th>
                  <th scope="col" className="px-6 py-5 font-display text-base text-white">
                    {DEVICES.aura.name}
                    <span className="ml-2 inline-block h-2 w-2 rounded-full align-middle" style={{ background: DEVICES.aura.accent }} />
                  </th>
                  <th scope="col" className="px-6 py-5 font-display text-base text-white">
                    {DEVICES.terra.name}
                    <span className="ml-2 inline-block h-2 w-2 rounded-full align-middle" style={{ background: DEVICES.terra.accent }} />
                  </th>
                </tr>
              </thead>
              {SPECS.map((g) => (
                <tbody key={g.group}>
                  <tr className="bg-white/[0.03]">
                    <th scope="rowgroup" colSpan={3} className="px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-cyan/80">
                      {g.group}
                    </th>
                  </tr>
                  {g.rows.map((r) => (
                    <tr key={r.label} className="border-t border-white/[0.06] transition-colors hover:bg-white/[0.025]">
                      <th scope="row" className="px-6 py-4 font-normal text-slate-500">{r.label}</th>
                      <td className="px-6 py-4 text-slate-200">{r.aura}</td>
                      <td className="px-6 py-4 text-slate-200">{r.terra}</td>
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
