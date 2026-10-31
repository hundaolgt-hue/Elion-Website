import { forwardRef, useMemo } from 'react'
import * as THREE from 'three'
import { Effect, BlendFunction } from 'postprocessing'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { useFrame } from '@react-three/fiber'
import { useFilm } from '@/lib/store'
import type { Pose } from './choreo'

const frag = /* glsl */ `
uniform float uTime; uniform float uRipple; uniform float uDawn; uniform vec2 uCenter; uniform float uGrain; uniform float uAberration;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453 + uTime); }
void mainUv(inout vec2 uv) {
  // screen-glass ripple for the laptop pass-through
  vec2 d = uv - uCenter;
  float r = length(d);
  float wave = sin(r * 42.0 - uTime * 9.0) * 0.012 * uRipple * (1.0 - smoothstep(0.0, 0.7, r));
  uv += normalize(d + 1e-5) * wave;
}
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 d = uv - 0.5;
  float r2 = dot(d, d);
  // chromatic aberration only toward the edges
  float ab = uAberration * r2 * (1.0 + uRipple * 6.0);
  vec3 col;
  col.r = texture2D(inputBuffer, uv + d * ab).r;
  col.g = inputColor.g;
  col.b = texture2D(inputBuffer, uv - d * ab).b;
  // film grain 3 %
  col += (hash(uv * 1000.0) - 0.5) * uGrain;
  // vignette in Navy 900 (never black)
  vec3 navy = vec3(0.039, 0.106, 0.2);
  float vig = smoothstep(0.25, 0.9, r2 * 1.6);
  col = mix(col, mix(navy, vec3(1.0), uDawn), vig * (0.55 - 0.45 * uDawn));
  outputColor = vec4(col, inputColor.a);
}`

class ElyonEffectImpl extends Effect {
  constructor() {
    super('ElyonEffect', frag, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform>([
        ['uTime', new THREE.Uniform(0)], ['uRipple', new THREE.Uniform(0)], ['uDawn', new THREE.Uniform(0)],
        ['uCenter', new THREE.Uniform(new THREE.Vector2(0.5, 0.5))], ['uGrain', new THREE.Uniform(0.03)], ['uAberration', new THREE.Uniform(0.012)],
      ]),
    })
  }
  update(_r: THREE.WebGLRenderer, _i: THREE.WebGLRenderTarget, dt: number) {
    const t = this.uniforms.get('uTime')!
    t.value += dt
  }
}

const ElyonEffect = forwardRef<ElyonEffectImpl, { poseRef: React.MutableRefObject<Pose> }>(function ElyonEffect({ poseRef }, ref) {
  const effect = useMemo(() => new ElyonEffectImpl(), [])
  useFrame(() => {
    effect.uniforms.get('uRipple')!.value = poseRef.current.fx.ripple
    effect.uniforms.get('uDawn')!.value = poseRef.current.fx.dawn
  })
  return <primitive ref={ref} object={effect} dispose={null} />
})

export function Effects({ poseRef }: { poseRef: React.MutableRefObject<Pose> }) {
  const tier = useFilm((s) => s.tier)
  if (tier === 'lite') return null
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom luminanceThreshold={0.72} luminanceSmoothing={0.2} intensity={0.85} mipmapBlur radius={0.65} />
      <ElyonEffect poseRef={poseRef} />
    </EffectComposer>
  )
}
