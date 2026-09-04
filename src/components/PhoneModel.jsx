import { useMemo, useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

/* ------------------------------------------------------------------ *
 * Procedural textures
 * ------------------------------------------------------------------ */

/** Emissive "UI" texture painted on the screen plane. */
function makeScreenTexture(variant, accent) {
  const w = 512, h = 1024
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const ctx = c.getContext('2d')

  const bg = ctx.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, variant === 'aura' ? '#050A16' : '#0A0906')
  bg.addColorStop(0.55, variant === 'aura' ? '#0B1E44' : '#2A1A08')
  bg.addColorStop(1, '#03050A')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  // soft accent bloom
  const glow = ctx.createRadialGradient(w * 0.5, h * 0.34, 10, w * 0.5, h * 0.34, w * 0.85)
  glow.addColorStop(0, accent + 'AA')
  glow.addColorStop(0.4, accent + '22')
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)

  // status bar
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = '500 22px Inter, sans-serif'
  ctx.fillText('9:41', 40, 60)
  ctx.fillText(variant === 'aura' ? 'PRIVATE' : 'SIM 1 · SIM 2', w - 190, 60)

  // big clock
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '700 130px "Space Grotesk", sans-serif'
  ctx.fillText('09:41', 44, 300)
  ctx.fillStyle = accent
  ctx.font = '500 26px Inter, sans-serif'
  ctx.fillText(variant === 'aura' ? 'On-device AI active' : '5 days battery left', 46, 348)

  // glass widget cards
  const card = (x, y, cw, ch, r) => {
    ctx.beginPath()
    ctx.roundRect(x, y, cw, ch, r)
    ctx.fillStyle = 'rgba(255,255,255,0.09)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'
    ctx.lineWidth = 2
    ctx.stroke()
  }
  card(40, 420, w - 80, 150, 28)
  card(40, 600, (w - 100) / 2, 130, 24)
  card(60 + (w - 100) / 2, 600, (w - 100) / 2, 130, 24)

  // accent progress bars inside cards
  ctx.fillStyle = accent
  ctx.beginPath(); ctx.roundRect(72, 520, (w - 144) * 0.68, 10, 5); ctx.fill()
  ctx.globalAlpha = 0.6
  ctx.beginPath(); ctx.roundRect(90, 690, 120, 8, 4); ctx.fill()
  ctx.beginPath(); ctx.roundRect(300, 690, 90, 8, 4); ctx.fill()
  ctx.globalAlpha = 1

  // app grid
  for (let i = 0; i < 8; i++) {
    const x = 52 + (i % 4) * 108
    const y = 790 + Math.floor(i / 4) * 108
    ctx.beginPath(); ctx.roundRect(x, y, 78, 78, 22)
    ctx.fillStyle = i % 3 === 0 ? accent + '55' : 'rgba(255,255,255,0.11)'
    ctx.fill()
  }

  // home indicator
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.beginPath(); ctx.roundRect(w / 2 - 70, 985, 140, 7, 4); ctx.fill()

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

/** Rugged polymer bump/roughness pattern for Terra's back. */
function makeRuggedTexture() {
  const s = 512
  const c = document.createElement('canvas')
  c.width = s; c.height = s
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#7f7f7f'
  ctx.fillRect(0, 0, s, s)
  // grip dimples
  for (let y = 0; y < s; y += 16) {
    for (let x = 0; x < s; x += 16) {
      const o = (y / 16) % 2 ? 8 : 0
      const g = ctx.createRadialGradient(x + o, y, 0, x + o, y, 7)
      g.addColorStop(0, '#ffffff')
      g.addColorStop(1, '#5a5a5a')
      ctx.fillStyle = g
      ctx.beginPath(); ctx.arc(x + o, y, 6, 0, Math.PI * 2); ctx.fill()
    }
  }
  // noise
  const img = ctx.getImageData(0, 0, s, s)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 34
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(3, 6)
  return tex
}

/* ------------------------------------------------------------------ *
 * PhoneModel
 * Swap-in point for a real GLTF later: keep the same props and replace
 * the meshes below with <primitive object={gltf.scene} />.
 * ------------------------------------------------------------------ */
export default function PhoneModel({
  variant = 'aura',
  color = '#12161F',
  accent = '#3DF0FF',
  autoRotate = true,
  draggable = true,
  scale = 1,
  rotationTargetRef,   // optional external { current: {x, y} } drive (scroll)
  onHotspotFrame,      // optional per-frame callback for projecting hotspots
  hotspots = [],
  quality = 'high',
  ...props
}) {
  const group = useRef()
  const spin = useRef(0)
  const drag = useRef({ active: false, lastX: 0, lastY: 0, velX: 0, velY: 0, x: 0, y: 0, touched: false })
  const { gl, camera, size } = useThree()

  const screenTex = useMemo(() => makeScreenTexture(variant, accent), [variant, accent])
  const ruggedTex = useMemo(() => (variant === 'terra' ? makeRuggedTexture() : null), [variant])

  // Smoothly lerped body colour (no hard cuts on finish switch)
  const targetColor = useMemo(() => new THREE.Color(color), [color])
  const bodyMat = useRef()
  const emissiveTarget = useMemo(() => new THREE.Color(accent), [accent])

  useEffect(() => () => { screenTex?.dispose(); ruggedTex?.dispose() }, [screenTex, ruggedTex])

  /* ------------------------------ drag ------------------------------ */
  useEffect(() => {
    if (!draggable) return
    const el = gl.domElement
    const down = (e) => {
      drag.current.active = true
      drag.current.touched = true
      drag.current.lastX = e.clientX
      drag.current.lastY = e.clientY
      el.setPointerCapture?.(e.pointerId)
      el.style.cursor = 'grabbing'
    }
    const move = (e) => {
      if (!drag.current.active) return
      const dx = e.clientX - drag.current.lastX
      const dy = e.clientY - drag.current.lastY
      drag.current.lastX = e.clientX
      drag.current.lastY = e.clientY
      drag.current.velX = dx * 0.006
      drag.current.velY = dy * 0.004
      drag.current.x += drag.current.velX
      drag.current.y += drag.current.velY
      drag.current.y = THREE.MathUtils.clamp(drag.current.y, -0.55, 0.55)
    }
    const up = (e) => {
      drag.current.active = false
      el.releasePointerCapture?.(e.pointerId)
      el.style.cursor = 'grab'
    }
    el.style.cursor = 'grab'
    el.style.touchAction = 'pan-y'
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      el.style.cursor = ''
    }
  }, [gl, draggable])

  const projected = useRef(new THREE.Vector3())

  useFrame((state, delta) => {
    const d = Math.min(delta, 0.05)
    if (!group.current) return

    // inertia
    if (!drag.current.active) {
      drag.current.velX *= 0.94
      drag.current.velY *= 0.94
      drag.current.x += drag.current.velX
      drag.current.y += drag.current.velY
    }
    if (autoRotate && !drag.current.touched) spin.current += d * 0.28

    const extY = rotationTargetRef?.current?.y ?? 0
    const extX = rotationTargetRef?.current?.x ?? 0

    const targetY = spin.current + drag.current.x + extY
    const targetX = drag.current.y + extX + Math.sin(state.clock.elapsedTime * 0.5) * 0.03

    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, targetY, 6, d)
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, targetX, 6, d)
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.045

    // lerp material colour
    if (bodyMat.current) {
      bodyMat.current.color.lerp(targetColor, 1 - Math.pow(0.001, d))
      bodyMat.current.emissive.lerp(emissiveTarget, 1 - Math.pow(0.01, d))
    }

    // project hotspots to screen space for the HTML overlay
    if (onHotspotFrame && hotspots.length) {
      const out = hotspots.map((h) => {
        projected.current.set(h.pos[0], h.pos[1], h.pos[2])
        group.current.localToWorld(projected.current)
        const worldZ = projected.current.clone()
        projected.current.project(camera)
        // visible only when the point faces the camera
        const facing = worldZ.sub(camera.position).normalize()
        const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(group.current.quaternion)
        return {
          id: h.id,
          x: (projected.current.x * 0.5 + 0.5) * size.width,
          y: (-projected.current.y * 0.5 + 0.5) * size.height,
          visible: normal.dot(facing) < -0.15,
        }
      })
      onHotspotFrame(out)
    }
  })

  const isAura = variant === 'aura'
  const W = 1.06, H = 2.16, D = 0.115

  return (
    <group ref={group} scale={scale} {...props} dispose={null}>
      {/* ---- body / back shell ---- */}
      <RoundedBox
        args={[W, H, D]}
        radius={isAura ? 0.14 : 0.1}
        smoothness={quality === 'low' ? 3 : 6}
        castShadow={quality === 'high'}
        receiveShadow={quality === 'high'}
      >
        <meshPhysicalMaterial
          ref={bodyMat}
          color={color}
          metalness={isAura ? 0.15 : 0.05}
          roughness={isAura ? 0.42 : 0.85}
          clearcoat={isAura ? 0.7 : 0.05}
          clearcoatRoughness={isAura ? 0.35 : 0.8}
          bumpMap={ruggedTex || undefined}
          bumpScale={isAura ? 0 : 0.035}
          emissive={accent}
          emissiveIntensity={0.02}
        />
      </RoundedBox>

      {/* ---- aluminium mid-frame ---- */}
      <RoundedBox
        args={[W + 0.035, H + 0.035, D * 0.72]}
        radius={isAura ? 0.15 : 0.11}
        smoothness={quality === 'low' ? 3 : 5}
      >
        <meshStandardMaterial
          color={isAura ? '#C6CBD3' : '#6D7681'}
          metalness={0.98}
          roughness={isAura ? 0.22 : 0.45}
        />
      </RoundedBox>

      {/* Terra bumper corners */}
      {!isAura && [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sy], i) => (
        <RoundedBox key={i} args={[0.3, 0.34, D + 0.09]} radius={0.07} smoothness={3}
          position={[sx * (W / 2 - 0.06), sy * (H / 2 - 0.08), 0]}>
          <meshStandardMaterial color="#20262E" metalness={0.1} roughness={0.95} />
        </RoundedBox>
      ))}

      {/* ---- glass screen plane ---- */}
      <mesh position={[0, 0, D / 2 + 0.004]}>
        <planeGeometry args={[W - 0.075, H - 0.085]} />
        <meshBasicMaterial map={screenTex} toneMapped={false} />
      </mesh>
      {/* glass sheen over the screen */}
      <mesh position={[0, 0, D / 2 + 0.008]}>
        <planeGeometry args={[W - 0.05, H - 0.06]} />
        <meshPhysicalMaterial
          transparent opacity={0.16} roughness={0.06} metalness={0}
          transmission={0.4} thickness={0.05} color="#ffffff"
        />
      </mesh>

      {/* ---- camera module (own mesh, high metalness) ---- */}
      <group position={[-W / 2 + 0.33, H / 2 - 0.36, -D / 2 - 0.028]}>
        <RoundedBox args={[0.52, isAura ? 0.52 : 0.44, 0.06]} radius={isAura ? 0.16 : 0.1} smoothness={4}>
          <meshStandardMaterial color={isAura ? '#1A1F29' : '#2A2F36'} metalness={0.9} roughness={0.22} />
        </RoundedBox>
        {(isAura ? [[-0.11, 0.11], [0.11, 0.11], [-0.11, -0.11]] : [[-0.1, 0.06], [0.1, 0.06]]).map(([x, y], i) => (
          <group key={i} position={[x, y, -0.038]}>
            <mesh>
              <cylinderGeometry args={[0.078, 0.078, 0.03, 24]} />
              <meshStandardMaterial color="#8E96A2" metalness={1} roughness={0.15} />
            </mesh>
            <mesh position={[0, 0, -0.012]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.055, 0.055, 0.012, 24]} />
              <meshPhysicalMaterial color="#05070C" metalness={0.6} roughness={0.05}
                clearcoat={1} emissive={accent} emissiveIntensity={0.35} />
            </mesh>
          </group>
        ))}
        {/* flash */}
        <mesh position={[isAura ? 0.11 : 0, isAura ? -0.11 : -0.11, -0.034]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.032, 0.032, 0.012, 16]} />
          <meshStandardMaterial color="#FFF3D0" emissive="#FFE9B0" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* ---- side keys ---- */}
      <mesh position={[W / 2 + 0.014, 0.34, 0]}>
        <boxGeometry args={[0.02, 0.3, D * 0.5]} />
        <meshStandardMaterial color="#AEB5BF" metalness={1} roughness={0.3} />
      </mesh>
      {/* privacy key (Aura) / PTT key (Terra) — accent coloured */}
      <mesh position={[W / 2 + 0.014, -0.22, 0]}>
        <boxGeometry args={[0.022, 0.17, D * 0.5]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} metalness={0.6} roughness={0.3} />
      </mesh>

      {/* ---- back branding bar ---- */}
      <mesh position={[0, -H / 2 + 0.28, -D / 2 - 0.002]}>
        <planeGeometry args={[0.46, 0.03]} />
        <meshStandardMaterial color={isAura ? '#8B93A0' : '#C3C9D1'} metalness={0.9} roughness={0.35} />
      </mesh>
    </group>
  )
}
