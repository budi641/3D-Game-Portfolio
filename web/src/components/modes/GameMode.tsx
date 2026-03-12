import { Canvas } from '@react-three/fiber'
import World from '../../world/World'
import { PerspectiveCamera, KeyboardControls } from '@react-three/drei'
import { useAppStore } from '../../store/appStore'
import { Physics } from '@react-three/rapier'
import Player from '../../world/Player'
import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'

const keyboardMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'sprint', keys: ['ShiftLeft', 'ShiftRight'] },
]

const GameMode = () => {
  const quality = useAppStore((state) => state.quality)

  return (
    <div className="w-full h-full relative">
      <KeyboardControls map={keyboardMap}>
        <Canvas
        shadows={quality !== 'low' ? 'percentage' : false}
        dpr={quality === 'low' ? [1, 1] : [1, 2]}
        gl={{ antialias: quality !== 'low' }}
      >
        <Physics debug={false} gravity={[0, -9.81, 0]}>
          <World />
          <Player />
        </Physics>
        
        <PerspectiveCamera makeDefault position={[12, 12, 12]} fov={45} />
        
        <color attach="background" args={['#0f172a']} />
        <fog attach="fog" args={['#87ceeb', 30, 150]} />

        <EffectComposer enableNormalPass={false}>
          <Bloom luminanceThreshold={1} mipmapBlur intensity={0.4} radius={0.3} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      </Canvas>
      </KeyboardControls>
      

      {/* EMERGENCY DASHBOARD ACCESS */}
      <div className="absolute top-16 left-4 z-[70] md:hidden">
        <button 
          onClick={() => useAppStore.getState().setMode('normal')}
          className="bg-red-600 text-white text-[10px] px-2 py-1 rounded shadow-lg font-bold"
        >
          FORCE DASHBOARD
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
    </div>
  )
}

export default GameMode
