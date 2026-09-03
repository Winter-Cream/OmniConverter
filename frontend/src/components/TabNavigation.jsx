import React from 'react';
import { 
  FileUp, 
  FileText, 
  Calculator, 
  Clock, 
  Trophy, 
  Sparkles 
} from 'lucide-react';
import { t } from '../utils/translations';
import { playSound } from '../utils/audio';

export default function TabNavigation({ activeTab, setActiveTab, lang, sfx }) {
  const tabs = [
    { id: 'converter', label: t('fileHub', lang), icon: FileUp, accent: '#6366f1' },
    { id: 'pdf', label: t('pdfSuite', lang), icon: FileText, accent: '#f43f5e' },
    { id: 'units', label: t('scienceLab', lang), icon: Calculator, accent: '#f59e0b' },
    { id: 'logs', label: t('statsLogs', lang), icon: Clock, accent: '#10b981' },
    { id: 'achievements', label: t('questsBadges', lang), icon: Trophy, accent: '#8b5cf6' }
  ];

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '0.5rem',
      padding: '0.4rem',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--bg-glass-subtle)',
      border: '1px solid var(--border-card)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      boxShadow: 'var(--shadow-card)',
      marginBottom: '1.5rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                playSound('click', sfx);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.15rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                background: isActive ? 'var(--brand-gradient)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: isActive ? '0 4px 14px -2px rgba(99, 102, 241, 0.45)' : 'none'
              }}
            >
              <Icon size={15} style={{ color: isActive ? '#ffffff' : tab.accent }} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingRight: '0.5rem' }}>
        <span style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem'
        }}>
          <Sparkles size={13} color="var(--brand-500)" />
          <span>50+ Formats Supported</span>
        </span>
      </div>
    </nav>
  );
}
