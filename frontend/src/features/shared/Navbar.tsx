import './Navbar.css';

interface NavbarProps {
  currentView: 'home' | 'history';
  onViewChange: (view: 'home' | 'history') => void;
  historyCount: number;
}

export default function Navbar({ currentView, onViewChange, historyCount }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="navbar__inner">
        <div className="navbar__brand" onClick={() => onViewChange('home')}>
          <div className="navbar__logo">🔮</div>
          <div>
            <div className="navbar__title gradient-text">Foresight</div>
            <div className="navbar__subtitle">AI Decision Engine</div>
          </div>
        </div>

        <div className="navbar__actions">
          <div className="navbar__status">
            <span className="navbar__status-dot" />
            AI Ready
          </div>

          <button
            className={`navbar__btn ${currentView === 'home' ? 'navbar__btn--active' : ''}`}
            onClick={() => onViewChange('home')}
          >
            <span className="navbar__btn-icon">⚡</span>
            <span>Simulate</span>
          </button>

          <button
            className={`navbar__btn ${currentView === 'history' ? 'navbar__btn--active' : ''}`}
            onClick={() => onViewChange('history')}
          >
            <span className="navbar__btn-icon">📋</span>
            <span>History{historyCount > 0 ? ` (${historyCount})` : ''}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
