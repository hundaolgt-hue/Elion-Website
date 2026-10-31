import { mulberry, clamp, lerp } from '@/lib/math'
import { terrainHeight } from './terrain'

/**
 * Procedural central Addis Ababa. 1 unit = 1 metre, origin at Meskel Square, +x east, +z south.
 * Overpass (OpenStreetMap) is not reachable from the build environment, so the footprint grid is
 * synthesised from the city's real structure: Meskel Square at the centre, the Bole Road corridor
 * running south-east toward the airport, the CBE headquarters tower to the north-west, the light
 * rail east-west and north-south through the square, and the Entoto ridge on the northern horizon.
 * Swap `generateCity` for a GeoJSON loader to use real footprints without touching the renderers.
 */
export interface Building {
  id: number
  x: number
  z: number
  w: number
  d: number
  h: number
  y: number
  floors: number
  kind: 0 | 1 | 2 | 3 // 0 residential, 1 office, 2 tower, 3 landmark
  order: number // survey order 0..1 (lawn-mower pattern)
  district: string
  parcel: { w: number; d: number; area: number; units: number; use: string; code: string }
}

export interface CityData {
  buildings: Building[]
  roads: { a: [number, number]; b: [number, number]; width: number }[]
  rail: [number, number][][]
  river: [number, number][]
  trees: { x: number; z: number; r: number; h: number }[]
  half: number
  cbe: { x: number; z: number; h: number; floors: number; rx: number; rz: number }
  pad: { x: number; z: number; y: number }
  meskel: { x: number; z: number; w: number; d: number }
}

export const CITY_HALF = 1600
export const SWATH = 320
export const STRIPS = Math.ceil((CITY_HALF * 2) / SWATH) // 10

/** Lawn-mower survey pose for scan progress t in 0..1 */
export const surveyPose = (t: number) => {
  const tt = clamp(t) * STRIPS
  const strip = Math.min(STRIPS - 1, Math.floor(tt))
  const along = tt - strip
  const dir = strip % 2 === 0 ? 1 : -1
  const x = dir * lerp(-CITY_HALF, CITY_HALF, along)
  const z = -CITY_HALF + SWATH * 0.5 + strip * SWATH
  return { x, z, heading: dir > 0 ? Math.PI / 2 : -Math.PI / 2, strip, along }
}

/** Survey order of a point in the lawn-mower pattern */
export const surveyOrder = (x: number, z: number) => {
  const strip = clamp(Math.floor((z + CITY_HALF) / SWATH), 0, STRIPS - 1)
  const dir = strip % 2 === 0 ? 1 : -1
  const along = clamp((dir * x + CITY_HALF) / (2 * CITY_HALF))
  return (strip + along) / STRIPS
}

const USES = ['Mixed-use', 'Residential', 'Commercial', 'Office', 'Institutional']

let cache: CityData | null = null
export function generateCity(): CityData {
  if (cache) return cache
  const rnd = mulberry(20261031)
  const buildings: Building[] = []
  const roads: CityData['roads'] = []
  const trees: CityData['trees'] = []

  const block = 92, street = 18, pitch = block + street
  const n = Math.floor((CITY_HALF * 2) / pitch)
  const meskel = { x: 0, z: 40, w: 420, d: 230 }
  const cbe = { x: -760, z: -880, h: 209, floors: 46, rx: 34, rz: 24 }
  const pad = { x: 360, z: -220, y: 0 }

  // Street grid
  for (let i = 0; i <= n; i++) {
    const c = -CITY_HALF + i * pitch - street / 2
    roads.push({ a: [c, -CITY_HALF], b: [c, CITY_HALF], width: i % 4 === 0 ? 30 : street })
    roads.push({ a: [-CITY_HALF, c], b: [CITY_HALF, c], width: i % 4 === 0 ? 30 : street })
  }
  // Bole Road corridor: Meskel Square toward the airport (south-east)
  const bole = { a: [0, 60] as [number, number], b: [1600, 1180] as [number, number] }
  roads.push({ a: bole.a, b: bole.b, width: 60 })
  // Churchill Avenue north-west toward the CBE tower
  roads.push({ a: [-60, -40], b: [-900, -1300], width: 40 })

  const inMeskel = (x: number, z: number) => Math.abs(x - meskel.x) < meskel.w / 2 + 20 && Math.abs(z - meskel.z) < meskel.d / 2 + 20
  const distToSeg = (px: number, pz: number, a: [number, number], b: [number, number]) => {
    const dx = b[0] - a[0], dz = b[1] - a[1]
    const t = clamp(((px - a[0]) * dx + (pz - a[1]) * dz) / (dx * dx + dz * dz))
    return Math.hypot(px - (a[0] + t * dx), pz - (a[1] + t * dz))
  }

  let id = 0
  for (let bi = 0; bi < n; bi++) {
    for (let bj = 0; bj < n; bj++) {
      const bx = -CITY_HALF + bi * pitch + block / 2
      const bz = -CITY_HALF + bj * pitch + block / 2
      const r = Math.hypot(bx, bz) / CITY_HALF
      if (inMeskel(bx, bz)) continue
      if (Math.hypot(bx - cbe.x, bz - cbe.z) < 110) continue
      if (Math.hypot(bx - pad.x, bz - pad.z) < 70 && !(Math.abs(bx - pad.x) < 40 && Math.abs(bz - pad.z) < 40)) continue
      const dBole = distToSeg(bx, bz, bole.a, bole.b)
      if (dBole < 40) continue
      const nearBole = dBole < 170
      const nw = bx < -200 && bz < -300 // CBD, Churchill / Piazza side
      // density falls with radius; outskirts become sparse and green
      const occupancy = clamp(1.05 - r * 0.55)
      const per = r < 0.45 ? 3 : r < 0.8 ? 2 : 1
      const district = nearBole ? 'Bole' : nw ? 'Arada' : bz > 500 ? 'Nifas Silk' : bx > 500 ? 'Yeka' : bz < -500 ? 'Gulele' : 'Kirkos'
      for (let k = 0; k < per; k++) {
        if (rnd() > occupancy) {
          if (rnd() < 0.5) trees.push({ x: bx + (rnd() - 0.5) * block, z: bz + (rnd() - 0.5) * block, r: 5 + rnd() * 7, h: 6 + rnd() * 8 })
          continue
        }
        const w = per === 1 ? 24 + rnd() * 50 : 18 + rnd() * 30
        const d = per === 1 ? 24 + rnd() * 50 : 18 + rnd() * 30
        const ox = per === 1 ? 0 : (k - (per - 1) / 2) * (block / per)
        const x = bx + (per === 1 ? (rnd() - 0.5) * 10 : ox)
        const z = bz + (rnd() - 0.5) * (block - d - 6)
        let floors: number
        let kind: Building['kind'] = 0
        const t = rnd()
        if (nearBole) { floors = t < 0.2 ? 18 + Math.floor(rnd() * 12) : 7 + Math.floor(rnd() * 9); kind = floors > 15 ? 2 : 1 }
        else if (nw) { floors = t < 0.15 ? 14 + Math.floor(rnd() * 14) : 4 + Math.floor(rnd() * 8); kind = floors > 12 ? 2 : 1 }
        else if (r < 0.5) { floors = t < 0.08 ? 12 + Math.floor(rnd() * 10) : 3 + Math.floor(rnd() * 7); kind = floors > 10 ? 2 : t < 0.5 ? 1 : 0 }
        else if (r < 0.85) { floors = 2 + Math.floor(rnd() * 5); kind = 0 }
        else { floors = 1 + Math.floor(rnd() * 3); kind = 0 }
        const h = floors * 3.3 + (kind === 2 ? 6 : 1.2)
        const y = terrainHeight(x, z)
        const area = Math.round(w * d * (1.15 + rnd() * 0.6))
        buildings.push({
          id: id++, x, z, w, d, h, y, floors, kind, order: surveyOrder(x, z), district,
          parcel: { w: w + 6, d: d + 6, area, units: Math.max(1, Math.round(floors * (kind === 0 ? 2 : 4) * (0.6 + rnd() * 0.8))), use: USES[Math.floor(rnd() * USES.length)], code: `${String(1000 + Math.floor(rnd() * 9000)).slice(0, 4)}-${String(Math.floor(rnd() * 99)).padStart(2, '0')}` },
        })
      }
    }
  }
  // The CBE headquarters: scene-5 protagonist, 46 floors, 209 m
  buildings.push({
    id: id++, x: cbe.x, z: cbe.z, w: cbe.rx * 2, d: cbe.rz * 2, h: cbe.h, y: terrainHeight(cbe.x, cbe.z), floors: 46, kind: 3, order: surveyOrder(cbe.x, cbe.z), district: 'Arada',
    parcel: { w: 120, d: 110, area: 13200, units: 46, use: 'Office', code: '0412-07' },
  })
  // Launch-pad tower: the navy tower whose helipad the drone starts from
  buildings.push({
    id: id++, x: pad.x, z: pad.z, w: 36, d: 36, h: 72, y: terrainHeight(pad.x, pad.z), floors: 21, kind: 2, order: surveyOrder(pad.x, pad.z), district: 'Kirkos',
    parcel: { w: 44, d: 44, area: 1936, units: 84, use: 'Office', code: '0311-12' },
  })
  pad.y = terrainHeight(pad.x, pad.z) + 72

  // Outskirts trees and eucalyptus belts to the north
  for (let i = 0; i < 1800; i++) {
    const a = rnd() * Math.PI * 2, rr = CITY_HALF * (0.75 + rnd() * 0.55)
    const x = Math.cos(a) * rr, z = Math.sin(a) * rr
    if (inMeskel(x, z)) continue
    trees.push({ x, z, r: 4 + rnd() * 8, h: 5 + rnd() * 10 })
  }

  // Light rail: east-west through Meskel Square, north-south on Menelik II / Kaliti line
  const rail: [number, number][][] = [
    [[-CITY_HALF - 600, 150], [-400, 150], [0, 160], [600, 160], [CITY_HALF + 600, 170]],
    [[-250, -CITY_HALF - 600], [-250, -300], [-240, 160], [-230, 700], [-200, CITY_HALF + 600]],
  ]
  // River (Bantyiketu / Kebena direction) flowing south-east
  const river: [number, number][] = []
  for (let i = 0; i <= 40; i++) {
    const t = i / 40
    river.push([lerp(500, 2600, t) + Math.sin(t * 9) * 60, lerp(-1700, 2200, t) + Math.cos(t * 7) * 50])
  }

  cache = { buildings, roads, rail, river, trees, half: CITY_HALF, cbe, pad, meskel }
  return cache
}
