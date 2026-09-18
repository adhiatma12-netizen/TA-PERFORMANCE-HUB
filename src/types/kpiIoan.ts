export interface KpiIoanIndicator {
  no: number;
  indikator: string;
  target: string;
  targetValue: number;
  realisasi: string;
  realisasiValue: number;
  achv: string;
  achvValue: number;
  status: 'ACHIEVED' | 'UNDER';
  kategori: string;
  unit?: string;
  bobot?: number;
  keterangan?: string;
}

export interface KpiIoanSectorPerf {
  rank: number;
  serviceArea: string;
  sektor: string;
  score: number;
  ttrComplyGamas4H: number;
  ttrComplyFeeder10H: number;
  ttrComplyOdp3H: number;
  ttrCompliance36H: number;
  serviceAvailability: number;
  asgar: number;
  ttr3hDiamond: number;
  ttr6hPlatinum: number;
  ttr3hManja: number;
  ffg: number;
  tti3x24h: number;
  status: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
}

export interface KpiIoanSummary {
  perfIoanOverall: number;
  totalIndikator: number;
  achievedCount: number;
  underCount: number;
  topSektorName: string;
  topSektorPerf: number;
  bottomSektorName: string;
  bottomSektorPerf: number;
  avgAchvPercent: number;
}

export interface KpiIoanDataset {
  title: string;
  subtitle: string;
  spreadsheetId: string;
  sheetName: string;
  gid: string;
  lastUpdated: string;
  summary: KpiIoanSummary;
  indicators: KpiIoanIndicator[];
  sectorPerformances: KpiIoanSectorPerf[];
}
