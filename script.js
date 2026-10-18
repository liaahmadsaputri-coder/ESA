// ===== ELEMEN =====
const esa = document.getElementById('esa');
const messageLog = document.getElementById('messageLog');
const statusText = document.getElementById('statusText');
const micBtn = document.getElementById('micBtn');
const textForm = document.getElementById('textForm');
const textInput = document.getElementById('textInput');

const READ_THRESHOLD = 280;     // di atas jumlah karakter ini, tawarkan tombol baca (ga auto-speak)
const MAX_QUESTION_LENGTH = 300; // harus sama dengan batas di api/ask.js
const MAX_HISTORY_ITEMS = 6;     // jumlah pesan terakhir yang dikirim sebagai konteks
const IDLE_STATUS = 'Sistem Esa: aktif \u2726';

textInput.maxLength = MAX_QUESTION_LENGTH;

// ===== STATE =====
let isBusy = false;      // true selama Esa lagi mikir (cegah kirim ganda)
let chatHistory = [];    // [{ role: 'user' | 'model', text }]

// ===== HELPER: ganti ekspresi =====
function setExpression(exp){
  esa.classList.remove('happy','thinking','talking','surprised');
  if(exp) esa.classList.add(exp);
}

// Kembalikan Esa ke keadaan santai
function resetIdle(){
  esa.classList.remove('talking');
  setExpression(null);
  statusText.textContent = IDLE_STATUS;
}

// ===== SWITCH MODE: robot gede-tengah -> kecil-atas begitu mulai chat =====
function enterChatMode(){
  document.body.classList.remove('mode-idle');
  document.body.classList.add('mode-chat');
}

// ===== HELPER: tambah pesan ke panel teks =====
function scrollLogToBottom(){
  messageLog.scrollTop = messageLog.scrollHeight;
}

function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function addUserMessage(text){
  enterChatMode();
  const div = document.createElement('div');
  div.className = 'msg msg-user';
  div.innerHTML = `<p>${escapeHtml(text)}</p>`;
  messageLog.appendChild(div);
  scrollLogToBottom();
}

function addEsaMessage(text, expression = 'talking'){
  const isLong = text.length > READ_THRESHOLD;

  const div = document.createElement('div');
  div.className = 'msg msg-esa';
  div.innerHTML = `<p>${escapeHtml(text)}</p>`;

  if (isLong) {
    const btn = document.createElement('button');
    btn.className = 'read-btn';
    btn.type = 'button';
    btn.textContent = '\u{1F50A} Bacakan jawaban ini';
    btn.addEventListener('click', () => {
      btn.disabled = true;
      btn.textContent = '\u{1F50A} Sedang dibacakan...';
      speak(text, () => {
        btn.disabled = false;
        btn.textContent = '\u{1F50A} Bacakan lagi';
      });
    });
    div.appendChild(btn);
  }

  messageLog.appendChild(div);
  scrollLogToBottom();

  setExpression(expression);
  if (!isLong) {
    speak(text); // jawaban pendek langsung dibacakan otomatis
  } else {
    setTimeout(resetIdle, 900);
  }
}

// Jaring pengaman: hapus sisa simbol markdown kalau masih kebawa dari Gemini
function cleanMarkdown(text){
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^\s*[*-]\s+/gm, '')
    .replace(/(^|\s)\*(\S[^*]*?)\*(?=\s|$|[.,!?])/g, '$1$2')
    .replace(/#{1,6}\s?/g, '')
    .replace(/`{1,3}([^`]*)`{1,3}/g, '$1')
    .trim();
}

// ===== BLINK OTOMATIS =====
function randomBlink(){
  esa.classList.add('blink');
  setTimeout(()=> esa.classList.remove('blink'), 150);
  const next = 2000 + Math.random()*3000;
  setTimeout(randomBlink, next);
}
randomBlink();

// ===== KLIK / SENTUH ESA =====
esa.addEventListener('click', () => {
  if (isBusy) return;
  setExpression('happy');
  statusText.textContent = 'Hihi, geli~';
  setTimeout(() => {
    if (!isBusy) resetIdle();
  }, 700);
});

// ===== TEXT TO SPEECH =====
let cachedVoices = [];
let speechUnlocked = false;

function loadVoices(){
  if (!('speechSynthesis' in window)) return;
  cachedVoices = window.speechSynthesis.getVoices();
}
loadVoices();
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

// Safari iOS cuma ngebolehin suara kalau "dibuka" dulu lewat sentuhan langsung.
// Dipanggil saat tombol Kirim / Mic ditekan, sebelum nunggu jawaban dari server.
function unlockSpeech(){
  if (speechUnlocked || !('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  window.speechSynthesis.speak(u);
  speechUnlocked = true;
}

function pickEsaVoice(){
  if (!cachedVoices.length) return null;
  const maleHints = ['male', 'pria', 'laki', 'boy', 'man'];
  const idVoices = cachedVoices.filter(v => v.lang && v.lang.toLowerCase().startsWith('id'));
  const pool = idVoices.length ? idVoices : cachedVoices;
  const maleMatch = pool.find(v => maleHints.some(hint => v.name.toLowerCase().includes(hint)));
  if (maleMatch) return maleMatch;
  return pool[0] || null;
}

function speak(text, onDone){
  if (!('speechSynthesis' in window)) {
    resetIdle();
    if (onDone) onDone();
    return;
  }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'id-ID';

  const voice = pickEsaVoice();
  if (voice) utter.voice = voice;

  utter.pitch = 1.08;
  utter.rate = 1.04;

  const finish = () => {
    resetIdle();
    if (onDone) onDone();
  };

  utter.onstart = () => esa.classList.add('talking');
  utter.onend = finish;
  utter.onerror = finish;
  window.speechSynthesis.speak(utter);
}

// ===== KIRIM PERTANYAAN (dipakai oleh teks & mic) =====
function submitQuestion(rawText){
  const text = (rawText || '').trim().slice(0, MAX_QUESTION_LENGTH);
  if (!text || isBusy) return;
  unlockSpeech();
  addUserMessage(text);
  handleQuestion(text);
}

// ===== INPUT TEKS =====
textForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (isBusy) return;
  const text = textInput.value;
  if (!text.trim()) return;
  textInput.value = '';
  submitQuestion(text);
});

// ===== SPEECH TO TEXT (MIC) =====
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
    statusText.textContent = 'Aku dengerin kok, ngomong aja~';
    setExpression('thinking');
  };

  recognition.onresult = (event) => {
    gotResult = true;
    const text = event.results[0][0].transcript;
    submitQuestion(text);
  };

  recognition.onerror = () => {
    hadError = true;
    statusText.textContent = 'Waduh, suaranya kurang jelas. Coba lagi, ya!';
    setExpression(null);
  };

  recognition.onend = () => {
    isListening = false;
    micBtn.classList.remove('listening');
    micBtn.textContent = '\u{1F3A4} Tanya Esa';
    // Kalau mic berhenti tanpa hasil (anak diam saja), balikin Esa ke santai
    if (!gotResult && !hadError && !isBusy) resetIdle();
  };

  micBtn.addEventListener('click', () => {
    if (isListening) {
      recognition.stop();
    } else if (!isBusy) {
      unlockSpeech();
      recognition.start();
    }
  });
} else {
  micBtn.disabled = true;
  micBtn.textContent = '\u{1F3A4} Tidak didukung';
  statusText.textContent = 'Mic belum didukung browser ini, pakai kotak teks di bawah ya!';
}

// ===== JAWABAN ESA VIA GEMINI (lewat Vercel) =====
const ESA_API_URL = 'https://esa-nu.vercel.app/api/ask';

async function handleQuestion(question){
  isBusy = true;
  textInput.disabled = false;
  statusText.textContent = 'Esa lagi mikir...';
  setExpression('thinking');

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

    if (!res.ok || !data.answer) {
      isBusy = false;
      addEsaMessage('Esa bingung nih, coba tanya lagi ya!', 'surprised');
      return;
    }

    const answer = cleanMarkdown(data.answer);

    // Simpan ke riwayat hanya kalau jawabannya asli (bukan pesan fallback)
    if (!data.fallback) {
      chatHistory.push({ role: 'user', text: question });
      chatHistory.push({ role: 'model', text: answer });
      chatHistory = chatHistory.slice(-MAX_HISTORY_ITEMS);
    }

    isBusy = false;
    addEsaMessage(answer, data.fallback ? 'surprised' : 'talking');
  } catch (err) {
    isBusy = false;
    addEsaMessage('Waduh, koneksi Esa lagi bermasalah. Coba lagi sebentar lagi ya!', 'surprised');
  }
}
