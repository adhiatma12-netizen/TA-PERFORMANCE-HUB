import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  Calendar,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  RefreshCw,
  Search,
  Filter,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  FileSpreadsheet,
  Layers,
  ChevronDown,
  TrendingUp,
  SlidersHorizontal,
  Table,
  Sparkles,
  ArrowUpDown,
  Building2,
  MapPin,
  Check,
  BarChart3,
} from 'lucide-react';
import { MonthKpiDataset, KpiSectorRow, KpiIndicatorSummaryRow } from '../types/kpiImbalJasa';
import {
  KPI_DATASETS,
  SPREADSHEET_CONFIG,
  MONTH_OPTIONS,
} from '../data/kpiSpreadsheetDatabase';
import { fetchKpiSpreadsheetData, KpiMonth } from '../lib/kpiSpreadsheetService';
import AIEvaluationModal, { AIEvaluationButton } from './AIEvaluationModal';
import KpiImbalJasaAnalytics from './KpiImbalJasaAnalytics';

export default function KpiImbalJasaDashboard() {
  // 1. Month filter (Dropdown)
  const [selectedBulan, setSelectedBulan] = useState<KpiMonth>('SEPTEMBER');
  
  // 2. Active View Tab: 'analytics' (Grafik & Diagram Analisa) | 'matrix' (Matriks 16 Sektor) | 'indicators' (Rekap 17 Indikator)
  const [activeTab, setActiveTab] = useState<'analytics' | 'matrix' | 'indicators'>('analytics');

  // 3. Dataset state
  const [dataset, setDataset] = useState<MonthKpiDataset>(() => KPI_DATASETS.SEPTEMBER);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 4. Filters & Search for the Matrix
  const [selectedArea, setSelectedArea] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<keyof KpiSectorRow>('rank');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // 5. Image Viewer Controls
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);

  // 6. AI Evaluation Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);

  // Load data whenever month changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchKpiSpreadsheetData(selectedBulan).then((res) => {
      if (isMounted) {
        setDataset(res.data);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedBulan]);

  // Handle manual refresh from sheet
  const handleRefresh = async () => {
    setIsLoading(true);
    const res = await fetchKpiSpreadsheetData(selectedBulan);
    setDataset(res.data);
    setIsLoading(false);
  };

  // Distinct Service Areas
  const serviceAreas = useMemo(() => {
    const areas = new Set<string>();
    dataset.sectorRows.forEach((r) => areas.add(r.serviceArea));
    return Array.from(areas).sort();
  }, [dataset]);

  // Filtered and sorted sector rows
  const filteredRows = useMemo(() => {
    return dataset.sectorRows
      .filter((row) => {
        const matchArea = selectedArea === 'ALL' || row.serviceArea === selectedArea;
        const matchQuery =
          searchQuery.trim() === '' ||
          row.sektor.toLowerCase().includes(searchQuery.toLowerCase()) ||
          row.serviceArea.toLowerCase().includes(searchQuery.toLowerCase());
        return matchArea && matchQuery;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }
        return sortAsc
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
  }, [dataset, selectedArea, searchQuery, sortField, sortAsc]);

  // Toggle sorting
  const handleSort = (field: keyof KpiSectorRow) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'rank' ? true : false);
    }
  };

  // Export Table to CSV
  const handleExportCsv = () => {
    const headers = [
      'No',
      'Service Area',
      'Sektor',
      'ASGAR (%)',
      'Service Availability (%)',
      'TTR 24H Non HVC (%)',
      'TTR 3H Diamond (%)',
      'TTR 3H Manja (%)',
      'TTR 6H Platinum (%)',
      'TTR 12H Gold (%)',
      'Outstanding Saldo (Unit)',
      'Valins DC QR & Service (%)',
      'Valins Visit ODP (%)',
      'TTR Comp SQM 4H (%)',
      'Unspec Non Warranty (%)',
      'Closed SQM (%)',
      'SCC Inet (%)',
      'Cek Fungsi Splicer (%)',
      'Jumlah ARC Count (%)',
      'Rasio Inuse to Instock (%)',
      'PERF',
      'RANK SEKTOR',
    ];

    const rows = filteredRows.map((r, idx) => [
      idx + 1,
      `"${r.serviceArea}"`,
      `"${r.sektor}"`,
      r.asgar,
      r.serviceAvailability,
      r.ttr24hNonHvc,
      r.ttr3hDiamond,
      r.ttr3hManja,
      r.ttr6hPlatinum,
      r.ttr12hGold,
      r.outstandingSaldo,
      r.valinsDc,
      r.valinsVisit,
      r.ttrCompSqm4h,
      r.unspecNonWarranty,
      r.closedSqm,
      r.sccInet,
      r.cekFungsiSplicer,
      r.jumlahArcCount,
      r.rasioInuseToInstock,
      r.perf,
      r.rank,
    ]);

    const branchRow = [
      '',
      '"TOTAL / BRANCH"',
      '"BRANCH MADIUN"',
      dataset.totalBranchRow.asgar,
      dataset.totalBranchRow.serviceAvailability,
      dataset.totalBranchRow.ttr24hNonHvc,
      dataset.totalBranchRow.ttr3hDiamond,
      dataset.totalBranchRow.ttr3hManja,
      dataset.totalBranchRow.ttr6hPlatinum,
      dataset.totalBranchRow.ttr12hGold,
      dataset.totalBranchRow.outstandingSaldo,
      dataset.totalBranchRow.valinsDc,
      dataset.totalBranchRow.valinsVisit,
      dataset.totalBranchRow.ttrCompSqm4h,
      dataset.totalBranchRow.unspecNonWarranty,
      dataset.totalBranchRow.closedSqm,
      dataset.totalBranchRow.sccInet,
      dataset.totalBranchRow.cekFungsiSplicer,
      dataset.totalBranchRow.jumlahArcCount,
      dataset.totalBranchRow.rasioInuseToInstock,
      dataset.totalBranchRow.perf,
      '-',
    ];

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(',')), branchRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `KPI_Imbal_Jasa_${selectedBulan}_${dataset.range}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to determine if a cell is below target (matches pink highlighting in image)
  const isBelowTarget = (code: string, value: number): boolean => {
    switch (code) {
      case 'asgar':
        return value < 91.71;
      case 'serviceAvailability':
        return value < 98.52;
      case 'ttr24hNonHvc':
        return value < 91.10;
      case 'ttr3hDiamond':
        return value < 95.25;
      case 'ttr3hManja':
        return value < 94.79;
      case 'ttr6hPlatinum':
        return value < 95.00;
      case 'ttr12hGold':
        return value < 83.00;
      case 'outstandingSaldo':
        return value > 12; // MIN polarity
      case 'valinsDc':
        return value < 95.00;
      case 'valinsVisit':
        return value < 90.91;
      case 'ttrCompSqm4h':
        return value < 47.00;
      case 'unspecNonWarranty':
        return value > 0.10; // MIN polarity
      case 'closedSqm':
        return value < 70.00;
      case 'sccInet':
        return value < 70.00;
      case 'cekFungsiSplicer':
        return value < 100.00;
      case 'jumlahArcCount':
        return value < 100.00;
      case 'rasioInuseToInstock':
        return value < 70.00;
      default:
        return false;
    }
  };

  // Rank badge styling
  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return 'bg-emerald-500 text-white font-bold ring-2 ring-emerald-300';
    }
    if (rank <= 3) {
      return 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300';
    }
    if (rank <= 8) {
      return 'bg-blue-100 text-blue-800 font-semibold border border-blue-200';
    }
    if (rank <= 12) {
      return 'bg-amber-100 text-amber-800 font-semibold border border-amber-200';
    }
    return 'bg-rose-100 text-rose-800 font-bold border border-rose-300';
  };

  return (
    <div className="space-y-6" id="kpi-imbal-jasa-container">
      {/* 1. TOP HEADER & FILTER BAR */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs" id="kpi-header-panel">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Title & Metadata */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                <Award className="w-3.5 h-3.5" />
                KPI ASSURANCE
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Spreadsheet: {SPREADSHEET_CONFIG.sheetName}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Range: {dataset.range}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {dataset.title}
            </h2>
          </div>

          {/* Right Controls: Filter Bulan Dropdown & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* BULAN FILTER DROPDOWN */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 shadow-2xs">
              <Calendar className="w-4 h-4 text-red-600 shrink-0" />
              <div className="flex flex-col">
                <label htmlFor="select-bulan" className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  Filter Bulan:
                </label>
                <select
                  id="select-bulan"
                  aria-label="Filter Bulan KPI Imbal Jasa"
                  value={selectedBulan}
                  onChange={(e) => setSelectedBulan(e.target.value as KpiMonth)}
                  className="bg-transparent text-sm font-extrabold text-slate-900 focus:outline-hidden cursor-pointer"
                >
                  {MONTH_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} ({opt.range})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              title="Periksa pembaruan data dan gambar di Google Spreadsheet"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Memuat...' : 'Sinkron Sheet'}</span>
            </button>

            {/* Open in Google Sheets link */}
            <a
              href={dataset.source.sheetDirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 transition-all shadow-2xs"
              title="Buka Spreadsheet di Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Buka Sheet</span>
              <ExternalLink className="w-3 h-3 text-emerald-600" />
            </a>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>

            {/* AI Evaluation Button */}
            <AIEvaluationButton
              onClick={() => setIsAiModalOpen(true)}
              className="px-3 py-2 text-xs"
            />
          </div>
        </div>
      </div>

      {/* 2. EXECUTIVE SUMMARY STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-summary-cards">
        {/* Card 1: Nilai Performansi Branch */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Performansi Branch</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {dataset.summary.perfBranch.toFixed(2)}%
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Target Tercapai (IOAN Madiun)</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Rata-Rata Achv:</span>
            <span className="font-bold text-slate-700">{dataset.summary.pencapaianRataRata.toFixed(1)}%</span>
          </div>
        </div>

        {/* Card 2: Status Hak Imbal Jasa */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hak Imbal Jasa</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-blue-950 tracking-tight">100% LUNAS</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-blue-700 font-semibold">
              <Check className="w-3.5 h-3.5" />
              <span>{dataset.summary.statusHakImbalJasa}</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Pencairan:</span>
            <span className="font-bold text-emerald-600">100% (Pinalti 0%)</span>
          </div>
        </div>

        {/* Card 3: Total Bobot & Indikator */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Indikator</span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-200">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {dataset.specs.length} Indikator
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-purple-700 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Bobot Total: {dataset.summary.totalBobot}%</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Skor Terbobot:</span>
            <span className="font-bold text-slate-700">{dataset.summary.totalSkor.toFixed(2)} / 100</span>
          </div>
        </div>

        {/* Card 4: Top Sektor & Cakupan Area */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sektor Terbaik (Rank 1)</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600 tracking-tight truncate">
              {dataset.summary.topSektorName}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
              <span>Nilai Sektor: {dataset.summary.topSektorPerf.toFixed(2)}%</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Cakupan:</span>
            <span className="font-bold text-slate-700">16 Sektor ({serviceAreas.length} Area)</span>
          </div>
        </div>
      </div>

      {/* 3. NAVIGATION VIEW TABS */}
      <div className="flex items-center justify-between flex-wrap gap-3" id="kpi-view-tab-bar">
        <div className="bg-slate-200/80 p-1 rounded-xl inline-flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            id="tab-btn-kpi-analytics"
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Grafik & Diagram Analisa KPI</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5 text-red-600" />
            <span>Matriks Sektor ({dataset.sectorRows.length} Sektor)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('indicators')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'indicators'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Rekap 17 Indikator KPI & Bobot</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: MATRIKS SEKTOR (LURUS DENGAN TABEL DI GAMBAR GOOGLE SPREADSHEET) */}
      {activeTab === 'matrix' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden" id="kpi-matrix-section">
          {/* Table Controls: Search & Area Filter */}
          <div className="p-4 border-b border-slate-200/80 bg-slate-50/60 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama sektor atau service area..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter Service Area */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-bold text-slate-500">Area:</span>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">Semua Area ({serviceAreas.length})</option>
                  {serviceAreas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block" />

              <span className="text-xs text-slate-500 font-medium">
                Menampilkan <strong className="text-slate-900">{filteredRows.length}</strong> dari {dataset.sectorRows.length} sektor
              </span>
            </div>
          </div>

          {/* Real Indicators Table Container with Horizontal Scroll */}
          <div className="overflow-x-auto max-h-[640px] relative">
            <table className="w-full text-left border-collapse text-xs">
              {/* Table Header Row 1: Columns */}
              <thead className="sticky top-0 z-20 bg-slate-100 text-slate-800 font-extrabold uppercase text-[10px] tracking-wider shadow-xs">
                <tr className="border-b border-slate-300">
                  <th className="px-3 py-2.5 sticky left-0 z-30 bg-slate-100 border-r border-slate-200 text-center w-12">
                    RANK
                  </th>
                  <th className="px-3 py-2.5 sticky left-12 z-30 bg-slate-100 border-r border-slate-200 min-w-[110px]">
                    SERVICE AREA
                  </th>
                  <th className="px-3 py-2.5 sticky left-[158px] z-30 bg-slate-100 border-r border-slate-200 min-w-[130px]">
                    SEKTOR
                  </th>
                  <th className="px-2.5 py-2.5 text-center min-w-[70px] border-r border-slate-200">ASGAR</th>
                  <th className="px-2.5 py-2.5 text-center min-w-[75px] border-r border-slate-200">SVC AVAIL</th>
                  <th className="px-2.5 py-2.5 text-center min-w-[75px] border-r border-slate-200">TTR 24H</th>
                  <th className="px-2.5 py-2.5 text-center min-w-[75px] border-r border-slate-200">TTR 3H DIA</th>
                  <th className="px-2.5 py-2.5 text-center min-w-[75px] border-r border-slate-200">TTR 3H MAN</th>
                  <th className="px-2.5 py-2.5 text-center min-w-[75px] border-r border-slate-200">TTR 6H PLAT</th>
                  <th className="px-2.5 py-2.5 text-center min-w-[75px] border-r border-slate-200">TTR 12H GOLD</th>
                  <th className="px-2.5 py-2.5 text-center min-w-[75px] border-r border-slate-200">OUT SALDO</th>
                  <th className="px-2.5 py-2.5 text-center min-w-[75px] border-r border-slate-200">VALINS DC</th>
                  <th className="px-2.5 py-2.5 text-center min-w-[75px] border-r border-slate-200">VALINS VISIT</th>
                  <th className="px-2.5 py-2.5 text-center min-w-[75px] border-r border-slate-200">TTR COMP 4H</th>
                  <th className="px-2.5 py-2.5 text-center min-w-[75px] border-r border-slate-200">UNSPEC</th>
                  <th className="px-2.5 py-2.5 text-center min-w-[75px] border-r border-slate-200">CLOSED SQM</th>
                  <th className="px-2.5 py-2.5 text-center min-w-[75px] border-r border-slate-200">SCC INET</th>
                  <th className="px-2.5 py-2.5 text-center min-w-[75px] border-r border-slate-200">SPLICER</th>
                  <th className="px-2.5 py-2.5 text-center min-w-[75px] border-r border-slate-200">ARC COUNT</th>
                  <th className="px-2.5 py-2.5 text-center min-w-[75px] border-r border-slate-200">INUSE/STOCK</th>
                  <th className="px-3 py-2.5 text-center min-w-[80px] bg-red-100 text-red-950 font-black">
                    PERF
                  </th>
                </tr>

                {/* Table Header Row 2: Target & Bobot Specification Header */}
                <tr className="bg-slate-200/90 text-slate-600 text-[9px] font-bold border-b border-slate-300">
                  <td colSpan={3} className="px-3 py-1.5 text-center font-bold bg-slate-200 sticky left-0 z-30 border-r border-slate-300">
                    TARGET / BOBOT (%)
                  </td>
                  <td className="px-2 py-1 text-center border-r border-slate-300">
                    <span className="text-slate-800">91.71</span> <span className="text-blue-700">(10%)</span>
                  </td>
                  <td className="px-2 py-1 text-center border-r border-slate-300">
                    <span className="text-slate-800">98.52</span> <span className="text-blue-700">(8%)</span>
                  </td>
                  <td className="px-2 py-1 text-center border-r border-slate-300">
                    <span className="text-slate-800">91.10</span> <span className="text-blue-700">(8%)</span>
                  </td>
                  <td className="px-2 py-1 text-center border-r border-slate-300">
                    <span className="text-slate-800">95.25</span> <span className="text-blue-700">(10%)</span>
                  </td>
                  <td className="px-2 py-1 text-center border-r border-slate-300">
                    <span className="text-slate-800">94.79</span> <span className="text-blue-700">(10%)</span>
                  </td>
                  <td className="px-2 py-1 text-center border-r border-slate-300">
                    <span className="text-slate-800">95.00</span> <span className="text-blue-700">(8%)</span>
                  </td>
                  <td className="px-2 py-1 text-center border-r border-slate-300">
                    <span className="text-slate-800">83.00</span> <span className="text-blue-700">(8%)</span>
                  </td>
                  <td className="px-2 py-1 text-center border-r border-slate-300">
                    <span className="text-slate-800">≤12</span> <span className="text-blue-700">(4%)</span>
                  </td>
                  <td className="px-2 py-1 text-center border-r border-slate-300">
                    <span className="text-slate-800">95.00</span> <span className="text-blue-700">(3%)</span>
                  </td>
                  <td className="px-2 py-1 text-center border-r border-slate-300">
                    <span className="text-slate-800">90.91</span> <span className="text-blue-700">(3%)</span>
                  </td>
                  <td className="px-2 py-1 text-center border-r border-slate-300">
                    <span className="text-slate-800">47.00</span> <span className="text-blue-700">(3%)</span>
                  </td>
                  <td className="px-2 py-1 text-center border-r border-slate-300">
                    <span className="text-slate-800">≤0.10</span> <span className="text-blue-700">(6%)</span>
                  </td>
                  <td className="px-2 py-1 text-center border-r border-slate-300">
                    <span className="text-slate-800">70.00</span> <span className="text-blue-700">(8%)</span>
                  </td>
                  <td className="px-2 py-1 text-center border-r border-slate-300">
                    <span className="text-slate-800">70.00</span> <span className="text-blue-700">(4%)</span>
                  </td>
                  <td className="px-2 py-1 text-center border-r border-slate-300">
                    <span className="text-slate-800">100</span> <span className="text-blue-700">(2%)</span>
                  </td>
                  <td className="px-2 py-1 text-center border-r border-slate-300">
                    <span className="text-slate-800">100</span> <span className="text-blue-700">(2%)</span>
                  </td>
                  <td className="px-2 py-1 text-center border-r border-slate-300">
                    <span className="text-slate-800">70.00</span> <span className="text-blue-700">(3%)</span>
                  </td>
                  <td className="px-2 py-1 text-center bg-red-200/80 font-black text-red-900">
                    100%
                  </td>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-200 font-medium">
                {filteredRows.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50/50 transition-colors">
                    {/* Rank */}
                    <td className="px-2.5 py-2.5 text-center sticky left-0 z-10 bg-white border-r border-slate-200 font-bold">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${getRankBadge(row.rank)}`}>
                        {row.rank}
                      </span>
                    </td>

                    {/* Service Area */}
                    <td className="px-3 py-2.5 sticky left-12 z-10 bg-white border-r border-slate-200 font-bold text-slate-700 truncate">
                      {row.serviceArea}
                    </td>

                    {/* Sektor */}
                    <td className="px-3 py-2.5 sticky left-[158px] z-10 bg-white border-r border-slate-200 font-extrabold text-slate-900 truncate">
                      {row.sektor}
                    </td>

                    {/* ASGAR */}
                    <td className={`px-2.5 py-2 text-right border-r border-slate-100 font-mono text-[11px] ${
                      isBelowTarget('asgar', row.asgar) ? 'bg-rose-100/90 text-rose-800 font-bold' : 'text-slate-700'
                    }`}>
                      {row.asgar.toFixed(2)}
                    </td>

                    {/* Service Availability */}
                    <td className={`px-2.5 py-2 text-right border-r border-slate-100 font-mono text-[11px] ${
                      isBelowTarget('serviceAvailability', row.serviceAvailability) ? 'bg-rose-100/90 text-rose-800 font-bold' : 'text-slate-700'
                    }`}>
                      {row.serviceAvailability.toFixed(2)}
                    </td>

                    {/* TTR 24H */}
                    <td className={`px-2.5 py-2 text-right border-r border-slate-100 font-mono text-[11px] ${
                      isBelowTarget('ttr24hNonHvc', row.ttr24hNonHvc) ? 'bg-rose-100/90 text-rose-800 font-bold' : 'text-slate-700'
                    }`}>
                      {row.ttr24hNonHvc.toFixed(2)}
                    </td>

                    {/* TTR 3H Diamond */}
                    <td className={`px-2.5 py-2 text-right border-r border-slate-100 font-mono text-[11px] ${
                      isBelowTarget('ttr3hDiamond', row.ttr3hDiamond) ? 'bg-rose-100/90 text-rose-800 font-bold' : 'text-slate-700'
                    }`}>
                      {row.ttr3hDiamond.toFixed(2)}
                    </td>

                    {/* TTR 3H Manja */}
                    <td className={`px-2.5 py-2 text-right border-r border-slate-100 font-mono text-[11px] ${
                      isBelowTarget('ttr3hManja', row.ttr3hManja) ? 'bg-rose-100/90 text-rose-800 font-bold' : 'text-slate-700'
                    }`}>
                      {row.ttr3hManja.toFixed(2)}
                    </td>

                    {/* TTR 6H Platinum */}
                    <td className={`px-2.5 py-2 text-right border-r border-slate-100 font-mono text-[11px] ${
                      isBelowTarget('ttr6hPlatinum', row.ttr6hPlatinum) ? 'bg-rose-100/90 text-rose-800 font-bold' : 'text-slate-700'
                    }`}>
                      {row.ttr6hPlatinum.toFixed(2)}
                    </td>

                    {/* TTR 12H Gold */}
                    <td className={`px-2.5 py-2 text-right border-r border-slate-100 font-mono text-[11px] ${
                      isBelowTarget('ttr12hGold', row.ttr12hGold) ? 'bg-rose-100/90 text-rose-800 font-bold' : 'text-slate-700'
                    }`}>
                      {row.ttr12hGold.toFixed(2)}
                    </td>

                    {/* Outstanding Saldo */}
                    <td className={`px-2.5 py-2 text-right border-r border-slate-100 font-mono text-[11px] ${
                      isBelowTarget('outstandingSaldo', row.outstandingSaldo) ? 'bg-rose-100/90 text-rose-800 font-bold' : 'text-slate-700'
                    }`}>
                      {row.outstandingSaldo}
                    </td>

                    {/* Valins DC */}
                    <td className={`px-2.5 py-2 text-right border-r border-slate-100 font-mono text-[11px] ${
                      isBelowTarget('valinsDc', row.valinsDc) ? 'bg-rose-100/90 text-rose-800 font-bold' : 'text-slate-700'
                    }`}>
                      {row.valinsDc.toFixed(2)}
                    </td>

                    {/* Valins Visit */}
                    <td className={`px-2.5 py-2 text-right border-r border-slate-100 font-mono text-[11px] ${
                      isBelowTarget('valinsVisit', row.valinsVisit) ? 'bg-rose-100/90 text-rose-800 font-bold' : 'text-slate-700'
                    }`}>
                      {row.valinsVisit.toFixed(2)}
                    </td>

                    {/* TTR Comp SQM 4H */}
                    <td className={`px-2.5 py-2 text-right border-r border-slate-100 font-mono text-[11px] ${
                      isBelowTarget('ttrCompSqm4h', row.ttrCompSqm4h) ? 'bg-rose-100/90 text-rose-800 font-bold' : 'text-slate-700'
                    }`}>
                      {row.ttrCompSqm4h.toFixed(2)}
                    </td>

                    {/* Unspec */}
                    <td className={`px-2.5 py-2 text-right border-r border-slate-100 font-mono text-[11px] ${
                      isBelowTarget('unspecNonWarranty', row.unspecNonWarranty) ? 'bg-rose-100/90 text-rose-800 font-bold' : 'text-slate-700'
                    }`}>
                      {row.unspecNonWarranty.toFixed(2)}
                    </td>

                    {/* Closed SQM */}
                    <td className={`px-2.5 py-2 text-right border-r border-slate-100 font-mono text-[11px] ${
                      isBelowTarget('closedSqm', row.closedSqm) ? 'bg-rose-100/90 text-rose-800 font-bold' : 'text-slate-700'
                    }`}>
                      {row.closedSqm.toFixed(2)}
                    </td>

                    {/* SCC Inet */}
                    <td className={`px-2.5 py-2 text-right border-r border-slate-100 font-mono text-[11px] ${
                      isBelowTarget('sccInet', row.sccInet) ? 'bg-rose-100/90 text-rose-800 font-bold' : 'text-slate-700'
                    }`}>
                      {row.sccInet.toFixed(2)}
                    </td>

                    {/* Splicer */}
                    <td className={`px-2.5 py-2 text-right border-r border-slate-100 font-mono text-[11px] ${
                      isBelowTarget('cekFungsiSplicer', row.cekFungsiSplicer) ? 'bg-rose-100/90 text-rose-800 font-bold' : 'text-slate-700'
                    }`}>
                      {row.cekFungsiSplicer.toFixed(2)}
                    </td>

                    {/* Arc Count */}
                    <td className={`px-2.5 py-2 text-right border-r border-slate-100 font-mono text-[11px] ${
                      isBelowTarget('jumlahArcCount', row.jumlahArcCount) ? 'bg-rose-100/90 text-rose-800 font-bold' : 'text-slate-700'
                    }`}>
                      {row.jumlahArcCount.toFixed(2)}
                    </td>

                    {/* Rasio Inuse */}
                    <td className={`px-2.5 py-2 text-right border-r border-slate-100 font-mono text-[11px] ${
                      isBelowTarget('rasioInuseToInstock', row.rasioInuseToInstock) ? 'bg-rose-100/90 text-rose-800 font-bold' : 'text-slate-700'
                    }`}>
                      {row.rasioInuseToInstock.toFixed(2)}
                    </td>

                    {/* PERF (TOTAL SCORE) */}
                    <td className="px-3 py-2 text-right font-black text-xs font-mono bg-slate-50 text-slate-900">
                      <span className={`px-2 py-0.5 rounded ${
                        row.perf >= 98 ? 'bg-emerald-100 text-emerald-900' : row.perf >= 94 ? 'bg-blue-100 text-blue-900' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {row.perf.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Table Footer: Total Row (BRANCH) */}
              <tfoot className="sticky bottom-0 z-20 bg-slate-900 text-white font-bold text-xs shadow-lg">
                <tr>
                  <td className="px-2 py-3 text-center sticky left-0 z-30 bg-slate-900 border-r border-slate-800 font-black">
                    ★
                  </td>
                  <td className="px-3 py-3 sticky left-12 z-30 bg-slate-900 border-r border-slate-800 font-black tracking-wide text-amber-400">
                    BRANCH
                  </td>
                  <td className="px-3 py-3 sticky left-[158px] z-30 bg-slate-900 border-r border-slate-800 font-black tracking-wide text-amber-400">
                    TOTAL / IOAN MADIUN
                  </td>
                  <td className="px-2.5 py-3 text-right border-r border-slate-800 font-mono">
                    {dataset.totalBranchRow.asgar.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-3 text-right border-r border-slate-800 font-mono">
                    {dataset.totalBranchRow.serviceAvailability.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-3 text-right border-r border-slate-800 font-mono">
                    {dataset.totalBranchRow.ttr24hNonHvc.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-3 text-right border-r border-slate-800 font-mono">
                    {dataset.totalBranchRow.ttr3hDiamond.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-3 text-right border-r border-slate-800 font-mono">
                    {dataset.totalBranchRow.ttr3hManja.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-3 text-right border-r border-slate-800 font-mono">
                    {dataset.totalBranchRow.ttr6hPlatinum.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-3 text-right border-r border-slate-800 font-mono">
                    {dataset.totalBranchRow.ttr12hGold.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-3 text-right border-r border-slate-800 font-mono text-amber-300">
                    {dataset.totalBranchRow.outstandingSaldo}
                  </td>
                  <td className="px-2.5 py-3 text-right border-r border-slate-800 font-mono">
                    {dataset.totalBranchRow.valinsDc.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-3 text-right border-r border-slate-800 font-mono">
                    {dataset.totalBranchRow.valinsVisit.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-3 text-right border-r border-slate-800 font-mono">
                    {dataset.totalBranchRow.ttrCompSqm4h.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-3 text-right border-r border-slate-800 font-mono">
                    {dataset.totalBranchRow.unspecNonWarranty.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-3 text-right border-r border-slate-800 font-mono">
                    {dataset.totalBranchRow.closedSqm.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-3 text-right border-r border-slate-800 font-mono">
                    {dataset.totalBranchRow.sccInet.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-3 text-right border-r border-slate-800 font-mono">
                    {dataset.totalBranchRow.cekFungsiSplicer.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-3 text-right border-r border-slate-800 font-mono">
                    {dataset.totalBranchRow.jumlahArcCount.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-3 text-right border-r border-slate-800 font-mono">
                    {dataset.totalBranchRow.rasioInuseToInstock.toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-right font-black font-mono text-emerald-400 text-sm">
                    {dataset.totalBranchRow.perf.toFixed(2)}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Table Legend */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="font-bold text-slate-700">Legenda Indikator:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-rose-100 border border-rose-300 inline-block" />
                <span className="text-[11px]">Sel Nilai Di Bawah Target (Sesuai Highlight Pink di Gambar Asli)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-white border border-slate-300 inline-block" />
                <span className="text-[11px]">Memenuhi / Melampaui Target</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-500">
              Total Bobot: <strong>100%</strong> | Hak Imbal Jasa: <strong className="text-emerald-700">100% Tercapai</strong>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: REKAP 17 INDIKATOR KPI & BOBOT */}
      {activeTab === 'indicators' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden" id="kpi-indicators-section">
          <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Spesifikasi & Capaian 17 Indikator KPI Imbal Jasa ({dataset.month})
              </h3>
              <p className="text-xs text-slate-500">
                Daftar rincian target, bobot, polaritas, dan pencapaian terbobot level Branch Madiun.
              </p>
            </div>
            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800">
              Total Bobot: 100%
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-3 py-3 text-center w-10">No</th>
                  <th className="px-4 py-3">Indikator KPI</th>
                  <th className="px-3 py-3">Kategori</th>
                  <th className="px-2 py-3 text-center">Satuan</th>
                  <th className="px-2 py-3 text-center">Arah</th>
                  <th className="px-3 py-3 text-right">Bobot</th>
                  <th className="px-3 py-3 text-right">Target</th>
                  <th className="px-3 py-3 text-right">Realisasi Branch</th>
                  <th className="px-3 py-3 text-right">% Achv</th>
                  <th className="px-3 py-3 text-right">Skor</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-4 py-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {dataset.indicatorBreakdown.map((item) => (
                  <tr key={item.no} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-3 text-center text-slate-500 font-mono">{item.no}</td>
                    <td className="px-4 py-3 font-extrabold text-slate-900">{item.name}</td>
                    <td className="px-3 py-3 text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px] font-semibold text-slate-700">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center text-slate-600">{item.satuan}</td>
                    <td className="px-2 py-3 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        item.polaritas === 'MAX' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {item.polaritas}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-slate-800">{item.bobot}%</td>
                    <td className="px-3 py-3 text-right font-mono text-slate-800">{item.target}</td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-slate-900">
                      {item.branchRealisasi}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-blue-700">
                      {item.pencapaian.toFixed(2)}%
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-black text-slate-900">
                      {item.skor.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        item.status === 'Memenuhi'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'Warning'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {item.status === 'Memenuhi' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                        )}
                        <span>{item.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{item.keterangan}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-900 text-white font-bold text-xs">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-right font-black uppercase text-amber-400 tracking-wider">
                    TOTAL KESELURUHAN BRANCH MADIUN:
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-amber-400 font-black">
                    {dataset.summary.totalBobot}%
                  </td>
                  <td colSpan={2} />
                  <td className="px-3 py-3 text-right font-mono text-blue-300 font-bold">
                    {dataset.summary.pencapaianRataRata.toFixed(1)}%
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-emerald-400 font-black text-sm">
                    {dataset.summary.totalSkor.toFixed(2)}
                  </td>
                  <td colSpan={2} className="px-4 py-3 text-emerald-400 font-extrabold text-center">
                    {dataset.summary.statusHakImbalJasa}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: GRAFIK & DIAGRAM ANALISA PERFORMANSI (TREND ALL BRANCH, PER SERVICE AREA & PER SEKTOR) */}
      {activeTab === 'analytics' && (
        <KpiImbalJasaAnalytics
          currentDataset={dataset}
          selectedBulan={selectedBulan}
          onSelectBulan={(bulan) => setSelectedBulan(bulan)}
          onOpenRawImageModal={() => setIsImageModalOpen(true)}
        />
      )}

      {/* FULLSCREEN IMAGE MODAL */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex flex-col p-4">
          <div className="flex items-center justify-between pb-3 text-white border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <span>Gambar Riil KPI Assurance Bulan {selectedBulan}</span>
                <span className="px-2 py-0.5 rounded bg-red-600 text-white text-xs font-mono">
                  Range: {dataset.range}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Google Spreadsheet ID: {SPREADSHEET_CONFIG.spreadsheetId} | Sheet: {SPREADSHEET_CONFIG.sheetName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                className="p-2 hover:bg-slate-800 rounded-lg text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(3, z + 0.2))}
                className="p-2 hover:bg-slate-800 rounded-lg text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="p-2 hover:bg-slate-800 rounded-lg text-white text-xs font-bold"
              >
                100%
              </button>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer ml-2"
              >
                Tutup ✕
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
            <div style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.15s ease-out' }}>
              <img
                src={dataset.source.imageUrl}
                alt="Fullscreen KPI Imbal Jasa"
                className="max-w-none max-h-none rounded shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}

      {/* AI EVALUATION MODAL */}
      <AIEvaluationModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        tableName={`KPI Imbal Jasa Assurance (${dataset.month})`}
        dashboardContext={`Dashboard KPI Imbal Jasa Assurance IOAN Branch Madiun. Bulan: ${dataset.month} 2026. Range Sumber: ${dataset.range} pada sheet '${SPREADSHEET_CONFIG.sheetName}'. Nilai Performansi Branch: ${dataset.summary.perfBranch.toFixed(2)}%. Hak Imbal Jasa: 100% Tercapai Lunas. Total Sektor: 16 sektor. Sektor Rank 1: ${dataset.summary.topSektorName} (${dataset.summary.topSektorPerf.toFixed(2)}%).`}
        filterContext={{
          bulan: dataset.month,
          range: dataset.range,
          spreadsheetId: SPREADSHEET_CONFIG.spreadsheetId,
          sheetName: SPREADSHEET_CONFIG.sheetName,
          totalSektor: dataset.sectorRows.length,
          topSektor: dataset.summary.topSektorName,
          perfBranch: dataset.summary.perfBranch,
        }}
        summaryMetrics={{
          'Performansi Branch': `${dataset.summary.perfBranch.toFixed(2)}%`,
          'Hak Imbal Jasa': '100% (Lunas)',
          'Total Indikator': `${dataset.specs.length} Indikator (100% Bobot)`,
          'Rata-Rata Capaian': `${dataset.summary.pencapaianRataRata.toFixed(1)}%`,
          'Top Sektor (Rank 1)': `${dataset.summary.topSektorName} (${dataset.summary.topSektorPerf.toFixed(2)}%)`,
          'Sektor Memenuhi Target': `${dataset.summary.sektorMemenuhiTarget} dari 16 Sektor`,
        }}
        sampleRows={dataset.sectorRows.slice(0, 8).map((r) => ({
          Rank: r.rank,
          Area: r.serviceArea,
          Sektor: r.sektor,
          ASGAR: `${r.asgar}%`,
          Availability: `${r.serviceAvailability}%`,
          TTR_24H: `${r.ttr24hNonHvc}%`,
          Outstanding_Saldo: r.outstandingSaldo,
          PERF: `${r.perf}%`,
        }))}
      />
    </div>
  );
}
