import { AssuranceTicketRecord, FALLBACK_ASSURANCE_TICKETS } from '../data/assuranceTicketFallback';

export const ASSURANCE_SPREADSHEET_ID = '1zCLSNsVjczGp7tFe6UMnrQh5QYtXKccgvXApPsQw5Hw';
export const DEFAULT_SHEET_TAB = 'REKAP TIKET';

export interface PerformanceRowSummary {
  sektor: string;      // Kolom C
  sto: string;         // Kolom P
  typeTiket: string;   // Kolom B
  flagHvc: string;     // Kolom T
  totalTiket: number;
  regulerCount: number;
  sqmCount: number;
  hvcPlatinumCount: number;
  hvcGoldCount: number;
  hvcDiamondCount: number;
  hvcRegulerCount: number;
  avgTtrHours: number;
  closedCount: number;
  closeRate: number;
  sharePercent: number;
}

export interface SektorPerformanceSummary {
  sektor: string;       // Kolom C
  totalTiket: number;
  regulerCount: number; // Kolom B = REGULER
  sqmCount: number;     // Kolom B = SQM
  stoBreakdown: { [sto: string]: number }; // Kolom P
  hvcBreakdown: { [hvc: string]: number }; // Kolom T
  avgTtrHours: number;
  closedCount: number;
  closeRate: number;
  sharePercent: number;
}

export interface StoPerformanceSummary {
  sto: string;          // Kolom P
  sektor: string;       // Kolom C
  totalTiket: number;
  regulerCount: number; // Kolom B = REGULER
  sqmCount: number;     // Kolom B = SQM
  hvcPlatinum: number;  // Kolom T
  hvcGold: number;      // Kolom T
  hvcOther: number;     // Kolom T
  avgTtrHours: number;
  closedCount: number;
  closeRate: number;
  sharePercent: number;
}

export interface TypeTiketPerformanceSummary {
  typeTiket: string;    // Kolom B
  totalTiket: number;
  sektorMadiun1: number;// Kolom C
  sektorMadiun3: number;// Kolom C
  avgTtrHours: number;
  closedCount: number;
  sharePercent: number;
}

export interface HvcPerformanceSummary {
  flagHvc: string;      // Kolom T
  totalTiket: number;
  regulerTiket: number; // Kolom B
  sqmTiket: number;     // Kolom B
  topSto: string;       // Kolom P
  avgTtrHours: number;
  sharePercent: number;
}

export interface AssuranceTicketDashboardData {
  records: AssuranceTicketRecord[];
  totalRecords: number;
  lastUpdated: string;
  isLive: boolean;
  spreadsheetId: string;
  sheetTab: string;
  kpis: {
    totalTickets: number;
    totalReguler: number;
    totalSqm: number;
    regulerRatio: number;
    sqmRatio: number;
    totalHvc: number;
    hvcRatio: number;
    avgTtrHours: number;
    overallCloseRate: number;
    activeSektors: number;
    activeStos: number;
  };
  bySektor: SektorPerformanceSummary[];
  bySto: StoPerformanceSummary[];
  byTypeTiket: TypeTiketPerformanceSummary[];
  byHvc: HvcPerformanceSummary[];
  matrixPerformance: PerformanceRowSummary[];
}

// Robust CSV Parser
export function parseCSV(text: string): string[][] {
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
      if (char === '\r' && nextChar === '\n') i++;
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
}

// Helper to parse dates from Indonesian/Google Sheets formats
function parseCustomDate(dStr: string): Date | null {
  if (!dStr) return null;
  const trimmed = dStr.trim();
  if (trimmed.includes('-')) {
    const d = new Date(trimmed.replace(' ', 'T'));
    if (!isNaN(d.getTime())) return d;
  }
  const parts = trimmed.split(' ');
  const dateParts = parts[0].split('/');
  if (dateParts.length === 3) {
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const year = parseInt(dateParts[2], 10);
    let hour = 0;
    let min = 0;
    let sec = 0;
    if (parts[1]) {
      const timeParts = parts[1].split(':');
      hour = parseInt(timeParts[0], 10) || 0;
      min = parseInt(timeParts[1], 10) || 0;
      sec = parseInt(timeParts[2], 10) || 0;
    }
    const d = new Date(year, month, day, hour, min, sec);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

// Convert raw TTR string from sheet into clean hours (with 2 decimal digits)
export function parseRawTtrToHours(rawTtr?: string | number, openTimeStr?: string, closeTimeStr?: string): number {
  if (typeof rawTtr === 'number' && !isNaN(rawTtr)) {
    if (rawTtr > 1e10) {
      const str = rawTtr.toString();
      const mantissa = parseFloat(str.split(/[eE]/)[0]);
      return isNaN(mantissa) ? 0 : parseFloat(mantissa.toFixed(2));
    }
    if (rawTtr > 1000) {
      return parseFloat((rawTtr / 1000).toFixed(2));
    }
    return parseFloat(rawTtr.toFixed(2));
  }

  const raw = String(rawTtr || '').trim();
  if (!raw && (!openTimeStr || !closeTimeStr)) return 0;

  // Handle exponential notation like '8,93E+42' or '1,26E+42'
  if (raw.includes('E+') || raw.includes('e+')) {
    const mantissa = raw.split(/[eE]/)[0].replace(',', '.');
    const val = parseFloat(mantissa);
    if (!isNaN(val)) return parseFloat(val.toFixed(2));
  }

  // Handle multiple dots like '22.222.222.222.222.200.000...'
  const dotParts = raw.split('.');
  if (dotParts.length > 2) {
    const val = parseFloat(dotParts[0] + '.' + dotParts[1].slice(0, 2));
    if (!isNaN(val)) return parseFloat(val.toFixed(2));
  }

  // Try parsing regular number with comma/dot
  const normalized = raw.replace(',', '.');
  const num = parseFloat(normalized);
  if (!isNaN(num)) {
    if (num > 1e10) {
      const mantissa = parseFloat(normalized.split(/[eE]/)[0]);
      return isNaN(mantissa) ? 0 : parseFloat(mantissa.toFixed(2));
    }
    if (num > 1000 && !raw.includes('.')) {
      if (openTimeStr && closeTimeStr) {
        const dOpen = parseCustomDate(openTimeStr);
        const dClose = parseCustomDate(closeTimeStr);
        if (dOpen && dClose && dClose >= dOpen) {
          const diff = (dClose.getTime() - dOpen.getTime()) / (1000 * 60 * 60);
          if (diff >= 0 && diff < 5000) return parseFloat(diff.toFixed(2));
        }
      }
      return parseFloat((num / 1000).toFixed(2));
    }
    return parseFloat(num.toFixed(2));
  }

  if (openTimeStr && closeTimeStr) {
    const dOpen = parseCustomDate(openTimeStr);
    const dClose = parseCustomDate(closeTimeStr);
    if (dOpen && dClose && dClose >= dOpen) {
      const diff = (dClose.getTime() - dOpen.getTime()) / (1000 * 60 * 60);
      if (diff >= 0 && diff < 5000) return parseFloat(diff.toFixed(2));
    }
  }

  return 0;
}

// Convert parsed records into calculated metrics
export function computeDashboardData(
  records: AssuranceTicketRecord[],
  spreadsheetId: string = ASSURANCE_SPREADSHEET_ID,
  sheetTab: string = DEFAULT_SHEET_TAB,
  isLive: boolean = false
): AssuranceTicketDashboardData {
  const totalTickets = records.length;
  if (totalTickets === 0) {
    return {
      records: [],
      totalRecords: 0,
      lastUpdated: new Date().toLocaleTimeString('id-ID'),
      isLive,
      spreadsheetId,
      sheetTab,
      kpis: {
        totalTickets: 0,
        totalReguler: 0,
        totalSqm: 0,
        regulerRatio: 0,
        sqmRatio: 0,
        totalHvc: 0,
        hvcRatio: 0,
        avgTtrHours: 0,
        overallCloseRate: 100,
        activeSektors: 0,
        activeStos: 0,
      },
      bySektor: [],
      bySto: [],
      byTypeTiket: [],
      byHvc: [],
      matrixPerformance: [],
    };
  }

  let totalReguler = 0;
  let totalSqm = 0;
  let totalHvc = 0;
  let sumTtr = 0;
  let validTtrCount = 0;
  let totalClosed = 0;

  const sektorMap = new Map<string, {
    total: number;
    reguler: number;
    sqm: number;
    stos: { [sto: string]: number };
    hvcs: { [hvc: string]: number };
    sumTtr: number;
    ttrCount: number;
    closed: number;
  }>();

  const stoMap = new Map<string, {
    sektor: string;
    total: number;
    reguler: number;
    sqm: number;
    hvcPlat: number;
    hvcGold: number;
    hvcOther: number;
    sumTtr: number;
    ttrCount: number;
    closed: number;
  }>();

  const typeMap = new Map<string, {
    total: number;
    madiun1: number;
    madiun3: number;
    sumTtr: number;
    ttrCount: number;
    closed: number;
  }>();

  const hvcMap = new Map<string, {
    total: number;
    reguler: number;
    sqm: number;
    stos: { [sto: string]: number };
    sumTtr: number;
    ttrCount: number;
  }>();

  // Matrix key: `${sektor}|${sto}|${typeTiket}|${flagHvc}`
  const matrixMap = new Map<string, {
    sektor: string;
    sto: string;
    typeTiket: string;
    flagHvc: string;
    count: number;
    sumTtr: number;
    ttrCount: number;
    closed: number;
  }>();

  records.forEach(rec => {
    const isReguler = rec.typeTiket.includes('REGULER');
    const isSqm = rec.typeTiket.includes('SQM');
    if (isReguler) totalReguler++;
    if (isSqm) totalSqm++;

    const isHvcRecord = rec.flagHvc.startsWith('HVC_');
    if (isHvcRecord) totalHvc++;

    if (rec.ttr > 0) {
      sumTtr += rec.ttr;
      validTtrCount++;
    }

    if (rec.status.toUpperCase() === 'CLOSED') {
      totalClosed++;
    }

    // 1. Sektor Grouping (Kolom C)
    const sektorKey = rec.sektor || 'LAINNYA';
    if (!sektorMap.has(sektorKey)) {
      sektorMap.set(sektorKey, {
        total: 0,
        reguler: 0,
        sqm: 0,
        stos: {},
        hvcs: {},
        sumTtr: 0,
        ttrCount: 0,
        closed: 0,
      });
    }
    const sEntry = sektorMap.get(sektorKey)!;
    sEntry.total++;
    if (isReguler) sEntry.reguler++;
    if (isSqm) sEntry.sqm++;
    sEntry.stos[rec.sto] = (sEntry.stos[rec.sto] || 0) + 1;
    sEntry.hvcs[rec.flagHvc] = (sEntry.hvcs[rec.flagHvc] || 0) + 1;
    if (rec.ttr > 0) {
      sEntry.sumTtr += rec.ttr;
      sEntry.ttrCount++;
    }
    if (rec.status.toUpperCase() === 'CLOSED') sEntry.closed++;

    // 2. STO Grouping (Kolom P)
    const stoKey = rec.sto || 'UNKNOWN';
    if (!stoMap.has(stoKey)) {
      stoMap.set(stoKey, {
        sektor: rec.sektor,
        total: 0,
        reguler: 0,
        sqm: 0,
        hvcPlat: 0,
        hvcGold: 0,
        hvcOther: 0,
        sumTtr: 0,
        ttrCount: 0,
        closed: 0,
      });
    }
    const stoEntry = stoMap.get(stoKey)!;
    stoEntry.total++;
    if (isReguler) stoEntry.reguler++;
    if (isSqm) stoEntry.sqm++;
    if (rec.flagHvc.includes('PLATINUM')) stoEntry.hvcPlat++;
    else if (rec.flagHvc.includes('GOLD')) stoEntry.hvcGold++;
    else stoEntry.hvcOther++;
    if (rec.ttr > 0) {
      stoEntry.sumTtr += rec.ttr;
      stoEntry.ttrCount++;
    }
    if (rec.status.toUpperCase() === 'CLOSED') stoEntry.closed++;

    // 3. Type Tiket Grouping (Kolom B)
    const typeKey = rec.typeTiket || 'REGULER';
    if (!typeMap.has(typeKey)) {
      typeMap.set(typeKey, {
        total: 0,
        madiun1: 0,
        madiun3: 0,
        sumTtr: 0,
        ttrCount: 0,
        closed: 0,
      });
    }
    const tEntry = typeMap.get(typeKey)!;
    tEntry.total++;
    if (rec.sektor.includes('1')) tEntry.madiun1++;
    else tEntry.madiun3++;
    if (rec.ttr > 0) {
      tEntry.sumTtr += rec.ttr;
      tEntry.ttrCount++;
    }
    if (rec.status.toUpperCase() === 'CLOSED') tEntry.closed++;

    // 4. FLAG HVC Grouping (Kolom T)
    const hvcKey = rec.flagHvc || 'REGULER';
    if (!hvcMap.has(hvcKey)) {
      hvcMap.set(hvcKey, {
        total: 0,
        reguler: 0,
        sqm: 0,
        stos: {},
        sumTtr: 0,
        ttrCount: 0,
      });
    }
    const hEntry = hvcMap.get(hvcKey)!;
    hEntry.total++;
    if (isReguler) hEntry.reguler++;
    if (isSqm) hEntry.sqm++;
    hEntry.stos[rec.sto] = (hEntry.stos[rec.sto] || 0) + 1;
    if (rec.ttr > 0) {
      hEntry.sumTtr += rec.ttr;
      hEntry.ttrCount++;
    }

    // 5. Matrix Sektor x STO x Type x HVC (Kolom C, P, B, T)
    const mKey = `${rec.sektor}__${rec.sto}__${rec.typeTiket}__${rec.flagHvc}`;
    if (!matrixMap.has(mKey)) {
      matrixMap.set(mKey, {
        sektor: rec.sektor,
        sto: rec.sto,
        typeTiket: rec.typeTiket,
        flagHvc: rec.flagHvc,
        count: 0,
        sumTtr: 0,
        ttrCount: 0,
        closed: 0,
      });
    }
    const mEntry = matrixMap.get(mKey)!;
    mEntry.count++;
    if (rec.ttr > 0) {
      mEntry.sumTtr += rec.ttr;
      mEntry.ttrCount++;
    }
    if (rec.status.toUpperCase() === 'CLOSED') mEntry.closed++;
  });

  const bySektor: SektorPerformanceSummary[] = Array.from(sektorMap.entries())
    .map(([sektor, val]) => ({
      sektor,
      totalTiket: val.total,
      regulerCount: val.reguler,
      sqmCount: val.sqm,
      stoBreakdown: val.stos,
      hvcBreakdown: val.hvcs,
      avgTtrHours: val.ttrCount > 0 ? parseFloat((val.sumTtr / val.ttrCount).toFixed(2)) : 0,
      closedCount: val.closed,
      closeRate: val.total > 0 ? parseFloat(((val.closed / val.total) * 100).toFixed(1)) : 100,
      sharePercent: parseFloat(((val.total / totalTickets) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.totalTiket - a.totalTiket);

  const bySto: StoPerformanceSummary[] = Array.from(stoMap.entries())
    .map(([sto, val]) => ({
      sto,
      sektor: val.sektor,
      totalTiket: val.total,
      regulerCount: val.reguler,
      sqmCount: val.sqm,
      hvcPlatinum: val.hvcPlat,
      hvcGold: val.hvcGold,
      hvcOther: val.hvcOther,
      avgTtrHours: val.ttrCount > 0 ? parseFloat((val.sumTtr / val.ttrCount).toFixed(2)) : 0,
      closedCount: val.closed,
      closeRate: val.total > 0 ? parseFloat(((val.closed / val.total) * 100).toFixed(1)) : 100,
      sharePercent: parseFloat(((val.total / totalTickets) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.totalTiket - a.totalTiket);

  const byTypeTiket: TypeTiketPerformanceSummary[] = Array.from(typeMap.entries())
    .map(([typeTiket, val]) => ({
      typeTiket,
      totalTiket: val.total,
      sektorMadiun1: val.madiun1,
      sektorMadiun3: val.madiun3,
      avgTtrHours: val.ttrCount > 0 ? parseFloat((val.sumTtr / val.ttrCount).toFixed(2)) : 0,
      closedCount: val.closed,
      sharePercent: parseFloat(((val.total / totalTickets) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.totalTiket - a.totalTiket);

  const byHvc: HvcPerformanceSummary[] = Array.from(hvcMap.entries())
    .map(([flagHvc, val]) => {
      let topSto = '-';
      let maxStoCount = 0;
      Object.entries(val.stos).forEach(([s, c]) => {
        if (c > maxStoCount) {
          maxStoCount = c;
          topSto = s;
        }
      });
      return {
        flagHvc,
        totalTiket: val.total,
        regulerTiket: val.reguler,
        sqmTiket: val.sqm,
        topSto,
        avgTtrHours: val.ttrCount > 0 ? parseFloat((val.sumTtr / val.ttrCount).toFixed(2)) : 0,
        sharePercent: parseFloat(((val.total / totalTickets) * 100).toFixed(1)),
      };
    })
    .sort((a, b) => b.totalTiket - a.totalTiket);

  const matrixPerformance: PerformanceRowSummary[] = Array.from(matrixMap.values())
    .map(val => ({
      sektor: val.sektor,
      sto: val.sto,
      typeTiket: val.typeTiket,
      flagHvc: val.flagHvc,
      totalTiket: val.count,
      regulerCount: val.typeTiket.includes('REGULER') ? val.count : 0,
      sqmCount: val.typeTiket.includes('SQM') ? val.count : 0,
      hvcPlatinumCount: val.flagHvc.includes('PLATINUM') ? val.count : 0,
      hvcGoldCount: val.flagHvc.includes('GOLD') ? val.count : 0,
      hvcDiamondCount: val.flagHvc.includes('DIAMOND') ? val.count : 0,
      hvcRegulerCount: val.flagHvc === 'REGULER' ? val.count : 0,
      avgTtrHours: val.ttrCount > 0 ? parseFloat((val.sumTtr / val.ttrCount).toFixed(2)) : 0,
      closedCount: val.closed,
      closeRate: val.count > 0 ? parseFloat(((val.closed / val.count) * 100).toFixed(1)) : 100,
      sharePercent: parseFloat(((val.count / totalTickets) * 100).toFixed(2)),
    }))
    .sort((a, b) => b.totalTiket - a.totalTiket);

  return {
    records,
    totalRecords: totalTickets,
    lastUpdated: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    isLive,
    spreadsheetId,
    sheetTab,
    kpis: {
      totalTickets,
      totalReguler,
      totalSqm,
      regulerRatio: parseFloat(((totalReguler / totalTickets) * 100).toFixed(1)),
      sqmRatio: parseFloat(((totalSqm / totalTickets) * 100).toFixed(1)),
      totalHvc,
      hvcRatio: parseFloat(((totalHvc / totalTickets) * 100).toFixed(1)),
      avgTtrHours: validTtrCount > 0 ? parseFloat((sumTtr / validTtrCount).toFixed(2)) : 0,
      overallCloseRate: totalTickets > 0 ? parseFloat(((totalClosed / totalTickets) * 100).toFixed(1)) : 100,
      activeSektors: sektorMap.size,
      activeStos: stoMap.size,
    },
    bySektor,
    bySto,
    byTypeTiket,
    byHvc,
    matrixPerformance,
  };
}

// Fetch live tickets from Google Sheets with fallback
export async function fetchAssuranceTickets(
  spreadsheetId: string = ASSURANCE_SPREADSHEET_ID,
  sheetTab: string = DEFAULT_SHEET_TAB
): Promise<AssuranceTicketDashboardData> {
  const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetTab)}`;
  const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&sheet=${encodeURIComponent(sheetTab)}`;

  try {
    let response = await fetch(gvizUrl);
    if (!response.ok) {
      response = await fetch(exportUrl);
    }

    if (!response.ok) {
      throw new Error(`Koneksi HTTP gagal (${response.status}): ${response.statusText}`);
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);

    if (!rows || rows.length <= 1) {
      throw new Error('Data spreadsheet kosong atau header tidak ditemukan.');
    }

    const records: AssuranceTicketRecord[] = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r[1] && !r[2] && !r[3]) continue;

      const ttrNum = parseRawTtrToHours(r[10], r[5], r[7]);

      records.push({
        id: i,
        bulanRekap: r[0] || 'Agustus',
        typeTiket: (r[1] || 'REGULER').trim().toUpperCase(),    // Kolom B
        sektor: (r[2] || 'MADIUN_1').trim(),                     // Kolom C
        troubleNo: r[3] || '',                                   // Kolom D
        troubleNumber: r[4] || '',                               // Kolom E
        troubleOpenTime: r[5] || '',                             // Kolom F
        dateClose: r[6] || '',                                   // Kolom G
        troubleCloseTime: r[7] || '',                            // Kolom H
        status: r[9] || 'CLOSED',                                // Kolom J
        ttr: ttrNum,                                             // Kolom K
        rawTtr: r[10] || '',
        subsegmentasi: r[12] || '',                              // Kolom M
        typeLayanan: (r[13] || 'INTERNET').trim().toUpperCase(), // Kolom N (TKASSETTYPE)
        plblcl: r[14] || '',                                     // Kolom O
        sto: (r[15] || 'MNZ').trim().toUpperCase(),              // Kolom P
        odp: r[16] || '',                                        // Kolom Q
        isGamas: r[17] === '1' ? 'GAMAS' : 'NON-GAMAS',          // Kolom R
        flagHvc: (r[19] || 'REGULER').trim().toUpperCase(),      // Kolom T
        typeSqm: r[23] || '',                                    // Kolom X
        mapping: r[24] || '',                                    // Kolom Y
        actualSolution: r[22] || '',                             // Kolom W
        closedBy: r[43] || '',                                   // Kolom AR
        branchTsel: r[46] || 'MADIUN',                           // Kolom AU
      });
    }

    return computeDashboardData(records, spreadsheetId, sheetTab, true);
  } catch (error: any) {
    console.warn('Gagal mengambil data live dari spreadsheet, menggunakan fallback data:', error.message);
    return computeDashboardData(FALLBACK_ASSURANCE_TICKETS, spreadsheetId, sheetTab, false);
  }
}
