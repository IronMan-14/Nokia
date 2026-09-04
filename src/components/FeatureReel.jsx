import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import PhoneScene from './LazyPhoneScene.jsx'
import { HOTSPOTS, DEVICES } from '../lib/data.js'
import { useIsMobile, useReducedMotion } from '../lib/hooks.js'

gsap.registerPlugin(ScrollTrigger)

/**
 * Desktop: pinned section, scroll scrubs the phone rotation while feature
 * callouts cross-fade and hotspot markers track projected 3D positions.
 * Mobile / reduced-motion: swipeable feature cards, no pinning.
 */
export default function FeatureReel({ device, finish }) {
  const isMobile = useIsMobile()
  const reduced = useReducedMotion()
  const d = DEVICES[device]

  if (isMobile || reduced) return <FeatureCards device={d} finish={finish} reduced={reduced} />
  return <FeaturePinned device={d} finish={finish} />
}

/* ------------------------- desktop pin & scrub ------------------------- */
function FeaturePinned({ device, finish }) {
  const root = useRef(null)
  const rotation = useRef({ x: 0, y: 0 })
  const [active, setActive] = useState(0)
  const [markers, setMarkers] = useState([])
  const [hovered, setHovered] = useState(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const st = ScrollTrigger.create({
        trigger: root.current,
        start: 'top top',
        end: () => `+=${HOTSPOTS.length * 38}%`,
        pin: '.reel-stage',
        pinSpacing: true,
        anticipatePin: 1,
        // scrub:true tracks the wheel exactly; a numeric scrub adds catch-up
        // lag that feels like the page is dragging behind the user.
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress
          // camera/phone orbit driven purely by scroll progress
          rotation.current.y = -0.5 + p * (Math.PI * 1.35)
          rotation.current.x = Math.sin(p * Math.PI) * 0.22
          const idx = Math.min(HOTSPOTS.length - 1, Math.floor(p * HOTSPOTS.length + 0.15))
          setActive(idx)
        },
      })
      return () => st.kill()
    }, root)
    return () => ctx.revert()
  }, [])

  const hs = HOTSPOTS[active]

  return (
    <section id="features" ref={root} className="relative" style={{ height: `${100 + HOTSPOTS.length * 38}vh` }}>
      <div className="reel-stage relative h-[100svh] w-full overflow-hidden">
        <div aria-hidden className="circuit-bg absolute inset-0 opacity-60" />

        <div className="pointer-events-none absolute left-1/2 top-10 z-20 -translate-x-1/2 text-center">
          <p className="eyebrow">Feature reel</p>
          <h2 className="h-display mt-2 text-2xl sm:text-3xl">Engineered in the open</h2>
        </div>

        {/* 3D stage + projected hotspot markers */}
        <div className="absolute inset-0">
          <PhoneScene
            variant={device.id}
            color={finish.color}
            accent={device.accent}
            autoRotate={false}
            rotationTargetRef={rotation}
            hotspots={HOTSPOTS}
            onHotspotFrame={setMarkers}
            cameraZ={4}
            posterLabel={device.name}
          />
          {markers.map((m) => {
            const spot = HOTSPOTS.find((h) => h.id === m.id)
            const isActive = spot.id === hs.id
            if (!m.visible) return null
            return (
              <button
                key={m.id}
                className="group absolute z-20 -translate-x-1/2 -translate-y-1/2 focus:outline-none"
                style={{ left: m.x, top: m.y }}
                onMouseEnter={() => setHovered(spot.id)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(spot.id)}
                onBlur={() => setHovered(null)}
                aria-label={spot.label}
              >
                <span className={`relative block h-3.5 w-3.5 rounded-full border transition-all duration-300
                  ${isActive || hovered === spot.id ? 'scale-125 border-cyan bg-cyan' : 'border-white/60 bg-white/20'}`}>
                  {(isActive || hovered === spot.id) && (
                    <span className="absolute -inset-2 animate-ping rounded-full border border-cyan/50" />
                  )}
                </span>
                <AnimatePresence>
                  {hovered === spot.id && (
                    <motion.span
                      initial={{ opacity: 0, y: 6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.96 }}
                      transition={{ duration: 0.22 }}
                      className="glass absolute left-1/2 top-6 z-30 w-60 -translate-x-1/2 p-3 text-left"
                    >
                      <span className="block font-display text-sm text-white">{spot.label}</span>
                      <span className="mt-1 block text-xs leading-relaxed text-slate-400">{spot.body}</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            )
          })}
        </div>

        {/* pinned callout */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-full max-w-md items-center px-6 lg:px-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={hs.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="glass pointer-events-auto p-7"
            >
              <span className="eyebrow">0{active + 1} / 0{HOTSPOTS.length}</span>
              <h3 className="h-display mt-3 text-3xl">{hs.label}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{hs.body}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* progress rail */}
        <div className="absolute right-8 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-3 lg:flex" aria-hidden>
          {HOTSPOTS.map((h, i) => (
            <span key={h.id} className={`h-8 w-[2px] rounded-full transition-colors duration-300 ${i === active ? 'bg-cyan' : 'bg-white/15'}`} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------------- mobile / reduced motion ---------------------- */
function FeatureCards({ device, reduced }) {
  return (
    <section id="features" className="relative px-6 py-24">
      <div aria-hidden className="circuit-bg absolute inset-0 opacity-50" />
      <div className="relative mx-auto max-w-6xl">
        <p className="eyebrow">Feature reel</p>
        <h2 className="h-display mt-2 text-3xl">Engineered in the open</h2>
        <p className="mt-3 max-w-md text-sm text-slate-400">
          {reduced ? 'Reduced-motion view — swipe or scroll the cards below.' : 'Swipe through the details.'}
        </p>

        <div className="-mx-6 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {HOTSPOTS.map((h, i) => (
            <article key={h.id} className="glass w-[78vw] max-w-sm shrink-0 snap-center p-6 md:w-80">
              <div
                className="mb-5 h-32 rounded-xl border border-white/10"
                style={{ background: `radial-gradient(circle at 40% 30%, ${device.accent}33, #070B14 70%)` }}
                aria-hidden
              />
              <span className="eyebrow">0{i + 1}</span>
              <h3 className="h-display mt-2 text-xl">{h.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{h.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
