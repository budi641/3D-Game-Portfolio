import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import type { PerformanceTier } from '../hooks/usePerformanceTier'
import { useKeyboardControls } from '@react-three/drei'
import { CapsuleCollider, RigidBody, RapierRigidBody, useRapier, useBeforePhysicsStep } from '@react-three/rapier'
import * as THREE from 'three'
import { useAppStore } from '../store/appStore'

const DEFAULT_WALK_SPEED = 5
const DEFAULT_RUN_SPEED = 10
const VELOCITY_SMOOTH = 10
const CAMERA_SMOOTH = 14
const CAMERA_LERP = 8
const RAYCAST_SMOOTH = 8
const ROTATION_LERP = 14
const DELTA_CLAMP = 0.1
const FIXED_STEP = 1 / 60
const GROUND_RAY_LENGTH = 1.5
const MAX_CAMERA_DISTANCE = 20
const MOBILE_MAX_CAMERA_DISTANCE = 28
const ROTATION_SENSITIVITY = 0.005
const Player = ({ characterConfig, performanceTier = 'high' }: { characterConfig?: any; performanceTier?: PerformanceTier }) => {
  const rb = useRef<RapierRigidBody>(null)
  const meshRef = useRef<THREE.Group>(null)
  const [, getKeys] = useKeyboardControls()
  const respawnCount = useAppStore((state) => state.respawnCount)
  const focusedSection = useAppStore((state) => state.focusedSection)
  const { world } = useRapier()
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  const parseSpeed = (v: unknown, fallback: number) => {
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) return v
    const n = Number(v)
    return Number.isFinite(n) && n > 0 ? n : fallback
  }
  const walkSpeed = parseSpeed(characterConfig?.walkSpeed, DEFAULT_WALK_SPEED)
  const runSpeed = parseSpeed(characterConfig?.runSpeed, DEFAULT_RUN_SPEED)
  const maxCamDistance = isMobile ? MOBILE_MAX_CAMERA_DISTANCE : MAX_CAMERA_DISTANCE

  // Camera Orbit State - distance fixed at max (no scroll zoom)
  const rotation = useRef({ x: 0, y: Math.PI }) // Orbit angles (smoothed)
  const rotationTarget = useRef({ x: 0, y: Math.PI }) // Target for touch smoothing
  const distance = useRef(maxCamDistance) // Static at max; no scroll adjustment
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
    // Scroll wheel zoom removed - camera distance is static at max
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
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    window.addEventListener('touchcancel', handleTouchCancel, { passive: true })
    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('touchcancel', handleTouchCancel)
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
  const smoothedPlayerPos = useRef(new THREE.Vector3(0, 3.2, 0))
  const smoothedHitDistance = useRef<number | null>(null)
  const velocityXZ = useRef(new THREE.Vector2(0, 0))
  const velocityY = useRef(0)
  const lookTargetSmooth = useRef(new THREE.Vector3(0, 3, 0))
  const finalCamPosRef = useRef(new THREE.Vector3())
  const focusTargetPos = useMemo(() => new THREE.Vector3(), [])
  const focusLookTarget = useMemo(() => new THREE.Vector3(), [])

  // Movement input computed in useFrame, consumed in useBeforePhysicsStep
  const targetVelXZ = useRef({ x: 0, z: 0 })

  useEffect(() => {
    if (rb.current) {
      rb.current.setTranslation({ x: 0, y: 2, z: 0 }, true)
      velocityXZ.current.set(0, 0)
      velocityY.current = 0
    }
  }, [respawnCount])

  // Run BEFORE physics step: apply movement with fixed timestep (no physics jitter)
  useBeforePhysicsStep(() => {
    if (!rb.current) return
    const pos = rb.current.translation()
    if (useAppStore.getState().focusedSection) {
      rb.current.setNextKinematicTranslation({ x: pos.x, y: pos.y, z: pos.z })
      return
    }
    const x = pos.x
    const y = pos.y
    const z = pos.z

    // Smooth velocity toward target
    velocityXZ.current.x = THREE.MathUtils.lerp(velocityXZ.current.x, targetVelXZ.current.x, VELOCITY_SMOOTH * FIXED_STEP)
    velocityXZ.current.y = THREE.MathUtils.lerp(velocityXZ.current.y, targetVelXZ.current.z, VELOCITY_SMOOTH * FIXED_STEP)

    // Ground check: raycast down from capsule bottom (body center - 1)
    const rayOrigin = { x, y: y - 1, z }
    const rayDir = { x: 0, y: -1, z: 0 }
    const hit = world.castRay(
      // @ts-ignore
      { origin: rayOrigin, dir: rayDir },
      GROUND_RAY_LENGTH,
      true,
      undefined,
      undefined,
      undefined,
      rb.current
    )
    const toi = hit != null ? (hit.timeOfImpact ?? (hit as any).toi ?? 999) : 999
    const grounded = toi < GROUND_RAY_LENGTH - 0.01

    if (grounded) {
      velocityY.current = 0
      // Capsule bottom at ground: body.y = (y-1) - toi + 1 = y - toi
      const groundY = y - toi
      rb.current.setNextKinematicTranslation({
        x: x + velocityXZ.current.x * FIXED_STEP,
        y: groundY,
        z: z + velocityXZ.current.y * FIXED_STEP
      })
    } else {
      velocityY.current -= 9.81 * FIXED_STEP
      rb.current.setNextKinematicTranslation({
        x: x + velocityXZ.current.x * FIXED_STEP,
        y: y + velocityY.current * FIXED_STEP,
        z: z + velocityXZ.current.y * FIXED_STEP
      })
    }
  })

  // Run early (priority -1) so input is ready before physics step
  useFrame((state, delta) => {
    if (!rb.current || !meshRef.current) return

    const dt = Math.min(delta, DELTA_CLAMP)

    if (focusedSection) {
      const sectionObject = state.scene.getObjectByName(`statue-${focusedSection}`)
      if (sectionObject) {
        sectionObject.getWorldPosition(focusTargetPos)
        const parallaxX = Math.sin(rotation.current.y)
        const parallaxY = rotation.current.x * 1.5
        focusTargetPos.x += 6 + parallaxX
        focusTargetPos.y += 3
        focusTargetPos.z += 10

        focusLookTarget.set(
          focusTargetPos.x - parallaxX * 0.5,
          focusTargetPos.y - 0.5 - parallaxY * 0.5,
          focusTargetPos.z - 10
        )

        state.camera.position.lerp(focusTargetPos, 6 * dt)
        const q1 = state.camera.quaternion.clone()
        state.camera.lookAt(focusLookTarget)
        const q2 = state.camera.quaternion.clone()
        state.camera.quaternion.copy(q1).slerp(q2, 6 * dt)
      }
      return
    }

    // Smooth camera rotation (reduces touch jitter on mobile)
    const rotSmooth = 1 - Math.exp(-15 * dt)
    rotation.current.x = THREE.MathUtils.lerp(rotation.current.x, rotationTarget.current.x, rotSmooth)
    rotation.current.y = THREE.MathUtils.lerp(rotation.current.y, rotationTarget.current.y, rotSmooth)

    const { forward, backward, left, right, sprint } = getKeys()
    
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

    const hasInput = moveVec.lengthSq() > 0.01
    if (hasInput) moveVec.normalize()

    const speed = isMobile ? runSpeed : (sprint ? runSpeed : walkSpeed)
    targetVelXZ.current.x = hasInput ? moveVec.x * speed : 0
    targetVelXZ.current.z = hasInput ? moveVec.z * speed : 0

    if (hasInput) {
      const targetRotation = Math.atan2(moveVec.x, moveVec.z)
      let diff = targetRotation - meshRef.current.rotation.y
      while (diff < -Math.PI) diff += Math.PI * 2
      while (diff > Math.PI) diff -= Math.PI * 2
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, meshRef.current.rotation.y + diff, ROTATION_LERP * dt)
    }

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

    const raycastInterval = performanceTier === 'low' ? 1 / 15 : 1 / 30
    raycastAccumulator.current += dt
    if (raycastAccumulator.current >= raycastInterval) {
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

    if (smoothedHitDistance.current != null && smoothedHitDistance.current < rayLength * 0.99) {
      finalCamPosRef.current.copy(smoothedPlayerPos.current).addScaledVector(rayDir, smoothedHitDistance.current)
    } else {
      finalCamPosRef.current.copy(idealCamPos)
    }
    finalCamPosRef.current.y = Math.max(0.1, finalCamPosRef.current.y)

    state.camera.position.lerp(finalCamPosRef.current, CAMERA_LERP * dt)
    lookTargetSmooth.current.lerp(lookTargetVec.set(playerPos.x, playerPos.y - 0.2, playerPos.z), 12 * dt)
    state.camera.lookAt(lookTargetSmooth.current)
  }, -1)

  return (
    <RigidBody
      ref={rb}
      colliders={false}
      enabledRotations={[false, false, false]}
      position={[0, 2, 0]}
      type="kinematicPosition"
      name="player"
      friction={0}
    >
      <CapsuleCollider args={[0.5, 0.5]} />
      
      <group ref={meshRef}>
        <mesh castShadow={false} position={[0, 0, 0]}>
          <capsuleGeometry args={performanceTier === 'low' ? [0.5, 1, 4, 8] : [0.5, 1, 4, 16]} />
          <meshStandardMaterial color="#3b82f6" wireframe />
        </mesh>
      </group>
    </RigidBody>
  )
}

export default Player
