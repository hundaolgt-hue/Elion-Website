import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { useFilm, SCENES } from './store'
import { useLayoutEffect } from 'react'

gsap.registerPlugin(ScrollTrigger)

/**
 * The master timeline is the single authority for the film. Duration = 100 units = percent.
 * DOM overlays add tweens to it at scene positions; the WebGL layer reads the same progress
 * number from the store every frame. ScrollTrigger scrubs it across the #film section.
 */
export const master = gsap.timeline({ paused: true, defaults: { ease: 'none' } })
master.to({}, { duration: 100 }) // reserve the full length so labels after the last tween still exist
for (const s of SCENES) master.addLabel(s.id, s.start)

let lenis: Lenis | null = null
let trigger: ScrollTrigger | null = null
let lastY = 0
let lastT = 0

export const getLenis = () => lenis

export function mountFilm(filmEl: HTMLElement) {
  if (trigger) return () => {}
  const reduced = useFilm.getState().reducedMotion
  if (!reduced) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true, syncTouch: false, touchMultiplier: 1.4 })
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((t) => lenis?.raf(t * 1000))
    gsap.ticker.lagSmoothing(0)
  }
  trigger = ScrollTrigger.create({
    trigger: filmEl,
    start: 'top top',
    end: 'bottom bottom',
    scrub: reduced ? false : 0.5,
    animation: master,
    onUpdate: (self) => {
      const now = performance.now()
      const y = self.scroll()
      const dt = Math.max(1, now - lastT)
      const v = ((y - lastY) / dt) * 1000
      lastY = y
      lastT = now
      const s = useFilm.getState()
      s.setProgress(self.progress, v)
      ;(window as unknown as { __elyon: { progress: number } }).__elyon = { progress: self.progress }
    },
  })
  const pageST = ScrollTrigger.create({
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => useFilm.getState().set({ pageProgress: self.progress }),
  })
  // Keyboard scrubbing
  const onKey = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return
    if (useFilm.getState().freeFlight) return
    const h = window.innerHeight
    const map: Record<string, number> = { ArrowDown: h * 0.5, ArrowUp: -h * 0.5, PageDown: h, PageUp: -h, ' ': h }
    if (e.key in map) {
      e.preventDefault()
      scrollBy(map[e.key])
    }
  }
  window.addEventListener('keydown', onKey)
  return () => {
    window.removeEventListener('keydown', onKey)
    trigger?.kill(); pageST.kill(); trigger = null
    lenis?.destroy(); lenis = null
  }
}

export function scrollBy(delta: number) {
  const y = (lenis ? lenis.scroll : window.scrollY) + delta
  if (lenis) lenis.scrollTo(y, { duration: 0.6 })
  else window.scrollTo({ top: y, behavior: 'smooth' })
}

/** Fly the timeline (and so the drone) to a scene label over 1.8 s */
export function flyTo(id: string, duration = 1.8) {
  if (!trigger) return
  const s = SCENES.find((x) => x.id === id)
  if (!s) return
  const target = trigger.start + ((s.start + 0.3) / 100) * (trigger.end - trigger.start)
  if (lenis) lenis.scrollTo(target, { duration, easing: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2) })
  else window.scrollTo({ top: target, behavior: 'smooth' })
}

export function scrollToEl(el: HTMLElement, duration = 1.8) {
  if (lenis) lenis.scrollTo(el, { duration, offset: -40 })
  else el.scrollIntoView({ behavior: 'smooth' })
}

/** Register overlay tweens onto the master timeline; cleans up on unmount. */
export function useFilmTween(build: (tl: gsap.core.Timeline) => void, deps: unknown[] = []) {
  useLayoutEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'none' } })
    build(tl)
    master.add(tl, 0)
    return () => {
      master.remove(tl)
      tl.kill()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/** Split text into per-character spans for rotor-wash and point-dissolve exits */
export function splitChars(el: HTMLElement) {
  if (el.dataset.split) return Array.from(el.querySelectorAll<HTMLElement>('.ch'))
  const text = el.textContent ?? ''
  el.textContent = ''
  el.setAttribute('aria-label', text)
  const frag = document.createDocumentFragment()
  const out: HTMLElement[] = []
  const words = text.split(' ')
  words.forEach((word, wi) => {
    const w = document.createElement('span')
    w.className = 'word'
    w.style.display = 'inline-block'
    w.style.whiteSpace = 'nowrap'
    for (const ch of word) {
      const s = document.createElement('span')
      s.className = 'ch'
      s.style.display = 'inline-block'
      s.textContent = ch
      s.setAttribute('aria-hidden', 'true')
      w.appendChild(s)
      out.push(s)
    }
    frag.appendChild(w)
    if (wi < words.length - 1) frag.appendChild(document.createTextNode(' '))
  })
  el.appendChild(frag)
  el.dataset.split = '1'
  return out
}

export { gsap, ScrollTrigger }
