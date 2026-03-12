import { useFrame } from '@react-three/fiber'
import { useRef, useEffect } from 'react'
import { useAppStore } from '../store/appStore'

const FPS_SAMPLES = 30
const FPS_LOW_THRESHOLD = 55
const FRAMES_TO_DROP = 3
const FPS_UPDATE_INTERVAL = 30

const EXTREME_FPS_THRESHOLD = 20
const EXTREME_LOW_DURATION = 3
const LARGE_DELTA_THRESHOLD = 0.2 // Skip frames after tab return (rAF can spike)

/**
 * Measures FPS and degrades performance one-way only (never recovers until page refresh).
 * - Start at high performance.
 * - If FPS < 55 for FRAMES_TO_DROP consecutive samples → switch to low.
 * - If FPS < 20 for 3+ seconds (while in low) → switch to extreme (25% res, hide decorative models).
 * - No recovery: only a full page refresh returns to high.
 * - Skips checks when tab is hidden; resets counters on visibility change to avoid false degradation.
 */
export function AdaptivePerformanceMonitor() {
  const setPerformanceTier = useAppStore((state) => state.setPerformanceTier)
  const setFps = useAppStore((state) => state.setFps)
  const setExtremeFpsMode = useAppStore((state) => state.setExtremeFpsMode)
  const deltas = useRef<number[]>([])
  const lowFrames = useRef(0)
  const frameCount = useRef(0)
  const extremeLowTime = useRef(0)

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        lowFrames.current = 0
        extremeLowTime.current = 0
        deltas.current = []
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  useFrame((_, delta) => {
    if (document.hidden) return
    if (delta > LARGE_DELTA_THRESHOLD) return // Skip after tab return (spike causes false low FPS)
    deltas.current.push(delta)
    if (deltas.current.length > FPS_SAMPLES) deltas.current.shift()

    if (deltas.current.length < FPS_SAMPLES) return

    const avgDelta = deltas.current.reduce((a, b) => a + b, 0) / deltas.current.length
    const fps = Math.round(1 / avgDelta)

    frameCount.current++
    if (frameCount.current >= FPS_UPDATE_INTERVAL) {
      frameCount.current = 0
      setFps(fps)
    }

    const tier = useAppStore.getState().performanceTier
    const extremeMode = useAppStore.getState().extremeFpsMode

    // One-way: high → low when FPS drops below threshold for N frames
    if (fps < FPS_LOW_THRESHOLD && tier === 'high') {
      lowFrames.current++
      if (lowFrames.current >= FRAMES_TO_DROP) {
        setPerformanceTier('low')
        lowFrames.current = 0
      }
    } else {
      lowFrames.current = 0
    }

    // One-way: low → extreme when FPS < 20 for 3+ seconds (no recovery until refresh)
    if (!extremeMode && fps < EXTREME_FPS_THRESHOLD) {
      extremeLowTime.current += delta
      if (extremeLowTime.current >= EXTREME_LOW_DURATION) {
        setExtremeFpsMode(true)
      }
    } else {
      extremeLowTime.current = 0
    }
  })

  return null
}
