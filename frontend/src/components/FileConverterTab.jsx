import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Archive,
  Eye
} from 'lucide-react';
import { convertSingleFile, updateWatchFolderConfig } from '../services/api';
import { t, translateUiCopy } from '../utils/translations';
import { playSound } from '../utils/audio';
import CustomSelect from './CustomSelect';
import FileOptionsModal from './FileOptionsModal';

function getFileCategoryIcon(filename) {
  const ext = (filename || '').split('.').pop().toLowerCase();
  if (['pdf', 'docx', 'doc', 'pptx', 'ppt', 'txt', 'rtf', 'odt', 'html', 'md'].includes(ext)) {
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
  if (['csv', 'xlsx', 'json', 'tsv', 'xml', 'yaml', 'yml'].includes(ext)) {
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

function parseCsv(text, delimiter = ',') {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === delimiter && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(current => current.some(value => value !== ''));
}

function toTableRows(value) {
  if (Array.isArray(value)) {
    if (value.every(item => item && typeof item === 'object' && !Array.isArray(item))) {
      const headers = [...new Set(value.flatMap(item => Object.keys(item)))];
      return [headers, ...value.map(item => headers.map(header => String(item[header] ?? '')))];
    }
    return [['Value'], ...value.map(item => [typeof item === 'object' ? JSON.stringify(item) : String(item)])];
  }
  if (value && typeof value === 'object') return [['Key', 'Value'], ...Object.entries(value).map(([key, item]) => [key, typeof item === 'object' ? JSON.stringify(item) : String(item)])];
  return [['Value'], [String(value ?? '')]];
}

function ResultPreview({ item, onClose }) {
  const [url, setUrl] = useState('');
  const [originalUrl, setOriginalUrl] = useState('');
  const [table, setTable] = useState(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const extension = (item.resultFilename || '').split('.').pop().toLowerCase();
  const originalExtension = (item.name || '').split('.').pop().toLowerCase();
  const mediaType = item.resultBlob?.type || '';
  const isImage = mediaType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'ico', 'svg'].includes(extension);
  const isAudio = mediaType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'opus'].includes(extension);
  const isVideo = mediaType.startsWith('video/') || ['mp4', 'webm', 'mkv', 'avi', 'mov'].includes(extension);
  const isPdf = extension === 'pdf' || mediaType === 'application/pdf';

  useEffect(() => {
    if (!item.resultBlob) return undefined;
    const objectUrl = URL.createObjectURL(item.resultBlob);
    const sourceUrl = URL.createObjectURL(item.file);
    // Object URLs are external browser resources and must be synchronized through an effect.
    // oxlint-disable-next-line react/set-state-in-effect
    setUrl(objectUrl);
    setOriginalUrl(sourceUrl);
    let cancelled = false;
    const loadTable = async () => {
      try {
        let previewBlob = item.resultBlob;
        let previewExtension = extension;
        if (extension === 'xlsx') {
          const previewFile = new File([item.resultBlob], item.resultFilename || 'preview.xlsx');
          const converted = await convertSingleFile(previewFile, 'csv');
          previewBlob = converted.blob;
          previewExtension = 'csv';
        }
        if (['csv', 'tsv', 'json'].includes(previewExtension)) {
          const raw = await previewBlob.text();
          const rows = previewExtension === 'json' ? toTableRows(JSON.parse(raw)) : parseCsv(raw, previewExtension === 'tsv' ? '\t' : ',');
          if (!cancelled) setTable(rows.slice(0, 101).map(row => row.slice(0, 30)));
        } else if (!isImage && !isAudio && !isVideo && !isPdf && !['zip'].includes(extension)) {
          const previewText = (await previewBlob.text()).slice(0, 12000);
          if (!cancelled) setText(previewText);
        }
      } catch (previewError) {
        if (!cancelled) setError(previewError.message || 'This file cannot be previewed.');
      }
    };
    loadTable();
    return () => { cancelled = true; URL.revokeObjectURL(objectUrl); URL.revokeObjectURL(sourceUrl); };
  }, [item.file, item.resultBlob, item.resultFilename, extension, isImage, isAudio, isVideo, isPdf]);

  return (
    <div style={{ marginTop: '0.75rem', padding: '0.85rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-subtle)', border: '1px solid var(--border-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
        <strong style={{ fontSize: '0.78rem' }}>Converted preview · {item.resultFilename}</strong>
        <button type="button" className="btn-secondary" onClick={onClose} aria-label="Close preview" style={{ padding: '0.25rem 0.5rem' }}>Close</button>
      </div>
      {isImage && url && <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
        {['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'ico', 'svg'].includes(originalExtension) && <figure style={{ margin: 0, flex: '1 1 220px', textAlign: 'center' }}><figcaption style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Original · {item.name}</figcaption><img src={originalUrl} alt={`Original ${item.name}`} style={{ maxWidth: '100%', maxHeight: '360px', objectFit: 'contain' }} /></figure>}
        <figure style={{ margin: 0, flex: '1 1 220px', textAlign: 'center' }}><figcaption style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Converted · {item.resultFilename}</figcaption><img src={url} alt={`Converted ${item.resultFilename}`} style={{ maxWidth: '100%', maxHeight: '360px', objectFit: 'contain' }} /></figure>
      </div>}
      {isAudio && url && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>{['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'opus'].includes(originalExtension) && <label style={{ fontSize: '0.72rem' }}>Original · {item.name}<audio controls src={originalUrl} style={{ display: 'block', width: '100%' }} /></label>}<label style={{ fontSize: '0.72rem' }}>Converted · {item.resultFilename}<audio controls src={url} style={{ display: 'block', width: '100%' }} /></label></div>}
      {isVideo && url && <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem' }}>{['mp4', 'webm', 'mkv', 'avi', 'mov', 'flv', 'wmv', 'm4v'].includes(originalExtension) && <video controls src={originalUrl} style={{ maxWidth: '48%', maxHeight: '360px' }} aria-label={`Original ${item.name}`} />}<video controls src={url} style={{ maxWidth: '48%', maxHeight: '360px' }} aria-label={`Converted ${item.resultFilename}`} /></div>}
      {isPdf && url && <iframe title={`PDF preview: ${item.resultFilename}`} src={url} style={{ width: '100%', height: '420px', border: 0, background: 'white' }} />}
      {table && <div style={{ overflow: 'auto', maxHeight: '360px' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}><tbody>{table.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => { const Tag = rowIndex === 0 ? 'th' : 'td'; return <Tag key={cellIndex} style={{ textAlign: 'left', padding: '0.4rem', borderBottom: '1px solid var(--border-card)', maxWidth: '240px', overflowWrap: 'anywhere' }}>{cell}</Tag>; })}</tr>)}</tbody></table></div>}
      {text && <pre style={{ whiteSpace: 'pre-wrap', overflow: 'auto', maxHeight: '360px', fontSize: '0.75rem' }}>{text}</pre>}
      {!isImage && !isAudio && !isVideo && !isPdf && !table && !text && !error && <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Preview is not available for this output type.</p>}
      {error && <p role="alert" style={{ color: 'var(--rose-500, #f43f5e)', fontSize: '0.78rem' }}>{error}</p>}
    </div>
  );
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
  const [batchZipProgress, setBatchZipProgress] = useState(null);
  const [previewItemId, setPreviewItemId] = useState(null);
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
  const getAllowedTargets = useCallback((filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (formats?.extensions && formats.extensions[ext]) {
      return formats.extensions[ext].targets || ['pdf', 'txt'];
    }
    // Fallback based on common formats
    if (['png', 'jpg', 'jpeg', 'webp', 'bmp', 'ico', 'gif', 'tiff', 'svg'].includes(ext)) {
      return ['png', 'jpg', 'webp', 'bmp', 'ico', 'pdf'];
    }
    if (['pptx', 'ppt'].includes(ext)) {
      return ['pdf', 'docx', 'txt', 'html', 'png', 'jpg'];
    }
    if (['pdf', 'docx', 'doc', 'txt', 'html', 'md'].includes(ext)) {
      return ['pdf', 'docx', 'txt', 'html', 'md', 'png', 'jpg'];
    }
    if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext)) {
      return ['mp3', 'wav', 'ogg', 'flac', 'aac'];
    }
    if (['mp4', 'webm', 'mkv', 'avi'].includes(ext)) {
      return ['mp4', 'webm', 'gif', 'mp3', 'wav', 'aac'];
    }
    if (['csv', 'tsv', 'xlsx'].includes(ext)) {
      return ['csv', 'tsv', 'xlsx', 'json', 'txt', 'pdf'];
    }
    if (['json'].includes(ext)) {
      return ['json', 'yaml', 'csv', 'tsv', 'xlsx', 'txt'];
    }
    if (['xml'].includes(ext)) {
      return ['json'];
    }
    if (['yaml', 'yml'].includes(ext)) {
      return ['json'];
    }
    return ['pdf', 'txt', 'json'];
  }, [formats]);

  const handleFiles = useCallback((fileList) => {
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
  }, [sfx, getAllowedTargets]);

  useEffect(() => {
    const onPaste = (event) => {
      const target = event.target;
      if (target?.isContentEditable || ['INPUT', 'TEXTAREA'].includes(target?.tagName)) return;
      const items = Array.from(event.clipboardData?.items || []);
      const images = items.filter(item => item.kind === 'file' && item.type.startsWith('image/'))
        .map((item, index) => {
          const source = item.getAsFile();
          if (!source) return null;
          const extension = source.type.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
          return new File([source], `clipboard-image-${Date.now()}-${index}.${extension}`, { type: source.type });
        }).filter(Boolean);
      if (images.length) {
        event.preventDefault();
        handleFiles(images);
        return;
      }
      const textItem = items.find(item => item.kind === 'string' && ['text/plain', 'application/json'].includes(item.type));
      if (!textItem) return;
      event.preventDefault();
      textItem.getAsString(value => {
        if (!value.trim() || value.length > 5_000_000) return;
        let extension = 'txt';
        let mime = 'text/plain';
        try { JSON.parse(value); extension = 'json'; mime = 'application/json'; } catch { /* Keep ordinary clipboard text as TXT. */ }
        handleFiles([new File([value], `clipboard-${Date.now()}.${extension}`, { type: mime })]);
      });
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [handleFiles]);

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

  // Convert queued items with visible per-file status, then package successful results.
  const handleBatchZipDownload = async () => {
    if (queue.length === 0 || isBatchZipLoading) return;
    const targetFormat = queue[0].targetFormat;
    if (queue.some(item => !item.allowedTargets.includes(targetFormat))) return;
    const items = [...queue];
    setIsBatchZipLoading(true);
    setBatchZipProgress({ completed: 0, total: items.length });
    playSound('click', sfx);
    try {
      const { default: JSZip } = await import('jszip');
      const archive = new JSZip();
      const usedNames = new Set();
      let completed = 0;
      for (const item of items) {
        let converted = item.status === 'done' && item.resultBlob
          ? { blob: item.resultBlob, filename: item.resultFilename }
          : null;
        if (!converted) {
          setQueue(prev => prev.map(current => current.id === item.id ? { ...current, status: 'converting', error: null } : current));
          try {
            converted = await convertSingleFile(item.file, targetFormat, item.options);
            setQueue(prev => prev.map(current => current.id === item.id ? { ...current, status: 'done', resultBlob: converted.blob, resultFilename: converted.filename } : current));
          } catch (error) {
            setQueue(prev => prev.map(current => current.id === item.id ? { ...current, status: 'error', error: error.message } : current));
            completed += 1;
            setBatchZipProgress({ completed, total: items.length });
            continue;
          }
        }
        const originalName = converted.filename || `${item.name.replace(/\.[^/.]+$/, '')}_converted.${targetFormat}`;
        let filename = originalName;
        let version = 2;
        while (usedNames.has(filename)) {
          const dot = originalName.lastIndexOf('.');
          filename = `${originalName.slice(0, dot)} (${version++})${originalName.slice(dot)}`;
        }
        usedNames.add(filename);
        archive.file(filename, converted.blob);
        completed += 1;
        setBatchZipProgress({ completed, total: items.length });
      }
      if (!usedNames.size) throw new Error('None of the queued files converted successfully.');
      const blob = await archive.generateAsync({ type: 'blob' });
      const filename = `OmniConverter_Batch_${targetFormat.toUpperCase()}.zip`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      playSound('success', sfx);
      if (refreshStats) refreshStats();
    } catch (err) {
      alert(translateUiCopy(`Batch ZIP failed: ${err.message}`, lang));
      playSound('error', sfx);
    } finally {
      setIsBatchZipLoading(false);
      window.setTimeout(() => setBatchZipProgress(null), 2500);
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
  const finishedCount = queue.filter(i => ['done', 'error'].includes(i.status)).length;
  const progressPercent = queue.length ? Math.round((finishedCount / queue.length) * 100) : 0;
  const zipTarget = queue[0]?.targetFormat;
  const zipAvailable = queue.length > 1 && queue.every(item => item.targetFormat === zipTarget && item.allowedTargets.includes(zipTarget));
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
          {t('dropzoneSub', lang) || 'Drop files, browse, or press Ctrl+V to add clipboard images and text.'}
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
          {['PDF & Documents', 'PNG, JPG & Images', 'MP4 & Videos', 'MP3 & Audio', 'CSV, XLSX & Data'].map((fmt) => (
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
            {isConverting && <span className="badge badge-brand">{finishedCount}/{queue.length} processed</span>}
          </div>

          {(isConverting || isBatchZipLoading) && (
            <div style={{ flex: '1 1 100%', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <progress aria-label="Conversion progress" max="100" value={isBatchZipLoading && batchZipProgress ? Math.round(batchZipProgress.completed / batchZipProgress.total * 100) : progressPercent} style={{ width: '100%', height: '0.45rem', accentColor: 'var(--brand-500)' }} />
              <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {isBatchZipLoading && batchZipProgress ? `${batchZipProgress.completed}/${batchZipProgress.total}` : `${progressPercent}%`}
              </span>
            </div>
          )}

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
                  disabled={isConverting || isBatchZipLoading}
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
                    { value: 'pptx', label: 'PPTX' },
                    { value: 'csv', label: 'CSV' },
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
                disabled={isBatchZipLoading || isConverting}
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
                disabled={isBatchZipLoading || isConverting}
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
            {zipAvailable && (
              <button
                type="button"
                onClick={handleBatchZipDownload}
                disabled={isBatchZipLoading || isConverting}
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                title="Convert queued items in order and package successful outputs into one ZIP"
              >
                {isBatchZipLoading ? (
                  <Loader2 size={13} className="spin-slow" />
                ) : (
                  <Archive size={13} />
                )}
                <span>Download All as .ZIP</span>
              </button>
            )}

            {/* Primary Convert All Button */}
            <button
              type="button"
              onClick={processAllQueue}
              disabled={queue.length === 0 || isConverting || isBatchZipLoading || readyCount === 0}
              className="btn-primary"
              style={{
                fontSize: '0.8rem',
                padding: '0.45rem 1.15rem',
                opacity: (queue.length === 0 || isConverting || isBatchZipLoading || readyCount === 0) ? 0.6 : 1,
                cursor: (queue.length === 0 || isConverting || isBatchZipLoading || readyCount === 0) ? 'not-allowed' : 'pointer'
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
                    {item.status === 'done' && item.resultBlob && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }} className="font-mono">
                        {formatBytes(item.file.size)} → {formatBytes(item.resultBlob.size)}
                        {item.file.size > 0 && item.resultBlob.size !== item.file.size && (
                          <span style={{ color: item.resultBlob.size < item.file.size ? 'var(--emerald-500, #10b981)' : 'var(--amber-500, #f59e0b)', marginLeft: '0.35rem' }}>
                            {item.resultBlob.size < item.file.size
                              ? `Saved ${Math.round((1 - item.resultBlob.size / item.file.size) * 100)}%`
                              : `Increased ${Math.round((item.resultBlob.size / item.file.size - 1) * 100)}%`}
                          </span>
                        )}
                      </div>
                    )}
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
                    disabled={item.status === 'converting' || item.status === 'done' || isBatchZipLoading}
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
                    disabled={item.status === 'converting' || isBatchZipLoading}
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
                      disabled={isConverting || isBatchZipLoading}
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
                        onClick={() => setPreviewItemId(current => current === item.id ? null : item.id)}
                        className="btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.55rem' }}
                        title="Preview converted result"
                        aria-expanded={previewItemId === item.id}
                      >
                        <Eye size={13} />
                        <span>{previewItemId === item.id ? 'Hide' : 'Preview'}</span>
                      </button>
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
                        disabled={isBatchZipLoading || isConverting}
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
                    disabled={isBatchZipLoading || isConverting}
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
                {previewItemId === item.id && item.resultBlob && (
                  <div style={{ flex: '1 1 100%', minWidth: 0 }}>
                    <ResultPreview item={item} onClose={() => setPreviewItemId(null)} />
                  </div>
                )}
                {item.status === 'error' && item.error && (
                  <p role="alert" style={{ flex: '1 1 100%', margin: 0, fontSize: '0.74rem', color: 'var(--rose-500, #f43f5e)', overflowWrap: 'anywhere' }}>
                    {item.error}
                  </p>
                )}
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
                  placeholder="e.g. pdf, png, json"
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
