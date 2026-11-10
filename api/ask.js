// api/ask.js

// Alamat tambahan yang boleh memanggil API ini (domain Vercel sendiri otomatis diizinkan).
const ALLOWED_ORIGINS = [
  'https://esa-nu.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:5500'
];

const MAX_QUESTION_LENGTH = 300;
const MAX_HISTORY_ITEMS = 6;
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

const SYSTEM_PROMPT =
  "Kamu adalah Esa, robot digital ceria yang jadi teman belajar. Jawab HANYA pertanyaan seputar pengetahuan/edukasi, dengan bahasa Indonesia santai, ramah, dan cocok untuk anak-anak. Jangan bahas topik curhat/pribadi, sarankan mereka cerita ke orang terdekat kalau itu terjadi. " +
  "Balasanmu harus berupa JSON dengan dua isian. 'jawaban': jawaban inti yang singkat, maksimal 2 kalimat. 'lanjutan': daftar 3 sampai 4 kalimat pendek yang menjelaskan lebih lengkap, lebih detail, dan lebih mendalam dari jawaban (misalnya penyebab, proses, contoh, atau fakta menarik); satu kalimat per isian, jangan mengulang jawaban. " +
  "PENTING: semua teks polos biasa, JANGAN pakai format markdown apapun (jangan pakai tanda bintang, tanda pagar, atau simbol format lain) karena akan dibacakan lewat suara.";

const FALLBACK_TEXT = 'Waduh, Esa lagi banyak yang nanya nih. Coba tanya lagi sebentar ya!';

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    jawaban: { type: 'STRING' },
    lanjutan: { type: 'ARRAY', items: { type: 'STRING' } }
  },
  required: ['jawaban', 'lanjutan']
};

// Origin diizinkan kalau ada di daftar, atau berasal dari host yang sama dengan API ini
function isOriginAllowed(origin, host) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  try {
    return new URL(origin).host === host;
  } catch (e) {
    return false;
  }
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  const allowed = isOriginAllowed(origin, req.headers.host);

  if (origin && allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!allowed) {
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

function buildContents(history, question) {
  let past = [];
  if (Array.isArray(history)) {
    past = history
      .filter(h => h && (h.role === 'user' || h.role === 'model') && typeof h.text === 'string' && h.text.trim())
      .slice(-MAX_HISTORY_ITEMS)
      .map(h => ({ role: h.role, parts: [{ text: h.text.trim().slice(0, 800) }] }));
  }
  while (past.length && past[0].role !== 'user') past.shift();

  return [...past, { role: 'user', parts: [{ text: question }] }];
}

// Ubah teks balasan Gemini jadi { jawaban, lanjutan }
function parseReply(rawAnswer) {
  try {
    const clean = rawAnswer.replace(/```json|```/g, '').trim();
    const obj = JSON.parse(clean);
    const jawaban = cleanMarkdown(String(obj.jawaban || ''));
    const lanjutan = (Array.isArray(obj.lanjutan) ? obj.lanjutan : [])
      .map(t => cleanMarkdown(String(t)))
      .filter(Boolean)
      .slice(0, 5);
    if (jawaban) return { jawaban, lanjutan };
  } catch (e) {
    // anggap teks biasa
  }
  return { jawaban: cleanMarkdown(rawAnswer), lanjutan: [] };
}

async function askGeminiWithRetry(contents, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA
          }
        })
      }
    );

    const data = await geminiRes.json();
    console.log(`Gemini status (percobaan ${attempt + 1}):`, geminiRes.status);

    const rawAnswer = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (rawAnswer) return parseReply(rawAnswer);

    const isOverloaded = data?.error?.code === 503;
    if (isOverloaded && attempt < maxRetries) {
      console.log('Gemini sibuk, retry dalam 1.2 detik...');
      await new Promise(r => setTimeout(r, 1200));
      continue;
    }

    console.log('Gemini response (gagal final):', JSON.stringify(data));
    return { jawaban: FALLBACK_TEXT, lanjutan: [], fallback: true };
  }
  return { jawaban: FALLBACK_TEXT, lanjutan: [], fallback: true };
}

function cleanMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^\s*[*-]\s+/gm, '')
    .replace(/(^|\s)\*(\S[^*]*?)\*(?=\s|$|[.,!?])/g, '$1$2')
    .replace(/#{1,6}\s?/g, '')
    .replace(/`{1,3}([^`]*)`{1,3}/g, '$1')
    .trim();
}
