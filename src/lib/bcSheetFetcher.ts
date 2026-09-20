import { FALLBACK_BC_DATA, BCItemRecord } from '../data/bcFallbackData';

export type BCRecord = BCItemRecord;

export interface ProgramDetail {
  namaProgram: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  marginPercent: number;
  cogsRatioPercent: number;
  portofolio?: string;
  bulan?: string;
}

export interface PortfolioSummary {
  portofolio: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  marginPercent: number;
  cogsRatioPercent: number;
  programs: ProgramDetail[];
}

export interface MonthSummary {
  bulan: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  marginPercent: number;
  cogsRatioPercent: number;
  portfolios: PortfolioSummary[];
}

export interface BCDashboardStats {
  selectedBulan: string;
  availableMonths: string[];
  totalRevenue: number;
  totalCogs: number;
  totalGrossProfit: number;
  totalMarginPercent: number;
  portfolios: PortfolioSummary[];
  allPrograms: (ProgramDetail & { portofolio: string; bulan?: string })[];
  monthlyBreakdown: {
    bulan: string;
    revenue: number;
    cogs: number;
    grossProfit: number;
    marginPercent: number;
  }[];
  rawRecordCount: number;
  lastUpdated: string;
  isLive: boolean;
  sheetSource: string;
}

// Parse Indonesian currency accounting strings like "(16.022.701.152)" or "6.464.856.451"
export const parseBCAmount = (str: string | number): number => {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  let s = String(str).trim();
  if (s === '-' || s === '') return 0;
  let isNegative = false;
  
  if (s.startsWith('(') && s.endsWith(')')) {
    isNegative = true;
    s = s.slice(1, -1).trim();
  } else if (s.startsWith('-')) {
    isNegative = true;
    s = s.slice(1).trim();
  }

  // Strip dots and commas used as thousand separators
  s = s.replace(/\./g, '').replace(/,/g, '');
  const parsed = parseFloat(s);
  if (isNaN(parsed)) return 0;
  return isNegative ? -parsed : parsed;
};

// Robust CSV Parser handling embedded quotes and multiline values
export const parseCSV = (text: string): string[][] => {
  const result: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentVal = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(currentVal.trim());
      if (row.length > 0) result.push(row);
      row = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal || row.length > 0) {
    row.push(currentVal.trim());
    result.push(row);
  }

  return result;
};

export const SPREADSHEET_ID = '1weBRqT10YFQEg09OuwswJWsHiQWbDnCJl4Ff6OpR_JE';
export const SHEET_NAME = 'BC 2026';
export const SHEET_GID = '992042125';

// Known 5 Portfolio headers in the sheet BC 2026
const PORTFOLIO_ORDER = ['Konstruksi', 'MS CAPEX', 'MS OPEX', 'Provisioning', 'SDI'];

export interface MonthConfig {
  name: string;
  startCol: number;
  startRow: number;
  endRow: number;
}

export const MONTH_CONFIGS: MonthConfig[] = [
  { name: 'April', startCol: 1, startRow: 3, endRow: 37 },  // Kolom B2:E38 (index 1 to 4, rows 3 to 37)
  { name: 'Mei', startCol: 6, startRow: 3, endRow: 37 },    // Kolom G2:J38 (index 6 to 9, rows 3 to 37)
  { name: 'Juni', startCol: 11, startRow: 3, endRow: 38 },  // Kolom L2:O39 (index 11 to 14, rows 3 to 38)
];

// Fetcher from Google Sheets BC 2026
export const fetchBCDataFromSheet = async (): Promise<{ records: BCRecord[]; isLive: boolean; rawRowsCount: number }> => {
  const exportUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
  const gvizUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;

  let csvText = '';
  let isLive = false;

  try {
    const res = await fetch(exportUrl);
    if (res.ok) {
      csvText = await res.text();
      if (csvText && csvText.includes('BC APRIL 2026')) {
        isLive = true;
      }
    }
  } catch (err) {
    console.warn('Gagal fetch export URL, mencoba gviz:', err);
  }

  if (!isLive) {
    try {
      const resGviz = await fetch(gvizUrl);
      if (resGviz.ok) {
        const text = await resGviz.text();
        if (text && text.includes('BC APRIL 2026')) {
          csvText = text;
          isLive = true;
        }
      }
    } catch (err) {
      console.warn('Gagal fetch gviz URL:', err);
    }
  }

  if (!isLive || !csvText) {
    console.warn('Menggunakan data fallback BC 2026 terverifikasi');
    return { records: FALLBACK_BC_DATA, isLive: false, rawRowsCount: FALLBACK_BC_DATA.length };
  }

  try {
    const rows = parseCSV(csvText);
    if (!rows || rows.length < 35) {
      throw new Error('Data sheet tidak mencukupi format baris BC 2026');
    }

    const records: BCRecord[] = [];

    MONTH_CONFIGS.forEach((cfg) => {
      let nextPortIdx = 0;
      let curPort = '';

      for (let r = cfg.startRow; r <= cfg.endRow; r++) {
        const row = rows[r];
        if (!row) continue;

        const label = (row[cfg.startCol] || '').trim();
        const cogsRaw = row[cfg.startCol + 1] || '';
        const revRaw = row[cfg.startCol + 2] || '';

        if (!label || label.toLowerCase() === 'grand total') continue;

        if (nextPortIdx < PORTFOLIO_ORDER.length && label === PORTFOLIO_ORDER[nextPortIdx]) {
          curPort = label;
          nextPortIdx++;
        } else if (curPort) {
          let progName = label;
          if (!progName || progName === '(blank)') {
            progName = `Biaya Lain-lain / Overhead (${curPort})`;
          }

          const cogsVal = parseBCAmount(cogsRaw);
          const revVal = Math.abs(parseBCAmount(revRaw));

          records.push({
            bulan: cfg.name,
            portofolio: curPort,
            namaProgram: progName,
            revenue: revVal,
            cogs: cogsVal,
          });
        }
      }
    });

    if (records.length === 0) {
      throw new Error('Tidak ada data program yang ter-parse.');
    }

    return { records, isLive: true, rawRowsCount: records.length };
  } catch (err) {
    console.warn('Error saat parsing live sheet BC 2026, fallback ke data terverifikasi:', err);
    return { records: FALLBACK_BC_DATA, isLive: false, rawRowsCount: FALLBACK_BC_DATA.length };
  }
};

// Calculate complete statistics per Portfolio and Program
export const calculateBCStats = (
  allRecords: BCRecord[],
  filterBulan: string = 'Semua Bulan'
): BCDashboardStats => {
  const availableMonths = ['April', 'Mei', 'Juni'];

  // Calculate monthly breakdown across all 3 months
  const monthlyBreakdown = availableMonths.map((mName) => {
    const mRecords = allRecords.filter((r) => r.bulan.toLowerCase() === mName.toLowerCase());
    let mRev = 0;
    let mCogs = 0;
    mRecords.forEach((r) => {
      mRev += r.revenue;
      mCogs += r.cogs;
    });
    const mProfit = mRev - mCogs;
    const mMargin = mRev > 0 ? (mProfit / mRev) * 100 : 0;
    return {
      bulan: mName,
      revenue: mRev,
      cogs: mCogs,
      grossProfit: mProfit,
      marginPercent: mMargin,
    };
  });

  // Filter records based on selection
  const isAll = filterBulan === 'Semua Bulan' || !filterBulan || filterBulan.toLowerCase().includes('q2');
  const filtered = allRecords.filter((r) => {
    if (isAll) return true;
    return r.bulan.toLowerCase() === filterBulan.toLowerCase();
  });

  // Aggregate by Portfolio
  const portMap: Record<
    string,
    {
      revenue: number;
      cogs: number;
      programs: Record<string, { revenue: number; cogs: number }>;
    }
  > = {};

  // Initialize known portfolios in standard order
  PORTFOLIO_ORDER.forEach((pName) => {
    portMap[pName] = { revenue: 0, cogs: 0, programs: {} };
  });

  let totalRevenue = 0;
  let totalCogs = 0;

  filtered.forEach((r) => {
    const port = r.portofolio || 'Lain-lain';
    const prog = r.namaProgram || 'Unassigned';

    if (!portMap[port]) {
      portMap[port] = { revenue: 0, cogs: 0, programs: {} };
    }
    if (!portMap[port].programs[prog]) {
      portMap[port].programs[prog] = { revenue: 0, cogs: 0 };
    }

    portMap[port].revenue += r.revenue;
    portMap[port].cogs += r.cogs;
    portMap[port].programs[prog].revenue += r.revenue;
    portMap[port].programs[prog].cogs += r.cogs;

    totalRevenue += r.revenue;
    totalCogs += r.cogs;
  });

  const totalGrossProfit = totalRevenue - totalCogs;
  const totalMarginPercent = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

  // Build Portfolio Summaries
  const portfolios: PortfolioSummary[] = Object.entries(portMap)
    .map(([portName, pData]) => {
      const grossProfit = pData.revenue - pData.cogs;
      const marginPercent = pData.revenue > 0 ? (grossProfit / pData.revenue) * 100 : 0;
      const cogsRatioPercent = pData.revenue > 0 ? (pData.cogs / pData.revenue) * 100 : 0;

      const programs: ProgramDetail[] = Object.entries(pData.programs)
        .map(([progName, prgData]) => {
          const prgGrossProfit = prgData.revenue - prgData.cogs;
          const prgMarginPercent = prgData.revenue > 0 ? (prgGrossProfit / prgData.revenue) * 100 : 0;
          const prgCogsRatio = prgData.revenue > 0 ? (prgData.cogs / prgData.revenue) * 100 : 0;

          return {
            namaProgram: progName,
            revenue: prgData.revenue,
            cogs: prgData.cogs,
            grossProfit: prgGrossProfit,
            marginPercent: prgMarginPercent,
            cogsRatioPercent: prgCogsRatio,
            portofolio: portName,
          };
        })
        .sort((a, b) => b.revenue - a.revenue);

      return {
        portofolio: portName,
        revenue: pData.revenue,
        cogs: pData.cogs,
        grossProfit,
        marginPercent,
        cogsRatioPercent,
        programs,
      };
    })
    // Sort by revenue or keep standard portfolio order
    .sort((a, b) => {
      const orderA = PORTFOLIO_ORDER.indexOf(a.portofolio);
      const orderB = PORTFOLIO_ORDER.indexOf(b.portofolio);
      if (orderA !== -1 && orderB !== -1) return orderA - orderB;
      return b.revenue - a.revenue;
    });

  // Flatten all programs for master detail view
  const allPrograms: (ProgramDetail & { portofolio: string; bulan?: string })[] = [];
  portfolios.forEach((p) => {
    p.programs.forEach((prog) => {
      allPrograms.push({
        ...prog,
        portofolio: p.portofolio,
      });
    });
  });

  return {
    selectedBulan: isAll ? 'Semua Bulan' : filterBulan,
    availableMonths,
    totalRevenue,
    totalCogs,
    totalGrossProfit,
    totalMarginPercent,
    portfolios,
    allPrograms,
    monthlyBreakdown,
    rawRecordCount: filtered.length,
    lastUpdated: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    isLive: true,
    sheetSource: `SS ID: ${SPREADSHEET_ID} | Sheet: ${SHEET_NAME}`,
  };
};
