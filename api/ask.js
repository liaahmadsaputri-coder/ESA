// api/ask.js

// Daftar alamat web yang boleh memanggil API ini.
// Kalau Esa kamu dibuka dari domain lain (misal GitHub Pages), tambahkan di sini.
const ALLOWED_ORIGINS = [
  'https://esa-nu.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:5500'
];

const MAX_QUESTION_LENGTH = 300;
const MAX_HISTORY_ITEMS = 6;
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

const SYSTEM_PROMPT =
  "Kamu adalah Esa, robot digital ceria yang jadi teman belajar. Jawab HANYA pertanyaan seputar pengetahuan/edukasi, dengan bahasa Indonesia santai, ramah, singkat (maks 3 kalimat), dan cocok untuk anak-anak. Jangan bahas topik curhat/pribadi, sarankan mereka cerita ke orang terdekat kalau itu terjadi. PENTING: jawab dalam teks polos biasa, JANGAN pakai format markdown apapun (jangan pakai tanda bintang **, tanda pagar #, garis miring, atau simbol format lain) karena jawabanmu akan dibacakan lewat suara.";

const FALLBACK_TEXT = 'Waduh, Esa lagi banyak yang nanya nih. Coba tanya lagi sebentar ya!';

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Blokir pemanggil dari domain yang tidak dikenal
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: 'Origin tidak diizinkan' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const question = typeof body.question === 'string' ? body.question.trim() : '';

  if (!question) return res.status(400).json({ error: 'Pertanyaan kosong' });
  if (question.length > MAX_QUESTION_LENGTH) {
    return res.status(400).json({ error: `Pertanyaan terlalu panjang (maks ${MAX_QUESTION_LENGTH} karakter)` });
  }

  const contents = buildContents(body.history, question);

  try {
    const result = await askGeminiWithRetry(contents);
    res.status(200).json(result);
  } catch (err) {
    console.log('Fetch error:', err.message);
    res.status(500).json({ error: 'Gagal menghubungi Gemini' });
  }
}

// Susun riwayat percakapan (opsional) + pertanyaan terbaru
function buildContents(history, question) {
  let past = [];
  if (Array.isArray(history)) {
    past = history
      .filter(h => h && (h.role === 'user' || h.role === 'model') && typeof h.text === 'string' && h.text.trim())
      .slice(-MAX_HISTORY_ITEMS)
      .map(h => ({ role: h.role, parts: [{ text: h.text.trim().slice(0, 500) }] }));
  }
  // Gemini mau percakapan diawali dari user
  while (past.length && past[0].role !== 'user') past.shift();

  return [...past, { role: 'user', parts: [{ text: question }] }];
}

// Panggil Gemini, otomatis retry kalau server lagi sibuk (503)
async function askGeminiWithRetry(contents, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents
        })
      }
    );

    const data = await geminiRes.json();
    console.log(`Gemini status (percobaan ${attempt + 1}):`, geminiRes.status);

    const rawAnswer = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (rawAnswer) return { answer: cleanMarkdown(rawAnswer) };

    // Server sibuk (503) dan masih ada jatah retry: tunggu lalu coba lagi
    const isOverloaded = data?.error?.code === 503;
    if (isOverloaded && attempt < maxRetries) {
      console.log('Gemini sibuk, retry dalam 1.2 detik...');
      await new Promise(r => setTimeout(r, 1200));
      continue;
    }

    // Jatah retry habis atau error lain: kirim fallback, ditandai fallback:true
    console.log('Gemini response (gagal final):', JSON.stringify(data));
    return { answer: FALLBACK_TEXT, fallback: true };
  }
  return { answer: FALLBACK_TEXT, fallback: true };
}

// Hapus simbol markdown biar enak dibaca & enak didengar lewat suara
function cleanMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')       // **tebal** -> tebal
    .replace(/^\s*[*-]\s+/gm, '')           // bullet di awal baris
    .replace(/(^|\s)\*(\S[^*]*?)\*(?=\s|$|[.,!?])/g, '$1$2') // *miring* -> miring
    .replace(/#{1,6}\s?/g, '')              // # judul -> judul
    .replace(/`{1,3}([^`]*)`{1,3}/g, '$1')  // `kode` -> kode
    .trim();
}
