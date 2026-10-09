import React, { useState } from 'react';
import { 
  CheckCircle, 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  Search, 
  ChevronDown, 
  ShieldCheck
} from 'lucide-react';
import { playSound } from '../utils/audio';
import appLogo from '../assets/logo.png';

const LANGUAGES = [
  { code: 'en', flag: '🇺🇸', name: 'English' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'fr', flag: '🇫🇷', name: 'Français' },
  { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
  { code: 'ja', flag: '🇯🇵', name: '日本語' },
  { code: 'zh', flag: '🇨🇳', name: '中文' },
  { code: 'hi', flag: '🇮🇳', name: 'हिन्दी' },
];

export default function Header({
  stats: _stats,
  lang,
  setLang,
  theme,
  setTheme,
  sfx,
  setSfx,
  backendOnline,
  onOpenSpotlight
}) {
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const currentLangObj = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    playSound('click', sfx);
  };

  const toggleSfx = () => {
    const nextSfx = !sfx;
    setSfx(nextSfx);
    playSound('click', nextSfx);
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-card)',
      boxShadow: 'var(--shadow-sm)',
      transition: 'background-color 0.15s ease, border-color 0.15s ease'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 1.25rem',
        height: '4rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        {/* Brand Logo & Name */}
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', userSelect: 'none' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="OmniConverter - Desktop File Engine"
        >
          <div style={{
            width: '2.25rem',
            height: '2.25rem',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src={appLogo} 
              alt="OmniConverter Logo" 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                borderRadius: '6px'
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              lineHeight: 1
            }}>
              OmniConverter
            </span>
            <span className="badge badge-brand font-mono" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', lineHeight: 1 }}>
              v4.1 PRO
            </span>
          </div>
        </div>

        {/* Center / Search & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Spotlight Search Shortcut Button */}
          <button
            type="button"
            onClick={() => {
              playSound('click', sfx);
              onOpenSpotlight();
            }}
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.4rem 0.85rem',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              background: 'var(--bg-input)'
            }}
            id="spotlight-header-btn"
            title="Search tools and commands (Ctrl+K)"
          >
            <Search size={14} style={{ color: 'var(--brand-500)' }} />
            <span style={{ display: 'inline' }}>Quick Search</span>
            <kbd style={{
              padding: '0.12rem 0.35rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              borderRadius: '4px',
              fontSize: '0.65rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              color: 'var(--text-muted)'
            }}>
              Ctrl K
            </kbd>
          </button>

          {/* Engine Connectivity Status */}
          <div 
            className={`badge ${backendOnline ? 'badge-emerald' : 'badge-amber'}`}
            title={backendOnline ? 'Local Python conversion engine is connected and ready.' : 'Engine offline: conversions require the local backend.'}
            style={{ cursor: 'default' }}
          >
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: backendOnline ? 'var(--emerald-500)' : 'var(--amber-500)',
              display: 'inline-block'
            }} />
            <span>{backendOnline ? 'Engine Online' : 'Engine Offline'}</span>
          </div>

          {/* Privacy Guarantee */}
          <div 
            className="badge badge-neutral" 
            title="All files remain on your local computer. Zero remote server uploads."
            style={{ display: 'none', cursor: 'default' }}
            id="privacy-header-badge"
          >
            <ShieldCheck size={12} style={{ color: 'var(--brand-500)' }} />
            <span>100% Local</span>
          </div>
        </div>

        {/* Controls Toolbar: Language, Audio SFX, Theme */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          {/* Language Selector */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="btn-secondary"
              aria-label="Select language"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.6rem',
                fontSize: '0.75rem',
                fontWeight: 600
              }}
            >
              <span>{currentLangObj.flag}</span>
              <span className="font-mono">{currentLangObj.code.toUpperCase()}</span>
              <ChevronDown size={12} style={{ opacity: 0.6 }} />
            </button>

            {langMenuOpen && (
              <div 
                style={{
                  position: 'absolute',
                  top: '115%',
                  right: 0,
                  width: '10.5rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-card)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-drop)',
                  padding: '0.35rem',
                  zIndex: 50
                }}
              >
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setLang(l.code);
                      setLangMenuOpen(false);
                      playSound('click', sfx);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.45rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      border: 'none',
                      background: l.code === lang ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                      color: l.code === lang ? 'var(--brand-500)' : 'var(--text-primary)',
                      textAlign: 'left'
                    }}
                  >
                    <span>{l.flag} {l.name}</span>
                    {l.code === lang && <CheckCircle size={12} color="var(--brand-500)" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SFX Audio Toggle */}
          <button
            type="button"
            onClick={toggleSfx}
            title={sfx ? "Sound Effects: Enabled (Click to mute)" : "Sound Effects: Muted (Click to enable)"}
            aria-label={sfx ? "Mute audio effects" : "Enable audio effects"}
            className="btn-secondary"
            style={{
              padding: '0.45rem',
              color: sfx ? 'var(--brand-500)' : 'var(--text-muted)'
            }}
          >
            {sfx ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="btn-secondary"
            style={{
              padding: '0.45rem',
              color: theme === 'dark' ? '#f59e0b' : '#6366f1'
            }}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>
    </header>
  );
}
