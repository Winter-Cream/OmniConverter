// API Client for OmniConverter FastAPI Backend

const API_BASE = '';

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch (err) {
    return { status: 'offline', error: err.message };
  }
}

export async function fetchFormats() {
  const res = await fetch(`${API_BASE}/api/formats`);
  if (!res.ok) throw new Error('Failed to fetch format metadata');
  return await res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/api/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return await res.json();
}

export async function convertSingleFile(file, targetFormat, options = {}) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('target_format', targetFormat);
  formData.append('options', JSON.stringify(options));

  if (options.quality) formData.append('quality', options.quality);
  if (options.video_quality) formData.append('video_quality', options.video_quality);
  if (options.audio_bitrate) formData.append('audio_bitrate', options.audio_bitrate);
  if (options.strip_audio) formData.append('strip_audio', options.strip_audio);
  if (options.resize_width) formData.append('resize_width', options.resize_width);
  if (options.resize_height) formData.append('resize_height', options.resize_height);

  const res = await fetch(`${API_BASE}/api/convert`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'Conversion failed');
  }

  const blob = await res.blob();
  const disposition = res.headers.get('content-disposition');
  let filename = `${file.name.replace(/\.[^/.]+$/, "")}_converted.${targetFormat}`;
  if (disposition && disposition.includes('filename=')) {
    filename = disposition.split('filename=')[1].replace(/["']/g, '');
  }
  return { blob, filename };
}

export async function convertBatchFiles(files, targetFormat, options = {}) {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));
  formData.append('target_format', targetFormat);
  formData.append('options', JSON.stringify(options));

  const res = await fetch(`${API_BASE}/api/batch-convert`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'Batch conversion failed');
  }

  const blob = await res.blob();
  return { blob, filename: `OmniConverter_Batch_${targetFormat.toUpperCase()}.zip` };
}

// PDF Operations
export async function mergePdfs(files, passwords = '') {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));
  formData.append('passwords', passwords);

  const res = await fetch(`${API_BASE}/api/pdf/merge`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'PDF merge failed');
  }

  const blob = await res.blob();
  return { blob, filename: 'OmniConverter_Merged.pdf' };
}

export async function splitPdf(file, pageRange = 'all', mode = 'single_pdf', password = '') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('page_range', pageRange);
  formData.append('mode', mode);
  formData.append('password', password);

  const res = await fetch(`${API_BASE}/api/pdf/split`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'PDF split failed');
  }

  const blob = await res.blob();
  const filename = mode === 'zip' 
    ? `OmniConverter_Split_${file.name.replace(/\.[^/.]+$/, "")}.zip`
    : `OmniConverter_Split_${file.name.replace(/\.[^/.]+$/, "")}.pdf`;
  return { blob, filename };
}

export async function compressPdf(file, level = 'medium', password = '') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('level', level);
  formData.append('password', password);

  const res = await fetch(`${API_BASE}/api/pdf/compress`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'PDF compression failed');
  }

  const blob = await res.blob();
  return { blob, filename: `OmniConverter_Compressed_${file.name}` };
}

export async function protectPdf(file, password) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('password', password);

  const res = await fetch(`${API_BASE}/api/pdf/protect`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'PDF encryption failed');
  }

  const blob = await res.blob();
  return { blob, filename: `OmniConverter_Protected_${file.name}` };
}

export async function unlockPdf(file, password) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('password', password);

  const res = await fetch(`${API_BASE}/api/pdf/unlock`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'PDF decryption failed');
  }

  const blob = await res.blob();
  return { blob, filename: `OmniConverter_Unlocked_${file.name}` };
}

export async function rotatePdf(file, angle = 90, pageRange = 'all', password = '') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('angle', angle);
  formData.append('page_range', pageRange);
  formData.append('password', password);

  const res = await fetch(`${API_BASE}/api/pdf/rotate`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'PDF rotation failed');
  }

  const blob = await res.blob();
  return { blob, filename: `OmniConverter_Rotated_${file.name}` };
}

export async function runOcrDocument(file, pageRange = 'all', forceOcr = false, format = 'json', password = '') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('page_range', pageRange);
  formData.append('force_ocr', forceOcr);
  formData.append('format', format);
  formData.append('password', password);

  const res = await fetch(`${API_BASE}/api/pdf/ocr`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'OCR extraction failed');
  }

  if (format === 'txt_download') {
    const blob = await res.blob();
    return { blob, filename: `${file.name.replace(/\.[^/.]+$/, "")}_OCR.txt` };
  }

  return await res.json();
}

// AI Assistant
export async function sendAIChat(message, provider = 'builtin', apiKey = '', model = '', history = []) {
  const res = await fetch(`${API_BASE}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, provider, api_key: apiKey, model, history })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'AI chat request failed');
  }

  return await res.json();
}

export async function requestTTS(text, voice = 'neutral') {
  const formData = new FormData();
  formData.append('text', text);
  formData.append('voice', voice);

  const res = await fetch(`${API_BASE}/api/ai/tts`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) throw new Error('Speech synthesis failed');
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

// Watch Folder Automation
export async function updateWatchFolderConfig(enabled, path, outputPath, targetFormat) {
  const formData = new FormData();
  formData.append('enabled', enabled);
  formData.append('path', path);
  formData.append('output_path', outputPath);
  formData.append('target_format', targetFormat);

  const res = await fetch(`${API_BASE}/api/watch-folder/config`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) throw new Error('Failed to update Watch Folder daemon config');
  return await res.json();
}

// History & Stats
export async function clearServerHistory() {
  const res = await fetch(`${API_BASE}/api/history`, { method: 'DELETE' });
  return await res.json();
}

export async function deleteServerHistoryItem(index) {
  const res = await fetch(`${API_BASE}/api/history/${index}`, { method: 'DELETE' });
  return await res.json();
}

export async function resetServerStats() {
  const res = await fetch(`${API_BASE}/api/stats/reset`, { method: 'POST' });
  return await res.json();
}
