import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import './PaywallModal.css';

export default function PaywallModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-paywall', handleOpen);
    return () => window.removeEventListener('open-paywall', handleOpen);
  }, []);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      // Assuming api client has a checkout method. If not, standard fetch
      const token = localStorage.getItem('foresight_token');
      const res = await fetch('http://127.0.0.1:8000/api/v1/billing/checkout-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to start checkout. Please try again later.');
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="paywall-overlay" onClick={() => setIsOpen(false)}>
      <div className="paywall-modal glass" onClick={e => e.stopPropagation()}>
        <div className="paywall-modal__header">
          <h2>Upgrade to Foresight Pro 🚀</h2>
          <button className="paywall-modal__close" onClick={() => setIsOpen(false)}>×</button>
        </div>
        <div className="paywall-modal__content">
          <p>You've discovered a premium feature! Upgrade to Pro to unlock the full power of the AI Decision Engine.</p>
          
          <ul className="paywall-modal__features">
            <li>✨ <strong>Unlimited Scenarios</strong>: No more daily limits.</li>
            <li>🎯 <strong>Goal Seeker</strong>: AI backcasting for roadmaps.</li>
            <li>⚔️ <strong>Battle Mode</strong>: Pit two policies against each other.</li>
            <li>📸 <strong>Future Vision Camera</strong>: High-res AI image generation.</li>
            <li>🏙️ <strong>All Cities Unlocked</strong>: Delhi, Bangalore, Mumbai, etc.</li>
            <li>📊 <strong>Export to PDF/Images</strong>: Share your findings easily.</li>
          </ul>

          <div className="paywall-modal__pricing">
            <div className="paywall-modal__price">
              <span className="paywall-modal__currency">$</span>
              <span className="paywall-modal__amount">15</span>
              <span className="paywall-modal__period">/month</span>
            </div>
          </div>

          <button 
            className="paywall-modal__upgrade-btn" 
            onClick={handleUpgrade}
            disabled={isLoading}
          >
            {isLoading ? 'Redirecting...' : 'Upgrade Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
