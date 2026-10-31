import { Suspense, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import { useFilm } from '@/lib/store'
import { choreo, type Pose } from './choreo'
import { CameraRig } from './CameraRig'
import { Drone } from './Drone'
import { Buildings } from './Buildings'
import { PointCloud } from './PointCloud'
import { Terrain } from './Terrain'
import { CbeTower, LaunchPad, LightRail, SkyDome } from './Landmarks'
import { Laptop } from './Laptop'
import { Cadastre } from './Cadastre'
import { DataStack } from './DataStack'
import { Effects } from './Effects'
import { Movers, GroundPicker, MeasurePins } from './Extras'
import { SensorAnchors, RooftopTags, ParcelAnchors } from './Anchors'

export const poseRef: { current: Pose } = { current: choreo(0, 0, 1.6) }

function Fog({ poseRef }: { poseRef: React.MutableRefObject<Pose> }) {
  const scene = useThree((s) => s.scene)
  const fog = useMemo(() => new THREE.FogExp2('#0A1B33', 0.00009), [])
  const navy = useMemo(() => new THREE.Color('#0A1B33'), [])
  const white = useMemo(() => new THREE.Color('#FFFFFF'), [])
  useEffect(() => { scene.fog = fog; return () => { scene.fog = null } }, [scene, fog])
  useFrameSafe(() => { fog.color.copy(navy).lerp(white, poseRef.current.fx.dawn); fog.density = 0.00009 + poseRef.current.fx.dawn * 0.00006 })
  return null
}
import { useFrame } from '@react-three/fiber'
const useFrameSafe = (fn: () => void) => useFrame(fn)

/** ?export=drone: serialise the drone hierarchy to binary glTF for the asset deliverable (scripts/export-drone.mjs) */
function DroneExporter() {
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    if (!new URLSearchParams(location.search).has('export')) return
    const t = setTimeout(async () => {
      const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js')
      const drone = scene.getObjectByName('drone')
      if (!drone) return
      const clone = drone.clone(true)
      clone.position.set(0, 0, 0); clone.rotation.set(0, 0, 0); clone.scale.setScalar(1)
      clone.traverse((o) => { if (o.type === 'Points' || o.type === 'LineSegments' || o.type === 'PointLight') o.visible = false })
      new GLTFExporter().parse(clone, (res) => {
        const buf = res as ArrayBuffer
        let bin = ''
        const bytes = new Uint8Array(buf)
        for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
        ;(window as unknown as { __elyonDroneGLB: string }).__elyonDroneGLB = btoa(bin)
      }, (e) => console.error(e), { binary: true, onlyVisible: true })
    }, 2500)
    return () => clearTimeout(t)
  }, [scene])
  return null
}

function Pointer() {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    const onMove = (e: PointerEvent) => useFilm.getState().set({ pointer: { x: (e.clientX / window.innerWidth) * 2 - 1, y: -(e.clientY / window.innerHeight) * 2 + 1 } })
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [gl])
  return null
}

/** The single persistent WebGL canvas fixed behind the DOM */
export function Stage() {
  const tier = useFilm((s) => s.tier)
  const playground = useFilm((s) => s.playground)
  const cover = useFilm((s) => s.footageCover)
  const ref = poseRef as React.MutableRefObject<Pose>
  return (
    <>
    <div id="stage-html" className="fixed inset-0 z-[3] pointer-events-none" />
    <div id="stage" className="fixed inset-0 z-0" style={{ pointerEvents: playground ? 'auto' : 'none' }} aria-hidden="true">
      <Canvas
        frameloop={cover ? 'demand' : 'always'}
        dpr={tier === 'lite' ? [1, 1] : [1, 1.75]}
        gl={{ antialias: tier === 'lite', powerPreference: 'high-performance', logarithmicDepthBuffer: true, alpha: false, stencil: false }}
        camera={{ fov: 45, near: 0.2, far: 30000, position: [0, 80, 200] }}
        shadows={false}
        eventSource={document.body}
        eventPrefix="client"
        style={{ pointerEvents: 'auto' }}
        onCreated={({ gl }) => { gl.setClearColor('#0A1B33'); gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05 }}
      >
        <Pointer />
        <DroneExporter />
        <Fog poseRef={ref} />
        <CameraRig poseRef={ref} />
        <hemisphereLight args={['#BDE2FF', '#0A1B33', 0.55]} />
        <directionalLight position={[-800, 1600, 700]} intensity={0.9} color={'#BDE2FF'} />
        <Suspense fallback={null}>
          <SkyDome poseRef={ref} />
          <Terrain poseRef={ref} />
          <Buildings poseRef={ref} />
          <CbeTower poseRef={ref} />
          <LaunchPad />
          <LightRail />
          <PointCloud poseRef={ref} />
          <Laptop poseRef={ref} />
          <Cadastre poseRef={ref} />
          <DataStack poseRef={ref} />
          <Movers poseRef={ref} />
          <GroundPicker />
          <MeasurePins />
          <Drone poseRef={ref} />
          <RooftopTags poseRef={ref} />
          <SensorAnchors poseRef={ref} />
          <ParcelAnchors poseRef={ref} />
          <Effects poseRef={ref} />
        </Suspense>
      </Canvas>
    </div>
    </>
  )
}
