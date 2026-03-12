import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@sanity/client'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(SCRIPT_DIR, '..', '..')
const OLD = path.join(ROOT, 'My_Portfolio', 'components')
const OLD_PUBLIC = path.join(ROOT, 'My_Portfolio', 'public')

function read(file) {
  return fs.readFileSync(path.join(OLD, file), 'utf8')
}

function extractArray(source, constName) {
  const marker = `const ${constName} =`
  const startMarker = source.indexOf(marker)
  if (startMarker < 0) return null

  const startBracket = source.indexOf('[', startMarker)
  if (startBracket < 0) return null

  let depth = 0
  let inSingle = false
  let inDouble = false
  let inTemplate = false
  let escaped = false

  for (let i = startBracket; i < source.length; i++) {
    const ch = source[i]

    if (escaped) {
      escaped = false
      continue
    }
    if (ch === '\\') {
      escaped = true
      continue
    }

    if (!inDouble && !inTemplate && ch === "'" && !inSingle) {
      inSingle = true
      continue
    } else if (inSingle && ch === "'") {
      inSingle = false
      continue
    }

    if (!inSingle && !inTemplate && ch === '"' && !inDouble) {
      inDouble = true
      continue
    } else if (inDouble && ch === '"') {
      inDouble = false
      continue
    }

    if (!inSingle && !inDouble && ch === '`' && !inTemplate) {
      inTemplate = true
      continue
    } else if (inTemplate && ch === '`') {
      inTemplate = false
      continue
    }

    if (inSingle || inDouble || inTemplate) continue

    if (ch === '[') depth++
    if (ch === ']') {
      depth--
      if (depth === 0) {
        return source.slice(startBracket, i + 1)
      }
    }
  }

  return null
}

function safeEvalArray(arrayLiteral) {
  try {
    return Function(`"use strict"; return (${arrayLiteral});`)()
  } catch {
    return null
  }
}

function slugify(v) {
  return (v || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function plainAboutParagraphs(source) {
  const matches = [...source.matchAll(/<p>\s*([\s\S]*?)\s*<\/p>/g)]
  return matches
    .map((m) =>
      m[1]
        .replace(/\{|\}/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter(Boolean)
}

function blocksFromParagraphs(paragraphs) {
  return paragraphs.map((text) => ({
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', text, marks: [] }],
  }))
}

function categoryForSkill(name) {
  const n = name.toLowerCase()
  if (n.includes('engine') || n.includes('graphics') || n.includes('vulkan') || n.includes('opengl')) return 'graphics'
  if (n.includes('git') || n.includes('github')) return 'tools'
  return 'programming'
}

async function uploadImageIfExists(client, imagePathLike, cache) {
  if (!imagePathLike || typeof imagePathLike !== 'string') return null
  const clean = imagePathLike.replace(/^\/+/, '')
  const full = path.join(OLD_PUBLIC, clean)
  if (!fs.existsSync(full)) return null
  if (cache.has(full)) return cache.get(full)

  const upload = await client.assets.upload('image', fs.createReadStream(full), {
    filename: path.basename(full),
  })
  const ref = { _type: 'image', asset: { _type: 'reference', _ref: upload._id } }
  cache.set(full, ref)
  return ref
}

async function main() {
  const token = process.env.SANITY_AUTH_TOKEN || process.env.SANITY_API_TOKEN
  if (!token) {
    throw new Error('Missing SANITY_AUTH_TOKEN (or SANITY_API_TOKEN). Set it then rerun migration.')
  }

  const projectsSrc = read('projects.tsx')
  const skillsSrc = read('skills.tsx')
  const educationSrc = read('education.tsx')
  const workSrc = read('work.tsx')
  const aboutSrc = read('about.tsx')
  const contactSrc = read('contact.tsx')

  const projects = safeEvalArray(extractArray(projectsSrc, 'projects') || '[]') || []
  const education = safeEvalArray(extractArray(educationSrc, 'educationData') || '[]') || []
  const work = safeEvalArray(extractArray(workSrc, 'workData') || '[]') || []
  const skillNames = [...skillsSrc.matchAll(/name:\s*"([^"]+)"/g)].map((m) => m[1])
  const aboutParagraphs = plainAboutParagraphs(aboutSrc)
  const contactPairs = [...contactSrc.matchAll(/title:\s*"([^"]+)"[\s\S]*?value:\s*"([^"]+)"[\s\S]*?link:\s*"([^"]+)"/g)].map(
    (m) => ({ label: m[1], value: m[2], url: m[3] })
  )

  const client = createClient({
    projectId: 'wsg4349i',
    dataset: 'production',
    apiVersion: '2023-05-03',
    useCdn: false,
    token,
  })
  const imageCache = new Map()

  const docs = []

  docs.push({
    _id: 'siteSettings-legacy-migrated',
    _type: 'siteSettings',
    title: 'Portfolio Control Hub',
    description: 'Migrated from old portfolio',
    aboutHeadline: 'My Journey',
    aboutContent: blocksFromParagraphs(aboutParagraphs),
    contactIntro:
      "I'm always interested in hearing about new opportunities, collaborations, or discussing game development and graphics programming.",
    contactRecipientEmail: 'aameendev@gmail.com',
    contactLinks: contactPairs.map((c) => ({
      _type: 'object',
      label: `${c.label}: ${c.value}`,
      url: c.url,
      kind: c.label.toLowerCase().includes('mail') ? 'email' : c.label.toLowerCase().includes('phone') ? 'phone' : 'social',
    })),
  })

  for (let idx = 0; idx < projects.length; idx++) {
    const p = projects[idx]
    const mainImage = await uploadImageIfExists(client, p.image, imageCache)
    docs.push({
      _id: `legacy-project-${p.id || idx + 1}`,
      _type: 'project',
      title: p.title,
      slug: { _type: 'slug', current: slugify(p.title) || `legacy-project-${idx + 1}` },
      description: p.fullDescription || p.shortDescription || '',
      mainImage,
      media: mainImage
        ? [
            {
              _type: 'object',
              type: 'image',
              image: mainImage,
              caption: p.title,
            },
          ]
        : [],
      technologies: Array.isArray(p.technologies) ? p.technologies : [],
      featured: idx < 3,
      order: idx + 1,
      links: (Array.isArray(p.links) ? p.links : []).map((l) => ({
        _type: 'object',
        label: l.type || 'Link',
        url: l.url,
        type: (l.type || 'other').toLowerCase(),
      })),
    })
  }

  skillNames.forEach((name, idx) => {
    docs.push({
      _id: `legacy-skill-${slugify(name) || idx + 1}`,
      _type: 'skill',
      title: name,
      level: 80,
      category: categoryForSkill(name),
    })
  })

  for (let idx = 0; idx < education.length; idx++) {
    const e = education[idx]
    const logo = await uploadImageIfExists(client, e.image, imageCache)
    docs.push({
      _id: `legacy-education-${idx + 1}`,
      _type: 'education',
      institution: e.school,
      degree: e.degree,
      period: e.date,
      logo,
    })
  }

  for (let idx = 0; idx < work.length; idx++) {
    const w = work[idx]
    const logo = await uploadImageIfExists(client, w.image, imageCache)
    if (Array.isArray(w.roles) && w.roles.length > 0) {
      for (let ridx = 0; ridx < w.roles.length; ridx++) {
        const r = w.roles[ridx]
        docs.push({
          _id: `legacy-experience-${idx + 1}-${ridx + 1}`,
          _type: 'experience',
          company: w.company,
          role: r.position,
          period: r.dateLocation,
          description: Array.isArray(r.description) ? r.description.join('\n') : '',
          skills: Array.isArray(r.skills) ? r.skills : [],
          logo,
        })
      }
      continue
    }

    docs.push({
      _id: `legacy-experience-${idx + 1}`,
      _type: 'experience',
      company: w.company,
      role: w.position,
      period: w.dateLocation,
      description: Array.isArray(w.description) ? w.description.join('\n') : '',
      skills: Array.isArray(w.skills) ? w.skills : [],
      logo,
    })
  }

  let tx = client.transaction()
  docs.forEach((doc) => {
    tx = tx.createOrReplace(doc)
  })
  await tx.commit({ autoGenerateArrayKeys: true })

  console.log(`Migrated ${docs.length} documents to Sanity.`)
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})

