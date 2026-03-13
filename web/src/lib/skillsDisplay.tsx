import { Cpu, Gamepad2, Wrench, Palette, Workflow, Database, Globe, Terminal, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  siBlender,
  siCplusplus,
  siFramer,
  siHtml5,
  siJavascript,
  siNodedotjs,
  siReact,
  siSanity,
  siTailwindcss,
  siThreedotjs,
  siTypescript,
  siUnrealengine,
  siVite,
} from 'simple-icons'
import type { SimpleIcon } from 'simple-icons'

type DisplaySkill = {
  title: string
  category: string
  _id?: string
}

function normalizeSkill(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function buildDisplaySkills(skills: any[]): DisplaySkill[] {
  const merged = new Map<string, DisplaySkill>()
  ;(skills || []).forEach((skill: any, idx: number) => {
    const title = typeof skill?.title === 'string' ? skill.title.trim() : ''
    if (!title) return
    const category = typeof skill?.category === 'string' && skill.category.trim() ? skill.category.trim() : 'General'
    const key = normalizeSkill(title)
    if (!merged.has(key)) {
      merged.set(key, { _id: skill?._id || `cms-${idx}`, title, category })
    }
  })
  return Array.from(merged.values())
}

function simpleIconFor(title: string): SimpleIcon | null {
  const t = title.toLowerCase()
  if (/(unreal)/.test(t)) return siUnrealengine
  if (/(react three fiber|r3f|three\.js|threejs|webgl)/.test(t)) return siThreedotjs
  if (/(react)/.test(t)) return siReact
  if (/(javascript)/.test(t)) return siJavascript
  if (/(typescript)/.test(t)) return siTypescript
  if (/(sanity)/.test(t)) return siSanity
  if (/(tailwind)/.test(t)) return siTailwindcss
  if (/(framer)/.test(t)) return siFramer
  if (/(vite)/.test(t)) return siVite
  if (/(c\+\+|cpp)/.test(t)) return siCplusplus
  if (/(html)/.test(t)) return siHtml5
  if (/(node)/.test(t)) return siNodedotjs
  if (/(blender)/.test(t)) return siBlender
  return null
}

function lucideFallbackFor(title: string): LucideIcon {
  const t = title.toLowerCase()
  if (/(game|design|unreal|unity)/.test(t)) return Gamepad2
  if (/(shader|render|graphics|vfx|art)/.test(t)) return Palette
  if (/(system|architecture|pipeline|workflow)/.test(t)) return Workflow
  if (/(api|database|backend|sql)/.test(t)) return Database
  if (/(automation|tool|build|devops)/.test(t)) return Wrench
  if (/(web|frontend|ui|ux|html|css)/.test(t)) return Globe
  if (/(terminal|linux|cli)/.test(t)) return Terminal
  if (/(performance|optimi|ai|ml|compute)/.test(t)) return Cpu
  return Sparkles
}

export function SkillIcon({
  title,
  className = '',
}: {
  title: string
  className?: string
}) {
  const simple = simpleIconFor(title)
  if (simple) {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={className}
        fill={`#${simple.hex}`}
      >
        <path d={simple.path} />
      </svg>
    )
  }

  const Fallback = lucideFallbackFor(title)
  return <Fallback className={className} />
}

