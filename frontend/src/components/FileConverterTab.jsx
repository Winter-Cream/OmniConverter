import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Trash2, 
  Settings2, 
  AlertCircle, 
  Loader2, 
  Download, 
  FolderSync, 
  FileCode, 
  Play, 
  Check, 
  RotateCcw,
  FileText,
  Image as ImageIcon,
  Music,
  Video as VideoIcon,
  FileSpreadsheet,
  File as FileIcon,
  ChevronDown,
  ChevronUp,
  Archive
} from 'lucide-react';
import { convertSingleFile, convertBatchFiles, updateWatchFolderConfig } from '../services/api';
import { t } from '../utils/translations';
import { playSound } from '../utils/audio';
import CustomSelect from './CustomSelect';
import FileOptionsModal from './FileOptionsModal';

function getFileCategoryIcon(filename) {
  const ext = (filename || '').split('.').pop().toLowerCase();
  if (['pdf', 'docx', 'doc', 'txt', 'rtf', 'odt', 'html', 'md'].includes(ext)) {
    return <FileText size={18} style={{ color: '#ef4444' }} />;
  }
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'ico', 'svg', 'tiff'].includes(ext)) {
    return <ImageIcon size={18} style={{ color: '#3b82f6' }} />;
  }
  if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext)) {
    return <Music size={18} style={{ color: '#a855f7' }} />;
  }
  if (['mp4', 'webm', 'mkv', 'avi', 'mov', 'flv'].includes(ext)) {
    return <VideoIcon size={18} style={{ color: '#f59e0b' }} />;
  }
  if (['csv', 'xlsx', 'xls', 'json', 'tsv', 'xml', 'yaml'].includes(ext)) {
    return <FileSpreadsheet size={18} style={{ color: '#10b981' }} />;
  }
  return <FileIcon size={18} style={{ color: 'var(--text-muted)' }} />;
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

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
  const [isBatchZipLoading, setIsBatchZipLoading] = useState(false);
  const [optionsModalItem, setOptionsModalItem] = useState(null);
  const [watchFolderOpen, setWatchFolderOpen] = useState(false);
  const [watchConfig, setWatchConfig] = useState({
    enabled: stats?.watchFolder?.enabled || false,
    path: stats?.watchFolder?.path || 'C:\\OmniWatch\\Input',
    outputPath: stats?.watchFolder?.output_path || 'C:\\OmniWatch\\Output',
    targetFormat: stats?.watchFolder?.target_format || 'pdf'
  });
  const [watchSaving, setWatchSaving] = useState(false);
  const [watchMessage, setWatchMessage] = useState('');

  const handleSaveOptions = (itemId, updatedOptions) => {
    setQueue(prev => prev.map(i => i.id === itemId ? { ...i, options: updatedOptions } : i));
    setOptionsModalItem(null);
  };

  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  // Helper to determine allowed targets for a given file extension
  const getAllowedTargets = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (formats?.extensions && formats.extensions[ext]) {
      return formats.extensions[ext].targets || ['pdf', 'txt'];
    }
    // Fallback based on common formats
    if (['png', 'jpg', 'jpeg', 'webp', 'bmp', 'ico', 'gif', 'tiff'].includes(ext)) {
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
        sizeBytes: file.size,
        sizeText: formatBytes(file.size),
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

  const clearCompleted = () => {
    setQueue(prev => prev.filter(item => item.status !== 'done'));
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
      if (refreshStats) refreshStats();
    } catch (err) {
      setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', error: err.message } : i));
      playSound('error', sfx);
    }
  };

  // Process All in Queue sequentially
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
      setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'converting', error: null } : i));
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
    if (refreshStats) refreshStats();
    if (completedCount > 0) {
      playSound('success', sfx);
      if (triggerCelebration) triggerCelebration();
    }
  };

  // Download all completed files
  const downloadAllCompleted = () => {
    const completedItems = queue.filter(i => i.status === 'done' && i.resultBlob);
    if (completedItems.length === 0) return;

    completedItems.forEach((item, index) => {
      setTimeout(() => {
        downloadResult(item, false);
      }, index * 200);
    });
    playSound('click', sfx);
  };

  // Download batch converted as ZIP directly from backend
  const handleBatchZipDownload = async () => {
    if (queue.length === 0 || isBatchZipLoading) return;
    const targetFormat = queue[0].targetFormat;
    // Check if all files support this target
    const eligibleFiles = queue.map(q => q.file);
    
    setIsBatchZipLoading(true);
    playSound('click', sfx);
    try {
      const { blob, filename } = await convertBatchFiles(eligibleFiles, targetFormat, {});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      playSound('success', sfx);
      if (refreshStats) refreshStats();
    } catch (err) {
      alert(`Batch ZIP failed: ${err.message}`);
      playSound('error', sfx);
    } finally {
      setIsBatchZipLoading(false);
    }
  };

  const downloadResult = (item, playSfx = true) => {
    if (!item.resultBlob) return;
    const url = URL.createObjectURL(item.resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.resultFilename || `${item.name.replace(/\.[^/.]+$/, "")}_converted.${item.targetFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (playSfx) playSound('click', sfx);
  };

  // Watch Folder Config Save
  const handleSaveWatchConfig = async () => {
    setWatchSaving(true);
    setWatchMessage('');
    try {
      await updateWatchFolderConfig(
        watchConfig.enabled,
        watchConfig.path,
        watchConfig.outputPath,
        watchConfig.targetFormat
      );
      setWatchMessage('Configuration updated successfully.');
      playSound('success', sfx);
      if (refreshStats) refreshStats();
    } catch (err) {
      setWatchMessage(`Error: ${err.message}`);
      playSound('error', sfx);
    } finally {
      setWatchSaving(false);
    }
  };

  const doneCount = queue.filter(i => i.status === 'done').length;
  const errorCount = queue.filter(i => i.status === 'error').length;
  const readyCount = queue.filter(i => i.status === 'ready').length;
  const totalSizeBytes = queue.reduce((acc, i) => acc + (i.sizeBytes || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Primary Conversion Dropzone */}
      <section 
        aria-label="File upload dropzone"
        className={`dropzone ${dragActive ? 'active' : ''}`}
        tabIndex={0}
        role="button"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
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
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem',
          color: 'var(--brand-500)'
        }}>
          <UploadCloud size={28} />
        </div>

        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
          {t('dropzoneTitle', lang) || 'Drop files here or click to browse'}
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto 1.25rem', lineHeight: 1.5 }}>
          {t('dropzoneSub', lang) || 'Convert between 50+ formats locally on your device without file size limits or cloud uploads.'}
        </p>

        {/* Action Button inside Dropzone */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="btn-primary" style={{ pointerEvents: 'none' }}>
            Select Files to Convert
          </span>
        </div>

        {/* Format categories hints */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginTop: '1.25rem'
        }}>
          {['PDF & Documents', 'PNG, JPG & Images', 'MP4 & Videos', 'MP3 & Audio', 'CSV & Spreadsheets'].map((fmt) => (
            <span 
              key={fmt} 
              className="badge badge-neutral" 
              style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}
            >
              {fmt}
            </span>
          ))}
        </div>
      </section>

      {/* Conversion Queue Panel */}
      <section 
        aria-label="Conversion queue"
        className="glass-panel" 
        style={{ padding: '1.25rem' }}
      >
        {/* Queue Header & Actions */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          borderBottom: '1px solid var(--border-card)',
          paddingBottom: '0.9rem',
          marginBottom: '1rem'
        }}>
          {/* Left: Queue Title & Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>
              Conversion Queue
            </h3>
            <span className="badge badge-neutral font-mono">
              {queue.length} {queue.length === 1 ? 'file' : 'files'}
            </span>
            {queue.length > 0 && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }} className="font-mono">
                ({formatBytes(totalSizeBytes)})
              </span>
            )}
            {doneCount > 0 && (
              <span className="badge badge-emerald font-mono">
                {doneCount} ready
              </span>
            )}
            {errorCount > 0 && (
              <span className="badge badge-rose font-mono">
                {errorCount} failed
              </span>
            )}
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Global Target Selector */}
            {queue.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Set all to:
                </span>
                <CustomSelect
                  value=""
                  placeholder="Target..."
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
                  minWidth="120px"
                  sfx={sfx}
                />
              </div>
            )}

            {/* Clear Completed Button */}
            {doneCount > 0 && (
              <button 
                type="button"
                onClick={clearCompleted} 
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                title="Remove converted items from the queue"
              >
                <span>Clear Done</span>
              </button>
            )}

            {/* Clear All Queue */}
            {queue.length > 0 && (
              <button 
                type="button"
                onClick={clearQueue} 
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                title="Clear all files from the queue"
              >
                <Trash2 size={13} />
                <span>Clear All</span>
              </button>
            )}

            {/* Download All Completed Files */}
            {doneCount > 1 && (
              <button
                type="button"
                onClick={downloadAllCompleted}
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                title="Download all converted files"
              >
                <Download size={13} />
                <span>Download All ({doneCount})</span>
              </button>
            )}

            {/* Batch Convert as ZIP */}
            {queue.length > 1 && readyCount > 0 && (
              <button
                type="button"
                onClick={handleBatchZipDownload}
                disabled={isBatchZipLoading || isConverting}
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                title="Convert all into a single downloaded ZIP archive"
              >
                {isBatchZipLoading ? (
                  <Loader2 size={13} className="spin-slow" />
                ) : (
                  <Archive size={13} />
                )}
                <span>Export as ZIP</span>
              </button>
            )}

            {/* Primary Convert All Button */}
            <button
              type="button"
              onClick={processAllQueue}
              disabled={queue.length === 0 || isConverting || readyCount === 0}
              className="btn-primary"
              style={{
                fontSize: '0.8rem',
                padding: '0.45rem 1.15rem',
                opacity: (queue.length === 0 || isConverting || readyCount === 0) ? 0.6 : 1,
                cursor: (queue.length === 0 || isConverting || readyCount === 0) ? 'not-allowed' : 'pointer'
              }}
            >
              {isConverting ? (
                <>
                  <Loader2 size={14} className="spin-slow" />
                  <span>Converting Queue...</span>
                </>
              ) : (
                <>
                  <Play size={13} fill="currentColor" />
                  <span>{queue.length > 1 ? `Convert All (${readyCount})` : 'Convert File'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Queue Items List */}
        {queue.length === 0 ? (
          <div style={{
            padding: '2.5rem 1rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)'
            }}>
              <FileCode size={18} />
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Your queue is currently empty
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Drag and drop files above, or click browse to add items.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {queue.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  transition: 'background-color 0.15s ease'
                }}
              >
                {/* File Information */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 240px' }}>
                  <div style={{
                    width: '2.25rem',
                    height: '2.25rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getFileCategoryIcon(item.name)}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div 
                      title={item.name}
                      style={{ 
                        fontSize: '0.85rem', 
                        fontWeight: 600, 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        maxWidth: '320px'
                      }}
                    >
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }} className="font-mono">
                      {item.sizeText}
                    </div>
                  </div>
                </div>

                {/* Target Format Selector & Options */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label htmlFor={`target-${item.id}`} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Output:
                  </label>
                  <CustomSelect
                    id={`target-${item.id}`}
                    value={item.targetFormat}
                    onChange={(val) => updateTargetFormat(item.id, val)}
                    options={item.allowedTargets.map(tgt => ({ value: tgt, label: tgt.toUpperCase() }))}
                    disabled={item.status === 'converting' || item.status === 'done'}
                    accentColor="var(--brand-500)"
                    minWidth="110px"
                    sfx={sfx}
                  />

                  {/* Options Settings Gear */}
                  <button
                    type="button"
                    title="Configure encoding parameters (quality, resolution, bitrate)"
                    aria-label={`Options for ${item.name}`}
                    onClick={() => {
                      if (onOpenOptions) onOpenOptions(item);
                      setOptionsModalItem(item);
                    }}
                    disabled={item.status === 'converting'}
                    className="btn-secondary"
                    style={{
                      padding: '0.45rem',
                      color: Object.keys(item.options || {}).length > 0 ? 'var(--brand-500)' : 'var(--text-secondary)'
                    }}
                  >
                    <Settings2 size={15} />
                  </button>
                </div>

                {/* Status & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {item.status === 'ready' && (
                    <button
                      type="button"
                      onClick={() => processItem(item)}
                      disabled={isConverting}
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.8rem' }}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="badge badge-emerald" title="Converted successfully">
                        <Check size={12} />
                        <span>Ready</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => downloadResult(item)}
                        className="btn-primary"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.8rem', background: 'var(--emerald-500)' }}
                        title="Download converted file"
                      >
                        <Download size={13} />
                        <span>Download</span>
                      </button>
                    </div>
                  )}

                  {item.status === 'error' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div 
                        className="badge badge-rose" 
                        title={item.error || 'Conversion error'}
                        style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        <AlertCircle size={12} />
                        <span>{item.error ? item.error.substring(0, 30) : 'Failed'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => processItem(item)}
                        className="btn-secondary"
                        style={{ fontSize: '0.72rem', padding: '0.3rem 0.55rem' }}
                        title="Retry conversion"
                      >
                        <RotateCcw size={12} />
                        <span>Retry</span>
                      </button>
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeQueueItem(item.id)}
                    className="btn-secondary"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      padding: '0.4rem',
                      cursor: 'pointer'
                    }}
                    title="Remove from queue"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Watch Folder Automation Panel (Collapsible Drawer) */}
      <section 
        aria-label="Watch folder automation"
        className="glass-panel" 
        style={{ padding: '1.25rem' }}
      >
        <div 
          onClick={() => setWatchFolderOpen(!watchFolderOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(2, 132, 199, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cyan-500)'
            }}>
              <FolderSync size={17} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                {t('watchFolderTitle', lang) || 'Watch Folder Automation'}
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {t('watchFolderSub', lang) || 'Monitors a local folder and automatically converts files upon arrival.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span className={`badge ${watchConfig.enabled ? 'badge-emerald' : 'badge-neutral'}`}>
              {watchConfig.enabled ? 'Daemon Active' : 'Disabled'}
            </span>
            {watchFolderOpen ? (
              <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} />
            ) : (
              <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
            )}
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
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={watchConfig.enabled}
                  onChange={(e) => setWatchConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                  style={{ accentColor: 'var(--brand-500)' }}
                />
                <span>Enable Background Watch Folder Daemon</span>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                  Input Directory Path:
                </label>
                <input
                  type="text"
                  value={watchConfig.path}
                  onChange={(e) => setWatchConfig(prev => ({ ...prev, path: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                  Output Destination Path:
                </label>
                <input
                  type="text"
                  value={watchConfig.outputPath}
                  onChange={(e) => setWatchConfig(prev => ({ ...prev, outputPath: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                  Default Target Format:
                </label>
                <input
                  type="text"
                  value={watchConfig.targetFormat}
                  onChange={(e) => setWatchConfig(prev => ({ ...prev, targetFormat: e.target.value.toLowerCase() }))}
                  placeholder="e.g. pdf, png, mp3"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
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
              <div style={{ 
                fontSize: '0.78rem', 
                fontWeight: 600, 
                color: watchMessage.includes('Error') ? 'var(--rose-500)' : 'var(--emerald-500)' 
              }}>
                {watchMessage}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleSaveWatchConfig}
                disabled={watchSaving}
                className="btn-primary"
                style={{ fontSize: '0.78rem', padding: '0.45rem 1.15rem' }}
              >
                {watchSaving ? 'Saving...' : (t('saveConfigBtn', lang) || 'Save Configuration')}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* File Options Modal */}
      {optionsModalItem && (
        <FileOptionsModal 
          isOpen={Boolean(optionsModalItem)}
          onClose={() => setOptionsModalItem(null)}
          item={optionsModalItem}
          onSaveOptions={handleSaveOptions}
          sfx={sfx}
        />
      )}

    </div>
  );
}
