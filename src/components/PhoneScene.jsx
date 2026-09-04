import { Suspense, useState, useRef, useEffect, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { Environment, Lightformer, ContactShadows, Float, AdaptiveDpr, PerformanceMonitor } from '@react-three/drei'
import PhoneModel from './PhoneModel.jsx'
import { getDeviceTier, TIER_SETTINGS, useReducedMotion } from '../lib/hooks.js'

/**
 * Lazy-mounted R3F canvas. Shows a lightweight CSS/SVG poster until the
 * section is in view AND the browser is idle, so the 3D never blocks first paint.
 */
export default function PhoneScene({
  variant = 'aura',
  color,
  accent,
  autoRotate = true,
  draggable = true,
  rotationTargetRef,
  hotspots = [],
  onHotspotFrame,
  cameraZ = 6.4,
  className = '',
  posterLabel = 'Nokia concept device',
}) {
  const wrap = useRef(null)
  const [mounted, setMounted] = useState(false)
  const [ready, setReady] = useState(false)
  const reduced = useReducedMotion()
  const tier = getDeviceTier()
  const q = TIER_SETTINGS[tier]

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    let idle
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const cb = () => setMounted(true)
      idle = window.requestIdleCallback ? requestIdleCallback(cb, { timeout: 1200 }) : setTimeout(cb, 200)
    }, { rootMargin: '200px' })
    io.observe(el)
    return () => { io.disconnect(); if (idle) (window.cancelIdleCallback || clearTimeout)(idle) }
  }, [])

  const [dprCap, setDprCap] = useState(q.dpr)

  // Drag is handled by a plain DOM surface sized to the phone, NOT the canvas.
  // touch-action:pan-y on it means vertical swipes still scroll the page on
  // mobile while horizontal drags spin the device.
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0, velX: 0, velY: 0, x: 0, y: 0, touched: false })

  const onDown = useCallback((e) => {
    if (!draggable) return
    const d = dragRef.current
    d.active = true; d.touched = true
    d.lastX = e.clientX; d.lastY = e.clientY
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }, [draggable])

  const onMove = useCallback((e) => {
    const d = dragRef.current
    if (!d.active) return
    const dx = e.clientX - d.lastX
    const dy = e.clientY - d.lastY
    d.lastX = e.clientX; d.lastY = e.clientY
    d.velX = dx * 0.006
    d.velY = dy * 0.004
    d.x += d.velX
    d.y = Math.max(-0.55, Math.min(0.55, d.y + d.velY))
  }, [])

  const onUp = useCallback((e) => {
    const d = dragRef.current
    d.active = false
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  }, [])

  return (
    <div ref={wrap} className={`relative h-full w-full ${className}`}>
      {/* volumetric glow behind the phone */}
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="h-[62%] w-[42%] rounded-full blur-[90px] opacity-70 transition-colors duration-700"
          style={{ background: `radial-gradient(circle, ${accent}55, #12419155 45%, transparent 70%)` }}
        />
      </div>

      {/* poster */}
      <div
        aria-hidden={ready}
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${ready ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
      >
        <Poster accent={accent} color={color} label={posterLabel} />
      </div>

      {mounted && (
        <Canvas
          className="!absolute inset-0"
          // The canvas covers a huge area; letting it capture pointer events made
          // the page feel unscrollable. Events pass through except on the phone,
          // which re-enables them on its own group.
          style={{ pointerEvents: 'none', touchAction: 'pan-y' }}
          eventPrefix="client"
          dpr={dprCap}
          shadows={q.shadows}
          gl={{
            antialias: q.aa,
            powerPreference: 'high-performance',
            alpha: true,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false,
            toneMapping: THREE.ACESFilmicToneMapping,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
          camera={{ position: [0, 0, cameraZ], fov: 30 }}
          onCreated={() => requestAnimationFrame(() => setReady(true))}
        >
          <PerformanceMonitor onDecline={() => setDprCap([1, 1])} />
          <AdaptiveDpr pixelated={false} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[4, 6, 5]} intensity={2.4} castShadow={q.shadows} />
          <directionalLight position={[-5, 2, -4]} intensity={1.2} color={accent} />
          <spotLight position={[0, 4, 3]} angle={0.6} penumbra={1} intensity={18} color="#ffffff" />
          <pointLight position={[0, -3, 2]} intensity={12} color="#124191" distance={9} />
          <Suspense fallback={null}>
            <Float
              speed={reduced ? 0 : 0.8}
              rotationIntensity={reduced ? 0 : 0.05}
              floatIntensity={reduced ? 0 : 0.18}
            >
              <PhoneModel
                variant={variant}
                color={color}
                accent={accent}
                autoRotate={autoRotate && !reduced}
                rotationTargetRef={rotationTargetRef}
                externalDragRef={dragRef}
                hotspots={hotspots}
                onHotspotFrame={onHotspotFrame}
                quality={tier}
              />
            </Float>
            {/* Self-contained studio environment (no CDN HDRI fetch — works offline
                and never stalls Suspense). Swap for <Environment files="/studio.hdr" />
                once a real HDRI asset is added. */}
            <Environment resolution={tier === 'low' ? 64 : 256} environmentIntensity={q.envIntensity}>
              <color attach="background" args={['#05070C']} />
              {/* key softbox */}
              <Lightformer intensity={3.2} position={[0, 3.5, 2]} rotation={[Math.PI / 2, 0, 0]} scale={[8, 4, 1]} />
              {/* side strips for the aluminium frame highlights */}
              <Lightformer form="rect" intensity={2.4} color="#ffffff" position={[-4, 1, 1]} rotation={[0, Math.PI / 2, 0]} scale={[6, 3, 1]} />
              <Lightformer form="rect" intensity={1.8} color={accent} position={[4, 0, 1]} rotation={[0, -Math.PI / 2, 0]} scale={[6, 3, 1]} />
              {/* rim + fill */}
              <Lightformer form="ring" intensity={2} color="#124191" position={[0, -2.5, -3]} scale={5} />
              <Lightformer form="circle" intensity={1.2} color="#ffffff" position={[0, 0, 5]} scale={4} />
            </Environment>
          </Suspense>
          {q.shadows && (
            <ContactShadows position={[0, -1.5, 0]} opacity={0.5} scale={7} blur={2.6} far={3} />
          )}
        </Canvas>
      )}

      {/* Drag surface: only this region (roughly the phone) receives pointer
          events, so the rest of the hero scrolls normally. */}
      {mounted && draggable && (
        <div
          className="absolute left-1/2 top-1/2 h-[70%] w-[min(38%,320px)] -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'pan-y' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          aria-hidden
        />
      )}
    </div>
  )
}

function Poster({ accent = '#3DF0FF', color = '#12161F', label }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center" role="img" aria-label={`${label} — loading 3D preview`}>
      <div
        className="relative h-[58%] max-h-[440px] w-auto aspect-[9/19.5] rounded-[2rem] border border-white/15"
        style={{ background: `linear-gradient(160deg, ${color}, #05070C)`, boxShadow: `0 0 90px -20px ${accent}66` }}
      >
        <div className="absolute inset-[6px] rounded-[1.7rem] bg-gradient-to-b from-white/[0.07] to-transparent" />
        <div className="absolute left-1/2 top-4 h-1.5 w-16 -translate-x-1/2 rounded-full bg-white/25" />
        <div className="absolute inset-x-6 top-1/3 space-y-3">
          <div className="h-2.5 w-24 rounded-full" style={{ background: accent, opacity: 0.8 }} />
          <div className="h-2 w-32 rounded-full bg-white/20" />
          <div className="h-2 w-20 rounded-full bg-white/10" />
        </div>
        <div className="absolute inset-x-6 bottom-8 grid grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl" style={{ background: i % 3 === 0 ? accent + '44' : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>
      </div>
      <span className="absolute bottom-4 text-[11px] uppercase tracking-[0.2em] text-slate-500">Loading 3D preview…</span>
    </div>
  )
}
