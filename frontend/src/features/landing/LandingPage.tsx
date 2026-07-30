import { useTranslation, Trans } from 'react-i18next';
import './LandingPage.css';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export default function LandingPage({ onOpenAuth }: LandingPageProps) {
  const { t } = useTranslation();

  return (
    <div className="landing">
      {/* Top Navbar */}
      <nav className="landing__nav">
        <div className="landing__nav-inner">
          <div className="landing__brand">
            <div className="landing__logo">🔮</div>
            <div className="landing__brand-text">
              <span className="landing__title gradient-text">{t('nav.foresight', 'Foresight')}</span>
              <span className="landing__subtitle">{t('nav.aiDecisionEngine', 'AI Decision Engine')}</span>
            </div>
          </div>
          <div className="landing__auth-actions">
            <button className="landing__btn landing__btn--login" onClick={() => onOpenAuth('login')}>
              {t('auth.login', 'Login')}
            </button>
            <button className="landing__btn landing__btn--register" onClick={() => onOpenAuth('register')}>
              {t('auth.register', 'Register')}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="landing__main">
        <div className="landing__hero">
          <div className="landing__badge animate-fade-in-up">
            <span className="landing__badge-dot" />
            {t('home.poweredBy', 'Powered by AI + Real-world Data')}
          </div>
          <h1 className="landing__hero-title animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <Trans i18nKey="home.exploreFuture">
              Explore the <span className="gradient-text">Future</span> Before It Happens
            </Trans>
          </h1>
          <p className="landing__hero-subtitle animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {t('home.subtitle', 'Describe any "what if" scenario and our AI will simulate its impact across financial, environmental, human, risk, and opportunity dimensions.')}
          </p>
          <div className="landing__cta-group animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <button className="landing__cta-primary" onClick={() => onOpenAuth('register')}>
              {t('auth.register', 'Register')} ✨
            </button>
          </div>
        </div>

        {/* Feature Highlights (Visual Mockups) */}
        <div className="landing__visuals animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <div className="landing__glass-card landing__glass-card--left glass">
            <div className="landing__card-icon">⚡</div>
            <h3>Simulate Scenarios</h3>
            <p>Type any policy change and see instant multi-dimensional projections.</p>
          </div>
          <div className="landing__glass-card landing__glass-card--center glass">
            <div className="landing__card-icon">📊</div>
            <h3>Knowledge Graph</h3>
            <p>Grounded in verifiable datasets, preventing typical AI hallucinations.</p>
          </div>
          <div className="landing__glass-card landing__glass-card--right glass">
            <div className="landing__card-icon">⚖️</div>
            <h3>Compare Impacts</h3>
            <p>Run A/B tests on scenarios to identify the most optimal path forward.</p>
          </div>
          <div className="landing__glass-card landing__glass-card--left glass" style={{ animationDelay: '0.3s' }}>
            <div className="landing__card-icon">🏙️</div>
            <h3>3D Digital Twins</h3>
            <p>Canvas-based 3D isometric city twins mapping AQI density & EV grids.</p>
          </div>
          <div className="landing__glass-card landing__glass-card--center glass" style={{ animationDelay: '0.4s' }}>
            <div className="landing__card-icon">🎯</div>
            <h3>UN SDG Alignment</h3>
            <p>Rigorous automated mapping directly onto UN Targets 9.4 and 11.6.</p>
          </div>
          <div className="landing__glass-card landing__glass-card--right glass" style={{ animationDelay: '0.5s' }}>
            <div className="landing__card-icon">📡</div>
            <h3>Live API Grounding</h3>
            <p>Real-time weather, air index, and transit parameters loaded on every run.</p>
          </div>
        </div>
      </main>

      <footer className="landing__footer">
        <span style={{ opacity: 0.6 }}>
          Foresight AI Decision Engine — Powered by Gemini + Knowledge Graph
        </span>
      </footer>
    </div>
  );
}
