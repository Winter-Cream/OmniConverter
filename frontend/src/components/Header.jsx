import React, { useState } from 'react';
import { 
  Flame, 
  CheckCircle, 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  Search, 
  Globe, 
  ChevronDown, 
  Activity,
  Award
} from 'lucide-react';
import { playSound } from '../utils/audio';

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
  stats,
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
  const level = stats?.level || 1;
  const xp = stats?.xp || 0;
  const nextLevelXp = level * 200;
  const progressPercent = Math.min(100, Math.round((xp / nextLevelXp) * 100));

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
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      background: 'var(--bg-glass)',
      borderBottom: '1px solid var(--border-card)',
      transition: 'all 0.2s ease'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 1rem',
        height: '4.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        {/* Brand Logo & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }}>
          <div style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--brand-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 8px 16px -4px rgba(99, 102, 241, 0.4)'
          }}>
            <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>🚀</span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                fontFamily: 'var(--font-heading)',
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)'
              }}>
                OmniConverter
              </span>
              <span className="badge badge-brand font-mono" style={{ fontSize: '0.65rem' }}>
                v4.1 PRO
              </span>
            </div>
          </div>
        </div>

        {/* Spotlight Search Shortcut Button */}
        <button
          onClick={() => {
            playSound('click', sfx);
            onOpenSpotlight();
          }}
          className="btn-secondary"
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.45rem 0.9rem',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)'
          }}
          id="spotlight-header-btn"
        >
          <Search size={14} color="var(--brand-500)" />
          <span>Search tools...</span>
          <kbd style={{
            padding: '0.15rem 0.4rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: '6px',
            fontSize: '0.65rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700
          }}>
            Ctrl K
          </kbd>
        </button>

        {/* Gamification & Live Engine Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Daily Streak */}
          <div className="badge badge-amber" title="Daily Streak">
            <Flame size={13} style={{ color: '#f59e0b' }} />
            <span>{stats?.streak || 1} Day Streak</span>
          </div>

          {/* Files Converted */}
          <div className="badge badge-emerald" title="Files Processed">
            <CheckCircle size={13} style={{ color: '#10b981' }} />
            <span className="font-mono">{stats?.filesConverted || 0}</span>
          </div>

          {/* Level Progress */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.25rem 0.65rem',
            borderRadius: '9999px',
            background: 'rgba(139, 92, 246, 0.12)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            fontSize: '0.72rem',
            fontWeight: 700,
            color: '#a78bfa'
          }}>
            <Award size={13} />
            <span className="font-mono">LVL {level}</span>
            <div style={{
              width: '4rem',
              height: '0.4rem',
              borderRadius: '9999px',
              background: 'rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                height: '100%',
                width: `${progressPercent}%`,
                background: 'var(--brand-gradient)',
                borderRadius: '9999px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>

        {/* Controls Toolbar: Language, Audio SFX, Theme */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.25rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-glass-subtle)',
          border: '1px solid var(--border-card)'
        }}>
          {/* Language Selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.6rem',
                borderRadius: '8px',
                border: '1px solid var(--border-card)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <span>{currentLangObj.flag}</span>
              <span className="font-mono">{currentLangObj.code.toUpperCase()}</span>
              <ChevronDown size={11} style={{ opacity: 0.7 }} />
            </button>

            {langMenuOpen && (
              <div style={{
                position: 'absolute',
                top: '115%',
                right: 0,
                width: '10.5rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-drop)',
                padding: '0.4rem',
                zIndex: 50
              }}>
                {LANGUAGES.map(l => (
                  <div
                    key={l.code}
                    onClick={() => {
                      setLang(l.code);
                      setLangMenuOpen(false);
                      playSound('click', sfx);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.45rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: l.code === lang ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      color: l.code === lang ? 'var(--brand-500)' : 'var(--text-primary)'
                    }}
                  >
                    <span>{l.flag} {l.name}</span>
                    {l.code === lang && <CheckCircle size={12} color="var(--brand-500)" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SFX Toggle */}
          <button
            onClick={toggleSfx}
            title={sfx ? "Mute Sound FX" : "Enable Sound FX"}
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '8px',
              border: '1px solid var(--border-card)',
              background: 'var(--bg-surface)',
              color: sfx ? 'var(--brand-500)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {sfx ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '8px',
              border: '1px solid var(--border-card)',
              background: 'var(--bg-surface)',
              color: theme === 'dark' ? '#f59e0b' : '#6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </div>
    </header>
  );
}
