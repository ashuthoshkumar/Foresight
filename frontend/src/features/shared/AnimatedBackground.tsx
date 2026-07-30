import React from 'react';
import './AnimatedBackground.css';

export default function AnimatedBackground() {
  // Define 3D wireframe towers with custom coordinate spreads and heights
  const buildings = [
    { x: -180, y: -160, h: 80, w: 20 },
    { x: -100, y: -220, h: 140, w: 25 },
    { x: -40, y: -180, h: 100, w: 20 },
    { x: 80, y: -200, h: 160, w: 30 },
    { x: 160, y: -120, h: 90, w: 22 },
    { x: 220, y: -40, h: 120, w: 24 },
    { x: 180, y: 80, h: 180, w: 28 },
    { x: 120, y: 180, h: 110, w: 22 },
    { x: 20, y: 220, h: 150, w: 26 },
    { x: -80, y: 160, h: 90, w: 20 },
    { x: -160, y: 100, h: 130, w: 24 },
    { x: -220, y: -20, h: 70, w: 18 },
  ];

  return (
    <div className="animated-bg" aria-hidden="true">
      <div className="animated-bg__stars" />
      <div className="animated-bg__glow animated-bg__glow--purple" />
      <div className="animated-bg__glow animated-bg__glow--green" />
      
      {/* Interactive 3D Holographic Space */}
      <div className="animated-bg__city-container">
        <div className="animated-bg__city">
          {/* Base Grid Plane */}
          <div className="animated-bg__grid-plane" />
          
          {/* Render Perpendicular Cross Hologram Columns */}
          {buildings.map((b, i) => (
            <div 
              key={i} 
              className="building-3d" 
              style={{
                left: `calc(50% + ${b.x}px)`,
                top: `calc(50% + ${b.y}px)`,
                width: `${b.w}px`,
                height: `${b.h}px`,
                '--building-height': `${b.h}px`,
                '--building-width': `${b.w}px`
              } as React.CSSProperties}
            >
              {/* Crossed panels create the volumetric 3D hologram visual */}
              <div className="building-3d__face" />
              <div className="building-3d__face building-3d__face--cross" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
