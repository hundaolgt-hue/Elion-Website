import { Icon } from '@/icons/Icon'
import { Mark } from '@/brand/Mark'

const KEYFRAMES = [
  { n: '00', t: 'LiDAR Drone Data. Smarter Cities. Stronger Future.', d: 'LiDAR Drone Solutions. Data That Builds Tomorrow.', icon: 'drone' },
  { n: '01', t: 'Aerial precision', d: 'RTK-fixed flight over Addis Ababa at 2,475 m AMSL; every rooftop detail labelled.', icon: 'aerial' },
  { n: '02', t: 'LiDAR drone scans', d: '2.4 billion points, 400 pts/m², ±3 cm vertical accuracy, 320 m swath, 527 km² covered.', icon: 'lidarScan' },
  { n: '03', t: 'Digital twin', d: '178,000 building footprints, 4,900 km of roads, 12 % canopy, power lines, water bodies, 1 m contours.', icon: 'digitalTwin' },
  { n: '04', t: 'One Platform. Endless Possibilities.', d: 'Beyond Perspective. Into Intelligence. Dashboard, Projects, Analytics, Digital Twin.', icon: 'aiPlatform' },
  { n: '05', t: 'Scan to BIM', d: 'The CBE headquarters, 209 m, 46 floors, 11,240 facade panels, LOD 200 to 400, max deviation 18 mm.', icon: 'scanToBim' },
  { n: '06', t: 'Live twin', d: 'Every sensor. Both worlds. One truth. Occupancy, HVAC, energy, lifts, fire, water, in sync within 120 ms.', icon: 'sensors' },
  { n: '07', t: '3D cadastre', d: '93,400 parcels, 1.2 M 3D property units, ±5 cm boundary accuracy.', icon: 'cadastre' },
  { n: '08', t: 'For all industries', d: 'Agriculture, corridors, mining, powerlines, dams, forestry, heritage.', icon: 'industries' },
  { n: '09', t: 'We Capture. We Process. We Transform. You Build The Future.', d: 'LiDAR Drone Scans → Surveying → Data Processing → AI Data Platform → Digital Twin → For All Industries.', icon: 'processing' },
]

/** Reduced-motion edition: the same story as static keyframes with cross-fades instead of the scroll film */
export function Reduced() {
  return (
    <div className="relative z-10 text-white">
      {KEYFRAMES.map((k, i) => (
        <section key={k.n} className="min-h-[80vh] flex items-center px-6 md:px-16 border-b border-ice/10" style={{ background: i % 2 ? 'color-mix(in srgb, #113B6B 35%, #0A1B33)' : '#0A1B33' }}>
          <div className="max-w-[900px]">
            <div className="flex items-center gap-4"><Icon name={k.icon} size={40} className="text-ice" draw={false} /><span className="label">{k.n} / {k.t}</span></div>
            <h2 className="display mt-6" style={{ fontSize: 'clamp(1.8rem, 1rem + 3vw, 4.5rem)' }}>{k.t}</h2>
            <p className="mt-5 text-ice/80 text-lg max-w-[56ch]">{k.d}</p>
          </div>
        </section>
      ))}
      <section className="min-h-[50vh] flex items-center px-6 md:px-16">
        <div className="flex items-center gap-6"><Mark size={56} /><p className="text-2xl font-display font-semibold max-w-[30ch]">Uniting aerial precision, LiDAR technology and intelligent data to create a smarter world.</p></div>
      </section>
    </div>
  )
}
