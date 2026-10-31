import { mulberry, clamp } from '@/lib/math'
import { generateCity, surveyOrder, CITY_HALF } from './city'
import { terrainHeight } from './terrain'

/** Classification codes shared with the shaders: 0 ground, 1 building, 2 vegetation, 3 road, 4 water */
export const CLASSES = ['Ground', 'Building', 'Vegetation', 'Road', 'Water'] as const

export interface PointCloudData {
  position: Float32Array
  cls: Float32Array
  order: Float32Array
  rand: Float32Array
  count: number
  minY: number
  maxY: number
}

/**
 * Sample a LiDAR-like point cloud from the procedural city: roofs and facades of every building,
 * a ground grid classified as ground or road, vegetation blobs, and a river. Points carry a survey
 * order so they are "born" exactly when the drone's scan cone passes over them.
 */
export function buildPointCloud(target: number): PointCloudData {
  const city = generateCity()
  const rnd = mulberry(7)
  const position = new Float32Array(target * 3)
  const cls = new Float32Array(target)
  const order = new Float32Array(target)
  const rand = new Float32Array(target)
  let n = 0
  let minY = Infinity, maxY = -Infinity
  const push = (x: number, y: number, z: number, c: number) => {
    if (n >= target) return
    position[n * 3] = x; position[n * 3 + 1] = y; position[n * 3 + 2] = z
    cls[n] = c
    order[n] = surveyOrder(x, z)
    rand[n] = rnd()
    if (y < minY) minY = y
    if (y > maxY) maxY = y
    n++
  }

  // Budget split
  const bBudget = Math.floor(target * 0.55)
  const gBudget = Math.floor(target * 0.33)
  const vBudget = Math.floor(target * 0.1)
  const wBudget = target - bBudget - gBudget - vBudget

  // Buildings: roof + facades, proportional to surface area
  let totalArea = 0
  for (const b of city.buildings) totalArea += b.w * b.d + 2 * (b.w + b.d) * b.h * 0.35
  for (const b of city.buildings) {
    const area = b.w * b.d + 2 * (b.w + b.d) * b.h * 0.35
    const k = Math.max(6, Math.round((area / totalArea) * bBudget))
    const roofK = Math.round(k * ((b.w * b.d) / area))
    for (let i = 0; i < roofK; i++) {
      const x = b.x + (rnd() - 0.5) * b.w, z = b.z + (rnd() - 0.5) * b.d
      const parapet = Math.abs(x - b.x) > b.w / 2 - 1.2 || Math.abs(z - b.z) > b.d / 2 - 1.2 ? 1.1 : 0
      push(x, b.y + b.h + parapet + (rnd() < 0.04 ? rnd() * 3 : 0), z, 1)
    }
    for (let i = roofK; i < k; i++) {
      const side = Math.floor(rnd() * 4)
      const t = rnd() - 0.5, y = b.y + rnd() * b.h
      if (side === 0) push(b.x + t * b.w, y, b.z - b.d / 2, 1)
      else if (side === 1) push(b.x + t * b.w, y, b.z + b.d / 2, 1)
      else if (side === 2) push(b.x - b.w / 2, y, b.z + t * b.d, 1)
      else push(b.x + b.w / 2, y, b.z + t * b.d, 1)
    }
  }
  // Ground and roads
  const pitch = 92 + 18
  for (let i = 0; i < gBudget; i++) {
    const x = (rnd() * 2 - 1) * (CITY_HALF + 300), z = (rnd() * 2 - 1) * (CITY_HALF + 300)
    const gx = ((x + CITY_HALF) % pitch + pitch) % pitch, gz = ((z + CITY_HALF) % pitch + pitch) % pitch
    const onStreet = gx > 92 || gz > 92
    // Bole road
    const dx = 1600, dz = 1120, t = clamp((x * dx + (z - 60) * dz) / (dx * dx + dz * dz))
    const dBole = Math.hypot(x - t * dx, z - 60 - t * dz)
    const road = onStreet || dBole < 30
    push(x, terrainHeight(x, z) + (road ? 0.05 : rnd() * 0.4), z, road ? 3 : 0)
  }
  // Vegetation
  for (let i = 0; i < vBudget; i++) {
    const tr = city.trees[Math.floor(rnd() * city.trees.length)]
    const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * tr.r
    const x = tr.x + Math.cos(a) * rr, z = tr.z + Math.sin(a) * rr
    const y = terrainHeight(x, z) + tr.h * (0.45 + 0.55 * Math.sqrt(1 - (rr / tr.r) ** 2)) * (0.8 + rnd() * 0.3)
    push(x, y, z, 2)
  }
  // River
  for (let i = 0; i < wBudget; i++) {
    const s = rnd() * (city.river.length - 1), i0 = Math.floor(s), f = s - i0
    const a = city.river[i0], b = city.river[Math.min(city.river.length - 1, i0 + 1)]
    const x = a[0] + (b[0] - a[0]) * f + (rnd() - 0.5) * 24, z = a[1] + (b[1] - a[1]) * f + (rnd() - 0.5) * 24
    push(x, terrainHeight(x, z) - 1.5, z, 4)
  }
  return { position: position.subarray(0, n * 3), cls: cls.subarray(0, n), order: order.subarray(0, n), rand: rand.subarray(0, n), count: n, minY, maxY }
}
