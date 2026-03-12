import { Grid, Environment, Float, Html } from '@react-three/drei'
import * as THREE from 'three'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { PerformanceTier } from '../hooks/usePerformanceTier'
import { useFrame } from '@react-three/fiber'
import { useAppStore } from '../store/appStore'
import { usePortfolioData } from '../hooks/usePortfolioData'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import Statue from './Statue'
import CdnAnimatedModel from './CdnAnimatedModel'
import ModelErrorBoundary from '../components/system/ModelErrorBoundary'

type LinkRelicConfig = {
  id: string
  label: string
  url: string
  position: [number, number, number]
  color: string
  modelUrl: string
  modelScale: number
  modelPosition?: [number, number, number]
  modelRotation?: [number, number, number]
  modelAnimated?: boolean
  spinSpeed?: number
  floatAmount?: number
  floatSpeed?: number
  glowIntensity?: number
}

type ScenePlacedModelConfig = {
  name?: string
  modelFileUrl?: string
  modelUrl?: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  playAnimation?: boolean
  animationClip?: string
  doubleSidedMaterials?: boolean
  allowTransparency?: boolean
  autoRotate?: boolean
  autoRotateSpeedX?: number
  autoRotateSpeedY?: number
  autoRotateSpeedZ?: number
  glowRing?: boolean
  glowRingColor?: string
  glowRingIntensity?: number
}

import { resolveSections, resolveLinkRelics, toHexColor } from '../lib/resolvedSections'

function StylizedSky({ performanceTier }: { performanceTier: PerformanceTier }) {
  const [skyTexture, setSkyTexture] = useState<THREE.Texture | null>(null)

  const createFallbackSkyTexture = useMemo(() => () => {
    const low = performanceTier === 'low'
    const canvas = document.createElement('canvas')
    canvas.width = low ? 512 : 1024
    canvas.height = low ? 256 : 512
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const h = canvas.height
    const bg = ctx.createLinearGradient(0, 0, 0, h)
    bg.addColorStop(0, '#1e3a5f')
    bg.addColorStop(0.5, '#4a7ba7')
    bg.addColorStop(1, '#87ceeb')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, canvas.width, h)

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.needsUpdate = true
    return tex
  }, [performanceTier])

  useEffect(() => {
    setSkyTexture(createFallbackSkyTexture())
  }, [createFallbackSkyTexture, performanceTier])

  useEffect(() => {
    return () => {
      skyTexture?.dispose()
    }
  }, [skyTexture])

  if (!skyTexture) return null

  const segments = performanceTier === 'low' ? 24 : 64
  return (
    <mesh frustumCulled={false} renderOrder={-1000}>
      <sphereGeometry args={[520, segments, segments]} />
      <meshBasicMaterial map={skyTexture} side={THREE.BackSide} depthWrite={false} toneMapped={false} fog={false} />
    </mesh>
  )
}

function LinkRelic({
  label,
  url,
  color,
  position,
  modelUrl,
  modelScale,
  modelPosition = [0, 0.05, 0],
  modelRotation = [0, 0, 0],
  modelAnimated = true,
  spinSpeed = 1.2,
  floatAmount = 0.2,
  floatSpeed = 2,
  glowIntensity = 2.2,
  renderStyle = 'pbr',
  performanceTier = 'high',
  totalDiscoverables = 10,
}: {
  label: string
  url: string
  color: string
  position: [number, number, number]
  modelUrl: string
  modelScale: number
  modelPosition?: [number, number, number]
  modelRotation?: [number, number, number]
  modelAnimated?: boolean
  spinSpeed?: number
  floatAmount?: number
  floatSpeed?: number
  glowIntensity?: number
  renderStyle?: 'pbr' | 'cel'
  performanceTier?: PerformanceTier
  totalDiscoverables?: number
}) {
  const addExploredStatue = useAppStore((state) => state.addExploredStatue)
  const exploredStatueNames = useAppStore((state) => state.exploredStatueNames)
  const setPendingAchievement = useAppStore((state) => state.setPendingAchievement)
  const relicRef = useRef<THREE.Group>(null)
  const frameSkip = useRef(0)
  const modelGroupRef = useRef<THREE.Group>(null)
  const baseMatRef = useRef<THREE.MeshStandardMaterial>(null)
  const ringMatRef = useRef<THREE.MeshBasicMaterial>(null)
  const ringMeshRef = useRef<THREE.Mesh>(null)
  const discoveredRef = useRef(false)
  const [hovered, setHovered] = useState(false)
  const [nearby, setNearby] = useState(false)
  const nearbyRef = useRef(false)
  const nearAmountRef = useRef(0)
  const hoverAmountRef = useRef(0)
  const relicWorldPos = useMemo(() => new THREE.Vector3(), [])
  const toPlayerRef = useMemo(() => new THREE.Vector3(), [])
  const scaleInitialized = useRef(false)
  const interactionDistance = 14
  const transitionDistance = 20

  useFrame((state, delta) => {
    if (relicRef.current) {
      relicRef.current.getWorldPosition(relicWorldPos)
      const playerObj = state.scene.getObjectByName('player')
      const anchor = playerObj?.position || state.camera.position
      const dist = relicWorldPos.distanceTo(anchor)
      const exitDistance = interactionDistance + 1.2
      const isNowNearby = nearbyRef.current ? dist <= exitDistance : dist <= interactionDistance
      if (isNowNearby !== nearbyRef.current) {
        nearbyRef.current = isNowNearby
        setNearby(isNowNearby)
        if (isNowNearby && !discoveredRef.current) {
          discoveredRef.current = true
          const wasNew = !exploredStatueNames.includes(label)
          if (wasNew) {
            addExploredStatue(label)
            const newCount = exploredStatueNames.length + 1
            if (newCount >= totalDiscoverables) {
              setPendingAchievement({ message: 'Master Explorer', subtext: 'All statues and links discovered!', isBig: true })
            } else {
              setPendingAchievement({ message: `Discovered: ${label}`, subtext: `${newCount}/${totalDiscoverables} discovered`, isBig: false })
            }
          }
        }
      }

      const rawNear = THREE.MathUtils.clamp(
        (transitionDistance - dist) / Math.max(0.001, transitionDistance - interactionDistance),
        0,
        1
      )
      nearAmountRef.current = THREE.MathUtils.damp(nearAmountRef.current, rawNear, 8, delta)

      toPlayerRef.subVectors(anchor, relicWorldPos)
      toPlayerRef.y = 0
      if (toPlayerRef.lengthSq() > 0.0001) {
        toPlayerRef.normalize()
      }
    }

    const hoverTarget = hovered ? 1 : 0
    hoverAmountRef.current = THREE.MathUtils.damp(hoverAmountRef.current, hoverTarget, 12, delta)

    const nearFactor = nearAmountRef.current
    if (modelGroupRef.current) {
      const baseScale = modelScale
      const proximityMultiplier = 1 + nearFactor * 0.2 + hoverAmountRef.current * 0.04
      const targetScale = baseScale * proximityMultiplier
      if (!scaleInitialized.current) {
        scaleInitialized.current = true
        modelGroupRef.current.scale.setScalar(targetScale)
      } else {
        const lerpAlpha = 1 - Math.exp(-8 * delta)
        const current = modelGroupRef.current.scale.x
        const smoothed = THREE.MathUtils.lerp(current, targetScale, lerpAlpha)
        modelGroupRef.current.scale.setScalar(smoothed)
      }
    }

    if (performanceTier === 'low') {
      frameSkip.current++
      if (frameSkip.current % 4 !== 0) return
    }

    if (modelGroupRef.current) {
      const spin = spinSpeed * (0.14 + (1 - nearFactor) * 0.55)
      const bobAmount = floatAmount * (0.14 + nearFactor * 0.9)
      const bobSpeed = floatSpeed * (0.42 + nearFactor * 0.95)

      const targetYaw = Math.atan2(toPlayerRef.x, toPlayerRef.z)
      if (nearFactor > 0.05) {
        modelGroupRef.current.rotation.y = THREE.MathUtils.damp(modelGroupRef.current.rotation.y, targetYaw, 9, delta)
      } else {
        modelGroupRef.current.rotation.y += spin * delta
      }
      modelGroupRef.current.position.y = modelPosition[1] + Math.sin(state.clock.elapsedTime * bobSpeed) * bobAmount
    }

    if (baseMatRef.current) {
      // State 3 (hover): glow ring and base only on hover.
      const targetGlow = (nearFactor * 0.55 + hoverAmountRef.current) * glowIntensity * (1 + nearFactor * 0.35)
      baseMatRef.current.emissiveIntensity = THREE.MathUtils.lerp(baseMatRef.current.emissiveIntensity, targetGlow, 0.12)
    }

    if (ringMatRef.current) {
      const pulse = 0.18 + Math.sin(state.clock.elapsedTime * 4.0) * 0.16
      const targetOpacity = THREE.MathUtils.clamp(
        (nearFactor * 0.4 + hoverAmountRef.current * (0.48 + nearFactor * 0.42 + pulse)) * (glowIntensity / 2),
        0,
        1
      )
      ringMatRef.current.opacity = THREE.MathUtils.lerp(ringMatRef.current.opacity, targetOpacity, 0.16)
    }

    if (ringMeshRef.current) {
      // Idle ring is small; expands in proximity; tiny pulse while active.
      const pulseScale = 1 + Math.sin(state.clock.elapsedTime * 3.2) * (0.02 + nearFactor * 0.02)
      const targetScale = 0.92 + nearFactor * 0.55 + pulseScale * 0.05
      ringMeshRef.current.scale.set(targetScale, targetScale, 1)
    }
  })

  return (
    <group ref={relicRef} position={position}>
      <RigidBody type="fixed" colliders={false}>
        <mesh receiveShadow castShadow position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.55, 0.7, 0.5, 6]} />
          <meshStandardMaterial ref={baseMatRef} color={color} roughness={0.85} emissive={color} emissiveIntensity={0.8} />
        </mesh>
        <CuboidCollider args={[0.35, 0.25, 0.35]} position={[0, 0.25, 0]} />
      </RigidBody>
      <Float speed={1} floatIntensity={0.2} rotationIntensity={0.2} position={[0, 1.2, 0]}>
        <mesh
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          onClick={(e) => {
            e.stopPropagation()
            window.open(url, '_blank', 'noopener,noreferrer')
          }}
        >
          {/* Invisible but sizeable hit area for reliable hover/click */}
          <sphereGeometry args={[1.05, 16, 16]} />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>
        <mesh ref={ringMeshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.38, 0]}>
          <ringGeometry args={[0.9, 1.35, performanceTier === 'low' ? 16 : 44]} />
          <meshBasicMaterial
            ref={ringMatRef}
            color={color}
            transparent
            opacity={0.35}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        {modelUrl && (
          <Suspense fallback={null}>
            <ModelErrorBoundary fallback={null}>
              <group ref={modelGroupRef}>
                <CdnAnimatedModel
                  url={modelUrl}
                  position={modelPosition}
                  rotation={modelRotation}
                  scale={1}
                  playAnimation={modelAnimated && nearby}
                  renderStyle={renderStyle}
                />
              </group>
            </ModelErrorBoundary>
          </Suspense>
        )}
      </Float>
      <Html
        position={[0, 1.95, 0]}
        center
        distanceFactor={18}
        style={{
          transition: 'all 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
          opacity: nearby ? 1 : 0,
          transform: `scale(${hovered && nearby ? 1.08 : nearby ? 1 : 0.82}) translateY(${nearby ? 0 : 16}px)`,
          pointerEvents: 'none',
        }}
      >
        <div className="px-3 py-1 rounded-full text-[9px] uppercase tracking-[0.2em] font-mono bg-black/80 text-white border border-white/15">
          {label}
        </div>
      </Html>
    </group>
  )
}

function ScenePlacedModel({
  item,
  renderStyle = 'pbr',
  performanceTier = 'high',
}: {
  item: ScenePlacedModelConfig
  renderStyle?: 'pbr' | 'cel'
  performanceTier?: PerformanceTier
}) {
  const groupRef = useRef<THREE.Group>(null)
  const ringMatRef = useRef<THREE.MeshBasicMaterial>(null)
  const ringMeshRef = useRef<THREE.Mesh>(null)
  const pulseOffset = useMemo(() => Math.random() * Math.PI * 2, [])
  const frameSkip = useRef(0)

  const position = Array.isArray(item.position) && item.position.length === 3 ? item.position : [0, 0, 0]
  const rotation = Array.isArray(item.rotation) && item.rotation.length === 3 ? item.rotation : [0, 0, 0]
  const scale = typeof item.scale === 'number' ? item.scale : 1
  const ringColor = toHexColor(item.glowRingColor, '#38bdf8')
  const ringIntensity = typeof item.glowRingIntensity === 'number' ? item.glowRingIntensity : 2
  const rotateX = typeof item.autoRotateSpeedX === 'number' ? item.autoRotateSpeedX : 0
  const rotateY = typeof item.autoRotateSpeedY === 'number' ? item.autoRotateSpeedY : 0.4
  const rotateZ = typeof item.autoRotateSpeedZ === 'number' ? item.autoRotateSpeedZ : 0

  useFrame((state, delta) => {
    if (performanceTier === 'low') {
      frameSkip.current++
      if (frameSkip.current % 4 !== 0) return
    }
    if (groupRef.current && item.autoRotate) {
      groupRef.current.rotation.x += rotateX * delta
      groupRef.current.rotation.y += rotateY * delta
      groupRef.current.rotation.z += rotateZ * delta
    }

    if (item.glowRing && ringMatRef.current && ringMeshRef.current) {
      const pulse = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 2.4 + pulseOffset)
      ringMatRef.current.opacity = (0.12 + pulse * 0.28) * Math.min(3, Math.max(0.2, ringIntensity))
      const s = 1 + pulse * 0.08
      ringMeshRef.current.scale.set(s, s, 1)
    }
  })

  const resolvedUrl = item.modelFileUrl || item.modelUrl
  if (!resolvedUrl) return null

  return (
    <group position={position as [number, number, number]}>
      {item.glowRing && (
        <mesh ref={ringMeshRef} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 1.2, 48]} />
          <meshBasicMaterial
            ref={ringMatRef}
            color={ringColor}
            transparent
            opacity={0.2}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      <Suspense fallback={null}>
        <ModelErrorBoundary fallback={null}>
          <group ref={groupRef} rotation={rotation as [number, number, number]}>
            <CdnAnimatedModel
              url={resolvedUrl}
              position={[0, 0, 0]}
              scale={scale}
              playAnimation={typeof item.playAnimation === 'boolean' ? item.playAnimation : true}
              doubleSided={typeof item.doubleSidedMaterials === 'boolean' ? item.doubleSidedMaterials : true}
              clipName={typeof item.animationClip === 'string' ? item.animationClip : undefined}
              forceOpaque={!(typeof item.allowTransparency === 'boolean' ? item.allowTransparency : false)}
              renderStyle={renderStyle}
            />
          </group>
        </ModelErrorBoundary>
      </Suspense>
    </group>
  )
}

const World = ({ performanceTier = 'high' }: { performanceTier?: PerformanceTier }) => {
  const setFocusedSection = useAppStore((state) => state.setFocusedSection)
  const setFocusedStatueMetadata = useAppStore((state) => state.setFocusedStatueMetadata)
  const addExploredStatue = useAppStore((state) => state.addExploredStatue)
  const exploredStatueNames = useAppStore((state) => state.exploredStatueNames)
  const setTotalStatueCount = useAppStore((state) => state.setTotalStatueCount)
  const setPendingAchievement = useAppStore((state) => state.setPendingAchievement)
  const extremeFpsMode = useAppStore((state) => state.extremeFpsMode)
  const { data, loading } = usePortfolioData()
  const renderStyle = (data?.scene?.renderStyle === 'pbr' ? 'pbr' : 'cel') as 'pbr' | 'cel'
  const sectionRadius = typeof data?.scene?.sectionRadius === 'number' ? data.scene.sectionRadius : 52

  const sections = useMemo(
    () => resolveSections(data, sectionRadius),
    [data, sectionRadius]
  )

  const linkRelics = useMemo(
    () => resolveLinkRelics(data, sectionRadius),
    [data, sectionRadius]
  )

  const totalDiscoverables = sections.length + linkRelics.length

  useEffect(() => {
    setTotalStatueCount(totalDiscoverables)
  }, [totalDiscoverables, setTotalStatueCount])

  const handleStatueDiscovery = (name: string) => {
    const wasNew = !exploredStatueNames.includes(name)
    addExploredStatue(name)
    if (wasNew) {
      const newCount = exploredStatueNames.length + 1
      if (newCount >= totalDiscoverables) {
        setPendingAchievement({ message: 'Master Explorer', subtext: 'All statues and links discovered!', isBig: true })
      } else {
        setPendingAchievement({ message: `Discovered: ${name}`, subtext: `${newCount}/${totalDiscoverables} discovered`, isBig: false })
      }
    }
  }

  const handleStatueClick = (section: { name: string; archetype: string; color: string }) => {
    const name = section.name
    setFocusedSection(name)
    setFocusedStatueMetadata({ name, type: section.archetype, color: section.color })
    handleStatueDiscovery(name)
  }

  const linkPathCenterZ = sectionRadius - 16
  const linkPathLength = sectionRadius + 32
  const linkPedestalZ = sectionRadius + 24
  const sceneModels = Array.isArray(data?.scene?.sceneModels) ? data.scene.sceneModels : []

  if (loading && !data) return null

  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight position={[0, 20, 0]} intensity={2} color="#3b82f6" />
      <directionalLight 
        position={[25, 50, 25]} 
        intensity={1}
        castShadow={performanceTier === 'high'}
        shadow-mapSize={performanceTier === 'low' ? [256, 256] : [512, 512]}
      />
      
      <StylizedSky performanceTier={performanceTier} />
      <Environment preset={(data?.scene?.environmentMap || 'night') as any} background={false} />
      
      {/* Dark Base Ground - Lowered to prevent Z-fighting */}
      <RigidBody type="fixed" colliders={false} position={[0, -0.1, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow={performanceTier === 'high'}>
          <circleGeometry args={[150, performanceTier === 'low' ? 24 : 64]} />
          <meshStandardMaterial color="#05070a" roughness={1} />
        </mesh>
        <CuboidCollider args={[150, 0.05, 150]} position={[0, -0.05, 0]} />
      </RigidBody>

      {performanceTier === 'high' && (
        <Grid
          infiniteGrid
          fadeDistance={130}
          fadeStrength={10}
          cellSize={1}
          sectionSize={10}
          sectionThickness={1}
          sectionColor="#1e293b"
          cellColor="#0f172a"
          position={[0, 0.01, 0]}
        />
      )}

      {/* Roads and Sectors */}
      {sections.map((section: any) => {
        const start = new THREE.Vector3(0, 0, 0)
        const end = new THREE.Vector3(...section.position)
        const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
        const length = start.distanceTo(end)
        const angle = Math.atan2(end.x - start.x, end.z - start.z)

        return (
          <group key={section.name}>
            {/* Road / Path - Elevated slightly above ground */}
            <RigidBody type="fixed" colliders={false} position={[midpoint.x, 0.02, midpoint.z]} rotation={[0, angle, 0]}>
              <mesh receiveShadow>
                <boxGeometry args={[4.5, 0.05, length]} />
                <meshStandardMaterial color="#0d1117" roughness={0.9} />
              </mesh>
              
              {/* Colored Line - Elevated above road */}
              <mesh position={[0, 0.026, 0]}>
                <boxGeometry args={[0.1, 0.001, length]} />
                <meshStandardMaterial color={section.color} emissive={section.color} emissiveIntensity={4} />
              </mesh>
            </RigidBody>

            {/* Platform - Elevated circular base */}
            <group position={section.position}>
               <RigidBody type="fixed" colliders={false} position={[0, 0.05, 0]}>
                 <mesh receiveShadow castShadow>
                    <cylinderGeometry args={[5.5, 5.5, 0.1, 64]} />
                    <meshStandardMaterial color="#0d1117" roughness={1} />
                 </mesh>
                 
                 {/* Glowing Ring */}
                 <mesh position={[0, 0.051, 0]} rotation={[-Math.PI/2, 0, 0]}>
                    <ringGeometry args={[4.3, 4.6, performanceTier === 'low' ? 24 : 64]} />
                    <meshStandardMaterial
                      color={section.color}
                      emissive={section.color}
                      emissiveIntensity={section.statueGlowIntensity}
                      transparent
                      opacity={0.8}
                    />
                 </mesh>
               </RigidBody>

               <Statue 
                name={section.name} 
                position={[0, 2.0, 0]} 
                renderStyle={renderStyle}
                type={section.archetype}
                color={section.color}
                data={data}
                modelUrl={section.statueModelUrl}
                modelScale={section.statueModelScale}
                modelRotation={section.statueModelRotation}
                modelPosition={section.statueModelPosition}
                modelAnimated={section.statueModelAnimated}
                animationClip={section.statueAnimationClip}
                allowTransparency={section.statueAllowTransparency}
                spinSpeed={section.statueSpinSpeed}
                floatAmount={section.statueFloatAmount}
                floatSpeed={section.statueFloatSpeed}
                interactionDistance={section.statueInteractionDistance}
                performanceTier={performanceTier}
                onClick={() => handleStatueClick(section)}
                onNearby={() => handleStatueDiscovery(section.name)}
              />
            </group>
          </group>
        )
      })}

      {/* Dedicated link plaza path + platform - always visible */}
      <RigidBody type="fixed" colliders={false} position={[0, 0.02, linkPathCenterZ]} rotation={[0, 0, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[4.5, 0.05, linkPathLength]} />
          <meshStandardMaterial color="#0d1117" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.026, 0]}>
          <boxGeometry args={[0.1, 0.001, linkPathLength]} />
          <meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={4} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders={false} position={[0, 0.05, linkPedestalZ]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[28, 0.1, 14]} />
          <meshStandardMaterial color="#0d1117" roughness={1} />
        </mesh>
      </RigidBody>

      {/* Tiny interactive link relics - always visible */}
      {linkRelics.map((item: LinkRelicConfig) => (
        <LinkRelic
          key={item.id}
          label={item.label}
          color={item.color}
          url={item.url}
          position={item.position}
          renderStyle={renderStyle}
          modelUrl={item.modelUrl}
          modelScale={item.modelScale}
          modelPosition={item.modelPosition}
          modelRotation={item.modelRotation}
          modelAnimated={item.modelAnimated}
          spinSpeed={item.spinSpeed}
          floatAmount={item.floatAmount}
          floatSpeed={item.floatSpeed}
          glowIntensity={item.glowIntensity}
          totalDiscoverables={totalDiscoverables}
          performanceTier={performanceTier}
        />
      ))}

      {/* Custom scene models - decorative only, hidden in extreme mode */}
      {!extremeFpsMode && sceneModels.map((item: ScenePlacedModelConfig, idx: number) => (
        <ScenePlacedModel key={`${item.name || 'scene-model'}-${idx}`} item={item} renderStyle={renderStyle} performanceTier={performanceTier} />
      ))}

      {/* Intentionally uncluttered level: only paths, section statues, and link statues */}

    </>
  )
}

export default World
