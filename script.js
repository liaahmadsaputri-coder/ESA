// ===== ELEMEN =====
const esa = document.getElementById('esa');
const mouth = document.getElementById('mouth');
const speechText = document.getElementById('speechText');
const statusText = document.getElementById('statusText');
const transcriptEl = document.getElementById('transcript');
const micBtn = document.getElementById('micBtn');
const waveBtn = document.getElementById('waveBtn');
const jumpBtn = document.getElementById('jumpBtn');

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
  esa.classList.add('waving');
  say('Halo! Aku Esa, senang ketemu kamu! ✦', 'happy');
  setTimeout(() => esa.classList.remove('waving'), 1200);
  setTimeout(() => setExpression(null), 1400);
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
  statusText.textContent = 'Browser ini belum mendukung input suara.';
}

// ===== JAWABAN ESA (PLACEHOLDER — GANTI DENGAN AI API NANTI) =====
// TODO: ganti fungsi ini dengan panggilan ke AI API pada tahap berikutnya.
function handleQuestion(question){
  statusText.textContent = 'Esa lagi mikir...';
  setExpression('thinking');

  setTimeout(() => {
    const fallbackAnswers = [
      'Pertanyaan bagus! Nanti aku belajar jawab ini pakai AI ya~',
      'Hmm, seru nih! Fitur jawab pintar Esa lagi disiapkan.',
      'Wah aku catat dulu ya, nanti aku kasih jawaban lengkap!'
    ];
    const answer = fallbackAnswers[Math.floor(Math.random()*fallbackAnswers.length)];
    say(answer, 'talking');
  }, 900);
}
