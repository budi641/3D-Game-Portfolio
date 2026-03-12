import { useAppStore } from '../store/appStore'

export type PerformanceTier = 'high' | 'low'

/**
 * Returns the current performance tier. Updated automatically by AdaptivePerformanceMonitor
 * based on measured FPS to maintain 60 FPS on any device.
 */
export function usePerformanceTier(): PerformanceTier {
  return useAppStore((state) => state.performanceTier)
}
