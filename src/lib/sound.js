// Gentle chimes generated with the Web Audio API — no external audio assets.

let ctx = null
let masterVolume = 0.8
let muted = false

export function setVolume(v) {
  masterVolume = Math.max(0, Math.min(1, v))
}
export function getVolume() {
  return masterVolume
}
export function setMuted(m) {
  muted = !!m
}
export function isMuted() {
  return muted
}

function getCtx() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// Call once on a user gesture (e.g. pressing Start) so audio is unlocked.
export function ensureAudio() {
  getCtx()
}

function tone(ac, freq, startOffset, duration, peak) {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  osc.connect(gain)
  gain.connect(ac.destination)

  const t0 = ac.currentTime + startOffset
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.04)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.start(t0)
  osc.stop(t0 + duration + 0.05)
}

const SEQUENCES = {
  break: [523.25, 392.0, 329.63], // soft descending — time to rest
  work: [329.63, 392.0, 523.25], // gentle rising — back to focus
  done: [523.25, 659.25, 783.99, 1046.5], // calm major arpeggio — session complete
}

export function playTransition(kind) {
  if (muted || masterVolume <= 0) return
  const ac = getCtx()
  if (!ac) return
  const notes = SEQUENCES[kind] || SEQUENCES.break
  const peak = (kind === 'done' ? 0.18 : 0.16) * masterVolume
  notes.forEach((freq, i) => tone(ac, freq, i * 0.18, 0.6, peak))
}

// A short, soft confirmation tone — used as feedback when adjusting volume.
export function playBlip() {
  if (muted || masterVolume <= 0) return
  const ac = getCtx()
  if (!ac) return
  tone(ac, 523.25, 0, 0.25, 0.14 * masterVolume)
}
