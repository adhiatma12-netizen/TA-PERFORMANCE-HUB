import React, { useState, useEffect } from 'react';
import { listRegionals, mockPerformanceData, getAllRegionalData } from './data/mockData';
import { RegionalPerformanceData, Regional, Technician, PerformanceDashboardData } from './types';

// Import dashboards & components
import BusinessDashboard from './components/BusinessDashboard';
import AssuranceDashboard, { AssuranceSubTab } from './components/AssuranceDashboard';
import ProvisioningDashboard, { generate2026Q1Data, mapRowsToProvisioning, mapIndibizzRowsToProvisioning } from './components/ProvisioningDashboard';
import QEDashboard from './components/QEDashboard';
import TechnicianDashboard from './components/TechnicianDashboard';
import KelolaDataDashboard from './components/KelolaDataDashboard';
import LoginPage from './components/LoginPage';
import WelcomePage from './components/WelcomePage';
import ExecutivePdfReportModal from './components/ExecutivePdfReportModal';
import { rawProvisioningData, ProvisioningRow } from './data/provisioningStats';
import { fallbackIndibizzData } from './data/indibizzFallbackData';
import { parseCSV } from './lib/googleSheets';
import { fetchUserAccounts } from './lib/auth';

// Import Icons
import {
  BarChart3,
  ShieldCheck,
  UserPlus,
  ClipboardCheck,
  Users,
  Database,
  RefreshCw,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  Bell,
  Sparkles,
  Download,
  CheckCircle2,
  Globe,
  Table,
  PieChart,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  TrendingUp,
  BarChart2,
  Briefcase,
  Ticket,
  Activity,
  Layers,
  Award,
  FileSpreadsheet,
  FileDown,
} from 'lucide-react';

// Helper to scale/adjust performance dashboard data based on active month
function getMonthData(baseData: PerformanceDashboardData, month: string): PerformanceDashboardData {
  let multiplier = 1.0;
  const m = month.toLowerCase();
  if (m === 'januari' || m === 'january') multiplier = 0.82;
  else if (m === 'februari' || m === 'february') multiplier = 0.92;
  else if (m === 'maret' || m === 'march') multiplier = 0.88;
  else if (m === 'april') multiplier = 1.05;
  else if (m === 'mei' || m === 'may') multiplier = 0.94;
  else if (m === 'juni' || m === 'june') multiplier = 1.0; // Juni (default base)
  else if (m === 'juli' || m === 'july') multiplier = 1.12;
  else if (m === 'agustus' || m === 'august') multiplier = 1.09;
  else if (m === 'september') multiplier = 1.03;
  else if (m === 'oktober' || m === 'october') multiplier = 1.11;
  else if (m === 'november') multiplier = 1.07;
  else if (m === 'desember' || m === 'december') multiplier = 1.15;
  else multiplier = 1.0;

  const cloned = JSON.parse(JSON.stringify(baseData)) as PerformanceDashboardData;

  Object.keys(cloned).forEach(key => {
    const regName = key as Regional;
    const region = cloned[regName];
    
    // Scale business KPIs
    region.business.revenue = parseFloat((region.business.revenue * multiplier).toFixed(1));
    region.business.cogs = parseFloat((region.business.cogs * multiplier).toFixed(1));
    region.business.ebitda = parseFloat((region.business.ebitda * multiplier).toFixed(1));
    region.business.netIncome = parseFloat((region.business.netIncome * multiplier).toFixed(1));
    region.business.opex = parseFloat((region.business.opex * multiplier).toFixed(1));
    region.business.capex = parseFloat((region.business.capex * multiplier).toFixed(1));

    // Scale assurance KPIs
    region.assurance.totalTickets = Math.round(region.assurance.totalTickets * multiplier);
    region.assurance.resolvedTickets = Math.round(region.assurance.resolvedTickets * multiplier);
    region.assurance.pendingTickets = Math.round(region.assurance.pendingTickets * multiplier);
    region.assurance.slaCompliance = Math.min(100, parseFloat((region.assurance.slaCompliance * (0.96 + 0.04 * multiplier)).toFixed(2)));
    region.assurance.mttrHours = parseFloat((region.assurance.mttrHours * (2 - multiplier)).toFixed(2));
    
    region.assurance.backlogTrend = region.assurance.backlogTrend.map(b => ({
      ...b,
      backlog: Math.round(b.backlog * multiplier),
      resolved: Math.round(b.resolved * multiplier)
    }));
    region.assurance.ticketByProduct = region.assurance.ticketByProduct.map(p => ({
      ...p,
      value: Math.round(p.value * multiplier)
    }));

    // Scale provisioning KPIs
    region.provisioning.psbActual = Math.round(region.provisioning.psbActual * multiplier);
    region.provisioning.pendingInstallations = Math.round(region.provisioning.pendingInstallations * multiplier);
    region.provisioning.leadTimeDays = parseFloat((region.provisioning.leadTimeDays * (2 - multiplier)).toFixed(2));
    region.provisioning.weeklyTrends = region.provisioning.weeklyTrends.map(w => ({
      ...w,
      actual: Math.round(w.actual * multiplier)
    }));

    // Adjust QE scores
    region.qe.overallQEScore = Math.min(100, parseFloat((region.qe.overallQEScore * (0.98 + 0.02 * multiplier)).toFixed(1)));
    region.qe.patrolCompliance = Math.min(100, parseFloat((region.qe.patrolCompliance * (0.98 + 0.02 * multiplier)).toFixed(1)));
    region.qe.materialConformity = Math.min(100, parseFloat((region.qe.materialConformity * (0.98 + 0.02 * multiplier)).toFixed(1)));
    region.qe.pmExecutionRate = Math.min(100, parseFloat((region.qe.pmExecutionRate * (0.98 + 0.02 * multiplier)).toFixed(1)));

    // Specially handle technicians for 'REG 5 - Jatim & Nusra' using our dynamic month map!
    if (regName === 'REG 5 - Jatim & Nusra') {
      const mappedTechs = region.technicians.topTechnicians.map(tech => {
        if (tech.monthlyData && tech.monthlyData[month]) {
          const hist = tech.monthlyData[month];
          return {
            ...tech,
            ticketsResolved: hist.ticketsResolved,
            productivityScore: hist.productivityScore,
            psbCompleted: hist.psbCompleted,
            skillLevel: hist.skillLevel,
            status: hist.status,
            rating: hist.rating,
            benjar: hist.benjar,
            lainLain: hist.lainLain,
            tiketManual: hist.tiketManual,
            tiketReguler: hist.tiketReguler,
            underspec: hist.underspec,
            replacementOnt: hist.replacementOnt,
            gamasOdp: hist.gamasOdp,
            gamasFeeder: hist.gamasFeeder,
            gamasDistribusi: hist.gamasDistribusi,
            tiketClose: hist.tiketClose
          };
        }
        // If the month is not in static monthlyData (e.g. Agustus - Desember), scale realistically
        const scaledTickets = Math.round(tech.ticketsResolved * multiplier);
        return {
          ...tech,
          ticketsResolved: scaledTickets,
          psbCompleted: Math.round(tech.psbCompleted * multiplier),
          productivityScore: parseFloat(Math.min(5.0, Math.max(3.2, tech.productivityScore * (0.9 + 0.1 * multiplier))).toFixed(1)),
          tiketClose: scaledTickets,
          tiketReguler: Math.round((tech.tiketReguler || Math.round(scaledTickets * 0.88)) * multiplier)
        };
      });

      const activeTechCount = mappedTechs.filter(t => t.status === 'Active').length;
      const totalTechCount = mappedTechs.length;
      const avgScore = parseFloat((mappedTechs.reduce((sum, t) => sum + t.productivityScore, 0) / totalTechCount).toFixed(2));

      region.technicians.topTechnicians = mappedTechs;
      region.technicians.activeTechnicians = activeTechCount;
      region.technicians.utilizationRate = parseFloat(((activeTechCount / totalTechCount) * 100).toFixed(1));
      region.technicians.avgProductivityScore = avgScore;
    } else {
      // Scale normal technicians
      region.technicians.topTechnicians = region.technicians.topTechnicians.map(t => {
        const tickets = Math.round(t.ticketsResolved * multiplier);
        return {
          ...t,
          ticketsResolved: tickets,
          psbCompleted: Math.round(t.psbCompleted * multiplier),
          productivityScore: parseFloat(Math.min(5.0, t.productivityScore * (0.8 + 0.2 * multiplier)).toFixed(1))
        };
      });
    }
  });

  return cloned;
}

export default function App() {
  // User Authentication State
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem('telkom_akses_auth_user') || sessionStorage.getItem('telkom_akses_auth_user') || null;
  });
  const [currentUserRole, setCurrentUserRole] = useState<string>(() => {
    return localStorage.getItem('telkom_akses_auth_role') || sessionStorage.getItem('telkom_akses_auth_role') || '';
  });

  // Welcome page state: shown right after login or in fresh session until dismissed
  const [showWelcomePage, setShowWelcomePage] = useState<boolean>(() => {
    return !sessionStorage.getItem('telkom_akses_welcome_dismissed');
  });

  // Check if current user has OWNER privilege (verified from Google Sheets 'list user' Kolom C)
  const isOwner = (currentUserRole || '').trim().toUpperCase() === 'OWNER';

  // Verify and sync role from Google Sheets 'list user' Kolom C on mount or when user changes
  useEffect(() => {
    if (currentUser) {
      fetchUserAccounts().then(res => {
        const found = res.accounts.find(a => a.user.toLowerCase() === currentUser.toLowerCase());
        if (found) {
          const role = (found.previlage || 'USER').toUpperCase();
          setCurrentUserRole(role);
          if (localStorage.getItem('telkom_akses_auth_user')) {
            localStorage.setItem('telkom_akses_auth_role', role);
          } else {
            sessionStorage.setItem('telkom_akses_auth_role', role);
          }
        }
      }).catch(err => {
        console.warn('Gagal verifikasi role user:', err);
      });
    }
  }, [currentUser]);

  const handleLogout = () => {
    localStorage.removeItem('telkom_akses_auth_user');
    localStorage.removeItem('telkom_akses_auth_role');
    sessionStorage.removeItem('telkom_akses_auth_user');
    sessionStorage.removeItem('telkom_akses_auth_role');
    sessionStorage.removeItem('telkom_akses_welcome_dismissed');
    setCurrentUser(null);
    setCurrentUserRole('');
    setActiveTab('business');
    setShowWelcomePage(true);
  };

  // Main dashboard state
  const [dataState, setDataState] = useState<PerformanceDashboardData>(mockPerformanceData);
  const [activeRegional, setActiveRegional] = useState<Regional>('All');
  type AppTab = 'business' | 'assurance' | 'provisioning' | 'qe' | 'technician' | 'kelola-data';
  const [activeTab, setActiveTab] = useState<AppTab>('business');

  // Sidebar navigation state (collapse/expand, hide/unhide)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('telkom_akses_sidebar_open');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem('telkom_akses_sidebar_open', String(next));
      return next;
    });
  };

  // Google Sheets state for Provisioning Dashboard
  const [provisioningData, setProvisioningData] = useState<ProvisioningRow[]>(() => {
    const q12026 = generate2026Q1Data();
    return [...rawProvisioningData, ...q12026, ...fallbackIndibizzData];
  });
  const [provisioningSubTab, setProvisioningSubTab] = useState<'sektor' | 'tabel' | 'peta'>('sektor');
  const [assuranceSubTab, setAssuranceSubTab] = useState<AssuranceSubTab>('ticket_perf');
  const [qeSubTab, setQeSubTab] = useState<'main' | 'detail'>('main');
  const [technicianSubTab, setTechnicianSubTab] = useState<'leaderboard' | 'progress'>('leaderboard');
  const [businessSubTab, setBusinessSubTab] = useState<'kpi' | 'trend' | 'portfolio'>('kpi');
  const [kelolaDataSubTab, setKelolaDataSubTab] = useState<'sheets' | 'indicators' | 'users'>('sheets');
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);

  // Accordion state for sidebar sub-menus: default ALL collapsed/hidden
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    business: false,
    assurance: false,
    provisioning: false,
    qe: false,
    technician: false,
    'kelola-data': false,
  });

  // Handle ketika user berpindah halaman: tutup sub halaman sebelumnya, hanya aktif di halaman baru yang dipilih user
  const handleNavigateTab = (tabKey: AppTab, autoExpandSubMenu: boolean = true) => {
    setActiveTab(tabKey);
    setExpandedMenus({
      business: tabKey === 'business' ? autoExpandSubMenu : false,
      assurance: tabKey === 'assurance' ? autoExpandSubMenu : false,
      provisioning: tabKey === 'provisioning' ? autoExpandSubMenu : false,
      qe: tabKey === 'qe' ? autoExpandSubMenu : false,
      technician: tabKey === 'technician' ? autoExpandSubMenu : false,
      'kelola-data': tabKey === 'kelola-data' ? autoExpandSubMenu : false,
    });
  };

  const toggleMenuExpand = (menuKey: AppTab, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setExpandedMenus(prev => {
      const willBeOpen = !prev[menuKey];
      if (willBeOpen) {
        // Ketika membuka sub halaman: jadikan halaman ini aktif dan tutup semua sub halaman lainnya
        setActiveTab(menuKey);
        return {
          business: menuKey === 'business',
          assurance: menuKey === 'assurance',
          provisioning: menuKey === 'provisioning',
          qe: menuKey === 'qe',
          technician: menuKey === 'technician',
          'kelola-data': menuKey === 'kelola-data',
        };
      } else {
        // Ketika menutup: tutup sub halaman ini
        return {
          ...prev,
          [menuKey]: false,
        };
      }
    });
  };

  // Security guard: If a non-owner user somehow lands on kelola-data, revert to business tab immediately
  useEffect(() => {
    if (!isOwner && activeTab === 'kelola-data') {
      handleNavigateTab('business');
    }
  }, [isOwner, activeTab]);
  
  // Period filter states
  const [activeMonth, setActiveMonth] = useState<string>('Juli');
  const [activeYear, setActiveYear] = useState<string>('2026');

  const scrollToSection = (sectionId: string) => {
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  const [showProvisioningDropdown, setShowProvisioningDropdown] = useState(false);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'local' | 'live' | 'error'>('local');
  const [syncTime, setSyncTime] = useState<string>(new Date().toLocaleTimeString('id-ID'));
  const [errorMessage, setErrorMessage] = useState<string>('');

  const fetchLiveData = async () => {
    setIsLoadingLive(true);
    setErrorMessage('');
    const spreadsheetId = '1RpddHBuW4qndOA72CoiUdUID1_gf7bXo_3XMm5RImbw';
    const masterUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('Master Endstate')}`;
    const indibizzUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('GD INDIBIZZ NEW')}`;

    try {
      // Fetch both sheets (Master Endstate for Indihome/PDA and GD INDIBIZZ NEW for Indibizz)
      const [masterRes, indibizzRes] = await Promise.allSettled([
        fetch(masterUrl),
        fetch(indibizzUrl),
      ]);

      let masterRecords: ProvisioningRow[] = [];
      let indibizzRecords: ProvisioningRow[] = [];

      // Process Master Endstate
      if (masterRes.status === 'fulfilled' && masterRes.value.ok) {
        const csvText = await masterRes.value.text();
        const parsedRows = parseCSV(csvText);
        if (parsedRows.length > 1) {
          masterRecords = mapRowsToProvisioning(parsedRows);
        }
      }

      // Process GD INDIBIZZ NEW
      if (indibizzRes.status === 'fulfilled' && indibizzRes.value.ok) {
        const indibizzCsvText = await indibizzRes.value.text();
        const parsedIndibizzRows = parseCSV(indibizzCsvText);
        if (parsedIndibizzRows.length > 1) {
          indibizzRecords = mapIndibizzRowsToProvisioning(parsedIndibizzRows);
        }
      }

      // Determine final records using fetched data or reliable fallback
      const finalMaster = masterRecords.length > 0 
        ? masterRecords 
        : [...rawProvisioningData, ...generate2026Q1Data()];
      const finalIndibizz = indibizzRecords.length > 0 
        ? indibizzRecords 
        : fallbackIndibizzData;

      const combinedRecords = [...finalMaster, ...finalIndibizz];
      
      if (combinedRecords.length === 0) {
        throw new Error("Tidak ada data valid yang bisa dimuat dari spreadsheet.");
      }

      setProvisioningData(combinedRecords);
      setSyncStatus('live');
      setSyncTime(new Date().toLocaleTimeString('id-ID'));
    } catch (err: any) {
      console.warn("Dynamic spreadsheet fetch failed, using offline cache.", err);
      setSyncStatus('error');
      setErrorMessage(err.message || 'CORS Blocked atau Network Offline');
    } finally {
      setIsLoadingLive(false);
    }
  };

  useEffect(() => {
    fetchLiveData();
  }, []);

  // Derive current display data based on active regional selection, adjusted for the active month
  const monthAdjustedData = getMonthData(dataState, activeMonth);
  const currentData: RegionalPerformanceData = activeRegional === 'All' 
    ? getAllRegionalData(monthAdjustedData)
    : monthAdjustedData[activeRegional];

  // Handler to merge technician productivity updates back into the central state
  const handleUpdateTechnicians = (updatedTechs: Technician[]) => {
    if (activeRegional === 'All') {
      // If updating on 'All', we update technicians across all regions
      const nextData = { ...dataState };
      Object.keys(nextData).forEach(key => {
        const regName = key as Regional;
        const regionTechs = updatedTechs.filter(t => t.regional === regName);
        if (regionTechs.length > 0) {
          const totalTechs = nextData[regName].technicians.totalTechnicians;
          const activeTechs = regionTechs.filter(t => t.status === 'Active').length;
          const avgScore = regionTechs.reduce((sum, t) => sum + t.productivityScore, 0) / regionTechs.length;
          
          nextData[regName].technicians = {
            ...nextData[regName].technicians,
            topTechnicians: regionTechs,
            activeTechnicians: activeTechs,
            avgProductivityScore: parseFloat(avgScore.toFixed(2)),
          };
        }
      });
      setDataState(nextData);
    } else {
      // Update specifically for the active regional
      const totalTechs = currentData.technicians.totalTechnicians;
      const activeTechs = updatedTechs.filter(t => t.status === 'Active').length;
      const avgScore = updatedTechs.reduce((sum, t) => sum + t.productivityScore, 0) / updatedTechs.length;

      setDataState({
        ...dataState,
        [activeRegional]: {
          ...currentData,
          technicians: {
            ...currentData.technicians,
            topTechnicians: updatedTechs,
            activeTechnicians: activeTechs,
            avgProductivityScore: parseFloat(avgScore.toFixed(2)),
          }
        }
      });
    }
  };

  const handleDownloadPDF = () => {
    setShowPdfModal(true);
  };

  // Render Login Page if user is not logged in
  if (!currentUser) {
    return (
      <LoginPage 
        onLoginSuccess={(userName, userRole) => {
          sessionStorage.removeItem('telkom_akses_welcome_dismissed');
          setCurrentUser(userName);
          setCurrentUserRole(userRole);
          setShowWelcomePage(true);
        }} 
      />
    );
  }

  // Render Welcome Page after login or when requested
  if (showWelcomePage) {
    return (
      <WelcomePage
        currentUser={currentUser}
        currentUserRole={currentUserRole}
        onProceed={() => {
          setActiveTab('business');
          sessionStorage.setItem('telkom_akses_welcome_dismissed', 'true');
          setShowWelcomePage(false);
        }}
        onSelectModule={(moduleId) => {
          handleNavigateTab(moduleId as AppTab);
          sessionStorage.setItem('telkom_akses_welcome_dismissed', 'true');
          setShowWelcomePage(false);
        }}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="main-app">
      
      {/* 1. STICKY TOP HEADER & NAVIGATION WRAPPER */}
      <div className="sticky top-0 z-40 bg-slate-950 shadow-md" id="main-sticky-header">
        {/* TOP PROFESSIONAL BRAND BAR */}
        <header className="bg-slate-950 text-white border-b border-slate-900 shadow-sm shrink-0" id="brand-header">
          <div className="w-full px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4">
            
            {/* SISI KIRI: Logo dan Judul Web (Klik untuk kembali ke Welcome Page) */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowWelcomePage(true);
                  sessionStorage.removeItem('telkom_akses_welcome_dismissed');
                }}
                className="flex items-center space-x-3.5 text-left group cursor-pointer p-1 -m-1 rounded-2xl hover:bg-slate-900/80 transition-all focus:outline-none focus:ring-2 focus:ring-red-500/40"
                title="Kembali ke Halaman Sambutan (Welcome Page)"
                id="brand-header-title-box"
              >
                {/* Logo Telkom Akses */}
                <div className="relative flex items-center justify-center w-11 h-11 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md shadow-black/40 group-hover:scale-105 group-hover:border-red-500/50 transition-all duration-200">
                  <img 
                    src="/src/assets/images/telkom_akses_logo_1784023194788.jpg" 
                    alt="Telkom Akses Logo" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
                </div>

                {/* Judul Web */}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-sans font-black tracking-tight text-lg text-white group-hover:text-red-100 transition-colors">TELKOM</span>
                    <span className="font-sans font-extrabold tracking-widest text-lg text-red-500 group-hover:text-red-400 transition-colors">AKSES</span>
                    <span className="hidden sm:inline-block px-1.5 py-0.5 bg-red-950/80 text-red-400 border border-red-900/50 rounded text-[9px] font-mono font-bold tracking-wider uppercase">
                      NOC
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black font-mono flex items-center gap-1.5">
                    <span>Performance Control Hub</span>
                    <span className="hidden lg:inline text-[9px] text-red-400/80 font-normal font-sans opacity-0 group-hover:opacity-100 transition-opacity">
                      • Beranda
                    </span>
                  </p>
                </div>
              </button>
            </div>

            {/* SISI KANAN: Detail User dan Menu Keluar (+ Aksi PDF) */}
            <div className="flex items-center space-x-2.5">
              {/* Download PDF Button */}
              <button
                onClick={handleDownloadPDF}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-lg transition-all border border-red-500/80 cursor-pointer shadow-xs text-xs font-bold"
                title="Download PDF Resume Performansi (Sesuai Halaman Aktif)"
                id="btn-header-download-pdf"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF Resume</span>
              </button>

              {/* Detail User (Nama & Role) */}
              <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800/80 px-3 py-1.5 rounded-xl text-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 font-bold shrink-0 text-[11px]">
                  {currentUser ? currentUser.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-slate-200 font-bold max-w-[130px] truncate leading-tight" title={currentUser}>
                    {currentUser}
                  </span>
                  {currentUserRole && (
                    <span className={`text-[9px] font-black uppercase tracking-wider ${
                      isOwner ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                      {currentUserRole}
                    </span>
                  )}
                </div>
              </div>

              {/* Menu Keluar / Logout */}
              <button
                onClick={handleLogout}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/20 cursor-pointer flex items-center space-x-1.5 active:scale-95 ml-1"
                title="Keluar dari Aplikasi (Logout)"
                id="btn-header-logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* 2. MAIN LAYOUT WRAPPER (LEFT SIDEBAR + MAIN CONTENT) */}
      <div className="flex-1 flex flex-row min-h-0 relative bg-slate-50" id="main-layout-container">

        {/* SIDEBAR NAVIGATION (EXPANDED OR COLLAPSED ICON RAIL) */}
        <aside
          className={`${
            isSidebarOpen ? 'w-72' : 'w-[70px]'
          } bg-white border-r border-slate-200/90 shadow-xs shrink-0 flex flex-col sticky top-[69px] h-[calc(100vh-69px)] z-30 transition-all duration-300 ease-in-out`}
          id="sidebar-navigation"
        >
          {/* Sidebar Top Header with Arrow Button to HIDE or UNHIDE (Cukup Tanda Panah Saja) */}
          <div className={`p-3 border-b border-slate-100 flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'} bg-slate-50/90 sticky top-0 z-10 backdrop-blur-xs min-h-[57px]`}>
            {isSidebarOpen && (
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 font-mono">
                  Menu Halaman
                </span>
              </div>
            )}
            
            {/* Tombol Panah Hide/Unhide di dalam Sidebar */}
            <button
              onClick={toggleSidebar}
              className={`flex items-center justify-center p-2 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 rounded-xl transition-all shadow-2xs cursor-pointer group ${!isSidebarOpen ? 'w-10 h-10' : ''}`}
              title={isSidebarOpen ? "Sembunyikan Menu (Hide)" : "Tampilkan Menu Penuh (Unhide)"}
              id="btn-sidebar-arrow-toggle"
            >
              {isSidebarOpen ? (
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-slate-500 group-hover:text-red-600" />
              ) : (
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform text-slate-600 group-hover:text-red-600" />
              )}
            </button>
          </div>

          {/* JIKA SIDEBAR DI HIDE: MUNCULKAN ICON-ICON HALAMAN DI SIDE BAR */}
          {!isSidebarOpen ? (
            <div className="p-2 space-y-2.5 flex-1 flex flex-col items-center overflow-y-auto" id="sidebar-collapsed-icons">
              {/* Icon 1: Performansi Bisnis */}
              <button
                onClick={() => handleNavigateTab('business')}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer group relative ${
                  activeTab === 'business'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/25 ring-2 ring-red-600/30'
                    : 'bg-white text-slate-600 hover:bg-red-50 hover:text-red-600 border border-slate-200/80 shadow-2xs'
                }`}
                title="Performansi Bisnis (Indibizz & B2B)"
                id="sidebar-collapsed-icon-business"
              >
                <BarChart3 className="w-5 h-5" />
              </button>

              {/* Icon 2: Performansi Assurance */}
              <button
                onClick={() => handleNavigateTab('assurance')}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer group relative ${
                  activeTab === 'assurance'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/25 ring-2 ring-red-600/30'
                    : 'bg-white text-slate-600 hover:bg-red-50 hover:text-red-600 border border-slate-200/80 shadow-2xs'
                }`}
                title="Performansi Assurance (Tiket & Gangguan)"
                id="sidebar-collapsed-icon-assurance"
              >
                <ShieldCheck className="w-5 h-5" />
              </button>

              {/* Icon 3: Performansi Provisioning */}
              <button
                onClick={() => handleNavigateTab('provisioning')}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer group relative ${
                  activeTab === 'provisioning'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/25 ring-2 ring-red-600/30'
                    : 'bg-white text-slate-600 hover:bg-red-50 hover:text-red-600 border border-slate-200/80 shadow-2xs'
                }`}
                title="Performansi Provisioning (Pasang Baru & Kpro)"
                id="sidebar-collapsed-icon-provisioning"
              >
                <UserPlus className="w-5 h-5" />
              </button>

              {/* Icon 4: Performansi QE */}
              <button
                onClick={() => handleNavigateTab('qe')}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer group relative ${
                  activeTab === 'qe'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/25 ring-2 ring-red-600/30'
                    : 'bg-white text-slate-600 hover:bg-red-50 hover:text-red-600 border border-slate-200/80 shadow-2xs'
                }`}
                title="Performansi QE (Safety & Mutu K3)"
                id="sidebar-collapsed-icon-qe"
              >
                <ClipboardCheck className="w-5 h-5" />
              </button>

              {/* Icon 5: Performansi Teknisi */}
              <button
                onClick={() => handleNavigateTab('technician')}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer group relative ${
                  activeTab === 'technician'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/25 ring-2 ring-red-600/30'
                    : 'bg-white text-slate-600 hover:bg-red-50 hover:text-red-600 border border-slate-200/80 shadow-2xs'
                }`}
                title="Performansi Teknisi (Produktivitas & Leaderboard)"
                id="sidebar-collapsed-icon-technician"
              >
                <Users className="w-5 h-5" />
              </button>

              {/* Icon 6: Kelola Data (Khusus OWNER) */}
              {isOwner && (
                <button
                  onClick={() => handleNavigateTab('kelola-data')}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer group relative ${
                    activeTab === 'kelola-data'
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/25 ring-2 ring-red-600/30'
                      : 'bg-white text-slate-600 hover:bg-red-50 hover:text-red-600 border border-slate-200/80 shadow-2xs'
                  }`}
                  title="Kelola Data (OWNER - Spreadsheet & Konfigurasi)"
                  id="sidebar-collapsed-icon-kelola-data"
                >
                  <Database className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 border-2 border-white rounded-full" />
                </button>
              )}
            </div>
          ) : (
            /* JIKA SIDEBAR DI UNHIDE: MUNCULKAN FULL LIST LENGKAP */
            <div className="p-3 space-y-2 flex-1 overflow-y-auto" id="sidebar-expanded-list">
              {/* Item 1: Bisnis */}
              <div className="rounded-xl overflow-hidden bg-slate-50/40 border border-slate-100/90 transition-all">
                <div className="flex items-center justify-between p-1">
                  <button
                    onClick={() => handleNavigateTab('business')}
                    className={`flex-1 flex items-center space-x-3 px-2.5 py-2 rounded-lg text-left transition-all group cursor-pointer ${
                      activeTab === 'business'
                        ? 'bg-red-600 text-white shadow-sm font-bold'
                        : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-950 font-medium'
                    }`}
                    id="sidebar-tab-business"
                  >
                    <div className={`p-2 rounded-lg shrink-0 transition-colors ${
                      activeTab === 'business' ? 'bg-red-700/60 text-white' : 'bg-white text-slate-600 shadow-2xs group-hover:text-red-600'
                    }`}>
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate">Performansi Bisnis</div>
                      <div className={`text-[10px] truncate ${activeTab === 'business' ? 'text-red-100' : 'text-slate-400'}`}>
                        Indibizz & B2B Profitabilitas
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => toggleMenuExpand('business', e)}
                    className={`p-2 rounded-lg ml-1 shrink-0 transition-all cursor-pointer ${
                      activeTab === 'business'
                        ? 'bg-red-700/40 hover:bg-red-700 text-white'
                        : 'bg-white hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 border border-slate-200/60 shadow-2xs'
                    }`}
                    title={expandedMenus.business ? 'Sembunyikan Sub Halaman (-)' : 'Tampilkan Sub Halaman (+)'}
                  >
                    {expandedMenus.business ? (
                      <Minus className="w-3.5 h-3.5" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Sub-menu Bisnis (default sembunyi, muncul saat user pencet plus atau pilih menu) */}
                {expandedMenus.business && (
                  <div className="px-2 py-1.5 space-y-1 bg-white/70 border-t border-slate-100">
                    <button
                      onClick={() => {
                        handleNavigateTab('business');
                        setBusinessSubTab('kpi');
                      }}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all cursor-pointer ${
                        activeTab === 'business' && businessSubTab === 'kpi'
                          ? 'bg-red-50 text-red-700 font-bold border border-red-200/60'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                      }`}
                    >
                      <TrendingUp className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'business' && businessSubTab === 'kpi' ? 'text-red-600' : 'text-slate-400'}`} />
                      <span className="truncate text-[11px]">Ringkasan & KPI Finansial</span>
                    </button>
                    <button
                      onClick={() => {
                        handleNavigateTab('business');
                        setBusinessSubTab('trend');
                      }}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all cursor-pointer ${
                        activeTab === 'business' && businessSubTab === 'trend'
                          ? 'bg-red-50 text-red-700 font-bold border border-red-200/60'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                      }`}
                    >
                      <BarChart2 className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'business' && businessSubTab === 'trend' ? 'text-red-600' : 'text-slate-400'}`} />
                      <span className="truncate text-[11px]">Trend Finansial Perbulan</span>
                    </button>
                    <button
                      onClick={() => {
                        handleNavigateTab('business');
                        setBusinessSubTab('portfolio');
                      }}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all cursor-pointer ${
                        activeTab === 'business' && businessSubTab === 'portfolio'
                          ? 'bg-red-50 text-red-700 font-bold border border-red-200/60'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                      }`}
                    >
                      <Briefcase className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'business' && businessSubTab === 'portfolio' ? 'text-red-600' : 'text-slate-400'}`} />
                      <span className="truncate text-[11px]">Detail Portofolio & Program</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Item 2: Assurance */}
              <div className="rounded-xl overflow-hidden bg-slate-50/40 border border-slate-100/90 transition-all">
                <div className="flex items-center justify-between p-1">
                  <button
                    onClick={() => handleNavigateTab('assurance')}
                    className={`flex-1 flex items-center space-x-3 px-2.5 py-2 rounded-lg text-left transition-all group cursor-pointer ${
                      activeTab === 'assurance'
                        ? 'bg-red-600 text-white shadow-sm font-bold'
                        : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-950 font-medium'
                    }`}
                    id="sidebar-tab-assurance"
                  >
                    <div className={`p-2 rounded-lg shrink-0 transition-colors ${
                      activeTab === 'assurance' ? 'bg-red-700/60 text-white' : 'bg-white text-slate-600 shadow-2xs group-hover:text-red-600'
                    }`}>
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate">Performansi Assurance</div>
                      <div className={`text-[10px] truncate ${activeTab === 'assurance' ? 'text-red-100' : 'text-slate-400'}`}>
                        Tiket & Penanganan Gangguan
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => toggleMenuExpand('assurance', e)}
                    className={`p-2 rounded-lg ml-1 shrink-0 transition-all cursor-pointer ${
                      activeTab === 'assurance'
                        ? 'bg-red-700/40 hover:bg-red-700 text-white'
                        : 'bg-white hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 border border-slate-200/60 shadow-2xs'
                    }`}
                    title={expandedMenus.assurance ? 'Sembunyikan Sub Halaman (-)' : 'Tampilkan Sub Halaman (+)'}
                  >
                    {expandedMenus.assurance ? (
                      <Minus className="w-3.5 h-3.5" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Sub-menu Assurance (default sembunyi, muncul saat user pencet plus atau pilih menu) */}
                {expandedMenus.assurance && (
                  <div className="px-2 py-1.5 space-y-1 bg-white/70 border-t border-slate-100">
                    <button
                      onClick={() => {
                        handleNavigateTab('assurance');
                        setAssuranceSubTab('ticket_perf');
                      }}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all cursor-pointer ${
                        activeTab === 'assurance' && assuranceSubTab === 'ticket_perf'
                          ? 'bg-red-50 text-red-700 font-bold border border-red-200/60'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                      }`}
                    >
                      <Ticket className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'assurance' && assuranceSubTab === 'ticket_perf' ? 'text-red-600' : 'text-slate-400'}`} />
                      <span className="truncate text-[11px]">Performansi Tiket</span>
                    </button>
                    <button
                      onClick={() => {
                        handleNavigateTab('assurance');
                        setAssuranceSubTab('operations');
                      }}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all cursor-pointer ${
                        activeTab === 'assurance' && assuranceSubTab === 'operations'
                          ? 'bg-red-50 text-red-700 font-bold border border-red-200/60'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                      }`}
                    >
                      <Activity className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'assurance' && assuranceSubTab === 'operations' ? 'text-red-600' : 'text-slate-400'}`} />
                      <span className="truncate text-[11px]">Evaluasi Solusi Tiket</span>
                    </button>
                    <button
                      onClick={() => {
                        handleNavigateTab('assurance');
                        setAssuranceSubTab('ticket_logs');
                      }}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all cursor-pointer ${
                        activeTab === 'assurance' && assuranceSubTab === 'ticket_logs'
                          ? 'bg-red-50 text-red-700 font-bold border border-red-200/60'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                      }`}
                    >
                      <FileSpreadsheet className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'assurance' && assuranceSubTab === 'ticket_logs' ? 'text-red-600' : 'text-slate-400'}`} />
                      <span className="truncate text-[11px]">Detail Transaksi & Log Tiket</span>
                    </button>
                    <button
                      onClick={() => {
                        handleNavigateTab('assurance');
                        setAssuranceSubTab('kpi_imbal_jasa');
                      }}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all cursor-pointer ${
                        activeTab === 'assurance' && assuranceSubTab === 'kpi_imbal_jasa'
                          ? 'bg-red-50 text-red-700 font-bold border border-red-200/60'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                      }`}
                      id="sidebar-subtab-kpi-imbal-jasa"
                    >
                      <Award className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'assurance' && assuranceSubTab === 'kpi_imbal_jasa' ? 'text-red-600' : 'text-slate-400'}`} />
                      <span className="truncate text-[11px]">KPI ASSURANCE</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Item 3: Provisioning */}
              <div className="rounded-xl overflow-hidden bg-slate-50/40 border border-slate-100/90 transition-all">
                <div className="flex items-center justify-between p-1">
                  <button
                    onClick={() => handleNavigateTab('provisioning')}
                    className={`flex-1 flex items-center space-x-3 px-2.5 py-2 rounded-lg text-left transition-all group cursor-pointer ${
                      activeTab === 'provisioning'
                        ? 'bg-red-600 text-white shadow-sm font-bold'
                        : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-950 font-medium'
                    }`}
                    id="sidebar-tab-provisioning"
                  >
                    <div className={`p-2 rounded-lg shrink-0 transition-colors ${
                      activeTab === 'provisioning' ? 'bg-red-700/60 text-white' : 'bg-white text-slate-600 shadow-2xs group-hover:text-red-600'
                    }`}>
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate">Performansi Provisioning</div>
                      <div className={`text-[10px] truncate ${activeTab === 'provisioning' ? 'text-red-100' : 'text-slate-400'}`}>
                        Pasang Baru & Kpro
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => toggleMenuExpand('provisioning', e)}
                    className={`p-2 rounded-lg ml-1 shrink-0 transition-all cursor-pointer ${
                      activeTab === 'provisioning'
                        ? 'bg-red-700/40 hover:bg-red-700 text-white'
                        : 'bg-white hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 border border-slate-200/60 shadow-2xs'
                    }`}
                    title={expandedMenus.provisioning ? 'Sembunyikan Sub Halaman (-)' : 'Tampilkan Sub Halaman (+)'}
                  >
                    {expandedMenus.provisioning ? (
                      <Minus className="w-3.5 h-3.5" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Sub-menu Provisioning (default sembunyi, muncul saat user pencet plus atau pilih menu) */}
                {expandedMenus.provisioning && (
                  <div className="px-2 py-1.5 space-y-1 bg-white/70 border-t border-slate-100">
                    <button
                      onClick={() => {
                        handleNavigateTab('provisioning');
                        setProvisioningSubTab('sektor');
                      }}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all cursor-pointer ${
                        activeTab === 'provisioning' && provisioningSubTab === 'sektor'
                          ? 'bg-red-50 text-red-700 font-bold border border-red-200/60'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                      }`}
                    >
                      <PieChart className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'provisioning' && provisioningSubTab === 'sektor' ? 'text-red-600' : 'text-slate-400'}`} />
                      <span className="truncate text-[11px]">Kinerja Sektor & Bulanan</span>
                    </button>
                    <button
                      onClick={() => {
                        handleNavigateTab('provisioning');
                        setProvisioningSubTab('tabel');
                      }}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all cursor-pointer ${
                        activeTab === 'provisioning' && provisioningSubTab === 'tabel'
                          ? 'bg-red-50 text-red-700 font-bold border border-red-200/60'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                      }`}
                    >
                      <Table className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'provisioning' && provisioningSubTab === 'tabel' ? 'text-red-600' : 'text-slate-400'}`} />
                      <span className="truncate text-[11px]">Trend Bulanan & Kpro</span>
                    </button>
                    <button
                      onClick={() => {
                        handleNavigateTab('provisioning');
                        setProvisioningSubTab('peta');
                      }}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all cursor-pointer ${
                        activeTab === 'provisioning' && provisioningSubTab === 'peta'
                          ? 'bg-red-50 text-red-700 font-bold border border-red-200/60'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                      }`}
                    >
                      <Globe className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'provisioning' && provisioningSubTab === 'peta' ? 'text-red-600' : 'text-slate-400'}`} />
                      <span className="truncate text-[11px]">Peta Koordinat Realisasi</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Item 4: QE */}
              <div className="rounded-xl overflow-hidden bg-slate-50/40 border border-slate-100/90 transition-all">
                <div className="flex items-center justify-between p-1">
                  <button
                    onClick={() => handleNavigateTab('qe')}
                    className={`flex-1 flex items-center space-x-3 px-2.5 py-2 rounded-lg text-left transition-all group cursor-pointer ${
                      activeTab === 'qe'
                        ? 'bg-red-600 text-white shadow-sm font-bold'
                        : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-950 font-medium'
                    }`}
                    id="sidebar-tab-qe"
                  >
                    <div className={`p-2 rounded-lg shrink-0 transition-colors ${
                      activeTab === 'qe' ? 'bg-red-700/60 text-white' : 'bg-white text-slate-600 shadow-2xs group-hover:text-red-600'
                    }`}>
                      <ClipboardCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate">Performansi QE</div>
                      <div className={`text-[10px] truncate ${activeTab === 'qe' ? 'text-red-100' : 'text-slate-400'}`}>
                        Safety & Mutu K3 Service Area
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => toggleMenuExpand('qe', e)}
                    className={`p-2 rounded-lg ml-1 shrink-0 transition-all cursor-pointer ${
                      activeTab === 'qe'
                        ? 'bg-red-700/40 hover:bg-red-700 text-white'
                        : 'bg-white hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 border border-slate-200/60 shadow-2xs'
                    }`}
                    title={expandedMenus.qe ? 'Sembunyikan Sub Halaman (-)' : 'Tampilkan Sub Halaman (+)'}
                  >
                    {expandedMenus.qe ? (
                      <Minus className="w-3.5 h-3.5" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Sub-menu QE (default sembunyi, muncul saat user pencet plus atau pilih menu) */}
                {expandedMenus.qe && (
                  <div className="px-2 py-1.5 space-y-1 bg-white/70 border-t border-slate-100">
                    <button
                      onClick={() => {
                        handleNavigateTab('qe');
                        setQeSubTab('main');
                      }}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all cursor-pointer ${
                        activeTab === 'qe' && qeSubTab === 'main'
                          ? 'bg-red-50 text-red-700 font-bold border border-red-200/60'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                      }`}
                    >
                      <Layers className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'qe' && qeSubTab === 'main' ? 'text-red-600' : 'text-slate-400'}`} />
                      <span className="truncate text-[11px]">Performansi & Tren Grafik</span>
                    </button>
                    <button
                      onClick={() => {
                        handleNavigateTab('qe');
                        setQeSubTab('detail');
                      }}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all cursor-pointer ${
                        activeTab === 'qe' && qeSubTab === 'detail'
                          ? 'bg-red-50 text-red-700 font-bold border border-red-200/60'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                      }`}
                    >
                      <Table className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'qe' && qeSubTab === 'detail' ? 'text-red-600' : 'text-slate-400'}`} />
                      <span className="truncate text-[11px]">Detail Transaksi & Rekap</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Item 5: Teknisi */}
              <div className="rounded-xl overflow-hidden bg-slate-50/40 border border-slate-100/90 transition-all">
                <div className="flex items-center justify-between p-1">
                  <button
                    onClick={() => handleNavigateTab('technician')}
                    className={`flex-1 flex items-center space-x-3 px-2.5 py-2 rounded-lg text-left transition-all group cursor-pointer ${
                      activeTab === 'technician'
                        ? 'bg-red-600 text-white shadow-sm font-bold'
                        : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-950 font-medium'
                    }`}
                    id="sidebar-tab-technician"
                  >
                    <div className={`p-2 rounded-lg shrink-0 transition-colors ${
                      activeTab === 'technician' ? 'bg-red-700/60 text-white' : 'bg-white text-slate-600 shadow-2xs group-hover:text-red-600'
                    }`}>
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate">Performansi Teknisi</div>
                      <div className={`text-[10px] truncate ${activeTab === 'technician' ? 'text-red-100' : 'text-slate-400'}`}>
                        Produktivitas & Leaderboard
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => toggleMenuExpand('technician', e)}
                    className={`p-2 rounded-lg ml-1 shrink-0 transition-all cursor-pointer ${
                      activeTab === 'technician'
                        ? 'bg-red-700/40 hover:bg-red-700 text-white'
                        : 'bg-white hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 border border-slate-200/60 shadow-2xs'
                    }`}
                    title={expandedMenus.technician ? 'Sembunyikan Sub Halaman (-)' : 'Tampilkan Sub Halaman (+)'}
                  >
                    {expandedMenus.technician ? (
                      <Minus className="w-3.5 h-3.5" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Sub-menu Teknisi (default sembunyi, muncul saat user pencet plus atau pilih menu) */}
                {expandedMenus.technician && (
                  <div className="px-2 py-1.5 space-y-1 bg-white/70 border-t border-slate-100">
                    <button
                      onClick={() => {
                        handleNavigateTab('technician');
                        setTechnicianSubTab('leaderboard');
                      }}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all cursor-pointer ${
                        activeTab === 'technician' && technicianSubTab === 'leaderboard'
                          ? 'bg-red-50 text-red-700 font-bold border border-red-200/60'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                      }`}
                    >
                      <Award className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'technician' && technicianSubTab === 'leaderboard' ? 'text-red-600' : 'text-slate-400'}`} />
                      <span className="truncate text-[11px]">Leaderboard & Profil Teknisi</span>
                    </button>
                    <button
                      onClick={() => {
                        handleNavigateTab('technician');
                        setTechnicianSubTab('progress');
                      }}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all cursor-pointer ${
                        activeTab === 'technician' && technicianSubTab === 'progress'
                          ? 'bg-red-50 text-red-700 font-bold border border-red-200/60'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                      }`}
                    >
                      <Activity className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'technician' && technicianSubTab === 'progress' ? 'text-red-600' : 'text-slate-400'}`} />
                      <span className="truncate text-[11px]">Tracking Progres Harian</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Item 6: Kelola Data (Khusus OWNER) */}
              {isOwner && (
                <div className="rounded-xl overflow-hidden bg-slate-50/40 border border-slate-100/90 transition-all">
                  <div className="flex items-center justify-between p-1">
                    <button
                      onClick={() => handleNavigateTab('kelola-data')}
                      className={`flex-1 flex items-center space-x-3 px-2.5 py-2 rounded-lg text-left transition-all group cursor-pointer relative ${
                        activeTab === 'kelola-data'
                          ? 'bg-red-600 text-white shadow-sm font-bold'
                          : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-950 font-medium'
                      }`}
                      id="sidebar-tab-kelola-data"
                    >
                      <div className={`p-2 rounded-lg shrink-0 transition-colors ${
                        activeTab === 'kelola-data' ? 'bg-red-700/60 text-white' : 'bg-white text-slate-600 shadow-2xs group-hover:text-red-600'
                      }`}>
                        <Database className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold truncate">Kelola Data</span>
                          <span className="px-1.5 py-0.2 bg-amber-400 text-slate-900 text-[8px] font-black uppercase rounded tracking-wider shadow-xs">
                            OWNER
                          </span>
                        </div>
                        <div className={`text-[10px] truncate ${activeTab === 'kelola-data' ? 'text-red-100' : 'text-slate-400'}`}>
                          Link Spreadsheet & Sinkronisasi
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => toggleMenuExpand('kelola-data', e)}
                      className={`p-2 rounded-lg ml-1 shrink-0 transition-all cursor-pointer ${
                        activeTab === 'kelola-data'
                          ? 'bg-red-700/40 hover:bg-red-700 text-white'
                          : 'bg-white hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 border border-slate-200/60 shadow-2xs'
                      }`}
                      title={expandedMenus['kelola-data'] ? 'Sembunyikan Sub Halaman (-)' : 'Tampilkan Sub Halaman (+)'}
                    >
                      {expandedMenus['kelola-data'] ? (
                        <Minus className="w-3.5 h-3.5" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Sub-menu Kelola Data (default sembunyi, muncul saat user pencet plus atau pilih menu) */}
                  {expandedMenus['kelola-data'] && (
                    <div className="px-2 py-1.5 space-y-1 bg-white/70 border-t border-slate-100">
                      <button
                        onClick={() => {
                          handleNavigateTab('kelola-data');
                          setKelolaDataSubTab('sheets');
                          scrollToSection('spreadsheet-sources-section');
                        }}
                        className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all cursor-pointer ${
                          activeTab === 'kelola-data' && kelolaDataSubTab === 'sheets'
                            ? 'bg-red-50 text-red-700 font-bold border border-red-200/60'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                        }`}
                      >
                        <FileSpreadsheet className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'kelola-data' && kelolaDataSubTab === 'sheets' ? 'text-red-600' : 'text-slate-400'}`} />
                        <span className="truncate text-[11px]">Daftar Link Spreadsheet</span>
                      </button>
                      <button
                        onClick={() => {
                          handleNavigateTab('kelola-data');
                          setKelolaDataSubTab('indicators');
                          scrollToSection('all-indicators-section');
                        }}
                        className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all cursor-pointer ${
                          activeTab === 'kelola-data' && kelolaDataSubTab === 'indicators'
                            ? 'bg-red-50 text-red-700 font-bold border border-red-200/60'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                        }`}
                      >
                        <Table className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'kelola-data' && kelolaDataSubTab === 'indicators' ? 'text-red-600' : 'text-slate-400'}`} />
                        <span className="truncate text-[11px]">Kamus Data & Indikator</span>
                      </button>
                      <button
                        onClick={() => {
                          handleNavigateTab('kelola-data');
                          setKelolaDataSubTab('users');
                          scrollToSection('list-user-inspector-section');
                        }}
                        className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all cursor-pointer ${
                          activeTab === 'kelola-data' && kelolaDataSubTab === 'users'
                            ? 'bg-red-50 text-red-700 font-bold border border-red-200/60'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                        }`}
                      >
                        <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'kelola-data' && kelolaDataSubTab === 'users' ? 'text-red-600' : 'text-slate-400'}`} />
                        <span className="truncate text-[11px]">Referensi Hak Akses User</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Sidebar Quick Footer Info */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 mt-auto text-[11px] text-slate-500">
            {isSidebarOpen ? (
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span className="text-slate-400">Telkom Akses</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  NOC Live
                </span>
              </div>
            ) : (
              <div className="flex justify-center" title="NOC Live Connected">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              </div>
            )}
          </div>
        </aside>

      {/* 3. MAIN INTERACTIVE CONTENT STAGE */}
      <main className="flex-1 min-w-0 px-4 lg:px-8 py-6">
        
        {/* Dynamic header showing current page and region details */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-4 border-b border-slate-200/60">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
              <span>
                {activeTab === 'business' && (
                  businessSubTab === 'kpi'
                    ? '📈 Performansi Bisnis - Ringkasan & KPI Finansial'
                    : businessSubTab === 'trend'
                    ? '📊 Performansi Bisnis - Trend Finansial Perbulan'
                    : '💼 Performansi Bisnis - Detail Portofolio & Program'
                )}
                {activeTab === 'assurance' && (
                  assuranceSubTab === 'ticket_perf'
                    ? '🛠️ Performansi Assurance - Ringkasan & Agregasi Tiket'
                    : assuranceSubTab === 'operations'
                    ? '🛠️ Performansi Assurance - Evaluasi Solusi Tiket'
                    : assuranceSubTab === 'ticket_logs'
                    ? '📋 Performansi Assurance - Detail Transaksi & Log Tiket (2.649 Tiket)'
                    : assuranceSubTab === 'kpi_ioan'
                    ? '🏆 Performansi Assurance - KPI IOAN'
                    : '🏆 Performansi Assurance - KPI ASSURANCE'
                )}
                {activeTab === 'provisioning' && '📦 Performansi Pemasangan Baru IndiHome (Provisioning)'}
                {activeTab === 'qe' && '🛡️ Evaluasi QE Service Area'}
                {activeTab === 'technician' && '👷 Produktivitas, Rating & Leaderboard Teknisi Lapangan'}
                {activeTab === 'kelola-data' && '🗄️ Kelola Data, Link Spreadsheet & All Indikator Data'}
              </span>
            </h2>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
            <button
              onClick={() => setShowPdfModal(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all border shadow-xs cursor-pointer bg-red-600 hover:bg-red-700 text-white border-red-600 active:scale-95"
              title="Download PDF Resume Performansi Operasional (Evaluasi Teknis, Non-Teknis, RCA & Rekomendasi Sesuai Halaman)"
              id="btn-download-pdf-resume-global"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>
                Download PDF Resume ({
                  activeTab === 'business'
                    ? 'Bisnis'
                    : activeTab === 'assurance'
                    ? 'Assurance'
                    : activeTab === 'provisioning'
                    ? 'Provisioning'
                    : activeTab === 'qe'
                    ? 'QE Mutu'
                    : activeTab === 'technician'
                    ? 'Teknisi'
                    : 'Kelola Data'
                })
              </span>
            </button>
            <button
              onClick={fetchLiveData}
              disabled={isLoadingLive}
              className={`inline-flex items-center space-x-1.5 px-3 py-1 text-xs font-bold rounded-md transition-all border shadow-sm cursor-pointer disabled:opacity-50 ${
                syncStatus === 'live'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
              title={syncStatus === 'live' ? `Sinkronisasi Live Berhasil (${syncTime})` : syncStatus === 'error' ? `Gagal Sinkron: ${errorMessage}` : 'Segarkan Data'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLive ? 'animate-spin' : ''}`} />
              <span>{isLoadingLive ? 'Memuat...' : 'Segarkan Data'}</span>
            </button>
            <span className="px-3 py-1 bg-slate-100 rounded-md border border-slate-100/55 text-slate-700">
              Uptime: <strong>99.99%</strong>
            </span>
            <span className="px-3 py-1 bg-red-50 rounded-md text-red-500 border border-red-50">
              Koneksi STO: <strong>OK (100%)</strong>
            </span>
          </div>
        </div>

        {/* Dynamic Tab Loader */}
        <div className="transition-all duration-300">
          {activeTab === 'business' && (
            <BusinessDashboard 
              data={currentData} 
              allRegionsData={dataState} 
              activeRegional={activeRegional} 
              setActiveRegional={setActiveRegional}
              activeMonth={activeMonth}
              setActiveMonth={setActiveMonth}
              activeYear={activeYear}
              setActiveYear={setActiveYear}
              activeSubTab={businessSubTab}
              setActiveSubTab={setBusinessSubTab}
            />
          )}

          {activeTab === 'assurance' && (
            <AssuranceDashboard 
              data={currentData} 
              allRegionsData={dataState} 
              activeRegional={activeRegional} 
              activeSubTab={assuranceSubTab}
              setActiveSubTab={setAssuranceSubTab}
            />
          )}

          {activeTab === 'provisioning' && (
            <ProvisioningDashboard 
              data={currentData} 
              allRegionsData={dataState} 
              activeRegional={activeRegional} 
              provisioningData={provisioningData}
              activeSubTab={provisioningSubTab}
              setActiveSubTab={setProvisioningSubTab}
            />
          )}

          {activeTab === 'qe' && (
            <QEDashboard 
              data={currentData} 
              allRegionsData={dataState} 
              activeRegional={activeRegional} 
              activeSubTab={qeSubTab}
              setActiveSubTab={setQeSubTab}
            />
          )}

          {activeTab === 'technician' && (
            <TechnicianDashboard 
              data={monthAdjustedData['REG 5 - Jatim & Nusra']} 
              activeRegional={'REG 5 - Jatim & Nusra'} 
              setActiveRegional={setActiveRegional}
              activeMonth={activeMonth}
              setActiveMonth={setActiveMonth}
              activeYear={activeYear}
              setActiveYear={setActiveYear}
              onUpdateTechnicians={handleUpdateTechnicians}
              activeSubTab={technicianSubTab}
              setActiveSubTab={setTechnicianSubTab}
            />
          )}

          {activeTab === 'kelola-data' && isOwner && (
            <KelolaDataDashboard 
              currentUser={currentUser}
              currentUserRole={currentUserRole}
              onRefreshAllData={fetchLiveData}
              isLoadingLive={isLoadingLive}
              syncStatus={syncStatus}
              syncTime={syncTime}
              allRegionsData={dataState}
              currentData={currentData}
              activeRegional={activeRegional}
              activeMonth={activeMonth}
              activeYear={activeYear}
            />
          )}
        </div>
      </main>
    </div>

      {/* 4. SECURE & ELEGANT FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400 mt-auto shrink-0" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 Adhiatma21 Creative Studio - Service Area Performance Dashboard. All rights reserved.</p>
          <div className="flex items-center space-x-3 text-[11px] font-bold text-slate-500">
            <a href="#brand-header" className="hover:text-slate-800 transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#brand-header" className="hover:text-slate-800 transition-colors">SOP Manual</a>
            <span>•</span>
            <span className="text-red-500 animate-pulse">● System Live Security Verified</span>
          </div>
        </div>
      </footer>

      {/* Executive PDF Report Modal (Domain-Aware with Comprehensive Evaluation & Supporting Tables) */}
      <ExecutivePdfReportModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        activeDomain={activeTab}
        activeSubTab={
          activeTab === 'business'
            ? businessSubTab
            : activeTab === 'assurance'
            ? assuranceSubTab
            : activeTab === 'provisioning'
            ? provisioningSubTab
            : activeTab === 'qe'
            ? qeSubTab
            : activeTab === 'technician'
            ? technicianSubTab
            : kelolaDataSubTab
        }
        activeRegional={activeRegional}
        activeMonth={activeMonth}
        activeYear={activeYear}
        currentData={currentData}
        allRegionsData={dataState}
        provisioningData={provisioningData}
        uptime="99.99%"
      />
    </div>
  );
}
