import { useEffect, useRef, useState } from 'react'
import { gsap } from '@/lib/film'
import { Mark } from '@/brand/Mark'
import { useFilm } from '@/lib/store'

/** The mark draws itself (four wings in sequence, then the point spray falls) and dissolves into the first frame */
export function Preloader({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const mark = useRef<SVGSVGElement>(null)
  const [gone, setGone] = useState(false)
  useEffect(() => {
    const svg = mark.current!
    const wings = Array.from(svg.querySelectorAll<SVGPathElement>('.wing'))
    const build = Array.from(svg.querySelectorAll<SVGPathElement>('.building path'))
    const dots = Array.from(svg.querySelectorAll<SVGCircleElement>('.dot'))
    for (const p of [...wings, ...build]) { const L = p.getTotalLength(); p.style.strokeDasharray = `${L}`; p.style.strokeDashoffset = `${L}` }
    gsap.set(dots, { opacity: 0, y: -8 })
    const tl = gsap.timeline()
    tl.to(wings, { strokeDashoffset: 0, duration: 0.55, stagger: 0.14, ease: 'power3.out' })
      .to(build, { strokeDashoffset: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out' }, '-=0.3')
      .to(dots, { opacity: 1, y: 0, duration: 0.35, stagger: { each: 0.012, from: 'start' }, ease: 'power2.out' }, '-=0.2')
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      // dissolve: the mark becomes the drone's silhouette on the pad, then the hero appears
      gsap.timeline({ onComplete: () => { setGone(true); onDone() } })
        .to(svg, { scale: 0.22, y: '28vh', duration: 0.9, ease: 'power2.inOut' })
        .to(root.current, { opacity: 0, duration: 0.5, ease: 'power2.out' }, '-=0.25')
    }
    const minT = setTimeout(() => { if (useFilm.getState().ready) finish() }, 1700)
    const unsub = useFilm.subscribe((s) => { if (s.ready && tl.progress() > 0.9) finish() })
    const maxT = setTimeout(finish, 3200)
    return () => { clearTimeout(minT); clearTimeout(maxT); unsub(); tl.kill() }
  }, [onDone])
  if (gone) return null
  return (
    <div ref={root} className="fixed inset-0 z-[100] bg-navy-900 flex items-center justify-center" role="status" aria-live="polite" aria-label="Loading Elyon Aerial Services">
      <Mark ref={mark} size={120} stroke onNavy />
    </div>
  )
}
