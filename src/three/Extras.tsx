import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { Pose } from './choreo'
import { landPoint } from './choreo'
import { terrainHeight } from '@/world/terrain'
import { useDiscTexture } from './Drone'

/**
 * Auto-classified movers: a pigeon flock that crosses the scan cone (Scene 2) and a cattle herd
 * crossing a field (Scene 8). Both are captured as short-lived Ice points and tagged by the DOM.
 */
export function Movers({ poseRef }: { poseRef: React.MutableRefObject<Pose> }) {
  const pigeons = useRef<THREE.Points>(null!)
  const cattle = useRef<THREE.Points>(null!)
  const disc = useDiscTexture(0.1)
  const pGeo = useMemo(() => {
    const n = 60
    const pos = new Float32Array(n * 3)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.userData.seeds = Array.from({ length: n }, () => [Math.random(), Math.random(), Math.random()])
    return g
  }, [])
  const cGeo = useMemo(() => {
    const n = 28
    const pos = new Float32Array(n * 3)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.userData.seeds = Array.from({ length: n }, () => [Math.random(), Math.random()])
    return g
  }, [])
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame((state) => {
    const pct = poseRef.current.drone.pos ? (state as unknown as { progress?: number }).progress ?? 0 : 0
    void pct
    const t = state.clock.elapsedTime
    const fx = poseRef.current.fx
    // Pigeons: visible 16 to 19 %, crossing in front of the drone
    const p = useProgress()
    const pv = p > 0.16 && p < 0.19
    pigeons.current.visible = pv
    if (pv) {
      const d = poseRef.current.drone.pos
      const k = (p - 0.16) / 0.03
      const pos = pGeo.attributes.position as THREE.BufferAttribute
      const seeds = pGeo.userData.seeds as number[][]
      for (let i = 0; i < pos.count; i++) {
        const [a, b, c] = seeds[i]
        pos.setXYZ(i, d.x - 120 + k * 240 + a * 30 + Math.sin(t * 3 + a * 9) * 2, d.y - 60 + b * 14 + Math.sin(t * 5 + c * 9) * 1.5, d.z + 40 - k * 80 + c * 30)
      }
      pos.needsUpdate = true
    }
    // Cattle: a herd in the field near the agriculture vignette (73 to 75.5 %)
    const cv = p > 0.728 && p < 0.755
    cattle.current.visible = cv
    if (cv) {
      landPoint(74, tmp)
      const pos = cGeo.attributes.position as THREE.BufferAttribute
      const seeds = cGeo.userData.seeds as number[][]
      for (let i = 0; i < pos.count; i++) {
        const [a, b] = seeds[i]
        const x = tmp.x + 120 + a * 60 + t * 1.2, z = tmp.z + 80 + b * 40
        pos.setXYZ(i, x, terrainHeight(x, z) + 1.3, z)
      }
      pos.needsUpdate = true
    }
    void fx
  })
  return (
    <group>
      <points ref={pigeons} geometry={pGeo} visible={false} frustumCulled={false}>
        <pointsMaterial map={disc} color={'#BDE2FF'} size={1.4} sizeAttenuation transparent opacity={0.9} depthWrite={false} />
      </points>
      <points ref={cattle} geometry={cGeo} visible={false} frustumCulled={false}>
        <pointsMaterial map={disc} color={'#BDE2FF'} size={2.4} sizeAttenuation transparent opacity={0.9} depthWrite={false} />
      </points>
    </group>
  )
}

import { useFilm } from '@/lib/store'
const useProgress = () => useFilm.getState().progress

/** Invisible ground plane for pointer hits: UTM read-outs and measurement pins in the playground */
export function GroundPicker() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.5, 0]}
      visible={false}
      onPointerMove={(e) => {
        const s = useFilm.getState()
        if (!s.playground) return
        if (s.hovered.kind === 'building') return
        s.set({ hovered: { kind: 'point', data: { x: e.point.x, y: e.point.y, z: e.point.z } } })
      }}
      onClick={(e) => {
        const s = useFilm.getState()
        if (!s.playground || !s.measuring) return
        const pins = s.measurePins.slice(-1)
        pins.push([e.point.x, e.point.y, e.point.z])
        s.set({ measurePins: pins })
      }}
    >
      <planeGeometry args={[4000, 4000]} />
      <meshBasicMaterial />
    </mesh>
  )
}

/** Sky pins and a measuring line for the playground measure tool */
export function MeasurePins() {
  const pins = useFilm((s) => s.measurePins)
  const geo = useMemo(() => {
    if (pins.length < 2) return null
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute([...pins[0], ...pins[1]], 3))
    return g
  }, [pins])
  return (
    <group>
      {pins.map((p, i) => (
        <group key={i} position={[p[0], p[1], p[2]]}>
          <mesh position={[0, 6, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 12, 8]} />
            <meshBasicMaterial color={'#4FA5FF'} toneMapped={false} />
          </mesh>
          <mesh position={[0, 13, 0]}>
            <sphereGeometry args={[1.6, 16, 16]} />
            <meshBasicMaterial color={'#BDE2FF'} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {geo && (
        <lineSegments geometry={geo}>
          <lineBasicMaterial color={'#4FA5FF'} toneMapped={false} />
        </lineSegments>
      )}
    </group>
  )
}
