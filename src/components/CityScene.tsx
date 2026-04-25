import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';
import type { Issue } from '../types';

// ── Zone definitions ──────────────────────────────────────────
const ZONES = [
  { count: 18, rMin: 0,  rMax: 4.5, hMin: 5, hMax: 12, color: '#1a5ea8', emissive: '#2a8fe0', emissiveInt: 0.45, metal: 0.85, rough: 0.1 },
  { count: 35, rMin: 4.5, rMax: 10, hMin: 2, hMax: 6,  color: '#0d3d6b', emissive: '#1a6db5', emissiveInt: 0.3,  metal: 0.6,  rough: 0.3 },
  { count: 55, rMin: 10, rMax: 18,  hMin: 1, hMax: 3,  color: '#0a2540', emissive: '#0d4a80', emissiveInt: 0.2,  metal: 0.3,  rough: 0.6 },
];

function randInRing(rMin: number, rMax: number): [number, number] {
  const angle = Math.random() * Math.PI * 2;
  const r = rMin + Math.random() * (rMax - rMin);
  return [Math.cos(angle) * r, Math.sin(angle) * r];
}

interface BD { x: number; z: number; w: number; h: number; d: number }

function ZoneBuildings({ zone }: { zone: typeof ZONES[0] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const data = useMemo<BD[]>(() => {
    return Array.from({ length: zone.count }, () => {
      const [x, z] = randInRing(zone.rMin, zone.rMax);
      return { x, z, w: 0.5 + Math.random() * 1.3, h: zone.hMin + Math.random() * (zone.hMax - zone.hMin), d: 0.5 + Math.random() * 1.3 };
    });
  }, [zone]);

  // Initial matrix setup
  useMemo(() => {
    if (!meshRef.current) return;
    data.forEach((b, i) => {
      dummy.position.set(b.x, b.h / 2, b.z);
      dummy.scale.set(b.w, b.h, b.d);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [data, dummy]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    data.forEach((b, i) => {
      const wave = 1 + Math.sin(t * 0.35 + i * 0.4) * 0.006;
      dummy.position.set(b.x, (b.h * wave) / 2, b.z);
      dummy.scale.set(b.w, b.h * wave, b.d);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, data.length]} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={zone.color} emissive={zone.emissive}
        emissiveIntensity={zone.emissiveInt}
        metalness={zone.metal} roughness={zone.rough}
      />
    </instancedMesh>
  );
}

// ── Glowing window planes ─────────────────────────────────────
function WindowLights() {
  const positions = useMemo<Array<[number, number, number, string]>>(() => {
    const palette = ['#4499ff', '#00ccff', '#ffdd66', '#ffffff', '#88ddff'];
    return Array.from({ length: 80 }, () => {
      const [x, z] = randInRing(0, 9);
      return [x, 1.5 + Math.random() * 8, z, palette[Math.floor(Math.random() * palette.length)]];
    });
  }, []);

  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((s) => {
    refs.current.forEach((m, i) => {
      if (!m) return;
      const mat = m.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.5 + Math.sin(s.clock.elapsedTime * 2 + i * 0.7) * 1.0;
    });
  });

  return (
    <>
      {positions.map(([x, y, z, col], i) => (
        <mesh key={i} ref={el => { refs.current[i] = el; }} position={[x, y, z]}>
          <planeGeometry args={[0.1, 0.06]} />
          <meshStandardMaterial color={col} emissive={col} emissiveIntensity={2} transparent opacity={0.95} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </>
  );
}

// ── Flying Drones ─────────────────────────────────────────────
function Drone({ radius, height, speed, phase }: { radius: number; height: number; speed: number; phase: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.elapsedTime * speed + phase;
    ref.current.position.set(Math.cos(t) * radius, height + Math.sin(t * 2) * 0.3, Math.sin(t) * radius);
    ref.current.rotation.y = -t + Math.PI;
  });
  return (
    <group ref={ref}>
      <mesh>
        <cylinderGeometry args={[0.22, 0.22, 0.05, 8]} />
        <meshStandardMaterial color="#0a1a2a" emissive="#00d4ff" emissiveIntensity={1.5} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Propeller arms */}
      {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((a, i) => (
        <mesh key={i} position={[Math.cos(a) * 0.28, 0, Math.sin(a) * 0.28]}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshStandardMaterial emissive="#00aaff" emissiveIntensity={3} color="#002244" />
        </mesh>
      ))}
      <pointLight color="#00d4ff" intensity={0.8} distance={4} />
    </group>
  );
}

// ── Neon Road Grid ────────────────────────────────────────────
function NeonGround({ onMapClick }: { onMapClick: (pt: [number, number, number]) => void }) {
  return (
    <group>
      {/* Base plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}
        onClick={(e) => { e.stopPropagation(); onMapClick([e.point.x, 0.5, e.point.z]); }}>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial color="#010d1a" roughness={1} metalness={0} />
      </mesh>
      {/* Grid */}
      <gridHelper args={[55, 55, '#083050', '#041520']} position={[0, 0.01, 0]} />
      {/* Neon road strips X */}
      {[-8, -4, 0, 4, 8].map(z => (
        <mesh key={`rx${z}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, z]}>
          <planeGeometry args={[50, z === 0 ? 0.25 : 0.12]} />
          <meshStandardMaterial emissive="#00aacc" emissiveIntensity={z === 0 ? 0.8 : 0.4} color="#001522" transparent opacity={0.9} />
        </mesh>
      ))}
      {/* Neon road strips Z */}
      {[-8, -4, 0, 4, 8].map(x => (
        <mesh key={`rz${x}`} rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[x, 0.02, 0]}>
          <planeGeometry args={[50, x === 0 ? 0.25 : 0.12]} />
          <meshStandardMaterial emissive="#00aacc" emissiveIntensity={x === 0 ? 0.8 : 0.4} color="#001522" transparent opacity={0.9} />
        </mesh>
      ))}
      {/* Green park patches */}
      {([[7, 7], [-7, 7], [7, -7], [-7, -7]] as [number, number][]).map(([x, z], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.015, z]}>
          <planeGeometry args={[3, 3]} />
          <meshStandardMaterial color="#0a2a10" emissive="#0d4a15" emissiveIntensity={0.3} transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// ── Issue Pin ─────────────────────────────────────────────────
function IssuePin({ issue, onClick }: { issue: Issue; onClick: () => void }) {
  const ref = useRef<THREE.Mesh>(null);
  const color = issue.status === 'New' ? '#ff3b5c' : issue.status === 'In Progress' ? '#ff9f1c' : '#00ff9d';
  const alive = issue.status !== 'Resolved';
  useFrame((s) => {
    if (ref.current && alive) {
      const sc = 1 + Math.sin(s.clock.elapsedTime * 5 + Math.random()) * 0.22;
      ref.current.scale.setScalar(sc);
    }
  });
  return (
    <group position={issue.coordinates}>
      <mesh ref={ref} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={alive ? 2 : 0.3} toneMapped={false} />
      </mesh>
      {/* Spike */}
      <mesh position={[0, -0.4, 0]}>
        <coneGeometry args={[0.06, 0.5, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} />
      </mesh>
      {alive && <pointLight color={color} intensity={1.2} distance={5} />}
    </group>
  );
}

// ── Data Ring (decorative) ────────────────────────────────────
function DataRing() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.2;
  });
  return (
    <mesh ref={ref} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[19.5, 20, 64]} />
      <meshStandardMaterial color="#001a2a" emissive="#00d4ff" emissiveIntensity={0.6} transparent opacity={0.5} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function CityScene({ onMapClick }: { onMapClick: (pt: [number, number, number]) => void }) {
  const allIssues = useStore(s => s.issues);
  const timeFilter = useStore(s => s.timeFilter);
  const setSelectedIssueId = useStore(s => s.setSelectedIssueId);
  const maxHour = (timeFilter / 100) * 24;
  const issues = allIssues.filter(i => new Date(i.timestamp).getHours() <= maxHour);

  return (
    <div style={{ width: '100%', height: '100%', cursor: 'crosshair' }}>
      <Canvas shadows camera={{ position: [20, 26, 20], fov: 40 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.4 }}>
        <color attach="background" args={['#010d1a']} />
        <fog attach="fog" args={['#010d1a', 25, 60]} />

        {/* Lights */}
        <ambientLight intensity={0.6} color="#4488bb" />
        <directionalLight castShadow position={[12, 22, 12]} intensity={1.8} color="#88ccff"
          shadow-mapSize={[2048, 2048]} shadow-bias={-0.0001}>
          <orthographicCamera attach="shadow-camera" args={[-25, 25, 25, -25]} />
        </directionalLight>
        <pointLight position={[0, 18, 0]} intensity={1.2} color="#2299ff" distance={45} />
        <pointLight position={[-12, 4, -12]} intensity={0.6} color="#0055aa" distance={22} />
        <pointLight position={[12, 4, 12]}  intensity={0.5} color="#003377" distance={18} />
        {/* Warm accent light for center CBD */}
        <pointLight position={[0, 10, 0]}  intensity={0.8} color="#44aaff" distance={20} />

        <Stars radius={70} depth={25} count={1000} factor={2.5} fade />

        <group position={[0, -1.5, 0]}>
          <NeonGround onMapClick={onMapClick} />
          <DataRing />
          {ZONES.map((z, i) => <ZoneBuildings key={i} zone={z} />)}
          <WindowLights />

          {/* Drones */}
          <Drone radius={13} height={9}  speed={0.35} phase={0} />
          <Drone radius={8}  height={13} speed={0.55} phase={2.1} />
          <Drone radius={16} height={6}  speed={0.25} phase={4.2} />
          <Drone radius={10} height={11} speed={0.45} phase={1.0} />

          {/* Issue pins */}
          {issues.map(issue => (
            <IssuePin key={issue.id} issue={issue} onClick={() => setSelectedIssueId(issue.id)} />
          ))}
        </group>

        <OrbitControls enablePan minDistance={7} maxDistance={50} maxPolarAngle={Math.PI / 2 - 0.05} />
      </Canvas>
    </div>
  );
}
