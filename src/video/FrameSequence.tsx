import { useEffect, useRef, useState } from 'react'
import { useFilm } from '@/lib/store'

export interface Clip { id: string; start: number; end: number; frames: number; pattern: string; patternSm?: string; blend?: 'screen' | 'normal'; opacity?: number; fade?: number; hold?: number; recess?: [number, number, number] }
interface Manifest { clips: Clip[] }

/**
 * Scroll-scrubbed cinematic footage. Each clip is a WebP frame sequence (scripts/extract-frames.mjs)
 * bound to a window of film progress. Frames are decoded ahead of the scroll position (the whole
 * active clip plus the start of the next), drawn to a fixed canvas above the WebGL layer, and
 * dissolved in and out at each clip's edges so the real footage and the real-time 3D hand over to
 * each other as one world. While footage fully covers the screen the 3D render loop idles.
 * Dormant until /film/manifest.json exists.
 */
export function FrameSequence() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [manifest, setManifest] = useState<Manifest | null>(null)
  useEffect(() => {
    fetch('/film/manifest.json').then((r) => (r.ok ? r.json() : null)).then((m) => { if (m && m.clips?.length) { setManifest(m); if (!useFilm.getState().reducedMotion) useFilm.getState().set({ footageMode: true }) } }).catch(() => null)
  }, [])
  useEffect(() => {
    if (!manifest || !canvas.current) return
    const cv = canvas.current, ctx = cv.getContext('2d', { alpha: true })!
    const small = window.innerWidth < 900 || useFilm.getState().tier === 'lite'
    const cache = new Map<string, HTMLImageElement>()
    const src = (c: Clip, i: number) => ((small && c.patternSm) || c.pattern).replace('{i}', String(i).padStart(4, '0'))
    const load = (s: string) => { let im = cache.get(s); if (!im) { im = new Image(); im.decoding = 'async'; im.src = s; cache.set(s, im) } return im }
    const resize = () => { cv.width = innerWidth * Math.min(devicePixelRatio, 1.5); cv.height = innerHeight * Math.min(devicePixelRatio, 1.5) }
    resize()
    addEventListener('resize', resize)
    // preload budget: a few frames per animation frame, nearest first
    let queue: string[] = []
    const plan = (p: number) => {
      queue = []
      const near = manifest.clips.filter((c) => p > c.start - 4 && p < (c.hold ?? c.end) + 4)
      for (const c of near) {
        const t = Math.min(1, Math.max(0, (p - c.start) / (c.end - c.start)))
        const i0 = Math.round(t * (c.frames - 1))
        for (let k = 0; k < c.frames; k++) { const j = i0 + (k % 2 ? -((k + 1) >> 1) : k >> 1); if (j >= 0 && j < c.frames) queue.push(src(c, j)) }
      }
    }
    let lastPlan = -1
    let raf = 0
    let lastCover = -1
    const draw = () => {
      const p = useFilm.getState().progress * 100
      if (Math.abs(p - lastPlan) > 0.5) { plan(p); lastPlan = p }
      let budget = 3
      while (budget > 0 && queue.length) { const s = queue.shift()!; if (!cache.has(s)) { load(s); budget-- } }
      ctx.clearRect(0, 0, cv.width, cv.height)
      let cover = 0
      for (const c of manifest.clips) {
        const fade = c.fade ?? 1.2
        const endV = c.hold ?? c.end
        if (p < c.start - fade || p > endV + fade) continue
        const t = Math.min(1, Math.max(0, (p - c.start) / (c.end - c.start)))
        const i = Math.round(t * (c.frames - 1))
        let im = load(src(c, i))
        if (!im.complete || !im.naturalWidth) {
          // fall back to the nearest decoded frame so the scrub never blanks
          for (let k = 1; k < 12 && (!im.complete || !im.naturalWidth); k++) {
            const a = cache.get(src(c, i - k)), b = cache.get(src(c, i + k))
            if (a?.complete && a.naturalWidth) im = a
            else if (b?.complete && b.naturalWidth) im = b
          }
          if (!im.complete || !im.naturalWidth) continue
        }
        const edge = Math.min(1, Math.min(p - c.start + fade, endV - p + fade) / fade)
        const e = edge < 0.5 ? 2 * edge * edge : 1 - Math.pow(-2 * edge + 2, 2) / 2
        let a = (c.opacity ?? 1) * Math.max(0, e)
        // recess: the footage dims while the viewer handles the point cloud, then returns
        if (c.recess) { const [r0, r1, rk] = c.recess; const w = 0.6; const inR = Math.min(1, Math.max(0, (p - r0) / w)) * Math.min(1, Math.max(0, (r1 - p) / w)); a *= 1 - inR * (1 - rk) }
        ctx.globalAlpha = a
        ctx.globalCompositeOperation = c.blend === 'screen' ? 'screen' : 'source-over'
        const s = Math.max(cv.width / im.naturalWidth, cv.height / im.naturalHeight)
        const w = im.naturalWidth * s, h = im.naturalHeight * s
        ctx.drawImage(im, (cv.width - w) / 2, (cv.height - h) / 2, w, h)
        if ((c.blend ?? 'normal') === 'normal') cover = Math.max(cover, a)
      }
      const covered = cover >= 0.999 ? 1 : 0
      if (covered !== lastCover) { lastCover = covered; useFilm.getState().set({ footageCover: covered === 1 }) }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); useFilm.getState().set({ footageCover: false }) }
  }, [manifest])
  if (!manifest) return null
  return <canvas ref={canvas} className="fixed inset-0 z-0 pointer-events-none bg-navy-900" style={{ width: '100vw', height: '100vh' }} aria-hidden="true" />
}
