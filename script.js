// ===== ELEMEN =====
const esa = document.getElementById('esa');
const speechText = document.getElementById('speechText');
const statusText = document.getElementById('statusText');
const transcriptEl = document.getElementById('transcript');
const micBtn = document.getElementById('micBtn');
const waveBtn = document.getElementById('waveBtn');
const jumpBtn = document.getElementById('jumpBtn');
const textForm = document.getElementById('textForm');
const textInput = document.getElementById('textInput');

// ===== HELPER: ganti ekspresi =====
function setExpression(exp){
  esa.classList.remove('happy','thinking','talking','surprised');
  if(exp) esa.classList.add(exp);
}

function say(text, expression = 'talking'){
  speechText.textContent = text;
  setExpression(expression);
  speak(text);
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
  if(esa.classList.contains('jumping')) return;
  setExpression('happy');
  statusText.textContent = 'Hihi, geli~';
  setTimeout(() => {
    setExpression(null);
    statusText.textContent = 'Esa lagi santai~';
  }, 700);
});

// ===== LOMPAT =====
jumpBtn.addEventListener('click', () => {
  if(esa.classList.contains('jumping')) return;
  esa.classList.add('jumping');
  setExpression('surprised');
  setTimeout(() => {
    esa.classList.remove('jumping');
    setExpression(null);
  }, 560);
});

// ===== SAPA (WAVE) =====
waveBtn.addEventListener('click', () => {
  if(esa.classList.contains('waving')) return;
  esa.classList.add('waving');
  say('Halo! Aku Esa, senang ketemu kamu! ✦', 'happy');
  setTimeout(() => esa.classList.remove('waving'), 1650);
  setTimeout(() => setExpression(null), 1700);
});

// ===== TEXT TO SPEECH =====
function speak(text){
  if(!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'id-ID';
  utter.pitch = 1.3;
  utter.rate = 1.02;

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
  transcriptEl.textContent = `Kamu: "${text}"`;
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
    micBtn.textContent = '🎤 Mendengarkan...';
    statusText.textContent = 'Aku dengerin kok, ngomong aja~';
    setExpression('thinking');
  };

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    transcriptEl.textContent = `Kamu: "${text}"`;
    handleQuestion(text);
  };

  recognition.onerror = () => {
    statusText.textContent = 'Waduh, suaranya kurang jelas. Coba lagi, ya!';
    setExpression(null);
  };

  recognition.onend = () => {
    isListening = false;
    micBtn.classList.remove('listening');
    micBtn.textContent = '🎤 Tanya Esa';
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
  micBtn.textContent = '🎤 Tidak didukung';
  statusText.textContent = 'Mic belum didukung browser ini — pakai kotak teks di atas ya!';
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
    say(data.answer || 'Esa bingung nih, coba tanya lagi ya!', 'talking');
  } catch (err) {
    say('Waduh, koneksi Esa lagi bermasalah. Coba lagi sebentar lagi ya!', 'surprised');
  }
}
