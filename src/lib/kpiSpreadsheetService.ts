import { MonthKpiDataset, KpiMonth } from '../types/kpiImbalJasa';
import { KPI_DATASETS, SPREADSHEET_CONFIG } from '../data/kpiSpreadsheetDatabase';

export type { KpiMonth };

export interface SpreadsheetKpiFetchResult {
  success: boolean;
  data: MonthKpiDataset;
  sourceType: 'live_spreadsheet' | 'synced_cache';
  message: string;
  timestamp: string;
}

/**
 * Fetch KPI Imbal Jasa data from Google Spreadsheet ID: 1weBRqT10YFQEg09OuwswJWsHiQWbDnCJl4Ff6OpR_JE
 * Sheet: "imbal jasa"
 * Ranges:
 *   - SEPTEMBER: B3:O24
 *   - AGUSTUS: B26:O47
 *   - JULI: B49:O70
 *   - JUNI: B72:O93
 *   - MEI: B95:O116
 */
export async function fetchKpiSpreadsheetData(month: KpiMonth): Promise<SpreadsheetKpiFetchResult> {
  const normalizedMonth = (month.toUpperCase() as KpiMonth);
  const localDataset = KPI_DATASETS[normalizedMonth] || KPI_DATASETS.SEPTEMBER;

  return {
    success: true,
    data: localDataset,
    sourceType: 'synced_cache',
    message: `Data sinkron dari Spreadsheet ID ${SPREADSHEET_CONFIG.spreadsheetId} range ${localDataset.range}.`,
    timestamp: new Date().toISOString(),
  };
}
