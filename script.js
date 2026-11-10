// ===== ELEMEN =====
const esa = document.getElementById('esa');
const statusText = document.getElementById('statusText');
const micBtn = document.getElementById('micBtn');
const textForm = document.getElementById('textForm');
const textInput = document.getElementById('textInput');
const answerBox = document.getElementById('answerBox');
const answerText = document.getElementById('answerText');
const answerSpeak = document.getElementById('answerSpeak');
const detailList = document.getElementById('detailList');

const MAX_QUESTION_LENGTH = 300; // harus sama dengan batas di api/ask.js
const MAX_HISTORY_ITEMS = 6;
const IDLE_STATUS = 'Sistem Esa: aktif \u2726';
const SPEAKING_STATUS = 'Sistem Esa: sedang bicara \u2726';

// Kalau dibuka dari Vercel (domain apa pun), pakai alamat yang sama. Selain itu pakai alamat utama.
const ESA_API_URL = /\.vercel\.app$/.test(location.hostname)
  ? '/api/ask'
  : 'https://esa-nu.vercel.app/api/ask';

const SPEAKER_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M3 9v6h4l5 4V5L7 9H3z" fill="currentColor"/>' +
  '<path d="M15.5 8.5a5 5 0 010 7M18 6a8.5 8.5 0 010 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
  '</svg>';

textInput.maxLength = MAX_QUESTION_LENGTH;
answerSpeak.innerHTML = SPEAKER_ICON;

// ===== STATE =====
let isBusy = false;
let chatHistory = [];   // [{ role: 'user' | 'model', text }]
let segments = [];      // [jawaban, lanjutan1, lanjutan2, ...] = urutan baca
let speakToken = 0;
let isSpeaking = false;

// ===== MODE TAMPILAN: awal (robot besar) -> chat (jawaban + lanjutan) =====
function enterChatMode(){
  document.body.classList.remove('mode-idle');
  document.body.classList.add('mode-chat');
}

// ===== EKSPRESI =====
function setExpression(exp){
  esa.classList.remove('happy','thinking','talking','surprised');
  if(exp) esa.classList.add(exp);
}

function resetIdle(){
  esa.classList.remove('talking');
  setExpression(null);
  statusText.textContent = IDLE_STATUS;
}

function cleanMarkdown(text){
  return String(text || '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^\s*[*-]\s+/gm, '')
    .replace(/(^|\s)\*(\S[^*]*?)\*(?=\s|$|[.,!?])/g, '$1$2')
    .replace(/#{1,6}\s?/g, '')
    .replace(/`{1,3}([^`]*)`{1,3}/g, '$1')
    .trim();
}

// ===== TAMPILKAN JAWABAN + LANJUTAN =====
function renderAnswer(jawaban, lanjutan){
  segments = [jawaban, ...lanjutan];

  answerText.textContent = jawaban;
  answerText.scrollTop = 0;
  answerSpeak.disabled = false;

  detailList.innerHTML = '';
  if (!lanjutan.length) {
    const empty = document.createElement('li');
    empty.className = 'detail-empty';
    empty.textContent = 'Belum ada penjelasan lanjutan untuk ini.';
    detailList.appendChild(empty);
    return;
  }

  lanjutan.forEach((text, i) => {
    const li = document.createElement('li');
    li.className = 'detail-item';

    const btn = document.createElement('button');
    btn.className = 'icon-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Bacakan dari poin ini');
    btn.innerHTML = SPEAKER_ICON;
    btn.addEventListener('click', () => speakFrom(i + 1)); // indeks 0 = jawaban

    const p = document.createElement('p');
    p.textContent = text;

    li.appendChild(btn);
    li.appendChild(p);
    detailList.appendChild(li);
  });
  detailList.scrollTop = 0;
}

// ===== SUARA (hanya jalan kalau speaker di-tap) =====
let cachedVoices = [];

function loadVoices(){
  if (!('speechSynthesis' in window)) return;
  cachedVoices = window.speechSynthesis.getVoices();
}
loadVoices();
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

function pickEsaVoice(){
  if (!cachedVoices.length) return null;
  const maleHints = ['male', 'pria', 'laki', 'boy', 'man'];
  const idVoices = cachedVoices.filter(v => v.lang && v.lang.toLowerCase().startsWith('id'));
  const pool = idVoices.length ? idVoices : cachedVoices;
  const maleMatch = pool.find(v => maleHints.some(hint => v.name.toLowerCase().includes(hint)));
  return maleMatch || pool[0] || null;
}

function clearHighlight(){
  answerBox.classList.remove('reading');
  detailList.querySelectorAll('.detail-item.reading').forEach(el => el.classList.remove('reading'));
}

function highlightSegment(i){
  clearHighlight();
  if (i === 0) {
    answerBox.classList.add('reading');
    return;
  }
  const item = detailList.querySelectorAll('.detail-item')[i - 1];
  if (item) {
    item.classList.add('reading');
    item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

function stopSpeaking(){
  speakToken++;
  isSpeaking = false;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  clearHighlight();
  answerSpeak.classList.remove('active');
  esa.classList.remove('talking');
  if (!isBusy) resetIdle();
}

// Baca berurutan mulai dari segmen ke-start sampai akhir lanjutan
function speakFrom(start){
  if (!segments.length || !('speechSynthesis' in window)) return;

  stopSpeaking();
  const token = speakToken;
  isSpeaking = true;
  answerSpeak.classList.add('active');
  esa.classList.add('talking');
  statusText.textContent = SPEAKING_STATUS;

  const next = (i) => {
    if (token !== speakToken) return;
    if (i >= segments.length) { stopSpeaking(); return; }

    highlightSegment(i);
    const utter = new SpeechSynthesisUtterance(segments[i]);
    utter.lang = 'id-ID';
    const voice = pickEsaVoice();
    if (voice) utter.voice = voice;
    utter.pitch = 1.08;
    utter.rate = 1.04;
    utter.onend = () => next(i + 1);
    utter.onerror = () => { if (token === speakToken) stopSpeaking(); };
    window.speechSynthesis.speak(utter);
  };

  // jeda kecil setelah cancel() supaya tidak diabaikan browser
  setTimeout(() => next(start), 60);
}

// Speaker di kolom jawaban: tap = baca semuanya, tap lagi = berhenti
answerSpeak.addEventListener('click', () => {
  if (isSpeaking) stopSpeaking();
  else speakFrom(0);
});

// ===== BLINK OTOMATIS =====
function randomBlink(){
  esa.classList.add('blink');
  setTimeout(() => esa.classList.remove('blink'), 150);
  setTimeout(randomBlink, 2000 + Math.random() * 3000);
}
randomBlink();

// ===== KLIK ESA =====
esa.addEventListener('click', () => {
  if (isBusy || isSpeaking) return;
  setExpression('happy');
  statusText.textContent = 'Hihi, geli~';
  setTimeout(() => { if (!isBusy && !isSpeaking) resetIdle(); }, 700);
});

// ===== KIRIM PERTANYAAN =====
function submitQuestion(rawText){
  const text = (rawText || '').trim().slice(0, MAX_QUESTION_LENGTH);
  if (!text || isBusy) return;
  handleQuestion(text);
}

textForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (isBusy) return;
  const text = textInput.value;
  if (!text.trim()) return;
  textInput.value = '';
  submitQuestion(text);
});

// ===== MIC (SPEECH TO TEXT) =====
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isListening = false;
let gotResult = false;
let hadError = false;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = 'id-ID';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isListening = true;
    gotResult = false;
    hadError = false;
    micBtn.classList.add('listening');
    micBtn.textContent = '\u{1F3A4} Mendengarkan...';
    statusText.textContent = 'Aku dengerin kok~';
    setExpression('thinking');
  };

  recognition.onresult = (event) => {
    gotResult = true;
    submitQuestion(event.results[0][0].transcript);
  };

  recognition.onerror = () => {
    hadError = true;
    statusText.textContent = 'Suaranya kurang jelas, coba lagi ya!';
    setExpression(null);
  };

  recognition.onend = () => {
    isListening = false;
    micBtn.classList.remove('listening');
    micBtn.textContent = '\u{1F3A4} Tanya Esa';
    if (!gotResult && !hadError && !isBusy) resetIdle();
  };

  micBtn.addEventListener('click', () => {
    if (isListening) {
      recognition.stop();
    } else if (!isBusy) {
      stopSpeaking();
      recognition.start();
    }
  });
} else {
  micBtn.disabled = true;
  micBtn.textContent = '\u{1F3A4} Tidak didukung';
  statusText.textContent = 'Mic belum didukung, pakai kotak teks ya!';
}

// ===== JAWABAN ESA VIA GEMINI (lewat Vercel) =====
function showReply(jawaban, lanjutan, expression){
  isBusy = false;
  renderAnswer(jawaban, lanjutan);
  setExpression(expression);
  statusText.textContent = IDLE_STATUS;
  setTimeout(() => { if (!isBusy && !isSpeaking) resetIdle(); }, 900);
}

async function handleQuestion(question){
  stopSpeaking();
  enterChatMode();
  isBusy = true;
  statusText.textContent = 'Esa lagi mikir...';
  setExpression('thinking');
  answerText.textContent = 'Esa lagi mikir...';
  answerSpeak.disabled = true;
  segments = [];
  detailList.innerHTML = '';

  try {
    const res = await fetch(ESA_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        history: chatHistory.slice(-MAX_HISTORY_ITEMS)
      })
    });

    const data = await res.json().catch(() => ({}));
    const jawaban = cleanMarkdown(data.jawaban);

    if (!res.ok || !jawaban) {
      showReply('Esa bingung nih, coba tanya lagi ya!', [], 'surprised');
      return;
    }

    const lanjutan = (Array.isArray(data.lanjutan) ? data.lanjutan : [])
      .map(cleanMarkdown)
      .filter(Boolean);

    if (!data.fallback) {
      chatHistory.push({ role: 'user', text: question });
      chatHistory.push({ role: 'model', text: [jawaban, ...lanjutan].join(' ') });
      chatHistory = chatHistory.slice(-MAX_HISTORY_ITEMS);
    }

    showReply(jawaban, lanjutan, data.fallback ? 'surprised' : 'happy');
  } catch (err) {
    showReply('Waduh, koneksi Esa lagi bermasalah. Coba lagi sebentar lagi ya!', [], 'surprised');
  }
}
