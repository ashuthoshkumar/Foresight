import { useTranslation } from 'react-i18next';
import './Navbar.css';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export default function Navbar({ onToggleSidebar, isSidebarOpen = true }: NavbarProps) {
  const { i18n } = useTranslation();

  const LANGS = ['en', 'hi', 'te'];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  // Safe index — falls back to 0 (English) if language code isn't an exact match
  const langIndex = Math.max(0, LANGS.indexOf(i18n.language));

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        <div className="navbar__left">
          {!isSidebarOpen && onToggleSidebar && (
            <button className="navbar__hamburger" onClick={onToggleSidebar} aria-label="Open sidebar">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
        
        <div className="navbar__spacer"></div>

        <div className="navbar__actions">
          <div className="navbar__lang-switch">
            <div 
              className="navbar__lang-slider" 
              style={{
                transform: `translateX(${langIndex * 100}%)`
              }} 
            />
            {[
              { code: 'en', label: 'English' },
              { code: 'hi', label: 'हिंदी' },
              { code: 'te', label: 'తెలుగు' }
            ].map((lang) => (
              <button
                key={lang.code}
                className={`navbar__lang-btn ${i18n.language === lang.code ? 'active' : ''}`}
                onClick={() => changeLanguage(lang.code)}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
