/**
 * Centralized resolution of Sanity dashboard settings into normalized sections and link relics.
 * All dashboard fields (position, color, scale, modelPosition, etc.) are applied here.
 */

export type ResolvedSection = {
  name: string
  archetype: string
  color: string
  position: [number, number, number]
  statueModelUrl?: string
  statueModelScale: number
  statueModelRotation: [number, number, number]
  statueModelPosition: [number, number, number]
  statueModelAnimated: boolean
  statueAnimationClip?: string
  statueAllowTransparency: boolean
  statueSpinSpeed: number
  statueFloatAmount: number
  statueFloatSpeed: number
  statueInteractionDistance: number
  statueGlowIntensity: number
}

export type ResolvedLinkRelic = {
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

const DEFAULT_SECTIONS = [
  { name: 'Projects', pos: [0, 0, -48], color: '#3b82f6', archetype: 'projects', modelUrl: '/Models/Projects.glb', modelScale: 1, modelRotationY: 0, modelAnimated: false },
  { name: 'Education', pos: [34, 0, -34], color: '#22c55e', archetype: 'education', modelUrl: '/Models/education.glb', modelScale: 1, modelRotationY: 0, modelAnimated: false },
  { name: 'Work', pos: [-34, 0, -34], color: '#ef4444', archetype: 'work', modelUrl: '/Models/Work.glb', modelScale: 1, modelRotationY: 0, modelAnimated: false },
  { name: 'Skills', pos: [48, 0, 0], color: '#f59e0b', archetype: 'skills', modelUrl: '/Models/skill.glb', modelScale: 1, modelRotationY: 0, modelAnimated: false },
  { name: 'Contact', pos: [-48, 0, 0], color: '#8b5cf6', archetype: 'contact', modelUrl: '/Models/Contact.glb', modelScale: 1, modelRotationY: 0, modelAnimated: false },
  { name: 'About', pos: [34, 0, 34], color: '#06b6d4', archetype: 'about', modelUrl: '/Models/About me.glb', modelScale: 1, modelRotationY: 0, modelAnimated: false },
  { name: 'Blog', pos: [-34, 0, 34], color: '#f97316', archetype: 'blog', modelUrl: '/Models/Blog.glb', modelScale: 1, modelRotationY: 0, modelAnimated: false },
]

const LINK_RELICS_BASE = [
  { id: 'github', label: 'GitHub', url: 'https://github.com', position: [-12, 0, 74], color: '#f8fafc', modelUrl: '/Models/github.glb', modelScale: 1.2, modelPosition: [0, 0.05, 0], modelRotation: [0, 0.2, 0], modelAnimated: true, spinSpeed: 1.1, floatAmount: 0.22, floatSpeed: 1.8, glowIntensity: 2.2 },
  { id: 'linkedin', label: 'LinkedIn', url: 'https://linkedin.com', position: [0, 0, 78], color: '#0ea5e9', modelUrl: '/Models/Linked In.glb', modelScale: 2.8, modelPosition: [0, 0.05, 0], modelRotation: [0, 0.1, 0], modelAnimated: true, spinSpeed: 1.1, floatAmount: 0.22, floatSpeed: 1.8, glowIntensity: 2.2 },
  { id: 'resume', label: 'Resume', url: '/resume', position: [12, 0, 74], color: '#ef4444', modelUrl: '/Models/Resume.glb', modelScale: 1.8, modelPosition: [0, 0.05, 0], modelRotation: [0, -0.2, 0], modelAnimated: true, spinSpeed: 1.1, floatAmount: 0.22, floatSpeed: 1.8, glowIntensity: 2.2 },
]

const SECTION_ARCHETYPES = ['projects', 'education', 'work', 'skills', 'contact', 'about', 'blog'] as const

function getSectionRelics(scene: any): Record<string, any> {
  const raw = scene?.sectionRelics || {}
  const merged: Record<string, any> = {}
  for (const key of SECTION_ARCHETYPES) {
    const def = DEFAULT_SECTIONS.find((d: any) => d.archetype === key)
    const defaults = {
      label: def?.name ?? key,
      url: `#${key}`,
      color: def?.color ?? '#3b82f6',
      modelScale: def?.modelScale ?? 1,
      modelPosition: [0, 0.35, 0] as [number, number, number],
    }
    const fromApi = raw[key]
    const definedFromApi = fromApi && typeof fromApi === 'object'
      ? Object.fromEntries(Object.entries(fromApi).filter(([, v]) => v !== undefined && v !== null))
      : {}
    const mergedRelic = { ...defaults, ...definedFromApi }
    // Ensure modelScale is a number (Sanity can return string)
    const scale = mergedRelic.modelScale
    mergedRelic.modelScale = typeof scale === 'number' ? scale : (typeof scale === 'string' ? parseFloat(scale) : defaults.modelScale)
    if (!Number.isFinite(mergedRelic.modelScale)) mergedRelic.modelScale = defaults.modelScale
    merged[key] = mergedRelic
  }
  return merged
}

export function toHexColor(value: any, fallback: string): string {
  if (typeof value === 'string' && value.trim()) return value
  if (value && typeof value === 'object' && typeof value.hex === 'string' && value.hex.trim()) return value.hex
  return fallback
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-')
}

function circularPoint(index: number, total: number, radius: number, startAngle = -Math.PI / 2): [number, number, number] {
  const angle = startAngle + (index / Math.max(total, 1)) * Math.PI * 2
  return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius]
}

function mapLegacyTypeToArchetype(value: string | undefined): string | null {
  if (!value) return null
  const t = value.toLowerCase()
  if (t === 'gear') return 'projects'
  if (t === 'pillar') return 'work'
  if (t === 'core') return 'skills'
  if (t === 'utility') return 'contact'
  if (t === 'hero') return 'about'
  return null
}

function extractPosition(s: any, index: number, total: number, sectionRadius: number): [number, number, number] {
  // Section schema: position: { x, y, z }
  const pos = s?.position
  if (pos && typeof pos.x === 'number' && typeof pos.y === 'number' && typeof pos.z === 'number') {
    return [pos.x, pos.y, pos.z]
  }
  // Array format [x, y, z] from section or other sources
  if (Array.isArray(s?.position) && s.position.length === 3) {
    const [x, y, z] = s.position
    if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
      return [x, y, z]
    }
  }
  return circularPoint(index, total, sectionRadius)
}

export function resolveSections(data: any, sectionRadius: number): ResolvedSection[] {
  const list = data?.sections?.length > 0 ? data.sections : DEFAULT_SECTIONS
  const orderedList = [...list].sort((a: any, b: any) => {
    const ao = typeof a?.order === 'number' ? a.order : 9999
    const bo = typeof b?.order === 'number' ? b.order : 9999
    return ao - bo
  })
  const sectionRelics = getSectionRelics(data?.scene)

  return orderedList.map((s: any, i: number) => {
    const section = DEFAULT_SECTIONS[i % DEFAULT_SECTIONS.length]
    const idKey = normalizeKey((s.id || s.archetype || section.archetype || '').toString())
    let fixedRelic = sectionRelics[idKey] || null
    const name = fixedRelic?.label || s.label || s.name || s.title || section.name
    const key = normalizeKey(name)
    const matched = DEFAULT_SECTIONS.find((d: any) => normalizeKey(d.name) === key) || section
    const explicitArchetype = (s.archetype as string) || mapLegacyTypeToArchetype(s.type) || matched.archetype
    const relicKey = explicitArchetype ? normalizeKey(explicitArchetype) : idKey
    if (relicKey && sectionRelics[relicKey]) {
      fixedRelic = sectionRelics[relicKey]
    }

    const modelRotation =
      Array.isArray(s.statueModelRotation) && s.statueModelRotation.length === 3
        ? [s.statueModelRotation[0], s.statueModelRotation[1], s.statueModelRotation[2]]
        : [0, typeof s.statueModelRotationY === 'number' ? s.statueModelRotationY : (matched.modelRotationY ?? 0), 0]
    const modelPosition =
      Array.isArray(fixedRelic?.modelPosition) && fixedRelic.modelPosition.length === 3
        ? [fixedRelic.modelPosition[0], fixedRelic.modelPosition[1], fixedRelic.modelPosition[2]]
        : Array.isArray(s.modelPosition) && s.modelPosition.length === 3
          ? [s.modelPosition[0], s.modelPosition[1], s.modelPosition[2]]
          : Array.isArray(s.statueModelPosition) && s.statueModelPosition.length === 3
            ? [s.statueModelPosition[0], s.statueModelPosition[1], s.statueModelPosition[2]]
            : [0, 0.35, 0]

    const position = extractPosition(s, i, list.length, sectionRadius)

    return {
      ...s,
      name,
      position,
      color: toHexColor(fixedRelic?.color || s.color, matched.color),
      archetype: explicitArchetype,
      statueModelUrl: s.statueModelUrl || s.modelUrl || matched.modelUrl,
      statueModelScale: (() => {
        if (fixedRelic && typeof fixedRelic.modelScale === 'number') return fixedRelic.modelScale
        if (fixedRelic && Number.isFinite(fixedRelic.modelScale)) return Number(fixedRelic.modelScale)
        if (fixedRelic) return 1
        return (typeof s.statueModelScale === 'number' ? s.statueModelScale : undefined) ??
          (typeof s.modelScale === 'number' ? s.modelScale : undefined) ??
          (typeof matched.modelScale === 'number' ? matched.modelScale : 1) ??
          1
      })(),
      statueModelRotation: modelRotation as [number, number, number],
      statueModelPosition: modelPosition as [number, number, number],
      statueModelAnimated: typeof s.statueModelAnimated === 'boolean' ? s.statueModelAnimated : (s.modelAnimated ?? false),
      statueAnimationClip: typeof s.statueAnimationClip === 'string' ? s.statueAnimationClip : undefined,
      statueAllowTransparency: typeof s.statueAllowTransparency === 'boolean' ? s.statueAllowTransparency : false,
      statueSpinSpeed: typeof s.statueSpinSpeed === 'number' ? s.statueSpinSpeed : 0.35,
      statueFloatAmount: typeof s.statueFloatAmount === 'number' ? s.statueFloatAmount : 0.06,
      statueFloatSpeed: typeof s.statueFloatSpeed === 'number' ? s.statueFloatSpeed : 1.8,
      statueInteractionDistance: typeof s.statueInteractionDistance === 'number' ? s.statueInteractionDistance : 12,
      statueGlowIntensity: typeof s.statueGlowIntensity === 'number' ? s.statueGlowIntensity : 8,
    }
  })
}

export function resolveLinkRelics(data: any, sectionRadius: number): ResolvedLinkRelic[] {
  const rel = data?.scene?.linkRelics || {}
  const radiusDelta = sectionRadius - 52
  return LINK_RELICS_BASE.map((base: any) => {
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
}

/** For NormalMode nav: sections with id (archetype) and label (name) from dashboard */
export function resolveNavSections(data: any, sectionRadius: number): { id: string; label: string }[] {
  const sections = resolveSections(data, sectionRadius)
  return sections.map((s) => ({ id: s.archetype, label: s.name }))
}
