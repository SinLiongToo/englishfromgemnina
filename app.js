// =========================================================
// Gemini 英文怎麼說 - 核心互動邏輯 (App.js)
// =========================================================

// 本地存儲 Key
const STORAGE_KEY_MASTERED = 'gemini_en_mastered_v1';
const STORAGE_KEY_STARRED = 'gemini_en_starred_v1';
const STORAGE_KEY_ENGLISH_ONLY = 'gemini_en_english_only_v1';
const STORAGE_KEY_PLAY_MODE = 'gemini_en_play_mode_v1';
const STORAGE_KEY_THEME = 'gemini_en_theme';

// 狀態變數
let topicsData = window.TOPICS_DATA || [];
let userMastered = JSON.parse(localStorage.getItem(STORAGE_KEY_MASTERED) || '[]');
let userStarred = JSON.parse(localStorage.getItem(STORAGE_KEY_STARRED) || '[]');
let isEnglishOnlyMode = (localStorage.getItem(STORAGE_KEY_ENGLISH_ONLY) === 'true');
let autoPlayMode = localStorage.getItem(STORAGE_KEY_PLAY_MODE) || 'english_only'; // 'english_only' | 'bilingual_flip'

let currentSourceFilter = 'ALL'; // 'ALL' | 'Gemini' | 'ChatGPT'
let activeCardPool = [];
let currentCardIndex = 0;
let isFlipped = false;
let isAutoPlaying = false;
let autoPlayTimeoutId = null;
let sentenceDelaySec = 1.2;

// 語音相關變數
let availableVoices = [];
let selectedVoice = null;
let speechRate = 1.0;

// =========================================================
// 初始化
// =========================================================
window.addEventListener('DOMContentLoaded', () => {
  // 檢查資料
  if (!topicsData || activeCardPool.length === 0) {
    if (window.TOPICS_DATA && window.TOPICS_DATA.length > 0) {
      topicsData = window.TOPICS_DATA;
    }
  }

  initTheme();
  initVoices();
  applyEnglishOnlyUI();
  updatePlayModeUI();
  updateSourceFilterUI();
  updateActiveCardPool();
  renderStats();
  renderCurrentCard();
  renderList(topicsData);
  startNewQuiz();

  // 鍵盤操作監聽
  window.addEventListener('keydown', (e) => {
    const activeView = document.querySelector('.view-panel:not(.hidden)')?.id;
    if (activeView === 'view-flashcards') {
      if (e.code === 'Space') {
        e.preventDefault();
        flipCard();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        nextCard();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        prevCard();
      }
    }
  });
});


// =========================================================
// 來源過濾器 (Source Filter: ALL / Gemini / ChatGPT)
// =========================================================
function setSourceFilter(source) {
  currentSourceFilter = source;
  updateSourceFilterUI();
  updateActiveCardPool();
  currentCardIndex = 0;
  if (isFlipped && autoPlayMode !== 'english_only') flipCard();
  renderCurrentCard();
  filterList();
  startNewQuiz();

  if (isAutoPlaying) {
    stopAutoPlay();
    startAutoPlay();
  }
}

function updateActiveCardPool() {
  if (currentSourceFilter === 'ALL') {
    activeCardPool = topicsData.slice();
  } else {
    activeCardPool = topicsData.filter(t => t.source === currentSourceFilter);
  }
  if (activeCardPool.length === 0) activeCardPool = topicsData.slice();
}

function updateSourceFilterUI() {
  const countAll = topicsData.length;
  const countGemini = topicsData.filter(t => t.source === 'Gemini').length;
  const countChatGPT = topicsData.filter(t => t.source === 'ChatGPT').length;

  document.querySelectorAll('.source-pill-btn').forEach(btn => {
    const src = btn.dataset.source;
    if (src === 'ALL') btn.innerHTML = `🌐 全部收錄 (${countAll} 則)`;
    else if (src === 'Gemini') btn.innerHTML = `🤖 Gemini 精選 (${countGemini} 則)`;
    else if (src === 'ChatGPT') btn.innerHTML = `💬 ChatGPT 實戰 (${countChatGPT} 則)`;

    if (src === currentSourceFilter) {
      btn.className = 'source-pill-btn px-3 py-1.5 text-xs font-bold rounded-xl transition bg-indigo-600 text-white shadow';
    } else {
      btn.className = 'source-pill-btn px-3 py-1.5 text-xs font-medium rounded-xl transition text-slate-400 hover:text-white bg-slate-800/80 border border-white/5';
    }
  });

  const srcSelect = document.getElementById('source-filter');
  if (srcSelect) srcSelect.value = currentSourceFilter;
}

// =========================================================
// 主題切換 (Theme)
// =========================================================
function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY_THEME);
  const icon = document.getElementById('theme-icon');
  if (saved === 'light') {
    document.documentElement.classList.remove('dark');
    if (icon) icon.innerText = '☀️';
  } else {
    document.documentElement.classList.add('dark');
    if (icon) icon.innerText = '🌙';
  }
}

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.classList.contains('dark');
  const icon = document.getElementById('theme-icon');
  if (isDark) {
    html.classList.remove('dark');
    localStorage.setItem(STORAGE_KEY_THEME, 'light');
    if (icon) icon.innerText = '☀️';
  } else {
    html.classList.add('dark');
    localStorage.setItem(STORAGE_KEY_THEME, 'dark');
    if (icon) icon.innerText = '🌙';
  }
}

// =========================================================
// 單獨英文模式 (English-Only Mode)
// =========================================================
function toggleEnglishOnlyMode() {
  isEnglishOnlyMode = !isEnglishOnlyMode;
  localStorage.setItem(STORAGE_KEY_ENGLISH_ONLY, isEnglishOnlyMode);
  applyEnglishOnlyUI();
}

function applyEnglishOnlyUI() {
  const navBtn = document.getElementById('btn-english-only-nav');
  const navText = document.getElementById('nav-en-text');
  if (isEnglishOnlyMode) {
    document.body.classList.add('english-only-mode');
    if (navBtn) {
      navBtn.classList.add('bg-indigo-600', 'text-white', 'border-indigo-400');
      navBtn.classList.remove('bg-slate-800', 'text-slate-300');
    }
    if (navText) navText.innerText = '單獨英文：開 (純英)';
  } else {
    document.body.classList.remove('english-only-mode');
    if (navBtn) {
      navBtn.classList.remove('bg-indigo-600', 'text-white', 'border-indigo-400');
      navBtn.classList.add('bg-slate-800', 'text-slate-300');
    }
    if (navText) navText.innerText = '單獨英文：關';
  }
}

// =========================================================
// 視圖切換 (View Tabs)
// =========================================================
function switchView(viewName) {
  document.querySelectorAll('.view-panel').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('bg-indigo-600', 'text-white', 'shadow');
    btn.classList.add('text-slate-400');
  });

  const target = document.getElementById('view-' + viewName);
  const tab = document.getElementById('tab-' + viewName);
  if (target) target.classList.remove('hidden');
  if (tab) {
    tab.classList.add('bg-indigo-600', 'text-white', 'shadow');
    tab.classList.remove('text-slate-400');
  }

  // 離開卡牌視圖時暫停自動播放
  if (viewName !== 'flashcards' && isAutoPlaying) {
    stopAutoPlay();
  }
}

// =========================================================
// 語音合成引擎 (Web Speech API)
// =========================================================
function initVoices() {
  if (!('speechSynthesis' in window)) return;

  const populate = () => {
    availableVoices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
    const select = document.getElementById('voice-select');
    if (select) {
      select.innerHTML = '';
      availableVoices.forEach((v, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.innerText = v.name + ' (' + v.lang + ')';
        if ((v.lang === 'en-US' && v.name.includes('Google')) || (v.lang === 'en-US' && v.default) || idx === 0) {
          opt.selected = true;
          selectedVoice = v;
        }
        select.appendChild(opt);
      });
      select.onchange = (e) => {
        selectedVoice = availableVoices[e.target.value];
      };
    }
  };

  populate();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = populate;
  }
}

function cleanSpeechText(text) {
  if (!text) return '';
  return text.replace(/\[[^\]]*\]/g, '').split('/').join(', ').split('\\').join(', ').trim();
}

function speakText(text) {
  if (!('speechSynthesis' in window)) {
    alert('您的瀏覽器不支援語音朗讀。');
    return;
  }
  window.speechSynthesis.cancel();
  const clean = cleanSpeechText(text);
  const utter = new SpeechSynthesisUtterance(clean);
  utter.rate = speechRate;
  if (selectedVoice) utter.voice = selectedVoice;
  else utter.lang = 'en-US';
  window.speechSynthesis.speak(utter);
}

function speakPromise(text) {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();
    const clean = cleanSpeechText(text);
    const utter = new SpeechSynthesisUtterance(clean);
    utter.rate = speechRate;
    if (selectedVoice) utter.voice = selectedVoice;
    else utter.lang = 'en-US';

    utter.onend = () => resolve();
    utter.onerror = () => resolve();

    window.speechSynthesis.speak(utter);
  });
}

function speakTopicCore(topicId) {
  const topic = topicsData.find(t => t.id === topicId);
  if (topic) speakText(topic.core_expression);
}

function speakTopicExample(topicId, exIdx) {
  const topic = topicsData.find(t => t.id === topicId);
  if (topic && topic.examples && topic.examples[exIdx]) {
    speakText(topic.examples[exIdx].en);
  }
}

function updateRateLabel(val) {
  speechRate = parseFloat(val);
  document.getElementById('rate-value').innerText = speechRate.toFixed(1) + 'x';
}

function updateIntervalLabel(val) {
  sentenceDelaySec = parseFloat(val);
  document.getElementById('interval-value').innerText = sentenceDelaySec.toFixed(1) + ' 秒';
}

function testSpeech() {
  speakText('Hindsight is twenty twenty. Knowledge is power.');
}

// =========================================================
// 統計看板 (Stats)
// =========================================================
function renderStats() {
  const total = activeCardPool.length;
  const mastered = userMastered.length;
  const starred = userStarred.length;
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;

  const elTotal = document.getElementById('stat-total');
  const elMastered = document.getElementById('stat-mastered');
  const elStarred = document.getElementById('stat-starred');
  const elProgress = document.getElementById('stat-progress');

  if (elTotal) elTotal.innerText = total;
  if (elMastered) elMastered.innerText = mastered;
  if (elStarred) elStarred.innerText = starred;
  if (elProgress) elProgress.innerText = pct + '%';
}

// =========================================================
// 3D 卡牌翻轉與切換 (Flashcards)
// =========================================================
function flipCard() {
  const inner = document.getElementById('flashcard-inner');
  isFlipped = !isFlipped;
  if (inner) {
    if (isFlipped) {
      inner.classList.add('card-flipped');
    } else {
      inner.classList.remove('card-flipped');
      clearSpeakingHighlights();
    }
  }
}

function nextCard() {
  clearAutoPlayTimers();
  if (isFlipped && autoPlayMode !== 'english_only') flipCard();
  currentCardIndex = (currentCardIndex + 1) % activeCardPool.length;
  renderCurrentCard();
  if (isAutoPlaying) {
    runAutoPlayCycle();
  }
}

function prevCard() {
  clearAutoPlayTimers();
  if (isFlipped && autoPlayMode !== 'english_only') flipCard();
  currentCardIndex = (currentCardIndex - 1 + activeCardPool.length) % activeCardPool.length;
  renderCurrentCard();
  if (isAutoPlaying) {
    runAutoPlayCycle();
  }
}

function renderCurrentCard() {
  const topic = activeCardPool[currentCardIndex];
  if (!topic) return;

  const catBadge = document.getElementById('card-category-badge');
  const srcBadge = document.getElementById('card-source-badge');
  const idxInd = document.getElementById('card-index-indicator');

  if (srcBadge) {
    if (topic.source === 'ChatGPT') {
      srcBadge.innerHTML = '💬 ChatGPT 職場實戰';
      srcBadge.className = 'text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
    } else {
      srcBadge.innerHTML = '🤖 Gemini 精選表達';
      srcBadge.className = 'text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30';
    }
  }
  if (catBadge) catBadge.innerText = topic.category;
  if (idxInd) idxInd.innerText = (currentCardIndex + 1) + ' / ' + activeCardPool.length;

  // 正面
  const qFront = document.getElementById('card-query-front');
  const ctxFront = document.getElementById('card-context-front');
  if (qFront) qFront.innerText = topic.query;
  if (ctxFront) ctxFront.innerText = topic.context;

  const kwBox = document.getElementById('card-keywords-front');
  if (kwBox) {
    kwBox.innerHTML = '';
    topic.keywords.forEach(kw => {
      const span = document.createElement('span');
      span.className = 'px-2.5 py-1 text-xs rounded-lg bg-slate-800 text-slate-300 border border-white/5 font-mono';
      span.innerText = kw;
      kwBox.appendChild(span);
    });
  }

  // 背面
  const coreBack = document.getElementById('card-core-back');
  const expBack = document.getElementById('card-explanation-back');
  if (coreBack) coreBack.innerText = topic.core_expression;
  if (expBack) expBack.innerText = topic.explanation;

  const exBox = document.getElementById('card-examples-back');
  if (exBox) {
    exBox.innerHTML = '';
    topic.examples.forEach((ex, idx) => {
      const item = document.createElement('div');
      item.id = 'example-item-' + idx;
      item.className = 'example-card-item p-2.5 rounded-2xl bg-slate-800/60 border border-white/5 flex items-start justify-between gap-3 group hover:border-indigo-500/30 transition';
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'flex-1';
      contentDiv.innerHTML = `
        <div class="flex items-center gap-2 mb-0.5">
          <span class="text-xs font-bold text-indigo-400">${idx + 1}.</span>
          <p class="text-xs sm:text-sm font-semibold text-white tracking-wide leading-snug">${ex.en}</p>
        </div>
        <p class="text-xs text-slate-300 pl-4 zh-translation">${ex.zh}</p>
        ${ex.note ? `<p class="text-[11px] text-slate-500 pl-4 mt-0.5">📌 ${ex.note}</p>` : ''}
      `;

      const btn = document.createElement('button');
      btn.className = 'p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition';
      btn.title = '朗讀此句';
      btn.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      `;
      btn.onclick = (e) => {
        e.stopPropagation();
        speakTopicExample(topic.id, idx);
      };

      item.appendChild(contentDiv);
      item.appendChild(btn);
      exBox.appendChild(item);
    });
  }

  // 更新收藏與精通狀態按鈕
  const isMastered = userMastered.includes(topic.id);
  const isStarred = userStarred.includes(topic.id);

  const masterIcon = document.getElementById('master-icon');
  const masterText = document.getElementById('master-text');
  if (masterIcon && masterText) {
    if (isMastered) {
      masterIcon.innerText = '🟢';
      masterText.innerText = '已精通';
    } else {
      masterIcon.innerText = '⚪';
      masterText.innerText = '未精通';
    }
  }

  const starIcon = document.getElementById('star-icon');
  if (starIcon) {
    if (isStarred) {
      starIcon.classList.add('fill-amber-400', 'text-amber-400');
      starIcon.classList.remove('fill-none');
    } else {
      starIcon.classList.remove('fill-amber-400', 'text-amber-400');
      starIcon.classList.add('fill-none');
    }
  }
}

function toggleStarCurrent() {
  const topic = activeCardPool[currentCardIndex];
  if (!topic) return;
  const idx = userStarred.indexOf(topic.id);
  if (idx >= 0) userStarred.splice(idx, 1);
  else userStarred.push(topic.id);
  localStorage.setItem(STORAGE_KEY_STARRED, JSON.stringify(userStarred));
  renderStats();
  renderCurrentCard();
}

function toggleMasterCurrent() {
  const topic = activeCardPool[currentCardIndex];
  if (!topic) return;
  const idx = userMastered.indexOf(topic.id);
  if (idx >= 0) userMastered.splice(idx, 1);
  else userMastered.push(topic.id);
  localStorage.setItem(STORAGE_KEY_MASTERED, JSON.stringify(userMastered));
  renderStats();
  renderCurrentCard();
}

// =========================================================
// 正在朗讀高亮與輔助
// =========================================================
function highlightSpeaking(elementId) {
  clearSpeakingHighlights();
  const el = document.getElementById(elementId);
  if (el) {
    el.classList.add('active-speaking');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function clearSpeakingHighlights() {
  document.querySelectorAll('.active-speaking').forEach(el => {
    el.classList.remove('active-speaking');
  });
}

function clearAutoPlayTimers() {
  if (autoPlayTimeoutId) {
    clearTimeout(autoPlayTimeoutId);
    autoPlayTimeoutId = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  clearSpeakingHighlights();
}

function sleep(ms) {
  return new Promise(resolve => {
    autoPlayTimeoutId = setTimeout(resolve, ms);
  });
}

// 連讀當前卡片所有英文句子（手動按鈕）
async function playAllEnglishCurrentCard() {
  const topic = activeCardPool[currentCardIndex];
  if (!topic) return;

  const badge = document.getElementById('playing-status-badge');
  if (badge) badge.classList.remove('hidden');

  highlightSpeaking('card-core-container');
  await speakPromise(topic.core_expression);
  await sleep(sentenceDelaySec * 1000);

  for (let i = 0; i < topic.examples.length; i++) {
    highlightSpeaking('example-item-' + i);
    await speakPromise(topic.examples[i].en);
    await sleep(sentenceDelaySec * 1000);
  }

  clearSpeakingHighlights();
  if (badge) badge.classList.add('hidden');
}

// =========================================================
// 自動播放引擎 (Auto-Play)
// =========================================================
function setAutoPlayMode(mode) {
  autoPlayMode = mode;
  localStorage.setItem(STORAGE_KEY_PLAY_MODE, mode);
  updatePlayModeUI();
  const cfgSelect = document.getElementById('cfg-autoplay-mode');
  if (cfgSelect) cfgSelect.value = mode;

  if (isAutoPlaying) {
    stopAutoPlay();
    startAutoPlay();
  }
}

function updatePlayModeUI() {
  const btnEn = document.getElementById('mode-btn-en');
  const btnBi = document.getElementById('mode-btn-bi');
  if (btnEn && btnBi) {
    if (autoPlayMode === 'english_only') {
      btnEn.className = 'px-2.5 py-1 text-xs font-semibold rounded-lg transition bg-indigo-600 text-white shadow';
      btnBi.className = 'px-2.5 py-1 text-xs font-medium rounded-lg transition text-slate-400 hover:text-white';
    } else {
      btnBi.className = 'px-2.5 py-1 text-xs font-semibold rounded-lg transition bg-indigo-600 text-white shadow';
      btnEn.className = 'px-2.5 py-1 text-xs font-medium rounded-lg transition text-slate-400 hover:text-white';
    }
  }
}

function toggleAutoPlay() {
  if (isAutoPlaying) {
    stopAutoPlay();
  } else {
    startAutoPlay();
  }
}

function startAutoPlay() {
  isAutoPlaying = true;
  const btn = document.getElementById('btn-autoplay');
  const icon = document.getElementById('autoplay-icon');
  const text = document.getElementById('autoplay-text');
  if (icon) icon.innerText = '⏸️';
  if (text) text.innerText = '暫停播放';
  if (btn) btn.classList.add('pulse-glow');

  const badge = document.getElementById('playing-status-badge');
  if (badge) badge.classList.remove('hidden');

  runAutoPlayCycle();
}

function stopAutoPlay() {
  isAutoPlaying = false;
  clearAutoPlayTimers();
  const btn = document.getElementById('btn-autoplay');
  const icon = document.getElementById('autoplay-icon');
  const text = document.getElementById('autoplay-text');
  if (icon) icon.innerText = '▶️';
  if (text) text.innerText = '自動播放';
  if (btn) btn.classList.remove('pulse-glow');

  const badge = document.getElementById('playing-status-badge');
  if (badge) badge.classList.add('hidden');
  clearSpeakingHighlights();
}

async function runAutoPlayCycle() {
  if (!isAutoPlaying) return;
  const topic = activeCardPool[currentCardIndex];
  if (!topic) return;

  if (autoPlayMode === 'english_only') {
    // 【純英文模式】：翻到背面停留在英文解答，依序朗讀核心與4組例句，再切換下一張
    if (!isFlipped) {
      flipCard();
    }

    highlightSpeaking('card-core-container');
    await speakPromise(topic.core_expression);
    if (!isAutoPlaying) return;
    await sleep(sentenceDelaySec * 1000);
    if (!isAutoPlaying) return;

    for (let i = 0; i < topic.examples.length; i++) {
      if (!isAutoPlaying) return;
      highlightSpeaking('example-item-' + i);
      await speakPromise(topic.examples[i].en);
      if (!isAutoPlaying) return;
      await sleep(sentenceDelaySec * 1000);
    }

    clearSpeakingHighlights();
    if (!isAutoPlaying) return;

    autoPlayTimeoutId = setTimeout(() => {
      if (isAutoPlaying) {
        currentCardIndex = (currentCardIndex + 1) % activeCardPool.length;
        renderCurrentCard();
        runAutoPlayCycle();
      }
    }, 1000);

  } else {
    // 【雙語思考模式】：正面先停留思考，翻面朗讀英文核心與精選例句，然後下一題
    if (isFlipped) {
      flipCard();
    }

    await sleep(3500);
    if (!isAutoPlaying) return;

    flipCard();
    await sleep(400);

    highlightSpeaking('card-core-container');
    await speakPromise(topic.core_expression);
    if (!isAutoPlaying) return;
    await sleep(sentenceDelaySec * 1000);

    if (topic.examples && topic.examples[0]) {
      highlightSpeaking('example-item-0');
      await speakPromise(topic.examples[0].en);
      if (!isAutoPlaying) return;
      await sleep(sentenceDelaySec * 1000);
    }

    clearSpeakingHighlights();
    if (!isAutoPlaying) return;

    autoPlayTimeoutId = setTimeout(() => {
      if (isAutoPlaying) {
        currentCardIndex = (currentCardIndex + 1) % activeCardPool.length;
        renderCurrentCard();
        runAutoPlayCycle();
      }
    }, 1500);
  }
}

// =========================================================
// 條列總覽手冊渲染 (List View)
// =========================================================
function renderList(items) {
  const container = document.getElementById('list-container');
  if (!container) return;
  container.innerHTML = '';

  if (items.length === 0) {
    container.innerHTML = `
      <div class="text-center py-16 glass-card rounded-3xl">
        <p class="text-slate-400 text-sm">找不到符合條件的問答項目。</p>
      </div>
    `;
    return;
  }

  items.forEach(t => {
    const card = document.createElement('div');
    card.className = 'glass-card rounded-3xl p-6 sm:p-8 border border-white/10 hover:border-indigo-500/30 transition shadow-xl';

    let synHtml = '';
    if (t.synonyms) {
      t.synonyms.forEach(s => {
        synHtml += `<span class="px-2.5 py-1 text-xs rounded-xl bg-indigo-950/60 text-indigo-300 border border-indigo-500/20"><b>${s.en}</b>：<span class="zh-translation">${s.zh}</span></span> `;
      });
    }

    card.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-4 border-b border-white/10">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs font-bold px-2.5 py-0.5 rounded-full ${t.source === 'ChatGPT' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'}">
            ${t.source === 'ChatGPT' ? '💬 ChatGPT' : '🤖 Gemini'}
          </span>
          <span class="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10">
            #${t.id} ${t.category}
          </span>
          <h3 class="text-lg sm:text-xl font-extrabold text-white">${t.query}</h3>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="speakTopicCore(${t.id})" class="px-3 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-medium flex items-center gap-1 transition">
            <span>🔊</span> 朗讀核心片語
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div class="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20">
          <h4 class="text-xs uppercase tracking-wider text-indigo-400 font-bold mb-1">🎯 核心地道表達</h4>
          <p class="text-lg font-bold text-white mb-2">${t.core_expression}</p>
          <p class="text-xs text-slate-300 leading-relaxed zh-translation">${t.explanation}</p>
        </div>

        <div class="p-4 rounded-2xl bg-slate-800/40 border border-white/5">
          <h4 class="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">💡 適用情境</h4>
          <p class="text-sm text-slate-300 mb-3">${t.context}</p>
          <h4 class="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1.5">🔄 同義與進階補充</h4>
          <div class="flex flex-wrap gap-1.5">${synHtml}</div>
        </div>
      </div>

      <div>
        <h4 class="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">📚 4 組真實實戰例句對照</h4>
        <div class="space-y-2.5" id="list-examples-${t.id}"></div>
      </div>
    `;

    container.appendChild(card);

    // 填充例句按鈕
    const exListContainer = card.querySelector('#list-examples-' + t.id);
    if (exListContainer) {
      t.examples.forEach((ex, idx) => {
        const row = document.createElement('div');
        row.className = 'p-3.5 rounded-2xl bg-slate-800/40 border border-white/5 flex items-start justify-between gap-3';
        row.innerHTML = `
          <div class="flex-1">
            <p class="text-sm sm:text-base font-semibold text-white tracking-wide">${idx + 1}. ${ex.en}</p>
            <p class="text-xs sm:text-sm text-slate-300 mt-1 zh-translation">${ex.zh}</p>
            ${ex.note ? `<p class="text-xs text-indigo-400 mt-0.5 font-medium">📌 ${ex.note}</p>` : ''}
          </div>
          <button onclick="speakTopicExample(${t.id}, ${idx})" class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/80 transition" title="朗讀此句">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </button>
        `;
        exListContainer.appendChild(row);
      });
    }
  });
}

function filterList() {
  const query = document.getElementById('search-input').value.toLowerCase().trim();
  const cat = document.getElementById('category-filter').value;
  const srcSelect = document.getElementById('source-filter');
  const selectedSource = srcSelect ? srcSelect.value : currentSourceFilter;

  const filtered = topicsData.filter(t => {
    const matchSrc = (selectedSource === 'ALL' || t.source === selectedSource);
    const matchCat = (cat === 'ALL' || t.category === cat);
    if (!matchSrc) return false;
    const matchText = (
      t.query.toLowerCase().includes(query) ||
      t.core_expression.toLowerCase().includes(query) ||
      t.context.toLowerCase().includes(query) ||
      t.explanation.toLowerCase().includes(query) ||
      t.examples.some(e => e.en.toLowerCase().includes(query) || e.zh.toLowerCase().includes(query))
    );
    return matchCat && matchText;
  });
  renderList(filtered);
}

// =========================================================
// 實戰隨堂測驗 (Quiz)
// =========================================================
let quizQuestions = [];
let currentQuizIndex = 0;
let quizScore = 0;

function buildQuizPool() {
  const pool = [];
  const targetPool = activeCardPool.length > 0 ? activeCardPool : topicsData;
  targetPool.forEach(t => {
    const coreClean = t.core_expression.split('/')[0].trim();
    const distractors = targetPool
      .filter(x => x.id !== t.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(x => x.core_expression.split('/')[0].trim());

    const options = [coreClean, ...distractors].sort(() => 0.5 - Math.random());
    pool.push({
      type: 'choice',
      badge: '核心口語四選一',
      prompt: '當你想詢問或表達「' + t.query + '」時，最道地的說法是？',
      hint: '情境指引：' + t.context,
      correctAnswer: coreClean,
      options: options,
      explanation: t.query + ' 最經典的英文是：' + t.core_expression + '。' + t.explanation
    });

    if (t.examples && t.examples[0]) {
      const ex = t.examples[0];
      pool.push({
        type: 'sentence',
        badge: '情境例句辨析',
        prompt: '中文句子：「' + ex.zh + '」最道地的英文對應是？',
        hint: '重點單字線索：' + t.keywords.join(', '),
        correctAnswer: ex.en,
        options: [
          ex.en,
          ...targetPool.filter(x => x.id !== t.id).map(x => x.examples[0].en).slice(0, 3)
        ].sort(() => 0.5 - Math.random()),
        explanation: '正解：' + ex.en + '。中文為「' + ex.zh + '」。'
      });
    }
  });
  return pool.sort(() => 0.5 - Math.random()).slice(0, 10);
}

function startNewQuiz() {
  quizQuestions = buildQuizPool();
  currentQuizIndex = 0;
  quizScore = 0;
  const elScore = document.getElementById('quiz-score');
  if (elScore) elScore.innerText = '0 分';
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const q = quizQuestions[currentQuizIndex];
  if (!q) return;

  const counter = document.getElementById('quiz-question-counter');
  const badge = document.getElementById('quiz-badge');
  const prompt = document.getElementById('quiz-prompt');
  const hint = document.getElementById('quiz-hint');

  if (counter) counter.innerText = '第 ' + (currentQuizIndex + 1) + ' / ' + quizQuestions.length + ' 題';
  if (badge) badge.innerText = q.badge;
  if (prompt) prompt.innerText = q.prompt;
  if (hint) hint.innerText = q.hint;

  const optsContainer = document.getElementById('quiz-options');
  const fb = document.getElementById('quiz-feedback');
  const nextBtn = document.getElementById('btn-quiz-next');

  if (optsContainer) optsContainer.innerHTML = '';
  if (fb) fb.classList.add('hidden');
  if (nextBtn) nextBtn.classList.add('hidden');

  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quiz-opt-btn w-full p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-left font-medium text-white border border-white/5 transition flex items-center justify-between group';
    btn.innerHTML = `
      <span>${opt}</span>
      <span class="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-xs group-hover:border-indigo-400">➔</span>
    `;
    btn.onclick = () => handleQuizAnswer(opt, btn);
    if (optsContainer) optsContainer.appendChild(btn);
  });
}

function handleQuizAnswer(selected, targetBtn) {
  const q = quizQuestions[currentQuizIndex];
  const isCorrect = (selected === q.correctAnswer);

  document.querySelectorAll('.quiz-opt-btn').forEach(btn => {
    btn.disabled = true;
    btn.classList.add('opacity-80', 'cursor-not-allowed');
    if (btn.innerText.includes(q.correctAnswer)) {
      btn.classList.remove('bg-slate-800/80');
      btn.classList.add('bg-emerald-600/40', 'border-emerald-500', 'text-emerald-200');
    }
  });

  const fb = document.getElementById('quiz-feedback');
  if (fb) fb.classList.remove('hidden');

  if (isCorrect) {
    quizScore += 10;
    const elScore = document.getElementById('quiz-score');
    if (elScore) elScore.innerText = quizScore + ' 分';
    targetBtn.classList.remove('bg-slate-800/80');
    targetBtn.classList.add('bg-emerald-600/60', 'border-emerald-500');
    if (fb) {
      fb.className = 'p-4 rounded-2xl mb-6 text-sm bg-emerald-950/40 border border-emerald-500/30 text-emerald-200';
      fb.innerHTML = '<b>🎉 答對了！</b><br>' + q.explanation;
    }
    speakText(q.correctAnswer);
  } else {
    targetBtn.classList.remove('bg-slate-800/80');
    targetBtn.classList.add('bg-red-600/60', 'border-red-500');
    if (fb) {
      fb.className = 'p-4 rounded-2xl mb-6 text-sm bg-red-950/40 border border-red-500/30 text-red-200';
      fb.innerHTML = '<b>❌ 答錯了！正確答案是：' + q.correctAnswer + '</b><br>' + q.explanation;
    }
  }

  const nextBtn = document.getElementById('btn-quiz-next');
  if (nextBtn) nextBtn.classList.remove('hidden');
}

function nextQuizQuestion() {
  currentQuizIndex++;
  if (currentQuizIndex < quizQuestions.length) {
    renderQuizQuestion();
  } else {
    showQuizSummary();
  }
}

function showQuizSummary() {
  const optsContainer = document.getElementById('quiz-options');
  if (optsContainer) optsContainer.innerHTML = '';

  const prompt = document.getElementById('quiz-prompt');
  const hint = document.getElementById('quiz-hint');
  if (prompt) prompt.innerText = '測驗完成！最終得分：' + quizScore + ' / ' + (quizQuestions.length * 10) + ' 分';
  if (hint) hint.innerText = quizScore >= 80 ? '太棒了！您對這些英文道地表達已經非常熟稔！' : '建議切換至「3D 卡牌」或「手冊總覽」多複習幾次喔！';

  const fb = document.getElementById('quiz-feedback');
  if (fb) {
    fb.className = 'p-5 rounded-2xl mb-6 text-center text-sm bg-indigo-950/40 border border-indigo-500/30 text-indigo-200';
    fb.innerHTML = `
      <p class="text-2xl mb-2">${quizScore >= 80 ? '🏆 卓越掌握' : '💪 持續精進'}</p>
      <button onclick="startNewQuiz()" class="mt-3 px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg transition">
        再測一次
      </button>
    `;
  }

  const nextBtn = document.getElementById('btn-quiz-next');
  if (nextBtn) nextBtn.classList.add('hidden');
}

// =========================================================
// Modal 與匯出功能
// =========================================================
function toggleVoiceModal() {
  const m = document.getElementById('modal-voice');
  if (m) m.classList.toggle('hidden');
}

function toggleExportModal() {
  const m = document.getElementById('modal-export');
  if (m) m.classList.toggle('hidden');
}

function exportMarkdown() {
  let md = '# 📚 Gemini 英文怎麼說：精選學習筆記\n\n';
  md += '> 收錄您在 Gemini 中詢問過的「英文怎麼說」與完整情境例句。\n\n---\n\n';
  topicsData.forEach(t => {
    md += '## ' + t.id + '. ' + t.query + '\n';
    md += '- **分類**：`' + t.category + '`\n';
    md += '- **核心表達**：**' + t.core_expression + '**\n';
    md += '- **使用情境**：' + t.context + '\n';
    md += '- **詳細解析**：' + t.explanation + '\n\n';
    md += '### 實戰例句：\n';
    t.examples.forEach((ex, idx) => {
      md += (idx + 1) + '. **' + ex.en + '**\n   - 中文：' + ex.zh + '\n   - 註記：' + (ex.note || '實用例句') + '\n';
    });
    md += '\n---\n\n';
  });
  downloadFile(md, 'Gemini_英文怎麼說_學習筆記.md', 'text/markdown;charset=utf-8');
}

function exportAnkiCSV() {
  let csv = 'Front,Back,Tags\n';
  topicsData.forEach(t => {
    let front = '<b>' + t.query + '</b><br><small>' + t.context + '</small>';
    let back = '<h3>' + t.core_expression + '</h3><p>' + t.explanation + '</p><ul>';
    t.examples.forEach(ex => {
      back += '<li><b>' + ex.en + '</b><br>' + ex.zh + '</li>';
    });
    back += '</ul>';
    csv += '"' + front.replace(/"/g, '""') + '","' + back.replace(/"/g, '""') + '","Gemini_English"\n';
  });
  downloadFile(csv, 'Gemini_English_Anki.csv', 'text/csv;charset=utf-8');
}

function exportJSON() {
  downloadFile(JSON.stringify(topicsData, null, 2), 'Gemini_English_Data.json', 'application/json;charset=utf-8');
}

function resetUserData() {
  if (confirm('確定要清空所有精通標記與星號收藏嗎？')) {
    userMastered = [];
    userStarred = [];
    localStorage.removeItem(STORAGE_KEY_MASTERED);
    localStorage.removeItem(STORAGE_KEY_STARRED);
    renderStats();
    renderCurrentCard();
    toggleExportModal();
    alert('已重設學習進度！');
  }
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type: type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
