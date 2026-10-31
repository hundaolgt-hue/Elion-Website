import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { Pose } from './choreo'

/**
 * The laptop that the digital twin turns out to be sitting on. Scaled to the city (the twin is a
 * hologram on its touch surface), a glass base with a Sky bezel, a key field in front and the lid
 * behind. The dashboard UI itself is DOM (see ui/scenes/Platform.tsx) projected onto the lid.
 */
export function Laptop({ poseRef }: { poseRef: React.MutableRefObject<Pose> }) {
  const group = useRef<THREE.Group>(null!)
  const mats = useRef<THREE.Material[]>([])
  const keys = useRef<THREE.InstancedMesh>(null!)
  const W = 4400, D = 3000, LID_H = 2900
  const keyList = useMemo(() => {
    const list: [number, number][] = []
    for (let r = 0; r < 5; r++) for (let c = 0; c < 14; c++) list.push([-W * 0.36 + c * 280 + (r % 2) * 40, 1700 + r * 220])
    return list
  }, [])
  useFrame(() => {
    const k = poseRef.current.fx.laptop
    group.current.visible = k > 0.01
    if (!group.current.visible) return
    for (const m of mats.current) if (m) { m.opacity = k * ((m.userData.max as number) ?? 1); m.transparent = true }
    if (keys.current && !keys.current.userData.done) {
      const m = new THREE.Matrix4()
      keyList.forEach(([x, z], i) => { m.makeTranslation(x, -4, z); keys.current.setMatrixAt(i, m) })
      keys.current.instanceMatrix.needsUpdate = true
      keys.current.userData.done = true
    }
    // the lid opens with the materialisation
    const lid = group.current.getObjectByName('lid')
    if (lid) lid.rotation.x = -Math.PI / 2 + 0.32 + (1 - k) * 0.9
  })
  const reg = (max: number) => (m: THREE.Material | null) => { if (m) { m.userData.max = max; mats.current.push(m) } }
  return (
    <group ref={group} visible={false}>
      {/* base slab beneath the city (glass) */}
      <mesh position={[0, -90, 400]}>
        <boxGeometry args={[W, 120, D + 1400]} />
        <meshStandardMaterial ref={reg(0.55)} color={'#113B6B'} roughness={0.25} metalness={0.3} transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* bezel outline: the city is the screen */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.5, -150]}>
        <ringGeometry args={[0, 1, 4]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      <lineSegments position={[0, 2, -150]}>
        <edgesGeometry args={[new THREE.BoxGeometry(W * 0.86, 0.1, D * 0.9)]} />
        <lineBasicMaterial ref={reg(0.9)} color={'#4FA5FF'} transparent opacity={0} toneMapped={false} />
      </lineSegments>
      {/* keyboard */}
      <instancedMesh ref={keys} args={[undefined, undefined, keyList.length]} frustumCulled={false}>
        <boxGeometry args={[220, 24, 160]} />
        <meshStandardMaterial ref={reg(0.9)} color={'#0A1B33'} roughness={0.5} emissive={'#4FA5FF'} emissiveIntensity={0.08} transparent opacity={0} />
      </instancedMesh>
      <mesh position={[0, -2, 2900]}>
        <boxGeometry args={[1400, 10, 700]} />
        <meshStandardMaterial ref={reg(0.7)} color={'#113B6B'} roughness={0.4} transparent opacity={0} />
      </mesh>
      {/* lid, hinged at the north edge */}
      <group name="lid" position={[0, -20, -D / 2 - 700]} rotation={[-Math.PI / 2 + 0.32, 0, 0]}>
        <mesh position={[0, LID_H / 2, 0]}>
          <boxGeometry args={[W, LID_H, 40]} />
          <meshStandardMaterial ref={reg(0.85)} color={'#0A1B33'} roughness={0.35} metalness={0.4} transparent opacity={0} />
        </mesh>
        <mesh position={[0, LID_H / 2, 22]} name="lidScreen">
          <planeGeometry args={[W * 0.92, LID_H * 0.88]} />
          <meshBasicMaterial ref={reg(0.95)} color={'#113B6B'} transparent opacity={0} toneMapped={false} />
        </mesh>
        <lineSegments position={[0, LID_H / 2, 23]}>
          <edgesGeometry args={[new THREE.PlaneGeometry(W * 0.92, LID_H * 0.88)]} />
          <lineBasicMaterial ref={reg(1)} color={'#4FA5FF'} transparent opacity={0} toneMapped={false} />
        </lineSegments>
      </group>
    </group>
  )
}
