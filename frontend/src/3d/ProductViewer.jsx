import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

// Product Shape (Generic 3D Model)
function ProductShape() {
  const meshRef = useRef()

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.004
      meshRef.current.rotation.x = Math.sin(Date.now() * 0.00035) * 0.06
    }
  })

  return (
    <group ref={meshRef}>
      {/* Main body */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.8, 0.6, 2, 32]} />
        <meshStandardMaterial 
          color="#e4e4e7"
          metalness={0.55}
          roughness={0.28}
          emissive="#f4f4f5"
          emissiveIntensity={0.05}
        />
      </mesh>

      {/* Top accent */}
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial 
          color="#27272a"
          metalness={0.65}
          roughness={0.2}
          emissive="#52525b"
          emissiveIntensity={0.09}
        />
      </mesh>

      {/* Side rings */}
      {[-0.3, 0.3].map((y, idx) => (
        <mesh key={idx} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.95, 0.08, 16, 32]} />
          <meshStandardMaterial 
            color="#a1a1aa"
            metalness={0.82}
            roughness={0.18}
          />
        </mesh>
      ))}
    </group>
  )
}

function FloatingPanels() {
  const groupRef = useRef()

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.25) * 0.3
      groupRef.current.position.y = Math.sin(clock.elapsedTime * 0.7) * 0.15
    }
  })

  return (
    <group ref={groupRef}>
      {[-1.6, 1.6].map((x, idx) => (
        <mesh key={idx} position={[x, 0.5, -1.2]} rotation={[0.2, 0.5, 0]}>
          <planeGeometry args={[0.9, 1.3]} />
          <meshStandardMaterial color="#ffffff" opacity={0.3} transparent roughness={0.9} metalness={0.05} />
        </mesh>
      ))}
    </group>
  )
}

// Lighting Setup
function Lighting() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, 5, 10]} intensity={0.65} color="#e4e4e7" />
      <pointLight position={[0, -10, 5]} intensity={0.45} color="#d4d4d8" />
    </>
  )
}

// Main Product Viewer Scene
function ViewerScene() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 4]} />
      <OrbitControls 
        autoRotate
        autoRotateSpeed={2.2}
        enableZoom={true}
        enablePan={true}
        minDistance={2}
        maxDistance={8}
      />
      
      <Lighting />
      <ProductShape />
      <FloatingPanels />
      
      {/* Grid background */}
      <gridHelper args={[10, 10, '#71717a', '#d4d4d8']} position={[0, -1.5, 0]} />
    </>
  )
}

export default function ProductViewer({ className = '' }) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas 
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        dpr={[1, 2]}
        shadows
      >
        <ViewerScene />
      </Canvas>
    </div>
  )
}
