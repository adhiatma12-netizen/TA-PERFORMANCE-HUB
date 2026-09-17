import { GoogleGenAI } from '@google/genai';
import {
  detectEvaluationDomain,
  getDomainSystemInstruction,
  getDomainUserPrompt,
  generateDomainHeuristicEvaluation,
  EvaluationDomain,
} from './aiEvaluationEngine';

export interface EvaluationRequestPayload {
  tableName?: string;
  dashboardContext?: string;
  filterContext?: Record<string, any>;
  summaryMetrics?: Record<string, any>;
  sampleRows?: any[];
  promptNote?: string;
}

export interface EvaluationResponsePayload {
  success: boolean;
  evaluation: string;
  source: 'gemini' | 'heuristic' | 'fallback';
  domain: EvaluationDomain;
  modelUsed: string;
  notice?: string;
  generatedAt: string;
}

// Lazy initialization helper for Gemini
export function getGeminiClient(): GoogleGenAI | null {
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

// Multi-model evaluation with retry & fallback for 503 / high demand spikes
export async function generateGeminiEvaluation(
  ai: GoogleGenAI,
  userPrompt: string,
  systemInstruction: string
): Promise<{ text: string; modelUsed: string }> {
  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
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
      console.warn(`[Gemini API] Candidate ${model} unavailable (${errMsg.slice(0, 80)}). Trying fallback candidate...`);
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }

  throw lastError || new Error('All candidate Gemini models temporarily unavailable');
}

/**
 * Universal evaluation processor used by both Express server (server.ts)
 * and Vercel Serverless Function (api/evaluate-performance.ts).
 */
export async function processPerformanceEvaluation(
  payload: EvaluationRequestPayload
): Promise<EvaluationResponsePayload> {
  const {
    tableName = 'Tabel Indikator Performansi',
    dashboardContext = 'Operasional Telkom Akses',
    filterContext = {},
    summaryMetrics = {},
    sampleRows = [],
    promptNote = '',
  } = payload;

  const domain = detectEvaluationDomain(tableName, dashboardContext, promptNote);
  const nowIso = new Date().toISOString();

  const ai = getGeminiClient();

  // If Gemini client is not configured (e.g. no API key provided in environment),
  // return high-fidelity domain heuristic evaluation immediately.
  if (!ai) {
    const evaluation = generateDomainHeuristicEvaluation(
      domain,
      tableName,
      dashboardContext,
      filterContext,
      summaryMetrics,
      sampleRows
    );
    return {
      success: true,
      evaluation,
      source: 'heuristic',
      domain,
      modelUsed: 'Operational Heuristic Engine',
      notice: 'GEMINI_API_KEY belum disetel di environment Vercel/Hosting. Menampilkan analisis operasional terverifikasi.',
      generatedAt: nowIso,
    };
  }

  const trimmedRows = (sampleRows || []).slice(0, 35);
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

  try {
    const result = await generateGeminiEvaluation(ai, userPrompt, systemInstruction);
    return {
      success: true,
      evaluation: result.text,
      source: 'gemini',
      domain,
      modelUsed: result.modelUsed,
      generatedAt: nowIso,
    };
  } catch (apiErr: any) {
    console.warn('[Gemini API] Upstream load or quota limit. Serving operational analysis:', apiErr?.message || apiErr);
    const fallbackText = generateDomainHeuristicEvaluation(
      domain,
      tableName,
      dashboardContext,
      filterContext,
      summaryMetrics,
      sampleRows
    );
    return {
      success: true,
      evaluation: fallbackText,
      source: 'fallback',
      domain,
      modelUsed: 'Operational Analysis Engine',
      notice: 'Layanan AI beralih ke mesin evaluasi operasional cerdas (Upstream busy).',
      generatedAt: nowIso,
    };
  }
}
