import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore } from '../store/appStore'
import { usePortfolioData } from '../hooks/usePortfolioData'
import { resolveSections } from '../lib/resolvedSections'
import type { PerformanceTier } from '../hooks/usePerformanceTier'

const PANEL_MAX_W = 560
const PANEL_MAX_H = 700

function getSectionNames(data: any): string[] {
  const sectionRadius = typeof data?.scene?.sectionRadius === 'number' ? data.scene.sectionRadius : 52
  const sections = resolveSections(data, sectionRadius)
  return sections.map((s) => s.name)
}

export function StatueIndicatorUpdater({ performanceTier = 'high' }: { performanceTier?: PerformanceTier }) {
  const { camera, size } = useThree()
  const setStatueIndicators = useAppStore((state) => state.setStatueIndicators)
  const setFocusedStatueScreenPos = useAppStore((state) => state.setFocusedStatueScreenPos)
  const focusedSection = useAppStore((state) => state.focusedSection)
  const { data } = usePortfolioData()
  const worldPos = new THREE.Vector3()
  const projected = new THREE.Vector3()
  const frameSkip = useRef(0)

  const sectionNames = getSectionNames(data ?? {})

  useFrame((state) => {
    if (performanceTier === 'low') {
      frameSkip.current++
      if (frameSkip.current % 4 !== 0) return
    }
    const player = state.scene.getObjectByName('player')
    if (!player) return

    const playerPos = player.position
    const halfW = size.width / 2
    const halfH = size.height / 2
    const margin = 12

    const indicators: { label: string; screenX: number; screenY: number; angle: number; visible: boolean; distance: number }[] = []

    sectionNames.forEach((name: string) => {
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

    // Update focused statue panel screen position (position near statue, clamped to viewport)
    if (focusedSection) {
      const obj = state.scene.getObjectByName(`statue-${focusedSection}`)
      if (obj) {
        obj.getWorldPosition(worldPos)
        projected.copy(worldPos).project(camera)
        let screenX = (projected.x * 0.5 + 0.5) * size.width
        let screenY = (-projected.y * 0.5 + 0.5) * size.height
        const panelW = Math.min(size.width * 0.96, PANEL_MAX_W)
        const panelH = Math.min(size.height * 0.9, PANEL_MAX_H)
        const margin = 12
        screenX = THREE.MathUtils.clamp(screenX, panelW / 2 + margin, size.width - panelW / 2 - margin)
        screenY = THREE.MathUtils.clamp(screenY, panelH / 2 + margin, size.height - panelH / 2 - margin)
        setFocusedStatueScreenPos({ x: screenX, y: screenY })
      } else {
        setFocusedStatueScreenPos(null)
      }
    } else {
      setFocusedStatueScreenPos(null)
    }
  })

  return null
}
