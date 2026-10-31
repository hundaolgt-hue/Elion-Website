import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { getHeightTexture, GLSL_HEIGHT, WORLD_HALF, CITY_RADIUS, terrainHeight } from '@/world/terrain'
import { generateCity, CITY_HALF } from '@/world/city'
import { useFilm } from '@/lib/store'
import type { Pose } from './choreo'

const PALETTE = {
  uNavy900: { value: new THREE.Color('#0A1B33') }, uNavy700: { value: new THREE.Color('#113B6B') },
  uElyon: { value: new THREE.Color('#1E63D6') }, uSky: { value: new THREE.Color('#4FA5FF') }, uIce: { value: new THREE.Color('#BDE2FF') }, uWhite: { value: new THREE.Color('#FFFFFF') },
}

/**
 * Terrain mesh displaced by the shared heightfield: the city basin with its glowing street grid,
 * the Entoto ridge, 1 m contour lines that fade with distance, a flood layer in the valley,
 * and the signature dotted terrain wave that bends away from the cursor.
 */
export function Terrain({ poseRef }: { poseRef: React.MutableRefObject<Pose> }) {
  const tier = useFilm((s) => s.tier)
  const heightTex = useMemo(() => getHeightTexture(), [])
  const mat = useRef<THREE.ShaderMaterial>(null!)
  const waveMat = useRef<THREE.ShaderMaterial>(null!)
  const floodMat = useRef<THREE.MeshBasicMaterial>(null!)
  const flood = useRef<THREE.Mesh>(null!)
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])
  const hit = useMemo(() => new THREE.Vector3(), [])
  const camera = useThree((s) => s.camera)
  const segs = tier === 'lite' ? 160 : 320
  const city = useMemo(() => generateCity(), [])

  const terrainShader = useMemo(() => ({
    uniforms: { uHeight: { value: heightTex }, uTime: { value: 0 }, uContours: { value: 0 }, uDawn: { value: 0 }, uCut: { value: -1e9 }, uDrone: { value: new THREE.Vector3() }, uDroneLight: { value: 0 }, uLand: { value: 0 }, ...PALETTE },
    vertexShader: /* glsl */ `
      ${GLSL_HEIGHT}
      varying vec3 vWorld; varying float vH;
      void main() {
        vec3 p = position;
        vec4 w = modelMatrix * vec4(p, 1.0);
        float h = terrainHeight(w.xz);
        w.y = h; vH = h; vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      ${GLSL_HEIGHT}
      uniform float uTime, uContours, uDawn, uCut, uDroneLight, uLand; uniform vec3 uDrone;
      uniform vec3 uNavy900, uNavy700, uElyon, uSky, uIce, uWhite;
      varying vec3 vWorld; varying float vH;
      const float CITY = ${CITY_HALF.toFixed(1)};
      const float CITY_R = ${CITY_RADIUS.toFixed(1)};
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main() {
        // slope from the heightfield
        float e = 12.0;
        float hx = terrainHeight(vWorld.xz + vec2(e, 0.0)) - terrainHeight(vWorld.xz - vec2(e, 0.0));
        float hz = terrainHeight(vWorld.xz + vec2(0.0, e)) - terrainHeight(vWorld.xz - vec2(0.0, e));
        vec3 n = normalize(vec3(-hx, 2.0 * e, -hz));
        float light = 0.35 + 0.65 * max(0.0, dot(n, normalize(vec3(-0.4, 0.8, 0.35))));
        vec3 col = mix(uNavy900, uNavy700, 0.25 + 0.45 * light);
        float r = length(vWorld.xz);
        // city streets: a faint Sky grid inside the city, Bole Road brighter
        float pitch = 110.0;
        vec2 g = mod(vWorld.xz + CITY, pitch);
        float street = step(92.0, g.x) + step(92.0, g.y);
        float inCity = 1.0 - smoothstep(CITY, CITY + 250.0, max(abs(vWorld.x), abs(vWorld.z)));
        col += uSky * 0.07 * clamp(street, 0.0, 1.0) * inCity * (1.0 - uDawn * 0.7);
        float t = clamp((vWorld.x * 1600.0 + (vWorld.z - 60.0) * 1120.0) / (1600.0 * 1600.0 + 1120.0 * 1120.0), 0.0, 1.0);
        float dBole = length(vWorld.xz - vec2(t * 1600.0, 60.0 + t * 1120.0));
        col += uSky * 0.12 * (1.0 - smoothstep(20.0, 34.0, dBole)) * inCity;
        // drone lamp
        float dd = distance(vWorld, uDrone);
        col += uSky * min(0.5, uDroneLight * 20.0 / (1.0 + dd * dd * 0.1)) * 0.35;
        // 1 m contours, anti-aliased, fading with distance
        float fw = fwidth(vH);
        float c1 = smoothstep(0.5 - fw * 1.5, 0.5, abs(fract(vH) - 0.5));
        float c1v = c1 * (1.0 - smoothstep(0.12, 0.5, fw));
        float c10 = smoothstep(0.5 - fw * 0.15, 0.5, abs(fract(vH / 10.0) - 0.5));
        float c10v = c10 * (1.0 - smoothstep(1.2, 5.0, fw));
        float contour = max(c1v * 0.5, c10v) * uContours * (1.0 - inCity);
        col = mix(col, uSky, contour * 0.85);
        // section cut line
        float cut = 1.0 - smoothstep(0.0, 3.0, abs(vWorld.z - uCut));
        col = mix(col, uSky, cut * inCity * 0.9);
        // dawn: the ground lifts toward Ice and white
        col = mix(col, mix(uIce, uWhite, 0.5), uDawn * 0.9);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  }), [heightTex])

  // Dotted terrain wave: a point grid outside the city on the heightfield
  const waveGeo = useMemo(() => {
    const n = tier === 'lite' ? 160 : 300
    const pos: number[] = []
    const seeds: number[] = []
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 * 6500 - 6500, z = (j / (n - 1)) * 2 * 6500 - 6500
      if (Math.max(Math.abs(x), Math.abs(z)) < CITY_HALF + 120) continue
      pos.push(x, 0, z)
      seeds.push(Math.random())
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12000)
    return g
  }, [tier])

  const waveShader = useMemo(() => ({
    uniforms: { uHeight: { value: heightTex }, uTime: { value: 0 }, uWave: { value: 0 }, uMouse: { value: new THREE.Vector3(0, -1e5, 0) }, uPR: { value: 1 }, ...PALETTE },
    vertexShader: /* glsl */ `
      ${GLSL_HEIGHT}
      attribute float aSeed; uniform float uTime, uWave, uPR; uniform vec3 uMouse;
      varying float vA;
      void main() {
        vec3 p = position;
        float h = terrainHeight(p.xz);
        float wave = sin(p.x * 0.0025 + uTime * 0.6) * 6.0 + sin(p.z * 0.004 - uTime * 0.4 + aSeed) * 4.0;
        // bends away from the cursor like water
        vec2 dm = p.xz - uMouse.xz;
        float md = length(dm);
        float push = (1.0 - smoothstep(0.0, 420.0, md)) * 60.0;
        p.y = h + 3.0 + wave * uWave - push;
        p.xz += normalize(dm + 0.001) * push * 0.6;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp(uPR * 900.0 / max(1.0, -mv.z), 1.0, 3.5 * uPR);
        vA = uWave * (0.35 + 0.4 * aSeed) * (0.6 + 0.4 * sin(uTime * 1.5 + aSeed * 20.0));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uSky; varying float vA;
      void main() {
        vec2 d = gl_PointCoord - 0.5; if (dot(d, d) > 0.25) discard;
        if (vA < 0.01) discard;
        gl_FragColor = vec4(uSky, vA);
        #include <colorspace_fragment>
      }`,
  }), [heightTex])

  const valley = useMemo(() => {
    // the flood layer sits in the valley crossing the land route near (2000, -2000)
    const cx = 2000, cz = -2000
    return { cx, cz, floor: terrainHeight(cx, cz) }
  }, [])

  useFrame((state) => {
    const fx = poseRef.current.fx
    const u = mat.current.uniforms
    u.uTime.value = state.clock.elapsedTime
    u.uContours.value = fx.contours
    u.uDawn.value = fx.dawn
    u.uCut.value = fx.sectionCut > 0 && fx.sectionCut < 1 ? -1700 + fx.sectionCut * 3400 : -1e9
    u.uDrone.value.copy(poseRef.current.drone.pos)
    u.uDroneLight.value = fx.droneLight
    const w = waveMat.current.uniforms
    w.uTime.value = state.clock.elapsedTime
    w.uWave.value = fx.wave
    w.uPR.value = state.viewport.dpr
    if (fx.wave > 0.01) {
      const ptr = useFilm.getState().pointer
      raycaster.setFromCamera(new THREE.Vector2(ptr.x, ptr.y), camera)
      plane.constant = -poseRef.current.fx.landAlt
      if (raycaster.ray.intersectPlane(plane, hit)) w.uMouse.value.lerp(hit, 0.15)
    }
    const fl = fx.flood
    flood.current.visible = fl > 0.01
    flood.current.position.y = valley.floor + 2 + fl * 26
    floodMat.current.opacity = 0.18 + 0.3 * fl
  })

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false} receiveShadow>
        <planeGeometry args={[WORLD_HALF * 2, WORLD_HALF * 2, segs, segs]} />
        <shaderMaterial ref={mat} args={[terrainShader]} />
      </mesh>
      <points geometry={waveGeo} frustumCulled={false} renderOrder={3}>
        <shaderMaterial ref={waveMat} args={[waveShader]} transparent depthWrite={false} />
      </points>
      <mesh ref={flood} rotation={[-Math.PI / 2, 0, 0]} position={[valley.cx, valley.floor, valley.cz]} renderOrder={4}>
        <planeGeometry args={[1100, 2400]} />
        <meshBasicMaterial ref={floodMat} color={'#4FA5FF'} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* Meskel Square plaza and stands */}
      <group position={[city.meskel.x, terrainHeight(city.meskel.x, city.meskel.z) + 0.2, city.meskel.z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[city.meskel.w, city.meskel.d]} />
          <meshStandardMaterial color={'#113B6B'} roughness={0.9} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[0, 1 + i * 1.4, -city.meskel.d / 2 + 12 + i * 9]}>
            <boxGeometry args={[city.meskel.w * 0.85, 2.2, 8]} />
            <meshStandardMaterial color={'#0A1B33'} roughness={0.8} emissive={'#1E63D6'} emissiveIntensity={0.06} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
