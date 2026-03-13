import { Suspense, useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import type { PerformanceTier } from '../hooks/usePerformanceTier'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '../store/appStore'
import CdnAnimatedModel from './CdnAnimatedModel'
import ModelErrorBoundary from '../components/system/ModelErrorBoundary'

interface StatueProps {
  position: [number, number, number]
  name: string
  renderStyle?: 'pbr' | 'cel'
  type?: string
  color?: string
  data: any
  modelUrl?: string
  modelScale?: number
  modelRotation?: [number, number, number]
  modelPosition?: [number, number, number]
  modelAnimated?: boolean
  animationClip?: string
  allowTransparency?: boolean
  spinSpeed?: number
  floatAmount?: number
  floatSpeed?: number
  interactionDistance?: number
  performanceTier?: PerformanceTier
  onClick: () => void
  showClickHint?: boolean
}

const TYPE_MODEL_MAP: Record<string, { modelId: string; scale: number; rotationY?: number; playAnimation?: boolean }> = {
  projects: { modelId: 'robot-expressive', scale: 0.3, rotationY: 0.2, playAnimation: true },
  education: { modelId: 'robot-expressive', scale: 0.3, rotationY: 0.2, playAnimation: true },
  work: { modelId: 'robot-expressive', scale: 0.3, rotationY: 0.2, playAnimation: true },
  skills: { modelId: 'robot-expressive', scale: 0.3, rotationY: 0.2, playAnimation: true },
  contact: { modelId: 'robot-expressive', scale: 0.3, rotationY: 0.2, playAnimation: true },
  about: { modelId: 'robot-expressive', scale: 0.3, rotationY: 0.2, playAnimation: true },
  blog: { modelId: 'robot-expressive', scale: 0.3, rotationY: 0.2, playAnimation: true },
}

const Statue = ({
  position,
  name,
  renderStyle = 'pbr',
  type = 'projects',
  color = "#60a5fa",
  data: _data, // passed for API compatibility, content rendered by StatueContextPanel
  modelUrl,
  modelScale,
  modelRotation,
  modelPosition,
  modelAnimated,
  animationClip,
  allowTransparency = false,
  spinSpeed,
  floatAmount,
  floatSpeed,
  interactionDistance = 12,
  performanceTier = 'high',
  onClick,
  showClickHint = false,
}: StatueProps) => {
  const [hovered, setHovered] = useState(false)
  const [nearby, setNearby] = useState(false)
  const groupRef = useRef<THREE.Group>(null)
  const coreRef = useRef<THREE.Group>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const ringMatRef = useRef<THREE.MeshBasicMaterial>(null)
  const nearbyRef = useRef(false)
  const nearAmountRef = useRef(0)
  const hoverAmountRef = useRef(0)
  const worldPosRef = useRef(new THREE.Vector3())
  const targetScaleRef = useRef(new THREE.Vector3(1, 1, 1))
  const scaleInitialized = useRef(false)
  const playerDirRef = useRef(new THREE.Vector3())
  const frameSkip = useRef(0)

  const focusedSection = useAppStore((state) => state.focusedSection)
  const isFocused = focusedSection === name

  const renderStatueVisual = useMemo(() => {
    const modelConfig = TYPE_MODEL_MAP[type] || TYPE_MODEL_MAP.projects
    const resolvedModelUrl = modelUrl || ''

    if (!resolvedModelUrl) return null

    return (
      <Suspense fallback={null}>
        <ModelErrorBoundary fallback={null}>
          <CdnAnimatedModel
            url={resolvedModelUrl}
            position={modelPosition ?? [0, 0.35, 0]}
            rotation={modelRotation ?? [0, modelConfig.rotationY ?? 0, 0]}
            scale={1}
            playAnimation={(modelAnimated ?? false) && nearby}
            clipName={animationClip}
            forceOpaque={!allowTransparency}
            renderStyle={renderStyle}
          />
        </ModelErrorBoundary>
      </Suspense>
    )
  }, [type, modelUrl, modelScale, modelRotation, modelPosition, modelAnimated, animationClip, allowTransparency, renderStyle, nearby, color])

  const typeScale = (TYPE_MODEL_MAP[type] || TYPE_MODEL_MAP.projects).scale ?? 0.3
  const rawScale =
    type === 'blog' || modelUrl?.endsWith('Blog.glb')
      ? 0.0175
      : typeof modelScale === 'number'
        ? modelScale
        : modelUrl
          ? 1
          : typeScale
  const baseScale = THREE.MathUtils.clamp(rawScale, 0.01, 5)

  // Reset scale when modelScale changes (e.g. from dashboard) so it gets re-applied
  useEffect(() => {
    scaleInitialized.current = false
  }, [baseScale])

  // Set scale immediately on mount so model never renders at wrong scale (before first frame)
  useLayoutEffect(() => {
    if (groupRef.current) {
      groupRef.current.scale.set(baseScale, baseScale, baseScale)
      targetScaleRef.current.set(baseScale, baseScale, baseScale)
      scaleInitialized.current = true
    }
  }, [baseScale])

  useFrame((state, delta) => {
    // Set correct scale immediately on first frame (BEFORE frame skip) so models never render at wrong scale
    if (groupRef.current && !scaleInitialized.current) {
      scaleInitialized.current = true
      groupRef.current.scale.set(baseScale, baseScale, baseScale)
      targetScaleRef.current.set(baseScale, baseScale, baseScale)
    }
    // Frame skip for performance - but scale init above must run first
    if (performanceTier === 'low') {
      frameSkip.current++
      if (frameSkip.current % 4 !== 0) return
    }
    const player = state.scene.getObjectByName('player')
    if (player && groupRef.current) {
      groupRef.current.getWorldPosition(worldPosRef.current)
      const dist = worldPosRef.current.distanceTo(player.position)
      // Hysteresis to avoid near/far flicker at the threshold.
      const exitDistance = interactionDistance + 1.4
      const isNowNearby = nearbyRef.current ? dist < exitDistance : dist < interactionDistance
      if (isNowNearby !== nearbyRef.current) {
        nearbyRef.current = isNowNearby
        setNearby(isNowNearby)
      }

      const nearTarget = isNowNearby ? 1 : 0
      nearAmountRef.current = THREE.MathUtils.damp(nearAmountRef.current, nearTarget, 8, delta)

      playerDirRef.current.subVectors(player.position, worldPosRef.current)
      playerDirRef.current.y = 0
      if (playerDirRef.current.lengthSq() > 0.0001) {
        playerDirRef.current.normalize()
      }
    }

    const hoverTarget = hovered && nearbyRef.current ? 1 : 0
    hoverAmountRef.current = THREE.MathUtils.damp(hoverAmountRef.current, hoverTarget, 11, delta)

    if (groupRef.current) {
      // Idle: baseScale, near: 1.255x, hover: extra subtle boost. Apply model scale to group.
      const proximityScale = 1 + nearAmountRef.current * 0.255 + hoverAmountRef.current * 0.085
      const combinedScale = baseScale * proximityScale
      targetScaleRef.current.set(combinedScale, combinedScale, combinedScale)
      const lerpAlpha = 1 - Math.exp(-10 * delta)
      groupRef.current.scale.lerp(targetScaleRef.current, lerpAlpha)
    }

    // Ring is fixed size (outside scaled group) - no scale changes

    if (ringMatRef.current) {
      const nearGlow = nearAmountRef.current * 0.42
      const hoverBoost = hoverAmountRef.current * 0.58
      const targetOpacity = Math.min(1, nearGlow * 1.35 + hoverBoost * 1.35)
      ringMatRef.current.opacity = THREE.MathUtils.damp(ringMatRef.current.opacity, targetOpacity, 10, delta)
    }

    if (coreRef.current) {
      // Clamp CMS values to keep custom GLBs stable.
      const baseSpin = THREE.MathUtils.clamp(spinSpeed ?? 0.35, 0, 1.2)
      const baseFloatSpeed = THREE.MathUtils.clamp(floatSpeed ?? 1.8, 0.2, 2.6)
      const baseFloatAmount = THREE.MathUtils.clamp(floatAmount ?? 0.06, 0, 0.18)
      const idleSpin = baseSpin * (0.2 + (1 - nearAmountRef.current) * 0.7)
      const activeFloatSpeed = baseFloatSpeed * (0.5 + nearAmountRef.current * 0.5 + hoverAmountRef.current * 0.25)
      const activeFloatAmount = baseFloatAmount * (0.5 + nearAmountRef.current * 0.45 + hoverAmountRef.current * 0.2)

      // Idle rotates slowly, near state turns toward player for better interaction feedback.
      const targetYaw = Math.atan2(playerDirRef.current.x, playerDirRef.current.z)
      const facingWeight = nearAmountRef.current
      if (facingWeight > 0.05) {
        coreRef.current.rotation.y = THREE.MathUtils.damp(coreRef.current.rotation.y, targetYaw, 9, delta)
      } else {
        coreRef.current.rotation.y += idleSpin * delta
      }
      coreRef.current.position.y = Math.sin(state.clock.elapsedTime * activeFloatSpeed) * activeFloatAmount
    }
  })

  const isTouchPrimary = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  const clickHintText = isTouchPrimary ? 'Tap me' : 'Click me'

  return (
    <group position={position} name={`statue-${name}`}>
      {/* Ring: fixed size, independent of model scale - sits at platform level */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[3.8, 4.5, performanceTier === 'low' ? 24 : 56]} />
        <meshBasicMaterial
          ref={ringMatRef}
          color={color}
          transparent
          opacity={0}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Invisible hitbox: ring-sized cylinder for easy clicking (no need to hit the model) */}
      <mesh
        position={[0, 1, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={onClick}
      >
        <cylinderGeometry args={[4.5, 4.5, 2.5, 32]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      <group ref={groupRef}>
        {/* Model only - scaling applied here, ring is separate */}
        <group ref={coreRef}>
          {renderStatueVisual}
        </group>

        {/* Identity Label */}
        <Html
          position={[0, 1.4, 0]}
          distanceFactor={10}
          center
          style={{
            transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
            opacity: nearby && !isFocused ? 1 : 0,
            transform: `scale(${nearby ? (hovered ? 1.2 : 1.06) : 0.82}) translateY(${nearby ? (hovered ? -8 : -2) : 20}px)`,
            filter: hovered ? 'drop-shadow(0 0 16px rgba(125,211,252,0.6))' : 'none',
            pointerEvents: 'none'
          }}
        >
          <div className="relative group flex flex-col items-center">
            {showClickHint && nearby && (
              <div
                className="text-2xl sm:text-3xl font-black uppercase tracking-widest mb-3 px-6 py-3 rounded-xl text-white bg-slate-900/95 border-2 border-sky-500/50 animate-bounce"
                style={{ boxShadow: '0 0 24px rgba(56, 189, 248, 0.5), 0 0 48px rgba(14, 165, 233, 0.3)' }}
              >
                {clickHintText}
              </div>
            )}
            <div
              className="px-7 py-2.5 bg-black/92 backdrop-blur-3xl border-l-[3px] rounded-xl shadow-[0_0_44px_rgba(0,0,0,0.6)] flex flex-col items-center"
              style={{ borderColor: color }}
            >
              <div className="text-[8px] font-mono tracking-[0.5em] opacity-40 mb-0.5" style={{ color }}>SECTOR</div>
              <div className="text-[30px] font-black text-white tracking-[0.12em] uppercase tabular-nums leading-none">{name}</div>
            </div>
          </div>
        </Html>
      </group>

      {/* Context panel rendered by StatueContextPanel (outside Canvas) for correct positioning */}

    </group>
  )
}

export default Statue
