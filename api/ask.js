// api/ask.js
export default async function handler(req, res) {
  // izinkan dipanggil dari GitHub Pages kamu
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'Pertanyaan kosong' });

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{
              text: "Kamu adalah Esa, robot digital ceria yang jadi teman belajar. Jawab HANYA pertanyaan seputar pengetahuan/edukasi, dengan bahasa Indonesia santai, ramah, singkat (maks 3 kalimat), dan cocok untuk anak-anak. Jangan bahas topik curhat/pribadi, sarankan mereka cerita ke orang terdekat kalau itu terjadi."
            }]
          },
          contents: [{ parts: [{ text: question }] }]
        })
      }
    );

    const data = await geminiRes.json();
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text
      || 'Waduh, Esa belum bisa jawab ini sekarang. Coba tanya lagi ya!';

    res.status(200).json({ answer });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghubungi Gemini', detail: err.message });
  }
}
