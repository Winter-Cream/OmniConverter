import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Settings, 
  Volume2, 
  Sparkles, 
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
      content: "👋 Hi! I'm **OmniAI**, your expert assistant for OmniConverter.\n\nAsk me how to merge or compress PDFs, convert video/audio, set up Watch Folder automation, or calculate unit conversions! Click the ⚙️ gear icon to connect your own **Google Gemini**, **OpenAI**, or **Grok** API key."
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
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${err.message}` }]);
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
    } catch (err) {
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
      content: "👋 Chat history cleared. How can I help you today?"
    }]);
    playSound('click', sfx);
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div style={{ position: 'fixed', bottom: '1.75rem', right: '1.75rem', zIndex: 40 }}>
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            playSound('click', sfx);
          }}
          title="Ask OmniAI Assistant"
          style={{
            position: 'relative',
            width: '3.5rem',
            height: '3.5rem',
            borderRadius: '50%',
            background: 'var(--brand-gradient)',
            color: 'white',
            border: '2px solid rgba(255, 255, 255, 0.25)',
            boxShadow: 'var(--shadow-glow), 0 10px 25px -5px rgba(0, 0, 0, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <Bot size={24} />
          <span className="pulse-badge" />
        </button>
      </div>

      {/* Floating Chat Window Modal */}
      {isOpen && (
        <div 
          className="glass-panel"
          style={{
            position: 'fixed',
            bottom: '6rem',
            right: '1.75rem',
            width: '420px',
            maxWidth: 'calc(100vw - 2.5rem)',
            height: '560px',
            maxHeight: 'calc(100vh - 8rem)',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-drop)'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-card)',
            background: 'var(--bg-glass-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: '8px',
                background: 'var(--brand-gradient)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bot size={18} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>OmniAI Assistant</h4>
                  <span className="badge badge-brand" style={{ fontSize: '0.6rem' }}>
                    {provider.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: '0.68rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  <span>Online • Ready to assist</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: '6px'
                }}
                title="AI Settings"
              >
                <Settings size={16} />
              </button>
              <button
                onClick={clearChat}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: '6px'
                }}
                title="Clear Chat"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: '6px'
                }}
                title="Close"
              >
                <X size={16} />
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
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Key size={16} color="var(--brand-500)" />
                <span>AI Provider & API Key Setup</span>
              </h4>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                  Provider
                </label>
              <CustomSelect
                value={provider}
                onChange={setProvider}
                options={[
                  { value: 'builtin', label: 'Built-in Expert Knowledge (Free / No Key)' },
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
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
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
                        borderRadius: '8px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-card)',
                        color: 'var(--text-primary)',
                        fontSize: '0.8rem',
                        fontFamily: 'var(--font-mono)'
                      }}
                    />
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Key is stored securely in your local browser storage.
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
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
                        borderRadius: '8px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-card)',
                        color: 'var(--text-primary)',
                        fontSize: '0.8rem'
                      }}
                    />
                  </div>
                </>
              )}

              <button
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
                padding: '1rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                fontSize: '0.8rem'
              }}>
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: m.role === 'user' ? 'var(--brand-gradient)' : 'var(--bg-card)',
                      color: m.role === 'user' ? 'white' : 'var(--text-primary)',
                      border: m.role === 'user' ? 'none' : '1px solid var(--border-card)',
                      boxShadow: 'var(--shadow-card)',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    <div>{m.content}</div>

                    {m.role === 'assistant' && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.45rem' }}>
                        <button
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
                    padding: '0.65rem 0.95rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-card)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.75rem'
                  }}>
                    <Loader2 size={14} className="spin-slow" />
                    <span>OmniAI is thinking...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div style={{
                padding: '0.45rem 0.75rem',
                display: 'flex',
                gap: '0.35rem',
                overflowX: 'auto',
                borderTop: '1px solid var(--border-card)',
                background: 'var(--bg-surface)'
              }}>
                {[
                  'How to merge PDFs?',
                  'How to split PDF?',
                  'Compress PDF size',
                  'Watch folder setup'
                ].map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(chip)}
                    style={{
                      whiteSpace: 'nowrap',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '9999px',
                      border: '1px solid var(--border-card)',
                      background: 'var(--bg-glass-subtle)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      cursor: 'pointer'
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
                  padding: '0.75rem',
                  borderTop: '1px solid var(--border-card)',
                  background: 'var(--bg-glass-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <input
                  type="text"
                  placeholder="Ask OmniAI anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  style={{
                    flex: '1 1 auto',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
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
                  style={{
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-md)',
                    opacity: (!input.trim() || loading) ? 0.6 : 1
                  }}
                >
                  <Send size={15} />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
