import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Download, 
  FileCode, 
  Check, 
  ScanText
} from 'lucide-react';
import { playSound } from '../utils/audio';

export default function OcrModal({ isOpen, onClose, data, filename, sfx }) {
  const [selectedPage, setSelectedPage] = useState('all');
  const [copied, setCopied] = useState(false);
  const [text, setText] = useState('');

  const [prevData, setPrevData] = useState(data);

  if (data !== prevData) {
    setPrevData(data);
    if (data) {
      setText(data.text || '');
      setSelectedPage('all');
    }
  }

  // Handle escape to close
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

  if (!isOpen || !data) return null;

  const pages = data.pages || [];
  const confidencePercent = Math.round((data.confidence || 0.95) * 100);

  const handlePageSelect = (pageIdx) => {
    setSelectedPage(pageIdx);
    if (pageIdx === 'all') {
      setText(data.text || '');
    } else {
      setText(pages[pageIdx]?.text || '');
    }
    playSound('click', sfx);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    playSound('click', sfx);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (ext) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename ? filename.replace(/\.[^/.]+$/, "") : 'OCR_Document'}_extracted.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    playSound('success', sfx);
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="ocr-modal-title"
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
          maxWidth: '820px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-drop)',
          background: 'var(--bg-surface)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--brand-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ScanText size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 id="ocr-modal-title" style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                  OCR Document Text Inspector
                </h3>
                <span className="badge badge-emerald font-mono" style={{ fontSize: '0.65rem' }}>
                  {confidencePercent}% Accuracy
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }} className="font-mono">
                {filename || 'Document'} • {data.total_pages || 1} {data.total_pages === 1 ? 'page' : 'pages'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close OCR inspector"
            className="btn-secondary"
            style={{
              padding: '0.35rem',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Page Selector & Metadata Bar */}
        <div style={{
          padding: '0.5rem 1.25rem',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          fontSize: '0.75rem'
        }}>
          {/* Page Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', overflowX: 'auto' }}>
            <span style={{ color: 'var(--text-muted)', marginRight: '0.25rem' }}>Page:</span>
            <button
              type="button"
              onClick={() => handlePageSelect('all')}
              className="btn-secondary"
              style={{
                padding: '0.2rem 0.55rem',
                fontSize: '0.7rem',
                background: selectedPage === 'all' ? 'var(--brand-600)' : 'transparent',
                color: selectedPage === 'all' ? '#ffffff' : 'var(--text-secondary)',
                borderColor: selectedPage === 'all' ? 'var(--brand-600)' : 'var(--border-card)'
              }}
            >
              All Content
            </button>
            {pages.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePageSelect(idx)}
                className="btn-secondary"
                style={{
                  padding: '0.2rem 0.55rem',
                  fontSize: '0.7rem',
                  background: selectedPage === idx ? 'var(--brand-600)' : 'transparent',
                  color: selectedPage === idx ? '#ffffff' : 'var(--text-secondary)',
                  borderColor: selectedPage === idx ? 'var(--brand-600)' : 'var(--border-card)'
                }}
              >
                Page {p.page_number}
              </button>
            ))}
          </div>

          {/* Counts */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--text-muted)' }} className="font-mono">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{charCount} chars</span>
            {data.elapsed && (
              <>
                <span>•</span>
                <span>{data.elapsed}s</span>
              </>
            )}
          </div>
        </div>

        {/* Text Area Body */}
        <div style={{ padding: '1rem 1.25rem', flex: '1 1 auto', overflowY: 'auto' }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Extracted OCR text"
            style={{
              width: '100%',
              height: '320px',
              padding: '0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-card)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              lineHeight: 1.6,
              resize: 'none',
              outline: 'none'
            }}
          />
        </div>

        {/* Modal Footer Actions */}
        <div style={{
          padding: '0.85rem 1.25rem',
          borderTop: '1px solid var(--border-card)',
          background: 'var(--bg-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <button
              type="button"
              onClick={copyToClipboard}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
            >
              {copied ? <Check size={13} style={{ color: 'var(--emerald-500)' }} /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={() => downloadFile('txt')}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
            >
              <Download size={13} />
              <span>Download .txt</span>
            </button>

            <button
              type="button"
              onClick={() => downloadFile('md')}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
            >
              <FileCode size={13} />
              <span>Download .md</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-primary"
            style={{ fontSize: '0.78rem', padding: '0.4rem 1.15rem' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
