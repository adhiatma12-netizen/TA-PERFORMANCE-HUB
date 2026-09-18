export interface KpiIndicatorSpec {
  no: number;
  name: string;
  code: string;
  target: number;
  bobot: number; // in percentage e.g. 10 (%)
  satuan: string; // '%' | 'Unit'
  polaritas: 'MAX' | 'MIN';
  description?: string;
}

export interface KpiSectorRow {
  id: string;
  serviceArea: string;
  sektor: string;
  asgar: number;
  serviceAvailability: number;
  ttr24hNonHvc: number;
  ttr3hDiamond: number;
  ttr3hManja: number;
  ttr6hPlatinum: number;
  ttr12hGold: number;
  outstandingSaldo: number;
  valinsDc: number;
  valinsVisit: number;
  ttrCompSqm4h: number;
  unspecNonWarranty: number;
  closedSqm: number;
  sccInet: number;
  cekFungsiSplicer: number;
  jumlahArcCount: number;
  rasioInuseToInstock: number;
  perf: number;
  rank: number;
}

export interface KpiIndicatorSummaryRow {
  no: number;
  name: string;
  code: string;
  kategori: string;
  satuan: string;
  polaritas: 'MAX' | 'MIN';
  bobot: number;
  target: number;
  branchRealisasi: number;
  pencapaian: number;
  skor: number;
  status: 'Memenuhi' | 'Warning' | 'Di Bawah Target';
  keterangan: string;
}

export type KpiIndicatorRow = KpiIndicatorSummaryRow;

export interface KpiSpreadsheetSourceInfo {
  spreadsheetId: string;
  sheetName: string;
  gid: string;
  month: 'SEPTEMBER' | 'AGUSTUS' | 'JULI';
  range: string;
  imageUrl: string;
  sheetDirectUrl: string;
  lastUpdated: string;
}

export interface MonthKpiDataset {
  month: 'SEPTEMBER' | 'AGUSTUS' | 'JULI';
  monthLabel: string;
  range: string;
  title: string;
  witel: string;
  regional: string;
  source: KpiSpreadsheetSourceInfo;
  specs: KpiIndicatorSpec[];
  sectorRows: KpiSectorRow[];
  totalBranchRow: {
    asgar: number;
    serviceAvailability: number;
    ttr24hNonHvc: number;
    ttr3hDiamond: number;
    ttr3hManja: number;
    ttr6hPlatinum: number;
    ttr12hGold: number;
    outstandingSaldo: number;
    valinsDc: number;
    valinsVisit: number;
    ttrCompSqm4h: number;
    unspecNonWarranty: number;
    closedSqm: number;
    sccInet: number;
    cekFungsiSplicer: number;
    jumlahArcCount: number;
    rasioInuseToInstock: number;
    perf: number;
  };
  indicatorBreakdown: KpiIndicatorSummaryRow[];
  summary: {
    perfBranch: number;
    totalBobot: number;
    totalSkor: number;
    pencapaianRataRata: number;
    statusHakImbalJasa: string;
    persentasePencairan: number;
    totalSektor: number;
    sektorMemenuhiTarget: number;
    sektorWarning: number;
    topSektorName: string;
    topSektorPerf: number;
  };
}
