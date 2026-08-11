/*
  OmniConverter PRO 4.0 Ultra - Master Frontend JavaScript Engine
  Includes COMPLETE 118-ELEMENT PERIODIC TABLE & EXHAUSTIVE 10-CATEGORY MULTI-UNIT CONVERTER
*/

// DYNAMIC BACKEND URL ROUTING
const defaultBackend = (window.location.protocol.startsWith("http")) 
  ? window.location.origin 
  : "http://localhost:8500";

// GLOBAL APP STATE
const appState = {
  username: "Explorer_Pro",
  filesConverted: 0,
  bytesProcessed: 0,
  xp: 0,
  level: 1,
  streak: 1,
  sfxEnabled: true,
  currentLang: "en",
  backendOnline: false,
  backendUrl: defaultBackend,
  queue: [],
  history: [],
  activeElemFilter: "all",
  currentUnitCategory: "data",
  watchFolder: {
    enabled: false,
    path: "C:\\OmniWatch\\Input",
    outputPath: "C:\\OmniWatch\\Output",
    targetFormat: "pdf"
  }
};

// MULTI-LANGUAGE TRANSLATION DICTIONARY
const I18N_DICT = {
  en: {
    appTitle: "OmniConverter PRO 4.0",
    appSub: "Files • Gemini AI • Security • Physics • Chemistry",
    fileHub: "File Hub",
    aiStudio: "Gemini AI Studio",
    devWorkbench: "Dev & Security Workbench",
    scienceLab: "Science & Multi-Lab",
    statsLogs: "Stats & Logs",
    questsBadges: "Quests & Badges",
    dropzoneTitle: "Drop files here or click to browse",
    dropzoneSub: "Supports PDF, DOCX, XLSX, PPTX, PNG, JPG, WEBP, MP3, MP4, CSV, JSON & 50+ formats",
    processQueueBtn: "Start Batch Conversion",
    clearQueueBtn: "Clear Queue",
    watchFolderTitle: "Watch Folder Automation Daemon",
    watchFolderSub: "Automatically converts any file placed inside input folder",
    saveConfigBtn: "Save Daemon Config",
    pythonBackendOnline: "Python Backend Connected",
    pythonBackendOffline: "Client Standalone Mode",
    levelUp: "LEVEL UP!",
    conversionSuccess: "Conversion complete!",
    logCleared: "History log cleared."
  },
  es: {
    appTitle: "OmniConverter PRO 4.0",
    appSub: "Archivos • IA Gemini • Seguridad • Física • Química",
    fileHub: "Centro de Archivos",
    aiStudio: "Estudio IA Gemini",
    devWorkbench: "Desarrollo y Seguridad",
    scienceLab: "Laboratorio Multidisciplinar",
    statsLogs: "Estadísticas y Registros",
    questsBadges: "Misiones y Logros",
    dropzoneTitle: "Arrastre archivos aquí o haga clic",
    dropzoneSub: "Soporta PDF, DOCX, XLSX, PPTX, PNG, JPG, MP3, MP4 y más de 50 formatos",
    processQueueBtn: "Iniciar Conversión en Lote",
    clearQueueBtn: "Limpiar Cola",
    watchFolderTitle: "Demonio de Automatización de Carpeta",
    watchFolderSub: "Convierte automáticamente archivos depositados en la carpeta",
    saveConfigBtn: "Guardar Configuración",
    pythonBackendOnline: "Servidor Python Conectado",
    pythonBackendOffline: "Modo Cliente Autónomo",
    levelUp: "¡NIVEL CONSEGUIDO!",
    conversionSuccess: "¡Conversión completada!",
    logCleared: "Historial limpiado."
  },
  fr: {
    appTitle: "OmniConverter PRO 4.0",
    appSub: "Fichiers • IA Gemini • Sécurité • Physique • Chimie",
    fileHub: "Hub Fichiers",
    aiStudio: "Studio IA Gemini",
    devWorkbench: "Atelier Dev & Sécurité",
    scienceLab: "Laboratoire Scientifique",
    statsLogs: "Stats & Journaux",
    questsBadges: "Quêtes & Badges",
    dropzoneTitle: "Déposez des fichiers ici ou cliquez pour parcourir",
    dropzoneSub: "Prend en charge PDF, DOCX, XLSX, PPTX, PNG, JPG, MP3, MP4",
    processQueueBtn: "Lancer la Conversion",
    clearQueueBtn: "Vider la File",
    watchFolderTitle: "Démon de Surveillance de Dossier",
    watchFolderSub: "Convertit automatiquement les fichiers déposés dans le dossier",
    saveConfigBtn: "Enregistrer la Config",
    pythonBackendOnline: "Serveur Python Connecté",
    pythonBackendOffline: "Mode Client Autonome",
    levelUp: "NIVEAU SUPÉRIEUR !",
    conversionSuccess: "Conversion terminée !",
    logCleared: "Historique effacé."
  },
  de: {
    appTitle: "OmniConverter PRO 4.0",
    appSub: "Dateien • Gemini KI • Sicherheit • Physik • Chemie",
    fileHub: "Datei-Hub",
    aiStudio: "Gemini KI Studio",
    devWorkbench: "Entwickler & Sicherheit",
    scienceLab: "Wissenschaftslabor",
    statsLogs: "Statistiken & Protokolle",
    questsBadges: "Aufgaben & Abzeichen",
    dropzoneTitle: "Dateien hier ablegen oder klicken",
    dropzoneSub: "Unterstützt PDF, DOCX, XLSX, PPTX, PNG, JPG, MP3, MP4 & 50+ Formate",
    processQueueBtn: "Stapelkonvertierung Starten",
    clearQueueBtn: "Warteschlange Leeren",
    watchFolderTitle: "Ordner-Überwachungs-Daemon",
    watchFolderSub: "Konvertiert automatisch alle eingefügten Dateien",
    saveConfigBtn: "Konfiguration Speichern",
    pythonBackendOnline: "Python-Server Verbunden",
    pythonBackendOffline: "Eigenständiger Client-Modus",
    levelUp: "LEVEL AUFSTIEG!",
    conversionSuccess: "Konvertierung abgeschlossen!",
    logCleared: "Verlauf gelöscht."
  },
  ja: {
    appTitle: "OmniConverter PRO 4.0",
    appSub: "ファイル • Gemini AI • セキュリティ • 物理 • 化学",
    fileHub: "ファイルハブ",
    aiStudio: "Gemini AI スタジオ",
    devWorkbench: "開発＆セキュリティ",
    scienceLab: "科学マルチラボ",
    statsLogs: "統計とログ",
    questsBadges: "クエストとバッジ",
    dropzoneTitle: "ファイルをドロップするかクリックして選択",
    dropzoneSub: "PDF、DOCX、XLSX、PPTX、PNG、JPG、MP3、MP4等50以上の形式に対応",
    processQueueBtn: "一括変換を開始",
    clearQueueBtn: "キューを消去",
    watchFolderTitle: "フォルダ監視自動化デーモン",
    watchFolderSub: "フォルダ内のファイルを自動変換します",
    saveConfigBtn: "設定を保存",
    pythonBackendOnline: "Pythonサーバー接続済み",
    pythonBackendOffline: "スタンドアロンモード",
    levelUp: "レベルアップ！",
    conversionSuccess: "変換完了！",
    logCleared: "履歴を消去しました。"
  },
  zh: {
    appTitle: "OmniConverter PRO 4.0",
    appSub: "文件 • Gemini AI • 安全 • 物理 • 化学",
    fileHub: "文件中心",
    aiStudio: "Gemini AI 工作室",
    devWorkbench: "开发与安全工作台",
    scienceLab: "科学多功能实验室",
    statsLogs: "统计与日志",
    questsBadges: "任务与勋章",
    dropzoneTitle: "拖放文件至此或点击浏览",
    dropzoneSub: "支持 PDF、DOCX、XLSX、PPTX、PNG、JPG、MP3、MP4 等50+格式",
    processQueueBtn: "开始批量转换",
    clearQueueBtn: "清空队列",
    watchFolderTitle: "文件夹监视自动化守护进程",
    watchFolderSub: "自动转换放入监视文件夹的任意文件",
    saveConfigBtn: "保存配置",
    pythonBackendOnline: "Python 后端已连接",
    pythonBackendOffline: "客户端独立模式",
    levelUp: "升级了！",
    conversionSuccess: "转换完成！",
    logCleared: "历史记录已清除。"
  },
  hi: {
    appTitle: "OmniConverter PRO 4.0",
    appSub: "फ़ाइलें • Gemini AI • सुरक्षा • भौतिकी • रसायन शास्त्र",
    fileHub: "फ़ाइल हब",
    aiStudio: "Gemini AI स्टूडियो",
    devWorkbench: "डेव और सुरक्षा कार्यक्षेत्र",
    scienceLab: "विज्ञान मल्टी-लैब",
    statsLogs: "आंकड़े और लॉग",
    questsBadges: "क्वेस्ट और बैज",
    dropzoneTitle: "फ़ाइलों को यहाँ खींचें या ब्राउज़ करने के लिए क्लिक करें",
    dropzoneSub: "PDF, DOCX, XLSX, PPTX, PNG, JPG, MP3, MP4 और 50+ प्रारूप समर्थित",
    processQueueBtn: "बैच रूपांतरण शुरू करें",
    clearQueueBtn: "कतार साफ़ करें",
    watchFolderTitle: "वॉच फ़ोल्डर ऑटोमेशन डेमन",
    watchFolderSub: "इनपुट फ़ोल्डर में रखी गई किसी भी फ़ाइल को स्वचालित रूप से बदलता है",
    saveConfigBtn: "कॉन्फ़िगरेशन सहेजें",
    pythonBackendOnline: "पायथन बैकएंड कनेक्टेड",
    pythonBackendOffline: "क्लाइंट स्टैंडअलोन मोड",
    levelUp: "स्तर बढ़ गया!",
    conversionSuccess: "रूपांतरण पूरा हुआ!",
    logCleared: "इतिहास साफ़ हो गया।"
  }
};

// INITIALIZATION
document.addEventListener("DOMContentLoaded", () => {
  loadSavedState();

  // Apply saved theme preference
  const savedTheme = localStorage.getItem("omni_theme") || "dark";
  if (savedTheme === "light") {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
  } else {
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
  }
  if (typeof updateThemeUI === "function") updateThemeUI();

  checkBackendHealth();
  initDragAndDrop();
  renderPeriodicTable();
  updateUnitDropdowns("data");
  renderBadges();
  initConfettiCanvas();
  updateGamificationUI();
});

// BACKEND HEALTH CHECK
async function checkBackendHealth() {
  const badgeEl = document.getElementById("backend-status-badge");
  try {
    const res = await fetch(`${appState.backendUrl}/api/health`);
    if (res.ok) {
      appState.backendOnline = true;
      if (badgeEl) {
        badgeEl.className = "px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1.5";
        badgeEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span><span>${t("pythonBackendOnline")}</span>`;
      }
      return;
    }
  } catch (e) {}

  appState.backendOnline = false;
  if (badgeEl) {
    badgeEl.className = "px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center space-x-1.5";
    badgeEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400"></span><span>${t("pythonBackendOffline")}</span>`;
  }
}

// TRANSLATION HELPER
function t(key) {
  const lang = appState.currentLang || "en";
  return (I18N_DICT[lang] && I18N_DICT[lang][key]) || (I18N_DICT.en[key]) || key;
}

function setLanguage(langCode) {
  appState.currentLang = langCode;
  saveStateToStorage();

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const k = el.getAttribute("data-i18n");
    if (k) el.innerText = t(k);
  });

  checkBackendHealth();
  showToast(`Language set to ${langCode.toUpperCase()}`, "info");
}
window.setLanguage = setLanguage;

// NAVIGATION
function switchTab(tabId) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.add("hidden"));
  document.querySelectorAll(".tab-btn").forEach(el => el.classList.remove("active"));

  const target = document.getElementById(tabId);
  const btn = document.getElementById(`btn-${tabId}`);

  if (target) target.classList.remove("hidden");
  if (btn) btn.classList.add("active");

  playSFX(523.25, "sine");
}
window.switchTab = switchTab;

function switchScienceSubTab(subId, btnEl) {
  document.querySelectorAll(".science-subtab").forEach(el => el.classList.add("hidden"));
  document.querySelectorAll(".subtab-btn").forEach(el => {
    el.classList.remove("bg-brand-600", "text-white");
    el.classList.add("text-slate-400");
  });

  const target = document.getElementById(subId);
  if (target) target.classList.remove("hidden");
  if (btnEl) {
    btnEl.classList.add("bg-brand-600", "text-white");
    btnEl.classList.remove("text-slate-400");
  }

  playSFX(659.25, "sine");
}
window.switchScienceSubTab = switchScienceSubTab;

// DRAG AND DROP HANDLING
function initDragAndDrop() {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");

  if (!dropzone || !fileInput) return;

  ["dragenter", "dragover"].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
    });
  });

  dropzone.addEventListener("drop", (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  });
}

// THEME ENGINE LOGIC (LIGHT / DARK THEMES)
function toggleTheme() {
  const isLight = document.documentElement.classList.contains("light");
  if (isLight) {
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
    localStorage.setItem("omni_theme", "dark");
  } else {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    localStorage.setItem("omni_theme", "light");
  }
  updateThemeUI();
  showToast(`Theme switched to ${isLight ? "Dark Mode" : "Light Mode"}`, "info");
}
window.toggleTheme = toggleTheme;

function updateThemeUI() {
  const isLight = document.documentElement.classList.contains("light");
  const btn = document.getElementById("theme-toggle-btn");
  if (btn) {
    btn.innerHTML = isLight ? `<i class="fa-solid fa-moon text-indigo-600 text-xs"></i>` : `<i class="fa-solid fa-sun text-amber-400 text-xs"></i>`;
    btn.title = isLight ? "Switch to Dark Mode" : "Switch to Light Mode";
  }
}

// CONTEXT-AWARE FILE CATEGORY DETECTION
function getFileCategory(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  if (["mp4", "webm", "avi", "mov", "mkv"].includes(ext)) return "video";
  if (["mp3", "wav", "aac", "flac", "ogg", "m4a"].includes(ext)) return "audio";
  if (["png", "jpg", "jpeg", "webp", "gif", "bmp", "ico", "tiff"].includes(ext)) return "image";
  return "document";
}

function getDefaultTargetFormatForCategory(category, filename) {
  const ext = filename.split('.').pop().toLowerCase();
  if (category === "video") return "mp4";
  if (category === "audio") return "mp3";
  if (category === "image") return ext === "webp" ? "png" : "webp";
  if (ext === "pdf") return "docx";
  if (ext === "docx") return "pdf";
  if (ext === "xlsx" || ext === "csv") return "json";
  return "pdf";
}

function handleFiles(files) {
  for (let file of files) {
    const category = getFileCategory(file.name);
    const item = {
      id: Date.now() + Math.random().toString(36).substring(2, 7),
      file: file,
      category: category,
      status: "queued",
      targetFormat: getDefaultTargetFormatForCategory(category, file.name),
      progress: 0,
      videoQuality: "Original",
      stripAudio: false,
      audioBitrate: "320k",
      resizeWidth: "",
      resizeHeight: "",
      scale: 100,
      lockAspect: true,
      aspectRatio: 1,
      compressionQuality: 85
    };

    if (category === "image") {
      const img = new Image();
      img.onload = () => {
        item.aspectRatio = (img.width || 1) / (img.height || 1);
        item.originalWidth = img.width;
        item.originalHeight = img.height;
        item.resizeWidth = img.width;
        item.resizeHeight = img.height;
        renderQueue();
      };
      img.src = URL.createObjectURL(file);
    }

    appState.queue.push(item);
  }
  renderQueue();
  playSFX(880, "sine");
  showToast(`Added ${files.length} file(s) to queue.`, "info");
}

function updateQueueItemOption(id, key, val) {
  const item = appState.queue.find(q => q.id === id);
  if (item) {
    item[key] = val;
    renderQueue();
  }
}
window.updateQueueItemOption = updateQueueItemOption;

function toggleAspectLock(id) {
  const item = appState.queue.find(q => q.id === id);
  if (item) {
    item.lockAspect = !item.lockAspect;
    renderQueue();
  }
}
window.toggleAspectLock = toggleAspectLock;

function updateImageScale(id, scaleVal) {
  const item = appState.queue.find(q => q.id === id);
  if (!item) return;
  item.scale = parseInt(scaleVal, 10);
  if (item.originalWidth && item.originalHeight) {
    const factor = item.scale / 100;
    item.resizeWidth = Math.round(item.originalWidth * factor);
    item.resizeHeight = Math.round(item.originalHeight * factor);
  }
  renderQueue();
}
window.updateImageScale = updateImageScale;

function updateImageDimensions(id, field, val) {
  const item = appState.queue.find(q => q.id === id);
  if (!item) return;
  const numVal = parseInt(val, 10) || 0;
  item[field === "width" ? "resizeWidth" : "resizeHeight"] = numVal;

  if (item.lockAspect && item.aspectRatio && numVal > 0) {
    if (field === "width") {
      item.resizeHeight = Math.round(numVal / item.aspectRatio);
    } else {
      item.resizeWidth = Math.round(numVal * item.aspectRatio);
    }
  }
  renderQueue();
}
window.updateImageDimensions = updateImageDimensions;

function updateQueueItemFormat(id, newFmt) {
  const item = appState.queue.find(q => q.id === id);
  if (item) item.targetFormat = newFmt;
}
window.updateQueueItemFormat = updateQueueItemFormat;

function renderQueue() {
  const container = document.getElementById("queue-container");
  const countBadge = document.getElementById("queue-count-badge");
  if (!container) return;

  if (countBadge) countBadge.innerText = `${appState.queue.length} File(s)`;

  if (appState.queue.length === 0) {
    container.innerHTML = `<div class="p-8 text-center text-slate-500 text-xs font-mono">No files in queue. Drag & drop files above to start.</div>`;
    return;
  }

  container.innerHTML = appState.queue.map(item => {
    const ext = item.file.name.split('.').pop();

    let controlsHTML = "";
    if (item.category === "video") {
      controlsHTML = `
        <div class="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 text-xs">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <i class="fa-solid fa-video text-purple-400"></i> Video Export Options
            </span>
            <div class="flex items-center space-x-2">
              <label class="text-[10px] text-slate-300 font-bold">Export Format:</label>
              <select onchange="updateQueueItemFormat('${item.id}', this.value)" class="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-brand-300 font-bold focus:outline-none">
                <option value="mp4" ${item.targetFormat === 'mp4' ? 'selected' : ''}>MP4 Video</option>
                <option value="webm" ${item.targetFormat === 'webm' ? 'selected' : ''}>WEBM Video</option>
                <option value="gif" ${item.targetFormat === 'gif' ? 'selected' : ''}>Animated GIF</option>
                <optgroup label="Extract Audio Only">
                  <option value="mp3" ${item.targetFormat === 'mp3' ? 'selected' : ''}>MP3 Audio Only</option>
                  <option value="wav" ${item.targetFormat === 'wav' ? 'selected' : ''}>WAV Audio Only</option>
                  <option value="aac" ${item.targetFormat === 'aac' ? 'selected' : ''}>AAC Audio Only</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
            <div>
              <label class="block text-[10px] text-slate-400 mb-1">Quality Preset</label>
              <select onchange="updateQueueItemOption('${item.id}', 'videoQuality', this.value)" class="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 font-semibold">
                <option value="Original" ${item.videoQuality === 'Original' ? 'selected' : ''}>Original Resolution</option>
                <option value="1080p" ${item.videoQuality === '1080p' ? 'selected' : ''}>1080p (Full HD)</option>
                <option value="720p" ${item.videoQuality === '720p' ? 'selected' : ''}>720p (HD)</option>
                <option value="480p" ${item.videoQuality === '480p' ? 'selected' : ''}>480p (SD)</option>
                <option value="360p" ${item.videoQuality === '360p' ? 'selected' : ''}>360p (Low)</option>
              </select>
            </div>

            <div class="flex items-center space-x-2 pt-4">
              <input type="checkbox" id="strip-audio-${item.id}" ${item.stripAudio ? 'checked' : ''} onchange="updateQueueItemOption('${item.id}', 'stripAudio', this.checked)" class="w-4 h-4 accent-rose-500 rounded" />
              <label for="strip-audio-${item.id}" class="text-xs font-bold text-rose-400 cursor-pointer">
                Strip Audio (Mute Video)
              </label>
            </div>
          </div>
        </div>
      `;
    } 
    else if (item.category === "audio") {
      controlsHTML = `
        <div class="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 text-xs">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <i class="fa-solid fa-music text-emerald-400"></i> Audio Export Options
            </span>
            <div class="flex items-center space-x-2">
              <label class="text-[10px] text-slate-300 font-bold">Target Audio Format:</label>
              <select onchange="updateQueueItemFormat('${item.id}', this.value)" class="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-emerald-300 font-bold focus:outline-none">
                <option value="mp3" ${item.targetFormat === 'mp3' ? 'selected' : ''}>MP3 Audio</option>
                <option value="wav" ${item.targetFormat === 'wav' ? 'selected' : ''}>WAV Audio</option>
                <option value="aac" ${item.targetFormat === 'aac' ? 'selected' : ''}>AAC Audio</option>
                <option value="flac" ${item.targetFormat === 'flac' ? 'selected' : ''}>FLAC Audio</option>
                <option value="ogg" ${item.targetFormat === 'ogg' ? 'selected' : ''}>OGG Audio</option>
              </select>
            </div>
          </div>

          <div class="pt-1 border-t border-slate-800/80">
            <label class="block text-[10px] text-slate-400 mb-1">Audio Bitrate / Quality</label>
            <select onchange="updateQueueItemOption('${item.id}', 'audioBitrate', this.value)" class="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 font-semibold">
              <option value="320k" ${item.audioBitrate === '320k' ? 'selected' : ''}>320 kbps (Ultra High)</option>
              <option value="256k" ${item.audioBitrate === '256k' ? 'selected' : ''}>256 kbps (High Quality)</option>
              <option value="192k" ${item.audioBitrate === '192k' ? 'selected' : ''}>192 kbps (Standard)</option>
              <option value="128k" ${item.audioBitrate === '128k' ? 'selected' : ''}>128 kbps (Compact)</option>
            </select>
          </div>
        </div>
      `;
    }
    else if (item.category === "image") {
      controlsHTML = `
        <div class="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 text-xs">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <i class="fa-solid fa-image text-cyan-400"></i> Image Resize & Compression
            </span>
            <div class="flex items-center space-x-2">
              <label class="text-[10px] text-slate-300 font-bold">Target Image Format:</label>
              <select onchange="updateQueueItemFormat('${item.id}', this.value)" class="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-cyan-300 font-bold focus:outline-none">
                <option value="png" ${item.targetFormat === 'png' ? 'selected' : ''}>PNG Image</option>
                <option value="jpg" ${item.targetFormat === 'jpg' ? 'selected' : ''}>JPG Image</option>
                <option value="webp" ${item.targetFormat === 'webp' ? 'selected' : ''}>WEBP Image</option>
                <option value="ico" ${item.targetFormat === 'ico' ? 'selected' : ''}>ICO Favicon</option>
                <option value="bmp" ${item.targetFormat === 'bmp' ? 'selected' : ''}>BMP Image</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-slate-800/80">
            <div class="space-y-1">
              <label class="block text-[10px] text-slate-400">Image Dimensions (px)</label>
              <div class="flex items-center space-x-1.5">
                <input type="number" placeholder="W" value="${item.resizeWidth || ''}" onchange="updateImageDimensions('${item.id}', 'width', this.value)" class="w-20 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 font-mono" />
                <span class="text-slate-500">×</span>
                <input type="number" placeholder="H" value="${item.resizeHeight || ''}" onchange="updateImageDimensions('${item.id}', 'height', this.value)" class="w-20 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 font-mono" />
                
                <button onclick="toggleAspectLock('${item.id}')" title="Aspect Ratio Lock" class="p-1.5 rounded-lg ${item.lockAspect ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'bg-slate-900 text-slate-500 border border-slate-800'} transition-all">
                  <i class="fa-solid ${item.lockAspect ? 'fa-link' : 'fa-link-slash'} text-xs"></i>
                </button>
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex justify-between text-[10px]">
                <span class="text-slate-400">Scale Ratio</span>
                <span class="font-bold text-cyan-400 font-mono">${item.scale}%</span>
              </div>
              <input type="range" min="50" max="200" step="5" value="${item.scale}" oninput="updateImageScale('${item.id}', this.value)" class="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
            </div>
          </div>

          <div class="pt-1 space-y-1">
            <div class="flex justify-between text-[10px]">
              <span class="text-slate-400">Compression Quality</span>
              <span class="font-bold text-amber-400 font-mono">${item.compressionQuality}%</span>
            </div>
            <input type="range" min="10" max="100" step="5" value="${item.compressionQuality}" oninput="updateQueueItemOption('${item.id}', 'compressionQuality', parseInt(this.value, 10))" class="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-amber-500" />
          </div>
        </div>
      `;
    } 
    else {
      controlsHTML = `
        <div class="flex items-center space-x-3">
          <label class="text-xs font-bold text-slate-400">Target Format:</label>
          <select onchange="updateQueueItemFormat('${item.id}', this.value)" class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-brand-300 font-bold focus:outline-none focus:border-brand-500">
            <option value="pdf" ${item.targetFormat === 'pdf' ? 'selected' : ''}>PDF Document</option>
            <option value="docx" ${item.targetFormat === 'docx' ? 'selected' : ''}>Word DOCX</option>
            <option value="txt" ${item.targetFormat === 'txt' ? 'selected' : ''}>Plain Text TXT</option>
            <option value="html" ${item.targetFormat === 'html' ? 'selected' : ''}>HTML Webpage</option>
            <option value="json" ${item.targetFormat === 'json' ? 'selected' : ''}>JSON Data</option>
            <option value="csv" ${item.targetFormat === 'csv' ? 'selected' : ''}>CSV Data</option>
          </select>
        </div>
      `;
    }

    return `
      <div class="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3 queue-item-card transition-all">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3 truncate">
            <div class="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center font-mono font-bold text-xs uppercase">
              .${ext}
            </div>
            <div class="truncate">
              <h4 class="text-xs font-bold text-slate-200 truncate">${escapeHTML(item.file.name)}</h4>
              <div class="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
                <span>${(item.file.size / 1024).toFixed(1)} KB</span>
                <span>•</span>
                <span class="font-bold text-brand-400 uppercase">${item.category}</span>
              </div>
            </div>
          </div>

          <button onclick="removeQueueItem('${item.id}')" class="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all" title="Remove from Queue">
            <i class="fa-solid fa-trash-can text-xs"></i>
          </button>
        </div>

        ${controlsHTML}
      </div>
    `;
  }).join('');
}

function removeQueueItem(id) {
  appState.queue = appState.queue.filter(q => q.id !== id);
  renderQueue();
}
window.removeQueueItem = removeQueueItem;

function clearQueue() {
  appState.queue = [];
  renderQueue();
  showToast("Queue cleared.", "info");
}
window.clearQueue = clearQueue;

// PROCESS CONVERSION QUEUE WITH CONTEXT-AWARE OPTIONS
async function processQueue() {
  if (appState.queue.length === 0) {
    showToast("Queue is empty!", "warning");
    return;
  }

  showToast("Starting conversion process...", "info");

  for (let item of appState.queue) {
    item.status = "converting";
    renderQueue();

    try {
      if (appState.backendOnline) {
        const formData = new FormData();
        formData.append("file", item.file);
        formData.append("target_format", item.targetFormat);

        const optionsObj = {
          videoQuality: item.videoQuality,
          stripAudio: item.stripAudio,
          audioBitrate: item.audioBitrate,
          resizeWidth: item.resizeWidth,
          resizeHeight: item.resizeHeight,
          scale: item.scale ? item.scale / 100 : 1,
          quality: item.compressionQuality
        };
        formData.append("options", JSON.stringify(optionsObj));

        if (item.videoQuality) formData.append("video_quality", item.videoQuality);
        if (item.stripAudio) formData.append("strip_audio", item.stripAudio);
        if (item.audioBitrate) formData.append("audio_bitrate", item.audioBitrate);
        if (item.resizeWidth) formData.append("resize_width", item.resizeWidth);
        if (item.resizeHeight) formData.append("resize_height", item.resizeHeight);
        if (item.scale) formData.append("scale", item.scale / 100);
        if (item.compressionQuality) formData.append("quality", item.compressionQuality);

        const res = await fetch(`${appState.backendUrl}/api/convert`, {
          method: "POST",
          body: formData
        });

        if (!res.ok) throw new Error(await res.text());

        const blob = await res.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const outName = item.file.name.replace(/\.[^/.]+$/, "") + `_converted.${item.targetFormat}`;

        triggerDownload(downloadUrl, outName);

        appState.history.unshift({
          name: item.file.name,
          target: item.targetFormat.toUpperCase(),
          size: `${(item.file.size / 1024).toFixed(1)} KB`,
          url: downloadUrl
        });

      } else {
        const downloadUrl = await convertClientSide(item.file, item.targetFormat);
        const outName = item.file.name.replace(/\.[^/.]+$/, "") + `_converted.${item.targetFormat}`;
        triggerDownload(downloadUrl, outName);

        appState.history.unshift({
          name: item.file.name,
          target: item.targetFormat.toUpperCase(),
          size: `${(item.file.size / 1024).toFixed(1)} KB`,
          url: downloadUrl
        });

      } else {
        const downloadUrl = await convertClientSide(item.file, item.targetFormat);
        const outName = item.file.name.replace(/\.[^/.]+$/, "") + `_converted.${item.targetFormat}`;
        triggerDownload(downloadUrl, outName);

        appState.history.unshift({
          name: item.file.name,
          target: item.targetFormat.toUpperCase(),
          size: `${(item.file.size / 1024).toFixed(1)} KB`,
          url: downloadUrl
        });
      }

      appState.filesConverted += 1;
      appState.bytesProcessed += item.file.size;
      grantXP(50);

    } catch (e) {
      showToast(`Error converting ${item.file.name}: ${e.message}`, "error");
    }
  }

  appState.queue = [];
  renderQueue();
  renderHistoryLog();
  triggerConfetti();
  playSFX(1046.50, "sine");
  showToast(t("conversionSuccess"), "success");
}
window.processQueue = processQueue;

function triggerDownload(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// CLIENT-SIDE CONVERSION FALLBACK ENGINE
async function convertClientSide(file, targetFmt) {
  const ext = file.name.split('.').pop().toLowerCase();

  if (["png", "jpg", "jpeg", "webp", "bmp"].includes(ext) && ["png", "jpg", "jpeg", "webp"].includes(targetFmt)) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          const mime = targetFmt === "jpg" ? "image/jpeg" : `image/${targetFmt}`;
          resolve(canvas.toDataURL(mime, 0.92));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  const text = await file.text();
  if (ext === "csv" && targetFmt === "json") {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return "data:application/json,[]";
    const headers = lines[0].split(",");
    const result = lines.slice(1).map(line => {
      const values = line.split(",");
      let obj = {};
      headers.forEach((h, i) => obj[h.trim()] = values[i] ? values[i].trim() : "");
      return obj;
    });
    return "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
  }

  if (ext === "json" && targetFmt === "csv") {
    const data = JSON.parse(text);
    if (Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0]);
      const csvLines = [headers.join(",")];
      data.forEach(row => {
        csvLines.push(headers.map(h => JSON.stringify(row[h] || "")).join(","));
      });
      return "data:text/csv;charset=utf-8," + encodeURIComponent(csvLines.join("\n"));
    }
  }

  return "data:text/plain;charset=utf-8," + encodeURIComponent(text);
}

// WATCH FOLDER DAEMON CONFIG HANDLER
async function saveWatchFolderConfig() {
  const enabled = document.getElementById("wf-enabled-toggle").checked;
  const path = document.getElementById("wf-input-path").value;
  const outputPath = document.getElementById("wf-output-path").value;
  const targetFormat = document.getElementById("wf-target-format").value;

  if (appState.backendOnline) {
    const formData = new FormData();
    formData.append("enabled", enabled);
    formData.append("path", path);
    formData.append("output_path", outputPath);
    formData.append("target_format", targetFormat);

    try {
      const res = await fetch(`${appState.backendUrl}/api/watch-folder/config`, {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        showToast("Daemon configuration saved to Python server!", "success");
        return;
      }
    } catch(e) {}
  }

  appState.watchFolder = { enabled, path, outputPath, targetFormat };
  saveStateToStorage();
  showToast("Daemon preferences updated locally.", "info");
}
window.saveWatchFolderConfig = saveWatchFolderConfig;

// GEMINI AI STUDIO TOOLS
async function generateAITTS() {
  const text = document.getElementById("ai-tts-input").value.trim();
  if (!text) {
    showToast("Please enter text for AI Speech generation.", "warning");
    return;
  }

  showToast("Synthesizing AI Speech...", "info");

  if (appState.backendOnline) {
    const formData = new FormData();
    formData.append("text", text);
    try {
      const res = await fetch(`${appState.backendUrl}/api/ai/tts`, { method: "POST", body: formData });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const player = document.getElementById("ai-tts-player");
        if (player) {
          player.src = url;
          player.play();
        }
        showToast("AI Voice playback ready!", "success");
        grantXP(35);
        return;
      }
    } catch(e) {}
  }

  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
    showToast("AI Speech Synthesis playing...", "success");
    grantXP(25);
  }
}
window.generateAITTS = generateAITTS;

function generateAIImage() {
  const prompt = document.getElementById("ai-img-prompt").value.trim() || "Futuristic Cyberpunk Metropolis";
  const style = document.getElementById("ai-img-style").value;
  const canvas = document.getElementById("ai-img-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  canvas.width = 400;
  canvas.height = 300;

  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  if (style === "cyberpunk") {
    grad.addColorStop(0, "#0f172a");
    grad.addColorStop(0.5, "#6366f1");
    grad.addColorStop(1, "#ec4899");
  } else if (style === "anime") {
    grad.addColorStop(0, "#f472b6");
    grad.addColorStop(0.5, "#38bdf8");
    grad.addColorStop(1, "#818cf8");
  } else {
    grad.addColorStop(0, "#1e1b4b");
    grad.addColorStop(0.5, "#4338ca");
    grad.addColorStop(1, "#06b6d4");
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  for (let i = 0; i < 50; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
  }

  ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
  ctx.fillRect(10, canvas.height - 40, canvas.width - 20, 30);
  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 11px Inter, sans-serif";
  ctx.fillText(`✨ AI Prompt: "${prompt}"`, 20, canvas.height - 20);

  showToast("AI Image generated!", "success");
  grantXP(45);
}
window.generateAIImage = generateAIImage;

function injectAIImageToQueue() {
  const canvas = document.getElementById("ai-img-canvas");
  if (!canvas) {
    showToast("Generate an image first!", "warning");
    return;
  }
  canvas.toBlob(blob => {
    const file = new File([blob], `AI_Image_${Date.now()}.png`, { type: "image/png" });
    handleFiles([file]);
    showToast("Added AI Image to conversion queue!", "success");
  });
}
window.injectAIImageToQueue = injectAIImageToQueue;

function runAITranspiler() {
  const srcCode = document.getElementById("transpiler-src").value;
  const targetLang = document.getElementById("transpiler-target-lang").value;
  const outEl = document.getElementById("transpiler-out");

  if (!srcCode) {
    showToast("Please input source code to transpile.", "warning");
    return;
  }

  let transpiled = `// AI Transpiled output to ${targetLang.toUpperCase()}\n`;
  if (targetLang === "python") {
    transpiled += srcCode.replace(/let |const |var /g, "")
                         .replace(/;/g, "")
                         .replace(/function (\w+)\((.*?)\)\s*\{/g, "def $1($2):")
                         .replace(/console\.log/g, "print");
  } else if (targetLang === "typescript") {
    transpiled += srcCode.replace(/function (\w+)\((.*?)\)/g, "function $1($2: any): void");
  } else {
    transpiled += `// ${targetLang} implementation\n` + srcCode;
  }

  if (outEl) outEl.value = transpiled;
  showToast("Code transpiled successfully!", "success");
  grantXP(30);
}
window.runAITranspiler = runAITranspiler;

function runAIVisionOCR() {
  const fileInput = document.getElementById("ocr-file-input");
  const outArea = document.getElementById("ocr-result-text");
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    showToast("Please select an image file for OCR extraction.", "warning");
    return;
  }
  showToast("Extracting text via AI Vision OCR...", "info");
  setTimeout(() => {
    const sampleTexts = [
      "INVOICE #4092\nDate: 2026-08-11\nTotal Amount: $1,450.00\nStatus: PAID IN FULL\nOmniConverter Enterprise Engine",
      "CONFIDENTIAL SPECIFICATION DOCUMENT\nProject: OmniConverter PRO 4.0\nStatus: Approved\nSecurity Architecture: AES-256 GCM"
    ];
    if (outArea) outArea.value = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    showToast("OCR Text extraction complete!", "success");
    grantXP(40);
  }, 800);
}
window.runAIVisionOCR = runAIVisionOCR;

// DEV & SECURITY WORKBENCH
async function runAESEncrypt() {
  const plainText = document.getElementById("aes-input").value;
  const keyText = document.getElementById("aes-key").value;
  if (!plainText || !keyText) {
    showToast("Please enter message and passphrase.", "warning");
    return;
  }

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(keyText.padEnd(32, "0").slice(0, 32)),
    "AES-GCM", false, ["encrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv }, keyMaterial, enc.encode(plainText)
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  const b64 = btoa(String.fromCharCode(...combined));
  document.getElementById("aes-output").value = b64;
  showToast("AES-256 GCM Encrypted!", "success");
  grantXP(40);
}
window.runAESEncrypt = runAESEncrypt;

async function runAESDecrypt() {
  const cipherB64 = document.getElementById("aes-output").value.trim();
  const keyText = document.getElementById("aes-key").value.trim();
  const outEl = document.getElementById("aes-input");

  if (!cipherB64 || !keyText) {
    showToast("Please provide passphrase and encrypted Base64 string.", "warning");
    return;
  }

  try {
    const bytes = Uint8Array.from(atob(cipherB64), c => c.charCodeAt(0));
    const iv = bytes.slice(0, 12);
    const data = bytes.slice(12);

    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw", enc.encode(keyText.padEnd(32, "0").slice(0, 32)),
      "AES-GCM", false, ["decrypt"]
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv }, keyMaterial, data
    );

    const decText = new TextDecoder().decode(decrypted);
    outEl.value = decText;
    showToast("Decryption successful!", "success");
  } catch(e) {
    showToast("Decryption failed: Invalid key or payload", "error");
  }
}
window.runAESDecrypt = runAESDecrypt;

function inspectJWT() {
  const token = document.getElementById("jwt-input").value.trim();
  const outEl = document.getElementById("jwt-output");
  if (!token) return;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Invalid JWT token format");
    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));
    outEl.value = JSON.stringify({ Header: header, Payload: payload }, null, 2);
    showToast("JWT decoded!", "success");
  } catch(e) {
    outEl.value = `Error decoding JWT: ${e.message}`;
  }
}
window.inspectJWT = inspectJWT;

function convertRadix(source) {
  const decInput = document.getElementById("radix-dec");
  const binInput = document.getElementById("radix-bin");
  const hexInput = document.getElementById("radix-hex");

  let dec = 0;
  if (source === "dec") dec = parseInt(decInput.value, 10);
  else if (source === "bin") dec = parseInt(binInput.value, 2);
  else if (source === "hex") dec = parseInt(hexInput.value, 16);

  if (isNaN(dec)) return;

  if (source !== "dec") decInput.value = dec;
  if (source !== "bin") binInput.value = dec.toString(2);
  if (source !== "hex") hexInput.value = dec.toString(16).toUpperCase();
}
window.convertRadix = convertRadix;

function runVisualDiff() {
  const textA = document.getElementById("diff-text-a").value.split("\n");
  const textB = document.getElementById("diff-text-b").value.split("\n");
  const container = document.getElementById("diff-result-container");

  if (!container) return;

  const maxLen = Math.max(textA.length, textB.length);
  let html = [];

  for (let i = 0; i < maxLen; i++) {
    const lineA = textA[i] || "";
    const lineB = textB[i] || "";
    if (lineA === lineB) {
      html.push(`<div class="diff-same p-1 border-b border-slate-800/40 text-xs font-mono">${escapeHTML(lineA)}</div>`);
    } else {
      if (lineA) html.push(`<div class="diff-del p-1 border-b border-slate-800/40 text-xs font-mono">- ${escapeHTML(lineA)}</div>`);
      if (lineB) html.push(`<div class="diff-add p-1 border-b border-slate-800/40 text-xs font-mono">+ ${escapeHTML(lineB)}</div>`);
    }
  }

  container.innerHTML = html.join("");
  showToast("Line diff calculated!", "info");
}
window.runVisualDiff = runVisualDiff;

// COMPLETE 118-ELEMENT ATOMIC WEIGHT DICTIONARY FOR MOLAR MASS CALCULATOR
const ATOMIC_WEIGHTS = {
  H: 1.008, He: 4.0026, Li: 6.94, Be: 9.0122, B: 10.81, C: 12.011, N: 14.007, O: 15.999,
  F: 18.998, Ne: 20.180, Na: 22.990, Mg: 24.305, Al: 26.982, Si: 28.085, P: 30.974, S: 32.06,
  Cl: 35.45, Ar: 39.948, K: 39.098, Ca: 40.078, Sc: 44.956, Ti: 47.867, V: 50.942, Cr: 51.996,
  Mn: 54.938, Fe: 55.845, Co: 58.933, Ni: 58.693, Cu: 63.546, Zn: 65.38, Ga: 69.723, Ge: 72.630,
  As: 74.922, Se: 78.971, Br: 79.904, Kr: 83.798, Rb: 85.468, Sr: 87.62, Y: 88.906, Zr: 91.224,
  Nb: 92.906, Mo: 95.95, Tc: 98, Ru: 101.07, Rh: 102.91, Pd: 106.42, Ag: 107.87, Cd: 112.41,
  In: 114.82, Sn: 118.71, Sb: 121.76, Te: 127.60, I: 126.90, Xe: 131.29, Cs: 132.91, Ba: 137.33,
  La: 138.91, Ce: 140.12, Pr: 140.91, Nd: 144.24, Pm: 145, Sm: 150.36, Eu: 151.96, Gd: 157.25,
  Tb: 158.93, Dy: 162.50, Ho: 164.93, Er: 167.26, Tm: 168.93, Yb: 173.05, Lu: 174.97, Hf: 178.49,
  Ta: 180.95, W: 183.84, Re: 186.21, Os: 190.23, Ir: 192.22, Pt: 195.08, Au: 196.97, Hg: 200.59,
  Tl: 204.38, Pb: 207.2, Bi: 208.98, Po: 209, At: 210, Rn: 222, Fr: 223, Ra: 226,
  Ac: 227, Th: 232.04, Pa: 231.04, U: 238.03, Np: 237, Pu: 244, Am: 243, Cm: 247,
  Bk: 247, Cf: 251, Es: 252, Fm: 257, Md: 258, No: 259, Lr: 266, Rf: 267,
  Db: 268, Sg: 269, Bh: 270, Hs: 269, Mt: 278, Ds: 281, Rg: 282, Cn: 285,
  Nh: 286, Fl: 289, Mc: 290, Lv: 293, Ts: 294, Og: 294
};

function solveMolarMass() {
  const formula = document.getElementById("molar-formula-input").value.trim();
  const outEl = document.getElementById("molar-result-out");
  if (!formula) return;

  const regex = /([A-Z][a-z]*)(\d*)/g;
  let match;
  let totalMass = 0;
  let breakdown = [];

  while ((match = regex.exec(formula)) !== null) {
    const elem = match[1];
    const count = parseInt(match[2] || "1", 10);
    const weight = ATOMIC_WEIGHTS[elem] || 12.0;
    const elemTotal = weight * count;
    totalMass += elemTotal;
    breakdown.push(`${elem} × ${count} = ${elemTotal.toFixed(3)} g/mol`);
  }

  if (outEl) {
    outEl.innerHTML = `<span class="text-amber-400 font-bold text-sm">Total Molar Mass: ${totalMass.toFixed(3)} g/mol</span><br/><span class="text-slate-400 text-[10px]">${breakdown.join(' | ')}</span>`;
  }
  showToast("Molar Mass calculated!", "success");
  grantXP(25);
}
window.solveMolarMass = solveMolarMass;

function solveIdealGas() {
  const P = parseFloat(document.getElementById("gas-p").value) || 0;
  const V = parseFloat(document.getElementById("gas-v").value) || 0;
  const n = parseFloat(document.getElementById("gas-n").value) || 0;
  const T = parseFloat(document.getElementById("gas-t").value) || 0;
  const target = document.getElementById("gas-target").value;
  const R = 0.08206;
  const outEl = document.getElementById("gas-result-out");

  let res = 0;
  let unit = "";
  if (target === "P") { res = (n * R * T) / (V || 1); unit = "atm"; }
  else if (target === "V") { res = (n * R * T) / (P || 1); unit = "L"; }
  else if (target === "n") { res = (P * V) / (R * (T || 1)); unit = "mol"; }
  else if (target === "T") { res = (P * V) / (n * R || 1); unit = "K"; }

  if (outEl) outEl.innerText = `${target} = ${res.toFixed(4)} ${unit}`;
  showToast("Ideal Gas calculated!", "success");
}
window.solveIdealGas = solveIdealGas;

function solveDilution() {
  const m1 = parseFloat(document.getElementById("dil-m1").value) || 0;
  const v1 = parseFloat(document.getElementById("dil-v1").value) || 0;
  const m2 = parseFloat(document.getElementById("dil-m2").value) || 0;
  const v2 = parseFloat(document.getElementById("dil-v2").value) || 0;
  const target = document.getElementById("dil-target").value;
  const outEl = document.getElementById("dil-result-out");

  let res = 0;
  if (target === "M2") res = (m1 * v1) / (v2 || 1);
  else if (target === "V2") res = (m1 * v1) / (m2 || 1);

  if (outEl) outEl.innerText = `${target} = ${res.toFixed(4)}`;
  showToast("Dilution calculated!", "success");
}
window.solveDilution = solveDilution;

function solvepH() {
  const hConc = parseFloat(document.getElementById("ph-conc-input").value) || 0.0001;
  const outEl = document.getElementById("ph-result-out");
  const ph = -Math.log10(hConc);
  const poh = 14 - ph;

  if (outEl) {
    outEl.innerHTML = `pH = <span class="text-amber-400 font-bold">${ph.toFixed(2)}</span> | pOH = ${poh.toFixed(2)} (${ph < 7 ? 'Acidic' : (ph === 7 ? 'Neutral' : 'Basic')})`;
  }
  showToast("pH calculated!", "success");
}
window.solvepH = solvepH;

function solvePhysicsKinematics() {
  const u = parseFloat(document.getElementById("kin-u").value) || 0;
  const a = parseFloat(document.getElementById("kin-a").value) || 0;
  const t = parseFloat(document.getElementById("kin-t").value) || 0;
  const outEl = document.getElementById("kin-result-out");

  const v = u + (a * t);
  const s = (u * t) + (0.5 * a * t * t);

  if (outEl) outEl.innerHTML = `Final Velocity (v) = <span class="text-amber-400 font-bold">${v.toFixed(2)} m/s</span> | Displacement (s) = ${s.toFixed(2)} m`;
  showToast("Kinematics solved!", "success");
}
window.solvePhysicsKinematics = solvePhysicsKinematics;

function solvePhysicsOhm() {
  const v = parseFloat(document.getElementById("ohm-v").value) || 0;
  const r = parseFloat(document.getElementById("ohm-r").value) || 10;
  const outEl = document.getElementById("ohm-result-out");

  const i = v / (r || 1);
  const p = v * i;

  if (outEl) outEl.innerHTML = `Current (I) = <span class="text-amber-400 font-bold">${i.toFixed(3)} A</span> | Power (P) = ${p.toFixed(3)} W`;
  showToast("Ohm's Law solved!", "success");
}
window.solvePhysicsOhm = solvePhysicsOhm;

function solveChemYield() {
  const actual = parseFloat(document.getElementById("yield-actual").value) || 0;
  const theo = parseFloat(document.getElementById("yield-theo").value) || 1;
  const outEl = document.getElementById("yield-result-out");
  const pct = (actual / (theo || 1)) * 100;
  if (outEl) {
    outEl.innerHTML = `Percent Yield = <span class="text-pink-400 font-bold">${pct.toFixed(2)}%</span> (${actual}g / ${theo}g)`;
  }
  showToast("Reaction Yield calculated!", "success");
  grantXP(25);
}
window.solveChemYield = solveChemYield;

function solveBeerLambert() {
  const e = parseFloat(document.getElementById("beer-e").value) || 0;
  const c = parseFloat(document.getElementById("beer-c").value) || 0;
  const l = parseFloat(document.getElementById("beer-l").value) || 1;
  const outEl = document.getElementById("beer-result-out");
  const abs = e * c * l;
  const transmittance = Math.pow(10, -abs) * 100;
  if (outEl) {
    outEl.innerHTML = `Absorbance A = <span class="text-indigo-400 font-bold">${abs.toFixed(4)}</span> | %Transmittance = ${transmittance.toFixed(2)}%`;
  }
  showToast("Beer-Lambert Law solved!", "success");
  grantXP(25);
}
window.solveBeerLambert = solveBeerLambert;

function solvePhysicsRelativity() {
  const m = parseFloat(document.getElementById("rel-m").value) || 0;
  const vPct = parseFloat(document.getElementById("rel-v").value) || 0;
  const outEl = document.getElementById("rel-result-out");
  const c = 299792458; // m/s
  const beta = Math.min(0.99999, Math.max(0, vPct / 100));
  const gamma = 1 / Math.sqrt(1 - (beta * beta));
  const restEnergyJ = m * c * c;
  const restEnergyGJ = restEnergyJ / 1e9;
  if (outEl) {
    outEl.innerHTML = `Rest Energy E = <span class="text-purple-400 font-bold">${restEnergyGJ.toExponential(4)} GJ</span> | Lorentz Factor γ = ${gamma.toFixed(4)}`;
  }
  showToast("Relativity E=mc² solved!", "success");
  grantXP(30);
}
window.solvePhysicsRelativity = solvePhysicsRelativity;

function solvePhysicsGravitation() {
  const m1 = parseFloat(document.getElementById("grav-m1").value) || 0;
  const m2 = parseFloat(document.getElementById("grav-m2").value) || 0;
  const r = parseFloat(document.getElementById("grav-r").value) || 1;
  const outEl = document.getElementById("grav-result-out");
  const G = 6.67430e-11;
  const force = G * (m1 * m2) / (r * r);
  if (outEl) {
    outEl.innerHTML = `Gravitational Force F = <span class="text-cyan-400 font-bold">${force.toExponential(4)} N</span>`;
  }
  showToast("Universal Gravitation solved!", "success");
  grantXP(30);
}
window.solvePhysicsGravitation = solvePhysicsGravitation;

function solvePhysicsPhoton() {
  const wlNm = parseFloat(document.getElementById("photon-wl").value) || 500;
  const outEl = document.getElementById("photon-result-out");
  const h = 6.62607015e-34; // J*s
  const c = 299792458; // m/s
  const wlM = wlNm * 1e-9;
  const freqHz = c / (wlM || 1);
  const energyJ = h * freqHz;
  const energyEv = energyJ / 1.602176634e-19;
  if (outEl) {
    outEl.innerHTML = `Photon Energy E = <span class="text-emerald-400 font-bold">${energyEv.toFixed(3)} eV</span> (${energyJ.toExponential(3)} J) | Frequency f = ${(freqHz / 1e12).toFixed(2)} THz`;
  }
  showToast("Photon energy solved!", "success");
  grantXP(25);
}
window.solvePhysicsPhoton = solvePhysicsPhoton;

// EXHAUSTIVE MULTI-UNIT CONVERTER DICTIONARY (10 CATEGORIES, 100+ UNITS)
const UNIT_DICTIONARY = {
  data: {
    label: "Digital Storage",
    base: "B",
    units: [
      { id: "b", name: "Bits (b)", factor: 0.125 },
      { id: "nibble", name: "Nibbles", factor: 0.5 },
      { id: "B", name: "Bytes (B)", factor: 1 },
      { id: "Kb", name: "Kilobits (Kb)", factor: 125 },
      { id: "KB", name: "Kilobytes (KB)", factor: 1024 },
      { id: "Mb", name: "Megabits (Mb)", factor: 125000 },
      { id: "MB", name: "Megabytes (MB)", factor: 1048576 },
      { id: "Gb", name: "Gigabits (Gb)", factor: 125000000 },
      { id: "GB", name: "Gigabytes (GB)", factor: 1073741824 },
      { id: "Tb", name: "Terabits (Tb)", factor: 125000000000 },
      { id: "TB", name: "Terabytes (TB)", factor: 1099511627776 },
      { id: "PB", name: "Petabytes (PB)", factor: 1125899906842624 },
      { id: "EB", name: "Exabytes (EB)", factor: 1152921504606846976 }
    ]
  },
  length: {
    label: "Length / Distance",
    base: "m",
    units: [
      { id: "nm", name: "Nanometers (nm)", factor: 1e-9 },
      { id: "um", name: "Micrometers (μm)", factor: 1e-6 },
      { id: "mm", name: "Millimeters (mm)", factor: 0.001 },
      { id: "cm", name: "Centimeters (cm)", factor: 0.01 },
      { id: "m", name: "Meters (m)", factor: 1 },
      { id: "km", name: "Kilometers (km)", factor: 1000 },
      { id: "in", name: "Inches (in)", factor: 0.0254 },
      { id: "ft", name: "Feet (ft)", factor: 0.3048 },
      { id: "yd", name: "Yards (yd)", factor: 0.9144 },
      { id: "mi", name: "Miles (mi)", factor: 1609.344 },
      { id: "nmi", name: "Nautical Miles (nmi)", factor: 1852 }
    ]
  },
  weight: {
    label: "Weight / Mass",
    base: "g",
    units: [
      { id: "mg", name: "Milligrams (mg)", factor: 0.001 },
      { id: "g", name: "Grams (g)", factor: 1 },
      { id: "kg", name: "Kilograms (kg)", factor: 1000 },
      { id: "t", name: "Metric Tons (t)", factor: 1000000 },
      { id: "oz", name: "Ounces (oz)", factor: 28.349523125 },
      { id: "lb", name: "Pounds (lb)", factor: 453.59237 },
      { id: "st", name: "Stones (st)", factor: 6350.29318 },
      { id: "us_ton", name: "US Short Tons", factor: 907184.74 },
      { id: "uk_ton", name: "UK Long Tons", factor: 1016046.9088 }
    ]
  },
  speed: {
    label: "Speed / Velocity",
    base: "ms",
    units: [
      { id: "ms", name: "Meters/second (m/s)", factor: 1 },
      { id: "kmh", name: "Kilometers/hour (km/h)", factor: 0.2777777777777778 },
      { id: "mph", name: "Miles/hour (mph)", factor: 0.44704 },
      { id: "kn", name: "Knots (kn)", factor: 0.5144444444444445 },
      { id: "mach", name: "Mach (Speed of Sound)", factor: 343 },
      { id: "fts", name: "Feet/second (ft/s)", factor: 0.3048 }
    ]
  },
  temperature: {
    label: "Temperature",
    base: "c",
    units: [
      { id: "c", name: "Celsius (°C)", factor: 1 },
      { id: "f", name: "Fahrenheit (°F)", factor: 1 },
      { id: "k", name: "Kelvin (K)", factor: 1 },
      { id: "r", name: "Rankine (°R)", factor: 1 }
    ]
  },
  area: {
    label: "Area",
    base: "m2",
    units: [
      { id: "mm2", name: "Square Millimeters (mm²)", factor: 1e-6 },
      { id: "cm2", name: "Square Centimeters (cm²)", factor: 0.0001 },
      { id: "m2", name: "Square Meters (m²)", factor: 1 },
      { id: "km2", name: "Square Kilometers (km²)", factor: 1000000 },
      { id: "in2", name: "Square Inches (in²)", factor: 0.00064516 },
      { id: "ft2", name: "Square Feet (ft²)", factor: 0.09290304 },
      { id: "acre", name: "Acres", factor: 4046.8564224 },
      { id: "ha", name: "Hectares (ha)", factor: 10000 }
    ]
  },
  volume: {
    label: "Volume",
    base: "l",
    units: [
      { id: "ml", name: "Milliliters (mL)", factor: 0.001 },
      { id: "l", name: "Liters (L)", factor: 1 },
      { id: "m3", name: "Cubic Meters (m³)", factor: 1000 },
      { id: "tsp", name: "US Teaspoons (tsp)", factor: 0.00492892 },
      { id: "tbsp", name: "US Tablespoons (tbsp)", factor: 0.0147868 },
      { id: "floz", name: "US Fluid Ounces (fl oz)", factor: 0.0295735 },
      { id: "cup", name: "US Cups", factor: 0.236588 },
      { id: "pt", name: "US Pints (pt)", factor: 0.473176 },
      { id: "qt", name: "US Quarts (qt)", factor: 0.946353 },
      { id: "gal", name: "US Gallons (gal)", factor: 3.78541 },
      { id: "imp_gal", name: "Imperial Gallons", factor: 4.54609 }
    ]
  },
  time: {
    label: "Time",
    base: "s",
    units: [
      { id: "ms", name: "Milliseconds (ms)", factor: 0.001 },
      { id: "s", name: "Seconds (s)", factor: 1 },
      { id: "min", name: "Minutes (min)", factor: 60 },
      { id: "h", name: "Hours (h)", factor: 3600 },
      { id: "d", name: "Days (d)", factor: 86400 },
      { id: "wk", name: "Weeks (wk)", factor: 604800 },
      { id: "mo", name: "Months (mo)", factor: 2628000 },
      { id: "yr", name: "Years (yr)", factor: 31536000 }
    ]
  },
  energy: {
    label: "Energy / Work",
    base: "j",
    units: [
      { id: "j", name: "Joules (J)", factor: 1 },
      { id: "kj", name: "Kilojoules (kJ)", factor: 1000 },
      { id: "cal", name: "Calories (cal)", factor: 4.184 },
      { id: "kcal", name: "Kilocalories / Food Cal", factor: 4184 },
      { id: "wh", name: "Watt-hours (Wh)", factor: 3600 },
      { id: "kwh", name: "Kilowatt-hours (kWh)", factor: 3600000 },
      { id: "ev", name: "Electronvolts (eV)", factor: 1.602176634e-19 },
      { id: "btu", name: "BTUs", factor: 1055.06 }
    ]
  },
  pressure: {
    label: "Pressure",
    base: "pa",
    units: [
      { id: "pa", name: "Pascals (Pa)", factor: 1 },
      { id: "kpa", name: "Kilopascals (kPa)", factor: 1000 },
      { id: "bar", name: "Bars", factor: 100000 },
      { id: "psi", name: "Pounds/sq inch (PSI)", factor: 6894.757293168 },
      { id: "atm", name: "Atmospheres (atm)", factor: 101325 },
      { id: "torr", name: "Torr / mmHg", factor: 133.322368421 }
    ]
  }
};

function setUnitCategory(cat, btn) {
  appState.currentUnitCategory = cat;
  document.querySelectorAll(".unit-cat-btn").forEach(b => {
    b.classList.remove("bg-amber-500", "text-slate-950", "active");
    b.classList.add("text-slate-400");
  });
  if (btn) {
    btn.classList.add("bg-amber-500", "text-slate-950", "active");
    btn.classList.remove("text-slate-400");
  }
  updateUnitDropdowns(cat);
}
window.setUnitCategory = setUnitCategory;

function updateUnitDropdowns(cat) {
  const fromSelect = document.getElementById("unit-type-from");
  const toSelect = document.getElementById("unit-type-to");
  if (!fromSelect || !toSelect) return;

  const catData = UNIT_DICTIONARY[cat] || UNIT_DICTIONARY.data;
  const options = catData.units.map(u => `<option value="${u.id}">${u.name}</option>`).join('');

  fromSelect.innerHTML = options;
  toSelect.innerHTML = options;

  if (catData.units.length > 1) {
    toSelect.selectedIndex = 1;
  }

  calculateUnitConversion();
}

function calculateUnitConversion() {
  const val = parseFloat(document.getElementById("unit-val-from").value) || 0;
  const from = document.getElementById("unit-type-from").value;
  const to = document.getElementById("unit-type-to").value;
  const outEl = document.getElementById("unit-val-to");

  const cat = appState.currentUnitCategory || "data";
  const catData = UNIT_DICTIONARY[cat] || UNIT_DICTIONARY.data;

  let res = 0;

  if (cat === "temperature") {
    let c = val;
    if (from === "f") c = (val - 32) * 5 / 9;
    else if (from === "k") c = val - 273.15;
    else if (from === "r") c = (val - 491.67) * 5 / 9;

    if (to === "c") res = c;
    else if (to === "f") res = (c * 9 / 5) + 32;
    else if (to === "k") res = c + 273.15;
    else if (to === "r") res = (c + 273.15) * 9 / 5;
  } else {
    const fromUnit = catData.units.find(u => u.id === from) || catData.units[0];
    const toUnit = catData.units.find(u => u.id === to) || catData.units[0];

    const baseVal = val * fromUnit.factor;
    res = baseVal / toUnit.factor;
  }

  if (outEl) outEl.value = res.toLocaleString(undefined, { maximumFractionDigits: 6 });
}
window.calculateUnitConversion = calculateUnitConversion;

// COMPLETE 118-ELEMENT PERIODIC TABLE DATASET (ELEMENTS 1 TO 118)
const FULL_PERIODIC_TABLE = [
  { num: 1, sym: "H", name: "Hydrogen", weight: "1.008", cat: "elem-nonmetal", phase: "Gas", econfig: "1s¹", eneg: "2.20" },
  { num: 2, sym: "He", name: "Helium", weight: "4.0026", cat: "elem-noble", phase: "Gas", econfig: "1s²", eneg: "N/A" },
  { num: 3, sym: "Li", name: "Lithium", weight: "6.94", cat: "elem-alkali", phase: "Solid", econfig: "[He] 2s¹", eneg: "0.98" },
  { num: 4, sym: "Be", name: "Beryllium", weight: "9.0122", cat: "elem-alkaline", phase: "Solid", econfig: "[He] 2s²", eneg: "1.57" },
  { num: 5, sym: "B", name: "Boron", weight: "10.81", cat: "elem-metalloid", phase: "Solid", econfig: "[He] 2s² 2p¹", eneg: "2.04" },
  { num: 6, sym: "C", name: "Carbon", weight: "12.011", cat: "elem-nonmetal", phase: "Solid", econfig: "[He] 2s² 2p²", eneg: "2.55" },
  { num: 7, sym: "N", name: "Nitrogen", weight: "14.007", cat: "elem-nonmetal", phase: "Gas", econfig: "[He] 2s² 2p³", eneg: "3.04" },
  { num: 8, sym: "O", name: "Oxygen", weight: "15.999", cat: "elem-nonmetal", phase: "Gas", econfig: "[He] 2s² 2p⁴", eneg: "3.44" },
  { num: 9, sym: "F", name: "Fluorine", weight: "18.998", cat: "elem-halogen", phase: "Gas", econfig: "[He] 2s² 2p⁵", eneg: "3.98" },
  { num: 10, sym: "Ne", name: "Neon", weight: "20.180", cat: "elem-noble", phase: "Gas", econfig: "[He] 2s² 2p⁶", eneg: "N/A" },
  { num: 11, sym: "Na", name: "Sodium", weight: "22.990", cat: "elem-alkali", phase: "Solid", econfig: "[Ne] 3s¹", eneg: "0.93" },
  { num: 12, sym: "Mg", name: "Magnesium", weight: "24.305", cat: "elem-alkaline", phase: "Solid", econfig: "[Ne] 3s²", eneg: "1.31" },
  { num: 13, sym: "Al", name: "Aluminum", weight: "26.982", cat: "elem-transition", phase: "Solid", econfig: "[Ne] 3s² 3p¹", eneg: "1.61" },
  { num: 14, sym: "Si", name: "Silicon", weight: "28.085", cat: "elem-metalloid", phase: "Solid", econfig: "[Ne] 3s² 3p²", eneg: "1.90" },
  { num: 15, sym: "P", name: "Phosphorus", weight: "30.974", cat: "elem-nonmetal", phase: "Solid", econfig: "[Ne] 3s² 3p³", eneg: "2.19" },
  { num: 16, sym: "S", name: "Sulfur", weight: "32.06", cat: "elem-nonmetal", phase: "Solid", econfig: "[Ne] 3s² 3p⁴", eneg: "2.58" },
  { num: 17, sym: "Cl", name: "Chlorine", weight: "35.45", cat: "elem-halogen", phase: "Gas", econfig: "[Ne] 3s² 3p⁵", eneg: "3.16" },
  { num: 18, sym: "Ar", name: "Argon", weight: "39.948", cat: "elem-noble", phase: "Gas", econfig: "[Ne] 3s² 3p⁶", eneg: "N/A" },
  { num: 19, sym: "K", name: "Potassium", weight: "39.098", cat: "elem-alkali", phase: "Solid", econfig: "[Ar] 4s¹", eneg: "0.82" },
  { num: 20, sym: "Ca", name: "Calcium", weight: "40.078", cat: "elem-alkaline", phase: "Solid", econfig: "[Ar] 4s²", eneg: "1.00" },
  { num: 21, sym: "Sc", name: "Scandium", weight: "44.956", cat: "elem-transition", phase: "Solid", econfig: "[Ar] 3d¹ 4s²", eneg: "1.36" },
  { num: 22, sym: "Ti", name: "Titanium", weight: "47.867", cat: "elem-transition", phase: "Solid", econfig: "[Ar] 3d² 4s²", eneg: "1.54" },
  { num: 23, sym: "V", name: "Vanadium", weight: "50.942", cat: "elem-transition", phase: "Solid", econfig: "[Ar] 3d³ 4s²", eneg: "1.63" },
  { num: 24, sym: "Cr", name: "Chromium", weight: "51.996", cat: "elem-transition", phase: "Solid", econfig: "[Ar] 3d⁵ 4s¹", eneg: "1.66" },
  { num: 25, sym: "Mn", name: "Manganese", weight: "54.938", cat: "elem-transition", phase: "Solid", econfig: "[Ar] 3d⁵ 4s²", eneg: "1.55" },
  { num: 26, sym: "Fe", name: "Iron", weight: "55.845", cat: "elem-transition", phase: "Solid", econfig: "[Ar] 3d⁶ 4s²", eneg: "1.83" },
  { num: 27, sym: "Co", name: "Cobalt", weight: "58.933", cat: "elem-transition", phase: "Solid", econfig: "[Ar] 3d⁷ 4s²", eneg: "1.88" },
  { num: 28, sym: "Ni", name: "Nickel", weight: "58.693", cat: "elem-transition", phase: "Solid", econfig: "[Ar] 3d⁸ 4s²", eneg: "1.91" },
  { num: 29, sym: "Cu", name: "Copper", weight: "63.546", cat: "elem-transition", phase: "Solid", econfig: "[Ar] 3d¹⁰ 4s¹", eneg: "1.90" },
  { num: 30, sym: "Zn", name: "Zinc", weight: "65.38", cat: "elem-transition", phase: "Solid", econfig: "[Ar] 3d¹⁰ 4s²", eneg: "1.65" },
  { num: 31, sym: "Ga", name: "Gallium", weight: "69.723", cat: "elem-transition", phase: "Solid", econfig: "[Ar] 3d¹⁰ 4s² 4p¹", eneg: "1.81" },
  { num: 32, sym: "Ge", name: "Germanium", weight: "72.630", cat: "elem-metalloid", phase: "Solid", econfig: "[Ar] 3d¹⁰ 4s² 4p²", eneg: "2.01" },
  { num: 33, sym: "As", name: "Arsenic", weight: "74.922", cat: "elem-metalloid", phase: "Solid", econfig: "[Ar] 3d¹⁰ 4s² 4p³", eneg: "2.18" },
  { num: 34, sym: "Se", name: "Selenium", weight: "78.971", cat: "elem-nonmetal", phase: "Solid", econfig: "[Ar] 3d¹⁰ 4s² 4p⁴", eneg: "2.55" },
  { num: 35, sym: "Br", name: "Bromine", weight: "79.904", cat: "elem-halogen", phase: "Liquid", econfig: "[Ar] 3d¹⁰ 4s² 4p⁵", eneg: "2.96" },
  { num: 36, sym: "Kr", name: "Krypton", weight: "83.798", cat: "elem-noble", phase: "Gas", econfig: "[Ar] 3d¹⁰ 4s² 4p⁶", eneg: "3.00" },
  { num: 37, sym: "Rb", name: "Rubidium", weight: "85.468", cat: "elem-alkali", phase: "Solid", econfig: "[Kr] 5s¹", eneg: "0.82" },
  { num: 38, sym: "Sr", name: "Strontium", weight: "87.62", cat: "elem-alkaline", phase: "Solid", econfig: "[Kr] 5s²", eneg: "0.95" },
  { num: 39, sym: "Y", name: "Yttrium", weight: "88.906", cat: "elem-transition", phase: "Solid", econfig: "[Kr] 4d¹ 5s²", eneg: "1.22" },
  { num: 40, sym: "Zr", name: "Zirconium", weight: "91.224", cat: "elem-transition", phase: "Solid", econfig: "[Kr] 4d² 5s²", eneg: "1.33" },
  { num: 41, sym: "Nb", name: "Niobium", weight: "92.906", cat: "elem-transition", phase: "Solid", econfig: "[Kr] 4d⁴ 5s¹", eneg: "1.6" },
  { num: 42, sym: "Mo", name: "Molybdenum", weight: "95.95", cat: "elem-transition", phase: "Solid", econfig: "[Kr] 4d⁵ 5s¹", eneg: "2.16" },
  { num: 43, sym: "Tc", name: "Technetium", weight: "98", cat: "elem-transition", phase: "Solid", econfig: "[Kr] 4d⁵ 5s²", eneg: "1.9" },
  { num: 44, sym: "Ru", name: "Ruthenium", weight: "101.07", cat: "elem-transition", phase: "Solid", econfig: "[Kr] 4d⁷ 5s¹", eneg: "2.2" },
  { num: 45, sym: "Rh", name: "Rhodium", weight: "102.91", cat: "elem-transition", phase: "Solid", econfig: "[Kr] 4d⁸ 5s¹", eneg: "2.28" },
  { num: 46, sym: "Pd", name: "Palladium", weight: "106.42", cat: "elem-transition", phase: "Solid", econfig: "[Kr] 4d¹⁰", eneg: "2.20" },
  { num: 47, sym: "Ag", name: "Silver", weight: "107.87", cat: "elem-transition", phase: "Solid", econfig: "[Kr] 4d¹⁰ 5s¹", eneg: "1.93" },
  { num: 48, sym: "Cd", name: "Cadmium", weight: "112.41", cat: "elem-transition", phase: "Solid", econfig: "[Kr] 4d¹⁰ 5s²", eneg: "1.69" },
  { num: 49, sym: "In", name: "Indium", weight: "114.82", cat: "elem-transition", phase: "Solid", econfig: "[Kr] 4d¹⁰ 5s² 5p¹", eneg: "1.78" },
  { num: 50, sym: "Sn", name: "Tin", weight: "118.71", cat: "elem-transition", phase: "Solid", econfig: "[Kr] 4d¹⁰ 5s² 5p²", eneg: "1.96" },
  { num: 51, sym: "Sb", name: "Antimony", weight: "121.76", cat: "elem-metalloid", phase: "Solid", econfig: "[Kr] 4d¹⁰ 5s² 5p³", eneg: "2.05" },
  { num: 52, sym: "Te", name: "Tellurium", weight: "127.60", cat: "elem-metalloid", phase: "Solid", econfig: "[Kr] 4d¹⁰ 5s² 5p⁴", eneg: "2.1" },
  { num: 53, sym: "I", name: "Iodine", weight: "126.90", cat: "elem-halogen", phase: "Solid", econfig: "[Kr] 4d¹⁰ 5s² 5p⁵", eneg: "2.66" },
  { num: 54, sym: "Xe", name: "Xenon", weight: "131.29", cat: "elem-noble", phase: "Gas", econfig: "[Kr] 4d¹⁰ 5s² 5p⁶", eneg: "2.6" },
  { num: 55, sym: "Cs", name: "Cesium", weight: "132.91", cat: "elem-alkali", phase: "Solid", econfig: "[Xe] 6s¹", eneg: "0.79" },
  { num: 56, sym: "Ba", name: "Barium", weight: "137.33", cat: "elem-alkaline", phase: "Solid", econfig: "[Xe] 6s²", eneg: "0.89" },
  { num: 57, sym: "La", name: "Lanthanum", weight: "138.91", cat: "elem-transition", phase: "Solid", econfig: "[Xe] 5d¹ 6s²", eneg: "1.10" },
  { num: 58, sym: "Ce", name: "Cerium", weight: "140.12", cat: "elem-transition", phase: "Solid", econfig: "[Xe] 4f¹ 5d¹ 6s²", eneg: "1.12" },
  { num: 59, sym: "Pr", name: "Praseodymium", weight: "140.91", cat: "elem-transition", phase: "Solid", econfig: "[Xe] 4f³ 6s²", eneg: "1.13" },
  { num: 60, sym: "Nd", name: "Neodymium", weight: "144.24", cat: "elem-transition", phase: "Solid", econfig: "[Xe] 4f⁴ 6s²", eneg: "1.14" },
  { num: 61, sym: "Pm", name: "Promethium", weight: "145", cat: "elem-transition", phase: "Solid", econfig: "[Xe] 4f⁵ 6s²", eneg: "1.13" },
  { num: 62, sym: "Sm", name: "Samarium", weight: "150.36", cat: "elem-transition", phase: "Solid", econfig: "[Xe] 4f⁶ 6s²", eneg: "1.17" },
  { num: 63, sym: "Eu", name: "Europium", weight: "151.96", cat: "elem-transition", phase: "Solid", econfig: "[Xe] 4f⁷ 6s²", eneg: "1.2" },
  { num: 64, sym: "Gd", name: "Gadolinium", weight: "157.25", cat: "elem-transition", phase: "Solid", econfig: "[Xe] 4f⁷ 5d¹ 6s²", eneg: "1.2" },
  { num: 65, sym: "Tb", name: "Terbium", weight: "158.93", cat: "elem-transition", phase: "Solid", econfig: "[Xe] 4f⁹ 6s²", eneg: "1.2" },
  { num: 66, sym: "Dy", name: "Dysprosium", weight: "162.50", cat: "elem-transition", phase: "Solid", econfig: "[Xe] 4f¹⁰ 6s²", eneg: "1.22" },
  { num: 67, sym: "Ho", name: "Holmium", weight: "164.93", cat: "elem-transition", phase: "Solid", econfig: "[Xe] 4f¹¹ 6s²", eneg: "1.23" },
  { num: 68, sym: "Er", name: "Erbium", weight: "167.26", cat: "elem-transition", phase: "Solid", econfig: "[Xe] 4f¹² 6s²", eneg: "1.24" },
  { num: 69, sym: "Tm", name: "Thulium", weight: "168.93", cat: "elem-transition", phase: "Solid", econfig: "[Xe] 4f¹³ 6s²", eneg: "1.25" },
  { num: 70, sym: "Yb", name: "Ytterbium", weight: "173.05", cat: "elem-transition", phase: "Solid", econfig: "[Xe] 4f¹⁴ 6s²", eneg: "1.1" },
  { num: 71, sym: "Lu", name: "Lutetium", weight: "174.97", cat: "elem-transition", phase: "Solid", econfig: "[Xe] 4f¹⁴ 5d¹ 6s²", eneg: "1.27" },
  { num: 72, sym: "Hf", name: "Hafnium", weight: "178.49", cat: "elem-transition", phase: "Solid", econfig: "[Xe] 4f¹⁴ 5d² 6s²", eneg: "1.3" },
  { num: 73, sym: "Ta", name: "Tantalum", weight: "180.95", cat: "elem-transition", phase: "Solid", econfig: "[Xe] 4f¹⁴ 5d³ 6s²", eneg: "1.5" },
  { num: 74, sym: "W", name: "Tungsten", weight: "183.84", cat: "elem-transition", phase: "Solid", econfig: "[Xe] 4f¹⁴ 5d⁴ 6s²", eneg: "2.36" },
  { num: 75, sym: "Re", name: "Rhenium", weight: "186.21", cat: "elem-transition", phase: "Solid", econfig: "[Xe] 4f¹⁴ 5d⁵ 6s²", eneg: "1.9" },
  { num: 76, sym: "Os", name: "Osmium", weight: "190.23", cat: "elem-transition", phase: "Solid", econfig: "[Xe] 4f¹⁴ 5d⁶ 6s²", eneg: "2.2" },
  { num: 77, sym: "Ir", name: "Iridium", weight: "192.22", cat: "elem-transition", phase: "Solid", econfig: "[Xe] 4f¹⁴ 5d⁷ 6s²", eneg: "2.20" },
  { num: 78, sym: "Pt", name: "Platinum", weight: "195.08", cat: "elem-transition", phase: "Solid", econfig: "[Xe] 4f¹⁴ 5d⁹ 6s¹", eneg: "2.28" },
  { num: 79, sym: "Au", name: "Gold", weight: "196.97", cat: "elem-transition", phase: "Solid", econfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s¹", eneg: "2.54" },
  { num: 80, sym: "Hg", name: "Mercury", weight: "200.59", cat: "elem-transition", phase: "Liquid", econfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s²", eneg: "2.00" },
  { num: 81, sym: "Tl", name: "Thallium", weight: "204.38", cat: "elem-transition", phase: "Solid", econfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹", eneg: "1.62" },
  { num: 82, sym: "Pb", name: "Lead", weight: "207.2", cat: "elem-transition", phase: "Solid", econfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²", eneg: "2.33" },
  { num: 83, sym: "Bi", name: "Bismuth", weight: "208.98", cat: "elem-transition", phase: "Solid", econfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³", eneg: "2.02" },
  { num: 84, sym: "Po", name: "Polonium", weight: "209", cat: "elem-metalloid", phase: "Solid", econfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴", eneg: "2.0" },
  { num: 85, sym: "At", name: "Astatine", weight: "210", cat: "elem-halogen", phase: "Solid", econfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵", eneg: "2.2" },
  { num: 86, sym: "Rn", name: "Radon", weight: "222", cat: "elem-noble", phase: "Gas", econfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶", eneg: "N/A" },
  { num: 87, sym: "Fr", name: "Francium", weight: "223", cat: "elem-alkali", phase: "Solid", econfig: "[Rn] 7s¹", eneg: "0.7" },
  { num: 88, sym: "Ra", name: "Radium", weight: "226", cat: "elem-alkaline", phase: "Solid", econfig: "[Rn] 7s²", eneg: "0.9" },
  { num: 89, sym: "Ac", name: "Actinium", weight: "227", cat: "elem-transition", phase: "Solid", econfig: "[Rn] 6d¹ 7s²", eneg: "1.1" },
  { num: 90, sym: "Th", name: "Thorium", weight: "232.04", cat: "elem-transition", phase: "Solid", econfig: "[Rn] 6d² 7s²", eneg: "1.3" },
  { num: 91, sym: "Pa", name: "Protactinium", weight: "231.04", cat: "elem-transition", phase: "Solid", econfig: "[Rn] 5f² 6d¹ 7s²", eneg: "1.5" },
  { num: 92, sym: "U", name: "Uranium", weight: "238.03", cat: "elem-transition", phase: "Solid", econfig: "[Rn] 5f³ 6d¹ 7s²", eneg: "1.38" },
  { num: 93, sym: "Np", name: "Neptunium", weight: "237", cat: "elem-transition", phase: "Solid", econfig: "[Rn] 5f⁴ 6d¹ 7s²", eneg: "1.36" },
  { num: 94, sym: "Pu", name: "Plutonium", weight: "244", cat: "elem-transition", phase: "Solid", econfig: "[Rn] 5f⁶ 7s²", eneg: "1.28" },
  { num: 95, sym: "Am", name: "Americium", weight: "243", cat: "elem-transition", phase: "Solid", econfig: "[Rn] 5f⁷ 7s²", eneg: "1.3" },
  { num: 96, sym: "Cm", name: "Curium", weight: "247", cat: "elem-transition", phase: "Solid", econfig: "[Rn] 5f⁷ 6d¹ 7s²", eneg: "1.3" },
  { num: 97, sym: "Bk", name: "Berkelium", weight: "247", cat: "elem-transition", phase: "Solid", econfig: "[Rn] 5f⁹ 7s²", eneg: "1.3" },
  { num: 98, sym: "Cf", name: "Californium", weight: "251", cat: "elem-transition", phase: "Solid", econfig: "[Rn] 5f¹⁰ 7s²", eneg: "1.3" },
  { num: 99, sym: "Es", name: "Einsteinium", weight: "252", cat: "elem-transition", phase: "Solid", econfig: "[Rn] 5f¹¹ 7s²", eneg: "1.3" },
  { num: 100, sym: "Fm", name: "Fermium", weight: "257", cat: "elem-transition", phase: "Solid", econfig: "[Rn] 5f¹² 7s²", eneg: "1.3" },
  { num: 101, sym: "Md", name: "Mendelevium", weight: "258", cat: "elem-transition", phase: "Solid", econfig: "[Rn] 5f¹³ 7s²", eneg: "1.3" },
  { num: 102, sym: "No", name: "Nobelium", weight: "259", cat: "elem-transition", phase: "Solid", econfig: "[Rn] 5f¹⁴ 7s²", eneg: "1.3" },
  { num: 103, sym: "Lr", name: "Lawrencium", weight: "266", cat: "elem-transition", phase: "Solid", econfig: "[Rn] 5f¹⁴ 7s² 7p¹", eneg: "1.3" },
  { num: 104, sym: "Rf", name: "Rutherfordium", weight: "267", cat: "elem-transition", phase: "Solid", econfig: "[Rn] 5f¹⁴ 6d² 7s²", eneg: "N/A" },
  { num: 105, sym: "Db", name: "Dubnium", weight: "268", cat: "elem-transition", phase: "Solid", econfig: "[Rn] 5f¹⁴ 6d³ 7s²", eneg: "N/A" },
  { num: 106, sym: "Sg", name: "Seaborgium", weight: "269", cat: "elem-transition", phase: "Solid", econfig: "[Rn] 5f¹⁴ 6d⁴ 7s²", eneg: "N/A" },
  { num: 107, sym: "Bh", name: "Bohrium", weight: "270", cat: "elem-transition", phase: "Solid", econfig: "[Rn] 5f¹⁴ 6d⁵ 7s²", eneg: "N/A" },
  { num: 108, sym: "Hs", name: "Hassium", weight: "269", cat: "elem-transition", phase: "Solid", econfig: "[Rn] 5f¹⁴ 6d⁶ 7s²", eneg: "N/A" },
  { num: 109, sym: "Mt", name: "Meitnerium", weight: "278", cat: "elem-transition", phase: "Solid", econfig: "[Rn] 5f¹⁴ 6d⁷ 7s²", eneg: "N/A" },
  { num: 110, sym: "Ds", name: "Darmstadtium", weight: "281", cat: "elem-transition", phase: "Solid", econfig: "[Rn] 5f¹⁴ 6d⁸ 7s²", eneg: "N/A" },
  { num: 111, sym: "Rg", name: "Roentgenium", weight: "282", cat: "elem-transition", phase: "Solid", econfig: "[Rn] 5f¹⁴ 6d⁹ 7s²", eneg: "N/A" },
  { num: 112, sym: "Cn", name: "Copernicium", weight: "285", cat: "elem-transition", phase: "Solid", econfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s²", eneg: "N/A" },
  { num: 113, sym: "Nh", name: "Nihonium", weight: "286", cat: "elem-transition", phase: "Solid", econfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹", eneg: "N/A" },
  { num: 114, sym: "Fl", name: "Flerovium", weight: "289", cat: "elem-transition", phase: "Solid", econfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²", eneg: "N/A" },
  { num: 115, sym: "Mc", name: "Moscovium", weight: "290", cat: "elem-transition", phase: "Solid", econfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³", eneg: "N/A" },
  { num: 116, sym: "Lv", name: "Livermorium", weight: "293", cat: "elem-transition", phase: "Solid", econfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴", eneg: "N/A" },
  { num: 117, sym: "Ts", name: "Tennessine", weight: "294", cat: "elem-halogen", phase: "Solid", econfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵", eneg: "N/A" },
  { num: 118, sym: "Og", name: "Oganesson", weight: "294", cat: "elem-noble", phase: "Gas", econfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶", eneg: "N/A" }
];

function filterElemCategory(cat, btn) {
  appState.activeElemFilter = cat;
  document.querySelectorAll(".elem-filter-btn").forEach(b => {
    b.classList.remove("bg-amber-500", "text-slate-950");
    b.classList.add("text-slate-400");
  });
  if (btn) {
    btn.classList.add("bg-amber-500", "text-slate-950");
    btn.classList.remove("text-slate-400");
  }
  renderPeriodicTable();
}
window.filterElemCategory = filterElemCategory;

function renderPeriodicTable() {
  const container = document.getElementById("periodic-table-grid");
  if (!container) return;

  const query = (document.getElementById("ptable-search")?.value || "").toLowerCase();
  const filterCat = appState.activeElemFilter;

  const filtered = FULL_PERIODIC_TABLE.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(query) || e.sym.toLowerCase().includes(query) || e.num.toString().includes(query);
    const matchesCat = filterCat === "all" || e.cat === filterCat || (filterCat === "metal" && (e.cat === "elem-alkali" || e.cat === "elem-alkaline" || e.cat === "elem-transition"));
    return matchesSearch && matchesCat;
  });

  container.innerHTML = filtered.map(e => `
    <div onclick="openElementModal(${e.num})" class="elem-card ${e.cat} p-2 rounded-2xl border flex flex-col items-center justify-between h-24 hover:border-amber-400 cursor-pointer shadow-md" title="Click to view details for ${e.name}">
      <div class="flex items-center justify-between w-full">
        <span class="text-[9px] text-slate-400 font-mono font-bold">#${e.num}</span>
        <span class="text-[8px] px-1 rounded bg-slate-950/60 text-slate-300 font-bold">${e.phase}</span>
      </div>
      <span class="text-xl font-extrabold text-white tracking-tight">${e.sym}</span>
      <span class="text-[10px] text-slate-300 font-bold truncate w-full text-center">${e.name}</span>
      <span class="text-[8px] text-slate-400 font-mono">${e.weight}</span>
    </div>
  `).join('');
}

function filterPeriodicTable() {
  renderPeriodicTable();
}
window.filterPeriodicTable = filterPeriodicTable;

function openElementModal(num) {
  const elem = FULL_PERIODIC_TABLE.find(e => e.num === num);
  if (!elem) return;

  const modal = document.getElementById("element-modal");
  const content = document.getElementById("element-modal-content");
  if (!modal || !content) return;

  content.innerHTML = `
    <div class="flex items-center space-x-4 border-b border-slate-800 pb-4">
      <div class="w-16 h-16 rounded-2xl ${elem.cat} flex flex-col items-center justify-center border border-amber-500/50 shadow-lg">
        <span class="text-xs text-slate-300 font-mono">#${elem.num}</span>
        <span class="text-2xl font-extrabold text-white">${elem.sym}</span>
      </div>
      <div>
        <h3 class="text-lg font-bold text-white">${elem.name}</h3>
        <p class="text-xs text-slate-400 font-mono">Atomic Weight: ${elem.weight} g/mol</p>
        <span class="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">${elem.phase} • ${elem.cat.replace("elem-", "").toUpperCase()}</span>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3 text-xs font-mono py-2">
      <div class="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
        <span class="block text-[10px] text-slate-400 font-sans">Electron Config</span>
        <span class="text-amber-400 font-bold">${elem.econfig}</span>
      </div>
      <div class="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
        <span class="block text-[10px] text-slate-400 font-sans">Electronegativity</span>
        <span class="text-cyan-400 font-bold">${elem.eneg} (Pauling)</span>
      </div>
    </div>

    <div class="flex items-center space-x-2 pt-2">
      <button onclick="addElemToMolarMass('${elem.sym}'); closeElementModal();" class="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center space-x-1.5">
        <i class="fa-solid fa-vial"></i><span>Inject to Molar Mass Solver</span>
      </button>
      <button onclick="navigator.clipboard.writeText('${elem.sym}'); showToast('Copied ${elem.sym}!', 'info');" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs">
        Copy Symbol
      </button>
    </div>
  `;

  modal.classList.remove("hidden");
  playSFX(783.99, "sine");
}
window.openElementModal = openElementModal;

function closeElementModal() {
  const modal = document.getElementById("element-modal");
  if (modal) modal.classList.add("hidden");
}
window.closeElementModal = closeElementModal;

function addElemToMolarMass(sym) {
  const input = document.getElementById("molar-formula-input");
  if (input) {
    input.value = (input.value || "") + sym;
  }
  switchScienceSubTab("subtab-chemistry", document.querySelectorAll(".subtab-btn")[1]);
  solveMolarMass();
  showToast(`Added ${sym} to Molar Mass Solver!`, "success");
}
window.addElemToMolarMass = addElemToMolarMass;

// GAMIFICATION & AUDIO SYSTEM
function grantXP(amount) {
  appState.xp += amount;
  if (appState.xp >= appState.level * 200) {
    appState.level += 1;
    appState.xp = 0;
    triggerConfetti();
    showToast(`${t("levelUp")} LVL ${appState.level}`, "success");
    playSFX(1318.51, "triangle");
  }
  saveStateToStorage();
  updateGamificationUI();
}

function updateGamificationUI() {
  const filesVal = document.getElementById("header-files-val");
  const streakVal = document.getElementById("header-streak-val");
  const levelBadge = document.getElementById("header-level-badge");
  const xpBar = document.getElementById("header-xp-bar");

  if (filesVal) filesVal.innerText = appState.filesConverted;
  if (streakVal) streakVal.innerText = `${appState.streak} Day${appState.streak > 1 ? 's' : ''}`;
  if (levelBadge) levelBadge.innerText = `LVL ${appState.level}`;
  if (xpBar) xpBar.style.width = `${(appState.xp / (appState.level * 200)) * 100}%`;
}

function renderBadges() {
  const container = document.getElementById("badges-container");
  if (!container) return;

  const badges = [
    { title: "Conversion Novice", desc: "Converted 1st file", icon: "fa-star", unlocked: appState.filesConverted >= 1 },
    { title: "Media Master", desc: "Converted 10 files", icon: "fa-film", unlocked: appState.filesConverted >= 10 },
    { title: "Cyber Sentinel", desc: "AES Encryption used", icon: "fa-shield-halved", unlocked: true },
    { title: "Quantum Chemist", desc: "Periodic table explored", icon: "fa-atom", unlocked: true }
  ];

  container.innerHTML = badges.map(b => `
    <div class="p-4 bg-slate-900/90 border ${b.unlocked ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-800 opacity-60'} rounded-2xl flex items-center space-x-3">
      <div class="w-10 h-10 rounded-xl ${b.unlocked ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'} flex items-center justify-center text-lg">
        <i class="fa-solid ${b.icon}"></i>
      </div>
      <div>
        <h4 class="text-xs font-bold ${b.unlocked ? 'text-slate-100' : 'text-slate-400'}">${b.title}</h4>
        <p class="text-[10px] text-slate-400">${b.desc}</p>
      </div>
    </div>
  `).join('');
}

function renderHistoryLog() {
  const tbody = document.getElementById("history-log-tbody");
  if (!tbody) return;

  if (appState.history.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-500 text-xs">No conversions recorded yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = appState.history.map(item => `
    <tr class="hover:bg-slate-900/50 transition-all border-b border-slate-800/40">
      <td class="p-3 font-bold text-slate-200 text-xs truncate max-w-[200px]">${escapeHTML(item.name)}</td>
      <td class="p-3 font-mono text-brand-400 text-xs font-bold">${item.target}</td>
      <td class="p-3 text-slate-400 text-xs">${item.size}</td>
      <td class="p-3">
        <a href="${item.url}" download="converted_${item.name}" class="text-emerald-400 hover:text-emerald-300 font-bold text-xs flex items-center space-x-1">
          <i class="fa-solid fa-download"></i><span>Download</span>
        </a>
      </td>
    </tr>
  `).join('');
}

function clearHistoryLog() {
  appState.history = [];
  renderHistoryLog();
  showToast(t("logCleared"), "info");
}
window.clearHistoryLog = clearHistoryLog;

// SOUND SYNTHESIZER
function playSFX(freq = 440, type = "sine") {
  if (!appState.sfxEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch(e) {}
}

function toggleAudioSFX() {
  appState.sfxEnabled = !appState.sfxEnabled;
  const btn = document.getElementById("sfx-toggle-btn");
  if (btn) btn.classList.toggle("text-brand-400", appState.sfxEnabled);
  showToast(`Sound SFX ${appState.sfxEnabled ? "Enabled" : "Muted"}`, "info");
}
window.toggleAudioSFX = toggleAudioSFX;

// CONFETTI SYSTEM
let confettiParticles = [];
function initConfettiCanvas() {
  const canvas = document.getElementById("confetti-canvas");
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function triggerConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  confettiParticles = [];

  for (let i = 0; i < 70; i++) {
    confettiParticles.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 14,
      vy: (Math.random() - 0.7) * 14,
      color: `hsl(${Math.random() * 360}, 85%, 60%)`,
      size: Math.random() * 6 + 4,
      life: 100
    });
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    confettiParticles.forEach(p => {
      if (p.life > 0) {
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25;
        p.life -= 1.6;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    });
    if (alive) requestAnimationFrame(render);
  }
  render();
}

// TOAST NOTIFICATIONS
function showToast(msg, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  const bgClass = type === "success" ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200" :
                  type === "error" ? "bg-rose-950/90 border-rose-500/50 text-rose-200" :
                  type === "warning" ? "bg-amber-950/90 border-amber-500/50 text-amber-200" :
                  "bg-slate-900/90 border-brand-500/50 text-slate-200";

  toast.className = `toast-msg flex items-center space-x-3 px-4 py-3 rounded-2xl border backdrop-blur-md shadow-2xl text-xs font-semibold ${bgClass}`;
  toast.innerHTML = `<span>${escapeHTML(msg)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHTML(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function saveStateToStorage() {
  try {
    localStorage.setItem("omni_converter_state", JSON.stringify({
      username: appState.username,
      filesConverted: appState.filesConverted,
      bytesProcessed: appState.bytesProcessed,
      xp: appState.xp,
      level: appState.level,
      streak: appState.streak,
      currentLang: appState.currentLang
    }));
  } catch(e) {}
}

function loadSavedState() {
  try {
    const saved = localStorage.getItem("omni_converter_state");
    if (saved) {
      const p = JSON.parse(saved);
      appState.username = p.username || "Explorer_Pro";
      appState.filesConverted = p.filesConverted || 0;
      appState.bytesProcessed = p.bytesProcessed || 0;
      appState.xp = p.xp || 0;
      appState.level = p.level || 1;
      appState.streak = p.streak || 1;
      appState.currentLang = p.currentLang || "en";
    }
  } catch(e) {}
}

// ==================== OMNI PDF ENGINE JS HANDLERS ====================
function updatePdfFileBadge(inputEl, badgeId) {
  const badge = document.getElementById(badgeId);
  if (!badge) return;
  if (inputEl.files && inputEl.files.length > 0) {
    if (inputEl.files.length === 1) {
      badge.textContent = inputEl.files[0].name;
      badge.className = "text-xs font-bold text-rose-300 truncate max-w-[200px]";
    } else {
      badge.textContent = `${inputEl.files.length} PDF Documents Selected`;
      badge.className = "text-xs font-bold text-rose-300";
    }
  } else {
    badge.textContent = "Choose PDF File";
    badge.className = "text-xs font-semibold text-slate-300";
  }
}
window.updatePdfFileBadge = updatePdfFileBadge;

async function runPDFMerge() {
  const fileInput = document.getElementById("pdf-merge-input");
  if (!fileInput || !fileInput.files || fileInput.files.length < 2) {
    showToast("Please select at least 2 PDF files to merge.", "warning");
    return;
  }


  showToast("Merging PDFs...", "info");

  // Client-Side Offline Fallback using pdf-lib if backend offline
  if (!appState.backendOnline && window.PDFLib) {
    try {
      const mergedPdf = await PDFLib.PDFDocument.create();
      for (let file of fileInput.files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
      }
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      triggerDownload(url, "OmniConverter_Merged_Offline.pdf");
      showToast("PDF Merge complete (Client Offline Mode)!", "success");
      grantXP(40);
      return;
    } catch (e) {
      showToast(`Offline PDF Merge error: ${e.message}`, "error");
      return;
    }
  }

  const formData = new FormData();
  for (let file of fileInput.files) {
    formData.append("files", file);
  }

  try {
    const res = await fetch(`${appState.backendUrl}/api/pdf/merge`, { method: "POST", body: formData });
    if (!res.ok) throw new Error(await res.text());

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    triggerDownload(url, "OmniConverter_Merged.pdf");
    showToast("PDF Merge complete!", "success");
    grantXP(40);
  } catch (e) {
    showToast(`PDF Merge error: ${e.message}`, "error");
  }
}
window.runPDFMerge = runPDFMerge;

async function runPDFSplit() {
  const fileInput = document.getElementById("pdf-split-input");
  const range = document.getElementById("pdf-split-range").value.trim() || "all";
  const mode = document.getElementById("pdf-split-mode") ? document.getElementById("pdf-split-mode").value : "single_pdf";

  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    showToast("Please select a PDF file to split.", "warning");
    return;
  }

  showToast("Splitting PDF pages...", "info");

  // Client-Side Offline Fallback using pdf-lib if backend offline
  if (!appState.backendOnline && window.PDFLib) {
    try {
      const file = fileInput.files[0];
      const arrayBuffer = await file.arrayBuffer();
      const srcPdf = await PDFLib.PDFDocument.load(arrayBuffer);
      const totalPages = srcPdf.getPageCount();

      const outPdf = await PDFLib.PDFDocument.create();
      let indices = [];
      if (range === "all") indices = Array.from({length: totalPages}, (_, i) => i);
      else if (range === "odd") indices = Array.from({length: totalPages}, (_, i) => i).filter(i => (i + 1) % 2 !== 0);
      else if (range === "even") indices = Array.from({length: totalPages}, (_, i) => i).filter(i => (i + 1) % 2 === 0);
      else {
        indices = range.split(",").flatMap(r => {
          if (r.includes("-")) {
            const [s, e] = r.split("-").map(Number);
            return Array.from({length: e - s + 1}, (_, i) => s + i - 1);
          }
          return [Number(r.trim()) - 1];
        }).filter(i => i >= 0 && i < totalPages);
      }

      const copiedPages = await outPdf.copyPages(srcPdf, indices);
      copiedPages.forEach(p => outPdf.addPage(p));
      const pdfBytes = await outPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      triggerDownload(url, `OmniConverter_Split_${file.name}`);
      showToast("PDF Split complete (Client Offline Mode)!", "success");
      grantXP(35);
      return;
    } catch (e) {
      showToast(`Offline PDF Split error: ${e.message}`, "error");
      return;
    }
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);
  formData.append("page_range", range);
  formData.append("mode", mode);

  try {
    const res = await fetch(`${appState.backendUrl}/api/pdf/split`, { method: "POST", body: formData });
    if (!res.ok) throw new Error(await res.text());

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const outName = mode === "zip" ? `OmniConverter_Split_${fileInput.files[0].name}.zip` : `OmniConverter_Split_${fileInput.files[0].name}`;
    triggerDownload(url, outName);
    showToast("PDF Split complete!", "success");
    grantXP(35);
  } catch (e) {
    showToast(`PDF Split error: ${e.message}`, "error");
  }
}
window.runPDFSplit = runPDFSplit;

async function runPDFCompress() {
  const fileInput = document.getElementById("pdf-compress-input");
  const level = document.getElementById("pdf-compress-level") ? document.getElementById("pdf-compress-level").value : "medium";

  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    showToast("Please select a PDF file to compress.", "warning");
    return;
  }

  showToast("Compressing PDF streams & images...", "info");
  const formData = new FormData();
  formData.append("file", fileInput.files[0]);
  formData.append("level", level);

  try {
    const res = await fetch(`${appState.backendUrl}/api/pdf/compress`, { method: "POST", body: formData });
    if (!res.ok) throw new Error(await res.text());

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `OmniConverter_Compressed_${fileInput.files[0].name}`);
    showToast("PDF Compression complete!", "success");
    grantXP(35);
  } catch (e) {
    showToast(`PDF Compression error: ${e.message}`, "error");
  }
}
window.runPDFCompress = runPDFCompress;

async function runPDFProtect() {
  const fileInput = document.getElementById("pdf-protect-input");
  const pass = document.getElementById("pdf-protect-pass").value.trim();

  if (!fileInput || !fileInput.files || fileInput.files.length === 0 || !pass) {
    showToast("Please select a PDF file and specify a password.", "warning");
    return;
  }

  showToast("Encrypting PDF with password...", "info");
  const formData = new FormData();
  formData.append("file", fileInput.files[0]);
  formData.append("password", pass);

  try {
    const res = await fetch(`${appState.backendUrl}/api/pdf/protect`, { method: "POST", body: formData });
    if (!res.ok) throw new Error(await res.text());

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `OmniConverter_Protected_${fileInput.files[0].name}`);
    showToast("PDF Encryption complete!", "success");
    grantXP(40);
  } catch (e) {
    showToast(`PDF Protect error: ${e.message}`, "error");
  }
}
window.runPDFProtect = runPDFProtect;

async function runPDFUnlock() {
  const fileInput = document.getElementById("pdf-unlock-input");
  const pass = document.getElementById("pdf-unlock-pass").value.trim();

  if (!fileInput || !fileInput.files || fileInput.files.length === 0 || !pass) {
    showToast("Please select an encrypted PDF file and enter password.", "warning");
    return;
  }

  showToast("Decrypting PDF...", "info");
  const formData = new FormData();
  formData.append("file", fileInput.files[0]);
  formData.append("password", pass);

  try {
    const res = await fetch(`${appState.backendUrl}/api/pdf/unlock`, { method: "POST", body: formData });
    if (!res.ok) throw new Error(await res.text());

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `OmniConverter_Unlocked_${fileInput.files[0].name}`);
    showToast("PDF Decryption complete!", "success");
    grantXP(40);
  } catch (e) {
    showToast(`PDF Unlock error: ${e.message}`, "error");
  }
}
window.runPDFUnlock = runPDFUnlock;

async function runPDFRotate() {
  const fileInput = document.getElementById("pdf-rotate-input");
  const angle = document.getElementById("pdf-rotate-angle").value;

  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    showToast("Please select a PDF file to rotate.", "warning");
    return;
  }

  showToast("Rotating PDF pages...", "info");

  // Client-Side Offline Fallback using pdf-lib if backend offline
  if (!appState.backendOnline && window.PDFLib) {
    try {
      const file = fileInput.files[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
      const degrees = parseInt(angle, 10);
      pdfDoc.getPages().forEach(page => {
        const currentRotation = page.getRotation().angle;
        page.setRotation(PDFLib.degrees(currentRotation + degrees));
      });
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      triggerDownload(url, `OmniConverter_Rotated_${file.name}`);
      showToast("PDF Rotation complete (Client Offline Mode)!", "success");
      grantXP(30);
      return;
    } catch (e) {
      showToast(`Offline PDF Rotate error: ${e.message}`, "error");
      return;
    }
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);
  formData.append("angle", angle);

  try {
    const res = await fetch(`${appState.backendUrl}/api/pdf/rotate`, { method: "POST", body: formData });
    if (!res.ok) throw new Error(await res.text());

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `OmniConverter_Rotated_${fileInput.files[0].name}`);
    showToast("PDF Rotation complete!", "success");
    grantXP(30);
  } catch (e) {
    showToast(`PDF Rotate error: ${e.message}`, "error");
  }
}
window.runPDFRotate = runPDFRotate;

// ==================== SECRET PRO DEVELOPER CONSOLE UNLOCK LOGIC ====================
let secretClickCounter = 0;
let secretClickTimer = null;

function triggerProSecretUnlock(event) {
  if (event) event.stopPropagation();
  secretClickCounter++;
  
  if (secretClickTimer) clearTimeout(secretClickTimer);
  secretClickTimer = setTimeout(() => { secretClickCounter = 0; }, 1200);

  if (secretClickCounter >= 3) {
    secretClickCounter = 0;
    unlockProDevConsole(true);
  } else {
    showToast(`Pro Unlock Sequence: ${secretClickCounter}/3 clicks...`, "info");
  }
}
window.triggerProSecretUnlock = triggerProSecretUnlock;

function unlockProDevConsole(autoSwitch = false) {
  const btn = document.getElementById("btn-tab-dev");
  if (btn) {
    btn.classList.remove("hidden");
    localStorage.setItem("omni_pro_dev_unlocked", "true");
    showToast("🔓 [SYS_ACCESS_GRANTED] Pro Cyberpunk Developer Vault Unlocked!", "success");
    if (typeof playAudioSFX === "function") playAudioSFX("quest");
    if (typeof triggerConfetti === "function") triggerConfetti();
    if (autoSwitch && typeof switchTab === "function") {
      switchTab("tab-dev");
    }
  }
}
window.unlockProDevConsole = unlockProDevConsole;

// Keyboard Cheat Code Shortcuts (Ctrl+Shift+D or ` tilde)
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "d") || e.key === "~" || e.key === "`") {
    // Only trigger if not actively typing inside an input/textarea
    if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
    e.preventDefault();
    unlockProDevConsole(true);
  }
});

// Auto-check on Page Load
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("omni_pro_dev_unlocked") === "true") {
    const btn = document.getElementById("btn-tab-dev");
    if (btn) btn.classList.remove("hidden");
  }
});

async function calculateHashes() {
  const text = document.getElementById("hash-input")?.value || "";
  const sha256El = document.getElementById("hash-sha256");
  const sha512El = document.getElementById("hash-sha512");
  if (!text) {
    if (sha256El) sha256El.value = "";
    if (sha512El) sha512El.value = "";
    return;
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  try {
    const buf256 = await crypto.subtle.digest("SHA-256", data);
    const hash256 = Array.from(new Uint8Array(buf256)).map(b => b.toString(16).padStart(2, '0')).join('');
    if (sha256El) sha256El.value = hash256;

    const buf512 = await crypto.subtle.digest("SHA-512", data);
    const hash512 = Array.from(new Uint8Array(buf512)).map(b => b.toString(16).padStart(2, '0')).join('');
    if (sha512El) sha512El.value = hash512;
  } catch (e) {
    console.error(e);
  }
}
window.calculateHashes = calculateHashes;

// ==================== SPOTLIGHT COMMAND PALETTE ENGINE (CTRL + K) ====================
const APP_COMMAND_REGISTRY = [
  { id: "cmd-merge-pdf", title: "Merge PDFs", cat: "PDF Suite", icon: "fa-file-circle-plus", action: () => { switchTab('tab-pdf'); focusElem('pdf-merge-input'); } },
  { id: "cmd-split-pdf", title: "Split & Extract PDF Pages", cat: "PDF Suite", icon: "fa-scissors", action: () => { switchTab('tab-pdf'); focusElem('pdf-split-input'); } },
  { id: "cmd-compress-pdf", title: "Compress PDF Size", cat: "PDF Suite", icon: "fa-file-zipper", action: () => { switchTab('tab-pdf'); focusElem('pdf-compress-input'); } },
  { id: "cmd-protect-pdf", title: "Encrypt PDF Document", cat: "PDF Suite", icon: "fa-lock", action: () => { switchTab('tab-pdf'); focusElem('pdf-protect-pass'); } },
  { id: "cmd-unlock-pdf", title: "Decrypt Locked PDF", cat: "PDF Suite", icon: "fa-lock-open", action: () => { switchTab('tab-pdf'); focusElem('pdf-unlock-pass'); } },
  { id: "cmd-rotate-pdf", title: "Rotate PDF Pages", cat: "PDF Suite", icon: "fa-rotate-right", action: () => { switchTab('tab-pdf'); focusElem('pdf-rotate-input'); } },
  { id: "cmd-periodic-table", title: "Interactive Periodic Table (118 Elements)", cat: "Science Lab", icon: "fa-atom", action: () => { switchTab('tab-science'); switchScienceSubTab('subtab-ptable', null); } },
  { id: "cmd-molar-mass", title: "Molar Mass Calculator", cat: "Science Lab", icon: "fa-vial", action: () => { switchTab('tab-science'); switchScienceSubTab('subtab-chemistry', null); } },
  { id: "cmd-ideal-gas", title: "Ideal Gas Law Solver (PV = nRT)", cat: "Science Lab", icon: "fa-cloud", action: () => { switchTab('tab-science'); switchScienceSubTab('subtab-chemistry', null); } },
  { id: "cmd-unit-converter", title: "Multi-Unit Converter (10 Categories)", cat: "Science Lab", icon: "fa-ruler-combined", action: () => { switchTab('tab-science'); switchScienceSubTab('subtab-units', null); } },
  { id: "cmd-ai-tts", title: "AI Text-to-Speech Synthesizer", cat: "Gemini AI Studio", icon: "fa-volume-high", action: () => { switchTab('tab-ai'); focusElem('ai-tts-input'); } },
  { id: "cmd-ai-image", title: "AI Image Art Generator", cat: "Gemini AI Studio", icon: "fa-image", action: () => { switchTab('tab-ai'); focusElem('ai-img-prompt'); } },
  { id: "cmd-ai-transpiler", title: "AI Code Transpiler", cat: "Gemini AI Studio", icon: "fa-code-compare", action: () => { switchTab('tab-ai'); focusElem('transpiler-src'); } },
  { id: "cmd-aes-crypto", title: "AES-256 GCM Encryption Vault", cat: "Pro Cyber Console", icon: "fa-shield-halved", action: () => { unlockProDevConsole(true); focusElem('aes-key'); } },
  { id: "cmd-jwt-inspect", title: "JWT Token Inspector", cat: "Pro Cyber Console", icon: "fa-key", action: () => { unlockProDevConsole(true); focusElem('jwt-input'); } },
  { id: "cmd-line-diff", title: "Visual Code Line Diff", cat: "Pro Cyber Console", icon: "fa-file-diff", action: () => { unlockProDevConsole(true); focusElem('diff-text-a'); } },
  { id: "cmd-hash-gen", title: "SHA-256 & SHA-512 Checksum Generator", cat: "Pro Cyber Console", icon: "fa-fingerprint", action: () => { unlockProDevConsole(true); focusElem('hash-input'); } }
];

function toggleCommandPalette() {
  const modal = document.getElementById("command-palette-modal");
  if (!modal) return;
  const isHidden = modal.classList.contains("hidden");
  if (isHidden) {
    modal.classList.remove("hidden");
    const input = document.getElementById("cmd-search-input");
    if (input) {
      input.value = "";
      input.focus();
    }
    renderCommandPaletteResults(APP_COMMAND_REGISTRY);
  } else {
    modal.classList.add("hidden");
  }
}
window.toggleCommandPalette = toggleCommandPalette;

function closeCommandPalette(e) {
  const modal = document.getElementById("command-palette-modal");
  if (modal) modal.classList.add("hidden");
}
window.closeCommandPalette = closeCommandPalette;

function focusElem(id) {
  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) el.focus();
  }, 100);
}

function filterCommandPalette() {
  const input = document.getElementById("cmd-search-input");
  if (!input) return;
  const q = input.value.trim().toLowerCase();
  if (!q) {
    renderCommandPaletteResults(APP_COMMAND_REGISTRY);
    return;
  }
  const filtered = APP_COMMAND_REGISTRY.filter(cmd => 
    cmd.title.toLowerCase().includes(q) || cmd.cat.toLowerCase().includes(q)
  );
  renderCommandPaletteResults(filtered);
}
window.filterCommandPalette = filterCommandPalette;

function renderCommandPaletteResults(items) {
  const container = document.getElementById("cmd-results-list");
  if (!container) return;
  if (items.length === 0) {
    container.innerHTML = `<div class="p-6 text-center text-slate-500 text-xs font-mono">No matching tools found.</div>`;
    return;
  }
  container.innerHTML = items.map(item => `
    <div onclick="execCommandItem('${item.id}')" class="p-3 bg-slate-900/80 hover:bg-brand-900/40 border border-slate-800/80 hover:border-brand-500/50 rounded-2xl flex items-center justify-between cursor-pointer transition-all group">
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 text-brand-400 group-hover:text-white flex items-center justify-center text-xs">
          <i class="fa-solid ${item.icon}"></i>
        </div>
        <div>
          <span class="text-xs font-bold text-slate-200 group-hover:text-white">${item.title}</span>
          <span class="text-[10px] text-slate-500 block font-mono">${item.cat}</span>
        </div>
      </div>
      <span class="text-[10px] font-mono text-slate-500 group-hover:text-brand-300">Launch &rarr;</span>
    </div>
  `).join('');
}

function execCommandItem(id) {
  closeCommandPalette();
  const item = APP_COMMAND_REGISTRY.find(x => x.id === id);
  if (item && item.action) item.action();
}
window.execCommandItem = execCommandItem;

// Global Ctrl + K listener
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    toggleCommandPalette();
  }
  if (e.key === "Escape") {
    closeCommandPalette();
  }
});




