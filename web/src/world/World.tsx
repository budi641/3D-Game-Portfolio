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

type DefaultSection = {
  name: string
  pos: [number, number, number]
  color: string
  archetype: 'projects' | 'education' | 'work' | 'skills' | 'contact' | 'about' | 'blog'
  modelUrl: string
  modelScale: number
  modelRotationY?: number
  modelAnimated?: boolean
}

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

function toHexColor(value: any, fallback: string) {
  if (typeof value === 'string' && value.trim()) return value
  if (value && typeof value === 'object' && typeof value.hex === 'string' && value.hex.trim()) return value.hex
  return fallback
}

const DEFAULT_SECTIONS: DefaultSection[] = [
  { name: 'Projects', pos: [0, 0, -48], color: '#3b82f6', archetype: 'projects', modelUrl: '/Models/Projects.glb', modelScale: 1, modelRotationY: 0, modelAnimated: false },
  { name: 'Education', pos: [34, 0, -34], color: '#22c55e', archetype: 'education', modelUrl: '/Models/education.glb', modelScale: 1, modelRotationY: 0, modelAnimated: false },
  { name: 'Work', pos: [-34, 0, -34], color: '#ef4444', archetype: 'work', modelUrl: '/Models/Work.glb', modelScale: 1, modelRotationY: 0, modelAnimated: false },
  { name: 'Skills', pos: [48, 0, 0], color: '#f59e0b', archetype: 'skills', modelUrl: '/Models/skill.glb', modelScale: 1, modelRotationY: 0, modelAnimated: false },
  { name: 'Contact', pos: [-48, 0, 0], color: '#8b5cf6', archetype: 'contact', modelUrl: '/Models/Contact.glb', modelScale: 1, modelRotationY: 0, modelAnimated: false },
  { name: 'About', pos: [34, 0, 34], color: '#06b6d4', archetype: 'about', modelUrl: '/Models/About me.glb', modelScale: 1, modelRotationY: 0, modelAnimated: false },
  { name: 'Blog', pos: [-34, 0, 34], color: '#f97316', archetype: 'blog', modelUrl: '/Models/Blog.glb', modelScale: 1, modelRotationY: 0, modelAnimated: false },
]

const LINK_RELICS: LinkRelicConfig[] = [
  { id: 'github', label: 'GitHub', url: 'https://github.com', position: [-12, 0, 74], color: '#f8fafc', modelUrl: '/Models/github.glb', modelScale: 1.2, modelRotation: [0, 0.2, 0], modelAnimated: true, spinSpeed: 1.1, floatAmount: 0.22, floatSpeed: 1.8, glowIntensity: 2.2 },
  { id: 'linkedin', label: 'LinkedIn', url: 'https://linkedin.com', position: [0, 0, 78], color: '#0ea5e9', modelUrl: '/Models/Linked In.glb', modelScale: 2.8, modelRotation: [0, 0.1, 0], modelAnimated: true, spinSpeed: 1.1, floatAmount: 0.22, floatSpeed: 1.8, glowIntensity: 2.2 },
  { id: 'resume', label: 'Resume', url: '/resume', position: [12, 0, 74], color: '#ef4444', modelUrl: '/Models/Resume.glb', modelScale: 1.8, modelRotation: [0, -0.2, 0], modelAnimated: true, spinSpeed: 1.1, floatAmount: 0.22, floatSpeed: 1.8, glowIntensity: 2.2 },
]

function circularPoint(index: number, total: number, radius: number, startAngle = -Math.PI / 2): [number, number, number] {
  const angle = startAngle + (index / Math.max(total, 1)) * Math.PI * 2
  return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius]
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '-')
}

function mapLegacyTypeToArchetype(value: string | undefined): DefaultSection['archetype'] | null {
  if (!value) return null
  const t = value.toLowerCase()
  if (t === 'gear') return 'projects'
  if (t === 'pillar') return 'work'
  if (t === 'core') return 'skills'
  if (t === 'utility') return 'contact'
  if (t === 'hero') return 'about'
  return null
}

function StylizedSky({ performanceTier }: { performanceTier: PerformanceTier }) {
  const [skyTexture, setSkyTexture] = useState<THREE.Texture | null>(null)

  const createFallbackSkyTexture = useMemo(() => () => {
    const low = performanceTier === 'low'
    const canvas = document.createElement('canvas')
    canvas.width = low ? 1024 : 2048
    canvas.height = low ? 512 : 1024
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const w = canvas.width
    const h = canvas.height

    const bg = ctx.createLinearGradient(0, 0, 0, h)
    bg.addColorStop(0, '#2b4f8d')
    bg.addColorStop(0.45, '#5f8bc0')
    bg.addColorStop(0.8, '#9dc5ee')
    bg.addColorStop(1, '#bfdcf7')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)

    const sunX = w * 0.73
    const sunY = h * 0.26
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, 170)
    sunGlow.addColorStop(0, 'rgba(255,245,205,1)')
    sunGlow.addColorStop(0.25, 'rgba(255,232,166,0.9)')
    sunGlow.addColorStop(0.65, 'rgba(255,220,150,0.35)')
    sunGlow.addColorStop(1, 'rgba(255,220,150,0)')
    ctx.fillStyle = sunGlow
    ctx.beginPath()
    ctx.arc(sunX, sunY, 170, 0, Math.PI * 2)
    ctx.fill()

    const drawCloud = (x: number, y: number, size: number, alpha: number) => {
      const cloud = ctx.createRadialGradient(x, y, size * 0.2, x, y, size)
      cloud.addColorStop(0, `rgba(255,255,255,${alpha})`)
      cloud.addColorStop(0.6, `rgba(245,250,255,${alpha * 0.55})`)
      cloud.addColorStop(1, 'rgba(245,250,255,0)')
      ctx.fillStyle = cloud
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }

    // Static painted cloud clusters.
    drawCloud(w * 0.2, h * 0.32, 120, 0.45)
    drawCloud(w * 0.26, h * 0.35, 92, 0.4)
    drawCloud(w * 0.33, h * 0.3, 110, 0.34)
    drawCloud(w * 0.55, h * 0.24, 86, 0.32)
    drawCloud(w * 0.6, h * 0.28, 116, 0.4)
    drawCloud(w * 0.68, h * 0.38, 132, 0.42)
    drawCloud(w * 0.78, h * 0.34, 88, 0.3)
    drawCloud(w * 0.9, h * 0.3, 105, 0.36)

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

  const segments = performanceTier === 'low' ? 16 : 64
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
}) {
  const relicRef = useRef<THREE.Group>(null)
  const frameSkip = useRef(0)
  const modelGroupRef = useRef<THREE.Group>(null)
  const baseMatRef = useRef<THREE.MeshStandardMaterial>(null)
  const ringMatRef = useRef<THREE.MeshBasicMaterial>(null)
  const ringMeshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const [nearby, setNearby] = useState(false)
  const nearbyRef = useRef(false)
  const nearAmountRef = useRef(0)
  const hoverAmountRef = useRef(0)
  const relicWorldPos = useMemo(() => new THREE.Vector3(), [])
  const toPlayerRef = useMemo(() => new THREE.Vector3(), [])
  const targetScaleRef = useMemo(() => new THREE.Vector3(1, 1, 1), [])
  const interactionDistance = 14
  const transitionDistance = 20

  useFrame((state, delta) => {
    if (performanceTier === 'low') {
      frameSkip.current++
      if (frameSkip.current % 3 !== 0) return
    }
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
      }

      // Smooth near factor in [0..1] between transitionDistance -> interactionDistance.
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
      // State 1 (idle): slight hover/rotation. State 2 (near): faster/livelier movement.
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

      const targetScale = 1 + nearFactor * 0.255 + hoverAmountRef.current * 0.085
      targetScaleRef.set(targetScale, targetScale, targetScale)
      const alpha = 1 - Math.exp(-10 * delta)
      modelGroupRef.current.scale.lerp(targetScaleRef, alpha)
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
          <ringGeometry args={[0.9, 1.35, performanceTier === 'low' ? 24 : 44]} />
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
              <group ref={(node) => { modelGroupRef.current = node }}>
                <CdnAnimatedModel
                  url={modelUrl}
                  position={modelPosition}
                  rotation={modelRotation}
                  scale={modelScale}
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
      if (frameSkip.current % 3 !== 0) return
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
  const addExploredStatue = useAppStore((state) => state.addExploredStatue)
  const exploredStatueNames = useAppStore((state) => state.exploredStatueNames)
  const setTotalStatueCount = useAppStore((state) => state.setTotalStatueCount)
  const setPendingAchievement = useAppStore((state) => state.setPendingAchievement)
  const { data, loading } = usePortfolioData()
  const renderStyle = (data?.scene?.renderStyle === 'pbr' ? 'pbr' : 'cel') as 'pbr' | 'cel'
  const sectionRadius = typeof data?.scene?.sectionRadius === 'number' ? data.scene.sectionRadius : 52

  const sections = useMemo(() => {
    const sceneSections = Array.isArray(data?.scene?.sectionStatues) && data.scene.sectionStatues.length > 0
      ? data.scene.sectionStatues
      : null
    const list = sceneSections || (data?.sections?.length > 0 ? data.sections : DEFAULT_SECTIONS)
    const orderedList = [...list].sort((a: any, b: any) => {
      const ao = typeof a?.order === 'number' ? a.order : 9999
      const bo = typeof b?.order === 'number' ? b.order : 9999
      return ao - bo
    })
    const sectionRelics = data?.scene?.sectionRelics || {}
    return orderedList.map((s: any, i: number) => {
      const section = DEFAULT_SECTIONS[i % DEFAULT_SECTIONS.length]
      const idKey = normalizeKey((s.id || s.archetype || section.archetype || '').toString())
      const fixedRelic = sectionRelics[idKey] || null
      const name = fixedRelic?.label || s.label || s.name || s.title || section.name
      const key = normalizeKey(name)
      const matched = DEFAULT_SECTIONS.find((d) => normalizeKey(d.name) === key) || section
      const explicitArchetype = (s.archetype as DefaultSection['archetype'] | undefined) || mapLegacyTypeToArchetype(s.type)
      const modelRotation =
        Array.isArray(s.statueModelRotation) && s.statueModelRotation.length === 3
          ? [s.statueModelRotation[0], s.statueModelRotation[1], s.statueModelRotation[2]]
          : [0, typeof s.statueModelRotationY === 'number' ? s.statueModelRotationY : (matched.modelRotationY || 0), 0]
      const modelPosition =
        Array.isArray(fixedRelic?.modelPosition) && fixedRelic.modelPosition.length === 3
          ? [fixedRelic.modelPosition[0], fixedRelic.modelPosition[1], fixedRelic.modelPosition[2]]
          :
        Array.isArray(s.modelPosition) && s.modelPosition.length === 3
          ? [s.modelPosition[0], s.modelPosition[1], s.modelPosition[2]]
          :
        Array.isArray(s.statueModelPosition) && s.statueModelPosition.length === 3
          ? [s.statueModelPosition[0], s.statueModelPosition[1], s.statueModelPosition[2]]
          : [0, 0.35, 0]
      return {
        ...s,
        name,
        position: circularPoint(i, list.length, sectionRadius),
        color: toHexColor(fixedRelic?.color || s.color, matched.color),
        archetype: explicitArchetype || matched.archetype,
        statueModelUrl: s.statueModelUrl || s.modelUrl || matched.modelUrl,
        statueModelScale:
          typeof s.statueModelScale === 'number'
            ? s.statueModelScale
            : (typeof fixedRelic?.modelScale === 'number'
              ? fixedRelic.modelScale
              : (typeof s.modelScale === 'number' ? s.modelScale : matched.modelScale)),
        statueModelRotation: modelRotation as [number, number, number],
        statueModelPosition: modelPosition as [number, number, number],
        statueModelAnimated: typeof s.statueModelAnimated === 'boolean' ? s.statueModelAnimated : false,
        statueAnimationClip: typeof s.statueAnimationClip === 'string' ? s.statueAnimationClip : undefined,
        statueAllowTransparency: typeof s.statueAllowTransparency === 'boolean' ? s.statueAllowTransparency : false,
        statueSpinSpeed: typeof s.statueSpinSpeed === 'number' ? s.statueSpinSpeed : 0.35,
        statueFloatAmount: typeof s.statueFloatAmount === 'number' ? s.statueFloatAmount : 0.06,
        statueFloatSpeed: typeof s.statueFloatSpeed === 'number' ? s.statueFloatSpeed : 1.8,
        statueInteractionDistance: typeof s.statueInteractionDistance === 'number' ? s.statueInteractionDistance : 12,
        statueGlowIntensity: typeof s.statueGlowIntensity === 'number' ? s.statueGlowIntensity : 8,
      }
    })
  }, [data?.sections, data?.scene?.sectionStatues, data?.scene?.sectionRelics, sectionRadius])

  const linkRelics = useMemo(() => {
    const rel = data?.scene?.linkRelics || {}
    const radiusDelta = sectionRadius - 52
    return LINK_RELICS.map((base) => {
      const match = rel[base.id] || (base.id === 'resume' ? rel.itch : null) || null
      const shiftedPosition: [number, number, number] = [base.position[0], base.position[1], base.position[2] + radiusDelta]
      if (!match) return { ...base, position: shiftedPosition }
      const modelPos = Array.isArray(match.modelPosition) && match.modelPosition.length === 3
        ? [match.modelPosition[0], match.modelPosition[1], match.modelPosition[2]]
        : base.modelPosition
      return {
        ...base,
        position: shiftedPosition,
        label: match.label || base.label,
        url: match.url || base.url,
        color: toHexColor(match.color, base.color),
        modelScale: typeof match.modelScale === 'number' ? match.modelScale : base.modelScale,
        modelPosition: modelPos as [number, number, number] | undefined,
      }
    })
  }, [data?.scene?.linkRelics, sectionRadius])

  useEffect(() => {
    setTotalStatueCount(sections.length)
  }, [sections.length, setTotalStatueCount])

  const handleStatueClick = (name: string) => {
    setFocusedSection(name)
    const wasNew = !exploredStatueNames.includes(name)
    addExploredStatue(name)
    if (wasNew) {
      const newCount = exploredStatueNames.length + 1
      const total = sections.length
      if (newCount >= total) {
        setPendingAchievement({ message: 'Master Explorer', subtext: 'All statues discovered!', isBig: true })
      } else {
        setPendingAchievement({ message: `Discovered: ${name}`, subtext: `${newCount}/${total} statues`, isBig: false })
      }
    }
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
          <circleGeometry args={[150, performanceTier === 'low' ? 32 : 64]} />
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

            {/* Platform - Elevated start at surface */}
            <group position={section.position}>
               <RigidBody type="fixed" colliders={false} position={[0, 0.05, 0]}>
                 <mesh receiveShadow castShadow>
                    <boxGeometry args={[10, 0.1, 10]} />
                    <meshStandardMaterial color="#0d1117" roughness={1} />
                 </mesh>
                 
                 {/* Glowing Ring */}
                 <mesh position={[0, 0.051, 0]} rotation={[-Math.PI/2, 0, 0]}>
                    <ringGeometry args={[4.3, 4.6, performanceTier === 'low' ? 32 : 64]} />
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
                onClick={() => handleStatueClick(section.name)}
              />
            </group>
          </group>
        )
      })}

      {/* Dedicated link plaza path + platform */}
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

      {/* Tiny interactive link relics */}
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
          performanceTier={performanceTier}
        />
      ))}

      {sceneModels.map((item: ScenePlacedModelConfig, idx: number) => (
        <ScenePlacedModel key={`${item.name || 'scene-model'}-${idx}`} item={item} renderStyle={renderStyle} performanceTier={performanceTier} />
      ))}

      {/* Intentionally uncluttered level: only paths, section statues, and link statues */}

    </>
  )
}

export default World
