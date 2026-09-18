import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  BarChart3,
  MapPin,
  Building2,
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Sparkles,
  Layers,
  FileSpreadsheet,
  Maximize2,
  SlidersHorizontal,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { MonthKpiDataset, KpiSectorRow, KpiIndicatorSummaryRow } from '../types/kpiImbalJasa';
import { KPI_DATASETS, MONTH_OPTIONS, SPREADSHEET_CONFIG } from '../data/kpiSpreadsheetDatabase';
import { KpiMonth } from '../lib/kpiSpreadsheetService';

interface KpiImbalJasaAnalyticsProps {
  currentDataset: MonthKpiDataset;
  selectedBulan: KpiMonth;
  onSelectBulan: (bulan: KpiMonth) => void;
  onOpenRawImageModal?: () => void;
}

type AnalyticsViewMode = 'all_branch' | 'service_area' | 'sektor' | 'indicators';

export default function KpiImbalJasaAnalytics({
  currentDataset,
  selectedBulan,
  onSelectBulan,
  onOpenRawImageModal,
}: KpiImbalJasaAnalyticsProps) {
  const [viewMode, setViewMode] = useState<AnalyticsViewMode>('all_branch');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('ALL');
  const [metricFocus, setMetricFocus] = useState<'perf' | 'asgar' | 'serviceAvailability' | 'ttr24hNonHvc' | 'closedSqm'>('perf');

  // Sector comparison selection
  const [compareSectorA, setCompareSectorA] = useState<string>(
    currentDataset.sectorRows[0]?.sektor || 'TRENGGALEK'
  );
  const [compareSectorB, setCompareSectorB] = useState<string>(
    currentDataset.sectorRows[currentDataset.sectorRows.length - 1]?.sektor || 'PONOROGO 1'
  );

  // 1. ALL BRANCH HISTORICAL TREND DATA (Juli, Agustus, September)
  const historicalTrendData = useMemo(() => {
    const months: KpiMonth[] = ['JULI', 'AGUSTUS', 'SEPTEMBER'];
    return months.map((m) => {
      const data = KPI_DATASETS[m];
      const perf = data.summary.perfBranch;
      const asgar = data.totalBranchRow.asgar;
      const availability = data.totalBranchRow.serviceAvailability;
      const ttr24 = data.totalBranchRow.ttr24hNonHvc;
      const closedSqm = data.totalBranchRow.closedSqm;
      const valinsDc = data.totalBranchRow.valinsDc;
      const target = 95.0;

      return {
        bulanKey: m,
        bulan: m === 'JULI' ? 'Juli 2026' : m === 'AGUSTUS' ? 'Agustus 2026' : 'September 2026',
        perfBranch: Number(perf.toFixed(2)),
        target,
        asgar: Number(asgar.toFixed(2)),
        serviceAvailability: Number(availability.toFixed(2)),
        ttr24hNonHvc: Number(ttr24.toFixed(2)),
        closedSqm: Number(closedSqm.toFixed(2)),
        valinsDc: Number(valinsDc.toFixed(2)),
        sektorLolos: data.summary.sektorMemenuhiTarget,
        totalSektor: data.summary.totalSektor,
      };
    });
  }, []);

  // 2. SERVICE AREA AGGREGATION
  const serviceAreaStats = useMemo(() => {
    const map = new Map<string, {
      serviceArea: string;
      sektorCount: number;
      sektorNames: string[];
      totalPerf: number;
      totalAsgar: number;
      totalAvailability: number;
      totalTtr24: number;
      totalValinsDc: number;
      totalClosedSqm: number;
      topSektor: { name: string; perf: number };
      minSektor: { name: string; perf: number };
    }>();

    currentDataset.sectorRows.forEach((r) => {
      const existing = map.get(r.serviceArea);
      if (!existing) {
        map.set(r.serviceArea, {
          serviceArea: r.serviceArea,
          sektorCount: 1,
          sektorNames: [r.sektor],
          totalPerf: r.perf,
          totalAsgar: r.asgar,
          totalAvailability: r.serviceAvailability,
          totalTtr24: r.ttr24hNonHvc,
          totalValinsDc: r.valinsDc,
          totalClosedSqm: r.closedSqm,
          topSektor: { name: r.sektor, perf: r.perf },
          minSektor: { name: r.sektor, perf: r.perf },
        });
      } else {
        existing.sektorCount += 1;
        existing.sektorNames.push(r.sektor);
        existing.totalPerf += r.perf;
        existing.totalAsgar += r.asgar;
        existing.totalAvailability += r.serviceAvailability;
        existing.totalTtr24 += r.ttr24hNonHvc;
        existing.totalValinsDc += r.valinsDc;
        existing.totalClosedSqm += r.closedSqm;
        if (r.perf > existing.topSektor.perf) {
          existing.topSektor = { name: r.sektor, perf: r.perf };
        }
        if (r.perf < existing.minSektor.perf) {
          existing.minSektor = { name: r.sektor, perf: r.perf };
        }
      }
    });

    const result = Array.from(map.values()).map((item) => {
      const avgPerf = Number((item.totalPerf / item.sektorCount).toFixed(2));
      const avgAsgar = Number((item.totalAsgar / item.sektorCount).toFixed(2));
      const avgAvailability = Number((item.totalAvailability / item.sektorCount).toFixed(2));
      const avgTtr24 = Number((item.totalTtr24 / item.sektorCount).toFixed(2));
      const avgValinsDc = Number((item.totalValinsDc / item.sektorCount).toFixed(2));
      const avgClosedSqm = Number((item.totalClosedSqm / item.sektorCount).toFixed(2));

      return {
        serviceArea: item.serviceArea,
        sektorCount: item.sektorCount,
        sektorNames: item.sektorNames,
        avgPerf,
        avgAsgar,
        avgAvailability,
        avgTtr24,
        avgValinsDc,
        avgClosedSqm,
        topSektor: item.topSektor,
        minSektor: item.minSektor,
        target: 95.0,
        gap: Number((avgPerf - 95.0).toFixed(2)),
        isAboveTarget: avgPerf >= 95.0,
      };
    });

    return result.sort((a, b) => b.avgPerf - a.avgPerf);
  }, [currentDataset]);

  // Unique service areas list for filter
  const allServiceAreas = useMemo(() => {
    return Array.from(new Set(currentDataset.sectorRows.map((r) => r.serviceArea))).sort();
  }, [currentDataset]);

  // 3. SECTOR RANKING AND DISTRIBUTION DATA
  const sectorChartData = useMemo(() => {
    let rows = [...currentDataset.sectorRows];
    if (selectedAreaFilter !== 'ALL') {
      rows = rows.filter((r) => r.serviceArea === selectedAreaFilter);
    }
    return rows.map((r) => ({
      rank: r.rank,
      sektor: r.sektor,
      serviceArea: r.serviceArea,
      displayName: `${r.sektor}`,
      perf: Number(r.perf.toFixed(2)),
      asgar: Number(r.asgar.toFixed(2)),
      serviceAvailability: Number(r.serviceAvailability.toFixed(2)),
      ttr24hNonHvc: Number(r.ttr24hNonHvc.toFixed(2)),
      outstandingSaldo: r.outstandingSaldo,
      closedSqm: Number(r.closedSqm.toFixed(2)),
      valinsDc: Number(r.valinsDc.toFixed(2)),
      target: 95.0,
    }));
  }, [currentDataset, selectedAreaFilter]);

  // 4. RADAR CHART DATA FOR SERVICE AREAS
  const radarAreaComparisonData = useMemo(() => {
    return [
      {
        subject: 'ASGAR Guarantee',
        target: 91.7,
        ...Object.fromEntries(serviceAreaStats.map((s) => [s.serviceArea, s.avgAsgar])),
      },
      {
        subject: 'Availability SLA',
        target: 98.5,
        ...Object.fromEntries(serviceAreaStats.map((s) => [s.serviceArea, s.avgAvailability])),
      },
      {
        subject: 'TTR < 24H Non-HVC',
        target: 91.1,
        ...Object.fromEntries(serviceAreaStats.map((s) => [s.serviceArea, s.avgTtr24])),
      },
      {
        subject: 'Valins DC QR',
        target: 95.0,
        ...Object.fromEntries(serviceAreaStats.map((s) => [s.serviceArea, s.avgValinsDc])),
      },
      {
        subject: 'SQM Closed',
        target: 70.0,
        ...Object.fromEntries(serviceAreaStats.map((s) => [s.serviceArea, s.avgClosedSqm])),
      },
      {
        subject: 'Overall PERF',
        target: 95.0,
        ...Object.fromEntries(serviceAreaStats.map((s) => [s.serviceArea, s.avgPerf])),
      },
    ];
  }, [serviceAreaStats]);

  // 5. SECTOR COMPARISON DRILLDOWN (Sector A vs Sector B)
  const sectorComparisonData = useMemo(() => {
    const sA = currentDataset.sectorRows.find((r) => r.sektor === compareSectorA);
    const sB = currentDataset.sectorRows.find((r) => r.sektor === compareSectorB);
    if (!sA || !sB) return [];

    return [
      { metric: 'Overall Perf', target: 95, [sA.sektor]: sA.perf, [sB.sektor]: sB.perf },
      { metric: 'ASGAR', target: 91.71, [sA.sektor]: sA.asgar, [sB.sektor]: sB.asgar },
      { metric: 'Availability', target: 98.52, [sA.sektor]: sA.serviceAvailability, [sB.sektor]: sB.serviceAvailability },
      { metric: 'TTR 24H', target: 91.1, [sA.sektor]: sA.ttr24hNonHvc, [sB.sektor]: sB.ttr24hNonHvc },
      { metric: 'TTR 3H Manja', target: 94.79, [sA.sektor]: sA.ttr3hManja, [sB.sektor]: sB.ttr3hManja },
      { metric: 'TTR 12H Gold', target: 83.0, [sA.sektor]: sA.ttr12hGold, [sB.sektor]: sB.ttr12hGold },
      { metric: 'Valins DC', target: 95.0, [sA.sektor]: sA.valinsDc, [sB.sektor]: sB.valinsDc },
      { metric: 'Closed SQM', target: 70.0, [sA.sektor]: sA.closedSqm, [sB.sektor]: sB.closedSqm },
      { metric: 'SCC Inet', target: 70.0, [sA.sektor]: sA.sccInet, [sB.sektor]: sB.sccInet },
      { metric: 'TTR Comp 4H', target: 47.0, [sA.sektor]: sA.ttrCompSqm4h, [sB.sektor]: sB.ttrCompSqm4h },
    ];
  }, [currentDataset, compareSectorA, compareSectorB]);

  // 6. INDICATORS ACHIEVEMENT & GAP DATA
  const indicatorGapData = useMemo(() => {
    return currentDataset.indicatorBreakdown.map((ind) => {
      const diff = Number((ind.branchRealisasi - ind.target).toFixed(2));
      const pencapaian = Number(ind.pencapaian.toFixed(1));
      return {
        no: ind.no,
        code: ind.code,
        name: ind.name,
        bobot: ind.bobot,
        target: ind.target,
        realisasi: ind.branchRealisasi,
        satuan: ind.satuan,
        gap: diff,
        pencapaian,
        status: ind.status,
        isAchieved: ind.status === 'Memenuhi',
      };
    });
  }, [currentDataset]);

  // 7. BOBOT CATEGORY PIE DATA
  const categoryWeightData = useMemo(() => {
    const categories: { [key: string]: number } = {
      'TTR SLA (Diamond, Manja, dll)': 44,
      'ASGAR & Service Availability': 18,
      'SQM SLA (Closed & Comp)': 11,
      'Field Quality & Material': 12,
      'Tool Readiness & SCC': 15,
    };
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, []);

  const PIE_COLORS = ['#dc2626', '#2563eb', '#059669', '#d97706', '#7c3aed'];

  // Top Area & Gap Area
  const topArea = serviceAreaStats[0];
  const lowestArea = serviceAreaStats[serviceAreaStats.length - 1];

  return (
    <div className="space-y-6" id="kpi-imbal-jasa-analytics">
      {/* TOP BAR: LENS SWITCHER & MONTH SELECTOR */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-50 rounded-lg text-red-600 border border-red-200/60">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>Grafik & Analisa Performansi KPI Imbal Jasa</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-extrabold">
                  {currentDataset.monthLabel}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Visualisasi terpadu performansi All Branch, tren antar bulan, agregasi Service Area, dan pemetaan 16 sektor.
              </p>
            </div>
          </div>
        </div>

        {/* CONTROLS: VIEW MODE & MONTH DROPDOWN */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Month Selector Pills */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
            {MONTH_OPTIONS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => onSelectBulan(m.value)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedBulan === m.value
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Raw Sheet Image Modal Trigger (Optional Inspection) */}
          {onOpenRawImageModal && (
            <button
              type="button"
              onClick={onOpenRawImageModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
              title="Pratinjau lembar sumber asli"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Pratinjau Sheet Asli</span>
            </button>
          )}
        </div>
      </div>

      {/* EXECUTIVE SUMMARY KPI HIGHLIGHT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Branch Performance Score */}
        <div className="bg-gradient-to-br from-red-600 via-red-700 to-rose-800 text-white rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
            <Award className="w-28 h-28" />
          </div>
          <div className="flex items-center justify-between text-red-100 text-xs font-semibold">
            <span>PERFORMANSI BRANCH</span>
            <span className="bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-mono font-bold">
              {currentDataset.month}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight">{currentDataset.summary.perfBranch.toFixed(2)}%</span>
            <span className="text-xs text-red-200 font-semibold flex items-center gap-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> Target 95.0%
            </span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center justify-between text-2xs text-red-100">
            <span>Status Hak Imbal Jasa:</span>
            <strong className="text-emerald-300">100% LUNAS</strong>
          </div>
        </div>

        {/* Card 2: Sektor Lolos Target */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>PEMENUHAN SEKTOR</span>
            <span className="p-1 rounded-md bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {currentDataset.summary.sektorMemenuhiTarget}
            </span>
            <span className="text-sm font-bold text-slate-400">/ {currentDataset.summary.totalSektor} Sektor</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-2xs">
            <span className="text-slate-500">Rasio Lolos:</span>
            <span className="font-bold text-emerald-600">
              {((currentDataset.summary.sektorMemenuhiTarget / currentDataset.summary.totalSektor) * 100).toFixed(1)}% Memenuhi Target
            </span>
          </div>
        </div>

        {/* Card 3: Top Performing Service Area */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>AREA TERTINGGI (JUARA)</span>
            <span className="p-1 rounded-md bg-blue-50 text-blue-700">
              <MapPin className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{topArea?.serviceArea}</span>
            <span className="text-xs font-bold text-blue-600">{topArea?.avgPerf.toFixed(2)}%</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-2xs">
            <span className="text-slate-500">Sektor Terbaik:</span>
            <span className="font-bold text-slate-700">{topArea?.topSektor.name} (100%)</span>
          </div>
        </div>

        {/* Card 4: Top Sektor Rank 1 */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>TOP SEKTOR (RANK 1)</span>
            <span className="p-1 rounded-md bg-amber-50 text-amber-700">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {currentDataset.summary.topSektorName}
            </span>
            <span className="text-xs font-bold text-emerald-600">
              {currentDataset.summary.topSektorPerf.toFixed(2)}%
            </span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-2xs">
            <span className="text-slate-500">Capaian Nilai:</span>
            <span className="font-bold text-slate-700">Perf Sempurna 100%</span>
          </div>
        </div>
      </div>

      {/* ANALYTICS NAVIGATION TABS */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-1.5 shadow-2xs flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setViewMode('all_branch')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            viewMode === 'all_branch'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Trend All Branch (Juli - Sept)</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('service_area')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            viewMode === 'service_area'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Analisa Per Service Area</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('sektor')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            viewMode === 'sektor'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Ranking & Komparasi 16 Sektor</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('indicators')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            viewMode === 'indicators'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Gap 17 Indikator SLA & Bobot</span>
        </button>
      </div>

      {/* VIEW 1: ALL BRANCH TREND & HISTORICAL OVERVIEW */}
      {viewMode === 'all_branch' && (
        <div className="space-y-6">
          {/* Chart 1: All Branch Historical Performance vs Target */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span>Trend Performansi All Branch Madiun (Q3 2026)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                    Konsisten Di Atas Target 95%
                  </span>
                </h4>
                <p className="text-xs text-slate-500">
                  Perkembangan skor performansi branch per bulan (Juli: 99.35% → Agustus: 99.19% → September: 99.51%).
                </p>
              </div>

              {/* Metric focus selector */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold text-slate-500 text-2xs">Fokus Metrik:</span>
                <select
                  value={metricFocus}
                  onChange={(e) => setMetricFocus(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-hidden"
                >
                  <option value="perf">Overall Performansi (%)</option>
                  <option value="asgar">ASGAR SLA (%)</option>
                  <option value="serviceAvailability">Service Availability (%)</option>
                  <option value="ttr24hNonHvc">TTR 24H Non-HVC (%)</option>
                  <option value="closedSqm">Closed SQM (%)</option>
                </select>
              </div>
            </div>

            {/* Area and Line Trend Chart */}
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicalTrendData} margin={{ top: 15, right: 25, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="branchPerfGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis domain={[85, 102]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                    formatter={(value: any, name: any) => [`${value}%`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <ReferenceLine y={95.0} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Target Imbal Jasa (95%)', fill: '#059669', fontSize: 10, position: 'top' }} />
                  
                  <Area
                    type="monotone"
                    dataKey="perfBranch"
                    name="Performansi Branch"
                    stroke="#dc2626"
                    strokeWidth={3}
                    fill="url(#branchPerfGrad)"
                    activeDot={{ r: 6 }}
                  />

                  {metricFocus !== 'perf' && (
                    <Line
                      type="monotone"
                      dataKey={metricFocus}
                      name={
                        metricFocus === 'asgar'
                          ? 'ASGAR'
                          : metricFocus === 'serviceAvailability'
                          ? 'Service Availability'
                          : metricFocus === 'ttr24hNonHvc'
                          ? 'TTR 24H Non-HVC'
                          : 'Closed SQM'
                      }
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Historical Month Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {historicalTrendData.map((item) => (
                <div
                  key={item.bulanKey}
                  onClick={() => onSelectBulan(item.bulanKey as KpiMonth)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    selectedBulan === item.bulanKey
                      ? 'bg-red-50/70 border-red-300 ring-2 ring-red-500/20'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{item.bulan}</span>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                      selectedBulan === item.bulanKey ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {selectedBulan === item.bulanKey ? 'Aktif' : 'Pilih'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-xl font-black text-slate-900">{item.perfBranch}%</span>
                    <span className="text-2xs font-semibold text-emerald-600">
                      {item.sektorLolos} / {item.totalSektor} Sektor Memenuhi
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] pt-1.5 border-t border-slate-200/60 text-slate-600">
                    <div>ASGAR: <strong className="text-slate-800">{item.asgar}%</strong></div>
                    <div>Avail: <strong className="text-slate-800">{item.serviceAvailability}%</strong></div>
                    <div>TTR 24H: <strong className="text-slate-800">{item.ttr24hNonHvc}%</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grouped Multi-metric Comparison Across Months */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart: Core SLA Pillars Trend */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
              <h4 className="text-sm font-black text-slate-900 flex items-center justify-between">
                <span>Pilar Utama SLA (ASGAR vs Availability vs Closed SQM)</span>
                <span className="text-2xs text-slate-400 font-medium">Tren 3 Bulan</span>
              </h4>
              <p className="text-xs text-slate-500">
                Pencapaian tiga pilar penentu kepuasan pelanggan dan ketersediaan layanan.
              </p>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={historicalTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis domain={[65, 105]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff', fontSize: '11px' }}
                      formatter={(v: any) => [`${v}%`]}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="asgar" name="ASGAR SLA" fill="#dc2626" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="serviceAvailability" name="Availability" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="closedSqm" name="Closed SQM" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Analytical Insight Cards */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Kesimpulan Analisa Tren Branch</span>
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Highlight performansi berdasarkan data aktual sheet {SPREADSHEET_CONFIG.sheetName}:
                </p>

                <div className="mt-4 space-y-2.5 text-xs">
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-emerald-900 font-bold block">Hak Imbal Jasa 100% Terjaga Lunas</strong>
                      <p className="text-emerald-700 text-[11px] mt-0.5 leading-relaxed">
                        Nilai performansi branch sepanjang Q3 2026 secara konsisten melampaui batas target 95.0% (September mencapai 99.51%), menjamin pencairan 100% Hak Imbal Jasa.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl flex items-start gap-2.5">
                    <TrendingUp className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-blue-900 font-bold block">TTR 24H & Segmen HVC Sempurna</strong>
                      <p className="text-blue-700 text-[11px] mt-0.5 leading-relaxed">
                        Penyelesaian tiket perbaikan non-HVC &lt; 24 jam mencapai 100.0% di seluruh bulan, didukung oleh penanganan segmen Diamond dan Manja &lt; 3 jam di atas target.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-900 font-bold block">Fokus Peningkatan: Valins Visit &amp; Saldo</strong>
                      <p className="text-amber-700 text-[11px] mt-0.5 leading-relaxed">
                        Terdapat 2 sektor yang memerlukan perkuatan visit ke ODP dan pengendalian tiket outstanding saldo agar rasio lolos mencapai 100% penuh.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-400">
                <span>Sumber Data: Sheet {SPREADSHEET_CONFIG.sheetName} ({currentDataset.range})</span>
                <span className="font-mono text-slate-500">ID: {SPREADSHEET_CONFIG.spreadsheetId}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: PER SERVICE AREA ANALYSIS */}
      {viewMode === 'service_area' && (
        <div className="space-y-6">
          {/* Main Area Performance Bar Chart */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span>Komparasi Performansi Per Service Area ({serviceAreaStats.length} Area)</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Rata-rata nilai performansi gabungan sektor pada masing-masing Service Area di Witel Madiun.
                </p>
              </div>
              <div className="text-xs text-slate-600 font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                Target Standar: <span className="font-bold text-emerald-600">≥ 95.00%</span>
              </div>
            </div>

            {/* Bar Chart Service Area */}
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceAreaStats} margin={{ top: 15, right: 20, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="serviceArea"
                    tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis domain={[85, 102]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    formatter={(v: any) => [`${v}%`, 'Rata-rata Performansi']}
                  />
                  <ReferenceLine y={95.0} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Target 95%', fill: '#059669', fontSize: 10, position: 'top' }} />
                  <Bar dataKey="avgPerf" name="Rata-rata Performansi" radius={[6, 6, 0, 0]}>
                    {serviceAreaStats.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.avgPerf >= 99.0
                            ? '#059669' // Emerald
                            : entry.avgPerf >= 95.0
                            ? '#2563eb' // Blue
                            : '#d97706' // Amber
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Grid of Service Area Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {serviceAreaStats.map((area, idx) => (
                <div
                  key={area.serviceArea}
                  className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 hover:border-red-300 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 text-[10px] flex items-center justify-center font-bold">
                        #{idx + 1}
                      </span>
                      {area.serviceArea}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                      area.avgPerf >= 95 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {area.avgPerf}%
                    </span>
                  </div>

                  <div className="mt-2.5 space-y-1 text-2xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Sektor:</span>
                      <strong className="text-slate-700">{area.sektorCount} Sektor</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Top Sektor:</span>
                      <strong className="text-slate-900">{area.topSektor.name} ({area.topSektor.perf}%)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Rata-rata ASGAR:</span>
                      <span className="font-semibold text-slate-700">{area.avgAsgar}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Availability:</span>
                      <span className="font-semibold text-slate-700">{area.avgAvailability}%</span>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-2xs">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-bold text-emerald-600">Hak Imbal Jasa Aman</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Radar Chart: Service Areas Multi-dimensional Comparison */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                  <span>Radar Profil Kualitas 6 Dimensi Service Area</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Pemetaan kekuatan operasional antar Service Area meliputi SLA Garansi (ASGAR), Availability, Valins DC, dan SQM.
                </p>
              </div>
            </div>

            <div className="h-80 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarAreaComparisonData} margin={{ top: 15, right: 30, bottom: 15, left: 30 }}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[60, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Radar name="TRENGGALEK" dataKey="TRENGGALEK" stroke="#059669" fill="#059669" fillOpacity={0.25} />
                  <Radar name="MADIUN" dataKey="MADIUN" stroke="#dc2626" fill="#dc2626" fillOpacity={0.2} />
                  <Radar name="KEDIRI" dataKey="KEDIRI" stroke="#2563eb" fill="#2563eb" fillOpacity={0.15} />
                  <Radar name="PARE" dataKey="PARE" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.15} />
                  <Radar name="PONOROGO" dataKey="PONOROGO" stroke="#d97706" fill="#d97706" fillOpacity={0.15} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: PER SEKTOR RANKING & COMPARISON */}
      {viewMode === 'sektor' && (
        <div className="space-y-6">
          {/* Horizontal Ranking of All 16 Sectors */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-red-600" />
                  <span>Leaderboard &amp; Ranking 16 Sektor ({currentDataset.monthLabel})</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Perbandingan capaian skor Performansi (%) masing-masing sektor, diurutkan dari Rank 1 hingga Rank 16.
                </p>
              </div>

              {/* Area Filter Dropdown */}
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-500">Filter Area:</span>
                <select
                  value={selectedAreaFilter}
                  onChange={(e) => setSelectedAreaFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-hidden"
                >
                  <option value="ALL">Semua Area (16 Sektor)</option>
                  {allServiceAreas.map((area) => (
                    <option key={area} value={area}>
                      Area {area}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Horizontal Bar Chart */}
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sectorChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 55, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" domain={[85, 102]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                  <YAxis
                    type="category"
                    dataKey="displayName"
                    tick={{ fontSize: 10, fill: '#1e293b', fontWeight: 600 }}
                    width={85}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                    formatter={(val: any, name: any, item: any) => [
                      `${val}% (Rank #${item.payload.rank} - Area ${item.payload.serviceArea})`,
                      'Performansi',
                    ]}
                  />
                  <ReferenceLine x={95.0} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Target 95%', fill: '#059669', fontSize: 10, position: 'insideTopRight' }} />
                  <Bar dataKey="perf" name="Performansi Sektor" radius={[0, 4, 4, 0]}>
                    {sectorChartData.map((entry, index) => (
                      <Cell
                        key={`sector-cell-${index}`}
                        fill={
                          entry.perf >= 99.0
                            ? '#059669' // Emerald
                            : entry.perf >= 95.0
                            ? '#2563eb' // Blue
                            : '#dc2626' // Red
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 text-2xs text-slate-500 pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>Tier 1: Sempurna (≥ 99.0%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>Tier 2: Memenuhi Target (95.0% - 98.9%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                <span>Tier 3: Di Bawah Target (&lt; 95.0%)</span>
              </span>
            </div>
          </div>

          {/* Interactive Sector Head-to-Head Comparison */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-purple-600" />
                  <span>Komparasi Head-to-Head Antar Sektor</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Bandingkan dua sektor secara langsung pada 10 metrik operasional kritis untuk menemukan area peningkatan.
                </p>
              </div>

              {/* Sektor Selectors */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-red-600">Sektor A:</span>
                  <select
                    value={compareSectorA}
                    onChange={(e) => setCompareSectorA(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800"
                  >
                    {currentDataset.sectorRows.map((s) => (
                      <option key={s.sektor} value={s.sektor}>
                        {s.sektor} (#{s.rank})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block" />

                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-blue-600">Sektor B:</span>
                  <select
                    value={compareSectorB}
                    onChange={(e) => setCompareSectorB(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800"
                  >
                    {currentDataset.sectorRows.map((s) => (
                      <option key={s.sektor} value={s.sektor}>
                        {s.sektor} (#{s.rank})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Grouped Bar Chart Head-to-Head */}
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sectorComparisonData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="metric"
                    tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis domain={[40, 105]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff', fontSize: '11px' }}
                    formatter={(v: any) => [`${v}%`]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey={compareSectorA} name={`${compareSectorA} (A)`} fill="#dc2626" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={compareSectorB} name={`${compareSectorB} (B)`} fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: GAP 17 INDIKATOR SLA & BOBOT KONTRIBUSI */}
      {viewMode === 'indicators' && (
        <div className="space-y-6">
          {/* Chart: Gap to Target per Indicator */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>Analisa Gap Target vs Realisasi (17 Indikator KPI)</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Batang positif (hijau) menunjukkan pencapaian melampaui target; batang negatif (merah) memerlukan akselerasi.
                </p>
              </div>
            </div>

            {/* Gap Bar Chart */}
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={indicatorGapData} margin={{ top: 15, right: 20, left: -10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 9, fill: '#334155', fontWeight: 600 }}
                    interval={0}
                    angle={-35}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                    formatter={(val: any, name: any, item: any) => [
                      `Realisasi: ${item.payload.realisasi}${item.payload.satuan} (Target: ${item.payload.target}${item.payload.satuan}) | Gap: ${val > 0 ? '+' : ''}${val}`,
                      'Status Capaian',
                    ]}
                  />
                  <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} />
                  <Bar dataKey="gap" name="Gap Target (Realisasi - Target)">
                    {indicatorGapData.map((entry, index) => (
                      <Cell
                        key={`gap-cell-${index}`}
                        fill={entry.gap >= 0 ? '#059669' : '#dc2626'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bobot Composition & Key SLA Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donut Chart: Komposisi Bobot KPI */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
              <h4 className="text-sm font-black text-slate-900 flex items-center justify-between">
                <span>Distribusi Bobot 17 Indikator KPI (Total 100%)</span>
                <span className="text-2xs text-slate-400 font-medium">Struktur Evaluasi</span>
              </h4>
              <p className="text-xs text-slate-500">
                Porsi pembobotan yang menentukan penilaian performansi branch dan kelayakan hak imbal jasa.
              </p>

              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryWeightData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }: any) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryWeightData.map((entry, index) => (
                        <Cell key={`pie-cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff', fontSize: '11px' }}
                      formatter={(v: any) => [`${v}% Bobot`, 'Porsi']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Indicator Quick Summary Table */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center justify-between">
                  <span>Rekap Kepatuhan Indikator Utama</span>
                  <span className="text-2xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    100% Bobot Aktif
                  </span>
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  14 dari 17 indikator melampaui target standar dengan kategori Sangat Baik.
                </p>

                <div className="mt-3 divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
                  {indicatorGapData.slice(0, 7).map((ind) => (
                    <div key={ind.no} className="py-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                          {ind.no}
                        </span>
                        <div>
                          <span className="font-bold text-slate-800">{ind.name}</span>
                          <span className="text-[10px] text-slate-400 block">Bobot {ind.bobot}% | Target {ind.target}{ind.satuan}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold ${ind.isAchieved ? 'text-emerald-600' : 'text-red-600'}`}>
                          {ind.realisasi}{ind.satuan}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{ind.pencapaian}% Achv</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-2xs text-slate-400">
                Pencapaian rata-rata branch: <strong className="text-slate-700">{currentDataset.summary.pencapaianRataRata.toFixed(1)}%</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
