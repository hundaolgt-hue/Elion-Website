import { useEffect, useRef } from 'react'
import { useFilmTween, splitChars, gsap } from '@/lib/film'

/** Scene 0: hero on the launch pad. Headline cascades in; on take-off the letters are pushed apart by rotor wash and dissolve into points. */
export function Launch({ loaded }: { loaded: boolean }) {
  const root = useRef<HTMLDivElement>(null)
  const lines = useRef<HTMLSpanElement[]>([])
  const sub = useRef<HTMLParagraphElement>(null)
  const hint = useRef<HTMLDivElement>(null)
  useFilmTween((tl) => {
    const chars = lines.current.flatMap((l) => splitChars(l))
    gsap.set(root.current, { autoAlpha: 1 })
    // rotor wash pushes letters apart and they fly up as points
    tl.to(chars, {
      x: () => gsap.utils.random(-120, 120), y: () => gsap.utils.random(-320, -80), rotation: () => gsap.utils.random(-40, 40),
      scale: 0.2, autoAlpha: 0, filter: 'blur(3px)', duration: 1.6, stagger: { each: 0.012, from: 'center' }, ease: 'power3.in',
    }, 1.6)
    tl.to([sub.current, hint.current], { autoAlpha: 0, y: -30, duration: 0.6, ease: 'power2.in' }, 1.8)
    tl.set(root.current, { autoAlpha: 0 }, 4)
  })
  useEffect(() => {
    if (!loaded) return
    const tl = gsap.timeline()
    tl.from(lines.current, { y: 48, autoAlpha: 0, duration: 0.9, stagger: 0.06, ease: 'power3.out' })
      .from([sub.current, hint.current], { y: 20, autoAlpha: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' }, '-=0.5')
    return () => { tl.kill() }
  }, [loaded])
  return (
    <div ref={root} className="fixed inset-0 z-20 flex flex-col justify-start md:justify-center px-6 md:px-16 pt-28 md:pt-0 pointer-events-none" style={{ visibility: 'hidden' }}>
      <h1 className="display max-w-[14ch]" id="hero-title">
        {['LiDAR Drone Data.', 'Smarter Cities.', 'Stronger Future.'].map((t, i) => (
          <span key={t} ref={(el) => { if (el) lines.current[i] = el }} className="block">{t}</span>
        ))}
      </h1>
      <p ref={sub} className="mt-6 text-ice/80 text-base md:text-lg max-w-[40ch]" style={{ fontWeight: 500 }}>LiDAR Drone Solutions. Data That Builds Tomorrow.</p>
      <div ref={hint} className="mt-10 flex items-center gap-4 text-ice/70 text-[13px]">
        <div className="wheel" aria-hidden="true" />
        <span>Scroll to take off</span>
      </div>
    </div>
  )
}
