import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { CapsuleCollider, RigidBody, RapierRigidBody, useRapier } from '@react-three/rapier'
import * as THREE from 'three'
import { useAppStore } from '../store/appStore'

const DEFAULT_WALK_SPEED = 5
const DEFAULT_RUN_SPEED = 10
const DEFAULT_JUMP_FORCE = 5
const MOVE_ACCEL = 24
const CAMERA_SMOOTH = 12
const RAYCAST_SMOOTH = 8
const MIN_CAMERA_DISTANCE = 4.5
const MAX_CAMERA_DISTANCE = 20
const MOBILE_MIN_CAMERA_DISTANCE = 8
const MOBILE_MAX_CAMERA_DISTANCE = 28
const ROTATION_SENSITIVITY = 0.005
const ZOOM_SENSITIVITY = 0.1

const Player = ({ characterConfig }: { characterConfig?: any }) => {
  const rb = useRef<RapierRigidBody>(null)
  const meshRef = useRef<THREE.Group>(null)
  const [, getKeys] = useKeyboardControls()
  const respawnCount = useAppStore((state) => state.respawnCount)
  const focusedSection = useAppStore((state) => state.focusedSection)
  const { world } = useRapier()
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  const walkSpeed = typeof characterConfig?.walkSpeed === 'number' ? characterConfig.walkSpeed : DEFAULT_WALK_SPEED
  const runSpeed = typeof characterConfig?.runSpeed === 'number' ? characterConfig.runSpeed : DEFAULT_RUN_SPEED
  const jumpForce = typeof characterConfig?.jumpForce === 'number' ? characterConfig.jumpForce : DEFAULT_JUMP_FORCE
  const minCamDistance = isMobile ? MOBILE_MIN_CAMERA_DISTANCE : MIN_CAMERA_DISTANCE
  const maxCamDistance = isMobile ? MOBILE_MAX_CAMERA_DISTANCE : MAX_CAMERA_DISTANCE

  // Camera Orbit State
  const rotation = useRef({ x: 0, y: Math.PI }) // Orbit angles (smoothed)
  const rotationTarget = useRef({ x: 0, y: Math.PI }) // Target for touch smoothing
  const distance = useRef(isMobile ? 14 : 10) // Camera distance
  const isDragging = useRef(false)
  const lookTouchId = useRef<number | null>(null)
  const moveTouchId = useRef<number | null>(null)
  const lookLast = useRef({ x: 0, y: 0 })
  const moveStart = useRef({ x: 0, y: 0 })
  const mobileMove = useRef({ x: 0, y: 0 })

  // Handle Mouse Inputs for Camera
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => { if (e.button === 0) isDragging.current = true }
    const handleMouseUp = () => { isDragging.current = false }
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        rotationTarget.current.y -= e.movementX * ROTATION_SENSITIVITY
        rotationTarget.current.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 6, rotationTarget.current.x - e.movementY * ROTATION_SENSITIVITY))
      }
    }
    const handleWheel = (e: WheelEvent) => {
      if (!focusedSection) {
        distance.current = Math.max(minCamDistance, Math.min(maxCamDistance, distance.current + e.deltaY * ZOOM_SENSITIVITY * 0.01))
      }
    }
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
    const joyRadius = 56

    const handleTouchStart = (e: TouchEvent) => {
      if (focusedSection) return
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]
        if (lookTouchId.current == null && t.clientX > window.innerWidth * 0.45) {
          lookTouchId.current = t.identifier
          lookLast.current = { x: t.clientX, y: t.clientY }
          continue
        }
        if (moveTouchId.current == null) {
          moveTouchId.current = t.identifier
          moveStart.current = { x: t.clientX, y: t.clientY }
          mobileMove.current = { x: 0, y: 0 }
        }
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (focusedSection) return
      let consumed = false
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]
        if (lookTouchId.current != null && t.identifier === lookTouchId.current) {
          const dx = t.clientX - lookLast.current.x
          const dy = t.clientY - lookLast.current.y
          lookLast.current = { x: t.clientX, y: t.clientY }
          rotationTarget.current.y -= dx * ROTATION_SENSITIVITY
          rotationTarget.current.x = clamp(rotationTarget.current.x - dy * ROTATION_SENSITIVITY, -Math.PI / 3, Math.PI / 6)
          consumed = true
        } else if (moveTouchId.current != null && t.identifier === moveTouchId.current) {
          const dx = t.clientX - moveStart.current.x
          const dy = t.clientY - moveStart.current.y
          const len = Math.hypot(dx, dy) || 1
          const clampedLen = Math.min(joyRadius, len)
          const nx = (dx / len) * (clampedLen / joyRadius)
          const ny = (dy / len) * (clampedLen / joyRadius)
          mobileMove.current = { x: nx, y: ny }
          consumed = true
        }
      }
      if (consumed) e.preventDefault()
    }

    const endTouchId = (id: number) => {
      if (lookTouchId.current === id) lookTouchId.current = null
      if (moveTouchId.current === id) {
        moveTouchId.current = null
        mobileMove.current = { x: 0, y: 0 }
      }
    }
    const handleTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) endTouchId(e.changedTouches[i].identifier)
    }
    const handleTouchCancel = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) endTouchId(e.changedTouches[i].identifier)
    }

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('wheel', handleWheel)
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    window.addEventListener('touchcancel', handleTouchCancel, { passive: true })
    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('touchcancel', handleTouchCancel)
    }
  }, [focusedSection, minCamDistance, maxCamDistance])
  
  const moveVec = useMemo(() => new THREE.Vector3(), [])
  const camDir = useMemo(() => new THREE.Vector3(), [])
  const camSide = useMemo(() => new THREE.Vector3(), [])
  const playerPos = useMemo(() => new THREE.Vector3(), [])
  const idealCamPos = useMemo(() => new THREE.Vector3(), [])
  const rayDir = useMemo(() => new THREE.Vector3(), [])
  const lookTargetVec = useMemo(() => new THREE.Vector3(), [])
  const raycastAccumulator = useRef(0)
  const lastHitDistance = useRef<number | null>(null)
  const smoothedPlayerPos = useRef(new THREE.Vector3(0, 3.2, 0))
  const smoothedHitDistance = useRef<number | null>(null)

  // Handle Respawn
  useEffect(() => {
    if (rb.current) {
        rb.current.setTranslation({ x: 0, y: 2, z: 0 }, true)
        rb.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
    }
  }, [respawnCount])

  useFrame((state, delta) => {
    if (!rb.current || !meshRef.current) return

    // Cap delta to avoid camera/lerp spikes on tab switch or frame drops
    const dt = Math.min(delta, 0.05)

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

        state.camera.position.lerp(targetPos, 4 * dt)
        
        // Look directly at the center of the 3D quad (at 2.5m)
        const lookTarget = worldPos.clone().add(new THREE.Vector3(6, 2.5, 0))
        lookTarget.add(new THREE.Vector3(parallaxX * 0.5, parallaxY * 0.5, 0))

        const q1 = state.camera.quaternion.clone()
        state.camera.lookAt(lookTarget)
        const q2 = state.camera.quaternion.clone()
        state.camera.quaternion.copy(q1)
        state.camera.quaternion.slerp(q2, 4 * dt)
      }
      
      rb.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
      return
    }

    // Smooth camera rotation (reduces touch jitter on mobile)
    const rotSmooth = 1 - Math.exp(-15 * dt)
    rotation.current.x = THREE.MathUtils.lerp(rotation.current.x, rotationTarget.current.x, rotSmooth)
    rotation.current.y = THREE.MathUtils.lerp(rotation.current.y, rotationTarget.current.y, rotSmooth)

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
    if (Math.abs(mobileMove.current.y) > 0.02) moveVec.addScaledVector(camDir, -mobileMove.current.y)
    if (Math.abs(mobileMove.current.x) > 0.02) moveVec.addScaledVector(camSide, mobileMove.current.x)
    
    if (moveVec.lengthSq() > 0) {
      moveVec.normalize()
      
      // Rotate mesh to face movement direction
      const targetRotation = Math.atan2(moveVec.x, moveVec.z)
      
      // Handle rotation wrap around
      let diff = targetRotation - meshRef.current.rotation.y
      while (diff < -Math.PI) diff += Math.PI * 2
      while (diff > Math.PI) diff -= Math.PI * 2
      
      meshRef.current.rotation.y += diff * 10 * dt
    }

    const speed = sprint ? runSpeed : walkSpeed
    const currentVel = rb.current.linvel()

    // Blend velocity for smooth acceleration; use higher factor when moving to avoid "push back" lag
    const hasInput = moveVec.lengthSq() > 0.01
    const blend = hasInput ? Math.min(1, MOVE_ACCEL * dt) : Math.min(1, 12 * dt)
    const targetVx = moveVec.x * speed
    const targetVz = moveVec.z * speed
    const smoothVx = THREE.MathUtils.lerp(currentVel.x, targetVx, blend)
    const smoothVz = THREE.MathUtils.lerp(currentVel.z, targetVz, blend)

    rb.current.setLinvel({
      x: smoothVx,
      y: jump && Math.abs(currentVel.y) < 0.1 ? jumpForce : currentVel.y,
      z: smoothVz
    }, true)

    // Camera orbit logic with collision
    const playerPosRaw = rb.current.translation()
    playerPos.set(playerPosRaw.x, playerPosRaw.y + 1.2, playerPosRaw.z)

    // Smooth player position for camera to eliminate physics jitter (exponential smoothing)
    const smoothFactor = 1 - Math.exp(-CAMERA_SMOOTH * dt)
    smoothedPlayerPos.current.lerp(playerPos, smoothFactor)

    idealCamPos.set(
      smoothedPlayerPos.current.x + Math.sin(rotation.current.y) * Math.cos(rotation.current.x) * distance.current,
      smoothedPlayerPos.current.y + Math.sin(rotation.current.x) * distance.current,
      smoothedPlayerPos.current.z + Math.cos(rotation.current.y) * Math.cos(rotation.current.x) * distance.current
    )

    // Raycast from player to camera to detect walls/floor
    rayDir.subVectors(idealCamPos, smoothedPlayerPos.current).normalize()
    const rayLength = smoothedPlayerPos.current.distanceTo(idealCamPos)

    // Raycast every ~33ms instead of every frame to cut CPU spikes.
    raycastAccumulator.current += dt
    if (raycastAccumulator.current >= 1 / 30) {
      raycastAccumulator.current = 0
      const hit = world.castRay(
        // @ts-ignore - types can be tricky between versions
        { origin: smoothedPlayerPos.current, dir: rayDir },
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

    // Smooth raycast hit distance to avoid camera jumps when result changes
    const hitSmooth = 1 - Math.exp(-RAYCAST_SMOOTH * dt)
    if (lastHitDistance.current != null) {
      const targetDist = lastHitDistance.current * 0.85
      smoothedHitDistance.current = smoothedHitDistance.current == null
        ? targetDist
        : THREE.MathUtils.lerp(smoothedHitDistance.current, targetDist, hitSmooth)
    } else {
      smoothedHitDistance.current = smoothedHitDistance.current == null
        ? rayLength
        : THREE.MathUtils.lerp(smoothedHitDistance.current, rayLength, hitSmooth * 0.5)
    }

    const finalCamPos = idealCamPos.clone()
    if (smoothedHitDistance.current != null && smoothedHitDistance.current < rayLength * 0.99) {
      finalCamPos.copy(smoothedPlayerPos.current).addScaledVector(rayDir, smoothedHitDistance.current)
    }

    // Floor safety
    finalCamPos.y = Math.max(0.1, finalCamPos.y)

    // Exponential camera lerp for smooth follow (frame-rate independent)
    const camSmooth = 1 - Math.exp(-10 * dt)
    state.camera.position.lerp(finalCamPos, camSmooth)
    // Look at actual player position (not smoothed) so view doesn't lag behind when accelerating
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
