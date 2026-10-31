import { useEffect, useMemo, useState } from 'react'
import { Html } from '@react-three/drei'
import { generateCity } from '@/world/city'
import { terrainHeight } from '@/world/terrain'
import { useFilm } from '@/lib/store'
import { Icon } from '@/icons/Icon'
import type { Pose } from './choreo'

/** 3D-anchored HTML goes into a fixed layer above the canvas and the footage, never into the scrolling document */
const portal = { get current() { return document.getElementById('stage-html') as HTMLElement } }

const TAG_WINDOW = (p: number) => p > 0.043 && p < 0.062
const SENSOR_WINDOW = (p: number) => p > 0.555 && p < 0.615
const PARCEL_WINDOW = (p: number) => p > 0.675 && p < 0.72

/** True while the film progress satisfies `test`; re-renders only on change */
function useWindowActive(test: (p: number) => boolean) {
  const [on, setOn] = useState(() => test(useFilm.getState().progress))
  useEffect(() => useFilm.subscribe((s) => { const v = test(s.progress); setOn((prev) => (prev === v ? prev : v)) }), [test])
  return on
}

/** Rooftop tags that flash on as the drone's shadow sweeps the first building (Scene 1) */
export function RooftopTags({ poseRef }: { poseRef: React.MutableRefObject<Pose> }) {
  const city = useMemo(() => generateCity(), [])
  const { pad } = city
  const on = useWindowActive(TAG_WINDOW)
  const tags: [string, [number, number, number]][] = [
    ['tank', [pad.x + 13, pad.y + 2.4, pad.z - 12]],
    ['antenna', [pad.x - 10, pad.y + 8.6, pad.z - 9]],
    ['parapet 1.1 m', [pad.x, pad.y + 1.4, pad.z + 17.5]],
    ['helipad Ø 7.2 m', [pad.x + 3.6, pad.y + 0.4, pad.z]],
  ]
  void poseRef
  if (!on) return null
  return (
    <group>
      {tags.map(([t, pos]) => (
        <Html key={t} position={pos} center zIndexRange={[5, 0]} portal={portal} style={{ pointerEvents: 'none' }}>
          <span className="tag3d">{t}</span>
        </Html>
      ))}
    </group>
  )
}

const SENSORS = [
  { floor: 44, icon: 'occupancy', label: 'Occupancy', value: '62 %' },
  { floor: 36, icon: 'hvac', label: 'HVAC', value: '21.5 °C' },
  { floor: 31, icon: 'energy', label: 'Energy meter', value: '418 kW' },
  { floor: 20, icon: 'lift', label: 'Lift status', value: 'Car 2 · L20' },
  { floor: 8, icon: 'fire', label: 'Fire panel', value: 'L8-04 test' },
  { floor: 3, icon: 'water', label: 'Water pressure', value: '4.1 bar' },
] as const

/** Sensor icons pinned to floors of the twin half (Scene 6); hovering a floor toggles its lights */
export function SensorAnchors({ poseRef }: { poseRef: React.MutableRefObject<Pose> }) {
  const city = useMemo(() => generateCity(), [])
  const base = terrainHeight(city.cbe.x, city.cbe.z)
  const fh = 209 / 46
  const on = useWindowActive(SENSOR_WINDOW)
  void poseRef
  if (!on || useFilm.getState().isMobile) return null
  return (
    <group>
      {SENSORS.map((s) => (
        <Html key={s.label} position={[city.cbe.x + city.cbe.rx + 14, base + (s.floor + 0.5) * fh, city.cbe.z]} zIndexRange={[5, 0]} portal={portal} style={{ pointerEvents: 'auto' }}>
          <div className="sensor card" data-floor={s.floor}
            onPointerEnter={() => useFilm.getState().set({ hovered: { kind: 'card', data: { floor: s.floor } } })}
            onPointerLeave={() => useFilm.getState().set({ hovered: { kind: 'none' } })}
            onClick={() => useFilm.getState().toggleFloor(s.floor, 'twin')}>
            <Icon name={s.icon} size={22} className="text-ice" draw />
            <div><div className="label" style={{ fontSize: 10, letterSpacing: '0.14em' }}>L{s.floor + 1} · {s.label}</div><div className="mono text-white text-sm">{s.value}</div></div>
          </div>
        </Html>
      ))}
    </group>
  )
}

/** Three parcel cards rising from the cadastre (Scene 7) */
export function ParcelAnchors({ poseRef }: { poseRef: React.MutableRefObject<Pose> }) {
  const city = useMemo(() => generateCity(), [])
  const picks = useMemo(() => {
    const near = city.buildings.filter((b) => Math.hypot(b.x + 300, b.z + 400) < 420 && b.floors >= 6)
    return [near[3], near[11], near[19]].filter(Boolean)
  }, [city])
  const on = useWindowActive(PARCEL_WINDOW)
  void poseRef
  if (!on) return null
  return (
    <group>
      {picks.map((b, i) => (
        <Html key={b.id} position={[b.x, b.y + Math.min(b.floors, 30) * 3.3 + 8, b.z]} zIndexRange={[5, 0]} portal={portal} style={{ pointerEvents: 'none' }}>
          <div className="card parcel" style={{ animationDelay: `${i * 120}ms` }}>
            <div className="label" style={{ fontSize: 10 }}>Parcel {i === 0 ? '0412-07' : b.parcel.code}</div>
            <div className="text-white text-sm leading-snug mt-1">{i === 0 ? '612' : b.parcel.area.toLocaleString('en-US')} m² · {i === 0 ? 'Mixed-use' : b.parcel.use}<br />{i === 0 ? 9 : b.floors} floors · {i === 0 ? 32 : b.parcel.units} units<br /><span className="text-sky">Title: registered</span></div>
          </div>
        </Html>
      ))}
    </group>
  )
}
