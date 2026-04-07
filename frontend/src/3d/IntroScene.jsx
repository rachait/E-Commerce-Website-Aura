import React, { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, PerspectiveCamera, Sparkles } from '@react-three/drei'
import * as THREE from 'three'

function CoreArtifact() {
  const groupRef = useRef()
  const shellRef = useRef()
  const innerRef = useRef()
  const ringARef = useRef()
  const ringBRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.elapsedTime

    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.18
      groupRef.current.rotation.x = Math.sin(t * 0.4) * 0.12
      groupRef.current.position.y = Math.sin(t * 0.9) * 0.18
    }

    if (shellRef.current) {
      shellRef.current.rotation.y = -t * 0.22
      shellRef.current.rotation.z = Math.sin(t * 0.45) * 0.18
    }

    if (innerRef.current) {
      innerRef.current.rotation.x = t * 0.25
      innerRef.current.rotation.z = -t * 0.2
    }

    if (ringARef.current) {
      ringARef.current.rotation.z = t * 0.28
    }

    if (ringBRef.current) {
      ringBRef.current.rotation.x = t * 0.32
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <mesh ref={shellRef} castShadow>
        <icosahedronGeometry args={[1.35, 5]} />
        <meshPhysicalMaterial
          color="#d5dde6"
          metalness={0.9}
          roughness={0.15}
          transmission={0.18}
          clearcoat={1}
          clearcoatRoughness={0.1}
          emissive="#5f748d"
          emissiveIntensity={0.2}
        />
      </mesh>

      <mesh ref={innerRef} scale={0.62} castShadow>
        <dodecahedronGeometry args={[1, 2]} />
        <meshStandardMaterial
          color="#101827"
          metalness={0.65}
          roughness={0.2}
          emissive="#1b2435"
          emissiveIntensity={0.35}
        />
      </mesh>

      <mesh ref={ringARef} rotation={[Math.PI / 2.4, 0.4, 0]}>
        <torusGeometry args={[2.35, 0.055, 24, 220]} />
        <meshStandardMaterial color="#e6ecf4" metalness={1} roughness={0.12} emissive="#9fb5ce" emissiveIntensity={0.16} />
      </mesh>

      <mesh ref={ringBRef} rotation={[0.28, 0, Math.PI / 2]}>
        <torusGeometry args={[2.9, 0.035, 20, 180]} />
        <meshStandardMaterial color="#8a9aad" metalness={0.95} roughness={0.2} emissive="#44566e" emissiveIntensity={0.22} />
      </mesh>
    </group>
  )
}

function NebulaCloud({ count }) {
  const pointsRef = useRef()
  const positionArray = useMemo(() => {
    const data = new Float32Array(count * 3)
    for (let i = 0; i < count; i += 1) {
      const radius = THREE.MathUtils.randFloat(2.8, 9.2)
      const theta = THREE.MathUtils.randFloatSpread(Math.PI * 2)
      const phi = THREE.MathUtils.randFloatSpread(Math.PI)
      const i3 = i * 3
      data[i3] = radius * Math.cos(theta) * Math.cos(phi)
      data[i3 + 1] = radius * Math.sin(phi)
      data[i3 + 2] = radius * Math.sin(theta) * Math.cos(phi)
    }
    return data
  }, [count])

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.00055
      pointsRef.current.rotation.x += 0.00018
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positionArray}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#b7c5d8" size={0.035} sizeAttenuation transparent opacity={0.78} depthWrite={false} />
    </points>
  )
}

function CameraRig() {
  const cameraGroupRef = useRef()

  useFrame(({ clock, pointer }) => {
    if (cameraGroupRef.current) {
      const t = clock.elapsedTime
      const targetX = pointer.x * 0.22
      const targetY = pointer.y * 0.18
      cameraGroupRef.current.position.x = THREE.MathUtils.lerp(cameraGroupRef.current.position.x, targetX, 0.04)
      cameraGroupRef.current.position.y = THREE.MathUtils.lerp(cameraGroupRef.current.position.y, targetY, 0.04)
      cameraGroupRef.current.position.z = Math.sin(t * 0.3) * 0.18
    }
  })

  return (
    <group ref={cameraGroupRef} />
  )
}

function Scene({ quality }) {
  const particleCount = quality === 'high' ? 2200 : 1000
  const sparklesCount = quality === 'high' ? 140 : 80

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.2, 7.4]} fov={42} />
      <color attach="background" args={['#05070b']} />

      <fog attach="fog" args={['#05070b', 8, 17]} />

      <ambientLight intensity={0.55} />
      <spotLight position={[5, 8, 6]} intensity={2.1} angle={0.42} penumbra={0.5} color="#d8e6ff" castShadow />
      <pointLight position={[-7, -3, 5]} intensity={1.2} color="#8ec5ff" />
      <pointLight position={[0, 5, -5]} intensity={0.85} color="#ffefdb" />

      <Float speed={1.1} rotationIntensity={0.35} floatIntensity={0.25}>
        <CoreArtifact />
      </Float>

      <NebulaCloud count={particleCount} />
      <Sparkles count={sparklesCount} size={2.5} scale={10} speed={0.45} color="#9bc9ff" />
      <CameraRig />
    </>
  )
}

export default function IntroScene({ quality = 'high' }) {
  const isHigh = quality === 'high'

  return (
    <Canvas
      style={{ width: '100%', height: '100%' }}
      shadows={isHigh}
      gl={{ antialias: true, alpha: false, powerPreference: isHigh ? 'high-performance' : 'default' }}
      dpr={isHigh ? [1, 2.2] : [1, 1.5]}
    >
      <Scene quality={quality} />
    </Canvas>
  )
}
