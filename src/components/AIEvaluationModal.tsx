import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  Sparkles,
  X,
  RefreshCw,
  Copy,
  Check,
  Download,
  AlertCircle,
  Table,
  Layers,
  Calendar,
  Cpu,
  CheckCircle2,
  FileText,
  Clock,
  Printer,
} from 'lucide-react';

export interface AIEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
  dashboardContext: string;
  filterContext?: Record<string, any>;
  summaryMetrics?: Record<string, any>;
  sampleRows?: any[];
  promptNote?: string;
}

export function AIEvaluationButton({
  onClick,
  className = '',
  size = 'md',
}: {
  onClick: (e: React.MouseEvent) => void;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-1 text-[11px] gap-1'
      : 'px-2.5 py-1.5 text-xs gap-1.5';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      className={`inline-flex items-center font-bold rounded-lg bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer active:scale-95 ${sizeClasses} ${className}`}
      title="Dapatkan ringkasan evaluasi dan rekomendasi performansi tabel ini dari AI"
    >
      <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
      <span>Evaluasi AI</span>
    </button>
  );
}

export default function AIEvaluationModal({
  isOpen,
  onClose,
  tableName,
  dashboardContext,
  filterContext = {},
  summaryMetrics = {},
  sampleRows = [],
  promptNote = '',
}: AIEvaluationModalProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [source, setSource] = useState<string>('');
  const [modelUsed, setModelUsed] = useState<string>('gemini-3.8-flash');
  const [notice, setNotice] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string>('');

  const fetchEvaluation = async () => {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch('/api/evaluate-performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableName,
          dashboardContext,
          filterContext,
          summaryMetrics,
          sampleRows: sampleRows.slice(0, 30),
          promptNote,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      if (data.evaluation) {
        setEvaluation(data.evaluation);
        setSource(data.source || 'gemini');
        setModelUsed(data.modelUsed || 'gemini-3.8-flash');
        setNotice(data.notice || null);
        setGeneratedAt(
          new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        );
      } else {
        throw new Error('Tidak menerima konten evaluasi dari server');
      }
    } catch (err: any) {
      console.warn('Failed to fetch AI evaluation:', err?.message || err);
      setError(err?.message || 'Gagal menghasilkan evaluasi AI.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEvaluation();
    } else {
      setEvaluation('');
      setError(null);
      setCopied(false);
    }
  }, [isOpen, tableName]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!evaluation) return;
    navigator.clipboard.writeText(
      `EVALUASI PERFORMANSI AI - ${tableName}\nKonteks: ${dashboardContext}\n\n${evaluation}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!evaluation) return;
    const blob = new Blob(
      [
        `=========================================================================\n` +
          `LAPORAN RESUME EKSEKUTIF PERFORMANSI OPERASIONAL - TELKOM AKSES\n` +
          `Tabel: ${tableName}\n` +
          `Dashboard: ${dashboardContext}\n` +
          `Waktu: ${new Date().toLocaleString('id-ID')}\n` +
          `=========================================================================\n\n` +
          evaluation,
      ],
      { type: 'text/plain;charset=utf-8' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Resume_Eksekutif_${tableName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Custom polished components for Markdown rendering
  const markdownComponents = {
    h2: ({ children }: any) => (
      <div className="mb-4 pb-3 border-b-2 border-slate-200 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-6 rounded-sm bg-red-600 shrink-0" />
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            {children}
          </h2>
        </div>
        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10.5px] font-bold tracking-wider uppercase">
          Laporan Manajemen Operasional
        </span>
      </div>
    ),
    h3: ({ children }: any) => (
      <div className="mt-7 mb-3.5">
        <div className="px-3.5 py-2.5 rounded-xl bg-slate-900 text-white flex items-center gap-2.5 shadow-xs">
          <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 ring-4 ring-red-500/20" />
          <h3 className="text-xs sm:text-sm font-black tracking-wide uppercase flex-1">
            {children}
          </h3>
        </div>
      </div>
    ),
    h4: ({ children }: any) => (
      <div className="mt-4 mb-2 flex items-center gap-2">
        <div className="px-3 py-1.5 rounded-lg bg-red-50/80 border border-red-200/90 text-red-950 text-xs font-black tracking-wide flex items-center gap-1.5 shadow-2xs">
          <div className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
          <span>{children}</span>
        </div>
      </div>
    ),
    blockquote: ({ children }: any) => (
      <div className="my-4 rounded-xl bg-slate-50/90 border border-slate-200/90 p-4 text-xs text-slate-800 shadow-2xs space-y-2 border-l-4 border-l-red-600">
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-red-600" />
          <span>Parameter & Status Evaluasi</span>
        </div>
        <div className="space-y-1.5 font-medium leading-relaxed">
          {children}
        </div>
      </div>
    ),
    table: ({ children }: any) => (
      <div className="my-4 overflow-x-auto rounded-xl border border-slate-250 bg-white shadow-2xs">
        <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
        {children}
      </thead>
    ),
    th: ({ children }: any) => (
      <th className="px-3.5 py-3 text-left font-extrabold border-b border-slate-800 tracking-wider">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-3.5 py-2.5 text-xs text-slate-700 border-b border-slate-100 last:border-0">
        {children}
      </td>
    ),
    tr: ({ children }: any) => (
      <tr className="hover:bg-red-50/20 transition-colors odd:bg-white even:bg-slate-50/40">
        {children}
      </tr>
    ),
    ul: ({ children }: any) => (
      <ul className="space-y-2.5 my-3 pl-0 list-none">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="space-y-2.5 my-3 pl-0 list-none">
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li className="text-xs text-slate-700 leading-relaxed flex items-start gap-2.5 bg-slate-50/70 hover:bg-slate-100/60 transition-colors p-3 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="w-1.5 h-1.5 rounded-full bg-red-600 mt-1.5 shrink-0" />
        <div className="flex-1 space-y-1">{children}</div>
      </li>
    ),
    p: ({ children }: any) => (
      <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed my-2">
        {children}
      </p>
    ),
    strong: ({ children }: any) => (
      <strong className="font-extrabold text-slate-950">
        {children}
      </strong>
    ),
    hr: () => (
      <hr className="my-5 border-t border-slate-200" />
    ),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-red-50/40 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-xs shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Evaluasi & Rekomendasi AI
                </h3>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${
                  source === 'fallback' || source === 'heuristic'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}>
                  <Cpu className="w-3 h-3" />
                  {modelUsed === 'gemini-3.1-flash-lite'
                    ? 'Gemini 3.1 Flash Lite'
                    : modelUsed === 'gemini-3.8-flash'
                    ? 'Gemini 3.8 Flash'
                    : modelUsed === 'gemini-flash-latest'
                    ? 'Gemini Flash'
                    : 'Analisa Operasional Cerdas'}
                </span>
                {source && (
                  <span className="text-[10px] text-slate-400 font-medium">
                    ({source === 'gemini' ? 'Online AI' : 'Mode Terverifikasi'})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5 font-medium flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-800">{tableName}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">{dashboardContext}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={fetchEvaluation}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Analisis Ulang"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-600' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Tutup Dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter / Context Bar */}
        {(Object.keys(filterContext).length > 0 || Object.keys(summaryMetrics).length > 0) && (
          <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-3 overflow-x-auto text-xs text-slate-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
              Konteks Data:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {Object.entries(filterContext)
                .filter(([_, val]) => val !== undefined && val !== null && val !== '')
                .map(([key, val]) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-medium text-slate-700 shadow-2xs"
                  >
                    <span className="text-slate-400 font-normal">{key}:</span>
                    <span className="font-semibold">{String(val)}</span>
                  </span>
                ))}
              {Object.entries(summaryMetrics).slice(0, 4).map(([key, val]) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50/70 border border-red-100 text-[11px] font-medium text-red-900 shadow-2xs"
                >
                  <span className="text-red-400 font-normal">{key}:</span>
                  <span className="font-bold">{typeof val === 'number' ? val.toLocaleString('id-ID') : String(val)}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 bg-white space-y-4">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-red-100 border-t-red-600 animate-spin" />
                <Sparkles className="w-5 h-5 text-amber-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-800">
                  AI sedang menganalisis indikator performansi...
                </p>
                <p className="text-xs text-slate-500 mt-0.5 max-w-sm">
                  Mengevaluasi metrik pencapaian, mengidentifikasi anomali/bottleneck, dan merumuskan rekomendasi operasional.
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-red-900">Kendala Evaluasi AI</h4>
                <p className="text-xs text-red-700 mt-1">{error}</p>
                <button
                  type="button"
                  onClick={fetchEvaluation}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Coba Lagi
                </button>
              </div>
            </div>
          ) : (
            <div className="ai-evaluation-content text-slate-700 text-sm leading-relaxed space-y-3">
              {notice && (
                <div className="px-3.5 py-2 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{notice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={fetchEvaluation}
                    className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline shrink-0 cursor-pointer"
                  >
                    Coba Refresh AI
                  </button>
                </div>
              )}
              <div className="markdown-body max-w-none text-slate-700">
                <Markdown components={markdownComponents}>{evaluation}</Markdown>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 text-[11px] flex items-center gap-2 flex-wrap">
            {generatedAt && (
              <span className="flex items-center gap-1 text-slate-500 font-medium">
                <Clock className="w-3 h-3 text-slate-400" />
                Diperbarui {generatedAt}
              </span>
            )}
            {evaluation && (
              <>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 text-slate-500">
                  <FileText className="w-3 h-3 text-slate-400" />
                  {evaluation.split(/\s+/).filter(Boolean).length} kata
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">Laporan Resmi Telkom Akses</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={loading || !evaluation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold transition shadow-2xs cursor-pointer disabled:opacity-50"
              title="Cetak atau simpan sebagai PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Cetak</span>
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={loading || !evaluation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold transition shadow-2xs cursor-pointer disabled:opacity-50"
              title="Salin teks evaluasi ke clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Salin</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={loading || !evaluation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold transition shadow-2xs cursor-pointer disabled:opacity-50"
              title="Unduh sebagai file teks dokumen"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Unduh TXT</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold transition shadow-2xs cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
