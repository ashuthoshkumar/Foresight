import React, { useEffect, useState } from 'react';
import './SmartAlert.css';

interface SmartAlertProps {
  message: string;
  type: 'success' | 'warning';
  duration?: number;
  onClose?: () => void;
}

export default function SmartAlert({ message, type, duration = 4000, onClose }: SmartAlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) setTimeout(onClose, 300); // Allow animation to finish
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`smart-alert smart-alert--${type} fade-in`}>
      <div className="smart-alert__icon">
        {type === 'success' ? '🌟' : '⚠️'}
      </div>
      <div className="smart-alert__content">
        <div className="smart-alert__title">
          {type === 'success' ? 'High Opportunity Detected' : 'Critical Risk Detected'}
        </div>
        <div className="smart-alert__message">{message}</div>
      </div>
    </div>
  );
}
