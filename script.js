// ===== ELEMEN =====
const esa = document.getElementById('esa');
const messageLog = document.getElementById('messageLog');
const statusText = document.getElementById('statusText');
const micBtn = document.getElementById('micBtn');
const textForm = document.getElementById('textForm');
const textInput = document.getElementById('textInput');

const READ_THRESHOLD = 110; // di atas jumlah karakter ini, tawarkan opsi baca (ga auto-speak)

// ===== HELPER: ganti ekspresi =====
function setExpression(exp){
  esa.classList.remove('happy','thinking','talking','surprised');
  if(exp) esa.classList.add(exp);
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
      speak(text);
      btn.disabled = true;
      btn.textContent = '\u{1F50A} Sedang dibacakan...';
    });
    div.appendChild(btn);
  }

  messageLog.appendChild(div);
  scrollLogToBottom();

  setExpression(expression);
  if (!isLong) {
    speak(text); // jawaban pendek langsung dibacakan otomatis
  } else {
    setTimeout(() => setExpression(null), 900);
    statusText.textContent = 'Esa lagi santai~';
  }
}

function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
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
  setExpression('happy');
  statusText.textContent = 'Hihi, geli~';
  setTimeout(() => {
    setExpression(null);
    statusText.textContent = 'Esa lagi santai~';
  }, 700);
});

// ===== TEXT TO SPEECH =====
let cachedVoices = [];

function loadVoices(){
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

function speak(text){
  if(!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'id-ID';

  const voice = pickEsaVoice();
  if (voice) utter.voice = voice;

  utter.pitch = 1.08;
  utter.rate = 1.04;

  utter.onstart = () => esa.classList.add('talking');
  utter.onend = () => {
    esa.classList.remove('talking');
    setExpression(null);
    statusText.textContent = 'Esa lagi santai~';
  };
  window.speechSynthesis.speak(utter);
}

// ===== INPUT TEKS =====
textForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = textInput.value.trim();
  if(!text) return;
  addUserMessage(text);
  textInput.value = '';
  handleQuestion(text);
});

// ===== SPEECH TO TEXT (MIC) =====
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isListening = false;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = 'id-ID';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isListening = true;
    micBtn.classList.add('listening');
    micBtn.textContent = '\u{1F3A4} Mendengarkan...';
    statusText.textContent = 'Aku dengerin kok, ngomong aja~';
    setExpression('thinking');
  };

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    addUserMessage(text);
    handleQuestion(text);
  };

  recognition.onerror = () => {
    statusText.textContent = 'Waduh, suaranya kurang jelas. Coba lagi, ya!';
    setExpression(null);
  };

  recognition.onend = () => {
    isListening = false;
    micBtn.classList.remove('listening');
    micBtn.textContent = '\u{1F3A4} Tanya Esa';
  };

  micBtn.addEventListener('click', () => {
    if(isListening){
      recognition.stop();
    } else {
      recognition.start();
    }
  });
} else {
  micBtn.disabled = true;
  micBtn.textContent = '\u{1F3A4} Tidak didukung';
  statusText.textContent = 'Mic belum didukung browser ini â€” pakai kotak teks di atas ya!';
}

// ===== JAWABAN ESA VIA GEMINI (lewat Vercel) =====
const ESA_API_URL = 'https://esa-nu.vercel.app/api/ask';

async function handleQuestion(question){
  statusText.textContent = 'Esa lagi mikir...';
  setExpression('thinking');

  try {
    const res = await fetch(ESA_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    const data = await res.json();
    addEsaMessage(data.answer || 'Esa bingung nih, coba tanya lagi ya!', 'talking');
  } catch (err) {
    addEsaMessage('Waduh, koneksi Esa lagi bermasalah. Coba lagi sebentar lagi ya!', 'surprised');
  }
}
