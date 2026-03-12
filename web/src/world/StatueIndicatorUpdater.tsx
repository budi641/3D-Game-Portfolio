import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore } from '../store/appStore'
import { usePortfolioData } from '../hooks/usePortfolioData'
import type { PerformanceTier } from '../hooks/usePerformanceTier'

const DEFAULT_SECTION_NAMES = ['Projects', 'Work', 'Skills', 'Education', 'Contact', 'About', 'Blog']

function getSectionNames(data: any): string[] {
  const sceneSections = Array.isArray(data?.scene?.sectionStatues) && data.scene.sectionStatues.length > 0
    ? data.scene.sectionStatues
    : null
  const list = sceneSections || (data?.sections?.length > 0 ? data.sections : DEFAULT_SECTION_NAMES.map((n) => ({ name: n })))
  return list.map((s: any) => s.name || s.label || s.title || 'Unknown')
}

export function StatueIndicatorUpdater({ performanceTier = 'high' }: { performanceTier?: PerformanceTier }) {
  const { camera, size } = useThree()
  const setStatueIndicators = useAppStore((state) => state.setStatueIndicators)
  const { data } = usePortfolioData()
  const worldPos = new THREE.Vector3()
  const projected = new THREE.Vector3()
  const frameSkip = useRef(0)

  const sectionNames = data ? getSectionNames(data) : DEFAULT_SECTION_NAMES

  useFrame((state) => {
    if (performanceTier === 'low') {
      frameSkip.current++
      if (frameSkip.current % 3 !== 0) return
    }
    const player = state.scene.getObjectByName('player')
    if (!player) return

    const playerPos = player.position
    const halfW = size.width / 2
    const halfH = size.height / 2
    const margin = 12

    const indicators: { label: string; screenX: number; screenY: number; angle: number; visible: boolean; distance: number }[] = []

    sectionNames.forEach((name) => {
      const obj = state.scene.getObjectByName(`statue-${name}`)
      if (!obj) return

      obj.getWorldPosition(worldPos)
      projected.copy(worldPos).project(camera)
      const screenX = (projected.x * 0.5 + 0.5) * size.width
      const screenY = (-projected.y * 0.5 + 0.5) * size.height
      const distance = playerPos.distanceTo(worldPos)

      const onScreen = projected.z >= -1 && projected.z <= 1 && screenX >= 0 && screenX <= size.width && screenY >= 0 && screenY <= size.height

      if (onScreen) {
        indicators.push({
          label: name.toUpperCase(),
          screenX,
          screenY,
          angle: 0,
          visible: true,
          distance,
        })
      } else {
        const dx = screenX - halfW
        const dy = screenY - halfH
        const angle = Math.atan2(dx, -dy)
        const maxDist = Math.max(halfW - margin, halfH - margin, 1)
        const dist = Math.hypot(dx, dy) || 1
        const scale = maxDist / dist
        const finalX = halfW + dx * scale
        const finalY = halfH + dy * scale

        indicators.push({
          label: name.toUpperCase(),
          screenX: finalX,
          screenY: finalY,
          angle: (angle * 180) / Math.PI,
          visible: true,
          distance,
        })
      }
    })

    setStatueIndicators(indicators)
  })

  return null
}
