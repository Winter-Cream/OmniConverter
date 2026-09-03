import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

import Header from './components/Header';
import TabNavigation from './components/TabNavigation';
import FileConverterTab from './components/FileConverterTab';
import PdfSuiteTab from './components/PdfSuiteTab';
import UnitConverterTab from './components/UnitConverterTab';
import ActivityLogsTab from './components/ActivityLogsTab';
import AchievementsTab from './components/AchievementsTab';
import OcrModal from './components/OcrModal';
import FileOptionsModal from './components/FileOptionsModal';
import CommandPaletteModal from './components/CommandPaletteModal';
import AiChatbot from './components/AiChatbot';

import { checkHealth, fetchFormats, fetchStats } from './services/api';
import { playSound } from './utils/audio';

export default function App() {
  const [activeTab, setActiveTab] = useState('converter');
  const [stats, setStats] = useState(null);
  const [formats, setFormats] = useState(null);
  const [backendOnline, setBackendOnline] = useState(true);

  // User Settings
  const [theme, setTheme] = useState(() => localStorage.getItem('omni_theme') || 'dark');
  const [lang, setLang] = useState(() => localStorage.getItem('omni_lang') || 'en');
  const [sfx, setSfx] = useState(() => localStorage.getItem('omni_sfx') !== 'false');

  // Modals state
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [ocrModalData, setOcrModalData] = useState(null);
  const [optionsModalItem, setOptionsModalItem] = useState(null);

  // Sync theme class to documentElement
  useEffect(() => {
    localStorage.setItem('omni_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  // Sync language and SFX
  useEffect(() => {
    localStorage.setItem('omni_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('omni_sfx', sfx.toString());
  }, [sfx]);

  // Load initial backend state
  const loadData = async () => {
    const health = await checkHealth();
    setBackendOnline(health.status === 'online');

    try {
      const statsData = await fetchStats();
      setStats(statsData);
    } catch (e) {
      console.warn('Could not fetch stats', e);
    }

    try {
      const formatsData = await fetchFormats();
      setFormats(formatsData);
    } catch (e) {
      console.warn('Could not fetch formats', e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {}
  };

  const handleOpenOcrModal = (result, filename) => {
    setOcrModalData({ result, filename });
  };

  const handleSaveOptions = (itemId, updatedOptions) => {
    // Handled in parent or queue update
    setOptionsModalItem(null);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      
      <div>
        {/* Navigation Header */}
        <Header 
          stats={stats}
          lang={lang}
          setLang={setLang}
          theme={theme}
          setTheme={setTheme}
          sfx={sfx}
          setSfx={setSfx}
          backendOnline={backendOnline}
          onOpenSpotlight={() => setSpotlightOpen(true)}
        />

        {/* Main Workspace Container */}
        <main style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '1.75rem 1rem',
          width: '100%'
        }}>
          {/* Primary Tabs Navigation */}
          <TabNavigation 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            lang={lang}
            sfx={sfx}
          />

          {/* Active Tab Content */}
          {activeTab === 'converter' && (
            <FileConverterTab 
              formats={formats}
              stats={stats}
              refreshStats={loadData}
              lang={lang}
              sfx={sfx}
              onOpenOptions={(item) => setOptionsModalItem(item)}
              triggerCelebration={triggerCelebration}
            />
          )}

          {activeTab === 'pdf' && (
            <PdfSuiteTab 
              lang={lang}
              sfx={sfx}
              onOpenOcrModal={handleOpenOcrModal}
              refreshStats={loadData}
              triggerCelebration={triggerCelebration}
            />
          )}

          {activeTab === 'units' && (
            <UnitConverterTab 
              sfx={sfx}
            />
          )}

          {activeTab === 'logs' && (
            <ActivityLogsTab 
              stats={stats}
              refreshStats={loadData}
              sfx={sfx}
            />
          )}

          {activeTab === 'achievements' && (
            <AchievementsTab 
              stats={stats}
            />
          )}
        </main>
      </div>

      {/* Floating OmniAI Assistant Chatbot */}
      <AiChatbot sfx={sfx} />

      {/* Spotlight Command Palette Modal (Ctrl + K) */}
      <CommandPaletteModal 
        isOpen={spotlightOpen}
        onClose={() => setSpotlightOpen(false)}
        onSelectTab={(tabId) => setActiveTab(tabId)}
        onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
        theme={theme}
        sfx={sfx}
      />

      {/* OCR Inspector Modal */}
      {ocrModalData && (
        <OcrModal 
          isOpen={Boolean(ocrModalData)}
          onClose={() => setOcrModalData(null)}
          data={ocrModalData.result}
          filename={ocrModalData.filename}
          sfx={sfx}
        />
      )}

      {/* File Conversion Options Modal */}
      {optionsModalItem && (
        <FileOptionsModal 
          isOpen={Boolean(optionsModalItem)}
          onClose={() => setOptionsModalItem(null)}
          item={optionsModalItem}
          onSaveOptions={handleSaveOptions}
          sfx={sfx}
        />
      )}

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-card)',
        background: 'var(--bg-glass-subtle)',
        padding: '1.25rem 1rem',
        marginTop: '3rem',
        textAlign: 'center',
        fontSize: '0.75rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>OmniConverter PRO 4.1.0 • Universal File Engine & PDF Suite</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span>Privacy-First & Zero Tracking</span>
            <span>•</span>
            <span>100% Offline Processing</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
