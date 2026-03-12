import { create } from 'zustand'

export type ExperienceMode = 'game' | 'normal'
export type QualityLevel = 'low' | 'medium' | 'high'

interface AppState {
  mode: ExperienceMode
  setMode: (mode: ExperienceMode) => void
  
  quality: QualityLevel
  setQuality: (quality: QualityLevel) => void
  
  isLoaded: boolean
  setIsLoaded: (isLoaded: boolean) => void

  respawnCount: number
  triggerRespawn: () => void

  focusedSection: string | null
  setFocusedSection: (section: string | null) => void

  reducedMotion: boolean
  setReducedMotion: (reducedMotion: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  mode: (localStorage.getItem('portfolio-mode') as ExperienceMode) || 'normal',
  setMode: (mode) => {
    localStorage.setItem('portfolio-mode', mode)
    set({ mode })
  },
  
  quality: (localStorage.getItem('portfolio-quality') as QualityLevel) || 'high',
  setQuality: (quality) => {
    localStorage.setItem('portfolio-quality', quality)
    set({ quality })
  },
  
  isLoaded: false,
  setIsLoaded: (isLoaded) => set({ isLoaded }),

  respawnCount: 0,
  triggerRespawn: () => set((state) => ({ respawnCount: state.respawnCount + 1 })),

  focusedSection: null,
  setFocusedSection: (section) => set({ focusedSection: section }),

  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
}))
