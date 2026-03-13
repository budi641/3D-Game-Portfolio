/**
 * Procedural UI sounds – simple, techy, relaxing.
 * Soft digital tones for a calm game feel. No external files.
 */

let audioContext: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioContext
}

function ensureContextResumed(ctx: AudioContext): void {
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }
}

/** Soft tech blip – statue/button click */
export function playClick(): void {
  const ctx = getContext()
  if (!ctx) return
  ensureContextResumed(ctx)

  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(320, t)
  osc.frequency.exponentialRampToValueAtTime(180, t + 0.12)
  gain.gain.setValueAtTime(0.03, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
  osc.start(t)
  osc.stop(t + 0.18)
}

/** Gentle achievement chime – subtle, uplifting */
export function playAchievement(isBig = false): void {
  const ctx = getContext()
  if (!ctx) return
  ensureContextResumed(ctx)

  const playTone = (freq: number, start: number, duration: number, vol: number) => {
    const osc = ctx!.createOscillator()
    const gain = ctx!.createGain()
    osc.connect(gain)
    gain.connect(ctx!.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, ctx!.currentTime + start)
    gain.gain.setValueAtTime(0, ctx!.currentTime + start)
    gain.gain.linearRampToValueAtTime(vol, ctx!.currentTime + start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx!.currentTime + start + duration)
    osc.start(ctx!.currentTime + start)
    osc.stop(ctx!.currentTime + start + duration)
  }

  // Lower, warmer frequencies – techy but relaxing
  if (isBig) {
    playTone(329.63, 0, 0.35, 0.025)   // E4
    playTone(392.00, 0.12, 0.3, 0.02)  // G4
    playTone(493.88, 0.28, 0.4, 0.028) // B4
  } else {
    playTone(329.63, 0, 0.2, 0.022)
    playTone(392.00, 0.08, 0.25, 0.02)
  }
}

/** Panel open – soft upward sweep */
export function playPanelOpen(): void {
  const ctx = getContext()
  if (!ctx) return
  ensureContextResumed(ctx)

  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(220, t)
  osc.frequency.linearRampToValueAtTime(330, t + 0.15)
  gain.gain.setValueAtTime(0.012, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
  osc.start(t)
  osc.stop(t + 0.2)
}

/** Panel close – gentle downward */
export function playPanelClose(): void {
  const ctx = getContext()
  if (!ctx) return
  ensureContextResumed(ctx)

  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(280, t)
  osc.frequency.exponentialRampToValueAtTime(140, t + 0.12)
  gain.gain.setValueAtTime(0.015, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
  osc.start(t)
  osc.stop(t + 0.15)
}
