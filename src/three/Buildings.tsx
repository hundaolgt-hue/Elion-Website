import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { generateCity } from '@/world/city'
import { useFilm } from '@/lib/store'
import type { Pose } from './choreo'

/**
 * Every building in one InstancedMesh with a single shader that knows the whole film:
 * lit windows at night, survey-order dissolve as the scan passes, wireframe-to-glass twin
 * morph, the drone's own light on the facades, the Sky section cut and the dawn.
 */
export function Buildings({ poseRef }: { poseRef: React.MutableRefObject<Pose> }) {
  const city = useMemo(() => generateCity(), [])
  const ref = useRef<THREE.InstancedMesh>(null!)
  const mat = useRef<THREE.ShaderMaterial>(null!)
  const list = useMemo(() => city.buildings.filter((b) => b.kind !== 3), [city]) // the CBE tower has its own mesh

  const { geometry, count } = useMemo(() => {
    const geo = new THREE.BoxGeometry(1, 1, 1)
    geo.translate(0, 0.5, 0)
    const order = new Float32Array(list.length)
    const kind = new Float32Array(list.length)
    const seed = new Float32Array(list.length)
    const dims = new Float32Array(list.length * 3)
    list.forEach((b, i) => { order[i] = b.order; kind[i] = b.kind; seed[i] = (b.id * 0.618) % 1; dims.set([b.w, b.h, b.d], i * 3) })
    geo.setAttribute('aOrder', new THREE.InstancedBufferAttribute(order, 1))
    geo.setAttribute('aKind', new THREE.InstancedBufferAttribute(kind, 1))
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 1))
    geo.setAttribute('aDims', new THREE.InstancedBufferAttribute(dims, 3))
    return { geometry: geo, count: list.length }
  }, [list])

  useEffect(() => {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3()
    list.forEach((b, i) => {
      p.set(b.x, b.y, b.z); s.set(b.w, b.h, b.d)
      m.compose(p, q, s)
      ref.current.setMatrixAt(i, m)
    })
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [list])

  const shader = useMemo(() => ({
    uniforms: {
      uScan: { value: 0 }, uTwin: { value: 0 }, uTime: { value: 0 }, uDawn: { value: 0 }, uGlow: { value: 0 },
      uDrone: { value: new THREE.Vector3() }, uDroneLight: { value: 0 }, uCut: { value: -1e9 }, uHover: { value: -1 },
      uNavy900: { value: new THREE.Color('#0A1B33') }, uNavy700: { value: new THREE.Color('#113B6B') },
      uElyon: { value: new THREE.Color('#1E63D6') }, uSky: { value: new THREE.Color('#4FA5FF') }, uIce: { value: new THREE.Color('#BDE2FF') }, uWhite: { value: new THREE.Color('#FFFFFF') },
    },
    vertexShader: /* glsl */ `
      attribute float aOrder; attribute float aKind; attribute float aSeed; attribute vec3 aDims;
      varying vec3 vWorld; varying vec3 vNormal; varying vec2 vUv; varying float vOrder; varying float vKind; varying float vSeed; varying vec3 vDims; varying vec3 vLocal; varying float vId;
      void main() {
        vUv = uv; vOrder = aOrder; vKind = aKind; vSeed = aSeed; vDims = aDims; vLocal = position; vId = float(gl_InstanceID);
        vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        vNormal = normalize(mat3(modelMatrix * instanceMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uScan, uTwin, uTime, uDawn, uGlow, uDroneLight, uCut, uHover; uniform vec3 uDrone;
      uniform vec3 uNavy900, uNavy700, uElyon, uSky, uIce, uWhite;
      varying vec3 vWorld; varying vec3 vNormal; varying vec2 vUv; varying float vOrder; varying float vKind; varying float vSeed; varying vec3 vDims; varying vec3 vLocal; varying float vId;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main() {
        vec3 n = normalize(vNormal);
        bool side = abs(n.y) < 0.5;
        // window grid in metres on the side faces
        vec2 fp = side ? (abs(n.x) > 0.5 ? vec2(vLocal.z * vDims.z, vLocal.y * vDims.y) : vec2(vLocal.x * vDims.x, vLocal.y * vDims.y)) : vec2(vLocal.x * vDims.x, vLocal.z * vDims.z);
        vec2 cell = floor(fp / vec2(3.0, 3.3));
        vec2 f = fract(fp / vec2(3.0, 3.3));
        float win = side ? step(0.22, f.x) * step(f.x, 0.78) * step(0.3, f.y) * step(f.y, 0.85) : 0.0;
        float lit = step(0.62 + vKind * 0.03, hash(cell + vSeed * 100.0 + floor(uTime * 0.05 + vSeed * 7.0) * 0.0));
        float flicker = 0.85 + 0.15 * sin(uTime * 0.7 + hash(cell) * 6.28);
        // lighting: hemisphere + a cool moon + the drone's lamp
        float hemi = 0.55 + 0.45 * n.y;
        vec3 moonDir = normalize(vec3(-0.4, 0.8, 0.35));
        float moon = max(0.0, dot(n, moonDir));
        vec3 base = mix(uNavy900, uNavy700, 0.55 + 0.25 * hemi) * (0.55 + 0.45 * moon);
        base = mix(base, mix(uIce, uWhite, 0.35) * (0.75 + 0.25 * hemi), uDawn * 0.92);
        float dd = distance(vWorld, uDrone);
        float dl = min(0.8, uDroneLight * 25.0 / (1.0 + dd * dd * 0.15)) * max(0.0, dot(n, normalize(uDrone - vWorld)));
        vec3 col = base + uSky * dl * 0.6;
        col += uSky * win * lit * flicker * (0.5 - 0.45 * uDawn);
        // twin: wire edges then glass faces
        vec2 e = min(vUv, 1.0 - vUv);
        float px = fwidth(vUv.x) * 1.2 + fwidth(vUv.y) * 1.2;
        float edge = 1.0 - smoothstep(0.0, px, min(e.x, e.y));
        float floorLine = side ? (1.0 - smoothstep(0.0, fwidth(f.y) * 1.5, min(f.y, 1.0 - f.y))) : 0.0;
        float wire = max(edge, floorLine * 0.6);
        float twinWire = smoothstep(0.0, 0.5, uTwin);
        float twinFace = smoothstep(0.45, 1.0, uTwin);
        vec3 glass = mix(uNavy700, uElyon, 0.35 + 0.3 * hemi) * 0.9 + uSky * dl * 0.4;
        vec3 twinCol = mix(glass, uIce, wire * 0.9);
        // scan dissolve: once the cone has passed, the physical facade gives way to points
        float scanned = smoothstep(vOrder, vOrder + 0.012, uScan);
        float physicalA = 1.0 - scanned;
        float twinA = max(wire * twinWire, twinFace * 0.82);
        float alpha = max(physicalA, twinA);
        vec3 outCol = mix(col, twinCol, clamp(twinA * (1.0 - physicalA) + twinWire * (1.0 - physicalA), 0.0, 1.0));
        // glow halo around the orbit scene, section cut
        outCol += uIce * uGlow * 0.08 * twinFace;
        float cut = 1.0 - smoothstep(0.0, 3.0, abs(vWorld.z - uCut));
        outCol = mix(outCol, uSky, cut * 0.9);
        if (uHover == vId) outCol = mix(outCol, uIce, 0.35);
        // ordered dithering replaces blending so one instanced draw needs no sorting
        float d = hash(floor(gl_FragCoord.xy));
        if (alpha < 0.02 || d > alpha) discard;
        gl_FragColor = vec4(outCol, 1.0);
        #include <colorspace_fragment>
      }`,
  }), [])

  useFrame((state) => {
    const u = mat.current.uniforms
    const fx = poseRef.current.fx
    u.uScan.value = fx.scan
    u.uTwin.value = fx.twin
    u.uTime.value = state.clock.elapsedTime
    u.uDawn.value = fx.dawn
    u.uGlow.value = fx.orbitGlow
    u.uDrone.value.copy(poseRef.current.drone.pos)
    u.uDroneLight.value = fx.droneLight
    u.uCut.value = fx.sectionCut > 0 && fx.sectionCut < 1 ? -1700 + fx.sectionCut * 3400 : -1e9
    const h = useFilm.getState().hovered
    u.uHover.value = h.kind === 'building' && typeof h.data?.instance === 'number' ? h.data.instance : -1
  })

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, undefined, count]}
      frustumCulled={false}
      onPointerMove={(e) => {
        e.stopPropagation()
        const b = list[e.instanceId ?? -1]
        if (!b) return
        useFilm.getState().set({ hovered: { kind: 'building', data: { instance: e.instanceId ?? -1, height: Math.round(b.h), footprint: Math.round(b.w * b.d), floors: b.floors, district: b.district, use: b.parcel.use, x: e.point.x, y: e.point.y, z: e.point.z } } })
      }}
      onPointerOut={() => useFilm.getState().set({ hovered: { kind: 'none' } })}
    >
      <shaderMaterial ref={mat} args={[shader]} />
    </instancedMesh>
  )
}
