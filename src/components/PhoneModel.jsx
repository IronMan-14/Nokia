import { useMemo, useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

/* ------------------------------------------------------------------ *
 * Procedural textures
 * ------------------------------------------------------------------ */

/** Emissive "UI" texture for the screen, clipped to rounded corners so the
 *  glass reads as a real display rather than a pasted-on rectangle. */
function makeScreenTexture(variant, accent) {
  const w = 1024, h = 2048
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const ctx = c.getContext('2d')

  // everything outside the rounded display area stays pure black = bezel
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, w, h)
  ctx.save()
  const inset = 26, r = 120
  ctx.beginPath()
  ctx.roundRect(inset, inset, w - inset * 2, h - inset * 2, r)
  ctx.clip()

  const bg = ctx.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, variant === 'aura' ? '#060C1A' : '#0C0A06')
  bg.addColorStop(0.55, variant === 'aura' ? '#0C2350' : '#301E09')
  bg.addColorStop(1, '#03050A')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  // wallpaper bloom
  const glow = ctx.createRadialGradient(w * 0.5, h * 0.32, 20, w * 0.5, h * 0.32, w * 0.95)
  glow.addColorStop(0, accent + 'CC')
  glow.addColorStop(0.35, accent + '33')
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)

  // faint concentric arcs for depth
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'
  ctx.lineWidth = 3
  for (let i = 1; i <= 4; i++) {
    ctx.beginPath(); ctx.arc(w * 0.5, h * 0.32, i * 150, 0, Math.PI * 2); ctx.stroke()
  }

  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.font = '500 40px Inter, sans-serif'
  ctx.fillText('9:41', 88, 128)
  const right = variant === 'aura' ? 'PRIVATE' : 'SIM1 · SIM2'
  ctx.fillText(right, w - 100 - ctx.measureText(right).width, 128)

  ctx.fillStyle = '#FFFFFF'
  ctx.font = '700 250px "Space Grotesk", sans-serif'
  ctx.fillText('09:41', 92, 600)
  ctx.fillStyle = accent
  ctx.font = '500 48px Inter, sans-serif'
  ctx.fillText(variant === 'aura' ? 'On-device AI active' : '5 days battery left', 96, 690)

  const card = (x, y, cw, ch, rad) => {
    ctx.beginPath(); ctx.roundRect(x, y, cw, ch, rad)
    ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 3; ctx.stroke()
  }
  card(88, 840, w - 176, 300, 56)
  card(88, 1190, (w - 216) / 2, 260, 48)
  card(128 + (w - 216) / 2, 1190, (w - 216) / 2, 260, 48)

  ctx.fillStyle = accent
  ctx.beginPath(); ctx.roundRect(148, 1040, (w - 296) * 0.68, 20, 10); ctx.fill()
  ctx.globalAlpha = 0.65
  ctx.beginPath(); ctx.roundRect(180, 1360, 240, 16, 8); ctx.fill()
  ctx.beginPath(); ctx.roundRect(620, 1360, 180, 16, 8); ctx.fill()
  ctx.globalAlpha = 1

  for (let i = 0; i < 8; i++) {
    const x = 110 + (i % 4) * 216
    const y = 1560 + Math.floor(i / 4) * 216
    ctx.beginPath(); ctx.roundRect(x, y, 156, 156, 44)
    ctx.fillStyle = i % 3 === 0 ? accent + '55' : 'rgba(255,255,255,0.12)'
    ctx.fill()
  }

  ctx.fillStyle = 'rgba(255,255,255,0.65)'
  ctx.beginPath(); ctx.roundRect(w / 2 - 140, 1962, 280, 14, 7); ctx.fill()

  // punch-hole selfie camera
  ctx.fillStyle = '#000000'
  ctx.beginPath(); ctx.arc(w / 2, 150, 34, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#0A1420'
  ctx.beginPath(); ctx.arc(w / 2, 150, 24, 0, Math.PI * 2); ctx.fill()

  ctx.restore()

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
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
        // Visible only when that hotspot's own surface faces the camera.
        // Back-mounted points (camera island) use -Z; side keys use their
        // X normal, so markers hide as their face rotates away.
        const facing = worldZ.sub(camera.position).normalize()
        const n = h.normal || (h.pos[2] < -0.02
          ? [0, 0, -1]
          : Math.abs(h.pos[0]) > 0.45
            ? [Math.sign(h.pos[0]), 0, 0.35]
            : [0, 0, 1])
        const normal = new THREE.Vector3(...n).normalize().applyQuaternion(group.current.quaternion)
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
  // Real-world-ish proportions: ~71.5 x 158 x 8.2mm scaled to units.
  const W = 1.0, H = 2.14, D = 0.105

  return (
    <group ref={group} scale={scale} {...props} dispose={null}>
      {/* ---- back shell ---- */}
      <RoundedBox
        args={[W, H, D]}
        radius={isAura ? 0.13 : 0.1}
        smoothness={quality === 'low' ? 3 : 8}
        castShadow={quality === 'high'}
        receiveShadow={quality === 'high'}
      >
        <meshPhysicalMaterial
          ref={bodyMat}
          color={color}
          metalness={isAura ? 0.1 : 0.04}
          roughness={isAura ? 0.5 : 0.92}
          clearcoat={isAura ? 0.85 : 0.04}
          clearcoatRoughness={isAura ? 0.28 : 0.9}
          bumpMap={ruggedTex || undefined}
          bumpScale={isAura ? 0 : 0.04}
          envMapIntensity={isAura ? 1.1 : 0.5}
        />
      </RoundedBox>

      {/* ---- polished chamfer rail: slightly larger, thinner, high metalness.
             This thin bright edge is what sells "machined metal" in reflections. ---- */}
      <RoundedBox
        args={[W + 0.028, H + 0.028, D * 0.82]}
        radius={isAura ? 0.142 : 0.112}
        smoothness={quality === 'low' ? 3 : 7}
      >
        <meshStandardMaterial
          color={isAura ? '#D2D7DE' : '#767F8A'}
          metalness={1}
          roughness={isAura ? 0.14 : 0.42}
          envMapIntensity={1.6}
        />
      </RoundedBox>

      {/* antenna bands breaking up the frame */}
      {[0.72, -0.72].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[W + 0.031, 0.016, D * 0.83]} />
          <meshStandardMaterial color={isAura ? '#9BA3AE' : '#4A525C'} metalness={0.6} roughness={0.6} />
        </mesh>
      ))}

      {/* Terra bumper corners */}
      {!isAura && [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sy], i) => (
        <RoundedBox key={i} args={[0.28, 0.32, D + 0.075]} radius={0.065} smoothness={4}
          position={[sx * (W / 2 - 0.05), sy * (H / 2 - 0.07), 0]}>
          <meshStandardMaterial color="#1B2027" metalness={0.08} roughness={0.98}
            bumpMap={ruggedTex || undefined} bumpScale={0.03} />
        </RoundedBox>
      ))}

      {/* ---- display stack: black substrate + emissive UI, inset under glass ---- */}
      <mesh position={[0, 0, D / 2 + 0.0015]}>
        <planeGeometry args={[W - 0.03, H - 0.035]} />
        <meshBasicMaterial color="#000000" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, D / 2 + 0.0035]}>
        <planeGeometry args={[W - 0.032, H - 0.037]} />
        <meshBasicMaterial map={screenTex} toneMapped={false} transparent />
      </mesh>
      {/* cover glass — reflective, slightly proud of the frame */}
      <RoundedBox
        args={[W - 0.012, H - 0.016, 0.012]}
        radius={isAura ? 0.12 : 0.092}
        smoothness={quality === 'low' ? 2 : 5}
        position={[0, 0, D / 2 + 0.004]}
      >
        <meshPhysicalMaterial
          transparent opacity={0.28} roughness={0.02} metalness={0}
          transmission={0.55} thickness={0.06} ior={1.5}
          clearcoat={1} clearcoatRoughness={0.02}
          color="#ffffff" envMapIntensity={2}
        />
      </RoundedBox>

      {/* ---- camera plateau (raised island) + modules ---- */}
      <group position={[-W / 2 + 0.3, H / 2 - 0.33, -D / 2]}>
        <RoundedBox args={[0.5, isAura ? 0.5 : 0.42, 0.05]} radius={isAura ? 0.15 : 0.095}
          smoothness={quality === 'low' ? 3 : 6} position={[0, 0, -0.022]}>
          <meshPhysicalMaterial color={isAura ? '#171C25' : '#252A31'} metalness={0.85}
            roughness={0.3} clearcoat={0.6} envMapIntensity={1.3} />
        </RoundedBox>

        {(isAura ? [[-0.105, 0.105], [0.105, 0.105], [-0.105, -0.105]] : [[-0.095, 0.055], [0.095, 0.055]]).map(([x, y], i) => (
          <group key={i} position={[x, y, -0.05]}>
            {/* knurled metal barrel */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.082, 0.088, 0.036, 32]} />
              <meshStandardMaterial color="#A7AEB8" metalness={1} roughness={0.18} envMapIntensity={1.8} />
            </mesh>
            {/* recessed black ring */}
            <mesh position={[0, 0, -0.016]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.066, 0.066, 0.012, 32]} />
              <meshStandardMaterial color="#05070B" metalness={0.4} roughness={0.5} />
            </mesh>
            {/* domed glass element with a coloured coating flare */}
            <mesh position={[0, 0, -0.026]}>
              <sphereGeometry args={[0.055, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshPhysicalMaterial color="#04060C" metalness={0.9} roughness={0.04}
                clearcoat={1} clearcoatRoughness={0.02}
                emissive={accent} emissiveIntensity={0.25} envMapIntensity={2.2} />
            </mesh>
          </group>
        ))}

        <mesh position={[isAura ? 0.105 : 0, isAura ? -0.105 : -0.09, -0.048]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.014, 16]} />
          <meshStandardMaterial color="#FFF6DC" emissive="#FFE9B0" emissiveIntensity={0.7} />
        </mesh>
      </group>

      {/* ---- side keys, inset into the rail ---- */}
      <mesh position={[W / 2 + 0.012, 0.36, 0]}>
        <boxGeometry args={[0.016, 0.28, D * 0.42]} />
        <meshStandardMaterial color={isAura ? '#C2C8D0' : '#5E666F'} metalness={1} roughness={0.25} />
      </mesh>
      <mesh position={[W / 2 + 0.012, 0.06, 0]}>
        <boxGeometry args={[0.016, 0.14, D * 0.42]} />
        <meshStandardMaterial color={isAura ? '#C2C8D0' : '#5E666F'} metalness={1} roughness={0.25} />
      </mesh>
      {/* privacy key (Aura) / PTT key (Terra) */}
      <mesh position={[W / 2 + 0.013, -0.24, 0]}>
        <boxGeometry args={[0.018, 0.16, D * 0.44]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.6}
          metalness={0.5} roughness={0.35} />
      </mesh>

      {/* ---- speaker grille + port on the bottom rail ---- */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[0.16 + i * 0.035, -H / 2 - 0.004, 0]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.02, 8]} />
          <meshStandardMaterial color="#05070B" metalness={0.3} roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, -H / 2 - 0.004, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.018, 0.05, 4, 12]} />
        <meshStandardMaterial color="#05070B" metalness={0.5} roughness={0.7} />
      </mesh>

      {/* ---- engraved wordmark ---- */}
      <mesh position={[0, -H / 2 + 0.3, -D / 2 - 0.0015]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.4, 0.026]} />
        <meshStandardMaterial color={isAura ? '#79818E' : '#AEB5BE'} metalness={1} roughness={0.45} />
      </mesh>
    </group>
  )
}
