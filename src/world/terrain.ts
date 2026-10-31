import * as THREE from 'three'
import { fbm, clamp, lerp } from '@/lib/math'

/**
 * Heightfield for the whole world: the Addis Ababa basin (flattened, gently rising north,
 * as the real city does toward Entoto), the Entoto ridge to the north (about +650 m),
 * and the rolling highland beyond the city edge. Sampled on the CPU into a float texture,
 * then read by the terrain, the dotted wave and the drone, so every layer agrees.
 */
export const WORLD_HALF = 8000 // metres
export const HM_RES = 512
export const CITY_RADIUS = 1900

export const terrainHeightRaw = (x: number, z: number) => {
  const r = Math.hypot(x, z)
  // Basin slope: north is higher. 25 m per km.
  const slope = -z * 0.025
  // Rolling highland, grows with distance from the city
  const hills = (fbm(x * 0.00045 + 3.1, z * 0.00045 + 7.7, 5) - 0.45) * 420
  const detail = (fbm(x * 0.0025, z * 0.0025, 3) - 0.5) * 40
  const rural = clamp((r - CITY_RADIUS) / 1400)
  const ruralS = rural * rural * (3 - 2 * rural)
  // Entoto ridge: a long east-west crest north of the city
  const ridge = 650 * Math.exp(-Math.pow((z + 4600) / 1100, 2)) * (0.8 + 0.35 * fbm(x * 0.0008, 0.3, 3))
  // River valley cutting south-east out of the city (Akaki direction)
  const vx = x - 1800 - (z - 600) * 0.35
  const valley = -70 * Math.exp(-Math.pow(vx / 260, 2)) * clamp((z - 300) / 800) * clamp((3500 - z) / 1000)
  return slope + lerp(0, hills + detail, ruralS) + ridge + lerp(0, valley, clamp((r - 1200) / 900))
}

let heightmap: Float32Array | null = null
export const getHeightmap = () => {
  if (heightmap) return heightmap
  heightmap = new Float32Array(HM_RES * HM_RES)
  for (let j = 0; j < HM_RES; j++) {
    for (let i = 0; i < HM_RES; i++) {
      const x = (i / (HM_RES - 1)) * 2 * WORLD_HALF - WORLD_HALF
      const z = (j / (HM_RES - 1)) * 2 * WORLD_HALF - WORLD_HALF
      heightmap[j * HM_RES + i] = terrainHeightRaw(x, z)
    }
  }
  return heightmap
}

/** Bilinear height sample, identical to the GPU texture2D lookup */
export const terrainHeight = (x: number, z: number) => {
  const hm = getHeightmap()
  const u = clamp((x + WORLD_HALF) / (2 * WORLD_HALF)) * (HM_RES - 1)
  const v = clamp((z + WORLD_HALF) / (2 * WORLD_HALF)) * (HM_RES - 1)
  const i0 = Math.floor(u), j0 = Math.floor(v)
  const i1 = Math.min(HM_RES - 1, i0 + 1), j1 = Math.min(HM_RES - 1, j0 + 1)
  const fu = u - i0, fv = v - j0
  const a = hm[j0 * HM_RES + i0], b = hm[j0 * HM_RES + i1], c = hm[j1 * HM_RES + i0], d = hm[j1 * HM_RES + i1]
  return lerp(lerp(a, b, fu), lerp(c, d, fu), fv)
}

let tex: THREE.DataTexture | null = null
export const getHeightTexture = () => {
  if (tex) return tex
  tex = new THREE.DataTexture(getHeightmap(), HM_RES, HM_RES, THREE.RedFormat, THREE.FloatType)
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearFilter
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
  tex.needsUpdate = true
  return tex
}

export const GLSL_HEIGHT = /* glsl */ `
uniform sampler2D uHeight;
const float WORLD_HALF = ${WORLD_HALF.toFixed(1)};
float terrainHeight(vec2 xz) {
  vec2 uv = (xz + WORLD_HALF) / (2.0 * WORLD_HALF);
  return texture2D(uHeight, uv).r;
}
`
