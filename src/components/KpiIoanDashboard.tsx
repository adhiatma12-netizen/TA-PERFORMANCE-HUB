import React, { useState, useEffect } from 'react';
import { 
  Award, 
  RefreshCw, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  ExternalLink,
  ShieldCheck,
  Zap,
  Radio,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { KpiIoanDataset } from '../types/kpiIoan';
import { fetchKpiIoanSpreadsheetData, SpreadsheetIoanFetchResult } from '../lib/kpiIoanService';
import { INITIAL_KPI_IOAN_DATASET, SPREADSHEET_IOAN_CONFIG } from '../data/kpiIoanDatabase';

export default function KpiIoanDashboard() {
  const [dataset, setDataset] = useState<KpiIoanDataset>(INITIAL_KPI_IOAN_DATASET);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SpreadsheetIoanFetchResult | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACHIEVED' | 'UNDER'>('ALL');
  const [activeTab, setActiveTab] = useState<'indikator' | 'sektor'>('indikator');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await fetchKpiIoanSpreadsheetData();
      setDataset(result.data);
      setSyncStatus(result);
    } catch {
      // Keep dataset on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const categories = ['ALL', 'GAMAS & ACCESS', 'ASSURANCE CORE', 'QUALITY & REPAIR', 'SERVICE AVAILABILITY'];

  const filteredIndicators = dataset.indicators.filter((item) => {
    const matchesSearch = item.indikator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.keterangan && item.keterangan.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'ALL' || item.kategori === selectedCategory;
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6" id="kpi-ioan-dashboard">
      {/* HEADER SECTION */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs" id="kpi-ioan-header-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl text-red-600">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  {dataset.title}
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Sheet: {dataset.sheetName}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {dataset.subtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={SPREADSHEET_IOAN_CONFIG.editUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
              id="kpi-ioan-btn-open-sheet"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Google Sheet</span>
            </a>

            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              id="kpi-ioan-btn-refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Sinkronisasi...' : 'Sinkronkan Data'}</span>
            </button>
          </div>
        </div>

        {/* SUMMARY STATS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100" id="kpi-ioan-stats-bar">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 text-2xs uppercase tracking-wider font-bold">
              <span>Overall Achievement</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">
              {dataset.summary.perfIoanOverall}%
            </div>
            <div className="text-2xs text-emerald-600 font-semibold mt-0.5">
              Rata-rata: {dataset.summary.avgAchvPercent}%
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 text-2xs uppercase tracking-wider font-bold">
              <span>Status Indikator</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">
              <span className="text-emerald-600">{dataset.summary.achievedCount}</span>
              <span className="text-slate-400 mx-1">/</span>
              <span className="text-slate-700">{dataset.summary.totalIndikator}</span>
            </div>
            <div className="text-2xs text-slate-500 font-semibold mt-0.5">
              {dataset.summary.underCount} di bawah target
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 text-2xs uppercase tracking-wider font-bold">
              <span>Top Sektor IOAN</span>
              <Zap className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-lg font-black text-slate-900 mt-1 truncate">
              {dataset.summary.topSektorName}
            </div>
            <div className="text-2xs text-emerald-600 font-semibold mt-0.5">
              Score: {dataset.summary.topSektorPerf}%
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 text-2xs uppercase tracking-wider font-bold">
              <span>Perlu Perhatian</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="text-lg font-black text-slate-900 mt-1 truncate">
              {dataset.summary.bottomSektorName}
            </div>
            <div className="text-2xs text-rose-600 font-semibold mt-0.5">
              Score: {dataset.summary.bottomSektorPerf}%
            </div>
          </div>
        </div>
      </div>

      {/* VIEW TOGGLE BUTTONS & SEARCH BAR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3" id="kpi-ioan-controls">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('indikator')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'indikator'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            id="tab-btn-indikator"
          >
            Daftar 21 Indikator KPI IOAN
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sektor')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'sektor'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            id="tab-btn-sektor"
          >
            Matriks Performansi Sektor
          </button>
        </div>

        {activeTab === 'indikator' && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari indikator IOAN..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500"
                id="kpi-ioan-search-input"
              />
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'ACHIEVED' ? 'ALL' : 'ACHIEVED')}
                className={`px-2.5 py-1.5 rounded-xl text-2xs font-bold border transition-colors cursor-pointer ${
                  statusFilter === 'ACHIEVED'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Tercapai ({dataset.summary.achievedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'UNDER' ? 'ALL' : 'UNDER')}
                className={`px-2.5 py-1.5 rounded-xl text-2xs font-bold border transition-colors cursor-pointer ${
                  statusFilter === 'UNDER'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Under Target ({dataset.summary.underCount})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CATEGORY FILTER CHIPS */}
      {activeTab === 'indikator' && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1" id="kpi-ioan-category-chips">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-2xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat === 'ALL' ? 'Semua Kategori' : cat}
            </button>
          ))}
        </div>
      )}

      {/* TAB 1: INDIKATOR TABLE */}
      {activeTab === 'indikator' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs" id="kpi-ioan-table-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-2xs">
                  <th className="py-3 px-3 w-12 text-center">No</th>
                  <th className="py-3 px-4 min-w-[260px]">Indikator KPI IOAN</th>
                  <th className="py-3 px-3 w-36">Kategori</th>
                  <th className="py-3 px-3 w-28 text-center">Target</th>
                  <th className="py-3 px-3 w-28 text-center">Realisasi</th>
                  <th className="py-3 px-4 w-44 text-center">Pencapaian (Achv)</th>
                  <th className="py-3 px-3 w-28 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIndicators.map((item) => (
                  <tr key={item.no} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 text-center text-slate-500 font-mono font-medium">
                      {item.no}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.indikator}</div>
                      {item.keterangan && (
                        <div className="text-2xs text-slate-500 mt-0.5 line-clamp-1">{item.keterangan}</div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded-md text-2xs font-semibold bg-slate-100 text-slate-700">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">
                      {item.target}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-900">
                      {item.realisasi}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-between text-2xs font-black mb-1">
                        <span className={item.achvValue >= 100 ? 'text-emerald-600' : 'text-rose-600'}>
                          {item.achv}
                        </span>
                        <span className="text-slate-400 font-normal">
                          {item.achvValue >= 100 ? 'Surplus' : 'Defisit'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.achvValue >= 100 ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(item.achvValue, 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-extrabold ${
                          item.status === 'ACHIEVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {item.status === 'ACHIEVED' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Achieved</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3" />
                            <span>Under</span>
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SEKTOR MATRIKS TABLE */}
      {activeTab === 'sektor' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs" id="kpi-ioan-sektor-card">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Matriks Performansi Sektor IOAN Branch Madiun
              </h3>
              <p className="text-2xs text-slate-500">
                Pemeringkatan performansi operasional sektor berdasarkan indikator SLA
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg font-bold bg-slate-100 text-slate-700">
              Total 8 Sektor Utama
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-2xs">
                  <th className="py-3 px-3 w-14 text-center">Rank</th>
                  <th className="py-3 px-4">Service Area</th>
                  <th className="py-3 px-4">Nama Sektor</th>
                  <th className="py-3 px-3 text-center">Score IOAN</th>
                  <th className="py-3 px-3 text-center">Gamas 4H</th>
                  <th className="py-3 px-3 text-center">Feeder 10H</th>
                  <th className="py-3 px-3 text-center">ODP 3H</th>
                  <th className="py-3 px-3 text-center">TTR 36H</th>
                  <th className="py-3 px-3 text-center">Availability</th>
                  <th className="py-3 px-3 text-center">Asgar</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dataset.sectorPerformances.map((s) => (
                  <tr key={s.sektor} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-black text-xs ${
                        s.rank === 1 ? 'bg-amber-100 text-amber-800' :
                        s.rank === 2 ? 'bg-slate-200 text-slate-700' :
                        s.rank === 3 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'text-slate-500 font-mono'
                      }`}>
                        {s.rank}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {s.serviceArea}
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900">
                      {s.sektor}
                    </td>
                    <td className="py-3 px-3 text-center font-black text-emerald-600 text-sm">
                      {s.score}%
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-700">
                      {s.ttrComplyGamas4H}%
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-700">
                      {s.ttrComplyFeeder10H}%
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-700">
                      {s.ttrComplyOdp3H}%
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-700">
                      {s.ttrCompliance36H}%
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-700">
                      {s.serviceAvailability}%
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-700">
                      {s.asgar}%
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-2xs font-extrabold ${
                        s.status === 'OPTIMAL' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        s.status === 'WARNING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
