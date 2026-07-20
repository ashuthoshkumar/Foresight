import React, { useState, useEffect, useRef } from 'react';
import './AIMayor.css';

interface AIMayorProps {
  scenarioQuery: string;
  overallScore: number;
  overallSummary: string;
}

export default function AIMayor({ scenarioQuery, overallScore, overallSummary }: AIMayorProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bars, setBars] = useState<number[]>(Array(20).fill(4));
  const animFrameRef = useRef<number | null>(null);

  // Build the mayoral briefing script
  const buildBriefing = () => {
    const grade =
      overallScore >= 75 ? 'an outstanding success'
      : overallScore >= 60 ? 'a moderately positive outcome'
      : overallScore >= 40 ? 'a mixed result with significant concerns'
      : 'a high-risk situation that demands immediate attention';

    return (
      `Attention citizens of Hyderabad. ` +
      `This is your AI Mayor speaking with an official briefing. ` +
      `Our simulation engines have completed their analysis of the following proposal: ` +
      `"${scenarioQuery}". ` +
      `The verdict is in. This initiative has been rated ${grade}, ` +
      `with an overall impact score of ${Math.round(overallScore)} out of 100. ` +
      `${overallSummary} ` +
      `My administration will continue to monitor all outcomes. ` +
      `Thank you, and together we build a smarter, better Hyderabad.`
    );
  };

  // Animate the waveform bars while speaking
  const animateBars = () => {
    setBars(prev => prev.map(() => Math.random() * 40 + 4));
    animFrameRef.current = requestAnimationFrame(animateBars) as unknown as number;
  };

  const stopAnimation = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setBars(Array(20).fill(4));
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert('Your browser does not support Text-to-Speech. Please try Chrome or Edge.');
      return;
    }

    setIsLoading(true);
    window.speechSynthesis.cancel(); // Cancel any ongoing speech

    const utterance = new SpeechSynthesisUtterance(buildBriefing());

    // Pick a good English voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.name.includes('Google UK English Male') ||
      v.name.includes('Daniel') ||
      v.name.includes('Alex') ||
      v.name.includes('Male')
    ) || voices.find(v => v.lang.startsWith('en'));
    if (preferred) utterance.voice = preferred;

    utterance.rate = 0.92;
    utterance.pitch = 0.85;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsLoading(false);
      setIsSpeaking(true);
      animateBars();
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      stopAnimation();
    };

    utterance.onerror = () => {
      setIsLoading(false);
      setIsSpeaking(false);
      stopAnimation();
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    stopAnimation();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      stopAnimation();
    };
  }, []);

  // Load voices (Chrome needs this trigger)
  useEffect(() => {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      window.speechSynthesis.getVoices();
    });
  }, []);

  const scoreColor =
    overallScore >= 75 ? '#10b981'
    : overallScore >= 50 ? '#06b6d4'
    : overallScore >= 25 ? '#f59e0b'
    : '#ef4444';

  return (
    <div className="ai-mayor">
      {/* Avatar */}
      <div className={`ai-mayor__avatar-wrap ${isSpeaking ? 'ai-mayor__avatar-wrap--speaking' : ''}`}>
        <div className="ai-mayor__avatar-ring" style={{ '--ring-color': scoreColor } as React.CSSProperties} />
        <div className="ai-mayor__avatar">
          <div className="ai-mayor__avatar-face">
            {/* Eyes */}
            <div className="ai-mayor__eyes">
              <div className={`ai-mayor__eye ${isSpeaking ? 'ai-mayor__eye--blink' : ''}`} />
              <div className={`ai-mayor__eye ${isSpeaking ? 'ai-mayor__eye--blink' : ''}`} />
            </div>
            {/* Mouth */}
            <div className={`ai-mayor__mouth ${isSpeaking ? 'ai-mayor__mouth--talking' : ''}`} />
          </div>
        </div>
        {/* Orbiting particles */}
        {isSpeaking && (
          <>
            <div className="ai-mayor__particle ai-mayor__particle--1" style={{ '--p-color': scoreColor } as React.CSSProperties} />
            <div className="ai-mayor__particle ai-mayor__particle--2" style={{ '--p-color': scoreColor } as React.CSSProperties} />
            <div className="ai-mayor__particle ai-mayor__particle--3" style={{ '--p-color': scoreColor } as React.CSSProperties} />
          </>
        )}
      </div>

      {/* Info */}
      <div className="ai-mayor__info">
        <div className="ai-mayor__title">AI Mayor of Hyderabad</div>
        <div className="ai-mayor__status" style={{ color: isSpeaking ? scoreColor : 'var(--text-tertiary)' }}>
          {isLoading ? '⏳ Preparing briefing...' : isSpeaking ? '🔊 Delivering official briefing...' : '🎙️ Click to hear the official AI briefing'}
        </div>
      </div>

      {/* Waveform visualizer */}
      <div className="ai-mayor__waveform">
        {bars.map((h, i) => (
          <div
            key={i}
            className="ai-mayor__bar"
            style={{
              height: `${h}px`,
              background: isSpeaking ? scoreColor : 'var(--border-light)',
              transition: isSpeaking ? 'height 0.08s ease' : 'height 0.3s ease',
              opacity: isSpeaking ? 0.8 : 0.3,
            }}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="ai-mayor__controls">
        {!isSpeaking && !isLoading && (
          <button className="ai-mayor__btn ai-mayor__btn--speak" onClick={handleSpeak}>
            🎙️ Hear Briefing
          </button>
        )}
        {(isSpeaking || isLoading) && (
          <button className="ai-mayor__btn ai-mayor__btn--stop" onClick={handleStop}>
            ⏹ Stop
          </button>
        )}
      </div>
    </div>
  );
}
