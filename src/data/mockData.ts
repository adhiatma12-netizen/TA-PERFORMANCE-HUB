import { Regional, RegionalPerformanceData, PerformanceDashboardData, Technician } from '../types';
import { madiunTechnicians } from './parsedMadiunData';

const totalMadiun = madiunTechnicians.length;
const activeMadiun = madiunTechnicians.filter(t => t.status === 'Active').length;
const utilizationMadiun = parseFloat(((activeMadiun / totalMadiun) * 100).toFixed(1));
const avgScoreMadiun = parseFloat((madiunTechnicians.reduce((sum, t) => sum + t.productivityScore, 0) / totalMadiun).toFixed(2));

export const listRegionals: Regional[] = [
  'All',
  'REG 1 - Sumatera',
  'REG 2 - Jakarta',
  'REG 3 - Jawa Barat',
  'REG 4 - Jateng & DIY',
  'REG 5 - Jatim & Nusra',
  'REG 6 - Kalimantan',
  'REG 7 - KTI'
];

export const mockTechnicians: Technician[] = [
  {
    id: 'T001',
    name: 'Budi Santoso',
    regional: 'REG 2 - Jakarta',
    witel: 'Jakarta Pusat',
    productivityScore: 4.8,
    ticketsResolved: 82,
    psbCompleted: 45,
    skillLevel: 'Expert',
    status: 'Active',
    avatarColor: 'bg-red-500',
    rating: 4.9,
  },
  {
    id: 'T002',
    name: 'Agus Wijaya',
    regional: 'REG 3 - Jawa Barat',
    witel: 'Bandung',
    productivityScore: 4.6,
    ticketsResolved: 76,
    psbCompleted: 38,
    skillLevel: 'Expert',
    status: 'Active',
    avatarColor: 'bg-blue-500',
    rating: 4.8,
  },
  {
    id: 'T003',
    name: 'Eko Prasetyo',
    regional: 'REG 5 - Jatim & Nusra',
    witel: 'Surabaya Selatan',
    productivityScore: 4.5,
    ticketsResolved: 72,
    psbCompleted: 40,
    skillLevel: 'Advance',
    status: 'Active',
    avatarColor: 'bg-green-500',
    rating: 4.7,
  },
  {
    id: 'T004',
    name: 'Rahmat Hidayat',
    regional: 'REG 1 - Sumatera',
    witel: 'Medan',
    productivityScore: 4.3,
    ticketsResolved: 68,
    psbCompleted: 35,
    skillLevel: 'Advance',
    status: 'Active',
    avatarColor: 'bg-purple-500',
    rating: 4.6,
  },
  {
    id: 'T005',
    name: 'I Gede Satria',
    regional: 'REG 5 - Jatim & Nusra',
    witel: 'Denpasar',
    productivityScore: 4.7,
    ticketsResolved: 79,
    psbCompleted: 42,
    skillLevel: 'Expert',
    status: 'Active',
    avatarColor: 'bg-orange-500',
    rating: 4.9,
  },
  {
    id: 'T006',
    name: 'Syahril Anwar',
    regional: 'REG 6 - Kalimantan',
    witel: 'Balikpapan',
    productivityScore: 4.2,
    ticketsResolved: 60,
    psbCompleted: 30,
    skillLevel: 'Intermediate',
    status: 'Standby',
    avatarColor: 'bg-amber-500',
    rating: 4.5,
  },
  {
    id: 'T007',
    name: 'Andi Mappanyukki',
    regional: 'REG 7 - KTI',
    witel: 'Makassar',
    productivityScore: 4.4,
    ticketsResolved: 65,
    psbCompleted: 34,
    skillLevel: 'Advance',
    status: 'Active',
    avatarColor: 'bg-pink-500',
    rating: 4.7,
  },
  {
    id: 'T008',
    name: 'Dedi Setiadi',
    regional: 'REG 2 - Jakarta',
    witel: 'Jakarta Selatan',
    productivityScore: 4.0,
    ticketsResolved: 55,
    psbCompleted: 28,
    skillLevel: 'Intermediate',
    status: 'On Leave',
    avatarColor: 'bg-teal-500',
    rating: 4.3,
  },
  {
    id: 'T009',
    name: 'Heri Kurniawan',
    regional: 'REG 4 - Jateng & DIY',
    witel: 'Yogyakarta',
    productivityScore: 4.5,
    ticketsResolved: 70,
    psbCompleted: 41,
    skillLevel: 'Advance',
    status: 'Active',
    avatarColor: 'bg-indigo-500',
    rating: 4.8,
  }
];

export const mockPerformanceData: PerformanceDashboardData = {
  'REG 1 - Sumatera': {
    regional: 'REG 1 - Sumatera',
    business: {
      revenue: 382.4,
      revenueTarget: 400.0,
      cogs: 286.8,
      cogsBudget: 295.0,
      ebitda: 65.5,
      ebitdaTarget: 70.0,
      netIncome: 18.2,
      opex: 30.1,
      capex: 45.0,
      costOfQuality: 3.2,
    },
    assurance: {
      totalTickets: 12450,
      resolvedTickets: 11480,
      pendingTickets: 970,
      mttrHours: 2.9,
      mttrTarget: 3.0,
      slaCompliance: 91.2,
      repeatTroubleRate: 4.8,
      backlogTrend: [
        { date: 'Mon', backlog: 120, resolved: 380 },
        { date: 'Tue', backlog: 140, resolved: 410 },
        { date: 'Wed', backlog: 95, resolved: 450 },
        { date: 'Thu', backlog: 110, resolved: 390 },
        { date: 'Fri', backlog: 130, resolved: 420 },
        { date: 'Sat', backlog: 80, resolved: 280 },
        { date: 'Sun', backlog: 65, resolved: 210 }
      ],
      ticketByProduct: [
        { name: 'IndiHome Fiber', value: 7500, color: '#EE2E24' },
        { name: 'Wifi.id', value: 2100, color: '#3B82F6' },
        { name: 'Astinet/Enterprise', value: 1650, color: '#10B981' },
        { name: 'Transit Link', value: 1200, color: '#F59E0B' }
      ]
    },
    provisioning: {
      psbTarget: 28000,
      psbActual: 26150,
      activationRate: 92.1,
      leadTimeDays: 1.7,
      leadTimeTarget: 1.5,
      pendingInstallations: 850,
      cancelRate: 3.1,
      weeklyTrends: [
        { name: 'W1', target: 7000, actual: 6450 },
        { name: 'W2', target: 7000, actual: 6500 },
        { name: 'W3', target: 7000, actual: 6800 },
        { name: 'W4', target: 7000, actual: 6400 }
      ]
    },
    qe: {
      overallQEScore: 87.5,
      patrolCompliance: 92.0,
      k3AuditViolations: 4,
      materialConformity: 95.2,
      pmExecutionRate: 93.5,
      findingsCategory: [
        { category: 'Splicing Standard', count: 18, status: 'Resolved' },
        { category: 'ODP Labelling', count: 32, status: 'Resolved' },
        { category: 'Slack cable management', count: 12, status: 'Pending' },
        { category: 'Safety Harness Tooling', count: 3, status: 'Pending' }
      ],
      incidentRate: 0.12,
    },
    technicians: {
      totalTechnicians: 2150,
      activeTechnicians: 1980,
      utilizationRate: 92.1,
      avgProductivityScore: 4.1,
      certificationRate: 78.5,
      topTechnicians: mockTechnicians.filter(t => t.regional === 'REG 1 - Sumatera'),
    }
  },
  'REG 2 - Jakarta': {
    regional: 'REG 2 - Jakarta',
    business: {
      revenue: 595.6,
      revenueTarget: 580.0,
      cogs: 434.8,
      cogsBudget: 425.0,
      ebitda: 115.2,
      ebitdaTarget: 105.0,
      netIncome: 35.6,
      opex: 45.6,
      capex: 62.0,
      costOfQuality: 4.8,
    },
    assurance: {
      totalTickets: 24500,
      resolvedTickets: 23150,
      pendingTickets: 1350,
      mttrHours: 2.4,
      mttrTarget: 3.0,
      slaCompliance: 94.5,
      repeatTroubleRate: 3.9,
      backlogTrend: [
        { date: 'Mon', backlog: 180, resolved: 780 },
        { date: 'Tue', backlog: 195, resolved: 820 },
        { date: 'Wed', backlog: 160, resolved: 890 },
        { date: 'Thu', backlog: 140, resolved: 850 },
        { date: 'Fri', backlog: 210, resolved: 910 },
        { date: 'Sat', backlog: 120, resolved: 550 },
        { date: 'Sun', backlog: 95, resolved: 410 }
      ],
      ticketByProduct: [
        { name: 'IndiHome Fiber', value: 14200, color: '#EE2E24' },
        { name: 'Wifi.id', value: 3800, color: '#3B82F6' },
        { name: 'Astinet/Enterprise', value: 4500, color: '#10B981' },
        { name: 'Transit Link', value: 2000, color: '#F59E0B' }
      ]
    },
    provisioning: {
      psbTarget: 42000,
      psbActual: 40820,
      activationRate: 94.8,
      leadTimeDays: 1.3,
      leadTimeTarget: 1.5,
      pendingInstallations: 1120,
      cancelRate: 2.2,
      weeklyTrends: [
        { name: 'W1', target: 10500, actual: 10200 },
        { name: 'W2', target: 10500, actual: 10400 },
        { name: 'W3', target: 10500, actual: 10520 },
        { name: 'W4', target: 10500, actual: 9700 }
      ]
    },
    qe: {
      overallQEScore: 91.2,
      patrolCompliance: 95.5,
      k3AuditViolations: 1,
      materialConformity: 98.0,
      pmExecutionRate: 96.8,
      findingsCategory: [
        { category: 'Splicing Standard', count: 12, status: 'Resolved' },
        { category: 'ODP Labelling', count: 14, status: 'Resolved' },
        { category: 'Slack cable management', count: 8, status: 'Pending' },
        { category: 'Safety Harness Tooling', count: 1, status: 'Resolved' }
      ],
      incidentRate: 0.0,
    },
    technicians: {
      totalTechnicians: 3450,
      activeTechnicians: 3210,
      utilizationRate: 93.0,
      avgProductivityScore: 4.4,
      certificationRate: 88.2,
      topTechnicians: mockTechnicians.filter(t => t.regional === 'REG 2 - Jakarta'),
    }
  },
  'REG 3 - Jawa Barat': {
    regional: 'REG 3 - Jawa Barat',
    business: {
      revenue: 412.5,
      revenueTarget: 420.0,
      cogs: 309.2,
      cogsBudget: 310.0,
      ebitda: 74.2,
      ebitdaTarget: 78.0,
      netIncome: 20.1,
      opex: 29.1,
      capex: 48.0,
      costOfQuality: 3.5,
    },
    assurance: {
      totalTickets: 15120,
      resolvedTickets: 13950,
      pendingTickets: 1170,
      mttrHours: 2.7,
      mttrTarget: 3.0,
      slaCompliance: 92.1,
      repeatTroubleRate: 4.4,
      backlogTrend: [
        { date: 'Mon', backlog: 140, resolved: 480 },
        { date: 'Tue', backlog: 155, resolved: 520 },
        { date: 'Wed', backlog: 110, resolved: 580 },
        { date: 'Thu', backlog: 115, resolved: 530 },
        { date: 'Fri', backlog: 150, resolved: 560 },
        { date: 'Sat', backlog: 90, resolved: 320 },
        { date: 'Sun', backlog: 85, resolved: 260 }
      ],
      ticketByProduct: [
        { name: 'IndiHome Fiber', value: 9200, color: '#EE2E24' },
        { name: 'Wifi.id', value: 2400, color: '#3B82F6' },
        { name: 'Astinet/Enterprise', value: 2220, color: '#10B981' },
        { name: 'Transit Link', value: 1300, color: '#F59E0B' }
      ]
    },
    provisioning: {
      psbTarget: 31000,
      psbActual: 29150,
      activationRate: 91.9,
      leadTimeDays: 1.6,
      leadTimeTarget: 1.5,
      pendingInstallations: 920,
      cancelRate: 2.9,
      weeklyTrends: [
        { name: 'W1', target: 7750, actual: 7200 },
        { name: 'W2', target: 7750, actual: 7300 },
        { name: 'W3', target: 7750, actual: 7550 },
        { name: 'W4', target: 7750, actual: 7100 }
      ]
    },
    qe: {
      overallQEScore: 88.8,
      patrolCompliance: 91.2,
      k3AuditViolations: 3,
      materialConformity: 96.1,
      pmExecutionRate: 94.1,
      findingsCategory: [
        { category: 'Splicing Standard', count: 21, status: 'Resolved' },
        { category: 'ODP Labelling', count: 26, status: 'Resolved' },
        { category: 'Slack cable management', count: 14, status: 'Pending' },
        { category: 'Safety Harness Tooling', count: 2, status: 'Pending' }
      ],
      incidentRate: 0.08,
    },
    technicians: {
      totalTechnicians: 2400,
      activeTechnicians: 2220,
      utilizationRate: 92.5,
      avgProductivityScore: 4.2,
      certificationRate: 81.0,
      topTechnicians: mockTechnicians.filter(t => t.regional === 'REG 3 - Jawa Barat'),
    }
  },
  'REG 4 - Jateng & DIY': {
    regional: 'REG 4 - Jateng & DIY',
    business: {
      revenue: 315.8,
      revenueTarget: 310.0,
      cogs: 236.4,
      cogsBudget: 232.0,
      ebitda: 56.1,
      ebitdaTarget: 54.0,
      netIncome: 14.8,
      opex: 23.3,
      capex: 35.5,
      costOfQuality: 2.8,
    },
    assurance: {
      totalTickets: 11450,
      resolvedTickets: 10600,
      pendingTickets: 850,
      mttrHours: 2.8,
      mttrTarget: 3.0,
      slaCompliance: 91.8,
      repeatTroubleRate: 4.6,
      backlogTrend: [
        { date: 'Mon', backlog: 100, resolved: 350 },
        { date: 'Tue', backlog: 115, resolved: 370 },
        { date: 'Wed', backlog: 85, resolved: 410 },
        { date: 'Thu', backlog: 90, resolved: 390 },
        { date: 'Fri', backlog: 125, resolved: 400 },
        { date: 'Sat', backlog: 70, resolved: 250 },
        { date: 'Sun', backlog: 60, resolved: 190 }
      ],
      ticketByProduct: [
        { name: 'IndiHome Fiber', value: 7100, color: '#EE2E24' },
        { name: 'Wifi.id', value: 1600, color: '#3B82F6' },
        { name: 'Astinet/Enterprise', value: 1750, color: '#10B981' },
        { name: 'Transit Link', value: 1000, color: '#F59E0B' }
      ]
    },
    provisioning: {
      psbTarget: 24000,
      psbActual: 23150,
      activationRate: 93.1,
      leadTimeDays: 1.5,
      leadTimeTarget: 1.5,
      pendingInstallations: 650,
      cancelRate: 2.5,
      weeklyTrends: [
        { name: 'W1', target: 6000, actual: 5800 },
        { name: 'W2', target: 6000, actual: 5750 },
        { name: 'W3', target: 6000, actual: 5900 },
        { name: 'W4', target: 6000, actual: 5700 }
      ]
    },
    qe: {
      overallQEScore: 89.1,
      patrolCompliance: 93.1,
      k3AuditViolations: 2,
      materialConformity: 95.8,
      pmExecutionRate: 95.0,
      findingsCategory: [
        { category: 'Splicing Standard', count: 14, status: 'Resolved' },
        { category: 'ODP Labelling', count: 18, status: 'Resolved' },
        { category: 'Slack cable management', count: 11, status: 'Pending' },
        { category: 'Safety Harness Tooling', count: 1, status: 'Resolved' }
      ],
      incidentRate: 0.05,
    },
    technicians: {
      totalTechnicians: 1950,
      activeTechnicians: 1810,
      utilizationRate: 92.8,
      avgProductivityScore: 4.15,
      certificationRate: 83.4,
      topTechnicians: mockTechnicians.filter(t => t.regional === 'REG 4 - Jateng & DIY'),
    }
  },
  'REG 5 - Jatim & Nusra': {
    regional: 'REG 5 - Jatim & Nusra',
    business: {
      revenue: 465.2,
      revenueTarget: 460.0,
      cogs: 348.5,
      cogsBudget: 343.0,
      ebitda: 85.6,
      ebitdaTarget: 83.0,
      netIncome: 22.4,
      opex: 31.1,
      capex: 52.0,
      costOfQuality: 3.9,
    },
    assurance: {
      totalTickets: 18400,
      resolvedTickets: 17120,
      pendingTickets: 1280,
      mttrHours: 2.55,
      mttrTarget: 3.0,
      slaCompliance: 93.8,
      repeatTroubleRate: 4.1,
      backlogTrend: [
        { date: 'Mon', backlog: 150, resolved: 580 },
        { date: 'Tue', backlog: 160, resolved: 610 },
        { date: 'Wed', backlog: 120, resolved: 650 },
        { date: 'Thu', backlog: 130, resolved: 620 },
        { date: 'Fri', backlog: 170, resolved: 680 },
        { date: 'Sat', backlog: 100, resolved: 390 },
        { date: 'Sun', backlog: 80, resolved: 290 }
      ],
      ticketByProduct: [
        { name: 'IndiHome Fiber', value: 11400, color: '#EE2E24' },
        { name: 'Wifi.id', value: 2900, color: '#3B82F6' },
        { name: 'Astinet/Enterprise', value: 2600, color: '#10B981' },
        { name: 'Transit Link', value: 1500, color: '#F59E0B' }
      ]
    },
    provisioning: {
      psbTarget: 35000,
      psbActual: 33850,
      activationRate: 94.0,
      leadTimeDays: 1.45,
      leadTimeTarget: 1.5,
      pendingInstallations: 890,
      cancelRate: 2.4,
      weeklyTrends: [
        { name: 'W1', target: 8750, actual: 8400 },
        { name: 'W2', target: 8750, actual: 8550 },
        { name: 'W3', target: 8750, actual: 8600 },
        { name: 'W4', target: 8750, actual: 8300 }
      ]
    },
    qe: {
      overallQEScore: 90.4,
      patrolCompliance: 94.0,
      k3AuditViolations: 2,
      materialConformity: 97.2,
      pmExecutionRate: 96.0,
      findingsCategory: [
        { category: 'Splicing Standard', count: 19, status: 'Resolved' },
        { category: 'ODP Labelling', count: 22, status: 'Resolved' },
        { category: 'Slack cable management', count: 9, status: 'Pending' },
        { category: 'Safety Harness Tooling', count: 1, status: 'Resolved' }
      ],
      incidentRate: 0.04,
    },
    technicians: {
      totalTechnicians: totalMadiun,
      activeTechnicians: activeMadiun,
      utilizationRate: utilizationMadiun,
      avgProductivityScore: avgScoreMadiun,
      certificationRate: 86.2,
      topTechnicians: madiunTechnicians,
    }
  },
  'REG 6 - Kalimantan': {
    regional: 'REG 6 - Kalimantan',
    business: {
      revenue: 142.8,
      revenueTarget: 150.0,
      cogs: 111.4,
      cogsBudget: 114.0,
      ebitda: 21.2,
      ebitdaTarget: 24.0,
      netIncome: 5.8,
      opex: 10.2,
      capex: 18.0,
      costOfQuality: 1.5,
    },
    assurance: {
      totalTickets: 5800,
      resolvedTickets: 5280,
      pendingTickets: 520,
      mttrHours: 3.1,
      mttrTarget: 3.0,
      slaCompliance: 89.5,
      repeatTroubleRate: 5.2,
      backlogTrend: [
        { date: 'Mon', backlog: 60, resolved: 180 },
        { date: 'Tue', backlog: 70, resolved: 190 },
        { date: 'Wed', backlog: 55, resolved: 210 },
        { date: 'Thu', backlog: 50, resolved: 200 },
        { date: 'Fri', backlog: 80, resolved: 195 },
        { date: 'Sat', backlog: 45, resolved: 120 },
        { date: 'Sun', backlog: 35, resolved: 95 }
      ],
      ticketByProduct: [
        { name: 'IndiHome Fiber', value: 3400, color: '#EE2E24' },
        { name: 'Wifi.id', value: 900, color: '#3B82F6' },
        { name: 'Astinet/Enterprise', value: 1000, color: '#10B981' },
        { name: 'Transit Link', value: 500, color: '#F59E0B' }
      ]
    },
    provisioning: {
      psbTarget: 12000,
      psbActual: 10850,
      activationRate: 89.2,
      leadTimeDays: 1.9,
      leadTimeTarget: 1.5,
      pendingInstallations: 420,
      cancelRate: 3.8,
      weeklyTrends: [
        { name: 'W1', target: 3000, actual: 2650 },
        { name: 'W2', target: 3000, actual: 2700 },
        { name: 'W3', target: 3000, actual: 2850 },
        { name: 'W4', target: 3000, actual: 2650 }
      ]
    },
    qe: {
      overallQEScore: 85.2,
      patrolCompliance: 88.5,
      k3AuditViolations: 5,
      materialConformity: 93.1,
      pmExecutionRate: 91.2,
      findingsCategory: [
        { category: 'Splicing Standard', count: 16, status: 'Resolved' },
        { category: 'ODP Labelling', count: 28, status: 'Resolved' },
        { category: 'Slack cable management', count: 15, status: 'Pending' },
        { category: 'Safety Harness Tooling', count: 4, status: 'Pending' }
      ],
      incidentRate: 0.18,
    },
    technicians: {
      totalTechnicians: 1100,
      activeTechnicians: 990,
      utilizationRate: 90.0,
      avgProductivityScore: 3.85,
      certificationRate: 72.0,
      topTechnicians: mockTechnicians.filter(t => t.regional === 'REG 6 - Kalimantan'),
    }
  },
  'REG 7 - KTI': {
    regional: 'REG 7 - KTI',
    business: {
      revenue: 168.5,
      revenueTarget: 175.0,
      cogs: 133.1,
      cogsBudget: 136.0,
      ebitda: 23.8,
      ebitdaTarget: 27.0,
      netIncome: 6.2,
      opex: 11.6,
      capex: 21.0,
      costOfQuality: 1.7,
    },
    assurance: {
      totalTickets: 6800,
      resolvedTickets: 6150,
      pendingTickets: 650,
      mttrHours: 3.25,
      mttrTarget: 3.0,
      slaCompliance: 88.1,
      repeatTroubleRate: 5.5,
      backlogTrend: [
        { date: 'Mon', backlog: 70, resolved: 200 },
        { date: 'Tue', backlog: 85, resolved: 220 },
        { date: 'Wed', backlog: 60, resolved: 240 },
        { date: 'Thu', backlog: 55, resolved: 210 },
        { date: 'Fri', backlog: 90, resolved: 225 },
        { date: 'Sat', backlog: 50, resolved: 140 },
        { date: 'Sun', backlog: 40, resolved: 110 }
      ],
      ticketByProduct: [
        { name: 'IndiHome Fiber', value: 4100, color: '#EE2E24' },
        { name: 'Wifi.id', value: 1050, color: '#3B82F6' },
        { name: 'Astinet/Enterprise', value: 1150, color: '#10B981' },
        { name: 'Transit Link', value: 500, color: '#F59E0B' }
      ]
    },
    provisioning: {
      psbTarget: 14000,
      psbActual: 12480,
      activationRate: 88.5,
      leadTimeDays: 2.1,
      leadTimeTarget: 1.5,
      pendingInstallations: 550,
      cancelRate: 4.1,
      weeklyTrends: [
        { name: 'W1', target: 3500, actual: 3050 },
        { name: 'W2', target: 3500, actual: 3100 },
        { name: 'W3', target: 3500, actual: 3250 },
        { name: 'W4', target: 3500, actual: 3080 }
      ]
    },
    qe: {
      overallQEScore: 84.8,
      patrolCompliance: 87.2,
      k3AuditViolations: 6,
      materialConformity: 92.5,
      pmExecutionRate: 90.5,
      findingsCategory: [
        { category: 'Splicing Standard', count: 22, status: 'Resolved' },
        { category: 'ODP Labelling', count: 35, status: 'Resolved' },
        { category: 'Slack cable management', count: 18, status: 'Pending' },
        { category: 'Safety Harness Tooling', count: 5, status: 'Pending' }
      ],
      incidentRate: 0.21,
    },
    technicians: {
      totalTechnicians: 1300,
      activeTechnicians: 1150,
      utilizationRate: 88.5,
      avgProductivityScore: 3.75,
      certificationRate: 69.8,
      topTechnicians: mockTechnicians.filter(t => t.regional === 'REG 7 - KTI'),
    }
  }
};

// Compute Dynamic 'All' regional data by aggregating other regionals
export const getAllRegionalData = (data: PerformanceDashboardData): RegionalPerformanceData => {
  const regions = Object.keys(data) as (keyof PerformanceDashboardData)[];
  
  // Initialize 'All' structure
  const all: RegionalPerformanceData = {
    regional: 'All',
    business: {
      revenue: 0,
      revenueTarget: 0,
      cogs: 0,
      cogsBudget: 0,
      ebitda: 0,
      ebitdaTarget: 0,
      netIncome: 0,
      opex: 0,
      capex: 0,
      costOfQuality: 0,
    },
    assurance: {
      totalTickets: 0,
      resolvedTickets: 0,
      pendingTickets: 0,
      mttrHours: 0,
      mttrTarget: 3.0,
      slaCompliance: 0,
      repeatTroubleRate: 0,
      backlogTrend: [
        { date: 'Mon', backlog: 0, resolved: 0 },
        { date: 'Tue', backlog: 0, resolved: 0 },
        { date: 'Wed', backlog: 0, resolved: 0 },
        { date: 'Thu', backlog: 0, resolved: 0 },
        { date: 'Fri', backlog: 0, resolved: 0 },
        { date: 'Sat', backlog: 0, resolved: 0 },
        { date: 'Sun', backlog: 0, resolved: 0 }
      ],
      ticketByProduct: [
        { name: 'IndiHome Fiber', value: 0, color: '#EE2E24' },
        { name: 'Wifi.id', value: 0, color: '#3B82F6' },
        { name: 'Astinet/Enterprise', value: 0, color: '#10B981' },
        { name: 'Transit Link', value: 0, color: '#F59E0B' }
      ]
    },
    provisioning: {
      psbTarget: 0,
      psbActual: 0,
      activationRate: 0,
      leadTimeDays: 0,
      leadTimeTarget: 1.5,
      pendingInstallations: 0,
      cancelRate: 0,
      weeklyTrends: [
        { name: 'W1', target: 0, actual: 0 },
        { name: 'W2', target: 0, actual: 0 },
        { name: 'W3', target: 0, actual: 0 },
        { name: 'W4', target: 0, actual: 0 }
      ]
    },
    qe: {
      overallQEScore: 0,
      patrolCompliance: 0,
      k3AuditViolations: 0,
      materialConformity: 0,
      pmExecutionRate: 0,
      findingsCategory: [
        { category: 'Splicing Standard', count: 0, status: 'Resolved' },
        { category: 'ODP Labelling', count: 0, status: 'Resolved' },
        { category: 'Slack cable management', count: 0, status: 'Pending' },
        { category: 'Safety Harness Tooling', count: 0, status: 'Pending' }
      ],
      incidentRate: 0,
    },
    technicians: {
      totalTechnicians: 0,
      activeTechnicians: 0,
      utilizationRate: 0,
      avgProductivityScore: 0,
      certificationRate: 0,
      topTechnicians: [],
    }
  };

  regions.forEach(r => {
    const rData = data[r];
    
    // Aggregate Business
    all.business.revenue += rData.business.revenue;
    all.business.revenueTarget += rData.business.revenueTarget;
    all.business.cogs += rData.business.cogs;
    all.business.cogsBudget += rData.business.cogsBudget;
    all.business.ebitda += rData.business.ebitda;
    all.business.ebitdaTarget += rData.business.ebitdaTarget;
    all.business.netIncome += rData.business.netIncome;
    all.business.opex += rData.business.opex;
    all.business.capex += rData.business.capex;
    all.business.costOfQuality += rData.business.costOfQuality;

    // Aggregate Assurance
    all.assurance.totalTickets += rData.assurance.totalTickets;
    all.assurance.resolvedTickets += rData.assurance.resolvedTickets;
    all.assurance.pendingTickets += rData.assurance.pendingTickets;
    all.assurance.mttrHours += rData.assurance.mttrHours * rData.assurance.totalTickets; // weighted avg prep
    all.assurance.slaCompliance += rData.assurance.slaCompliance * rData.assurance.totalTickets; // weighted avg prep
    all.assurance.repeatTroubleRate += rData.assurance.repeatTroubleRate * rData.assurance.totalTickets; // weighted avg prep

    // Backlog Trend sum
    rData.assurance.backlogTrend.forEach((item, index) => {
      all.assurance.backlogTrend[index].backlog += item.backlog;
      all.assurance.backlogTrend[index].resolved += item.resolved;
    });

    // Ticket by product sum
    rData.assurance.ticketByProduct.forEach((item, index) => {
      all.assurance.ticketByProduct[index].value += item.value;
    });

    // Aggregate Provisioning
    all.provisioning.psbTarget += rData.provisioning.psbTarget;
    all.provisioning.psbActual += rData.provisioning.psbActual;
    all.provisioning.pendingInstallations += rData.provisioning.pendingInstallations;
    all.provisioning.activationRate += rData.provisioning.activationRate * rData.provisioning.psbTarget; // weighted avg prep
    all.provisioning.cancelRate += rData.provisioning.cancelRate * rData.provisioning.psbTarget; // weighted avg prep
    all.provisioning.leadTimeDays += rData.provisioning.leadTimeDays * rData.provisioning.psbTarget; // weighted avg prep
    
    rData.provisioning.weeklyTrends.forEach((item, index) => {
      all.provisioning.weeklyTrends[index].target += item.target;
      all.provisioning.weeklyTrends[index].actual += item.actual;
    });

    // Aggregate QE
    all.qe.overallQEScore += rData.qe.overallQEScore; // simple avg for display
    all.qe.patrolCompliance += rData.qe.patrolCompliance;
    all.qe.k3AuditViolations += rData.qe.k3AuditViolations;
    all.qe.materialConformity += rData.qe.materialConformity;
    all.qe.pmExecutionRate += rData.qe.pmExecutionRate;
    all.qe.incidentRate += rData.qe.incidentRate;

    rData.qe.findingsCategory.forEach((item) => {
      const match = all.qe.findingsCategory.find(f => f.category === item.category);
      if (match) {
        match.count += item.count;
      }
    });

    // Aggregate Technicians
    all.technicians.totalTechnicians += rData.technicians.totalTechnicians;
    all.technicians.activeTechnicians += rData.technicians.activeTechnicians;
    all.technicians.utilizationRate += rData.technicians.utilizationRate * rData.technicians.totalTechnicians;
    all.technicians.avgProductivityScore += rData.technicians.avgProductivityScore * rData.technicians.totalTechnicians;
    all.technicians.certificationRate += rData.technicians.certificationRate * rData.technicians.totalTechnicians;
    all.technicians.topTechnicians = [
      ...all.technicians.topTechnicians,
      ...rData.technicians.topTechnicians
    ];
  });

  const numRegions = regions.length;

  // Finalize weighted averages and simple averages
  if (all.assurance.totalTickets > 0) {
    all.assurance.mttrHours = parseFloat((all.assurance.mttrHours / all.assurance.totalTickets).toFixed(2));
    all.assurance.slaCompliance = parseFloat((all.assurance.slaCompliance / all.assurance.totalTickets).toFixed(1));
    all.assurance.repeatTroubleRate = parseFloat((all.assurance.repeatTroubleRate / all.assurance.totalTickets).toFixed(2));
  }

  if (all.provisioning.psbTarget > 0) {
    all.provisioning.activationRate = parseFloat((all.provisioning.activationRate / all.provisioning.psbTarget).toFixed(1));
    all.provisioning.cancelRate = parseFloat((all.provisioning.cancelRate / all.provisioning.psbTarget).toFixed(2));
    all.provisioning.leadTimeDays = parseFloat((all.provisioning.leadTimeDays / all.provisioning.psbTarget).toFixed(2));
  }

  // Simple averages for QE
  all.qe.overallQEScore = parseFloat((all.qe.overallQEScore / numRegions).toFixed(1));
  all.qe.patrolCompliance = parseFloat((all.qe.patrolCompliance / numRegions).toFixed(1));
  all.qe.materialConformity = parseFloat((all.qe.materialConformity / numRegions).toFixed(1));
  all.qe.pmExecutionRate = parseFloat((all.qe.pmExecutionRate / numRegions).toFixed(1));
  all.qe.incidentRate = parseFloat((all.qe.incidentRate / numRegions).toFixed(2));

  // Technicians averages
  if (all.technicians.totalTechnicians > 0) {
    all.technicians.utilizationRate = parseFloat((all.technicians.utilizationRate / all.technicians.totalTechnicians).toFixed(1));
    all.technicians.avgProductivityScore = parseFloat((all.technicians.avgProductivityScore / all.technicians.totalTechnicians).toFixed(2));
    all.technicians.certificationRate = parseFloat((all.technicians.certificationRate / all.technicians.totalTechnicians).toFixed(1));
  }

  // Format decimal values of business metrics to 1 decimal place
  all.business.revenue = parseFloat(all.business.revenue.toFixed(1));
  all.business.revenueTarget = parseFloat(all.business.revenueTarget.toFixed(1));
  all.business.cogs = parseFloat(all.business.cogs.toFixed(1));
  all.business.cogsBudget = parseFloat(all.business.cogsBudget.toFixed(1));
  all.business.ebitda = parseFloat(all.business.ebitda.toFixed(1));
  all.business.ebitdaTarget = parseFloat(all.business.ebitdaTarget.toFixed(1));
  all.business.netIncome = parseFloat(all.business.netIncome.toFixed(1));
  all.business.opex = parseFloat(all.business.opex.toFixed(1));
  all.business.capex = parseFloat(all.business.capex.toFixed(1));
  all.business.costOfQuality = parseFloat(all.business.costOfQuality.toFixed(1));

  return all;
};
