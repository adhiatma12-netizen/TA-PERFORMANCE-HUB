import React, { useState } from 'react';
import { RegionalPerformanceData, Regional } from '../types';
import TicketPerformanceDashboard from './TicketPerformanceDashboard';
import TicketEvaluationDashboard from './TicketEvaluationDashboard';
import TicketLogDashboard from './TicketLogDashboard';

interface AssuranceDashboardProps {
  data: RegionalPerformanceData;
  allRegionsData: { [key: string]: RegionalPerformanceData };
  activeRegional: Regional;
  activeSubTab?: 'ticket_perf' | 'operations' | 'ticket_logs';
  setActiveSubTab?: (tab: 'ticket_perf' | 'operations' | 'ticket_logs') => void;
}

export default function AssuranceDashboard({ 
  data: _data, 
  allRegionsData: _allRegionsData, 
  activeRegional: _activeRegional,
  activeSubTab,
  setActiveSubTab
}: AssuranceDashboardProps) {
  // Active sub-tab inside Assurance Dashboard: 'ticket_perf' | 'operations' | 'ticket_logs'
  const [internalTab, setInternalTab] = useState<'ticket_perf' | 'operations' | 'ticket_logs'>('ticket_perf');
  const assuranceTab = activeSubTab ?? internalTab;
  const _setAssuranceTab = setActiveSubTab ?? setInternalTab;

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
    </div>
  );
}
