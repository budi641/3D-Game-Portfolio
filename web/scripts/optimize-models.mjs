#!/usr/bin/env node
/**
 * GLB optimization pipeline using gltf-transform.
 * Run: npm run optimize-models
 *
 * Uses meshopt compression (no decoder needed - works with drei useGLTF).
 * Optionally add draco for more compression (requires DRACOLoader setup).
 */
import { execSync } from 'child_process'
import { readdirSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const modelsDir = join(__dirname, '../public/Models')
const outDir = join(__dirname, '../public/Models-optimized')

if (!existsSync(modelsDir)) {
  console.log('Models directory not found:', modelsDir)
  process.exit(1)
}

try {
  execSync('npx @gltf-transform/cli --version', { stdio: 'pipe' })
} catch {
  console.log('Installing @gltf-transform/cli...')
  execSync('npm install -D @gltf-transform/cli', { stdio: 'inherit', cwd: join(__dirname, '..') })
}

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

const files = readdirSync(modelsDir).filter((f) => f.endsWith('.glb'))
if (!files.length) {
  console.log('No GLB files found in', modelsDir)
  process.exit(1)
}

console.log(`Optimizing ${files.length} models...`)
for (const file of files) {
  const input = join(modelsDir, file)
  const output = join(outDir, file)
  console.log(`  ${file}`)
  execSync(
    `npx @gltf-transform/cli optimize "${input}" "${output}" --compress meshopt`,
    { stdio: 'inherit', cwd: join(__dirname, '..') }
  )
}

console.log('\nDone! Optimized models in:', outDir)
console.log('Run: cp -r public/Models-optimized/* public/Models/  (or manually replace)')
