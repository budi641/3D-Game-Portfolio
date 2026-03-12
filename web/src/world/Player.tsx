import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { CapsuleCollider, RigidBody, RapierRigidBody, useRapier } from '@react-three/rapier'
import * as THREE from 'three'
import { useAppStore } from '../store/appStore'

const WALK_SPEED = 5
const RUN_SPEED = 10
const JUMP_FORCE = 5
const MOVE_ACCEL = 16
const MIN_CAMERA_DISTANCE = 4.5
const MAX_CAMERA_DISTANCE = 20
const ROTATION_SENSITIVITY = 0.005
const ZOOM_SENSITIVITY = 0.1

const Player = () => {
  const rb = useRef<RapierRigidBody>(null)
  const meshRef = useRef<THREE.Group>(null)
  const [, getKeys] = useKeyboardControls()
  const respawnCount = useAppStore((state) => state.respawnCount)
  const focusedSection = useAppStore((state) => state.focusedSection)
  const { world } = useRapier()

  // Camera Orbit State
  const rotation = useRef({ x: 0, y: Math.PI }) // Orbit angles
  const distance = useRef(10) // Camera distance
  const isDragging = useRef(false)

  // Handle Mouse Inputs for Camera
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => { if (e.button === 0) isDragging.current = true }
    const handleMouseUp = () => { isDragging.current = false }
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        rotation.current.y -= e.movementX * ROTATION_SENSITIVITY
        rotation.current.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 6, rotation.current.x - e.movementY * ROTATION_SENSITIVITY))
      }
    }
    const handleWheel = (e: WheelEvent) => {
      if (!focusedSection) {
        distance.current = Math.max(MIN_CAMERA_DISTANCE, Math.min(MAX_CAMERA_DISTANCE, distance.current + e.deltaY * ZOOM_SENSITIVITY * 0.01))
      }
    }

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('wheel', handleWheel)
    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('wheel', handleWheel)
    }
  }, [focusedSection])
  
  const moveVec = useMemo(() => new THREE.Vector3(), [])
  const camDir = useMemo(() => new THREE.Vector3(), [])
  const camSide = useMemo(() => new THREE.Vector3(), [])
  const playerPos = useMemo(() => new THREE.Vector3(), [])
  const idealCamPos = useMemo(() => new THREE.Vector3(), [])
  const rayDir = useMemo(() => new THREE.Vector3(), [])
  const lookTargetVec = useMemo(() => new THREE.Vector3(), [])
  const raycastAccumulator = useRef(0)
  const lastHitDistance = useRef<number | null>(null)

  // Handle Respawn
  useEffect(() => {
    if (rb.current) {
        rb.current.setTranslation({ x: 0, y: 2, z: 0 }, true)
        rb.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
    }
  }, [respawnCount])

  useFrame((state, delta) => {
    if (!rb.current || !meshRef.current) return

    // If focusing on a section, interpolate camera and freeze player
    if (focusedSection) {
      const sectionObject = state.scene.getObjectByName(`statue-${focusedSection}`)
      
      if (sectionObject) {
        const worldPos = new THREE.Vector3()
        sectionObject.getWorldPosition(worldPos)
        
        // Target position: Framing the quad at a higher comfortable level
        const targetPos = worldPos.clone().add(new THREE.Vector3(6, 3.0, 10)) 
        
        // Add subtle parallax
        const parallaxX = (Math.sin(rotation.current.y) * 1)
        const parallaxY = (rotation.current.x * 1.5)
        targetPos.add(new THREE.Vector3(parallaxX, parallaxY, 0))

        state.camera.position.lerp(targetPos, 4 * delta)
        
        // Look directly at the center of the 3D quad (at 2.5m)
        const lookTarget = worldPos.clone().add(new THREE.Vector3(6, 2.5, 0))
        lookTarget.add(new THREE.Vector3(parallaxX * 0.5, parallaxY * 0.5, 0))

        const q1 = state.camera.quaternion.clone()
        state.camera.lookAt(lookTarget)
        const q2 = state.camera.quaternion.clone()
        state.camera.quaternion.copy(q1)
        state.camera.quaternion.slerp(q2, 4 * delta)
      }
      
      rb.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
      return
    }

    const { forward, backward, left, right, jump, sprint } = getKeys()
    
    // Get camera directions (flattened to XZ plane)
    state.camera.getWorldDirection(camDir)
    camDir.y = 0
    camDir.normalize()
    
    camSide.set(-camDir.z, 0, camDir.x) // Perpendicular to camDir
    
    // Calculate movement vector
    moveVec.set(0, 0, 0)
    if (forward) moveVec.add(camDir)
    if (backward) moveVec.sub(camDir)
    if (left) moveVec.sub(camSide)
    if (right) moveVec.add(camSide)
    
    if (moveVec.lengthSq() > 0) {
      moveVec.normalize()
      
      // Rotate mesh to face movement direction
      const targetRotation = Math.atan2(moveVec.x, moveVec.z)
      
      // Handle rotation wrap around
      let diff = targetRotation - meshRef.current.rotation.y
      while (diff < -Math.PI) diff += Math.PI * 2
      while (diff > Math.PI) diff -= Math.PI * 2
      
      meshRef.current.rotation.y += diff * 10 * delta
    }

    const speed = sprint ? RUN_SPEED : WALK_SPEED
    const currentVel = rb.current.linvel()

    // Smooth horizontal velocity to reduce physics jitter.
    const blend = Math.min(1, MOVE_ACCEL * delta)
    const targetVx = moveVec.x * speed
    const targetVz = moveVec.z * speed
    const smoothVx = THREE.MathUtils.lerp(currentVel.x, targetVx, blend)
    const smoothVz = THREE.MathUtils.lerp(currentVel.z, targetVz, blend)

    rb.current.setLinvel({
      x: smoothVx,
      y: jump && Math.abs(currentVel.y) < 0.1 ? JUMP_FORCE : currentVel.y,
      z: smoothVz
    }, true)

    // Camera orbit logic with collision
    const playerPosRaw = rb.current.translation()
    playerPos.set(playerPosRaw.x, playerPosRaw.y + 1.2, playerPosRaw.z)
    idealCamPos.set(
      playerPos.x + Math.sin(rotation.current.y) * Math.cos(rotation.current.x) * distance.current,
      playerPos.y + Math.sin(rotation.current.x) * distance.current,
      playerPos.z + Math.cos(rotation.current.y) * Math.cos(rotation.current.x) * distance.current
    )

    // Raycast from player to camera to detect walls/floor
    rayDir.subVectors(idealCamPos, playerPos).normalize()
    const rayLength = playerPos.distanceTo(idealCamPos)

    // Raycast every ~33ms instead of every frame to cut CPU spikes.
    raycastAccumulator.current += delta
    if (raycastAccumulator.current >= 1 / 30) {
      raycastAccumulator.current = 0
      const hit = world.castRay(
        // @ts-ignore - types can be tricky between versions
        { origin: playerPos, dir: rayDir },
        rayLength,
        true,
        undefined,
        undefined,
        undefined,
        rb.current // Exclude player
      )
      if (hit) {
        // @ts-ignore
        lastHitDistance.current = hit.timeOfImpact || hit.toi || rayLength
      } else {
        lastHitDistance.current = null
      }
    }

    const finalCamPos = idealCamPos.clone()
    if (lastHitDistance.current != null) {
      finalCamPos.copy(playerPos).addScaledVector(rayDir, lastHitDistance.current * 0.85) // Stay comfortably in front of hit
    }

    // Floor safety
    finalCamPos.y = Math.max(0.1, finalCamPos.y)

    state.camera.position.lerp(finalCamPos, delta * 10)
    lookTargetVec.set(playerPos.x, playerPos.y - 0.2, playerPos.z)
    state.camera.lookAt(lookTargetVec)
  })

  return (
    <RigidBody
      ref={rb}
      colliders={false}
      enabledRotations={[false, false, false]}
      position={[0, 2, 0]}
      type="dynamic"
      name="player"
      friction={0}
    >
      <CapsuleCollider args={[0.5, 0.5]} />
      
      <group ref={meshRef}>
        <mesh castShadow position={[0, 0, 0]}>
          <capsuleGeometry args={[0.5, 1, 4, 16]} />
          <meshStandardMaterial color="#3b82f6" wireframe />
        </mesh>
      </group>
    </RigidBody>
  )
}

export default Player
