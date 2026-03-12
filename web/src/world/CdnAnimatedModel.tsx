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
}

function configureMaterial(material: THREE.Material, doubleSided: boolean, forceOpaque: boolean) {
  const m = material as THREE.MeshStandardMaterial
  m.side = doubleSided ? THREE.DoubleSide : THREE.FrontSide

  // Optional hard fix: force opaque rendering to avoid section/material draw-order artifacts.
  if (forceOpaque) {
    m.transparent = false
    m.depthWrite = true
    m.alphaTest = 0
  }
  m.depthTest = true

  m.needsUpdate = true
}

function splitMultiMaterialMesh(mesh: THREE.Mesh, doubleSided: boolean, forceOpaque: boolean) {
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

    const mat = sourceMat.clone()
    configureMaterial(mat, doubleSided, forceOpaque)

    const part = new THREE.Mesh(geom, mat)
    part.castShadow = mesh.castShadow
    part.receiveShadow = mesh.receiveShadow
    part.frustumCulled = false
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

      mesh.castShadow = true
      mesh.receiveShadow = true
      // Some imported GLBs have incorrect/too-small bounds causing faces to disappear.
      mesh.frustumCulled = false
      if (!mesh.geometry.attributes.normal) {
        mesh.geometry.computeVertexNormals()
      }

      const split = splitMultiMaterialMesh(mesh, doubleSided, forceOpaque)
      if (split) {
        splitOperations.push({ original: mesh, replacement: split })
        return
      }

      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map((m) => {
          const material = m.clone()
          configureMaterial(material, doubleSided, forceOpaque)
          return material
        })
      } else if (mesh.material) {
        mesh.material = mesh.material.clone()
        configureMaterial(mesh.material, doubleSided, forceOpaque)
      }
    })

    splitOperations.forEach(({ original, replacement }) => {
      const parent = original.parent
      if (!parent) return
      parent.add(replacement)
      parent.remove(original)
    })

    return cloned
  }, [gltf.scene, doubleSided, forceOpaque])

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

