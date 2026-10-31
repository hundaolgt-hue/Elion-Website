import { useEffect, useRef, useState } from 'react'
import { SCENES, useFilm } from '@/lib/store'
import { flyTo } from '@/lib/film'

/** Thin brand-blue rail on the right edge with scene ticks; labels on hover; click to fly there */
export function ProgressRail() {
  const fill = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<string | null>(null)
  const [current, setCurrent] = useState('launch')
  useEffect(() => useFilm.subscribe((s) => {
    if (fill.current) fill.current.style.transform = `scaleY(${s.progress})`
    const pct = s.progress * 100
    let id = 'launch'
    for (const sc of SCENES) if (pct >= sc.start && sc.id !== 'passthrough') id = sc.id
    setCurrent(id)
  }), [])
  const scenes = SCENES.filter((s) => s.id !== 'passthrough')
  return (
    <nav className="rail fixed right-0 top-0 bottom-0 z-40 hidden md:flex items-stretch" aria-label="Film progress" style={{ width: 28 }}>
      <div className="relative mx-auto my-[12vh] w-px bg-ice/20">
        <div ref={fill} className="absolute left-0 top-0 w-full bg-sky origin-top" style={{ height: '100%', transform: 'scaleY(0)' }} />
        {scenes.map((s) => (
          <button key={s.id} type="button" className="absolute -left-[10px] w-5 h-5 flex items-center justify-center group" style={{ top: `calc(${s.start}% - 10px)` }}
            onMouseEnter={() => setHover(s.id)} onMouseLeave={() => setHover(null)} onClick={() => flyTo(s.id)} aria-label={`Scene ${s.n}: ${s.label}`} aria-current={current === s.id ? 'step' : undefined}>
            <span className={`block rounded-full transition-all duration-300 ${current === s.id ? 'w-2 h-2 bg-ice shadow-[0_0_10px_#BDE2FF]' : 'w-1.5 h-1.5 bg-ice/40 group-hover:bg-sky'}`} />
            <span className={`label absolute right-7 whitespace-nowrap transition-opacity duration-200 ${hover === s.id ? 'opacity-100' : 'opacity-0'}`} style={{ fontSize: 11 }}>{s.n} / {s.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
