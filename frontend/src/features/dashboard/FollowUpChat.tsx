import { useState, useRef, useEffect } from 'react';
import { api } from '../../api/client';
import './FollowUpChat.css';

interface FollowUpChatProps {
  scenarioQuery: string;
}

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

export default function FollowUpChat({ scenarioQuery }: FollowUpChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    const userMessage: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.chat({
        scenario_query: scenarioQuery,
        message: text,
        history: messages
      });

      if (response.success) {
        setMessages(prev => [...prev, { role: 'ai', content: response.reply }]);
      } else {
        throw new Error(response.error || 'Failed to get reply');
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button 
          className="followup-chat-fab"
          onClick={() => setIsOpen(true)}
          title="Chat with AI about this scenario"
        >
          <span className="followup-chat-fab__icon">💬</span>
          <span className="followup-chat-fab__text">Ask AI</span>
        </button>
      )}

      {/* Chat Panel */}
      <div className={`followup-chat-panel ${isOpen ? 'followup-chat-panel--open' : ''}`}>
        <div className="followup-chat__header">
          <div className="followup-chat__header-title">
            <span className="followup-chat__header-icon">✨</span>
            AI Follow-up
          </div>
          <button 
            className="followup-chat__close-btn"
            onClick={() => setIsOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="followup-chat__messages">
          {messages.length === 0 && (
            <div className="followup-chat__empty">
              <p>Ask a follow-up question about your scenario!</p>
              <div className="followup-chat__suggestions">
                <button onClick={() => setInput('What are the hidden costs?')}>"What are the hidden costs?"</button>
                <button onClick={() => setInput('Who will oppose this?')}>"Who will oppose this?"</button>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`followup-chat__bubble followup-chat__bubble--${msg.role}`}>
              <div className="followup-chat__bubble-content">
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="followup-chat__bubble followup-chat__bubble--ai">
              <div className="followup-chat__bubble-content followup-chat__typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="followup-chat__input-area">
          <textarea
            className="followup-chat__input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            disabled={isLoading}
            rows={1}
          />
          <button 
            className="followup-chat__send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
          >
            ↑
          </button>
        </div>
      </div>
    </>
  );
}
