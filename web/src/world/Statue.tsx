import { Suspense, useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '../store/appStore'
import { X } from 'lucide-react'
import CdnAnimatedModel from './CdnAnimatedModel'
import ModelErrorBoundary from '../components/system/ModelErrorBoundary'
import { urlFor } from '../lib/sanity'

function hexToRgba(hex: string, alpha: number) {
  const safe = (hex || '').trim().replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(safe)) return `rgba(14,23,42,${alpha})`
  const r = parseInt(safe.slice(0, 2), 16)
  const g = parseInt(safe.slice(2, 4), 16)
  const b = parseInt(safe.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function imageUrl(source: any, width = 800, height = 450) {
  if (!source) return null
  try {
    return urlFor(source).width(width).height(height).fit('crop').auto('format').url()
  } catch {
    return null
  }
}

function experienceImage(exp: any, data: any) {
  return exp?.logo || exp?.image || exp?.mainImage || exp?.companyImage || data?.projects?.[0]?.mainImage || null
}

interface StatueProps {
  position: [number, number, number]
  name: string
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
  onClick: () => void
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
  type = 'projects',
  color = "#60a5fa",
  data,
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
  onClick,
}: StatueProps) => {
  const [hovered, setHovered] = useState(false)
  const [nearby, setNearby] = useState(false)
  const groupRef = useRef<THREE.Group>(null)
  const coreRef = useRef<THREE.Group>(null)
  const nearbyRef = useRef(false)
  const nearAmountRef = useRef(0)
  const worldPosRef = useRef(new THREE.Vector3())
  const targetScaleRef = useRef(new THREE.Vector3(1, 1, 1))

  const focusedSection = useAppStore((state) => state.focusedSection)
  const isFocused = focusedSection === name

  // Helper to render section-specific content
  const renderExplorerContent = () => {
    if (!data) return <div className="text-white/40 font-mono text-[10px] uppercase animate-pulse">Synchronizing_Datastream...</div>

    switch (type) {
      case 'projects':
        return (
          <div className="space-y-4">
            {(data.projects || []).map((p: any) => (
              <div key={p._id} className="p-5 ui-context-card group">
                <div className="mb-4 h-36 rounded-xl overflow-hidden border border-white/10 bg-black/40 relative">
                  {imageUrl(p.mainImage, 640, 360) ? (
                    <img
                      src={imageUrl(p.mainImage, 640, 360)!}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-white/35 tracking-[0.25em]">
                      NO_PREVIEW
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/70 to-transparent" />
                </div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-white text-base">{p.title}</h3>
                  <div className="px-2 py-0.5 bg-white/10 rounded text-[9px] font-mono text-white/50">{p.year || '2024'}</div>
                </div>
                <p className="text-xs text-white/50 line-clamp-2 mb-3 leading-relaxed">{p.description}</p>
                <div className="flex gap-2 flex-wrap">
                  {(p.technologies || []).slice(0, 3).map((t: string) => (
                    <span key={t} className="text-[9px] font-mono opacity-40 px-2 py-0.5 border border-white/10 rounded" style={{ color }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )

      case 'skills':
        const categories = [...new Set((data.skills || []).map((s: any) => s.category))]
        return (
          <div className="space-y-6">
            {categories.map((cat: any) => (
              <div key={cat as string} className="space-y-3">
                <h3 className="text-[10px] font-mono tracking-[0.3em] uppercase opacity-40" style={{ color }}>{cat as string}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {(data.skills || []).filter((s: any) => s.category === cat).map((s: any) => (
                    <div key={s._id} className="p-3 ui-context-card flex items-center justify-between">
                      <span className="text-xs font-medium text-white/80">{s.title}</span>
                      <div className="w-10 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full" style={{ width: `${s.level}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )

      case 'work':
        return (
          <div className="space-y-5">
            {(data.experience || []).map((exp: any) => (
              <div key={exp._id} className="relative p-4 ui-context-card">
                <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
                <div className="absolute -inset-px opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: `0 0 35px ${hexToRgba(color, 0.2)}` }} />
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-xl border border-white/10 bg-black/40 overflow-hidden shrink-0">
                    {imageUrl(experienceImage(exp, data), 160, 160) ? (
                      <img src={imageUrl(experienceImage(exp, data), 160, 160)!} alt={exp.company || 'Company visual'} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] font-mono text-white/35">LOGO</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] font-mono text-white/40 mb-1">{exp.period}</div>
                    <h3 className="font-black text-white leading-tight text-sm uppercase tracking-wide">{exp.role}</h3>
                    <div className="text-xs text-white/50 mb-2">{exp.company}</div>
                    <p className="text-[11px] text-white/35 line-clamp-4 leading-relaxed">{exp.description}</p>
                    {Array.isArray(exp.skills) && exp.skills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {exp.skills.slice(0, 5).map((s: string) => (
                          <span key={s} className="text-[9px] px-2 py-1 rounded border border-white/10 text-white/60 bg-black/30">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )

      case 'about':
        return (
          <div className="space-y-6">
            <div className="aspect-video ui-context-card flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="text-[9px] font-mono text-white/20 tracking-[0.5em] animate-pulse">ESTABLISHING_LINK...</div>
            </div>
            <div className="p-6 ui-context-card shadow-inner">
              <p className="text-white/60 text-xs leading-relaxed italic">
                "Specializing in high-fidelity 3D interaction, engine-level optimization, and technical production. Crafting digital worlds where physics meets emotion."
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 ui-context-card">
                <div className="text-[8px] font-mono opacity-20 uppercase mb-1 tracking-widest">Availability</div>
                <div className="text-[10px] font-bold text-white uppercase tabular-nums">Q2_2024_ACTIVE</div>
              </div>
              <div className="p-4 ui-context-card">
                <div className="text-[8px] font-mono opacity-20 uppercase mb-1 tracking-widest">Protocol</div>
                <div className="text-[10px] font-bold text-white uppercase tracking-tighter">DIRECT_LINK_V5</div>
              </div>
            </div>
          </div>
        )

      case 'education':
        return (
          <div className="space-y-5">
            {(data.education || []).map((edu: any) => (
              <div key={edu._id} className="p-4 ui-context-card">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-lg border border-white/10 bg-black/40 overflow-hidden shrink-0">
                    {imageUrl(edu.logo, 120, 120) ? (
                      <img src={imageUrl(edu.logo, 120, 120)!} alt={edu.institution || 'Institution logo'} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] font-mono text-white/35">EDU</div>
                    )}
                  </div>
                  <div>
                    <div className="text-[9px] font-mono opacity-40 uppercase mb-1">{edu.period || 'Academic'}</div>
                    <h3 className="text-sm font-bold text-white">{edu.degree}</h3>
                    <div className="text-xs text-white/60 mt-1">{edu.institution}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )

      case 'contact':
        return (
          <div className="space-y-4">
            <div className="p-5 ui-context-card">
              <div className="text-[9px] font-mono uppercase opacity-40 mb-2">Direct Channel</div>
              <p className="text-sm text-white/70">
                Use the mini statues in the world to jump to GitHub, LinkedIn, and Itch.io.
              </p>
            </div>
            <div className="p-5 ui-context-card">
              <div className="text-[9px] font-mono uppercase opacity-40 mb-2">Collaboration</div>
              <p className="text-xs text-white/50">Open to gameplay systems, tools, and technical art projects.</p>
            </div>
          </div>
        )

      case 'blog':
        return (
          <div className="space-y-4">
            {(data.blog || []).slice(0, 6).map((post: any) => (
              <div key={post._id} className="p-4 ui-context-card">
                <h3 className="text-sm font-bold text-white">{post.title}</h3>
                <div className="text-[10px] text-white/40 mt-1 font-mono">{post.publishedAt || 'Draft'}</div>
              </div>
            ))}
            {!data.blog?.length && (
              <div className="p-4 ui-context-card text-xs text-white/50">
                No blog entries synced yet.
              </div>
            )}
          </div>
        )

      default:
        return (
          <div className="p-12 bg-black/40 border border-white/5 border-dashed rounded-3xl flex flex-col items-center justify-center text-center">
            <div className="text-[9px] font-mono opacity-10 mb-6 animate-pulse uppercase tracking-[0.8em]">Encrypted_Sector</div>
            <div className="w-12 h-px bg-white/10 mb-4" />
            <p className="text-[10px] text-white/20 font-mono break-all max-w-[200px]">0x71C94B2510...F8E2</p>
          </div>
        )
    }
  }

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
            scale={modelScale ?? modelConfig.scale}
            playAnimation={modelAnimated ?? false}
            clipName={animationClip}
            forceOpaque={!allowTransparency}
          />
        </ModelErrorBoundary>
      </Suspense>
    )
  }, [type, modelUrl, modelScale, modelRotation, modelPosition, modelAnimated, animationClip, allowTransparency])

  useFrame((state, delta) => {
    const player = state.scene.getObjectByName('player')
    if (player && groupRef.current) {
      groupRef.current.getWorldPosition(worldPosRef.current)
      const dist = worldPosRef.current.distanceTo(player.position)
      const isNowNearby = dist < interactionDistance
      if (isNowNearby !== nearbyRef.current) {
        nearbyRef.current = isNowNearby
        setNearby(isNowNearby)
      }

      const nearTarget = isNowNearby ? 1 : 0
      nearAmountRef.current = THREE.MathUtils.damp(nearAmountRef.current, nearTarget, 8, delta)
    }

    if (groupRef.current) {
      const targetScale = 1 + nearAmountRef.current * 0.3
      targetScaleRef.current.set(targetScale, targetScale, targetScale)
      groupRef.current.scale.lerp(targetScaleRef.current, 0.1)
    }

    if (coreRef.current) {
      // Clamp CMS values to keep custom GLBs stable.
      const baseSpin = THREE.MathUtils.clamp(spinSpeed ?? 0.35, 0, 1.2)
      const baseFloatSpeed = THREE.MathUtils.clamp(floatSpeed ?? 1.8, 0.2, 2.6)
      const baseFloatAmount = THREE.MathUtils.clamp(floatAmount ?? 0.06, 0, 0.18)
      const activeSpin = baseSpin * (0.45 + nearAmountRef.current * 0.55)
      const activeFloatSpeed = baseFloatSpeed * (0.55 + nearAmountRef.current * 0.45)
      const activeFloatAmount = baseFloatAmount * (0.45 + nearAmountRef.current * 0.55)
      coreRef.current.rotation.y += activeSpin * delta
      coreRef.current.position.y = Math.sin(state.clock.elapsedTime * activeFloatSpeed) * activeFloatAmount
    }
  })

  return (
    <group position={position} name={`statue-${name}`}>
      <group
        ref={groupRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={onClick}
      >
        {/* Primary symbolic form */}
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
            transform: `scale(${nearby ? 1 : 0.85}) translateY(${nearby ? 0 : 20}px)`,
            pointerEvents: 'none'
          }}
        >
          <div className="relative group">
            <div
              className="px-6 py-2 bg-black/95 backdrop-blur-3xl border-l-[3px] shadow-[0_0_40px_rgba(0,0,0,0.6)] flex flex-col items-center"
              style={{ borderColor: color }}
            >
              <div className="text-[8px] font-mono tracking-[0.6em] opacity-30 mb-0.5" style={{ color }}>SECTOR_ID</div>
              <div className="text-2xl font-black text-white tracking-[0.15em] uppercase tabular-nums">{name}</div>
            </div>
          </div>
        </Html>
      </group>

      {/* Main Content Explorer Panel */}
      <Html
        position={[5, 6, -2]}
        distanceFactor={12}
        center
        className="pointer-events-none"
        style={{
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          opacity: isFocused ? 1 : 0,
          transform: `scale(${isFocused ? 1 : 0.05}) translateX(${isFocused ? 0 : 100}px)`,
          pointerEvents: isFocused ? 'auto' : 'none',
          visibility: isFocused ? 'visible' : 'hidden',
          width: 'min(92vw, 560px)',
          height: 'min(82vh, 700px)'
        }}
      >
        <div
          className="w-[min(92vw,560px)] h-[min(82vh,700px)] ui-context-shell rounded-[34px] flex flex-col overflow-hidden relative"
          style={{
            borderColor: `${color}66`,
            boxShadow: `0 0 30px ${hexToRgba(color, 0.22)}, 0 0 85px rgba(0,0,0,0.85)`,
          }}
        >
          <div className="absolute inset-0 ui-aurora pointer-events-none opacity-50" />
          {/* Dashboard Header */}
          <div className="p-6 sm:p-7 border-b border-white/10 flex justify-between items-center relative" style={{ backgroundColor: hexToRgba(color, 0.08) }}>
            <div className="absolute top-0 left-0 w-full h-1 opacity-20" style={{ backgroundColor: color }} />

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: color }} />
                <div className="text-[9px] font-mono tracking-[0.32em] uppercase opacity-50 text-white">Interactive Section Console</div>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase tabular-nums">{name}</h2>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); useAppStore.getState().setFocusedSection(null); }}
              className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white/30 hover:text-white transition-all active:scale-95"
            >
              <X size={26} strokeWidth={3} />
            </button>
          </div>

          {/* Dynamic Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 custom-scrollbar scroll-smooth">
            {renderExplorerContent()}
          </div>

          {/* System Status Footer */}
          <div className="p-4 sm:p-5 bg-black/50 border-t border-white/10 flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <div className="text-[8px] font-mono text-white/25 tracking-widest uppercase">Link State: Active</div>
              <div className="text-[8px] font-mono text-white/15">Updated: {new Date().toISOString()}</div>
            </div>
            <div className="flex gap-2.5 items-center">
              <div className="text-[9px] font-mono text-white/45 uppercase">Ready</div>
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 15px ${color}` }}></div>
            </div>
          </div>
        </div>
      </Html>

      {/* Interaction Prompt Overlay */}
      {hovered && nearby && !isFocused && (
        <Html position={[0, 1.6, 0]} center distanceFactor={10}>
          <div
            className="px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.4em] border-2 bg-white text-black animate-pulse shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all scale-110"
            style={{ borderColor: color }}
          >
            INIT_LINK
          </div>
        </Html>
      )}
    </group>
  )
}

export default Statue
