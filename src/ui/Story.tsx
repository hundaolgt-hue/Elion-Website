import { useRef } from 'react'
import { useFilmTween, gsap } from '@/lib/film'
import { Icon } from '@/icons/Icon'

/**
 * The narrative layer. Every scene gets a chapter: an eyebrow, a headline in Sora, a short
 * paragraph in Inter and three proof points with animated icons. Chapters enter line by line
 * with the film and leave by sliding under the HUD, so the business is explained at every step
 * of the flight, not only shown.
 */
interface Chapter {
  a: number; b: number; side: 'left' | 'right'; eyebrow: string; title: string; body: string
  points: { icon: string; text: string }[]
}

const CHAPTERS: Chapter[] = [
  { a: 4.8, b: 11.6, side: 'left', eyebrow: 'Aerial precision', title: 'We fly survey-grade missions over Addis Ababa.',
    body: 'RTK-fixed positioning, planned flight lines and calibrated sensors turn every flight into a measurement, not a video. The drone knows where it is to the centimetre, so the data does too.',
    points: [{ icon: 'satellite', text: 'RTK fixed · 24 satellites' }, { icon: 'altitude', text: '2,475 m AMSL survey altitude' }, { icon: 'precision', text: 'Centimetre-grade positioning' }] },
  { a: 13.2, b: 21.3, side: 'left', eyebrow: 'LiDAR drone scans', title: 'Billions of laser points, one city at a time.',
    body: 'Our LiDAR sensor fires hundreds of thousands of pulses a second and records up to five returns per shot, through tree canopy, over rooftops and into courtyards. The whole of Addis Ababa, captured at 400 points per square metre.',
    points: [{ icon: 'lidarScan', text: 'High accuracy acquisition for cities and buildings' }, { icon: 'pulses', text: 'Five returns per pulse, canopy to ground' }, { icon: 'accuracy', text: '±3 cm vertical accuracy' }] },
  { a: 22.5, b: 28, side: 'left', eyebrow: 'Touch the data', title: 'Explore the point cloud yourself.',
    body: 'This is the real GPU point cloud of central Addis Ababa, live in your browser. Orbit it, colour it by elevation, intensity or class, slice it at any height, measure between two pins, thin it to 50, 200 or 400 points per square metre, or replay the scan.',
    points: [{ icon: 'points', text: 'Drag to orbit · right-drag to pan · buttons to zoom' }, { icon: 'accuracy', text: 'Measure distance and height difference in metres' }, { icon: 'density', text: 'See what 50, 200 and 400 pts/m² really look like' }] },
  { a: 28.5, b: 31.8, side: 'right', eyebrow: 'Digital twin', title: 'The point cloud hardens into a living model.',
    body: 'Classification, meshing and texturing turn raw returns into a clean digital twin: every building, road, tree and power line as a separate layer a planner can switch on, measure and query.',
    points: [{ icon: 'digitalTwin', text: 'Realistic twins for cities and buildings' }, { icon: 'processing', text: 'Automated classification and QA pipelines' }, { icon: 'surveying', text: 'Survey outputs for planning and development' }] },
  { a: 41.4, b: 53.6, side: 'left', eyebrow: 'Scan to BIM', title: 'From facade scan to as-built model.',
    body: 'For a single building we fly close and dense. Windows, mullions and structure become a BIM model at LOD 200 to 400, compared against the design so every deviation is found before it costs money.',
    points: [{ icon: 'scanToBim', text: 'Structure, facade, MEP and interiors' }, { icon: 'bim', text: 'LOD 200 to LOD 400 deliverables' }, { icon: 'precision', text: 'Design-versus-built deviation maps' }] },
  { a: 56.4, b: 61.4, side: 'right', eyebrow: 'Live twin', title: 'Sensors keep the twin honest.',
    body: 'Occupancy, energy, lifts, fire and water feeds attach to the model floor by floor. Facilities teams see the building and its twin agree within a heartbeat, and act on either one.',
    points: [{ icon: 'sensors', text: 'IoT feeds pinned to floors and rooms' }, { icon: 'energy', text: 'Energy and comfort in one view' }, { icon: 'lift', text: 'Two-way control, 120 ms round trip' }] },
  { a: 64.2, b: 71.4, side: 'right', eyebrow: '3D cadastre', title: 'Property that can finally be counted in three dimensions.',
    body: 'Parcel boundaries, building footprints and stacked condominium units become a 3D cadastre with centimetre boundaries: the base layer for registration, valuation, tax and planning.',
    points: [{ icon: 'cadastre', text: 'Parcels, footprints and property units' }, { icon: 'verified', text: 'Registration-ready boundary accuracy' }, { icon: 'buildings', text: 'Stacked units in tall buildings' }] },
  { a: 72.8, b: 83.4, side: 'left', eyebrow: 'For all industries', title: 'Beyond the city, the same data serves the land.',
    body: 'Corridors, farms, quarries, dams, forests and heritage sites all need the same thing: an accurate model of the ground and what stands on it. We deliver terrain, volumes, contours and change detection for private and public organisations.',
    points: [{ icon: 'corridor', text: 'Road and rail alignment with cut and fill' }, { icon: 'mining', text: 'Stockpile and quarry volumes' }, { icon: 'flood', text: 'Terrain, drainage and flood simulation' }] },
  { a: 85.2, b: 88.4, side: 'left', eyebrow: 'End to end', title: 'One flight, every dataset your project needs.',
    body: 'Point cloud, surface and terrain models, orthomosaic, 3D mesh, BIM, cadastre and live sensor feeds come out of a single pipeline, delivered through the AI Data Platform or into the tools you already use.',
    points: [{ icon: 'pointcloud', text: 'Point cloud, DSM, DTM, orthomosaic' }, { icon: 'mesh', text: '3D mesh, BIM and cadastre' }, { icon: 'aiPlatform', text: 'Analysis and insights on the platform' }] },
]

function ChapterBlock({ c }: { c: Chapter }) {
  const root = useRef<HTMLDivElement>(null)
  useFilmTween((tl) => {
    const el = root.current!
    const lines = el.querySelectorAll('[data-line]')
    tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, c.a)
    tl.fromTo(lines, { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.55, stagger: 0.14, ease: 'power3.out' }, c.a + 0.1)
    tl.to(lines, { y: -34, autoAlpha: 0, duration: 0.45, stagger: 0.06, ease: 'power2.in' }, c.b - 0.6)
    tl.set(el, { autoAlpha: 0 }, c.b)
    gsap.set(el, { autoAlpha: 0 })
  })
  const pos = c.side === 'left' ? 'left-5 md:left-16 items-start text-left' : 'right-5 md:right-16 items-start md:items-end text-left md:text-right'
  return (
    <div ref={root} className={`fixed top-[20vh] md:top-[21vh] ${pos} z-20 pointer-events-none flex flex-col max-w-[92vw] md:max-w-[520px] opacity-0`} style={{ visibility: 'hidden' }}>
      <div data-line className="label mb-3">{c.eyebrow}</div>
      <h2 data-line className="display text-white" style={{ fontSize: 'clamp(1.6rem, 1rem + 2.4vw, 3.4rem)', fontWeight: 700 }}>{c.title}</h2>
      <p data-line className="mt-4 text-ice/85 text-[15px] md:text-[17px] leading-relaxed max-w-[48ch]">{c.body}</p>
      <ul className={`mt-5 space-y-2 ${c.side === 'right' ? 'md:items-end' : ''} flex flex-col`}>
        {c.points.map((p) => (
          <li key={p.text} data-line className="flex items-center gap-3 text-[13px] md:text-sm text-white/90">
            <span className="w-8 h-8 rounded-full border border-sky/40 bg-navy-900/50 flex items-center justify-center shrink-0"><Icon name={p.icon} size={16} className="text-ice" /></span>
            <span>{p.text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Story() {
  return <>{CHAPTERS.map((c) => <ChapterBlock key={c.a} c={c} />)}</>
}
