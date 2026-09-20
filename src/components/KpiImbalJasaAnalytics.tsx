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
  Calendar,
  ChevronRight,
  Check,
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

interface KpiImbalJasaAnalyticsProps {
  currentDataset: MonthKpiDataset;
  selectedBulan: KpiMonth;
  onSelectBulan: (bulan: KpiMonth) => void;
  onOpenRawImageModal?: () => void;
}

type AnalyticsViewMode = 'all_branch' | 'service_area' | 'sektor' | 'indicators';

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
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('ALL');
  const [metricFocus, setMetricFocus] = useState<'perf' | 'asgar' | 'serviceAvailability' | 'ttr24hNonHvc' | 'closedSqm'>('perf');

  const [trendScaleMode, setTrendScaleMode] = useState<'achievement' | 'zoom' | 'standard'>('achievement');
  const [indicatorTrendFilter, setIndicatorTrendFilter] = useState<'ALL' | 'TTR' | 'SLA_AVAIL' | 'FIELD' | 'SQM_TOOLS'>('ALL');
  const [selectedIndicatorFilter, setSelectedIndicatorFilter] = useState<number | 'ALL'>('ALL');
  const [selectedServiceAreaFilter, setSelectedServiceAreaFilter] = useState<string>('ALL');
  const [indicatorValueMetric, setIndicatorValueMetric] = useState<'pencapaian' | 'realisasi'>('pencapaian');
  const [radarServiceAreaFilter, setRadarServiceAreaFilter] = useState<string>('ALL');

  // Sector comparison selection
  const [compareSectorA, setCompareSectorA] = useState<string>(
    currentDataset.sectorRows[0]?.sektor || 'TRENGGALEK'
  );
  const [compareSectorB, setCompareSectorB] = useState<string>(
    currentDataset.sectorRows[currentDataset.sectorRows.length - 1]?.sektor || 'PONOROGO 1'
  );

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

      if (selectedServiceAreaFilter === 'ALL') {
        const perf = data.summary.perfBranch;
        const totalSkor = data.summary.totalSkor;
        const pencapaianRataRata = data.summary.pencapaianRataRata;
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

      const pencapaianRataRata = sumAchv / (KPI_INDICATOR_SPECS.length || 1);
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
  }, [selectedServiceAreaFilter]);

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

  // Filtered indicator trend list based on KPI dropdown and/or category group
  const filteredIndicatorTrends = useMemo(() => {
    let list = multiMonthIndicatorTrends;
    if (selectedIndicatorFilter !== 'ALL') {
      list = list.filter((item) => item.no === selectedIndicatorFilter);
    } else if (indicatorTrendFilter !== 'ALL') {
      list = list.filter((item) => item.categoryGroup === indicatorTrendFilter);
    }
    return list;
  }, [multiMonthIndicatorTrends, selectedIndicatorFilter, indicatorTrendFilter]);

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
                      ? '100% Hak Imbal Jasa Lunas (Konsisten > 95%)'
                      : `Hak Imbal Jasa SA ${selectedServiceAreaFilter}`}
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
                          {selectedServiceAreaFilter === 'ALL' ? 'Performansi Branch' : `Performansi SA ${selectedServiceAreaFilter}`}
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-red-600" />
                  <span>
                    Grafik Kombo: Nilai Pencapaian KPI Setiap Bulan &amp; Trend Performansi
                    {selectedServiceAreaFilter !== 'ALL' && (
                      <span className="ml-2 text-2xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        SA {selectedServiceAreaFilter}
                      </span>
                    )}
                  </span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Menampilkan Batang Pencapaian KPI (Biru), Batang Nilai Realisasi{' '}
                  {selectedServiceAreaFilter !== 'ALL' ? `SA ${selectedServiceAreaFilter}` : 'Branch'} (Merah), serta Garis Tren Skor Terbobot (Amber).
                </p>
              </div>

              {/* Mode scale toggles */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
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
                    Zoom Sensitif (97% - 100.5%)
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
                    Skala Penuh (80% - 120%)
                  </button>
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
                      selectedServiceAreaFilter !== 'ALL'
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
                  <strong className="text-blue-900 font-bold block">Pencapaian KPI Rata-Rata: 109.32%</strong>
                  <p className="text-blue-700 text-2xs mt-0.5">
                    Mengalami tren peningkatan berkelanjutan dari Juli (108.40%) &rarr; Agustus (108.97%) &rarr; September (109.32%).
                  </p>
                </div>
              </div>

              <div className="p-3 bg-red-50/60 rounded-xl border border-red-200/60 flex items-start gap-2.5">
                <span className="w-3 h-3 rounded-full bg-red-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-red-900 font-bold block">Skor Performansi Branch: 99.51%</strong>
                  <p className="text-red-700 text-2xs mt-0.5">
                    Realisasi performansi branch melampaui target imbal jasa 95.0% di seluruh bulan dengan puncak di September (99.51%).
                  </p>
                </div>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 flex items-start gap-2.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-900 font-bold block">Skor Terbobot KPI: 98.51 / 100</strong>
                  <p className="text-amber-700 text-2xs mt-0.5">
                    Tren akumulasi skor berbobot konsisten prima dengan recovery kuat di September setelah sedikit variasi di Agustus (98.19).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN CHART 2: KOMPARASI TREN PENCAPAIAN INDIKATOR BULANAN DENGAN SISTEM FILTER */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Komparasi Tren Nilai Indikator KPI Bulanan (Mei s/d September)</span>
                  </h4>
                  {selectedIndicatorFilter !== 'ALL' && (
                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                      Filter Aktif: No. {selectedIndicatorFilter}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pilih indikator spesifik melalui dropdown filter KPI atau kategori untuk melihat visualisasi tren grafik dan data tabel yang tersinkronisasi.
                </p>
              </div>

              {/* Filter Controls Row */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Metric toggle */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-2xs font-bold">
                  <button
                    type="button"
                    onClick={() => setIndicatorValueMetric('pencapaian')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      indicatorValueMetric === 'pencapaian'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    % Pencapaian Target
                  </button>
                  <button
                    type="button"
                    onClick={() => setIndicatorValueMetric('realisasi')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      indicatorValueMetric === 'realisasi'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Nilai Realisasi Aktual
                  </button>
                </div>

                {/* Quick Category filter buttons */}
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-2xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setIndicatorTrendFilter('ALL');
                      setSelectedIndicatorFilter('ALL');
                    }}
                    className={`px-2 py-1 rounded-md transition cursor-pointer ${
                      indicatorTrendFilter === 'ALL' && selectedIndicatorFilter === 'ALL'
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-600'
                    }`}
                  >
                    Semua ({multiMonthIndicatorTrends.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIndicatorTrendFilter('TTR');
                      setSelectedIndicatorFilter('ALL');
                    }}
                    className={`px-2 py-1 rounded-md transition cursor-pointer ${
                      indicatorTrendFilter === 'TTR' && selectedIndicatorFilter === 'ALL'
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-600'
                    }`}
                  >
                    TTR Speed
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIndicatorTrendFilter('SLA_AVAIL');
                      setSelectedIndicatorFilter('ALL');
                    }}
                    className={`px-2 py-1 rounded-md transition cursor-pointer ${
                      indicatorTrendFilter === 'SLA_AVAIL' && selectedIndicatorFilter === 'ALL'
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-600'
                    }`}
                  >
                    ASGAR &amp; Avail
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIndicatorTrendFilter('FIELD');
                      setSelectedIndicatorFilter('ALL');
                    }}
                    className={`px-2 py-1 rounded-md transition cursor-pointer ${
                      indicatorTrendFilter === 'FIELD' && selectedIndicatorFilter === 'ALL'
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-600'
                    }`}
                  >
                    Validasi Lapangan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIndicatorTrendFilter('SQM_TOOLS');
                      setSelectedIndicatorFilter('ALL');
                    }}
                    className={`px-2 py-1 rounded-md transition cursor-pointer ${
                      indicatorTrendFilter === 'SQM_TOOLS' && selectedIndicatorFilter === 'ALL'
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-600'
                    }`}
                  >
                    SQM &amp; Alat
                  </button>
                </div>
              </div>
            </div>

            {/* Dropdown KPI & Service Area Selector Bar */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                {/* 1. Filter Dropdown KPI */}
                <div className="flex items-center gap-2 flex-1 min-w-[260px]">
                  <Filter className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                    Pilih Dropdown KPI:
                  </span>
                  <select
                    id="filter-dropdown-kpi-select"
                    value={selectedIndicatorFilter}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedIndicatorFilter(val === 'ALL' ? 'ALL' : Number(val));
                    }}
                    className="bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 w-full cursor-pointer"
                  >
                    <option value="ALL">-- Tampilkan Semua Indikator KPI (17 Indikator) --</option>
                    <optgroup label="Kelompok SLA & Availibility">
                      {multiMonthIndicatorTrends
                        .filter((i) => i.categoryGroup === 'SLA_AVAIL')
                        .map((ind) => (
                          <option key={ind.no} value={ind.no}>
                            {ind.no}. {ind.name} (Target: {ind.target}{ind.satuan} | Bobot: {ind.bobot}%)
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Kelompok Kecepatan Perbaikan (TTR Speed)">
                      {multiMonthIndicatorTrends
                        .filter((i) => i.categoryGroup === 'TTR')
                        .map((ind) => (
                          <option key={ind.no} value={ind.no}>
                            {ind.no}. {ind.name} (Target: {ind.target}{ind.satuan} | Bobot: {ind.bobot}%)
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Kelompok Validasi Lapangan & Saldo Tiket">
                      {multiMonthIndicatorTrends
                        .filter((i) => i.categoryGroup === 'FIELD')
                        .map((ind) => (
                          <option key={ind.no} value={ind.no}>
                            {ind.no}. {ind.name} (Target: {ind.target}{ind.satuan} | Bobot: {ind.bobot}%)
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Kelompok SQM & Alat Kerja Teknisi">
                      {multiMonthIndicatorTrends
                        .filter((i) => i.categoryGroup === 'SQM_TOOLS')
                        .map((ind) => (
                          <option key={ind.no} value={ind.no}>
                            {ind.no}. {ind.name} (Target: {ind.target}{ind.satuan} | Bobot: {ind.bobot}%)
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </div>

                {/* 2. Filter Service Area (di samping kanan menu Pilih Dropdown KPI) */}
                <div className="flex items-center gap-2 shrink-0 sm:w-auto">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                    Service Area:
                  </span>
                  <select
                    id="filter-service-area-select"
                    value={selectedServiceAreaFilter}
                    onChange={(e) => setSelectedServiceAreaFilter(e.target.value)}
                    className="bg-white border border-emerald-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 min-w-[170px] cursor-pointer"
                  >
                    <option value="ALL">Semua Service Area (All Branch)</option>
                    {allServiceAreas.map((sa) => (
                      <option key={sa} value={sa}>
                        SA {sa}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status or Reset Action */}
              <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                <span className="text-2xs font-semibold text-slate-500">
                  Menampilkan: <strong className="text-indigo-900">{filteredIndicatorTrends.length} KPI</strong>
                  {selectedServiceAreaFilter !== 'ALL' && (
                    <span className="ml-1 text-emerald-700 font-bold">
                      &bull; SA {selectedServiceAreaFilter}
                    </span>
                  )}
                </span>
                {(selectedIndicatorFilter !== 'ALL' || indicatorTrendFilter !== 'ALL' || selectedServiceAreaFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedIndicatorFilter('ALL');
                      setIndicatorTrendFilter('ALL');
                      setSelectedServiceAreaFilter('ALL');
                    }}
                    className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-2xs font-bold transition cursor-pointer shadow-2xs"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            </div>

            {/* Single KPI Detailed Highlight Card if 1 KPI selected */}
            {selectedIndicatorFilter !== 'ALL' && filteredIndicatorTrends[0] && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50/90 via-slate-50 to-blue-50/70 border border-indigo-100/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-extrabold text-2xs">
                      KPI #{filteredIndicatorTrends[0].no}
                    </span>
                    {selectedServiceAreaFilter !== 'ALL' && (
                      <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-2xs flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        SA {selectedServiceAreaFilter}
                      </span>
                    )}
                    <h5 className="text-sm font-black text-slate-900">
                      {filteredIndicatorTrends[0].name}
                    </h5>
                    <span className="text-2xs font-semibold text-slate-500">
                      ({filteredIndicatorTrends[0].code})
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Kategori: <strong>{filteredIndicatorTrends[0].kategori}</strong> &bull; Target Standar:{' '}
                    <strong>{filteredIndicatorTrends[0].target}{filteredIndicatorTrends[0].satuan}</strong> &bull; Bobot:{' '}
                    <strong>{filteredIndicatorTrends[0].bobot}%</strong>
                    {selectedServiceAreaFilter !== 'ALL' && (
                      <span className="text-emerald-700 font-semibold"> &bull; Nilai Realisasi dihitung dari rata-rata sektor di SA {selectedServiceAreaFilter}</span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] text-amber-600 font-semibold block">Mei 2026</span>
                    <span className="text-xs font-bold text-slate-700">
                      {filteredIndicatorTrends[0].meiReal}{filteredIndicatorTrends[0].satuan} ({filteredIndicatorTrends[0].meiAchv}%)
                    </span>
                  </div>
                  <div className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] text-teal-600 font-semibold block">Juni 2026</span>
                    <span className="text-xs font-bold text-slate-700">
                      {filteredIndicatorTrends[0].junReal}{filteredIndicatorTrends[0].satuan} ({filteredIndicatorTrends[0].junAchv}%)
                    </span>
                  </div>
                  <div className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-500 font-semibold block">Juli 2026</span>
                    <span className="text-xs font-bold text-slate-700">
                      {filteredIndicatorTrends[0].julReal}{filteredIndicatorTrends[0].satuan} ({filteredIndicatorTrends[0].julAchv}%)
                    </span>
                  </div>
                  <div className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] text-blue-500 font-semibold block">Agustus 2026</span>
                    <span className="text-xs font-bold text-blue-700">
                      {filteredIndicatorTrends[0].aguReal}{filteredIndicatorTrends[0].satuan} ({filteredIndicatorTrends[0].aguAchv}%)
                    </span>
                  </div>
                  <div className="bg-white px-2.5 py-1.5 rounded-lg border border-red-200 text-center">
                    <span className="text-[10px] text-red-500 font-semibold block">September 2026</span>
                    <span className="text-xs font-bold text-red-700">
                      {filteredIndicatorTrends[0].sepReal}{filteredIndicatorTrends[0].satuan} ({filteredIndicatorTrends[0].sepAchv}%)
                    </span>
                  </div>
                  <div className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-500 font-semibold block">Trend MoM</span>
                    <span className={`text-xs font-bold flex items-center justify-center gap-0.5 ${
                      filteredIndicatorTrends[0].momPencapaian > 0 ? 'text-emerald-600' : filteredIndicatorTrends[0].momPencapaian < 0 ? 'text-red-600' : 'text-slate-600'
                    }`}>
                      {filteredIndicatorTrends[0].momPencapaian > 0 ? '+' : ''}{filteredIndicatorTrends[0].momPencapaian}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Indicator Grouped Bar Chart */}
            <div className="w-full" style={{ height: 340, minHeight: 340 }}>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart
                  data={filteredIndicatorTrends}
                  margin={{ top: 15, right: 20, left: -10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="shortName"
                    tick={{ fontSize: 10, fill: '#475569' }}
                    interval={0}
                    angle={filteredIndicatorTrends.length > 3 ? -20 : 0}
                    textAnchor={filteredIndicatorTrends.length > 3 ? 'end' : 'middle'}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    unit={indicatorValueMetric === 'pencapaian' ? '%' : ''}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                    formatter={(val: any, name: any, item: any) => {
                      const ind = item.payload;
                      const unit = indicatorValueMetric === 'pencapaian' ? '%' : ind.satuan;
                      return [`${val} ${unit}`, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }} />

                  {indicatorValueMetric === 'pencapaian' && (
                    <ReferenceLine
                      y={100}
                      stroke="#10b981"
                      strokeDasharray="3 3"
                      label={{ value: 'Target 100%', fill: '#059669', fontSize: 10, position: 'top' }}
                    />
                  )}

                  <Bar
                    dataKey={indicatorValueMetric === 'pencapaian' ? 'meiAchv' : 'meiReal'}
                    name="Mei 2026"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                    barSize={filteredIndicatorTrends.length === 1 ? 48 : undefined}
                  >
                    <LabelList
                      dataKey={indicatorValueMetric === 'pencapaian' ? 'meiAchv' : 'meiReal'}
                      position="top"
                      fontSize={10}
                      fill="#b45309"
                      formatter={(v: any) => `${v}${indicatorValueMetric === 'pencapaian' ? '%' : ''}`}
                    />
                  </Bar>
                  <Bar
                    dataKey={indicatorValueMetric === 'pencapaian' ? 'junAchv' : 'junReal'}
                    name="Juni 2026"
                    fill="#0d9488"
                    radius={[4, 4, 0, 0]}
                    barSize={filteredIndicatorTrends.length === 1 ? 48 : undefined}
                  >
                    <LabelList
                      dataKey={indicatorValueMetric === 'pencapaian' ? 'junAchv' : 'junReal'}
                      position="top"
                      fontSize={10}
                      fill="#0f766e"
                      formatter={(v: any) => `${v}${indicatorValueMetric === 'pencapaian' ? '%' : ''}`}
                    />
                  </Bar>
                  <Bar
                    dataKey={indicatorValueMetric === 'pencapaian' ? 'julAchv' : 'julReal'}
                    name="Juli 2026"
                    fill="#94a3b8"
                    radius={[4, 4, 0, 0]}
                    barSize={filteredIndicatorTrends.length === 1 ? 48 : undefined}
                  >
                    <LabelList
                      dataKey={indicatorValueMetric === 'pencapaian' ? 'julAchv' : 'julReal'}
                      position="top"
                      fontSize={10}
                      fill="#475569"
                      formatter={(v: any) => `${v}${indicatorValueMetric === 'pencapaian' ? '%' : ''}`}
                    />
                  </Bar>
                  <Bar
                    dataKey={indicatorValueMetric === 'pencapaian' ? 'aguAchv' : 'aguReal'}
                    name="Agustus 2026"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    barSize={filteredIndicatorTrends.length === 1 ? 48 : undefined}
                  >
                    <LabelList
                      dataKey={indicatorValueMetric === 'pencapaian' ? 'aguAchv' : 'aguReal'}
                      position="top"
                      fontSize={10}
                      fill="#1d4ed8"
                      formatter={(v: any) => `${v}${indicatorValueMetric === 'pencapaian' ? '%' : ''}`}
                    />
                  </Bar>
                  <Bar
                    dataKey={indicatorValueMetric === 'pencapaian' ? 'sepAchv' : 'sepReal'}
                    name="September 2026"
                    fill="#dc2626"
                    radius={[4, 4, 0, 0]}
                    barSize={filteredIndicatorTrends.length === 1 ? 48 : undefined}
                  >
                    <LabelList
                      dataKey={indicatorValueMetric === 'pencapaian' ? 'sepAchv' : 'sepReal'}
                      position="top"
                      fontSize={10}
                      fill="#b91c1c"
                      fontWeight={700}
                      formatter={(v: any) => `${v}${indicatorValueMetric === 'pencapaian' ? '%' : ''}`}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
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
                    Tabel Rekap Nilai Pencapaian &amp; Realisasi Indikator KPI Bulanan
                    {selectedIndicatorFilter !== 'ALL' ? ` (Filtered: KPI No. ${selectedIndicatorFilter})` : ` (${filteredIndicatorTrends.length} Indikator)`}
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
                {(selectedIndicatorFilter !== 'ALL' || selectedServiceAreaFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedIndicatorFilter('ALL');
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
                  {filteredIndicatorTrends.map((row) => {
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
                      <div className="flex items-center gap-2 text-2xs">
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
