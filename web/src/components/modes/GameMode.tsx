import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import World from '../../world/World'
import { PerspectiveCamera, KeyboardControls } from '@react-three/drei'
import { useAppStore } from '../../store/appStore'
import { Physics } from '@react-three/rapier'
import Player from '../../world/Player'
import { StatueIndicatorUpdater } from '../../world/StatueIndicatorUpdater'
import { LoadingProgressReporter } from '../../world/LoadingProgressReporter'
import { AdaptivePerformanceMonitor } from '../../world/AdaptivePerformanceMonitor'
import { usePortfolioData } from '../../hooks/usePortfolioData'
import { usePerformanceTier } from '../../hooks/usePerformanceTier'
import QuestModal from '../ui/QuestModal'
import MobileTutorial from '../ui/MobileTutorial'
import PcTutorial from '../ui/PcTutorial'
import AchievementToast from '../ui/AchievementToast'
import StatueContextPanel from '../ui/StatueContextPanel'

const keyboardMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
  { name: 'sprint', keys: ['ShiftLeft', 'ShiftRight'] },
]

const GameMode = () => {
  const focusedSection = useAppStore((state) => state.focusedSection)
  const statueIndicators = useAppStore((state) => state.statueIndicators)
  const extremeFpsMode = useAppStore((state) => state.extremeFpsMode)
  const mobileResolutionBoost = useAppStore((state) => state.mobileResolutionBoost)
  const { data } = usePortfolioData()
  const perfTier = usePerformanceTier()
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  const showPcControls = !isMobile
  const showStatueIndicators = data?.scene?.showStatueIndicators === true
  const pendingAchievement = useAppStore((state) => state.pendingAchievement)
  const setPendingAchievement = useAppStore((state) => state.setPendingAchievement)

  useEffect(() => {
    if (!pendingAchievement) return
    const t = setTimeout(() => setPendingAchievement(null), pendingAchievement.isBig ? 4500 : 3000)
    return () => clearTimeout(t)
  }, [pendingAchievement, setPendingAchievement])

  return (
    <div className="w-full h-full min-h-[100dvh] relative">
      <QuestModal />
      <MobileTutorial />
      <PcTutorial />
      <StatueContextPanel data={data} />
      <AchievementToast
        message={pendingAchievement?.message ?? ''}
        subtext={pendingAchievement?.subtext}
        isBig={pendingAchievement?.isBig}
        visible={!!pendingAchievement}
      />
      <KeyboardControls map={keyboardMap}>
        <div className="absolute inset-0 w-full h-full" style={{ touchAction: 'none' }}>
        <Canvas
        shadows={false}
        dpr={
          isMobile && mobileResolutionBoost
            ? [1, 1]
            : extremeFpsMode
              ? [0.25, 1]
              : perfTier === 'low'
                ? [0.25, 1]
                : [1, 1]
        }
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
          alpha: false,
          stencil: false,
        }}
        style={{ display: 'block', width: '100%', height: '100%' }}
      >
        <Physics debug={false} gravity={[0, -9.81, 0]} timeStep={1 / 60}>
          <LoadingProgressReporter />
          <AdaptivePerformanceMonitor />
          <World performanceTier={perfTier} />
          <Player characterConfig={data?.character} performanceTier={perfTier} />
          <StatueIndicatorUpdater performanceTier={perfTier} />
        </Physics>
        
        <PerspectiveCamera makeDefault position={[12, 12, 12]} fov={isMobile ? 62 : 48} />
        
        <color attach="background" args={['#1e293b']} />
      </Canvas>
        </div>
      </KeyboardControls>
      

      {/* EMERGENCY DASHBOARD ACCESS */}
      <div className="absolute top-16 left-4 z-[70] md:hidden">
        <button 
          onClick={() => useAppStore.getState().setMode('normal')}
          className="bg-red-600 text-white text-[10px] px-2 py-1 rounded shadow-lg font-bold"
        >
          FORCE NORMAL MODE
        </button>
      </div>

      {/* HUD Info - PC controls hidden on mobile */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-1 pointer-events-none select-none">
        <div className="text-[10px] font-mono text-engine-accent flex items-center gap-2">
           <span className="w-1.5 h-1.5 bg-engine-accent animate-pulse"></span>
           TRACKING_SYSTEM_ACTIVE
        </div>
        {showPcControls && (
          <div className="text-[10px] font-mono text-engine-text-muted">
            WASD TO MOVE | SHIFT TO SPRINT
          </div>
        )}
      </div>

      {showStatueIndicators && !focusedSection && (statueIndicators ?? []).length > 0 && (
        <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
          {(statueIndicators ?? []).map((ind) => (
            <div
              key={ind.label}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-150"
              style={{
                left: ind.screenX,
                top: ind.screenY,
                transform: `translate(-50%, -50%) rotate(${ind.angle}deg)`,
              }}
            >
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-sky-200/40 text-[10px] font-mono tracking-[0.15em] text-sky-200/95 shadow-lg whitespace-nowrap">
                <span className="text-sky-400">▶</span>
                <span>{ind.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default GameMode
