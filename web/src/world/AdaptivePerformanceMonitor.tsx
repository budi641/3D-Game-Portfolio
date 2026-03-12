import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { useAppStore } from '../store/appStore'

const FPS_SAMPLES = 30
const FPS_LOW_THRESHOLD = 55
const FPS_HIGH_THRESHOLD = 58
const FRAMES_TO_DROP = 3
const FRAMES_TO_UPGRADE = 400
const FPS_UPDATE_INTERVAL = 30

const EXTREME_FPS_THRESHOLD = 20
const EXTREME_FPS_RECOVERY = 28
const EXTREME_LOW_DURATION = 5
const EXTREME_RECOVERY_DURATION = 3

/**
 * Measures FPS and adjusts performance tier to maintain 60 FPS.
 * When FPS drops below 25 for 5+ seconds, enables extreme mode (hides decorative models).
 */
export function AdaptivePerformanceMonitor() {
  const setPerformanceTier = useAppStore((state) => state.setPerformanceTier)
  const setFps = useAppStore((state) => state.setFps)
  const setExtremeFpsMode = useAppStore((state) => state.setExtremeFpsMode)
  const deltas = useRef<number[]>([])
  const lowFrames = useRef(0)
  const highFrames = useRef(0)
  const frameCount = useRef(0)
  const extremeLowTime = useRef(0)
  const extremeRecoveryTime = useRef(0)

  useFrame((_, delta) => {
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

    if (fps < FPS_LOW_THRESHOLD) {
      lowFrames.current++
      highFrames.current = 0
      if (tier === 'high' && lowFrames.current >= FRAMES_TO_DROP) {
        setPerformanceTier('low')
        lowFrames.current = 0
      }
    } else if (fps > FPS_HIGH_THRESHOLD) {
      highFrames.current++
      lowFrames.current = 0
      if (tier === 'low' && highFrames.current >= FRAMES_TO_UPGRADE) {
        setPerformanceTier('high')
        highFrames.current = 0
      }
    } else {
      lowFrames.current = 0
      highFrames.current = 0
    }

    // Extreme mode: hide decorative models when FPS < 20 for 5+ seconds
    if (fps < EXTREME_FPS_THRESHOLD) {
      extremeLowTime.current += delta
      extremeRecoveryTime.current = 0
      if (!extremeMode && extremeLowTime.current >= EXTREME_LOW_DURATION) {
        setExtremeFpsMode(true)
      }
    } else if (fps > EXTREME_FPS_RECOVERY) {
      extremeRecoveryTime.current += delta
      extremeLowTime.current = 0
      if (extremeMode && extremeRecoveryTime.current >= EXTREME_RECOVERY_DURATION) {
        setExtremeFpsMode(false)
      }
    } else {
      extremeLowTime.current = 0
      extremeRecoveryTime.current = 0
    }
  })

  return null
}
