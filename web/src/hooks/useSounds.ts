import { useCallback } from 'react'
import { useAppStore } from '../store/appStore'
import * as sounds from '../lib/sounds'

export function useSounds() {
  const soundEnabled = useAppStore((s) => s.soundEnabled)
  const reducedMotion = useAppStore((s) => s.reducedMotion)

  const shouldPlay = soundEnabled && !reducedMotion

  return {
    playClick: useCallback(() => {
      if (shouldPlay) sounds.playClick()
    }, [shouldPlay]),
    playAchievement: useCallback((isBig?: boolean) => {
      if (shouldPlay) sounds.playAchievement(isBig)
    }, [shouldPlay]),
    playPanelOpen: useCallback(() => {
      if (shouldPlay) sounds.playPanelOpen()
    }, [shouldPlay]),
    playPanelClose: useCallback(() => {
      if (shouldPlay) sounds.playPanelClose()
    }, [shouldPlay]),
  }
}
