import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrthographicCamera, Html } from '@react-three/drei'
import * as THREE from 'three'

const Minimap = () => {
  const { scene } = useThree()
  const cameraRef = useRef<THREE.OrthographicCamera>(null!)
  
  // HUD Positioning - Bottom Right
  const mapSize = 180 // Fixed pixel size for consistency
  const margin = 40
  
  useFrame((state) => {
    const player = state.scene.getObjectByName('player')
    if (player && cameraRef.current) {
      // Top-down tracking
      cameraRef.current.position.set(player.position.x, 60, player.position.z)
      cameraRef.current.lookAt(player.position.x, 0, player.position.z)
      
      // Manual multi-viewport render logic
      const x = state.size.width - mapSize - margin
      const y = margin // Bottom origin for standard gl.viewport
      
      // We render at the very end of the frame cycle
      state.gl.autoClear = false
      state.gl.setViewport(x, y, mapSize, mapSize)
      state.gl.setScissor(x, y, mapSize, mapSize)
      state.gl.setScissorTest(true)
      
      state.gl.render(scene, cameraRef.current)
      
      state.gl.setScissorTest(false)
      state.gl.setViewport(0, 0, state.size.width, state.size.height)
    }
  }, 10) // High priority to run after main render

  return (
    <>
      <OrthographicCamera
        ref={cameraRef}
        makeDefault={false}
        zoom={8}
        near={1}
        far={200}
        position={[0, 60, 0]}
      />

      {/* Modern HUD Frame for the Minimap (HTML Overlay for perfect rounding) */}
      <Html fullscreen style={{ pointerEvents: 'none' }}>
        <div 
          className="absolute bottom-[40px] right-[40px] border-4 border-[#3b82f6]/40 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.3)] bg-black/20 overflow-hidden"
          style={{ 
            width: `${mapSize}px`, 
            height: `${mapSize}px`,
          }}
        >
          {/* Decorative Crosshair / Radar markings */}
          <div className="absolute inset-0 rounded-full border border-white/5 flex items-center justify-center">
            <div className="w-px h-full bg-white/10" />
            <div className="h-px w-full bg-white/10" />
          </div>
          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[8px] font-mono text-white/40">N</div>
          
          {/* Central indicator (Player) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]" />
        </div>
      </Html>
    </>
  )
}

export default Minimap
