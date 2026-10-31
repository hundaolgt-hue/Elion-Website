import { useEffect, useRef, useState } from 'react'
import { gsap } from '@/lib/film'
import { useFilm } from '@/lib/store'

/** The supplied mark is revealed by a LiDAR sweep (wings first, then the point spray), and dissolves into the first frame */
export function Preloader({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const img = useRef<HTMLImageElement>(null)
  const line = useRef<HTMLDivElement>(null)
  const [gone, setGone] = useState(false)
  useEffect(() => {
    const el = img.current!
    gsap.set(el, { clipPath: 'inset(0 0 100% 0)', opacity: 1 })
    const tl = gsap.timeline()
    tl.fromTo(line.current, { top: '0%', opacity: 1 }, { top: '100%', duration: 1.5, ease: 'power2.inOut' }, 0)
      .to(el, { clipPath: 'inset(0 0 0% 0)', duration: 1.5, ease: 'power2.inOut' }, 0)
      .to(line.current, { opacity: 0, duration: 0.2 }, 1.5)
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      gsap.timeline({ onComplete: () => { setGone(true); onDone() } })
        .to(el, { scale: 0.22, y: '26vh', opacity: 0, duration: 0.9, ease: 'power2.inOut' })
        .to(root.current, { opacity: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3')
    }
    const minT = setTimeout(() => { if (useFilm.getState().ready) finish() }, 1800)
    const unsub = useFilm.subscribe((s) => { if (s.ready && tl.progress() > 0.95) finish() })
    const maxT = setTimeout(finish, 3200)
    return () => { clearTimeout(minT); clearTimeout(maxT); unsub(); tl.kill() }
  }, [onDone])
  if (gone) return null
  return (
    <div ref={root} className="fixed inset-0 z-[100] bg-navy-900 flex items-center justify-center" role="status" aria-live="polite" aria-label="Loading Elyon Aerial Services">
      <div className="relative" style={{ width: 'min(60vw, 300px)' }}>
        <img ref={img} src="/brand/lockup-dark.png" alt="Elyon Aerial Services" className="w-full h-auto" style={{ opacity: 0 }} />
        <div ref={line} className="absolute left-[-10%] right-[-10%] h-px bg-sky" style={{ top: 0, boxShadow: '0 0 18px 2px rgba(79,165,255,0.7)' }} />
      </div>
    </div>
  )
}
