import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './LoadingState.css';

const STEPS_COUNT = 5;

export default function LoadingState() {
  const { t } = useTranslation();
  
  const STEPS = [
    { label: t('loading.steps.s1'), icon: '🧠' },
    { label: t('loading.steps.s2'), icon: '🔍' },
    { label: t('loading.steps.s3'), icon: '📊' },
    { label: t('loading.steps.s4'), icon: '🤖' },
    { label: t('loading.steps.s5'), icon: '✨' },
  ];

  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(prev => (prev < STEPS_COUNT - 1 ? prev + 1 : prev));
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
        <div className="loading-state__title">{t('loading.title')}</div>
        <div className="loading-state__subtitle">
          {t('loading.subtitle')}
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
