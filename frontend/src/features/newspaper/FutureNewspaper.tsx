import React, { useRef } from 'react';
import './FutureNewspaper.css';
import html2canvas from 'html2canvas';

interface NewspaperData {
  headline: string;
  subheadline: string;
  article: string;
  opinion: string;
  market_reaction: string;
}

interface FutureNewspaperProps {
  data: NewspaperData;
  dateStr?: string;
  onClose?: () => void;
}

export const FutureNewspaper: React.FC<FutureNewspaperProps> = ({ data, dateStr, onClose }) => {
  const newspaperRef = useRef<HTMLDivElement>(null);

  // Default to a date exactly 5 years from now
  const displayDate = dateStr || new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handleDownload = async () => {
    if (!newspaperRef.current) return;
    try {
      const canvas = await html2canvas(newspaperRef.current, { scale: 2, useCORS: true });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `foresight-newspaper-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export newspaper', err);
    }
  };

  return (
    <div className="newspaper-modal-overlay" onClick={onClose}>
      <div className="newspaper-modal-content" onClick={e => e.stopPropagation()}>
        {onClose && (
          <button className="newspaper-modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        )}
        <button className="newspaper-download-btn" onClick={handleDownload}>
          <span style={{fontSize: '1.2rem'}}>⤓</span> Download
        </button>

        <div className="future-newspaper" ref={newspaperRef}>
          <header className="future-newspaper__header">
            <h1 className="future-newspaper__masthead">The Foresight Chronicle</h1>
            <div className="future-newspaper__meta">
              <span>Vol. CXCIV No. 59,102</span>
              <span>{displayDate}</span>
              <span>Late Edition</span>
            </div>
          </header>

          <div className="future-newspaper__content">
            <main className="future-newspaper__main-story">
              <h2 className="future-newspaper__headline">{data.headline}</h2>
              <p className="future-newspaper__subhead">{data.subheadline}</p>
              
              <div className="future-newspaper__article">
                <div className="future-newspaper__article-body">
                  {/* Split the article string into paragraphs on newlines */}
                  {data.article.split('\n').filter(p => p.trim()).map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </main>

            <aside className="future-newspaper__sidebar">
              <div className="future-newspaper__widget">
                <h3>Voice of the City</h3>
                <p className="future-newspaper__opinion-quote">
                  "{data.opinion}"
                </p>
              </div>

              <div className="future-newspaper__widget">
                <h3>Market Watch</h3>
                <p className="future-newspaper__market">
                  {data.market_reaction}
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};
