import React, { useState, useMemo, useEffect } from 'react';
import { RegionalPerformanceData, Regional } from '../types';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart
} from 'recharts';
import {
  UserPlus,
  Clock,
  Ban,
  CheckCircle,
  RotateCcw,
  AlertCircle,
  Filter,
  Calendar,
  MapPin,
  Layers,
  Table as TableIcon,
  PieChart as PieChartIcon,
  Info,
  TrendingUp,
  TrendingDown,
  Activity,
  FileSpreadsheet,
  Globe,
  ArrowLeft,
  Search,
  Package,
  Award,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { rawProvisioningData, ProvisioningRow } from '../data/provisioningStats';
import { parseCSV } from '../lib/googleSheets';
import InteractiveCoordinatesMap from './InteractiveCoordinatesMap';
import AIEvaluationModal, { AIEvaluationButton } from './AIEvaluationModal';

// Maps parsed 2D CSV array to ProvisioningRow model
export function mapRowsToProvisioning(rows: string[][]): ProvisioningRow[] {
  const records: ProvisioningRow[] = [];
  
  // Find the header row dynamically
  let startIdx = 1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    if (row && row.some(cell => {
      const c = String(cell).toLowerCase();
      return c.includes('sc order') || c.includes('sektor') || c.includes('status') || c.includes('sa');
    })) {
      startIdx = i + 1;
      break;
    }
  }

  for (let i = startIdx; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 9) continue;
    
    // Check if the row is entirely empty
    if (row.every(cell => cell === null || cell === '')) {
      continue;
    }

    const getVal = (idx: number, fallback = '') => {
      return (row[idx] !== undefined && row[idx] !== null) ? String(row[idx]).trim() : fallback;
    };

    const scOrder = getVal(7); // Column H
    const status = getVal(8); // Column I
    const sektor = getVal(1); // Column B
    const sa = getVal(2); // Column C
    
    // Skip row if it does not have the essential SC Order identifier
    if (!scOrder && !sektor && !sa) continue;

    // Parse Tahun (S) and Bulan (T)
    const tahunStr = getVal(18); // Column S
    let tahun = parseInt(tahunStr, 10);
    if (isNaN(tahun)) {
      tahun = 2026;
    }

    const bulanStr = getVal(19); // Column T
    let bulan = parseInt(bulanStr, 10);
    if (isNaN(bulan)) {
      bulan = 1;
    }

    records.push({
      tahun,
      bulan,
      sektor: sektor || 'UNKNOWN',
      sa: sa || 'UNKNOWN',
      scOrder: scOrder || 'UNKNOWN',
      orderId: getVal(22, '') || scOrder || 'UNKNOWN', // WONUM or SC Order
      customerName: getVal(36, ''), // Column AK (CUSTOMER_NAME)
      status: status || 'BLANK',
      errorCode: getVal(10, '#N/A'), // Column K
      subErrorCode: getVal(11, '#N/A'), // Column L
      statusDated: getVal(12, ''), // Column M
      updatedLapangan: getVal(13, 'BLANK'), // Column N
      segment: getVal(20, 'Indihome'), // Column U
      sto: getVal(27, 'UNKNOWN'), // Column AB
      packageName: getVal(32, 'EAI-WSA'), // Column AG
      latitude: getVal(39, ''), // Column AN
      longitude: getVal(40, ''), // Column AO
      homepassId: getVal(9, ''), // Column J
      pensolusian: getVal(15, ''), // Column P
    });
  }
  return records;
}

// Maps parsed 2D CSV array from "GD INDIBIZZ NEW" sheet to ProvisioningRow model
export function mapIndibizzRowsToProvisioning(rows: string[][]): ProvisioningRow[] {
  const records: ProvisioningRow[] = [];
  if (!rows || rows.length < 2) return records;

  let startIdx = 1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    if (row && row.some(cell => {
      const c = String(cell).toLowerCase();
      return c.includes('order_id') || c.includes('order id') || c.includes('status kpro') || c.includes('package_name');
    })) {
      startIdx = i + 1;
      break;
    }
  }

  // Column positions for GD INDIBIZZ NEW:
  // Kolom BG = index 58 (Header "PS" -> Error Code)
  // Kolom BH = index 59 (Header "SURVEY PT.1" -> Sub Error Code)
  let colOrderIdIdx = 2;       // KOLOM C
  let colStoIdx = 8;           // KOLOM I
  let colOrderDateIdx = 15;    // KOLOM P
  let colCustomerNameIdx = 20; // KOLOM U
  let colLongitudeIdx = 26;    // KOLOM AA
  let colLatitudeIdx = 27;     // KOLOM AB
  let colChannelIdx = 29;      // KOLOM AD
  let colPackageNameIdx = 49;  // KOLOM AX
  let colBgIdx = 58;           // KOLOM BG (Header "PS" -> Error Code)
  let colBhIdx = 59;           // KOLOM BH (Header "SURVEY PT.1" -> Sub Error Code)
  let colStatusKproIdx = 71;   // KOLOM BT
  let colSaIdx = 72;           // KOLOM BU

  // Dynamically verify header indices if available in header row
  if (rows.length > 0) {
    const headerRow = rows[Math.max(0, startIdx - 1)];
    headerRow.forEach((cell, idx) => {
      const h = String(cell || '').trim().toUpperCase();
      if (h === 'PS') colBgIdx = idx;
      else if (h === 'SURVEY PT.1' || h === 'SURVEY PT1') colBhIdx = idx;
      else if (h === 'ORDER_ID' || h === 'ORDER ID') colOrderIdIdx = idx;
      else if (h === 'STO') colStoIdx = idx;
      else if (h === 'ORDER_DATE' || h === 'ORDER DATE') colOrderDateIdx = idx;
      else if (h === 'CUSTOMER_NAME' || h === 'CUSTOMER NAME') colCustomerNameIdx = idx;
      else if (h === 'GPS_LONGITUDE') colLongitudeIdx = idx;
      else if (h === 'GPS_LATITUDE') colLatitudeIdx = idx;
      else if (h === 'CHANNEL') colChannelIdx = idx;
      else if (h === 'PACKAGE_NAME' || h === 'PACKAGE NAME') colPackageNameIdx = idx;
      else if (h === 'STATUS KPRO' || h === 'STATUS_KPRO') colStatusKproIdx = idx;
      else if (h === 'SERVICE AREA' || h === 'SERVICE_AREA') colSaIdx = idx;
    });
  }

  for (let i = startIdx; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 4) continue;
    if (row.every(cell => cell === null || cell === '')) continue;

    const getVal = (idx: number, fallback = '') => {
      return (row[idx] !== undefined && row[idx] !== null) ? String(row[idx]).trim() : fallback;
    };

    const orderId = getVal(colOrderIdIdx) || getVal(2);
    const sto = (getVal(colStoIdx) || getVal(8, 'UNKNOWN')).toUpperCase();
    const orderDateStr = getVal(colOrderDateIdx) || getVal(15);
    const customerName = getVal(colCustomerNameIdx) || getVal(20);
    const longitude = getVal(colLongitudeIdx) || getVal(26);
    const latitude = getVal(colLatitudeIdx) || getVal(27);
    const channel = getVal(colChannelIdx) || getVal(29);
    const packageName = getVal(colPackageNameIdx) || getVal(49, 'Indibizz');
    const rawStatus = getVal(colStatusKproIdx) || getVal(71, '#N/A');
    const sa = getVal(colSaIdx) || getVal(72, 'MADIUN') || 'MADIUN';

    if (!orderId && !sto && !orderDateStr) continue;

    // Parse month & year from ORDER_DATE (as filter reference)
    let bulan = 1;
    let tahun = 2026;
    if (orderDateStr) {
      const matchDmy = orderDateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (matchDmy) {
        const d = parseInt(matchDmy[1], 10);
        const m = parseInt(matchDmy[2], 10);
        const y = parseInt(matchDmy[3], 10);
        if (m >= 1 && m <= 12) bulan = m;
        if (y >= 2000 && y <= 2100) tahun = y;
      } else {
        const colAMonth = parseInt(getVal(0), 10);
        if (!isNaN(colAMonth) && colAMonth >= 1 && colAMonth <= 12) {
          bulan = colAMonth;
        }
      }
    } else {
      const colAMonth = parseInt(getVal(0), 10);
      if (!isNaN(colAMonth) && colAMonth >= 1 && colAMonth <= 12) {
        bulan = colAMonth;
      }
    }

    // Normalize Status Kpro
    let status = rawStatus || '#N/A';
    if (rawStatus.toUpperCase() === 'COMPLETED') {
      status = 'COMPWORK';
    } else if (rawStatus.toUpperCase() === 'CANCEL') {
      status = 'CANCLWORK';
    }

    // Determine field status (updatedLapangan)
    let updatedLapangan = 'BLANK';
    const uStatus = status.toUpperCase();
    if (uStatus === 'COMPWORK' || uStatus === 'COMPLETED' || uStatus === 'COMPLETE') {
      updatedLapangan = 'COMPLETED';
    } else if (uStatus === 'CANCLWORK' || uStatus === 'CANCEL' || uStatus === 'WORKFAIL') {
      updatedLapangan = 'WORKFAIL';
    } else if (uStatus === 'STARTWORK') {
      updatedLapangan = 'STARTWORK';
    }

    // Derive sektor from STO or Service Area
    let sektor = 'MADIUN';
    if (sto === 'CRB') sektor = 'MADIUN_2';
    else if (sto === 'MNZ') sektor = 'MADIUN_1';
    else if (sto === 'MSP' || sto === 'UTR') sektor = 'MADIUN_3';
    else if (sa) sektor = sa;

    // Error Code (K) from Kolom BG (index 58), Sub Error Code (L) from Kolom BH (index 59)
    let errorCode = getVal(colBgIdx) || getVal(58);
    if (!errorCode || errorCode === '#N/A' || errorCode === '-' || errorCode === 'null') {
      errorCode = getVal(43) || getVal(51) || '#N/A';
    }

    let subErrorCode = getVal(colBhIdx) || getVal(59);
    if (!subErrorCode || subErrorCode === '#N/A' || subErrorCode === '-' || subErrorCode === 'null') {
      subErrorCode = getVal(64) || getVal(55) || getVal(52) || '#N/A';
    }

    records.push({
      tahun,
      bulan,
      sektor,
      sa,
      scOrder: orderId || 'UNKNOWN',
      orderId,
      customerName,
      status,
      errorCode,
      subErrorCode,
      statusDated: orderDateStr,
      updatedLapangan,
      segment: 'Indibizz',
      sto,
      packageName,
      latitude,
      longitude,
      channel,
      homepassId: getVal(21, ''),
      pensolusian: getVal(56, ''),
    });
  }

  return records;
}

// Generates realistic, deterministic high-fidelity data for 2026 Q1 (Jan, Feb, Mar)
export function generate2026Q1Data(): ProvisioningRow[] {
  const records: ProvisioningRow[] = [];
  
  const SECTOR_CONFIGS = [
    { sektor: 'MADIUN', sa: 'MADIUN', sto: 'MNZ' },
    { sektor: 'PONOROGO', sa: 'PONOROGO', sto: 'PON' },
    { sektor: 'NGAWI', sa: 'MAGETAN', sto: 'NWI' },
    { sektor: 'MAGETAN', sa: 'MAGETAN', sto: 'MGT' },
    { sektor: 'PACITAN', sa: 'PONOROGO', sto: 'PAC' },
    { sektor: 'BOJONEGORO', sa: 'BOJONEGORO', sto: 'BOJ' },
    { sektor: 'TUBAN', sa: 'TUBAN', sto: 'TUB' },
    { sektor: 'LAMONGAN', sa: 'LAMONGAN', sto: 'LMG' }
  ];

  const SECTOR_COORDS: Record<string, { lat: number, lng: number }> = {
    'MADIUN': { lat: -7.6298, lng: 111.5239 },
    'PONOROGO': { lat: -7.8687, lng: 111.4616 },
    'NGAWI': { lat: -7.4022, lng: 111.4442 },
    'MAGETAN': { lat: -7.6534, lng: 111.3323 },
    'PACITAN': { lat: -8.2040, lng: 111.1025 },
    'BOJONEGORO': { lat: -7.1502, lng: 111.8818 },
    'TUBAN': { lat: -6.8976, lng: 111.9023 },
    'LAMONGAN': { lat: -7.1213, lng: 112.4156 }
  };

  const SEGMENTS = ['Indihome', 'PDA', 'Indibizz'];
  const PACKAGES = ['EAI-WSA', 'EZnet 20 Mbps', '50 Mbps Internet', 'One Dynamic 20Mbps+30GB'];
  const STATUSES = ['COMPWORK', 'COMPWORK', 'COMPWORK', 'COMPWORK', 'COMPWORK', 'COMPWORK', 'CANCLWORK', 'PENDING'];
  const ERROR_CODES = ['KENDALA TEKNIK', 'KENDALA PELANGGAN'];
  const SUB_ERROR_CODES: Record<string, string[]> = {
    'KENDALA TEKNIK': ['ODP JAUH', 'BLANK FO', 'CABLE CUT', 'ODP FULL'],
    'KENDALA PELANGGAN': ['PEMBATALAN PELANGGAN', 'ALAMAT TIDAK DITEMUKAN', 'RUMAH KOSONG']
  };

  // Deterministic seed-based RNG
  let seed = 88;
  function random(): number {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  function randomElement<T>(arr: T[]): T {
    return arr[Math.floor(random() * arr.length)];
  }

  const months = [
    { m: 1, count: 540 }, // Januari
    { m: 2, count: 590 }, // Februari
    { m: 3, count: 650 }  // Maret
  ];

  months.forEach(({ m, count }) => {
    for (let i = 0; i < count; i++) {
      const config = randomElement(SECTOR_CONFIGS);
      const segment = random() < 0.85 ? 'Indihome' : randomElement(SEGMENTS);
      const status = randomElement(STATUSES);
      
      let errorCode = '#N/A';
      let subErrorCode = '#N/A';
      let updatedLapangan = 'COMPLETED';
      let pensolusian = '';
      
      if (status === 'CANCLWORK') {
        errorCode = randomElement(ERROR_CODES);
        subErrorCode = randomElement(SUB_ERROR_CODES[errorCode] || ['ODP JAUH']);
        updatedLapangan = 'WORKFAIL';
      } else if (status === 'PENDING') {
        errorCode = 'PNDING';
        subErrorCode = 'MENUNGGU ODP';
        updatedLapangan = 'PENDING';
      } else {
        // COMPWORK status - generate some pensolusian values
        const pRoll = random();
        if (pRoll < 0.12) {
          pensolusian = 'Pensolusian Precon';
        } else if (pRoll < 0.22) {
          pensolusian = 'Pensolusian Tiang Mandiri';
        } else if (pRoll < 0.30) {
          pensolusian = 'Pensolusian ODP Baru/Jauh';
        } else if (pRoll < 0.38) {
          pensolusian = 'Pensolusian Dropwire / Re-Routing';
        } else {
          pensolusian = 'NORMAL';
        }
      }

      const idNum = Math.floor(100000 + random() * 900000);
      const scOrder = `AOi${m}260${m}01${idNum}`;

      const baseCoord = SECTOR_COORDS[config.sektor] || { lat: -7.6, lng: 111.5 };
      const jitterLat = (random() - 0.5) * 0.15;
      const jitterLng = (random() - 0.5) * 0.15;
      const latitude = (baseCoord.lat + jitterLat).toFixed(6);
      const longitude = (baseCoord.lng + jitterLng).toFixed(6);

      const sampleCustomer = segment === 'Indibizz'
        ? randomElement(['TOKO PAK YUSUF', 'MIN 5 MADIUN', 'PT. SAHABAT MANDIRI MOTOR', 'SDN GULUN 1', 'BANK ARTHAYA MADIUN', 'KLINIK SEHAT MEDIKA', 'CV. GRAHA KENCANA', 'HOTEL ASRI MADIUN'])
        : randomElement(['Bpk. Agus Santoso', 'Ibu Sri Wahyuni', 'Bpk. Bambang Sutrisno', 'Ibu Siti Rahmawati', 'Bpk. Eko Prasetyo', 'Ibu Nurul Hidayah', 'Bpk. Hendra Wijaya', 'Ibu Dewi Sartika']);

      records.push({
        tahun: 2026,
        bulan: m,
        sektor: config.sektor,
        sa: config.sa,
        scOrder,
        orderId: scOrder,
        customerName: sampleCustomer,
        status,
        errorCode,
        subErrorCode,
        statusDated: `${m}/${Math.floor(1 + random() * 28)}/2026`,
        updatedLapangan,
        segment,
        sto: config.sto,
        packageName: randomElement(PACKAGES),
        latitude,
        longitude,
        homepassId: random() < 0.18 ? 'HOMEPASSID' : '',
        pensolusian,
      });
    }
  });

  return records;
}

interface ProvisioningDashboardProps {
  data: RegionalPerformanceData;
  allRegionsData: { [key: string]: RegionalPerformanceData };
  activeRegional: Regional;
  provisioningData: ProvisioningRow[];
  activeSubTab?: 'sektor' | 'tabel' | 'peta';
  setActiveSubTab?: (val: 'sektor' | 'tabel' | 'peta') => void;
}

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const SEGMENT_COLORS_MAP: Record<string, { color: string; stroke: string; label: string; bgClass: string }> = {
  'Indihome': { color: '#EF4444', stroke: '#000000', label: 'Indihome', bgClass: 'bg-red-500' },
  'Indibizz': { color: '#818CF8', stroke: '#000000', label: 'Indibizz', bgClass: 'bg-indigo-400' },
  'PDA': { color: '#F6BD60', stroke: '#000000', label: 'PDA', bgClass: 'bg-amber-300' },
  'MO': { color: '#59B4C3', stroke: '#000000', label: 'MO', bgClass: 'bg-teal-400' },
  'Lain-lain': { color: '#94A3B8', stroke: '#000000', label: 'Lain-lain', bgClass: 'bg-slate-400' },
};

export const FALLBACK_SEGMENT_PALETTE = [
  { color: '#6EE7B7', stroke: '#000000', bgClass: 'bg-emerald-400' },
  { color: '#F472B6', stroke: '#000000', bgClass: 'bg-pink-400' },
  { color: '#A78BFA', stroke: '#000000', bgClass: 'bg-purple-400' },
  { color: '#FB923C', stroke: '#000000', bgClass: 'bg-orange-400' },
  { color: '#2DD4BF', stroke: '#000000', bgClass: 'bg-teal-400' },
];

export function getSegmentColorInfo(segment: string, fallbackIdx = 0) {
  if (SEGMENT_COLORS_MAP[segment]) {
    return SEGMENT_COLORS_MAP[segment];
  }
  const fb = FALLBACK_SEGMENT_PALETTE[fallbackIdx % FALLBACK_SEGMENT_PALETTE.length];
  return {
    color: fb.color,
    stroke: fb.stroke,
    label: segment,
    bgClass: fb.bgClass
  };
}

interface CustomMonthlySegmentTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  metric: 'WO' | 'RE';
  activeSegments: string[];
  selectedYear: number;
}

const CustomMonthlySegmentTooltip = ({
  active,
  payload,
  label,
  metric,
  activeSegments,
  selectedYear,
}: CustomMonthlySegmentTooltipProps) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  const total = metric === 'WO' ? data.totalWO : data.totalRE;

  return (
    <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-700/60 text-xs min-w-[240px] z-50">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <span className="font-extrabold text-sm text-white">{label} {selectedYear}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
          metric === 'WO' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
        }`}>
          {metric === 'WO' ? 'Volume WO (PSB)' : 'Realisasi (RE)'}
        </span>
      </div>

      <div className="py-2 border-b border-slate-800/80">
        <div className="flex justify-between items-center mb-1">
          <span className="text-slate-400 font-medium">Total {metric === 'WO' ? 'WO' : 'RE'}:</span>
          <span className="font-mono font-black text-white text-sm">{(total ?? 0).toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-400">Success Rate:</span>
          <span className="font-mono font-bold text-emerald-400">{data.completionRate}% ({(data.totalRE ?? 0).toLocaleString('id-ID')} RE)</span>
        </div>
      </div>

      <div className="pt-2 space-y-1.5">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
          Distribusi Segmen Layanan:
        </div>
        {activeSegments.map((seg, idx) => {
          const count = metric === 'WO' ? (data[seg] || 0) : (data[`re_${seg}`] || 0);
          const colorInfo = getSegmentColorInfo(seg, idx);
          const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';

          return (
            <div key={seg} className="flex items-center justify-between text-[11px]">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-xs shrink-0 border border-black" style={{ backgroundColor: colorInfo.color }} />
                <span className="text-slate-200 font-medium">{seg}</span>
              </div>
              <div className="flex items-center space-x-1.5 font-mono">
                <span className="font-bold text-white">{(count ?? 0).toLocaleString('id-ID')}</span>
                <span className="text-[10px] text-slate-400">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function ProvisioningDashboard({ 
  data, 
  allRegionsData, 
  activeRegional, 
  provisioningData,
  activeSubTab,
  setActiveSubTab
}: ProvisioningDashboardProps) {
  // Local fallback state if no prop is provided for extreme durability
  const [localSubTab, setLocalSubTab] = useState<'sektor' | 'tabel' | 'peta'>('sektor');
  const currentSubTab = activeSubTab || localSubTab;
  const changeSubTab = setActiveSubTab || setLocalSubTab;

  // 1. FILTER STATES
  const [selectedYear, setSelectedYear] = useState<number>(2026); // 2026 is now the default year as requested
  const [selectedSA, setSelectedSA] = useState<string>('All');
  const [selectedSegment, setSelectedSegment] = useState<string>('All');

  // NEW INTERACTIVE FILTER STATES (SEKTOR & BULAN)
  const [selectedSektor, setSelectedSektor] = useState<string>('All');
  const [selectedBulan, setSelectedBulan] = useState<number | 'All'>('All');

  // Monthly Stacked Bar Metric Toggle: 'WO' (default) or 'RE'
  const [monthlyChartMetric, setMonthlyChartMetric] = useState<'WO' | 'RE'>('WO');

  // Available segments dynamically discovered in dataset
  const allAvailableSegments = useMemo(() => {
    const defaultOrder = ['Indihome', 'Indibizz', 'PDA', 'MO', 'Lain-lain'];
    const segSet = new Set<string>();
    provisioningData.forEach((r) => {
      if (r.segment) segSet.add(r.segment);
    });
    const segList = Array.from(segSet);
    return segList.sort((a, b) => {
      const idxA = defaultOrder.indexOf(a);
      const idxB = defaultOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [provisioningData]);

  // Active segments to show on monthly stacked bar
  const activeSegmentsToShow = useMemo(() => {
    if (selectedSegment !== 'All') {
      return [selectedSegment];
    }
    return allAvailableSegments.length > 0 ? allAvailableSegments : ['Indihome', 'Indibizz', 'PDA', 'MO', 'Lain-lain'];
  }, [selectedSegment, allAvailableSegments]);

  // Reset Sektor when Service Area changes to avoid mismatched sectors
  useEffect(() => {
    setSelectedSektor('All');
  }, [selectedSA]);

  // DRILLDOWN STATE
  const [drilldownMonth, setDrilldownMonth] = useState<number | 'all' | null>(null);
  const [drilldownStatus, setDrilldownStatus] = useState<'COMPWORK' | 'CANCLWORK' | 'WORKFAIL' | null>(null);
  
  // Drilldown Search & Pagination state
  const [drilldownSearch, setDrilldownSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

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
        Tahun: selectedYear,
        'Service Area': selectedSA,
        Sektor: selectedSektor,
        Bulan: selectedBulan === 'All' ? 'Semua Bulan' : INDONESIAN_MONTHS[Number(selectedBulan) - 1],
        Segment: selectedSegment,
        ...customFilters,
      },
      summaryMetrics,
      sampleRows,
      promptNote,
    });
  };

  // Formatting helper
  const formatNum = (val: number) => val.toLocaleString('id-ID');

  // 2. EXTRACT UNIQUE VALUES FOR FILTERS DYNAMICALLY
  const filterOptions = useMemo(() => {
    const years = new Set<number>();
    const sas = new Set<string>();
    const segments = new Set<string>();

    provisioningData.forEach((row) => {
      years.add(row.tahun);
      if (row.sa) sas.add(row.sa);
      if (row.segment) segments.add(row.segment);
    });

    return {
      years: Array.from(years).sort((a, b) => b - a),
      sas: ['All', ...Array.from(sas).sort()],
      segments: ['All', ...Array.from(segments).sort()],
    };
  }, [provisioningData]);

  // 3. FILTER DATA BASED ON SELECTIONS (For main dashboard cards & trend chart)
  const filteredData = useMemo(() => {
    return provisioningData.filter((row) => {
      const matchYear = row.tahun === selectedYear;
      const matchSA = selectedSA === 'All' || row.sa === selectedSA;
      const matchSegment = selectedSegment === 'All' || row.segment === selectedSegment;
      const matchBulan = selectedBulan === 'All' || row.bulan === selectedBulan;
      return matchYear && matchSA && matchSegment && matchBulan;
    });
  }, [provisioningData, selectedYear, selectedSA, selectedSegment, selectedBulan]);

  // Dynamic list of sectors based on the selected Service Area (SA) and selected Year (Column B)
  const sectorsForSelectedSA = useMemo(() => {
    const sectors = new Set<string>();
    provisioningData.forEach((row) => {
      const matchYear = row.tahun === selectedYear;
      const matchSA = selectedSA === 'All' || row.sa === selectedSA;
      if (matchYear && matchSA && row.sektor) {
        sectors.add(row.sektor);
      }
    });
    return ['All', ...Array.from(sectors).sort()];
  }, [provisioningData, selectedYear, selectedSA]);

  // Filtered data for sector & month analysis
  const sectorMonthFilteredData = useMemo(() => {
    return provisioningData.filter((row) => {
      const matchYear = row.tahun === selectedYear;
      const matchSA = selectedSA === 'All' || row.sa === selectedSA;
      const matchSegment = selectedSegment === 'All' || row.segment === selectedSegment;
      const matchSektor = selectedSektor === 'All' || row.sektor === selectedSektor;
      const matchBulan = selectedBulan === 'All' || row.bulan === selectedBulan;
      return matchYear && matchSA && matchSegment && matchSektor && matchBulan;
    });
  }, [provisioningData, selectedYear, selectedSA, selectedSegment, selectedSektor, selectedBulan]);

  // Aggregate values for sector & month analysis
  const sectorMonthSummary = useMemo(() => {
    const totalWO = sectorMonthFilteredData.length;
    let totalRE = 0;
    let totalCancel = 0;
    let totalPending = 0;
    let totalHomepass = 0;
    let totalPensolusian = 0;
    const pensolusianBreakdown: Record<string, number> = {};

    sectorMonthFilteredData.forEach((row) => {
      const isCompleted = ['COMPWORK', 'COMPLETE', 'COMPLETED', 'INSTCOMP'].includes(row.status.toUpperCase());
      if (isCompleted) {
        totalRE++;

        const rawP = (row.pensolusian || '').trim();
        const pUpper = rawP.toUpperCase();
        const isPensolusian = rawP !== '' && 
                              pUpper !== '#N/A' && 
                              pUpper !== 'BLANK' && 
                              pUpper !== 'NULL' && 
                              pUpper !== 'NORMAL' && 
                              pUpper !== 'TANPA PENSOLUSIAN' &&
                              pUpper !== 'NORMAL (TANPA PENSOLUSIAN)';

        if (isPensolusian) {
          totalPensolusian++;
          let category = rawP;
          if (category.toLowerCase() === 'pensolusian precon' || category.toLowerCase() === 'precon') {
            category = 'Pensolusian Precon';
          } else if (category.toLowerCase() === 'pensolusian tiang mandiri' || category.toLowerCase() === 'tiang mandiri') {
            category = 'Pensolusian Tiang Mandiri';
          } else if (category.toLowerCase() === 'pensolusian odp baru/jauh' || category.toLowerCase() === 'odp baru/jauh' || category.toLowerCase() === 'pensolusian odp jauh') {
            category = 'Pensolusian ODP Baru/Jauh';
          } else if (category.toLowerCase() === 'pensolusian dropwire / re-routing' || category.toLowerCase() === 'dropwire / re-routing' || category.toLowerCase() === 'dropwire' || category.toLowerCase() === 're-routing') {
            category = 'Pensolusian Dropwire / Re-Routing';
          }
          pensolusianBreakdown[category] = (pensolusianBreakdown[category] || 0) + 1;
        }
      }

      const isCancelled = ['CANCLWORK', 'WORKFAIL', 'CANCEL'].includes(row.status.toUpperCase());
      if (isCancelled) totalCancel++;

      const isPending = row.status.toUpperCase() === 'STARTWORK';
      if (isPending) totalPending++;

      const rawJ = (row.homepassId || '').trim();
      const isHomepass = rawJ !== '' && rawJ.toUpperCase() !== '#N/A' && rawJ.toUpperCase() !== 'BLANK' && rawJ.toUpperCase() !== 'NULL';
      if (isHomepass) {
        totalHomepass++;
      }
    });

    const totalReguler = totalWO - totalHomepass;
    const completionRate = totalWO > 0 ? parseFloat(((totalRE / totalWO) * 100).toFixed(1)) : 0;
    const cancelRate = totalWO > 0 ? parseFloat(((totalCancel / totalWO) * 100).toFixed(1)) : 0;
    const pendingRate = totalWO > 0 ? parseFloat(((totalPending / totalWO) * 100).toFixed(1)) : 0;

    const homepassRate = totalWO > 0 ? parseFloat(((totalHomepass / totalWO) * 100).toFixed(1)) : 0;
    const regulerRate = totalWO > 0 ? parseFloat(((totalReguler / totalWO) * 100).toFixed(1)) : 0;

    const pensolusianRateOfRE = totalRE > 0 ? parseFloat(((totalPensolusian / totalRE) * 100).toFixed(1)) : 0;
    const pensolusianRateOfWO = totalWO > 0 ? parseFloat(((totalPensolusian / totalWO) * 100).toFixed(1)) : 0;

    return {
      totalWO,
      totalRE,
      totalCancel,
      totalPending,
      completionRate,
      cancelRate,
      pendingRate,
      totalHomepass,
      totalReguler,
      homepassRate,
      regulerRate,
      totalPensolusian,
      pensolusianRateOfRE,
      pensolusianRateOfWO,
      pensolusianBreakdown,
    };
  }, [sectorMonthFilteredData]);

  // Pie Chart Data for sector & month analysis
  const sectorMonthPieData = useMemo(() => {
    const summary = sectorMonthSummary;
    if (summary.totalWO === 0) {
      return [];
    }
    return [
      { name: 'Completion Rate', value: summary.totalRE, percentage: summary.completionRate, color: '#10B981' },
      { name: 'Total Pembatalan (Cancel)', value: summary.totalCancel, percentage: summary.cancelRate, color: '#EF4444' },
      { name: 'Total STARTWORK', value: summary.totalPending, percentage: summary.pendingRate, color: '#F59E0B' },
    ].filter(item => item.value > 0);
  }, [sectorMonthSummary]);

  // 4. AGGREGATE MONTHLY TRENDS & METRICS (WITH SEGMENT BREAKDOWN)
  const monthlyAggregates = useMemo(() => {
    const monthlyMap: { [key: number]: {
      bulan: number;
      bulanName: string;
      totalWO: number;
      totalRE: number;
      totalCancel: number;
      totalPending: number;
      statusCounts: { [status: string]: number };
      segmentCounts: { [segment: string]: number };
      segmentWO: { [segment: string]: number };
      segmentRE: { [segment: string]: number };
    } } = {};

    for (let m = 1; m <= 12; m++) {
      monthlyMap[m] = {
        bulan: m,
        bulanName: INDONESIAN_MONTHS[m - 1],
        totalWO: 0,
        totalRE: 0,
        totalCancel: 0,
        totalPending: 0,
        statusCounts: {},
        segmentCounts: {},
        segmentWO: {},
        segmentRE: {},
      };
    }

    // Filter provisioningData directly, ignoring selectedBulan
    provisioningData.forEach((row) => {
      const matchYear = row.tahun === selectedYear;
      const matchSA = selectedSA === 'All' || row.sa === selectedSA;
      const matchSektor = selectedSektor === 'All' || row.sektor === selectedSektor;
      const matchSegment = selectedSegment === 'All' || row.segment === selectedSegment;
      if (!matchYear || !matchSA || !matchSektor || !matchSegment) return;

      const mObj = monthlyMap[row.bulan];
      if (!mObj) return;

      mObj.totalWO++;

      const seg = row.segment || 'Lain-lain';
      mObj.segmentCounts[seg] = (mObj.segmentCounts[seg] || 0) + 1;
      mObj.segmentWO[seg] = (mObj.segmentWO[seg] || 0) + 1;

      // Completion (RE): COMPWORK, COMPLETE, COMPLETED, INSTCOMP
      const isCompleted = ['COMPWORK', 'COMPLETE', 'COMPLETED', 'INSTCOMP'].includes(row.status.toUpperCase());
      if (isCompleted) {
        mObj.totalRE++;
        mObj.segmentRE[seg] = (mObj.segmentRE[seg] || 0) + 1;
      }

      // Cancellation: CANCLWORK, WORKFAIL, CANCEL
      const isCancelled = ['CANCLWORK', 'WORKFAIL', 'CANCEL'].includes(row.status.toUpperCase());
      if (isCancelled) {
        mObj.totalCancel++;
      }

      // Pending (STARTWORK)
      const isPending = row.status.toUpperCase() === 'STARTWORK';
      if (isPending) {
        mObj.totalPending++;
      }

      const statusKey = row.status || 'BLANK';
      mObj.statusCounts[statusKey] = (mObj.statusCounts[statusKey] || 0) + 1;
    });

    return Object.keys(monthlyMap)
      .map((key) => parseInt(key))
      .sort((a, b) => a - b)
      .map((m) => {
        const item = monthlyMap[m];
        const completionRate = item.totalWO > 0 ? parseFloat(((item.totalRE / item.totalWO) * 100).toFixed(1)) : 0;
        const cancelRate = item.totalWO > 0 ? parseFloat(((item.totalCancel / item.totalWO) * 100).toFixed(1)) : 0;
        const pendingRate = item.totalWO > 0 ? parseFloat(((item.totalPending / item.totalWO) * 100).toFixed(1)) : 0;

        // Flatten segment metrics onto root item for Recharts dataKey access
        const segmentEntries: Record<string, number> = {};
        allAvailableSegments.forEach((s) => {
          segmentEntries[s] = item.segmentWO[s] || 0;
          segmentEntries[`re_${s}`] = item.segmentRE[s] || 0;
        });

        return {
          ...item,
          ...segmentEntries,
          completionRate,
          cancelRate,
          pendingRate,
        };
      });
  }, [provisioningData, selectedYear, selectedSA, selectedSektor, selectedSegment, allAvailableSegments]);

  // 5. COMPUTE YEAR-LEVEL OVERALL SUMMARY CARD KPI VALUES
  const yearSummary = useMemo(() => {
    let totalWO = 0;
    let totalRE = 0;
    let totalCancel = 0;
    let totalPending = 0;
    const statusAggs: { [status: string]: number } = {};
    const segmentAggs: { [segment: string]: number } = {};

    filteredData.forEach((row) => {
      totalWO++;
      
      const isCompleted = ['COMPWORK', 'COMPLETE', 'COMPLETED', 'INSTCOMP'].includes(row.status.toUpperCase());
      if (isCompleted) totalRE++;

      const isCancelled = ['CANCLWORK', 'WORKFAIL', 'CANCEL'].includes(row.status.toUpperCase());
      if (isCancelled) totalCancel++;

      const isPending = row.status.toUpperCase() === 'STARTWORK';
      if (isPending) totalPending++;

      statusAggs[row.status] = (statusAggs[row.status] || 0) + 1;
      segmentAggs[row.segment] = (segmentAggs[row.segment] || 0) + 1;
    });

    const completionRate = totalWO > 0 ? parseFloat(((totalRE / totalWO) * 100).toFixed(1)) : 0;
    const cancelRate = totalWO > 0 ? parseFloat(((totalCancel / totalWO) * 100).toFixed(1)) : 0;
    const pendingRate = totalWO > 0 ? parseFloat(((totalPending / totalWO) * 100).toFixed(1)) : 0;

    const topStatuses = Object.entries(statusAggs)
      .sort((a, b) => b[1] - a[1])
      .map(([name, val]) => ({ name, value: val }));

    const topSegments = Object.entries(segmentAggs)
      .sort((a, b) => b[1] - a[1])
      .map(([name, val]) => ({ name, value: val }));

    return {
      totalWO,
      totalRE,
      totalCancel,
      totalPending,
      completionRate,
      cancelRate,
      pendingRate,
      topStatuses,
      topSegments,
    };
  }, [filteredData]);

  // Compute Average WO / Day
  const averageWODay = useMemo(() => {
    if (yearSummary.totalWO === 0) return 0;
    
    // Find unique months present in filteredData
    const monthsInData = new Set<number>();
    filteredData.forEach(row => {
      if (row.bulan) {
        monthsInData.add(row.bulan);
      }
    });

    // Calculate total active days for these months
    let totalActiveDays = 0;
    monthsInData.forEach(m => {
      if (selectedYear === 2026 && m === 7) {
        // July 2026 is the current active/running month
        const todayDate = new Date();
        const activeDays = todayDate.getFullYear() === 2026 && (todayDate.getMonth() + 1) === 7
          ? todayDate.getDate()
          : 16; // Fallback to 16 if timezone/local date differs slightly
        totalActiveDays += activeDays;
      } else {
        totalActiveDays += 30; // standard 30 days as per instruction: "rumusnya total wo : 30"
      }
    });

    if (totalActiveDays === 0) {
      totalActiveDays = 30; // fallback
    }

    return parseFloat((yearSummary.totalWO / totalActiveDays).toFixed(1));
  }, [filteredData, yearSummary.totalWO, selectedYear]);

  // Compute Average PS / Day
  const averagePSDay = useMemo(() => {
    if (yearSummary.totalRE === 0) return 0;
    
    // Find unique months present in filteredData
    const monthsInData = new Set<number>();
    filteredData.forEach(row => {
      if (row.bulan) {
        monthsInData.add(row.bulan);
      }
    });

    // Calculate total active days for these months
    let totalActiveDays = 0;
    monthsInData.forEach(m => {
      if (selectedYear === 2026 && m === 7) {
        // July 2026 is the current active/running month
        const todayDate = new Date();
        const activeDays = todayDate.getFullYear() === 2026 && (todayDate.getMonth() + 1) === 7
          ? todayDate.getDate()
          : 16; // Fallback to 16 if timezone/local date differs slightly
        totalActiveDays += activeDays;
      } else {
        totalActiveDays += 30; // standard 30 days
      }
    });

    if (totalActiveDays === 0) {
      totalActiveDays = 30; // fallback
    }

    return parseFloat((yearSummary.totalRE / totalActiveDays).toFixed(1));
  }, [filteredData, yearSummary.totalRE, selectedYear]);

  // All unique statuses for details table
  const allUniqueStatuses = useMemo(() => {
    const statuses = new Set<string>();
    filteredData.forEach((r) => {
      if (r.status) statuses.add(r.status);
    });
    const sorted = Array.from(statuses).sort((a, b) => {
      const priority: { [key: string]: number } = {
        'COMPWORK': 1,
        'COMPLETE': 2,
        'INSTCOMP': 3,
        'CANCLWORK': 4,
        'WORKFAIL': 5,
        'PENDING': 6,
        'ODP FULL': 7,
        'TIANG': 8,
        'KENDALA SISTEM': 9,
      };
      const pA = priority[a.toUpperCase()] || 99;
      const pB = priority[b.toUpperCase()] || 99;
      return pA - pB;
    });
    return sorted;
  }, [filteredData]);

  // Colors for charts
  const STATUS_COLORS: { [status: string]: string } = {
    'COMPWORK': '#10B981',
    'COMPLETE': '#10B981',
    'INSTCOMP': '#34D399',
    'CANCLWORK': '#EF4444',
    'WORKFAIL': '#F87171',
    'PENDING': '#F59E0B',
    'ODP FULL': '#D97706',
    'KENDALA SISTEM': '#8B5CF6',
    'TIANG': '#EC4899',
    'LAINNYA': '#6B7280',
    'STARTWORK': '#3B82F6',
    '#N/A': '#9CA3AF',
    '#REF!': '#D1D5DB',
  };

  const SEGMENT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#EF4444'];
  const PACKAGE_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#64748B'];

  const segmentPieData = useMemo(() => {
    return yearSummary.topSegments.map((item) => ({
      name: item.name || 'Lain-lain',
      value: item.value,
    }));
  }, [yearSummary]);

  // Segment order distribution & supporting statistics for the diagram lingkaran
  const segmentDistributionStats = useMemo(() => {
    // We compute the segment distribution of the active scope (selectedYear, selectedSA, selectedSektor, selectedBulan)
    const relevantRows = provisioningData.filter((row) => {
      const matchYear = row.tahun === selectedYear;
      const matchSA = selectedSA === 'All' || row.sa === selectedSA;
      const matchSektor = selectedSektor === 'All' || row.sektor === selectedSektor;
      const matchBulan = selectedBulan === 'All' || row.bulan === selectedBulan;
      return matchYear && matchSA && matchSektor && matchBulan;
    });

    const totalWO = relevantRows.length;
    const segMap: Record<string, { total: number; completed: number; cancel: number; pending: number }> = {};

    relevantRows.forEach((row) => {
      const seg = row.segment || 'Lain-lain';
      if (!segMap[seg]) {
        segMap[seg] = { total: 0, completed: 0, cancel: 0, pending: 0 };
      }
      segMap[seg].total++;

      const st = (row.status || '').toUpperCase();
      if (['COMPWORK', 'COMPLETE', 'COMPLETED', 'INSTCOMP'].includes(st)) {
        segMap[seg].completed++;
      } else if (['CANCLWORK', 'WORKFAIL', 'CANCEL'].includes(st)) {
        segMap[seg].cancel++;
      } else if (['STARTWORK', 'PENDING'].includes(st)) {
        segMap[seg].pending++;
      }
    });

    const SEGMENT_THEMES: Record<string, { color: string; stroke: string; lightBg: string; textClass: string; borderClass: string; badgeBg: string }> = {
      'Indihome': { color: '#EF4444', stroke: '#DC2626', lightBg: 'bg-red-50 text-red-700', textClass: 'text-red-600', borderClass: 'border-red-200', badgeBg: 'bg-red-500' },
      'Indibizz': { color: '#818CF8', stroke: '#6366F1', lightBg: 'bg-indigo-50/70 text-indigo-700', textClass: 'text-indigo-600', borderClass: 'border-indigo-200/80', badgeBg: 'bg-indigo-400' },
      'PDA': { color: '#F6BD60', stroke: '#E09F3E', lightBg: 'bg-amber-50/70 text-amber-800', textClass: 'text-amber-700', borderClass: 'border-amber-200/80', badgeBg: 'bg-amber-300' },
      'MO': { color: '#59B4C3', stroke: '#0E879C', lightBg: 'bg-teal-50/70 text-teal-800', textClass: 'text-teal-700', borderClass: 'border-teal-200/80', badgeBg: 'bg-teal-400' },
      'Lain-lain': { color: '#94A3B8', stroke: '#64748B', lightBg: 'bg-slate-100/70 text-slate-700', textClass: 'text-slate-600', borderClass: 'border-slate-200/80', badgeBg: 'bg-slate-400' }
    };

    const segmentsList = Object.entries(segMap).map(([name, stats]) => {
      const percentage = totalWO > 0 ? parseFloat(((stats.total / totalWO) * 100).toFixed(1)) : 0;
      const completionRate = stats.total > 0 ? parseFloat(((stats.completed / stats.total) * 100).toFixed(1)) : 0;
      const cancelRate = stats.total > 0 ? parseFloat(((stats.cancel / stats.total) * 100).toFixed(1)) : 0;
      const theme = SEGMENT_THEMES[name] || { color: '#8B5CF6', stroke: '#7C3AED', lightBg: 'bg-purple-50 text-purple-700', textClass: 'text-purple-600', borderClass: 'border-purple-200', badgeBg: 'bg-purple-500' };

      return {
        name,
        value: stats.total,
        percentage,
        completed: stats.completed,
        cancel: stats.cancel,
        pending: stats.pending,
        completionRate,
        cancelRate,
        color: theme.color,
        stroke: theme.stroke,
        lightBg: theme.lightBg,
        textClass: theme.textClass,
        borderClass: theme.borderClass,
        badgeBg: theme.badgeBg
      };
    }).sort((a, b) => b.value - a.value);

    const dominantSegment = segmentsList.length > 0 ? segmentsList[0] : null;
    const highestReSegment = segmentsList.length > 0 ? [...segmentsList].sort((a, b) => b.completionRate - a.completionRate)[0] : null;
    const totalCompleted = segmentsList.reduce((acc, s) => acc + s.completed, 0);
    const overallCompletionRate = totalWO > 0 ? parseFloat(((totalCompleted / totalWO) * 100).toFixed(1)) : 0;

    return {
      totalWO,
      segmentsList,
      dominantSegment,
      highestReSegment,
      totalCompleted,
      overallCompletionRate
    };
  }, [provisioningData, selectedYear, selectedSA, selectedSektor, selectedBulan]);

  const detailedMonthlyStats = useMemo(() => {
    const monthsWithData = monthlyAggregates.filter(m => m.totalWO > 0);
    const numMonths = monthsWithData.length || 1;

    const totalWO = monthlyAggregates.reduce((sum, m) => sum + m.totalWO, 0);
    const totalPS = monthlyAggregates.reduce((sum, m) => sum + m.totalRE, 0);
    const totalNotPS = monthlyAggregates.reduce((sum, m) => sum + (m.totalWO - m.totalRE), 0);

    const avgWO = totalWO / numMonths;
    const avgPS = totalPS / numMonths;
    const avgNotPS = totalNotPS / numMonths;

    // Overall success rate (completion rate) of the trend chart
    const overallSuccessRate = totalWO > 0 ? (totalPS / totalWO) * 100 : 0;

    // Find top months
    let topWO = { bulanName: '-', totalWO: 0 };
    let topPS = { bulanName: '-', totalRE: 0 };
    let topRate = { bulanName: '-', completionRate: 0 };

    monthlyAggregates.forEach(m => {
      if (m.totalWO > topWO.totalWO) {
        topWO = { bulanName: m.bulanName, totalWO: m.totalWO };
      }
      if (m.totalRE > topPS.totalRE) {
        topPS = { bulanName: m.bulanName, totalRE: m.totalRE };
      }
      if (m.totalWO > 0 && m.completionRate > topRate.completionRate) {
        topRate = { bulanName: m.bulanName, completionRate: m.completionRate };
      }
    });

    return {
      avgWO,
      avgPS,
      avgNotPS,
      overallSuccessRate,
      topWOMonth: topWO.bulanName,
      topWOValue: topWO.totalWO,
      topPSMonth: topPS.bulanName,
      topPSValue: topPS.totalRE,
      topRateMonth: topRate.bulanName,
      topRateValue: topRate.completionRate,
    };
  }, [monthlyAggregates]);


  // ============================================
  // DRILLDOWN SUB-HALAMAN: COMPWORK DETAILS
  // ============================================

  // 1. Filter rows matching drilldown criteria
  const drilldownRows = useMemo(() => {
    if (drilldownMonth === null) return [];
    return provisioningData.filter((row) => {
      // Must be selected year
      const matchYear = row.tahun === selectedYear;
      // Must be selected SA
      const matchSA = selectedSA === 'All' || row.sa === selectedSA;
      // Must be selected Segment
      const matchSegment = selectedSegment === 'All' || row.segment === selectedSegment;
      // Must be COMPWORK status
      const matchStatus = row.status.toUpperCase() === 'COMPWORK' || row.status.toUpperCase() === 'COMPLETED' || row.status.toUpperCase() === 'COMPLETE';
      // Match specific month or 'all' for the whole year
      const matchMonth = drilldownMonth === 'all' || row.bulan === drilldownMonth;
      
      return matchYear && matchSA && matchSegment && matchStatus && matchMonth;
    });
  }, [provisioningData, drilldownMonth, selectedYear, selectedSA, selectedSegment]);

  // 2. Aggregate data for STO Bar Chart (AB)
  const stoDrilldownData = useMemo(() => {
    const counts: { [sto: string]: number } = {};
    drilldownRows.forEach((row) => {
      const key = row.sto || 'UNKNOWN STO';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [drilldownRows]);

  // 3. Aggregate data for Segment Pie (U)
  const segmentDrilldownData = useMemo(() => {
    const counts: { [segment: string]: number } = {};
    drilldownRows.forEach((row) => {
      const key = row.segment || 'UNKNOWN';
      counts[key] = (counts[key] || 0) + 1;
    });
    const total = drilldownRows.length;
    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? parseFloat(((value / total) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.value - a.value);
  }, [drilldownRows]);

  // 4. Aggregate data for Package Percentages (AG)
  const packageDrilldownData = useMemo(() => {
    const counts: { [pkg: string]: number } = {};
    drilldownRows.forEach((row) => {
      const key = row.packageName || 'Tanpa Paket';
      counts[key] = (counts[key] || 0) + 1;
    });
    const total = drilldownRows.length;
    
    // Sort all packages
    const sorted = Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? parseFloat(((value / total) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.value - a.value);

    // If there are more than 7, take top 7 and group the rest into "Lainnya"
    if (sorted.length > 7) {
      const top7 = sorted.slice(0, 7);
      const rest = sorted.slice(7);
      const restValue = rest.reduce((acc, curr) => acc + curr.value, 0);
      const restPercentage = total > 0 ? parseFloat(((restValue / total) * 100).toFixed(1)) : 0;
      top7.push({
        name: 'Lainnya',
        value: restValue,
        percentage: restPercentage
      });
      return top7;
    }
    return sorted;
  }, [drilldownRows]);

  // 5. Search & Pagination logic for detail list table
  const filteredDrilldownTableRows = useMemo(() => {
    if (!drilldownSearch) return drilldownRows;
    const term = drilldownSearch.toLowerCase();
    return drilldownRows.filter((row) => {
      return (
        row.sektor.toLowerCase().includes(term) ||
        row.scOrder.toLowerCase().includes(term) ||
        row.statusDated.toLowerCase().includes(term) ||
        row.segment.toLowerCase().includes(term) ||
        row.sto.toLowerCase().includes(term)
      );
    });
  }, [drilldownRows, drilldownSearch]);

  const totalFilteredCount = filteredDrilldownTableRows.length;
  const totalPages = Math.ceil(totalFilteredCount / pageSize);

  const paginatedDrilldownRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDrilldownTableRows.slice(start, start + pageSize);
  }, [filteredDrilldownTableRows, currentPage, pageSize]);

  // ============================================
  // DRILLDOWN SUB-HALAMAN: CANCLWORK DETAILS
  // ============================================

  // 1. Filter rows matching drilldown criteria
  const cancelDrilldownRows = useMemo(() => {
    if (drilldownMonth === null || (drilldownStatus !== 'CANCLWORK' && drilldownStatus !== 'WORKFAIL')) return [];
    return provisioningData.filter((row) => {
      const matchYear = row.tahun === selectedYear;
      const matchSA = selectedSA === 'All' || row.sa === selectedSA;
      const matchSegment = selectedSegment === 'All' || row.segment === selectedSegment;
      const matchStatus = row.status.toUpperCase() === drilldownStatus || (drilldownStatus === 'CANCLWORK' && (row.status.toUpperCase() === 'CANCEL' || row.status.toUpperCase() === 'CANCLWORK'));
      const matchMonth = drilldownMonth === 'all' || row.bulan === drilldownMonth;
      return matchYear && matchSA && matchSegment && matchStatus && matchMonth;
    });
  }, [provisioningData, drilldownMonth, drilldownStatus, selectedYear, selectedSA, selectedSegment]);

  // 2. Aggregate data for STO Pie Chart (AB)
  const cancelStoDrilldownData = useMemo(() => {
    const counts: { [sto: string]: number } = {};
    cancelDrilldownRows.forEach((row) => {
      const key = row.sto || 'UNKNOWN STO';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [cancelDrilldownRows]);

  // 3. Aggregate data for Detail Kendala (ErrorCode [Kolom BG/K] & SubErrorCode [Kolom BH/L])
  const cancelDetailDrilldownData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    cancelDrilldownRows.forEach((row) => {
      const k = row.errorCode ? row.errorCode.trim() : '';
      const l = row.subErrorCode ? row.subErrorCode.trim() : '';
      const isKValid = k && k !== '#N/A' && k !== '-' && k !== 'null';
      const isLValid = l && l !== '#N/A' && l !== '-' && l !== 'null';
      let label = '';
      if (isKValid && isLValid) {
        label = `${k} - ${l}`;
      } else if (isKValid) {
        label = k;
      } else if (isLValid) {
        label = l;
      } else {
        label = 'TIDAK TERDEFINISI';
      }
      counts[label] = (counts[label] || 0) + 1;
    });
    const total = cancelDrilldownRows.length;
    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? parseFloat(((value / total) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.value - a.value);
  }, [cancelDrilldownRows]);

  // 4. Search & Pagination logic for cancel detail list table
  const filteredCancelTableRows = useMemo(() => {
    if (!drilldownSearch) return cancelDrilldownRows;
    const term = drilldownSearch.toLowerCase();
    return cancelDrilldownRows.filter((row) => {
      return (
        (row.sektor || '').toLowerCase().includes(term) ||
        (row.scOrder || '').toLowerCase().includes(term) ||
        (row.statusDated || '').toLowerCase().includes(term) ||
        (row.sto || '').toLowerCase().includes(term) ||
        (row.errorCode || '').toLowerCase().includes(term) ||
        (row.subErrorCode || '').toLowerCase().includes(term) ||
        (row.updatedLapangan || '').toLowerCase().includes(term)
      );
    });
  }, [cancelDrilldownRows, drilldownSearch]);

  const totalCancelFilteredCount = filteredCancelTableRows.length;
  const totalCancelPages = Math.ceil(totalCancelFilteredCount / pageSize);

  const paginatedCancelRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCancelTableRows.slice(start, start + pageSize);
  }, [filteredCancelTableRows, currentPage, pageSize]);

  // Helper to handle search query changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDrilldownSearch(e.target.value);
    setCurrentPage(1); // Reset page to 1
  };

  // Helper to reset drilldown
  const handleBackToDashboard = () => {
    setDrilldownMonth(null);
    setDrilldownStatus(null);
    setDrilldownSearch('');
    setCurrentPage(1);
  };


  // ============================================
  // RENDERING DYNAMIC VIEW
  // ============================================

  if (drilldownMonth !== null && (drilldownStatus === 'CANCLWORK' || drilldownStatus === 'WORKFAIL')) {
    const activeMonthName = drilldownMonth === 'all' ? 'Sepanjang Tahun' : INDONESIAN_MONTHS[drilldownMonth - 1];
    
    return (
      <div className="space-y-6 animate-fade-in" id="provisioning-cancel-drilldown-view">
        {/* SUB-HALAMAN HEADER WITH BACK BUTTON */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToDashboard}
              className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-2xl transition-all border border-slate-200/50 flex items-center justify-center cursor-pointer group"
              id="btn-back-to-dashboard-cancel"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-mono font-bold uppercase tracking-wider rounded-full">
                  Status: {drilldownStatus}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">•</span>
                <span className="text-[10px] text-slate-500 font-bold">
                  Tahun {selectedYear}
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Rincian Kendala & Pembatalan ({drilldownStatus}) — {activeMonthName}
              </h3>
            </div>
          </div>

          <div className="bg-rose-50 text-rose-800 border border-rose-100 rounded-2xl px-4 py-2.5 text-xs flex flex-col font-bold self-stretch sm:self-auto shrink-0 justify-center">
            <div className="flex justify-between items-center space-x-6">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Total Kendala:</span>
              <span className="font-mono font-black text-base text-rose-700">{formatNum(cancelDrilldownRows.length)} WO</span>
            </div>
          </div>
        </div>

        {/* METRICS SUMMARY STRIP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3.5">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl shrink-0">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Pembatalan</p>
              <h4 className="text-lg font-black text-slate-800 tracking-tight">{formatNum(cancelDrilldownRows.length)} WO</h4>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3.5">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">STO Terdampak</p>
              <h4 className="text-lg font-black text-slate-800 tracking-tight">{cancelStoDrilldownData.length} STO</h4>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3.5 col-span-1 sm:col-span-2">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kendala Dominan</p>
              <h4 className="text-sm font-black text-slate-800 truncate tracking-tight">
                {cancelDetailDrilldownData[0] ? `${cancelDetailDrilldownData[0].name} (${cancelDetailDrilldownData[0].percentage}%)` : '-'}
              </h4>
            </div>
          </div>
        </div>

        {/* TWO CHARTS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* CHART 1: GRAFIK STATUS KENDALA PER-STO */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between lg:col-span-2">
            <div>
              <div className="flex items-center space-x-1.5 mb-2">
                <MapPin className="w-4 h-4 text-rose-600" />
                <h4 className="text-sm font-extrabold text-slate-900">Grafik Status Kendala ({drilldownStatus}) per STO</h4>
              </div>
              <p className="text-[11px] text-slate-400 mb-4">Volume kendala terbanyak berdasarkan area STO.</p>
              
              {cancelStoDrilldownData.length > 0 ? (
                <div className="grid grid-cols-5 items-center gap-4 h-56">
                  <div className="col-span-2 h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={cancelStoDrilldownData}
                          cx="50%"
                          cy="50%"
                          innerRadius={0}
                          outerRadius={50}
                          paddingAngle={0}
                          dataKey="value"
                        >
                          {cancelStoDrilldownData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PACKAGE_COLORS[index % PACKAGE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="col-span-3 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {cancelStoDrilldownData.map((item, index) => {
                      const total = cancelStoDrilldownData.reduce((acc, curr) => acc + curr.value, 0);
                      const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
                      return (
                        <div key={item.name} className="flex flex-col space-y-0.5">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                            <div className="flex items-center space-x-1.5 truncate">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PACKAGE_COLORS[index % PACKAGE_COLORS.length] }} />
                              <span className="truncate text-[11px]">{item.name}</span>
                            </div>
                            <span className="font-mono text-slate-500 text-[10.5px]">{percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center text-xs text-slate-400 italic">Tidak ada data STO</div>
              )}
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-50 text-[10px] text-slate-500 font-bold flex justify-between">
              <span>STO Paling Terkendala:</span>
              <span className="text-rose-600 font-extrabold">{cancelStoDrilldownData[0]?.name || '-'} ({formatNum(cancelStoDrilldownData[0]?.value || 0)} WO)</span>
            </div>
          </div>

          {/* CHART 2: DETAIL KENDALA (ERROR CODE & SUB ERROR CODE) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between lg:col-span-3">
            <div>
              <div className="flex items-center space-x-1.5 mb-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <h4 className="text-sm font-extrabold text-slate-900">Prosentase Detail Kendala (ErrorCode - SubErrorCode)</h4>
              </div>
              <p className="text-[11px] text-slate-400 mb-4">Pengelompokan rincian penyebab pembatalan.</p>
              
              {cancelDetailDrilldownData.length > 0 ? (
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {cancelDetailDrilldownData.slice(0, 10).map((item, index) => (
                    <div key={item.name} className="space-y-0.5">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-700 truncate max-w-[280px] text-[11px]" title={item.name}>{item.name}</span>
                        <span className="font-mono text-slate-500 text-[10px] shrink-0">{item.percentage}% ({formatNum(item.value)} WO)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: PACKAGE_COLORS[index % PACKAGE_COLORS.length]
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {cancelDetailDrilldownData.length > 10 && (
                    <p className="text-[10px] text-slate-400 italic text-right mt-1">+ {cancelDetailDrilldownData.length - 10} detail kendala lainnya</p>
                  )}
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center text-xs text-slate-400 italic">Tidak ada data Detail Kendala</div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-50 text-[10px] text-slate-500 font-bold flex justify-between">
              <span>Variasi Kode Kendala:</span>
              <span className="text-indigo-600 font-extrabold">{cancelDetailDrilldownData.length} Jenis</span>
            </div>
          </div>
        </div>

        {/* DETAIL LIST TABLE WITH COLUMNS B, H, M, AB, K, L, N */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden" id="cancel-drilldown-table-section">
          {/* Table Toolbar */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                <TableIcon className="w-4 h-4 text-rose-600" />
                <span>Rincian Transaksi Kendala & Pembatalan PSB</span>
              </h4>
              <p className="text-xs text-slate-400">
                Rincian data terpadu: Sektor, SC Order, Status Dated, STO, Error Code, Sub Error Code, dan Update Lapangan.
              </p>
            </div>

            {/* Search Input Box */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari Order, STO, Kendala..."
                  value={drilldownSearch}
                  onChange={handleSearchChange}
                  className="w-full sm:w-64 bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              {/* Action AI & Page size select */}
              <div className="flex items-center space-x-2 shrink-0">
                <AIEvaluationButton
                  size="sm"
                  onClick={() =>
                    openAiModal(
                      'Tabel Detail Transaksi Kendala & Pembatalan PSB Provisioning',
                      {
                        Sektor: selectedSektor,
                        'Total Terfilter': totalCancelFilteredCount,
                        'Total Keseluruhan': provisioningData.length,
                        Halaman: `${currentPage} dari ${Math.ceil(totalCancelFilteredCount / pageSize)}`,
                      },
                      paginatedCancelRows.slice(0, 15).map(r => ({
                        'SC Order': r.scOrder,
                        Sektor: r.sektor,
                        'Status Dated': r.statusDated,
                        STO: r.sto,
                        'Error Code': r.errorCode || '-',
                        'Sub Error Code': r.subErrorCode || '-',
                        'Updated Lapangan': r.updatedLapangan || '-',
                      })),
                      {},
                      'Evaluasi daftar kendala dan pembatalan PSB provisioning di atas. Berikan masukan terkait kendala teknis lapangan dan efisiensi waktu penanganan.'
                    )
                  }
                />
                <span className="text-xs text-slate-500 font-bold whitespace-nowrap">Baris:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/75 border-b border-slate-200 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">No.</th>
                  <th className="py-3.5 px-4 font-black text-slate-800">Sektor (B)</th>
                  <th className="py-3.5 px-4 font-black text-slate-800">SC Order (H)</th>
                  <th className="py-3.5 px-4 font-black text-slate-800">Status Dated (M)</th>
                  <th className="py-3.5 px-4 font-black text-slate-800">STO (AB)</th>
                  <th className="py-3.5 px-4 font-black text-slate-800">Error Code (K)</th>
                  <th className="py-3.5 px-4 font-black text-slate-800">Sub Error Code (L)</th>
                  <th className="py-3.5 px-4 font-black text-slate-800">Updated Lapangan (N)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {paginatedCancelRows.length > 0 ? (
                  paginatedCancelRows.map((row, index) => {
                    const rowNumber = (currentPage - 1) * pageSize + index + 1;
                    return (
                      <tr key={`${row.scOrder}-${index}`} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-5 font-mono text-slate-400 font-bold">{rowNumber}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{row.sektor || '-'}</td>
                        <td className="py-3 px-4 font-mono font-extrabold text-rose-700 bg-rose-50/20">{row.scOrder || '-'}</td>
                        <td className="py-3 px-4 text-slate-500 font-medium">{row.statusDated || '-'}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{row.sto || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 text-[10.5px] font-mono font-bold rounded-md border ${
                            row.errorCode && row.errorCode !== '#N/A' && row.errorCode !== '-'
                              ? 'bg-rose-50 text-rose-800 border-rose-200/70 shadow-xs'
                              : 'bg-amber-50/80 text-amber-800 border-amber-200/50'
                          }`}>
                            {row.errorCode || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700 font-mono text-[11px]">
                          {row.subErrorCode && row.subErrorCode !== '#N/A' && row.subErrorCode !== '-' ? (
                            <span className="font-semibold text-slate-800">{row.subErrorCode}</span>
                          ) : (
                            <span className="text-slate-400 italic">{row.subErrorCode || '-'}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-500 max-w-[200px] truncate" title={row.updatedLapangan}>
                          {row.updatedLapangan || '-'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 italic font-medium bg-slate-50/20">
                      Tidak ada data {drilldownStatus} yang cocok dengan pencarian "{drilldownSearch}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer */}
          {totalCancelFilteredCount > pageSize && (
            <div className="p-5 border-t border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-xs text-slate-500 font-bold font-mono">
                Menampilkan {formatNum(Math.min((currentPage - 1) * pageSize + 1, totalCancelFilteredCount))} - {formatNum(Math.min(currentPage * pageSize, totalCancelFilteredCount))} dari {formatNum(totalCancelFilteredCount)} baris
              </span>
              
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalCancelPages) }, (_, idx) => {
                    let targetPage = currentPage;
                    if (currentPage <= 3) {
                      targetPage = idx + 1;
                    } else if (currentPage >= totalCancelPages - 2) {
                      targetPage = totalCancelPages - 4 + idx;
                    } else {
                      targetPage = currentPage - 2 + idx;
                    }
                    if (targetPage < 1 || targetPage > totalCancelPages) return null;
                    return (
                      <button
                        key={targetPage}
                        onClick={() => setCurrentPage(targetPage)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-black transition-all cursor-pointer ${
                          currentPage === targetPage
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/15'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {targetPage}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalCancelPages))}
                  disabled={currentPage === totalCancelPages}
                  className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (drilldownMonth !== null) {
    // DRILLDOWN VIEW (SUB-HALAMAN BARU)
    const activeMonthName = drilldownMonth === 'all' ? 'Sepanjang Tahun' : INDONESIAN_MONTHS[drilldownMonth - 1];
    
    return (
      <div className="space-y-6 animate-fade-in" id="provisioning-drilldown-view">
        
        {/* SUB-HALAMAN HEADER WITH BACK BUTTON */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToDashboard}
              className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-2xl transition-all border border-slate-200/50 flex items-center justify-center cursor-pointer group"
              id="btn-back-to-dashboard"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold uppercase tracking-wider rounded-full">
                  Status: COMPWORK
                </span>
                <span className="text-[10px] text-slate-400 font-bold">•</span>
                <span className="text-[10px] text-slate-500 font-bold">
                  Tahun {selectedYear}
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Rincian Realisasi (COMPWORK) — {activeMonthName}
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-stretch sm:self-auto shrink-0">
            {/* Manual Month Selector Dropdown */}
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200/60 rounded-2xl px-3.5 py-2 shadow-sm shrink-0">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs text-slate-500 font-bold">Bulan:</span>
              <select
                value={drilldownMonth}
                onChange={(e) => {
                  const val = e.target.value;
                  setDrilldownMonth(val === 'all' ? 'all' : parseInt(val, 10));
                }}
                className="bg-transparent border-none text-xs font-extrabold text-slate-800 focus:outline-none focus:ring-0 cursor-pointer py-0.5"
              >
                <option value="all">Semua Bulan</option>
                {INDONESIAN_MONTHS.map((name, i) => (
                  <option key={i} value={i + 1}>{name}</option>
                ))}
              </select>
            </div>

            {/* Total Selesai Card */}
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-2xl px-4 py-2.5 text-xs flex flex-col font-bold justify-center shrink-0">
              <div className="flex justify-between items-center space-x-6">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Total Selesai:</span>
                <span className="font-mono font-black text-base text-emerald-700">{formatNum(drilldownRows.length)} WO</span>
              </div>
            </div>
          </div>
        </div>

        {/* METRICS SUMMARY STRIP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3.5">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Realisasi PS</p>
              <h4 className="text-lg font-black text-slate-800 tracking-tight">{formatNum(drilldownRows.length)}</h4>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3.5">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jumlah STO Aktif</p>
              <h4 className="text-lg font-black text-slate-800 tracking-tight">{stoDrilldownData.length} STO</h4>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3.5">
            <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Segmen</p>
              <h4 className="text-base font-black text-slate-800 truncate tracking-tight">
                {segmentDrilldownData[0] ? `${segmentDrilldownData[0].name} (${segmentDrilldownData[0].percentage}%)` : '-'}
              </h4>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3.5">
            <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Paket Layanan</p>
              <h4 className="text-xs font-black text-slate-800 truncate tracking-tight max-w-[180px]">
                {packageDrilldownData[0] ? `${packageDrilldownData[0].name}` : '-'}
              </h4>
            </div>
          </div>
        </div>

        {/* THREE CHARTS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* CHART 1: GRAFIK STATUS COMPWORK PER-STO */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-1.5 mb-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-extrabold text-slate-900">Vol COMPWORK per STO</h4>
              </div>
              <p className="text-[11px] text-slate-400 mb-4">Volume penyelesaian Pasang Baru sukses berdasarkan lokasi STO.</p>
              
              {stoDrilldownData.length > 0 ? (
                <div className="grid grid-cols-5 items-center gap-4 h-56">
                  <div className="col-span-2 h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stoDrilldownData}
                          cx="50%"
                          cy="50%"
                          innerRadius={0}
                          outerRadius={50}
                          paddingAngle={0}
                          dataKey="value"
                        >
                          {stoDrilldownData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PACKAGE_COLORS[index % PACKAGE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="col-span-3 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {stoDrilldownData.map((item, index) => {
                      const total = stoDrilldownData.reduce((acc, curr) => acc + curr.value, 0);
                      const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
                      return (
                        <div key={item.name} className="flex flex-col space-y-0.5">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                            <div className="flex items-center space-x-1.5 truncate">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PACKAGE_COLORS[index % PACKAGE_COLORS.length] }} />
                              <span className="truncate text-[11px]">{item.name}</span>
                            </div>
                            <span className="font-mono text-slate-500 text-[10.5px]">{percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center text-xs text-slate-400 italic">Tidak ada data STO</div>
              )}
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-50 text-[10px] text-slate-500 font-bold flex justify-between">
              <span>STO Terproduktif:</span>
              <span className="text-emerald-600 font-extrabold">{stoDrilldownData[0]?.name || '-'} ({formatNum(stoDrilldownData[0]?.value || 0)} WO)</span>
            </div>
          </div>

          {/* CHART 2: PROSENTASE PS BERDASARKAN SEGMENT (KOLOM U) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-1.5 mb-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-extrabold text-slate-900">Prosentase PS per Segmen</h4>
              </div>
              <p className="text-[11px] text-slate-400 mb-4">Rasio kontribusi segmen pelanggan dalam status sukses COMPWORK.</p>
              
              {segmentDrilldownData.length > 0 ? (
                <div className="grid grid-cols-5 items-center gap-4 h-56">
                  <div className="col-span-2 h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={segmentDrilldownData}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={55}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {segmentDrilldownData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getSegmentColorInfo(entry.name, index).color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="col-span-3 space-y-2 max-h-48 overflow-y-auto">
                    {segmentDrilldownData.map((item, index) => (
                      <div key={item.name} className="flex flex-col space-y-0.5">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <div className="flex items-center space-x-1 truncate">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getSegmentColorInfo(item.name, index).color }} />
                            <span className="truncate text-[11px]">{item.name}</span>
                          </div>
                          <span className="font-mono text-slate-500 text-[10.5px]">{item.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center text-xs text-slate-400 italic">Tidak ada data segmen</div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-50 text-[10px] text-slate-500 font-bold flex justify-between">
              <span>Segmen Utama:</span>
              <span className="text-indigo-600 font-extrabold">{segmentDrilldownData[0]?.name || '-'}</span>
            </div>
          </div>

          {/* CHART 3: PROSENTASE "PAKET" (KOLOM AG) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-1.5 mb-2">
                <Package className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-extrabold text-slate-900">Prosentase Paket IndiHome</h4>
              </div>
              <p className="text-[11px] text-slate-400 mb-4">Sebaran produk paket yang paling diminati oleh pelanggan.</p>
              
              {packageDrilldownData.length > 0 ? (
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {packageDrilldownData.map((item, index) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-700 truncate max-w-[170px] text-[10.5px]" title={item.name}>{item.name}</span>
                        <span className="font-mono text-slate-500 text-[10px] shrink-0">{item.percentage}% ({formatNum(item.value)})</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: PACKAGE_COLORS[index % PACKAGE_COLORS.length]
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center text-xs text-slate-400 italic">Tidak ada data Paket</div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-50 text-[10px] text-slate-500 font-bold flex justify-between">
              <span>Ragam Paket Terpasang:</span>
              <span className="text-red-500 font-extrabold">{packageDrilldownData.length} Variasi</span>
            </div>
          </div>
        </div>

        {/* DETAIL LIST TABLE WITH COLUMNS B, H, M, U, AB */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden" id="drilldown-table-section">
          {/* Table Toolbar */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                <TableIcon className="w-4 h-4 text-emerald-600" />
                <span>Rincian Transaksi PSB Sukses</span>
              </h4>
              <p className="text-xs text-slate-400">
                Data real-time: Sektor (B), SC Order (H), Status Dated (M), Segment (U), STO (AB).
              </p>
            </div>

            {/* Search Input Box */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari ID Order, STO, Sektor..."
                  value={drilldownSearch}
                  onChange={handleSearchChange}
                  className="w-full sm:w-64 bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Action AI & Page size select */}
              <div className="flex items-center space-x-2 shrink-0">
                <AIEvaluationButton
                  size="sm"
                  onClick={() =>
                    openAiModal(
                      'Tabel Log Seluruh SC Order Provisioning',
                      {
                        'Total Terfilter': totalFilteredCount,
                        'Total Keseluruhan': provisioningData.length,
                        Halaman: `${currentPage} dari ${totalPages}`,
                        'Tahun Terpilih': selectedYear,
                      },
                      paginatedDrilldownRows.slice(0, 15).map(r => ({
                        'SC Order': r.scOrder,
                        Sektor: r.sektor,
                        'Status Dated': r.statusDated,
                        Segment: r.segment,
                        STO: r.sto,
                        'Status Kpro': r.status,
                      })),
                      {},
                      'Analisis sebaran order pada tabel log ini, evaluasi efektivitas pemenuhan layanan (provisioning), dan identifikasi STO dengan tingkat kegagalan tertinggi.'
                    )
                  }
                />
                <span className="text-xs text-slate-500 font-bold whitespace-nowrap">Baris:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">No.</th>
                  <th className="py-3.5 px-4 font-black text-slate-800">Sektor</th>
                  <th className="py-3.5 px-4 font-black text-slate-800">SC Order / ID Order</th>
                  <th className="py-3.5 px-4 font-black text-slate-800">Status Dated</th>
                  <th className="py-3.5 px-4 font-black text-slate-800">Segment</th>
                  <th className="py-3.5 px-4 font-black text-slate-800">STO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {paginatedDrilldownRows.length > 0 ? (
                  paginatedDrilldownRows.map((row, index) => {
                    const rowNumber = (currentPage - 1) * pageSize + index + 1;
                    return (
                      <tr key={`${row.scOrder}-${index}`} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-5 font-mono text-slate-400 font-bold">{rowNumber}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{row.sektor || '-'}</td>
                        <td className="py-3 px-4 font-mono font-extrabold text-emerald-700 bg-emerald-50/20">{row.scOrder || '-'}</td>
                        <td className="py-3 px-4 text-slate-500 font-medium">{row.statusDated || '-'}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10.5px] font-bold rounded-full">
                            {row.segment || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-black text-slate-900">{row.sto || '-'}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 italic font-medium bg-slate-50/20">
                      Tidak ada baris data COMPWORK yang cocok dengan pencarian "{drilldownSearch}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-5 border-t border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-xs text-slate-500 font-bold font-mono">
                Menampilkan {formatNum(Math.min((currentPage - 1) * pageSize + 1, totalFilteredCount))} - {formatNum(Math.min(currentPage * pageSize, totalFilteredCount))} dari {formatNum(totalFilteredCount)} baris
              </span>
              
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {/* Page digits */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                    // Show a sliding window of pages centered around currentPage
                    let targetPage = currentPage;
                    if (currentPage <= 3) {
                      targetPage = idx + 1;
                    } else if (currentPage >= totalPages - 2) {
                      targetPage = totalPages - 4 + idx;
                    } else {
                      targetPage = currentPage - 2 + idx;
                    }
                    
                    // Boundary checks
                    if (targetPage < 1 || targetPage > totalPages) return null;
                    
                    return (
                      <button
                        key={targetPage}
                        onClick={() => setCurrentPage(targetPage)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-black transition-all cursor-pointer ${
                          currentPage === targetPage
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/15'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {targetPage}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    );
  }

  // ============================================
  // MAIN DASHBOARD VIEW
  // ============================================

  return (
    <div className="space-y-6 animate-fade-in" id="provisioning-dashboard">
      
      {currentSubTab !== 'peta' && (
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm" id="dashboard-filters">
        <div className="flex items-center space-x-2 text-slate-800 font-extrabold mb-4 text-sm uppercase tracking-wide">
          <Filter className="w-4 h-4 text-red-500" />
          <span>Filter Parameter Kinerja</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* YEAR FILTER */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Pilih Tahun Analisis</span>
            </label>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 cursor-pointer appearance-none"
              >
                {filterOptions.years.map((yr) => (
                  <option key={yr} value={yr}>Tahun {yr}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500 font-mono text-[9px] font-bold">
                ▼
              </div>
            </div>
          </div>

          {/* BULAN SELECT FILTER */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Filter Bulan</span>
            </label>
            <div className="relative">
              <select
                value={selectedBulan}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedBulan(val === 'All' ? 'All' : parseInt(val));
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 cursor-pointer appearance-none"
              >
                <option value="All">SEMUA BULAN (All Months)</option>
                {INDONESIAN_MONTHS.map((monthName, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    Bulan {monthName}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500 font-mono text-[9px] font-bold">
                ▼
              </div>
            </div>
          </div>

          {/* SERVICE AREA (SA) FILTER */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Service Area / SA</span>
            </label>
            <div className="relative">
              <select
                value={selectedSA}
                onChange={(e) => setSelectedSA(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 cursor-pointer appearance-none"
              >
                {filterOptions.sas.map((sa) => (
                  <option key={sa} value={sa}>
                    {sa === 'All' ? 'SEMUA SERVICE AREA (All SAs)' : sa}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500 font-mono text-[9px] font-bold">
                ▼
              </div>
            </div>
          </div>

          {/* SEGMENT FILTER */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Segmen Layanan / Segment</span>
            </label>
            <div className="relative">
              <select
                value={selectedSegment}
                onChange={(e) => setSelectedSegment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 cursor-pointer appearance-none"
              >
                {filterOptions.segments.map((seg) => (
                  <option key={seg} value={seg}>
                    {seg === 'All' ? 'SEMUA SEGMEN LAYANAN' : seg}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500 font-mono text-[9px] font-bold">
                ▼
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {currentSubTab === 'sektor' && (
        <>
          {/* SECTION 3: KEY PERFORMANCE INDICATORS (KPIs) CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6" id="provisioning-kpis">
        {/* KPI 1: TOTAL WO */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Work Orders (WO)</span>
              <div className="p-2 bg-red-50 text-red-500 rounded-xl">
                <UserPlus className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{formatNum(yearSummary.totalWO)}</h3>
              <p className="text-[10px] text-slate-400 font-mono font-medium">Akumulasi Seluruh ID Order</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-50 text-[10.5px] font-semibold text-slate-500 flex justify-between">
            <span>Rata-Rata WO /Hari:</span>
            <span className="text-slate-800 font-bold">{averageWODay}</span>
          </div>
        </div>

        {/* KPI 2: TOTAL RE (REALISASI) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completion Rate</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{formatNum(yearSummary.totalRE)}</h3>
              <p className="text-[10px] text-slate-400 font-mono font-medium">Instalasi Berhasil (Completed)</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-50 text-[10.5px] font-semibold text-slate-500 flex justify-between">
            <span>Rasio Sukses:</span>
            <span className="text-emerald-600 font-bold">{yearSummary.completionRate}%</span>
          </div>
        </div>

        {/* KPI 3: COMPLETION RATE */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completion Rate</span>
              <div className="p-2 bg-blue-50 text-blue-500 rounded-xl">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className={`text-2xl font-black tracking-tight ${yearSummary.completionRate >= 80 ? 'text-emerald-600' : 'text-amber-500'}`}>
                {yearSummary.completionRate}%
              </h3>
              <p className="text-[10px] text-slate-400 font-mono font-medium">Persentase WO Selesai</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-50 space-y-2">
            <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${yearSummary.completionRate >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(yearSummary.completionRate, 100)}%` }}
              />
            </div>
            <div className="text-[10.5px] font-semibold text-slate-500 flex justify-between pt-1">
              <span>Rata-Rata PS/Hari:</span>
              <span className="text-slate-800 font-bold">{averagePSDay}</span>
            </div>
          </div>
        </div>

        {/* KPI 4: CANCEL RATE */}
        <div
          onClick={() => {
            if (yearSummary.totalCancel > 0) {
              setDrilldownMonth(selectedBulan === 'All' ? 'all' : selectedBulan);
              setDrilldownStatus('CANCLWORK');
            }
          }}
          className={`bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
            yearSummary.totalCancel > 0 ? 'cursor-pointer hover:border-rose-300 group' : ''
          }`}
          title={yearSummary.totalCancel > 0 ? 'Klik untuk melihat rincian Prosentase Detail Kendala (ErrorCode - SubErrorCode)' : undefined}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-rose-600 transition-colors">
                Cancel Rate {yearSummary.totalCancel > 0 && '🔍'}
              </span>
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-100 transition-colors">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className={`text-2xl font-black tracking-tight ${yearSummary.cancelRate < 15 ? 'text-slate-800' : 'text-rose-600'}`}>
                {yearSummary.cancelRate}%
              </h3>
              <p className="text-[10px] text-slate-400 font-mono font-medium">CANCLWORK + WORKFAIL</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-50 text-[10.5px] font-semibold text-slate-500 flex justify-between items-center">
            <span>Total Gagal:</span>
            <span className="text-rose-500 font-bold group-hover:underline">{formatNum(yearSummary.totalCancel)} WO</span>
          </div>
        </div>

        {/* KPI 5: PENDING RATE */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Rate</span>
              <div className="p-2 bg-amber-50 text-amber-500 rounded-xl">
                <Ban className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{yearSummary.pendingRate}%</h3>
              <p className="text-[10px] text-slate-400 font-mono font-medium">Status: STARTWORK</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-50 text-[10.5px] font-semibold text-slate-500 flex justify-between">
            <span>Total STARTWORK:</span>
            <span className="text-amber-500 font-bold">{formatNum(yearSummary.totalPending)} WO</span>
          </div>
        </div>
      </div>

      {/* SECTION: DIAGRAM LINGKARAN PROSENTASE ORDER SESUAI SEGMENT DENGAN DATA PENDUKUNG */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 md:p-6 mb-6" id="segment-distribution-section">
        {/* Header with Title, AI Evaluation button, and Quick Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <PieChartIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-base font-extrabold text-slate-900">
                    Diagram Komposisi Order per Segmen Layanan
                  </h4>
                  <AIEvaluationButton
                    size="sm"
                    onClick={() =>
                      openAiModal(
                        'Analisis Komposisi & Distribusi Order Segmen Layanan',
                        {
                          Tahun: selectedYear,
                          SA: selectedSA === 'All' ? 'NASIONAL / SEMUA SA' : selectedSA,
                          Sektor: selectedSektor === 'All' ? 'Semua Sektor' : selectedSektor,
                          Bulan: selectedBulan === 'All' ? 'Semua Bulan' : `Bulan ${selectedBulan}`,
                          'Total WO Terdata': segmentDistributionStats.totalWO,
                          'Segmen Dominan': `${segmentDistributionStats.dominantSegment?.name || '-'} (${segmentDistributionStats.dominantSegment?.percentage || 0}%)`,
                          'Realisasi Selesai (RE) Tertinggi': `${segmentDistributionStats.highestReSegment?.name || '-'} (${segmentDistributionStats.highestReSegment?.completionRate || 0}%)`,
                          'Rata-rata Completion Rate': `${segmentDistributionStats.overallCompletionRate}%`,
                        },
                        segmentDistributionStats.segmentsList.map(s => ({
                          Segmen: s.name,
                          'Total Order (WO)': s.value,
                          'Porsi (%)': `${s.percentage}%`,
                          'Realisasi (RE)': s.completed,
                          'Completion Rate (%)': `${s.completionRate}%`,
                          'Kendala / Cancel': s.cancel,
                          'Cancel Rate (%)': `${s.cancelRate}%`,
                        })),
                        { Tahun: selectedYear, Sektor: selectedSektor, SA: selectedSA },
                        'Evaluasi pangsa pasar order antar segmen (Indihome, Indibizz, PDA, dll) serta kinerja pemenuhan (RE%). Berikan strategi untuk meningkatkan penetrasi segmen B2B dan menjaga kualitas layanan pemasangan.'
                      )
                    }
                  />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Prosentase kontribusi volume Work Order (WO) dan performansi realisasi instalasi per segmen layanan ({selectedYear}).
                </p>
              </div>
            </div>
          </div>

          {/* Quick Segment Filter Pill */}
          <div className="flex items-center space-x-2 self-start md:self-auto flex-wrap gap-y-1.5">
            <span className="text-xs text-slate-400 font-bold">Filter Segmen:</span>
            <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/50 text-xs font-bold flex-wrap gap-1">
              <button
                onClick={() => setSelectedSegment('All')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedSegment === 'All'
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Segmen
              </button>
              {segmentDistributionStats.segmentsList.map((seg) => (
                <button
                  key={seg.name}
                  onClick={() => setSelectedSegment(seg.name)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                    selectedSegment === seg.name
                      ? 'bg-white text-slate-900 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
                  <span>{seg.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Supporting KPI Row (Data Pendukung Utama) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
          {/* Card 1: Total Order */}
          <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total WO Semua Segmen</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-black text-slate-900 font-mono tracking-tight">
                {formatNum(segmentDistributionStats.totalWO)}
              </span>
              <span className="text-xs text-slate-500 font-bold">WO</span>
            </div>
            <p className="text-[10.5px] text-slate-500 font-medium">Akumulasi seluruh segmen terfilter</p>
          </div>

          {/* Card 2: Segmen Dominan */}
          <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Segmen Paling Dominan</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-black text-slate-900 tracking-tight">
                {segmentDistributionStats.dominantSegment?.name || '-'}
              </span>
              <span className="text-xs font-black text-indigo-600">
                {segmentDistributionStats.dominantSegment?.percentage || 0}%
              </span>
            </div>
            <p className="text-[10.5px] text-slate-500 font-medium">
              {formatNum(segmentDistributionStats.dominantSegment?.value || 0)} order terdaftar
            </p>
          </div>

          {/* Card 3: Realisasi Tertinggi */}
          <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Realisasi (RE) Tertinggi</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-black text-emerald-600 font-mono tracking-tight">
                {segmentDistributionStats.highestReSegment?.completionRate || 0}%
              </span>
              <span className="text-xs font-bold text-slate-700">
                ({segmentDistributionStats.highestReSegment?.name || '-'})
              </span>
            </div>
            <p className="text-[10.5px] text-slate-500 font-medium">
              {formatNum(segmentDistributionStats.highestReSegment?.completed || 0)} berhasil terpasang
            </p>
          </div>

          {/* Card 4: Diversifikasi Layanan */}
          <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-3.5 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Diversifikasi Layanan</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-black text-slate-900 tracking-tight">
                {segmentDistributionStats.segmentsList.length}
              </span>
              <span className="text-xs text-slate-500 font-bold">Segmen Aktif</span>
            </div>
            <p className="text-[10.5px] text-slate-500 font-medium">
              Rata-rata {formatNum(Math.round(segmentDistributionStats.totalWO / Math.max(segmentDistributionStats.segmentsList.length, 1)))} WO / segmen
            </p>
          </div>
        </div>

        {/* Main Diagram Lingkaran (Pie / Donut) + Detailed Breakdown Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Diagram Lingkaran (Donut Chart) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100 relative">
            <div className="relative w-full max-w-[280px] h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-950/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1.5 z-50">
                            <div className="flex items-center space-x-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                              <span className="font-extrabold text-sm text-slate-100">{data.name}</span>
                            </div>
                            <div className="text-[11px] font-mono text-slate-300 space-y-1 pt-1.5 border-t border-slate-800">
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Porsi / Prosentase:</span>
                                <span className="font-black text-indigo-400">{data.percentage}%</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Total Order:</span>
                                <span className="font-bold text-white">{formatNum(data.value)} WO</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Realisasi (RE):</span>
                                <span className="font-bold text-emerald-400">{formatNum(data.completed)} RE ({data.completionRate}%)</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Kendala (Cancel):</span>
                                <span className="font-bold text-rose-400">{formatNum(data.cancel)} WO ({data.cancelRate}%)</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Pie
                    data={segmentDistributionStats.segmentsList}
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {segmentDistributionStats.segmentsList.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                        className="cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setSelectedSegment(selectedSegment === entry.name ? 'All' : entry.name)}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Centered Donut Badge */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest">
                  KOMPOSISI
                </span>
                <span className="text-2xl font-black text-slate-900 font-mono tracking-tight my-0.5">
                  100%
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  {formatNum(segmentDistributionStats.totalWO)} Order
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 font-medium text-center mt-2">
              Klik pada irisan diagram untuk memfilter segmen secara cepat.
            </p>
          </div>

          {/* Detailed Breakdown Cards List (Data Pendukung Terperinci) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Rincian Performa per Segmen Layanan
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Porsi Order vs Sukses Realisasi
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {segmentDistributionStats.segmentsList.map((seg) => {
                const isSelected = selectedSegment === seg.name;
                return (
                  <div
                    key={seg.name}
                    onClick={() => setSelectedSegment(isSelected ? 'All' : seg.name)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-50 border-indigo-400 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-white hover:bg-slate-50/70 border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-2.5">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                        <span className="font-black text-slate-900 text-sm">{seg.name}</span>
                        {isSelected && (
                          <span className="px-2 py-0.5 text-[9px] font-bold bg-indigo-100 text-indigo-800 rounded-md border border-indigo-200 uppercase">
                            Aktif Terfilter
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-black text-slate-800">
                          {formatNum(seg.value)} WO
                        </span>
                        <span
                          className="text-xs font-mono font-black px-2 py-0.5 rounded-lg border text-white"
                          style={{ backgroundColor: seg.color, borderColor: seg.stroke }}
                        >
                          {seg.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar of Market Share */}
                    <div className="w-full bg-slate-100 rounded-full h-2 mb-2.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(seg.percentage, 2)}%`,
                          backgroundColor: seg.color,
                        }}
                      />
                    </div>

                    {/* Supporting Metrics for this Segment */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                      <div>
                        <span className="text-slate-400 font-medium block text-[10px]">Realisasi (RE)</span>
                        <span className="font-extrabold text-emerald-600 font-mono">
                          {formatNum(seg.completed)} <span className="text-[10px]">({seg.completionRate}%)</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block text-[10px]">Kendala / Cancel</span>
                        <span className="font-extrabold text-rose-600 font-mono">
                          {formatNum(seg.cancel)} <span className="text-[10px]">({seg.cancelRate}%)</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block text-[10px]">Status Kinerja</span>
                        <span className="font-bold text-slate-700">
                          {seg.completionRate >= 80 ? 'Optimal' : seg.completionRate >= 65 ? 'Stabil' : 'Perlu Atensi'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: MAIN DUAL-AXIS TREND CHART & DISTRIBUTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHART 1: GRAFIK PERKEMBANGAN PSB PERBULAN (1 GARIS BATANG PER BULAN DENGAN WARNA BERBEDA PER SEGMEN) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm lg:col-span-2 flex flex-col" id="monthly-trends-section">
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2.5">
                  <h4 className="text-base font-extrabold text-slate-900">Grafik Perkembangan PSB Perbulan</h4>
                  <AIEvaluationButton
                    size="sm"
                    onClick={() =>
                      openAiModal(
                        'Grafik Perkembangan PSB Perbulan',
                        {
                          Tahun: selectedYear,
                          SA: selectedSA === 'All' ? 'NASIONAL / SEMUA SA' : selectedSA,
                          Sektor: selectedSektor === 'All' ? 'Semua Sektor' : selectedSektor,
                          'Total WO Tahunan': yearSummary.totalWO,
                          'Total Realisasi (RE)': yearSummary.totalRE,
                          'Success Rate (Completion)': `${yearSummary.completionRate}%`,
                          'Bulan Tertinggi WO': `${detailedMonthlyStats.topWOMonth} (${formatNum(detailedMonthlyStats.topWOValue)} WO)`,
                          'Bulan Tertinggi RE': `${detailedMonthlyStats.topPSMonth} (${formatNum(detailedMonthlyStats.topPSValue)} RE)`,
                          'Completion Rate Tertinggi': `${detailedMonthlyStats.topRateMonth} (${detailedMonthlyStats.topRateValue.toFixed(1).replace('.', ',')}%)`,
                        },
                        monthlyAggregates.map(m => ({
                          Bulan: m.bulanName,
                          'Total WO': m.totalWO,
                          'Total RE': m.totalRE,
                          'Completion Rate': `${m.completionRate}%`,
                          COMPWORK: m.statusCounts['COMPWORK'] || 0,
                          CANCLWORK: m.statusCounts['CANCLWORK'] || 0,
                          WORKFAIL: m.statusCounts['WORKFAIL'] || 0,
                          STARTWORK: m.statusCounts['STARTWORK'] || 0,
                        })),
                        { Tahun: selectedYear, Sektor: selectedSektor, SA: selectedSA },
                        'Evaluasi tren perkembangan volume WO, realisasi pasang (RE), dan rasio completion rate sepanjang bulan dalam setahun. Berikan rekomendasi mitigasi kendala di bulan-bulan dengan gap WO vs RE yang tinggi.'
                      )
                    }
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Dalam 1 garis batang menampilkan grafik per segment layanan (warna berbeda per segmen), dilengkapi kurva Success Rate (%) untuk tahun {selectedYear}.
                </p>
              </div>

              {/* Metric Mode Toggle (WO vs RE) */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-bold self-start md:self-auto border border-slate-200/60 shrink-0">
                <button
                  type="button"
                  onClick={() => setMonthlyChartMetric('WO')}
                  className={`px-3 py-1 rounded-lg transition-all ${monthlyChartMetric === 'WO' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Volume WO (PSB)
                </button>
                <button
                  type="button"
                  onClick={() => setMonthlyChartMetric('RE')}
                  className={`px-3 py-1 rounded-lg transition-all ${monthlyChartMetric === 'RE' ? 'bg-white text-emerald-700 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Realisasi Selesai (RE)
                </button>
              </div>
            </div>
            
            {/* Segment Legend with Distinct Colors */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Segmen Layanan:</span>
              {activeSegmentsToShow.map((seg, idx) => {
                const colorInfo = getSegmentColorInfo(seg, idx);
                return (
                  <div key={seg} className="flex items-center space-x-1.5 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/70">
                    <span className="w-2.5 h-2.5 rounded-xs shrink-0 shadow-2xs border border-black" style={{ backgroundColor: colorInfo.color }} />
                    <span className="text-[11px] text-slate-700 font-semibold">{seg}</span>
                  </div>
                );
              })}
              <div className="flex items-center space-x-1.5 bg-indigo-50/70 px-2 py-0.5 rounded-md border border-indigo-200/50 ml-auto">
                <span className="w-3 h-0.5 bg-indigo-500 block relative">
                  <span className="absolute left-1/2 -top-1 w-2 h-2 rounded-full bg-indigo-500 -translate-x-1/2" />
                </span>
                <span className="text-[11px] text-indigo-700 font-semibold">Success Rate (%)</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={monthlyAggregates}
                margin={{ top: 10, right: -5, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="bulanName" tick={{ fill: '#64748B', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} name="Volume WO/RE" />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} name="Rate %" />
                <Tooltip
                  content={
                    <CustomMonthlySegmentTooltip
                      metric={monthlyChartMetric}
                      activeSegments={activeSegmentsToShow}
                      selectedYear={selectedYear}
                    />
                  }
                />

                {/* 1 SINGLE BAR PER MONTH: STACKED BY SEGMENT WITH BLACK BORDER OUTLINE */}
                {activeSegmentsToShow.map((seg, idx) => {
                  const dataKey = monthlyChartMetric === 'WO' ? seg : `re_${seg}`;
                  const colorInfo = getSegmentColorInfo(seg, idx);
                  return (
                    <Bar
                      key={seg}
                      yAxisId="left"
                      dataKey={dataKey}
                      stackId="psbSegmentBar"
                      fill={colorInfo.color}
                      stroke="#000000"
                      strokeWidth={1}
                      name={seg}
                      maxBarSize={34}
                    />
                  );
                })}

                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="completionRate"
                  stroke="#6366F1"
                  strokeWidth={2.5}
                  dot={{ fill: '#6366F1', r: 3.5 }}
                  activeDot={{ r: 5 }}
                  name="Completion Rate (%)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PIE CHART / SEGMENT & STATUS OVERVIEWS - REPLACED WITH DETAILED MONTHLY METRICS AS REQUESTED */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between" id="distribution-overview">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-red-500" />
                <h4 className="text-base font-extrabold text-slate-900">Detail Statistik Bulanan</h4>
              </div>
              <AIEvaluationButton
                size="sm"
                onClick={() =>
                  openAiModal(
                    'Detail Statistik Bulanan PSB Provisioning',
                    {
                      Tahun: selectedYear,
                      SA: selectedSA === 'All' ? 'Semua SA' : selectedSA,
                      Sektor: selectedSektor === 'All' ? 'Semua Sektor' : selectedSektor,
                      'Rata-rata WO / Bulan': `${detailedMonthlyStats.avgWO.toFixed(1).replace('.', ',')} WO`,
                      'Rata-rata PS / Bulan': `${detailedMonthlyStats.avgPS.toFixed(1).replace('.', ',')} PS`,
                      'Rata-rata WO tidak RE / Bulan': `${detailedMonthlyStats.avgNotPS.toFixed(1).replace('.', ',')} WO`,
                      'Rata-rata Completion Rate': `${detailedMonthlyStats.overallSuccessRate.toFixed(1).replace('.', ',')}%`,
                      'Pencapaian WO Tertinggi': `${detailedMonthlyStats.topWOMonth} (${detailedMonthlyStats.topWOValue} WO)`,
                      'Pencapaian RE Tertinggi': `${detailedMonthlyStats.topPSMonth} (${detailedMonthlyStats.topPSValue} RE)`,
                      'Completion Rate Tertinggi': `${detailedMonthlyStats.topRateMonth} (${detailedMonthlyStats.topRateValue.toFixed(1).replace('.', ',')}%)`,
                    },
                    monthlyAggregates.map(m => ({
                      Bulan: m.bulanName,
                      'Total WO': m.totalWO,
                      'Total RE': m.totalRE,
                      'Completion Rate': `${m.completionRate}%`,
                      COMPWORK: m.statusCounts['COMPWORK'] || 0,
                      CANCLWORK: m.statusCounts['CANCLWORK'] || 0,
                    })),
                    { Tahun: selectedYear, Sektor: selectedSektor, SA: selectedSA },
                    'Evaluasi kestabilan performansi rata-rata bulanan dan rekor pencapaian tertinggi PSB. Berikan analisis kesenjangan (gap) operasional dan rekomendasi strategi perbaikan berkelanjutan.'
                  )
                }
              />
            </div>
            <p className="text-xs text-slate-500 mb-3">Analisis data rata-rata dan pencapaian tertinggi dari grafik Perkembangan PSB per bulan tahun {selectedYear}.</p>
            
            <div className="space-y-2">
              {/* Metric 1 */}
              <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-100/80 hover:bg-slate-100/50 transition-colors">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded-lg bg-slate-200/60 text-slate-700 shrink-0">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rata-rata WO / Bulan</p>
                    <p className="text-xs font-black text-slate-800">
                      {detailedMonthlyStats.avgWO.toFixed(1).replace('.', ',')} <span className="text-[10px] font-medium text-slate-500">WO</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Metric 2 */}
              <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-emerald-50/40 border border-emerald-100/50 hover:bg-emerald-50 transition-colors">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-emerald-600/80 uppercase tracking-wider">Rata-rata PS / Bulan</p>
                    <p className="text-xs font-black text-emerald-800">
                      {detailedMonthlyStats.avgPS.toFixed(1).replace('.', ',')} <span className="text-[10px] font-medium text-emerald-600">PS</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Metric 3 */}
              <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-rose-50/40 border border-rose-100/50 hover:bg-rose-50 transition-colors">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700 shrink-0">
                    <Ban className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-rose-600/80 uppercase tracking-wider">Rata-rata WO tidak RE / Bulan</p>
                    <p className="text-xs font-black text-rose-800">
                      {detailedMonthlyStats.avgNotPS.toFixed(1).replace('.', ',')} <span className="text-[10px] font-medium text-slate-500">WO</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Metric 4 (Success Rate) */}
              <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-indigo-50/40 border border-indigo-100/50 hover:bg-indigo-50 transition-colors">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700 shrink-0">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-indigo-600/80 uppercase tracking-wider">Rata-rata Completion Rate (RE %)</p>
                    <p className="text-xs font-black text-indigo-800">
                      {detailedMonthlyStats.overallSuccessRate.toFixed(1).replace('.', ',')}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Metric 5 */}
              <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-amber-50/40 border border-amber-100/50 hover:bg-amber-50 transition-colors">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-amber-600/80 uppercase tracking-wider">Pencapaian WO tertinggi di bulan</p>
                    <p className="text-xs font-black text-slate-800">
                      {detailedMonthlyStats.topWOMonth} <span className="text-[10px] font-medium text-amber-600 font-mono">({formatNum(detailedMonthlyStats.topWOValue)} WO)</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Metric 6 */}
              <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-emerald-50/30 border border-emerald-100/30 hover:bg-emerald-50 transition-colors">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-emerald-600/80 uppercase tracking-wider">Pencapaian RE Tertinggi di bulan</p>
                    <p className="text-xs font-black text-slate-800">
                      {detailedMonthlyStats.topPSMonth} <span className="text-[10px] font-medium text-emerald-600 font-mono">({formatNum(detailedMonthlyStats.topPSValue)} RE)</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Metric 7 (Top Completion Rate Month) */}
              <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-purple-50/40 border border-purple-100/50 hover:bg-purple-50 transition-colors">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700 shrink-0">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-purple-600/80 uppercase tracking-wider">Completion Rate Tertinggi di bulan</p>
                    <p className="text-xs font-black text-slate-800">
                      {detailedMonthlyStats.topRateMonth} <span className="text-[10px] font-medium text-purple-600 font-mono">({detailedMonthlyStats.topRateValue.toFixed(1).replace('.', ',')}%)</span>
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-3 text-[10px] text-slate-400 font-medium italic flex items-start space-x-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>Rata-rata & pencapaian dihitung langsung dari grafik tren bulanan di sebelah kiri sesuai filter aktif.</span>
          </div>
        </div>
      </div>

      {/* SECTION 3.5: INTERACTIVE SEKTOR & BULAN PERFORMANCE SUMMARY */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6" id="sector-month-interactive-section">
        {/* Header and Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="space-y-1">
            <h4 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <PieChartIcon className="w-5 h-5 text-red-500" />
              <span>Analisis Kinerja Sektor & Bulanan</span>
            </h4>
            <p className="text-xs text-slate-500">
              Komposisi & persentase kinerja WO, RE, Completion Rate, Cancel Rate, dan sebaran HOMEPASS ID per Sektor.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* SEKTOR SELECT FILTER */}
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2">
              <ListFilter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Sektor:</span>
              <div className="relative min-w-[150px]">
                <select
                  value={selectedSektor}
                  onChange={(e) => setSelectedSektor(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer appearance-none pr-5"
                >
                  <option value="All">Semua Sektor (All)</option>
                  {sectorsForSelectedSA.filter(s => s !== 'All').map((sek) => (
                    <option key={sek} value={sek}>
                      Sektor {sek}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-slate-400 text-[8px]">
                  ▼
                </div>
              </div>
            </div>

            {/* Dynamic contextual indicators */}
            {selectedSA !== 'All' && (
              <div className="px-3.5 py-2 bg-red-50/60 border border-red-100/50 rounded-2xl text-red-800 text-[11px] font-bold">
                SA: <span className="font-extrabold uppercase text-red-600">{selectedSA}</span>
              </div>
            )}
          </div>
        </div>

        {/* Content visual block */}
        {sectorMonthSummary.totalWO > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center pt-2">
            {/* Pie / Donut Chart */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center">
              <div className="relative w-64 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sectorMonthPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {sectorMonthPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs shadow-md border border-slate-800">
                              <p className="font-bold">{data.name}</p>
                              <p className="font-mono mt-0.5 font-semibold text-sky-400">
                                {formatNum(data.value)} WO ({data.percentage}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Total WO Badge in center of Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total WO</span>
                  <span className="text-2xl font-black text-slate-800 tracking-tight">{formatNum(sectorMonthSummary.totalWO)}</span>
                  <span className="text-[9px] font-mono text-slate-400 font-bold">Work Orders</span>
                </div>
              </div>

              {/* Mini Legend for the Donut Chart */}
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {sectorMonthPieData.map((item, idx) => (
                  <div key={item.name} className="flex items-center space-x-2 text-[11px] font-bold text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span>{item.name}: <span className="text-slate-800">{item.percentage}%</span></span>
                  </div>
                ))}
              </div>
            </div>

            {/* Metrics Grid Column (WO, RE, Comp Rate, Cancel Rate) */}
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Card 1: Total Work Orders (WO) */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between hover:shadow-sm transition-all duration-200">
                <div className="flex justify-between items-start mb-2">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Work Orders (WO)</p>
                    <h5 className="text-2xl font-black text-slate-800 tracking-tight">{formatNum(sectorMonthSummary.totalWO)}</h5>
                  </div>
                  <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl shrink-0">
                    <UserPlus className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 font-bold font-mono">
                  Sektor: <span className="text-slate-700">{selectedSektor === 'All' ? 'Semua' : selectedSektor}</span> • Bulan: <span className="text-slate-700">{selectedBulan === 'All' ? 'Semua' : INDONESIAN_MONTHS[selectedBulan - 1]}</span>
                </div>
              </div>

              {/* Card 2: Completion Rate */}
              <div className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-100/30 flex flex-col justify-between hover:shadow-sm transition-all duration-200">
                <div className="flex justify-between items-start mb-2">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Completion Rate</p>
                    <h5 className="text-2xl font-black text-emerald-900 tracking-tight">{formatNum(sectorMonthSummary.totalRE)}</h5>
                  </div>
                  <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-[10px] text-emerald-800/80 font-bold font-mono">
                  Volume Pasang Baru Selesai
                </div>
              </div>

              {/* Card 3: Completion Rate (Comp Rate) */}
              <div className="bg-blue-50/40 p-5 rounded-2xl border border-blue-100/30 flex flex-col justify-between hover:shadow-sm transition-all duration-200">
                <div className="flex justify-between items-start mb-2">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Completion Rate (RE %)</p>
                    <h5 className="text-2xl font-black text-blue-900 tracking-tight">{sectorMonthSummary.completionRate}%</h5>
                  </div>
                  <div className="p-2.5 bg-blue-100 text-blue-500 rounded-xl shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                
                {/* Progress bar representing Completion rate */}
                <div className="space-y-1 mt-1">
                  <div className="w-full bg-blue-100 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${sectorMonthSummary.completionRate}%` }} />
                  </div>
                  <div className="text-[10px] text-blue-800/80 font-bold font-mono text-right">
                    Rasio Keberhasilan
                  </div>
                </div>
              </div>

              {/* Card 4: Cancel Rate (Cancel %) */}
              <div className="bg-rose-50/40 p-5 rounded-2xl border border-rose-100/30 flex flex-col justify-between hover:shadow-sm transition-all duration-200">
                <div className="flex justify-between items-start mb-2">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Cancel Rate (Gagal %)</p>
                    <h5 className="text-2xl font-black text-rose-900 tracking-tight">{sectorMonthSummary.cancelRate}%</h5>
                  </div>
                  <div className="p-2.5 bg-rose-100 text-rose-500 rounded-xl shrink-0">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                </div>
                
                {/* Progress bar representing Cancel rate */}
                <div className="space-y-1 mt-1">
                  <div className="w-full bg-rose-100 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${sectorMonthSummary.cancelRate}%` }} />
                  </div>
                  <div className="text-[10px] text-rose-800/80 font-bold font-mono text-right">
                    Rasio Pembatalan ({formatNum(sectorMonthSummary.totalCancel)} WO)
                  </div>
                </div>
              </div>

              {/* Card 5: Status HOMEPASS ID (Kolom J) */}
              <div className="sm:col-span-2 bg-gradient-to-r from-violet-50/40 to-indigo-50/30 p-5 rounded-2xl border border-violet-100/30 flex flex-col justify-between hover:shadow-sm transition-all duration-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-0.5">
                    <p className="text-sm font-extrabold text-violet-900 uppercase tracking-wider">Status HOMEPASS ID</p>
                  </div>
                  <div className="p-2 bg-violet-100 text-violet-600 rounded-xl shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* HOMEPASSID Section */}
                  <div className="bg-white/60 p-3 rounded-xl border border-violet-100/50 flex flex-col justify-center">
                    <span className="text-[10px] font-extrabold text-violet-700 uppercase tracking-wide">HOMEPASS ID</span>
                    <div className="flex items-baseline space-x-1.5 mt-1">
                      <span className="text-xl font-black text-violet-950">{formatNum(sectorMonthSummary.totalHomepass)}</span>
                      <span className="text-xs font-bold text-violet-500">WO</span>
                    </div>
                    <div className="w-full bg-violet-100 h-1 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-violet-600 rounded-full" style={{ width: `${sectorMonthSummary.homepassRate}%` }} />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-violet-500 mt-1 text-right">{sectorMonthSummary.homepassRate}% dari Total</span>
                  </div>

                  {/* REGULER Section */}
                  <div className="bg-white/60 p-3 rounded-xl border border-violet-100/50 flex flex-col justify-center">
                    <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wide">REGULER (Blank)</span>
                    <div className="flex items-baseline space-x-1.5 mt-1">
                      <span className="text-xl font-black text-slate-950">{formatNum(sectorMonthSummary.totalReguler)}</span>
                      <span className="text-xs font-bold text-slate-500">WO</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-slate-400 rounded-full" style={{ width: `${sectorMonthSummary.regulerRate}%` }} />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-slate-500 mt-1 text-right">{sectorMonthSummary.regulerRate}% dari Total</span>
                  </div>
                </div>
              </div>

              {/* Card 6: PS Pensolusian (Kolom P) */}
              <div className="sm:col-span-2 bg-gradient-to-r from-emerald-50/40 to-teal-50/30 p-5 rounded-2xl border border-emerald-100/30 flex flex-col justify-between hover:shadow-sm transition-all duration-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-0.5">
                    <p className="text-sm font-extrabold text-emerald-950 uppercase tracking-wider">PS Pensolusian</p>
                    <p className="text-[10px] text-slate-500">Volume & Kategori Solusi untuk Pasang Baru Sukses</p>
                  </div>
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Total Pensolusian Stats */}
                  <div className="bg-white/60 p-3 rounded-xl border border-emerald-100/50 flex flex-col justify-center md:col-span-1">
                    <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wide">Total Pensolusian</span>
                    <div className="flex items-baseline space-x-1.5 mt-1">
                      <span className="text-2xl font-black text-emerald-950">{formatNum(sectorMonthSummary.totalPensolusian)}</span>
                      <span className="text-xs font-bold text-emerald-500">RE</span>
                    </div>
                    <div className="w-full bg-emerald-100 h-1 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${sectorMonthSummary.pensolusianRateOfRE}%` }} />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-emerald-500 mt-1 text-right">
                      {sectorMonthSummary.pensolusianRateOfRE}% dari Total RE
                    </span>
                  </div>

                  {/* Categories Breakdown */}
                  <div className="md:col-span-2 bg-white/40 p-3 rounded-xl border border-emerald-100/30 flex flex-col justify-between">
                    <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wide mb-2 block">
                      Rincian Kategori Pensolusian
                    </span>
                    {Object.keys(sectorMonthSummary.pensolusianBreakdown || {}).length > 0 ? (
                      <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                        {Object.entries((sectorMonthSummary.pensolusianBreakdown || {}) as Record<string, number>)
                          .sort((a, b) => b[1] - a[1])
                          .map(([cat, count]) => {
                            const countNum = count as number;
                            const rate = sectorMonthSummary.totalPensolusian > 0 
                              ? parseFloat(((countNum / sectorMonthSummary.totalPensolusian) * 100).toFixed(1)) 
                              : 0;
                            return (
                              <div key={cat} className="space-y-0.5">
                                <div className="flex justify-between text-[10px] font-bold text-slate-700">
                                  <span className="truncate max-w-[180px]">{cat}</span>
                                  <span className="font-mono">{formatNum(countNum)} ({rate}%)</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1 rounded-full">
                                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${rate}%` }} />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-[10px] text-slate-400 font-bold italic">
                        Tidak ada data pensolusian pada filter terpilih.
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-6 space-y-2">
            <Info className="w-8 h-8 text-slate-400 animate-bounce" />
            <h5 className="text-sm font-extrabold text-slate-800">Tidak Ada Data Transaksi</h5>
            <p className="text-xs text-slate-500 max-w-md">
              Sektor <strong className="text-slate-800">"{selectedSektor === 'All' ? 'Semua' : selectedSektor}"</strong> pada bulan <strong className="text-slate-800">"{selectedBulan === 'All' ? 'Semua' : INDONESIAN_MONTHS[selectedBulan - 1]}"</strong> tidak memiliki catatan transaksi di tahun {selectedYear}. Coba ganti filter Anda.
            </p>
          </div>
        )}
      </div>
        </>
      )}

      {currentSubTab === 'tabel' && (
        <>
          {/* SECTION 5: TABEL 1 - TREND BULANAN & DETAIL STATUS KPRO */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden" id="details-table-section">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
          <div>
            <h4 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <TableIcon className="w-4 h-4 text-red-500" />
              <span>Trend Bulanan & Detail Order</span>
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              <strong className="text-emerald-600 font-bold">✨ Tip: Klik angka di kolom "COMPWORK" untuk melihat detail realisasi, atau kolom "CANCLWORK" / "WORKFAIL" untuk melihat detail kendala!</strong>
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <AIEvaluationButton
              onClick={() => {
                openAiModal(
                  'Tabel Trend Bulanan & Detail Order Provisioning',
                  {
                    Tahun: selectedYear,
                    SA: selectedSA === 'All' ? 'NASIONAL' : selectedSA,
                    Sektor: selectedSektor === 'All' ? 'Semua Sektor' : selectedSektor,
                    'Total WO': yearSummary.totalWO,
                    'Total RE (Realisasi)': yearSummary.totalRE,
                    'Success Rate': `${yearSummary.completionRate}%`,
                  },
                  monthlyAggregates.map(m => ({
                    Bulan: m.bulanName,
                    'Total WO': m.totalWO,
                    'Total RE': m.totalRE,
                    'Success Rate': `${m.completionRate}%`,
                    COMPWORK: m.statusCounts['COMPWORK'] || 0,
                    CANCLWORK: m.statusCounts['CANCLWORK'] || 0,
                    WORKFAIL: m.statusCounts['WORKFAIL'] || 0,
                  })),
                  {},
                  'Evaluasi performansi provisioning bulanan dan perincian status Kpro. Analisis penyebab kegagalan instalasi (CANCLWORK & WORKFAIL) dan berikan saran perbaikan success rate.'
                );
              }}
            />
            <div className="flex items-center space-x-2 bg-slate-100 text-slate-700 font-semibold px-3 py-1.5 rounded-xl text-xs">
              <Activity className="w-3.5 h-3.5 text-red-500" />
              <span>Tahun {selectedYear}</span>
              <span className="mx-1.5">•</span>
              <span>SA: <strong className="text-slate-900">{selectedSA === 'All' ? 'NASIONAL' : selectedSA}</strong></span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200/60 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 sticky left-0 bg-slate-100 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)] font-black text-slate-800">Bulan</th>
                <th className="py-3 px-3 text-center border-l border-slate-200 bg-red-50/40 text-red-800 font-black">Total WO</th>
                <th className="py-3 px-3 text-center bg-emerald-50/40 text-emerald-800 font-black">Total RE</th>
                <th className="py-3 px-3 text-center bg-indigo-50/40 text-indigo-800 font-black">Success Rate</th>
                
                {/* Dynamically list status column headers */}
                {allUniqueStatuses.map((status) => {
                  const isCompwork = status.toUpperCase() === 'COMPWORK';
                  const isCanclwork = status.toUpperCase() === 'CANCLWORK';
                  const isWorkfail = status.toUpperCase() === 'WORKFAIL';
                  return (
                    <th key={status} className={`py-3 px-3 text-center border-l border-slate-200/40 font-bold text-[10px] ${
                      isCompwork ? 'bg-emerald-50 text-emerald-800 font-black' : (isCanclwork || isWorkfail) ? 'bg-rose-50 text-rose-800 font-black' : 'text-slate-600'
                    }`}>
                      {status || 'BLANK'}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {monthlyAggregates.map((row) => {
                const hasData = row.totalWO > 0;
                return (
                  <tr 
                    key={row.bulan} 
                    className={`hover:bg-slate-50/80 transition-colors ${!hasData ? 'opacity-40 bg-slate-50/30' : ''}`}
                  >
                    {/* Month Name */}
                    <td className="py-3 px-4 font-bold text-slate-800 sticky left-0 bg-white z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)] border-r border-slate-100">
                      {row.bulanName}
                    </td>

                    {/* Total WO */}
                    <td className="py-3 px-3 text-center font-mono font-bold bg-red-50/10 text-slate-900 border-r border-slate-100">
                      {hasData ? formatNum(row.totalWO) : '-'}
                    </td>

                    {/* Total RE */}
                    <td className="py-3 px-3 text-center font-mono font-bold bg-emerald-50/10 text-slate-900 border-r border-slate-100">
                      {hasData ? formatNum(row.totalRE) : '-'}
                    </td>

                    {/* Completion Rate */}
                    <td className="py-3 px-3 text-center font-bold border-r border-slate-100">
                      {hasData ? (
                        <span className={`px-2.5 py-1 rounded-full text-[10.5px] ${
                          row.completionRate >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {row.completionRate}%
                        </span>
                      ) : '-'}
                    </td>

                    {/* Detail Statuses (Column I) with clickable COMPWORK, CANCLWORK & WORKFAIL cells */}
                    {allUniqueStatuses.map((status) => {
                      const count = row.statusCounts[status] || 0;
                      const isCompwork = status.toUpperCase() === 'COMPWORK';
                      const isCanclwork = status.toUpperCase() === 'CANCLWORK';
                      const isWorkfail = status.toUpperCase() === 'WORKFAIL';
                      return (
                        <td 
                          key={status} 
                          className={`py-3 px-3 text-center font-mono text-[11px] border-r border-slate-100 ${
                            isCompwork ? 'bg-emerald-50/20' : (isCanclwork || isWorkfail) ? 'bg-rose-50/20' : ''
                          } ${
                            count > 0 ? 'font-bold text-slate-800' : 'text-slate-300'
                          }`}
                        >
                          {isCompwork && count > 0 ? (
                            <button
                              onClick={() => {
                                setDrilldownMonth(row.bulan);
                                setDrilldownStatus('COMPWORK');
                              }}
                              className="text-emerald-600 hover:text-emerald-800 hover:underline font-extrabold focus:outline-none transition-colors px-2 py-1 rounded bg-emerald-100/40 border border-emerald-200/30 cursor-pointer"
                              title="Klik untuk melihat rincian STO, Segmen & Paket"
                            >
                              {formatNum(count)} 📊
                            </button>
                          ) : isCanclwork && count > 0 ? (
                            <button
                              onClick={() => {
                                setDrilldownMonth(row.bulan);
                                setDrilldownStatus('CANCLWORK');
                              }}
                              className="text-rose-600 hover:text-rose-800 hover:underline font-extrabold focus:outline-none transition-colors px-2 py-1 rounded bg-rose-100/40 border border-rose-200/30 cursor-pointer"
                              title="Klik untuk melihat rincian Kendala & Detail Kendala"
                            >
                              {formatNum(count)} ⚠️
                            </button>
                          ) : isWorkfail && count > 0 ? (
                            <button
                              onClick={() => {
                                setDrilldownMonth(row.bulan);
                                setDrilldownStatus('WORKFAIL');
                              }}
                              className="text-rose-600 hover:text-rose-800 hover:underline font-extrabold focus:outline-none transition-colors px-2 py-1 rounded bg-rose-100/40 border border-rose-200/30 cursor-pointer"
                              title="Klik untuk melihat rincian Kendala & Detail Kendala"
                            >
                              {formatNum(count)} ⚠️
                            </button>
                          ) : (
                            count > 0 ? formatNum(count) : '-'
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
            {/* Table Footer - Total Row with clickable COMPWORK & CANCLWORK totals */}
            <tfoot>
              <tr className="bg-slate-900 text-white font-bold text-xs border-t-2 border-slate-900">
                <td className="py-3.5 px-4 sticky left-0 bg-slate-900 z-10 font-black border-r border-slate-800">
                  TOTAL AKUMULASI
                </td>
                <td className="py-3.5 px-3 text-center font-mono font-black border-r border-slate-800 text-red-400">
                  {formatNum(yearSummary.totalWO)}
                </td>
                <td className="py-3.5 px-3 text-center font-mono font-black border-r border-slate-800 text-emerald-400">
                  {formatNum(yearSummary.totalRE)}
                </td>
                <td className="py-3.5 px-3 text-center font-black border-r border-slate-800 text-indigo-400">
                  {yearSummary.completionRate}%
                </td>
                {allUniqueStatuses.map((status) => {
                  const match = yearSummary.topStatuses.find(item => item.name === status);
                  const totalCount = match ? match.value : 0;
                  const isCompwork = status.toUpperCase() === 'COMPWORK';
                  const isCanclwork = status.toUpperCase() === 'CANCLWORK';
                  const isWorkfail = status.toUpperCase() === 'WORKFAIL';
                  return (
                    <td key={status} className={`py-3.5 px-3 text-center font-mono font-black border-r border-slate-800 ${
                      isCompwork ? 'bg-emerald-950 text-emerald-400' : (isCanclwork || isWorkfail) ? 'bg-rose-950 text-rose-400' : 'text-slate-300'
                    }`}>
                      {isCompwork && totalCount > 0 ? (
                        <button
                          onClick={() => {
                            setDrilldownMonth('all');
                            setDrilldownStatus('COMPWORK');
                          }}
                          className="text-emerald-400 hover:text-emerald-200 hover:underline font-black focus:outline-none transition-colors px-2.5 py-1 rounded bg-emerald-900/40 border border-emerald-800/40 cursor-pointer"
                          title="Klik untuk melihat rincian STO, Segmen & Paket akumulasi tahunan"
                        >
                          {formatNum(totalCount)} 📊
                        </button>
                      ) : isCanclwork && totalCount > 0 ? (
                        <button
                          onClick={() => {
                            setDrilldownMonth('all');
                            setDrilldownStatus('CANCLWORK');
                          }}
                          className="text-rose-400 hover:text-rose-200 hover:underline font-black focus:outline-none transition-colors px-2.5 py-1 rounded bg-rose-900/40 border border-rose-800/40 cursor-pointer"
                          title="Klik untuk melihat rincian Kendala & Detail Kendala akumulasi tahunan"
                        >
                          {formatNum(totalCount)} ⚠️
                        </button>
                      ) : isWorkfail && totalCount > 0 ? (
                        <button
                          onClick={() => {
                            setDrilldownMonth('all');
                            setDrilldownStatus('WORKFAIL');
                          }}
                          className="text-rose-400 hover:text-rose-200 hover:underline font-black focus:outline-none transition-colors px-2.5 py-1 rounded bg-rose-900/40 border border-rose-800/40 cursor-pointer"
                          title="Klik untuk melihat rincian Kendala & Detail Kendala akumulasi tahunan"
                        >
                          {formatNum(totalCount)} ⚠️
                        </button>
                      ) : (
                        totalCount > 0 ? formatNum(totalCount) : '-'
                      )}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

        </>
      )}

      {currentSubTab === 'peta' && (
        <>
          {/* GEOGRAPHICAL COORDINATES MAP PANEL (Independent local filters) */}
          <InteractiveCoordinatesMap 
            allData={provisioningData}
            initialYear={selectedYear}
            initialSA={selectedSA}
            initialSegment={selectedSegment}
            filterOptions={filterOptions}
            onOpenAiEvaluation={openAiModal}
          />
        </>
      )}

      {/* AI Performance Evaluation Modal */}
      <AIEvaluationModal
        isOpen={aiModalState.isOpen}
        onClose={() => setAiModalState(prev => ({ ...prev, isOpen: false }))}
        tableName={aiModalState.tableName}
        dashboardContext="Provisioning Performance Dashboard"
        filterContext={aiModalState.filterContext}
        summaryMetrics={aiModalState.summaryMetrics}
        sampleRows={aiModalState.sampleRows}
        promptNote={aiModalState.promptNote}
      />
    </div>
  );
}
