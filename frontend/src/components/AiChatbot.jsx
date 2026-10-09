import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Settings, 
  Volume2, 
  Loader2, 
  Key, 
  Trash2, 
  Check 
} from 'lucide-react';
import { sendAIChat, requestTTS } from '../services/api';
import { playSound } from '../utils/audio';
import CustomSelect from './CustomSelect';

export default function AiChatbot({ sfx }) {
  const [isOpen, setIsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm **OmniAI**, your assistant for OmniConverter.\n\nAsk me how to merge or compress PDFs, convert video/audio, set up Watch Folder automation, or calculate unit conversions. Click the gear icon (⚙️) to connect your own **Google Gemini**, **OpenAI**, or **Grok** API key if desired."
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);

  // Settings
  const [provider, setProvider] = useState(() => localStorage.getItem('omni_ai_provider') || 'builtin');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('omni_ai_key') || '');
  const [model, setModel] = useState(() => localStorage.getItem('omni_ai_model') || '');

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Handle escape to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSend = async (textToSend = input) => {
    const userMsg = textToSend.trim();
    if (!userMsg || loading) return;

    playSound('click', sfx);
    setInput('');
    const newMsgs = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMsgs);
    setLoading(true);

    try {
      const history = newMsgs.map(m => ({ role: m.role, content: m.content }));
      const res = await sendAIChat(userMsg, provider, apiKey, model, history);
      setMessages(prev => [...prev, { role: 'assistant', content: res.reply || 'No response.' }]);
      playSound('success', sfx);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
      playSound('error', sfx);
    } finally {
      setLoading(false);
    }
  };

  const handleTTS = async (text) => {
    if (playingAudio) return;
    try {
      setPlayingAudio(true);
      playSound('click', sfx);
      const audioUrl = await requestTTS(text.substring(0, 300));
      const audio = new Audio(audioUrl);
      audio.onended = () => setPlayingAudio(false);
      audio.onerror = () => setPlayingAudio(false);
      audio.play();
    } catch {
      setPlayingAudio(false);
    }
  };

  const saveSettings = () => {
    localStorage.setItem('omni_ai_provider', provider);
    localStorage.setItem('omni_ai_key', apiKey);
    localStorage.setItem('omni_ai_model', model);
    setSettingsOpen(false);
    playSound('success', sfx);
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Chat history cleared. How can I help you today?"
    }]);
    playSound('click', sfx);
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 40 }}>
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            playSound('click', sfx);
          }}
          title="Open OmniAI Assistant"
          aria-label="Open OmniAI Assistant"
          className="btn-primary"
          style={{
            height: '2.5rem',
            padding: '0 0.9rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-drop)',
            fontSize: '0.8rem',
            fontWeight: 600
          }}
        >
          <Bot size={16} />
          <span>OmniAI</span>
        </button>
      </div>

      {/* Floating Chat Window Modal */}
      {isOpen && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-label="OmniAI Chat Assistant"
          className="glass-panel"
          style={{
            position: 'fixed',
            bottom: '4.75rem',
            right: '1.5rem',
            width: '400px',
            maxWidth: 'calc(100vw - 2rem)',
            height: '520px',
            maxHeight: 'calc(100vh - 6.5rem)',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-drop)',
            background: 'var(--bg-surface)'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '0.85rem 1.15rem',
            borderBottom: '1px solid var(--border-card)',
            background: 'var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '1.85rem',
                height: '1.85rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(99, 102, 241, 0.12)',
                color: 'var(--brand-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bot size={16} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700 }}>OmniAI Assistant</h4>
                  <span className="badge badge-neutral" style={{ fontSize: '0.62rem' }}>
                    {provider.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--emerald-500)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--emerald-500)', display: 'inline-block' }} />
                  <span>Ready to assist</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <button
                type="button"
                onClick={() => setSettingsOpen(!settingsOpen)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: 'var(--radius-sm)'
                }}
                title="AI Provider Settings"
                aria-label="AI Settings"
              >
                <Settings size={15} />
              </button>
              <button
                type="button"
                onClick={clearChat}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: 'var(--radius-sm)'
                }}
                title="Clear Chat History"
                aria-label="Clear Chat"
              >
                <Trash2 size={15} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: 'var(--radius-sm)'
                }}
                title="Close Chat"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Settings Overlay Drawer */}
          {settingsOpen ? (
            <div style={{
              padding: '1.25rem',
              background: 'var(--bg-surface)',
              flex: '1 1 auto',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Key size={15} style={{ color: 'var(--brand-500)' }} />
                <span>AI Provider & API Key</span>
              </h4>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                  Model Provider
                </label>
                <CustomSelect
                  value={provider}
                  onChange={setProvider}
                  options={[
                    { value: 'builtin', label: 'Built-in Knowledge (Offline / Free)' },
                    { value: 'gemini', label: 'Google Gemini (Gemini 1.5 Flash)' },
                    { value: 'openai', label: 'OpenAI (GPT-4o Mini)' },
                    { value: 'grok', label: 'xAI Grok (Grok-2)' },
                    { value: 'claude', label: 'Anthropic Claude (Claude 3.5 Sonnet)' }
                  ]}
                  accentColor="var(--brand-500)"
                  minWidth="100%"
                  sfx={sfx}
                />
              </div>

              {provider !== 'builtin' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                      API Key
                    </label>
                    <input
                      type="password"
                      placeholder="Paste your API key..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-card)',
                        color: 'var(--text-primary)',
                        fontSize: '0.78rem',
                        fontFamily: 'var(--font-mono)'
                      }}
                    />
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Key is saved only in your local browser session.
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                      Custom Model Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. gemini-1.5-flash or gpt-4o"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-card)',
                        color: 'var(--text-primary)',
                        fontSize: '0.78rem'
                      }}
                    />
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={saveSettings}
                className="btn-primary"
                style={{ fontSize: '0.8rem', marginTop: 'auto' }}
              >
                <Check size={14} />
                <span>Save Configuration</span>
              </button>
            </div>
          ) : (
            <>
              {/* Messages Body */}
              <div style={{
                flex: '1 1 auto',
                padding: '0.85rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                fontSize: '0.8rem'
              }}>
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: m.role === 'user' ? 'var(--brand-600)' : 'var(--bg-card)',
                      color: m.role === 'user' ? '#ffffff' : 'var(--text-primary)',
                      border: m.role === 'user' ? 'none' : '1px solid var(--border-card)',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    <div>{m.content}</div>

                    {m.role === 'assistant' && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.35rem' }}>
                        <button
                          type="button"
                          onClick={() => handleTTS(m.content)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            fontSize: '0.65rem'
                          }}
                          title="Listen with Text-to-Speech"
                        >
                          <Volume2 size={12} />
                          <span>Speak</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div style={{
                    alignSelf: 'flex-start',
                    padding: '0.55rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-card)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.75rem'
                  }}>
                    <Loader2 size={13} className="spin-slow" />
                    <span>Thinking...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div style={{
                padding: '0.35rem 0.65rem',
                display: 'flex',
                gap: '0.3rem',
                overflowX: 'auto',
                borderTop: '1px solid var(--border-card)',
                background: 'var(--bg-card)'
              }}>
                {[
                  'How to merge PDFs?',
                  'How to split PDF?',
                  'Compress PDF size',
                  'Watch folder setup'
                ].map((chip, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSend(chip)}
                    className="btn-secondary"
                    style={{
                      whiteSpace: 'nowrap',
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.68rem',
                      fontWeight: 500
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Chat Input Form */}
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                style={{
                  padding: '0.65rem',
                  borderTop: '1px solid var(--border-card)',
                  background: 'var(--bg-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <input
                  type="text"
                  placeholder="Ask a question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  style={{
                    flex: '1 1 auto',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="btn-primary"
                  aria-label="Send message"
                  style={{
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    opacity: (!input.trim() || loading) ? 0.6 : 1
                  }}
                >
                  <Send size={14} />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
