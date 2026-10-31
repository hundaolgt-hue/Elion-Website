import { create } from 'zustand'

export type ColorMode = 'elevation' | 'intensity' | 'classification' | 'rgb'
export type Tier = 'high' | 'medium' | 'lite'

export interface FilmState {
  /** Master film progress 0..1 across the pinned film section */
  progress: number
  /** Scroll velocity in px/s, signed */
  velocity: number
  /** Page progress 0..1 across the whole document (for the rail and the tab title) */
  pageProgress: number
  ready: boolean
  tier: Tier
  isMobile: boolean
  reducedMotion: boolean
  soundOn: boolean
  /** Playground controls (Scenes 2 to 3) */
  playground: boolean
  colorMode: ColorMode
  pointSize: number
  slice: number
  classMask: boolean[]
  density: 50 | 200 | 400
  scanReplay: number | null
  measurePins: [number, number, number][]
  measuring: boolean
  /** Live twin floors: true = lights on */
  floors: boolean[]
  /** Free flight easter egg */
  freeFlight: boolean
  /** Pointer in normalized device coords */
  pointer: { x: number; y: number }
  hovered: { kind: 'none' | 'building' | 'drone' | 'card' | 'point'; data?: Record<string, string | number> }
  setProgress: (p: number, v: number) => void
  set: (partial: Partial<FilmState>) => void
  toggleFloor: (i: number, source: 'physical' | 'twin') => void
}

const detectTier = (): { tier: Tier; isMobile: boolean } => {
  if (typeof navigator === 'undefined') return { tier: 'high', isMobile: false }
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (window.matchMedia?.('(pointer: coarse)').matches && window.innerWidth < 900)
  const cores = navigator.hardwareConcurrency ?? 8
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
  if (isMobile || cores <= 4 || mem <= 4) return { tier: 'lite', isMobile }
  if (cores <= 6) return { tier: 'medium', isMobile }
  return { tier: 'high', isMobile }
}

const { tier, isMobile } = detectTier()

export const useFilm = create<FilmState>((set, get) => ({
  progress: 0,
  velocity: 0,
  pageProgress: 0,
  ready: false,
  tier,
  isMobile,
  reducedMotion: typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  soundOn: false,
  playground: false,
  colorMode: 'elevation',
  pointSize: 1,
  slice: 1,
  classMask: [true, true, true, true, true],
  density: 400,
  scanReplay: null,
  measurePins: [],
  measuring: false,
  floors: Array.from({ length: 46 }, (_, i) => i % 7 !== 3),
  freeFlight: false,
  pointer: { x: 0, y: 0 },
  hovered: { kind: 'none' },
  setProgress: (progress, velocity) => set({ progress, velocity }),
  set: (partial) => set(partial),
  toggleFloor: (i, source) => {
    const floors = get().floors.slice()
    floors[i] = !floors[i]
    set({ floors })
    // The other world follows within 120 ms: the twin lags the building, the building lags the twin.
    window.dispatchEvent(new CustomEvent('elyon:floor', { detail: { index: i, on: floors[i], source } }))
  },
}))

/** Scene table. Positions are master-timeline percentages (0..100) of the film section. */
export const SCENES = [
  { id: 'launch', n: '00', label: 'Launch pad', start: 0, end: 4 },
  { id: 'takeoff', n: '01', label: 'Aerial precision', start: 4, end: 12 },
  { id: 'scan', n: '02', label: 'LiDAR drone scans', start: 12, end: 24 },
  { id: 'playground', n: '02b', label: 'Touch the data', start: 22, end: 26 },
  { id: 'twin', n: '03', label: 'Digital twin', start: 26, end: 31 },
  { id: 'platform', n: '04', label: 'AI data platform', start: 31, end: 34 },
  { id: 'passthrough', n: '04b', label: 'Through the screen', start: 34, end: 40 },
  { id: 'bim', n: '05', label: 'Scan to BIM', start: 40, end: 54 },
  { id: 'sync', n: '06', label: 'Live twin', start: 54, end: 62 },
  { id: 'cadastre', n: '07', label: '3D cadastre', start: 62, end: 72 },
  { id: 'land', n: '08', label: 'For all industries', start: 72, end: 84 },
  { id: 'stack', n: '09', label: 'End to end', start: 84, end: 92 },
  { id: 'landing', n: '10', label: 'Landing', start: 92, end: 100 },
] as const

export type SceneId = (typeof SCENES)[number]['id']

export const sceneAt = (p: number) => {
  const pct = p * 100
  let cur: (typeof SCENES)[number] = SCENES[0]
  for (const s of SCENES) if (pct >= s.start && s.id !== 'playground' && s.id !== 'passthrough') cur = s
  return cur
}

/** Normalised 0..1 position inside a [a,b] percentage window, clamped */
export const win = (p: number, a: number, b: number) => Math.min(1, Math.max(0, (p * 100 - a) / (b - a)))
