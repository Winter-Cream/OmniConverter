import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Settings, 
  Volume2, 
  VolumeX,
  Loader2, 
  Key, 
  Trash2, 
  Check,
  Copy,
  Maximize2,
  Minimize2,
  Download,
  Mic,
  MicOff,
  Sparkles,
  ExternalLink,
  Cpu,
  Layers,
  Code2,
  PenTool,
  Calculator,
  ArrowRight
} from 'lucide-react';
import { sendAIChat, requestTTS } from '../services/api';
import { playSound } from '../utils/audio';
import { getChatWelcome } from '../utils/translations';
import CustomSelect from './CustomSelect';
import omniAiLogo from '../assets/omni-ai-logo.png';

const MODES = [
  { id: 'universal', label: 'Universal', icon: Sparkles, desc: 'All-in-One AI Assistant' },
  { id: 'pdf', label: 'PDF & Files', icon: Layers, desc: 'Conversion, PDF Suite & Formats' },
  { id: 'code', label: 'Code & Scripts', icon: Code2, desc: 'Python, FFmpeg, Bash & Regex' },
  { id: 'writing', label: 'Writing', icon: PenTool, desc: 'Drafting, Summaries & Translation' },
  { id: 'math', label: 'Calculators', icon: Calculator, desc: 'Bitrates, Units & Dimensions' }
];

const QUICK_CHIPS = {
  universal: [
    'What can OmniAI do?',
    'How do I merge multiple PDFs?',
    'Write a regex for email addresses',
    'Best video format for Discord (<25MB)?',
    'Watch Folder daemon setup guide'
  ],
  pdf: [
    'How to compress PDF by 80%?',
    'Split PDF pages into a ZIP archive',
    'How does OCR text extraction work?',
    'Encrypt PDF with AES password',
    'Batch convert PNG images to WebP'
  ],
  code: [
    'Python batch file converter script',
    'Top 5 FFmpeg one-liner recipes',
    'Regex for URLs and phone numbers',
    'Convert CSV to JSON in Python',
    'Shell script to watch and encode videos'
  ],
  writing: [
    'Draft professional project delivery email',
    'Summarize document in 3 bullet points',
    'Translate file conversion terms to Spanish',
    'Proofread and polish technical message',
    'Write concise bug report template'
  ],
  math: [
    'Calculate file size from video bitrate',
    'Standard 16:9 and 9:16 resolutions',
    'How many Megabytes in 10 Gigabytes?',
    'Binary (KiB) vs Decimal (KB) storage',
    'Aspect ratio calculator formula'
  ]
};

export default function AiChatbot({ sfx, lang = 'en', onNavigate, onOpenSpotlight }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState('universal');
  const [copiedId, setCopiedId] = useState(null);

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: getChatWelcome(lang)
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Settings
  const [provider, setProvider] = useState(() => localStorage.getItem('omni_ai_provider') || 'builtin');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('omni_ai_key') || '');
  const [model, setModel] = useState(() => localStorage.getItem('omni_ai_model') || '');
  const [endpoint, setEndpoint] = useState(() => localStorage.getItem('omni_ai_endpoint') || '');

  const messagesEndRef = useRef(null);
  const welcomeRef = useRef(getChatWelcome(lang));
  const recognitionRef = useRef(null);

  // Sync welcome message on language change
  useEffect(() => {
    setMessages(prev => {
      if (prev[0]?.role !== 'assistant' || prev[0].content !== welcomeRef.current || prev[0].content === getChatWelcome(lang)) return prev;
      return [{ ...prev[0], content: getChatWelcome(lang) }, ...prev.slice(1)];
    });
    welcomeRef.current = getChatWelcome(lang);
  }, [lang]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, loading]);

  // Keyboard shortcut: Alt + A or Ctrl + Space toggles chat, Escape closes
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.altKey && (e.key === 'a' || e.key === 'A')) || (e.ctrlKey && e.code === 'Space')) {
        e.preventDefault();
        setIsOpen(prev => !prev);
        playSound('click', sfx);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, sfx]);

  // Speech Recognition (Web Speech API)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = lang === 'hi' ? 'hi-IN' : (lang === 'es' ? 'es-ES' : (lang === 'fr' ? 'fr-FR' : (lang === 'de' ? 'de-DE' : 'en-US')));
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        playSound('click', sfx);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

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
      const res = await sendAIChat(userMsg, provider, apiKey, model, history, endpoint, activeMode);
      setMessages(prev => [...prev, { role: 'assistant', content: res.reply || 'No response generated.' }]);
      playSound('success', sfx);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${err.message}` }]);
      playSound('error', sfx);
    } finally {
      setLoading(false);
    }
  };

  const handleTTS = async (text) => {
    if (playingAudio) {
      window.speechSynthesis?.cancel();
      setPlayingAudio(false);
      return;
    }

    // Try native browser speech synthesis first (zero latency)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      // Strip action tags and markdown symbols for clean speech
      const cleanText = text
        .replace(/\[ACTION:[^|]+\|([^\]]+)\]/g, '$1')
        .replace(/```[\s\S]*?```/g, 'Code block omitted.')
        .replace(/[#*`_$~]/g, '')
        .substring(0, 400);

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.onend = () => setPlayingAudio(false);
      utterance.onerror = () => setPlayingAudio(false);
      setPlayingAudio(true);
      window.speechSynthesis.speak(utterance);
      return;
    }

    // Fallback to backend TTS endpoint
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

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    playSound('click', sfx);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportChatHistory = () => {
    const formatted = messages.map(m => `### ${m.role === 'user' ? '👤 User' : '🤖 OmniAI'}\n\n${m.content}\n\n---\n`).join('\n');
    const blob = new Blob([`# OmniAI Chat Transcript\nGenerated: ${new Date().toLocaleString()}\n\n${formatted}`], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OmniAI_Chat_${Date.now()}.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    playSound('success', sfx);
  };

  const saveSettings = () => {
    localStorage.setItem('omni_ai_provider', provider);
    localStorage.setItem('omni_ai_key', apiKey);
    localStorage.setItem('omni_ai_model', model);
    localStorage.setItem('omni_ai_endpoint', endpoint);
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

  const executeAction = (actionType) => {
    playSound('click', sfx);
    switch (actionType) {
      case 'OPEN_MERGE':
        onNavigate?.('pdf', 'merge-section');
        break;
      case 'OPEN_SPLIT':
        onNavigate?.('pdf', 'split-section');
        break;
      case 'OPEN_COMPRESS':
        onNavigate?.('pdf', 'compress-section');
        break;
      case 'OPEN_PROTECT':
        onNavigate?.('pdf', 'protect-section');
        break;
      case 'OPEN_UNLOCK':
        onNavigate?.('pdf', 'unlock-section');
        break;
      case 'OPEN_ROTATE':
        onNavigate?.('pdf', 'rotate-section');
        break;
      case 'OPEN_OCR':
        onNavigate?.('pdf', 'ocr-section');
        break;
      case 'OPEN_WATCH':
        onNavigate?.('converter', 'watch-folder-section');
        break;
      case 'OPEN_CONVERTER':
        onNavigate?.('converter');
        break;
      case 'OPEN_UNITS':
        onNavigate?.('units');
        break;
      case 'OPEN_SPOTLIGHT':
        onOpenSpotlight?.();
        break;
      default:
        break;
    }
  };

  // Render markdown text, code blocks, and action buttons cleanly
  const renderMessageContent = (content, msgIndex) => {
    // 1. Extract and split code blocks: ```lang ... ```
    const parts = [];
    const codeBlockRegex = /```([a-zA-Z0-9_\-\+]*)\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: content.substring(lastIndex, match.index) });
      }
      parts.push({
        type: 'code',
        language: match[1] || 'plaintext',
        code: match[2]
      });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
      parts.push({ type: 'text', content: content.substring(lastIndex) });
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {parts.map((p, pIdx) => {
          if (p.type === 'code') {
            const blockId = `${msgIndex}_code_${pIdx}`;
            const isBlockCopied = copiedId === blockId;
            return (
              <div 
                key={pIdx}
                style={{
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  background: '#0d1117',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  margin: '0.35rem 0'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.3rem 0.65rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)'
                }}>
                  <span style={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                    {p.language}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(p.code, blockId)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: isBlockCopied ? '#34d399' : 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.68rem',
                      padding: '0.15rem 0.35rem',
                      borderRadius: '4px'
                    }}
                    title="Copy code to clipboard"
                  >
                    {isBlockCopied ? <Check size={12} /> : <Copy size={12} />}
                    <span>{isBlockCopied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <pre style={{
                  margin: 0,
                  padding: '0.65rem 0.85rem',
                  overflowX: 'auto',
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#e6edf3',
                  lineHeight: 1.45
                }}>
                  <code>{p.code}</code>
                </pre>
              </div>
            );
          }

          // Parse text chunk for [ACTION:ACTION_NAME|Label] buttons
          const textChunk = p.content;
          const actionRegex = /\[ACTION:([A-Z_]+)\|([^\]]+)\]/g;
          const textAndActionParts = [];
          let tLastIndex = 0;
          let aMatch;

          while ((aMatch = actionRegex.exec(textChunk)) !== null) {
            if (aMatch.index > tLastIndex) {
              textAndActionParts.push({ type: 'raw', text: textChunk.substring(tLastIndex, aMatch.index) });
            }
            textAndActionParts.push({
              type: 'action',
              actionType: aMatch[1],
              label: aMatch[2]
            });
            tLastIndex = aMatch.index + aMatch[0].length;
          }
          if (tLastIndex < textChunk.length) {
            textAndActionParts.push({ type: 'raw', text: textChunk.substring(tLastIndex) });
          }

          return (
            <div key={pIdx}>
              {textAndActionParts.map((item, iIdx) => {
                if (item.type === 'action') {
                  return (
                    <button
                      key={iIdx}
                      type="button"
                      onClick={() => executeAction(item.actionType)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        margin: '0.35rem 0.35rem 0.35rem 0',
                        padding: '0.4rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(168, 85, 247, 0.22))',
                        border: '1px solid rgba(139, 92, 246, 0.4)',
                        color: 'var(--text-primary)',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease, background 0.15s ease',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <span>{item.label}</span>
                      <ArrowRight size={13} style={{ color: 'var(--brand-400)' }} />
                    </button>
                  );
                }

                return (
                  <span key={iIdx} style={{ whiteSpace: 'pre-wrap' }}>
                    {item.text}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Floating OmniAI Launcher Button */}
      <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 40 }}>
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            playSound('click', sfx);
          }}
          title="Open OmniAI Assistant (Alt + A)"
          aria-label="Open OmniAI Assistant"
          style={{
            position: 'relative',
            height: '2.85rem',
            padding: '0 1rem 0 0.5rem',
            borderRadius: '9999px',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #0f172a 100%)',
            border: '1px solid rgba(139, 92, 246, 0.45)',
            boxShadow: '0 8px 24px -4px rgba(124, 58, 237, 0.35), 0 0 0 1px rgba(255,255,255,0.06)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            cursor: 'pointer',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease',
            userSelect: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(124, 58, 237, 0.5), 0 0 0 1px rgba(255,255,255,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(124, 58, 237, 0.35), 0 0 0 1px rgba(255,255,255,0.06)';
          }}
        >
          {/* OmniAI 3D Logo Badge */}
          <div style={{
            width: '2rem',
            height: '2rem',
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 0 10px rgba(168, 85, 247, 0.4)'
          }}>
            <img 
              src={omniAiLogo} 
              alt="OmniAI Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 700, letterSpacing: '0.3px' }}>OmniAI</span>
              <span style={{
                fontSize: '0.62rem',
                padding: '0.05rem 0.35rem',
                borderRadius: '4px',
                background: 'rgba(139, 92, 246, 0.25)',
                color: '#c084fc',
                fontWeight: 600
              }}>
                PRO
              </span>
            </div>
            <div style={{ fontSize: '0.62rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              <span>Universal Copilot</span>
            </div>
          </div>
        </button>
      </div>

      {/* Floating Chat Window Modal */}
      {isOpen && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-label="OmniAI Copilot Assistant"
          className="glass-panel"
          style={{
            position: 'fixed',
            bottom: '4.85rem',
            right: '1.5rem',
            width: isMaximized ? '780px' : '430px',
            maxWidth: 'calc(100vw - 2rem)',
            height: isMaximized ? '82vh' : '560px',
            maxHeight: 'calc(100vh - 6.5rem)',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1), height 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--border-card)',
            background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg-surface) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {/* Logo with glow */}
              <div style={{
                width: '2.15rem',
                height: '2.15rem',
                borderRadius: '50%',
                overflow: 'hidden',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                boxShadow: '0 0 12px rgba(168, 85, 247, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <img 
                  src={omniAiLogo} 
                  alt="OmniAI" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, letterSpacing: '0.2px' }}>
                    OmniAI Supercopilot
                  </h4>
                  <span className="badge badge-neutral" style={{ fontSize: '0.62rem', fontWeight: 600 }}>
                    {provider.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: '0.66rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  <span>Ready to assist on any task • Offline & Online</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <button
                type="button"
                onClick={exportChatHistory}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: 'var(--radius-sm)'
                }}
                title="Export Chat as Markdown"
                aria-label="Export Chat"
              >
                <Download size={15} />
              </button>

              <button
                type="button"
                onClick={() => setIsMaximized(!isMaximized)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: 'var(--radius-sm)'
                }}
                title={isMaximized ? "Collapse Chat Window" : "Maximize Chat Window"}
                aria-label="Toggle Maximize"
              >
                {isMaximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>

              <button
                type="button"
                onClick={() => setSettingsOpen(!settingsOpen)}
                style={{
                  border: 'none',
                  background: settingsOpen ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: settingsOpen ? 'var(--brand-400)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: 'var(--radius-sm)'
                }}
                title="AI Engine Settings & Keys"
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
                title="Close Chat (Esc)"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          {!settingsOpen && (
            <div style={{
              display: 'flex',
              padding: '0.35rem 0.65rem',
              background: 'var(--bg-card)',
              borderBottom: '1px solid var(--border-card)',
              gap: '0.3rem',
              overflowX: 'auto'
            }}>
              {MODES.map((m) => {
                const Icon = m.icon;
                const isActive = activeMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setActiveMode(m.id);
                      playSound('click', sfx);
                    }}
                    title={m.desc}
                    style={{
                      border: 'none',
                      background: isActive 
                        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.25))' 
                        : 'transparent',
                      color: isActive ? 'var(--brand-300)' : 'var(--text-muted)',
                      padding: '0.25rem 0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.68rem',
                      fontWeight: isActive ? 600 : 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      borderBottom: isActive ? '2px solid var(--brand-500)' : '2px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Icon size={12} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          )}

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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <Key size={16} style={{ color: 'var(--brand-500)' }} />
                  <span>OmniAI Engine Configuration</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={15} />
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                  Model Provider
                </label>
                <CustomSelect
                  value={provider}
                  onChange={setProvider}
                  options={[
                    { value: 'builtin', label: '⚡ Built-in Super Engine (Instant, Offline, Free)' },
                    { value: 'ollama', label: '🦙 Ollama (100% Local LLM, Private, DeepSeek/Llama)' },
                    { value: 'gemini', label: '🌟 Google Gemini (Gemini 2.0 Flash / 1.5 Flash)' },
                    { value: 'openai', label: '🤖 OpenAI (GPT-4o / GPT-4o-mini)' },
                    { value: 'claude', label: '🧠 Anthropic Claude (Claude 3.5 Sonnet)' },
                    { value: 'grok', label: '⚡ xAI Grok (Grok-2)' },
                    { value: 'custom', label: '🌐 Custom / OpenRouter (OpenAI-compatible Endpoint)' }
                  ]}
                  accentColor="var(--brand-500)"
                  minWidth="100%"
                  sfx={sfx}
                />
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  {provider === 'builtin' && 'Uses the built-in multi-domain expert engine. No internet or API keys required.'}
                  {provider === 'ollama' && 'Connects to your local Ollama runtime. Runs 100% on your machine.'}
                  {provider === 'gemini' && 'Connects to Google Cloud Generative Language API.'}
                  {provider === 'openai' && 'Connects directly to OpenAI platform endpoints.'}
                  {provider === 'claude' && 'Connects directly to Anthropic Claude 3.5 Sonnet.'}
                  {provider === 'grok' && 'Connects directly to xAI Grok API.'}
                  {provider === 'custom' && 'Works with OpenRouter, LM Studio, vLLM, or LocalAI.'}
                </div>
              </div>

              {provider === 'ollama' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                    Ollama Server URL
                  </label>
                  <input
                    type="text"
                    placeholder="http://localhost:11434"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
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
                </div>
              )}

              {provider === 'custom' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                    OpenAI-Compatible Endpoint URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://openrouter.ai/api/v1/chat/completions"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
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
                </div>
              )}

              {provider !== 'builtin' && provider !== 'ollama' && (
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
                    Key is saved only in your local browser session and never sent elsewhere.
                  </div>
                </div>
              )}

              {provider !== 'builtin' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                    Model Identifier (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder={provider === 'ollama' ? 'e.g. llama3.2 or deepseek-r1' : 'e.g. gemini-2.0-flash or gpt-4o'}
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
              )}

              <button
                type="button"
                onClick={saveSettings}
                className="btn-primary"
                style={{ fontSize: '0.8rem', marginTop: 'auto', padding: '0.65rem' }}
              >
                <Check size={14} />
                <span>Save & Apply Settings</span>
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
                gap: '0.85rem',
                fontSize: '0.8rem'
              }}>
                {messages.map((m, idx) => {
                  const isUser = m.role === 'user';
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignSelf: isUser ? 'flex-end' : 'flex-start',
                        maxWidth: isMaximized ? '75%' : '88%'
                      }}
                    >
                      {/* Assistant 3D Avatar */}
                      {!isUser && (
                        <div style={{
                          width: '1.65rem',
                          height: '1.65rem',
                          borderRadius: '50%',
                          overflow: 'hidden',
                          flexShrink: 0,
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(139, 92, 246, 0.4)',
                          marginTop: '0.15rem'
                        }}>
                          <img 
                            src={omniAiLogo} 
                            alt="OmniAI" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      )}

                      <div
                        style={{
                          padding: '0.65rem 0.95rem',
                          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          background: isUser ? 'var(--brand-600)' : 'var(--bg-card)',
                          color: isUser ? '#ffffff' : 'var(--text-primary)',
                          border: isUser ? 'none' : '1px solid var(--border-card)',
                          lineHeight: 1.55,
                          wordBreak: 'break-word',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                        }}
                      >
                        {renderMessageContent(m.content, idx)}

                        {/* Assistant message action bar */}
                        {!isUser && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.45rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.35rem' }}>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(m.content, `msg_${idx}`)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: copiedId === `msg_${idx}` ? '#34d399' : 'var(--text-muted)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                fontSize: '0.65rem'
                              }}
                              title="Copy response"
                            >
                              {copiedId === `msg_${idx}` ? <Check size={11} /> : <Copy size={11} />}
                              <span>{copiedId === `msg_${idx}` ? 'Copied' : 'Copy'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleTTS(m.content)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: playingAudio ? 'var(--brand-400)' : 'var(--text-muted)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                fontSize: '0.65rem'
                              }}
                              title="Listen with Text-to-Speech"
                            >
                              {playingAudio ? <VolumeX size={11} /> : <Volume2 size={11} />}
                              <span>{playingAudio ? 'Stop' : 'Speak'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div style={{
                    alignSelf: 'flex-start',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.55rem 0.85rem',
                    borderRadius: '16px 16px 16px 4px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.75rem'
                  }}>
                    <div style={{
                      width: '1.4rem',
                      height: '1.4rem',
                      borderRadius: '50%',
                      overflow: 'hidden'
                    }}>
                      <img src={omniAiLogo} alt="AI" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <Loader2 size={13} className="spin-slow" style={{ color: 'var(--brand-400)' }} />
                    <span>OmniAI is thinking...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Dynamic Quick Prompt Chips */}
              <div style={{
                padding: '0.4rem 0.65rem',
                display: 'flex',
                gap: '0.35rem',
                overflowX: 'auto',
                borderTop: '1px solid var(--border-card)',
                background: 'var(--bg-card)'
              }}>
                {(QUICK_CHIPS[activeMode] || QUICK_CHIPS.universal).map((chip, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSend(chip)}
                    className="btn-secondary"
                    style={{
                      whiteSpace: 'nowrap',
                      padding: '0.25rem 0.6rem',
                      fontSize: '0.68rem',
                      fontWeight: 500,
                      borderRadius: '9999px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-card)'
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                style={{
                  padding: '0.65rem',
                  borderTop: '1px solid var(--border-card)',
                  background: 'var(--bg-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}
              >
                {/* Voice Input Button */}
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  style={{
                    border: 'none',
                    background: isListening ? '#ef4444' : 'var(--bg-card)',
                    color: isListening ? '#ffffff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '0.55rem',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    boxShadow: isListening ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none'
                  }}
                  title={isListening ? "Listening... Click to stop" : "Speak to OmniAI (Voice Input)"}
                  aria-label="Voice Input"
                >
                  {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                </button>

                <input
                  type="text"
                  placeholder={isListening ? "Listening to your voice..." : "Ask anything — files, PDF, code, writing, math..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  style={{
                    flex: '1 1 auto',
                    padding: '0.55rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-input)',
                    border: isListening ? '1px solid #ef4444' : '1px solid var(--border-card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                    outline: 'none',
                    transition: 'border-color 0.15s ease'
                  }}
                />

                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="btn-primary"
                  aria-label="Send message"
                  style={{
                    padding: '0.55rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    opacity: (!input.trim() || loading) ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
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
