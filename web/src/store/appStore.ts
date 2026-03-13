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

  /** Screen position for statue context panel (updated each frame when focused) */
  focusedStatueScreenPos: { x: number; y: number } | null
  setFocusedStatueScreenPos: (pos: { x: number; y: number } | null) => void

  /** Metadata for the focused statue (name, type, color) */
  focusedStatueMetadata: { name: string; type: string; color: string } | null
  setFocusedStatueMetadata: (meta: { name: string; type: string; color: string } | null) => void

  reducedMotion: boolean
  setReducedMotion: (reducedMotion: boolean) => void

  performanceTier: 'high' | 'low'
  setPerformanceTier: (tier: 'high' | 'low') => void

  fps: number
  setFps: (fps: number) => void

  extremeFpsMode: boolean
  setExtremeFpsMode: (enabled: boolean) => void

  /** Mobile only: true when FPS 60+ for 5 sec – bumps resolution to 100% */
  mobileResolutionBoost: boolean
  setMobileResolutionBoost: (enabled: boolean) => void

  mobileTutorialDismissed: boolean
  setMobileTutorialDismissed: (dismissed: boolean) => void

  pcTutorialDismissed: boolean
  setPcTutorialDismissed: (dismissed: boolean) => void

  soundEnabled: boolean
  setSoundEnabled: (enabled: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  mode: 'normal',
  setMode: (mode) => {
    localStorage.setItem('portfolio-mode', mode)
    set((state) => {
      return {
        ...state,
        mode,
        isLoaded: mode === 'game' ? false : state.isLoaded,
        exploredStatueNames: mode === 'game' ? [] : state.exploredStatueNames,
        questDismissed: mode === 'game' ? false : state.questDismissed,
        // Performance tier and extreme mode: never reset on mode switch; only page refresh restores high
        performanceTier: mode === 'game' ? state.performanceTier : state.performanceTier,
        extremeFpsMode: mode === 'game' ? state.extremeFpsMode : state.extremeFpsMode,
        mobileResolutionBoost: mode === 'game' ? state.mobileResolutionBoost : state.mobileResolutionBoost,
        mobileTutorialDismissed: mode === 'game' ? false : state.mobileTutorialDismissed,
        pcTutorialDismissed: mode === 'game' ? false : state.pcTutorialDismissed,
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
  setFocusedSection: (section) =>
    set((state) => ({
      ...state,
      focusedSection: section,
      ...(section === null && { focusedStatueMetadata: null, focusedStatueScreenPos: null }),
    })),

  focusedStatueScreenPos: null,
  setFocusedStatueScreenPos: (pos) => set({ focusedStatueScreenPos: pos }),

  focusedStatueMetadata: null,
  setFocusedStatueMetadata: (meta) => set({ focusedStatueMetadata: meta }),

  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),

  fps: 60,
  setFps: (fps) => set({ fps }),

  performanceTier: 'high',
  setPerformanceTier: (tier) => set({ performanceTier: tier }),

  extremeFpsMode: false,
  setExtremeFpsMode: (enabled) => set({ extremeFpsMode: enabled }),

  mobileResolutionBoost: false,
  setMobileResolutionBoost: (enabled) => set({ mobileResolutionBoost: enabled }),

  mobileTutorialDismissed: false,
  setMobileTutorialDismissed: (dismissed) => set({ mobileTutorialDismissed: dismissed }),

  pcTutorialDismissed: false,
  setPcTutorialDismissed: (dismissed) => set({ pcTutorialDismissed: dismissed }),

  soundEnabled: (() => {
    try {
      const v = localStorage.getItem('portfolio-sound-enabled')
      return v === null ? true : v === 'true'
    } catch {
      return true
    }
  })(),
  setSoundEnabled: (enabled) => {
    try {
      localStorage.setItem('portfolio-sound-enabled', String(enabled))
    } catch {}
    set({ soundEnabled: enabled })
  },
}))
