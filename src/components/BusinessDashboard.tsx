import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  Line,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Wallet,
  ShieldCheck,
  Percent,
  Layers,
  BarChart2,
  Calendar,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Download,
  ChevronDown,
  ChevronUp,
  Briefcase,
  PieChart as PieIcon,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  ArrowRight,
} from 'lucide-react';
import { RegionalPerformanceData, Regional } from '../types';
import { ProvisioningRow } from '../data/provisioningStats';
import {
  fetchBCDataFromSheet,
  calculateBCStats,
  PortfolioSummary,
  ProgramDetail,
  BCDashboardStats,
} from '../lib/bcSheetFetcher';
import { BCRecord } from '../data/bcFallbackData';
import AIEvaluationModal, { AIEvaluationButton } from './AIEvaluationModal';

export type BusinessSubTab = 'kpi' | 'trend' | 'portfolio';

interface BusinessDashboardProps {
  data: RegionalPerformanceData;
  allRegionsData: { [key: string]: RegionalPerformanceData };
  activeRegional: Regional;
  setActiveRegional: (regional: Regional) => void;
  activeMonth: string;
  setActiveMonth: (month: string) => void;
  activeYear: string;
  setActiveYear: (year: string) => void;
  provisioningData?: ProvisioningRow[];
  activeSubTab?: BusinessSubTab;
  setActiveSubTab?: (tab: BusinessSubTab) => void;
}

export default function BusinessDashboard({
  data,
  allRegionsData,
  activeRegional,
  setActiveRegional,
  activeMonth,
  setActiveMonth,
  activeYear,
  setActiveYear,
  activeSubTab = 'kpi',
  setActiveSubTab,
}: BusinessDashboardProps) {
  // Data state
  const [allRecords, setAllRecords] = useState<BCRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLive, setIsLive] = useState<boolean>(true);
  const [lastFetchTime, setLastFetchTime] = useState<string>('');

  // Filter states
  const [selectedBulan, setSelectedBulan] = useState<string>('Semua Bulan'); // Kolom A filter
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('All'); // Kolom Q filter
  const [searchQuery, setSearchQuery] = useState<string>(''); // Search by Nama Program (Kolom R)

  // Chart view states for high-end professional visualization
  const [trendMetric, setTrendMetric] = useState<'all' | 'revenue' | 'profit'>('all');
  const [pieMetric, setPieMetric] = useState<'revenue' | 'profit'>('revenue');

  // Accordion state for expandable portfolio cards
  const [expandedPortfolios, setExpandedPortfolios] = useState<Record<string, boolean>>({
    Konstruksi: true,
    Provisioning: true,
    'MS OPEX': true,
    'MS CAPEX': true,
    SDI: true,
  });

  // AI Evaluation Modal State
  const [aiModalState, setAiModalState] = useState<{
    isOpen: boolean;
    tableName: string;
    dashboardContext: string;
    filterContext: Record<string, any>;
    summaryMetrics: Record<string, any>;
    sampleRows: any[];
    promptNote?: string;
  }>({
    isOpen: false,
    tableName: '',
    dashboardContext: 'Bisnis & Finansial Telkom Akses',
    filterContext: {},
    summaryMetrics: {},
    sampleRows: [],
  });

  const openAiEvaluation = (
    tableName: string,
    summaryMetrics: Record<string, any>,
    sampleRows: any[],
    customFilters: Record<string, any> = {},
    promptNote: string = ''
  ) => {
    setAiModalState({
      isOpen: true,
      tableName,
      dashboardContext: 'Bisnis & Finansial Telkom Akses',
      filterContext: {
        Regional: activeRegional,
        Bulan: selectedBulan,
        Portofolio: selectedPortfolio,
        Tahun: activeYear,
        ...customFilters,
      },
      summaryMetrics,
      sampleRows,
      promptNote,
    });
  };

  // Fetch sheet data on mount
  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetchBCDataFromSheet();
      setAllRecords(res.records);
      setIsLive(res.isLive);
      setLastFetchTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.warn('Error fetching BC sheet data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute calculated statistics dynamically based on Kolom A (Bulan)
  const stats: BCDashboardStats = useMemo(() => {
    return calculateBCStats(allRecords, selectedBulan);
  }, [allRecords, selectedBulan]);

  // Filter portfolios and programs based on selectedPortfolio and searchQuery
  const filteredPortfolios = useMemo(() => {
    return stats.portfolios
      .filter((p) => {
        if (selectedPortfolio !== 'All' && p.portofolio !== selectedPortfolio) {
          return false;
        }
        return true;
      })
      .map((p) => {
        const matchingPrograms = p.programs.filter((prg) => {
          if (!searchQuery.trim()) return true;
          const q = searchQuery.toLowerCase();
          return (
            prg.namaProgram.toLowerCase().includes(q) ||
            p.portofolio.toLowerCase().includes(q)
          );
        });
        return {
          ...p,
          programs: matchingPrograms,
        };
      })
      .filter((p) => p.programs.length > 0 || !searchQuery.trim());
  }, [stats.portfolios, selectedPortfolio, searchQuery]);

  // Flattened programs list for master view
  const masterProgramList = useMemo(() => {
    const list: (ProgramDetail & { portofolio: string })[] = [];
    filteredPortfolios.forEach((p) => {
      p.programs.forEach((prog) => {
        list.push({
          ...prog,
          portofolio: p.portofolio,
        });
      });
    });
    return list;
  }, [filteredPortfolios]);

  // Compute monthly trend data for total revenue, cogs, and profit across months (Kolom A)
  const monthlyTrendData = useMemo(() => {
    const MONTH_ORDER = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const monthMap: Record<string, { bulan: string; Revenue: number; COGS: number; Profit: number }> = {};

    allRecords.forEach((r) => {
      if (selectedPortfolio !== 'All' && r.portofolio !== selectedPortfolio) return;
      const bln = r.bulan || 'Lain-lain';
      if (!monthMap[bln]) {
        monthMap[bln] = { bulan: bln, Revenue: 0, COGS: 0, Profit: 0 };
      }
      if (r.groupAkun === 'REVENUE') {
        monthMap[bln].Revenue += r.amount;
      } else if (r.groupAkun === 'COGS') {
        monthMap[bln].COGS += r.amount;
      }
    });

    Object.values(monthMap).forEach((m) => {
      m.Profit = m.Revenue - m.COGS;
    });

    return Object.values(monthMap).sort((a, b) => {
      const idxA = MONTH_ORDER.indexOf(a.bulan);
      const idxB = MONTH_ORDER.indexOf(b.bulan);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return a.bulan.localeCompare(b.bulan);
    });
  }, [allRecords, selectedPortfolio]);

  // Sorted monthly data for the monthly trend matrix table
  const sortedMonthlyTable = useMemo(() => {
    return monthlyTrendData.map((m, idx, arr) => {
      const prev = idx > 0 ? arr[idx - 1] : null;
      const revGrowth = prev && prev.Revenue > 0 ? ((m.Revenue - prev.Revenue) / prev.Revenue) * 100 : null;
      const margin = m.Revenue > 0 ? (m.Profit / m.Revenue) * 100 : 0;
      return {
        ...m,
        revGrowth,
        margin,
      };
    });
  }, [monthlyTrendData]);

  // Executive summary highlights
  const topRevPortfolio = useMemo(() => {
    if (!stats.portfolios.length) return null;
    return [...stats.portfolios].sort((a, b) => b.revenue - a.revenue)[0];
  }, [stats.portfolios]);

  const topMarginPortfolio = useMemo(() => {
    if (!stats.portfolios.length) return null;
    return [...stats.portfolios].sort((a, b) => b.marginPercent - a.marginPercent)[0];
  }, [stats.portfolios]);

  const programHealthStats = useMemo(() => {
    let profitable = 0;
    let deficit = 0;
    stats.allPrograms.forEach((p) => {
      if (p.grossProfit >= 0) profitable++;
      else deficit++;
    });
    return { profitable, deficit, total: stats.allPrograms.length };
  }, [stats.allPrograms]);

  // Format currency helpers
  const formatIDRFull = (val: number) => {
    const absVal = Math.abs(val);
    const prefix = val < 0 ? '-Rp ' : 'Rp ';

    if (absVal >= 1000000000) {
      return `${prefix}${(absVal / 1000000000).toLocaleString('id-ID', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} Miliar`;
    }
    if (absVal >= 1000000) {
      return `${prefix}${(absVal / 1000000).toLocaleString('id-ID', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })} Juta`;
    }
    return `${prefix}${absVal.toLocaleString('id-ID')}`;
  };

  const formatIDRCompact = (val: number) => {
    const absVal = Math.abs(val);
    const prefix = val < 0 ? '-' : '';

    if (absVal >= 1000000000) {
      return `${prefix}Rp ${(absVal / 1000000000).toFixed(1)}M`;
    }
    if (absVal >= 1000000) {
      return `${prefix}Rp ${(absVal / 1000000).toFixed(1)}Jt`;
    }
    return `${prefix}Rp ${absVal.toLocaleString('id-ID')}`;
  };

  const toggleAccordion = (portName: string) => {
    setExpandedPortfolios((prev) => ({
      ...prev,
      [portName]: !prev[portName],
    }));
  };

  const handleExportCSV = () => {
    let csv = 'Portofolio,Nama Program,Group Akun REVENUE,Group Akun COGS,Laba Kotor,Gross Margin (%)\n';
    masterProgramList.forEach((r) => {
      csv += `"${r.portofolio}","${r.namaProgram}",${r.revenue},${r.cogs},${r.grossProfit},${r.marginPercent.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Performansi_Bisnis_BC_${selectedBulan}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Color palette for charts
  const PORTFOLIO_COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#64748B'];

  return (
    <div className="space-y-6 font-sans text-slate-800" id="business-dashboard-bc">
      
      {/* FILTER MENU CONTROL BAR (REFERENSI KOLOM A - BULAN & PORTOFOLIO) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm" id="filter-bar">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 flex-wrap flex-1">
            {/* Periode Evaluasi Bulan Dropdown Selector */}
            <div className="w-full sm:w-60">
              <label htmlFor="select-periode-evaluasi-bulan" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-red-500" />
                <span>Periode Evaluasi Bulan</span>
              </label>
              <div className="relative">
                <select
                  id="select-periode-evaluasi-bulan"
                  value={selectedBulan}
                  onChange={(e) => setSelectedBulan(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3.5 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 cursor-pointer pr-9 shadow-sm hover:bg-slate-100/80 transition-colors"
                >
                  <option value="Semua Bulan">Semua Bulan</option>
                  {stats.availableMonths.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Portofolio Selector */}
            <div className="w-full sm:w-56">
              <label htmlFor="select-portofolio" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5 mb-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                <span>Portofolio</span>
              </label>
              <div className="relative">
                <select
                  id="select-portofolio"
                  value={selectedPortfolio}
                  onChange={(e) => setSelectedPortfolio(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3.5 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 cursor-pointer pr-9 shadow-sm hover:bg-slate-100/80 transition-colors"
                >
                  <option value="All">Semua Portofolio</option>
                  {stats.portfolios.map((p) => (
                    <option key={p.portofolio} value={p.portofolio}>
                      {p.portofolio}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Quick Reset Filter Indicator */}
            {(selectedBulan !== 'Semua Bulan' || selectedPortfolio !== 'All' || searchQuery) && (
              <div className="self-end pb-0.5">
                <button
                  id="btn-reset-bc-filters"
                  onClick={() => {
                    setSelectedBulan('Semua Bulan');
                    setSelectedPortfolio('All');
                    setSearchQuery('');
                  }}
                  className="px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all flex items-center space-x-1 cursor-pointer"
                  title="Reset semua filter ke kondisi awal"
                >
                  <span>Reset Filter</span>
                </button>
              </div>
            )}

            <div className="self-end pb-0.5">
              <button
                onClick={loadData}
                disabled={isLoading}
                className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                title="Segarkan data dari Google Sheet"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-red-500' : 'text-slate-500'}`} />
                <span>{isLoading ? 'Memuat...' : 'Segarkan Data'}</span>
              </button>
            </div>
          </div>

          {/* Program Name Search */}
          <div className="w-full sm:w-64">
            <label htmlFor="search-bc-program" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Cari Nama Program
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                id="search-bc-program"
                type="text"
                placeholder="Cari OSP, Provisioning, IOAN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                  title="Hapus kata kunci"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. SUB-HALAMAN 1: RINGKASAN & KPI FINANSIAL */}
      {activeSubTab === 'kpi' && (
        <div className="space-y-6" id="subpage-kpi">
          {/* EXECUTIVE SUMMARY KPI CARDS (LOGIKA BERHITUNG UTAMA) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5" id="business-kpi-summary">
        
        {/* TOTAL REVENUE */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Revenue
              </span>
              <div className="p-2 bg-red-50 text-red-600 rounded-2xl group-hover:scale-110 transition-transform">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight font-sans">
                {formatIDRCompact(stats.totalRevenue)}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Group Akun: <strong className="text-red-600">REVENUE</strong>
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400">Periode</span>
            <span className="text-slate-800 font-bold">{selectedBulan}</span>
          </div>
        </div>

        {/* TOTAL COGS */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total COGS (Beban)
              </span>
              <div className="p-2 bg-slate-100 text-slate-600 rounded-2xl group-hover:scale-110 transition-transform">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight font-sans">
                {formatIDRCompact(stats.totalCogs)}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Group Akun: <strong className="text-slate-700">COGS</strong>
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400">Cost Ratio</span>
            <span className="text-slate-800 font-bold font-mono">
              {stats.totalRevenue > 0
                ? `${((stats.totalCogs / stats.totalRevenue) * 100).toFixed(1)}%`
                : '0%'}
            </span>
          </div>
        </div>

        {/* GROSS PROFIT (LABA KOTOR) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Laba Kotor (Profit)
              </span>
              <div
                className={`p-2 rounded-2xl group-hover:scale-110 transition-transform ${
                  stats.totalGrossProfit >= 0
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3
                className={`text-2xl font-black tracking-tight font-sans ${
                  stats.totalGrossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {formatIDRCompact(stats.totalGrossProfit)}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Formula: <strong className="text-slate-700">Revenue - COGS</strong>
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400">Status</span>
            <span
              className={`font-bold flex items-center space-x-1 ${
                stats.totalGrossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {stats.totalGrossProfit >= 0 ? (
                <>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>PROFITABLE</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>DEFISIT</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* GROSS MARGIN (%) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Gross Margin
              </span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                <Percent className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3
                className={`text-2xl font-black tracking-tight font-sans ${
                  stats.totalMarginPercent >= 0 ? 'text-indigo-600' : 'text-red-600'
                }`}
              >
                {stats.totalMarginPercent.toFixed(1)}%
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Rasio Margin terhadap Revenue
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  stats.totalMarginPercent >= 20
                    ? 'bg-indigo-600'
                    : stats.totalMarginPercent >= 0
                    ? 'bg-emerald-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(Math.max(stats.totalMarginPercent, 0), 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* BENTO HIGHLIGHT: TOTAL PORTOFOLIO & PROGRAM */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Portofolio &amp; Program
              </span>
              <div className="p-2 bg-slate-800 text-red-400 rounded-2xl">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white tracking-tight font-sans">
                {stats.portfolios.length} Portofolio
              </h3>
              <p className="text-[11px] text-slate-300 font-medium">
                Total {stats.allPrograms.length} Nama Program Aktif
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Filter Aktif</span>
            <span className="text-red-400 font-mono">{selectedBulan}</span>
          </div>
        </div>

      </div>

      {/* TABEL KOMPARASI KINERJA PORTOFOLIO FINANSIAL */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden" id="kpi-portfolio-comparison">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-red-600" />
              <span>Komparasi Kinerja Finansial Seluruh Portofolio</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ringkasan komprehensif performansi Revenue, COGS, dan Margin Keuntungan per Portofolio ({selectedBulan}).
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <AIEvaluationButton
              onClick={() =>
                openAiEvaluation(
                  'Ringkasan Komparasi Seluruh Portofolio',
                  {
                    'Total Revenue': formatIDRFull(stats.totalRevenue),
                    'Total COGS': formatIDRFull(stats.totalCogs),
                    'Laba Kotor': formatIDRFull(stats.totalGrossProfit),
                    'Gross Margin': `${stats.totalMarginPercent.toFixed(1)}%`,
                    'Jumlah Portofolio': stats.portfolios.length,
                  },
                  stats.portfolios.map((p) => ({
                    Portofolio: p.portofolio,
                    Programs: p.programs.length,
                    Revenue: formatIDRFull(p.revenue),
                    COGS: formatIDRFull(p.cogs),
                    Profit: formatIDRFull(p.grossProfit),
                    Margin: `${p.marginPercent.toFixed(1)}%`,
                    EfficiencyRatio: `${p.cogsRatioPercent.toFixed(1)}%`,
                  })),
                  { Bulan: selectedBulan },
                  'Berikan evaluasi strategis ringkasan kinerja seluruh portofolio bisnis Telkom Akses. Sorot portofolio dengan profit terbesar dan yang memerlukan efisiensi biaya.'
                )
              }
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-5">Portofolio</th>
                <th className="py-3.5 px-4 text-center">Program</th>
                <th className="py-3.5 px-5 text-right">Revenue (REVENUE)</th>
                <th className="py-3.5 px-5 text-right">COGS (COGS)</th>
                <th className="py-3.5 px-5 text-right">Laba Kotor</th>
                <th className="py-3.5 px-4 text-center">Gross Margin</th>
                <th className="py-3.5 px-4 text-center">Rasio Beban (COGS %)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {stats.portfolios.map((p, idx) => {
                const isProfitable = p.grossProfit >= 0;
                const portColor = PORTFOLIO_COLORS[idx % PORTFOLIO_COLORS.length];
                return (
                  <tr key={p.portofolio} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-5 font-black text-slate-900">
                      <div className="flex items-center space-x-2.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: portColor }} />
                        <span className="font-bold text-slate-900">{p.portofolio}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-mono text-[11px] font-bold">
                        {p.programs.length}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right font-mono font-bold text-slate-900">
                      {formatIDRFull(p.revenue)}
                    </td>
                    <td className="py-4 px-5 text-right font-mono text-slate-600">
                      {formatIDRFull(p.cogs)}
                    </td>
                    <td className={`py-4 px-5 text-right font-mono font-black ${isProfitable ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatIDRFull(p.grossProfit)}
                    </td>
                    <td className="py-4 px-4 text-center font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded-md ${
                        p.marginPercent >= 20 ? 'bg-emerald-50 text-emerald-700' : p.marginPercent >= 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {p.marginPercent.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-mono font-bold text-slate-600">
                      {p.cogsRatioPercent.toFixed(1)}%
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase ${
                        isProfitable ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                      }`}>
                        {isProfitable ? 'PROFIT' : 'DEFISIT'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedPortfolio(p.portofolio);
                          setActiveSubTab?.('portfolio');
                        }}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                        title={`Buka detail program untuk ${p.portofolio}`}
                      >
                        <span>Detail</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* STRATEGIC PERFORMANCE HIGHLIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-red-50 to-white p-5 rounded-3xl border border-red-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Top Kontributor Revenue</span>
              <Briefcase className="w-4 h-4 text-red-500" />
            </div>
            <h4 className="text-lg font-black text-slate-900">{topRevPortfolio?.portofolio || '-'}</h4>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              Revenue: <strong className="text-slate-900">{topRevPortfolio ? formatIDRFull(topRevPortfolio.revenue) : 'Rp 0'}</strong>
            </p>
          </div>
          <div className="mt-4 pt-2 border-t border-red-100/60 text-xs font-semibold text-slate-600 flex justify-between">
            <span>Kontribusi Pangsa</span>
            <span className="font-bold text-red-600 font-mono">
              {topRevPortfolio && stats.totalRevenue > 0
                ? `${((topRevPortfolio.revenue / stats.totalRevenue) * 100).toFixed(1)}%`
                : '0%'}
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-white p-5 rounded-3xl border border-emerald-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Margin Tertinggi</span>
              <Percent className="w-4 h-4 text-emerald-500" />
            </div>
            <h4 className="text-lg font-black text-slate-900">{topMarginPortfolio?.portofolio || '-'}</h4>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              Gross Margin: <strong className="text-emerald-600">{topMarginPortfolio ? `${topMarginPortfolio.marginPercent.toFixed(1)}%` : '0%'}</strong>
            </p>
          </div>
          <div className="mt-4 pt-2 border-t border-emerald-100/60 text-xs font-semibold text-slate-600 flex justify-between">
            <span>Laba Kotor</span>
            <span className="font-bold text-emerald-600 font-mono">
              {topMarginPortfolio ? formatIDRCompact(topMarginPortfolio.grossProfit) : 'Rp 0'}
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Kesehatan Program</span>
              <ShieldCheck className="w-4 h-4 text-red-400" />
            </div>
            <h4 className="text-lg font-black text-white">
              {programHealthStats.profitable} / {programHealthStats.total} Program Sehat
            </h4>
            <p className="text-xs text-slate-300 mt-1">
              {programHealthStats.deficit > 0 ? `${programHealthStats.deficit} program defisit perlu evaluasi margin.` : 'Seluruh program beroperasi secara positif.'}
            </p>
          </div>
          <div className="mt-4 pt-2 border-t border-slate-700 text-xs font-semibold text-slate-300 flex justify-between">
            <span>Tingkat Kelayakan</span>
            <span className="font-bold text-emerald-400 font-mono">
              {programHealthStats.total > 0
                ? `${((programHealthStats.profitable / programHealthStats.total) * 100).toFixed(0)}% Profit`
                : '0%'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* 4. SUB-HALAMAN 2: TREND FINANSIAL PERBULAN */}
  {activeSubTab === 'trend' && (
    <div className="space-y-6" id="subpage-trend">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="business-trend-charts">
        
        {/* CHART 1: TREND REVENUE & FINANSIAL PERBULAN */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-red-600" />
                  <span>Trend Performansi Finansial Perbulan</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visualisasi perkembangan Revenue, COGS, dan Laba Kotor dalam Miliar Rupiah per periode.
                </p>
              </div>

              {/* Metric Toggle Selector */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl shrink-0 self-start sm:self-auto">
                <button
                  onClick={() => setTrendMetric('all')}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    trendMetric === 'all'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Semua Metrik
                </button>
                <button
                  onClick={() => setTrendMetric('revenue')}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    trendMetric === 'revenue'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setTrendMetric('profit')}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    trendMetric === 'profit'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Laba Kotor
                </button>
              </div>
            </div>

            {/* Quick KPI Indicators above chart */}
            <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Peak Month</span>
                <span className="text-xs font-black text-slate-800">
                  {monthlyTrendData.length > 0
                    ? [...monthlyTrendData].sort((a, b) => b.Revenue - a.Revenue)[0]?.bulan
                    : '-'}
                </span>
              </div>
              <div className="text-left border-x border-slate-200/60 px-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Revenue/Bln</span>
                <span className="text-xs font-black text-slate-800 font-mono">
                  {monthlyTrendData.length > 0
                    ? formatIDRCompact(
                        monthlyTrendData.reduce((acc, curr) => acc + curr.Revenue, 0) / monthlyTrendData.length
                      )
                    : 'Rp 0'}
                </span>
              </div>
              <div className="text-left pl-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Margin %</span>
                <span className="text-xs font-black text-emerald-600 font-mono">
                  {stats.totalMarginPercent.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={monthlyTrendData.map((m) => ({
                    name: m.bulan,
                    'Revenue Total': m.Revenue / 1000000000,
                    'COGS': m.COGS / 1000000000,
                    'Laba Kotor': m.Profit / 1000000000,
                    rawRevenue: m.Revenue,
                    rawCogs: m.COGS,
                    rawProfit: m.Profit,
                  }))}
                  margin={{ top: 15, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenueGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorProfitGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="barCogsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#64748B" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#334155" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#F1F5F9" />

                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#475569', fontSize: 11, fontWeight: '700' }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    unit=" M"
                    tick={{ fill: '#64748B', fontSize: 11, fontWeight: '600' }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const rev = data.rawRevenue || 0;
                        const cogs = data.rawCogs || 0;
                        const profit = data.rawProfit || 0;
                        const margin = rev > 0 ? (profit / rev) * 100 : 0;

                        return (
                          <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-2 min-w-52">
                            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                              <span className="font-black text-white">{label}</span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                  margin >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                }`}
                              >
                                {margin >= 0 ? `+${margin.toFixed(1)}% Margin` : `${margin.toFixed(1)}% Defisit`}
                              </span>
                            </div>

                            <div className="space-y-1 font-mono">
                              <div className="flex items-center justify-between space-x-4 text-red-400">
                                <span className="flex items-center space-x-1.5 font-sans font-bold text-slate-300">
                                  <span className="w-2 h-2 rounded-full bg-red-500" />
                                  <span>Revenue:</span>
                                </span>
                                <span className="font-black">{formatIDRCompact(rev)}</span>
                              </div>

                              <div className="flex items-center justify-between space-x-4 text-slate-300">
                                <span className="flex items-center space-x-1.5 font-sans font-bold text-slate-300">
                                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                                  <span>COGS:</span>
                                </span>
                                <span className="font-black">{formatIDRCompact(cogs)}</span>
                              </div>

                              <div className="flex items-center justify-between space-x-4 text-emerald-400 pt-1 border-t border-slate-800">
                                <span className="flex items-center space-x-1.5 font-sans font-bold text-slate-300">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                  <span>Laba Kotor:</span>
                                </span>
                                <span className="font-black">{formatIDRCompact(profit)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '12px', fontWeight: '600' }}
                  />

                  {(trendMetric === 'all' || trendMetric === 'revenue') && (
                    <Area
                      type="monotone"
                      dataKey="Revenue Total"
                      stroke="#EF4444"
                      strokeWidth={3.5}
                      fillOpacity={1}
                      fill="url(#colorRevenueGlow)"
                      name="Revenue Total"
                      dot={{ r: 4, fill: '#EF4444', strokeWidth: 2, stroke: '#FFFFFF' }}
                      activeDot={{ r: 7, fill: '#EF4444', strokeWidth: 3, stroke: '#FFFFFF' }}
                    />
                  )}

                  {trendMetric === 'all' && (
                    <Bar
                      dataKey="COGS"
                      fill="url(#barCogsGradient)"
                      radius={[6, 6, 0, 0]}
                      barSize={24}
                      name="Group Akun COGS"
                    />
                  )}

                  {(trendMetric === 'all' || trendMetric === 'profit') && (
                    <Area
                      type="monotone"
                      dataKey="Laba Kotor"
                      stroke="#10B981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorProfitGlow)"
                      name="Laba Kotor"
                      dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#FFFFFF' }}
                      activeDot={{ r: 7, fill: '#10B981', strokeWidth: 3, stroke: '#FFFFFF' }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* CHART 2: DONUT CHART PROPORSI PORTOFOLIO */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <PieIcon className="w-5 h-5 text-indigo-600" />
                <span>Pangsa Portofolio</span>
              </h3>
              
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-[10px] font-bold">
                <button
                  onClick={() => setPieMetric('revenue')}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    pieMetric === 'revenue' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setPieMetric('profit')}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    pieMetric === 'profit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Profit
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-2">
              Distribusi kontribusi {pieMetric === 'revenue' ? 'Revenue' : 'Laba Kotor'} per Portofolio.
            </p>

            <div className="h-56 w-full flex justify-center items-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.portfolios}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={84}
                    paddingAngle={3}
                    dataKey={pieMetric === 'revenue' ? 'revenue' : 'grossProfit'}
                  >
                    {stats.portfolios.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PORTFOLIO_COLORS[index % PORTFOLIO_COLORS.length]}
                        stroke="#FFF"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as PortfolioSummary;
                        const val = pieMetric === 'revenue' ? data.revenue : data.grossProfit;
                        const total = pieMetric === 'revenue' ? stats.totalRevenue : stats.totalGrossProfit;
                        const pct = total !== 0 ? (val / total) * 100 : 0;

                        return (
                          <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs font-sans space-y-1">
                            <div className="font-extrabold text-slate-200">{data.portofolio}</div>
                            <div className="font-mono text-emerald-400 font-bold">{formatIDRFull(val)}</div>
                            <div className="text-[10px] text-slate-400 font-semibold">
                              Share: {pct.toFixed(1)}% | Margin: {data.marginPercent.toFixed(1)}%
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute flex flex-col justify-center items-center text-center pointer-events-none">
                <span className="text-base font-black text-slate-900 font-mono tracking-tight">
                  {formatIDRCompact(pieMetric === 'revenue' ? stats.totalRevenue : stats.totalGrossProfit)}
                </span>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold">
                  {pieMetric === 'revenue' ? 'Total Revenue' : 'Total Profit'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 text-[11px] font-semibold text-slate-700">
            {stats.portfolios.map((item, index) => {
              const val = pieMetric === 'revenue' ? item.revenue : item.grossProfit;
              const total = pieMetric === 'revenue' ? stats.totalRevenue : stats.totalGrossProfit;
              const pct = total !== 0 ? (val / total) * 100 : 0;

              return (
                <div
                  key={item.portofolio}
                  className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100/80 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: PORTFOLIO_COLORS[index % PORTFOLIO_COLORS.length] }}
                    />
                    <span className="truncate text-slate-800 font-bold">{item.portofolio}</span>
                  </div>
                  <span className="font-mono text-slate-900 font-black shrink-0 text-[10px]">
                    {pct.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* TABEL MATRIKS PERFORMANSI FINANSIAL BULANAN */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden" id="monthly-trend-matrix-table">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-red-600" />
              <span>Matriks Realisasi Finansial Bulanan (Januari s.d. Desember)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tabel komparasi pertumbuhan Revenue, realisasi Beban COGS, dan Laba Kotor per bulan.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <AIEvaluationButton
              onClick={() =>
                openAiEvaluation(
                  'Tabel Matriks Finansial Bulanan',
                  {
                    'Jumlah Bulan Tercatat': sortedMonthlyTable.length,
                    'Total Revenue Tahunan': formatIDRFull(sortedMonthlyTable.reduce((acc, c) => acc + c.Revenue, 0)),
                    'Total COGS Tahunan': formatIDRFull(sortedMonthlyTable.reduce((acc, c) => acc + c.COGS, 0)),
                    'Total Profit Tahunan': formatIDRFull(sortedMonthlyTable.reduce((acc, c) => acc + c.Profit, 0)),
                  },
                  sortedMonthlyTable.map((m) => ({
                    Bulan: m.bulan,
                    Revenue: formatIDRFull(m.Revenue),
                    COGS: formatIDRFull(m.COGS),
                    Profit: formatIDRFull(m.Profit),
                    Margin: `${m.margin.toFixed(1)}%`,
                    GrowthMoM: m.revGrowth !== null ? `${m.revGrowth.toFixed(1)}%` : '-',
                  })),
                  { Portofolio: selectedPortfolio },
                  'Analisis pergerakan trend pendapatan dan biaya bulanan Telkom Akses. Identifikasi bulan dengan lonjakan revenue atau pembengkakan biaya.'
                )
              }
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Bulan</th>
                <th className="py-3.5 px-6 text-right">Revenue Total (REVENUE)</th>
                <th className="py-3.5 px-6 text-right">Beban COGS (COGS)</th>
                <th className="py-3.5 px-6 text-right">Laba Kotor (Profit)</th>
                <th className="py-3.5 px-4 text-center">Gross Margin (%)</th>
                <th className="py-3.5 px-4 text-center">Pertumbuhan MoM</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {sortedMonthlyTable.map((row) => {
                const isProfitable = row.Profit >= 0;
                return (
                  <tr key={row.bulan} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900 flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span>{row.bulan}</span>
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-bold text-slate-900">
                      {formatIDRFull(row.Revenue)}
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-slate-600">
                      {formatIDRFull(row.COGS)}
                    </td>
                    <td className={`py-4 px-6 text-right font-mono font-black ${isProfitable ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatIDRFull(row.Profit)}
                    </td>
                    <td className="py-4 px-4 text-center font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded-md ${
                        row.margin >= 20 ? 'bg-emerald-50 text-emerald-700' : row.margin >= 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {row.margin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-mono font-bold">
                      {row.revGrowth !== null ? (
                        <span className={`inline-flex items-center space-x-0.5 ${row.revGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {row.revGrowth >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          <span>{Math.abs(row.revGrowth).toFixed(1)}%</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase ${
                        isProfitable ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                      }`}>
                        {isProfitable ? 'PROFIT' : 'DEFISIT'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

  {/* 5. SUB-HALAMAN 3: DETAIL PORTOFOLIO & PROGRAM */}
  {activeSubTab === 'portfolio' && (
    <div className="space-y-6" id="subpage-portfolio">
      {/* ACCORDION DETAILED CARDS PER PORTOFOLIO (DENGAN RINCIAN NAMA PROGRAM) */}
      <div className="space-y-5" id="portfolio-details">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <Briefcase className="w-5 h-5 text-red-600" />
              <span>Detail Finansial per Portofolio &amp; Nama Program</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rincian mendalam setiap Portofolio beserta seluruh Nama Program, Revenue, COGS, Laba Kotor, dan Margin %.
            </p>
          </div>
          
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>
        </div>

        {filteredPortfolios.map((p, pIdx) => {
          const isExpanded = expandedPortfolios[p.portofolio] ?? true;
          const portColor = PORTFOLIO_COLORS[pIdx % PORTFOLIO_COLORS.length];

          return (
            <div
              key={p.portofolio}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden transition-all"
            >
              {/* Portfolio Accordion Header */}
              <div
                onClick={() => toggleAccordion(p.portofolio)}
                className="p-5 bg-slate-50/70 hover:bg-slate-100/60 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div
                    className="w-3.5 h-10 rounded-full shrink-0"
                    style={{ backgroundColor: portColor }}
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-base font-black text-slate-900">{p.portofolio}</h4>
                      <span className="px-2 py-0.5 bg-white text-slate-600 border border-slate-200 rounded-md text-[10px] font-bold">
                        {p.programs.length} Program
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Revenue: <strong className="text-slate-800 font-mono">{formatIDRFull(p.revenue)}</strong> | COGS:{' '}
                      <strong className="text-slate-800 font-mono">{formatIDRFull(p.cogs)}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 shrink-0 justify-between sm:justify-end">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Laba Kotor (Margin %)
                    </span>
                    <div
                      className={`text-sm font-black font-mono ${
                        p.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {formatIDRCompact(p.grossProfit)}{' '}
                      <span className="text-xs font-semibold">({p.marginPercent.toFixed(1)}%)</span>
                    </div>
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-slate-200 text-slate-500">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Accordion Content: Table of Nama Program */}
              {isExpanded && (
                <div className="p-5 space-y-4">
                  {/* COGS vs Revenue Efficiency Progress Bar */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-xs font-semibold text-slate-600">
                      Efisiensi COGS terhadap Revenue ({p.portofolio}):{' '}
                      <strong className="text-slate-900 font-mono">{p.cogsRatioPercent.toFixed(1)}%</strong>
                    </div>
                    <div className="w-full sm:w-64 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          p.cogsRatioPercent <= 80 ? 'bg-emerald-500' : p.cogsRatioPercent <= 100 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(p.cogsRatioPercent, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Table of Program Details */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/80 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <Briefcase className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-xs font-bold text-slate-700">Rincian Indikator Program {p.portofolio}</span>
                      <span className="text-[10px] font-semibold text-slate-400">({p.programs.length} Program)</span>
                    </div>
                    <AIEvaluationButton
                      size="sm"
                      onClick={() =>
                        openAiEvaluation(
                          `Tabel Indikator Portofolio ${p.portofolio}`,
                          {
                            'Total Revenue': `Rp ${p.revenue.toLocaleString('id-ID')} Jt`,
                            'Total COGS': `Rp ${p.cogs.toLocaleString('id-ID')} Jt`,
                            'Gross Profit': `Rp ${p.grossProfit.toLocaleString('id-ID')} Jt`,
                            'Gross Margin': `${p.marginPercent.toFixed(1)}%`,
                            'COGS Ratio': `${p.cogsRatioPercent.toFixed(1)}%`,
                            'Jumlah Program': p.programs.length,
                          },
                          p.programs.map((prg) => ({
                            'Nama Program': prg.namaProgram,
                            Revenue: prg.revenue,
                            COGS: prg.cogs,
                            Profit: prg.grossProfit,
                            Margin: `${prg.marginPercent.toFixed(1)}%`,
                          })),
                          { Portofolio: p.portofolio },
                          `Evaluasi efisiensi biaya (COGS) dan margin keuntungan portofolio ${p.portofolio}. Sorot program dengan kerugian atau margin tipis.`
                        )
                      }
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                          <th className="py-3 px-4">Nama Program</th>
                          <th className="py-3 px-4 text-right">Revenue (Group Akun REVENUE)</th>
                          <th className="py-3 px-4 text-right">COGS (Group Akun COGS)</th>
                          <th className="py-3 px-4 text-right">Laba Kotor (Profit)</th>
                          <th className="py-3 px-4 text-center">Gross Margin (%)</th>
                          <th className="py-3 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                        {p.programs.map((prog, idx) => {
                          const isProfitable = prog.grossProfit >= 0;
                          return (
                            <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3.5 px-4 font-bold text-slate-900">
                                <div className="flex items-center space-x-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                  <span>{prog.namaProgram}</span>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                                {formatIDRFull(prog.revenue)}
                              </td>

                              <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                                {formatIDRFull(prog.cogs)}
                              </td>

                              <td
                                className={`py-3.5 px-4 text-right font-mono font-black ${
                                  isProfitable ? 'text-emerald-600' : 'text-red-600'
                                }`}
                              >
                                {formatIDRFull(prog.grossProfit)}
                              </td>

                              <td className="py-3.5 px-4 text-center font-mono font-bold">
                                <span
                                  className={`px-2 py-0.5 rounded-md ${
                                    prog.marginPercent >= 20
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : prog.marginPercent >= 0
                                      ? 'bg-indigo-50 text-indigo-700'
                                      : 'bg-red-50 text-red-700'
                                  }`}
                                >
                                  {prog.marginPercent.toFixed(1)}%
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-center">
                                <span
                                  className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase ${
                                    prog.marginPercent >= 20
                                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                      : prog.marginPercent >= 0
                                      ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                      : 'bg-red-50 text-red-600 border border-red-100'
                                  }`}
                                >
                                  {prog.marginPercent >= 20
                                    ? 'High Margin'
                                    : prog.marginPercent >= 0
                                    ? 'Profit'
                                    : 'Defisit'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}

                        {p.programs.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                              Tidak ada Nama Program yang cocok dengan pencarian "{searchQuery}".
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredPortfolios.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 text-slate-400 space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-600">Tidak ada data ditemukan</p>
            <p className="text-xs">Silakan sesuaikan filter bulan, portofolio, atau kata kunci pencarian Anda.</p>
          </div>
        )}
      </div>

      {/* 6. MASTER PROGRAM REVENUE & COGS DATA TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden" id="master-table">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Master Tabel Rincian Program Finansial
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tampilan komprehensif seluruh data performansi Nama Program dan realisasi anggaran.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl font-mono">
              Total {masterProgramList.length} Program
            </span>
            <AIEvaluationButton
              onClick={() =>
                openAiEvaluation(
                  'Master Tabel Rincian Program Finansial',
                  {
                    'Total Program': masterProgramList.length,
                    'Total Revenue': `Rp ${stats.totalRevenue.toLocaleString('id-ID')} Jt`,
                    'Total COGS': `Rp ${stats.totalCogs.toLocaleString('id-ID')} Jt`,
                    'Total Profit': `Rp ${stats.totalGrossProfit.toLocaleString('id-ID')} Jt`,
                    'Gross Margin': `${stats.totalMarginPercent.toFixed(1)}%`,
                  },
                  masterProgramList.slice(0, 30).map((row) => ({
                    Portofolio: row.portofolio,
                    'Nama Program': row.namaProgram,
                    Revenue: row.revenue,
                    COGS: row.cogs,
                    Profit: row.grossProfit,
                    Margin: `${row.marginPercent.toFixed(1)}%`,
                  })),
                  {},
                  'Evaluasi menyeluruh performansi seluruh program finansial di sheet BC. Analisis portofolio yang memiliki performa margin terbaik serta identifikasi program dengan potensi kerugian.'
                )
              }
            />
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-red-600/20 cursor-pointer flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download XLS</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Portofolio</th>
                <th className="px-6 py-4">Nama Program</th>
                <th className="px-6 py-4 text-right">Revenue (REVENUE)</th>
                <th className="px-6 py-4 text-right">COGS (COGS)</th>
                <th className="px-6 py-4 text-right">Laba Kotor (Profit)</th>
                <th className="px-6 py-4 text-center">Gross Margin (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {masterProgramList.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 font-extrabold text-slate-900">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-[11px]">
                      {row.portofolio}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">{row.namaProgram}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                    {formatIDRFull(row.revenue)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-slate-600">
                    {formatIDRFull(row.cogs)}
                  </td>
                  <td
                    className={`px-6 py-4 text-right font-mono font-black ${
                      row.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {formatIDRFull(row.grossProfit)}
                  </td>
                  <td className="px-6 py-4 text-center font-mono font-bold">
                    <span
                      className={`px-2 py-0.5 rounded-md ${
                        row.marginPercent >= 20
                          ? 'bg-emerald-50 text-emerald-700'
                          : row.marginPercent >= 0
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {row.marginPercent.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

      {/* AI Performance Evaluation Modal */}
      <AIEvaluationModal
        isOpen={aiModalState.isOpen}
        onClose={() => setAiModalState((prev) => ({ ...prev, isOpen: false }))}
        tableName={aiModalState.tableName}
        dashboardContext={aiModalState.dashboardContext}
        filterContext={aiModalState.filterContext}
        summaryMetrics={aiModalState.summaryMetrics}
        sampleRows={aiModalState.sampleRows}
        promptNote={aiModalState.promptNote}
      />
    </div>
  );
}
