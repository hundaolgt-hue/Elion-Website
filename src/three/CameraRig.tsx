import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useFilm } from '@/lib/store'
import { choreo, type Pose } from './choreo'

/**
 * Reads the master progress every frame, evaluates the choreography and drives the camera.
 * Hands the camera to OrbitControls in the point-cloud playground and eases it back onto the
 * film path afterwards; applies the free-flight offset for the "elyon" easter egg.
 */
export function CameraRig({ poseRef }: { poseRef: React.MutableRefObject<Pose> }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const gl = useThree((s) => s.gl)
  const controls = useRef<OrbitControlsImpl>(null!)
  const blend = useRef(0) // 1 = fully on orbit controls
  const wasPlayground = useRef(false)
  const look = useMemo(() => new THREE.Vector3(), [])
  const smoothPos = useMemo(() => new THREE.Vector3(), [])
  const smoothLook = useMemo(() => new THREE.Vector3(), [])
  const freeOffset = useMemo(() => new THREE.Vector3(), [])
  const keys = useRef<Record<string, boolean>>({})
  const init = useRef(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => { keys.current[e.key] = true; if (useFilm.getState().freeFlight && e.key.startsWith('Arrow')) e.preventDefault() }
    const up = (e: KeyboardEvent) => { keys.current[e.key] = false }
    const zoom = (e: Event) => {
      const f = (e as CustomEvent<number>).detail
      const c = controls.current
      if (!c || !c.enabled) return
      if (f === 0) { c.target.set(0, 70, 0); camera.position.set(170, 320, 300); c.update(); return }
      const dir = camera.position.clone().sub(c.target)
      const len = THREE.MathUtils.clamp(dir.length() * f, 40, 1600)
      camera.position.copy(c.target).add(dir.normalize().multiplyScalar(len))
      c.update()
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('elyon:zoom', zoom)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('elyon:zoom', zoom) }
  }, [camera])

  useFrame((state, dt) => {
    const s = useFilm.getState()
    const pose = choreo(s.progress, state.clock.elapsedTime, size.width / size.height)
    // free flight: arrow keys steer the drone for a few seconds
    if (s.freeFlight) {
      const sp = 60 * dt
      if (keys.current.ArrowLeft) freeOffset.x -= sp
      if (keys.current.ArrowRight) freeOffset.x += sp
      if (keys.current.ArrowUp) freeOffset.z -= sp
      if (keys.current.ArrowDown) freeOffset.z += sp
    } else freeOffset.multiplyScalar(Math.exp(-dt * 2))
    pose.drone.pos.add(freeOffset)
    poseRef.current = pose

    const pg = pose.fx.playground > 0.5 && !s.reducedMotion
    if (pg && !wasPlayground.current) {
      controls.current.target.copy(pose.cam.look)
      camera.position.copy(pose.cam.pos)
      controls.current.update()
    }
    wasPlayground.current = pg
    useFilm.setState((st) => (st.playground !== pg ? { playground: pg } : st))
    // blend toward 1 while in the playground, back to 0 over ~1 s after
    blend.current = THREE.MathUtils.clamp(blend.current + (pg ? 4 : -1.2) * dt, 0, 1)
    controls.current.enabled = pg

    if (!init.current) { smoothPos.copy(pose.cam.pos); smoothLook.copy(pose.cam.look); init.current = true }
    const k = 1 - Math.exp(-dt * 9)
    smoothPos.lerp(pose.cam.pos, k)
    smoothLook.lerp(pose.cam.look, k)
    if (blend.current >= 1) {
      controls.current.update()
    } else if (blend.current > 0) {
      controls.current.update()
      camera.position.lerp(smoothPos, 1 - blend.current)
      look.copy(controls.current.target).lerp(smoothLook, 1 - blend.current)
      camera.lookAt(look)
    } else {
      camera.position.copy(smoothPos)
      camera.lookAt(smoothLook)
    }
    if (Math.abs(camera.fov - pose.cam.fov) > 0.01) { camera.fov += (pose.cam.fov - camera.fov) * k; camera.updateProjectionMatrix() }
  }, -10)

  // Bound to the canvas, not the body the Canvas events run through: OrbitControls sets touch-action: none on its element, which on the body would block touch scrolling everywhere
  return <OrbitControls ref={controls} domElement={gl.domElement} enabled={false} enableDamping dampingFactor={0.08} enablePan minDistance={40} maxDistance={1600} maxPolarAngle={Math.PI * 0.49} makeDefault={false} enableZoom={false} />
}
