import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Coins,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Calendar,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Info,
  Layers,
  Sparkles,
  ChevronRight,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  CartesianGrid,
  Cell,
} from 'recharts';
import { MonthKpiDataset, KpiSectorRow } from '../types/kpiImbalJasa';
import { KPI_DATASETS, MONTH_OPTIONS, SPREADSHEET_CONFIG } from '../data/kpiSpreadsheetDatabase';
import { KpiMonth } from '../lib/kpiSpreadsheetService';

// Base formula constant requested by user: "ach performansi X Rp,102.080.749"
export const SECTOR_REVENUE_BASE = 102080749;

interface ServiceAreaRevenueDetailProps {
  serviceArea: string;
  currentDataset: MonthKpiDataset;
  selectedBulan: KpiMonth;
  allServiceAreas: string[];
  onSelectServiceArea: (area: string) => void;
  onBack: () => void;
  onSelectBulan?: (bulan: KpiMonth) => void;
}

const MONTH_ORDER: KpiMonth[] = ['MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER'];

export function getPreviousMonth(month: KpiMonth): KpiMonth | null {
  const idx = MONTH_ORDER.indexOf(month);
  if (idx > 0) {
    return MONTH_ORDER[idx - 1];
  }
  return null;
}

export function formatCurrencyIDR(nominal: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Math.round(nominal));
}

export default function ServiceAreaRevenueDetail({
  serviceArea,
  currentDataset,
  selectedBulan,
  allServiceAreas,
  onSelectServiceArea,
  onBack,
  onSelectBulan,
}: ServiceAreaRevenueDetailProps) {
  // Determine previous month dataset for MoM comparison
  const prevMonthKey = useMemo(() => getPreviousMonth(selectedBulan), [selectedBulan]);
  const prevDataset = useMemo(() => (prevMonthKey ? KPI_DATASETS[prevMonthKey] : null), [prevMonthKey]);

  // Sector rows for the selected Service Area in current month
  const currentSectors = useMemo(() => {
    return currentDataset.sectorRows
      .filter((s) => s.serviceArea === serviceArea)
      .sort((a, b) => b.perf - a.perf);
  }, [currentDataset, serviceArea]);

  // Sector rows in previous month
  const prevSectorsMap = useMemo(() => {
    const map = new Map<string, KpiSectorRow>();
    if (prevDataset) {
      prevDataset.sectorRows
        .filter((s) => s.serviceArea === serviceArea)
        .forEach((s) => map.set(s.sektor, s));
    }
    return map;
  }, [prevDataset, serviceArea]);

  // Enriched Sector Data with Revenue Calculation & Trend Comparison
  const sectorRevenueList = useMemo(() => {
    return currentSectors.map((s, idx) => {
      // Current month calculations
      const perfCurrent = s.perf;
      const revCurrent = (perfCurrent / 100) * SECTOR_REVENUE_BASE;

      // Previous month calculations
      const prevSector = prevSectorsMap.get(s.sektor);
      const perfPrev = prevSector ? prevSector.perf : null;
      const revPrev = perfPrev !== null ? (perfPrev / 100) * SECTOR_REVENUE_BASE : null;

      // Deltas
      const perfDelta = perfPrev !== null ? Number((perfCurrent - perfPrev).toFixed(2)) : 0;
      const revDelta = revPrev !== null ? Math.round(revCurrent - revPrev) : 0;
      const revDeltaPct = revPrev && revPrev > 0 ? Number(((revDelta / revPrev) * 100).toFixed(2)) : 0;

      // Trend direction
      let trendDirection: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
      if (revDelta > 500) {
        trendDirection = 'UP';
      } else if (revDelta < -500) {
        trendDirection = 'DOWN';
      }

      // Gap to ceiling (100% plafon = Rp 102.080.749)
      const gapToPlafon = Math.max(0, Math.round(SECTOR_REVENUE_BASE - revCurrent));
      const isTargetAchieved = perfCurrent >= 95.0;

      return {
        ...s,
        index: idx + 1,
        perfCurrent,
        revCurrent,
        perfPrev,
        revPrev,
        perfDelta,
        revDelta,
        revDeltaPct,
        trendDirection,
        gapToPlafon,
        isTargetAchieved,
      };
    });
  }, [currentSectors, prevSectorsMap]);

  // Aggregate Stats for the Service Area
  const aggregateStats = useMemo(() => {
    const totalSectors = sectorRevenueList.length;
    const totalRevCurrent = sectorRevenueList.reduce((acc, s) => acc + s.revCurrent, 0);
    const totalRevPrev = sectorRevenueList.reduce((acc, s) => acc + (s.revPrev ?? s.revCurrent), 0);
    const totalPlafon = totalSectors * SECTOR_REVENUE_BASE;

    const avgPerfCurrent =
      totalSectors > 0
        ? Number((sectorRevenueList.reduce((acc, s) => acc + s.perfCurrent, 0) / totalSectors).toFixed(2))
        : 0;

    const avgPerfPrev =
      totalSectors > 0 && prevDataset
        ? Number(
            (
              sectorRevenueList.reduce((acc, s) => acc + (s.perfPrev ?? s.perfCurrent), 0) / totalSectors
            ).toFixed(2)
          )
        : null;

    const totalRevDelta = Math.round(totalRevCurrent - totalRevPrev);
    const totalRevDeltaPct =
      totalRevPrev > 0 ? Number(((totalRevDelta / totalRevPrev) * 100).toFixed(2)) : 0;

    const avgPerfDelta = avgPerfPrev !== null ? Number((avgPerfCurrent - avgPerfPrev).toFixed(2)) : 0;

    const totalGapToPlafon = Math.max(0, Math.round(totalPlafon - totalRevCurrent));
    const sectorsMeetingTarget = sectorRevenueList.filter((s) => s.isTargetAchieved).length;

    let totalTrendDirection: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
    if (totalRevDelta > 1000) totalTrendDirection = 'UP';
    else if (totalRevDelta < -1000) totalTrendDirection = 'DOWN';

    return {
      totalSectors,
      totalRevCurrent,
      totalRevPrev,
      totalPlafon,
      avgPerfCurrent,
      avgPerfPrev,
      totalRevDelta,
      totalRevDeltaPct,
      avgPerfDelta,
      totalGapToPlafon,
      sectorsMeetingTarget,
      totalTrendDirection,
    };
  }, [sectorRevenueList, prevDataset]);

  // Export Sector Revenue to CSV
  const handleExportCsv = () => {
    const headers = [
      'No',
      'Service Area',
      'Sektor',
      'Rank Sektor',
      `Ach Performansi ${currentDataset.monthLabel} (%)`,
      `Potensi Revenue ${currentDataset.monthLabel} (IDR)`,
      `Ach Performansi ${prevDataset?.monthLabel ?? 'Bulan Lalu'} (%)`,
      `Potensi Revenue ${prevDataset?.monthLabel ?? 'Bulan Lalu'} (IDR)`,
      'Trend Arah',
      'Selisih Revenue MoM (IDR)',
      'Selisih Revenue MoM (%)',
      'Gap ke Plafon Rp 102.080.749 (IDR)',
      'Status Target (>=95%)',
    ];

    const rows = sectorRevenueList.map((s) => [
      s.index,
      `"${serviceArea}"`,
      `"${s.sektor}"`,
      s.rank,
      s.perfCurrent,
      Math.round(s.revCurrent),
      s.perfPrev !== null ? s.perfPrev : '-',
      s.revPrev !== null ? Math.round(s.revPrev) : '-',
      s.trendDirection,
      s.revDelta,
      `${s.revDeltaPct}%`,
      s.gapToPlafon,
      s.isTargetAchieved ? 'Memenuhi' : 'Warning',
    ]);

    const summaryRow = [
      '',
      `"TOTAL SA ${serviceArea}"`,
      `"${aggregateStats.totalSectors} Sektor"`,
      '-',
      aggregateStats.avgPerfCurrent,
      Math.round(aggregateStats.totalRevCurrent),
      aggregateStats.avgPerfPrev !== null ? aggregateStats.avgPerfPrev : '-',
      Math.round(aggregateStats.totalRevPrev),
      aggregateStats.totalTrendDirection,
      aggregateStats.totalRevDelta,
      `${aggregateStats.totalRevDeltaPct}%`,
      aggregateStats.totalGapToPlafon,
      `${aggregateStats.sectorsMeetingTarget}/${aggregateStats.totalSectors} Sektor Lolos`,
    ];

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(',')), summaryRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Potensi_Revenue_Sektor_SA_${serviceArea}_${selectedBulan}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Chart data preparation for side-by-side comparison
  const chartData = useMemo(() => {
    return sectorRevenueList.map((s) => ({
      name: s.sektor,
      potensiCurrent: Math.round(s.revCurrent),
      potensiPrev: s.revPrev !== null ? Math.round(s.revPrev) : null,
      perfCurrent: s.perfCurrent,
      perfPrev: s.perfPrev !== null ? s.perfPrev : null,
      target95Rev: Math.round(0.95 * SECTOR_REVENUE_BASE), // Rp 96.976.711
      plafonRev: SECTOR_REVENUE_BASE, // Rp 102.080.749
    }));
  }, [sectorRevenueList]);

  return (
    <div className="space-y-6" id="service-area-revenue-subpage">
      {/* 1. TOP SUB-PAGE HEADER & BREADCRUMB */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        {/* Breadcrumb Navigation & Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
              title="Kembali ke Ringkasan Service Area"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
              <span>Kembali ke Service Area</span>
            </button>

            <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
              <span className="hover:text-slate-800 cursor-pointer" onClick={onBack}>
                Analisa Service Area
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-extrabold text-slate-900">
                SA {serviceArea}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-red-600 font-bold">Potensi Revenue Sektor</span>
            </nav>
          </div>

          {/* Action buttons: Export CSV & Month Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Month Switcher if callback provided */}
            {onSelectBulan && (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
                <Calendar className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span className="text-slate-500 font-bold text-2xs">Bulan:</span>
                <select
                  value={selectedBulan}
                  onChange={(e) => onSelectBulan(e.target.value as KpiMonth)}
                  className="bg-transparent text-xs font-extrabold text-slate-900 focus:outline-hidden cursor-pointer"
                >
                  {MONTH_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh CSV Rincian</span>
            </button>
          </div>
        </div>

        {/* Title & Service Area Switcher Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-red-100 text-red-700 text-xs font-extrabold">
                <MapPin className="w-3.5 h-3.5" />
                Service Area {serviceArea}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                {aggregateStats.totalSectors} Sektor
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {aggregateStats.sectorsMeetingTarget} / {aggregateStats.totalSectors} Memenuhi Target (&ge;95%)
              </span>
            </div>

            <h2 className="text-xl font-black text-slate-900 mt-2 tracking-tight">
              Rincian Potensi Revenue &amp; Trend Pencapaian Sektor: SA {serviceArea}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Kalkulasi potensi hak imbal jasa per sektor berdasarkan performansi aktual bulan {currentDataset.monthLabel}
              {prevDataset ? ` dikomparasikan terhadap bulan ${prevDataset.monthLabel}.` : '.'}
            </p>
          </div>

          {/* Quick Service Area Switcher Buttons */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-1.5 flex items-center gap-1 flex-wrap shrink-0">
            <span className="text-[11px] font-bold text-slate-500 px-2">Pilih SA:</span>
            {allServiceAreas.map((sa) => (
              <button
                key={sa}
                type="button"
                onClick={() => onSelectServiceArea(sa)}
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                  sa === serviceArea
                    ? 'bg-red-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                {sa}
              </button>
            ))}
          </div>
        </div>

        {/* 2. FORMULA CALLOUT BANNER - AS REQUESTED BY USER */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200/80 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-2xs shrink-0 mt-0.5">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
                  Aturan Rumus Revenue Sektor
                </span>
                <span className="text-2xs text-slate-500 font-medium">Berdasarkan Ketentuan Standard</span>
              </div>
              <div className="text-sm font-black text-slate-900 mt-1 flex items-baseline gap-2 flex-wrap">
                <span>Rumus:</span>
                <span className="font-mono text-emerald-800 bg-white px-2.5 py-0.5 rounded-md border border-emerald-300 shadow-2xs">
                  Potensi Revenue Sektor = Ach Performansi (%) &times; Rp 102.080.749
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Plafon maksimal imbal jasa tiap sektor adalah <strong>Rp 102.080.749</strong> (tercapai jika Ach Performansi = 100.00%). Batas minimum aman hak imbal jasa adalah target performansi &ge; 95.00%.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs shrink-0 bg-white p-3 rounded-xl border border-emerald-200/60 shadow-2xs">
            <div>
              <div className="text-2xs text-slate-400 font-semibold uppercase">Plafon Per Sektor</div>
              <div className="font-mono font-black text-slate-900 text-sm">
                Rp 102.080.749
              </div>
            </div>
            <div className="h-7 w-px bg-slate-200" />
            <div>
              <div className="text-2xs text-slate-400 font-semibold uppercase">Total Plafon SA ({aggregateStats.totalSectors} Sektor)</div>
              <div className="font-mono font-black text-emerald-700 text-sm">
                {formatCurrencyIDR(aggregateStats.totalPlafon)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. EXECUTIVE SUMMARY METRICS FOR THIS SERVICE AREA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Potensi Revenue Bulan Ini */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider">Total Potensi Revenue SA</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60">
              <Coins className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {formatCurrencyIDR(aggregateStats.totalRevCurrent)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium">Realisasi Plafon:</span>
              <strong className="text-emerald-700 font-extrabold font-mono">
                {((aggregateStats.totalRevCurrent / aggregateStats.totalPlafon) * 100).toFixed(2)}%
              </strong>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-500">
            <span>Plafon Maksimal:</span>
            <span className="font-mono font-bold text-slate-700">{formatCurrencyIDR(aggregateStats.totalPlafon)}</span>
          </div>
        </div>

        {/* Metric 2: Trend MoM Revenue SA (Naik/Turun) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider">Trend Revenue MoM</span>
            <span
              className={`p-1.5 rounded-lg border ${
                aggregateStats.totalTrendDirection === 'UP'
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60'
                  : aggregateStats.totalTrendDirection === 'DOWN'
                  ? 'bg-red-50 text-red-600 border-red-200/60'
                  : 'bg-slate-50 text-slate-600 border-slate-200/60'
              }`}
            >
              {aggregateStats.totalTrendDirection === 'UP' && <TrendingUp className="w-4 h-4" />}
              {aggregateStats.totalTrendDirection === 'DOWN' && <TrendingDown className="w-4 h-4" />}
              {aggregateStats.totalTrendDirection === 'STABLE' && <Minus className="w-4 h-4" />}
            </span>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-black font-mono tracking-tight ${
                  aggregateStats.totalRevDelta > 0
                    ? 'text-emerald-700'
                    : aggregateStats.totalRevDelta < 0
                    ? 'text-red-600'
                    : 'text-slate-800'
                }`}
              >
                {aggregateStats.totalRevDelta > 0 ? '+' : ''}
                {formatCurrencyIDR(aggregateStats.totalRevDelta)}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs">
              <span
                className={`inline-flex items-center gap-0.5 text-2xs font-extrabold px-1.5 py-0.5 rounded ${
                  aggregateStats.totalRevDelta > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : aggregateStats.totalRevDelta < 0
                    ? 'bg-red-100 text-red-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {aggregateStats.totalRevDelta > 0 ? (
                  <>
                    <ArrowUpRight className="w-3 h-3" /> Naik {aggregateStats.totalRevDeltaPct}%
                  </>
                ) : aggregateStats.totalRevDelta < 0 ? (
                  <>
                    <ArrowDownRight className="w-3 h-3" /> Turun {Math.abs(aggregateStats.totalRevDeltaPct)}%
                  </>
                ) : (
                  'Stabil 0.00%'
                )}
              </span>
              <span className="text-slate-400 text-2xs">vs {prevDataset?.monthLabel ?? 'Bulan Sebelumnya'}</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-500">
            <span>Bulan Sebelumnya:</span>
            <span className="font-mono font-bold text-slate-700">{formatCurrencyIDR(aggregateStats.totalRevPrev)}</span>
          </div>
        </div>

        {/* Metric 3: Rata-Rata Ach Performansi */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider">Rata-Rata Ach Performansi</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight flex items-baseline gap-2">
              <span>{aggregateStats.avgPerfCurrent}%</span>
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> Target 95%
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <span>MoM Perf:</span>
              <strong
                className={`font-mono font-bold ${
                  aggregateStats.avgPerfDelta >= 0 ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {aggregateStats.avgPerfDelta >= 0 ? `+${aggregateStats.avgPerfDelta}%` : `${aggregateStats.avgPerfDelta}%`}
              </strong>
              <span className="text-slate-400 text-2xs">
                (Lalu: {aggregateStats.avgPerfPrev !== null ? `${aggregateStats.avgPerfPrev}%` : '-'})
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-500">
            <span>Status Hak Imbal:</span>
            <span className="font-bold text-emerald-700">100% Tercapai Lunas</span>
          </div>
        </div>

        {/* Metric 4: Sisa Peluang Gap Revenue */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider">Sisa Gap Ke Plafon 100%</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-amber-700 font-mono tracking-tight">
              {formatCurrencyIDR(aggregateStats.totalGapToPlafon)}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              <span>Peluang optimalisasi menuju 100% plafon</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-500">
            <span>Sektor Memenuhi Target:</span>
            <strong className="text-slate-900 font-bold">
              {aggregateStats.sectorsMeetingTarget} dari {aggregateStats.totalSectors} Sektor
            </strong>
          </div>
        </div>
      </div>

      {/* 4. VISUAL CHART: KOMPARASI POTENSI REVENUE & ACH PERFORMANSI PER SEKTOR */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Grafik Komparasi Potensi Revenue Per Sektor: {currentDataset.monthLabel} vs {prevDataset?.monthLabel ?? 'Bulan Lalu'}</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Perbandingan langsung nilai potensi rupiah masing-masing sektor berdasarkan rumus: Ach Performansi &times; Rp 102.080.749.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-600" />
              <span className="font-bold">{currentDataset.monthLabel}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-slate-300" />
              <span className="font-bold">{prevDataset?.monthLabel ?? 'Bulan Lalu'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-4 h-0.5 bg-emerald-500" />
              <span className="font-bold text-2xs">Plafon Rp 102.080.749</span>
            </div>
          </div>
        </div>

        {/* Bar Chart Container */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 15, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} />
              <YAxis
                domain={[85000000, 105000000]}
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}Jt`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '11px',
                  border: 'none',
                }}
                formatter={(val: any, name: any, item: any) => {
                  if (name === 'potensiCurrent') {
                    return [
                      `${formatCurrencyIDR(val)} (Ach: ${item.payload.perfCurrent}%)`,
                      `Potensi ${currentDataset.monthLabel}`,
                    ];
                  }
                  if (name === 'potensiPrev') {
                    return [
                      val ? `${formatCurrencyIDR(val)} (Ach: ${item.payload.perfPrev}%)` : '-',
                      `Potensi ${prevDataset?.monthLabel ?? 'Bulan Lalu'}`,
                    ];
                  }
                  return [formatCurrencyIDR(val), name];
                }}
              />
              <ReferenceLine
                y={SECTOR_REVENUE_BASE}
                stroke="#059669"
                strokeDasharray="4 4"
                label={{
                  value: 'Plafon 100% (Rp 102.080.749)',
                  fill: '#059669',
                  fontSize: 10,
                  position: 'top',
                }}
              />
              <ReferenceLine
                y={Math.round(0.95 * SECTOR_REVENUE_BASE)}
                stroke="#f59e0b"
                strokeDasharray="3 3"
                label={{
                  value: 'Target 95% (Rp 96.976.711)',
                  fill: '#d97706',
                  fontSize: 9,
                  position: 'bottom',
                }}
              />
              <Bar dataKey="potensiPrev" name="potensiPrev" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={45} />
              <Bar dataKey="potensiCurrent" name="potensiCurrent" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={45}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.perfCurrent >= 95 ? '#059669' : '#d97706'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. SECTOR CARDS GRID - DETAILED BREAKDOWN OF EACH SECTOR */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-600" />
            <span>Kartu Rincian Potensi Revenue &amp; Trend Per Sektor ({sectorRevenueList.length} Sektor)</span>
          </h4>
          <span className="text-xs text-slate-500 font-medium">
            Formula: Ach Performansi &times; Rp 102.080.749
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectorRevenueList.map((sector) => {
            const isUp = sector.trendDirection === 'UP';
            const isDown = sector.trendDirection === 'DOWN';

            return (
              <div
                key={sector.sektor}
                className="bg-white border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-4 shadow-2xs transition-all space-y-3.5 relative overflow-hidden"
              >
                {/* Accent top stripe */}
                <div
                  className={`h-1.5 w-full absolute top-0 left-0 ${
                    sector.isTargetAchieved ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />

                {/* Sektor Header & Rank */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-800 text-xs font-black flex items-center justify-center font-mono">
                      #{sector.rank}
                    </span>
                    <div>
                      <h5 className="text-sm font-black text-slate-900 tracking-tight">
                        SEKTOR {sector.sektor}
                      </h5>
                      <span className="text-2xs text-slate-400">SA {sector.serviceArea}</span>
                    </div>
                  </div>

                  <span
                    className={`text-2xs font-extrabold px-2 py-0.5 rounded ${
                      sector.isTargetAchieved
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {sector.isTargetAchieved ? 'Target Aman' : 'Di Bawah 95%'}
                  </span>
                </div>

                {/* Potensi Revenue Display (Prominent) */}
                <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between text-2xs text-slate-500 font-semibold">
                    <span>POTENSI REVENUE ({currentDataset.month})</span>
                    <span className="font-mono text-emerald-700 font-bold">
                      {sector.perfCurrent}% &times; Plafon
                    </span>
                  </div>
                  <div className="text-xl font-black text-slate-900 font-mono tracking-tight">
                    {formatCurrencyIDR(sector.revCurrent)}
                  </div>
                  <div className="text-2xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/50">
                    <span>Rumus:</span>
                    <span className="font-mono text-slate-700">
                      {sector.perfCurrent}% &times; Rp 102.080.749
                    </span>
                  </div>
                </div>

                {/* MoM Trend Comparison (Current vs Previous Month) */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-2xs text-slate-500">
                    <span className="font-bold uppercase tracking-wider">Trend vs {prevDataset?.monthLabel ?? 'Bulan Lalu'}:</span>
                    <span
                      className={`inline-flex items-center gap-0.5 text-2xs font-extrabold px-1.5 py-0.5 rounded ${
                        isUp
                          ? 'bg-emerald-100 text-emerald-800'
                          : isDown
                          ? 'bg-red-100 text-red-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isUp && <ArrowUpRight className="w-3 h-3 text-emerald-600" />}
                      {isDown && <ArrowDownRight className="w-3 h-3 text-red-600" />}
                      {isUp ? `Naik ${sector.revDeltaPct}%` : isDown ? `Turun ${Math.abs(sector.revDeltaPct)}%` : 'Stabil'}
                    </span>
                  </div>

                  {/* MoM Delta Nominal */}
                  <div className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-slate-50 border border-slate-200/60 text-2xs">
                    <span className="text-slate-500">Selisih Nominal:</span>
                    <span
                      className={`font-mono font-black ${
                        sector.revDelta > 0
                          ? 'text-emerald-700'
                          : sector.revDelta < 0
                          ? 'text-red-600'
                          : 'text-slate-600'
                      }`}
                    >
                      {sector.revDelta > 0 ? '+' : ''}
                      {formatCurrencyIDR(sector.revDelta)}
                    </span>
                  </div>

                  {/* Previous month baseline */}
                  <div className="flex items-center justify-between text-2xs text-slate-500 px-1">
                    <span>Revenue {prevDataset?.monthLabel ?? 'Bulan Lalu'}:</span>
                    <span className="font-mono font-bold text-slate-700">
                      {sector.revPrev !== null ? formatCurrencyIDR(sector.revPrev) : '-'}
                      {sector.perfPrev !== null && ` (${sector.perfPrev}%)`}
                    </span>
                  </div>

                  {/* Gap to Plafon */}
                  <div className="flex items-center justify-between text-2xs text-slate-500 px-1">
                    <span>Sisa Gap ke Plafon:</span>
                    <span className="font-mono font-bold text-amber-700">
                      {formatCurrencyIDR(sector.gapToPlafon)}
                    </span>
                  </div>
                </div>

                {/* Key Indicators Mini-Badge Bar */}
                <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-1.5 text-center text-2xs">
                  <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/50">
                    <span className="text-slate-400 block text-[9px] uppercase font-semibold">ASGAR</span>
                    <strong className="text-slate-800 font-mono font-bold">{sector.asgar}%</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/50">
                    <span className="text-slate-400 block text-[9px] uppercase font-semibold">Avail</span>
                    <strong className="text-slate-800 font-mono font-bold">{sector.serviceAvailability}%</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/50">
                    <span className="text-slate-400 block text-[9px] uppercase font-semibold">Saldo Tiket</span>
                    <strong className="text-slate-800 font-mono font-bold">{sector.outstandingSaldo} Unit</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. COMPREHENSIVE SECTOR REVENUE & TREND MATRIX TABLE */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Tabel Komparasi Lengkap Potensi Revenue &amp; Trend Per Sektor: SA {serviceArea}</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Rincian angka performansi, potensi revenue terhitung, selisih nominal MoM, dan persentase perubahan.
            </p>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" /> Naik
            </span>
            <span className="flex items-center gap-1 text-red-600 font-bold">
              <ArrowDownRight className="w-3.5 h-3.5" /> Turun
            </span>
            <span className="flex items-center gap-1 text-slate-600 font-bold">
              <Minus className="w-3.5 h-3.5" /> Stabil
            </span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-3">No</th>
                <th className="py-3 px-3">Sektor</th>
                <th className="py-3 px-3 text-center">Rank</th>
                <th className="py-3 px-3 text-center bg-emerald-50/50">
                  Ach {currentDataset.monthLabel} (%)
                </th>
                <th className="py-3 px-3 text-right bg-emerald-50/60 font-mono">
                  Potensi Revenue {currentDataset.monthLabel}
                </th>
                <th className="py-3 px-3 text-center bg-slate-100/60">
                  Ach {prevDataset?.monthLabel ?? 'Bulan Lalu'} (%)
                </th>
                <th className="py-3 px-3 text-right bg-slate-100/70 font-mono">
                  Potensi Revenue {prevDataset?.monthLabel ?? 'Bulan Lalu'}
                </th>
                <th className="py-3 px-3 text-center">Trend MoM</th>
                <th className="py-3 px-3 text-right font-mono">Selisih Nominal (Rp)</th>
                <th className="py-3 px-3 text-right font-mono">Sisa Gap Plafon</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sectorRevenueList.map((s) => {
                const isUp = s.trendDirection === 'UP';
                const isDown = s.trendDirection === 'DOWN';

                return (
                  <tr key={s.sektor} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-bold text-slate-400 font-mono">{s.index}</td>
                    <td className="py-2.5 px-3 font-black text-slate-900">
                      {s.sektor}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-2xs bg-slate-100 text-slate-700">
                        #{s.rank}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold font-mono text-emerald-800 bg-emerald-50/30">
                      {s.perfCurrent}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 bg-emerald-50/40">
                      {formatCurrencyIDR(s.revCurrent)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold font-mono text-slate-600 bg-slate-50/40">
                      {s.perfPrev !== null ? `${s.perfPrev}%` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700 bg-slate-50/50">
                      {s.revPrev !== null ? formatCurrencyIDR(s.revPrev) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold ${
                          isUp
                            ? 'text-emerald-700 bg-emerald-50'
                            : isDown
                            ? 'text-red-700 bg-red-50'
                            : 'text-slate-600 bg-slate-100'
                        }`}
                      >
                        {isUp && <ArrowUpRight className="w-3 h-3 text-emerald-600" />}
                        {isDown && <ArrowDownRight className="w-3 h-3 text-red-600" />}
                        {isUp
                          ? `+${s.revDeltaPct}%`
                          : isDown
                          ? `${s.revDeltaPct}%`
                          : '0.00%'}
                      </span>
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-mono font-bold ${
                        s.revDelta > 0
                          ? 'text-emerald-700'
                          : s.revDelta < 0
                          ? 'text-red-600'
                          : 'text-slate-600'
                      }`}
                    >
                      {s.revDelta > 0 ? '+' : ''}
                      {formatCurrencyIDR(s.revDelta)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-amber-800">
                      {formatCurrencyIDR(s.gapToPlafon)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.isTargetAchieved
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {s.isTargetAchieved ? 'Memenuhi' : 'Warning'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-900 text-white font-bold text-xs">
              <tr>
                <td colSpan={3} className="py-3 px-3 uppercase text-amber-400 font-black">
                  TOTAL SA {serviceArea} ({aggregateStats.totalSectors} SEKTOR):
                </td>
                <td className="py-3 px-3 text-center font-mono text-amber-300 font-black">
                  {aggregateStats.avgPerfCurrent}%
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-400 font-black text-sm">
                  {formatCurrencyIDR(aggregateStats.totalRevCurrent)}
                </td>
                <td className="py-3 px-3 text-center font-mono text-slate-300">
                  {aggregateStats.avgPerfPrev !== null ? `${aggregateStats.avgPerfPrev}%` : '-'}
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-200">
                  {formatCurrencyIDR(aggregateStats.totalRevPrev)}
                </td>
                <td className="py-3 px-3 text-center">
                  <span
                    className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold ${
                      aggregateStats.totalTrendDirection === 'UP'
                        ? 'bg-emerald-800 text-emerald-200'
                        : aggregateStats.totalTrendDirection === 'DOWN'
                        ? 'bg-red-900 text-red-200'
                        : 'bg-slate-800 text-slate-200'
                    }`}
                  >
                    {aggregateStats.totalTrendDirection === 'UP' && <ArrowUpRight className="w-3 h-3" />}
                    {aggregateStats.totalTrendDirection === 'DOWN' && <ArrowDownRight className="w-3 h-3" />}
                    {aggregateStats.totalRevDelta > 0
                      ? `+${aggregateStats.totalRevDeltaPct}%`
                      : `${aggregateStats.totalRevDeltaPct}%`}
                  </span>
                </td>
                <td
                  className={`py-3 px-3 text-right font-mono font-black ${
                    aggregateStats.totalRevDelta >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {aggregateStats.totalRevDelta > 0 ? '+' : ''}
                  {formatCurrencyIDR(aggregateStats.totalRevDelta)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-amber-300">
                  {formatCurrencyIDR(aggregateStats.totalGapToPlafon)}
                </td>
                <td className="py-3 px-3 text-center text-emerald-400 font-extrabold">
                  {aggregateStats.sectorsMeetingTarget}/{aggregateStats.totalSectors} Lolos
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
