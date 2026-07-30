import { useEffect, useRef, useState } from 'react';
import type { SimulationResult } from '../scenario/types';
import './CityVisualizer.css';

interface CityVisualizerProps {
  result: SimulationResult;
}

export default function CityVisualizer({ result }: CityVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState({ x: 30, y: 45 });
  const [isHovered, setIsHovered] = useState(false);

  // Extract AQI value and charger parameters from simulated metrics
  const allDetails = result.impacts?.flatMap(axis => axis.details || []) || [];
  
  // Dynamic parsing supporting multiple languages
  const aqiValue = (() => {
    const aqi = allDetails.find(d => 
      d.metric.toLowerCase().includes('aqi') || 
      d.metric.toLowerCase().includes('pm2.5') || 
      d.metric.toLowerCase().includes('air quality') ||
      d.metric.toLowerCase().includes('वायु')
    );
    if (!aqi) return 75; // Default average
    const val = parseFloat(String(aqi.value));
    return isNaN(val) ? 75 : val;
  })();

  const chargerCount = (() => {
    const chargers = allDetails.find(d => 
      d.metric.toLowerCase().includes('charger') || 
      d.metric.toLowerCase().includes('charging') || 
      d.metric.toLowerCase().includes('station') ||
      d.metric.toLowerCase().includes('चार्जिंग')
    );
    if (!chargers) return 10; // Default count
    const val = parseFloat(String(chargers.value));
    return isNaN(val) ? 10 : val;
  })();

  // Track mouse moves for interactive grid tilting
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) - 0.5; // -0.5 to 0.5
    const y = ((e.clientY - rect.top) / rect.height) - 0.5;
    setRotation({
      x: 30 + y * 15,
      y: 45 + x * 20
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    
    // Scale canvas for high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const width = 380;
    const height = 230;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Grid details
    const gridCols = 5;
    const gridRows = 5;
    const tileW = 38;
    const tileH = 20;
    const originX = width / 2;
    // Push origin down so tall buildings don't clip into header area
    const originY = height * 0.60;

    // Building heights (deterministic random based on grid)
    const buildingHeights = [
      [30, 45, 20, 60, 40],
      [40, 20, 50, 25, 55],
      [25, 60, 30, 45, 20],
      [55, 30, 40, 20, 50],
      [20, 50, 25, 60, 35]
    ];

    // Particle pool for emissions animation
    const particles: Array<{x: number, y: number, z: number, speed: number, size: number, opacity: number}> = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 160,
        y: (Math.random() - 0.5) * 160,
        z: Math.random() * 80,
        speed: 0.4 + Math.random() * 0.6,
        size: 2 + Math.random() * 4,
        opacity: Math.random()
      });
    }

    // Determine particle color and emission rate based on AQI
    // Green (healthy) -> Yellow (moderate) -> Red (poor)
    const emissionColor = (() => {
      if (aqiValue < 50) return { r: 16, g: 185, b: 129 }; // Green
      if (aqiValue < 120) return { r: 245, g: 158, b: 11 }; // Orange
      return { r: 239, g: 68, b: 68 }; // Red
    })();

    let pulseAngle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      pulseAngle += 0.05;

      const angleRadX = (rotation.x * Math.PI) / 180;
      const angleRadZ = (rotation.y * Math.PI) / 180;

      // Project grid point into 2.5D space
      const project = (x: number, y: number, z = 0) => {
        // Rotate around Z axis (horizontal rotation)
        const rotX = x * Math.cos(angleRadZ) - y * Math.sin(angleRadZ);
        const rotY = x * Math.sin(angleRadZ) + y * Math.cos(angleRadZ);
        
        // Tilt via X axis (isometric view)
        const projX = originX + rotX;
        const projY = originY + rotY * Math.sin(angleRadX) - z * Math.cos(angleRadX);
        return { x: projX, y: projY };
      };

      // Draw base boundary ring
      ctx.beginPath();
      ctx.arc(originX, originY + 20, 110, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Render 3D isometric columns
      for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
          const gridX = (c - gridCols / 2) * tileW;
          const gridY = (r - gridRows / 2) * tileW;
          const h = buildingHeights[r][c];

          // Project bottom coordinate
          const ptBase = project(gridX, gridY, 0);
          const ptTop = project(gridX, gridY, h);

          // Isometric building side colors
          // Left side
          ctx.beginPath();
          ctx.moveTo(ptBase.x, ptBase.y);
          ctx.lineTo(ptTop.x, ptTop.y);
          
          const ptLeftBase = project(gridX - tileW / 2 + 5, gridY, 0);
          const ptLeftTop = project(gridX - tileW / 2 + 5, gridY, h);
          ctx.lineTo(ptLeftTop.x, ptLeftTop.y);
          ctx.lineTo(ptLeftBase.x, ptLeftBase.y);
          ctx.closePath();
          ctx.fillStyle = 'rgba(168, 85, 247, 0.08)'; // Purple overlay
          ctx.fill();
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.2)';
          ctx.stroke();

          // Right side
          ctx.beginPath();
          ctx.moveTo(ptBase.x, ptBase.y);
          ctx.lineTo(ptTop.x, ptTop.y);
          
          const ptRightBase = project(gridX, gridY - tileW / 2 + 5, 0);
          const ptRightTop = project(gridX, gridY - tileW / 2 + 5, h);
          ctx.lineTo(ptRightTop.x, ptRightTop.y);
          ctx.lineTo(ptRightBase.x, ptRightBase.y);
          ctx.closePath();
          ctx.fillStyle = 'rgba(6, 182, 212, 0.08)'; // Cyan overlay
          ctx.fill();
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
          ctx.stroke();

          // Top Face (Diamond cap)
          ctx.beginPath();
          ctx.moveTo(ptTop.x, ptTop.y);
          ctx.lineTo(ptLeftTop.x, ptLeftTop.y);
          
          const ptTopOpp = project(gridX - tileW / 2 + 5, gridY - tileW / 2 + 5, h);
          ctx.lineTo(ptTopOpp.x, ptTopOpp.y);
          ctx.lineTo(ptRightTop.x, ptRightTop.y);
          ctx.closePath();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.stroke();
        }
      }

      // Draw EV charging network nodes (pulsing green circles)
      // Display node density based on the calculated chargerCount
      const maxBeacons = Math.min(6, Math.max(2, Math.floor(chargerCount / 5)));
      for (let i = 0; i < maxBeacons; i++) {
        // Deterministic placement on grid corners
        const positions = [
          { c: 0, r: 0 },
          { c: 4, r: 4 },
          { c: 0, r: 4 },
          { c: 4, r: 0 },
          { c: 2, r: 2 },
          { c: 1, r: 3 }
        ];
        const pos = positions[i % positions.length];
        const pX = (pos.c - gridCols / 2) * tileW - tileW/4;
        const pY = (pos.r - gridRows / 2) * tileW - tileW/4;
        
        const center = project(pX, pY, 0);
        
        // Pulse animation
        const pulse = 10 + Math.sin(pulseAngle + i) * 6;
        ctx.beginPath();
        ctx.arc(center.x, center.y, pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Solid inner core
        ctx.beginPath();
        ctx.arc(center.x, center.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow
      }

      // Render floating air quality particles
      // Higher AQI triggers more particles rising up
      const particleLimit = Math.min(40, Math.max(10, Math.floor(aqiValue / 4)));
      for (let i = 0; i < particleLimit; i++) {
        const p = particles[i];
        p.z += p.speed;
        if (p.z > 90) {
          p.z = 0;
          p.x = (Math.random() - 0.5) * 160;
          p.y = (Math.random() - 0.5) * 160;
        }

        const screenPos = project(p.x, p.y, p.z);
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${emissionColor.r}, ${emissionColor.g}, ${emissionColor.b}, ${0.5 * (1 - p.z / 90)})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [rotation, aqiValue, chargerCount]);

  return (
    <div 
      className="city-visualizer glass"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setRotation({ x: 30, y: 45 });
      }}
    >
      {/* Header row — sits ABOVE canvas, not overlaid */}
      <div className="city-visualizer__header">
        <h4>🌍 Real-time Digital Simulation</h4>
        <div className="visualizer-stats">
          <div className="stat-pill">
            <span className="stat-label">Air Emissions:</span>
            <span className="stat-value" style={{ color: aqiValue < 50 ? '#10b981' : aqiValue < 120 ? '#f59e0b' : '#ef4444' }}>
              {aqiValue < 50 ? 'Healthy' : aqiValue < 120 ? 'Moderate' : 'Unhealthy'}
            </span>
          </div>
          <div className="stat-pill">
            <span className="stat-label">Charging Grid:</span>
            <span className="stat-value" style={{ color: '#10b981' }}>Active</span>
          </div>
        </div>
      </div>

      {/* Canvas below header — no overlap */}
      <div className="city-visualizer__canvas-wrapper">
        <canvas ref={canvasRef} />
        <span className="city-visualizer__interactive-tag">
          {isHovered ? '🔄 Move mouse to tilt' : '🎯 Interactive 3D Model'}
        </span>
      </div>
    </div>
  );
}
