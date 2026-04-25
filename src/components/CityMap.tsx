import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';
import type { Issue } from '../types';

const BUILDING_COUNT = 150;
const CITY_SIZE = 30;

function Buildings() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const buildingsData = useMemo(() => {
    const data = [];
    for (let i = 0; i < BUILDING_COUNT; i++) {
      const x = (Math.random() - 0.5) * CITY_SIZE;
      const z = (Math.random() - 0.5) * CITY_SIZE;
      if (Math.abs(x) < 2 && Math.abs(z) < 2) continue;
      
      const height = Math.random() * 3 + 1 + (Math.random() > 0.9 ? 4 : 0);
      const width = Math.random() * 1.5 + 0.5;
      const depth = Math.random() * 1.5 + 0.5;
      data.push({ x, z, height, width, depth });
    }
    return data;
  }, []);

  useFrame(() => {
    if (meshRef.current) {
      buildingsData.forEach((b, i) => {
        dummy.position.set(b.x, b.height / 2, b.z);
        dummy.scale.set(b.width, b.height, b.depth);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, buildingsData.length]} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.2} />
    </instancedMesh>
  );
}

function IssuePin({ issue, onClick }: { issue: Issue; onClick: () => void }) {
  const ref = useRef<THREE.Mesh>(null);
  const color = issue.status === 'New' ? '#ef4444' : issue.status === 'In Progress' ? '#f59e0b' : '#22c55e';
  const isUnresolved = issue.status !== 'Resolved';

  useFrame((state) => {
    if (ref.current && isUnresolved) {
      // Pulse effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.2;
      ref.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group position={issue.coordinates}>
      <mesh ref={ref} onClick={(e) => { e.stopPropagation(); onClick(); }} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isUnresolved ? 1 : 0.2} toneMapped={false} />
      </mesh>
      {/* Light coming from the pin */}
      {isUnresolved && <pointLight color={color} intensity={0.5} distance={3} />}
    </group>
  );
}

function Ground({ onMapClick }: { onMapClick: (pt: [number, number, number]) => void }) {
  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      receiveShadow 
      onClick={(e) => { e.stopPropagation(); onMapClick([e.point.x, 0.5, e.point.z]); }}
    >
      <planeGeometry args={[CITY_SIZE * 1.5, CITY_SIZE * 1.5]} />
      <meshStandardMaterial color="#0f172a" depthWrite={true} />
      <gridHelper args={[CITY_SIZE * 1.5, CITY_SIZE * 1.5, '#334155', '#1e293b']} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.01]} />
    </mesh>
  );
}

function HeatTowers() {
  const allIssues = useStore(state => state.issues);
  const timeFilter = useStore(state => state.timeFilter);
  const maxHour = (timeFilter / 100) * 24;
  const issues = allIssues.filter(i => new Date(i.timestamp).getHours() <= maxHour);
  const gridSize = 10;
  const gridCells = new Map<string, { x: number, z: number, count: number }>();

  issues.forEach(issue => {
    if (issue.status === 'Resolved') return;
    const gx = Math.floor(issue.coordinates[0] / gridSize) * gridSize + gridSize / 2;
    const gz = Math.floor(issue.coordinates[2] / gridSize) * gridSize + gridSize / 2;
    const key = `${gx},${gz}`;
    if (!gridCells.has(key)) {
      gridCells.set(key, { x: gx, z: gz, count: 0 });
    }
    gridCells.get(key)!.count += 1;
  });

  return (
    <>
      {Array.from(gridCells.values()).map(cell => {
        const height = cell.count * 2;
        return (
          <mesh key={`${cell.x}-${cell.z}`} position={[cell.x, height / 2, cell.z]}>
            <cylinderGeometry args={[2, 2, height, 32]} />
            <meshStandardMaterial color="#ef4444" transparent opacity={0.3} emissive="#ef4444" emissiveIntensity={0.8} />
          </mesh>
        );
      })}
    </>
  );
}

export default function CityMap({ onMapClick }: { onMapClick: (pt: [number, number, number]) => void }) {
  const allIssues = useStore(state => state.issues);
  const timeFilter = useStore(state => state.timeFilter);
  const maxHour = (timeFilter / 100) * 24;
  const issues = allIssues.filter(i => new Date(i.timestamp).getHours() <= maxHour);
  const setSelectedIssueId = useStore(state => state.setSelectedIssueId);

  return (
    <div className="w-full h-full relative cursor-crosshair">
      <Canvas shadows camera={{ position: [0, 15, 20], fov: 45 }}>
        <color attach="background" args={['#020617']} />
        <fog attach="fog" args={['#020617', 15, 40]} />
        
        <ambientLight intensity={0.5} />
        <directionalLight 
          castShadow 
          position={[10, 20, 10]} 
          intensity={1.5} 
          shadow-mapSize={[1024, 1024]}
        >
          <orthographicCamera attach="shadow-camera" args={[-20, 20, 20, -20]} />
        </directionalLight>

        <group position={[0, -2, 0]}>
          <Ground onMapClick={onMapClick} />
          <Buildings />
          <HeatTowers />
          
          {issues.map(issue => (
            <IssuePin 
              key={issue.id} 
              issue={issue} 
              onClick={() => setSelectedIssueId(issue.id)} 
            />
          ))}
          
          <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={40} blur={2} far={4} color="#000000" />
        </group>

        <OrbitControls 
          enablePan={true}
          enableZoom={true} 
          maxPolarAngle={Math.PI / 2 - 0.05} 
          minDistance={5}
          maxDistance={35}
        />
        
        <Environment preset="night" />
      </Canvas>
    </div>
  );
}
