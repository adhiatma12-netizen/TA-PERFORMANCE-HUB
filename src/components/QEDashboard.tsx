import React, { useState, useEffect } from 'react';
import { RegionalPerformanceData, Regional } from '../types';
import { rekapQeDataList, RekapQeRow } from '../data/rekapQeData';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  ClipboardCheck,
  Filter,
  MapPin,
  Calendar,
  Layers,
  Search,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Table,
  ChevronLeft,
  ChevronRight,
  Info,
  Clock,
  Briefcase,
  SlidersHorizontal,
  DollarSign,
} from 'lucide-react';
import AIEvaluationModal, { AIEvaluationButton } from './AIEvaluationModal';

interface QEDashboardProps {
  data: RegionalPerformanceData;
  allRegionsData: { [key: string]: RegionalPerformanceData };
  activeRegional: Regional;
  activeSubTab?: 'main' | 'detail';
  setActiveSubTab?: (tab: 'main' | 'detail') => void;
}

// Chronological months for sorting and trend plotting
const CHRONOLOGICAL_MONTHS = [
  'Januari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

// Normalize month string from spreadsheet (e.g. "3-Maret", "10-Mei" -> "Maret", "Mei")
function normalizeMonth(m: string): string {
  const clean = m.toLowerCase();
  if (clean.includes('januari')) return 'Januari';
  if (clean.includes('februari')) return 'Februari';
  if (clean.includes('maret')) return 'Maret';
  if (clean.includes('april')) return 'April';
  if (clean.includes('mei')) return 'Mei';
  if (clean.includes('juni')) return 'Juni';
  if (clean.includes('juli')) return 'Juli';
  if (clean.includes('agustus')) return 'Agustus';
  if (clean.includes('september')) return 'September';
  if (clean.includes('oktober')) return 'Oktober';
  if (clean.includes('november')) return 'November';
  if (clean.includes('desember')) return 'Desember';
  return 'Lainnya';
}

// Client-side CSV Parser
function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentLine.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentLine.push(currentField.trim());
      lines.push(currentLine);
      currentLine = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }
  
  if (currentField !== '' || currentLine.length > 0) {
    currentLine.push(currentField.trim());
    lines.push(currentLine);
  }
  
  return lines;
}

// Maps parsed 2D CSV array to RekapQeRow object model
function mapRowsToRecords(rows: string[][]): RekapQeRow[] {
  const records: RekapQeRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 28) continue;
    if (!row[0] && !row[1] && !row[27]) continue; // skip empty rows
    
    records.push({
      sto: row[0] || '',
      area: row[1] || '',
      uraian: row[2] || '',
      keterangan: row[3] || '',
      nimonId: row[4] || '',
      woId: row[5] || '',
      ihld: row[6] || '',
      aiss: row[7] || '',
      projectId: row[8] || '',
      wbs: row[9] || '',
      bulanUsulan: row[10] || '',
      tglUsulan: row[11] || '',
      bulanEksekusi: row[12] || '',
      tahunPekerjaan: row[13] || '',
      tglRekon: row[14] || '',
      nilaiRealisasi: row[15] || '',
      approvalTif: row[16] || '',
      rekonWh: row[17] || '',
      rekonMitra: row[18] || '',
      rekonTif: row[19] || '',
      status: row[20] || '',
      statusPid: row[21] || '',
      pelimpahan: row[22] || '',
      periode: row[23] || '',
      noPo: row[24] || '',
      mitraPelaksana: row[25] || '',
      idResv: row[26] || '',
      segment: row[27] || '',
      statusTiket: row[28] || '',
      keteranganDetail: row[29] || '',
      statusPelimpahan: row[30] || '',
      lokasiBerkas: row[31] || ''
    });
  }
  return records;
}

// Parse column P (nilaiRealisasi) string into a clean number
function parseNilaiRealisasi(val: string): number {
  if (!val) return 0;
  // Replace dots (thousands separators) and commas (decimal separators)
  const clean = val.replace(/\./g, '').replace(/,/g, '.').replace(/[^0-9.-]/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

export default function QEDashboard({ 
  data, 
  allRegionsData, 
  activeRegional,
  activeSubTab: externalSubTab,
  setActiveSubTab: externalSetSubTab,
}: QEDashboardProps) {
  // Primary state holding all parsed rows
  const [qeData, setQeData] = useState<RekapQeRow[]>(rekapQeDataList);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'local' | 'live' | 'error'>('local');
  const [syncTime, setSyncTime] = useState<string>(new Date().toLocaleTimeString('id-ID'));
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Primary Filters State
  const [filterHsa, setFilterHsa] = useState<string>('All');
  const [filterBulan, setFilterBulan] = useState<string>('All');
  const [filterTahun, setFilterTahun] = useState<string>('All');
  const [filterSegment, setFilterSegment] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Chart type tab state
  const [chartType, setChartType] = useState<'tren' | 'revenue'>('tren');

  // Detail Table Filters State
  const [detailFilterSegment, setDetailFilterSegment] = useState<string>('All');
  const [detailSearchQuery, setDetailSearchQuery] = useState<string>('');
  const [detailCurrentPage, setDetailCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Chart Metric Mode: volume (jumlah pekerjaan) vs completion (prosentase selesai)
  const [chartMetric, setChartMetric] = useState<'volume' | 'completion'>('volume');

  // Sub-halaman State
  const [internalSubTab, setInternalSubTab] = useState<'main' | 'detail'>('main');
  const activeSubTab = externalSubTab ?? internalSubTab;
  const setActiveSubTab = externalSetSubTab ?? setInternalSubTab;

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
        Regional: activeRegional,
        HSA: filterHsa,
        Bulan: filterBulan,
        Tahun: filterTahun,
        Segment: filterSegment,
        Status: filterStatus,
        ...customFilters,
      },
      summaryMetrics,
      sampleRows,
      promptNote,
    });
  };

  // Try to load live data on mount to see if it works
  useEffect(() => {
    fetchLiveData();
  }, []);

  const fetchLiveData = async () => {
    setIsLoadingLive(true);
    setErrorMessage('');
    const spreadsheetId = "1-O0AQxDPt5Zb2OHHE5Caj6KTiINZIomSgBIbTjnoLN8";
    const sheetName = "REKAP QE";
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Gagal menghubungi server Google Sheets (${response.status})`);
      }
      const csvText = await response.text();
      const parsedRows = parseCSV(csvText);
      
      if (parsedRows.length <= 1) {
        throw new Error("Data spreadsheet kosong atau tidak valid.");
      }
      
      const records = mapRowsToRecords(parsedRows);
      setQeData(records);
      setSyncStatus('live');
      setSyncTime(new Date().toLocaleTimeString('id-ID'));
    } catch (err: any) {
      console.warn("Dynamic spreadsheet fetch failed, utilizing high-fidelity local cache.", err);
      setSyncStatus('error');
      setErrorMessage(err.message || 'CORS Blocked or Network Offline');
      // Keep using default rekapQeDataList
    } finally {
      setIsLoadingLive(false);
    }
  };

  // Get Dynamic options for primary filters based on current qeData content
  const uniqueHSA: string[] = Array.from(new Set(qeData.map(r => r.area).filter(Boolean))).sort() as string[];
  const uniqueTahun: string[] = Array.from(new Set(qeData.map(r => r.tahunPekerjaan).filter(Boolean))).sort() as string[];
  const uniqueSegment: string[] = Array.from(new Set(qeData.map(r => r.segment).filter(Boolean))).sort() as string[];
  const uniqueStatus: string[] = Array.from(new Set(qeData.map(r => r.status).filter(Boolean))).sort() as string[];

  // Reset page when detail table filters change
  useEffect(() => {
    setDetailCurrentPage(1);
  }, [detailFilterSegment, detailSearchQuery, filterHsa, filterTahun, filterBulan, filterStatus]);

  // 1. FILTER DATA based on user choices
  const filteredData = qeData.filter(row => {
    const matchHsa = filterHsa === 'All' || row.area === filterHsa;
    const matchTahun = filterTahun === 'All' || row.tahunPekerjaan === filterTahun;
    const matchBulan = filterBulan === 'All' || normalizeMonth(row.bulanUsulan) === filterBulan;
    const matchSegment = filterSegment === 'All' || row.segment === filterSegment;
    const matchStatus = filterStatus === 'All' || row.status === filterStatus;
    return matchHsa && matchTahun && matchBulan && matchSegment && matchStatus;
  });

  // Calculate overall statistics for KPI widgets
  const totalJobsCount = filteredData.length;
  const completedJobsCount = filteredData.filter(row => row.status.toUpperCase() === 'SELESAI').length;
  const overallCompletionRate = totalJobsCount > 0 ? Math.round((completedJobsCount / totalJobsCount) * 100) : 0;
  
  // Sum column P (nilaiRealisasi) for total revenue
  const totalRevenue = filteredData.reduce((sum, r) => sum + parseNilaiRealisasi(r.nilaiRealisasi), 0);

  // Pending jobs are defined as non-SELESAI and non-DROP
  const pendingJobsCount = filteredData.filter(row => {
    const s = row.status.toUpperCase();
    return s !== 'SELESAI' && s !== 'DROP';
  }).length;
  const dropJobsCount = filteredData.filter(row => row.status.toUpperCase() === 'DROP').length;

  // 2. DATA PROCESSING for Requirement 1: "Tabel Performansi Prosentase segment pekerjaan QE"
  // We calculate performance for each segment in the currently filtered data
  const segmentsInView = filterSegment === 'All' ? uniqueSegment : [filterSegment];
  const segmentPerformanceList = segmentsInView.map(segName => {
    const segmentRows = filteredData.filter(row => row.segment === segName);
    const count = segmentRows.length;
    const contribution = totalJobsCount > 0 ? parseFloat(((count / totalJobsCount) * 100).toFixed(1)) : 0;
    const completed = segmentRows.filter(row => row.status.toUpperCase() === 'SELESAI').length;
    const completionRate = count > 0 ? parseFloat(((completed / count) * 100).toFixed(1)) : 0;
    
    // Sum column P (nilaiRealisasi) for this segment
    const segmentRevenue = segmentRows.reduce((sum, r) => sum + parseNilaiRealisasi(r.nilaiRealisasi), 0);

    // Get specific status breakdown counts
    const statusBreakdown: { [key: string]: number } = {};
    segmentRows.forEach(row => {
      const s = row.status || 'UNKNOWN';
      if (s.toUpperCase() !== 'SELESAI') {
        statusBreakdown[s] = (statusBreakdown[s] || 0) + 1;
      }
    });

    return {
      segment: segName,
      total: count,
      contribution,
      completed,
      completionRate,
      statusBreakdown,
      revenue: segmentRevenue,
    };
  }).filter(item => item.total > 0 || filterSegment !== 'All'); // keep empty only if explicitly filtered

  // Segment Cards data representing the independent segment dashboards
  const segmentCardsData = uniqueSegment.map(segName => {
    const segmentRows = qeData.filter(row => {
      const matchHsa = filterHsa === 'All' || row.area === filterHsa;
      const matchTahun = filterTahun === 'All' || row.tahunPekerjaan === filterTahun;
      const matchBulan = filterBulan === 'All' || normalizeMonth(row.bulanUsulan) === filterBulan;
      const matchSeg = row.segment === segName;
      const matchStatus = filterStatus === 'All' || row.status === filterStatus;
      return matchHsa && matchTahun && matchBulan && matchSeg && matchStatus;
    });

    const total = segmentRows.length;
    const completed = segmentRows.filter(row => row.status.toUpperCase() === 'SELESAI').length;
    const completionRate = total > 0 ? parseFloat(((completed / total) * 100).toFixed(1)) : 0;
    const segmentRevenue = segmentRows.reduce((sum, r) => sum + parseNilaiRealisasi(r.nilaiRealisasi), 0);

    const pending = segmentRows.filter(row => {
      const s = row.status.toUpperCase();
      return s !== 'SELESAI' && s !== 'DROP';
    }).length;
    const drop = segmentRows.filter(row => row.status.toUpperCase() === 'DROP').length;

    return {
      segment: segName,
      total,
      completed,
      completionRate,
      revenue: segmentRevenue,
      pending,
      drop,
    };
  });

  // 3. DATA PROCESSING for Requirement 2: "buat grafik perbulan masing - masing segment pekerjaan"
  // Group by Normalized Month and Segment
  const monthlyChartData = CHRONOLOGICAL_MONTHS.map(monthName => {
    const dataPoint: any = {
      month: monthName,
      shortName: monthName.substring(0, 3),
    };

    uniqueSegment.forEach(seg => {
      // Find rows matching this month, segment, and user's main HSA/Tahun filters
      const matchRows = qeData.filter(row => {
        const matchHsa = filterHsa === 'All' || row.area === filterHsa;
        const matchTahun = filterTahun === 'All' || row.tahunPekerjaan === filterTahun;
        const matchM = normalizeMonth(row.bulanUsulan) === monthName;
        const matchSeg = row.segment === seg;
        const matchStatus = filterStatus === 'All' || row.status === filterStatus;
        return matchHsa && matchTahun && matchM && matchSeg && matchStatus;
      });

      const total = matchRows.length;
      const completed = matchRows.filter(r => r.status.toUpperCase() === 'SELESAI').length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      const revenue = matchRows.reduce((sum, r) => sum + parseNilaiRealisasi(r.nilaiRealisasi), 0);

      dataPoint[seg] = total;
      dataPoint[`${seg}_comp`] = completionRate;
      dataPoint[`${seg}_rev`] = revenue;
    });

    return dataPoint;
  }).filter(pt => {
    // Only show months that have at least one record across any segment in the current filters
    return uniqueSegment.some(seg => pt[seg] > 0);
  });

  // Color mapping for Segments
  const segmentColorMap: { [key: string]: string } = {
    'QE RECOVERY': '#EF4444',     // Red
    'QE RELOK ALPRO': '#3B82F6',   // Blue
    'QE PREVENTIF': '#10B981',     // Green
    'QE MITRATEL': '#8B5CF6',      // Purple
  };

  // 4. DATA PROCESSING for Requirement 3: "Detail data table with specific columns & segment filter"
  // Filter detail rows by Main HSA/Tahun + Dedicated Detail Segment filter + Detail Search bar
  const detailFilteredRows = qeData.filter(row => {
    const matchHsa = filterHsa === 'All' || row.area === filterHsa;
    const matchTahun = filterTahun === 'All' || row.tahunPekerjaan === filterTahun;
    const matchBulan = filterBulan === 'All' || normalizeMonth(row.bulanUsulan) === filterBulan;
    const matchStatus = filterStatus === 'All' || row.status === filterStatus;
    
    // Dedicated segment filter for detail table
    const matchDetailSeg = detailFilterSegment === 'All' || row.segment === detailFilterSegment;
    
    // Live search query for Column C "uraian"
    const matchSearch = detailSearchQuery === '' || 
      row.uraian.toLowerCase().includes(detailSearchQuery.toLowerCase()) ||
      row.sto.toLowerCase().includes(detailSearchQuery.toLowerCase()) ||
      row.mitraPelaksana.toLowerCase().includes(detailSearchQuery.toLowerCase());

    return matchHsa && matchTahun && matchBulan && matchStatus && matchDetailSeg && matchSearch;
  });

  // Paginate detail rows
  const totalDetailItems = detailFilteredRows.length;
  const totalPages = Math.ceil(totalDetailItems / itemsPerPage);
  const paginatedDetailRows = detailFilteredRows.slice(
    (detailCurrentPage - 1) * itemsPerPage,
    detailCurrentPage * itemsPerPage
  );

  // Helper for Indonesia numeric value formatting
  const formatIndoNumber = (num: number) => num.toLocaleString('id-ID');

  return (
    <div className="space-y-6" id="qe-dashboard">
      
      {/* PRIMARY FILTER BAR */}
      <div className="bg-white text-slate-800 p-5 rounded-3xl border border-slate-100 shadow-sm" id="primary-filter-bar">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">Panel Filter Utama (Aktual)</h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono bg-slate-50 border border-slate-150 px-2.5 py-0.5 rounded-full">
            Ditemukan: <strong className="text-slate-950">{totalJobsCount}</strong> Pekerjaan
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* SERVICE AREA FILTER */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              <span>SERVICE AREA</span>
            </label>
            <div className="relative">
              <select
                value={filterHsa}
                onChange={(e) => setFilterHsa(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all appearance-none cursor-pointer"
              >
                <option value="All">Semua Wilayah (All)</option>
                {uniqueHSA.map((hsa, index) => (
                  <option key={index} value={hsa}>{hsa}</option>
                ))}
              </select>
              <div className="absolute right-3 top-2.5 pointer-events-none text-slate-500 text-xs">▼</div>
            </div>
          </div>

          {/* BULAN FILTER */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>BULAN</span>
            </label>
            <div className="relative">
              <select
                value={filterBulan}
                onChange={(e) => setFilterBulan(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all appearance-none cursor-pointer"
              >
                <option value="All">Semua Bulan (All)</option>
                {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((bln, index) => (
                  <option key={index} value={bln}>{bln}</option>
                ))}
              </select>
              <div className="absolute right-3 top-2.5 pointer-events-none text-slate-500 text-xs">▼</div>
            </div>
          </div>

          {/* TAHUN FILTER */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>TAHUN</span>
            </label>
            <div className="relative">
              <select
                value={filterTahun}
                onChange={(e) => setFilterTahun(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all appearance-none cursor-pointer"
              >
                <option value="All">Semua Tahun (All)</option>
                {uniqueTahun.map((th, index) => (
                  <option key={index} value={th}>{th}</option>
                ))}
              </select>
              <div className="absolute right-3 top-2.5 pointer-events-none text-slate-500 text-xs">▼</div>
            </div>
          </div>

          {/* SEGMENT FILTER */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5 text-green-500" />
              <span>SEGMENT</span>
            </label>
            <div className="relative">
              <select
                value={filterSegment}
                onChange={(e) => setFilterSegment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all appearance-none cursor-pointer"
              >
                <option value="All">Semua Segment (All)</option>
                {uniqueSegment.map((seg, index) => (
                  <option key={index} value={seg}>{seg}</option>
                ))}
              </select>
              <div className="absolute right-3 top-2.5 pointer-events-none text-slate-500 text-xs">▼</div>
            </div>
          </div>

          {/* STATUS PEKERJAAN FILTER */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <ClipboardCheck className="w-3.5 h-3.5 text-purple-500" />
              <span>STATUS</span>
            </label>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all appearance-none cursor-pointer"
              >
                <option value="All">Semua Status (All)</option>
                {uniqueStatus.map((st, index) => (
                  <option key={index} value={st}>{st}</option>
                ))}
              </select>
              <div className="absolute right-3 top-2.5 pointer-events-none text-slate-500 text-xs">▼</div>
            </div>
          </div>
        </div>
      </div>

      {/* DYNAMIC METRIC KPI CARDS */}
      {activeSubTab === 'main' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          
          {/* TOTAL REALISASI REVENUE (KOLOM P) */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-md flex flex-col justify-between hover:shadow-lg hover:scale-[1.01] transition-all md:col-span-2 lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Realisasi Revenue</span>
              <div className="p-2 bg-slate-800 text-red-500 rounded-xl">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black font-sans text-red-500 tracking-tight">
                Rp {formatIndoNumber(totalRevenue)}
              </h3>
              <p className="text-[10px] text-slate-300 font-mono">
                Akumulasi kolom P (nilaiRealisasi)
              </p>
            </div>
          </div>

          {/* TOTAL WORK ITEMS */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow lg:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Pekerjaan QE</span>
              <div className="p-2 bg-slate-50 text-slate-600 rounded-xl">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-black font-sans text-slate-900 tracking-tight">{formatIndoNumber(totalJobsCount)}</h3>
              <p className="text-[10px] text-slate-400 font-mono">Berdasarkan filter</p>
            </div>
          </div>

          {/* OVERALL COMPLETION COMPLIANCE */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow lg:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Completion Rate</span>
              <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-black font-sans text-green-600 tracking-tight">{overallCompletionRate}%</h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Selesai: <strong className="text-slate-800">{formatIndoNumber(completedJobsCount)}</strong>
              </p>
            </div>
          </div>

          {/* PENDING / IN-PROGRESS ITEMS */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow lg:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Pekerjaan Berjalan</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-black font-sans text-amber-500 tracking-tight">{formatIndoNumber(pendingJobsCount)}</h3>
              <p className="text-[10px] text-slate-400 font-mono">Proses & Pending</p>
            </div>
          </div>

          {/* DROP / CANCELLED ITEMS */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow lg:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Pekerjaan Drop</span>
              <div className="p-2 bg-red-50 text-red-500 rounded-xl">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-black font-sans text-red-500 tracking-tight">{formatIndoNumber(dropJobsCount)}</h3>
              <p className="text-[10px] text-slate-400 font-mono">Status DROP</p>
            </div>
          </div>
        </div>
      )}

      {/* REQUIREMENT 2: DASHBOARD PER SEGMENT QE */}
      {activeSubTab === 'main' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4" id="segment-dashboards-section">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <Layers className="w-4.5 h-4.5 text-red-500" />
              <span>Rincian per Segment</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Analisis performansi, kuantitas volume, dan realisasi finansial spesifik untuk setiap segment. Klik kartu segment untuk mengaktifkan filter cepat segment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {segmentCardsData.map((segCard, idx) => {
              const isSelected = filterSegment === segCard.segment;
              const color = segmentColorMap[segCard.segment] || '#94A3B8';
              
              return (
                <div 
                  key={idx}
                  onClick={() => setFilterSegment(filterSegment === segCard.segment ? 'All' : segCard.segment)}
                  className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    isSelected 
                      ? 'border-red-500 ring-2 ring-red-500/20 shadow-md transform -translate-y-1 bg-red-50/5' 
                      : 'border-slate-100 hover:border-slate-300 shadow-xs hover:shadow-sm hover:-translate-y-0.5'
                  }`}
                >
                  {/* Accent Top Border */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-1.5" 
                    style={{ backgroundColor: color }}
                  />

                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-50">
                      <span className="text-xs font-black text-slate-800 tracking-tight truncate">
                        {segCard.segment}
                      </span>
                      {isSelected ? (
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[8px] font-extrabold rounded-md animate-pulse uppercase">
                          Aktif
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-400 font-bold uppercase hover:text-red-500 transition-colors">
                          Filter
                        </span>
                      )}
                    </div>

                    {/* Stats Fields */}
                    <div className="grid grid-cols-2 gap-2 py-1">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Volume</span>
                        <span className="text-sm font-black text-slate-800">{segCard.total} <span className="text-[10px] text-slate-400 font-normal">Order</span></span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Revenue (P)</span>
                        <span className="text-xs font-black text-slate-900">Rp {formatIndoNumber(segCard.revenue)}</span>
                      </div>
                    </div>

                    {/* Completion rate progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[9px]">
                        <span className="font-bold text-slate-400 uppercase tracking-wider">Completion Rate</span>
                        <span className="font-extrabold text-slate-800">{segCard.completionRate}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ 
                            width: `${segCard.completionRate}%`,
                            backgroundColor: color
                          }}
                        />
                      </div>
                    </div>

                    {/* Status breakdown count */}
                    <div className="flex items-center justify-between text-[9px] pt-1 text-slate-500 font-mono border-t border-slate-50">
                      <span>Selesai: <strong className="text-green-600">{segCard.completed}</strong></span>
                      <span>Proses: <strong className="text-amber-500">{segCard.pending}</strong></span>
                      <span>Drop: <strong className="text-red-500">{segCard.drop}</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MAIN DATA SECTION: TABLE 1 & MONTHLY TREND CHART */}
      {activeSubTab === 'main' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* REQUIREMENT 1: TABLE PERFORMANSI PROSENTASE SEGMENT PEKERJAAN */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col" id="segment-performance-section">
          <div className="flex items-start justify-between gap-2 mb-4">
            <div>
              <h4 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-red-500" />
                <span>Prosentase & Realisasi Segment QE</span>
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Ringkasan volume, realisasi finansial (kolom P), dan tingkat penyelesaian (status SELESAI) per segment pekerjaan.
              </p>
            </div>
            <AIEvaluationButton
              size="sm"
              onClick={() =>
                openAiModal(
                  'Tabel Prosentase & Realisasi Segment QE',
                  {
                    'Total Pekerjaan': totalJobsCount,
                    'Total Revenue': `Rp ${formatIndoNumber(totalRevenue)}`,
                    'Pekerjaan Selesai': completedJobsCount,
                    'Overall Completion Rate': `${overallCompletionRate}%`,
                  },
                  segmentPerformanceList.map(s => ({
                    Segment: s.segment,
                    Volume: s.total,
                    'Realisasi Revenue': `Rp ${formatIndoNumber(s.revenue)}`,
                    'Selesai': s.completed,
                    'Completion Rate': `${s.completionRate}%`,
                  })),
                  {},
                  'Evaluasi kinerja penyelesaian pekerjaan per segment Quality Assurance / QE. Soroti segment dengan completion rate rendah atau revenue tertahan dan rekomendasikan langkah akselerasi.'
                )
              }
            />
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-2.5 px-3">Segment Pekerjaan (AB)</th>
                  <th className="py-2.5 px-3 text-center">Volume</th>
                  <th className="py-2.5 px-3 text-right">Realisasi Revenue (P)</th>
                  <th className="py-2.5 px-3 text-center">Selesai</th>
                  <th className="py-2.5 px-3 text-right">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-700">
                {segmentPerformanceList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-mono">
                      Tidak ada data yang cocok dengan kriteria filter.
                    </td>
                  </tr>
                ) : (
                  segmentPerformanceList.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2">
                          <span 
                            className="w-2.5 h-2.5 rounded-full shrink-0" 
                            style={{ backgroundColor: segmentColorMap[item.segment] || '#94A3B8' }}
                          />
                          <span className="font-bold text-slate-900">{item.segment}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-600">
                        {item.total}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        Rp {formatIndoNumber(item.revenue)}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-green-600 font-bold">
                        {item.completed}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex flex-col items-end space-y-1">
                          <span className={`font-mono font-black ${
                            item.completionRate >= 90 ? 'text-green-600' :
                            item.completionRate >= 70 ? 'text-blue-600' :
                            item.completionRate >= 40 ? 'text-amber-500' : 'text-red-500'
                          }`}>
                            {item.completionRate}%
                          </span>
                          
                          {/* Progress bar container */}
                          <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                item.completionRate >= 90 ? 'bg-green-500' :
                                item.completionRate >= 70 ? 'bg-blue-500' :
                                item.completionRate >= 40 ? 'bg-amber-400' : 'bg-red-500'
                              }`}
                              style={{ width: `${item.completionRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              
              {/* Summary Footer row */}
              {segmentPerformanceList.length > 0 && (
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50 font-bold text-xs text-slate-800">
                    <td className="py-2.5 px-3">TOTAL (FILTERED)</td>
                    <td className="py-2.5 px-3 text-center font-mono">{totalJobsCount}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-950">Rp {formatIndoNumber(totalRevenue)}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-green-600">{completedJobsCount}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-900">{overallCompletionRate}%</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100 text-[10.5px] text-blue-700 flex items-start space-x-1.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Prosentase **Completion Rate** mewakili rasio jumlah pekerjaan yang mencapai status **SELESAI** terhadap keseluruhan order yang diusulkan pada segment tersebut. Nilai realisasi bersumber dari kolom P.
            </p>
          </div>
        </div>

        {/* REQUIREMENT 2: MONTHLY TREND / REVENUE CHART PER SEGMENT */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between" id="monthly-trend-section">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h4 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-red-500" />
                  <span>{chartType === 'tren' ? 'Grafik' : 'Grafik Distribusi Realisasi Revenue per Segment'}</span>
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {chartType === 'tren' 
                    ? 'Analisis tren kuantitas atau persentase selesai setiap segment pekerjaan dari bulan ke bulan.' 
                    : 'Analisis total nilai realisasi revenue (kolom P) per segment pekerjaan.'}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                {/* Chart Type Toggle */}
                <div className="inline-flex bg-slate-100 p-0.5 rounded-lg shrink-0 border border-slate-200">
                  <button
                    onClick={() => setChartType('tren')}
                    className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                      chartType === 'tren' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-500 hover:text-slate-950'
                    }`}
                  >
                    Tren Bulanan
                  </button>
                  <button
                    onClick={() => setChartType('revenue')}
                    className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                      chartType === 'revenue' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-500 hover:text-slate-950'
                    }`}
                  >
                    Revenue Segment
                  </button>
                </div>

                {/* Chart Metric Toggle (only for Tren Bulanan) */}
                {chartType === 'tren' && (
                  <div className="inline-flex bg-slate-100 p-0.5 rounded-lg shrink-0 border border-slate-200">
                    <button
                      onClick={() => setChartMetric('volume')}
                      className={`px-2 py-1 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                        chartMetric === 'volume' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Volume
                    </button>
                    <button
                      onClick={() => setChartMetric('completion')}
                      className={`px-2 py-1 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                        chartMetric === 'completion' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Completion %
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Recharts responsive container */}
            <div className="h-64 w-full mt-2">
              {chartType === 'tren' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis 
                      dataKey="shortName" 
                      tick={{ fill: '#64748B', fontSize: 10, fontWeight: 700 }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis 
                      tick={{ fill: '#64748B', fontSize: 10, fontWeight: 700 }} 
                      axisLine={false} 
                      tickLine={false}
                      domain={chartMetric === 'completion' ? [0, 100] : ['auto', 'auto']}
                      unit={chartMetric === 'completion' ? '%' : ''}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', border: 'none', color: '#FFF', fontSize: '11px' }}
                      formatter={(value: any, name: any) => {
                        const cleanName = String(name).replace('_comp', '');
                        return [chartMetric === 'completion' ? `${value}%` : `${value} Pekerjaan`, cleanName];
                      }}
                    />
                    <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    
                    {uniqueSegment.map((seg, i) => (
                      <Line
                        key={i}
                        type="monotone"
                        dataKey={chartMetric === 'completion' ? `${seg}_comp` : seg}
                        name={seg}
                        stroke={segmentColorMap[seg] || '#94A3B8'}
                        strokeWidth={2.5}
                        activeDot={{ r: 6 }}
                        dot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={segmentCardsData}
                    margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis 
                      dataKey="segment" 
                      tick={{ fill: '#64748B', fontSize: 9, fontWeight: 700 }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis 
                      tick={{ fill: '#64748B', fontSize: 9, fontWeight: 700 }} 
                      axisLine={false} 
                      tickLine={false}
                      tickFormatter={(v) => `Rp ${v.toLocaleString('id-ID')}`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', border: 'none', color: '#FFF', fontSize: '11px' }}
                      formatter={(value: any) => [`Rp ${value.toLocaleString('id-ID')}`, 'Total Revenue (P)']}
                    />
                    <Bar dataKey="revenue" radius={[10, 10, 0, 0]} maxBarSize={45}>
                      {segmentCardsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={segmentColorMap[entry.segment] || '#94A3B8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <span>
                {chartType === 'tren' ? 'Sumbu X: Periode Usulan Pekerjaan' : 'Sumbu X: Segment Pekerjaan'}
              </span>
            </span>
            <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-mono text-[10px]">
              {chartType === 'tren' 
                ? `Tampilan: ${chartMetric === 'volume' ? 'Volume Pekerjaan' : 'Persentase Selesai (%)'}` 
                : 'Tampilan: Total Revenue (Rupiah)'}
            </span>
          </div>
        </div>
      </div>
      )}

      {/* REQUIREMENT 3: DETAIL DATA TABLE WITH SEGMENT FILTER */}
      {activeSubTab === 'detail' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4" id="detail-data-section">
        
        {/* Detail Table Header and explanation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <Table className="w-4.5 h-4.5 text-red-500" />
              <span>Detail Transaksi</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Menampilkan detail data pilihan transaksi pekerjaan, diformat ringkas dan terpadu untuk kemudahan evaluasi.
            </p>
          </div>

          {/* Search bar inside detailed table & AI Evaluation */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <AIEvaluationButton
              size="sm"
              onClick={() =>
                openAiModal(
                  'Tabel Detail Transaksi & Rekapitulasi Pekerjaan QE',
                  {
                    'Total Terfilter': detailFilteredRows.length,
                    'Halaman': `${detailCurrentPage} dari ${totalPages}`,
                    'Segment Terpilih': detailFilterSegment,
                  },
                  paginatedDetailRows.slice(0, 15).map(r => ({
                    Segment: r.segment,
                    'Uraian Pekerjaan': r.uraian,
                    STO: r.sto,
                    Mitra: r.mitraPelaksana,
                    Status: r.status,
                    Bulan: r.bulanUsulan,
                  })),
                  { 'Pencarian': detailSearchQuery || 'Semua' },
                  'Analisis sampel pekerjaan proyek QE ini. Identifikasi kendala status pekerjaan yang belum selesai dan berikan rekomendasi koordinasi dengan mitra pelaksana.'
                )
              }
            />
            <div className="relative w-full md:w-64 shrink-0">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari uraian, STO, mitra..."
                value={detailSearchQuery}
                onChange={(e) => setDetailSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-red-500 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* COMPACT SEGMENT TABS FOR THE DEDICATED DETAIL TABLE FILTER ("buat filter dulu segment pekerjaan") */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center space-x-1">
            <span>Filter Cepat Segment Pekerjaan</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setDetailFilterSegment('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all border ${
                detailFilterSegment === 'All'
                  ? 'bg-red-500 text-white border-red-500 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100/60'
              }`}
            >
              Semua Segment (All)
            </button>
            {uniqueSegment.map((seg, idx) => (
              <button
                key={idx}
                onClick={() => setDetailFilterSegment(seg)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all border flex items-center space-x-1.5 ${
                  detailFilterSegment === seg
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100/60'
                }`}
              >
                <span 
                  className="w-1.5 h-1.5 rounded-full" 
                  style={{ backgroundColor: segmentColorMap[seg] || '#94A3B8' }}
                />
                <span>{seg}</span>
              </button>
            ))}
          </div>
        </div>

        {/* HIGH-DENSITY COMPACT TABLE STRUCTURE ("kolom bisa dibaca dalam 1 tampilan") */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left border-collapse table-fixed min-w-[850px]">
            <thead>
              <tr className="border-b border-slate-200 text-[9.5px] font-black text-slate-400 uppercase tracking-wider bg-slate-50">
                <th className="py-1.5 px-2 w-[13%]">Segment (AB)</th>
                <th className="py-1.5 px-2 w-[37%]">Uraian Pekerjaan (C)</th>
                <th className="py-1.5 px-2 w-[7%] text-center">IHLD (G)</th>
                <th className="py-1.5 px-2 w-[7%] text-center">AISS (H)</th>
                <th className="py-1.5 px-2 w-[9%] text-center">Bulan (K)</th>
                <th className="py-1.5 px-2 w-[11%] text-center">Status (U)</th>
                <th className="py-1.5 px-1.5 w-[5.5%] text-center">WH (R)</th>
                <th className="py-1.5 px-1.5 w-[5.5%] text-center">Mitra (S)</th>
                <th className="py-1.5 px-1.5 w-[5%] text-center">TIF (T)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[9.5px] font-medium text-slate-600">
              {paginatedDetailRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-mono">
                    Tidak ditemukan detail transaksi pekerjaan yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                paginatedDetailRows.map((row, idx) => {
                  const s = row.status.toUpperCase();
                  const isSelesai = s === 'SELESAI';
                  const isDrop = s === 'DROP';

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      {/* Segment Column AB */}
                      <td className="py-1.5 px-2 truncate">
                        <span 
                          className="px-1.5 py-0.5 rounded-md font-bold text-[9px]"
                          style={{
                            backgroundColor: `${segmentColorMap[row.segment]}15` || '#F1F5F9',
                            color: segmentColorMap[row.segment] || '#64748B',
                          }}
                        >
                          {row.segment}
                        </span>
                      </td>

                      {/* Uraian Pekerjaan Column C */}
                      <td className="py-1.5 px-2">
                        <div 
                          className="font-bold text-slate-900 text-[10px] truncate" 
                          title={`${row.uraian}\nSTO: ${row.sto}\nMitra: ${row.mitraPelaksana}`}
                        >
                          {row.uraian}
                        </div>
                        <div className="text-[8.5px] text-slate-400 mt-0.5 flex items-center space-x-1.5">
                          <span className="font-mono bg-slate-100 text-slate-600 px-1 py-0.2 rounded">STO: {row.sto}</span>
                          <span className="truncate">Mitra: {row.mitraPelaksana || '-'}</span>
                        </div>
                      </td>

                      {/* IHLD Column G */}
                      <td className="py-1.5 px-2 text-center font-mono text-slate-500 truncate">
                        {row.ihld || '-'}
                      </td>

                      {/* AISS Column H */}
                      <td className="py-1.5 px-2 text-center font-mono text-slate-500 truncate">
                        {row.aiss || '-'}
                      </td>

                      {/* Bulan Column K */}
                      <td className="py-1.5 px-2 text-center font-semibold text-slate-700 truncate">
                        {row.bulanUsulan}
                      </td>

                      {/* Status Column U */}
                      <td className="py-1.5 px-2 text-center">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[8.5px] font-extrabold uppercase ${
                          isSelesai ? 'bg-green-100 text-green-700' :
                          isDrop ? 'bg-red-100 text-red-700' :
                          s.includes('WAIT') ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1 ${
                            isSelesai ? 'bg-green-500' :
                            isDrop ? 'bg-red-500' :
                            s.includes('WAIT') ? 'bg-blue-500' : 'bg-amber-500'
                          }`} />
                          <span className="max-w-[75px] truncate" title={row.status}>{row.status}</span>
                        </span>
                      </td>

                      {/* Rekon WH Column R */}
                      <td className="py-1.5 px-1.5 text-center text-[9px] font-semibold truncate">
                        <span className={row.rekonWh.includes('SELESAI') ? 'text-green-600 font-bold' : 'text-slate-400'}>
                          {row.rekonWh.replace(' ✅', '') || '-'}
                        </span>
                      </td>

                      {/* Rekon Mitra Column S */}
                      <td className="py-1.5 px-1.5 text-center text-[9px] font-semibold truncate">
                        <span className={row.rekonMitra.includes('SELESAI') ? 'text-green-600 font-bold' : 'text-slate-400'}>
                          {row.rekonMitra.replace(' ✅', '') || '-'}
                        </span>
                      </td>

                      {/* Rekon TIF Column T */}
                      <td className="py-1.5 px-1.5 text-center text-[9px] font-semibold truncate">
                        <span className={row.rekonTif.includes('SELESAI') ? 'text-green-600 font-bold' : 'text-slate-400'}>
                          {row.rekonTif.replace(' ✅', '') || '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs">
            <div className="text-slate-500 font-medium">
              Menampilkan <strong>{Math.min(totalDetailItems, (detailCurrentPage - 1) * itemsPerPage + 1)}</strong> - <strong>{Math.min(totalDetailItems, detailCurrentPage * itemsPerPage)}</strong> dari <strong>{totalDetailItems}</strong> transaksi
            </div>

            <div className="inline-flex items-center space-x-1.5">
              <button
                onClick={() => setDetailCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={detailCurrentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-semibold text-slate-800 px-2 font-mono">
                Halaman {detailCurrentPage} dari {totalPages}
              </span>

              <button
                onClick={() => setDetailCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={detailCurrentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* AI Performance Evaluation Modal */}
      <AIEvaluationModal
        isOpen={aiModalState.isOpen}
        onClose={() => setAiModalState(prev => ({ ...prev, isOpen: false }))}
        tableName={aiModalState.tableName}
        dashboardContext="Quality Engineering (QE) Performance Dashboard"
        filterContext={aiModalState.filterContext}
        summaryMetrics={aiModalState.summaryMetrics}
        sampleRows={aiModalState.sampleRows}
        promptNote={aiModalState.promptNote}
      />
    </div>
  );
}
