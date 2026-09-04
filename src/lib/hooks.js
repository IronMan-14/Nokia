import { useEffect, useState } from 'react'

/** Respects prefers-reduced-motion, live-updating. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = (e) => setReduced(e.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

export function useMediaQuery(query) {
  const [match, setMatch] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(query).matches
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = (e) => setMatch(e.matches)
    setMatch(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return match
}

export const useIsMobile = () => useMediaQuery('(max-width: 767px)')

/**
 * Very cheap GPU/device tier check: 'low' | 'mid' | 'high'.
 * Used to degrade shadows, DPR and particle counts.
 */
let cachedTier = null
export function getDeviceTier() {
  if (cachedTier) return cachedTier
  if (typeof window === 'undefined') return 'mid'
  let tier = 'high'
  try {
    const cores = navigator.hardwareConcurrency || 4
    const mem = navigator.deviceMemory || 4
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!gl) tier = 'low'
    else {
      const dbg = gl.getExtension('WEBGL_debug_renderer_info')
      const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : ''
      if (/swiftshader|llvmpipe|software|mesa offscreen/i.test(renderer)) tier = 'low'
      else if (cores <= 4 || mem <= 4 || coarse) tier = 'mid'
      if (cores <= 2 || mem <= 2) tier = 'low'
    }
  } catch { tier = 'low' }
  cachedTier = tier
  return tier
}

export const TIER_SETTINGS = {
  low:  { dpr: [1, 1],   shadows: false, particles: 24,  envIntensity: 0.6, aa: false },
  mid:  { dpr: [1, 1.5], shadows: false, particles: 48,  envIntensity: 0.9, aa: true  },
  high: { dpr: [1, 2],   shadows: true,  particles: 90,  envIntensity: 1.1, aa: true  },
}

/** Fires once when the element scrolls into view. */
export function useInView(ref, { threshold = 0.3, once = true } = {}) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) { setInView(true); if (once) io.disconnect() }
        else if (!once) setInView(false)
      },
      { threshold }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, threshold, once])
  return inView
}
