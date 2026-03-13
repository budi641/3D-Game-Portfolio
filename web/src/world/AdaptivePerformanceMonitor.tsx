import { useFrame } from '@react-three/fiber'
import { useRef, useEffect } from 'react'
import { useAppStore } from '../store/appStore'

const FPS_SAMPLES = 30
const FPS_LOW_THRESHOLD = 55
const FPS_HIGH_THRESHOLD = 60
const FRAMES_TO_DROP = 3
const FPS_UPDATE_INTERVAL = 30
const SUSTAINED_HIGH_DURATION = 5 // seconds at 60+ FPS (mobile only: bump resolution to 100%)

const EXTREME_FPS_THRESHOLD = 20
const EXTREME_LOW_DURATION = 3
const LARGE_DELTA_THRESHOLD = 0.2 // Skip frames after tab return (rAF can spike)

const isMobile = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

/**
 * Measures FPS and adapts quality.
 * - If FPS < 55 for FRAMES_TO_DROP consecutive samples → switch to low.
 * - Mobile only: if FPS >= 60 for 5 seconds → bump resolution to 100%.
 * - Extreme mode: FPS < 20 for 3+ seconds (while in low) → 25% res, hide decorative models.
 */
export function AdaptivePerformanceMonitor() {
  const setPerformanceTier = useAppStore((state) => state.setPerformanceTier)
  const setFps = useAppStore((state) => state.setFps)
  const setExtremeFpsMode = useAppStore((state) => state.setExtremeFpsMode)
  const setMobileResolutionBoost = useAppStore((state) => state.setMobileResolutionBoost)
  const deltas = useRef<number[]>([])
  const lowFrames = useRef(0)
  const frameCount = useRef(0)
  const extremeLowTime = useRef(0)
  const sustainedHighTime = useRef(0)

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        lowFrames.current = 0
        extremeLowTime.current = 0
        sustainedHighTime.current = 0
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
    const mobileBoost = useAppStore.getState().mobileResolutionBoost

    // Degrade: high → low when FPS drops below threshold for N frames
    if (fps < FPS_LOW_THRESHOLD && tier === 'high') {
      lowFrames.current++
      sustainedHighTime.current = 0
      if (lowFrames.current >= FRAMES_TO_DROP) {
        setPerformanceTier('low')
        lowFrames.current = 0
      }
      if (isMobile() && mobileBoost) setMobileResolutionBoost(false)
    } else {
      lowFrames.current = 0
      if (fps >= FPS_HIGH_THRESHOLD) {
        sustainedHighTime.current += delta
        if (sustainedHighTime.current >= SUSTAINED_HIGH_DURATION) {
          setPerformanceTier('high')
          setExtremeFpsMode(false)
          if (isMobile()) setMobileResolutionBoost(true)
        }
      } else {
        sustainedHighTime.current = 0
        if (isMobile() && mobileBoost) setMobileResolutionBoost(false)
      }
    }

    // Extreme: low → extreme when FPS < 20 for 3+ seconds
    if (!extremeMode && fps < EXTREME_FPS_THRESHOLD) {
      extremeLowTime.current += delta
      if (extremeLowTime.current >= EXTREME_LOW_DURATION) {
        setExtremeFpsMode(true)
        if (isMobile()) setMobileResolutionBoost(false)
      }
    } else {
      extremeLowTime.current = 0
    }
  })

  return null
}
