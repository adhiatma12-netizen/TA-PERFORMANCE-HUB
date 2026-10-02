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
  Sparkles,
  Layers,
  FileSpreadsheet,
  Maximize2,
  SlidersHorizontal,
  Info,
  Calendar,
  ChevronRight,
  Check,
  Coins,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
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
  LabelList,
} from 'recharts';
import { MonthKpiDataset, KpiSectorRow, KpiIndicatorSummaryRow } from '../types/kpiImbalJasa';
import { KPI_DATASETS, KPI_INDICATOR_SPECS, MONTH_OPTIONS, SPREADSHEET_CONFIG } from '../data/kpiSpreadsheetDatabase';
import { KpiMonth } from '../lib/kpiSpreadsheetService';
import ServiceAreaRevenueDetail, { SECTOR_REVENUE_BASE, formatCurrencyIDR } from './ServiceAreaRevenueDetail';

interface KpiImbalJasaAnalyticsProps {
  currentDataset: MonthKpiDataset;
  selectedBulan: KpiMonth;
  onSelectBulan: (bulan: KpiMonth) => void;
  onOpenRawImageModal?: () => void;
}

type AnalyticsViewMode = 'all_branch' | 'service_area' | 'indicators';

const SERVICE_AREA_COLORS: Record<string, { stroke: string; fill: string }> = {
  TRENGGALEK: { stroke: '#059669', fill: '#059669' }, // Emerald
  PARE: { stroke: '#7c3aed', fill: '#7c3aed' },       // Purple
  NGANJUK: { stroke: '#db2777', fill: '#db2777' },    // Pink
  MAGETAN: { stroke: '#0891b2', fill: '#0891b2' },    // Cyan
  KEDIRI: { stroke: '#2563eb', fill: '#2563eb' },     // Blue
  MADIUN: { stroke: '#dc2626', fill: '#dc2626' },     // Red
  PONOROGO: { stroke: '#d97706', fill: '#d97706' },   // Amber
};

export default function KpiImbalJasaAnalytics({
  currentDataset,
  selectedBulan,
  onSelectBulan,
  onOpenRawImageModal,
}: KpiImbalJasaAnalyticsProps) {
  const [viewMode, setViewMode] = useState<AnalyticsViewMode>('all_branch');
  const [metricFocus, setMetricFocus] = useState<'perf' | 'asgar' | 'serviceAvailability' | 'ttr24hNonHvc' | 'closedSqm'>('perf');

  const [trendScaleMode, setTrendScaleMode] = useState<'achievement' | 'zoom' | 'standard'>('achievement');
  const [selectedServiceAreaFilter, setSelectedServiceAreaFilter] = useState<string>('ALL');
  const [selectedKomboSector, setSelectedKomboSector] = useState<string>('ALL');
  const [radarServiceAreaFilter, setRadarServiceAreaFilter] = useState<string>('ALL');
  const [selectedDetailServiceArea, setSelectedDetailServiceArea] = useState<string | null>(null);

  // 1. ALL BRANCH & SERVICE AREA HISTORICAL TREND DATA (Mei, Juni, Juli, Agustus, September)
  const historicalTrendData = useMemo(() => {
    const months: KpiMonth[] = ['MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER'];
    const monthLabels: Record<KpiMonth, string> = {
      MEI: 'Mei 2026',
      JUNI: 'Juni 2026',
      JULI: 'Juli 2026',
      AGUSTUS: 'Agustus 2026',
      SEPTEMBER: 'September 2026',
    };
    const calculated = months.map((m) => {
      const data = KPI_DATASETS[m];

      // 1. If a specific sector is filtered in Grafik Kombo, compute for that sector
      if (selectedKomboSector !== 'ALL') {
        const sectorRow = data.sectorRows.find((s) => s.sektor === selectedKomboSector);
        const perf = sectorRow ? sectorRow.perf : 0;
        const asgar = sectorRow ? sectorRow.asgar : 0;
        const availability = sectorRow ? sectorRow.serviceAvailability : 0;
        const ttr24 = sectorRow ? sectorRow.ttr24hNonHvc : 0;
        const closedSqm = sectorRow ? sectorRow.closedSqm : 0;
        const valinsDc = sectorRow ? sectorRow.valinsDc : 0;
        const valinsVisit = sectorRow ? sectorRow.valinsVisit : 0;
        const outstandingSaldo = sectorRow ? sectorRow.outstandingSaldo : 0;

        let totalWeightedSkor = 0;
        let sumAchv = 0;
        if (sectorRow) {
          KPI_INDICATOR_SPECS.forEach((spec) => {
            const codeKey = spec.code as keyof KpiSectorRow;
            const real = typeof sectorRow[codeKey] === 'number' ? (sectorRow[codeKey] as number) : 0;

            let achv = 0;
            if (spec.polaritas === 'MIN') {
              achv = real <= 0 ? 100 : (spec.target / real) * 100;
            } else {
              achv = (real / spec.target) * 100;
            }
            sumAchv += achv;
            const skor = achv >= 100 ? spec.bobot : (achv / 100) * spec.bobot;
            totalWeightedSkor += skor;
          });
        }
        // Target performansi adalah 100%.
        // Logika: Jika performansi 100% terhadap target maka pencapaian KPI / total ach juga 100%.
        // Jika pencapaian dari target atau kurang dari target maka disesuaikan proporsional terhadap target 100%.
        const TARGET_PERFORMANSI = 100.0;
        const pencapaianRataRata = Number(((perf / TARGET_PERFORMANSI) * 100).toFixed(2));
        const totalSkor = Math.min(100, Math.max(0, totalWeightedSkor));

        return {
          bulanKey: m,
          bulan: monthLabels[m],
          perfBranch: Number(perf.toFixed(2)),
          totalSkor: Number(totalSkor.toFixed(2)),
          pencapaianRataRata: Number(pencapaianRataRata.toFixed(2)),
          momPerf: 0,
          momPencapaian: 0,
          target: 95.0,
          baseline: 100.0,
          asgar: Number(asgar.toFixed(2)),
          serviceAvailability: Number(availability.toFixed(2)),
          ttr24hNonHvc: Number(ttr24.toFixed(2)),
          closedSqm: Number(closedSqm.toFixed(2)),
          valinsDc: Number(valinsDc.toFixed(2)),
          valinsVisit: Number(valinsVisit.toFixed(2)),
          outstandingSaldo,
          sektorLolos: perf >= 95.0 ? 1 : 0,
          totalSektor: 1,
        };
      }

      if (selectedServiceAreaFilter === 'ALL') {
        const perf = data.summary.perfBranch;
        const totalSkor = data.summary.totalSkor;
        // Target performansi adalah 100%. Logika: (perf / 100) * 100
        const TARGET_PERFORMANSI = 100.0;
        const pencapaianRataRata = Number(((perf / TARGET_PERFORMANSI) * 100).toFixed(2));
        const asgar = data.totalBranchRow.asgar;
        const availability = data.totalBranchRow.serviceAvailability;
        const ttr24 = data.totalBranchRow.ttr24hNonHvc;
        const closedSqm = data.totalBranchRow.closedSqm;
        const valinsDc = data.totalBranchRow.valinsDc;
        const valinsVisit = data.totalBranchRow.valinsVisit;
        const outstandingSaldo = data.totalBranchRow.outstandingSaldo;
        const target = 95.0;

        return {
          bulanKey: m,
          bulan: monthLabels[m],
          perfBranch: Number(perf.toFixed(2)),
          totalSkor: Number(totalSkor.toFixed(2)),
          pencapaianRataRata: Number(pencapaianRataRata.toFixed(2)),
          momPerf: 0,
          momPencapaian: 0,
          target,
          baseline: 100.0,
          asgar: Number(asgar.toFixed(2)),
          serviceAvailability: Number(availability.toFixed(2)),
          ttr24hNonHvc: Number(ttr24.toFixed(2)),
          closedSqm: Number(closedSqm.toFixed(2)),
          valinsDc: Number(valinsDc.toFixed(2)),
          valinsVisit: Number(valinsVisit.toFixed(2)),
          outstandingSaldo,
          sektorLolos: data.summary.sektorMemenuhiTarget,
          totalSektor: data.summary.totalSektor,
        };
      }

      // Filtered to specific Service Area
      const sectors = data.sectorRows.filter((s) => s.serviceArea === selectedServiceAreaFilter);
      const count = sectors.length || 1;
      const avgPerf = sectors.reduce((acc, s) => acc + s.perf, 0) / count;
      const asgar = sectors.reduce((acc, s) => acc + s.asgar, 0) / count;
      const availability = sectors.reduce((acc, s) => acc + s.serviceAvailability, 0) / count;
      const ttr24 = sectors.reduce((acc, s) => acc + s.ttr24hNonHvc, 0) / count;
      const closedSqm = sectors.reduce((acc, s) => acc + s.closedSqm, 0) / count;
      const valinsDc = sectors.reduce((acc, s) => acc + s.valinsDc, 0) / count;
      const valinsVisit = sectors.reduce((acc, s) => acc + s.valinsVisit, 0) / count;
      const outstandingSaldo = sectors.reduce((acc, s) => acc + s.outstandingSaldo, 0);
      const sektorLolos = sectors.filter((s) => s.perf >= 95.0).length;

      // 17 indicators achievement for this Service Area in month m
      let totalWeightedSkor = 0;
      let sumAchv = 0;
      KPI_INDICATOR_SPECS.forEach((spec) => {
        const codeKey = spec.code as keyof KpiSectorRow;
        const real =
          sectors.reduce((acc, s) => {
            const val = s[codeKey];
            return acc + (typeof val === 'number' ? val : 0);
          }, 0) / count;

        let achv = 0;
        if (spec.polaritas === 'MIN') {
          achv = real <= 0 ? 100 : (spec.target / real) * 100;
        } else {
          achv = (real / spec.target) * 100;
        }
        sumAchv += achv;
        const skor = achv >= 100 ? spec.bobot : (achv / 100) * spec.bobot;
        totalWeightedSkor += skor;
      });

      // Target performansi adalah 100%. Logika: (avgPerf / 100) * 100
      const TARGET_PERFORMANSI = 100.0;
      const pencapaianRataRata = Number(((avgPerf / TARGET_PERFORMANSI) * 100).toFixed(2));
      const totalSkor = Math.min(100, Math.max(0, totalWeightedSkor));

      return {
        bulanKey: m,
        bulan: monthLabels[m],
        perfBranch: Number(avgPerf.toFixed(2)),
        totalSkor: Number(totalSkor.toFixed(2)),
        pencapaianRataRata: Number(pencapaianRataRata.toFixed(2)),
        momPerf: 0,
        momPencapaian: 0,
        target: 95.0,
        baseline: 100.0,
        asgar: Number(asgar.toFixed(2)),
        serviceAvailability: Number(availability.toFixed(2)),
        ttr24hNonHvc: Number(ttr24.toFixed(2)),
        closedSqm: Number(closedSqm.toFixed(2)),
        valinsDc: Number(valinsDc.toFixed(2)),
        valinsVisit: Number(valinsVisit.toFixed(2)),
        outstandingSaldo,
        sektorLolos,
        totalSektor: sectors.length,
      };
    });

    // Compute MoM for each month
    calculated.forEach((item, idx) => {
      if (idx > 0) {
        const prev = calculated[idx - 1];
        item.momPerf = Number((item.perfBranch - prev.perfBranch).toFixed(2));
        item.momPencapaian = Number((item.pencapaianRataRata - prev.pencapaianRataRata).toFixed(2));
      }
    });

    return calculated;
  }, [selectedServiceAreaFilter, selectedKomboSector]);

  // 1.1 ALL 17 INDICATORS MULTI-MONTH TREND COMPARISON (Mei, Juni, Juli, Agustus, September)
  // Supports filtering by Service Area or All Branch
  const multiMonthIndicatorTrends = useMemo(() => {
    return KPI_INDICATOR_SPECS.map((spec) => {
      let meiReal = 0;
      let junReal = 0;
      let julReal = 0;
      let aguReal = 0;
      let sepReal = 0;

      if (selectedServiceAreaFilter === 'ALL') {
        const mei = KPI_DATASETS.MEI.indicatorBreakdown.find((i) => i.no === spec.no);
        const jun = KPI_DATASETS.JUNI.indicatorBreakdown.find((i) => i.no === spec.no);
        const jul = KPI_DATASETS.JULI.indicatorBreakdown.find((i) => i.no === spec.no);
        const agu = KPI_DATASETS.AGUSTUS.indicatorBreakdown.find((i) => i.no === spec.no);
        const sep = KPI_DATASETS.SEPTEMBER.indicatorBreakdown.find((i) => i.no === spec.no);
        meiReal = mei?.branchRealisasi ?? 0;
        junReal = jun?.branchRealisasi ?? 0;
        julReal = jul?.branchRealisasi ?? 0;
        aguReal = agu?.branchRealisasi ?? 0;
        sepReal = sep?.branchRealisasi ?? 0;
      } else {
        // Average the indicator values across sectors belonging to the selected Service Area
        const codeKey = spec.code as keyof KpiSectorRow;
        const getAreaAvg = (dataset: MonthKpiDataset) => {
          const sectors = dataset.sectorRows.filter((s) => s.serviceArea === selectedServiceAreaFilter);
          if (sectors.length === 0) return 0;
          const sum = sectors.reduce((acc, s) => {
            const val = s[codeKey];
            return acc + (typeof val === 'number' ? val : 0);
          }, 0);
          return sum / sectors.length;
        };

        meiReal = getAreaAvg(KPI_DATASETS.MEI);
        junReal = getAreaAvg(KPI_DATASETS.JUNI);
        julReal = getAreaAvg(KPI_DATASETS.JULI);
        aguReal = getAreaAvg(KPI_DATASETS.AGUSTUS);
        sepReal = getAreaAvg(KPI_DATASETS.SEPTEMBER);
      }

      // Calculate achievement % based on polarity
      const calcAchv = (real: number) => {
        if (spec.polaritas === 'MIN') {
          if (real <= 0) return 100;
          return Number(((spec.target / real) * 100).toFixed(1));
        }
        return Number(((real / spec.target) * 100).toFixed(1));
      };

      const meiAchv = calcAchv(meiReal);
      const junAchv = calcAchv(junReal);
      const julAchv = calcAchv(julReal);
      const aguAchv = calcAchv(aguReal);
      const sepAchv = calcAchv(sepReal);

      // Grouping category for filter
      let categoryGroup: 'TTR' | 'SLA_AVAIL' | 'FIELD' | 'SQM_TOOLS' = 'SQM_TOOLS';
      if ([3, 4, 5, 6, 7].includes(spec.no)) {
        categoryGroup = 'TTR';
      } else if ([1, 2, 12].includes(spec.no)) {
        categoryGroup = 'SLA_AVAIL';
      } else if ([9, 10, 14].includes(spec.no)) {
        categoryGroup = 'FIELD';
      } else {
        categoryGroup = 'SQM_TOOLS';
      }

      const momPencapaian = Number((sepAchv - aguAchv).toFixed(2));
      const isUp = momPencapaian > 0;
      const isDown = momPencapaian < 0;

      const baseJul = KPI_DATASETS.JULI.indicatorBreakdown.find((i) => i.no === spec.no);
      const baseSep = KPI_DATASETS.SEPTEMBER.indicatorBreakdown.find((i) => i.no === spec.no);

      return {
        no: spec.no,
        name: spec.name,
        code: spec.code,
        shortName: spec.name.length > 18 ? `${spec.name.substring(0, 16)}...` : spec.name,
        kategori: baseJul?.kategori || 'Indikator KPI',
        categoryGroup,
        satuan: spec.satuan,
        target: spec.target,
        bobot: spec.bobot,
        // Pencapaian %
        meiAchv: Number(meiAchv.toFixed(1)),
        junAchv: Number(junAchv.toFixed(1)),
        julAchv: Number(julAchv.toFixed(1)),
        aguAchv: Number(aguAchv.toFixed(1)),
        sepAchv: Number(sepAchv.toFixed(1)),
        // Realisasi
        meiReal: Number(meiReal.toFixed(2)),
        junReal: Number(junReal.toFixed(2)),
        julReal: Number(julReal.toFixed(2)),
        aguReal: Number(aguReal.toFixed(2)),
        sepReal: Number(sepReal.toFixed(2)),
        momPencapaian,
        trendDirection: isUp ? 'UP' : isDown ? 'DOWN' : 'FLAT',
        status: sepAchv >= 100 ? 'Memenuhi' : ('Warning' as const),
        keterangan: baseSep?.keterangan || '',
      };
    });
  }, [selectedServiceAreaFilter]);

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

  // Unique sector names list for filter
  const allSectorNames = useMemo(() => {
    return Array.from(new Set(currentDataset.sectorRows.map((r) => r.sektor))).sort();
  }, [currentDataset]);

  // 4. RADAR CHART DATA FOR SERVICE AREAS
  const radarAreaComparisonData = useMemo(() => {
    const totalSectors = currentDataset.sectorRows.length || 1;
    const branchAvgAsgar = Number((currentDataset.sectorRows.reduce((acc, r) => acc + r.asgar, 0) / totalSectors).toFixed(2));
    const branchAvgAvail = Number((currentDataset.sectorRows.reduce((acc, r) => acc + r.serviceAvailability, 0) / totalSectors).toFixed(2));
    const branchAvgTtr24 = Number((currentDataset.sectorRows.reduce((acc, r) => acc + r.ttr24hNonHvc, 0) / totalSectors).toFixed(2));
    const branchAvgValins = Number((currentDataset.sectorRows.reduce((acc, r) => acc + r.valinsDc, 0) / totalSectors).toFixed(2));
    const branchAvgSqm = Number((currentDataset.sectorRows.reduce((acc, r) => acc + r.closedSqm, 0) / totalSectors).toFixed(2));
    const branchAvgPerf = Number((currentDataset.sectorRows.reduce((acc, r) => acc + r.perf, 0) / totalSectors).toFixed(2));

    return [
      {
        subject: 'ASGAR Guarantee',
        target: 91.7,
        branchAverage: branchAvgAsgar,
        ...Object.fromEntries(serviceAreaStats.map((s) => [s.serviceArea, s.avgAsgar])),
      },
      {
        subject: 'Availability SLA',
        target: 98.5,
        branchAverage: branchAvgAvail,
        ...Object.fromEntries(serviceAreaStats.map((s) => [s.serviceArea, s.avgAvailability])),
      },
      {
        subject: 'TTR < 24H Non-HVC',
        target: 91.1,
        branchAverage: branchAvgTtr24,
        ...Object.fromEntries(serviceAreaStats.map((s) => [s.serviceArea, s.avgTtr24])),
      },
      {
        subject: 'Valins DC QR',
        target: 95.0,
        branchAverage: branchAvgValins,
        ...Object.fromEntries(serviceAreaStats.map((s) => [s.serviceArea, s.avgValinsDc])),
      },
      {
        subject: 'SQM Closed',
        target: 70.0,
        branchAverage: branchAvgSqm,
        ...Object.fromEntries(serviceAreaStats.map((s) => [s.serviceArea, s.avgClosedSqm])),
      },
      {
        subject: 'Overall PERF',
        target: 95.0,
        branchAverage: branchAvgPerf,
        ...Object.fromEntries(serviceAreaStats.map((s) => [s.serviceArea, s.avgPerf])),
      },
    ];
  }, [serviceAreaStats, currentDataset]);

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
          {/* Bulan Filter Dropdown */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 shadow-2xs">
            <Calendar className="w-4 h-4 text-red-600 shrink-0" />
            <select
              id="analytics-select-bulan"
              aria-label="Pilih Bulan KPI Imbal Jasa"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 0: ESTIMASI REVENUE (Di sebelah kiri menu PERFORMANSI BRANCH) */}
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
            <Coins className="w-28 h-28" />
          </div>
          <div className="flex items-center justify-between text-emerald-100 text-xs font-semibold">
            <span>ESTIMASI REVENUE</span>
            <span className="bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-mono font-bold">
              {currentDataset.month}
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black tracking-tight text-white">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
                Math.round((currentDataset.summary.perfBranch / 100) * 233327246)
              )}
            </div>
            <div className="text-xs text-emerald-200 font-semibold flex items-center gap-0.5 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>{currentDataset.summary.perfBranch.toFixed(2)}% &times; Rp 233.327.246</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center justify-between text-2xs text-emerald-100">
            <span>Plafon Target:</span>
            <strong className="text-white">Rp 233.327.246</strong>
          </div>
        </div>

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
            <span>Status Pencapaian:</span>
            <strong className="text-emerald-300">Memenuhi Target</strong>
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
          {/* Executive Section Header */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-100 text-red-700 text-xs font-bold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Sub-Bab: Trend All Branch
                  </span>
                  {selectedServiceAreaFilter !== 'ALL' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      SA {selectedServiceAreaFilter}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {selectedServiceAreaFilter === 'ALL'
                      ? 'Target Terpenuhi Konsisten (> 95%)'
                      : `Target Terpenuhi SA ${selectedServiceAreaFilter}`}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 mt-2">
                  Grafik Pencapaian Nilai KPI Setiap Bulan &amp; Trend{' '}
                  {selectedServiceAreaFilter === 'ALL' ? 'All Branch' : `SA ${selectedServiceAreaFilter}`}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-3xl">
                  {selectedServiceAreaFilter === 'ALL'
                    ? 'Visualisasi performansi historis Witel Madiun Q3 2026. Membandingkan nilai pencapaian rata-rata KPI, skor realisasi performansi branch, skor terbobot, dan tren 17 indikator SLA setiap bulan.'
                    : `Visualisasi performansi historis untuk Service Area ${selectedServiceAreaFilter} sepanjang Q3 2026 (Juli, Agustus, September). Nilai dihitung dari rata-rata performansi sektor dalam wilayah ini.`}
                </p>
              </div>

              {/* Controls: Filter Service Area & Month Selector Pills */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                {/* Filter Service Area Dropdown */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-slate-700 whitespace-nowrap">Service Area:</span>
                  <select
                    id="filter-trend-all-branch-sa-select"
                    value={selectedServiceAreaFilter}
                    onChange={(e) => setSelectedServiceAreaFilter(e.target.value)}
                    className="bg-white border border-emerald-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 cursor-pointer min-w-[170px]"
                  >
                    <option value="ALL">Semua Area (All Branch)</option>
                    {allServiceAreas.map((sa) => (
                      <option key={sa} value={sa}>
                        SA {sa}
                      </option>
                    ))}
                  </select>
                  {selectedServiceAreaFilter !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setSelectedServiceAreaFilter('ALL')}
                      className="px-2 py-0.5 text-2xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition cursor-pointer ml-1"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Month Selector Pills */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500">Bulan:</span>
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
                    {historicalTrendData.map((item) => (
                      <button
                        key={item.bulanKey}
                        type="button"
                        onClick={() => onSelectBulan(item.bulanKey as KpiMonth)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          selectedBulan === item.bulanKey
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        <span>{item.bulan.split(' ')[0]}</span>
                        {selectedBulan === item.bulanKey && <Check className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>


            {/* Multi-Month Performance Summary Cards (Mei s/d September) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-5 pt-4 border-t border-slate-100">
              {historicalTrendData.map((item) => {
                const isSelected = selectedBulan === item.bulanKey;
                return (
                  <div
                    key={item.bulanKey}
                    onClick={() => onSelectBulan(item.bulanKey as KpiMonth)}
                    className={`p-4 rounded-xl border transition cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-red-50/70 border-red-300 ring-2 ring-red-500/20 shadow-xs'
                        : 'bg-slate-50/80 border-slate-200/80 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Calendar className={`w-3.5 h-3.5 ${isSelected ? 'text-red-600' : 'text-slate-500'}`} />
                        <span className="text-xs font-bold text-slate-900">{item.bulan}</span>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {isSelected ? 'Bulan Aktif' : 'Pilih'}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/60">
                        <span className="text-[10px] font-semibold text-slate-500 block">Pencapaian KPI</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-lg font-black text-blue-700">{item.pencapaianRataRata}%</span>
                          {item.momPencapaian !== 0 && (
                            <span className={`text-[10px] font-bold flex items-center ${item.momPencapaian > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {item.momPencapaian > 0 ? '+' : ''}{item.momPencapaian}%
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/60">
                        <span className="text-[10px] font-semibold text-slate-500 block truncate">
                          {selectedKomboSector !== 'ALL'
                            ? `Performansi ${selectedKomboSector}`
                            : selectedServiceAreaFilter === 'ALL'
                            ? 'Performansi Branch'
                            : `Performansi SA ${selectedServiceAreaFilter}`}
                        </span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-lg font-black text-red-600">{item.perfBranch}%</span>
                          {item.momPerf !== 0 && (
                            <span className={`text-[10px] font-bold flex items-center ${item.momPerf > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {item.momPerf > 0 ? '+' : ''}{item.momPerf}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-2xs text-slate-600 pt-2 border-t border-slate-200/60">
                      <span>Skor Terbobot: <strong className="text-slate-800">{item.totalSkor} / 100</strong></span>
                      <span className="font-semibold text-emerald-600">
                        {item.sektorLolos} / {item.totalSektor} Sektor Lolos
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* MAIN CHART 1: KOMBO PENCAPAIAN NILAI KPI SETIAP BULAN & TREND */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2 flex-wrap">
                  <BarChart3 className="w-4 h-4 text-red-600" />
                  <span>
                    Grafik Kombo: Nilai Pencapaian KPI Setiap Bulan &amp; Trend Performansi
                    {selectedKomboSector !== 'ALL' ? (
                      <span className="ml-2 text-2xs font-black text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border border-red-200">
                        <Building2 className="w-2.5 h-2.5" />
                        Sektor: {selectedKomboSector}
                      </span>
                    ) : selectedServiceAreaFilter !== 'ALL' ? (
                      <span className="ml-2 text-2xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        SA {selectedServiceAreaFilter}
                      </span>
                    ) : null}
                  </span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Menampilkan Batang Pencapaian KPI (Biru), Batang Nilai Realisasi{' '}
                  {selectedKomboSector !== 'ALL'
                    ? `Sektor ${selectedKomboSector}`
                    : selectedServiceAreaFilter !== 'ALL'
                    ? `SA ${selectedServiceAreaFilter}`
                    : 'Branch'}{' '}
                  (Merah), serta Garis Tren Skor Terbobot (Amber).
                </p>
              </div>

              {/* Controls: Filter Sektor & Mode scale toggles */}
              <div className="flex items-center gap-3 flex-wrap text-xs">
                {/* Filter Sektor Dropdown */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 shadow-2xs">
                  <Building2 className="w-4 h-4 text-red-600 shrink-0" />
                  <select
                    id="filter-kombo-sektor-select"
                    aria-label="Filter Sektor Grafik Kombo"
                    value={selectedKomboSector}
                    onChange={(e) => setSelectedKomboSector(e.target.value)}
                    className="bg-transparent text-xs font-black text-slate-900 focus:outline-hidden cursor-pointer min-w-[155px]"
                  >
                    <option value="ALL">ALL (Semua Sektor)</option>
                    {allSectorNames.map((sektor) => (
                      <option key={sektor} value={sektor}>
                        Sektor {sektor}
                      </option>
                    ))}
                  </select>
                  {selectedKomboSector !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setSelectedKomboSector('ALL')}
                      className="px-1.5 py-0.5 text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition cursor-pointer"
                      title="Reset filter ke ALL"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Mode scale toggles */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-semibold text-2xs">Mode Skala:</span>
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-2xs font-bold">
                    <button
                      type="button"
                      onClick={() => setTrendScaleMode('achievement')}
                      className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                        trendScaleMode === 'achievement'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Pencapaian (90% - 115%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrendScaleMode('zoom')}
                      className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                        trendScaleMode === 'zoom'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Zoom (97% - 100.5%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrendScaleMode('standard')}
                      className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                        trendScaleMode === 'standard'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Skala Penuh
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Composed Chart Container with explicit height */}
            <div className="w-full" style={{ height: 350, minHeight: 350 }}>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart
                  data={historicalTrendData}
                  margin={{ top: 25, right: 30, left: 0, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="pencapaianBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.9} />
                    </linearGradient>
                    <linearGradient id="realisasiBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#b91c1c" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: '#334155', fontWeight: 600 }} />
                  <YAxis
                    domain={
                      trendScaleMode === 'achievement'
                        ? [90, 115]
                        : trendScaleMode === 'zoom'
                        ? [97, 100.5]
                        : [80, 120]
                    }
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    unit="%"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
                    }}
                    formatter={(value: any, name: any) => [`${value}%`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }} />

                  {/* Reference Lines for Target */}
                  <ReferenceLine
                    y={95.0}
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    label={{
                      value: 'Target Imbal Jasa (95.0%)',
                      fill: '#059669',
                      fontSize: 10,
                      fontWeight: 700,
                      position: 'top',
                    }}
                  />
                  <ReferenceLine
                    y={100.0}
                    stroke="#64748b"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    label={{
                      value: 'Target Standar (100%)',
                      fill: '#475569',
                      fontSize: 10,
                      position: 'top',
                    }}
                  />

                  {/* Bars with Data Labels */}
                  {trendScaleMode !== 'zoom' && (
                    <Bar
                      dataKey="pencapaianRataRata"
                      name="Pencapaian Nilai KPI (%)"
                      fill="url(#pencapaianBarGrad)"
                      radius={[6, 6, 0, 0]}
                      barSize={40}
                    >
                      <LabelList
                        dataKey="pencapaianRataRata"
                        position="top"
                        fill="#1e3a8a"
                        fontSize={11}
                        fontWeight={700}
                        formatter={(v: any) => `${v}%`}
                      />
                    </Bar>
                  )}

                  <Bar
                    dataKey="perfBranch"
                    name={
                      selectedKomboSector !== 'ALL'
                        ? `Skor Realisasi Sektor ${selectedKomboSector} (%)`
                        : selectedServiceAreaFilter !== 'ALL'
                        ? `Skor Realisasi SA ${selectedServiceAreaFilter} (%)`
                        : 'Skor Realisasi Branch (%)'
                    }
                    fill="url(#realisasiBarGrad)"
                    radius={[6, 6, 0, 0]}
                    barSize={40}
                  >
                    <LabelList
                      dataKey="perfBranch"
                      position="top"
                      fill="#991b1b"
                      fontSize={11}
                      fontWeight={700}
                      formatter={(v: any) => `${v}%`}
                    />
                  </Bar>

                  {/* Trend Lines */}
                  <Line
                    type="monotone"
                    dataKey="totalSkor"
                    name="Trend Skor Terbobot"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 7 }}
                  />

                  {trendScaleMode === 'zoom' && (
                    <Line
                      type="monotone"
                      dataKey="perfBranch"
                      name="Garis Tren Realisasi"
                      stroke="#dc2626"
                      strokeWidth={2.5}
                      dot={{ r: 5, fill: '#dc2626', stroke: '#fff', strokeWidth: 2 }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Explanation Metric Callouts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/60 flex items-start gap-2.5">
                <span className="w-3 h-3 rounded-full bg-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-blue-900 font-bold block">
                    Pencapaian KPI ({selectedKomboSector !== 'ALL' ? `Sektor ${selectedKomboSector}` : 'Periode Terkini'}):{' '}
                    {historicalTrendData[historicalTrendData.length - 1]?.pencapaianRataRata}%
                  </strong>
                  <p className="text-blue-700 text-2xs mt-0.5">
                    Dihitung proporsional terhadap Target Standar Performansi 100%. Pencapaian 100% didapatkan jika performansi mencapai 100%.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-red-50/60 rounded-xl border border-red-200/60 flex items-start gap-2.5">
                <span className="w-3 h-3 rounded-full bg-red-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-red-900 font-bold block">
                    Skor Realisasi ({selectedKomboSector !== 'ALL' ? `Sektor ${selectedKomboSector}` : 'Branch'}):{' '}
                    {historicalTrendData[historicalTrendData.length - 1]?.perfBranch}%
                  </strong>
                  <p className="text-red-700 text-2xs mt-0.5">
                    {historicalTrendData[historicalTrendData.length - 1]?.perfBranch >= 95.0
                      ? 'Realisasi performansi memenuhi batas target hak imbal jasa (≥ 95.0%).'
                      : 'Realisasi performansi memerlukan akselerasi untuk mencapai target imbal jasa 95.0%.'}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 flex items-start gap-2.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-900 font-bold block">
                    Skor Terbobot KPI:{' '}
                    {historicalTrendData[historicalTrendData.length - 1]?.totalSkor} / 100
                  </strong>
                  <p className="text-amber-700 text-2xs mt-0.5">
                    Akumulasi pembobotan 17 indikator SLA pada periode terkini.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* EXECUTIVE ANALYTICAL SUMMARY */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>
                  Kesimpulan Analisa Tren{' '}
                  {selectedServiceAreaFilter !== 'ALL' ? `SA ${selectedServiceAreaFilter}` : 'All Branch'}
                </span>
              </h4>
              <span className="text-2xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md">
                Q3 2026 Selesai
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Highlight performansi berdasarkan data aktual sheet {SPREADSHEET_CONFIG.sheetName}:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/60 rounded-xl flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-900 font-bold block">Hak Imbal Jasa 100% Terjaga Lunas</strong>
                  <p className="text-emerald-700 text-[11px] mt-1 leading-relaxed">
                    Nilai performansi branch sepanjang Q3 2026 secara konsisten melampaui batas target 95.0% (September mencapai 99.51%), menjamin pencairan 100% Hak Imbal Jasa.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/70 border border-blue-200/60 rounded-xl flex items-start gap-2.5">
                <TrendingUp className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-blue-900 font-bold block">Pencapaian Rata-Rata Naik Konsisten</strong>
                  <p className="text-blue-700 text-[11px] mt-1 leading-relaxed">
                    Rata-rata pencapaian indikator KPI terus meningkat: Juli 108.40% &rarr; Agustus 108.97% &rarr; September 109.32%, menunjukkan efisiensi teknisi lapangan yang makin tangguh.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50/70 border border-amber-200/60 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-900 font-bold block">Fokus Peningkatan: Saldo Tiket Berjalan</strong>
                  <p className="text-amber-700 text-[11px] mt-1 leading-relaxed">
                    Outstanding Saldo tiket bergerak dari 10 &rarr; 12 &rarr; 14 unit. Perlu percepatan closing tiket sisa di sektor Ponorogo 1 dan Trenggalek agar target minimum tetap aman.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-1 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-2xs text-slate-400">
              <span>Sumber Data: Sheet {SPREADSHEET_CONFIG.sheetName} ({currentDataset.range})</span>
              <span className="font-mono text-slate-500">ID: {SPREADSHEET_CONFIG.spreadsheetId}</span>
            </div>
          </div>

          {/* TABLE: REKAP LENGKAP NILAI PENCAPAIAN INDIKATOR BULANAN SESUAI FILTER */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>
                    Tabel Rekap Nilai Pencapaian &amp; Realisasi Indikator KPI Bulanan ({multiMonthIndicatorTrends.length} Indikator)
                    {selectedServiceAreaFilter !== 'ALL' ? ` - SA ${selectedServiceAreaFilter}` : ' - All Branch'}
                  </span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rincian angka realisasi, persentase pencapaian, dan tren pergerakan MoM (Month-over-Month) otomatis disaring berdasarkan filter dropdown KPI dan Service Area.
                </p>
              </div>

              <div className="text-xs text-slate-500 flex items-center gap-3">
                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Naik
                </span>
                <span className="flex items-center gap-1 text-red-600 font-bold">
                  <ArrowDownRight className="w-3.5 h-3.5" /> Turun
                </span>
                <span className="flex items-center gap-1 text-blue-600 font-bold">
                  &bull; Stabil
                </span>
                {selectedServiceAreaFilter !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedServiceAreaFilter('ALL');
                    }}
                    className="ml-2 text-2xs text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                  >
                    Tampilkan Semua di Tabel
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Nama Indikator KPI</th>
                    <th className="py-2.5 px-3">Target</th>
                    <th className="py-2.5 px-3">Bobot</th>
                    <th className="py-2.5 px-2.5 text-center bg-amber-50/50">Realisasi Mei</th>
                    <th className="py-2.5 px-2.5 text-center bg-teal-50/50">Realisasi Jun</th>
                    <th className="py-2.5 px-2.5 text-center bg-slate-100/60">Realisasi Jul</th>
                    <th className="py-2.5 px-2.5 text-center bg-blue-50/50">Realisasi Agu</th>
                    <th className="py-2.5 px-2.5 text-center bg-red-50/50">Realisasi Sep</th>
                    <th className="py-2.5 px-2 text-center bg-amber-50/50">% Achv Mei</th>
                    <th className="py-2.5 px-2 text-center bg-teal-50/50">% Achv Jun</th>
                    <th className="py-2.5 px-2 text-center bg-slate-100/60">% Achv Jul</th>
                    <th className="py-2.5 px-2 text-center bg-blue-50/50">% Achv Agu</th>
                    <th className="py-2.5 px-2 text-center bg-red-50/50">% Achv Sep</th>
                    <th className="py-2.5 px-3 text-center">Tren MoM</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {multiMonthIndicatorTrends.map((row) => {
                    const isUp = row.trendDirection === 'UP';
                    const isDown = row.trendDirection === 'DOWN';
                    return (
                      <tr key={row.no} className="hover:bg-slate-50/80 transition">
                        <td className="py-2 px-3 font-bold text-slate-500">{row.no}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{row.name}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{row.target}{row.satuan}</td>
                        <td className="py-2 px-3 font-bold text-slate-700">{row.bobot}%</td>
                        <td className="py-2 px-2.5 text-center font-mono text-amber-800 bg-amber-50/20">
                          {row.meiReal}{row.satuan}
                        </td>
                        <td className="py-2 px-2.5 text-center font-mono text-teal-800 bg-teal-50/20">
                          {row.junReal}{row.satuan}
                        </td>
                        <td className="py-2 px-2.5 text-center font-mono text-slate-600 bg-slate-50/30">
                          {row.julReal}{row.satuan}
                        </td>
                        <td className="py-2 px-2.5 text-center font-mono text-blue-800 bg-blue-50/20">
                          {row.aguReal}{row.satuan}
                        </td>
                        <td className="py-2 px-2.5 text-center font-mono font-bold text-red-900 bg-red-50/20">
                          {row.sepReal}{row.satuan}
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-amber-700 bg-amber-50/20">
                          {row.meiAchv}%
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-teal-700 bg-teal-50/20">
                          {row.junAchv}%
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-slate-600 bg-slate-50/30">
                          {row.julAchv}%
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-blue-700 bg-blue-50/20">
                          {row.aguAchv}%
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-red-700 bg-red-50/20">
                          {row.sepAchv}%
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isUp ? 'text-emerald-700 bg-emerald-50' : isDown ? 'text-red-700 bg-red-50' : 'text-slate-600 bg-slate-100'
                          }`}>
                            {isUp && <ArrowUpRight className="w-3 h-3 text-emerald-600" />}
                            {isDown && <ArrowDownRight className="w-3 h-3 text-red-600" />}
                            {row.momPencapaian > 0 ? `+${row.momPencapaian}%` : `${row.momPencapaian}%`}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.sepAchv >= 100
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {row.sepAchv >= 100 ? 'Memenuhi' : 'Perhatian'}
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

      {/* VIEW 2: PER SERVICE AREA ANALYSIS */}
      {viewMode === 'service_area' && selectedDetailServiceArea && (
        <ServiceAreaRevenueDetail
          serviceArea={selectedDetailServiceArea}
          currentDataset={currentDataset}
          selectedBulan={selectedBulan}
          allServiceAreas={allServiceAreas}
          onSelectServiceArea={(area) => setSelectedDetailServiceArea(area)}
          onBack={() => setSelectedDetailServiceArea(null)}
          onSelectBulan={onSelectBulan}
        />
      )}

      {viewMode === 'service_area' && !selectedDetailServiceArea && (
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
                  Rata-rata nilai performansi gabungan sektor pada masing-masing Service Area di Witel Madiun. Klik kartu Service Area untuk melihat sub-halaman rincian potensi revenue masing-masing sektor.
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

            {/* Grid of Service Area Cards (Clickable to open sub-halaman) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {serviceAreaStats.map((area, idx) => {
                const sectorsInArea = currentDataset.sectorRows.filter((s) => s.serviceArea === area.serviceArea);
                const totalSectorPotensiRev = sectorsInArea.reduce(
                  (acc, s) => acc + (s.perf / 100) * SECTOR_REVENUE_BASE,
                  0
                );

                return (
                  <div
                    key={area.serviceArea}
                    onClick={() => setSelectedDetailServiceArea(area.serviceArea)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedDetailServiceArea(area.serviceArea);
                      }
                    }}
                    className="bg-slate-50/90 hover:bg-white border border-slate-200/90 hover:border-red-400 hover:shadow-md rounded-xl p-3.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 flex items-center gap-1.5 group-hover:text-red-600 transition-colors">
                          <span className="w-5 h-5 rounded-full bg-slate-200 group-hover:bg-red-100 group-hover:text-red-700 text-slate-800 text-[10px] flex items-center justify-center font-bold">
                            #{idx + 1}
                          </span>
                          {area.serviceArea}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                            area.avgPerf >= 95 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
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
                          <strong className="text-slate-900 truncate max-w-[140px] text-right">
                            {area.topSektor.name} ({area.topSektor.perf}%)
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Rata-rata ASGAR:</span>
                          <span className="font-semibold text-slate-700">{area.avgAsgar}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Availability:</span>
                          <span className="font-semibold text-slate-700">{area.avgAvailability}%</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-200/50">
                          <span className="text-slate-500 font-semibold">Potensi Rev Sektor:</span>
                          <strong className="font-bold text-emerald-700 font-mono text-2xs">
                            {formatCurrencyIDR(totalSectorPotensiRev)}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 space-y-2">
                      <div className="flex items-center justify-between text-2xs">
                        <span className="text-slate-400">Status:</span>
                        <span className="font-bold text-emerald-600">Hak Imbal Jasa Aman</span>
                      </div>
                      <div className="pt-1.5 border-t border-dashed border-slate-200/80 flex items-center justify-between text-2xs font-extrabold text-red-600 group-hover:text-red-700">
                        <span>Lihat Potensi Revenue Sektor</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Radar Chart: Service Areas Multi-dimensional Comparison */}
          {(() => {
            const selectedRadarAreaStats = serviceAreaStats.find((s) => s.serviceArea === radarServiceAreaFilter);
            return (
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                      <span>Radar Profil Kualitas 6 Dimensi Service Area</span>
                      {radarServiceAreaFilter !== 'ALL' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-2xs font-extrabold flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" />
                          SA {radarServiceAreaFilter}
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Pemetaan kekuatan operasional antar Service Area meliputi SLA Garansi (ASGAR), Availability, TTR &lt; 24H, Valins DC, SQM Closed, dan Overall PERF.
                    </p>
                  </div>

                  {/* Filter Service Area Dropdown */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                        Filter Service Area:
                      </span>
                      <select
                        id="filter-radar-service-area-select"
                        value={radarServiceAreaFilter}
                        onChange={(e) => setRadarServiceAreaFilter(e.target.value)}
                        className="bg-white border border-emerald-300 rounded-md px-2.5 py-1 text-xs font-bold text-slate-900 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 cursor-pointer min-w-[190px]"
                      >
                        <option value="ALL">Semua Service Area (Multi-Area Compare)</option>
                        {allServiceAreas.map((sa) => (
                          <option key={sa} value={sa}>
                            SA {sa}
                          </option>
                        ))}
                      </select>
                    </div>

                    {radarServiceAreaFilter !== 'ALL' && (
                      <button
                        type="button"
                        onClick={() => setRadarServiceAreaFilter('ALL')}
                        className="px-2.5 py-1.5 text-2xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition cursor-pointer"
                      >
                        Reset ke Semua
                      </button>
                    )}
                  </div>
                </div>

                {/* 6-Dimension Score Cards (when a specific Service Area is selected) */}
                {selectedRadarAreaStats && (
                  <div className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              SERVICE_AREA_COLORS[selectedRadarAreaStats.serviceArea]?.stroke || '#059669',
                          }}
                        />
                        <span className="text-xs font-black text-slate-900">
                          Rincian 6 Dimensi Kualitas - SA {selectedRadarAreaStats.serviceArea} ({currentDataset.monthLabel})
                        </span>
                        <span className="text-2xs text-slate-500">
                          &bull; {selectedRadarAreaStats.sektorCount} Sektor (Top: {selectedRadarAreaStats.topSektor.name} {selectedRadarAreaStats.topSektor.perf}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-2xs flex-wrap">
                        <span className="text-slate-500">Rata-rata Performansi:</span>
                        <span
                          className={`font-black px-2 py-0.5 rounded ${
                            selectedRadarAreaStats.avgPerf >= 95
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {selectedRadarAreaStats.avgPerf}%
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedDetailServiceArea(selectedRadarAreaStats.serviceArea)}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-2xs font-extrabold transition shadow-2xs cursor-pointer ml-1"
                        >
                          <Coins className="w-3 h-3" />
                          <span>Rincian Revenue Sektor</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
                      {[
                        { label: 'ASGAR Guarantee', val: selectedRadarAreaStats.avgAsgar, target: 91.7, unit: '%' },
                        { label: 'Availability SLA', val: selectedRadarAreaStats.avgAvailability, target: 98.5, unit: '%' },
                        { label: 'TTR < 24H Non-HVC', val: selectedRadarAreaStats.avgTtr24, target: 91.1, unit: '%' },
                        { label: 'Valins DC QR', val: selectedRadarAreaStats.avgValinsDc, target: 95.0, unit: '%' },
                        { label: 'SQM Closed', val: selectedRadarAreaStats.avgClosedSqm, target: 70.0, unit: '%' },
                        { label: 'Overall PERF', val: selectedRadarAreaStats.avgPerf, target: 95.0, unit: '%' },
                      ].map((metric) => {
                        const isMeet = metric.val >= metric.target;
                        const diff = Number((metric.val - metric.target).toFixed(2));
                        return (
                          <div
                            key={metric.label}
                            className={`p-2.5 rounded-lg border transition ${
                              isMeet ? 'bg-white border-emerald-200 shadow-2xs' : 'bg-amber-50/80 border-amber-200'
                            }`}
                          >
                            <div className="text-[10px] font-semibold text-slate-500 truncate">{metric.label}</div>
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <span className={`text-sm font-black ${isMeet ? 'text-slate-900' : 'text-amber-700'}`}>
                                {metric.val}{metric.unit}
                              </span>
                              <span className="text-[10px] text-slate-400">/ {metric.target}{metric.unit}</span>
                            </div>
                            <div className="mt-1 flex items-center justify-between text-[10px]">
                              {isMeet ? (
                                <span className="text-emerald-700 font-bold flex items-center gap-0.5 text-2xs">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> +{diff}%
                                </span>
                              ) : (
                                <span className="text-amber-700 font-bold flex items-center gap-0.5 text-2xs">
                                  <AlertTriangle className="w-2.5 h-2.5" /> {diff}%
                                </span>
                              )}
                              <span className={`text-[9px] font-extrabold px-1 rounded ${isMeet ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                                {isMeet ? 'Aman' : 'Perlu Push'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Radar Chart Visual */}
                <div className="h-84 w-full flex items-center justify-center pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarAreaComparisonData} margin={{ top: 15, right: 35, bottom: 15, left: 35 }}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} />
                      <PolarRadiusAxis angle={30} domain={[40, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff', fontSize: '11px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                      {/* Standar Target Reference */}
                      <Radar
                        name="Target Standar"
                        dataKey="target"
                        stroke="#64748b"
                        fill="#64748b"
                        fillOpacity={0.05}
                        strokeDasharray="3 3"
                        strokeWidth={1.5}
                      />

                      {/* If ALL: Show all 7 Service Areas with distinctive styling */}
                      {radarServiceAreaFilter === 'ALL' && (
                        <>
                          {serviceAreaStats.map((sa) => {
                            const color = SERVICE_AREA_COLORS[sa.serviceArea] || { stroke: '#2563eb', fill: '#2563eb' };
                            return (
                              <Radar
                                key={sa.serviceArea}
                                name={`SA ${sa.serviceArea}`}
                                dataKey={sa.serviceArea}
                                stroke={color.stroke}
                                fill={color.fill}
                                fillOpacity={0.18}
                                strokeWidth={1.8}
                              />
                            );
                          })}
                        </>
                      )}

                      {/* If a specific Service Area is selected: Highlight that Service Area + show Branch Average benchmark */}
                      {radarServiceAreaFilter !== 'ALL' && (
                        <>
                          <Radar
                            name="Rata-rata Seluruh Branch"
                            dataKey="branchAverage"
                            stroke="#94a3b8"
                            fill="#94a3b8"
                            fillOpacity={0.12}
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                          />
                          <Radar
                            name={`SA ${radarServiceAreaFilter}`}
                            dataKey={radarServiceAreaFilter}
                            stroke={SERVICE_AREA_COLORS[radarServiceAreaFilter]?.stroke || '#059669'}
                            fill={SERVICE_AREA_COLORS[radarServiceAreaFilter]?.fill || '#059669'}
                            fillOpacity={0.38}
                            strokeWidth={2.5}
                          />
                        </>
                      )}
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* VIEW 3: GAP 17 INDIKATOR SLA & BOBOT KONTRIBUSI */}
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
