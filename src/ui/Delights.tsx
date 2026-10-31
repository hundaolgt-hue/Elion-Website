import { useEffect, useState } from 'react'
import { useFilm, SCENES } from '@/lib/store'
import { Icon } from '@/icons/Icon'
import { Logo } from '@/brand/Logo'
import { flyTo } from '@/lib/film'

/** Typing "elyon" anywhere opens a 3 s free-flight mode: arrow keys steer the drone */
export function FreeFlight() {
  const active = useFilm((s) => s.freeFlight)
  useEffect(() => {
    let buf = ''
    let timer: number | undefined
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return
      if (e.key.length !== 1) return
      buf = (buf + e.key.toLowerCase()).slice(-5)
      if (buf === 'elyon') {
        useFilm.getState().set({ freeFlight: true })
        window.clearTimeout(timer)
        timer = window.setTimeout(() => useFilm.getState().set({ freeFlight: false }), 3000)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  if (!active) return null
  return (
    <div className="fixed left-1/2 -translate-x-1/2 top-24 z-40 card px-4 py-2 flex items-center gap-3 text-sm text-white pointer-events-none" role="status">
      <Icon name="drone" size={20} className="text-ice" draw={false} /> Free flight: arrow keys steer the drone <span className="text-sky mono">3 s</span>
    </div>
  )
}

/** Favicon with a rotating rotor frame */
export function Favicon() {
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!link) return
    const c = document.createElement('canvas'); c.width = c.height = 64
    const g = c.getContext('2d')!
    const mark = new Image(); mark.src = '/brand/mark.png'
    let a = 0
    const id = setInterval(() => {
      if (!mark.complete || !mark.naturalWidth) return
      a += 0.6
      g.clearRect(0, 0, 64, 64)
      g.fillStyle = '#0A1B33'; g.beginPath(); g.roundRect(0, 0, 64, 64, 12); g.fill()
      g.drawImage(mark, 6, 8, 52, 41)
      // a rotor frame turning above the building silhouette
      g.save(); g.translate(32, 14); g.rotate(a); g.strokeStyle = 'rgba(189,226,255,0.9)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-9, 0); g.lineTo(9, 0); g.stroke(); g.restore()
      link.href = c.toDataURL('image/png')
    }, 120)
    return () => clearInterval(id)
  }, [])
  return null
}

/** Compact static overview for impatient visitors, without leaving the page */
export function Summary({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab] = useState(0)
  void tab
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  const services = [['lidarScan', 'LiDAR Drone Scans', 'High accuracy data acquisition for cities and buildings'], ['surveying', 'Surveying', 'Detailed survey outputs for planning and development'], ['processing', 'Data Processing', 'Advanced processing and quality assurance pipelines'], ['aiPlatform', 'AI Data Platform', 'AI powered platform for analysis, insights and automation'], ['digitalTwin', 'Digital Twin', 'Realistic digital twins for cities and buildings'], ['industries', 'For All Industries', 'Solutions for private and public organizations']]
  return (
    <div className="fixed inset-0 z-[90] glass overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="summary-title" data-lenis-prevent>
      <div className="mx-auto max-w-[1100px] px-6 py-24 text-white">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="label mb-3">Summary</div>
            <h2 id="summary-title" className="display" style={{ fontSize: 'clamp(1.8rem, 1rem + 3vw, 4rem)' }}>End to end LiDAR &amp; data solutions</h2>
            <p className="mt-4 text-ice/80 max-w-[52ch]">Elyon Aerial Services flies LiDAR drones over Addis Ababa and the Ethiopian highlands and turns the point clouds into digital twins, scan-to-BIM models, 3D cadastre and AI-ready data for ministries, cities, developers, banks and development partners.</p>
          </div>
          <button type="button" className="pill" onClick={onClose} aria-label="Close summary">Close</button>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(([i, t, d]) => (
            <div key={t} className="card p-5"><Icon name={i} size={32} className="text-ice" /><div className="label mt-4" style={{ fontSize: 11 }}>{t}</div><p className="mt-2 text-sm text-ice/80">{d}</p></div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-2">
          {SCENES.filter((s) => s.id !== 'playground' && s.id !== 'passthrough').map((s) => <button key={s.id} type="button" className="pill !h-9 !text-xs" onClick={() => { onClose(); flyTo(s.id) }}>{s.n} · {s.label}</button>)}
        </div>
        <div className="mt-12 card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4"><Logo variant="mark" height={44} /><div><div className="font-display font-semibold">Request a demo</div><div className="text-sm text-ice/80">hello@elyonaerial.com · Imperial BMA Plaza, Bole, Addis Ababa</div></div></div>
          <a className="pill solid" href="mailto:hello@elyonaerial.com">Email us</a>
        </div>
      </div>
    </div>
  )
}
