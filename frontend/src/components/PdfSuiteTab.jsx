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
  Download, 
  Eye, 
  Check,
  X 
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

export default function PdfSuiteTab({ lang, sfx, onOpenOcrModal, refreshStats, triggerCelebration }) {
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
    refreshStats();
    if (triggerCelebration) triggerCelebration();
  };

  // Handlers
  const handleMerge = async () => {
    if (mergeFiles.length < 2) {
      alert('Please select at least 2 PDF files to merge.');
      return;
    }
    setMergeLoading(true);
    playSound('click', sfx);
    try {
      const { blob, filename } = await mergePdfs(mergeFiles);
      downloadBlob(blob, filename);
      setMergeFiles([]);
    } catch (err) {
      alert(`Merge error: ${err.message}`);
      playSound('error', sfx);
    } finally {
      setMergeLoading(false);
    }
  };

  const handleSplit = async () => {
    if (!splitFile) return;
    setSplitLoading(true);
    playSound('click', sfx);
    try {
      const { blob, filename } = await splitPdf(splitFile, splitRange, splitMode);
      downloadBlob(blob, filename);
    } catch (err) {
      alert(`Split error: ${err.message}`);
      playSound('error', sfx);
    } finally {
      setSplitLoading(false);
    }
  };

  const handleCompress = async () => {
    if (!compressFile) return;
    setCompressLoading(true);
    playSound('click', sfx);
    try {
      const { blob, filename } = await compressPdf(compressFile, compressLevel);
      downloadBlob(blob, filename);
    } catch (err) {
      alert(`Compress error: ${err.message}`);
      playSound('error', sfx);
    } finally {
      setCompressLoading(false);
    }
  };

  const handleProtect = async () => {
    if (!protectFile || !protectPass) {
      alert('Please select a PDF and enter an encryption password.');
      return;
    }
    setProtectLoading(true);
    playSound('click', sfx);
    try {
      const { blob, filename } = await protectPdf(protectFile, protectPass);
      downloadBlob(blob, filename);
      setProtectPass('');
    } catch (err) {
      alert(`Encryption error: ${err.message}`);
      playSound('error', sfx);
    } finally {
      setProtectLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!unlockFile || !unlockPass) {
      alert('Please select an encrypted PDF and enter the password.');
      return;
    }
    setUnlockLoading(true);
    playSound('click', sfx);
    try {
      const { blob, filename } = await unlockPdf(unlockFile, unlockPass);
      downloadBlob(blob, filename);
      setUnlockPass('');
    } catch (err) {
      alert(`Decryption error: ${err.message}`);
      playSound('error', sfx);
    } finally {
      setUnlockLoading(false);
    }
  };

  const handleRotate = async () => {
    if (!rotateFile) return;
    setRotateLoading(true);
    playSound('click', sfx);
    try {
      const { blob, filename } = await rotatePdf(rotateFile, rotateAngle, rotateRange);
      downloadBlob(blob, filename);
    } catch (err) {
      alert(`Rotation error: ${err.message}`);
      playSound('error', sfx);
    } finally {
      setRotateLoading(false);
    }
  };

  const handleOcr = async () => {
    if (!ocrFile) return;
    setOcrLoading(true);
    playSound('click', sfx);
    try {
      if (ocrOutputMode === 'txt_download') {
        const { blob, filename } = await runOcrDocument(ocrFile, ocrRange, ocrForce, 'txt_download');
        downloadBlob(blob, filename);
      } else {
        const result = await runOcrDocument(ocrFile, ocrRange, ocrForce, 'json');
        playSound('success', sfx);
        refreshStats();
        onOpenOcrModal(result, ocrFile.name);
      }
    } catch (err) {
      alert(`OCR error: ${err.message}`);
      playSound('error', sfx);
    } finally {
      setOcrLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 6 Grid PDF Tool Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.25rem'
      }}>
        
        {/* 1. Merge PDFs */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
              <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }}>
                <FilePlus2 size={20} />
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Merge Multiple PDFs</h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Combine 2 or more PDF documents into a single unified file.
            </p>

            <div 
              onClick={() => mergeInputRef.current.click()}
              style={{
                border: '2px dashed rgba(244, 63, 94, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(244, 63, 94, 0.04)'
              }}
            >
              <input 
                type="file" 
                ref={mergeInputRef} 
                accept=".pdf" 
                multiple 
                style={{ display: 'none' }} 
                onChange={(e) => {
                  if (e.target.files) setMergeFiles(Array.from(e.target.files));
                }}
              />
              <Upload size={22} style={{ color: '#f43f5e', margin: '0 auto 0.5rem' }} />
              <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                {mergeFiles.length > 0 ? `${mergeFiles.length} PDFs Selected` : 'Choose PDF Files'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Click to browse files</div>
              {mergeFiles.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setMergeFiles([]); }}
                  style={{ border: 'none', background: 'transparent', color: '#f43f5e', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.35rem' }}
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleMerge}
            disabled={mergeLoading || mergeFiles.length < 2}
            className="btn-primary"
            style={{ width: '100%', background: '#f43f5e', fontSize: '0.8rem' }}
          >
            {mergeLoading ? <Loader2 size={15} className="spin-slow" /> : 'Merge PDFs'}
          </button>
        </div>

        {/* 2. Split PDF */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
              <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                <Scissors size={20} />
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Split & Extract Pages</h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Extract specific page ranges into a single PDF or ZIP archive.
            </p>

            <div 
              onClick={() => splitInputRef.current.click()}
              style={{
                border: '2px dashed rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(245, 158, 11, 0.04)',
                marginBottom: '0.75rem'
              }}
            >
              <input 
                type="file" 
                ref={splitInputRef} 
                accept=".pdf" 
                style={{ display: 'none' }} 
                onChange={(e) => {
                  if (e.target.files) setSplitFile(e.target.files[0]);
                }}
              />
              <Scissors size={22} style={{ color: '#f59e0b', margin: '0 auto 0.5rem' }} />
              <div style={{ fontSize: '0.8rem', fontWeight: 700, wordBreak: 'break-all' }}>
                {splitFile ? splitFile.name : 'Select PDF Document'}
              </div>
              {splitFile && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSplitFile(null); }}
                  style={{ border: 'none', background: 'transparent', color: '#f59e0b', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.35rem' }}
                >
                  Remove File
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
                  borderRadius: '8px',
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
                accentColor="#f59e0b"
                minWidth="130px"
                sfx={sfx}
              />
            </div>
          </div>

          <button
            onClick={handleSplit}
            disabled={splitLoading || !splitFile}
            className="btn-primary"
            style={{ width: '100%', background: '#f59e0b', fontSize: '0.8rem' }}
          >
            {splitLoading ? <Loader2 size={15} className="spin-slow" /> : 'Split PDF'}
          </button>
        </div>

        {/* 3. Compress PDF */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
              <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
                <FileArchive size={20} />
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Compress PDF Size</h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Optimize and compress PDF content streams and embedded raster images.
            </p>

            <div 
              onClick={() => compressInputRef.current.click()}
              style={{
                border: '2px dashed rgba(6, 182, 212, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(6, 182, 212, 0.04)',
                marginBottom: '0.75rem'
              }}
            >
              <input 
                type="file" 
                ref={compressInputRef} 
                accept=".pdf" 
                style={{ display: 'none' }} 
                onChange={(e) => {
                  if (e.target.files) setCompressFile(e.target.files[0]);
                }}
              />
              <FileArchive size={22} style={{ color: '#06b6d4', margin: '0 auto 0.5rem' }} />
              <div style={{ fontSize: '0.8rem', fontWeight: 700, wordBreak: 'break-all' }}>
                {compressFile ? compressFile.name : 'Select PDF File'}
              </div>
              {compressFile && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setCompressFile(null); }}
                  style={{ border: 'none', background: 'transparent', color: '#06b6d4', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.35rem' }}
                >
                  Remove File
                </button>
              )}
            </div>

            <CustomSelect
              value={compressLevel}
              onChange={setCompressLevel}
              options={[
                { value: 'low', label: 'Low Compression (Highest Quality)' },
                { value: 'medium', label: 'Medium Compression (Balanced - Recommended)' },
                { value: 'high', label: 'High Compression (Smallest Size)' }
              ]}
              accentColor="#06b6d4"
              minWidth="100%"
              sfx={sfx}
            />
          </div>

          <button
            onClick={handleCompress}
            disabled={compressLoading || !compressFile}
            className="btn-primary"
            style={{ width: '100%', background: '#06b6d4', fontSize: '0.8rem' }}
          >
            {compressLoading ? <Loader2 size={15} className="spin-slow" /> : 'Compress PDF'}
          </button>
        </div>

        {/* 4. Encrypt (Protect) */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
              <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                <Lock size={20} />
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Encrypt PDF (Protect)</h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Secure documents with standard AES-256 password protection.
            </p>

            <div 
              onClick={() => protectInputRef.current.click()}
              style={{
                border: '2px dashed rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(16, 185, 129, 0.04)',
                marginBottom: '0.75rem'
              }}
            >
              <input 
                type="file" 
                ref={protectInputRef} 
                accept=".pdf" 
                style={{ display: 'none' }} 
                onChange={(e) => {
                  if (e.target.files) setProtectFile(e.target.files[0]);
                }}
              />
              <Lock size={22} style={{ color: '#10b981', margin: '0 auto 0.5rem' }} />
              <div style={{ fontSize: '0.8rem', fontWeight: 700, wordBreak: 'break-all' }}>
                {protectFile ? protectFile.name : 'Select Document to Lock'}
              </div>
              {protectFile && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setProtectFile(null); }}
                  style={{ border: 'none', background: 'transparent', color: '#10b981', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.35rem' }}
                >
                  Remove File
                </button>
              )}
            </div>

            <input
              type="password"
              placeholder="Enter strong password..."
              value={protectPass}
              onChange={(e) => setProtectPass(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem',
                borderRadius: '8px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-card)',
                color: 'var(--text-primary)',
                fontSize: '0.78rem'
              }}
            />
          </div>

          <button
            onClick={handleProtect}
            disabled={protectLoading || !protectFile || !protectPass}
            className="btn-primary"
            style={{ width: '100%', background: '#10b981', fontSize: '0.8rem' }}
          >
            {protectLoading ? <Loader2 size={15} className="spin-slow" /> : 'Encrypt PDF'}
          </button>
        </div>

        {/* 5. Decrypt (Unlock) */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
              <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                <Unlock size={20} />
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Decrypt PDF (Unlock)</h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Remove password restrictions from encrypted PDF documents.
            </p>

            <div 
              onClick={() => unlockInputRef.current.click()}
              style={{
                border: '2px dashed rgba(139, 92, 246, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(139, 92, 246, 0.04)',
                marginBottom: '0.75rem'
              }}
            >
              <input 
                type="file" 
                ref={unlockInputRef} 
                accept=".pdf" 
                style={{ display: 'none' }} 
                onChange={(e) => {
                  if (e.target.files) setUnlockFile(e.target.files[0]);
                }}
              />
              <Unlock size={22} style={{ color: '#8b5cf6', margin: '0 auto 0.5rem' }} />
              <div style={{ fontSize: '0.8rem', fontWeight: 700, wordBreak: 'break-all' }}>
                {unlockFile ? unlockFile.name : 'Select Encrypted PDF'}
              </div>
              {unlockFile && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setUnlockFile(null); }}
                  style={{ border: 'none', background: 'transparent', color: '#8b5cf6', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.35rem' }}
                >
                  Remove File
                </button>
              )}
            </div>

            <input
              type="password"
              placeholder="Enter current password..."
              value={unlockPass}
              onChange={(e) => setUnlockPass(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem',
                borderRadius: '8px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-card)',
                color: 'var(--text-primary)',
                fontSize: '0.78rem'
              }}
            />
          </div>

          <button
            onClick={handleUnlock}
            disabled={unlockLoading || !unlockFile || !unlockPass}
            className="btn-primary"
            style={{ width: '100%', background: '#8b5cf6', fontSize: '0.8rem' }}
          >
            {unlockLoading ? <Loader2 size={15} className="spin-slow" /> : 'Unlock PDF'}
          </button>
        </div>

        {/* 6. Rotate PDF */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
              <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
                <RotateCw size={20} />
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Rotate PDF Pages</h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Rotate pages clockwise or counter-clockwise across custom ranges.
            </p>

            <div 
              onClick={() => rotateInputRef.current.click()}
              style={{
                border: '2px dashed rgba(99, 102, 241, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(99, 102, 241, 0.04)',
                marginBottom: '0.75rem'
              }}
            >
              <input 
                type="file" 
                ref={rotateInputRef} 
                accept=".pdf" 
                style={{ display: 'none' }} 
                onChange={(e) => {
                  if (e.target.files) setRotateFile(e.target.files[0]);
                }}
              />
              <RotateCw size={22} style={{ color: '#6366f1', margin: '0 auto 0.5rem' }} />
              <div style={{ fontSize: '0.8rem', fontWeight: 700, wordBreak: 'break-all' }}>
                {rotateFile ? rotateFile.name : 'Select PDF to Rotate'}
              </div>
              {rotateFile && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setRotateFile(null); }}
                  style={{ border: 'none', background: 'transparent', color: '#6366f1', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.35rem' }}
                >
                  Remove File
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <CustomSelect
                value={rotateAngle}
                onChange={(val) => setRotateAngle(parseInt(val))}
                options={[
                  { value: 90, label: '90° Clockwise' },
                  { value: 180, label: '180° Flip' },
                  { value: 270, label: '270° Counter-CW' }
                ]}
                accentColor="#6366f1"
                minWidth="130px"
                sfx={sfx}
              />
              <input
                type="text"
                placeholder="Range (all, 1-3)"
                value={rotateRange}
                onChange={(e) => setRotateRange(e.target.value)}
                style={{
                  padding: '0.45rem',
                  borderRadius: '8px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-primary)',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>
          </div>

          <button
            onClick={handleRotate}
            disabled={rotateLoading || !rotateFile}
            className="btn-primary"
            style={{ width: '100%', background: '#6366f1', fontSize: '0.8rem' }}
          >
            {rotateLoading ? <Loader2 size={15} className="spin-slow" /> : 'Rotate PDF'}
          </button>
        </div>

      </div>

      {/* 7. OCR & TEXT EXTRACTOR STUDIO (Full Width Banner Card) */}
      <div className="glass-panel" style={{
        padding: '1.75rem',
        border: '1px solid rgba(139, 92, 246, 0.35)',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(217, 70, 239, 0.04) 100%)'
      }}>
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
              <div style={{ padding: '0.45rem', borderRadius: '10px', background: 'var(--brand-gradient)', color: 'white' }}>
                <ScanText size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                  Optical Character Recognition (OCR) Studio
                </h3>
                <span className="badge badge-brand font-mono" style={{ fontSize: '0.65rem', marginTop: '0.2rem' }}>
                  RAPIDOCR ONNX + PYMUPDF
                </span>
              </div>
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '600px' }}>
            Extract machine-readable text from scanned PDFs, flattened invoices, receipts, and images (PNG, JPG, TIFF, WEBP).
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', alignItems: 'center' }}>
          {/* Dropzone for OCR */}
          <div 
            onClick={() => ocrInputRef.current.click()}
            style={{
              border: '2px dashed rgba(139, 92, 246, 0.4)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'var(--bg-glass)'
            }}
          >
            <input 
              type="file" 
              ref={ocrInputRef} 
              accept=".pdf,.png,.jpg,.jpeg,.webp,.bmp,.tiff" 
              style={{ display: 'none' }} 
              onChange={(e) => {
                if (e.target.files) setOcrFile(e.target.files[0]);
              }}
            />
            <ScanText size={28} style={{ color: '#8b5cf6', margin: '0 auto 0.5rem' }} />
            <div style={{ fontSize: '0.85rem', fontWeight: 700, wordBreak: 'break-all' }}>
              {ocrFile ? ocrFile.name : 'Choose Scanned PDF or Image'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Click to select document or photo</div>
            {ocrFile && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setOcrFile(null); }}
                style={{ border: 'none', background: 'transparent', color: '#8b5cf6', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.35rem' }}
              >
                Remove File
              </button>
            )}
          </div>

          {/* Options & Action */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
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
                    borderRadius: '8px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                  Output Mode
                </label>
                <CustomSelect
                  value={ocrOutputMode}
                  onChange={setOcrOutputMode}
                  options={[
                    { value: 'studio', label: 'Open in OCR Studio' },
                    { value: 'txt_download', label: 'Download as .TXT' }
                  ]}
                  accentColor="#8b5cf6"
                  minWidth="100%"
                  sfx={sfx}
                />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={ocrForce}
                onChange={(e) => setOcrForce(e.target.checked)}
              />
              <span>Force Optical OCR Scan (even if digital text exists)</span>
            </label>

            <button
              onClick={handleOcr}
              disabled={ocrLoading || !ocrFile}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '0.65rem',
                fontSize: '0.85rem'
              }}
            >
              {ocrLoading ? (
                <>
                  <Loader2 size={16} className="spin-slow" />
                  <span>Scanning & Extracting Text...</span>
                </>
              ) : (
                <>
                  <ScanText size={16} />
                  <span>Extract Text (OCR)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
