import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sky, Stars, Cloud, Float, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface City3DProps {
  score: number;
}

// === Seeded random for consistent layout across re-renders ===
function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

// ── Animated wind turbine for green city ──────────────────
function WindTurbine({ position }: { position: [number, number, number] }) {
  const bladesRef = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    if (bladesRef.current) bladesRef.current.rotation.z += delta * 2;
  });
  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 5, 8]} />
        <meshStandardMaterial color="#e0e0e0" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Blades */}
      <mesh ref={bladesRef} position={[0, 5, 0.1]}>
        <torusGeometry args={[1.5, 0.08, 8, 3]} />
        <meshStandardMaterial color="#ffffff" metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ── Lush tree for green city ──────────────────────────────
function Tree({ position }: { position: [number, number, number] }) {
  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
      <group position={position}>
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.15, 0.2, 0.8, 6]} />
          <meshStandardMaterial color="#5c3317" roughness={1} />
        </mesh>
        <mesh position={[0, 1.6, 0]}>
          <sphereGeometry args={[0.9, 8, 8]} />
          <meshStandardMaterial color="#27ae60" roughness={0.8} />
        </mesh>
        <mesh position={[0, 2.5, 0]}>
          <sphereGeometry args={[0.6, 8, 8]} />
          <meshStandardMaterial color="#2ecc71" roughness={0.8} />
        </mesh>
      </group>
    </Float>
  );
}

// ── Solar panel array for green city ─────────────────────
function SolarPanel({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 5, 0, 0]} position={[0, 0.5, 0]}>
        <boxGeometry args={[2.5, 0.1, 1.5]} />
        <meshStandardMaterial color="#1e3a8a" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

// ── Industrial smokestack for bad city ────────────────────
function Smokestack({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[0.5, 0.8, 6, 10]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.9} />
      </mesh>
      {/* Red warning stripe */}
      <mesh position={[0, 5.5, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.5, 10]} />
        <meshStandardMaterial color="#cc0000" roughness={0.5} />
      </mesh>
    </group>
  );
}

// ── Animated polluted smoke ───────────────────────────────
function PollutionCloud({ position }: { position: [number, number, number] }) {
  return (
    <Cloud
      position={position}
      opacity={0.4}
      speed={0.3}
      width={6}
      depth={2}
      segments={8}
      color="#555555"
    />
  );
}

// ── The main city layout ──────────────────────────────────
function CityLayout({ score }: { score: number }) {
  const isGood = score >= 70;
  const isBad = score < 40;

  // Deterministic building grid
  const buildings = useMemo(() => {
    const items = [];
    let seed = 1;
    for (let i = 0; i < 45; i++) {
      const x = (seededRandom(seed++) - 0.5) * 28;
      const z = (seededRandom(seed++) - 0.5) * 28;
      if (Math.abs(x) < 4 && Math.abs(z) < 4) { seed += 3; continue; }

      const height = seededRandom(seed++) * 5 + 1.5;
      const width = seededRandom(seed++) * 1.2 + 0.8;
      const depth = seededRandom(seed++) * 1.2 + 0.8;

      let color: string;
      if (isGood) {
        // Warm glass-and-steel modern buildings
        const palette = ['#4fc3f7','#81d4fa','#b3e5fc','#4dd0e1','#80cbc4','#a5d6a7'];
        color = palette[Math.floor(seededRandom(seed++) * palette.length)];
      } else if (isBad) {
        // Dark grim industrial buildings
        const palette = ['#37474f','#455a64','#546e7a','#4e342e','#3e2723','#bf360c'];
        color = palette[Math.floor(seededRandom(seed++) * palette.length)];
      } else {
        // Neutral city
        const palette = ['#78909c','#90a4ae','#b0bec5','#bdbdbd','#eeeeee'];
        color = palette[Math.floor(seededRandom(seed++) * palette.length)];
      }

      items.push({ position: [x, height / 2, z] as [number, number, number], scale: [width, height, depth] as [number, number, number], color });
    }
    return items;
  }, [isGood, isBad]);

  // Deterministic trees (only in good scenario)
  const trees = useMemo(() => {
    if (!isGood) return [];
    const items = [];
    let seed = 200;
    for (let i = 0; i < 15; i++) {
      items.push([(seededRandom(seed++) - 0.5) * 24, 0, (seededRandom(seed++) - 0.5) * 24] as [number, number, number]);
    }
    return items;
  }, [isGood]);

  // Deterministic wind turbines
  const turbines = useMemo(() => {
    if (!isGood) return [];
    const items = [];
    let seed = 400;
    for (let i = 0; i < 4; i++) {
      items.push([(seededRandom(seed++) - 0.5) * 20, 0, (seededRandom(seed++) - 0.5) * 20] as [number, number, number]);
    }
    return items;
  }, [isGood]);

  // Solar panels (for good)
  const solarPanels = useMemo(() => {
    if (!isGood) return [];
    const items = [];
    let seed = 600;
    for (let i = 0; i < 6; i++) {
      items.push([(seededRandom(seed++) - 0.5) * 22, 0, (seededRandom(seed++) - 0.5) * 22] as [number, number, number]);
    }
    return items;
  }, [isGood]);

  // Smokestacks (for bad)
  const smokestacks = useMemo(() => {
    if (!isBad) return [];
    const items = [];
    let seed = 800;
    for (let i = 0; i < 6; i++) {
      items.push([(seededRandom(seed++) - 0.5) * 20, 0, (seededRandom(seed++) - 0.5) * 20] as [number, number, number]);
    }
    return items;
  }, [isBad]);

  // Pollution clouds (for bad)
  const pollutionClouds = useMemo(() => {
    if (!isBad) return [];
    const items = [];
    let seed = 1000;
    for (let i = 0; i < 8; i++) {
      items.push([(seededRandom(seed++) - 0.5) * 25, 3 + seededRandom(seed++) * 4, (seededRandom(seed++) - 0.5) * 25] as [number, number, number]);
    }
    return items;
  }, [isBad]);

  const groundColor = isGood ? '#1a5c2a' : isBad ? '#1a0f0a' : '#2a2a35';
  const roadColor = isGood ? '#3d3d3d' : isBad ? '#1a1a1a' : '#2a2a2a';

  return (
    <>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color={groundColor} roughness={1} />
      </mesh>

      {/* Road grid */}
      {[-10, -5, 0, 5, 10].map(offset => (
        <React.Fragment key={`road-${offset}`}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[offset, 0.01, 0]}>
            <planeGeometry args={[0.8, 50]} />
            <meshStandardMaterial color={roadColor} roughness={0.9} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, offset]}>
            <planeGeometry args={[50, 0.8]} />
            <meshStandardMaterial color={roadColor} roughness={0.9} />
          </mesh>
        </React.Fragment>
      ))}

      {/* Buildings */}
      {buildings.map((b, i) => (
        <mesh key={`b-${i}`} position={b.position} castShadow receiveShadow>
          <boxGeometry args={b.scale} />
          <meshStandardMaterial color={b.color} roughness={0.4} metalness={isGood ? 0.3 : 0.1} />
        </mesh>
      ))}

      {/* Green city extras */}
      {trees.map((pos, i) => <Tree key={`tree-${i}`} position={pos} />)}
      {turbines.map((pos, i) => <WindTurbine key={`turbine-${i}`} position={pos} />)}
      {solarPanels.map((pos, i) => <SolarPanel key={`solar-${i}`} position={pos} />)}

      {/* Bad city extras */}
      {smokestacks.map((pos, i) => <Smokestack key={`stack-${i}`} position={pos} />)}
      {pollutionClouds.map((pos, i) => <PollutionCloud key={`cloud-${i}`} position={pos} />)}
    </>
  );
}

// ── Overlay UI ────────────────────────────────────────────
function CityOverlay({ score }: { score: number }) {
  const isGood = score >= 70;
  const isBad = score < 40;

  const status = isGood
    ? { label: 'Thriving City', color: '#10b981', bg: 'rgba(16, 185, 129, 0.2)', icon: '🌿' }
    : isBad
    ? { label: 'Crisis Zone', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)', icon: '☠️' }
    : { label: 'Neutral City', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.2)', icon: '🏙️' };

  const facts = isGood
    ? ['✅ Clean energy deployed', '✅ Green spaces abundant', '✅ Low pollution levels']
    : isBad
    ? ['❌ Heavy industrial smog', '❌ Unhealthy air quality', '❌ Ecological crisis']
    : ['⚠️ Moderate air quality', '⚠️ Mixed energy sources', '⚠️ Under development'];

  return (
    <>
      {/* Top-left: Status badge */}
      <div style={{
        position: 'absolute', top: 12, left: 12,
        background: status.bg,
        border: `1px solid ${status.color}`,
        borderRadius: 8, padding: '6px 14px',
        color: status.color, fontWeight: 700,
        fontSize: '0.85rem', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', gap: 6,
        pointerEvents: 'none'
      }}>
        {status.icon} {status.label}
      </div>

      {/* Top-right: Score */}
      <div style={{
        position: 'absolute', top: 12, right: 12,
        background: 'rgba(0,0,0,0.7)',
        borderRadius: 8, padding: '6px 14px',
        color: '#fff', fontSize: '0.8rem',
        backdropFilter: 'blur(8px)',
        pointerEvents: 'none'
      }}>
        Impact Score: <span style={{ color: status.color, fontWeight: 700 }}>{Math.round(score)}/100</span>
      </div>

      {/* Bottom-left: Legend */}
      <div style={{
        position: 'absolute', bottom: 12, left: 12,
        background: 'rgba(0,0,0,0.65)',
        borderRadius: 8, padding: '8px 12px',
        fontSize: '0.72rem', color: '#ccc',
        backdropFilter: 'blur(8px)',
        pointerEvents: 'none', lineHeight: 1.8
      }}>
        {facts.map((f, i) => <div key={i}>{f}</div>)}
      </div>

      {/* Bottom-right: Controls hint */}
      <div style={{
        position: 'absolute', bottom: 12, right: 12,
        background: 'rgba(0,0,0,0.5)',
        borderRadius: 6, padding: '4px 10px',
        fontSize: '0.68rem', color: '#888',
        pointerEvents: 'none'
      }}>
        🖱️ Drag to rotate · Scroll to zoom
      </div>
    </>
  );
}

// ── Main export ───────────────────────────────────────────
export default function City3D({ score }: City3DProps) {
  const isGood = score >= 70;
  const isBad = score < 40;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', borderRadius: '16px', overflow: 'hidden', background: '#050816' }}>
      <Canvas shadows camera={{ position: [18, 12, 18], fov: 42 }}>
        {/* Scene Atmosphere */}
        {isGood ? (
          <>
            <color attach="background" args={['#87ceeb']} />
            <Sky distance={45000} sunPosition={[100, 20, 100]} inclination={0.1} azimuth={0.3} />
            <ambientLight intensity={0.7} color="#fffaf0" />
            <directionalLight castShadow position={[20, 30, 10]} intensity={2} color="#fff5e0" shadow-mapSize={[2048, 2048]} />
            <hemisphereLight args={['#87ceeb', '#2d5a1b', 0.3]} />
            <Environment preset="dawn" />
          </>
        ) : isBad ? (
          <>
            <color attach="background" args={['#1a0a08']} />
            <fog attach="fog" args={['#330a00', 8, 35]} />
            <ambientLight intensity={0.15} color="#ff6600" />
            <directionalLight castShadow position={[10, 15, 10]} intensity={0.4} color="#ff3300" shadow-mapSize={[1024, 1024]} />
            <hemisphereLight args={['#ff2200', '#111', 0.2]} />
            <Stars radius={80} depth={50} count={200} factor={2} fade />
          </>
        ) : (
          <>
            <color attach="background" args={['#0f1a2e']} />
            <fog attach="fog" args={['#1a2a4a', 20, 50]} />
            <ambientLight intensity={0.4} color="#a0c4ff" />
            <directionalLight castShadow position={[10, 20, 10]} intensity={0.8} color="#c9e0ff" shadow-mapSize={[1024, 1024]} />
            <hemisphereLight args={['#1a3a6a', '#111', 0.3]} />
            <Stars radius={100} depth={50} count={500} factor={3} fade />
          </>
        )}

        <CityLayout score={score} />

        <OrbitControls
          enablePan={false}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={12}
          maxDistance={35}
          autoRotate
          autoRotateSpeed={0.4}
        />
      </Canvas>

      <CityOverlay score={score} />
    </div>
  );
}
