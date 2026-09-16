import { FALLBACK_BC_DATA, BCRecord } from '../data/bcFallbackData';

export interface ParsedBCRow {
  bulan: string;        // Kolom A
  portofolio: string;   // Kolom Q
  namaProgram: string;  // Kolom R
  groupAkun: string;    // Kolom P ('REVENUE' | 'COGS')
  amount: number;       // Kolom G
}

export interface ProgramDetail {
  namaProgram: string;
  revenue: number;
  cogs: number;
  grossProfit: number; // revenue - cogs
  marginPercent: number; // (grossProfit / revenue) * 100
  cogsRatioPercent: number; // (cogs / revenue) * 100
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

export interface BCDashboardStats {
  selectedBulan: string;
  availableMonths: string[];
  totalRevenue: number;
  totalCogs: number;
  totalGrossProfit: number;
  totalMarginPercent: number;
  portfolios: PortfolioSummary[];
  allPrograms: (ProgramDetail & { portofolio: string })[];
  rawRecordCount: number;
  lastUpdated: string;
  isLive: boolean;
}

// Parse Indonesian currency accounting strings like "(16.022.701.152)" or "6.464.856.451"
export const parseBCAmount = (str: string): number => {
  if (!str) return 0;
  let s = String(str).trim();
  let isNegative = false;
  
  if (s.startsWith('(') && s.endsWith(')')) {
    isNegative = true;
    s = s.slice(1, -1).trim();
  } else if (s.startsWith('-')) {
    isNegative = true;
    s = s.slice(1).trim();
  }

  // Strip thousands separators (dots) and convert decimal comma to dot
  s = s.replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(s);
  if (isNaN(parsed)) return 0;
  return isNegative ? -parsed : parsed;
};

// CSV Line Parser
const parseCSV = (text: string): string[][] => {
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

export const fetchBCDataFromSheet = async (): Promise<{ records: BCRecord[]; isLive: boolean }> => {
  const spreadsheetId = '1weBRqT10YFQEg09OuwswJWsHiQWbDnCJl4Ff6OpR_JE';
  const sheetName = 'BC';
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);

    if (!rows || rows.length <= 1) {
      throw new Error('Spreadsheet BC kosong.');
    }

    const records: BCRecord[] = [];

    // Row 0 is header:
    // Col 0 (A): BULAN
    // Col 6 (G): Amount in Local Currency
    // Col 15 (P): Group Akun ('REVENUE' | 'COGS')
    // Col 16 (Q): Fortofolio
    // Col 17 (R): Nama Program
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length < 18) continue;

      const bulan = r[0] ? r[0].trim() : '';
      const amtRaw = r[6] || '0';
      const grp = r[15] ? r[15].toUpperCase().trim() : '';
      const port = r[16] ? r[16].trim() : '';
      const prog = r[17] ? r[17].trim() : '';

      if (grp !== 'REVENUE' && grp !== 'COGS') continue;
      if (!port && !prog) continue;

      const amtNum = Math.abs(parseBCAmount(amtRaw));

      records.push({
        bulan: bulan || 'Lain-lain',
        portofolio: port || 'Lain-lain',
        namaProgram: prog || 'Unassigned',
        groupAkun: grp,
        amount: amtNum,
      });
    }

    if (records.length === 0) {
      throw new Error('Tidak ada data valid yang dapat di-parse.');
    }

    return { records, isLive: true };
  } catch (err) {
    console.warn('Gagal memuat spreadsheet BC secara live, menggunakan data fallback terverifikasi:', err);
    return { records: FALLBACK_BC_DATA, isLive: false };
  }
};

// Logika Berhitung (Calculation Engine)
export const calculateBCStats = (
  allRecords: BCRecord[],
  filterBulan: string = 'Semua Bulan'
): BCDashboardStats => {
  // 1. Extract available months dynamically from Kolom A
  const monthSet = new Set<string>();
  allRecords.forEach((r) => {
    if (r.bulan) monthSet.add(r.bulan);
  });

  // Standard month order helper
  const MONTH_ORDER = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const availableMonths = Array.from(monthSet).sort((a, b) => {
    const idxA = MONTH_ORDER.indexOf(a);
    const idxB = MONTH_ORDER.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    return a.localeCompare(b);
  });

  // 2. Filter records by Kolom A (BULAN)
  const filteredRecords = allRecords.filter((r) => {
    if (filterBulan === 'Semua Bulan' || !filterBulan) return true;
    return r.bulan.toLowerCase() === filterBulan.toLowerCase();
  });

  // 3. Aggregate by Portofolio (Kolom Q) -> Nama Program (Kolom R)
  const portfolioMap: Record<
    string,
    {
      revenue: number;
      cogs: number;
      programs: Record<string, { revenue: number; cogs: number }>;
    }
  > = {};

  let totalRevenue = 0;
  let totalCogs = 0;

  filteredRecords.forEach((r) => {
    const port = r.portofolio || 'Lain-lain';
    const prog = r.namaProgram || 'Unassigned';

    if (!portfolioMap[port]) {
      portfolioMap[port] = { revenue: 0, cogs: 0, programs: {} };
    }
    if (!portfolioMap[port].programs[prog]) {
      portfolioMap[port].programs[prog] = { revenue: 0, cogs: 0 };
    }

    if (r.groupAkun === 'REVENUE') {
      portfolioMap[port].revenue += r.amount;
      portfolioMap[port].programs[prog].revenue += r.amount;
      totalRevenue += r.amount;
    } else if (r.groupAkun === 'COGS') {
      portfolioMap[port].cogs += r.amount;
      portfolioMap[port].programs[prog].cogs += r.amount;
      totalCogs += r.amount;
    }
  });

  const totalGrossProfit = totalRevenue - totalCogs;
  const totalMarginPercent = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

  // Build Portfolio Summaries
  const portfolios: PortfolioSummary[] = Object.entries(portfolioMap)
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
    .sort((a, b) => b.revenue - a.revenue);

  // Flatten all programs for master detail view
  const allPrograms: (ProgramDetail & { portofolio: string })[] = [];
  portfolios.forEach((p) => {
    p.programs.forEach((prog) => {
      allPrograms.push({
        ...prog,
        portofolio: p.portofolio,
      });
    });
  });

  return {
    selectedBulan: filterBulan,
    availableMonths,
    totalRevenue,
    totalCogs,
    totalGrossProfit,
    totalMarginPercent,
    portfolios,
    allPrograms,
    rawRecordCount: filteredRecords.length,
    lastUpdated: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    isLive: true,
  };
};
