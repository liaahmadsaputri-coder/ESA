// api/ask.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'Pertanyaan kosong' });

  try {
    const answer = await askGeminiWithRetry(question);
    res.status(200).json({ answer });
  } catch (err) {
    console.log('Fetch error:', err.message);
    res.status(500).json({ error: 'Gagal menghubungi Gemini', detail: err.message });
  }
}

// Coba panggil Gemini, otomatis retry kalau server lagi sibuk (503)
async function askGeminiWithRetry(question, maxRetries = 2) {
  const fallbackText = 'Waduh, Esa lagi banyak yang nanya nih. Coba tanya lagi sebentar ya!';

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{
              text: "Kamu adalah Esa, robot digital ceria yang jadi teman belajar. Jawab HANYA pertanyaan seputar pengetahuan/edukasi, dengan bahasa Indonesia santai, ramah, singkat (maks 3 kalimat), dan cocok untuk anak-anak. Jangan bahas topik curhat/pribadi, sarankan mereka cerita ke orang terdekat kalau itu terjadi. PENTING: jawab dalam teks polos biasa, JANGAN pakai format markdown apapun (jangan pakai tanda bintang **, tanda pagar #, garis miring, atau simbol format lain) karena jawabanmu akan dibacakan lewat suara."
            }]
          },
          contents: [{ parts: [{ text: question }] }]
        })
      }
    );

    const data = await geminiRes.json();
    console.log(`Gemini status (percobaan ${attempt + 1}):`, geminiRes.status);

    // Kalau berhasil, bersihkan sisa markdown (jaga-jaga kalau masih kebawa) lalu balikin
    const rawAnswer = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (rawAnswer) return cleanMarkdown(rawAnswer);

    // Kalau server sibuk (503) dan masih ada jatah retry, tunggu sebentar lalu coba lagi
    const isOverloaded = data?.error?.code === 503;
    if (isOverloaded && attempt < maxRetries) {
      console.log('Gemini sibuk, retry dalam 1.2 detik...');
      await new Promise(r => setTimeout(r, 1200));
      continue;
    }

    // Sudah habis jatah retry, atau error lain (bukan 503) â€” kirim fallback
    console.log('Gemini response (gagal final):', JSON.stringify(data));
    return fallbackText;
  }
}

// Hapus simbol markdown (**, *, #, `) biar enak dibaca & enak didengar lewat suara
function cleanMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')  // **tebal** -> tebal
    .replace(/\*(.*?)\*/g, '$1')      // *miring* -> miring
    .replace(/#{1,6}\s?/g, '')        // # judul -> judul
    .replace(/`{1,3}([^`]*)`{1,3}/g, '$1') // `kode` -> kode
    .trim();
}
