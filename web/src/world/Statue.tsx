import { Suspense, useRef, useState, useMemo, type FormEvent } from 'react'
import { useFrame } from '@react-three/fiber'
import type { PerformanceTier } from '../hooks/usePerformanceTier'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '../store/appStore'
import { X } from 'lucide-react'
import CdnAnimatedModel from './CdnAnimatedModel'
import ModelErrorBoundary from '../components/system/ModelErrorBoundary'
import { urlFor } from '../lib/sanity'
import { buildDisplaySkills, SkillIcon } from '../lib/skillsDisplay'

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

function portableToPlain(value: any): string {
  if (!Array.isArray(value)) return ''
  return value
    .map((block: any) => {
      if (!block || block._type !== 'block' || !Array.isArray(block.children)) return ''
      return block.children.map((child: any) => child?.text || '').join('')
    })
    .filter(Boolean)
    .join('\n\n')
}

function youtubeEmbedUrl(url: string): string | null {
  if (!url) return null
  const clean = url.trim()
  const short = clean.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/)
  if (short?.[1]) return `https://www.youtube.com/embed/${short[1]}`
  const full = clean.match(/[?&]v=([A-Za-z0-9_-]{6,})/)
  if (full?.[1]) return `https://www.youtube.com/embed/${full[1]}`
  return null
}

function monthToNum(v: string) {
  const m = v.toLowerCase().slice(0, 3)
  const map: Record<string, number> = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  }
  return typeof map[m] === 'number' ? map[m] : 0
}

function parsePeriodStart(period: string | undefined): number {
  if (!period || typeof period !== 'string') return 0
  const first = period.split('–')[0]?.trim() || period.split('-')[0]?.trim() || ''
  const y = first.match(/\b(19|20)\d{2}\b/)
  if (!y) return 0
  const year = Number(y[0])
  const monthToken = first.replace(y[0], '').trim().split(/\s+/)[0] || 'jan'
  const month = monthToNum(monthToken)
  return new Date(year, month, 1).getTime()
}

function groupedWork(experiences: any[]) {
  const groups = new Map<string, { company: string; logo?: any; roles: any[] }>()
  ;(experiences || []).forEach((exp) => {
    const company = exp?.company || 'Unknown Company'
    const key = company.toLowerCase().trim()
    if (!groups.has(key)) groups.set(key, { company, logo: exp?.logo, roles: [] })
    const g = groups.get(key)!
    g.logo = g.logo || exp?.logo
    g.roles.push(exp)
  })

  const arr = Array.from(groups.values())
  arr.forEach((g) => {
    g.roles.sort((a, b) => parsePeriodStart(b?.period) - parsePeriodStart(a?.period))
  })
  arr.sort((a, b) => parsePeriodStart(b.roles[0]?.period) - parsePeriodStart(a.roles[0]?.period))
  return arr
}

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
  performanceTier = 'high',
  onClick,
}: StatueProps) => {
  const [hovered, setHovered] = useState(false)
  const [nearby, setNearby] = useState(false)
  const [contactSending, setContactSending] = useState(false)
  const [contactStatus, setContactStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' })
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

  const submitContact = async (e: FormEvent) => {
    e.preventDefault()
    const recipient = data?.siteSettings?.contactRecipientEmail || ''
    if (!recipient) {
      setContactStatus('error')
      return
    }
    setContactSending(true)
    setContactStatus('idle')
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(contactForm),
      })
      if (!res.ok) throw new Error('send failed')
      setContactStatus('success')
      setContactForm({ name: '', email: '', subject: '', message: '' })
    } catch {
      setContactStatus('error')
    } finally {
      setContactSending(false)
    }
  }

  // Helper to render section-specific content
  const renderExplorerContent = () => {
    if (!data) return <div className="text-white/40 font-mono text-[10px] uppercase animate-pulse">Synchronizing_Datastream...</div>

    switch (type) {
      case 'projects':
        return (
          <div className="space-y-4">
            {(data.projects || []).map((p: any) => (
              <div key={p._id} className={`p-5 ui-context-card group ${p?.featured ? 'border-amber-300/70 shadow-[0_0_20px_rgba(245,158,11,0.25)]' : ''}`}>
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
                {Array.isArray(p.links) &&
                  p.links
                    .map((l: any) => youtubeEmbedUrl(l?.url || ''))
                    .filter(Boolean)
                    .slice(0, 1)
                    .map((embed: any, i: number) => (
                      <div key={`yt-inline-${i}`} className="mb-3 rounded-lg overflow-hidden border border-white/10 bg-black/30">
                        <iframe
                          src={embed}
                          title={`project-yt-${p._id}-${i}`}
                          className="w-full h-40"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        />
                      </div>
                    ))}
                {Array.isArray(p.links) && p.links.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {p.links.slice(0, 3).map((l: any, idx: number) => (
                      <a key={`${l?.url || 'link'}-${idx}`} href={l?.url || '#'} target="_blank" rel="noreferrer" className="text-[9px] px-2 py-1 rounded border border-white/10 bg-black/30 text-white/70">
                        {l?.label || l?.type || 'link'}
                      </a>
                    ))}
                  </div>
                )}
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
        const mergedSkills = buildDisplaySkills(data.skills || [])
        return (
          <div className="grid grid-cols-2 gap-3">
            {mergedSkills.map((s: any, idx: number) => (
              <div key={s._id || `skill-${idx}`} className="p-3 ui-context-card flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md border border-white/15 bg-slate-900/70 flex items-center justify-center">
                  <SkillIcon title={s?.title || ''} className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium text-white/80 leading-tight">{s.title}</span>
              </div>
            ))}
          </div>
        )

      case 'work':
        const workGroups = groupedWork(data.experience || [])
        return (
          <div className="space-y-5">
            {workGroups.map((companyGroup: any) => (
              <div key={companyGroup.company} className="relative p-4 ui-context-card">
                <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
                <div className="absolute -inset-px opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: `0 0 35px ${hexToRgba(color, 0.2)}` }} />

                <div className="flex gap-4 mb-4">
                  <div className="w-16 h-16 rounded-xl border border-white/10 bg-black/40 overflow-hidden shrink-0">
                    {imageUrl(experienceImage({ logo: companyGroup.logo }, data), 160, 160) ? (
                      <img src={imageUrl(experienceImage({ logo: companyGroup.logo }, data), 160, 160)!} alt={companyGroup.company || 'Company visual'} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] font-mono text-white/35">LOGO</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-black text-white leading-tight text-base uppercase tracking-wide">{companyGroup.company}</h3>
                  </div>
                </div>

                <div className="relative ml-1 pl-5">
                  <div className="absolute left-[5px] top-0 bottom-0 w-[2px]" style={{ background: `linear-gradient(180deg, ${hexToRgba(color, 0.8)}, ${hexToRgba(color, 0.2)}, transparent)` }} />
                  <div className="space-y-3">
                    {companyGroup.roles.map((exp: any, idx: number) => (
                      <div key={exp._id || `${companyGroup.company}-${idx}`} className="relative p-3 rounded-lg border border-white/10 bg-black/30">
                        <div className="absolute -left-[17px] top-4 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 10px ${hexToRgba(color, 0.85)}` }} />
                        <div className="text-[9px] font-mono text-white/40 mb-1">{exp.period}</div>
                        <h4 className="font-black text-white leading-tight text-sm uppercase tracking-wide">{exp.role}</h4>
                        <p className="text-[11px] text-white/35 line-clamp-4 leading-relaxed mt-1.5">{exp.description}</p>
                        {Array.isArray(exp.skills) && exp.skills.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-2">
                            {exp.skills.slice(0, 5).map((s: string) => (
                              <span key={s} className="text-[9px] px-2 py-1 rounded border border-white/10 text-white/60 bg-black/30">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )

      case 'about':
        const site = data.siteSettings || {}
        const aboutText = portableToPlain(site.aboutContent)
        return (
          <div className="space-y-6">
            <div className="aspect-video ui-context-card flex items-center justify-center relative overflow-hidden group">
              {site.aboutPhoto ? (
                <img
                  src={imageUrl(site.aboutPhoto, 800, 450)!}
                  alt="About profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-[9px] font-mono text-white/20 tracking-[0.5em] animate-pulse">ESTABLISHING_LINK...</div>
                </>
              )}
            </div>
            <div className="p-6 ui-context-card shadow-inner">
              <p className="text-white/60 text-xs leading-relaxed italic whitespace-pre-line">
                {aboutText || 'Add About content in Site Settings -> About Me.'}
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
        const links = Array.isArray(data?.siteSettings?.contactLinks) ? data.siteSettings.contactLinks : []
        return (
          <div className="space-y-4">
            <div className="p-5 ui-context-card">
              <div className="text-[9px] font-mono uppercase opacity-40 mb-2">Direct Channel</div>
              {links.length > 0 ? (
                <div className="space-y-2">
                  {links.slice(0, 6).map((l: any, idx: number) => (
                    <a key={`${l?.url || 'contact'}-${idx}`} href={l?.url || '#'} target="_blank" rel="noreferrer" className="block text-sm text-white/70 underline-offset-4 hover:underline">
                      {l?.label || l?.url}
                    </a>
                  ))}
                </div>
              ) : <p className="text-sm text-white/70">Add contact links from Site Settings dashboard.</p>}
            </div>
            <div className="p-5 ui-context-card">
              <div className="text-[9px] font-mono uppercase opacity-40 mb-2">Collaboration</div>
              <p className="text-xs text-white/50">{data?.siteSettings?.contactIntro || 'Open to gameplay systems, tools, and technical art projects.'}</p>
            </div>
            <form
              onSubmit={submitContact}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="p-5 ui-context-card space-y-2.5"
            >
              <div className="text-[9px] font-mono uppercase opacity-40 mb-2">Send Message</div>
              <input
                value={contactForm.name}
                onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))}
                onPointerDown={(e) => e.stopPropagation()}
                placeholder="Name"
                className="w-full h-9 rounded-lg bg-slate-900/70 border border-white/15 px-2.5 text-[11px] text-white outline-none"
                required
              />
              <input
                value={contactForm.email}
                type="email"
                onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))}
                onPointerDown={(e) => e.stopPropagation()}
                placeholder="Email"
                className="w-full h-9 rounded-lg bg-slate-900/70 border border-white/15 px-2.5 text-[11px] text-white outline-none"
                required
              />
              <input
                value={contactForm.subject}
                onChange={(e) => setContactForm((prev) => ({ ...prev, subject: e.target.value }))}
                onPointerDown={(e) => e.stopPropagation()}
                placeholder="Subject"
                className="w-full h-9 rounded-lg bg-slate-900/70 border border-white/15 px-2.5 text-[11px] text-white outline-none"
                required
              />
              <textarea
                value={contactForm.message}
                onChange={(e) => setContactForm((prev) => ({ ...prev, message: e.target.value }))}
                onPointerDown={(e) => e.stopPropagation()}
                placeholder="Message"
                className="w-full min-h-24 rounded-lg bg-slate-900/70 border border-white/15 px-2.5 py-2 text-[11px] text-white outline-none"
                required
              />
              {contactStatus === 'success' && <div className="text-[10px] text-emerald-300">Message sent.</div>}
              {contactStatus === 'error' && <div className="text-[10px] text-red-300">Send failed. Check recipient email in dashboard.</div>}
              <button
                type="submit"
                disabled={contactSending}
                className="text-[10px] px-3 py-2 rounded-lg border border-white/15 bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-60"
              >
                {contactSending ? 'Sending...' : 'Send'}
              </button>
            </form>
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

  const baseScale = modelScale ?? (TYPE_MODEL_MAP[type] || TYPE_MODEL_MAP.projects).scale ?? 0.3

  useFrame((state, delta) => {
    // Set correct scale immediately on first frame (before frame skip) so models don't lerp from 1
    if (groupRef.current && !scaleInitialized.current) {
      scaleInitialized.current = true
      groupRef.current.scale.set(baseScale, baseScale, baseScale)
    }
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

    if (ringRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * (2.8 + nearAmountRef.current * 1.8)) * 0.03
      const targetRingScale = 1.15 + nearAmountRef.current * 0.42 + hoverAmountRef.current * 0.16
      ringRef.current.scale.set(targetRingScale * pulse, targetRingScale * pulse, 1)
    }

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

  return (
    <group position={position} name={`statue-${name}`}>
      <group
        ref={groupRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={onClick}
      >
        {/* Primary symbolic form - no base (base only at link statues) */}
        <group ref={coreRef}>
          {renderStatueVisual}
          <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.33, 0]}>
            <ringGeometry args={[1.1, 1.58, performanceTier === 'low' ? 24 : 56]} />
            <meshBasicMaterial
              ref={ringMatRef}
              color={color}
              transparent
              opacity={0}
              toneMapped={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
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
          <div className="relative group">
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

      {/* Main Content Explorer Panel - full viewport on mobile for proper fit */}
      <Html
        position={[5, 6, -2]}
        distanceFactor={12}
        center
        style={{
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          opacity: isFocused ? 1 : 0,
          transform: `scale(${isFocused ? 1 : 0.05}) translateX(${isFocused ? 0 : 100}px)`,
          pointerEvents: isFocused ? 'auto' : 'none',
          visibility: isFocused ? 'visible' : 'hidden',
          width: 'min(96vw, 560px)',
          height: 'min(90vh, 700px)',
          maxWidth: '100vw',
          maxHeight: '100dvh'
        }}
      >
        <div
          className="w-full max-w-[min(96vw,560px)] h-full max-h-[min(90vh,700px)] min-h-0 ui-context-shell rounded-2xl sm:rounded-[34px] flex flex-col overflow-hidden relative"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          style={{
            borderColor: `${color}66`,
            boxShadow: `0 0 30px ${hexToRgba(color, 0.22)}, 0 0 85px rgba(0,0,0,0.85)`,
          }}
        >
          <div className="absolute inset-0 ui-aurora pointer-events-none opacity-50" />
          {/* Dashboard Header */}
          <div className="p-4 sm:p-7 border-b border-white/10 flex justify-between items-center relative shrink-0" style={{ backgroundColor: hexToRgba(color, 0.08) }}>
            <div className="absolute top-0 left-0 w-full h-1 opacity-20" style={{ backgroundColor: color }} />

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: color }} />
                <div className="text-[9px] font-mono tracking-[0.32em] uppercase opacity-50 text-white">Interactive Section Console</div>
              </div>
              <h2 className="text-xl sm:text-4xl font-black text-white tracking-tight uppercase tabular-nums truncate max-w-[60vw] sm:max-w-none">{name}</h2>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); useAppStore.getState().setFocusedSection(null); }}
              className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white/30 hover:text-white transition-all active:scale-95"
            >
              <X size={26} strokeWidth={3} />
            </button>
          </div>

          {/* Dynamic Scrollable Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-7 space-y-6 custom-scrollbar scroll-smooth">
            {renderExplorerContent()}
          </div>

          {/* System Status Footer */}
          <div className="p-3 sm:p-5 bg-black/50 border-t border-white/10 flex items-center justify-between shrink-0">
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

    </group>
  )
}

export default Statue
