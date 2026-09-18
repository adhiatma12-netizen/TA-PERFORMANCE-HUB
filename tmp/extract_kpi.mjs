import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('No GEMINI_API_KEY');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function extract(filePath, monthName, rowRange) {
  console.log(`Extracting for ${monthName} (${rowRange})...`);
  const buf = fs.readFileSync(filePath);
  const base64 = buf.toString('base64');

  const prompt = `
Perhatikan dengan sangat teliti gambar tabel dokumen "KPI Imbal Jasa Assurance" berikut untuk Bulan ${monthName} (${rowRange}).
Tabel memiliki kolom-kolom (misal: No, Indikator, Satuan, Polaritas/Arah, Bobot, Target, Realisasi, % Pencapaian/Achv, Skor, Hak Imbal Jasa, Keterangan/Status, dll).

TUGAS:
1. Baca judul tabel, witel/regional, bulan, tahun jika ada.
2. Ekstrak SEMUA baris indikator kinerja yang ada di tabel secara LENGKAP tanpa ada yang terlewat atau diubah.
3. Ekstrak baris TOTAL di bagian paling bawah (total bobot, rata-rata pencapaian, total skor, status hak imbal jasa).

Kembalikan HANYA JSON murni dengan format:
{
  "bulan": "${monthName}",
  "tahun": "2024",
  "witel": "WITEL MADIUN",
  "regional": "REGIONAL 5 JATIM & BALINUSRA",
  "range": "${rowRange}",
  "totalBobot": 100,
  "totalSkor": 98.45,
  "pencapaianRataRata": 102.5,
  "statusImbalJasa": "100% Hak Imbal Jasa Tercapai",
  "items": [
    {
      "no": 1,
      "indikator": "...",
      "kategori": "...",
      "satuan": "...",
      "polaritas": "MIN" atau "MAX",
      "bobot": 15,
      "target": 3.0,
      "realisasi": 2.82,
      "pencapaian": 106.38,
      "skor": 15.0,
      "imbalJasa": "100%",
      "status": "Memenuhi" atau "Warning" atau "Di Bawah Target",
      "keterangan": "..."
    }
  ]
}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite',
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              data: base64,
              mimeType: 'image/png'
            }
          },
          {
            text: prompt
          }
        ]
      }
    ],
    config: {
      temperature: 0.1
    }
  });

  const text = response.text || '';
  const cleanJson = text.replace(/^```json/im, '').replace(/^```/im, '').replace(/```$/m, '').trim();
  const parsed = JSON.parse(cleanJson);
  fs.writeFileSync(`/tmp/kpi_${monthName.toLowerCase()}.json`, JSON.stringify(parsed, null, 2));
  console.log(`Saved /tmp/kpi_${monthName.toLowerCase()}.json with ${parsed.items?.length} items, total skor: ${parsed.totalSkor}`);
}

async function run() {
  await extract('/tmp/kpi_sep.png', 'SEPTEMBER', 'B3:O24');
  await extract('/tmp/kpi_agu.png', 'AGUSTUS', 'B26:O47');
  await extract('/tmp/kpi_jul.png', 'JULI', 'B49:O70');
  console.log('ALL EXTRACTED!');
}

run().catch(console.error);
