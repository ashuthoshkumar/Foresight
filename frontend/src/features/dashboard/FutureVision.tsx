import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../auth/AuthContext';

interface FutureVisionProps {
  scenarioSummary: string;
  scenarioQuery: string;
  city: string;
}

export default function FutureVision({ scenarioSummary, scenarioQuery, city }: FutureVisionProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [error, setError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { user } = useAuth();
  
  const isLocked = !user?.is_admin && user?.tier === 'free';

  useEffect(() => {
    if (isLocked) return;
    
    let mounted = true;
    setIsScanning(true);
    setError(false);
    setImageLoaded(false);
    setImageUrl(null);

    // Simulate initial 'scanning' phase before fetching
    const timer = setTimeout(() => {
      api.generateVision(scenarioSummary, city, scenarioQuery)
        .then(res => {
          if (mounted && res.image_url) {
            setImageUrl(res.image_url);
            setDescription(res.description || null);
          }
        })
        .catch(err => {
          console.error('Vision gen failed', err);
          if (mounted) {
            setError(true);
            setIsScanning(false);
          }
        });
    }, 1200);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [scenarioSummary, city, scenarioQuery, isLocked]);

  // When the image actually loads in the browser, reveal it
  const handleImageLoad = () => {
    setImageLoaded(true);
    setIsScanning(false);
  };

  const handleImageError = () => {
    setError(true);
    setIsScanning(false);
  };

  return (
    <div style={{ borderRadius: '16px', overflow: 'hidden', position: 'relative', marginTop: '2rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {isLocked && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h3 style={{ color: 'white', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Future Vision is a Pro Feature</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '400px' }}>Upgrade to Foresight Pro to visualize your scenarios with high-resolution AI generated imagery.</p>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-paywall'))}
            style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
          >
            Upgrade to Pro
          </button>
        </div>
      )}
      
      <div style={{ padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <span>📸</span> Future Vision Camera
        </h3>
        {isScanning && (
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite' }} />
            Rendering 2030...
          </div>
        )}
      </div>

      <div style={{ position: 'relative', width: '100%', minHeight: '300px', background: '#0b1120', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Scanning animation overlay */}
        {isScanning && (
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 2 }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
              background: 'linear-gradient(to right, transparent, rgba(56, 189, 248, 0.9), transparent)',
              animation: 'scanDown 2s linear infinite',
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid var(--accent-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <div style={{ fontSize: '0.9rem' }}>Generating AI Vision...</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>This may take a few seconds</div>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !isScanning && (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔭</div>
            <div>Could not establish connection to the future.</div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.5rem' }}>AI image generation is temporarily unavailable</div>
          </div>
        )}

        {/* The image (hidden until loaded) */}
        {imageUrl && (
          <img 
            src={imageUrl} 
            alt={`Future Vision of ${city}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ 
              width: '100%', 
              height: 'auto',
              minHeight: '300px',
              maxHeight: '450px',
              objectFit: 'cover', 
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.8s ease-out',
            }} 
          />
        )}
      </div>

      {/* Caption & Description */}
      {imageLoaded && (
        <div style={{ background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {description && (
            <div style={{ 
              padding: '1rem 1.5rem', 
              fontSize: '0.9rem', 
              color: 'var(--text-secondary)',
              borderBottom: '1px solid rgba(255,255,255,0.02)',
              lineHeight: 1.5
            }}>
              {description}
            </div>
          )}
          <div style={{ 
            padding: '0.6rem 1.5rem', 
            fontSize: '0.75rem', 
            color: 'rgba(255,255,255,0.4)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>🤖 AI-generated visualization of {city}'s future</span>
            <span style={{ fontStyle: 'italic' }}>Powered by Pollinations AI</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scanDown {
          0% { transform: translateY(-10px); }
          100% { transform: translateY(300px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
