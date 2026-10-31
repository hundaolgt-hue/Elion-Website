import { useEffect, useRef } from 'react'
import { useFilm } from '@/lib/store'
import { easeOutExpo, clamp } from '@/lib/math'

interface Props { from?: number; to: number; start: number; end: number; unit?: string; decimals?: number; className?: string; prefix?: string; linear?: boolean }

/**
 * Rolling-digit odometer bound to a window of film progress. Scrubs backwards when the user
 * scrolls up; counters never finish before the scan that produced them because their window ends
 * where the scan ends.
 */
export function Counter({ from = 0, to, start, end, unit = '', decimals = 0, className = '', prefix = '', linear = false }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const last = useRef('')
  useEffect(() => {
    const render = (p: number) => {
      const t = clamp((p * 100 - start) / (end - start))
      const v = from + (to - from) * (linear ? t : easeOutExpo(t))
      const str = v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
      if (str === last.current || !ref.current) return
      last.current = str
      const el = ref.current
      // Build columns lazily, then translate strips
      const chars = str.split('')
      if (el.childElementCount !== chars.length) {
        el.textContent = ''
        for (const ch of chars) {
          if (/\d/.test(ch)) {
            const col = document.createElement('span'); col.className = 'odo-col'
            const strip = document.createElement('span'); strip.className = 'odo-strip'
            for (let i = 0; i < 10; i++) { const s = document.createElement('span'); s.textContent = String(i); strip.appendChild(s) }
            col.appendChild(strip); el.appendChild(col)
          } else { const s = document.createElement('span'); s.textContent = ch; s.className = 'odo-sep'; el.appendChild(s) }
        }
      }
      chars.forEach((ch, i) => {
        const col = el.children[i] as HTMLElement
        if (/\d/.test(ch)) { const strip = col.firstElementChild as HTMLElement; strip.style.transform = `translateY(-${Number(ch)}em)`; strip.style.transition = 'transform 220ms cubic-bezier(0.19,1,0.22,1)' }
        else if (col.textContent !== ch) { col.textContent = ch }
      })
    }
    render(useFilm.getState().progress)
    return useFilm.subscribe((s) => render(s.progress))
  }, [from, to, start, end, decimals, linear])
  return (
    <span className={`mono ${className}`}>
      {prefix}<span ref={ref} className="odo" aria-hidden="true" />{unit && <span className="odo-unit"> {unit}</span>}
      <span className="sr-only">{prefix}{to.toLocaleString('en-US')} {unit}</span>
    </span>
  )
}
