/**
 * Seeds initial skills into Sanity. Run once to populate the Skill Matrix.
 * Edit or add skills from the Sanity dashboard after running.
 *
 * Usage: SANITY_AUTH_TOKEN=xxx node studio/scripts/seed-skills.mjs
 */
import { createClient } from '@sanity/client'

const SKILLS = [
  { title: 'Unreal Engine', category: 'Game Development', order: 1 },
  { title: 'C++', category: 'Game Development', order: 2 },
  { title: 'Blueprints', category: 'Game Development', order: 3 },
  { title: 'React', category: 'Web Development', order: 10 },
  { title: 'TypeScript', category: 'Web Development', order: 11 },
  { title: 'Three.js', category: 'Web Development', order: 12 },
  { title: 'React Three Fiber', category: 'Web Development', order: 13 },
  { title: 'Blender', category: '3D & Graphics', order: 20 },
  { title: 'Vite', category: 'Tools', order: 30 },
  { title: 'Sanity', category: 'Tools', order: 31 },
  { title: 'Git', category: 'Tools', order: 32 },
]

async function main() {
  const token = process.env.SANITY_AUTH_TOKEN || process.env.SANITY_API_TOKEN
  if (!token) {
    console.error('Missing SANITY_AUTH_TOKEN (or SANITY_API_TOKEN). Set it then rerun.')
    process.exit(1)
  }

  const client = createClient({
    projectId: 'wsg4349i',
    dataset: 'production',
    apiVersion: '2023-05-03',
    useCdn: false,
    token,
  })

  const existing = await client.fetch(`*[_type == "skill"]{ _id }`)
  if (existing.length > 0) {
    console.log(`Found ${existing.length} existing skills. Skipping seed (delete skills in Sanity first to re-seed).`)
    return
  }

  const docs = SKILLS.map((s, idx) => ({
    _id: `skill-seed-${idx + 1}`,
    _type: 'skill',
    title: s.title,
    category: s.category,
    order: s.order,
    level: 80,
  }))

  const tx = client.transaction()
  docs.forEach((doc) => tx.createOrReplace(doc))
  await tx.commit()

  console.log(`Seeded ${docs.length} skills. Edit them in Sanity Studio → Skill Matrix.`)
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
