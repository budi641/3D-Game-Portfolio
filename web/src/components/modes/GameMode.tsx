import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import World from '../../world/World'
import { PerspectiveCamera, KeyboardControls } from '@react-three/drei'
import { useAppStore } from '../../store/appStore'
import { Physics } from '@react-three/rapier'
import Player from '../../world/Player'
import { StatueIndicatorUpdater } from '../../world/StatueIndicatorUpdater'
import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { usePortfolioData } from '../../hooks/usePortfolioData'
import QuestModal from '../ui/QuestModal'
import AchievementToast from '../ui/AchievementToast'

const keyboardMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'sprint', keys: ['ShiftLeft', 'ShiftRight'] },
]

const GameMode = () => {
  const storedQuality = useAppStore((state) => state.quality)
  const focusedSection = useAppStore((state) => state.focusedSection)
  const statueIndicators = useAppStore((state) => state.statueIndicators)
  const { data } = usePortfolioData()
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  const quality = isMobile ? 'low' : storedQuality
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
      <AchievementToast
        message={pendingAchievement?.message ?? ''}
        subtext={pendingAchievement?.subtext}
        isBig={pendingAchievement?.isBig}
        visible={!!pendingAchievement}
      />
      <KeyboardControls map={keyboardMap}>
        <div className="absolute inset-0 w-full h-full" style={{ touchAction: 'none' }}>
        <Canvas
        shadows={quality !== 'low' ? 'percentage' : false}
        dpr={quality === 'low' ? [1, 1] : [1, 1.5]}
        gl={{
          antialias: quality !== 'low',
          powerPreference: 'high-performance',
          alpha: false,
          stencil: false,
        }}
      >
        <Physics debug={false} gravity={[0, -9.81, 0]} timeStep="vary">
          <World />
          <Player characterConfig={data?.character} />
          <StatueIndicatorUpdater />
        </Physics>
        
        <PerspectiveCamera makeDefault position={[12, 12, 12]} fov={isMobile ? 62 : 48} />
        
        <color attach="background" args={[quality === 'low' ? '#1e293b' : '#0f172a']} />
        <fog attach="fog" args={quality === 'low' ? ['#1e293b', 40, 120] : ['#87ceeb', 30, 150]} />

        {quality !== 'low' && (
          <EffectComposer enableNormalPass={false}>
            <Bloom luminanceThreshold={1.05} mipmapBlur intensity={0.2} radius={0.18} />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          </EffectComposer>
        )}
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

      {/* HUD Info */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-1 pointer-events-none select-none">
        <div className="text-[10px] font-mono text-engine-accent flex items-center gap-2">
           <span className="w-1.5 h-1.5 bg-engine-accent animate-pulse"></span>
           TRACKING_SYSTEM_ACTIVE
        </div>
        <div className="text-[10px] font-mono text-engine-text-muted">
          WASD TO MOVE | SHIFT TO SPRINT | SPACE TO JUMP
        </div>
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
