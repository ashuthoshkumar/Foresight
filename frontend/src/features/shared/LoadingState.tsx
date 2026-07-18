import { useState, useEffect } from 'react';
import './LoadingState.css';

const STEPS = [
  { label: 'Interpreting your scenario…', icon: '🧠' },
  { label: 'Querying knowledge graph…', icon: '🔍' },
  { label: 'Running calculations…', icon: '📊' },
  { label: 'Generating AI analysis…', icon: '🤖' },
  { label: 'Compiling results…', icon: '✨' },
];

export default function LoadingState() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(prev => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-state">
      <div className="loading-state__orb-container">
        <div className="loading-state__orb" />
        <div className="loading-state__ring" />
        <div className="loading-state__ring loading-state__ring--inner" />
        <div className="loading-state__icon">🔮</div>
      </div>

      <div className="loading-state__text">
        <div className="loading-state__title">Simulating Future Outcomes</div>
        <div className="loading-state__subtitle">
          Our AI is analyzing your scenario across financial, environmental, human, risk, and opportunity dimensions.
        </div>
      </div>

      <div className="loading-state__steps">
        {STEPS.map((step, i) => {
          let status: 'done' | 'active' | 'pending' = 'pending';
          if (i < activeStep) status = 'done';
          else if (i === activeStep) status = 'active';

          return (
            <div key={i} className={`loading-state__step loading-state__step--${status}`}>
              <span className="loading-state__step-icon">
                {status === 'done' ? '✓' : step.icon}
              </span>
              {step.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
