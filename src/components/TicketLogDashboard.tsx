import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Download,
  RefreshCw,
  Filter,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShieldAlert,
  Database,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import {
  fetchAssuranceTickets,
  AssuranceTicketDashboardData,
  computeDashboardData,
  ASSURANCE_SPREADSHEET_ID,
  DEFAULT_SHEET_TAB,
} from '../lib/assuranceTicketFetcher';
import { FALLBACK_ASSURANCE_TICKETS, AssuranceTicketRecord } from '../data/assuranceTicketFallback';
import AIEvaluationModal, { AIEvaluationButton } from './AIEvaluationModal';

// Format number with strictly two decimal digits (e.g. 17.15, 2.05, 0.00)
function formatTwoDigits(val: number | string | undefined | null): string {
  if (val === undefined || val === null || val === '') return '0.00';
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
  if (isNaN(num) || num <= 0) return '0.00';
  return num.toFixed(2);
}

export default function TicketLogDashboard() {
  const [data, setData] = useState<AssuranceTicketDashboardData>(() =>
    computeDashboardData(FALLBACK_ASSURANCE_TICKETS, ASSURANCE_SPREADSHEET_ID, DEFAULT_SHEET_TAB, false)
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters for operational data
  const [selectedBulan, setSelectedBulan] = useState<string>('ALL'); // Kolom A
  const [selectedSektor, setSelectedSektor] = useState<string>('ALL'); // Kolom C
  const [selectedType, setSelectedType] = useState<string>('ALL');     // Kolom B
  const [selectedSto, setSelectedSto] = useState<string>('ALL');       // Kolom P
  const [selectedHvc, setSelectedHvc] = useState<string>('ALL');       // Kolom T
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL'); // Status
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(15);

  // Sorting
  const [sortField, setSortField] = useState<keyof AssuranceTicketRecord>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // AI Evaluation Modal State
  const [aiModalState, setAiModalState] = useState<{
    isOpen: boolean;
    tableName: string;
    filterContext: Record<string, any>;
    summaryMetrics: Record<string, any>;
    sampleRows: any[];
    promptNote?: string;
  }>({
    isOpen: false,
    tableName: '',
    filterContext: {},
    summaryMetrics: {},
    sampleRows: [],
  });

  const openAiModal = (
    tableName: string,
    summaryMetrics: Record<string, any>,
    sampleRows: any[],
    customFilters: Record<string, any> = {},
    promptNote: string = ''
  ) => {
    setAiModalState({
      isOpen: true,
      tableName,
      filterContext: {
        Bulan: selectedBulan,
        Sektor: selectedSektor,
        Type: selectedType,
        STO: selectedSto,
        HVC: selectedHvc,
        Status: selectedStatus,
        ...customFilters,
      },
      summaryMetrics,
      sampleRows,
      promptNote,
    });
  };

  // Fetch live on mount
  const handleRefresh = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await fetchAssuranceTickets(ASSURANCE_SPREADSHEET_ID, DEFAULT_SHEET_TAB);
      setData(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyinkronkan data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  // Filtered raw ticket records
  const filteredRecords = useMemo(() => {
    return data.records.filter(rec => {
      if (selectedBulan !== 'ALL' && rec.bulanRekap !== selectedBulan) return false;
      if (selectedSektor !== 'ALL' && rec.sektor !== selectedSektor) return false;
      if (selectedType !== 'ALL' && rec.typeTiket !== selectedType) return false;
      if (selectedSto !== 'ALL' && rec.sto !== selectedSto) return false;
      if (selectedHvc !== 'ALL' && rec.flagHvc !== selectedHvc) return false;
      if (selectedStatus !== 'ALL' && rec.status !== selectedStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesBulan = rec.bulanRekap.toLowerCase().includes(q);
        const matchesTroubleNo = rec.troubleNo.toLowerCase().includes(q);
        const matchesInet = rec.troubleNumber.toLowerCase().includes(q);
        const matchesOdp = rec.odp.toLowerCase().includes(q);
        const matchesSto = rec.sto.toLowerCase().includes(q);
        const matchesSektor = rec.sektor.toLowerCase().includes(q);
        const matchesSolution = rec.actualSolution.toLowerCase().includes(q);
        return matchesBulan || matchesTroubleNo || matchesInet || matchesOdp || matchesSto || matchesSektor || matchesSolution;
      }
      return true;
    });
  }, [data.records, selectedBulan, selectedSektor, selectedType, selectedSto, selectedHvc, selectedStatus, searchQuery]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [selectedBulan, selectedSektor, selectedType, selectedSto, selectedHvc, selectedStatus, searchQuery]);

  // Sorted and paged detail records
  const sortedAndPagedRecords = useMemo(() => {
    const sorted = [...filteredRecords].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      const strA = String(valA || '').toLowerCase();
      const strB = String(valB || '').toLowerCase();
      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    const start = currentPage * rowsPerPage;
    return sorted.slice(start, start + rowsPerPage);
  }, [filteredRecords, sortField, sortDirection, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage);

  const handleSort = (field: keyof AssuranceTicketRecord) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Summary metrics for the filtered data
  const summaryMetrics = useMemo(() => {
    let sumTtr = 0;
    let ttrCount = 0;
    let closedCount = 0;
    let hvcCount = 0;

    filteredRecords.forEach(r => {
      if (r.ttr > 0) {
        sumTtr += r.ttr;
        ttrCount++;
      }
      if (r.status.toLowerCase().includes('closed') || r.status.toLowerCase().includes('close')) {
        closedCount++;
      }
      if (r.flagHvc && !r.flagHvc.toUpperCase().includes('REGULER') && !r.flagHvc.toUpperCase().includes('NON')) {
        hvcCount++;
      }
    });

    return {
      total: filteredRecords.length,
      avgTtr: ttrCount > 0 ? sumTtr / ttrCount : 0,
      closedCount,
      hvcCount,
    };
  }, [filteredRecords]);

  // Unique options for filters
  const uniqueBulan = useMemo(() => {
    return Array.from(new Set(data.records.map(r => r.bulanRekap).filter(Boolean)));
  }, [data.records]);

  const uniqueSektors = useMemo(() => {
    return Array.from(new Set(data.records.map(r => r.sektor).filter(Boolean))).sort();
  }, [data.records]);

  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(data.records.map(r => r.typeTiket).filter(Boolean))).sort();
  }, [data.records]);

  const uniqueStos = useMemo(() => {
    return Array.from(new Set(data.records.map(r => r.sto).filter(Boolean))).sort();
  }, [data.records]);

  const uniqueHvcs = useMemo(() => {
    return Array.from(new Set(data.records.map(r => r.flagHvc).filter(Boolean))).sort();
  }, [data.records]);

  const uniqueStatuses = useMemo(() => {
    return Array.from(new Set(data.records.map(r => r.status).filter(Boolean))).sort();
  }, [data.records]);

  // Export filtered detail records to CSV
  const handleExportCSV = () => {
    const headers = [
      'No',
      'Bulan Rekap',
      'Type Tiket',
      'Sektor',
      'STO',
      'FLAG HVC',
      'No Trouble',
      'No Internet',
      'Open Time',
      'Date Close',
      'Status',
      'TTR (Jam)',
      'ODP',
      'Subsegmentasi',
      'Solusi Perbaikan',
      'Closed By',
    ];

    const csvRows = [headers.join(',')];
    filteredRecords.forEach((rec, idx) => {
      const row = [
        idx + 1,
        `"${rec.bulanRekap}"`,
        `"${rec.typeTiket}"`,
        `"${rec.sektor}"`,
        `"${rec.sto}"`,
        `"${rec.flagHvc}"`,
        `"${rec.troubleNo}"`,
        `"${rec.troubleNumber}"`,
        `"${rec.troubleOpenTime}"`,
        `"${rec.dateClose}"`,
        `"${rec.status}"`,
        rec.ttr,
        `"${rec.odp}"`,
        `"${rec.subsegmentasi}"`,
        `"${rec.actualSolution.replace(/"/g, '""')}"`,
        `"${rec.closedBy}"`,
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `detail_log_tiket_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasActiveFilters =
    selectedBulan !== 'ALL' ||
    selectedSektor !== 'ALL' ||
    selectedType !== 'ALL' ||
    selectedSto !== 'ALL' ||
    selectedHvc !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    searchQuery.trim() !== '';

  return (
    <div className="space-y-6" id="ticket-log-dashboard-container">
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. FILTER DATA OPERASIONAL BAR */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4" id="section-filter-operasional">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                Filter Data Operasional
              </h3>
              <p className="text-[11px] text-slate-500">
                Pilih kriteria operasional untuk memfilter log transaksi tiket secara dinamis
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Quick reset button */}
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSelectedBulan('ALL');
                  setSelectedSektor('ALL');
                  setSelectedType('ALL');
                  setSelectedSto('ALL');
                  setSelectedHvc('ALL');
                  setSelectedStatus('ALL');
                  setSearchQuery('');
                }}
                className="text-xs font-bold text-red-600 hover:text-red-700 underline cursor-pointer"
              >
                Reset Semua Filter
              </button>
            )}

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50 border border-slate-200"
              title="Perbarui Data dari Google Sheets"
              id="btn-refresh-ticket-log-data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-red-500' : 'text-slate-500'}`} />
              <span>{loading ? 'Sinkron...' : 'Sinkron Data'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 pt-1">
          {/* Bulan Rekap */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
              Bulan Rekap
            </label>
            <select
              value={selectedBulan}
              onChange={e => setSelectedBulan(e.target.value)}
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
              id="filter-log-bulan"
            >
              <option value="ALL">Semua Bulan ({data.records.length})</option>
              {uniqueBulan.map(b => (
                <option key={b} value={b}>
                  {b} ({data.records.filter(r => r.bulanRekap === b).length})
                </option>
              ))}
            </select>
          </div>

          {/* Sektor Filter */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
              Sektor
            </label>
            <select
              value={selectedSektor}
              onChange={e => setSelectedSektor(e.target.value)}
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
              id="filter-log-sektor"
            >
              <option value="ALL">Semua Sektor ({data.records.length})</option>
              {uniqueSektors.map(s => (
                <option key={s} value={s}>
                  {s} ({data.records.filter(r => r.sektor === s).length})
                </option>
              ))}
            </select>
          </div>

          {/* Type Tiket Filter */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
              Type Tiket
            </label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
              id="filter-log-type"
            >
              <option value="ALL">Semua Type Tiket</option>
              {uniqueTypes.map(t => (
                <option key={t} value={t}>
                  {t} ({data.records.filter(r => r.typeTiket === t).length})
                </option>
              ))}
            </select>
          </div>

          {/* STO Filter */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
              STO
            </label>
            <select
              value={selectedSto}
              onChange={e => setSelectedSto(e.target.value)}
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
              id="filter-log-sto"
            >
              <option value="ALL">Semua STO</option>
              {uniqueStos.map(s => (
                <option key={s} value={s}>
                  {s} ({data.records.filter(r => r.sto === s).length})
                </option>
              ))}
            </select>
          </div>

          {/* FLAG HVC Filter */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
              Flag HVC
            </label>
            <select
              value={selectedHvc}
              onChange={e => setSelectedHvc(e.target.value)}
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
              id="filter-log-hvc"
            >
              <option value="ALL">Semua Level HVC</option>
              {uniqueHvcs.map(h => (
                <option key={h} value={h}>
                  {h} ({data.records.filter(r => r.flagHvc === h).length})
                </option>
              ))}
            </select>
          </div>

          {/* Status Tiket Filter */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
              Status Tiket
            </label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
              id="filter-log-status"
            >
              <option value="ALL">Semua Status</option>
              {uniqueStatuses.map(st => (
                <option key={st} value={st}>
                  {st} ({data.records.filter(r => r.status === st).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search box & filter indicator */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari No Incident, No Internet, ODP, STO, Sektor, Solusi..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
              id="search-ticket-log-input"
            />
          </div>

          <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-500 shrink-0">
            <span>Filter Aktif:</span>
            <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200/60 rounded-lg">
              {filteredRecords.length.toLocaleString('id-ID')} dari {data.records.length.toLocaleString('id-ID')} Tiket
            </span>
          </div>
        </div>
      </div>

      {/* 2. MINI SUMMARY CARDS FOR QUICK AUDIT */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" id="log-summary-cards">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Terfilter</div>
            <div className="text-lg font-black text-slate-900 font-mono">
              {filteredRecords.length.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rata-rata TTR</div>
            <div className="text-lg font-black text-slate-900 font-mono">
              {formatTwoDigits(summaryMetrics.avgTtr)} Jam
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tiket Closed</div>
            <div className="text-lg font-black text-slate-900 font-mono">
              {summaryMetrics.closedCount.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tiket HVC</div>
            <div className="text-lg font-black text-slate-900 font-mono">
              {summaryMetrics.hvcCount.toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      </div>

      {/* 3. TABEL DETAIL DARI SUMBER DATA TERSEBUT (KOLOM A S/D SELESAI) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden" id="section-tabel-detail-sumber-data">
        <div className="p-6 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 bg-slate-900 text-white font-extrabold text-[10px] rounded-full uppercase tracking-wider">
                  Tabel Transaksi &amp; Log Tiket
                </span>
                <span className="text-xs text-slate-400 font-medium">• Kolom A s.d. Selesai</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                Detail Transaksi &amp; Log Tiket ({filteredRecords.length.toLocaleString('id-ID')} Tiket)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Data detail tiket operasional yang memuat nomor gangguan, nomor internet pelanggan, lokasi ODP, dan catatan solusi penanganan.
              </p>
            </div>

            {/* Detail Actions: AI Evaluation, Rows per page selector & Export */}
            <div className="flex items-center space-x-2 shrink-0">
              <AIEvaluationButton
                size="sm"
                onClick={() => {
                  openAiModal(
                    'Tabel Master Detail Tiket Gangguan Assurance',
                    {
                      'Total Tiket Terfilter': filteredRecords.length,
                      'Total Seluruh Data': data.records.length,
                      'Halaman Aktif': `${currentPage + 1} dari ${totalPages || 1}`,
                      'Rata-rata TTR': `${formatTwoDigits(summaryMetrics.avgTtr)} Jam`,
                      'Tiket Closed': summaryMetrics.closedCount,
                      'Tiket HVC': summaryMetrics.hvcCount,
                    },
                    sortedAndPagedRecords.slice(0, 20).map(t => ({
                      'No Incident': t.troubleNo,
                      Sektor: t.sektor,
                      STO: t.sto,
                      Type: t.typeTiket,
                      HVC: t.flagHvc,
                      Status: t.status,
                      'TTR (Jam)': formatTwoDigits(t.ttr),
                      'Actual Solution': t.actualSolution,
                    })),
                    { 'Jumlah Baris Per Hal': rowsPerPage },
                    'Evaluasi data detail log tiket operasional di atas. Analisis distribusi durasi perbaikan, konsentrasi ODP/STO, dan identifikasi potensi kendala berulang.'
                  );
                }}
              />

              <button
                onClick={handleExportCSV}
                className="flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-2 rounded-xl border border-emerald-200 transition-all cursor-pointer shadow-2xs"
                title="Ekspor CSV"
                id="btn-export-ticket-csv"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ekspor CSV ({filteredRecords.length})</span>
              </button>

              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                <span className="text-xs text-slate-500 font-bold">Baris:</span>
                <select
                  value={rowsPerPage}
                  onChange={e => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(0);
                  }}
                  className="text-xs font-bold bg-transparent text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Detail Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200/80">
                <th className="py-3 px-3 text-center">No</th>
                <th
                  onClick={() => handleSort('bulanRekap')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Bulan</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('troubleNo')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>No Incident</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('troubleNumber')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>No Internet</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('sektor')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Sektor</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('sto')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>STO</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('typeTiket')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Type</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('flagHvc')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>HVC</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('odp')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>ODP</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('ttr')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>TTR</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Actual Solution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedAndPagedRecords.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    Tidak ada log tiket yang cocok dengan kriteria filter saat ini.
                  </td>
                </tr>
              ) : (
                sortedAndPagedRecords.map((rec, idx) => {
                  const globalIdx = currentPage * rowsPerPage + idx + 1;
                  const isHvc = rec.flagHvc && !rec.flagHvc.toUpperCase().includes('REGULER');

                  return (
                    <tr key={rec.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center font-mono text-slate-400 text-[11px]">
                        {globalIdx}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">
                        {rec.bulanRekap}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-red-600 whitespace-nowrap">
                        {rec.troubleNo}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {rec.troubleNumber}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800">
                        {rec.sektor}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-700">
                        {rec.sto}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            rec.typeTiket === 'SQM'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {rec.typeTiket}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isHvc
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {rec.flagHvc || 'REGULER'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500 max-w-[150px] truncate" title={rec.odp}>
                        {rec.odp || '-'}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                        {rec.ttr > 0 ? `${rec.ttr.toFixed(2)} jam` : '-'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded text-[10px] font-bold">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>{rec.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px] max-w-xs truncate" title={rec.actualSolution}>
                        {rec.actualSolution || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Menampilkan baris <strong>{filteredRecords.length > 0 ? currentPage * rowsPerPage + 1 : 0}</strong> sampai{' '}
            <strong>{Math.min((currentPage + 1) * rowsPerPage, filteredRecords.length)}</strong> dari{' '}
            <strong>{filteredRecords.length.toLocaleString('id-ID')}</strong> total data tiket
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setCurrentPage(0)}
              disabled={currentPage === 0}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Halaman Pertama"
            >
              <ChevronsLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <span className="font-bold px-3 py-1 bg-slate-100 rounded-lg text-slate-700">
              Halaman {currentPage + 1} dari {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage >= totalPages - 1}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={() => setCurrentPage(Math.max(0, totalPages - 1))}
              disabled={currentPage >= totalPages - 1}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Halaman Terakhir"
            >
              <ChevronsRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* AI Performance Evaluation Modal */}
      <AIEvaluationModal
        isOpen={aiModalState.isOpen}
        onClose={() => setAiModalState(prev => ({ ...prev, isOpen: false }))}
        tableName={aiModalState.tableName}
        dashboardContext="Assurance Ticket Logs (Sub-Halaman 3: Detail Transaksi & Log Tiket)"
        filterContext={aiModalState.filterContext}
        summaryMetrics={aiModalState.summaryMetrics}
        sampleRows={aiModalState.sampleRows}
        promptNote={aiModalState.promptNote}
      />
    </div>
  );
}
