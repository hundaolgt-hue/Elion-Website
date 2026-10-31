/**
 * Synthesised sound layer (Web Audio only, no samples). Muted by default; the navbar toggle calls
 * `enableSound()` from a user gesture. Rotor hum pitch tracks scroll velocity, LiDAR ticks follow
 * the scan frequency, glass chime when points snap to geometry, whoosh for the screen pass-through,
 * two-note mark sting at landing.
 */
let ctx: AudioContext | null = null
let master: GainNode | null = null
let rotorOsc: OscillatorNode | null = null
let rotorOsc2: OscillatorNode | null = null
let rotorGain: GainNode | null = null
let rotorFilter: BiquadFilterNode | null = null
let enabled = false

export const isSoundEnabled = () => enabled

export function enableSound() {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    master = ctx.createGain()
    master.gain.value = 0
    master.connect(ctx.destination)
    rotorOsc = ctx.createOscillator()
    rotorOsc.type = 'sawtooth'
    rotorOsc.frequency.value = 70
    rotorOsc2 = ctx.createOscillator()
    rotorOsc2.type = 'triangle'
    rotorOsc2.frequency.value = 141
    rotorFilter = ctx.createBiquadFilter()
    rotorFilter.type = 'lowpass'
    rotorFilter.frequency.value = 420
    rotorFilter.Q.value = 2
    rotorGain = ctx.createGain()
    rotorGain.gain.value = 0
    rotorOsc.connect(rotorFilter)
    rotorOsc2.connect(rotorFilter)
    rotorFilter.connect(rotorGain)
    rotorGain.connect(master)
    rotorOsc.start()
    rotorOsc2.start()
  }
  ctx.resume()
  enabled = true
  master!.gain.setTargetAtTime(0.5, ctx.currentTime, 0.2)
}

export function disableSound() {
  enabled = false
  if (ctx && master) master.gain.setTargetAtTime(0, ctx.currentTime, 0.15)
}

/** rotors: 0 off .. 1 full; velocity: scroll px/s */
export function setRotor(level: number, velocity: number) {
  if (!ctx || !rotorOsc || !rotorGain || !rotorFilter || !rotorOsc2) return
  const t = ctx.currentTime
  const v = Math.min(1, Math.abs(velocity) / 2500)
  rotorGain.gain.setTargetAtTime(level * (0.12 + v * 0.1), t, 0.1)
  rotorOsc.frequency.setTargetAtTime(60 + level * 40 + v * 60, t, 0.15)
  rotorOsc2.frequency.setTargetAtTime(121 + level * 80 + v * 120, t, 0.15)
  rotorFilter.frequency.setTargetAtTime(300 + v * 900 + level * 200, t, 0.15)
}

const blip = (freq: number, dur: number, type: OscillatorType, gain = 0.2, at = 0) => {
  if (!ctx || !master || !enabled) return
  const t = ctx.currentTime + at
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.value = freq
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(gain, t + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g)
  g.connect(master)
  o.start(t)
  o.stop(t + dur + 0.02)
}

let lastTick = 0
export function lidarTick(rateHz: number) {
  if (!ctx || !enabled) return
  const now = ctx.currentTime
  if (now - lastTick < 1 / Math.max(1, rateHz)) return
  lastTick = now
  blip(2400 + Math.random() * 400, 0.03, 'square', 0.05)
}

export function chime() { blip(1318, 0.9, 'sine', 0.15); blip(1975, 1.2, 'sine', 0.08, 0.03) }

export function whoosh() {
  if (!ctx || !master || !enabled) return
  const t = ctx.currentTime
  const len = ctx.sampleRate * 1.2
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const src = ctx.createBufferSource()
  src.buffer = buf
  const f = ctx.createBiquadFilter()
  f.type = 'bandpass'
  f.Q.value = 1.2
  f.frequency.setValueAtTime(200, t)
  f.frequency.exponentialRampToValueAtTime(1800, t + 0.5)
  f.frequency.exponentialRampToValueAtTime(150, t + 1.2)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.35, t + 0.4)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2)
  src.connect(f); f.connect(g); g.connect(master)
  src.start(t)
}

export function sting() { blip(523.25, 0.8, 'sine', 0.2); blip(783.99, 1.4, 'sine', 0.2, 0.22) }
