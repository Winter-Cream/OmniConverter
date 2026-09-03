import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Trash2, 
  Settings2, 
  Check, 
  AlertCircle, 
  Loader2, 
  Download, 
  FolderSync, 
  Sliders, 
  FileCode, 
  Play, 
  FileCheck
} from 'lucide-react';
import { convertSingleFile, convertBatchFiles, updateWatchFolderConfig } from '../services/api';
import { t } from '../utils/translations';
import { playSound } from '../utils/audio';
import CustomSelect from './CustomSelect';

export default function FileConverterTab({
  formats,
  stats,
  refreshStats,
  lang,
  sfx,
  onOpenOptions,
  triggerCelebration
}) {
  const [queue, setQueue] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const [watchFolderOpen, setWatchFolderOpen] = useState(false);
  const [watchConfig, setWatchConfig] = useState({
    enabled: stats?.watchFolder?.enabled || false,
    path: stats?.watchFolder?.path || 'C:\\OmniWatch\\Input',
    outputPath: stats?.watchFolder?.output_path || 'C:\\OmniWatch\\Output',
    targetFormat: stats?.watchFolder?.target_format || 'pdf'
  });
  const [watchSaving, setWatchSaving] = useState(false);
  const [watchMessage, setWatchMessage] = useState('');

  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  // Helper to determine allowed targets for a given file extension
  const getAllowedTargets = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (formats?.extensions && formats.extensions[ext]) {
      return formats.extensions[ext].targets || ['pdf', 'txt'];
    }
    // Fallback based on common formats
    if (['png', 'jpg', 'jpeg', 'webp', 'bmp', 'ico', 'gif'].includes(ext)) {
      return ['png', 'jpg', 'webp', 'bmp', 'ico', 'pdf'];
    }
    if (['pdf', 'docx', 'txt', 'html', 'md'].includes(ext)) {
      return ['pdf', 'docx', 'txt', 'html', 'md', 'png', 'jpg'];
    }
    if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext)) {
      return ['mp3', 'wav', 'ogg', 'flac', 'aac'];
    }
    if (['mp4', 'webm', 'mkv', 'avi'].includes(ext)) {
      return ['mp4', 'webm', 'gif', 'mp3', 'wav', 'aac'];
    }
    if (['csv', 'json', 'xlsx'].includes(ext)) {
      return ['csv', 'json', 'xlsx', 'txt'];
    }
    return ['pdf', 'txt', 'json'];
  };

  const handleFiles = (fileList) => {
    const newItems = Array.from(fileList).map(file => {
      const allowed = getAllowedTargets(file.name);
      return {
        id: Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        targetFormat: allowed[0] || 'pdf',
        allowedTargets: allowed,
        status: 'ready', // ready, converting, done, error
        error: null,
        resultBlob: null,
        resultFilename: null,
        options: {}
      };
    });

    setQueue(prev => [...prev, ...newItems]);
    playSound('upload', sfx);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = () => {
    setDragActive(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeQueueItem = (id) => {
    setQueue(prev => prev.filter(item => item.id !== id));
    playSound('click', sfx);
  };

  const clearQueue = () => {
    setQueue([]);
    playSound('click', sfx);
  };

  const updateTargetFormat = (id, target) => {
    setQueue(prev => prev.map(item => item.id === id ? { ...item, targetFormat: target } : item));
    playSound('click', sfx);
  };

  // Convert Single Queue Item
  const processItem = async (item) => {
    setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'converting', error: null } : i));
    try {
      const { blob, filename } = await convertSingleFile(item.file, item.targetFormat, item.options);
      setQueue(prev => prev.map(i => i.id === item.id ? { 
        ...i, 
        status: 'done', 
        resultBlob: blob, 
        resultFilename: filename 
      } : i));
      playSound('success', sfx);
      refreshStats();
    } catch (err) {
      setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', error: err.message } : i));
      playSound('error', sfx);
    }
  };

  // Process Batch Queue
  const processAllQueue = async () => {
    if (queue.length === 0 || isConverting) return;
    setIsConverting(true);
    playSound('click', sfx);

    let completedCount = 0;
    for (const item of queue) {
      if (item.status === 'done') {
        completedCount++;
        continue;
      }
      setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'converting' } : i));
      try {
        const { blob, filename } = await convertSingleFile(item.file, item.targetFormat, item.options);
        setQueue(prev => prev.map(i => i.id === item.id ? { 
          ...i, 
          status: 'done', 
          resultBlob: blob, 
          resultFilename: filename 
        } : i));
        completedCount++;
      } catch (err) {
        setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', error: err.message } : i));
      }
    }

    setIsConverting(false);
    refreshStats();
    if (completedCount > 0) {
      playSound('levelup', sfx);
      if (triggerCelebration) triggerCelebration();
    }
  };

  const downloadResult = (item) => {
    if (!item.resultBlob) return;
    const url = URL.createObjectURL(item.resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.resultFilename || `${item.name}_converted.${item.targetFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    playSound('click', sfx);
  };

  // Watch Folder Config Save
  const handleSaveWatchConfig = async () => {
    setWatchSaving(true);
    setWatchMessage('');
    try {
      const res = await updateWatchFolderConfig(
        watchConfig.enabled,
        watchConfig.path,
        watchConfig.outputPath,
        watchConfig.targetFormat
      );
      setWatchMessage('✓ Daemon configuration updated successfully!');
      playSound('success', sfx);
      refreshStats();
    } catch (err) {
      setWatchMessage(`⚠️ Error: ${err.message}`);
      playSound('error', sfx);
    } finally {
      setWatchSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Interactive Dropzone */}
      <div
        className={`dropzone ${dragActive ? 'active' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          multiple 
          style={{ display: 'none' }} 
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFiles(e.target.files);
              e.target.value = '';
            }
          }}
        />
        
        <div style={{
          width: '4rem',
          height: '4rem',
          borderRadius: 'var(--radius-lg)',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
          color: 'var(--brand-500)',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <UploadCloud size={30} />
        </div>

        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
          {t('dropzoneTitle', lang)}
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '550px', margin: '0 auto' }}>
          {t('dropzoneSub', lang)}
        </p>
      </div>

      {/* Queue Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-card)',
          paddingBottom: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Conversion Queue
            </h3>
            <span className="badge badge-brand font-mono">
              {queue.length} {queue.length === 1 ? 'File' : 'Files'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {queue.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>Set all to:</span>
                <CustomSelect
                  value=""
                  placeholder="Choose target..."
                  onChange={(target) => {
                    setQueue(prev => prev.map(item => item.allowedTargets.includes(target) ? { ...item, targetFormat: target } : item));
                    playSound('click', sfx);
                  }}
                  options={[
                    { value: 'pdf', label: 'PDF' },
                    { value: 'png', label: 'PNG' },
                    { value: 'jpg', label: 'JPG' },
                    { value: 'webp', label: 'WEBP' },
                    { value: 'mp3', label: 'MP3' },
                    { value: 'mp4', label: 'MP4' },
                    { value: 'txt', label: 'TXT' },
                    { value: 'docx', label: 'DOCX' },
                    { value: 'xlsx', label: 'XLSX' }
                  ]}
                  accentColor="var(--brand-500)"
                  minWidth="140px"
                  sfx={sfx}
                />
              </div>
            )}

            {queue.length > 0 && (
              <button 
                onClick={clearQueue} 
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
              >
                <Trash2 size={13} />
                <span>{t('clearQueueBtn', lang)}</span>
              </button>
            )}

            <button
              onClick={processAllQueue}
              disabled={queue.length === 0 || isConverting}
              className="btn-primary"
              style={{
                fontSize: '0.8rem',
                padding: '0.5rem 1.25rem',
                opacity: (queue.length === 0 || isConverting) ? 0.6 : 1,
                cursor: (queue.length === 0 || isConverting) ? 'not-allowed' : 'pointer'
              }}
            >
              {isConverting ? (
                <>
                  <Loader2 size={14} className="spin-slow" />
                  <span>Converting Batch...</span>
                </>
              ) : (
                <>
                  <Play size={14} fill="currentColor" />
                  <span>{t('processQueueBtn', lang)}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Queue Items List */}
        {queue.length === 0 ? (
          <div style={{
            padding: '2.5rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.82rem',
            fontFamily: 'var(--font-mono)'
          }}>
            No files in queue. Drag & drop files above to start converting.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {queue.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.85rem',
                  padding: '0.85rem 1.15rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-glass-subtle)',
                  border: '1px solid var(--border-card)',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* File Information */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: '1 1 240px' }}>
                  <div style={{
                    width: '2.25rem',
                    height: '2.25rem',
                    borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--brand-500)'
                  }}>
                    <FileCode size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, wordBreak: 'break-all' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }} className="font-mono">
                      {item.size}
                    </div>
                  </div>
                </div>

                {/* Target Format Selector & Options */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Convert to:
                  </span>
                  <CustomSelect
                    value={item.targetFormat}
                    onChange={(val) => updateTargetFormat(item.id, val)}
                    options={item.allowedTargets.map(tgt => ({ value: tgt, label: tgt.toUpperCase() }))}
                    disabled={item.status === 'converting' || item.status === 'done'}
                    accentColor="var(--brand-500)"
                    minWidth="120px"
                    sfx={sfx}
                  />

                  <button
                    title="Conversion Options"
                    onClick={() => onOpenOptions(item)}
                    style={{
                      width: '2rem',
                      height: '2rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-card)',
                      background: 'var(--bg-surface)',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Settings2 size={14} />
                  </button>
                </div>

                {/* Status & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {item.status === 'ready' && (
                    <button
                      onClick={() => processItem(item)}
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                    >
                      Convert
                    </button>
                  )}

                  {item.status === 'converting' && (
                    <div className="badge badge-brand">
                      <Loader2 size={12} className="spin-slow" />
                      <span>Converting...</span>
                    </div>
                  )}

                  {item.status === 'done' && (
                    <button
                      onClick={() => downloadResult(item)}
                      className="btn-primary"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', background: '#10b981' }}
                    >
                      <Download size={13} />
                      <span>Download</span>
                    </button>
                  )}

                  {item.status === 'error' && (
                    <div className="badge badge-rose" title={item.error || 'Failed'}>
                      <AlertCircle size={12} />
                      <span>Error</span>
                    </div>
                  )}

                  <button
                    onClick={() => removeQueueItem(item.id)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '0.4rem'
                    }}
                    title="Remove"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Watch Folder Automation Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div 
          onClick={() => setWatchFolderOpen(!watchFolderOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '8px',
              background: 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cyan-500)'
            }}>
              <FolderSync size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>
                {t('watchFolderTitle', lang)}
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {t('watchFolderSub', lang)}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span className={`badge ${watchConfig.enabled ? 'badge-emerald' : 'badge-amber'}`}>
              {watchConfig.enabled ? 'Active Daemon' : 'Disabled'}
            </span>
            <Sliders size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>

        {watchFolderOpen && (
          <div style={{
            marginTop: '1.25rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 }}>
                <input
                  type="checkbox"
                  checked={watchConfig.enabled}
                  onChange={(e) => setWatchConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                />
                <span>Enable Background Watch Folder Daemon</span>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                  Input Watch Directory:
                </label>
                <input
                  type="text"
                  value={watchConfig.path}
                  onChange={(e) => setWatchConfig(prev => ({ ...prev, path: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.85rem',
                    borderRadius: '8px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                  Output Destination Directory:
                </label>
                <input
                  type="text"
                  value={watchConfig.outputPath}
                  onChange={(e) => setWatchConfig(prev => ({ ...prev, outputPath: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.85rem',
                    borderRadius: '8px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                  Target Format:
                </label>
                <input
                  type="text"
                  value={watchConfig.targetFormat}
                  onChange={(e) => setWatchConfig(prev => ({ ...prev, targetFormat: e.target.value.toLowerCase() }))}
                  placeholder="e.g. pdf, png, mp3"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.85rem',
                    borderRadius: '8px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem'
                  }}
                />
              </div>
            </div>

            {watchMessage && (
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: watchMessage.includes('✓') ? '#10b981' : '#f43f5e' }}>
                {watchMessage}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleSaveWatchConfig}
                disabled={watchSaving}
                className="btn-primary"
                style={{ fontSize: '0.78rem', padding: '0.5rem 1.15rem' }}
              >
                {watchSaving ? 'Saving...' : t('saveConfigBtn', lang)}
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
