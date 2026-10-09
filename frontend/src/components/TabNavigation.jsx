import React from 'react';
import { 
  FileUp, 
  FileText, 
  Calculator, 
  Clock, 
  Trophy, 
  Layers
} from 'lucide-react';
import { t } from '../utils/translations';
import { playSound } from '../utils/audio';

export default function TabNavigation({ activeTab, setActiveTab, lang, sfx, queueCount = 0 }) {
  const tabs = [
    { id: 'converter', label: t('fileHub', lang) || 'File Converter', icon: FileUp, count: queueCount },
    { id: 'pdf', label: t('pdfSuite', lang) || 'PDF Suite', icon: FileText },
    { id: 'units', label: t('scienceLab', lang) || 'Unit Converter', icon: Calculator },
    { id: 'logs', label: t('statsLogs', lang) || 'Activity Logs', icon: Clock },
    { id: 'achievements', label: t('questsBadges', lang) || 'Stats & Badges', icon: Trophy }
  ];

  return (
    <nav 
      aria-label="Workspace tabs"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        padding: '0.35rem 0.5rem',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-card)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '1.5rem'
      }}
    >
      <div 
        role="tablist"
        style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}
      >
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                playSound('click', sfx);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 0.95rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                fontWeight: isActive ? 600 : 500,
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
                border: 'none',
                transition: 'background-color 0.15s ease, color 0.15s ease',
                background: isActive ? 'var(--brand-600)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              <Icon size={15} style={{ color: isActive ? '#ffffff' : 'var(--text-muted)' }} />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span 
                  className="font-mono"
                  style={{
                    fontSize: '0.7rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '9999px',
                    background: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(99, 102, 241, 0.15)',
                    color: isActive ? '#ffffff' : 'var(--brand-500)',
                    lineHeight: 1
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingRight: '0.4rem' }}>
        <span style={{
          fontSize: '0.72rem',
          fontWeight: 500,
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem'
        }}>
          <Layers size={13} style={{ color: 'var(--brand-500)' }} />
          <span>Local-First Workspace</span>
        </span>
      </div>
    </nav>
  );
}
