import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  FileUp, 
  FilePlus2, 
  Scissors, 
  FileArchive, 
  Lock, 
  Unlock, 
  RotateCw, 
  ScanText, 
  Calculator, 
  Clock, 
  Trophy, 
  Bot, 
  Moon, 
  Sun, 
  ArrowRight 
} from 'lucide-react';
import { playSound } from '../utils/audio';

export default function CommandPaletteModal({ 
  isOpen, 
  onClose, 
  onSelectTab, 
  onToggleTheme, 
  theme, 
  sfx 
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(true); // Toggle
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const commands = [
    { id: 'tab-converter', name: 'File Converter Hub', category: 'Navigation', icon: FileUp, action: () => onSelectTab('converter') },
    { id: 'tab-pdf', name: 'PDF Tools Suite', category: 'Navigation', icon: FilePlus2, action: () => onSelectTab('pdf') },
    { id: 'tab-units', name: 'Multi-Unit Converter Engine', category: 'Navigation', icon: Calculator, action: () => onSelectTab('units') },
    { id: 'tab-logs', name: 'Activity & Conversion Logs', category: 'Navigation', icon: Clock, action: () => onSelectTab('logs') },
    { id: 'tab-achievements', name: 'Achievements & Badges', category: 'Navigation', icon: Trophy, action: () => onSelectTab('achievements') },
    { id: 'tool-merge', name: 'Merge Multiple PDFs', category: 'PDF Tools', icon: FilePlus2, action: () => onSelectTab('pdf') },
    { id: 'tool-split', name: 'Split & Extract PDF Pages', category: 'PDF Tools', icon: Scissors, action: () => onSelectTab('pdf') },
    { id: 'tool-compress', name: 'Compress PDF Document', category: 'PDF Tools', icon: FileArchive, action: () => onSelectTab('pdf') },
    { id: 'tool-protect', name: 'Encrypt PDF Document (Password)', category: 'PDF Tools', icon: Lock, action: () => onSelectTab('pdf') },
    { id: 'tool-unlock', name: 'Decrypt Password-Protected PDF', category: 'PDF Tools', icon: Unlock, action: () => onSelectTab('pdf') },
    { id: 'tool-rotate', name: 'Rotate PDF Pages', category: 'PDF Tools', icon: RotateCw, action: () => onSelectTab('pdf') },
    { id: 'tool-ocr', name: 'OCR Studio & Text Extractor', category: 'OCR & Vision', icon: ScanText, action: () => onSelectTab('pdf') },
    { id: 'tool-theme', name: `Toggle ${theme === 'dark' ? 'Light' : 'Dark'} Theme`, category: 'Preferences', icon: theme === 'dark' ? Sun : Moon, action: onToggleTheme }
  ];

  const filtered = commands.filter(cmd => 
    cmd.name.toLowerCase().includes(query.toLowerCase()) || 
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  const executeCommand = (cmd) => {
    playSound('click', sfx);
    cmd.action();
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 60,
      background: 'rgba(9, 13, 22, 0.75)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '10vh',
      paddingLeft: '1rem',
      paddingRight: '1rem'
    }} onClick={onClose}>
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '580px',
          padding: '0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
          boxShadow: 'var(--shadow-drop)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-card)'
        }}>
          <Search size={18} color="var(--brand-500)" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a tool or command name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              fontWeight: 600
            }}
          />
          <kbd style={{
            padding: '0.2rem 0.45rem',
            borderRadius: '6px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-card)',
            fontSize: '0.65rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)'
          }}>
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem', padding: '0.25rem 0' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No matching tools or commands found.
            </div>
          ) : (
            filtered.map(cmd => {
              const Icon = cmd.icon;
              return (
                <div
                  key={cmd.id}
                  onClick={() => executeCommand(cmd)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-glass-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-glass-subtle)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      padding: '0.35rem',
                      borderRadius: '8px',
                      background: 'var(--bg-surface)',
                      color: 'var(--brand-500)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{cmd.name}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{cmd.category}</div>
                    </div>
                  </div>

                  <ArrowRight size={14} style={{ opacity: 0.5 }} />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
