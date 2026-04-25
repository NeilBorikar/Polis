import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';
import type { Issue } from '../types';

// ── Zone definitions (reduced counts, wider rings to avoid congestion) ─────
const ZONES = [
  { count: 8,  rMin: 1,   rMax: 5,   hMin: 6, hMax: 14, color: '#1a5ea8', emissive: '#2a8fe0', emissiveInt: 0.5, metal: 0.9, rough: 0.08 },
  { count: 14, rMin: 6,   rMax: 12,  hMin: 2, hMax: 7,  color: '#0d3d6b', emissive: '#1a6db5', emissiveInt: 0.3, metal: 0.6, rough: 0.3  },
  { count: 18, rMin: 13,  rMax: 20,  hMin: 1, hMax: 3,  color: '#0a2540', emissive: '#0d4a80', emissiveInt: 0.2, metal: 0.3, rough: 0.6  },
];

// Minimum spacing between buildings (world-units)
const MIN_DIST = 3.2;

function randInRingSpaced(
  rMin: number, rMax: number, existing: Array<[number, number]>, tries = 40
): [number, number] {
  for (let t = 0; t < tries; t++) {
    const angle = Math.random() * Math.PI * 2;
    const r = rMin + Math.random() * (rMax - rMin);
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    // Skip if too close to a major road axis (±0.6 units → leave room for roads)
    if (Math.abs(x) < 0.8 || Math.abs(z) < 0.8) continue;
    const tooClose = existing.some(([ex, ez]) => Math.hypot(x - ex, z - ez) < MIN_DIST);
    if (!tooClose) return [x, z];
  }
  // Fallback (ring edge, angle jitter)
  const angle = Math.random() * Math.PI * 2;
  return [Math.cos(angle) * rMax * 0.9, Math.sin(angle) * rMax * 0.9];
}

interface BD { x: number; z: number; w: number; h: number; d: number; floors: number }

// ── Building with detail geometry ─────────────────────────────────────────
function DetailedBuilding({ b, zone }: { b: BD; zone: typeof ZONES[0] }) {
  const bodyRef   = useRef<THREE.Mesh>(null);
  const antenRef  = useRef<THREE.Mesh>(null);
  const roofRef   = useRef<THREE.Mesh>(null);

  useFrame((s) => {
    const t  = s.clock.elapsedTime;
    const wave = 1 + Math.sin(t * 0.35 + b.x * 0.4) * 0.006;
    if (bodyRef.current) {
      bodyRef.current.scale.y = wave;
      bodyRef.current.position.y = (b.h * wave) / 2;
    }
    if (antenRef.current) {
      antenRef.current.position.y = b.h * wave + 0.4;
      // Slow blink
      const mat = antenRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.5 + Math.sin(t * 3 + b.z) * 1.0;
    }
    if (roofRef.current) roofRef.current.position.y = b.h * wave;
  });

  const floorLineColor = zone.emissive;
  const floorH = b.h / Math.max(b.floors, 1);

  return (
    <group position={[b.x, 0, b.z]}>
      {/* Main body */}
      <mesh ref={bodyRef} position={[0, b.h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[b.w, b.h, b.d]} />
        <meshStandardMaterial
          color={zone.color} emissive={zone.emissive}
          emissiveIntensity={zone.emissiveInt}
          metalness={zone.metal} roughness={zone.rough}
        />
      </mesh>

      {/* Horizontal floor lines for detail */}
      {Array.from({ length: b.floors - 1 }, (_, fi) => {
        const y = floorH * (fi + 1);
        return (
          <mesh key={fi} position={[0, y, b.d / 2 + 0.01]} rotation={[0, 0, 0]}>
            <planeGeometry args={[b.w, 0.04]} />
            <meshStandardMaterial color={floorLineColor} emissive={floorLineColor} emissiveIntensity={0.6} transparent opacity={0.7} />
          </mesh>
        );
      })}
      {/* Back face floor lines */}
      {Array.from({ length: b.floors - 1 }, (_, fi) => {
        const y = floorH * (fi + 1);
        return (
          <mesh key={`b${fi}`} position={[0, y, -(b.d / 2 + 0.01)]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[b.w, 0.04]} />
            <meshStandardMaterial color={floorLineColor} emissive={floorLineColor} emissiveIntensity={0.6} transparent opacity={0.7} />
          </mesh>
        );
      })}

      {/* Rooftop slab */}
      <mesh ref={roofRef} position={[0, b.h, 0]}>
        <boxGeometry args={[b.w + 0.15, 0.12, b.d + 0.15]} />
        <meshStandardMaterial color="#0a1e30" emissive={zone.emissive} emissiveIntensity={0.25} metalness={0.95} roughness={0.05} />
      </mesh>

      {/* Antenna / spire (only on taller buildings) */}
      {b.h > 5 && (
        <mesh ref={antenRef} position={[0, b.h + 0.4, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.8, 6]} />
          <meshStandardMaterial color="#ff3366" emissive="#ff0044" emissiveIntensity={2} />
        </mesh>
      )}

      {/* Rooftop AC units / mechanical boxes */}
      <mesh position={[b.w * 0.25, b.h + 0.18, b.d * 0.25]}>
        <boxGeometry args={[b.w * 0.22, 0.24, b.d * 0.22]} />
        <meshStandardMaterial color="#071520" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

function ZoneBuildings({ zone }: { zone: typeof ZONES[0] }) {
  const data = useMemo<BD[]>(() => {
    const placed: Array<[number, number]> = [];
    return Array.from({ length: zone.count }, () => {
      const [x, z] = randInRingSpaced(zone.rMin, zone.rMax, placed);
      placed.push([x, z]);
      const w = 0.8 + Math.random() * 1.2;
      const h = zone.hMin + Math.random() * (zone.hMax - zone.hMin);
      const d = 0.8 + Math.random() * 1.2;
      const floors = Math.max(2, Math.round(h / 1.6));
      return { x, z, w, h, d, floors };
    });
  }, [zone]);

  return (
    <>
      {data.map((b, i) => (
        <DetailedBuilding key={i} b={b} zone={zone} />
      ))}
    </>
  );
}

// ── Glowing window planes ─────────────────────────────────────
function WindowLights() {
  const positions = useMemo<Array<[number, number, number, string]>>(() => {
    const palette = ['#4499ff', '#00ccff', '#ffdd66', '#ffffff', '#88ddff'];
    return Array.from({ length: 60 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const r = 1 + Math.random() * 9;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
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

// ── Road network with lanes, markings, and footpaths ──────────
const ROAD_AXES = [-12, -6, 0, 6, 12] as const;
const ROAD_WIDTH   = 2.0;   // main road carriageway
const FOOTPATH_W   = 0.6;   // sidewalk on each side
const DASH_LEN     = 0.5;
const DASH_GAP     = 0.4;
const ROAD_LENGTH  = 50;

function RoadNetwork({ onMapClick }: { onMapClick: (pt: [number, number, number]) => void }) {
  // Build dashed center lines for a road of given length along the given axis
  const dashPositions = useMemo(() => {
    const dashes: Array<{ pos: [number, number, number]; rot: [number, number, number]; axis: 'x' | 'z' }> = [];
    const step = DASH_LEN + DASH_GAP;
    const total = Math.floor(ROAD_LENGTH / step);
    for (const axis of ['x', 'z'] as const) {
      for (const road of ROAD_AXES) {
        // Skip very center (intersection box)
        for (let d = -total / 2; d <= total / 2; d++) {
          const offset = d * step;
          const absOff = Math.abs(offset);
          // Skip the intersection squares
          const isIntersection = ROAD_AXES.some(r => Math.abs(offset - r) < ROAD_WIDTH * 0.75);
          if (isIntersection) continue;
          if (axis === 'x') {
            dashes.push({ pos: [offset, 0.03, road], rot: [-Math.PI / 2, 0, 0], axis });
          } else {
            dashes.push({ pos: [road, 0.03, offset], rot: [-Math.PI / 2, 0, Math.PI / 2], axis });
          }
        }
      }
    }
    return dashes;
  }, []);

  const crosswalkPositions = useMemo(() => {
    const cw: Array<{ pos: [number, number, number]; rot: [number, number, number] }> = [];
    for (const rx of ROAD_AXES) {
      for (const rz of ROAD_AXES) {
        // Horizontal crosswalk (crosses in X direction across the road)
        for (let s = -3; s <= 3; s++) {
          cw.push({ pos: [rx + s * 0.22, 0.025, rz + ROAD_WIDTH * 0.65], rot: [-Math.PI / 2, 0, 0] });
          cw.push({ pos: [rx + s * 0.22, 0.025, rz - ROAD_WIDTH * 0.65], rot: [-Math.PI / 2, 0, 0] });
        }
        // Vertical crosswalk
        for (let s = -3; s <= 3; s++) {
          cw.push({ pos: [rx + ROAD_WIDTH * 0.65, 0.025, rz + s * 0.22], rot: [-Math.PI / 2, 0, 0] });
          cw.push({ pos: [rx - ROAD_WIDTH * 0.65, 0.025, rz + s * 0.22], rot: [-Math.PI / 2, 0, 0] });
        }
      }
    }
    return cw;
  }, []);

  return (
    <group>
      {/* Dark asphalt base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}
        onClick={(e) => { e.stopPropagation(); onMapClick([e.point.x, 0.5, e.point.z]); }}>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial color="#010d1a" roughness={1} metalness={0} />
      </mesh>

      {/* Fine grid for city block pattern */}
      <gridHelper args={[55, 55, '#051020', '#030c18']} position={[0, 0.005, 0]} />

      {/* ── Road carriageways (asphalt strips) ── */}
      {ROAD_AXES.map(pos => (
        <group key={`roadX${pos}`}>
          {/* X-direction road surface */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, pos]}>
            <planeGeometry args={[ROAD_LENGTH, ROAD_WIDTH]} />
            <meshStandardMaterial color="#050e1a" roughness={0.95} metalness={0.05} />
          </mesh>
          {/* Z-direction road surface */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[pos, 0.01, 0]}>
            <planeGeometry args={[ROAD_WIDTH, ROAD_LENGTH]} />
            <meshStandardMaterial color="#050e1a" roughness={0.95} metalness={0.05} />
          </mesh>
        </group>
      ))}

      {/* ── Footpaths / Sidewalks alongside roads ── */}
      {ROAD_AXES.map(pos => (
        <group key={`fp${pos}`}>
          {/* X-road footpaths (both sides) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, pos + ROAD_WIDTH / 2 + FOOTPATH_W / 2]}>
            <planeGeometry args={[ROAD_LENGTH, FOOTPATH_W]} />
            <meshStandardMaterial color="#0a1a28" emissive="#003355" emissiveIntensity={0.12} roughness={0.9} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, pos - ROAD_WIDTH / 2 - FOOTPATH_W / 2]}>
            <planeGeometry args={[ROAD_LENGTH, FOOTPATH_W]} />
            <meshStandardMaterial color="#0a1a28" emissive="#003355" emissiveIntensity={0.12} roughness={0.9} />
          </mesh>
          {/* Z-road footpaths (both sides) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[pos + ROAD_WIDTH / 2 + FOOTPATH_W / 2, 0.012, 0]}>
            <planeGeometry args={[FOOTPATH_W, ROAD_LENGTH]} />
            <meshStandardMaterial color="#0a1a28" emissive="#003355" emissiveIntensity={0.12} roughness={0.9} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[pos - ROAD_WIDTH / 2 - FOOTPATH_W / 2, 0.012, 0]}>
            <planeGeometry args={[FOOTPATH_W, ROAD_LENGTH]} />
            <meshStandardMaterial color="#0a1a28" emissive="#003355" emissiveIntensity={0.12} roughness={0.9} />
          </mesh>

          {/* Neon edge trim on footpaths */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, pos + ROAD_WIDTH / 2 + FOOTPATH_W]}>
            <planeGeometry args={[ROAD_LENGTH, 0.05]} />
            <meshStandardMaterial emissive="#00aacc" emissiveIntensity={0.6} color="#001a2a" transparent opacity={0.8} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, pos - ROAD_WIDTH / 2 - FOOTPATH_W]}>
            <planeGeometry args={[ROAD_LENGTH, 0.05]} />
            <meshStandardMaterial emissive="#00aacc" emissiveIntensity={0.6} color="#001a2a" transparent opacity={0.8} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[pos + ROAD_WIDTH / 2 + FOOTPATH_W, 0.015, 0]}>
            <planeGeometry args={[0.05, ROAD_LENGTH]} />
            <meshStandardMaterial emissive="#00aacc" emissiveIntensity={0.6} color="#001a2a" transparent opacity={0.8} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[pos - ROAD_WIDTH / 2 - FOOTPATH_W, 0.015, 0]}>
            <planeGeometry args={[0.05, ROAD_LENGTH]} />
            <meshStandardMaterial emissive="#00aacc" emissiveIntensity={0.6} color="#001a2a" transparent opacity={0.8} />
          </mesh>
        </group>
      ))}

      {/* ── Road edge neon lines (carriageway edges) ── */}
      {ROAD_AXES.map(pos => (
        <group key={`edge${pos}`}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.022, pos + ROAD_WIDTH / 2]}>
            <planeGeometry args={[ROAD_LENGTH, 0.04]} />
            <meshStandardMaterial emissive="#0055cc" emissiveIntensity={1.2} color="#001133" transparent opacity={0.9} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.022, pos - ROAD_WIDTH / 2]}>
            <planeGeometry args={[ROAD_LENGTH, 0.04]} />
            <meshStandardMaterial emissive="#0055cc" emissiveIntensity={1.2} color="#001133" transparent opacity={0.9} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[pos + ROAD_WIDTH / 2, 0.022, 0]}>
            <planeGeometry args={[0.04, ROAD_LENGTH]} />
            <meshStandardMaterial emissive="#0055cc" emissiveIntensity={1.2} color="#001133" transparent opacity={0.9} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[pos - ROAD_WIDTH / 2, 0.022, 0]}>
            <planeGeometry args={[0.04, ROAD_LENGTH]} />
            <meshStandardMaterial emissive="#0055cc" emissiveIntensity={1.2} color="#001133" transparent opacity={0.9} />
          </mesh>
        </group>
      ))}

      {/* ── Dashed center lines ── */}
      {dashPositions.map((d, i) => (
        <mesh key={i} rotation={d.rot} position={d.pos}>
          <planeGeometry args={[d.axis === 'x' ? DASH_LEN : 0.06, d.axis === 'x' ? 0.06 : DASH_LEN]} />
          <meshStandardMaterial emissive="#ffdd00" emissiveIntensity={1.4} color="#332200" transparent opacity={0.9} />
        </mesh>
      ))}

      {/* ── Crosswalk zebra markings at intersections ── */}
      {crosswalkPositions.map((c, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={c.pos}>
          <planeGeometry args={[0.14, 0.42]} />
          <meshStandardMaterial color="#ccddff" emissive="#8899cc" emissiveIntensity={0.4} transparent opacity={0.75} />
        </mesh>
      ))}

      {/* ── Green park blocks (city blocks with vegetation) ── */}
      {([[9, 9], [-9, 9], [9, -9], [-9, -9]] as [number, number][]).map(([x, z], i) => (
        <group key={i}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.015, z]}>
            <planeGeometry args={[4, 4]} />
            <meshStandardMaterial color="#071d0c" emissive="#0d4a15" emissiveIntensity={0.35} transparent opacity={0.9} />
          </mesh>
          {/* Small tree dots */}
          {Array.from({ length: 5 }, (_, t) => {
            const tx = x + (Math.random() - 0.5) * 3;
            const tz = z + (Math.random() - 0.5) * 3;
            return (
              <mesh key={t} position={[tx, 0.4, tz]}>
                <sphereGeometry args={[0.25, 6, 6]} />
                <meshStandardMaterial color="#0a3a10" emissive="#0d5a18" emissiveIntensity={0.4} />
              </mesh>
            );
          })}
        </group>
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
      <ringGeometry args={[21, 21.5, 64]} />
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
      <Canvas shadows camera={{ position: [22, 28, 22], fov: 38 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.4 }}>
        <color attach="background" args={['#010d1a']} />
        <fog attach="fog" args={['#010d1a', 30, 70]} />

        {/* Lights */}
        <ambientLight intensity={0.55} color="#4488bb" />
        <directionalLight castShadow position={[12, 22, 12]} intensity={1.8} color="#88ccff"
          shadow-mapSize={[2048, 2048]} shadow-bias={-0.0001}>
          <orthographicCamera attach="shadow-camera" args={[-30, 30, 30, -30]} />
        </directionalLight>
        <pointLight position={[0, 18, 0]} intensity={1.2} color="#2299ff" distance={50} />
        <pointLight position={[-14, 4, -14]} intensity={0.6} color="#0055aa" distance={25} />
        <pointLight position={[14, 4, 14]}  intensity={0.5} color="#003377" distance={22} />
        <pointLight position={[0, 10, 0]}   intensity={0.8} color="#44aaff" distance={22} />

        <Stars radius={80} depth={25} count={1000} factor={2.5} fade />

        <group position={[0, -1.5, 0]}>
          <RoadNetwork onMapClick={onMapClick} />
          <DataRing />
          {ZONES.map((z, i) => <ZoneBuildings key={i} zone={z} />)}
          <WindowLights />

          {/* Drones */}
          <Drone radius={15} height={9}  speed={0.35} phase={0} />
          <Drone radius={9}  height={13} speed={0.55} phase={2.1} />
          <Drone radius={18} height={6}  speed={0.25} phase={4.2} />
          <Drone radius={11} height={11} speed={0.45} phase={1.0} />

          {/* Issue pins */}
          {issues.map(issue => (
            <IssuePin key={issue.id} issue={issue} onClick={() => setSelectedIssueId(issue.id)} />
          ))}
        </group>

        <OrbitControls enablePan minDistance={8} maxDistance={55} maxPolarAngle={Math.PI / 2 - 0.05} />
      </Canvas>
    </div>
  );
}
