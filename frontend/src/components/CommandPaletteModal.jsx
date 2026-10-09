import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const commands = useMemo(() => [
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
  ], [onSelectTab, onToggleTheme, theme]);

  const filtered = useMemo(() => {
    return commands.filter(cmd => 
      cmd.name.toLowerCase().includes(query.toLowerCase()) || 
      cmd.category.toLowerCase().includes(query.toLowerCase())
    );
  }, [commands, query]);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }

  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setSelectedIndex(0);
  }

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const executeCommand = useCallback((cmd) => {
    playSound('click', sfx);
    cmd.action();
    onClose();
  }, [onClose, sfx]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      } else if (isOpen && filtered.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filtered.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (filtered[selectedIndex]) {
            executeCommand(filtered[selectedIndex]);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, filtered, selectedIndex, executeCommand]);

  if (!isOpen) return null;

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-label="Command search palette"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
        paddingLeft: '1rem',
        paddingRight: '1rem'
      }} 
      onClick={onClose}
    >
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          boxShadow: 'var(--shadow-drop)',
          background: 'var(--bg-surface)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          padding: '0.65rem 0.85rem',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-card)'
        }}>
          <Search size={16} style={{ color: 'var(--brand-500)' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tools, formats, or preferences..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              fontWeight: 500
            }}
          />
          <kbd style={{
            padding: '0.15rem 0.4rem',
            borderRadius: '4px',
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
        <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.2rem 0' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No matching tools or commands found.
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => executeCommand(cmd)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                    border: '1px solid',
                    borderColor: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background-color 0.1s ease'
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{
                      padding: '0.35rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card)',
                      color: 'var(--brand-500)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={15} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{cmd.name}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{cmd.category}</div>
                    </div>
                  </div>

                  <ArrowRight size={13} style={{ color: isSelected ? 'var(--brand-500)' : 'var(--text-muted)', opacity: isSelected ? 1 : 0.4 }} />
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border-card)',
          paddingTop: '0.5rem',
          paddingBottom: '0.2rem',
          paddingLeft: '0.35rem',
          paddingRight: '0.35rem',
          fontSize: '0.68rem',
          color: 'var(--text-muted)'
        }}>
          <span>Navigate with <kbd>↑</kbd> <kbd>↓</kbd></span>
          <span>Select with <kbd>↵ Enter</kbd></span>
        </div>
      </div>
    </div>
  );
}
