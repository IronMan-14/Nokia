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
  // signal bars + battery glyph
  const bx = w - 250
  for (let i = 0; i < 4; i++) {
    const bh = 12 + i * 9
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.fillRect(bx + i * 16, 128 - bh, 10, bh)
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'
  ctx.lineWidth = 4
  ctx.beginPath(); ctx.roundRect(bx + 84, 96, 62, 34, 8); ctx.stroke()
  ctx.fillStyle = accent
  ctx.beginPath(); ctx.roundRect(bx + 89, 101, 46, 24, 5); ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.beginPath(); ctx.roundRect(bx + 150, 106, 7, 14, 3); ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.font = '500 30px Inter, sans-serif'
  const tag = variant === 'aura' ? 'PRIVATE' : 'SIM1·SIM2'
  ctx.fillText(tag, bx - 20 - ctx.measureText(tag).width, 126)

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

  const labels = ['Vault', 'Maps', 'Msgs', 'Cam', 'Pay', 'Health', 'Files', 'More']
  for (let i = 0; i < 8; i++) {
    const x = 110 + (i % 4) * 216
    const y = 1560 + Math.floor(i / 4) * 216
    const g2 = ctx.createLinearGradient(x, y, x, y + 156)
    if (i % 3 === 0) { g2.addColorStop(0, accent + '77'); g2.addColorStop(1, accent + '22') }
    else { g2.addColorStop(0, 'rgba(255,255,255,0.17)'); g2.addColorStop(1, 'rgba(255,255,255,0.07)') }
    ctx.beginPath(); ctx.roundRect(x, y, 156, 156, 44); ctx.fillStyle = g2; ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 2; ctx.stroke()
    // glyph
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.beginPath(); ctx.roundRect(x + 52, y + 52, 52, 52, 14); ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.font = '400 24px Inter, sans-serif'
    const lw = ctx.measureText(labels[i]).width
    ctx.fillText(labels[i], x + 78 - lw / 2, y + 196)
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
  externalDragRef,
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

  // Drag state is owned by PhoneScene's DOM drag-surface (see dragRef) so the
  // WebGL canvas itself never needs to capture pointer events and can never
  // block page scrolling. Falls back to local state if no ref is supplied.
  const activeDrag = externalDragRef || drag

  const projected = useRef(new THREE.Vector3())

  useFrame((state, delta) => {
    const d = Math.min(delta, 0.05)
    if (!group.current) return

    // inertia
    const dr = activeDrag.current
    if (!dr.active) {
      dr.velX *= 0.94
      dr.velY *= 0.94
      dr.x += dr.velX
      dr.y += dr.velY
    }
    if (autoRotate && !dr.touched) spin.current += d * 0.28

    const extY = rotationTargetRef?.current?.y ?? 0
    const extX = rotationTargetRef?.current?.x ?? 0

    const targetY = spin.current + dr.x + extY
    const targetX = dr.y + extX + Math.sin(state.clock.elapsedTime * 0.5) * 0.03

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
  // ~71.5 x 158 x 8.2mm scaled to scene units.
  const W = 1.0, H = 2.14, D = 0.105
  const hi = quality !== 'low'
  const seg = hi ? 8 : 3

  return (
    <group ref={group} scale={scale} {...props} dispose={null}>
      {/* ================= BACK SHELL — fully opaque ================= */}
      <RoundedBox
        args={[W, H, D]}
        radius={isAura ? 0.13 : 0.1}
        smoothness={seg}
        castShadow={quality === 'high'}
        receiveShadow={quality === 'high'}
      >
        <meshPhysicalMaterial
          ref={bodyMat}
          color={color}
          transparent={false}
          opacity={1}
          depthWrite
          metalness={isAura ? 0.25 : 0.08}
          roughness={isAura ? 0.38 : 0.88}
          clearcoat={isAura ? 1 : 0.05}
          clearcoatRoughness={isAura ? 0.12 : 0.85}
          reflectivity={isAura ? 0.6 : 0.2}
          bumpMap={ruggedTex || undefined}
          bumpScale={isAura ? 0 : 0.045}
          envMapIntensity={isAura ? 1.0 : 0.45}
        />
      </RoundedBox>

      {/* Side rails, drawn as four separate solid bars rather than one big box
          enclosing the body — an enclosing shell read as a translucent slab. */}
      {[
        { k: 'l', args: [0.022, H - 0.16, D * 0.99], pos: [-W / 2 - 0.004, 0, 0] },
        { k: 'r', args: [0.022, H - 0.16, D * 0.99], pos: [W / 2 + 0.004, 0, 0] },
        { k: 't', args: [W - 0.14, 0.022, D * 0.99], pos: [0, H / 2 + 0.004, 0] },
        { k: 'b', args: [W - 0.14, 0.022, D * 0.99], pos: [0, -H / 2 - 0.004, 0] },
      ].map((r) => (
        <mesh key={r.k} position={r.pos} castShadow={quality === 'high'}>
          <boxGeometry args={r.args} />
          <meshStandardMaterial
            color={isAura ? '#C9CFD7' : '#6E7681'}
            metalness={1}
            roughness={isAura ? 0.17 : 0.45}
            envMapIntensity={1.5}
          />
        </mesh>
      ))}

      {/* Rounded corner posts so the rail wraps continuously */}
      {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sy]) => (
        <mesh key={`c${sx}${sy}`} position={[sx * (W / 2 - 0.06), sy * (H / 2 - 0.06), 0]}
          rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.068, 0.068, D * 0.99, hi ? 24 : 10, 1, false, 0, Math.PI / 2]} />
          <meshStandardMaterial color={isAura ? '#C9CFD7' : '#6E7681'} metalness={1}
            roughness={isAura ? 0.17 : 0.45} envMapIntensity={1.5} />
        </mesh>
      ))}

      {/* Antenna bands */}
      {[0.74, -0.74].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[W + 0.012, 0.014, D * 1.0]} />
          <meshStandardMaterial color={isAura ? '#8E96A2' : '#3F4650'} metalness={0.5} roughness={0.65} />
        </mesh>
      ))}

      {/* Terra bumper corners */}
      {!isAura && [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sy], i) => (
        <RoundedBox key={i} args={[0.3, 0.34, D + 0.07]} radius={0.07} smoothness={hi ? 5 : 3}
          position={[sx * (W / 2 - 0.05), sy * (H / 2 - 0.07), 0]}>
          <meshStandardMaterial color="#171C23" metalness={0.05} roughness={1}
            bumpMap={ruggedTex || undefined} bumpScale={0.035} />
        </RoundedBox>
      ))}

      {/* ================= DISPLAY — opaque, no blending ================= */}
      {/* black bezel substrate */}
      <mesh position={[0, 0, D / 2 + 0.0012]}>
        <planeGeometry args={[W - 0.022, H - 0.026]} />
        <meshBasicMaterial color="#020306" toneMapped={false} />
      </mesh>
      {/* emissive UI — opaque so nothing behind it can bleed through */}
      <mesh position={[0, 0, D / 2 + 0.0026]}>
        <planeGeometry args={[W - 0.03, H - 0.034]} />
        <meshBasicMaterial map={screenTex} toneMapped={false} transparent={false} depthWrite />
      </mesh>

      {/* ================= CAMERA PLATEAU ================= */}
      <group position={[-W / 2 + 0.3, H / 2 - 0.34, -D / 2]}>
        <RoundedBox args={[0.52, isAura ? 0.52 : 0.44, 0.055]} radius={isAura ? 0.155 : 0.1}
          smoothness={hi ? 6 : 3} position={[0, 0, -0.024]} castShadow={quality === 'high'}>
          <meshPhysicalMaterial color={isAura ? '#12161D' : '#1F242B'} metalness={0.7}
            roughness={0.28} clearcoat={0.8} clearcoatRoughness={0.1} envMapIntensity={1.2} />
        </RoundedBox>

        {(isAura
          ? [[-0.105, 0.105, 0.088], [0.105, 0.105, 0.078], [-0.105, -0.105, 0.078]]
          : [[-0.095, 0.055, 0.084], [0.095, 0.055, 0.072]]
        ).map(([x, y, r], i) => (
          <group key={i} position={[x, y, -0.052]}>
            {/* outer machined ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow={quality === 'high'}>
              <cylinderGeometry args={[r, r + 0.006, 0.042, hi ? 40 : 14]} />
              <meshStandardMaterial color="#B6BDC7" metalness={1} roughness={0.14} envMapIntensity={2} />
            </mesh>
            {/* inner black barrel */}
            <mesh position={[0, 0, -0.014]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[r * 0.78, r * 0.78, 0.03, hi ? 32 : 12]} />
              <meshStandardMaterial color="#04060A" metalness={0.3} roughness={0.65} />
            </mesh>
            {/* glass element */}
            <mesh position={[0, 0, -0.03]}>
              <sphereGeometry args={[r * 0.66, hi ? 28 : 12, hi ? 18 : 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshPhysicalMaterial color="#03050A" metalness={0.95} roughness={0.03}
                clearcoat={1} clearcoatRoughness={0.02}
                emissive={accent} emissiveIntensity={0.3} envMapIntensity={2.4} />
            </mesh>
            {/* aperture catchlight */}
            <mesh position={[r * 0.2, r * 0.2, -0.038]}>
              <circleGeometry args={[r * 0.16, hi ? 20 : 8]} />
              <meshBasicMaterial color="#EAF4FF" toneMapped={false} />
            </mesh>
          </group>
        ))}

        {/* LED flash + laser AF */}
        <mesh position={[isAura ? 0.105 : 0, isAura ? -0.105 : -0.09, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.032, 0.032, 0.016, hi ? 20 : 8]} />
          <meshStandardMaterial color="#FFF7E2" emissive="#FFE7A8" emissiveIntensity={0.8} />
        </mesh>
        {isAura && (
          <mesh position={[0.105, -0.105, -0.05]} rotation={[Math.PI / 2, 0, 0]} visible={false} />
        )}
        <mesh position={[isAura ? 0.16 : 0.13, isAura ? 0.02 : -0.09, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 0.016, hi ? 14 : 6]} />
          <meshStandardMaterial color="#0A1520" metalness={0.4} roughness={0.4}
            emissive="#3DF0FF" emissiveIntensity={0.25} />
        </mesh>
      </group>

      {/* ================= SIDE KEYS ================= */}
      <mesh position={[W / 2 + 0.014, 0.36, 0]} castShadow={quality === 'high'}>
        <boxGeometry args={[0.014, 0.26, D * 0.5]} />
        <meshStandardMaterial color={isAura ? '#BFC6CF' : '#5A626B'} metalness={1} roughness={0.22} />
      </mesh>
      <mesh position={[W / 2 + 0.014, 0.07, 0]} castShadow={quality === 'high'}>
        <boxGeometry args={[0.014, 0.13, D * 0.5]} />
        <meshStandardMaterial color={isAura ? '#BFC6CF' : '#5A626B'} metalness={1} roughness={0.22} />
      </mesh>
      {/* privacy / PTT key */}
      <mesh position={[W / 2 + 0.015, -0.26, 0]} castShadow={quality === 'high'}>
        <boxGeometry args={[0.016, 0.15, D * 0.52]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.45}
          metalness={0.4} roughness={0.3} />
      </mesh>

      {/* ================= BOTTOM EDGE DETAIL ================= */}
      <mesh position={[0, -H / 2 - 0.006, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.016, 0.048, 4, hi ? 14 : 6]} />
        <meshStandardMaterial color="#04060A" metalness={0.55} roughness={0.55} />
      </mesh>
      {Array.from({ length: hi ? 7 : 3 }).map((_, i) => (
        <mesh key={i} position={[0.15 + i * 0.032, -H / 2 - 0.006, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.007, 0.007, 0.016, 8]} />
          <meshStandardMaterial color="#04060A" metalness={0.2} roughness={0.95} />
        </mesh>
      ))}
      {Array.from({ length: hi ? 7 : 3 }).map((_, i) => (
        <mesh key={`m${i}`} position={[-0.15 - i * 0.032, -H / 2 - 0.006, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.007, 0.007, 0.016, 8]} />
          <meshStandardMaterial color="#04060A" metalness={0.2} roughness={0.95} />
        </mesh>
      ))}

      {/* ================= BACK BRANDING ================= */}
      <mesh position={[0, -H / 2 + 0.3, -D / 2 - 0.0012]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.38, 0.024]} />
        <meshStandardMaterial color={isAura ? '#6E7682' : '#A8B0B9'} metalness={1} roughness={0.4} />
      </mesh>
      {/* subtle NFC / coil ring hint on the back */}
      {isAura && (
        <mesh position={[0, 0.12, -D / 2 - 0.001]} rotation={[0, Math.PI, 0]}>
          <ringGeometry args={[0.2, 0.207, hi ? 48 : 16]} />
          <meshStandardMaterial color="#FFFFFF" transparent opacity={0.05} metalness={0.8} roughness={0.5} />
        </mesh>
      )}
    </group>
  )
}
