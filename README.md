# Nokia Aura & Terra — "The Comeback, Reimagined"

Single-page, scroll-driven concept landing page for two **speculative** Nokia devices
created for a strategic case study.

> ⚠️ **Concept illustration.** Nokia Aura and Nokia Terra are not real, announced or
> endorsed products. All renders are procedural artistic interpretations.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Stack

React 19 + Vite · react-three-fiber + drei · GSAP ScrollTrigger · Framer Motion ·
Tailwind CSS · Lenis smooth scroll.

## Structure

```
src/
  App.jsx                      section wiring, nav, Lenis↔ScrollTrigger sync
  lib/data.js                  all copy, specs, hotspots, ecosystem graph
  lib/hooks.js                 reduced-motion, media query, device-tier detection
  components/
    Hero.jsx                   full-viewport 3D hero + finish switcher + scroll cue
    PhoneModel.jsx             procedural Three.js phone (variant="aura"|"terra")
    PhoneScene.jsx             canvas, lighting, studio env, poster + lazy mount
    LazyPhoneScene.jsx         code-splits three.js out of the initial bundle
    FeatureReel.jsx            desktop pin-and-scrub orbit / mobile swipe cards
    DeviceComparison.jsx       Aura vs Terra positioning
    EcosystemDiagram.jsx       self-drawing SVG node graph
    Specs.jsx                  animated counters + comparison table
    CTA.jsx                    waitlist capture + canvas particle burst
    PhoneCarousel.jsx          non-3D keyboard-accessible fallback
    FinishSwitcher.jsx         colour/finish selector (lerped, no hard cuts)
```

## Dropping in a real GLTF

`PhoneModel.jsx` is the only file that knows about geometry. Keep the props
(`variant`, `color`, `accent`, `rotationTargetRef`, `hotspots`, `onHotspotFrame`)
and replace the mesh tree with `<primitive object={gltf.scene} />` — scene, scroll
and hotspot logic stay untouched.

The studio environment is built from `<Lightformer>` primitives so nothing is fetched
from a CDN. To use a real HDRI, drop it in `public/` and swap in
`<Environment files="/studio.hdr" />`.

## Performance & accessibility

- three.js is a lazy chunk; the canvas mounts only when in view **and** the browser is idle,
  behind a CSS poster.
- `getDeviceTier()` (hooks.js) grades low/mid/high from GPU renderer string, core count and
  memory, driving DPR cap, shadows, AA and particle count. `PerformanceMonitor` + `AdaptiveDpr`
  drop DPR further if frames slip.
- `prefers-reduced-motion` disables Lenis, auto-rotation, floating, the pin-scrub reel
  (replaced by static cards) and the particle burst; counters snap to their final value.
- Non-3D fallback: a keyboard-navigable carousel, toggleable from the hero at any time.
- Skip link, semantic table with scoped headers, `aria-live` form feedback, visible focus rings,
  and an `sr-only` text description of the ecosystem graph.
- Mobile drops the pinned camera work entirely in favour of snap-scroll feature cards.
