import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { processPerformanceEvaluation } from './src/server/evaluateService';
import { parseKpiImageWithGemini } from './src/server/kpiImageService';
import { verifySsoCredentials } from './src/server/ssoAuthService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
  });
});

// API Evaluate Performance Table
app.post('/api/evaluate-performance', async (req, res) => {
  try {
    const result = await processPerformanceEvaluation(req.body);
    return res.json(result);
  } catch (err: any) {
    console.error('[Server] Evaluation error:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Gagal memproses evaluasi performansi',
    });
  }
});

// API Parse KPI Imbal Jasa Image from Google Drive / Local
app.post('/api/parse-kpi-image', async (req, res) => {
  try {
    const result = await parseKpiImageWithGemini(req.body);
    return res.json(result);
  } catch (err: any) {
    console.error('[Server] KPI image OCR error:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Gagal memproses gambar KPI Imbal Jasa',
    });
  }
});

// API LDAP / SSO Office Authentication (Binary Check ke madiunjuara.com)
app.post(['/api/auth/ldap', '/api/auth/sso', '/api/auth-ldap'], async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const result = await verifySsoCredentials(username, password);
    if (!result.success) {
      return res.status(result.statusCode || 401).json(result);
    }
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[Server] LDAP/SSO Auth endpoint error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error saat verifikasi SSO',
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Telkom Akses Dashboard Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
