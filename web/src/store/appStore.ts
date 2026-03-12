import { create } from 'zustand'

export type ExperienceMode = 'game' | 'normal'

export interface StatueIndicator {
  label: string
  screenX: number
  screenY: number
  angle: number
  visible: boolean
  distance: number
}

interface AppState {
  mode: ExperienceMode
  setMode: (mode: ExperienceMode) => void

  statueIndicators: StatueIndicator[]
  setStatueIndicators: (indicators: StatueIndicator[]) => void

  exploredStatueNames: string[]
  addExploredStatue: (name: string) => void
  resetExploredStatues: () => void
  totalStatueCount: number
  setTotalStatueCount: (count: number) => void

  pendingAchievement: { message: string; subtext?: string; isBig?: boolean } | null
  setPendingAchievement: (a: { message: string; subtext?: string; isBig?: boolean } | null) => void

  questDismissed: boolean
  setQuestDismissed: (dismissed: boolean) => void
  
  isLoaded: boolean
  setIsLoaded: (isLoaded: boolean) => void

  /** Loading progress 0–100 from Canvas/useProgress. Only set when in game mode. */
  loadingProgress: number
  loadingActive: boolean
  setLoadingProgress: (progress: number, active: boolean) => void

  respawnCount: number
  triggerRespawn: () => void

  focusedSection: string | null
  setFocusedSection: (section: string | null) => void

  reducedMotion: boolean
  setReducedMotion: (reducedMotion: boolean) => void

  performanceTier: 'high' | 'low'
  setPerformanceTier: (tier: 'high' | 'low') => void

  fps: number
  setFps: (fps: number) => void

  extremeFpsMode: boolean
  setExtremeFpsMode: (enabled: boolean) => void

  mobileTutorialDismissed: boolean
  setMobileTutorialDismissed: (dismissed: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  mode: 'normal',
  setMode: (mode) => {
    localStorage.setItem('portfolio-mode', mode)
    set((state) => {
      const initialTier = 'low' as const
      return {
        ...state,
        mode,
        isLoaded: mode === 'game' ? false : state.isLoaded,
        exploredStatueNames: mode === 'game' ? [] : state.exploredStatueNames,
        questDismissed: mode === 'game' ? false : state.questDismissed,
        performanceTier: mode === 'game' ? initialTier : state.performanceTier,
        extremeFpsMode: mode === 'game' ? false : state.extremeFpsMode,
        mobileTutorialDismissed: mode === 'game' ? false : state.mobileTutorialDismissed,
      }
    })
  },

  statueIndicators: [],
  setStatueIndicators: (indicators) => set({ statueIndicators: indicators }),

  exploredStatueNames: [],
  addExploredStatue: (name) =>
    set((state) => {
      if (state.exploredStatueNames.includes(name)) return state
      return { exploredStatueNames: [...state.exploredStatueNames, name] }
    }),
  resetExploredStatues: () => set({ exploredStatueNames: [] }),

  totalStatueCount: 7,
  setTotalStatueCount: (count) => set({ totalStatueCount: count }),

  pendingAchievement: null,
  setPendingAchievement: (a) => set({ pendingAchievement: a }),

  questDismissed: false,
  setQuestDismissed: (dismissed) => set({ questDismissed: dismissed }),
  
  isLoaded: false,
  setIsLoaded: (isLoaded) => set({ isLoaded }),

  loadingProgress: 0,
  loadingActive: true,
  setLoadingProgress: (progress, active) => set({ loadingProgress: progress, loadingActive: active }),

  respawnCount: 0,
  triggerRespawn: () => set((state) => ({ respawnCount: state.respawnCount + 1 })),

  focusedSection: null,
  setFocusedSection: (section) => set({ focusedSection: section }),

  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),

  fps: 60,
  setFps: (fps) => set({ fps }),

  performanceTier: 'low',
  setPerformanceTier: (tier) => set({ performanceTier: tier }),

  extremeFpsMode: false,
  setExtremeFpsMode: (enabled) => set({ extremeFpsMode: enabled }),

  mobileTutorialDismissed: false,
  setMobileTutorialDismissed: (dismissed) => set({ mobileTutorialDismissed: dismissed }),
}))
