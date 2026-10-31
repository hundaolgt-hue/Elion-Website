import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { Pose } from './choreo'

export const STACK_LAYERS = ['Point cloud', 'DSM', 'DTM', 'Orthomosaic', '3D mesh', 'BIM', 'Cadastre', 'Sensor feeds']

/** Every dataset from the flight stacks into a layered cube beneath the drone on the way home */
export function DataStack({ poseRef }: { poseRef: React.MutableRefObject<Pose> }) {
  const group = useRef<THREE.Group>(null!)
  const layers = useRef<THREE.Mesh[]>([])
  const edges = useRef<THREE.LineSegments>(null!)
  const colors = useMemo(() => ['#4FA5FF', '#113B6B', '#1E63D6', '#113B6B', '#BDE2FF', '#1E63D6', '#4FA5FF', '#BDE2FF'], [])
  useFrame((state) => {
    const { fx, drone } = poseRef.current
    const k = fx.stack
    group.current.visible = k > 0.005
    if (!group.current.visible) return
    group.current.position.copy(drone.pos)
    group.current.position.y -= 9
    group.current.rotation.y = state.clock.elapsedTime * 0.15
    const n = STACK_LAYERS.length
    layers.current.forEach((m, i) => {
      if (!m) return
      const local = Math.min(1, Math.max(0, k * (n + 1) - i))
      const e = 1 - Math.pow(1 - local, 3)
      m.position.set((1 - e) * 60 * (i % 2 ? 1 : -1), -i * 3.2, 0)
      ;(m.material as THREE.MeshBasicMaterial).opacity = e * (i % 2 ? 0.35 : 0.6)
      m.visible = local > 0
    })
    const eo = edges.current.material as THREE.LineBasicMaterial
    eo.opacity = Math.max(0, (k - 0.85) / 0.15) * 0.9
  })
  return (
    <group ref={group} visible={false}>
      {STACK_LAYERS.map((name, i) => (
        <mesh key={name} ref={(el) => { if (el) layers.current[i] = el }} rotation={[-Math.PI / 2, 0, 0]} name={name}>
          <planeGeometry args={[34, 34]} />
          <meshBasicMaterial color={colors[i]} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} wireframe={i % 2 === 0} />
        </mesh>
      ))}
      <lineSegments ref={edges} position={[0, -(STACK_LAYERS.length - 1) * 1.6, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(34, (STACK_LAYERS.length - 1) * 3.2 + 1, 34)]} />
        <lineBasicMaterial color={'#BDE2FF'} transparent opacity={0} toneMapped={false} />
      </lineSegments>
    </group>
  )
}
