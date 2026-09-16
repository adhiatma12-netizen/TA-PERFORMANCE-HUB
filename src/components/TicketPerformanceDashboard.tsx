import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Ticket,
  Search,
  RefreshCw,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  TrendingUp,
  AlertCircle,
  Building2,
  Sparkles,
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

const PIE_COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
const HVC_COLORS: { [key: string]: string } = {
  HVC_DIAMOND: '#06B6D4',
  HVC_PLATINUM: '#8B5CF6',
  HVC_GOLD: '#F59E0B',
  REGULER: '#64748B',
};

// Format number with strictly two decimal digits (e.g. 17.15, 2.05, 0.00)
function formatTwoDigits(val: number | string | undefined | null): string {
  if (val === undefined || val === null || val === '') return '0.00';
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
  if (isNaN(num) || num <= 0) return '0.00';
  return num.toFixed(2);
}

export default function TicketPerformanceDashboard() {
  const [data, setData] = useState<AssuranceTicketDashboardData>(() =>
    computeDashboardData(FALLBACK_ASSURANCE_TICKETS, ASSURANCE_SPREADSHEET_ID, DEFAULT_SHEET_TAB, false)
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active view inside the performance dashboard
  const [activeViewMode, setActiveViewMode] = useState<'matrix' | 'sektor' | 'sto' | 'type_hvc'>('matrix');

  // Filters for both performance table and detail table
  const [selectedBulan, setSelectedBulan] = useState<string>('ALL'); // Kolom A
  const [selectedSektor, setSelectedSektor] = useState<string>('ALL'); // Kolom C
  const [selectedType, setSelectedType] = useState<string>('ALL');     // Kolom B
  const [selectedSto, setSelectedSto] = useState<string>('ALL');       // Kolom P
  const [selectedHvc, setSelectedHvc] = useState<string>('ALL');       // Kolom T
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // Filtered raw ticket records for Detail Table and dynamic recalculation
  const filteredRecords = useMemo(() => {
    return data.records.filter(rec => {
      if (selectedBulan !== 'ALL' && rec.bulanRekap !== selectedBulan) return false;
      if (selectedSektor !== 'ALL' && rec.sektor !== selectedSektor) return false;
      if (selectedType !== 'ALL' && rec.typeTiket !== selectedType) return false;
      if (selectedSto !== 'ALL' && rec.sto !== selectedSto) return false;
      if (selectedHvc !== 'ALL' && rec.flagHvc !== selectedHvc) return false;

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
  }, [data.records, selectedBulan, selectedSektor, selectedType, selectedSto, selectedHvc, searchQuery]);

  // Re-computed Performance Matrix based on filtered data (Kolom C, B, P, T)
  const computedPerformanceMatrix = useMemo(() => {
    // Grouping by Sektor (C) and STO (P)
    const map = new Map<string, {
      sektor: string;
      sto: string;
      reguler: number;
      sqm: number;
      total: number;
      hvcDiamond: number;
      hvcPlatinum: number;
      hvcGold: number;
      hvcReguler: number;
      sumTtr: number;
      ttrCount: number;
      closed: number;
    }>();

    filteredRecords.forEach(rec => {
      const key = `${rec.sektor}__${rec.sto}`;
      if (!map.has(key)) {
        map.set(key, {
          sektor: rec.sektor,
          sto: rec.sto,
          reguler: 0,
          sqm: 0,
          total: 0,
          hvcDiamond: 0,
          hvcPlatinum: 0,
          hvcGold: 0,
          hvcReguler: 0,
          sumTtr: 0,
          ttrCount: 0,
          closed: 0,
        });
      }
      const entry = map.get(key)!;
      entry.total++;
      if (rec.typeTiket.includes('REGULER')) entry.reguler++;
      if (rec.typeTiket.includes('SQM')) entry.sqm++;

      if (rec.flagHvc.includes('DIAMOND')) entry.hvcDiamond++;
      else if (rec.flagHvc.includes('PLATINUM')) entry.hvcPlatinum++;
      else if (rec.flagHvc.includes('GOLD')) entry.hvcGold++;
      else entry.hvcReguler++;

      if (rec.ttr > 0) {
        entry.sumTtr += rec.ttr;
        entry.ttrCount++;
      }
      if (rec.status.toUpperCase() === 'CLOSED') entry.closed++;
    });

    const totalFiltered = filteredRecords.length;
    return Array.from(map.values())
      .map(entry => ({
        sektor: entry.sektor,
        sto: entry.sto,
        total: entry.total,
        reguler: entry.reguler,
        regulerPct: entry.total > 0 ? (entry.reguler / entry.total) * 100 : 0,
        sqm: entry.sqm,
        sqmPct: entry.total > 0 ? (entry.sqm / entry.total) * 100 : 0,
        hvcDiamond: entry.hvcDiamond,
        hvcPlatinum: entry.hvcPlatinum,
        hvcGold: entry.hvcGold,
        hvcReguler: entry.hvcReguler,
        totalHvc: entry.hvcDiamond + entry.hvcPlatinum + entry.hvcGold,
        hvcPct: entry.total > 0 ? ((entry.hvcDiamond + entry.hvcPlatinum + entry.hvcGold) / entry.total) * 100 : 0,
        avgTtr: entry.ttrCount > 0 ? entry.sumTtr / entry.ttrCount : 0,
        closeRate: entry.total > 0 ? (entry.closed / entry.total) * 100 : 100,
        sharePct: totalFiltered > 0 ? (entry.total / totalFiltered) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredRecords]);

  // Unique options for filter selects
  const uniqueBulan = useMemo(() => {
    return Array.from(new Set(data.records.map(r => r.bulanRekap))).filter(Boolean).sort();
  }, [data.records]);

  const uniqueSektors = useMemo(() => {
    return Array.from(new Set(data.records.map(r => r.sektor))).filter(Boolean).sort();
  }, [data.records]);

  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(data.records.map(r => r.typeTiket))).filter(Boolean).sort();
  }, [data.records]);

  const uniqueStos = useMemo(() => {
    return Array.from(new Set(data.records.map(r => r.sto))).filter(Boolean).sort();
  }, [data.records]);

  const uniqueHvcs = useMemo(() => {
    return Array.from(new Set(data.records.map(r => r.flagHvc))).filter(Boolean).sort();
  }, [data.records]);

  // Chart Data: Sektor vs Type Tiket
  const chartSektorData = useMemo(() => {
    const sMap: { [sektor: string]: { sektor: string; REGULER: number; SQM: number; total: number } } = {};
    filteredRecords.forEach(r => {
      const s = r.sektor || 'LAINNYA';
      if (!sMap[s]) sMap[s] = { sektor: s, REGULER: 0, SQM: 0, total: 0 };
      sMap[s].total++;
      if (r.typeTiket.includes('REGULER')) sMap[s].REGULER++;
      if (r.typeTiket.includes('SQM')) sMap[s].SQM++;
    });
    return Object.values(sMap);
  }, [filteredRecords]);

  // Chart Data: STO Distribution
  const chartStoData = useMemo(() => {
    const stoMap: { [sto: string]: number } = {};
    filteredRecords.forEach(r => {
      const s = r.sto || 'UNKNOWN';
      stoMap[s] = (stoMap[s] || 0) + 1;
    });
    return Object.entries(stoMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredRecords]);

  // Chart Data: HVC Distribution
  const chartHvcData = useMemo(() => {
    const hvcMap: { [h: string]: number } = {};
    filteredRecords.forEach(r => {
      const h = r.flagHvc || 'REGULER';
      hvcMap[h] = (hvcMap[h] || 0) + 1;
    });
    return Object.entries(hvcMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredRecords]);

  // Dynamic Rata-rata TTR calculated with 2 decimal places precision
  const filteredAvgTtr = useMemo(() => {
    let sum = 0;
    let count = 0;
    filteredRecords.forEach(r => {
      if (r.ttr > 0) {
        sum += r.ttr;
        count++;
      }
    });
    return count > 0 ? sum / count : 0;
  }, [filteredRecords]);

  return (
    <div className="space-y-6" id="ticket-performance-dashboard-container">
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4" id="kpi-cards-grid">
        {/* Card 1: Total Tiket */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Total Tiket
            </span>
            <div className="p-2 bg-red-50 text-red-500 rounded-2xl">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {filteredRecords.length.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
              <span>Dari total {data.totalRecords.toLocaleString('id-ID')} tiket</span>
            </p>
          </div>
        </div>

        {/* Card 2: Sektor */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Sektor
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-2xl">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {uniqueSektors.length} Sektor
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-2 font-medium">
              <span className="text-amber-600 font-bold">M1: {data.records.filter(r => r.sektor.includes('1')).length}</span>
              <span>•</span>
              <span className="text-slate-600 font-bold">M3: {data.records.filter(r => r.sektor.includes('3')).length}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Type Tiket */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Type Tiket
            </span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-2xl">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {data.kpis.regulerRatio}% Reguler
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-2 font-medium">
              <span className="text-sky-600 font-bold">Reg: {data.kpis.totalReguler}</span>
              <span>•</span>
              <span className="text-purple-600 font-bold">SQM: {data.kpis.totalSqm}</span>
            </div>
          </div>
        </div>

        {/* Card 4: STO */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              STO Aktif
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {uniqueStos.length} STO
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              MNZ, MSP, CRB, UTR
            </p>
          </div>
        </div>

        {/* Card 5: FLAG HVC */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Pelanggan HVC
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-2xl">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-700 tracking-tight">
              {data.kpis.totalHvc.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
              <span className="font-bold text-amber-600">{data.kpis.hvcRatio}%</span>
              <span>dari total prioritas</span>
            </p>
          </div>
        </div>

        {/* Card 6: Rata-rata TTR */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Rata-rata TTR
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-2xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600 tracking-tight">
              {filteredAvgTtr > 0 ? `${formatTwoDigits(filteredAvgTtr)} Jam` : '-'}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
              <span>2 angka di belakang koma</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. VISUAL CHARTS OVERVIEW (SEKTOR x TYPE TIKET, STO, HVC) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Sektor vs Type Tiket (Kolom C x Kolom B) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Volume per Sektor & Type Tiket
              </h4>
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-600">
                Sektor vs Type
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-4">
              Perbandingan jumlah tiket Reguler dan SQM di Sektor Madiun 1 dan Madiun 3.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartSektorData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="sektor" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                    border: 'none',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="REGULER" name="Tiket Reguler" fill="#EF4444" radius={[6, 6, 0, 0]} />
                <Bar dataKey="SQM" name="Tiket SQM" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: STO Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Sebaran Tiket per STO
              </h4>
              <span className="text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full font-bold text-emerald-700 border border-emerald-100">
                Distribusi STO
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-4">
              Distribusi beban tiket pada masing-masing Sentral Telepon Otomat.
            </p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartStoData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartStoData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number, name: string) => [
                    `${val.toLocaleString('id-ID')} Tiket (${((val / (filteredRecords.length || 1)) * 100).toFixed(1)}%)`,
                    `STO ${name}`,
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                    border: 'none',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Flag HVC Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Segmentasi Layanan HVC
              </h4>
              <span className="text-[10px] bg-purple-50 px-2 py-0.5 rounded-full font-bold text-purple-700 border border-purple-100">
                Prioritas HVC
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-4">
              Segmentasi pelanggan terdampak gangguan berdasarkan kategori prioritas HVC.
            </p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartHvcData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartHvcData.map((entry, index) => (
                    <Cell
                      key={`hvc-${index}`}
                      fill={HVC_COLORS[entry.name] || PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number, name: string) => [
                    `${val.toLocaleString('id-ID')} Tiket (${((val / (filteredRecords.length || 1)) * 100).toFixed(1)}%)`,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                    border: 'none',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. FILTER BAR FOR BOTH TABLES */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Filter Data Operasional
            </h3>
          </div>

          <div className="flex items-center space-x-3">
            {/* Quick reset button */}
            {(selectedBulan !== 'ALL' || selectedSektor !== 'ALL' || selectedType !== 'ALL' || selectedSto !== 'ALL' || selectedHvc !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedBulan('ALL');
                  setSelectedSektor('ALL');
                  setSelectedType('ALL');
                  setSelectedSto('ALL');
                  setSelectedHvc('ALL');
                  setSearchQuery('');
                }}
                className="text-xs font-bold text-red-500 hover:text-red-700 underline cursor-pointer"
              >
                Reset Semua Filter
              </button>
            )}

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              title="Perbarui Data dari Google Sheets"
              id="btn-refresh-ticket-data"
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
              Bulan
            </label>
            <select
              value={selectedBulan}
              onChange={e => setSelectedBulan(e.target.value)}
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
              id="filter-bulan"
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
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
              id="filter-sektor"
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
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
              id="filter-type"
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
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
              id="filter-sto"
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
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
              id="filter-hvc"
            >
              <option value="ALL">Semua Level HVC</option>
              {uniqueHvcs.map(h => (
                <option key={h} value={h}>
                  {h} ({data.records.filter(r => r.flagHvc === h).length})
                </option>
              ))}
            </select>
          </div>

          {/* Search box */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
              Pencarian Tiket / ODP
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari Tiket, No Inet, ODP..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                id="search-ticket-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 5. TABEL PERFORMANSI */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden" id="section-tabel-performansi">
        <div className="p-6 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 bg-red-100 text-red-700 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
                  Tabel Performansi Utama
                </span>
                <span className="text-xs text-slate-400 font-medium">• Agregasi Multidimensi</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                Tabel Performansi Agregasi (Sektor, Type Tiket, STO, & HVC)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rangkuman performansi dan proporsi penanganan tiket berdasarkan hierarki Sektor, STO, Type Tiket, serta level Flag HVC.
              </p>
            </div>

            {/* Action and View Mode Toggle */}
            <div className="flex items-center space-x-2 shrink-0">
              <AIEvaluationButton
                onClick={() => {
                  let sampleData: any[] = [];
                  let tableLabel = '';
                  if (activeViewMode === 'matrix') {
                    tableLabel = 'Tabel Sektor x STO Matrix';
                    sampleData = data.matrixPerformance.slice(0, 25).map(m => ({
                      Sektor: m.sektor,
                      STO: m.sto,
                      Type: m.typeTiket,
                      'Total Tiket': m.totalTiket,
                      'Reguler': m.regulerCount,
                      'SQM': m.sqmCount,
                      'Avg TTR (Jam)': formatTwoDigits(m.avgTtrHours),
                      'Close Rate %': `${formatTwoDigits(m.closeRate)}%`,
                    }));
                  } else if (activeViewMode === 'sektor') {
                    tableLabel = 'Tabel Performansi per Sektor';
                    sampleData = data.bySektor.map(s => ({
                      Sektor: s.sektor,
                      'Total Tiket': s.totalTiket,
                      'Reguler': s.regulerCount,
                      'SQM': s.sqmCount,
                      'Share %': `${formatTwoDigits(s.sharePercent)}%`,
                      'Avg TTR (Jam)': formatTwoDigits(s.avgTtrHours),
                      'Close Rate %': `${formatTwoDigits(s.closeRate)}%`,
                    }));
                  } else if (activeViewMode === 'sto') {
                    tableLabel = 'Tabel Performansi per STO';
                    sampleData = data.bySto.slice(0, 25).map(s => ({
                      STO: s.sto,
                      Sektor: s.sektor,
                      'Total Tiket': s.totalTiket,
                      'Share %': `${formatTwoDigits(s.sharePercent)}%`,
                      'Avg TTR (Jam)': formatTwoDigits(s.avgTtrHours),
                      'Close Rate %': `${formatTwoDigits(s.closeRate)}%`,
                    }));
                  } else {
                    tableLabel = 'Tabel Performansi Type Tiket & HVC';
                    sampleData = data.byHvc.map(c => ({
                      HVC: c.flagHvc,
                      'Total Tiket': c.totalTiket,
                      'Reguler': c.regulerTiket,
                      'SQM': c.sqmTiket,
                      'Top STO': c.topSto,
                      'Avg TTR (Jam)': formatTwoDigits(c.avgTtrHours),
                      'Share %': `${formatTwoDigits(c.sharePercent)}%`,
                    }));
                  }

                  openAiModal(
                    tableLabel,
                    {
                      'Mode Tampilan': activeViewMode.toUpperCase(),
                      'Total Tiket': data.kpis.totalTickets,
                      'Rata-rata TTR': `${formatTwoDigits(data.kpis.avgTtrHours)} Jam`,
                      'Overall Close Rate': `${formatTwoDigits(data.kpis.overallCloseRate)}%`,
                      'Tiket Reguler': data.kpis.totalReguler,
                      'Tiket SQM': data.kpis.totalSqm,
                      'Tiket HVC': data.kpis.totalHvc,
                    },
                    sampleData,
                    { 'Mode Agregasi': activeViewMode },
                    `Berikan evaluasi terhadap performansi penanganan gangguan pada tampilan ${tableLabel}. Identifikasi bottleneck durasi perbaikan (TTR) dan rekomendasi perbaikan SLA operasional.`
                  );
                }}
              />

              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-2xl shrink-0">
                <button
                  onClick={() => setActiveViewMode('matrix')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeViewMode === 'matrix' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sektor x STO (C & P)
                </button>
                <button
                  onClick={() => setActiveViewMode('sektor')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeViewMode === 'sektor' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sektor (C)
                </button>
                <button
                  onClick={() => setActiveViewMode('sto')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeViewMode === 'sto' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  STO (P)
                </button>
                <button
                  onClick={() => setActiveViewMode('type_hvc')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeViewMode === 'type_hvc' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Type & HVC (B & T)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Table Body depending on View Mode */}
        <div className="overflow-x-auto">
          {activeViewMode === 'matrix' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <th className="py-3.5 px-4">Sektor</th>
                  <th className="py-3.5 px-4">STO</th>
                  <th className="py-3.5 px-4 text-center">Total Tiket</th>
                  <th className="py-3.5 px-4 text-center">Tiket Reguler</th>
                  <th className="py-3.5 px-4 text-center">Tiket SQM</th>
                  <th className="py-3.5 px-4 text-center">HVC Platinum</th>
                  <th className="py-3.5 px-4 text-center">HVC Gold</th>
                  <th className="py-3.5 px-4 text-center">Rata-rata TTR</th>
                  <th className="py-3.5 px-4 text-center">Status Close</th>
                  <th className="py-3.5 px-4 text-right">Share Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {computedPerformanceMatrix.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                      <span>{item.sektor}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md text-[11px]">
                        {item.sto}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-extrabold text-slate-900">
                      {item.total.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center space-x-1">
                        <span className="font-bold text-red-600">{item.reguler}</span>
                        <span className="text-[10px] text-slate-400">({item.regulerPct.toFixed(0)}%)</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center space-x-1">
                        <span className="font-bold text-sky-600">{item.sqm}</span>
                        <span className="text-[10px] text-slate-400">({item.sqmPct.toFixed(0)}%)</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-bold rounded-md text-[11px]">
                        {item.hvcPlatinum}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold rounded-md text-[11px]">
                        {item.hvcGold}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {item.avgTtr > 0 ? `${formatTwoDigits(item.avgTtr)} jam` : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md text-[11px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{item.closeRate.toFixed(0)}%</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-red-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, item.sharePct * 2.5)}%` }}
                          />
                        </div>
                        <span className="font-mono text-slate-500 font-bold w-10 text-right">
                          {item.sharePct.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeViewMode === 'sektor' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <th className="py-3.5 px-4">Sektor</th>
                  <th className="py-3.5 px-4 text-center">Total Tiket</th>
                  <th className="py-3.5 px-4 text-center">Reguler</th>
                  <th className="py-3.5 px-4 text-center">SQM</th>
                  <th className="py-3.5 px-4">Rincian STO</th>
                  <th className="py-3.5 px-4 text-center">Rata-rata TTR</th>
                  <th className="py-3.5 px-4 text-center">Close Rate</th>
                  <th className="py-3.5 px-4 text-right">Kontribusi Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {data.bySektor.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-900 flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-red-500 shrink-0" />
                      <span className="text-sm font-black">{s.sektor}</span>
                    </td>
                    <td className="py-4 px-4 text-center font-extrabold text-base text-slate-900">
                      {s.totalTiket.toLocaleString('id-ID')}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-bold text-red-600">{s.regulerCount}</span>
                      <span className="text-slate-400 text-[10px] ml-1">
                        ({((s.regulerCount / s.totalTiket) * 100).toFixed(0)}%)
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-bold text-sky-600">{s.sqmCount}</span>
                      <span className="text-slate-400 text-[10px] ml-1">
                        ({((s.sqmCount / s.totalTiket) * 100).toFixed(0)}%)
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(s.stoBreakdown).map(([sto, count]) => (
                          <span
                            key={sto}
                            className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-mono"
                          >
                            {sto}: <strong>{count}</strong>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center font-mono">
                      {s.avgTtrHours > 0 ? `${formatTwoDigits(s.avgTtrHours)} jam` : '-'}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md font-bold text-xs">
                        {s.closeRate}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-bold font-mono text-slate-900">
                      {s.sharePercent}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeViewMode === 'sto' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <th className="py-3.5 px-4">STO</th>
                  <th className="py-3.5 px-4">Sektor</th>
                  <th className="py-3.5 px-4 text-center">Total Tiket</th>
                  <th className="py-3.5 px-4 text-center">Tiket Reguler</th>
                  <th className="py-3.5 px-4 text-center">Tiket SQM</th>
                  <th className="py-3.5 px-4 text-center">HVC Platinum</th>
                  <th className="py-3.5 px-4 text-center">HVC Gold</th>
                  <th className="py-3.5 px-4 text-center">Rata-rata TTR</th>
                  <th className="py-3.5 px-4 text-right">Share Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {data.bySto.map((st, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-black text-slate-900 text-sm">
                      <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        {st.sto}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700">{st.sektor}</td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-slate-900 text-sm">
                      {st.totalTiket.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-red-600">{st.regulerCount}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-sky-600">{st.sqmCount}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold">
                        {st.hvcPlatinum}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold">
                        {st.hvcGold}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      {st.avgTtrHours > 0 ? `${formatTwoDigits(st.avgTtrHours)} jam` : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {st.sharePercent}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeViewMode === 'type_hvc' && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Type Tiket Summary */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                <h4 className="text-xs font-extrabold uppercase text-slate-600 tracking-wider mb-3 flex items-center space-x-1.5">
                  <Layers className="w-4 h-4 text-red-500" />
                  <span>Performansi Type Tiket</span>
                </h4>
                <div className="space-y-3">
                  {data.byTypeTiket.map((t, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-black text-slate-900">{t.typeTiket}</span>
                        <span className="text-xs font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                          {t.totalTiket.toLocaleString('id-ID')} Tiket ({t.sharePercent}%)
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Madiun 1:</span>
                          <strong className="text-slate-800">{t.sektorMadiun1}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Madiun 3:</span>
                          <strong className="text-slate-800">{t.sektorMadiun3}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Rata-rata TTR:</span>
                          <strong className="text-slate-800">{t.avgTtrHours > 0 ? `${formatTwoDigits(t.avgTtrHours)} Jam` : '-'}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* HVC Summary */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                <h4 className="text-xs font-extrabold uppercase text-slate-600 tracking-wider mb-3 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Performansi Kategori HVC</span>
                </h4>
                <div className="space-y-3">
                  {data.byHvc.map((h, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-xs">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-black text-slate-900">{h.flagHvc}</span>
                        <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                          {h.totalTiket.toLocaleString('id-ID')} Tiket ({h.sharePercent}%)
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Tiket Reguler:</span>
                          <strong className="text-slate-800">{h.regulerTiket}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Tiket SQM:</span>
                          <strong className="text-slate-800">{h.sqmTiket}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">STO Terbanyak:</span>
                          <strong className="text-slate-800">{h.topSto}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Rata-rata TTR:</span>
                          <strong className="text-slate-800">{h.avgTtrHours > 0 ? `${formatTwoDigits(h.avgTtrHours)} Jam` : '-'}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Performance Evaluation Modal */}
      <AIEvaluationModal
        isOpen={aiModalState.isOpen}
        onClose={() => setAiModalState(prev => ({ ...prev, isOpen: false }))}
        tableName={aiModalState.tableName}
        dashboardContext="Assurance Ticket Performance (Sub-Halaman 1)"
        filterContext={aiModalState.filterContext}
        summaryMetrics={aiModalState.summaryMetrics}
        sampleRows={aiModalState.sampleRows}
        promptNote={aiModalState.promptNote}
      />
    </div>
  );
}
