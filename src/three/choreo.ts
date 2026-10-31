import * as THREE from 'three'
import { clamp, lerp, smoothstep, easeInOutQuad, easeInOutCubic } from '@/lib/math'
import { generateCity, surveyPose } from '@/world/city'
import { terrainHeight } from '@/world/terrain'

/**
 * The film's choreography. One pure function of progress p (0..1) returns where the drone is,
 * where the camera is, and the value of every scene uniform. Scrolling backwards reverses
 * everything because nothing here keeps state.
 */
export interface Pose {
  drone: { pos: THREE.Vector3; yaw: number; pitch: number; roll: number; scale: number; rotor: number; podOpen: number; coneOpen: number }
  cam: { pos: THREE.Vector3; look: THREE.Vector3; fov: number }
  fx: {
    scan: number; playground: number; twin: number; laptop: number; ripple: number; bim: number; deviation: number
    split: number; cadastreLines: number; cadastreExtrude: number; land: number; contours: number; flood: number
    wave: number; stack: number; dawn: number; cityPhysical: number; droneLight: number; pointsFade: number
    orbitGlow: number; sectionCut: number; landAlt: number
  }
}

const city = generateCity()
const PAD = new THREE.Vector3(city.pad.x, city.pad.y + 0.35, city.pad.z)
const CBE = new THREE.Vector3(city.cbe.x, terrainHeight(city.cbe.x, city.cbe.z), city.cbe.z)
const CBE_TOP = CBE.y + city.cbe.h
const CENTER = new THREE.Vector3(0, 0, 0)
const ALT = 200 // survey altitude above the square (2,475 m AMSL in the HUD)

// Scratch vectors (no per-frame allocation)
const v = Array.from({ length: 12 }, () => new THREE.Vector3())
const out: Pose = {
  drone: { pos: new THREE.Vector3(), yaw: 0, pitch: 0, roll: 0, scale: 1, rotor: 0, podOpen: 0, coneOpen: 0 },
  cam: { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 45 },
  fx: { scan: 0, playground: 0, twin: 0, laptop: 0, ripple: 0, bim: 0, deviation: 0, split: 0, cadastreLines: 0, cadastreExtrude: 0, land: 0, contours: 0, flood: 0, wave: 0, stack: 0, dawn: 0, cityPhysical: 1, droneLight: 0, pointsFade: 1, orbitGlow: 0, sectionCut: 0, landAlt: 0 },
}

/** eased 0..1 inside the percentage window [a,b] */
const seg = (p: number, a: number, b: number, ease: (t: number) => number = easeInOutQuad) => ease(clamp((p * 100 - a) / (b - a)))
const lin = (p: number, a: number, b: number) => clamp((p * 100 - a) / (b - a))
const bell = (p: number, c: number, w: number) => Math.exp(-Math.pow((p * 100 - c) / w, 2) * 2)

/** Catmull-Rom through a list of points at eased parameter t */
function spline(points: THREE.Vector3[], t: number, target: THREE.Vector3) {
  const n = points.length - 1
  const f = clamp(t) * n
  const i = Math.min(n - 1, Math.floor(f))
  const u = f - i
  const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(n, i + 2)]
  const u2 = u * u, u3 = u2 * u
  target.set(
    0.5 * (2 * p1.x + (-p0.x + p2.x) * u + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3),
    0.5 * (2 * p1.y + (-p0.y + p2.y) * u + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3),
    0.5 * (2 * p1.z + (-p0.z + p2.z) * u + (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * u2 + (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * u3),
  )
  return target
}

const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
const lerpAngle = (a: number, b: number, t: number) => a + wrapAngle(b - a) * t
const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3()
/** heading (yaw) along a spline at parameter t; forward = (sin yaw, 0, cos yaw) */
const routeYaw = (points: THREE.Vector3[], t: number) => {
  spline(points, clamp(t, 0, 0.99), tmpA)
  spline(points, clamp(t + 0.01, 0.01, 1), tmpB)
  return Math.atan2(tmpB.x - tmpA.x, tmpB.z - tmpA.z)
}
const scanStart = surveyPose(0)
const TAKEOFF = [
  PAD.clone(),
  PAD.clone().add(new THREE.Vector3(0, 30, 0)),
  new THREE.Vector3(260, PAD.y + 90, -420),
  new THREE.Vector3(-200, ALT + 20, -900),
  new THREE.Vector3(-900, ALT + 10, -1300),
  new THREE.Vector3(scanStart.x, ALT, scanStart.z),
]
const TOCENTER = [new THREE.Vector3(surveyPose(1).x, ALT, surveyPose(1).z), new THREE.Vector3(600, ALT + 40, 700), new THREE.Vector3(0, ALT, 0)]
const LAND_ROUTE = [
  new THREE.Vector3(-300, 620, -400),
  new THREE.Vector3(900, 520, -1200),
  new THREE.Vector3(2000, 420, -2000),
  new THREE.Vector3(2900, 520, -2900),
  new THREE.Vector3(3700, 760, -3700),
  new THREE.Vector3(4300, 980, -4350),
]
const HOME_ROUTE = [LAND_ROUTE[5].clone(), new THREE.Vector3(4750, 1060, -4800), new THREE.Vector3(4650, 1120, -4000), new THREE.Vector3(3000, 1200, -3000), new THREE.Vector3(1400, 900, -1200), new THREE.Vector3(PAD.x, PAD.y + 260, PAD.z)]
const PASS_ROUTE = [new THREE.Vector3(0, 200, 0), new THREE.Vector3(260, 420, 760), new THREE.Vector3(-120, 380, 420), new THREE.Vector3(-520, 160, -420), new THREE.Vector3(CBE.x + Math.cos(-0.6) * 62, CBE.y + 20, CBE.z + Math.sin(-0.6) * 62)]
const LAND_CAM = [new THREE.Vector3(), new THREE.Vector3(PAD.x - 90, PAD.y + 120, PAD.z + 140), new THREE.Vector3(PAD.x + 40, PAD.y + 30, PAD.z + 60), new THREE.Vector3(PAD.x - 9, PAD.y + 4, PAD.z + 12), new THREE.Vector3(PAD.x - 2.4, PAD.y + 0.95, PAD.z + 3.1)]
const HELIX_START = new THREE.Vector3(CBE.x + Math.cos(-0.6) * 62, CBE.y + 20, CBE.z + Math.sin(-0.6) * 62)
const HELIX_YAW0 = wrapAngle(-(-0.6) - Math.PI / 2)
const HELIX_END_ANG = -0.6 + Math.PI * 4
const HELIX_YAW1 = wrapAngle(-HELIX_END_ANG - Math.PI / 2)
const LAND_YAW0 = routeYaw(LAND_ROUTE, 0)
const HOME_YAW1 = routeYaw(HOME_ROUTE, 1)
export const LAND_VIGNETTES = [73, 74.6, 76.2, 77.8, 79.4, 81, 82.6]
export const landPoint = (pct: number, target: THREE.Vector3) => spline(LAND_ROUTE, (pct - 72.5) / 11, target)

export const padPosition = () => PAD
export const cbePosition = () => CBE

export function choreo(p: number, t: number, aspect: number): Pose {
  const d = out.drone, c = out.cam, fx = out.fx
  const pct = p * 100
  const back = 1 - seg(p, 36.4, 38.4) // after the pass-through the city is physical again
  fx.scan = lin(p, 12, 21.5) * back
  fx.playground = pct >= 22 && pct <= 28 ? 1 : 0
  fx.twin = seg(p, 28, 31) * back
  fx.sectionCut = lin(p, 28.5, 31.5)
  fx.laptop = seg(p, 32, 34.2) * (1 - seg(p, 36.2, 38))
  fx.ripple = bell(p, 36.9, 0.9)
  fx.bim = lin(p, 41, 51)
  fx.deviation = seg(p, 51.5, 53.5) * (1 - seg(p, 54.5, 55.5))
  fx.split = seg(p, 54, 56) * (1 - seg(p, 61, 62.5))
  fx.cadastreLines = lin(p, 63, 67) * (1 - seg(p, 72, 73.5))
  fx.cadastreExtrude = seg(p, 66, 70) * (1 - seg(p, 72, 73.5))
  fx.land = seg(p, 72, 74)
  fx.contours = lin(p, 73, 76) * (1 - seg(p, 84, 86))
  fx.flood = smoothstep(75, 78, pct) * (1 - smoothstep(79, 82, pct))
  fx.wave = seg(p, 71, 74) * (1 - seg(p, 88, 91))
  fx.stack = lin(p, 85, 89) * (1 - seg(p, 91, 92.5))
  fx.dawn = seg(p, 94.5, 100)
  // The physical city is replaced by points during the scan, is a twin until the pass-through,
  // and is physical again from the CBE scene on. Points fade when the twin hardens.
  fx.cityPhysical = pct < 37 ? 1 : 1
  fx.pointsFade = (1 - seg(p, 29.5, 31.5)) * back
  fx.droneLight = seg(p, 1, 4)
  fx.orbitGlow = bell(p, 30, 2.5)

  // Rotors: start on the first scroll, spin down on landing
  d.rotor = seg(p, 0.15, 1.4) * (1 - seg(p, 96.5, 99.6))
  d.podOpen = seg(p, 12, 13.5) * (1 - seg(p, 36, 38)) + seg(p, 40, 41.5) * (1 - seg(p, 62, 63)) + seg(p, 72.5, 73.5) * (1 - seg(p, 84, 85.5))
  d.coneOpen = seg(p, 12.5, 14) * (1 - seg(p, 21.5, 22.5)) + seg(p, 40.5, 42) * (1 - seg(p, 53.5, 54.5)) + seg(p, 73, 74) * (1 - seg(p, 83, 84))
  d.scale = 1
  d.pitch = 0
  d.roll = 0

  // ---------------- Drone position ----------------
  if (pct < 4) {
    d.pos.copy(PAD)
    d.pos.y += seg(p, 2.4, 4) * 0.6
    d.yaw = Math.PI * 0.25
  } else if (pct < 12) {
    spline(TAKEOFF, seg(p, 4, 12, easeInOutCubic), d.pos)
    d.yaw = lerp(Math.PI * 0.25, scanStart.heading, seg(p, 5, 9))
  } else if (pct < 21.5) {
    const sp = surveyPose(fx.scan)
    d.pos.set(sp.x, ALT + Math.sin(fx.scan * 40) * 2, sp.z)
    // bank into the turns at strip ends
    const turn = Math.abs(sp.along - 0.5) > 0.47 ? 1 : 0
    d.yaw = sp.heading
    d.roll = turn * 0.2 * (sp.strip % 2 === 0 ? -1 : 1)
  } else if (pct < 22.5) {
    spline(TOCENTER, seg(p, 21.5, 22.5), d.pos)
    d.yaw = lerp(surveyPose(1).heading, Math.PI, seg(p, 21.5, 22.5))
  } else if (pct < 32) {
    d.pos.set(0, ALT, 0)
    d.yaw = Math.PI + seg(p, 28, 32) * Math.PI // turns with the orbiting camera
  } else if (pct < 34.5) {
    d.pos.set(0, ALT, 0)
    d.yaw = Math.PI * 2
    d.scale = lerp(1, 40, seg(p, 32, 34.2)) // the hologram drone grows with the laptop
  } else if (pct < 40) {
    // Flies out of the laptop toward the viewer, through the screen glass, then on to the tower.
    // The camera chases at a distance proportional to the drone's scale, so the drone keeps its
    // on-screen size while it shrinks from hologram scale back to 1.2 m.
    const k = seg(p, 34.5, 40, easeInOutCubic)
    spline(PASS_ROUTE, k, d.pos)
    d.scale = lerp(40, 1, seg(p, 35, 39))
    d.yaw = lerpAngle(routeYaw(PASS_ROUTE, k), HELIX_YAW0, seg(p, 39, 40))
    d.pitch = -0.2 * bell(p, 36.9, 1.5)
  } else if (pct < 54) {
    // Ascending helix around the CBE facade
    const h = seg(p, 40, 50, (x) => x)
    const ang = -0.6 + h * Math.PI * 4
    const r = lerp(62, 44, h)
    const y = lerp(CBE.y + 20, CBE_TOP + 24, h) + seg(p, 50, 54) * 8
    const rr = pct > 50 ? lerp(r, 70, seg(p, 50, 54)) : r
    d.pos.set(CBE.x + Math.cos(ang) * rr, y, CBE.z + Math.sin(ang) * rr)
    d.yaw = -ang - Math.PI / 2
  } else if (pct < 62) {
    const a = -0.6 + Math.PI * 4
    const from = v[3].set(CBE.x + Math.cos(a) * 70, CBE_TOP + 32, CBE.z + Math.sin(a) * 70)
    d.pos.lerpVectors(from, v[4].set(CBE.x - 95, CBE_TOP + 18, CBE.z + 230), seg(p, 54, 56))
    d.yaw = lerpAngle(HELIX_YAW1, Math.PI * 0.85, seg(p, 54, 56))
  } else if (pct < 72) {
    d.pos.lerpVectors(v[4].set(CBE.x - 95, CBE_TOP + 18, CBE.z + 230), LAND_ROUTE[0], seg(p, 62, 65, easeInOutCubic))
    d.yaw = lerpAngle(Math.PI * 0.85, LAND_YAW0, seg(p, 62, 65))
  } else if (pct < 84) {
    spline(LAND_ROUTE, seg(p, 72.5, 83.5, (x) => x), d.pos)
    d.yaw = routeYaw(LAND_ROUTE, seg(p, 72.5, 83.5, (x) => x))
    d.roll = 0.08 * Math.sin(pct * 2.1)
  } else if (pct < 92) {
    spline(HOME_ROUTE, seg(p, 84, 91.5, easeInOutCubic), d.pos)
    d.yaw = routeYaw(HOME_ROUTE, seg(p, 84, 91.5, easeInOutCubic))
  } else {
    const s = seg(p, 92, 97.5, easeInOutCubic)
    d.pos.lerpVectors(v[6].set(PAD.x, PAD.y + 260, PAD.z), PAD, s)
    d.yaw = lerpAngle(HOME_YAW1, Math.PI * 0.25, s)
  }
  fx.landAlt = terrainHeight(d.pos.x, d.pos.z)
  // Idle bob (deterministic noise-like, tiny)
  const bob = d.rotor * (Math.sin(t * 1.7) * 0.06 + Math.sin(t * 2.9 + 1.3) * 0.04) * d.scale
  d.pos.y += bob

  // ---------------- Camera ----------------
  c.fov = 45
  const yawDir = v[7].set(Math.sin(d.yaw), 0, Math.cos(d.yaw)) // forward (drone nose is -z rotated by yaw -> we use +sin/+cos)
  if (pct < 4) {
    c.pos.set(PAD.x - 2.4, PAD.y + 0.95, PAD.z + 3.1)
    c.look.set(PAD.x, PAD.y + 0.4, PAD.z)
    c.fov = 42
  } else if (pct < 12) {
    // tight behind, pulls back and up as the drone climbs
    const k = seg(p, 4, 12, easeInOutCubic)
    const back = lerp(3, 42, k), up = lerp(0.9, 20, k)
    c.pos.copy(d.pos).addScaledVector(yawDir, -back).setY(d.pos.y + up)
    c.look.copy(d.pos).addScaledVector(yawDir, 30 * k).setY(d.pos.y - 10 * k)
    c.fov = lerp(42, 50, k)
  } else if (pct < 22) {
    // high chase cam riding the survey
    const k = seg(p, 21.3, 22)
    c.pos.copy(d.pos).addScaledVector(yawDir, -70).setY(d.pos.y + 46)
    c.look.copy(d.pos).addScaledVector(yawDir, 90).setY(d.pos.y - 70)
    const pgPos = v[8].set(170, 320, 300), pgLook = v[9].set(0, 70, 0)
    c.pos.lerp(pgPos, k)
    c.look.lerp(pgLook, k)
    c.fov = 50
  } else if (pct < 28) {
    c.pos.set(170, 320, 300)
    c.look.set(0, 70, 0)
    c.fov = 50
  } else if (pct < 32) {
    // 180 degree orbit around the hovering drone
    const k = seg(p, 28, 32)
    const a0 = Math.atan2(300, 170), a = a0 + Math.PI * k
    const r = lerp(345, 420, k), y = lerp(320, 360, k)
    c.pos.set(Math.cos(a) * r, y, Math.sin(a) * r)
    c.look.set(0, lerp(70, 90, k), 0)
    c.fov = 50
  } else if (pct < 34.5) {
    const k = seg(p, 32, 34.5, easeInOutCubic)
    const a = Math.atan2(300, 170) + Math.PI
    const from = v[8].set(Math.cos(a) * 420, 360, Math.sin(a) * 420)
    c.pos.lerpVectors(from, v[9].set(0, 1900, 3600), k)
    c.look.lerpVectors(v[10].set(0, 90, 0), v[11].set(0, 150, -250), k)
    c.fov = lerp(50, 44, k)
  } else if (pct < 40) {
    const s = d.scale
    const toC = v[5].set(CBE.x - d.pos.x, 0, CBE.z - d.pos.z).normalize()
    const chase = v[6].copy(d.pos).addScaledVector(toC, -84 * s).setY(d.pos.y + 26 * s)
    const chaseLook = v[1].copy(d.pos).addScaledVector(toC, 30 * s).setY(d.pos.y - 10 * s)
    const k = seg(p, 34.5, 36, easeInOutCubic)
    c.pos.lerpVectors(v[8].set(0, 1900, 3600), chase, k)
    c.look.lerpVectors(v[9].set(0, 150, -250), chaseLook, k)
    c.fov = lerp(44, 48, seg(p, 36, 39))
  } else if (pct < 54) {
    // outside the helix, slightly above the drone, looking at the facade beside it
    const toC = v[8].set(CBE.x - d.pos.x, 0, CBE.z - d.pos.z).normalize()
    c.pos.copy(d.pos).addScaledVector(toC, -84).setY(d.pos.y + 26)
    c.look.copy(d.pos).addScaledVector(toC, 30).setY(d.pos.y - 10)
    c.fov = 48
  } else if (pct < 62) {
    const k = seg(p, 54, 56, easeInOutCubic)
    const front = v[8].set(CBE.x, CBE.y + 118, CBE.z + 560)
    const toC = v[9].set(CBE.x - d.pos.x, 0, CBE.z - d.pos.z).normalize()
    const prev = v[10].copy(d.pos).addScaledVector(toC, -84).setY(d.pos.y + 26)
    c.pos.lerpVectors(prev, front, k)
    c.look.lerpVectors(v[11].copy(d.pos).addScaledVector(toC, 30).setY(d.pos.y - 10), v[5].set(CBE.x, CBE.y + 112, CBE.z), k)
    c.fov = lerp(48, 42, k)
  } else if (pct < 72) {
    // tilt up to a near-orthographic top-down view
    const k = seg(p, 62, 66, easeInOutCubic)
    const front = v[8].set(CBE.x, CBE.y + 118, CBE.z + 560)
    const top = v[9].set(-300, 2100, -399)
    c.pos.lerpVectors(front, top, k)
    c.look.lerpVectors(v[10].set(CBE.x, CBE.y + 112, CBE.z), v[11].set(-300, 0, -400), k)
    c.fov = lerp(42, 24, k)
  } else if (pct < 84) {
    const k = seg(p, 72, 74.5, easeInOutCubic)
    const top = v[8].set(-300, 2100, -399)
    const chase = v[9].copy(d.pos).addScaledVector(yawDir, -46).setY(d.pos.y + 16)
    c.pos.lerpVectors(top, chase, k)
    c.look.lerpVectors(v[10].set(-300, 0, -400), v[11].copy(d.pos).addScaledVector(yawDir, 40).setY(d.pos.y - 30), k)
    c.fov = lerp(24, 52, k)
  } else if (pct < 92) {
    // rise above and behind to show the data stack beneath the drone
    const k = seg(p, 84, 86.5, easeInOutCubic)
    const chase = v[8].copy(d.pos).addScaledVector(yawDir, -46).setY(d.pos.y + 16)
    const high = v[9].copy(d.pos).addScaledVector(yawDir, -60).setY(d.pos.y + 50)
    c.pos.lerpVectors(chase, high, k)
    c.look.lerpVectors(v[10].copy(d.pos).addScaledVector(yawDir, 40).setY(d.pos.y - 30), v[11].copy(d.pos).setY(d.pos.y - 25), k)
    c.fov = lerp(52, 46, k)
  } else {
    const k = seg(p, 92, 98, easeInOutCubic)
    const home = v[9].set(PAD.x - 2.4, PAD.y + 0.95, PAD.z + 3.1)
    LAND_CAM[0].copy(d.pos).addScaledVector(yawDir, -60).setY(d.pos.y + 50)
    spline(LAND_CAM, k, c.pos)
    if (k > 0.98) c.pos.copy(home)
    c.look.lerpVectors(v[10].copy(d.pos).setY(d.pos.y - 25), v[11].set(PAD.x, PAD.y + 0.4, PAD.z), Math.min(1, k * 1.6))
    c.fov = lerp(46, 42, k)
  }
  // Portrait: keep the drone in the upper third by widening the field of view a little
  if (aspect < 0.8) c.fov = Math.min(80, c.fov * 1.35)
  return out
}
