import { useRef } from 'react'
import { useFilmTween } from '@/lib/film'
import { Icon } from '@/icons/Icon'
import { STACK_LAYERS } from '@/three/DataStack'

const LAYER_ICONS = ['pointcloud', 'dsm', 'dtm', 'ortho', 'mesh', 'bim', 'cadastre', 'sensors']
const PIPE = [['lidarScan', 'LiDAR Drone Scans'], ['surveying', 'Surveying'], ['processing', 'Data Processing'], ['aiPlatform', 'AI Data Platform'], ['digitalTwin', 'Digital Twin'], ['industries', 'For All Industries']]

/** Scene 9: the data stack list and the six services as the end-to-end pipeline the drone flies along */
export function Stack() {
  const root = useRef<HTMLDivElement>(null)
  const layers = useRef<HTMLDivElement>(null)
  const pipe = useRef<HTMLDivElement>(null)
  const line = useRef<HTMLDivElement>(null)
  const droneIcon = useRef<HTMLDivElement>(null)
  const h1 = useRef<HTMLDivElement>(null)
  const h2 = useRef<HTMLDivElement>(null)
  useFilmTween((tl) => {
    tl.fromTo(root.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 84.6)
    tl.fromTo(layers.current!.children, { autoAlpha: 0, x: 30 }, { autoAlpha: 1, x: 0, duration: 0.4, stagger: 0.45, ease: 'power3.out' }, 85)
    tl.fromTo(pipe.current!.children, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.35, ease: 'power3.out' }, 86.5)
    tl.fromTo(line.current, { scaleX: 0 }, { scaleX: 1, duration: 2.2, ease: 'none' }, 86.5)
    tl.fromTo(droneIcon.current, { left: '0%' }, { left: '100%', duration: 2.2, ease: 'none' }, 86.5)
    tl.fromTo(h1.current, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 88.6)
    tl.fromTo(h2.current, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 89.6)
    tl.to(root.current, { autoAlpha: 0, y: -30, duration: 0.6, ease: 'power2.in' }, 91.6)
  })
  return (
    <div ref={root} className="fixed inset-0 z-20 pointer-events-none opacity-0" aria-hidden="true">
      <div ref={layers} className="absolute right-4 md:right-14 top-24 w-[200px] md:w-[240px] space-y-1 hidden md:block">
        {STACK_LAYERS.map((l, i) => (
          <div key={l} className="card px-3 py-1.5 flex items-center gap-2 text-sm text-white opacity-0"><Icon name={LAYER_ICONS[i]} size={18} className="text-ice" /> {l}</div>
        ))}
      </div>
      <div className="absolute left-5 right-5 md:left-16 md:right-16 bottom-32 md:bottom-36">
        <div className="relative h-px bg-ice/20 mb-6 hidden md:block">
          <div ref={line} className="absolute inset-0 bg-sky origin-left" style={{ transform: 'scaleX(0)' }} />
          <div ref={droneIcon} className="absolute -top-3 -ml-3 text-ice" style={{ left: 0 }}><Icon name="drone" size={24} draw={false} /></div>
        </div>
        <div ref={pipe} className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
          {PIPE.map(([icon, name], i) => (
            <div key={name} className="flex md:flex-col items-center gap-2 md:gap-3 text-center opacity-0">
              <Icon name={icon} size={30} className="text-ice shrink-0" />
              <div className="label text-left md:text-center" style={{ fontSize: 10, letterSpacing: '0.14em' }}>{name}{i < 5 && <span className="hidden md:inline text-ice/40"> →</span>}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute left-5 md:left-16 top-24 md:top-28">
        <div ref={h1} className="display opacity-0" style={{ fontSize: 'clamp(1.8rem, 1rem + 3vw, 4.2rem)' }}>We Capture.<br />We Process.<br />We Transform.</div>
        <div ref={h2} className="display text-sky opacity-0 mt-2" style={{ fontSize: 'clamp(1.8rem, 1rem + 3vw, 4.2rem)' }}>You Build The Future.</div>
      </div>
    </div>
  )
}
