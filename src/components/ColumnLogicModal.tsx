import React, { useState, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  Workflow, 
  ArrowRight, 
  Database, 
  FileSpreadsheet, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  Code2, 
  Eye, 
  Sparkles,
  Layers,
  ChevronDown
} from 'lucide-react';
import { KeyColumnDetail, SpreadsheetSourceItem } from '../data/spreadsheetColumnDetails';

interface ColumnLogicModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: SpreadsheetSourceItem | null;
  columnDetail: KeyColumnDetail | null;
  allSources: SpreadsheetSourceItem[];
  onSelectColumn: (source: SpreadsheetSourceItem, columnDetail: KeyColumnDetail) => void;
}

export const ColumnLogicModal: React.FC<ColumnLogicModalProps> = ({
  isOpen,
  onClose,
  source,
  columnDetail,
  allSources,
  onSelectColumn
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'mapping' | 'evaluation'>('pipeline');

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !source || !columnDetail) return null;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      id="column-logic-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in zoom-in-95 duration-200"
        id="column-logic-modal"
        role="dialog"
        aria-modal="true"
      >
        {/* MODAL HEADER */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-start justify-between border-b border-slate-800">
          <div className="flex items-start space-x-3.5 min-w-0 pr-4">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center shrink-0 mt-0.5 text-red-400">
              <Workflow className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-red-600 text-white font-mono text-xs font-black">
                  {columnDetail.column}
                </span>
                <span className="text-slate-300 text-xs font-semibold">
                  Sheet: <strong>"{source.sheetName}"</strong>
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-bold border border-slate-700">
                  Modul {source.module}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-1 truncate">
                {columnDetail.fieldName}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                {columnDetail.note}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <a
              href={source.editUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors border border-slate-700/80"
              title="Buka Google Spreadsheet asli"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Buka Sheets</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Tutup (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* COLUMN QUICK SWITCHER BAR */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between gap-3 overflow-x-auto text-xs">
          <div className="flex items-center space-x-2 shrink-0 text-slate-500 font-bold">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Pilih Kolom:</span>
          </div>
          <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5 scrollbar-none">
            {source.keyColumns.map((col, idx) => (
              <button
                key={idx}
                onClick={() => onSelectColumn(source, col)}
                className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold shrink-0 transition-all ${
                  col.column === columnDetail.column
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-200/80 text-slate-700 border border-slate-200'
                }`}
              >
                {col.column}: {col.fieldName}
              </button>
            ))}
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="border-b border-slate-200 px-6 flex items-center space-x-2 bg-white">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`py-3.5 px-4 text-xs font-extrabold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'pipeline'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Workflow className="w-4 h-4" />
            <span>Alur Ekstraksi (4 Tahap Pipeline)</span>
          </button>
          <button
            onClick={() => setActiveTab('mapping')}
            className={`py-3.5 px-4 text-xs font-extrabold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'mapping'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Pemetaan Halaman & Komponen</span>
          </button>
          <button
            onClick={() => setActiveTab('evaluation')}
            className={`py-3.5 px-4 text-xs font-extrabold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'evaluation'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Panduan Evaluasi & Cek Nilai (Owner)</span>
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE CONTENT) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">

          {/* TAB 1: 4-STAGE PIPELINE */}
          {activeTab === 'pipeline' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Executive Summary Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Ringkasan Logika Transformasi
                  </span>
                  <button
                    onClick={() => handleCopy(columnDetail.transformationLogic, 'logic')}
                    className="inline-flex items-center space-x-1 text-[11px] font-bold text-slate-500 hover:text-red-600"
                  >
                    {copiedType === 'logic' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Logika</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {columnDetail.transformationLogic}
                </p>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
                    <span className="text-slate-400 font-bold">Formula Inti:</span>
                    <code className="text-red-600 font-mono font-bold text-[11px]">
                      {columnDetail.formula}
                    </code>
                  </div>
                </div>
              </div>

              {/* 4 Stepper Cards */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center space-x-2">
                  <Workflow className="w-4 h-4 text-red-600" />
                  <span>Tahapan Pemrosesan Data (End-to-End Pipeline)</span>
                </h3>

                <div className="grid grid-cols-1 gap-3.5">
                  {columnDetail.steps.map((st) => (
                    <div 
                      key={st.step}
                      className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col sm:flex-row items-start gap-4 group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs group-hover:bg-red-600 transition-colors">
                        {st.step}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                          {st.title}
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {st.description}
                        </p>
                        {st.codeSnippet && (
                          <div className="mt-2 bg-slate-900 text-slate-200 p-2.5 rounded-xl text-[11px] font-mono overflow-x-auto border border-slate-800">
                            <code>{st.codeSnippet}</code>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MAPPING TO DASHBOARD PAGES & COMPONENTS */}
          {activeTab === 'mapping' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Target Location Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Tempat Data Muncul & Tersaji di Web
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                      Halaman Dashboard Tujuan:
                    </span>
                    <div className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-red-600" />
                      <span>{columnDetail.targetPage}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                      Komponen / Elemen Visual UI:
                    </span>
                    <div className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      <span>{columnDetail.targetComponent}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Raw vs Output Comparison */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Perbandingan Nilai: Spreadsheet Asli vs Tampilan Dashboard
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
                    <span className="text-[11px] font-black text-amber-700 uppercase tracking-wide flex items-center space-x-1">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Data Mentah di Google Sheet:</span>
                    </span>
                    <div className="p-2.5 bg-white rounded-lg border border-amber-200 font-mono text-xs text-amber-950 font-bold break-all">
                      {columnDetail.sampleRaw}
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Tipe data: <strong>{columnDetail.rawDataType}</strong>
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
                    <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wide flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Hasil Tersaji di Dashboard:</span>
                    </span>
                    <div className="p-2.5 bg-white rounded-lg border border-emerald-200 font-bold text-xs text-emerald-950 break-all">
                      {columnDetail.sampleOutput}
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      Tipe tersanitasi: <strong>{columnDetail.cleanedDataType}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EVALUATION GUIDE FOR OWNER */}
          {activeTab === 'evaluation' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-red-600">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Panduan Cek & Evaluasi Nilai untuk Owner</span>
                </div>

                <div className="p-4 rounded-xl bg-red-50/70 border border-red-200/80 space-y-2">
                  <span className="text-xs font-extrabold text-red-900 block">
                    Pedoman Pemeriksaan Kolom {columnDetail.column} ({columnDetail.fieldName}):
                  </span>
                  <p className="text-xs text-red-950 leading-relaxed font-medium">
                    {columnDetail.evaluationGuide}
                  </p>
                </div>

                {/* Practical Checklist */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-extrabold text-slate-800 block">
                    Daftar Periksa Cepat (Quality Assurance Checklist):
                  </span>
                  <div className="space-y-2 text-xs text-slate-700">
                    <div className="flex items-start space-x-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Pastikan baris header sheet tidak terhapus atau bergeser posisinya.</span>
                    </div>
                    <div className="flex items-start space-x-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Hindari menyisipkan sel gabungan (merged cells) pada kolom referensi ini.</span>
                    </div>
                    <div className="flex items-start space-x-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Gunakan tombol <strong>Segarkan Data</strong> di pojok kanan atas untuk memicu pembacaan ulang instan setelah memperbarui spreadsheet.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="bg-white border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Dokumentasi Logika Real-time PCC v3.8</span>
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto">
            <button
              onClick={() => handleCopy(columnDetail.formula, 'formula')}
              className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              {copiedType === 'formula' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Formula Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Salin Formula</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              Tutup Panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
