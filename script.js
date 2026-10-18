// ===== ELEMEN =====
const esa = document.getElementById('esa');
const messageLog = document.getElementById('messageLog');
const statusText = document.getElementById('statusText');
const micBtn = document.getElementById('micBtn');
const textForm = document.getElementById('textForm');
const textInput = document.getElementById('textInput');

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
  const div = document.createElement('div');
  div.className = 'msg msg-esa';
  div.innerHTML = `<p>${escapeHtml(text)}</p>`;

  // Tombol baca ada di setiap jawaban. Suara HANYA jalan kalau tombol ini diklik.
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

  messageLog.appendChild(div);
  scrollLogToBottom();

  // Ekspresi sebentar saja, lalu santai lagi (tanpa suara)
  setExpression(expression);
  setTimeout(resetIdle, 900);
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

// ===== TEXT TO SPEECH (hanya lewat tombol Bacakan) =====
let cachedVoices = [];
let currentUtter = null;

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
  currentUtter = utter;
