import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { generateCity } from '@/world/city'
import { terrainHeight } from '@/world/terrain'
import { useFilm } from '@/lib/store'
import type { Pose } from './choreo'

const P = {
  uNavy900: { value: new THREE.Color('#0A1B33') }, uNavy700: { value: new THREE.Color('#113B6B') },
  uElyon: { value: new THREE.Color('#1E63D6') }, uSky: { value: new THREE.Color('#4FA5FF') }, uIce: { value: new THREE.Color('#BDE2FF') }, uWhite: { value: new THREE.Color('#FFFFFF') },
}

/**
 * The Commercial Bank of Ethiopia headquarters: 46 storeys, 209 m, elliptical plan with a
 * curved glass crown. One shader handles the night facade, the scan-to-BIM level-by-level build,
 * the as-built deviation overlay (Sky to Ice only) and the physical/digital split with live floors.
 */
export function CbeTower({ poseRef }: { poseRef: React.MutableRefObject<Pose> }) {
  const city = useMemo(() => generateCity(), [])
  const { cbe } = city
  const base = terrainHeight(cbe.x, cbe.z)
  const mat = useRef<THREE.ShaderMaterial>(null!)
  const facadeMat = useRef<THREE.ShaderMaterial>(null!)
  const floorTex = useMemo(() => {
    const t = new THREE.DataTexture(new Uint8Array(64 * 4), 64, 1, THREE.RGBAFormat)
    t.needsUpdate = true
    return t
  }, [])

  const geometry = useMemo(() => {
    // shaft (0..188 m) + crown rising to 209 m on the north side
    const shaft = new THREE.CylinderGeometry(1, 1, 188, 64, 46, false)
    shaft.translate(0, 94, 0)
    const crown = new THREE.CylinderGeometry(0.96, 1, 21, 64, 8, true, Math.PI * 0.65, Math.PI * 1.1)
    crown.translate(0, 188 + 10.5, 0)
    const spire = new THREE.CylinderGeometry(0.02, 0.05, 14, 8)
    spire.translate(0, 209 + 7, -0.5)
    const pos: number[] = [], nor: number[] = [], uv: number[] = []
    for (const g of [shaft, crown, spire]) {
      const gg = g.toNonIndexed()
      pos.push(...Array.from(gg.attributes.position.array))
      nor.push(...Array.from(gg.attributes.normal.array))
      uv.push(...Array.from(gg.attributes.uv.array))
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    geo.scale(cbe.rx, 1, cbe.rz)
    return geo
  }, [cbe])

  const shader = useMemo(() => ({
    uniforms: { uTime: { value: 0 }, uBim: { value: 0 }, uDev: { value: 0 }, uSplit: { value: 0 }, uFloors: { value: floorTex }, uDawn: { value: 0 }, uDrone: { value: new THREE.Vector3() }, uDroneLight: { value: 0 }, uCenterX: { value: cbe.x }, uHoverFloor: { value: -1 }, ...P },
    vertexShader: /* glsl */ `
      varying vec3 vWorld; varying vec3 vNormal; varying vec2 vUv; varying float vY;
      void main() {
        vUv = uv; vY = position.y;
        vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz;
        vNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uBim, uDev, uSplit, uDawn, uDroneLight, uCenterX, uHoverFloor; uniform vec3 uDrone; uniform sampler2D uFloors;
      uniform vec3 uNavy900, uNavy700, uElyon, uSky, uIce, uWhite;
      varying vec3 vWorld; varying vec3 vNormal; varying vec2 vUv; varying float vY;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main() {
        vec3 n = normalize(vNormal);
        float floorH = 209.0 / 46.0;
        float fl = floor(vY / floorH);
        float fy = fract(vY / floorH);
        float ang = vUv.x * 64.0; // mullion columns
        float fx = fract(ang);
        float win = step(0.18, fx) * step(fx, 0.9) * step(0.12, fy) * step(fy, 0.92);
        float lit = texture2D(uFloors, vec2((fl + 0.5) / 64.0, 0.5)).r;
        float occupancy = step(0.35, hash(vec2(floor(ang), fl)));
        float hemi = 0.55 + 0.45 * n.y;
        float moon = max(0.0, dot(n, normalize(vec3(-0.4, 0.8, 0.35))));
        vec3 glassNight = mix(uNavy900, uNavy700, 0.5 + 0.3 * moon) * (0.6 + 0.4 * hemi);
        float dd = distance(vWorld, uDrone);
        float dl = min(0.5, uDroneLight * 25.0 / (1.0 + dd * dd * 0.15)) * max(0.0, dot(n, normalize(uDrone - vWorld)));
        vec3 physical = mix(glassNight, mix(uIce, uWhite, 0.3) * (0.7 + 0.3 * hemi), uDawn * 0.9) + uSky * dl * 0.5 + uSky * win * lit * occupancy * 0.45 * (1.0 - uDawn * 0.9);
        physical += uIce * (1.0 - step(0.18, fx)) * 0.06; // mullions
        // BIM: levels build from the ground; wire edges at floor slabs and mullions
        float built = step(fl + 0.2, uBim * 48.0);
        float wire = max(1.0 - smoothstep(0.0, fwidth(fy) * 2.0, min(fy, 1.0 - fy)), 1.0 - smoothstep(0.0, fwidth(fx) * 2.0, min(fx, 1.0 - fx)));
        vec3 bimGlass = mix(uNavy700, uElyon, 0.4) * 0.9;
        vec3 bim = mix(bimGlass, uIce, wire * 0.9);
        // deviation heat (Sky to Ice only): a gentle band around level 31, column C-14
        float dev = exp(-pow((vY - 31.0 * floorH) / 9.0, 2.0)) * exp(-pow((vUv.x - 0.22) / 0.06, 2.0));
        vec3 devCol = mix(uSky, uIce, dev);
        // twin side (x > centre) when split
        float twinSide = step(uCenterX, vWorld.x) * uSplit;
        vec3 twin = mix(bimGlass, uIce, wire * 0.85) + uSky * win * lit * occupancy * 0.35;
        if (uHoverFloor == fl) twin += uIce * 0.3;
        float seam = 1.0 - smoothstep(0.0, 0.8, abs(vWorld.x - uCenterX));
        vec3 col = physical;
        col = mix(col, bim, uBim > 0.0 ? built * smoothstep(0.0, 0.05, uBim) * 0.85 : 0.0);
        col = mix(col, devCol, dev * uDev * 0.9);
        col = mix(col, twin, twinSide);
        col = mix(col, uSky, seam * uSplit);
        // scan reveal: the facade is dark glass until the BIM reaches it, except when physical
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  }), [floorTex, cbe.x])

  // Facade points: windows and mullions as a point grid, born with the helix scan
  const facadeGeo = useMemo(() => {
    const pts: number[] = [], ord: number[] = []
    const floors = 46, cols = 96
    for (let f = 0; f < floors; f++) for (let c = 0; c < cols; c++) {
      const a = (c / cols) * Math.PI * 2
      for (let k = 0; k < 3; k++) {
        const y = base + (f + 0.15 + k * 0.33) * (209 / 46)
        pts.push(cbe.x + Math.cos(a) * cbe.rx * 1.01, y, cbe.z + Math.sin(a) * cbe.rz * 1.01)
        ord.push(f / floors + (c / cols) * 0.3 / floors)
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    g.setAttribute('aOrder', new THREE.Float32BufferAttribute(ord, 1))
    return g
  }, [cbe, base])

  const facadeShader = useMemo(() => ({
    uniforms: { uScan: { value: 0 }, uPR: { value: 1 }, uSky: P.uSky, uIce: P.uIce },
    vertexShader: /* glsl */ `
      attribute float aOrder; uniform float uScan, uPR; varying float vA;
      void main() {
        float born = step(aOrder, uScan);
        if (born < 0.5) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); gl_PointSize = 0.0; vA = 0.0; return; }
        float age = clamp((uScan - aOrder) * 30.0, 0.0, 1.0);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = clamp(uPR * (1.0 + 2.0 * exp(-age * 4.0)) * 260.0 / max(1.0, -mv.z), 1.0, 6.0 * uPR);
        vA = 0.65 + 0.35 * exp(-age * 3.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uSky, uIce; varying float vA;
      void main() { vec2 d = gl_PointCoord - 0.5; if (dot(d, d) > 0.25 || vA < 0.01) discard; gl_FragColor = vec4(mix(uSky, uIce, 0.5), vA);
        #include <colorspace_fragment>
      }`,
  }), [])

  useFrame((state) => {
    const fx = poseRef.current.fx
    const u = mat.current.uniforms
    const s = useFilm.getState()
    u.uTime.value = state.clock.elapsedTime
    u.uBim.value = fx.bim * (1 - fx.split) // the BIM look hands over to the split view
    u.uDev.value = fx.deviation
    u.uSplit.value = fx.split
    u.uDawn.value = fx.dawn
    u.uDrone.value.copy(poseRef.current.drone.pos)
    u.uDroneLight.value = fx.droneLight
    u.uHoverFloor.value = s.hovered.kind === 'card' && typeof s.hovered.data?.floor === 'number' ? s.hovered.data.floor : -1
    const data = floorTex.image.data as Uint8Array
    for (let i = 0; i < 64; i++) { const on = s.floors[i] ?? false; data[i * 4] = on ? 255 : 0; data[i * 4 + 3] = 255 }
    floorTex.needsUpdate = true
    const f = facadeMat.current.uniforms
    // facade scan runs across the first half of the helix, then fades into the BIM model
    const pct = s.progress * 100
    f.uScan.value = pct < 40 || pct > 56 ? 0 : Math.min(1, Math.max(0, (pct - 40.5) / 7))
    f.uPR.value = state.viewport.dpr
    ;(facadeMat.current as THREE.ShaderMaterial).opacity = 1
    facadeMat.current.visible = pct >= 40 && pct < 56
  })

  return (
    <group position={[cbe.x, base, cbe.z]}>
      <mesh geometry={geometry} castShadow>
        <shaderMaterial ref={mat} args={[shader]} side={THREE.DoubleSide} />
      </mesh>
      <points geometry={facadeGeo} position={[-cbe.x, -base, -cbe.z]} frustumCulled={false} renderOrder={3}>
        <shaderMaterial ref={facadeMat} args={[facadeShader]} transparent depthWrite={false} />
      </points>
      {/* podium */}
      <mesh position={[0, 6, 0]}>
        <boxGeometry args={[110, 12, 90]} />
        <meshStandardMaterial color={'#113B6B'} roughness={0.7} />
      </mesh>
    </group>
  )
}

/** Launch-pad helipad on the navy tower, with edge lights and an Ice rim */
export function LaunchPad() {
  const city = useMemo(() => generateCity(), [])
  const { pad } = city
  const lights = useMemo(() => Array.from({ length: 12 }, (_, i) => [(Math.cos((i / 12) * Math.PI * 2) * 3.2), Math.sin((i / 12) * Math.PI * 2) * 3.2] as const), [])
  return (
    <group position={[pad.x, pad.y, pad.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[3.6, 48]} />
        <meshStandardMaterial color={'#0A1B33'} roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[3.3, 3.45, 64]} />
        <meshBasicMaterial color={'#BDE2FF'} toneMapped={false} transparent opacity={0.6} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}>
        <ringGeometry args={[0.9, 1.0, 48]} />
        <meshBasicMaterial color={'#4FA5FF'} toneMapped={false} transparent opacity={0.8} />
      </mesh>
      {lights.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.08, z]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color={i % 2 ? '#4FA5FF' : '#BDE2FF'} toneMapped={false} />
        </mesh>
      ))}
      {/* rooftop water tanks and antenna, labelled in scene 1 */}
      <mesh position={[13, 0.9, -12]} name="tank">
        <cylinderGeometry args={[0.9, 0.9, 1.8, 16]} />
        <meshStandardMaterial color={'#113B6B'} roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[-10, 4, -9]} name="antenna">
        <cylinderGeometry args={[0.05, 0.08, 8, 8]} />
        <meshStandardMaterial color={'#BDE2FF'} roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.55, 17.5]} name="parapet">
        <boxGeometry args={[36, 1.1, 0.4]} />
        <meshStandardMaterial color={'#113B6B'} roughness={0.8} />
      </mesh>
    </group>
  )
}

/** Light rail viaduct glowing as a thin Sky ribbon through the city */
export function LightRail() {
  const city = useMemo(() => generateCity(), [])
  const { ribbons, pillars } = useMemo(() => {
    const ribbons: THREE.TubeGeometry[] = []
    const pillars: THREE.Vector3[] = []
    for (const line of city.rail) {
      const pts = line.map(([x, z]) => new THREE.Vector3(x, terrainHeight(x, z) + 9, z))
      const curve = new THREE.CatmullRomCurve3(pts)
      ribbons.push(new THREE.TubeGeometry(curve, 160, 0.9, 6, false))
      const len = curve.getLength()
      const n = Math.floor(len / 32)
      for (let i = 0; i <= n; i++) pillars.push(curve.getPointAt(i / n))
    }
    return { ribbons, pillars }
  }, [city])
  const pillarRef = useRef<THREE.InstancedMesh>(null!)
  useMemo(() => undefined, [])
  useFrame(() => {
    if (!pillarRef.current || pillarRef.current.userData.done) return
    const m = new THREE.Matrix4()
    pillars.forEach((p, i) => { m.makeTranslation(p.x, p.y - 4.5, p.z); pillarRef.current.setMatrixAt(i, m) })
    pillarRef.current.instanceMatrix.needsUpdate = true
    pillarRef.current.userData.done = true
  })
  return (
    <group>
      {ribbons.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshBasicMaterial color={'#4FA5FF'} toneMapped={false} transparent opacity={0.85} />
        </mesh>
      ))}
      <instancedMesh ref={pillarRef} args={[undefined, undefined, pillars.length]} frustumCulled={false}>
        <boxGeometry args={[1.6, 9, 1.6]} />
        <meshStandardMaterial color={'#113B6B'} roughness={0.8} />
      </instancedMesh>
    </group>
  )
}

/** Sky dome: Navy 900 zenith, Navy 700 horizon, warming toward Ice and white at dawn */
export function SkyDome({ poseRef }: { poseRef: React.MutableRefObject<Pose> }) {
  const mat = useRef<THREE.ShaderMaterial>(null!)
  const shader = useMemo(() => ({
    uniforms: { uDawn: { value: 0 }, uTime: { value: 0 }, ...P },
    vertexShader: /* glsl */ `varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w; }`,
    fragmentShader: /* glsl */ `
      uniform float uDawn, uTime; uniform vec3 uNavy900, uNavy700, uElyon, uSky, uIce, uWhite; varying vec3 vDir;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main() {
        float h = clamp(vDir.y, -0.2, 1.0);
        vec3 night = mix(uNavy700, uNavy900, smoothstep(-0.05, 0.45, h));
        // stars
        vec2 sp = vDir.xz / max(0.08, vDir.y) * 60.0;
        float star = step(0.9975, hash(floor(sp))) * smoothstep(0.02, 0.3, h) * (0.6 + 0.4 * sin(uTime + hash(floor(sp) + 1.0) * 20.0));
        night += uIce * star * 0.6;
        // dawn: horizon band of Elyon Blue, Sky, Ice rising to white
        vec3 dawn = mix(mix(uSky, uIce, smoothstep(-0.05, 0.25, h)), uWhite, smoothstep(0.1, 0.7, h));
        vec3 col = mix(night, dawn, uDawn);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  }), [])
  useFrame((state) => { mat.current.uniforms.uDawn.value = poseRef.current.fx.dawn; mat.current.uniforms.uTime.value = state.clock.elapsedTime })
  return (
    <mesh frustumCulled={false} renderOrder={-10}>
      <sphereGeometry args={[14000, 32, 16]} />
      <shaderMaterial ref={mat} args={[shader]} side={THREE.BackSide} depthWrite={false} />
    </mesh>
  )
}
