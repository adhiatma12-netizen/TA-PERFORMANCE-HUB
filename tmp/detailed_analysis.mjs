import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function analyze(filePath, monthName) {
  const buf = fs.readFileSync(filePath);
  const base64 = buf.toString('base64');

  const prompt = `
Analisis gambar tabel ini dengan sangat detail. Ini adalah tabel performansi KPI Imbal Jasa Assurance Telkom Akses untuk Bulan ${monthName}.
Deskripsikan secara presisi:
1. Apa judul tabel di atas gambar?
2. Apa saja nama-nama kolom tabel (header kolom horizontal)? Tuliskan persis sesuai teks di gambar.
3. Apa saja baris-barisnya (misal nama Branch / Sektor / Area / Mitra / Witel / Total)?
4. Berikan data tabel lengkap dalam format JSON yang berisi:
   - title: string
   - headers: array of string (nama kolom)
   - rows: array of object (setiap baris berisi nilai-nilai untuk setiap kolom, termasuk nilai Branch/Area dan nilai tiap indikator)
   - summary: baris total atau performansi gabungan
5. Informasi apa lagi yang ada di gambar (legenda warna, status target, nilai akhir, dll)?

Kembalikan HANYA format JSON valid berikut:
{
  "title": "...",
  "month": "${monthName}",
  "headers": [...],
  "columns": [...],
  "rows": [
    {
      "branch": "...",
      ...semua nilai kolom...
    }
  ],
  "totalRow": { ... },
  "notes": "..."
}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { data: base64, mimeType: 'image/png' } },
            { text: prompt }
          ]
        }
      ],
      config: { temperature: 0.1 }
    });

    const text = response.text || '';
    const clean = text.replace(/^```json/im, '').replace(/^```/im, '').replace(/```$/m, '').trim();
    fs.writeFileSync(`src/data/kpi_extracted_${monthName.toLowerCase()}.json`, clean);
    console.log(`Successfully parsed ${monthName}! Saved to src/data/kpi_extracted_${monthName.toLowerCase()}.json`);
  } catch (err) {
    console.error(`Error on ${monthName}:`, err.message);
  }
}

async function run() {
  await analyze('/tmp/kpi_sep.png', 'SEPTEMBER');
  await analyze('/tmp/kpi_agu.png', 'AGUSTUS');
  await analyze('/tmp/kpi_jul.png', 'JULI');
}

run();
