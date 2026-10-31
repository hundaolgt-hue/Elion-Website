import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { buildPointCloud, type PointCloudData } from '@/world/pointcloud'
import { useFilm } from '@/lib/store'
import type { Pose } from './choreo'

const POINT_BUDGET = { high: 1_400_000, medium: 800_000, lite: 300_000 }

/**
 * GPU LiDAR point cloud. Points are born in survey order under the scan cone (outward spark,
 * then settle to Ice at 60 %), can be recoloured by elevation, intensity, classification or
 * RGB with one uniform, sliced at any height, filtered by class, thinned to 50/200/400 pts/m²,
 * and shrink into the wireframe twin.
 */
export function PointCloud({ poseRef }: { poseRef: React.MutableRefObject<Pose> }) {
  const tier = useFilm((s) => s.tier)
  const [data, setData] = useState<PointCloudData | null>(null)
  useEffect(() => {
    let alive = true
    if (typeof Worker === 'undefined') { setData(buildPointCloud(POINT_BUDGET[tier])); return }
    const w = new Worker(new URL('../world/pointcloud.worker.ts', import.meta.url), { type: 'module' })
    w.onmessage = (e: MessageEvent<PointCloudData>) => { if (alive) setData(e.data); w.terminate() }
    w.onerror = () => { if (alive) setData(buildPointCloud(POINT_BUDGET[tier])); w.terminate() }
    w.postMessage({ target: POINT_BUDGET[tier] })
    return () => { alive = false; w.terminate() }
  }, [tier])
  if (!data) return null
  return <PointCloudMesh data={data} poseRef={poseRef} />
}

function PointCloudMesh({ data, poseRef }: { data: PointCloudData; poseRef: React.MutableRefObject<Pose> }) {
  const mat = useRef<THREE.ShaderMaterial>(null!)
  const dpr = useThree((s) => s.viewport.dpr)

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(data.position, 3))
    g.setAttribute('aClass', new THREE.BufferAttribute(data.cls, 1))
    g.setAttribute('aOrder', new THREE.BufferAttribute(data.order, 1))
    g.setAttribute('aRand', new THREE.BufferAttribute(data.rand, 1))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 60, 0), 3000)
    return g
  }, [data])

  useEffect(() => { useFilm.getState().set({ ready: true }) }, [])

  const shader = useMemo(() => ({
    uniforms: {
      uScan: { value: 0 }, uTime: { value: 0 }, uMode: { value: 0 }, uSize: { value: 1 }, uSlice: { value: 1e5 },
      uMask: { value: [1, 1, 1, 1, 1] }, uDensity: { value: 1 }, uFade: { value: 1 }, uTwin: { value: 0 }, uPR: { value: 1 },
      uMinY: { value: data.minY }, uMaxY: { value: data.maxY }, uHoverY: { value: -1e9 },
      uNavy700: { value: new THREE.Color('#113B6B') }, uElyon: { value: new THREE.Color('#1E63D6') }, uSky: { value: new THREE.Color('#4FA5FF') }, uIce: { value: new THREE.Color('#BDE2FF') },
    },
    vertexShader: /* glsl */ `
      attribute float aClass; attribute float aOrder; attribute float aRand;
      uniform float uScan, uTime, uMode, uSize, uSlice, uDensity, uTwin, uPR, uMinY, uMaxY; uniform float uMask[5];
      uniform vec3 uNavy700, uElyon, uSky, uIce;
      varying vec3 vColor; varying float vAlpha;
      vec3 ramp(float t) {
        t = clamp(t, 0.0, 1.0);
        vec3 c = mix(uNavy700, uElyon, smoothstep(0.0, 0.33, t));
        c = mix(c, uSky, smoothstep(0.33, 0.66, t));
        return mix(c, uIce, smoothstep(0.66, 1.0, t));
      }
      void main() {
        int cls = int(aClass + 0.5);
        float maskOk = cls == 0 ? uMask[0] : cls == 1 ? uMask[1] : cls == 2 ? uMask[2] : cls == 3 ? uMask[3] : uMask[4];
        float born = step(aOrder, uScan);
        float visible = born * step(aRand, uDensity) * maskOk * step(position.y, uSlice);
        if (visible < 0.5) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); gl_PointSize = 0.0; vAlpha = 0.0; vColor = vec3(0.0); return; }
        float age = clamp((uScan - aOrder) * 70.0, 0.0, 1.0);
        float spark = exp(-age * 4.0);
        // outward spark then settle
        vec3 p = position;
        float rel = (position.y - uMinY) / 120.0;
        float intensity = 0.25 + 0.75 * fract(aRand * 7.31 + aClass * 0.37) * (cls == 1 ? 1.0 : cls == 3 ? 0.9 : cls == 4 ? 0.3 : 0.6);
        vec3 c;
        if (uMode < 0.5) c = ramp(rel);
        else if (uMode < 1.5) c = mix(uNavy700, uIce, intensity);
        else if (uMode < 2.5) c = cls == 0 ? uNavy700 * 1.4 : cls == 1 ? uSky : cls == 2 ? uElyon : cls == 3 ? uIce * 0.8 : uSky * (0.8 + 0.2 * sin(uTime * 2.0 + aRand * 6.0));
        else c = mix(uNavy700 * 1.3, uIce, 0.35 + 0.65 * intensity * (cls == 2 ? 0.55 : 1.0));
        c = mix(c, uIce, spark);
        vColor = c;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float size = uSize * (1.0 + spark * 2.5) * (1.0 - uTwin * 0.85);
        float ps = size * uPR * 700.0 / max(1.0, -mv.z);
        gl_PointSize = clamp(ps, 1.0 * uPR, 7.0 * uPR);
        vAlpha = (0.6 + 0.4 * spark) * (1.0 - uTwin * 0.9);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uFade; varying vec3 vColor; varying float vAlpha;
      void main() {
        vec2 d = gl_PointCoord - 0.5;
        float r = dot(d, d);
        if (r > 0.25) discard;
        float a = vAlpha * uFade * smoothstep(0.25, 0.1, r);
        if (a < 0.01) discard;
        gl_FragColor = vec4(vColor, a);
        #include <colorspace_fragment>
      }`,
  }), [data])

  useFrame((state) => {
    const u = mat.current.uniforms
    const s = useFilm.getState()
    const fx = poseRef.current.fx
    u.uScan.value = s.scanReplay !== null && fx.playground ? s.scanReplay : s.footageMode && fx.playground ? 1 : fx.scan
    u.uTime.value = state.clock.elapsedTime
    u.uMode.value = s.colorMode === 'elevation' ? 0 : s.colorMode === 'intensity' ? 1 : s.colorMode === 'classification' ? 2 : 3
    u.uSize.value = s.pointSize
    u.uSlice.value = fx.playground ? data.minY + (data.maxY - data.minY) * s.slice : 1e5
    const m = u.uMask.value as number[]
    for (let i = 0; i < 5; i++) m[i] = fx.playground ? (s.classMask[i] ? 1 : 0) : 1
    u.uDensity.value = fx.playground ? s.density / 400 : 1
    u.uFade.value = s.footageMode ? (fx.playground ? 1 : 0) : fx.pointsFade
    u.uTwin.value = fx.twin
    u.uPR.value = dpr
  })

  return (
    <points geometry={geometry} frustumCulled={false} renderOrder={2}>
      <shaderMaterial ref={mat} args={[shader]} transparent depthWrite={false} />
    </points>
  )
}
