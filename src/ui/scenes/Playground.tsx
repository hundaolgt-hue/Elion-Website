import { useEffect, useRef, useState } from 'react'
import { useFilm, type ColorMode } from '@/lib/store'
import { useFilmTween } from '@/lib/film'
import { Icon } from '@/icons/Icon'
import { CLASSES } from '@/world/pointcloud'
import { UTM_ORIGIN } from '@/lib/math'

/** Interactive point-cloud playground (22 to 26 %): colour modes, slice, measure, class filter, density, scan replay */
export function Playground() {
  const root = useRef<HTMLDivElement>(null)
  const active = useFilm((s) => s.playground)
  const colorMode = useFilm((s) => s.colorMode)
  const pointSize = useFilm((s) => s.pointSize)
  const slice = useFilm((s) => s.slice)
  const classMask = useFilm((s) => s.classMask)
  const density = useFilm((s) => s.density)
  const measuring = useFilm((s) => s.measuring)
  const pins = useFilm((s) => s.measurePins)
  const hovered = useFilm((s) => s.hovered)
  const scanReplay = useFilm((s) => s.scanReplay)
  const set = useFilm((s) => s.set)
  const [hint, setHint] = useState(true)
  useFilmTween((tl) => {
    tl.fromTo(root.current, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 22.7)
    tl.to(root.current, { autoAlpha: 0, y: 30, duration: 0.5, ease: 'power2.in' }, 25.7)
  })
  useEffect(() => { if (!active) set({ measuring: false, scanReplay: null }) }, [active, set])
  const dist = pins.length === 2 ? Math.hypot(pins[1][0] - pins[0][0], pins[1][2] - pins[0][2]) : 0
  const dh = pins.length === 2 ? Math.abs(pins[1][1] - pins[0][1]) : 0
  const toggleClass = (i: number) => { const m = classMask.slice(); m[i] = !m[i]; set({ classMask: m }) }
  return (
    <div ref={root} className="fixed inset-x-0 bottom-0 z-30 opacity-0" style={{ visibility: 'hidden', pointerEvents: active ? 'auto' : 'none' }}>
      <div className="absolute left-5 md:left-8 bottom-[calc(100%+16px)] md:bottom-auto md:top-[-52vh] pointer-events-none">
        <div className="label mb-1">Touch the data</div>
        <div className="mono text-white text-sm">2.4 billion points, live</div>
        {hovered.kind === 'point' && typeof hovered.data?.x === 'number' && (
          <div className="mt-2 mono text-ice/80 text-xs">E {Math.round(UTM_ORIGIN.e + (hovered.data.x as number)).toLocaleString('en-US')} · N {Math.round(UTM_ORIGIN.n - (hovered.data.z as number)).toLocaleString('en-US')} · Ground</div>
        )}
        {hovered.kind === 'building' && (
          <div className="mt-2 mono text-ice/80 text-xs">Building · {hovered.data?.height} m · {hovered.data?.footprint} m² footprint · {hovered.data?.floors} floors · E {Math.round(UTM_ORIGIN.e + (hovered.data?.x as number)).toLocaleString('en-US')} N {Math.round(UTM_ORIGIN.n - (hovered.data?.z as number)).toLocaleString('en-US')}</div>
        )}
        {hint && active && <div className="mt-3 text-ice/60 text-xs">Drag to orbit · right-drag to pan · scroll on to continue</div>}
      </div>
      <div className="card mx-3 md:mx-auto mb-3 md:mb-6 md:max-w-[1060px] px-3 py-3 flex flex-nowrap md:flex-wrap overflow-x-auto md:overflow-visible items-center gap-x-5 gap-y-3 text-xs text-white [&>*]:shrink-0" onPointerDown={() => setHint(false)} data-lenis-prevent>
        <div className="flex items-center gap-1">
          <span className="label mr-2" style={{ fontSize: 10 }}>Colour</span>
          {(['elevation', 'intensity', 'classification', 'rgb'] as ColorMode[]).map((m) => (
            <button key={m} type="button" onClick={() => set({ colorMode: m })} className={`pill !h-9 !px-3 !text-xs ${colorMode === m ? 'solid' : ''}`}>{m === 'rgb' ? 'RGB' : m[0].toUpperCase() + m.slice(1)}</button>
          ))}
        </div>
        <label className="flex items-center gap-2"><span className="label" style={{ fontSize: 10 }}>Size</span><input type="range" min={0.4} max={3} step={0.1} value={pointSize} onChange={(e) => set({ pointSize: Number(e.target.value) })} aria-label="Point size" /></label>
        <label className="flex items-center gap-2"><span className="label" style={{ fontSize: 10 }}>Cross-section</span><input type="range" min={0.02} max={1} step={0.01} value={slice} onChange={(e) => set({ slice: Number(e.target.value) })} aria-label="Cross-section height" /></label>
        <div className="flex items-center gap-1">
          <span className="label mr-1" style={{ fontSize: 10 }}>Classes</span>
          {CLASSES.map((c, i) => (
            <button key={c} type="button" onClick={() => toggleClass(i)} aria-pressed={classMask[i]} className={`pill !h-9 !px-3 !text-xs ${classMask[i] ? '' : 'opacity-40'}`}>{c}</button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="label mr-1" style={{ fontSize: 10 }}>Density</span>
          {([50, 200, 400] as const).map((d) => (
            <button key={d} type="button" onClick={() => set({ density: d })} className={`pill !h-9 !px-3 !text-xs ${density === d ? 'solid' : ''}`}>{d} pts/m²</button>
          ))}
        </div>
        <button type="button" onClick={() => set({ measuring: !measuring, measurePins: [] })} className={`pill !h-9 !px-3 !text-xs ${measuring ? 'solid' : ''}`}><Icon name="accuracy" size={16} draw={false} /> Measure</button>
        {pins.length === 2 && <span className="mono text-ice">{dist.toFixed(1)} m · Δh {dh.toFixed(1)} m</span>}
        <label className="flex items-center gap-2 ml-auto"><Icon name="clock" size={16} className="text-ice" draw={false} /><span className="label" style={{ fontSize: 10 }}>Replay scan</span><input type="range" min={0} max={1} step={0.002} value={scanReplay ?? 1} onChange={(e) => set({ scanReplay: Number(e.target.value) })} aria-label="Replay the scan" /></label>
      </div>
    </div>
  )
}
