export const DEVICES = {
  aura: {
    id: 'aura',
    name: 'Nokia Aura',
    tagline: 'For people who want a phone that respects them back.',
    category: 'Flagship · Privacy & Durability',
    price: 'Concept target · €899',
    accent: '#3DF0FF',
    blurb:
      'A privacy-first flagship with on-device AI, a five-year durability guarantee and a design engineered to be opened, not thrown away.',
    finishes: [
      { id: 'midnight', label: 'Midnight Ceramic', color: '#12161F' },
      { id: 'arctic', label: 'Arctic Bone', color: '#D8DDE4' },
      { id: 'signal', label: 'Signal Blue', color: '#124191' },
      { id: 'moss', label: 'Nordic Moss', color: '#2C4A3C' },
    ],
    pillars: [
      { title: 'Privacy silicon', body: 'A dedicated trust enclave with hardware kill-switches for mic, camera and radios.' },
      { title: 'On-device AI', body: 'Assistant, translation and photo intelligence run locally. Nothing leaves the handset.' },
      { title: '5-year guarantee', body: 'Five years of OS updates, security patches and free battery health service.' },
      { title: 'Repairable by design', body: 'Twelve screws, zero glue. Every module is user-replaceable with a standard driver.' },
    ],
  },
  terra: {
    id: 'terra',
    name: 'Nokia Terra',
    tagline: 'Built for real life, priced for everyone.',
    category: 'Emerging Markets · Rugged Essentials',
    price: 'Concept target · sub-$150',
    accent: '#FFB13D',
    blurb:
      'A rugged, dual-SIM workhorse with a five-day battery, drop-proof polymer shell and offline-first software for low-connectivity regions.',
    finishes: [
      { id: 'clay', label: 'Desert Clay', color: '#B4643C' },
      { id: 'slate', label: 'Basalt Slate', color: '#38414C' },
      { id: 'jungle', label: 'Deep Jungle', color: '#1F4034' },
      { id: 'amber', label: 'Safety Amber', color: '#D9891F' },
    ],
    pillars: [
      { title: '5-day battery', body: '7,000 mAh with an adaptive low-power mode that stretches to nine days of standby.' },
      { title: 'Dual SIM + eSIM', body: 'Two physical SIMs plus eSIM, with per-line data budgeting built into the OS.' },
      { title: 'Drop & dust proof', body: 'MIL-STD-810H shell, IP68 sealing and a screen rated for 2m drops onto concrete.' },
      { title: 'Offline-first', body: 'Maps, payments and messaging queue locally and sync the moment signal returns.' },
    ],
  },
}

export const HOTSPOTS = [
  { id: 'camera', label: 'PureView Tri-Camera', body: '50MP sensor-shift main, 3x periscope and a true-colour spectral sensor tuned by Nokia optics.', pos: [-0.5, 0.74, -0.12], side: 'left' },
  { id: 'edge', label: 'Contour Edge Display', body: '6.5" LTPO panel curving into the frame, 1–144Hz adaptive, 2,600 nits peak.', pos: [0.5, 0.3, 0.06], side: 'right' },
  { id: 'privacy', label: 'Hardware Privacy Key', body: 'A physical slider that severs power to mics, cameras and radios at the board level.', pos: [0.51, -0.24, 0.0], side: 'right' },
  { id: 'frame', label: 'Recycled Aero Frame', body: '100% recycled aluminium, cold-forged and bead-blasted for grip without coatings.', pos: [-0.5, -0.72, 0.0], side: 'left' },
]

export const SPECS = [
  { group: 'Display', rows: [
    { label: 'Panel', aura: '6.5" LTPO AMOLED, curved edge', terra: '6.1" IPS LCD, Gorilla Glass Victus' },
    { label: 'Refresh rate', aura: '1–144 Hz adaptive', terra: '90 Hz' },
    { label: 'Peak brightness', aura: '2,600 nits', terra: '1,000 nits (sunlight mode)' },
  ]},
  { group: 'Performance', rows: [
    { label: 'Platform', aura: '3nm octa-core + Nokia Trust Enclave', terra: '6nm octa-core efficiency SoC' },
    { label: 'Memory', aura: '12 / 16 GB LPDDR5X', terra: '4 / 6 GB LPDDR4X' },
    { label: 'Storage', aura: '256 / 512 GB UFS 4.0', terra: '128 GB + microSD to 1 TB' },
  ]},
  { group: 'Camera', rows: [
    { label: 'Main', aura: '50 MP sensor-shift OIS', terra: '48 MP OIS' },
    { label: 'Tele / Ultra', aura: '3x periscope + 48 MP ultra-wide', terra: '8 MP ultra-wide' },
    { label: 'Processing', aura: 'On-device computational pipeline', terra: 'Lightweight HDR, offline capable' },
  ]},
  { group: 'Power & Build', rows: [
    { label: 'Battery', aura: '4,800 mAh · 80W wired', terra: '7,000 mAh · 18W, reverse charge' },
    { label: 'Durability', aura: 'IP68, 5-year guarantee', terra: 'IP68 + MIL-STD-810H' },
    { label: 'Repairability', aura: 'Modular, 12 screws, no glue', terra: 'Field-replaceable battery' },
  ]},
]

export const COUNTERS = [
  { value: 5, suffix: '', label: 'Years of updates & durability cover', sub: 'Aura guarantee' },
  { value: 144, suffix: 'Hz', label: 'Adaptive refresh on the Contour Edge', sub: 'Aura display' },
  { value: 7000, suffix: 'mAh', label: 'Battery capacity, five days of real use', sub: 'Terra endurance' },
  { value: 100, suffix: '%', label: 'Recycled aluminium in every frame', sub: 'Both devices' },
]

export const ECOSYSTEM = {
  center: { id: 'phone', label: 'Nokia OS', sub: 'Aura · Terra', x: 50, y: 50 },
  nodes: [
    { id: 'watch',  label: 'Nokia Pulse',   sub: 'Health wearable',    x: 16, y: 20 },
    { id: 'buds',   label: 'Nokia Echo',    sub: 'Adaptive audio',     x: 84, y: 20 },
    { id: 'vault',  label: 'Trust Vault',   sub: 'On-device identity', x: 10, y: 62 },
    { id: 'cloud',  label: 'Nordic Cloud',  sub: 'EU-hosted sync',     x: 90, y: 62 },
    { id: 'mesh',   label: 'Terra Mesh',    sub: 'Offline peer relay', x: 30, y: 88 },
    { id: 'care',   label: 'Nokia Care',    sub: 'Repair network',     x: 70, y: 88 },
  ],
}
