import React, { useState } from 'react';
import { X, Sliders, Check } from 'lucide-react';
import { playSound } from '../utils/audio';
import CustomSelect from './CustomSelect';

export default function FileOptionsModal({ isOpen, onClose, item, onSaveOptions, sfx }) {
  if (!isOpen || !item) return null;

  const [options, setOptions] = useState(item.options || {
    quality: 90,
    video_quality: 'Original',
    audio_bitrate: '320k',
    strip_audio: false,
    resize_width: '',
    resize_height: ''
  });

  const handleSave = () => {
    onSaveOptions(item.id, options);
    playSound('click', sfx);
    onClose();
  };

  const ext = item.name.split('.').pop().toLowerCase();
  const isImage = ['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(ext) || ['png', 'jpg', 'jpeg', 'webp'].includes(item.targetFormat);
  const isVideo = ['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext);
  const isAudio = ['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(item.targetFormat);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      background: 'rgba(9, 13, 22, 0.75)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }} onClick={onClose}>
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          boxShadow: 'var(--shadow-drop)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Sliders size={20} color="var(--brand-500)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>
              Conversion Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          Configuring parameters for: <strong style={{ color: 'var(--text-primary)' }}>{item.name}</strong>
        </div>

        {/* Options Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Image Quality */}
          {isImage && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                <span>Image Quality</span>
                <span className="font-mono">{options.quality || 90}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={options.quality || 90}
                onChange={(e) => setOptions(prev => ({ ...prev, quality: parseInt(e.target.value) }))}
                style={{ width: '100%' }}
              />
            </div>
          )}

          {/* Video Quality */}
          {isVideo && (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                Video Resolution Preset
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
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                Audio Bitrate
              </label>
              <CustomSelect
                value={options.audio_bitrate || '320k'}
                onChange={(val) => setOptions(prev => ({ ...prev, audio_bitrate: val }))}
                options={[
                  { value: '320k', label: '320 kbps (Ultra Quality)' },
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
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={options.strip_audio || false}
                onChange={(e) => setOptions(prev => ({ ...prev, strip_audio: e.target.checked }))}
              />
              <span>Mute / Strip Audio track</span>
            </label>
          )}

          {/* Image Resizing */}
          {isImage && (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                Custom Dimensions (Optional)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input
                  type="number"
                  placeholder="Width (px)"
                  value={options.resize_width || ''}
                  onChange={(e) => setOptions(prev => ({ ...prev, resize_width: e.target.value }))}
                  style={{
                    padding: '0.45rem',
                    borderRadius: '8px',
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
                    padding: '0.45rem',
                    borderRadius: '8px',
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
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ fontSize: '0.78rem', padding: '0.45rem 1rem' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
            style={{ fontSize: '0.78rem', padding: '0.45rem 1.25rem' }}
          >
            <Check size={14} />
            <span>Apply Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
