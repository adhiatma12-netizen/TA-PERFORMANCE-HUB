import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import {
  detectEvaluationDomain,
  getDomainSystemInstruction,
  getDomainUserPrompt,
  generateDomainHeuristicEvaluation,
} from './src/server/aiEvaluationEngine';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialization helper for Gemini
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Timeout helper to prevent hanging on saturated upstream endpoints
function withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(errorMsg)), ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Enhanced multi-model evaluation with retry & fallback for 503 / high demand spikes
async function generateGeminiEvaluation(
  ai: GoogleGenAI,
  userPrompt: string,
  systemInstruction: string
): Promise<{ text: string; modelUsed: string }> {
  // Candidate models from the Gemini API specification:
  // 1. gemini-3.1-flash-lite (High-throughput, low-latency, resistant to 503 capacity spikes)
  // 2. gemini-flash-latest (Alias fallback)
  // 3. gemini-3.8-flash (Standard text model)
  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      // 14-second cap per candidate call so user gets timely response
      const response = await withTimeout(
        ai.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        }),
        14000,
        `Request to ${model} timed out after 14s`
      );

      const text = response.text || '';
      if (text && text.trim().length > 0) {
        return { text, modelUsed: model };
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      console.warn(`[Gemini API] Candidate ${model} unavailable or timed out (${errMsg.slice(0, 80)}). Switching to next candidate...`);
      // Brief pause before trying next candidate
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }

  throw lastError || new Error('All candidate Gemini models temporarily unavailable');
}

// Data-driven fallback analysis delegating to specialized domain heuristic generator
function generateHeuristicEvaluation(
  tableName: string,
  dashboardContext: string,
  filterContext: Record<string, any> = {},
  summaryMetrics: Record<string, any> = {},
  sampleRows: any[] = [],
  promptNote: string = ''
): string {
  const domain = detectEvaluationDomain(tableName, dashboardContext, promptNote);
  return generateDomainHeuristicEvaluation(
    domain,
    tableName,
    dashboardContext,
    filterContext,
    summaryMetrics,
    sampleRows
  );
}

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
  });
});

// API Evaluate Performance Table
app.post('/api/evaluate-performance', async (req, res) => {
  const {
    tableName = 'Tabel Indikator Performansi',
    dashboardContext = 'Operasional Telkom Akses',
    filterContext = {},
    summaryMetrics = {},
    sampleRows = [],
    promptNote = '',
  } = req.body;

  const domain = detectEvaluationDomain(tableName, dashboardContext, promptNote);
  console.log(`[AI Evaluation] Detected domain: "${domain}" for table: "${tableName}" | context: "${dashboardContext}"`);

  try {
    const ai = getGeminiClient();

    // If no AI client available, return structured intelligent heuristic evaluation for that domain
    if (!ai) {
      const evaluation = generateDomainHeuristicEvaluation(
        domain,
        tableName,
        dashboardContext,
        filterContext,
        summaryMetrics,
        sampleRows
      );
      return res.json({
        success: true,
        evaluation,
        source: 'heuristic',
        domain,
        modelUsed: 'Operational Heuristic Engine',
        generatedAt: new Date().toISOString(),
      });
    }

    // Limit sample rows to avoid excessive payload
    const trimmedRows = (sampleRows || []).slice(0, 35);

    // Get specialized system instruction and user prompt according to domain
    const systemInstruction = getDomainSystemInstruction(domain);
    const userPrompt = getDomainUserPrompt(
      domain,
      tableName,
      dashboardContext,
      filterContext,
      summaryMetrics,
      promptNote,
      trimmedRows
    );

    let evaluation = '';
    let modelUsed = 'gemini-3.1-flash-lite';
    let source = 'gemini';

    try {
      const result = await generateGeminiEvaluation(ai, userPrompt, systemInstruction);
      evaluation = result.text;
      modelUsed = result.modelUsed;
    } catch (apiErr: any) {
      console.warn('[Gemini API] Temporary upstream load limit. Serving high-fidelity operational evaluation:', apiErr?.message || apiErr);
      evaluation = generateDomainHeuristicEvaluation(
        domain,
        tableName,
        dashboardContext,
        filterContext,
        summaryMetrics,
        sampleRows
      );
      source = 'fallback';
      modelUsed = 'Operational Analysis Engine';
    }

    return res.json({
      success: true,
      evaluation,
      source,
      domain,
      modelUsed,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.warn('[Server] Evaluation handler notice:', err?.message || err);
    // Graceful fallback on any server error
    const fallbackText = generateDomainHeuristicEvaluation(
      domain,
      tableName || 'Tabel Indikator Performansi',
      dashboardContext || 'Operasional Telkom Akses',
      filterContext || {},
      summaryMetrics || {},
      sampleRows || []
    );
    return res.json({
      success: true,
      evaluation: fallbackText,
      source: 'fallback',
      domain,
      modelUsed: 'Operational Analysis Engine',
      notice: 'Layanan AI beralih ke mesin evaluasi operasional cerdas.',
      generatedAt: new Date().toISOString(),
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
