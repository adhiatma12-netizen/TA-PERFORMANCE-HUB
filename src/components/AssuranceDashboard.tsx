import React from 'react';
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
  activeSubTab = 'ticket_perf',
}: AssuranceDashboardProps) {
  const assuranceTab = activeSubTab;

  return (
    <div className="space-y-6" id="assurance-dashboard">
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
