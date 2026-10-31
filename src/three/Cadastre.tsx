import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { generateCity } from '@/world/city'
import type { Pose } from './choreo'

const FOCUS = { x: -300, z: -400, r: 950 }

/**
 * 3D cadastre: parcel boundaries draw themselves in Sky lines across the district, then extrude
 * floor by floor into stacked property units (condominium slabs) tinted Navy 700 with Ice edges.
 */
export function Cadastre({ poseRef }: { poseRef: React.MutableRefObject<Pose> }) {
  const city = useMemo(() => generateCity(), [])
  const lineMat = useRef<THREE.ShaderMaterial>(null!)
  const slabMat = useRef<THREE.ShaderMaterial>(null!)
  const slabs = useRef<THREE.InstancedMesh>(null!)

  const parcels = useMemo(() => city.buildings.filter((b) => Math.hypot(b.x - FOCUS.x, b.z - FOCUS.z) < FOCUS.r), [city])

  const lineGeo = useMemo(() => {
    const pos: number[] = [], ord: number[] = [], t: number[] = []
    for (const b of parcels) {
      const o = Math.hypot(b.x - FOCUS.x, b.z - FOCUS.z) / FOCUS.r
      const hw = b.parcel.w / 2, hd = b.parcel.d / 2, y = b.y + 0.6
      const c = [[b.x - hw, b.z - hd], [b.x + hw, b.z - hd], [b.x + hw, b.z + hd], [b.x - hw, b.z + hd]]
      for (let i = 0; i < 4; i++) {
        const a = c[i], d = c[(i + 1) % 4]
        pos.push(a[0], y, a[1], d[0], y, d[1])
        ord.push(o, o)
        t.push(i / 4, (i + 1) / 4)
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('aOrder', new THREE.Float32BufferAttribute(ord, 1))
    g.setAttribute('aT', new THREE.Float32BufferAttribute(t, 1))
    return g
  }, [parcels])

  const lineShader = useMemo(() => ({
    uniforms: { uDraw: { value: 0 }, uSky: { value: new THREE.Color('#4FA5FF') } },
    vertexShader: /* glsl */ `attribute float aOrder; attribute float aT; uniform float uDraw; varying float vA;
      void main() { float local = clamp((uDraw * 1.15 - aOrder) / 0.15, 0.0, 1.0); vA = step(aT, local + 0.001) * step(0.001, local); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `uniform vec3 uSky; varying float vA; void main() { if (vA < 0.5) discard; gl_FragColor = vec4(uSky, 0.9);
        #include <colorspace_fragment>
      }`,
  }), [])

  const slabData = useMemo(() => {
    const items: { b: (typeof parcels)[number]; i: number }[] = []
    for (const b of parcels) for (let i = 0; i < Math.min(b.floors, 30); i++) items.push({ b, i })
    return items
  }, [parcels])

  const slabGeo = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1)
    g.translate(0, 0.5, 0)
    const lvl = new Float32Array(slabData.length), tot = new Float32Array(slabData.length), ord = new Float32Array(slabData.length)
    slabData.forEach((s, k) => { lvl[k] = s.i; tot[k] = Math.min(s.b.floors, 30); ord[k] = Math.hypot(s.b.x - FOCUS.x, s.b.z - FOCUS.z) / FOCUS.r })
    g.setAttribute('aLevel', new THREE.InstancedBufferAttribute(lvl, 1))
    g.setAttribute('aTotal', new THREE.InstancedBufferAttribute(tot, 1))
    g.setAttribute('aOrder', new THREE.InstancedBufferAttribute(ord, 1))
    return g
  }, [slabData])

  const slabShader = useMemo(() => ({
    uniforms: { uExtrude: { value: 0 }, uNavy700: { value: new THREE.Color('#113B6B') }, uIce: { value: new THREE.Color('#BDE2FF') }, uSky: { value: new THREE.Color('#4FA5FF') } },
    vertexShader: /* glsl */ `attribute float aLevel; attribute float aTotal; attribute float aOrder; uniform float uExtrude; varying vec2 vUv; varying float vA; varying vec3 vN;
      void main() {
        vUv = uv; vN = normalize(mat3(modelMatrix * instanceMatrix) * normal);
        float e = clamp((uExtrude * 1.3 - aOrder * 0.3) , 0.0, 1.0);
        float grow = clamp(e * aTotal - aLevel, 0.0, 1.0);
        vA = grow;
        vec3 p = position; p.y *= grow;
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */ `uniform vec3 uNavy700, uIce, uSky; varying vec2 vUv; varying float vA; varying vec3 vN;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main() {
        if (vA < 0.02) discard;
        vec2 e = min(vUv, 1.0 - vUv); float px = fwidth(vUv.x) + fwidth(vUv.y);
        float edge = 1.0 - smoothstep(0.0, px * 1.5, min(e.x, e.y));
        float hemi = 0.6 + 0.4 * vN.y;
        vec3 col = mix(uNavy700 * (0.8 + 0.4 * hemi), uIce, edge * 0.9);
        float alpha = max(0.45, edge) * vA;
        if (hash(floor(gl_FragCoord.xy)) > alpha) discard;
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  }), [])

  useFrame(() => {
    const fx = poseRef.current.fx
    lineMat.current.uniforms.uDraw.value = fx.cadastreLines
    slabMat.current.uniforms.uExtrude.value = fx.cadastreExtrude
    if (slabs.current && !slabs.current.userData.done) {
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3()
      slabData.forEach((it, k) => {
        p.set(it.b.x, it.b.y + it.i * 3.3 + 0.3, it.b.z); s.set(it.b.parcel.w - 1, 2.6, it.b.parcel.d - 1)
        m.compose(p, q, s)
        slabs.current.setMatrixAt(k, m)
      })
      slabs.current.instanceMatrix.needsUpdate = true
      slabs.current.userData.done = true
    }
    slabs.current.visible = fx.cadastreExtrude > 0.005
  })

  return (
    <group>
      <lineSegments geometry={lineGeo} frustumCulled={false} renderOrder={4}>
        <shaderMaterial ref={lineMat} args={[lineShader]} transparent depthWrite={false} />
      </lineSegments>
      <instancedMesh ref={slabs} args={[slabGeo, undefined, slabData.length]} frustumCulled={false} visible={false}>
        <shaderMaterial ref={slabMat} args={[slabShader]} />
      </instancedMesh>
    </group>
  )
}

export const CADASTRE_FOCUS = FOCUS
