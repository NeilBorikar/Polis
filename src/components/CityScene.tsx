import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';
import type { Issue } from '../types';

// ── Zone definitions (reduced counts, wider rings to avoid congestion) ─────
const ZONES = [
  // Downtown: fewer taller buildings, slightly wider ring
  { count: 6, rMin: 1.5, rMax: 6.5, hMin: 8, hMax: 16, color: '#4a7fa7', emissive: '#5fa3d4', emissiveInt: 0.4, metal: 0.85, rough: 0.12, windowColor: '#89c3e8' },
  // Mid-ring: reduced count, spread wider
  { count: 10, rMin: 7.5, rMax: 14, hMin: 2.5, hMax: 8, color: '#6b7a8a', emissive: '#8b9aaa', emissiveInt: 0.25, metal: 0.5, rough: 0.4, windowColor: '#7db8d4' },
  // Outer: residential — lower density, larger spacing
  { count: 10, rMin: 15, rMax: 24, hMin: 1, hMax: 4, color: '#8b6f47', emissive: '#a89968', emissiveInt: 0.15, metal: 0.2, rough: 0.7, windowColor: '#f5d890' },
];

// Minimum spacing between buildings (world-units)
const MIN_DIST = 4.2;

function randInRingSpaced(
  rMin: number, rMax: number, existing: Array<[number, number]>, tries = 40, minDist = MIN_DIST
): [number, number] {
  for (let t = 0; t < tries; t++) {
    const angle = Math.random() * Math.PI * 2;
    const r = rMin + Math.random() * (rMax - rMin);
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    // Skip if too close to a major road axis (±0.6 units → leave room for roads)
    if (Math.abs(x) < 0.8 || Math.abs(z) < 0.8) continue;
    const tooClose = existing.some(([ex, ez]) => Math.hypot(x - ex, z - ez) < minDist);
    if (!tooClose) return [x, z];
  }
  // Fallback (ring edge, angle jitter)
  const angle = Math.random() * Math.PI * 2;
  return [Math.cos(angle) * rMax * 0.9, Math.sin(angle) * rMax * 0.9];
}

interface BD { x: number; z: number; w: number; h: number; d: number; floors: number }

// ── Building with detail geometry ─────────────────────────────────────────
function DetailedBuilding({ b, zone, onClick }: { b: BD; zone: typeof ZONES[0]; onClick?: (pt: [number, number, number]) => void }) {
  const bodyRef = useRef<THREE.Mesh>(null);
  const antenRef = useRef<THREE.Mesh>(null);
  const roofRef = useRef<THREE.Mesh>(null);
  const windowRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const wave = 1 + Math.sin(t * 0.35 + b.x * 0.4) * 0.006;
    if (bodyRef.current) {
      bodyRef.current.scale.y = wave;
      bodyRef.current.position.y = (b.h * wave) / 2;
    }
    if (antenRef.current) {
      antenRef.current.position.y = b.h * wave + 0.4;
      const mat = antenRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.5 + Math.sin(t * 3 + b.z) * 1.0;
    }
    if (roofRef.current) roofRef.current.position.y = b.h * wave;

    // Flicker windows
    windowRefs.current.forEach((m, i) => {
      if (!m) return;
      const mat = m.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.2 + Math.sin(t * 1.5 + i * 0.5 + b.x * 0.3) * 0.8;
    });
  });

  const floorLineColor = zone.emissive;
  const floorH = b.h / Math.max(b.floors, 1);
  const buildingType = Math.random();
  const hasBalconies = buildingType > 0.4;
  const windowsPerRow = Math.max(2, Math.ceil(b.w / 0.4));

  // Color variation for buildings
  const colorVar = buildingType;
  const bodyColor = colorVar > 0.7 ? '#5a8ab7' : colorVar > 0.4 ? zone.color : '#506070';
  const windowColor = (zone as any).windowColor || '#89c3e8';
  const structureColor = buildingType > 0.6 ? '#3a4a5a' : '#2a3a4a';

  const grpRef = useRef<THREE.Group>(null);

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
    if (grpRef.current) grpRef.current.scale.set(1.04, 1.04, 1.04);
  };
  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    document.body.style.cursor = 'default';
    if (grpRef.current) grpRef.current.scale.set(1, 1, 1);
  };

  return (
    <group ref={grpRef} position={[b.x, 0, b.z]} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut} onClick={(e) => { e.stopPropagation(); if (onClick) onClick([b.x, b.h / 2, b.z]); }}>
      {/* Main body */}
      <mesh ref={bodyRef} position={[0, b.h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[b.w, b.h, b.d]} />
        <meshStandardMaterial
          color={bodyColor} emissive={zone.emissive}
          emissiveIntensity={zone.emissiveInt}
          metalness={zone.metal} roughness={zone.rough}
        />
      </mesh>

      {/* Structural columns - vertical edges - realistic steel/concrete */}
      {Array.from({ length: Math.floor(b.w / 0.6) + 1 }, (_, ci) => {
        const xPos = -b.w / 2 + (ci * b.w) / Math.max(Math.floor(b.w / 0.6), 1);
        return (
          <mesh key={`colz${ci}`} position={[xPos, b.h / 2, b.d / 2 + 0.04]}>
            <boxGeometry args={[0.08, b.h, 0.06]} />
            <meshStandardMaterial color={structureColor} metalness={zone.metal * 0.6} roughness={zone.rough + 0.2} />
          </mesh>
        );
      })}
      {Array.from({ length: Math.floor(b.w / 0.6) + 1 }, (_, ci) => {
        const xPos = -b.w / 2 + (ci * b.w) / Math.max(Math.floor(b.w / 0.6), 1);
        return (
          <mesh key={`colz-b${ci}`} position={[xPos, b.h / 2, -(b.d / 2 + 0.04)]}>
            <boxGeometry args={[0.08, b.h, 0.06]} />
            <meshStandardMaterial color={structureColor} metalness={zone.metal * 0.6} roughness={zone.rough + 0.2} />
          </mesh>
        );
      })}

      {/* Front facade - detailed windows with realistic glass */}
      {Array.from({ length: b.floors }, (_, fi) => {
        const y = floorH * fi + floorH / 2;
        return Array.from({ length: windowsPerRow }, (_, wi) => {
          const xPos = -b.w / 2 + (wi + 0.5) * (b.w / windowsPerRow);
          const windowLit = Math.random() > 0.3;
          const windowIdx = fi * windowsPerRow + wi;
          return (
            <mesh key={`win-f${fi}-${wi}`} ref={el => { windowRefs.current[windowIdx] = el; }}
              position={[xPos, y, b.d / 2 + 0.05]}>
              <boxGeometry args={[b.w / windowsPerRow * 0.7, floorH * 0.6, 0.03]} />
              <meshStandardMaterial
                color={windowLit ? windowColor : '#1a2a3a'}
                emissive={windowLit ? windowColor : '#0a1a2a'}
                emissiveIntensity={windowLit ? 2.0 : 0.1}
                metalness={0.8}
                roughness={0.1}
                transparent
                opacity={windowLit ? 0.9 : 0.6}
              />
            </mesh>
          );
        });
      })}

      {/* Back facade - matching windows */}
      {Array.from({ length: b.floors }, (_, fi) => {
        const y = floorH * fi + floorH / 2;
        return Array.from({ length: windowsPerRow }, (_, wi) => {
          const xPos = -b.w / 2 + (wi + 0.5) * (b.w / windowsPerRow);
          const windowLit = Math.random() > 0.3;
          return (
            <mesh key={`win-b${fi}-${wi}`} position={[xPos, y, -(b.d / 2 + 0.05)]}>
              <boxGeometry args={[b.w / windowsPerRow * 0.7, floorH * 0.6, 0.03]} />
              <meshStandardMaterial
                color={windowLit ? windowColor : '#1a2a3a'}
                emissive={windowLit ? windowColor : '#0a1a2a'}
                emissiveIntensity={windowLit ? 2.0 : 0.1}
                metalness={0.8}
                roughness={0.1}
                transparent
                opacity={windowLit ? 0.9 : 0.6}
              />
            </mesh>
          );
        });
      })}

      {/* Side windows - depth facade */}
      {Array.from({ length: b.floors }, (_, fi) => {
        const y = floorH * fi + floorH / 2;
        const sidesPerFloor = Math.max(1, Math.floor(b.d / 0.5));
        return Array.from({ length: sidesPerFloor }, (_, si) => {
          const zPos = -b.d / 2 + (si + 0.5) * (b.d / sidesPerFloor);
          const windowLit = Math.random() > 0.4;
          return (
            <mesh key={`win-s${fi}-${si}`} position={[b.w / 2 + 0.05, y, zPos]}>
              <boxGeometry args={[0.03, floorH * 0.6, b.d / sidesPerFloor * 0.65]} />
              <meshStandardMaterial
                color={windowLit ? windowColor : '#1a2a3a'}
                emissive={windowLit ? windowColor : '#0a1a2a'}
                emissiveIntensity={windowLit ? 2.0 : 0.1}
                metalness={0.8}
                roughness={0.1}
                transparent
                opacity={windowLit ? 0.85 : 0.5}
              />
            </mesh>
          );
        });
      })}
      {Array.from({ length: b.floors }, (_, fi) => {
        const y = floorH * fi + floorH / 2;
        const sidesPerFloor = Math.max(1, Math.floor(b.d / 0.5));
        return Array.from({ length: sidesPerFloor }, (_, si) => {
          const zPos = -b.d / 2 + (si + 0.5) * (b.d / sidesPerFloor);
          const windowLit = Math.random() > 0.4;
          return (
            <mesh key={`win-s2${fi}-${si}`} position={[-(b.w / 2 + 0.05), y, zPos]}>
              <boxGeometry args={[0.03, floorH * 0.6, b.d / sidesPerFloor * 0.65]} />
              <meshStandardMaterial
                color={windowLit ? windowColor : '#1a2a3a'}
                emissive={windowLit ? windowColor : '#0a1a2a'}
                emissiveIntensity={windowLit ? 2.0 : 0.1}
                metalness={0.8}
                roughness={0.1}
                transparent
                opacity={windowLit ? 0.85 : 0.5}
              />
            </mesh>
          );
        });
      })}

      {/* Horizontal floor lines for visual separation */}
      {Array.from({ length: b.floors - 1 }, (_, fi) => {
        const y = floorH * (fi + 1);
        return (
          <mesh key={fi} position={[0, y, b.d / 2 + 0.02]} rotation={[0, 0, 0]}>
            <boxGeometry args={[b.w, 0.06, 0.04]} />
            <meshStandardMaterial color={floorLineColor} emissive={floorLineColor} emissiveIntensity={0.35} metalness={zone.metal * 0.8} roughness={zone.rough} />
          </mesh>
        );
      })}
      {Array.from({ length: b.floors - 1 }, (_, fi) => {
        const y = floorH * (fi + 1);
        return (
          <mesh key={`b${fi}`} position={[0, y, -(b.d / 2 + 0.02)]}>
            <boxGeometry args={[b.w, 0.06, 0.04]} />
            <meshStandardMaterial color={floorLineColor} emissive={floorLineColor} emissiveIntensity={0.35} metalness={zone.metal * 0.8} roughness={zone.rough} />
          </mesh>
        );
      })}

      {/* Balconies on front face (for some buildings) */}
      {hasBalconies && Array.from({ length: Math.max(0, b.floors - 2) }, (_, fi) => {
        const y = floorH * (fi + 2.5);
        return (
          <mesh key={`bal${fi}`} position={[0, y, b.d / 2 + 0.15]}>
            <boxGeometry args={[b.w * 0.95, 0.08, 0.25]} />
            <meshStandardMaterial color={bodyColor} emissive={floorLineColor} emissiveIntensity={0.1} metalness={zone.metal * 0.7} roughness={zone.rough + 0.2} />
          </mesh>
        );
      })}

      {/* Rooftop slab - more detailed */}
      <mesh ref={roofRef} position={[0, b.h, 0]} castShadow>
        <boxGeometry args={[b.w + 0.2, 0.15, b.d + 0.2]} />
        <meshStandardMaterial color={structureColor} emissive={zone.emissive} emissiveIntensity={0.2} metalness={0.88} roughness={0.1} />
      </mesh>

      {/* Rooftop edge trim */}
      {[
        [0, 0, b.d / 2 + 0.1],
        [0, 0, -(b.d / 2 + 0.1)],
      ].map((pos, i) => (
        <mesh key={`edge${i}`} position={pos as [number, number, number]}>
          <boxGeometry args={[b.w + 0.2, 0.1, 0.05]} />
          <meshStandardMaterial color={structureColor} metalness={zone.metal * 0.5} roughness={zone.rough + 0.3} />
        </mesh>
      ))}

      {/* Multiple antenna / communication towers */}
      {b.h > 5 && (
        <>
          <mesh ref={antenRef} position={[-b.w * 0.3, b.h + 0.3, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.6, 5]} />
            <meshStandardMaterial color="#ff4466" emissive="#ff5577" emissiveIntensity={1.8} metalness={0.85} roughness={0.15} />
          </mesh>
          <mesh position={[b.w * 0.3, b.h + 0.35, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.7, 5]} />
            <meshStandardMaterial color="#ff5577" emissive="#ff6688" emissiveIntensity={1.6} metalness={0.85} roughness={0.15} />
          </mesh>
        </>
      )}

      {/* Rooftop AC/mechanical units - multiple boxes */}
      <mesh position={[b.w * 0.3, b.h + 0.2, b.d * 0.35]}>
        <boxGeometry args={[b.w * 0.25, 0.3, b.d * 0.25]} />
        <meshStandardMaterial color={structureColor} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[-b.w * 0.25, b.h + 0.15, -b.d * 0.3]}>
        <boxGeometry args={[b.w * 0.2, 0.25, b.d * 0.2]} />
        <meshStandardMaterial color={'#1a2a3a'} metalness={0.55} roughness={0.45} />
      </mesh>
      <mesh position={[0, b.h + 0.22, -b.d * 0.4]}>
        <boxGeometry args={[b.w * 0.3, 0.28, b.d * 0.18]} />
        <meshStandardMaterial color={structureColor} metalness={0.65} roughness={0.35} />
      </mesh>

      {/* Rooftop details - conduit pipes */}
      {Array.from({ length: 2 }, (_, pi) => (
        <mesh key={`pipe${pi}`} position={[-b.w * 0.2 + pi * b.w * 0.4, b.h + 0.35, b.d * 0.45]}>
          <cylinderGeometry args={[0.03, 0.03, b.h * 0.4, 6]} />
          <meshStandardMaterial color={structureColor} metalness={0.55} roughness={0.45} />
        </mesh>
      ))}
    </group>
  );
}

function ZoneBuildings({ zone, onBuildingClick, isMobile }: { zone: typeof ZONES[0]; onBuildingClick?: (pt: [number, number, number]) => void; isMobile?: boolean }) {
  const data = useMemo<BD[]>(() => {
    const placed: Array<[number, number]> = [];
    const minDist = isMobile ? MIN_DIST * 1.35 : MIN_DIST;
    const sizeScale = isMobile ? 1.15 : 1;
    return Array.from({ length: zone.count }, () => {
      const [x, z] = randInRingSpaced(zone.rMin, zone.rMax, placed, 40, minDist);
      placed.push([x, z]);
      const w = (0.8 + Math.random() * 1.2) * sizeScale;
      const h = zone.hMin + Math.random() * (zone.hMax - zone.hMin);
      const d = (0.8 + Math.random() * 1.2) * sizeScale;
      const floors = Math.max(2, Math.round(h / 1.6));
      return { x, z, w, h, d, floors };
    }).slice(0, Math.max(2, Math.round(zone.count * (isMobile ? 0.6 : 1))));
  }, [zone, isMobile]);

  return (
    <>
      {data.map((b, i) => (
        <DetailedBuilding key={i} b={b} zone={zone} onClick={onBuildingClick} />
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
const ROAD_WIDTH = 2.0;   // main road carriageway
const FOOTPATH_W = 0.6;   // sidewalk on each side
const DASH_LEN = 0.5;
const DASH_GAP = 0.4;
const ROAD_LENGTH = 50;

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
            <meshStandardMaterial color="#4a5568" roughness={0.95} metalness={0.05} />
          </mesh>
          {/* Z-direction road surface */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[pos, 0.01, 0]}>
            <planeGeometry args={[ROAD_WIDTH, ROAD_LENGTH]} />
            <meshStandardMaterial color="#4a5568" roughness={0.95} metalness={0.05} />
          </mesh>
        </group>
      ))}

      {/* ── Footpaths / Sidewalks alongside roads ── */}
      {ROAD_AXES.map(pos => (
        <group key={`fp${pos}`}>
          {/* X-road footpaths (both sides) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, pos + ROAD_WIDTH / 2 + FOOTPATH_W / 2]}>
            <planeGeometry args={[ROAD_LENGTH, FOOTPATH_W]} />
            <meshStandardMaterial color="#8899aa" emissive="#aabbcc" emissiveIntensity={0.15} roughness={0.9} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, pos - ROAD_WIDTH / 2 - FOOTPATH_W / 2]}>
            <planeGeometry args={[ROAD_LENGTH, FOOTPATH_W]} />
            <meshStandardMaterial color="#8899aa" emissive="#aabbcc" emissiveIntensity={0.15} roughness={0.9} />
          </mesh>
          {/* Z-road footpaths (both sides) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[pos + ROAD_WIDTH / 2 + FOOTPATH_W / 2, 0.012, 0]}>
            <planeGeometry args={[FOOTPATH_W, ROAD_LENGTH]} />
            <meshStandardMaterial color="#8899aa" emissive="#aabbcc" emissiveIntensity={0.15} roughness={0.9} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[pos - ROAD_WIDTH / 2 - FOOTPATH_W / 2, 0.012, 0]}>
            <planeGeometry args={[FOOTPATH_W, ROAD_LENGTH]} />
            <meshStandardMaterial color="#8899aa" emissive="#aabbcc" emissiveIntensity={0.15} roughness={0.9} />
          </mesh>

          {/* Neon edge trim on footpaths */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, pos + ROAD_WIDTH / 2 + FOOTPATH_W]}>
            <planeGeometry args={[ROAD_LENGTH, 0.05]} />
            <meshStandardMaterial emissive="#5588cc" emissiveIntensity={0.4} color="#aabbdd" transparent opacity={0.8} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, pos - ROAD_WIDTH / 2 - FOOTPATH_W]}>
            <planeGeometry args={[ROAD_LENGTH, 0.05]} />
            <meshStandardMaterial emissive="#5588cc" emissiveIntensity={0.4} color="#aabbdd" transparent opacity={0.8} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[pos + ROAD_WIDTH / 2 + FOOTPATH_W, 0.015, 0]}>
            <planeGeometry args={[0.05, ROAD_LENGTH]} />
            <meshStandardMaterial emissive="#5588cc" emissiveIntensity={0.4} color="#aabbdd" transparent opacity={0.8} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[pos - ROAD_WIDTH / 2 - FOOTPATH_W, 0.015, 0]}>
            <planeGeometry args={[0.05, ROAD_LENGTH]} />
            <meshStandardMaterial emissive="#5588cc" emissiveIntensity={0.4} color="#aabbdd" transparent opacity={0.8} />
          </mesh>
        </group>
      ))}

      {/* ── Road edge neon lines (carriageway edges) ── */}
      {ROAD_AXES.map(pos => (
        <group key={`edge${pos}`}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.022, pos + ROAD_WIDTH / 2]}>
            <planeGeometry args={[ROAD_LENGTH, 0.04]} />
            <meshStandardMaterial emissive="#6688ff" emissiveIntensity={0.8} color="#aabbdd" transparent opacity={0.9} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.022, pos - ROAD_WIDTH / 2]}>
            <planeGeometry args={[ROAD_LENGTH, 0.04]} />
            <meshStandardMaterial emissive="#6688ff" emissiveIntensity={0.8} color="#aabbdd" transparent opacity={0.9} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[pos + ROAD_WIDTH / 2, 0.022, 0]}>
            <planeGeometry args={[0.04, ROAD_LENGTH]} />
            <meshStandardMaterial emissive="#6688ff" emissiveIntensity={0.8} color="#aabbdd" transparent opacity={0.9} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[pos - ROAD_WIDTH / 2, 0.022, 0]}>
            <planeGeometry args={[0.04, ROAD_LENGTH]} />
            <meshStandardMaterial emissive="#6688ff" emissiveIntensity={0.8} color="#aabbdd" transparent opacity={0.9} />
          </mesh>
        </group>
      ))}

      {/* ── Dashed center lines ── */}
      {dashPositions.map((d, i) => (
        <mesh key={i} rotation={d.rot} position={d.pos}>
          <planeGeometry args={[d.axis === 'x' ? DASH_LEN : 0.06, d.axis === 'x' ? 0.06 : DASH_LEN]} />
          <meshStandardMaterial emissive="#ddcc55" emissiveIntensity={1.0} color="#ffff99" transparent opacity={0.95} />
        </mesh>
      ))}

      {/* ── Crosswalk zebra markings at intersections ── */}
      {crosswalkPositions.map((c, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={c.pos}>
          <planeGeometry args={[0.14, 0.42]} />
          <meshStandardMaterial color="#ffffff" emissive="#ddddff" emissiveIntensity={0.3} transparent opacity={0.85} />
        </mesh>
      ))}

      {/* ── Green park blocks (city blocks with vegetation) ── */}
      {([[9, 9], [-9, 9], [9, -9], [-9, -9]] as [number, number][]).map(([x, z], i) => (
        <group key={i}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.015, z]}>
            <planeGeometry args={[4, 4]} />
            <meshStandardMaterial color="#3a8a4a" emissive="#5ac96a" emissiveIntensity={0.25} transparent opacity={0.95} />
          </mesh>
          {/* Small tree dots */}
          {Array.from({ length: 5 }, (_, t) => {
            const tx = x + (Math.random() - 0.5) * 3;
            const tz = z + (Math.random() - 0.5) * 3;
            return (
              <mesh key={t} position={[tx, 0.4, tz]}>
                <sphereGeometry args={[0.25, 6, 6]} />
                <meshStandardMaterial color="#2a6a3a" emissive="#4a9a5a" emissiveIntensity={0.3} />
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
      <meshStandardMaterial color="#aabbcc" emissive="#6699ff" emissiveIntensity={0.4} transparent opacity={0.4} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function CityScene({ onMapClick, onBuildingClick }: { onMapClick: (pt: [number, number, number]) => void; onBuildingClick?: (pt: [number, number, number]) => void }) {
  const [isMobile, setIsMobile] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth < 720 : false);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 720);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const cameraPos = isMobile ? [26, 36, 26] as [number, number, number] : [22, 28, 22] as [number, number, number];
  const cameraFov = isMobile ? 45 : 38;
  const allIssues = useStore(s => s.issues);
  const timeFilter = useStore(s => s.timeFilter);
  const setSelectedIssueId = useStore(s => s.setSelectedIssueId);
  const maxHour = (timeFilter / 100) * 24;
  const issues = allIssues.filter(i => new Date(i.timestamp).getHours() <= maxHour);

  // Derive environment colors based on timeFilter
  const env = useMemo(() => {
    const t = timeFilter;
    const K = [
      { t: 0, sky: '#020611', amb: '#101827', dir: '#4a7a8f', int: 0.2, fog: '#020611', star: 1 }, // Midnight
      { t: 20, sky: '#071227', amb: '#1a2a4a', dir: '#5a8ab7', int: 0.3, fog: '#163d84ff', star: 0.8 }, // Pre-dawn
      { t: 30, sky: '#ff9f68', amb: '#ffdac1', dir: '#ffc1a1', int: 1.2, fog: '#fcc9b0e2', star: 0.2 }, // Dawn
      { t: 50, sky: '#a6d8ff', amb: '#ffffff', dir: '#fff5d6', int: 2.2, fog: '#cfeefe', star: 0 }, // Noon
      { t: 70, sky: '#ff7e5f', amb: '#feb47b', dir: '#ff9a9e', int: 1.5, fog: '#fcd0bbd2', star: 0.1 }, // Afternoon/Dusk
      { t: 80, sky: '#3a1c71', amb: '#2c3e50', dir: '#4a7a8f', int: 0.6, fog: '#394c5aff', star: 0.6 }, // Evening
      { t: 100, sky: '#020611', amb: '#101827', dir: '#4a7a8f', int: 0.2, fog: '#020611', star: 1 }, // Midnight
    ];

    let i = 0;
    while (i < K.length - 1 && t > K[i + 1].t) i++;
    const k1 = K[i];
    const k2 = K[i + 1];
    const f = (t - k1.t) / (k2.t - k1.t || 1);

    const cSky = new THREE.Color(k1.sky).lerp(new THREE.Color(k2.sky), f);
    const cAmb = new THREE.Color(k1.amb).lerp(new THREE.Color(k2.amb), f);
    const cDir = new THREE.Color(k1.dir).lerp(new THREE.Color(k2.dir), f);
    const cFog = new THREE.Color(k1.fog).lerp(new THREE.Color(k2.fog), f);
    const intensity = k1.int + (k2.int - k1.int) * f;
    const starOp = k1.star + (k2.star - k1.star) * f;

    return { sky: cSky, amb: cAmb, dir: cDir, int: intensity, fog: cFog, star: starOp };
  }, [timeFilter]);

  const dayMode = timeFilter >= 25 && timeFilter < 75;

  return (
    <div style={{ width: '100%', height: '100%', cursor: 'crosshair' }}>
      <Canvas shadows camera={{ position: cameraPos, fov: cameraFov }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: dayMode ? 1.0 : 0.8 }}>
        <color attach="background" args={[env.sky]} />
        <fog attach="fog" args={[env.fog, dayMode ? 60 : 30, dayMode ? 140 : 90]} />

        {/* Lights - Smooth Transitions */}
        <hemisphereLight skyColor={env.sky} groundColor={env.amb} intensity={env.int * 0.3} />
        <ambientLight intensity={env.int * 0.6} color={env.amb} />
        <directionalLight castShadow position={[25, 35, 20]} intensity={env.int} color={env.dir}
          shadow-mapSize={[2048, 2048]} shadow-bias={-0.00015}>
          <orthographicCamera attach="shadow-camera" args={[-30, 30, 30, -30]} />
        </directionalLight>

        <pointLight position={[0, 18, 0]} intensity={env.int * 0.2} color={env.dir} distance={50} />

        {env.star > 0.05 && <Stars radius={80} depth={25} count={400} factor={2.5} fade opacity={env.star} />}

        <group position={[0, -1.5, 0]}>
          <RoadNetwork onMapClick={onMapClick} />
          <DataRing />
          {useMemo(() => ZONES.map((z, i) => <ZoneBuildings key={i} zone={z} onBuildingClick={onBuildingClick} isMobile={isMobile} />), [isMobile, onBuildingClick])}
          <WindowLights />

          {/* Drones */}
          <Drone radius={15} height={9} speed={0.35} phase={0} />
          <Drone radius={9} height={13} speed={0.55} phase={2.1} />
          <Drone radius={18} height={6} speed={0.25} phase={4.2} />
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
