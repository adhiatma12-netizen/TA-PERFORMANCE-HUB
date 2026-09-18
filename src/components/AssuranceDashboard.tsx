import React, { useState } from 'react';
import { Ticket, Activity, FileSpreadsheet, Award, Layers, ArrowLeft } from 'lucide-react';
import { RegionalPerformanceData, Regional } from '../types';
import TicketPerformanceDashboard from './TicketPerformanceDashboard';
import TicketEvaluationDashboard from './TicketEvaluationDashboard';
import TicketLogDashboard from './TicketLogDashboard';
import KpiImbalJasaDashboard from './KpiImbalJasaDashboard';
import KpiIoanDashboard from './KpiIoanDashboard';

export type AssuranceSubTab = 'ticket_perf' | 'operations' | 'ticket_logs' | 'kpi_imbal_jasa' | 'kpi_ioan';

interface AssuranceDashboardProps {
  data: RegionalPerformanceData;
  allRegionsData: { [key: string]: RegionalPerformanceData };
  activeRegional: Regional;
  activeSubTab?: AssuranceSubTab;
  setActiveSubTab?: (tab: AssuranceSubTab) => void;
}

export default function AssuranceDashboard({ 
  data: _data, 
  allRegionsData: _allRegionsData, 
  activeRegional: _activeRegional,
  activeSubTab,
  setActiveSubTab
}: AssuranceDashboardProps) {
  // Active sub-tab inside Assurance Dashboard
  const [internalTab, setInternalTab] = useState<AssuranceSubTab>('kpi_imbal_jasa');
  const assuranceTab = activeSubTab ?? internalTab;

  const setAssuranceTab = (tab: AssuranceSubTab) => {
    if (setActiveSubTab) {
      setActiveSubTab(tab);
    } else {
      setInternalTab(tab);
    }
  };

  const isKpiMode = assuranceTab === 'kpi_imbal_jasa' || assuranceTab === 'kpi_ioan';

  return (
    <div className="space-y-6" id="assurance-dashboard">
      {/* HORIZONTAL SUB-NAVIGATION TABS (SUB-BAB INDIKATOR KPI) */}
      <div 
        className="bg-white border border-slate-200/90 rounded-2xl p-1.5 shadow-2xs flex flex-wrap items-center justify-between gap-1.5" 
        id="assurance-subnav-bar"
      >
        {isKpiMode ? (
          /* SUB-BAB INDIKATOR KPI MODE */
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setAssuranceTab('kpi_imbal_jasa')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                assuranceTab === 'kpi_imbal_jasa'
                  ? 'bg-red-600 text-white shadow-sm ring-1 ring-red-600/30'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 bg-slate-50 border border-slate-200/80'
              }`}
              id="subnav-btn-kpi-imbal-jasa"
            >
              <Award className="w-4 h-4" />
              <span>KPI IMBAL JASA</span>
            </button>

            <button
              type="button"
              onClick={() => setAssuranceTab('kpi_ioan')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                assuranceTab === 'kpi_ioan'
                  ? 'bg-red-600 text-white shadow-sm ring-1 ring-red-600/30'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 bg-slate-50 border border-slate-200/80'
              }`}
              id="subnav-btn-kpi-ioan"
            >
              <Layers className="w-4 h-4" />
              <span>KPI IOAN</span>
            </button>
          </div>
        ) : (
          /* TICKET ASSURANCE SUB-TABS MODE */
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setAssuranceTab('ticket_perf')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                assuranceTab === 'ticket_perf'
                  ? 'bg-red-600 text-white shadow-sm ring-1 ring-red-600/30'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
              id="subnav-btn-ticket-perf"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Performansi Tiket</span>
            </button>

            <button
              type="button"
              onClick={() => setAssuranceTab('operations')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                assuranceTab === 'operations'
                  ? 'bg-red-600 text-white shadow-sm ring-1 ring-red-600/30'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
              id="subnav-btn-operations"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Evaluasi Solusi Tiket</span>
            </button>

            <button
              type="button"
              onClick={() => setAssuranceTab('ticket_logs')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                assuranceTab === 'ticket_logs'
                  ? 'bg-red-600 text-white shadow-sm ring-1 ring-red-600/30'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
              id="subnav-btn-ticket-logs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Detail Transaksi & Log Tiket</span>
            </button>

            <button
              type="button"
              onClick={() => setAssuranceTab('kpi_imbal_jasa')}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              id="subnav-btn-goto-kpi"
            >
              <Award className="w-3.5 h-3.5" />
              <span>KPI ASSURANCE</span>
            </button>
          </div>
        )}

        {/* QUICK TOGGLE BETWEEN TIKET & KPI SUB-BAB */}
        <div className="flex items-center ml-auto">
          {isKpiMode ? (
            <button
              type="button"
              onClick={() => setAssuranceTab('ticket_perf')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-2xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              id="subnav-btn-back-ticket"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Kembali ke Tiket Assurance</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setAssuranceTab('kpi_imbal_jasa')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-2xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              id="subnav-btn-quick-kpi"
            >
              <span>Buka Sub-bab KPI</span>
              <Award className="w-3 h-3 text-red-600" />
            </button>
          )}
        </div>
      </div>

      {/* RENDER ASSURANCE SUB-PAGES */}
      {assuranceTab === 'ticket_perf' && (
        <TicketPerformanceDashboard />
      )}

      {assuranceTab === 'operations' && (
        <TicketEvaluationDashboard />
      )}

      {assuranceTab === 'ticket_logs' && (
        <TicketLogDashboard />
      )}

      {assuranceTab === 'kpi_imbal_jasa' && (
        <KpiImbalJasaDashboard />
      )}

      {assuranceTab === 'kpi_ioan' && (
        <KpiIoanDashboard />
      )}
    </div>
  );
}
