import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { Points, PointMaterial, Line } from '@react-three/drei';
import * as THREE from 'three';

// Extend Three.js materials
extend({ PointMaterial });

interface ParticleSystemProps {
  count?: number;
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({ count = 1000 }) => {
  const mesh = useRef<THREE.Points>();
  const lineMesh = useRef<THREE.Group>();
  
  // Generate random positions for particles (blockchain nodes)
  const [positions, connections] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const connections: number[][] = [];
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    
    // Create connections between nearby particles
    for (let i = 0; i < count; i++) {
      const x1 = positions[i * 3];
      const y1 = positions[i * 3 + 1];
      const z1 = positions[i * 3 + 2];
      
      for (let j = i + 1; j < count; j++) {
        const x2 = positions[j * 3];
        const y2 = positions[j * 3 + 1];
        const z2 = positions[j * 3 + 2];
        
        const distance = Math.sqrt(
          Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2)
        );
        
        if (distance < 3 && Math.random() > 0.7) {
          connections.push([i, j]);
        }
      }
    }
    
    return [positions, connections];
  }, [count]);

  // Animate particles with blockchain pulse
  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
      mesh.current.rotation.y = state.clock.elapsedTime * 0.1;
      
      // Pulse effect for blockchain heartbeat
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      mesh.current.scale.setScalar(scale);
    }
  });

  return (
    <group>
      {/* Blockchain node particles */}
      <points ref={mesh}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color="#6366f1"
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>
      
      {/* Connection lines between nodes */}
      <group ref={lineMesh}>
        {connections.slice(0, 50).map((connection, index) => {
          const [i, j] = connection;
          const start = new THREE.Vector3(
            positions[i * 3],
            positions[i * 3 + 1],
            positions[i * 3 + 2]
          );
          const end = new THREE.Vector3(
            positions[j * 3],
            positions[j * 3 + 1],
            positions[j * 3 + 2]
          );
          
          return (
            <Line
              key={index}
              points={[start, end]}
              color="#8b5cf6"
              transparent
              opacity={0.3}
              lineWidth={1}
            />
          );
        })}
      </group>
    </group>
  );
};

const BlockchainBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        <ParticleSystem count={800} />
      </Canvas>
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/30 to-background/80" />
    </div>
  );
};

export default BlockchainBackground;