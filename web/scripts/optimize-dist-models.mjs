#!/usr/bin/env node
/**
 * Optimize GLB models in dist/ for Cloudflare Pages (25 MiB file limit).
 * Run after build, before deploy. Replaces files in place.
 */
import { execSync } from 'child_process'
import { readdirSync, existsSync, statSync, renameSync, unlinkSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distModels = join(__dirname, '../dist/Models')
const CLOUDFLARE_LIMIT_MB = 25

if (!existsSync(distModels)) {
  console.log('dist/Models not found. Run build first.')
  process.exit(1)
}

try {
  execSync('npx @gltf-transform/cli --version', { stdio: 'pipe' })
} catch {
  console.log('Installing @gltf-transform/cli...')
  execSync('npm install -D @gltf-transform/cli', { stdio: 'inherit', cwd: join(__dirname, '..') })
}

const files = readdirSync(distModels).filter((f) => f.endsWith('.glb'))
const oversized = files.filter((f) => {
  const size = statSync(join(distModels, f)).size
  return size > CLOUDFLARE_LIMIT_MB * 1024 * 1024
})

if (oversized.length === 0) {
  console.log('All models under 25 MiB. Skipping optimization.')
  process.exit(0)
}

console.log(`Optimizing ${oversized.length} oversized model(s):`, oversized.map((f) => `${f} (${(statSync(join(distModels, f)).size / 1024 / 1024).toFixed(1)} MiB)`).join(', '))

for (const file of oversized) {
  const input = join(distModels, file)
  const temp = join(distModels, file + '.tmp')
  console.log(`  Optimizing ${file}...`)
  try {
    execSync(
      `npx @gltf-transform/cli optimize "${input}" "${temp}" --compress meshopt --meshopt-level high`,
      { stdio: 'inherit', cwd: join(__dirname, '..') }
    )
    renameSync(temp, input)
    let newSize = statSync(input).size / 1024 / 1024
    if (newSize > CLOUDFLARE_LIMIT_MB) {
      console.log(`  Still ${newSize.toFixed(1)} MiB, trying texture resize...`)
      const temp2 = join(distModels, file + '.tmp2')
      execSync(
        `npx @gltf-transform/cli optimize "${input}" "${temp2}" --compress meshopt --meshopt-level high --texture-size 1024`,
        { stdio: 'inherit', cwd: join(__dirname, '..') }
      )
      renameSync(temp2, input)
      newSize = statSync(input).size / 1024 / 1024
    }
    console.log(`  → ${newSize.toFixed(1)} MiB`)
  } catch (err) {
    console.error(`  Failed to optimize ${file}:`, err.message)
    if (existsSync(temp)) unlinkSync(temp)
    process.exit(1)
  }
}

console.log('Done. Models ready for deploy.')
