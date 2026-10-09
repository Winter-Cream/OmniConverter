import React, { useState, useRef } from 'react';
import { 
  FilePlus2, 
  Scissors, 
  FileArchive, 
  Lock, 
  Unlock, 
  RotateCw, 
  ScanText, 
  Upload, 
  Loader2, 
  AlertCircle
} from 'lucide-react';
import { 
  mergePdfs, 
  splitPdf, 
  compressPdf, 
  protectPdf, 
  unlockPdf, 
  rotatePdf, 
  runOcrDocument 
} from '../services/api';
import { playSound } from '../utils/audio';
import CustomSelect from './CustomSelect';

export default function PdfSuiteTab({ lang: _lang, sfx, onOpenOcrModal, refreshStats, triggerCelebration }) {
  // Active tool filter category
  const [activeCategory, setActiveCategory] = useState('all');

  // Error/Message state per tool
  const [toolMessages, setToolMessages] = useState({});

  const setMsg = (tool, error, message) => {
    setToolMessages(prev => ({ ...prev, [tool]: { error, message } }));
  };

  // Merge State
  const [mergeFiles, setMergeFiles] = useState([]);
  const [mergeLoading, setMergeLoading] = useState(false);
  const mergeInputRef = useRef(null);

  // Split State
  const [splitFile, setSplitFile] = useState(null);
  const [splitRange, setSplitRange] = useState('1-2');
  const [splitMode, setSplitMode] = useState('single_pdf');
  const [splitLoading, setSplitLoading] = useState(false);
  const splitInputRef = useRef(null);

  // Compress State
  const [compressFile, setCompressFile] = useState(null);
  const [compressLevel, setCompressLevel] = useState('medium');
  const [compressLoading, setCompressLoading] = useState(false);
  const compressInputRef = useRef(null);

  // Protect State
  const [protectFile, setProtectFile] = useState(null);
  const [protectPass, setProtectPass] = useState('');
  const [protectLoading, setProtectLoading] = useState(false);
  const protectInputRef = useRef(null);

  // Unlock State
  const [unlockFile, setUnlockFile] = useState(null);
  const [unlockPass, setUnlockPass] = useState('');
  const [unlockLoading, setUnlockLoading] = useState(false);
  const unlockInputRef = useRef(null);

  // Rotate State
  const [rotateFile, setRotateFile] = useState(null);
  const [rotateAngle, setRotateAngle] = useState(90);
  const [rotateRange, setRotateRange] = useState('all');
  const [rotateLoading, setRotateLoading] = useState(false);
  const rotateInputRef = useRef(null);

  // OCR State
  const [ocrFile, setOcrFile] = useState(null);
  const [ocrRange, setOcrRange] = useState('all');
  const [ocrForce, setOcrForce] = useState(false);
  const [ocrOutputMode, setOcrOutputMode] = useState('studio');
  const [ocrLoading, setOcrLoading] = useState(false);
  const ocrInputRef = useRef(null);

  const downloadBlob = (blob, filename) => {
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
    if (triggerCelebration) triggerCelebration();
  };

  // Handlers
  const handleMerge = async () => {
    if (mergeFiles.length < 2) {
      setMsg('merge', true, 'Please select at least 2 PDF files to merge.');
      return;
    }
    setMsg('merge', false, '');
    setMergeLoading(true);
    playSound('click', sfx);
    try {
      const { blob, filename } = await mergePdfs(mergeFiles);
      downloadBlob(blob, filename);
      setMergeFiles([]);
      setMsg('merge', false, 'PDFs merged and downloaded.');
    } catch (err) {
      setMsg('merge', true, `Merge error: ${err.message}`);
      playSound('error', sfx);
    } finally {
      setMergeLoading(false);
    }
  };

  const handleSplit = async () => {
    if (!splitFile) {
      setMsg('split', true, 'Please select a PDF to extract pages from.');
      return;
    }
    setMsg('split', false, '');
    setSplitLoading(true);
    playSound('click', sfx);
    try {
      const { blob, filename } = await splitPdf(splitFile, splitRange, splitMode);
      downloadBlob(blob, filename);
      setMsg('split', false, 'Pages extracted successfully.');
    } catch (err) {
      setMsg('split', true, `Split error: ${err.message}`);
      playSound('error', sfx);
    } finally {
      setSplitLoading(false);
    }
  };

  const handleCompress = async () => {
    if (!compressFile) {
      setMsg('compress', true, 'Please select a PDF file to compress.');
      return;
    }
    setMsg('compress', false, '');
    setCompressLoading(true);
    playSound('click', sfx);
    try {
      const { blob, filename } = await compressPdf(compressFile, compressLevel);
      downloadBlob(blob, filename);
      setMsg('compress', false, 'PDF compressed and downloaded.');
    } catch (err) {
      setMsg('compress', true, `Compress error: ${err.message}`);
      playSound('error', sfx);
    } finally {
      setCompressLoading(false);
    }
  };

  const handleProtect = async () => {
    if (!protectFile || !protectPass) {
      setMsg('protect', true, 'Please select a PDF and enter an encryption password.');
      return;
    }
    setMsg('protect', false, '');
    setProtectLoading(true);
    playSound('click', sfx);
    try {
      const { blob, filename } = await protectPdf(protectFile, protectPass);
      downloadBlob(blob, filename);
      setProtectPass('');
      setMsg('protect', false, 'PDF encrypted successfully.');
    } catch (err) {
      setMsg('protect', true, `Protect error: ${err.message}`);
      playSound('error', sfx);
    } finally {
      setProtectLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!unlockFile || !unlockPass) {
      setMsg('unlock', true, 'Please select a protected PDF and enter the decryption password.');
      return;
    }
    setMsg('unlock', false, '');
    setUnlockLoading(true);
    playSound('click', sfx);
    try {
      const { blob, filename } = await unlockPdf(unlockFile, unlockPass);
      downloadBlob(blob, filename);
      setUnlockPass('');
      setMsg('unlock', false, 'Password restrictions removed.');
    } catch (err) {
      setMsg('unlock', true, `Unlock error: ${err.message}`);
      playSound('error', sfx);
    } finally {
      setUnlockLoading(false);
    }
  };

  const handleRotate = async () => {
    if (!rotateFile) {
      setMsg('rotate', true, 'Please select a PDF file to rotate.');
      return;
    }
    setMsg('rotate', false, '');
    setRotateLoading(true);
    playSound('click', sfx);
    try {
      const { blob, filename } = await rotatePdf(rotateFile, rotateAngle, rotateRange);
      downloadBlob(blob, filename);
      setMsg('rotate', false, 'PDF rotated and downloaded.');
    } catch (err) {
      setMsg('rotate', true, `Rotate error: ${err.message}`);
      playSound('error', sfx);
    } finally {
      setRotateLoading(false);
    }
  };

  const handleOcr = async () => {
    if (!ocrFile) {
      setMsg('ocr', true, 'Please select a scanned PDF or image.');
      return;
    }
    setMsg('ocr', false, '');
    setOcrLoading(true);
    playSound('click', sfx);
    try {
      if (ocrOutputMode === 'txt_download') {
        const { blob, filename } = await runOcrDocument(ocrFile, ocrRange, ocrForce, 'txt_download');
        downloadBlob(blob, filename);
        setMsg('ocr', false, 'Text extracted as .txt document.');
      } else {
        const result = await runOcrDocument(ocrFile, ocrRange, ocrForce, 'json');
        playSound('success', sfx);
        if (refreshStats) refreshStats();
        onOpenOcrModal(result, ocrFile.name);
      }
    } catch (err) {
      setMsg('ocr', true, `OCR error: ${err.message}`);
      playSound('error', sfx);
    } finally {
      setOcrLoading(false);
    }
  };

  const shouldShow = (category) => {
    if (activeCategory === 'all') return true;
    return activeCategory === category;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Category Filter Pills */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        padding: '0.4rem',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
          {[
            { id: 'all', label: 'All Tools' },
            { id: 'combine', label: 'Merge & Split' },
            { id: 'security', label: 'Security & Compression' },
            { id: 'pages', label: 'Rotate' },
            { id: 'ocr', label: 'Neural OCR' }
          ].map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className="btn-secondary"
              style={{
                fontSize: '0.75rem',
                padding: '0.35rem 0.75rem',
                background: activeCategory === cat.id ? 'var(--bg-subtle)' : 'transparent',
                borderColor: activeCategory === cat.id ? 'var(--brand-500)' : 'transparent',
                color: activeCategory === cat.id ? 'var(--text-primary)' : 'var(--text-secondary)'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', paddingRight: '0.5rem' }}>
          7 Pro PDF Utilities
        </span>
      </div>

      {/* Grid of PDF Tool Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.25rem'
      }}>
        
        {/* 1. Merge PDFs */}
        {shouldShow('combine') && (
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
                <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--brand-500)' }}>
                  <FilePlus2 size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Merge Multiple PDFs</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Combine 2 or more PDF documents into a single file.
                  </p>
                </div>
              </div>

              <div 
                onClick={() => mergeInputRef.current.click()}
                style={{
                  border: '1.5px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.25rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'var(--bg-input)',
                  transition: 'border-color 0.15s ease'
                }}
              >
                <input 
                  type="file" 
                  ref={mergeInputRef} 
                  accept=".pdf" 
                  multiple 
                  style={{ display: 'none' }} 
                  onChange={(e) => {
                    if (e.target.files) {
                      setMergeFiles(Array.from(e.target.files));
                      setMsg('merge', false, '');
                    }
                  }}
                />
                <Upload size={20} style={{ color: 'var(--brand-500)', margin: '0 auto 0.4rem' }} />
                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  {mergeFiles.length > 0 ? `${mergeFiles.length} PDFs selected` : 'Select PDF files to merge'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Click to browse files</div>
                {mergeFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setMergeFiles([]); }}
                    style={{ border: 'none', background: 'transparent', color: 'var(--rose-500)', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.35rem' }}
                  >
                    Clear selection
                  </button>
                )}
              </div>

              {toolMessages.merge && toolMessages.merge.message && (
                <div style={{ 
                  fontSize: '0.75rem', 
                  marginTop: '0.5rem', 
                  color: toolMessages.merge.error ? 'var(--rose-500)' : 'var(--emerald-500)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  {toolMessages.merge.error && <AlertCircle size={13} />}
                  <span>{toolMessages.merge.message}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleMerge}
              disabled={mergeLoading || mergeFiles.length < 2}
              className="btn-primary"
              style={{ width: '100%', fontSize: '0.8rem' }}
            >
              {mergeLoading ? <Loader2 size={14} className="spin-slow" /> : 'Merge PDFs'}
            </button>
          </div>
        )}

        {/* 2. Split PDF */}
        {shouldShow('combine') && (
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
                <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--amber-500)' }}>
                  <Scissors size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Split & Extract Pages</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Extract specific page ranges into a single PDF or ZIP archive.
                  </p>
                </div>
              </div>

              <div 
                onClick={() => splitInputRef.current.click()}
                style={{
                  border: '1.5px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.25rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'var(--bg-input)',
                  marginBottom: '0.75rem'
                }}
              >
                <input 
                  type="file" 
                  ref={splitInputRef} 
                  accept=".pdf" 
                  style={{ display: 'none' }} 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSplitFile(e.target.files[0]);
                      setMsg('split', false, '');
                    }
                  }}
                />
                <Scissors size={20} style={{ color: 'var(--amber-500)', margin: '0 auto 0.4rem' }} />
                <div style={{ fontSize: '0.8rem', fontWeight: 600, wordBreak: 'break-all' }}>
                  {splitFile ? splitFile.name : 'Choose PDF document'}
                </div>
                {splitFile && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSplitFile(null); }}
                    style={{ border: 'none', background: 'transparent', color: 'var(--rose-500)', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.35rem' }}
                  >
                    Remove file
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Range (e.g. 1-3, odd)"
                  value={splitRange}
                  onChange={(e) => setSplitRange(e.target.value)}
                  style={{
                    padding: '0.45rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
                <CustomSelect
                  value={splitMode}
                  onChange={setSplitMode}
                  options={[
                    { value: 'single_pdf', label: 'Single PDF' },
                    { value: 'zip', label: 'ZIP Archive' }
                  ]}
                  accentColor="var(--amber-500)"
                  minWidth="100%"
                  sfx={sfx}
                />
              </div>

              {toolMessages.split && toolMessages.split.message && (
                <div style={{ 
                  fontSize: '0.75rem', 
                  marginTop: '0.5rem', 
                  color: toolMessages.split.error ? 'var(--rose-500)' : 'var(--emerald-500)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  {toolMessages.split.error && <AlertCircle size={13} />}
                  <span>{toolMessages.split.message}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSplit}
              disabled={splitLoading || !splitFile}
              className="btn-primary"
              style={{ width: '100%', fontSize: '0.8rem' }}
            >
              {splitLoading ? <Loader2 size={14} className="spin-slow" /> : 'Split PDF'}
            </button>
          </div>
        )}

        {/* 3. Compress PDF */}
        {shouldShow('security') && (
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
                <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--emerald-500)' }}>
                  <FileArchive size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Compress PDF Size</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Optimize embedded assets to shrink file weight.
                  </p>
                </div>
              </div>

              <div 
                onClick={() => compressInputRef.current.click()}
                style={{
                  border: '1.5px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.25rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'var(--bg-input)',
                  marginBottom: '0.75rem'
                }}
              >
                <input 
                  type="file" 
                  ref={compressInputRef} 
                  accept=".pdf" 
                  style={{ display: 'none' }} 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setCompressFile(e.target.files[0]);
                      setMsg('compress', false, '');
                    }
                  }}
                />
                <FileArchive size={20} style={{ color: 'var(--emerald-500)', margin: '0 auto 0.4rem' }} />
                <div style={{ fontSize: '0.8rem', fontWeight: 600, wordBreak: 'break-all' }}>
                  {compressFile ? compressFile.name : 'Select PDF to compress'}
                </div>
                {compressFile && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setCompressFile(null); }}
                    style={{ border: 'none', background: 'transparent', color: 'var(--rose-500)', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.35rem' }}
                  >
                    Remove file
                  </button>
                )}
              </div>

              <CustomSelect
                value={compressLevel}
                onChange={setCompressLevel}
                options={[
                  { value: 'low', label: 'Low Compression (High Quality)' },
                  { value: 'medium', label: 'Medium Compression (Balanced)' },
                  { value: 'high', label: 'High Compression (Smallest Size)' }
                ]}
                accentColor="var(--emerald-500)"
                minWidth="100%"
                sfx={sfx}
              />

              {toolMessages.compress && toolMessages.compress.message && (
                <div style={{ 
                  fontSize: '0.75rem', 
                  marginTop: '0.5rem', 
                  color: toolMessages.compress.error ? 'var(--rose-500)' : 'var(--emerald-500)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  {toolMessages.compress.error && <AlertCircle size={13} />}
                  <span>{toolMessages.compress.message}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleCompress}
              disabled={compressLoading || !compressFile}
              className="btn-primary"
              style={{ width: '100%', fontSize: '0.8rem' }}
            >
              {compressLoading ? <Loader2 size={14} className="spin-slow" /> : 'Compress PDF'}
            </button>
          </div>
        )}

        {/* 4. Encrypt PDF */}
        {shouldShow('security') && (
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
                <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(2, 132, 199, 0.1)', color: 'var(--cyan-500)' }}>
                  <Lock size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Encrypt PDF Document</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Add password protection with AES encryption.
                  </p>
                </div>
              </div>

              <div 
                onClick={() => protectInputRef.current.click()}
                style={{
                  border: '1.5px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.25rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'var(--bg-input)',
                  marginBottom: '0.75rem'
                }}
              >
                <input 
                  type="file" 
                  ref={protectInputRef} 
                  accept=".pdf" 
                  style={{ display: 'none' }} 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setProtectFile(e.target.files[0]);
                      setMsg('protect', false, '');
                    }
                  }}
                />
                <Lock size={20} style={{ color: 'var(--cyan-500)', margin: '0 auto 0.4rem' }} />
                <div style={{ fontSize: '0.8rem', fontWeight: 600, wordBreak: 'break-all' }}>
                  {protectFile ? protectFile.name : 'Select PDF to encrypt'}
                </div>
                {protectFile && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setProtectFile(null); }}
                    style={{ border: 'none', background: 'transparent', color: 'var(--rose-500)', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.35rem' }}
                  >
                    Remove file
                  </button>
                )}
              </div>

              <input
                type="password"
                placeholder="Enter password..."
                value={protectPass}
                onChange={(e) => setProtectPass(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-primary)',
                  fontSize: '0.78rem'
                }}
              />

              {toolMessages.protect && toolMessages.protect.message && (
                <div style={{ 
                  fontSize: '0.75rem', 
                  marginTop: '0.5rem', 
                  color: toolMessages.protect.error ? 'var(--rose-500)' : 'var(--emerald-500)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  {toolMessages.protect.error && <AlertCircle size={13} />}
                  <span>{toolMessages.protect.message}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleProtect}
              disabled={protectLoading || !protectFile || !protectPass}
              className="btn-primary"
              style={{ width: '100%', fontSize: '0.8rem' }}
            >
              {protectLoading ? <Loader2 size={14} className="spin-slow" /> : 'Encrypt PDF'}
            </button>
          </div>
        )}

        {/* 5. Decrypt PDF */}
        {shouldShow('security') && (
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
                <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--rose-500)' }}>
                  <Unlock size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Unlock Protected PDF</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Remove password security from document.
                  </p>
                </div>
              </div>

              <div 
                onClick={() => unlockInputRef.current.click()}
                style={{
                  border: '1.5px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.25rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'var(--bg-input)',
                  marginBottom: '0.75rem'
                }}
              >
                <input 
                  type="file" 
                  ref={unlockInputRef} 
                  accept=".pdf" 
                  style={{ display: 'none' }} 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUnlockFile(e.target.files[0]);
                      setMsg('unlock', false, '');
                    }
                  }}
                />
                <Unlock size={20} style={{ color: 'var(--rose-500)', margin: '0 auto 0.4rem' }} />
                <div style={{ fontSize: '0.8rem', fontWeight: 600, wordBreak: 'break-all' }}>
                  {unlockFile ? unlockFile.name : 'Select locked PDF'}
                </div>
                {unlockFile && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setUnlockFile(null); }}
                    style={{ border: 'none', background: 'transparent', color: 'var(--rose-500)', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.35rem' }}
                  >
                    Remove file
                  </button>
                )}
              </div>

              <input
                type="password"
                placeholder="Current password..."
                value={unlockPass}
                onChange={(e) => setUnlockPass(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-primary)',
                  fontSize: '0.78rem'
                }}
              />

              {toolMessages.unlock && toolMessages.unlock.message && (
                <div style={{ 
                  fontSize: '0.75rem', 
                  marginTop: '0.5rem', 
                  color: toolMessages.unlock.error ? 'var(--rose-500)' : 'var(--emerald-500)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  {toolMessages.unlock.error && <AlertCircle size={13} />}
                  <span>{toolMessages.unlock.message}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleUnlock}
              disabled={unlockLoading || !unlockFile || !unlockPass}
              className="btn-primary"
              style={{ width: '100%', fontSize: '0.8rem' }}
            >
              {unlockLoading ? <Loader2 size={14} className="spin-slow" /> : 'Unlock PDF'}
            </button>
          </div>
        )}

        {/* 6. Rotate PDF */}
        {shouldShow('pages') && (
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
                <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--brand-500)' }}>
                  <RotateCw size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Rotate PDF Pages</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Reorient pages clockwise or counter-clockwise.
                  </p>
                </div>
              </div>

              <div 
                onClick={() => rotateInputRef.current.click()}
                style={{
                  border: '1.5px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.25rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'var(--bg-input)',
                  marginBottom: '0.75rem'
                }}
              >
                <input 
                  type="file" 
                  ref={rotateInputRef} 
                  accept=".pdf" 
                  style={{ display: 'none' }} 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setRotateFile(e.target.files[0]);
                      setMsg('rotate', false, '');
                    }
                  }}
                />
                <RotateCw size={20} style={{ color: 'var(--brand-500)', margin: '0 auto 0.4rem' }} />
                <div style={{ fontSize: '0.8rem', fontWeight: 600, wordBreak: 'break-all' }}>
                  {rotateFile ? rotateFile.name : 'Select PDF to rotate'}
                </div>
                {rotateFile && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setRotateFile(null); }}
                    style={{ border: 'none', background: 'transparent', color: 'var(--rose-500)', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.35rem' }}
                  >
                    Remove file
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <CustomSelect
                  value={rotateAngle}
                  onChange={(val) => setRotateAngle(parseInt(val, 10))}
                  options={[
                    { value: 90, label: '90° Clockwise' },
                    { value: 180, label: '180° Flip' },
                    { value: 270, label: '270° Counter-CW' }
                  ]}
                  accentColor="var(--brand-500)"
                  minWidth="100%"
                  sfx={sfx}
                />
                <input
                  type="text"
                  placeholder="Range (all, 1-3)"
                  value={rotateRange}
                  onChange={(e) => setRotateRange(e.target.value)}
                  style={{
                    padding: '0.45rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </div>

              {toolMessages.rotate && toolMessages.rotate.message && (
                <div style={{ 
                  fontSize: '0.75rem', 
                  marginTop: '0.5rem', 
                  color: toolMessages.rotate.error ? 'var(--rose-500)' : 'var(--emerald-500)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  {toolMessages.rotate.error && <AlertCircle size={13} />}
                  <span>{toolMessages.rotate.message}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleRotate}
              disabled={rotateLoading || !rotateFile}
              className="btn-primary"
              style={{ width: '100%', fontSize: '0.8rem' }}
            >
              {rotateLoading ? <Loader2 size={14} className="spin-slow" /> : 'Rotate PDF'}
            </button>
          </div>
        )}

      </div>

      {/* 7. OCR & TEXT EXTRACTOR STUDIO */}
      {shouldShow('ocr') && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            borderBottom: '1px solid var(--border-card)',
            paddingBottom: '1rem',
            marginBottom: '1.25rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--brand-500)' }}>
                  <ScanText size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                    Optical Character Recognition (OCR) Studio
                  </h3>
                  <span className="badge badge-brand font-mono" style={{ fontSize: '0.65rem', marginTop: '0.2rem' }}>
                    ON-DEVICE RAPIDOCR ENGINE
                  </span>
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '560px' }}>
              Extract machine-readable text from scanned PDFs, flattened invoices, receipts, and images (PNG, JPG, TIFF, WEBP).
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', alignItems: 'center' }}>
            {/* Dropzone for OCR */}
            <div 
              onClick={() => ocrInputRef.current.click()}
              style={{
                border: '1.5px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'var(--bg-input)'
              }}
            >
              <input 
                type="file" 
                ref={ocrInputRef} 
                accept=".pdf,.png,.jpg,.jpeg,.webp,.bmp,.tiff" 
                style={{ display: 'none' }} 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setOcrFile(e.target.files[0]);
                    setMsg('ocr', false, '');
                  }
                }}
              />
              <ScanText size={24} style={{ color: 'var(--brand-500)', margin: '0 auto 0.5rem' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 600, wordBreak: 'break-all' }}>
                {ocrFile ? ocrFile.name : 'Choose Scanned PDF or Image'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Click to select document or photo</div>
              {ocrFile && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setOcrFile(null); }}
                  style={{ border: 'none', background: 'transparent', color: 'var(--rose-500)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.35rem' }}
                >
                  Remove file
                </button>
              )}
            </div>

            {/* Options & Action */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                    Page Range
                  </label>
                  <input
                    type="text"
                    placeholder="all, 1-3, 5"
                    value={ocrRange}
                    onChange={(e) => setOcrRange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.45rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                    Output Mode
                  </label>
                  <CustomSelect
                    value={ocrOutputMode}
                    onChange={setOcrOutputMode}
                    options={[
                      { value: 'studio', label: 'Open in OCR Studio' },
                      { value: 'txt_download', label: 'Download as .TXT' }
                    ]}
                    accentColor="var(--brand-500)"
                    minWidth="100%"
                    sfx={sfx}
                  />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={ocrForce}
                  onChange={(e) => setOcrForce(e.target.checked)}
                  style={{ accentColor: 'var(--brand-500)' }}
                />
                <span>Force Optical OCR Scan (even if digital text exists)</span>
              </label>

              {toolMessages.ocr && toolMessages.ocr.message && (
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: toolMessages.ocr.error ? 'var(--rose-500)' : 'var(--emerald-500)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  {toolMessages.ocr.error && <AlertCircle size={13} />}
                  <span>{toolMessages.ocr.message}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleOcr}
                disabled={ocrLoading || !ocrFile}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  fontSize: '0.82rem'
                }}
              >
                {ocrLoading ? (
                  <>
                    <Loader2 size={15} className="spin-slow" />
                    <span>Scanning & Extracting Text...</span>
                  </>
                ) : (
                  <>
                    <ScanText size={15} />
                    <span>Extract Text (OCR)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
