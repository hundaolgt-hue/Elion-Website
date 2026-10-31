import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { useFilm } from '@/lib/store'
import { setRotor, lidarTick } from '@/lib/audio'
import type { Pose } from './choreo'

export const NAVY_900 = new THREE.Color('#0A1B33')
export const NAVY_700 = new THREE.Color('#113B6B')
export const ELYON = new THREE.Color('#1E63D6')
export const SKY = new THREE.Color('#4FA5FF')
export const ICE = new THREE.Color('#BDE2FF')
export const WHITE = new THREE.Color('#FFFFFF')

/** Radial alpha texture used for the motion-blurred rotor disc and the point sprites */
export function useDiscTexture(inner = 0.2) {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const g = c.getContext('2d')!
    const grd = g.createRadialGradient(64, 64, 64 * inner, 64, 64, 64)
    grd.addColorStop(0, 'rgba(255,255,255,0)')
    grd.addColorStop(0.55, 'rgba(255,255,255,0.35)')
    grd.addColorStop(0.9, 'rgba(255,255,255,0.12)')
    grd.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grd
    g.fillRect(0, 0, 128, 128)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [inner])
}

/** Mark on the top shell: the Elyon star-drone, drawn to a canvas texture */
function useMarkTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const g = c.getContext('2d')!
    g.clearRect(0, 0, 256, 256)
    const grad = g.createLinearGradient(0, 0, 256, 0)
    grad.addColorStop(0, '#1E63D6')
    grad.addColorStop(1, '#4FA5FF')
    g.fillStyle = grad
    // four wings
    const wing = (rot: number) => {
      g.save(); g.translate(128, 128); g.rotate(rot)
      g.beginPath(); g.moveTo(0, -18); g.lineTo(100, -8); g.lineTo(110, 0); g.lineTo(100, 8); g.lineTo(0, 18); g.closePath(); g.fill()
      g.restore()
    }
    wing(Math.PI * 0.18); wing(Math.PI * 0.82); wing(-Math.PI * 0.18); wing(-Math.PI * 0.82)
    // building silhouette
    g.fillStyle = '#0A1B33'
    g.fillRect(110, 40, 12, 90); g.fillRect(122, 20, 12, 110); g.fillRect(134, 55, 12, 75)
    // point spray
    g.fillStyle = '#4FA5FF'
    for (let r = 0; r < 5; r++) for (let i = -r; i <= r; i++) { g.beginPath(); g.arc(128 + i * 9, 150 + r * 14, 2.2 - r * 0.25, 0, Math.PI * 2); g.fill() }
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    return t
  }, [])
}

/**
 * The Elyon quadcopter: matte navy body, Elyon Blue accents, gimbal LiDAR pod, rotors with a
 * motion-blur disc, rotor-wash particles and a scan cone with laser lines. Procedural so it ships
 * at zero asset cost; the same hierarchy is exported to glTF by scripts/export-drone.mjs.
 */
export function Drone({ poseRef }: { poseRef: React.MutableRefObject<Pose> }) {
  const group = useRef<THREE.Group>(null!)
  const body = useRef<THREE.Group>(null!)
  const rotors = useRef<THREE.Group[]>([])
  const discs = useRef<THREE.Mesh[]>([])
  const pod = useRef<THREE.Group>(null!)
  const cone = useRef<THREE.Mesh>(null!)
  const coneMat = useRef<THREE.ShaderMaterial>(null!)
  const lasers = useRef<THREE.LineSegments>(null!)
  const wash = useRef<THREE.Points>(null!)
  const light = useRef<THREE.PointLight>(null!)
  const disc = useDiscTexture(0.25)
  const mark = useMarkTexture()
  const spin = useRef(0)

  const coneShader = useMemo(() => ({
    uniforms: { uOpen: { value: 0 }, uTime: { value: 0 }, uColor: { value: SKY.clone() } },
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying float vH;
      void main() { vUv = uv; vH = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uOpen; uniform float uTime; uniform vec3 uColor; varying vec2 vUv; varying float vH;
      void main() {
        float along = 1.0 - vUv.y; // 0 at apex
        float edge = smoothstep(0.0, 0.02, along) * (1.0 - smoothstep(0.75, 1.0, along));
        float lines = smoothstep(0.92, 1.0, abs(sin(vUv.x * 40.0 + uTime * 2.0)));
        float sweep = smoothstep(0.96, 1.0, abs(sin(along * 18.0 - uTime * 6.0)));
        float a = (0.022 + 0.05 * lines + 0.05 * sweep) * edge * uOpen;
        gl_FragColor = vec4(uColor, a);
      }`,
  }), [])

  const washGeo = useMemo(() => {
    const n = 220
    const pos = new Float32Array(n * 3)
    const seed = new Float32Array(n)
    for (let i = 0; i < n; i++) { seed[i] = Math.random() }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    return g
  }, [])

  const laserGeo = useMemo(() => {
    const n = 14
    const pos = new Float32Array(n * 6)
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      pos.set([0, 0, 0, Math.cos(a) * 1, -1, Math.sin(a) * 1], i * 6)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [])

  useFrame((state, dt) => {
    const pose = poseRef.current
    const d = pose.drone
    const s = useFilm.getState()
    group.current.position.copy(d.pos)
    group.current.rotation.set(0, d.yaw, 0)
    group.current.scale.setScalar(d.scale)
    body.current.rotation.set(d.pitch, 0, d.roll)
    // rotors
    const rpm = d.rotor
    spin.current += dt * (4 + rpm * 90)
    rotors.current.forEach((r, i) => { if (r) r.rotation.y = spin.current * (i % 2 === 0 ? 1 : -1) })
    discs.current.forEach((m) => { if (m) (m.material as THREE.MeshBasicMaterial).opacity = Math.min(0.55, rpm * 0.6) })
    // pod and cone
    pod.current.rotation.x = -d.podOpen * 0.25
    pod.current.position.y = -0.14 - d.podOpen * 0.06
    coneMat.current.uniforms.uOpen.value = d.coneOpen
    coneMat.current.uniforms.uTime.value = state.clock.elapsedTime
    cone.current.visible = d.coneOpen > 0.01
    // cone reaches the ground: altitude above terrain / scale, swath 320 m at 200 m
    const alt = Math.max(2, d.pos.y - (pose.fx.landAlt ?? 0))
    const h = Math.min(alt, 260) / Math.max(0.001, d.scale)
    cone.current.scale.set(h * 0.8, h, h * 0.8)
    cone.current.position.y = -h / 2 - 0.2
    lasers.current.visible = cone.current.visible
    lasers.current.scale.set(h * 0.8, h, h * 0.8)
    lasers.current.rotation.y = state.clock.elapsedTime * 1.4
    ;(lasers.current.material as THREE.LineBasicMaterial).opacity = 0.35 * d.coneOpen
    // wash: visible only near surfaces (within 12 m of the pad)
    const near = Math.max(0, 1 - alt / 14) * rpm
    const pos = washGeo.attributes.position as THREE.BufferAttribute
    const seed = washGeo.attributes.aSeed as THREE.BufferAttribute
    const t = state.clock.elapsedTime
    for (let i = 0; i < pos.count; i++) {
      const sd = seed.getX(i)
      const life = (t * (0.6 + sd) + sd * 7) % 1
      const a = sd * Math.PI * 2 + t * 0.3
      const r = 0.4 + life * 2.6
      pos.setXYZ(i, Math.cos(a) * r, -alt / d.scale + 0.08 + life * 0.35 + Math.sin(life * 8 + sd) * 0.05, Math.sin(a) * r)
    }
    pos.needsUpdate = true
    ;(wash.current.material as THREE.PointsMaterial).opacity = near * 0.5
    wash.current.visible = near > 0.02
    light.current.intensity = 8 * pose.fx.droneLight * d.scale * d.scale
    if (s.soundOn) {
      setRotor(rpm, s.velocity)
      if (d.coneOpen > 0.3 && Math.abs(s.velocity) > 50) lidarTick(6 + Math.min(20, Math.abs(s.velocity) / 150))
    } else setRotor(0, 0)
  })

  const armLen = 0.46
  const arms = [45, 135, 225, 315]
  return (
    <group ref={group} name="drone">
      <group ref={body}>
        {/* main body */}
        <RoundedBox args={[0.42, 0.11, 0.56]} radius={0.04} smoothness={3} castShadow>
          <meshStandardMaterial color={NAVY_900} roughness={0.55} metalness={0.25} />
        </RoundedBox>
        <mesh position={[0, 0.062, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.3, 0.3]} />
          <meshBasicMaterial map={mark} transparent depthWrite={false} toneMapped={false} />
        </mesh>
        {/* front sensor strip */}
        <mesh position={[0, 0.0, 0.285]}>
          <boxGeometry args={[0.18, 0.03, 0.01]} />
          <meshBasicMaterial color={SKY} toneMapped={false} />
        </mesh>
        {/* arms and rotors */}
        {arms.map((deg, i) => {
          const a = (deg * Math.PI) / 180
          const x = Math.sin(a) * armLen, z = Math.cos(a) * armLen
          return (
            <group key={deg}>
              <mesh position={[x / 2, 0.01, z / 2]} rotation={[0, a, 0]}>
                <boxGeometry args={[0.045, 0.035, armLen]} />
                <meshStandardMaterial color={NAVY_700} roughness={0.6} metalness={0.3} />
              </mesh>
              <mesh position={[x, 0.04, z]}>
                <cylinderGeometry args={[0.04, 0.05, 0.07, 16]} />
                <meshStandardMaterial color={ELYON} roughness={0.4} metalness={0.5} />
              </mesh>
              <group ref={(el) => { if (el) rotors.current[i] = el }} position={[x, 0.085, z]}>
                <mesh rotation={[0, 0, 0]}>
                  <boxGeometry args={[0.44, 0.006, 0.03]} />
                  <meshStandardMaterial color={NAVY_900} roughness={0.5} />
                </mesh>
                <mesh rotation={[0, Math.PI / 2, 0]}>
                  <boxGeometry args={[0.44, 0.006, 0.03]} />
                  <meshStandardMaterial color={NAVY_900} roughness={0.5} />
                </mesh>
              </group>
              <mesh ref={(el) => { if (el) discs.current[i] = el }} position={[x, 0.086, z]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.23, 32]} />
                <meshBasicMaterial map={disc} color={ICE} transparent opacity={0} depthWrite={false} toneMapped={false} />
              </mesh>
              {/* nav light */}
              <mesh position={[x, -0.01, z]}>
                <sphereGeometry args={[0.012, 8, 8]} />
                <meshBasicMaterial color={i < 2 ? SKY : ICE} toneMapped={false} />
              </mesh>
            </group>
          )
        })}
        {/* legs */}
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * 0.14, -0.1, 0]}>
            <boxGeometry args={[0.02, 0.12, 0.34]} />
            <meshStandardMaterial color={NAVY_700} roughness={0.7} />
          </mesh>
        ))}
        {/* gimbal LiDAR pod */}
        <group ref={pod} position={[0, -0.14, 0.05]}>
          <mesh>
            <cylinderGeometry args={[0.075, 0.075, 0.12, 24]} />
            <meshStandardMaterial color={NAVY_900} roughness={0.35} metalness={0.5} />
          </mesh>
          <mesh position={[0, -0.062, 0]}>
            <cylinderGeometry args={[0.05, 0.06, 0.012, 24]} />
            <meshBasicMaterial color={SKY} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0, 0.06]}>
            <boxGeometry args={[0.06, 0.04, 0.03]} />
            <meshStandardMaterial color={ELYON} roughness={0.4} metalness={0.4} />
          </mesh>
        </group>
      </group>
      {/* Scan cone, in drone space but not tilted with the body */}
      <mesh ref={cone} position={[0, -1, 0]} renderOrder={5}>
        <coneGeometry args={[1, 1, 48, 1, true]} />
        <shaderMaterial ref={coneMat} args={[coneShader]} transparent depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
      <lineSegments ref={lasers} geometry={laserGeo} renderOrder={6}>
        <lineBasicMaterial color={SKY} transparent opacity={0.2} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </lineSegments>
      <points ref={wash} geometry={washGeo}>
        <pointsMaterial map={disc} color={ICE} size={0.09} sizeAttenuation transparent opacity={0} depthWrite={false} />
      </points>
      <pointLight ref={light} color={SKY} intensity={0} distance={40} decay={2} position={[0, -0.2, 0]} />
    </group>
  )
}
