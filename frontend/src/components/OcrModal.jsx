import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Download, 
  FileCode, 
  Check, 
  ScanText, 
  Clock, 
  Type 
} from 'lucide-react';
import { playSound } from '../utils/audio';

export default function OcrModal({ isOpen, onClose, data, filename, sfx }) {
  if (!isOpen || !data) return null;

  const [selectedPage, setSelectedPage] = useState('all');
  const [copied, setCopied] = useState(false);
  const [text, setText] = useState(data.text || '');

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
    a.download = `${filename || 'OCR_Document'}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    playSound('success', sfx);
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

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
          maxWidth: '850px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-drop)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-glass-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ScanText size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>
                  OCR Studio & Text Inspector
                </h3>
                <span className="badge badge-emerald font-mono">
                  {confidencePercent}% Confidence
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }} className="font-mono">
                {filename || 'Document'} • {data.total_pages || 1} {data.total_pages === 1 ? 'page' : 'pages'} scanned
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'var(--bg-card)',
              color: 'var(--text-secondary)',
              borderRadius: '8px',
              width: '2rem',
              height: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Page Selector & Metadata Bar */}
        <div style={{
          padding: '0.65rem 1.5rem',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflowX: 'auto' }}>
            <span style={{ color: 'var(--text-muted)', marginRight: '0.35rem' }}>View:</span>
            <button
              onClick={() => handlePageSelect('all')}
              style={{
                padding: '0.25rem 0.65rem',
                borderRadius: '6px',
                border: 'none',
                background: selectedPage === 'all' ? 'var(--brand-500)' : 'var(--bg-glass-subtle)',
                color: selectedPage === 'all' ? 'white' : 'var(--text-secondary)',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              All Pages
            </button>
            {pages.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handlePageSelect(idx)}
                style={{
                  padding: '0.25rem 0.65rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: selectedPage === idx ? 'var(--brand-500)' : 'var(--bg-glass-subtle)',
                  color: selectedPage === idx ? 'white' : 'var(--text-secondary)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Page {p.page_number}
              </button>
            ))}
          </div>

          {/* Counts */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', color: 'var(--text-muted)' }} className="font-mono">
            <span>{wordCount} Words</span>
            <span>•</span>
            <span>{charCount} Characters</span>
            {data.elapsed && (
              <>
                <span>•</span>
                <span>{data.elapsed}s</span>
              </>
            )}
          </div>
        </div>

        {/* Text Area Body */}
        <div style={{ padding: '1.25rem 1.5rem', flex: '1 1 auto', overflowY: 'auto' }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{
              width: '100%',
              height: '350px',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-card)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              lineHeight: 1.6,
              resize: 'none',
              outline: 'none'
            }}
          />
        </div>

        {/* Modal Footer Actions */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border-card)',
          background: 'var(--bg-glass-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={copyToClipboard}
              className="btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
            >
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>

            <button
              onClick={() => downloadFile('txt')}
              className="btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
            >
              <Download size={14} />
              <span>Download .TXT</span>
            </button>

            <button
              onClick={() => downloadFile('md')}
              className="btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
            >
              <FileCode size={14} />
              <span>Download .MD</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="btn-primary"
            style={{ fontSize: '0.78rem', padding: '0.45rem 1.25rem' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
