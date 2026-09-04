import { useEffect, useState } from 'react'
import Lenis from '@studio-freight/lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Hero from './components/Hero.jsx'
import FeatureReel from './components/FeatureReel.jsx'
import DeviceComparison from './components/DeviceComparison.jsx'
import EcosystemDiagram from './components/EcosystemDiagram.jsx'
import Specs from './components/Specs.jsx'
import CTA from './components/CTA.jsx'
import { DEVICES } from './lib/data.js'
import { useReducedMotion, getDeviceTier } from './lib/hooks.js'

const NAV = [
  { href: '#features', label: 'Features' },
  { href: '#devices', label: 'Devices' },
  { href: '#ecosystem', label: 'Ecosystem' },
  { href: '#specs', label: 'Specs' },
]

export default function App() {
  const [device, setDevice] = useState('aura')
  const [finish, setFinish] = useState(DEVICES.aura.finishes[0])
  const [use3D, setUse3D] = useState(true)
  const reduced = useReducedMotion()

  // keep the finish valid when the device changes
  useEffect(() => { setFinish(DEVICES[device].finishes[0]) }, [device])

  // Lenis smooth scroll, synced to GSAP ScrollTrigger. Disabled for reduced motion.
  useEffect(() => {
    if (reduced || getDeviceTier() === 'low') return
    gsap.registerPlugin(ScrollTrigger)
    // lerp (not duration) keeps the wheel 1:1 with a short settle, so the page
    // stops when the user stops instead of gliding on with its own momentum.
    const lenis = new Lenis({
      lerp: 0.16,
      wheelMultiplier: 1,
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.6,
    })
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    return () => { gsap.ticker.remove(raf); lenis.destroy() }
  }, [reduced])

  // Switch the 3D device in place. Previously this yanked the user back up to
  // the hero, which read as the page scrolling on its own — the comparison
  // cards now just swap the active device and stay put.
  const selectDevice = (id) => setDevice(id)

  return (
    <div className="relative min-h-screen bg-base text-slate-300">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-nokia focus:px-5 focus:py-2 focus:text-white">
        Skip to content
      </a>

      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/[0.06] bg-[#0A0E17]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#hero" className="flex items-center gap-3">
            <span className="font-display text-lg tracking-[0.28em] text-white">NOKIA</span>
            <span className="hidden rounded-full border border-cyan/30 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-cyan/90 sm:inline">
              Concept
            </span>
          </a>
          <nav aria-label="Sections" className="hidden gap-8 md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="text-sm text-slate-400 transition-colors hover:text-white">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-white/10 p-1 sm:flex" role="tablist" aria-label="Choose device">
              {Object.values(DEVICES).map((d) => (
                <button
                  key={d.id}
                  role="tab"
                  aria-selected={device === d.id}
                  onClick={() => setDevice(d.id)}
                  className={`rounded-full px-3 py-1 text-xs transition-colors ${device === d.id ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {d.name.split(' ')[1]}
                </button>
              ))}
            </div>
            <a href="#waitlist" className="btn-primary !px-4 !py-2 text-sm">Waitlist</a>
          </div>
        </div>
      </header>

      <main id="main">
        <Hero
          device={device}
          finish={finish}
          onFinishChange={setFinish}
          use3D={use3D}
          onToggle3D={(off) => setUse3D(!off)}
        />
        <FeatureReel device={device} finish={finish} />
        <DeviceComparison active={device} onSelect={selectDevice} />
        <EcosystemDiagram />
        <Specs />
        <CTA />
      </main>

      <footer className="border-t border-white/[0.06] px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl">
            <strong className="text-slate-400">Concept illustration.</strong> Nokia Aura and Nokia Terra are
            speculative devices created for a strategic case study. They are not real, announced or endorsed
            products, and all imagery is an artistic rendering. Nokia is a trademark of its respective owner.
          </p>
          <p className="shrink-0">© {new Date().getFullYear()} Case study · Design fiction</p>
        </div>
      </footer>
    </div>
  )
}
