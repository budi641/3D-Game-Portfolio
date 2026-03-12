import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { useAppStore } from '../store/appStore'

const FPS_SAMPLES = 30
const FPS_LOW_THRESHOLD = 52
const FPS_HIGH_THRESHOLD = 59
const FRAMES_TO_DROP = 5
const FRAMES_TO_UPGRADE = 300
const FPS_UPDATE_INTERVAL = 30

/**
 * Measures FPS and adjusts performance tier to maintain 60 FPS.
 * Runs inside the Canvas so it has access to real frame times.
 */
export function AdaptivePerformanceMonitor() {
  const setPerformanceTier = useAppStore((state) => state.setPerformanceTier)
  const setFps = useAppStore((state) => state.setFps)
  const deltas = useRef<number[]>([])
  const lowFrames = useRef(0)
  const highFrames = useRef(0)
  const frameCount = useRef(0)

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
  })

  return null
}
