import { useEffect, useMemo, useRef } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'
interface CdnAnimatedModelProps {
  url: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number | [number, number, number]
  playAnimation?: boolean
  doubleSided?: boolean
  clipName?: string
  forceOpaque?: boolean
  renderStyle?: 'pbr' | 'cel'
}

function toToonMaterial(source: THREE.MeshStandardMaterial, doubleSided: boolean, forceOpaque: boolean): THREE.MeshToonMaterial {
  const m = new THREE.MeshToonMaterial({
    color: source.color?.clone() ?? 0xffffff,
    map: source.map,
    gradientMap: null,
    side: doubleSided ? THREE.DoubleSide : THREE.FrontSide,
    transparent: !forceOpaque && source.transparent,
    opacity: source.opacity,
  })
  if (forceOpaque) {
    m.transparent = false
    m.depthWrite = true
    m.alphaTest = 0
  }
  m.depthTest = true
  return m
}

function configureMaterial(material: THREE.Material, doubleSided: boolean, forceOpaque: boolean, renderStyle?: 'pbr' | 'cel') {
  const std = material as THREE.MeshStandardMaterial
  if (renderStyle === 'cel' && std.isMeshStandardMaterial) {
    return toToonMaterial(std, doubleSided, forceOpaque)
  }
  std.side = doubleSided ? THREE.DoubleSide : THREE.FrontSide
  if (forceOpaque) {
    std.transparent = false
    std.depthWrite = true
    std.alphaTest = 0
  }
  std.depthTest = true
  std.needsUpdate = true
  return std
}

function splitMultiMaterialMesh(mesh: THREE.Mesh, doubleSided: boolean, forceOpaque: boolean, renderStyle?: 'pbr' | 'cel') {
  if (!Array.isArray(mesh.material)) return null
  if ((mesh as any).isSkinnedMesh) return null

  const sourceMaterials = mesh.material
  const sourceGroups = mesh.geometry.groups
  if (!sourceGroups?.length) return null

  const container = new THREE.Group()
  container.name = `${mesh.name || 'mesh'}_split`
  container.position.copy(mesh.position)
  container.quaternion.copy(mesh.quaternion)
  container.scale.copy(mesh.scale)
  container.castShadow = mesh.castShadow
  container.receiveShadow = mesh.receiveShadow
  container.renderOrder = mesh.renderOrder

  sourceMaterials.forEach((sourceMat, matIndex) => {
    const groupsForMaterial = sourceGroups.filter((g) => g.materialIndex === matIndex)
    if (!groupsForMaterial.length) return

    const geom = mesh.geometry.clone()
    geom.clearGroups()
    groupsForMaterial.forEach((g) => geom.addGroup(g.start, g.count, 0))

    const cloned = sourceMat.clone()
    const matToUse = configureMaterial(cloned, doubleSided, forceOpaque, renderStyle)

    const part = new THREE.Mesh(geom, matToUse)
    part.castShadow = mesh.castShadow
    part.receiveShadow = mesh.receiveShadow
    part.renderOrder = mesh.renderOrder + matIndex
    container.add(part)
  })

  return container.children.length ? container : null
}

const CdnAnimatedModel = ({
  url,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  playAnimation = true,
  doubleSided = true,
  clipName,
  forceOpaque = true,
  renderStyle = 'cel',
}: CdnAnimatedModelProps) => {
  const group = useRef<THREE.Group>(null)
  const gltf = useGLTF(url)
  const scene = useMemo(() => {
    // Clone to safely support skinned + multi-material GLBs in multiple instances.
    const cloned = cloneSkeleton(gltf.scene) as THREE.Group
    const splitOperations: Array<{ original: THREE.Mesh; replacement: THREE.Group }> = []

    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return

      mesh.frustumCulled = true
      mesh.castShadow = true
      mesh.receiveShadow = true
      if (!mesh.geometry.attributes.normal) {
        mesh.geometry.computeVertexNormals()
      }

      const split = splitMultiMaterialMesh(mesh, doubleSided, forceOpaque, renderStyle)
      if (split) {
        splitOperations.push({ original: mesh, replacement: split })
        return
      }

      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map((m) => {
          const cloned = m.clone()
          return configureMaterial(cloned, doubleSided, forceOpaque, renderStyle) as THREE.Material
        })
      } else if (mesh.material) {
        const cloned = mesh.material.clone()
        mesh.material = configureMaterial(cloned, doubleSided, forceOpaque, renderStyle) as THREE.Material
      }
    })

    splitOperations.forEach(({ original, replacement }) => {
      const parent = original.parent
      if (!parent) return
      parent.add(replacement)
      parent.remove(original)
    })

    return cloned
  }, [gltf.scene, doubleSided, forceOpaque, renderStyle])

  const { actions, names } = useAnimations(gltf.animations, scene)

  useEffect(() => {
    if (!names.length) return
    const selectedName = clipName && names.includes(clipName) ? clipName : names[0]
    const selected = actions[selectedName]

    Object.entries(actions).forEach(([name, action]) => {
      if (!action) return
      if (!playAnimation || name !== selectedName) {
        action.stop()
      }
    })

    if (playAnimation) {
      selected?.reset().fadeIn(0.2).play()
    }

    return () => {
      selected?.fadeOut(0.2)
    }
  }, [actions, names, playAnimation, clipName])

  return (
    <group ref={group} position={position} rotation={rotation} scale={scale}>
      <primitive object={scene} />
    </group>
  )
}

export default CdnAnimatedModel

