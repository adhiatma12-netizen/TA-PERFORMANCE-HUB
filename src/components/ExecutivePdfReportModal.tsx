import React, { useState, useMemo } from 'react';
import {
  FileDown,
  X,
  Printer,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Activity,
  Layers,
  Wrench,
  Users,
  ShieldCheck,
  Building2,
  BarChart3,
  Calendar,
  Sparkles,
  Table,
  Filter,
} from 'lucide-react';
import { Regional, RegionalPerformanceData, PerformanceDashboardData } from '../types';
import { ProvisioningRow } from '../data/provisioningStats';
import {
  AppDomainTab,
  getDomainReportData,
  generateAndDownloadDomainPdf,
} from '../lib/pdfReportEngine';

interface ExecutivePdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDomain?: AppDomainTab;
  activeSubTab?: string;
  activeRegional?: Regional;
  activeMonth?: string;
  activeYear?: string;
  currentData?: RegionalPerformanceData;
  allRegionsData?: PerformanceDashboardData;
  provisioningData?: ProvisioningRow[];
  uptime?: string;
}

export default function ExecutivePdfReportModal({
  isOpen,
  onClose,
  activeDomain = 'business',
  activeSubTab = '',
  activeRegional = 'All',
  activeMonth = 'Juli',
  activeYear = '2026',
  currentData,
  allRegionsData,
  provisioningData,
  uptime = '99.99%',
}: ExecutivePdfReportModalProps) {
  // Allow user to toggle or inspect other domains if needed, default to current page
  const [selectedDomain, setSelectedDomain] = useState<AppDomainTab>(activeDomain);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'tables' | 'evaluasi' | 'action_plan'>('overview');

  // Keep selected domain in sync with prop when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedDomain(activeDomain);
    }
  }, [isOpen, activeDomain]);

  // Fallback data if currentData is missing
  const safeCurrentData: RegionalPerformanceData = useMemo(() => {
    if (currentData) return currentData;
    return {
      regional: activeRegional,
      business: {
        revenue: 14.8,
        revenueTarget: 15.0,
        cogs: 8.2,
        cogsBudget: 8.5,
        ebitda: 6.6,
        ebitdaTarget: 6.5,
        netIncome: 3.4,
        opex: 4.8,
        capex: 3.2,
        costOfQuality: 0.65,
      },
      assurance: {
        totalTickets: 2649,
        resolvedTickets: 2518,
        pendingTickets: 131,
        mttrHours: 17.15,
        mttrTarget: 18.0,
        slaCompliance: 94.2,
        repeatTroubleRate: 5.2,
        backlogTrend: [],
        ticketByProduct: [],
      },
      provisioning: {
        psbTarget: 6200,
        psbActual: 5820,
        activationRate: 89.2,
        leadTimeDays: 2.1,
        leadTimeTarget: 2.5,
        pendingInstallations: 184,
        cancelRate: 3.8,
        weeklyTrends: [],
      },
      qe: {
        overallQEScore: 91.8,
        patrolCompliance: 93.4,
        k3AuditViolations: 0,
        materialConformity: 96.2,
        pmExecutionRate: 92.5,
        findingsCategory: [],
        incidentRate: 0,
      },
      technicians: {
        totalTechnicians: 114,
        activeTechnicians: 108,
        utilizationRate: 94.7,
        avgProductivityScore: 4.85,
        certificationRate: 88.5,
        topTechnicians: [],
      },
    };
  }, [currentData, activeRegional]);

  // Derive domain-specific report configuration
  const reportConfig = useMemo(() => {
    return getDomainReportData(
      selectedDomain,
      safeCurrentData,
      activeRegional,
      activeMonth,
      activeYear,
      allRegionsData,
      provisioningData,
      activeSubTab
    );
  }, [selectedDomain, safeCurrentData, activeRegional, activeMonth, activeYear, allRegionsData, provisioningData, activeSubTab]);

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      generateAndDownloadDomainPdf(
        reportConfig,
        activeRegional,
        activeMonth,
        activeYear,
        uptime
      );
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Terjadi kendala saat menyusun PDF. Silakan gunakan opsi Cetak di browser.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const domainOptions: { key: AppDomainTab; label: string; icon: React.ReactNode }[] = [
    { key: 'business', label: '1. Bisnis & Finansial', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { key: 'assurance', label: '2. Assurance Gangguan', icon: <Activity className="w-3.5 h-3.5" /> },
    { key: 'provisioning', label: '3. Provisioning PSB', icon: <Building2 className="w-3.5 h-3.5" /> },
    { key: 'qe', label: '4. Quality Eng (QE)', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { key: 'technician', label: '5. Produktivitas Teknisi', icon: <Users className="w-3.5 h-3.5" /> },
    { key: 'kelola-data', label: '6. Tata Kelola & Data', icon: <Layers className="w-3.5 h-3.5" /> },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
      id="executive-pdf-report-modal"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Header Bar */}
        <div className="px-6 py-4 bg-slate-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md font-bold shrink-0">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-red-600/90 text-white">
                  Laporan Resume PDF Resmi
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {activeRegional} • {activeMonth} {activeYear}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                  Sub-Halaman: {reportConfig.activeSubTabName}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight mt-0.5">
                {reportConfig.domainTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              title="Unduh Dokumen Lengkap Format PDF"
              id="btn-modal-generate-pdf"
            >
              <FileDown className={`w-4 h-4 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
              <span>{isGeneratingPdf ? 'Menyusun File PDF...' : 'Download PDF Sekarang'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer hidden sm:flex"
              title="Cetak via Browser"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              title="Tutup Jendela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Domain Switcher & Tab Navigation */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Domain Picker Pill */}
          <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
              <Filter className="w-3 h-3 text-red-600" />
              Halaman:
            </span>
            {domainOptions.map(opt => (
              <button
                key={opt.key}
                onClick={() => setSelectedDomain(opt.key)}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedDomain === opt.key
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title={`Lihat Data Laporan Domain ${opt.label}`}
              >
                {opt.icon}
                <span>{opt.label.split(' ')[1]}</span>
              </button>
            ))}
          </div>

          {/* Section Tabs inside modal */}
          <div className="flex items-center space-x-1.5 font-bold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              📊 Resume & Indikator
            </button>
            <button
              onClick={() => setActiveTab('tables')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeTab === 'tables'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              📋 Tabel Pendukung Data
            </button>
            <button
              onClick={() => setActiveTab('evaluasi')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeTab === 'evaluasi'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              ⚙️ Evaluasi Komprehensif
            </button>
            <button
              onClick={() => setActiveTab('action_plan')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeTab === 'action_plan'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              🎯 Rekomendasi & Action Plan
            </button>
          </div>
        </div>

        {/* Scrollable Document Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          
          {/* TAB 1: OVERVIEW & KPI SCORECARD */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Executive Summary Card */}
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-2xl p-6 text-white shadow-lg border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 bg-red-600 text-white text-xs font-black rounded-md uppercase tracking-wider">
                    {reportConfig.domainBadge}
                  </span>
                  <span className="text-xs text-slate-300 font-mono">
                    NOC Status: <strong className="text-emerald-400">ONLINE ({uptime})</strong>
                  </span>
                </div>
                <h3 className="text-lg font-black mb-2">
                  Ringkasan Eksekutif Hasil Evaluasi Komprehensif Halaman Ini
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
                  {reportConfig.executiveSummary}
                </p>
              </div>

              {/* 4 Multi-Domain KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {reportConfig.kpiCards.map((kpi, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <span className="text-xs font-bold text-slate-500">{kpi.title}</span>
                    <div className="text-2xl font-black text-slate-900 mt-1">{kpi.val}</div>
                    <div className="text-xs text-slate-600 font-medium mt-1">{kpi.sub}</div>
                  </div>
                ))}
              </div>

              {/* Tabel 1: Matriks Capaian Indikator Kinerja Utama */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Table className="w-4 h-4 text-red-600" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Tabel 1: Matriks Capaian Indikator Kinerja Utama ({reportConfig.domainBadge})
                    </h4>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">
                    Sesuai Indikator Halaman & Sub-Halaman
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-red-600 text-white font-bold">
                        {reportConfig.kpiTable.columns.map((col, cIdx) => (
                          <th
                            key={cIdx}
                            className={`p-2.5 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                            style={{ width: `${col.width}%` }}
                          >
                            {col.header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportConfig.kpiTable.rows.map((row, rIdx) => (
                        <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className={`p-2.5 ${
                                reportConfig.kpiTable.columns[cIdx]?.align === 'right'
                                  ? 'text-right font-mono font-medium'
                                  : reportConfig.kpiTable.columns[cIdx]?.align === 'center'
                                  ? 'text-center'
                                  : 'text-left'
                              }`}
                            >
                              {cIdx === 5 ? (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {cell}
                                </span>
                              ) : (
                                cell
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SUPPORTING OPERATIONAL TABLES */}
          {activeTab === 'tables' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center space-x-2">
                    <Table className="w-4 h-4 text-red-600" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      {reportConfig.supportingTable.title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {reportConfig.supportingTable.description}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold">
                        {reportConfig.supportingTable.columns.map((col, cIdx) => (
                          <th
                            key={cIdx}
                            className={`p-2.5 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                            style={{ width: `${col.width}%` }}
                          >
                            {col.header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportConfig.supportingTable.rows.map((row, rIdx) => (
                        <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className={`p-2.5 ${
                                reportConfig.supportingTable.columns[cIdx]?.align === 'right'
                                  ? 'text-right font-mono font-medium'
                                  : reportConfig.supportingTable.columns[cIdx]?.align === 'center'
                                  ? 'text-center'
                                  : 'text-left'
                              }`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Tabel pendukung ini akan otomatis dicetak lengkap pada <strong>Halaman 2 file PDF</strong> hasil unduhan.
                  </span>
                </div>
                <span className="font-mono text-slate-400 font-bold">
                  {reportConfig.supportingTable.rows.length} Baris Data Terverifikasi
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: COMPREHENSIVE TECHNICAL & NON-TECHNICAL EVALUATION */}
          {activeTab === 'evaluasi' && (
            <div className="space-y-6">
              {/* Evaluasi Teknis */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <div className="flex items-center space-x-2 text-red-600 mb-2">
                  <Wrench className="w-5 h-5" />
                  <h3 className="text-base font-black text-slate-900">A. Evaluasi Aspek Teknis Operasional</h3>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Temuan evaluasi mendalam terhadap aspek fisik, konfigurasi, jaringan, dan perangkat pada domain ini.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {reportConfig.evaluasiTeknis.map((item, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="font-black text-slate-800 mb-1">{item.point}</div>
                      <p className="text-slate-600 leading-relaxed text-[11px]">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evaluasi Non-Teknis */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <div className="flex items-center space-x-2 text-blue-600 mb-2">
                  <Users className="w-5 h-5" />
                  <h3 className="text-base font-black text-slate-900">B. Evaluasi Aspek Non-Teknis & Prosedural</h3>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Analisis faktor koordinasi tim, administrasi, perizinan, komunikasi pelanggan, dan kepatuhan SOP.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {reportConfig.evaluasiNonTeknis.map((item, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="font-black text-slate-800 mb-1">{item.point}</div>
                      <p className="text-slate-600 leading-relaxed text-[11px]">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* RCA Ishikawa Matrix */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                <h3 className="text-base font-black text-slate-900 mb-1">
                  C. Matriks Analisis Akar Masalah (Root Cause Analysis - Ishikawa)
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Penguraian sumber deviasi kinerja berdasarkan 4 pilar utama operasional.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {reportConfig.rcaItems.map((rca, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-black text-slate-800">{rca.pillar}</span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-red-100 text-red-700">
                          {rca.badge}
                        </span>
                      </div>
                      <ul className="space-y-1.5 text-[11px] text-slate-600">
                        {rca.causes.map((c, cIdx) => (
                          <li key={cIdx} className="flex items-start gap-1.5">
                            <span className="text-red-500 font-bold">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ACTION PLAN & RECOMMENDATIONS */}
          {activeTab === 'action_plan' && (
            <div className="space-y-6">
              {/* Tabel 3: Action Plan Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center space-x-2">
                    <Table className="w-4 h-4 text-red-600" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Tabel 3: Rencana Tindak Lanjut & Action Plan Strategis ({reportConfig.domainBadge})
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Matriks program perbaikan terstruktur dengan target terukur, timeline, dan PIC penanggung jawab.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-red-600 text-white font-bold">
                        {reportConfig.actionPlanTable.columns.map((col, cIdx) => (
                          <th
                            key={cIdx}
                            className={`p-2.5 ${col.align === 'center' ? 'text-center' : 'text-left'}`}
                            style={{ width: `${col.width}%` }}
                          >
                            {col.header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportConfig.actionPlanTable.rows.map((row, rIdx) => (
                        <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className={`p-2.5 ${
                                reportConfig.actionPlanTable.columns[cIdx]?.align === 'center'
                                  ? 'text-center font-bold text-red-600'
                                  : 'text-left'
                              }`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Implementation Framework */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Prinsip Eksekusi Rencana Tindak Lanjut (PDCA Cycle)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-red-600 font-black font-mono">1. PLAN</span>
                    <p className="text-slate-600 text-[11px] mt-1">Penyusunan target baseline dan pemetaan sumber daya.</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-blue-600 font-black font-mono">2. DO</span>
                    <p className="text-slate-600 text-[11px] mt-1">Eksekusi perbaikan langsung di lapangan dengan tim.</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-amber-600 font-black font-mono">3. CHECK</span>
                    <p className="text-slate-600 text-[11px] mt-1">Monitoring deviasi harian melalui dashboard NOC.</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-emerald-600 font-black font-mono">4. ACTION</span>
                    <p className="text-slate-600 text-[11px] mt-1">Standarisasi SOP baru dan evaluasi berkala.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Laporan PDF menyajikan data & tabel pendukung spesifik untuk <strong>{reportConfig.domainTitle}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center space-x-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'Menyusun File PDF...' : 'Download File PDF (.pdf)'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
