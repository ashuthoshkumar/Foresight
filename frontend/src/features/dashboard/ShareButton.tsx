import { useState } from 'react';
import type { SimulationResult } from '../scenario/types';
import { api } from '../../api/client';
import './ShareButton.css';

interface ShareButtonProps {
  result: SimulationResult;
}

export default function ShareButton({ result }: ShareButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'copied' | 'error'>('idle');

  const handleShare = async () => {
    setState('loading');
    try {
      const response = await api.createShare(result);
      if (response.success && response.id) {
        // Use production domain if available, otherwise default to a professional mock domain
        const baseUrl = import.meta.env.VITE_APP_PUBLIC_URL || 'https://foresight.ai';
        const url = `${baseUrl}/?s=${response.id}`;
        await navigator.clipboard.writeText(url);
        setState('copied');
        setTimeout(() => setState('idle'), 3000);
      } else {
        setState('error');
        setTimeout(() => setState('idle'), 3000);
      }
    } catch (err) {
      console.error('Share failed:', err);
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    }
  };

  const label =
    state === 'idle'    ? '🔗 Share Result'    :
    state === 'loading' ? '⏳ Generating...'   :
    state === 'copied'  ? '✅ Link Copied!'    :
                          '❌ Failed';

  return (
    <button
      className={`share-btn share-btn--${state}`}
      onClick={handleShare}
      disabled={state === 'loading'}
      title="Copy short shareable link"
    >
      {label}
    </button>
  );
}
