import React from 'react';
import { RegionalPerformanceData, Regional } from '../types';
import TicketPerformanceDashboard from './TicketPerformanceDashboard';
import TicketEvaluationDashboard from './TicketEvaluationDashboard';
import TicketLogDashboard from './TicketLogDashboard';
import KpiImbalJasaDashboard from './KpiImbalJasaDashboard';
import KpiIoanDashboard from './KpiIoanDashboard';

export type AssuranceSubTab = 'kpi_imbal_jasa' | 'ticket_perf' | 'operations' | 'ticket_logs' | 'kpi_ioan';

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
  activeSubTab = 'kpi_imbal_jasa',
  setActiveSubTab: _setActiveSubTab,
}: AssuranceDashboardProps) {
  const assuranceTab = activeSubTab;

  return (
    <div className="space-y-6" id="assurance-dashboard">
      {/* RENDER ASSURANCE SUB-PAGES */}
      {assuranceTab === 'kpi_imbal_jasa' && (
        <KpiImbalJasaDashboard />
      )}

      {assuranceTab === 'ticket_perf' && (
        <TicketPerformanceDashboard />
      )}

      {assuranceTab === 'operations' && (
        <TicketEvaluationDashboard />
      )}

      {assuranceTab === 'ticket_logs' && (
        <TicketLogDashboard />
      )}

      {assuranceTab === 'kpi_ioan' && (
        <KpiIoanDashboard />
      )}
    </div>
  );
}
