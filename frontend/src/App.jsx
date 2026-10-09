import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

import Header from './components/Header';
import TabNavigation from './components/TabNavigation';
import FileConverterTab from './components/FileConverterTab';
import PdfSuiteTab from './components/PdfSuiteTab';
import UnitConverterTab from './components/UnitConverterTab';
import ActivityLogsTab from './components/ActivityLogsTab';
import AchievementsTab from './components/AchievementsTab';
import OcrModal from './components/OcrModal';
import CommandPaletteModal from './components/CommandPaletteModal';
import AiChatbot from './components/AiChatbot';

import { checkHealth, fetchFormats, fetchStats } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('converter');
  const [stats, setStats] = useState(null);
  const [formats, setFormats] = useState(null);
  const [backendOnline, setBackendOnline] = useState(true);
  const [queueCount, setQueueCount] = useState(0);

  // User Settings
  const [theme, setTheme] = useState(() => localStorage.getItem('omni_theme') || 'dark');
  const [lang, setLang] = useState(() => localStorage.getItem('omni_lang') || 'en');
  // Default sound effects to muted for professional desktop workflow
  const [sfx, setSfx] = useState(() => localStorage.getItem('omni_sfx') === 'true');

  // Modals state
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [ocrModalData, setOcrModalData] = useState(null);

  // Guards for async polling & unmount
  const isMountedRef = useRef(true);
  const isRefreshingRef = useRef(false);

  // Reusable reliable refresh function for health, stats, and formats
  const loadData = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;

    try {
      // 1. Backend health check
      try {
        const health = await checkHealth();
        if (isMountedRef.current) {
          setBackendOnline(health?.status === 'online');
        }
      } catch {
        if (isMountedRef.current) {
          setBackendOnline(false);
        }
      }

      // 2. Fetch stats (does not fail if health or formats fail)
      try {
        const statsData = await fetchStats();
        if (isMountedRef.current) {
          setStats(statsData);
        }
      } catch (e) {
        console.warn('Could not fetch stats', e);
      }

      // 3. Fetch supported formats (does not fail if health or stats fail)
      try {
        const formatsData = await fetchFormats();
        if (isMountedRef.current) {
          setFormats(formatsData);
        }
      } catch (e) {
        console.warn('Could not fetch formats', e);
      }
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

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

  // Initial load and 15-second periodic polling
  useEffect(() => {
    isMountedRef.current = true;
    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 15000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [loadData]);

  const handleOpenOcrModal = (result, filename) => {
    setOcrModalData({ result, filename });
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

        {/* Backend Disconnected Warning Banner */}
        {!backendOnline && (
          <div 
            role="alert"
            style={{
              background: 'rgba(245, 158, 11, 0.12)',
              borderBottom: '1px solid rgba(245, 158, 11, 0.25)',
              padding: '0.65rem 1.25rem',
              fontSize: '0.8rem',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <AlertTriangle size={16} style={{ color: 'var(--amber-500)', flexShrink: 0 }} />
              <span>
                <strong>Conversion Engine Offline:</strong> The Python backend server is not detected on localhost. File conversion, PDF tools, and OCR require starting the backend with <code>run.bat</code> or <code>python server.py</code>. (Offline client tools like the Scientific Unit Converter remain operational.)
              </span>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="btn-secondary"
              style={{ fontSize: '0.72rem', padding: '0.3rem 0.75rem', borderColor: 'var(--amber-500)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <RefreshCw size={12} />
              <span>Retry Connection</span>
            </button>
          </div>
        )}

        {/* Main Workspace Container */}
        <main style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '1.5rem 1.25rem',
          width: '100%'
        }}>
          {/* Primary Tabs Navigation */}
          <TabNavigation 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            lang={lang}
            sfx={sfx}
            queueCount={queueCount}
          />

          {/* Active Tab Content */}
          <div style={{ display: activeTab === 'converter' ? 'block' : 'none' }}>
            <FileConverterTab 
              formats={formats}
              stats={stats}
              refreshStats={loadData}
              lang={lang}
              sfx={sfx}
              onQueueCountChange={setQueueCount}
            />
          </div>

          {activeTab === 'pdf' && (
            <PdfSuiteTab 
              lang={lang}
              sfx={sfx}
              onOpenOcrModal={handleOpenOcrModal}
              refreshStats={loadData}
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

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-card)',
        background: 'var(--bg-surface)',
        padding: '1.25rem 1.25rem',
        marginTop: '3rem',
        fontSize: '0.75rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>OmniConverter PRO 4.1.0 • Desktop File Engine & PDF Suite</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span>100% Local Execution</span>
            <span>•</span>
            <span>Zero Network Uploads</span>
            <span>•</span>
            <span>Privacy-First</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
