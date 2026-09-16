export type Regional =
  | 'All'
  | 'REG 1 - Sumatera'
  | 'REG 2 - Jakarta'
  | 'REG 3 - Jawa Barat'
  | 'REG 4 - Jateng & DIY'
  | 'REG 5 - Jatim & Nusra'
  | 'REG 6 - Kalimantan'
  | 'REG 7 - KTI';

export interface BusinessMetrics {
  revenue: number; // in billion IDR
  revenueTarget: number;
  cogs: number; // Cost of Goods Sold in billion IDR
  cogsBudget: number;
  ebitda: number; // in billion IDR
  ebitdaTarget: number;
  netIncome: number; // in billion IDR
  opex: number; // in billion IDR
  capex: number; // in billion IDR
  costOfQuality: number; // Cost of Quality (CoQ) in billion IDR
}

export interface AssuranceMetrics {
  totalTickets: number;
  resolvedTickets: number;
  pendingTickets: number;
  mttrHours: number; // Mean Time to Resolution
  mttrTarget: number; // Target MTTR
  slaCompliance: number; // % tickets resolved within SLA (3 hours)
  repeatTroubleRate: number; // % of customers reporting repeat issue within 30 days
  backlogTrend: { date: string; backlog: number; resolved: number }[];
  ticketByProduct: { name: string; value: number; color: string }[];
}

export interface ProvisioningMetrics {
  psbTarget: number; // Pasang Baru Target (units)
  psbActual: number; // Pasang Baru Actual (units)
  activationRate: number; // % successful installations
  leadTimeDays: number; // Lead time to install in days
  leadTimeTarget: number;
  pendingInstallations: number; // Backlog
  cancelRate: number; // % cancelled PSB orders
  weeklyTrends: { name: string; target: number; actual: number }[];
}

export interface QEMetrics {
  overallQEScore: number; // %
  patrolCompliance: number; // %
  k3AuditViolations: number; // number of cases
  materialConformity: number; // % of material standards met
  pmExecutionRate: number; // Preventive Maintenance % execution
  findingsCategory: { category: string; count: number; status: 'Resolved' | 'Pending' }[];
  incidentRate: number; // Work accidents rate
}

export interface MonthlyDetail {
  ticketsResolved: number;
  productivityScore: number;
  psbCompleted: number;
  skillLevel: 'Basic' | 'Intermediate' | 'Advance' | 'Expert';
  status: 'Active' | 'On Leave' | 'Standby';
  rating: number;
  
  // Detail sub-metrics for Madiun
  benjar: number;
  lainLain: number;
  tiketManual: number;
  tiketReguler: number;
  underspec: number;
  replacementOnt: number;
  gamasOdp: number;
  gamasFeeder: number;
  gamasDistribusi: number;
  tiketClose: number;
}

export interface Technician {
  id: string;
  name: string;
  regional: Regional;
  witel: string;
  productivityScore: number; // Avg orders resolved per day
  ticketsResolved: number;
  psbCompleted: number;
  skillLevel: 'Basic' | 'Intermediate' | 'Advance' | 'Expert';
  status: 'Active' | 'On Leave' | 'Standby';
  avatarColor: string;
  rating: number; // star rating out of 5
  
  // Optional detailed job scores for Madiun (REKAP CLOSE 1 BULAN)
  benjar?: number;
  lainLain?: number;
  tiketManual?: number;
  tiketReguler?: number;
  underspec?: number;
  replacementOnt?: number;
  gamasOdp?: number;
  gamasFeeder?: number;
  gamasDistribusi?: number;
  tiketClose?: number;

  // Month-to-month historical data mapping
  monthlyData?: {
    [monthName: string]: MonthlyDetail;
  };
}

export interface TechnicianSummary {
  totalTechnicians: number;
  activeTechnicians: number;
  utilizationRate: number; // %
  avgProductivityScore: number; // Average score
  certificationRate: number; // % certified techs
  topTechnicians: Technician[];
}

export interface RegionalPerformanceData {
  regional: Regional;
  business: BusinessMetrics;
  assurance: AssuranceMetrics;
  provisioning: ProvisioningMetrics;
  qe: QEMetrics;
  technicians: TechnicianSummary;
}

export interface PerformanceDashboardData {
  [key: string]: RegionalPerformanceData; // Keyed by Regional name
}
