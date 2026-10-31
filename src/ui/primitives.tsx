import { useRef } from 'react'
import { useFilmTween, gsap } from '@/lib/film'
import { Icon } from '@/icons/Icon'

/** Section label "01 / AERIAL PRECISION" that slides in under the HUD between [a,b] */
export function SceneLabel({ n, text, a, b, className = '' }: { n: string; text: string; a: number; b: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useFilmTween((tl) => {
    tl.fromTo(ref.current, { autoAlpha: 0, x: -16 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: 'power3.out' }, a)
    tl.to(ref.current, { autoAlpha: 0, y: 14, duration: 0.5, ease: 'power2.in' }, b - 0.5)
  })
  return <div ref={ref} className={`label fixed left-5 md:left-8 bottom-6 md:bottom-8 z-30 opacity-0 pointer-events-none hidden md:block ${className}`} aria-hidden="true">{n} / {text}</div>
}

/** Fades a block in at a and out at b with the film; children keep their own motion */
export function Window({ a, b, children, className = '', from = { y: 30 }, out = 'slide' }: { a: number; b: number; children: React.ReactNode; className?: string; from?: gsap.TweenVars; out?: 'slide' | 'dissolve' | 'push' }) {
  const ref = useRef<HTMLDivElement>(null)
  useFilmTween((tl) => {
    tl.fromTo(ref.current, { autoAlpha: 0, ...from }, { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: 0.7, ease: 'power3.out' }, a)
    if (out === 'dissolve') tl.to(ref.current, { autoAlpha: 0, filter: 'blur(6px)', scale: 1.02, duration: 0.5, ease: 'power2.in' }, b - 0.5)
    else if (out === 'push') tl.to(ref.current, { autoAlpha: 0, x: 60, skewX: -6, duration: 0.5, ease: 'power2.in' }, b - 0.5)
    else tl.to(ref.current, { autoAlpha: 0, y: -40, duration: 0.5, ease: 'power2.in' }, b - 0.5)
  })
  return <div ref={ref} className={`opacity-0 ${className}`} style={{ visibility: 'hidden' }}>{children}</div>
}

/** Data row with an animated icon docking into a panel */
export function DataRow({ icon, label, children, delay = 0 }: { icon: string; label: string; children: React.ReactNode; delay?: number }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-ice/10 last:border-0" style={{ animationDelay: `${delay}ms` }}>
      <Icon name={icon} size={22} className="text-ice shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="label" style={{ fontSize: 10.5, letterSpacing: '0.14em' }}>{label}</div>
        <div className="text-white text-[15px] leading-tight mt-0.5">{children}</div>
      </div>
    </div>
  )
}

export function Panel({ children, className = '', title }: { children: React.ReactNode; className?: string; title?: string }) {
  return (
    <div className={`card px-4 py-3 ${className}`}>
      {title && <div className="label mb-1" style={{ fontSize: 10.5 }}>{title}</div>}
      {children}
    </div>
  )
}
