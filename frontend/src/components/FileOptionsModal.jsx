import React, { useState, useEffect } from 'react';
import { X, Sliders, Check, RotateCcw } from 'lucide-react';
import { playSound } from '../utils/audio';
import CustomSelect from './CustomSelect';

const DEFAULT_OPTIONS = {
  quality: 90,
  video_quality: 'Original',
  audio_bitrate: '320k',
  strip_audio: false,
  resize_width: '',
  resize_height: ''
};

export default function FileOptionsModal({ isOpen, onClose, item, onSaveOptions, sfx }) {
  const [options, setOptions] = useState(DEFAULT_OPTIONS);

  const [prevItem, setPrevItem] = useState(item);

  // Sync state whenever the selected item changes
  if (item !== prevItem) {
    setPrevItem(item);
    if (item && item.options) {
      setOptions({
        ...DEFAULT_OPTIONS,
        ...item.options
      });
    } else {
      setOptions(DEFAULT_OPTIONS);
    }
  }

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const handleSave = () => {
    onSaveOptions(item.id, options);
    playSound('click', sfx);
    onClose();
  };

  const handleReset = () => {
    setOptions(DEFAULT_OPTIONS);
    playSound('click', sfx);
  };

  const ext = item.name.split('.').pop().toLowerCase();
  const targetExt = (item.targetFormat || '').toLowerCase();
  const isImage = ['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(ext) || ['png', 'jpg', 'jpeg', 'webp'].includes(targetExt);
  const isVideo = ['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext);
  const isAudio = ['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(targetExt) || ['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext);

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="file-options-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }} 
      onClick={onClose}
    >
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          boxShadow: 'var(--shadow-drop)',
          background: 'var(--bg-surface)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(99, 102, 241, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-500)'
            }}>
              <Sliders size={16} />
            </div>
            <div>
              <h3 id="file-options-title" style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                Conversion Options
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Target: <strong className="font-mono" style={{ color: 'var(--brand-500)' }}>{item.targetFormat.toUpperCase()}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close options"
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{
          fontSize: '0.78rem',
          color: 'var(--text-secondary)',
          background: 'var(--bg-card)',
          padding: '0.5rem 0.75rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-card)',
          wordBreak: 'break-all'
        }}>
          File: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.name}</span>
        </div>

        {/* Options Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Image Quality Slider */}
          {isImage && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                <label htmlFor="quality-slider">Compression Quality</label>
                <span className="font-mono" style={{ color: 'var(--brand-500)' }}>{options.quality || 90}%</span>
              </div>
              <input
                id="quality-slider"
                type="range"
                min="20"
                max="100"
                value={options.quality || 90}
                onChange={(e) => setOptions(prev => ({ ...prev, quality: parseInt(e.target.value, 10) }))}
                style={{ width: '100%', accentColor: 'var(--brand-500)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                <span>Smaller file</span>
                <span>Best quality</span>
              </div>
            </div>
          )}

          {/* Video Resolution */}
          {isVideo && (
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                Resolution Preset
              </label>
              <CustomSelect
                value={options.video_quality || 'Original'}
                onChange={(val) => setOptions(prev => ({ ...prev, video_quality: val }))}
                options={[
                  { value: 'Original', label: 'Original Resolution' },
                  { value: '1080p', label: '1080p Full HD' },
                  { value: '720p', label: '720p HD' },
                  { value: '480p', label: '480p SD' }
                ]}
                accentColor="var(--brand-500)"
                minWidth="100%"
                sfx={sfx}
              />
            </div>
          )}

          {/* Audio Bitrate */}
          {(isAudio || isVideo) && (
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                Audio Bitrate
              </label>
              <CustomSelect
                value={options.audio_bitrate || '320k'}
                onChange={(val) => setOptions(prev => ({ ...prev, audio_bitrate: val }))}
                options={[
                  { value: '320k', label: '320 kbps (High Fidelity)' },
                  { value: '256k', label: '256 kbps (High Quality)' },
                  { value: '192k', label: '192 kbps (Standard)' },
                  { value: '128k', label: '128 kbps (Compact)' }
                ]}
                accentColor="var(--brand-500)"
                minWidth="100%"
                sfx={sfx}
              />
            </div>
          )}

          {/* Strip Audio */}
          {isVideo && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.78rem', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={options.strip_audio || false}
                onChange={(e) => setOptions(prev => ({ ...prev, strip_audio: e.target.checked }))}
                style={{ accentColor: 'var(--brand-500)' }}
              />
              <span>Remove audio track (Mute)</span>
            </label>
          )}

          {/* Image Resizing */}
          {isImage && (
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                Custom Dimensions (Optional)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input
                  type="number"
                  placeholder="Width (px)"
                  value={options.resize_width || ''}
                  onChange={(e) => setOptions(prev => ({ ...prev, resize_width: e.target.value }))}
                  style={{
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.78rem',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
                <input
                  type="number"
                  placeholder="Height (px)"
                  value={options.resize_height || ''}
                  onChange={(e) => setOptions(prev => ({ ...prev, resize_height: e.target.value }))}
                  style={{
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.78rem',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </div>
            </div>
          )}

          {!isImage && !isVideo && !isAudio && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
              Standard conversion mode. No specialized encoding options required for this format.
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border-card)',
          paddingTop: '1rem',
          marginTop: '0.25rem'
        }}>
          <button
            type="button"
            onClick={handleReset}
            className="btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.45rem 0.75rem' }}
            title="Reset options to default"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.45rem 0.9rem' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn-primary"
              style={{ fontSize: '0.78rem', padding: '0.45rem 1.1rem' }}
            >
              <Check size={14} />
              <span>Apply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
