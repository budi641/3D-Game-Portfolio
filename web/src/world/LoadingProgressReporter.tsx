import { useProgress } from '@react-three/drei'
import { useEffect } from 'react'
import { useAppStore } from '../store/appStore'

/**
 * Reports loading progress from Canvas context to the app store.
 * Must be rendered inside Canvas so useProgress has access to the loading manager.
 */
export function LoadingProgressReporter() {
  const { progress, active } = useProgress()
  const setLoadingProgress = useAppStore((s) => s.setLoadingProgress)

  useEffect(() => {
    const safeProgress = Number.isFinite(progress) ? progress : active ? 0 : 100
    setLoadingProgress(safeProgress, active)
  }, [progress, active, setLoadingProgress])

  return null
}
