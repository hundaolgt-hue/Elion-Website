import { useEffect, useRef, useState } from 'react'
import { useFilm } from '@/lib/store'

interface Manifest { clips: { id: string; start: number; end: number; frames: number; pattern: string; blend?: 'screen' | 'normal'; opacity?: number }[] }

/**
 * Scroll-scrubbed cinematic footage layer. Each clip is an image sequence (frames pre-split with
 * scripts/extract-frames.mjs) bound to a window of film progress. Frames are decoded ahead of the
 * current position and drawn to a canvas behind the WebGL layer with screen blending so the AI
 * footage and the real-time 3D read as one world. Dormant until /film/manifest.json exists.
 */
export function FrameSequence() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [manifest, setManifest] = useState<Manifest | null>(null)
  useEffect(() => {
    fetch('/film/manifest.json').then((r) => (r.ok ? r.json() : null)).then((m) => m && m.clips?.length && setManifest(m)).catch(() => null)
  }, [])
  useEffect(() => {
    if (!manifest || !canvas.current) return
    const cv = canvas.current, ctx = cv.getContext('2d')!
    const cache = new Map<string, HTMLImageElement>()
    const load = (src: string) => { if (cache.has(src)) return cache.get(src)!; const im = new Image(); im.decoding = 'async'; im.src = src; cache.set(src, im); return im }
    const resize = () => { cv.width = innerWidth; cv.height = innerHeight }
    resize()
    addEventListener('resize', resize)
    let raf = 0
    const draw = () => {
      const p = useFilm.getState().progress * 100
      ctx.clearRect(0, 0, cv.width, cv.height)
      for (const c of manifest.clips) {
        if (p < c.start - 0.5 || p > c.end + 0.5) continue
        const t = Math.min(1, Math.max(0, (p - c.start) / (c.end - c.start)))
        const i = Math.round(t * (c.frames - 1))
        for (let k = -2; k <= 6; k++) { const j = i + k; if (j >= 0 && j < c.frames) load(c.pattern.replace('{i}', String(j).padStart(4, '0'))) }
        const im = load(c.pattern.replace('{i}', String(i).padStart(4, '0')))
        if (!im.complete || !im.naturalWidth) continue
        const fade = Math.min(1, Math.min(p - c.start + 0.5, c.end - p + 0.5) / 1)
        ctx.globalAlpha = (c.opacity ?? 0.9) * Math.max(0, fade)
        ctx.globalCompositeOperation = c.blend === 'normal' ? 'source-over' : 'screen'
        const s = Math.max(cv.width / im.naturalWidth, cv.height / im.naturalHeight)
        const w = im.naturalWidth * s, h = im.naturalHeight * s
        ctx.drawImage(im, (cv.width - w) / 2, (cv.height - h) / 2, w, h)
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize) }
  }, [manifest])
  if (!manifest) return null
  return <canvas ref={canvas} className="fixed inset-0 z-[1] pointer-events-none mix-blend-screen" aria-hidden="true" />
}
